// arena/evals/web.py: /evals (the report the evals service last built) and /evals/games/<id>.
import { e, fixed, localTime, pyStr } from "../py.js";
import { layout, table, HTTPError, pyJsonIndent } from "./pages.js";

const COLOURS = { acc: "#2f7fd6", auc: "#1a9b5c", leader_acc: "#9097a1" };
const SHOW = [50, 100, 200, 300, 400, 490];
const PHASES = [["early", 10, 150], ["mid", 160, 350], ["late", 360, 490]];
const CSS = `
.ev-chart { width: 100%; max-width: 760px; height: auto; }
.ev-chart text { font-size: 11px; fill: var(--muted); }
.ev-chart .grid { stroke: var(--line); stroke-width: 1; }
.ev-key span { display: inline-block; margin-right: 14px; font-size: 12px; }
.ev-key i { display: inline-block; width: 14px; height: 3px; vertical-align: middle; margin-right: 4px; }
.ev-cal { display: flex; flex-wrap: wrap; gap: 18px; }
.ev-cal figure { margin: 0; } .ev-cal figcaption { font-size: 12px; color: var(--muted); text-align: center; }
.tabs a { margin-right: 10px; } .tabs a.on { font-weight: 700; text-decoration: none; color: var(--fg); }
td.heat { font-variant-numeric: tabular-nums; }
`;
const pct = (x, d = 0) => (x == null ? "-" : `${fixed(x * 100, d)}%`);
const num = (x, d = 3) => (x == null ? "-" : fixed(x, d));

function lineChart(rows, keys, lo = 0.4, hi = 1.0, w = 760, h = 240) {
  const pl = 38, pr = 10, pt = 10, pb = 24;
  const x = (r) => pl + (r - 10) / 480 * (w - pl - pr);
  const y = (v) => pt + (hi - v) / (hi - lo) * (h - pt - pb);
  const out = [`<svg class="ev-chart" viewBox="0 0 ${w} ${h}">`];
  const n = Math.round((hi - lo) / 0.1);
  for (let i = 0; i <= n; i++) {
    const v = Number(fixed(lo + i * 0.1, 1));
    out.push(`<line class="grid" x1="${pl}" x2="${w - pr}" y1="${fixed(y(v), 1)}" y2="${fixed(y(v), 1)}"/>`
      + `<text x="${pl - 6}" y="${fixed(y(v) + 4, 1)}" text-anchor="end">${fixed(v * 100, 0)}%</text>`);
  }
  for (const r of [10, 100, 200, 300, 400, 490]) out.push(`<text x="${fixed(x(r), 1)}" y="${h - 6}" text-anchor="middle">r${r}</text>`);
  for (const k of keys) {
    const pts = rows.filter((row) => row[k] != null).map((row) => [x(row.round), y(Math.min(hi, Math.max(lo, row[k])))]);
    if (pts.length > 1) {
      const d = pts.map(([a, b]) => `${fixed(a, 1)},${fixed(b, 1)}`).join(" ");
      const dash = k === "leader_acc" ? ' stroke-dasharray="5 4"' : "";
      out.push(`<polyline fill="none" stroke="${COLOURS[k]}" stroke-width="2"${dash} points="${d}"/>`);
    }
  }
  out.push("</svg>");
  return out.join("");
}

function calibrationChart(bins, title, s = 200) {
  const p = 24;
  const x = (v) => p + v * (s - 2 * p), y = (v) => s - p - v * (s - 2 * p);
  const nMax = Math.max(...bins.map((b) => b.n), 1);
  const g = (v) => (Number.isInteger(v) ? v.toFixed(1) : String(v));
  const out = [`<figure><svg class="ev-chart" style="width:${s}px" viewBox="0 0 ${s} ${s}">`,
    `<rect x="${p}" y="${p}" width="${s - 2 * p}" height="${s - 2 * p}" fill="none" class="grid" stroke="currentColor" stroke-opacity=".2"/>`,
    `<line x1="${x(0)}" y1="${y(0)}" x2="${x(1)}" y2="${y(1)}" stroke="#9097a1" stroke-dasharray="4 4"/>`,
    `<text x="${g(s / 2)}" y="${s - 4}" text-anchor="middle">eval says</text>`,
    `<text x="10" y="${g(s / 2)}" text-anchor="middle" transform="rotate(-90 10 ${g(s / 2)})">A won</text>`];
  const pts = bins.filter((b) => b.n);
  if (pts.length > 1) out.push('<polyline fill="none" stroke="#2f7fd6" stroke-width="1.5" points="' + pts.map((b) => `${fixed(x(b.pred), 1)},${fixed(y(b.obs), 1)}`).join(" ") + '"/>');
  for (const b of pts) {
    const rad = 2 + 5 * (b.n / nMax) ** 0.5;
    out.push(`<circle cx="${fixed(x(b.pred), 1)}" cy="${fixed(y(b.obs), 1)}" r="${fixed(rad, 1)}" fill="#2f7fd6">`
      + `<title>eval ${fixed(b.lo * 100, 0)}%-${fixed(b.hi * 100, 0)}%: said ${fixed(b.pred * 100, 0)}%, A won ${fixed(b.obs * 100, 0)}% of ${b.n}</title></circle>`);
  }
  out.push(`</svg><figcaption>${e(title)}</figcaption></figure>`);
  return out.join("");
}

function heat(v, better = "higher") {
  if (v == null) return '<td class="heat n muted">-</td>';
  const s = Math.min(1.0, Math.abs(v - 0.5) * 3);
  const good = better !== "lower" ? v > 0.5 : v < 0.5;
  const rgb = good || better === "none" ? "26,155,92" : "198,40,40";
  return `<td class="heat n" style="background: rgba(${rgb},${fixed(s * 0.45, 2)})">${fixed(v, 2)}</td>`;
}

export async function evalsPage(D, p) {
  let w = p.get("w") || "1d";
  const rep = await D.kv("evals_report"), st = (await D.kv("evals_status")) || {};
  const status = Object.keys(st).length ? `<p class="muted">collector: last poll ${localTime(st.last_poll)}, every `
    + `${Math.floor(Math.trunc(st.poll_seconds || 0) / 60)} min over the top ${e(st.top_teams)} teams · `
    + `${e(st.games)} games stored, ${e(st.pending)} computing, `
    + `${e(st.stale)} to recompute · replays ${e(st.replays_gb ?? 0)} GB`
    + (st.last_error ? ` · <b class="L">${e(st.last_error)}</b>` : "") + "</p>"
    : '<p class="muted">The evals service hasn\'t reported yet.</p>';
  const intro = '<h1>Evals</h1><p>Our in-game metrics checked against real games between <i>other</i> '
    + 'teams on the competition server, downloaded continuously by the <code>evals</code> '
    + 'service. "Eval" is our P(seat A wins) at each round (<a href="/docs/metrics">metrics</a>, <a href="/docs/evals">how this works</a>).</p>';
  if (!rep) return layout("Evals", `<style>${CSS}</style>${intro}${status}`, "/api/v1/evals", "/evals");
  if (!(w in rep.windows)) w = "1d" in rep.windows ? "1d" : "all";
  const W = rep.windows[w];
  const tabs = '<p class="tabs">' + Object.keys(rep.windows).map((k) => `<a class="${k === w ? "on" : ""}" href="/evals?w=${k}">${k}</a>`).join("") + "</p>";
  const summary = `<p>${e(W.games)} games (${e(W.decided)} decided, ${e(W.eval_games)} judged out of sample: finished after the current eval `
    + `v${e(rep.versions.eval)} was fitted${rep.eval_fitted ? " on " + localTime(rep.eval_fitted) : ""}) from ${e(W.battles)} battles between ${e(W.teams)} teams, `
    + `${localTime(W.from)} to ${localTime(W.to)}. Report built ${localTime(rep.built)}.</p>`;
  const rows = W.eval;
  const key = '<p class="ev-key"><span><i style="background:#2f7fd6"></i>accuracy (eval &gt; 50% picks the winner)</span>'
    + '<span><i style="background:#1a9b5c"></i>AUC</span>'
    + '<span><i style="background:#9097a1"></i>baseline: whoever leads under the round-500 rule now</span></p>';
  const chart = lineChart(rows, ["leader_acc", "acc", "auc"]);
  const byRound = Object.fromEntries(rows.map((x) => [x.round, x]));
  const trows = SHOW.map((rr) => {
    const x = byRound[rr] || {};
    return [`r${rr}`, e(x.n ?? 0), pct(x.acc), num(x.auc, 2), num(x.logloss), num(x.brier), pct(x.leader_acc), pct(x.a_wins)];
  });
  const evalTbl = table(["round", "games", "accuracy", "AUC", "log loss", "Brier", "leader baseline", "seat A won"], trows, new Set([1, 2, 3, 4, 5, 6, 7]));
  const cal = '<div class="ev-cal">' + PHASES.map(([name, lo, hi]) => calibrationChart(W.calibration[name], `${name} (r${lo}-r${hi})`)).join("") + "</div>";
  const cols = [...SHOW.map(String), "end"];
  const mrows = W.metrics.map((m) => `<tr><td>${e(m.title)} <span class="muted">${e(m.name)}</span></td><td class="n">${m.n}</td>`
    + cols.map((c) => heat(m.auc[c], m.better)).join("") + "</tr>").join("");
  const mtable = '<div class="wrap"><table><thead><tr><th>metric</th><th class="n">games</th>'
    + cols.map((c) => `<th class="n">${c !== "end" ? "r" + c : "end"}</th>`).join("") + `</tr></thead><tbody>${mrows}</tbody></table></div>`;
  const endings = table(["how it ended", "games", "share"], Object.entries(W.endings).map(([k, v]) => [e(k), e(v), pct(v / Math.max(1, W.games))]), new Set([1, 2]));
  const queen = table(["round", "queens alive", "only my queen alive", "…and I won"],
    W.queen.map((x) => [`r${x.round}`, pct(x.alive), e(x.only_mine), pct(x.only_mine_wins)]), new Set([1, 2, 3]));
  const elo = table(["weaker team's Elo", "games", "accuracy r100", "r300", "r490"],
    W.elo.map((x) => [e(x.bracket), e(x.games), ...["100", "300", "490"].map((k) => pct(x.acc[k]))]), new Set([1, 2, 3, 4]));
  const recentRows = (rep.recent || []).map((g) => {
    const names = Object.fromEntries(Object.entries(g.seats || {}).map(([k, v]) => [k, (v || {}).name]));
    const wname = names[g.winner] || g.winner || "draw";
    const ev = g.eval || {};
    return [localTime(g.at), `${e(names.A || "?")} <span class="muted">vs</span> ${e(names.B || "?")}`, e(g.map), e(wname), e(g.ending), e(g.rounds),
      ...["100", "300", "490"].map((k) => pct(ev[k])), `<a href="/evals/games/${g.id}">watch</a>`];
  });
  const recent = table(["finished", "A vs B", "map", "winner", "how", "rounds", "eval r100", "r300", "r490", ""], recentRows, new Set([5, 6, 7, 8]));
  const driftRows = Object.entries(rep.windows).map(([k, X]) => {
    const er = Object.fromEntries(X.eval.map((x) => [x.round, x]));
    return [`<a href="/evals?w=${k}">${e(k)}</a>`, e(X.eval_games), ...[100, 200, 300, 400, 490].map((rr) => pct((er[rr] || {}).acc)),
      num((er[100] || {}).auc, 2), num((er[300] || {}).auc, 2)];
  });
  const drift = table(["window", "games", "acc r100", "r200", "r300", "r400", "r490", "AUC r100", "AUC r300"], driftRows, new Set([1, 2, 3, 4, 5, 6, 7, 8]));
  const body = `<style>${CSS}</style>${intro}${status}`
    + `<h2>Across windows <span class="sub">the eval on the most recent games: `
    + `a drop in the short windows means the top teams changed how they play</span></h2>${drift}`
    + `<h2>Window ${e(w)}</h2>${tabs}${summary}`
    + `<h2>Does the eval pick the winner?</h2>${key}${chart}${evalTbl}`
    + `<h2>Calibration <span class="sub">when the eval says x%, does A win x% of the time? `
    + `(dot size: games)</span></h2>${cal}`
    + `<h2>Each metric <span class="sub">AUC of (A − B) for "A wins": 0.5 is a coin flip; `
    + `green helps predict in the expected direction</span></h2>${mtable}`
    + `<div class="grid2"><div><h2>How games end</h2>${endings}</div>`
    + `<div><h2>Queens</h2>${queen}</div></div>`
    + `<h2>By strength</h2>${elo}<h2>Latest games</h2>${recent}`;
  return layout("Evals", body, ["/api/v1/evals", "/api/v1/evals/status"], "/evals");
}

const teamsOf = (g) => {
  const seats = g.seats || {};
  if (Object.keys(seats).length) return Object.fromEntries(Object.entries(seats).map(([k, v]) => [k, (v || {}).name || k]));
  const t = g.teams || {};
  return { A: (t.a || {}).name || "A", B: (t.b || {}).name || "B" };
};

// The snapshot keeps no evals replays: the page the arena showed once a replay was pruned.
export async function evalsGamePage(D, gid) {
  const g = await D.evalsGame(gid);
  if (!g) throw new HTTPError(404, `no evals game ${gid}`);
  const names = teamsOf(g);
  const body = `<h1>Server game ${gid}</h1><p>${e(names.A)} vs ${e(names.B)} on ${e(g.map)}; `
    + `the replay is no longer kept.</p><pre>${e(pyJsonIndent(g, 1))}</pre>`;
  return layout(`Server game ${gid}`, body, `/api/v1/evals/games/${gid}`, "/evals");
}
export { pyStr };
