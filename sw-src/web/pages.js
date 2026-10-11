// arena/web/pages.py, as the service worker's backend: the same HTML, from the snapshot's data.
import { e, s, q, urlencode, fixed, pf, pyStr, when, localTime, TZ_HOURS, TZ_LABEL } from "../py.js";
import * as viewer from "./viewer.js";

export const NAV = [["/", "Leaderboard"], ["/lineage", "Lineage"], ["/ideas", "Ideas"], ["/games", "Games"], ["/maps", "Maps"],
  ["/queue", "Queue"], ["/duels", "Duels"], ["/server", "Server"], ["/compare", "Compare"], ["/evals", "Evals"], ["/submit", "Submit"], ["/docs", "Docs"]];

export const SRC_CSS = `
.src { display: inline-block; padding: 0 5px; border-radius: 3px; font-size: 10px; font-weight: 700;
  letter-spacing: .04em; line-height: 16px; vertical-align: 1px; }
.src.comp { background: #d18616; color: #111; } .src.arena { background: #2f6fd6; color: #fff; }
`;

export const CSS = `
:root {
  --bg: #ffffff; --fg: #1d1f23; --muted: #6a6f78; --line: #e3e5e8; --soft: #f5f6f8;
  --accent: #2160c4; --win: #1a7f37; --loss: #c62828; --draw: #8a6d00; --chip: #eef1f5;
  --nav: #16181c; --navfg: #e8eaed;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #15171a; --fg: #e3e5e8; --muted: #9097a1; --line: #2b2f35; --soft: #1c1f23;
    --accent: #6ea2ff; --win: #4cc26a; --loss: #ff6b6b; --draw: #e0b84a; --chip: #252a31;
    --nav: #0d0e10; --navfg: #e8eaed;
    color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --bg: #15171a; --fg: #e3e5e8; --muted: #9097a1; --line: #2b2f35; --soft: #1c1f23;
  --accent: #6ea2ff; --win: #4cc26a; --loss: #ff6b6b; --draw: #e0b84a; --chip: #252a31;
  --nav: #0d0e10; --navfg: #e8eaed;
  color-scheme: dark;
}
* { box-sizing: border-box; }
html, body { margin: 0; background: var(--bg); color: var(--fg);
  font: 14px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif; }
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
nav.top { background: var(--nav); color: var(--navfg); display: flex; flex-wrap: wrap;
  align-items: center; gap: 2px 4px; padding: 6px 16px; }
nav.top .brand { font-weight: 700; margin-right: 14px; color: var(--navfg); }
nav.top a.l { color: #b9bec6; padding: 4px 8px; border-radius: 4px; }
nav.top a.l.on, nav.top a.l:hover { color: #fff; background: #ffffff1a; text-decoration: none; }
main { max-width: 1280px; margin: 0 auto; padding: 16px; }
h1 { font-size: 20px; margin: 4px 0 12px; }
h2 { font-size: 15px; margin: 22px 0 8px; padding-bottom: 4px; border-bottom: 1px solid var(--line); }
.sub { color: var(--muted); font-size: 13px; }
.muted { color: var(--muted); }
.wrap { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; font-size: 13px; }
th, td { padding: 4px 8px; border-bottom: 1px solid var(--line); text-align: left;
  vertical-align: top; white-space: nowrap; }
th { color: var(--muted); font-weight: 600; background: var(--soft); position: sticky; top: 0; }
td.n, th.n { text-align: right; font-variant-numeric: tabular-nums; }
td.note { white-space: normal; min-width: 220px; max-width: 520px; color: var(--muted); }
tr:hover td { background: var(--soft); }
pre { white-space: pre-wrap; word-break: break-word; background: var(--soft);
  border: 1px solid var(--line); border-radius: 6px; padding: 8px 10px; margin: 6px 0;
  font: 12.5px/1.45 ui-monospace, "SF Mono", Menlo, monospace; }
pre.log { max-height: 360px; overflow: auto; }
.src { display: inline-block; padding: 0 5px; border-radius: 3px; font-size: 10px; font-weight: 700;
  letter-spacing: .04em; line-height: 16px; vertical-align: 1px; }
.src.comp { background: #d18616; color: #111; } .src.arena { background: #2f6fd6; color: #fff; }
.tabs { display: flex; gap: 4px; margin: 4px 0 10px; border-bottom: 1px solid var(--line); }
.tabs a { padding: 6px 12px; border: 1px solid transparent; border-bottom: none;
  border-radius: 6px 6px 0 0; color: var(--muted); }
.tabs a.on { color: var(--fg); border-color: var(--line); background: var(--soft); font-weight: 600; }
.tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; margin: 8px 0; }
.tile { border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; background: var(--soft); }
.tile .k { color: var(--muted); font-size: 12px; } .tile .v { font-size: 20px; font-weight: 650; margin: 2px 0; }
.tile .d { color: var(--muted); font-size: 12px; }
.gmaps a { display: inline-block; margin: 1px 2px 1px 0; padding: 0 5px; border-radius: 4px;
  font-size: 12px; background: var(--chip); color: var(--fg); }
.gmaps a.W { background: color-mix(in srgb, var(--win) 22%, transparent); }
.gmaps a.L { background: color-mix(in srgb, var(--loss) 22%, transparent); }
.check-ok { color: var(--win); } .check-no { color: var(--loss); }
.chip { display: inline-block; padding: 0 6px; border-radius: 9px; background: var(--chip);
  font-size: 12px; line-height: 18px; white-space: nowrap; }
.W, .win { color: var(--win); } .L, .loss { color: var(--loss); } .D, .draw { color: var(--draw); }
.chip.win { background: color-mix(in srgb, var(--win) 15%, transparent); }
.chip.loss { background: color-mix(in srgb, var(--loss) 15%, transparent); }
.chip.draw { background: color-mix(in srgb, var(--draw) 15%, transparent); }
.chip.warn { background: color-mix(in srgb, var(--draw) 20%, transparent); color: var(--draw); }
.kv { display: grid; grid-template-columns: max-content 1fr; gap: 3px 14px; font-size: 13px; }
.kv > div:nth-child(odd) { color: var(--muted); }
.cards { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 4px; }
.card { border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px; min-width: 210px;
  max-width: 260px; background: var(--soft); font-size: 13px; }
.card .t { font-weight: 600; }
.card .note { color: var(--muted); font-size: 12px; margin-top: 4px; max-height: 3.2em;
  overflow: hidden; }
.idea { border: 1px solid var(--line); border-radius: 8px; padding: 8px 12px; margin: 8px 0; }
.idea .head { display: flex; flex-wrap: wrap; gap: 6px 12px; align-items: baseline; }
form.filters { display: flex; flex-wrap: wrap; gap: 6px 10px; align-items: end; margin: 6px 0 12px; }
form.filters label { display: flex; flex-direction: column; font-size: 12px; color: var(--muted); }
input, select, textarea, button { font: inherit; color: var(--fg); background: var(--bg);
  border: 1px solid var(--line); border-radius: 5px; padding: 4px 7px; }
button { background: var(--accent); color: #fff; border-color: var(--accent); cursor: pointer;
  padding: 5px 12px; }
button:disabled { opacity: .5; cursor: default; }
button.small { padding: 1px 8px; font-size: 12px; vertical-align: 2px; }
.chain { white-space: normal; line-height: 1.9; }
ul.ltree { list-style: none; margin: 0; padding-left: 26px; border-left: 2px solid var(--line); }
ul.ltree.root { padding-left: 0; border-left: none; }
ul.ltree li { margin: 6px 0; }
.lrow { padding: 6px 10px; border: 1px solid var(--line); border-radius: 8px; background: var(--soft); }
.lrow .line { font-weight: 650; font-size: 14px; }
.vchips { margin-top: 5px; display: flex; flex-wrap: wrap; gap: 3px; align-items: center; }
.vchip { display: inline-block; min-width: 22px; text-align: center; padding: 0 6px; border-radius: 4px;
  font-size: 12px; line-height: 20px; background: var(--chip); color: var(--fg); border: 1px solid transparent; }
.vchip.W { background: color-mix(in srgb, var(--win) 30%, transparent); }
.vchip.L { background: color-mix(in srgb, var(--loss) 30%, transparent); }
.vchip.D { background: color-mix(in srgb, var(--draw) 30%, transparent); }
.vchip.noise { opacity: .55; }
.vchip.cur { border-color: var(--accent); font-weight: 700; }
.vchip.rej { text-decoration: line-through; opacity: .5; }
.edge { font-size: 11px; padding: 0 4px; border-radius: 3px; margin: 0 4px 0 2px; white-space: nowrap; }
.edge.win { background: color-mix(in srgb, var(--win) 15%, transparent); color: var(--win); }
.edge.loss { background: color-mix(in srgb, var(--loss) 15%, transparent); color: var(--loss); }
.edge.draw { background: color-mix(in srgb, var(--draw) 15%, transparent); color: var(--draw); }
details.more { display: inline; } details.more summary { display: inline; cursor: pointer; color: var(--muted); }
.graphwrap { overflow: auto; border: 1px solid var(--line); border-radius: 8px; max-height: 78vh; background: var(--soft); }
.lgraph .gn rect { fill: var(--bg); stroke: var(--line); }
.lgraph .gn.rank rect { stroke: var(--fg); stroke-width: 1.5; }
.lgraph .gn.cur rect { stroke: var(--accent); stroke-width: 2.5; }
.lgraph text { font: 12px system-ui, sans-serif; fill: var(--fg); }
.lgraph a:hover rect { fill: var(--chip); }
ul.tree { list-style: none; margin: 0; padding-left: 22px; border-left: 1px dashed var(--line); }
ul.tree.root { padding-left: 0; border-left: none; }
ul.tree li { margin: 3px 0; }
ul.tree summary { cursor: pointer; list-style-position: outside; }
.node .tnote { color: var(--muted); font-size: 12px; margin: 1px 0 0 2px; white-space: normal; }
.node.hl { background: color-mix(in srgb, var(--accent) 18%, transparent); border-radius: 4px; padding: 1px 4px; }
form.stack { display: grid; grid-template-columns: max-content minmax(0, 560px); gap: 8px 12px;
  align-items: center; }
form.stack label { color: var(--muted); }
form.stack textarea { min-height: 140px; }
.bar { display: block; height: 100%; background: var(--win); }
.bartrack { display: inline-block; width: 70px; height: 8px; border-radius: 4px;
  background: color-mix(in srgb, var(--loss) 55%, transparent); vertical-align: middle;
  overflow: hidden; }
.grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 0 24px; }
.flash { padding: 8px 12px; border-radius: 6px; margin: 8px 0; background: var(--soft);
  border: 1px solid var(--line); }
.flash.err { border-color: var(--loss); color: var(--loss); }
footer { max-width: 1280px; margin: 24px auto 16px; padding: 8px 16px 0;
  border-top: 1px solid var(--line); color: var(--muted); font-size: 12px; }
@media (max-width: 640px) {
  main { padding: 12px 16px; }
  form.stack { grid-template-columns: 1fr; }
  td.note { min-width: 160px; }
}
`;

export class HTTPError extends Error {
  constructor(status, detail) { super(detail); this.status = status; this.detail = detail; }
}

export function layout(title, body, jsonUrl = null, active = "") {
  const links = NAV.map(([href, label]) => `<a class="l${href === active ? " on" : ""}" href="${href}">${label}</a>`).join("");
  const urls = typeof jsonUrl === "string" ? [jsonUrl] : (jsonUrl || []);
  const foot = urls.map((u) => `<a href="${e(u)}">${e(u)}</a>`).join(" · ");
  return { html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(title)} · tokenz-arena</title>
<style>${CSS}</style>
</head>
<body>
<nav class="top"><a class="brand" href="/">tokenz-arena</a>${links}</nav>
<main>
${body}
</main>
<footer>Times are ${TZ_LABEL} (UTC${TZ_HOURS >= 0 ? "+" : ""}${TZ_HOURS}). ${foot ? "JSON: " + foot + " · " : ""}<a href="/llms.txt">/llms.txt</a> ·
<a href="/api/docs">API docs</a></footer>
</body>
</html>` };
}

// ---------------------------------------------------------------- small pieces
export function sideLabel(sid, names = {}) {
  if (!sid) return "-";
  if (sid.startsWith("server:")) return sid.slice(7);
  if (sid.startsWith("server-version:")) {
    const ver = sid.slice(15);
    return `us · ${names[ver] || "v" + ver}`;
  }
  return sid;
}
export const isComp = (g) => g.lane === "server";
export const srcBadge = (g) => (isComp(g)
  ? '<span class="src comp" title="a real battle on the competition server">COMPETITION</span>'
  : '<span class="src arena" title="played by the arena\'s own judge">ARENA</span>');
export const ourSeat = (g) => (isComp(g) ? (g.meta || {}).our_seat : null);

export function subLink(D, sid, withBot = false) {
  if (!sid) return '<span class="muted">-</span>';
  if (sid.startsWith("server:")) {
    const team = sid.slice(7);
    return `<a class="team" href="/games?source=competition&vs=${q(sid)}" title="a team on the competition server">${e(team)}</a>`;
  }
  if (sid.startsWith("server-version:")) {
    return `<a href="/server"><b>us</b></a> <span class="muted">${e(sideLabel(sid).replace(/^us · /, ""))}</span>`;
  }
  const sb = D.subLite(sid);
  let label = e(sid);
  if (sb && withBot && !sid.startsWith(`${sb.bot}-`)) label += ` <span class="muted">(${e(sb.bot)})</span>`;
  return `<a href="/s/${q(sid)}">${label}</a>`;
}
export const botLink = (bot) => (bot ? `<a href="/bots/${q(bot)}">${e(bot)}</a>` : "");
export const who = (owner, agent) => e(owner) + (agent ? ` <span class="muted">/ ${e(agent)}</span>` : "");
export function statusChip(status) {
  const cls = { rated: "win", done: "win", rejected: "loss", retired: "", placing: "draw", playing: "draw", queued: "", checking: "" }[status || ""] || "";
  return `<span class="chip ${cls}">${e(status)}</span>`;
}
export function rec(r) {
  if (!r) return '<span class="muted">-</span>';
  return `<span class="W">${r.W ?? 0}</span>-<span class="D">${r.D ?? 0}</span>-<span class="L">${r.L ?? 0}</span>`;
}
export function scoreBar(score) {
  if (score == null) return '<span class="muted">-</span>';
  return `<span class="bartrack"><span class="bar" style="width:${fixed(Math.max(0, Math.min(100, score)), 0)}%"></span></span> ${fixed(score, 1)}%`;
}
export function scoreCi(r) {
  let out = scoreBar(r.score);
  const ci = r.ci;
  if (ci) {
    out += ` <span class="muted" title="95% Wilson interval">(${fixed(ci[0], 0)}-${fixed(ci[1], 0)})</span>`;
    if (r.significant === false) out += ' <span class="chip" title="the interval includes 50%: consistent with no difference">noise</span>';
  }
  return out;
}
export function parentVerdict(v) {
  const vp = (v || {}).vs_parent;
  if (!vp) return v ? '<span class="muted">no parent</span>' : '<span class="muted">-</span>';
  const n = vp.W + vp.D + vp.L;
  const b = vp.beats_parent;
  let word, cls;
  if (!n) { word = "pending"; cls = ""; }
  else {
    [word, cls] = b === true ? ["beats", "win"] : b === false ? ["lost", "loss"] : ["tied", "draw"];
    if (!(v || {}).complete) word += " so far";
  }
  return `${rec(vp)} <span class="chip ${cls}">${word}</span>`;
}
export const OUTCOME = { beat_parent: ["beat parent", "win"], lost_to_parent: ["lost to parent", "loss"],
  tied_parent: ["tied parent", "draw"], pending: ["pending", ""], no_parent: ["no parent", ""], rejected: ["rejected", "loss"] };
export function outcomeChip(o) {
  const [word, cls] = OUTCOME[o] || [o, ""];
  return `<span class="chip ${cls}">${e(word)}</span>`;
}
const GH = /^https?:\/\/(www\.)?github\.com\/[^/]+\/[^/]+\/(tree|blob|commit)\/([^/?#]+)/;
const FIXED_REF = /^([0-9a-f]{7,40}|v?\d+(\.\d+)*([-.][\w.]+)?)$/i;
export function sourceLink(url) {
  if (!url) return '<span class="muted">-</span>';
  const safe = /^https?:\/\//.test(url) ? url : null;
  const label = e(url.replace(/^https?:\/\/(www\.)?github\.com\//, ""));
  let out = safe ? `<a href="${e(safe)}" rel="noopener">${label}</a>` : label;
  const m = GH.exec(url);
  if (m && m[2] !== "commit" && !FIXED_REF.test(m[3])) {
    out += ` <span class="chip warn" title="links a branch (${e(m[3])}), so it may no longer match the zip">moving</span>`;
  }
  return out;
}

export const FORCE_UPLOAD_CSS = `
.page-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px 16px; flex-wrap: wrap; }
.page-head h1 { margin-bottom: 4px; }
.force-upload.compact { margin: 6px 0 0; text-align: right; max-width: 380px; }
.force-upload.compact #fu-msg { display: block; font-size: 12px; margin-top: 4px; }
`;
export function forceUploadHtml(def = "", fixedOne = false) {
  const field = fixedOne ? `<input type="hidden" id="fu-id" value="${e(def)}">`
    : `<input id="fu-id" value="${e(def)}" placeholder="submission id" size="24">`;
  const hint = "skips the auto-submit gate; becomes our live bot on the server";
  return `<style>${FORCE_UPLOAD_CSS}</style><p class="force-upload${fixedOne ? " compact" : ""}">${field}
<button id="fu-go" title="${hint}">Upload to the competition server now</button>
<span id="fu-msg" class="muted">${!fixedOne ? hint : ""}</span></p>
<script>
document.getElementById("fu-go").onclick = async (ev) => {
  const sid = document.getElementById("fu-id").value.trim(), m = document.getElementById("fu-msg");
  if (!sid) return;
  if (!confirm("Upload " + sid + " to the competition server and make it our live bot?\\n\\n"
               + "This skips the auto-submit gate. It's logged as forced, with your name.")) return;
  ev.target.disabled = true; m.textContent = "uploading…";
  try {
    const r = await fetch("/api/v1/server/upload", {method: "POST", headers: {"Content-Type": "application/json"},
                                                      body: JSON.stringify({submission: sid})});
    const j = await r.json();
    if (!r.ok) throw new Error(j.detail || j.error || r.status);
    m.textContent = "uploaded " + sid + " as server version " + j.server_version + (j.activated
      ? ": it's our live bot now" : ": the server is still building it; it's made live automatically when ready");
  } catch (err) { m.textContent = "failed: " + err.message; ev.target.disabled = false; }
};
</script>`;
}

export function table(head, rows, numeric = new Set(), empty = "nothing yet") {
  if (!rows.length) return `<p class="muted">${e(empty)}</p>`;
  const th = head.map((h, i) => `<th class="${numeric.has(i) ? "n" : ""}">${h}</th>`).join("");
  const trs = rows.map((r) => "<tr>" + r.map((c, i) => (numeric.has(i) ? `<td class="n">${c}</td>`
    : c.startsWith("<td") ? c : `<td>${c}</td>`)).join("") + "</tr>").join("");
  return `<div class="wrap"><table><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table></div>`;
}
// Python's len()/slicing count code points
const cp = (str) => Array.from(str);
export function noteCell(note, n = 160) {
  note = pyStrip(note || "");
  const chars = cp(note);
  const short = chars.length <= n ? note : pyRstrip(chars.slice(0, n).join("")) + "…";
  return `<td class="note" title="${e(note)}">${e(short)}</td>`;
}
export const pyStrip = (x) => x.replace(/^[\s\u001c-\u001f\u0085]+|[\s\u001c-\u001f\u0085]+$/g, "");
export const pyRstrip = (x) => x.replace(/[\s\u001c-\u001f\u0085]+$/g, "");

export function resultFor(g, sid) {
  if (g.error) return null;
  if (g.winner == null) return "D";
  return g.winner === (g.a === sid ? "A" : "B") ? "W" : "L";
}
export function gameResult(D, g, sid = null) {
  if (g.error) return `<span class="chip loss" title="${e(g.error)}">error</span>`;
  if (sid) {
    const r = resultFor(g, sid);
    const cls = { W: "win", L: "loss", D: "draw" }[r || ""] || "";
    return `<span class="chip ${cls}">${e(r)}</span>`;
  }
  if (g.winner == null) return '<span class="chip draw">draw</span>';
  return `${e(g.winner)}: ${subLink(D, g.winner === "A" ? g.a : g.b)}`;
}
export function compGamesTable(D, games) {
  const rows = games.map((g) => {
    const m = g.meta || {};
    const seat = ourSeat(g);
    const us = seat === "A" ? g.a : seat === "B" ? g.b : null;
    const res = us ? resultFor(g, us) : null;
    const cls = { W: "win", L: "loss", D: "draw" }[res || ""] || "";
    const word = { W: "WIN", L: "LOSS", D: "DRAW" }[res || ""] || "?";
    const opp = seat === "A" ? g.b : g.a;
    return [`<a href="/games/${g.id}">${g.id}</a>`, when(g.played), `<span class="chip">${m.ranked ? "ranked" : "unranked"}</span>`,
      subLink(D, opp), us ? subLink(D, us) : "-", e(seat || "?"), e(m.map_name || g.map), `<span class="chip ${cls}">${word}</span>`,
      e(g.rounds), e(g.reason), g.replay ? `<a href="/games/${g.id}">watch</a>` : ""];
  });
  return table(["#", "played", "kind", "opponent", "our bot", "our seat", "map", "result", "rounds", "end", ""], rows,
    new Set([0, 8]), "no competition games downloaded yet");
}
// "watch" when the browser can play it (re-run from map, seed and bots), as the arena did when a replay was kept
export function gamesTable(D, games, sid = null) {
  const rows = games.map((g) => {
    const watch = g.runnable ? `<a href="/games/${g.id}">watch</a>` : `<a href="/games/${g.id}">view</a>`;
    let cells = [`<a href="/games/${g.id}">${g.id}</a> ${srcBadge(g)}`, when(g.played), e(g.lane), e(g.suite), e(g.map), e(g.seed)];
    if (sid) cells.push(g.a === sid ? "A" : "B", subLink(D, g.a === sid ? g.b : g.a));
    else cells.push(subLink(D, g.a), subLink(D, g.b));
    cells.push(gameResult(D, g, sid), e(g.rounds), e(g.reason), watch);
    return cells;
  });
  const head = ["#", "played", "lane", "suite", "map", "seed", ...(sid ? ["seat", "opponent"] : ["seat A", "seat B"]), "result", "rounds", "end", ""];
  return table(head, rows, new Set([0, 5, 9]), "no games yet");
}

const lineageRoot = (D, sid) => {
  const seen = new Set();
  while (D.subLite(sid) && D.subLite(D.subLite(sid).parent) && !seen.has(sid)) {
    seen.add(sid);
    sid = D.subLite(sid).parent;
  }
  return sid;
};

// ---------------------------------------------------------------- routes
export async function index(D) {
  const rows = (await D.leaderboard()).map((x) => {
    const elo = x.elo == null ? "-" : fixed(x.elo, 0);
    const err = x.err == null ? "" : ` <span class="muted">± ${fixed(x.err, 0)}</span>`;
    return [String(x.rank), subLink(D, x.submission), botLink(x.bot), e(x.owner), elo + err, String(x.games), scoreBar(x.score),
      statusChip(x.status), x.holdout ? rec(x.holdout) : '<span class="muted">-</span>', noteCell(x.note, 90)];
  });
  const board = table(["#", "submission", "bot", "owner", "elo", "games", "score", "status", "holdout", "note"], rows,
    new Set([0, 4, 5]), "No ranked submissions yet. Submit one, or promote a draft.");
  const recent = (await D.subsAll()).filter((x) => x.status !== "external")
    .sort((a, b) => (a.created < b.created ? 1 : a.created > b.created ? -1 : 0)).slice(0, 10);
  const cards = [];
  for (const x of recent) {
    const v = !["checking", "rejected"].includes(x.status) ? await D.verdict(x.id) : null;
    const line = x.status === "rejected" ? '<span class="chip loss">rejected</span>' : x.parent ? parentVerdict(v) : statusChip(x.status);
    cards.push(`<div class="card"><div class="t">${subLink(D, x.id)} <span class="chip">${e(x.lane)}</span></div>`
      + `<div class="muted">${who(x.owner, x.agent)} · ${when(x.created)}</div>`
      + `<div>${line}</div><div class="note">${e(x.note)}</div></div>`);
  }
  const strip = cards.length ? `<div class="cards">${cards.join("")}</div>` : '<p class="muted">No submissions yet.</p>';
  const comp = await D.recentComp(12);
  let compHtml = "";
  if (comp.length) {
    const chips = comp.map((g) => {
      const seat = ourSeat(g);
      const res = seat ? resultFor(g, seat === "A" ? g.a : g.b) : null;
      const opp = sideLabel(seat === "A" ? g.b : g.a);
      return `<a class="${e(res || "")}" href="/games/${g.id}" title="${e((g.meta || {}).map_name || g.map)} vs ${e(opp)}">${e(res || "?")}</a>`;
    });
    const ours = sideLabel(ourSeat(comp[0]) === "A" ? comp[0].a : comp[0].b);
    compHtml = `<div class="flash"><span class="src comp">COMPETITION</span> live bot `
      + `<b>${e(ours.replace(/^us · /, ""))}</b> · last ${comp.length} server games `
      + `<span class="gmaps">${chips.join("")}</span> · <a href="/server">server page</a></div>`;
  }
  const body = `<h1>Leaderboard <span class="src arena">ARENA</span></h1>
${compHtml}
<p class="sub">Current ranked submission of each active bot. Elo from a Bradley-Terry fit
(reference bot 1000); score is (W + D/2) / games on the public maps.</p>
${board}
<h2>Recent submissions</h2>${strip}`;
  return layout("Leaderboard", body, ["/api/v1/leaderboard", "/api/v1/submissions"], "/");
}

export async function botPage(D, bot) {
  const d = await D.botDetail(bot);
  if (!d) throw new HTTPError(404, `no bot ${pyRepr(bot)}`);
  const ratings = await D.ratings();
  const rows = d.submissions.map((x) => {
    const rt = ratings[x.id] || {};
    const elo = rt.elo != null ? fixed(rt.elo, 0) : "-";
    const cur = x.id === d.current ? ' <span class="chip win">current</span>' : "";
    return [subLink(D, x.id) + cur, when(x.created), e(x.lane), statusChip(x.status), who(x.owner, x.agent),
      subLink(D, x.parent, true), parentVerdict(x.verdict), elo, sourceLink(x.source), noteCell(x.note, 220)];
  });
  const line = table(["submission", "created", "lane", "status", "owner / agent", "parent", "vs parent", "elo", "source", "note"], rows, new Set([7]));
  const mine = new Set(d.submissions.map((x) => x.id));
  const lin = [];
  for (const x of d.submissions.slice().reverse()) {
    const chain = [];
    let p = x.parent;
    const seen = new Set();
    while (p && !seen.has(p) && chain.length < 12) {
      seen.add(p);
      chain.push(subLink(D, p, true));
      p = D.subLite(p) ? D.subLite(p).parent : null;
    }
    lin.push(`<li>${subLink(D, x.id)}` + (chain.length ? ` ← ${chain.join(" ← ")}` : ' <span class="muted">(root)</span>') + "</li>");
  }
  const children = (await D.subsAll()).filter((x) => mine.has(x.parent) && x.bot !== bot)
    .sort((a, b) => (a.created < b.created ? -1 : a.created > b.created ? 1 : 0));
  const kids = children.map((x) => `<li>${subLink(D, x.id, true)} builds on ${subLink(D, x.parent)}</li>`).join("");
  const h2h = d.head_to_head.map((x) => {
    const n = x.W + x.D + x.L;
    const sc = n ? pyRound(100 * (x.W + x.D / 2) / n, 1) : null;
    return [subLink(D, x.opponent, true), rec(x), String(n), scoreBar(sc), `<a href="/games?sub=${q(d.current)}&vs=${q(x.opponent)}">games</a>`];
  });
  const cur = d.current;
  const body = `<h1>${e(bot)}</h1>
<div class="kv">
<div>owner</div><div>${e(d.owner)}</div>
<div>current</div><div>${cur ? subLink(D, cur) : '<span class="muted">none (no ranked submission)</span>'}</div>
<div>active</div><div>${d.active ?? true ? "yes" : "no"}</div>
<div>submissions</div><div>${d.submissions.length}</div>
</div>
<h2>Submissions</h2>${line}
<div class="grid2">
<div><h2>Lineage</h2><ul>${lin.join("") || '<li class="muted">-</li>'}</ul>
${kids ? `<p class="sub">Other bots built on this line:</p><ul>${kids}</ul>` : ""}</div>
<div><h2>Head to head${cur ? ` (${e(cur)})` : ""}</h2>
${table(["opponent", "W-D-L", "games", "score", ""], h2h, new Set([2]), cur ? "no ranked games yet" : "no current submission")}</div>
</div>`;
  return layout(bot, body, `/api/v1/bots/${q(bot)}`);
}

export const SUMMARY_ROUNDS = [50, 100, 200, 300, 400];
function metricsHtml(d) {
  if (!d || !d.games) {
    return '<h2>In-game metrics</h2><p class="muted">No metrics yet: they are computed after each '
      + "game (and for older games in the background).</p>";
  }
  const cols = [...SUMMARY_ROUNDS.map((r) => `r${r}`), "end"];
  const order = ["eval", "board_control", "log_dragons", "dragons", "total_length", "longest", "queen_alive", "queen_length", "queen_room",
    "queen_danger", "queen_share", "pearls_eaten", "pearl_rate", "pearl_control", "deaths", "deaths_self", "kills", "splits"];
  const names = [...order.filter((k) => k in d.metrics), ...Object.keys(d.metrics).filter((k) => !order.includes(k)).sort()];
  const rows = names.map((k) => {
    const m = d.metrics[k];
    const cells = [k === "eval" ? "<b>Eval: P(win)</b>" : e(m.title)];
    for (const c of cols) {
      const v = m.at[c];
      if (!v) { cells.push('<span class="muted">-</span>'); continue; }
      const own = v.own, opp = v.opponents;
      let good = { higher: own > opp, lower: own < opp }[m.better || ""];
      if (k === "eval") good = own > 0.5;
      const cls = good === undefined || own === opp ? "" : good ? "W" : "L";
      const fmt = k === "eval" ? (x) => fixed(x * 100, 0) + "%" : (x) => (Math.abs(x) < 10 ? fixed(x, 2) : fixed(x, 0));
      cells.push(`<span class="${cls}">${fmt(own)}</span> <span class="muted">vs ${fmt(opp)}</span>`);
    }
    return cells;
  });
  return `<h2>In-game metrics <span class="sub">this bot vs its opponents, averaged over ${d.games} `
    + `games; <a href="/docs/metrics">what they mean</a></span></h2>` + table(["metric", ...cols], rows);
}

export async function submissionPage(D, sid) {
  const x = await D.sub(sid);
  if (!x) throw new HTTPError(404, `no submission ${pyRepr(sid)}`);
  const canEdit = false;                                 // nobody edits a snapshot
  const d = await D.subJson(x, true);
  const v = d.verdict;
  const rt = d.rating || {};
  const serverUpload = !["checking", "rejected", "external"].includes(x.status) ? forceUploadHtml(x.id, true) : "";
  let promote = "";
  if (x.lane === "draft" && x.status === "done") {
    promote = `<p><button id="promote" data-id="${e(x.id)}">Promote to ranked</button>
<span id="promote-msg" class="muted"></span></p>
<script>
document.getElementById("promote").onclick = async (ev) => {
  const b = ev.target, m = document.getElementById("promote-msg");
  if (!confirm("Promote " + b.dataset.id + "? It becomes its bot's current submission.")) return;
  b.disabled = true; m.textContent = "promoting…";
  try {
    const r = await fetch("/api/v1/submissions/" + encodeURIComponent(b.dataset.id) + "/promote",
                          {method: "POST"});
    const j = await r.json();
    if (!r.ok) throw new Error(j.detail || r.status);
    m.textContent = "promoted: now " + j.status; setTimeout(() => location.reload(), 800);
  } catch (err) { m.textContent = "failed: " + err.message; b.disabled = false; }
};
</script>`;
  }
  const ph = x.parent_history || [];
  const info = `<div class="kv">
<div>bot</div><div>${botLink(x.bot)}</div>
<div>owner / agent</div><div>${who(x.owner, x.agent)}</div>
<div>lane / status</div><div>${e(x.lane)} ${statusChip(x.status)}</div>
<div>parent</div><div>${subLink(D, x.parent, true)}
${canEdit ? '<button class="small" onclick="setParent()">change</button>' : ""}
${x.parent ? ` <a class="small" href="/compare?a=${q(x.id)}&b=${q(x.parent)}">compare</a>` : ""}
${ph.length ? ` <span class="muted" title="${e(ph.map((h) => `${h.parent || "none"} (until ${String(h.at).slice(0, 16)}, changed by ${h.by})`).join(", "))}">(was ${e(ph[ph.length - 1].parent || "none")})</span>` : ""}
<script>
async function setParent() {
  const v = prompt("New parent submission id (empty for none). If it hasn't played that one yet, the arena plays those games and the verdict follows.", ${pyJson(x.parent || "")});
  if (v === null) return;
  const r = await fetch("/api/v1/submissions/${q(x.id)}", {method: "PATCH",
    headers: {"Content-Type": "application/json"}, body: JSON.stringify({parent: v.trim() || null})});
  if (r.ok) location.reload(); else alert((await r.json()).detail || r.status);
}
</script></div>
<div>created</div><div>${when(x.created)}</div>
${x.promoted ? `<div>promoted</div><div>${when(x.promoted)} by ${e(x.promoted_by)}</div>` : ""}
<div>elo</div><div>${rt.elo != null ? `${fixed(rt.elo, 0)} ± ${fixed(rt.err || 0, 0)}` : "-"}</div>
<div>language</div><div>${e(x.language) || "-"}</div>
<div>source</div><div>${sourceLink(x.source)}</div>
<div>zip</div><div><a href="/api/v1/submissions/${q(x.id)}/source">download ${e(x.id)}.zip</a>
<span class="muted">sha256 ${e((x.sha256 || "").slice(0, 12))}</span></div>
</div>`;
  const rejected = x.status === "rejected" || x.reason ? `<div class="flash err"><b>Rejected:</b> ${e(x.reason)}</div>` : "";
  const checkLog = await D.checkLog(x.id);
  const log = checkLog ? `<details${x.status === "rejected" ? " open" : ""}><summary>check log</summary><pre class="log">${e(checkLog)}</pre></details>` : "";
  let verdictHtml = "";
  if (v) {
    const vrows = [];
    if (v.vs_parent) {
      const vp = v.vs_parent;
      vrows.push([`parent ${subLink(D, vp.parent, true)}`, rec(vp), scoreCi(vp), parentVerdict(v)]);
    }
    for (const o of v.opponents || []) {
      if (v.vs_parent && o.opponent === v.vs_parent.parent) continue;
      vrows.push([subLink(D, o.opponent, true), rec(o), scoreCi(o), ""]);
    }
    verdictHtml = `<h2>Draft verdict <span class="sub">${v.complete ? "complete" : "in progress"}</span></h2>`
      + table(["opponent", "W-D-L", "score", ""], vrows, new Set(), "opponents not chosen yet");
  }
  let repHtml = "";
  if (!["checking", "external"].includes(x.status)) {
    const rep = await D.report(x.id);
    const opp = rep.by_opponent.map((r) => [subLink(D, r.opponent, true), rec(r), scoreCi(r), `<a href="/games?sub=${q(x.id)}&vs=${q(r.opponent)}">games</a>`]);
    const mp = rep.by_map.map((r) => [e(r.map), rec(r), scoreCi(r), `<a href="/games?sub=${q(x.id)}&map=${q(r.map.split("/").slice(1).join("/") || r.map)}">games</a>`]);
    const deaths = Object.entries(rep.deaths).map(([k, n]) => [e(k), String(n)]);
    const cpu = rep.cpu;
    const fmt = (p) => (p != null ? `${fixed(p / 1e6, 1)}M` : "-");
    const losses = rep.worst_losses.map((r) => [`<a href="/games/${r.game}">${r.game}</a>`, e(r.map), subLink(D, r.opponent, true), e(r.rounds), e(r.reason),
      r.replay ? `<a href="/games/${r.game}">watch</a>` : '<span class="muted">replay pruned</span>']);
    const hd = rep.holdout;
    let cpuWarn = "";
    if (cpu.warn) {
      const said = cpu.overruns ? `${cpu.overruns} dragons went over the ${fmt(cpu.cap)} CPU cap and died (in ${cpu.overrun_games} games)`
        : `its heaviest turn used ${fmt(cpu.max)} of the ${fmt(cpu.cap)} CPU cap`;
      cpuWarn = `<p><span class="chip warn">CPU</span> ${e(said)}: a turn over the cap is a dead dragon. Bring it under ${fmt(cpu.warn_at)}.</p>`;
    }
    const seatEnd = [...Object.entries(rep.by_seat).map(([k, r]) => [`seat ${k}`, rec(r), scoreCi(r)]),
      ...Object.entries(rep.by_end).map(([k, r]) => [e(k), rec(r), scoreCi(r)])];
    const econ = Object.entries(rep.economy).filter(([, r]) => r).map(([k, r]) => [k, pf(r.dragons), pf(r.opponent_dragons), String(r.games)]);
    repHtml = `${cpuWarn}<h2>Report <span class="sub">${rep.games} games ·
${rec(rep.record)} · ${rep.record.score != null ? `${pf(rep.record.score)}%` : ""}
${rep.rounds_mean ? ` · ${pf(rep.rounds_mean)} rounds mean` : ""}
${hd ? ` · holdout ${rec(hd)}` : ""}</span></h2>
<div class="grid2">
<div><h2>By opponent</h2>${table(["opponent", "W-D-L", "score", ""], opp)}</div>
<div><h2>By map <span class="sub">worst first</span></h2>${table(["map", "W-D-L", "score", ""], mp)}</div>
<div><h2>Deaths <span class="sub">${rep.deaths_per_game != null ? pf(rep.deaths_per_game) : "-"} per game ·
${rep.errors} errors</span></h2>${table(["cause", "count"], deaths, new Set([1]), "no deaths recorded")}</div>
<div><h2>By seat and by how games ended</h2>
${table(["", "W-D-L", "score"], seatEnd, new Set(), "no games yet")}
<h2>Economy <span class="sub">mean dragons alive</span></h2>
${table(["round", "ours", "theirs", "games"], econ, new Set([1, 2, 3]), "no games reached round 50")}
${rep.historical_games ? `<p class="muted">${rep.historical_games} games from an older judge version are kept but not counted.</p>` : ""}
</div>
<div><h2>CPU</h2><div class="kv">
<div>p99 (worst game)</div><div>${fmt(cpu.p99_max)}</div>
<div>max</div><div>${fmt(cpu.max)}</div>
<div>cap</div><div>${fmt(cpu.cap)}</div>
<div>headroom</div><div>${cpu.headroom != null ? `${fixed(100 * cpu.headroom, 0)}%` : "-"}</div>
<div>over the cap</div><div>${cpu.overruns} dragons in ${cpu.overrun_games} games</div>
</div></div>
</div>
<h2>Worst losses</h2>${table(["game", "map", "opponent", "rounds", "end", ""], losses, new Set([0, 3]), "no losses")}`;
  }
  const games = await D.findGames({ sub: x.id, limit: 500 });
  const nh = x.note_history || [];
  const body = `<div class="page-head"><h1>${e(x.id)}</h1>${serverUpload}</div>
${rejected}
<div class="grid2"><div>${info}${promote}</div>
<div><h2 style="margin-top:0">Note ${canEdit ? '<button class="small" onclick="editNote()">edit</button>' : ""}
<a class="sub" href="/lineage?root=${q(lineageRoot(D, x.id))}#${q(x.id)}">lineage</a></h2>
<pre id="note">${e(x.note) || '<span class="muted">(no note)</span>'}</pre>
<div id="noteedit" style="display:none"><textarea id="notetext" style="width:100%;min-height:160px">${e(x.note)}</textarea>
<button onclick="saveNote()">save</button> <button class="small" onclick="location.reload()">cancel</button>
<span id="notemsg" class="muted"></span></div>
${nh.length ? `<details><summary class="muted">${nh.length} earlier version(s)</summary>` + nh.slice().reverse().map((h) =>
    `<p class="muted">${when(h.at)} by ${e(h.by)}</p><pre>${e(h.note)}</pre>`).join("") + "</details>" : ""}
<script>
function editNote() { document.getElementById("note").style.display = "none";
  document.getElementById("noteedit").style.display = "block"; }
async function saveNote() {
  const r = await fetch("/api/v1/submissions/${q(x.id)}", {method: "PATCH",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({note: document.getElementById("notetext").value})});
  if (r.ok) location.reload();
  else document.getElementById("notemsg").textContent = (await r.json()).detail || r.status;
}
</script></div></div>
${log}
${verdictHtml}
${repHtml}
${metricsHtml(await D.subMetrics(x.id))}
<h2>Games <span class="sub">${games.length}${games.length === 500 ? "+" : ""} ·
<a href="/games?sub=${q(x.id)}">filter</a></span></h2>
${gamesTable(D, games, x.id)}`;
  return layout(x.id, body, [`/api/v1/submissions/${q(x.id)}`, `/api/v1/submissions/${q(x.id)}/report`, `/api/v1/games?sub=${q(x.id)}`]);
}

export async function gamesPage(D, p) {
  const sub = p.get("sub") || "", vs = p.get("vs") || "", map = p.get("map") || "", suite = p.get("suite") || "";
  const lane = p.get("lane") || "", result = p.get("result") || "";
  let limit = parseInt(p.get("limit") || "100", 10);
  if (Number.isNaN(limit)) throw new HTTPError(422, "limit");
  limit = Math.max(1, Math.min(limit, 1000));
  let source = p.get("source") || "";
  if (!["arena", "competition", "all"].includes(source)) source = lane === "server" || vs.startsWith("server:") ? "competition" : "arena";
  const games = await D.findGames({ sub, vs, map, suite, lane, result, limit, source: source === "all" ? null : source });
  const params = Object.fromEntries(Object.entries({ sub, vs, map, suite, lane, result, source }).filter(([, v]) => v));
  const subs = await D.kv("game_subs"), maps = await D.kv("game_maps");
  const opt = (values, cur) => ["", ...values].map((x) => `<option value="${e(x)}"${x === cur ? " selected" : ""}>${e(x) || "any"}</option>`).join("");
  const form = `<form class="filters" method="get" action="/games">
<label>submission<input name="sub" value="${e(sub)}" list="subs" placeholder="any"></label>
<label>vs<input name="vs" value="${e(vs)}" list="subs" placeholder="any"></label>
<label>map<select name="map">${opt(maps, map)}</select></label>
<label>suite<select name="suite">${opt(["official", "tournament", "server", "custom", "rotating", "check"], suite)}</select></label>
<label>lane<select name="lane">${opt(["draft", "placement", "continuous", "check", "server"], lane)}</select></label>
<label>result (for submission)<select name="result">${opt(["W", "D", "L"], result)}</select></label>
<label>limit<input name="limit" value="${limit}" size="4"></label>
<input type="hidden" name="source" value="${e(source)}">
<button type="submit">Filter</button> <a href="/games?source=${e(source)}">clear</a>
<datalist id="subs">${subs.map((x) => `<option value="${e(x)}">`).join("")}</datalist>
</form>`;
  const api = "/api/v1/games" + (Object.keys(params).length ? "?" + urlencode({ ...params, limit }) : "");
  const tab = (k, label) => `<a class="${source === k ? "on" : ""}" href="/games?source=${k}">${label}</a>`;
  const tabs = `<div class="tabs">${tab("arena", '<span class="src arena">ARENA</span> games our judge played')}`
    + `${tab("competition", '<span class="src comp">COMPETITION</span> real battles on the server')}${tab("all", "all")}</div>`;
  const explain = {
    arena: "Games the arena played with the official judge on poscatgpu2: drafts, placement and background games between submissions. These make the ratings.",
    competition: "Real games our live bot played on the competition server (game.battlecode.au), downloaded automatically. They don't count in arena ratings; see the <a href=\"/server\">Server</a> page for battles.",
    all: "Arena and competition games together." }[source];
  const listing = source === "competition" ? compGamesTable(D, games) : gamesTable(D, games, sub && D.subLite(sub) ? sub : null);
  const body = `<h1>Games</h1>${tabs}<p class="sub">${explain}</p>` + (source !== "competition" ? form : "")
    + `<p class="sub">${games.length} shown, newest first</p>` + listing;
  return layout("Games", body, api, "/games");
}

const GAME_HEAD = `<style>
:root { --arena-header: 46px; }
.gh { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 16px; padding: 6px 14px;
  background: #0d0e10; border-bottom: 1px solid #2b2b2b; font-size: 13px; color: #ddd; }
.gh a { color: #6ea2ff; text-decoration: none; } .gh a:hover { text-decoration: underline; }
.gh .home { font-weight: 700; color: #fff; } .gh .m { color: #9d9d9d; }
.gh .r { margin-left: auto; } .gh .W { color: #4cc26a; } .gh .L { color: #ff6b6b; }
.gh .D { color: #e0b84a; }
.gh .sa, .gh .sb { display: inline-block; padding: 0 5px; border-radius: 3px; font-size: 11px;
  font-weight: 700; color: #000; } .gh .sa { background: #4fb3a9; } .gh .sb { background: #d18616; }
</style>`;

export async function gamePage(D, gid) {
  const g = await D.game(gid);
  if (!g) throw new HTTPError(404, `no game ${gid}`);
  const names = { A: sideLabel(g.a), B: sideLabel(g.b) };
  const win = g.winner ? `<b class="W">${e(names[g.winner])}</b> wins` : g.error ? '<b class="L">error</b>' : '<b class="D">draw</b>';
  const verdict = `${win} after ${e(g.rounds)} rounds` + (g.reason ? ` <span class="m">(${e(g.reason)})</span>` : "");
  const seats = `<span class="sa">A</span> ${subLink(D, g.a)} vs <span class="sb">B</span> ${subLink(D, g.b)}`;
  let context, links, back;
  const m = g.meta || {};
  if (isComp(g)) {
    const seat = ourSeat(g);
    const res = seat ? resultFor(g, seat === "A" ? g.a : g.b) : null;
    const word = { W: '<b class="W">WE WON</b>', L: '<b class="L">WE LOST</b>', D: '<b class="D">DRAW</b>' }[res || ""] || "";
    const bid = m.server_battle;
    context = `${srcBadge(g)} ${m.ranked ? "ranked" : "unranked"} battle `
      + (bid ? `<a href="https://game.battlecode.au/visualiser?match=${q(bid)}">M${e(bid)}</a>` : "")
      + ` · we were seat ${e(seat || "?")} · ${word}`;
    links = `<a href="/server">server</a> · ` + (g.runnable ? `<a href="/api/v1/games/${g.id}/replay">replay</a> · ` : "") + `<a href="/api/v1/games/${g.id}">JSON</a>`;
    back = '<a href="/games?source=competition">competition games</a>';
  } else {
    const laneWords = { draft: "draft check", placement: "placement", continuous: "background game", holdout: "holdout", check: "submission check" };
    context = `${srcBadge(g)} ${e(laneWords[g.lane] || g.lane)} on the ${e(g.suite)} maps`;
    links = `<a href="/games?sub=${q(g.a)}&vs=${q(g.b)}">this pairing</a> · ` + (g.runnable ? `<a href="/api/v1/games/${g.id}/replay">replay</a> · ` : "")
      + `<a href="/api/v1/games/${g.id}">JSON</a>`;
    back = '<a href="/games">games</a>';
  }
  const header = `<div class="gh">
<a class="home" href="/">tokenz-arena</a>
<span>#${g.id}</span><span>${context}</span><span>${seats}</span><span>${verdict}</span>
<span class="m">${e(m.map_name || g.map)} · seed ${e(g.seed)} · ${when(g.played)}${m.worker != null && m.worker !== "local" ? ` · played on ${e(m.worker)}` : ""}</span>
<span class="r">${links} · ${back}</span>
</div>`;
  if (g.runnable) {
    return { html: viewer.page(`/api/v1/games/${g.id}/replay`, `${names.A} vs ${names.B} on ${g.map}`,
      { header, head: GAME_HEAD + `<style>${SRC_CSS}</style>`, teamNames: names,
        rerun: { a: g.a, b: g.b, seed: g.seed, map_sha: g.map_sha, wasm: await D.wasmFor([g.a, g.b]), rounds: g.rounds, winner: g.winner } }) };
  }
  const body = `<h1>Game ${g.id}</h1><div class="kv">
<div>seats</div><div>A ${subLink(D, g.a)} vs B ${subLink(D, g.b)}</div>
<div>verdict</div><div>${verdict}</div>
<div>map</div><div>${e(g.map)} (${e(g.suite)}), seed ${e(g.seed)}</div>
<div>lane</div><div>${e(g.lane)}</div><div>played</div><div>${when(g.played)}</div>
${g.error ? `<div>error</div><div>${e(g.error)}</div>` : ""}
</div><p class="muted">The replay of this game is no longer kept (retention), so it can't be
watched; its verdict and stats are below.</p>
<pre>${e(pyJsonIndent(await D.gameStats(g.id), 1))}</pre>`;
  return layout(`Game ${g.id}`, body, `/api/v1/games/${g.id}`, "/games");
}

// ---------------------------------------------------------------- lineage
function flatten(forest) {
  const nodes = new Map();
  const walk = (n, parent) => { nodes.set(n.id, { ...n, parent_id: parent }); for (const c of n.children) walk(c, n.id); };
  for (const n of forest) walk(n, null);
  return nodes;
}
function edgeHtml(n) {
  const vp = n.vs_parent || {};
  if (!(vp.W || vp.D || vp.L)) return '<span class="muted">←</span>';
  const b = vp.beats_parent;
  const cls = b ? "win" : b === false ? "loss" : "draw";
  const word = b ? "beat" : b === false ? "lost to" : "tied";
  const noise = vp.significant ? "" : "?";
  return `<span class="edge ${cls}" title="${word} its parent ${pyStr(vp.W)}-${pyStr(vp.D)}-${pyStr(vp.L)}`
    + ` (${pf(vp.score)}%)${noise ? ", within noise" : ""}">← ${word}${noise} ${pyStr(vp.W)}-${pyStr(vp.D)}-${pyStr(vp.L)}</span>`;
}
function vkey(sid) {
  const m = /(\d+)([a-z]*)$/.exec(sid);
  return m ? [parseInt(m[1], 10), m[2]] : [0, sid];
}
const cmpKey = (a, b) => {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] === b[i]) continue;
    if (a[i] === undefined) return -1;
    if (b[i] === undefined) return 1;
    return a[i] < b[i] ? -1 : 1;
  }
  return 0;
};
const reEsc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function lineageLines(D, forest) {
  const nodes = flatten(forest);
  const lines = new Map();
  for (const n of nodes.values()) { if (!lines.has(n.bot)) lines.set(n.bot, []); lines.get(n.bot).push(n); }
  for (const v of lines.values()) v.sort((a, b) => cmpKey(vkey(a.id), vkey(b.id)) || (a.created < b.created ? -1 : a.created > b.created ? 1 : 0));
  const parentLine = new Map();
  for (const [name, v] of lines) for (const n of v) {
    const p = n.parent_id ? nodes.get(n.parent_id) : null;
    if (p && p.bot !== name && !parentLine.has(name)) parentLine.set(name, [p.bot, p.id]);
  }
  const kids = new Map();
  for (const name of lines.keys()) {
    const k = parentLine.has(name) ? parentLine.get(name)[0] : null;
    if (!kids.has(k)) kids.set(k, []);
    kids.get(k).push(name);
  }
  const latest = new Map([...lines].map(([name, v]) => [name, v.reduce((m, n) => (n.created > m ? n.created : m), "")]));
  const byLatest = (a, b) => (latest.get(a) < latest.get(b) ? 1 : latest.get(a) > latest.get(b) ? -1 : 0);
  const chip = (n) => {
    const vp = n.vs_parent || {};
    const played = vp.W || vp.D || vp.L;
    const b = vp.beats_parent;
    const cls = !played ? "" : b ? "W" : b === false ? "L" : "D";
    const noise = !played || vp.significant ? "" : " noise";
    const tip = `${n.id} (${n.lane}, ${n.status})` + (played ? ` vs parent ${pyStr(vp.W)}-${pyStr(vp.D)}-${pyStr(vp.L)}` : "")
      + (n.elo != null ? ` · elo ${fixed(n.elo, 0)}` : "");
    const label = (n.current ? "★ " : "") + n.id.replace(new RegExp(`^${reEsc(n.bot)}-?`), "");
    return `<a class="vchip ${cls}${noise}${n.current ? " cur" : ""}${n.status === "rejected" ? " rej" : ""}" href="/s/${q(n.id)}" title="${e(tip)}">${e(label || n.id)}</a>`;
  };
  const row = (name, depth) => {
    const v = lines.get(name);
    const cur = v.filter((n) => n.current);
    const elos = v.filter((n) => n.elo != null).map((n) => n.elo);
    const best = elos.length ? Math.max(...elos) : null;
    let chips = v.map(chip);
    if (chips.length > 14) chips = [`<details class="more"><summary>${chips.length - 12} earlier</summary>${chips.slice(0, -12).join("")}</details>`, ...chips.slice(-12)];
    const origin = parentLine.get(name);
    const frm = origin ? `<span class="muted">from ${subLink(D, origin[1])}</span>` : "";
    const last = v[v.length - 1];
    const head = `<a class="line" href="/bots/${q(name)}">${e(name)}</a> `
      + `<span class="muted">${v.length} version${v.length !== 1 ? "s" : ""}`
      + (cur.length && cur[0].elo != null ? ` · ★ ${e(cur[0].id)} elo ${fixed(cur[0].elo, 0)}` : cur.length ? ` · ★ ${e(cur[0].id)}` : "")
      + (best != null && !cur.length ? ` · best elo ${fixed(best, 0)}` : "")
      + ` · ${e(last.owner)}${last.agent ? " / " + e(last.agent) : ""}` + "</span>";
    const sub = (kids.get(name) || []).slice().sort(byLatest).map((k) => row(k, depth + 1)).join("");
    return `<li><div class="lrow">${head} ${frm}<div class="vchips">${chips.join("")}</div></div>` + (sub ? `<ul class="ltree">${sub}</ul>` : "") + "</li>";
  };
  const active = (name) => lines.get(name).some((n) => n.current) || (kids.get(name) || []).some(active);
  const roots = (kids.get(null) || []).slice().sort(byLatest);
  const live = roots.filter(active), old = roots.filter((k) => !active(k));
  const body = live.map((k) => row(k, 0)).join("");
  return `<p class="sub">Each row is a line (a bot), with its versions in order. Colours show how each version did
against its parent (<span class="W">beat</span>, <span class="L">lost</span>, <span class="D">tied</span>,
faded = within noise, grey = not measured); ★ marks the line's current ranked version. A line
nested under another branched off it ("from …"). Hover a version for its numbers; click to open it.</p>
<ul class="ltree root">${body || '<li class="muted">no line has a ranked version yet</li>'}</ul>
${old.length ? `<details><summary class="muted">${old.length} older lines with no ranked version</summary>
<ul class="ltree root">${old.map((k) => row(k, 0)).join("")}</ul></details>` : ""}`;
}

function lineageResults(D, forest, bot, ranked, botNames) {
  const nodes = flatten(forest);
  const hasKids = new Set([...nodes.values()].filter((n) => n.parent_id).map((n) => n.parent_id));
  let results = [...nodes.values()].filter((n) => n.current || (!hasKids.has(n.id) && !ranked));
  if (bot) results = results.filter((n) => n.bot === bot);
  const cur = results.filter((n) => n.current).sort((a, b) => -(a.elo ?? -1e9) - -(b.elo ?? -1e9));
  const rest = results.filter((n) => !n.current).sort((a, b) => (a.created < b.created ? 1 : a.created > b.created ? -1 : 0));
  results = [...cur, ...rest];
  const rows = results.map((n) => {
    const chain = [];
    let c = n;
    const seen = new Set();
    while (c && !seen.has(c.id)) { seen.add(c.id); chain.push(c); c = c.parent_id ? nodes.get(c.parent_id) : null; }
    const parts = chain.map((x, i) => (i ? subLink(D, x.id) : `<b>${subLink(D, x.id)}</b>`) + (x.parent_id ? " " + edgeHtml(x) : ""));
    const shown = parts.length <= 6 ? parts : [...parts.slice(0, 5), `<details class="more"><summary>${parts.length - 5} more ancestors</summary>${parts.slice(5).join(" ")}</details>`];
    const star = n.current ? "★ " : "";
    const elo = n.elo != null ? fixed(n.elo, 0) : "-";
    const first = n.note ? cp(pyStrip(n.note).split(/\r\n|\r|\n/)[0]).slice(0, 110).join("") : "";
    return [`${star}<a class="chip" href="/bots/${q(n.bot)}">${e(n.bot)}</a>`, elo, statusChip(n.status), who(n.owner, n.agent),
      `<td class="note"><div class="chain">${shown.join(" ")}</div><div class="tnote">${e(first)}</div></td>`];
  });
  const opt = ["", ...botNames].map((x) => `<option value="${e(x)}"${x === bot ? " selected" : ""}>${e(x) || "any"}</option>`).join("");
  return `<p class="sub">The bots we have now, best first: each bot's current ranked version (★) and every
submission nothing has been built on yet. Each row reads backwards from the bot through its
ancestors, with how each step did against its parent ("?" = within noise).</p>
<form class="filters" method="get" action="/lineage"><input type="hidden" name="view" value="bots">
<label>bot<select name="bot">${opt}</select></label>
<label>show<select name="ranked"><option value="false">ranked and unbuilt-on drafts</option>
<option value="true"${ranked ? " selected" : ""}>ranked only</option></select></label>
<button type="submit">Show</button></form>
${table(["bot", "elo", "status", "owner", "ancestry (newest first)"], rows, new Set([1]), "nothing yet")}`;
}

function lineageGraph(forest) {
  const nodes = flatten(forest);
  if (!nodes.size) return '<p class="muted">nothing yet</p>';
  const W = 168, H = 24, GX = 34, GY = 8;
  const pos = new Map(), latest = new Map();
  let yNext = 0;
  const newest = (n) => { const v = [n.created, ...n.children.map(newest)].reduce((a, b) => (b > a ? b : a)); latest.set(n.id, v); return v; };
  for (const n of forest) newest(n);
  const byLatest = (a, b) => (latest.get(a.id) < latest.get(b.id) ? 1 : latest.get(a.id) > latest.get(b.id) ? -1 : 0);
  const place = (n) => {
    const kids = n.children.slice().sort(byLatest);
    let h = 0;
    for (const c of kids) h = Math.max(h, place(c) + 1);
    let y;
    if (kids.length) y = pos.get(kids[0].id)[1];
    else { y = yNext; yNext += 1; }
    pos.set(n.id, [h, y]);
    return h;
  };
  for (const n of forest.slice().sort(byLatest)) place(n);
  const depthMax = Math.max(...[...pos.values()].map(([d]) => d));
  const width = (depthMax + 1) * (W + GX) + 20, height = yNext * (H + GY) + 20;
  const xy = new Map([...pos].map(([k, [d, y]]) => [k, [10 + d * (W + GX), 10 + y * (H + GY)]]));
  const edges = [], boxes = [];
  for (const [k, n] of nodes) {
    if (xy.has(n.parent_id)) {
      const [px, py] = xy.get(n.parent_id), [cx, cy] = xy.get(k);
      const vp = n.vs_parent || {};
      const played = vp.W || vp.D || vp.L;
      const b = vp.beats_parent;
      const color = !played ? "var(--muted)" : b ? "var(--win)" : b === false ? "var(--loss)" : "var(--draw)";
      const dash = played && !vp.significant ? ' stroke-dasharray="4 3"' : "";
      const x1 = px, y1 = py + H / 2, x2 = cx + W, y2 = cy + H / 2, mx = (x1 + x2) / 2;
      const tip = played ? `${n.id} vs parent: ${pyStr(vp.W)}-${pyStr(vp.D)}-${pyStr(vp.L)}` : "no games vs parent yet";
      edges.push(`<path d="M${fixed(x1, 0)},${fixed(y1, 0)} C${fixed(mx, 0)},${fixed(y1, 0)} ${fixed(mx, 0)},${fixed(y2, 0)} ${fixed(x2, 0)},${fixed(y2, 0)}" `
        + `fill="none" stroke="${color}" stroke-width="2"${dash}><title>${e(tip)}</title></path>`);
    }
    const [x, y] = xy.get(k);
    const star = n.current ? "★ " : "";
    const elo = n.elo != null ? ` · ${fixed(n.elo, 0)}` : "";
    const cls = n.current ? "gn cur" : n.lane === "ranked" ? "gn rank" : "gn";
    const label = `${star}${n.id}${elo}`;
    boxes.push(`<a href="/s/${q(k)}"><g class="${cls}"><rect x="${x}" y="${y}" width="${W}" height="${H}" rx="5"/>`
      + `<text x="${x + 7}" y="${y + 16}">${e(cp(label).slice(0, 26).join(""))}</text>`
      + `<title>${e(n.id)} (${e(n.lane)}, ${e(n.status)}) by ${e(n.owner)}\n${e(cp(n.note || "").slice(0, 300).join(""))}</title></g></a>`);
  }
  return `<p class="sub">The bots we have on the left, their ancestors to the right (scroll right for the
history). Each line runs straight across, newest line on top; side branches drop below. Edges: <span class="W">green</span> beat its parent,
<span class="L">red</span> lost, <span class="D">yellow</span> tied, dashed = within noise, grey = not measured.
★ = each bot's current ranked version; ranked versions have a bold border. Click a box to open it.</p>
<div class="graphwrap" id="lgw"><svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" class="lgraph">
${edges.join("")}${boxes.join("")}</svg></div>
`;
}

export async function lineagePage(D, p) {
  const view = p.get("view") || "lines", bot = p.get("bot") || "", root = p.get("root") || "";
  const hideRejected = pyBool(p.get("hide_rejected"), true), drafts = p.get("drafts") || "all", ranked = pyBool(p.get("ranked"), false);
  const forest = await D.lineage(root || null, bot || null, hideRejected);
  let tabs = [["lines", "Lines"], ["bots", "Every version (results first)"], ["graph", "Graph"], ["tree", "Tree (from the roots)"]]
    .map(([k, t]) => `<a class="${view === k ? "on" : ""}" href="/lineage?view=${k}">${t}</a>`).join("");
  tabs = `<div class="tabs">${tabs}</div>`;
  const botNames = Object.keys(await D.kv("bots")).sort();
  if (view === "lines") return layout("Lineage", `<h1>Lineage</h1>${tabs}` + lineageLines(D, forest), "/api/v1/lineage", "/lineage");
  if (view === "graph") return layout("Lineage", `<h1>Lineage</h1>${tabs}` + lineageGraph(forest), "/api/v1/lineage", "/lineage");
  if (view !== "tree") return layout("Lineage", `<h1>Lineage</h1>${tabs}` + lineageResults(D, forest, bot, ranked, botNames), "/api/v1/lineage", "/lineage");
  const keep = (n) => drafts !== "promoted" || n.lane === "ranked" || n.children.some(keep);
  const verdict = (n) => {
    const vp = n.vs_parent;
    if (!vp || !(vp.W || vp.D || vp.L)) return "";
    const b = vp.beats_parent;
    const [word, cls] = b ? ["beats", "win"] : b === false ? ["loses to", "loss"] : ["ties", "draw"];
    const noise = vp.significant ? "" : ' <span class="chip" title="the 95% interval includes 50%">noise</span>';
    return `<span class="chip ${cls}">${word} parent</span> ${rec(vp)} <span class="muted">${pf(vp.score)}%</span>${noise}`;
  };
  const render = (n, depth = 0) => {
    const kids = n.children.filter(keep);
    const star = n.current ? '<span title="its bot\'s current ranked version">★</span> ' : "";
    const elo = n.elo != null ? ` <span class="muted">elo ${fixed(n.elo, 0)}</span>` : "";
    const first = n.note ? cp(pyStrip(n.note).split(/\r\n|\r|\n/)[0]).slice(0, 140).join("") : "";
    const line = `<span class="node" id="${e(n.id)}">${star}${subLink(D, n.id)} `
      + `<a class="chip" href="/bots/${q(n.bot)}">${e(n.bot)}</a> `
      + `<span class="chip">${e(n.lane)}</span> ${statusChip(n.status)} ${verdict(n)}${elo} `
      + `<span class="muted">${who(n.owner, n.agent)} · ${when(n.created)}</span>`
      + (first ? `<div class="tnote">${e(first)}</div>` : "") + "</span>";
    if (!kids.length) return `<li>${line}</li>`;
    const inner = kids.map((c) => render(c, depth + 1)).join("");
    return `<li><details ${depth < 6 ? "open" : ""}><summary>${line} `
      + `<span class="muted">(${kids.length} child${kids.length !== 1 ? "ren" : ""})</span></summary>`
      + `<ul class="tree">${inner}</ul></details></li>`;
  };
  const trees = forest.filter(keep).map((n) => render(n)).join("");
  const opt = (vals, cur) => ["", ...vals].map((x) => `<option value="${e(x)}"${x === cur ? " selected" : ""}>${e(x) || "any"}</option>`).join("");
  const body = `<h1>Lineage</h1>${tabs}
<p class="sub">Every submission under the one it was built on (its <code>parent</code>), across bots.
Each line shows its verdict against its parent; ★ marks each bot's current ranked version. Lines
that keep beating their parents are where to build next.</p>
<form class="filters" method="get" action="/lineage">
<input type="hidden" name="view" value="tree">
<label>bot<select name="bot">${opt(botNames, bot)}</select></label>
<label>show<select name="drafts"><option value="all"${drafts === "all" ? " selected" : ""}>all submissions</option>
<option value="promoted"${drafts === "promoted" ? " selected" : ""}>ranked only (and their ancestors)</option></select></label>
<label>rejected<select name="hide_rejected"><option value="true"${hideRejected ? " selected" : ""}>hidden</option>
<option value="false"${hideRejected ? "" : " selected"}>shown</option></select></label>
<button type="submit">Show</button> <a href="/lineage">reset</a>
${root ? `<span class="muted">subtree of ${subLink(D, root)} · <a href="/lineage">whole forest</a></span>` : ""}
</form>
${trees ? `<ul class="tree root">${trees}</ul>` : '<p class="muted">nothing to show</p>'}
<script>if (location.hash) { const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (el) { el.classList.add("hl"); el.scrollIntoView({block: "center"}); } }</script>`;
  return layout("Lineage", body, "/api/v1/lineage" + (root ? `?root=${q(root)}` : bot ? `?bot=${q(bot)}` : ""), "/lineage");
}

// ---------------------------------------------------------------- maps
export async function mapsPage(D) {
  const rows = [], retired = [];
  const stats = await D.kv("map_stats");
  const previews = await D.kv("map_previews");
  for (const m of stats) {
    const n = m.games;
    const decided = m.seat_a_wins + m.seat_b_wins;
    const adv = decided ? `${fixed(100 * m.seat_a_wins / decided, 0)}%` : "-";
    const ends = Object.entries(m.ends).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${e(k)} ${v}`).join(", ");
    const preview = mapFile(previews, m.suite, m.map) ? `<a href="/maps/${q(m.suite)}/${q(m.map)}">preview</a>` : "";
    (m.current ? rows : retired).push([e(m.suite), e(m.map), String(n), String(m.seat_a_wins), String(m.seat_b_wins), String(m.draws), adv,
      pf(m.rounds_mean), `<td class="note">${ends}</td>`, preview, `<a href="/games?map=${q(m.map)}&suite=${q(m.suite)}">games</a>`]);
  }
  const played = new Set(stats.map((m) => `${m.suite}/${m.map}`));
  const unplayed = [];
  const files = await D.kv("suite_files");
  for (const suite of ["server", "official", "tournament", "custom", "rotating"]) {
    for (const stem of files[suite] || []) if (!played.has(`${suite}/${stem}`)) unplayed.push(`<a href="/maps/${q(suite)}/${q(stem)}">${e(suite)}/${e(stem)}</a>`);
  }
  const head = ["suite", "map", "games", "A wins", "B wins", "draws", "A wins %", "rounds mean", "how games end", "", ""];
  const body = `<h1>Maps</h1>
<p class="sub">The maps the arena plays now, with every game on them so far (checks and holdout
excluded). "A wins %" is seat A's share of decided games: the first-seat advantage. Maps that
were replaced or removed are under "Retired maps" at the bottom.</p>
${table(head, rows, new Set([2, 3, 4, 5, 6, 7]), "no games yet")}
${unplayed.length ? `<h2>Not played yet</h2><p>${unplayed.join(" · ")}</p>` : ""}
${await uploadsHtml(D)}
${retired.length ? `<details><summary><h2 style="display:inline">Retired maps <span class="sub">${retired.length} maps no longer
played: official copies the server's own versions replaced, past rotating weeks, removed uploads.
Their games stay in the record.</span></h2></summary>
${table(head, retired, new Set([2, 3, 4, 5, 6, 7]))}</details>` : ""}`;
  return layout("Maps", body, ["/api/v1/stats/maps", "/api/v1/maps"], "/maps");
}

export const VISITOR = "ip:browser";                    // pages say who you are; a static visitor has no login
async function uploadsHtml(D) {
  const me = VISITOR;
  const meta = await D.kv("custom_maps");
  const rows = Object.values(meta).sort((a, b) => (a.created < b.created ? 1 : a.created > b.created ? -1 : 0)).filter((m) => m.suite === "custom")
    .map((m) => [`<a href="/maps/custom/${q(m.name)}">${e(m.name)}</a>`, e(m.owner), e((m.size || []).join("x")), when(m.created),
      `<td class="note">${e(m.note || "")}</td>`, `<a href="/games?suite=custom&map=${q(m.name)}">games</a>`, ""]);
  const hidden = Object.values(meta).filter((x) => x.suite === "holdout").length;
  return `<h2>Team maps <span class="sub">uploaded maps every bot plays on</span></h2>
${table(["map", "owner", "size", "uploaded", "note", "", ""], rows, new Set(), "none uploaded yet")}
<p class="muted">${hidden} hidden map(s) uploaded to the holdout (not listed).</p>
<h2>Upload a map</h2>
<p class="sub">A <code>.map</code> file in the unswbc format (make one with the toolkit's map
editor, or <code>worldgen.py</code>). The official judge plays a test game on it first. Public
maps join drafts, placement and continuous games for every bot. <b>Hidden</b> maps go to the
holdout instead: only the top 4 play them, and nobody can see them or their games, so nobody can
tune to them. Uploading as <b>${e(me)}</b>.</p>
<form id="mapform" class="stack" onsubmit="return upMap(event)">
<label>file</label><span><input type="file" name="file" accept=".map,text/plain" required></span>
<label>name</label><span><input name="name" placeholder="from the file name if empty"></span>
<label>note</label><span><input name="note" placeholder="what it tests: chokepoints, open field, ..."></span>
<label>hidden</label><span><input type="checkbox" name="hidden" value="true"> holdout (not listed)</span>
<span></span><span><button type="submit">Upload</button> <span id="mapmsg" class="muted"></span></span>
</form>
<script>
async function upMap(ev) {
  ev.preventDefault();
  const f = new FormData(document.getElementById("mapform"));
  if (!f.get("hidden")) f.delete("hidden");
  const msg = document.getElementById("mapmsg");
  msg.textContent = "checking with the judge...";
  const r = await fetch("/api/v1/maps", {method: "POST", body: f});
  const d = await r.json();
  if (!r.ok) { msg.textContent = d.detail || ("HTTP " + r.status); return false; }
  msg.textContent = "added " + d.name + " (" + d.suite + "); " + d.check;
  setTimeout(() => location.reload(), 1200);
  return false;
}
async function rmMap(name) {
  if (!confirm("Remove " + name + "? Its games stay.")) return;
  const r = await fetch("/api/v1/maps/custom/" + encodeURIComponent(name), {method: "DELETE"});
  if (r.ok) location.reload(); else alert((await r.json()).detail);
}
</script>`;
}

export function mapFile(previews, suite, name) {
  if (["holdout", "check"].includes(suite) || !/^[\w .-]+$/.test(name) || name.startsWith(".")) return null;
  return previews[`${suite}/${name}`] || null;
}
export async function mapPreview(D, suite, name) {
  const sha = mapFile(await D.kv("map_previews"), suite, name);
  if (!sha) throw new HTTPError(404, `no map ${suite}/${name}`);
  const header = `<div class="gh"><a class="home" href="/">tokenz-arena</a>`
    + `<span>${e(suite)}/${e(name)} <span style="color:#9d9d9d">(map editor; changes are not saved)</span></span>`
    + `<span class="r"><a href="/games?map=${q(name)}&suite=${q(suite)}">games</a> · <a href="/maps">all maps</a></span></div>`;
  const head = `<style>.gh { display: flex; gap: 16px; padding: 6px 14px; background: #0d0e10;
border-bottom: 1px solid #2b2b2b; font-size: 13px; color: #ddd; } .gh a { color: #6ea2ff;
text-decoration: none; } .gh .home { font-weight: 700; color: #fff; } .gh .r { margin-left: auto; }</style>`;
  return { html: viewer.mapPage(await D.mapText(sha), `${suite}/${name}`, { header, head }) };
}

// ---------------------------------------------------------------- ideas
export async function ideasPage(D, p) {
  const text = p.get("q") || "", bot = p.get("bot") || "", outcome = p.get("outcome") || "";
  let limit = parseInt(p.get("limit") || "50", 10);
  limit = Math.max(1, Math.min(limit, 500));
  const found = await D.ideas(text, bot || null, outcome || null, limit);
  const outs = ["beat_parent", "lost_to_parent", "tied_parent", "no_parent", "pending", "rejected", "promoted"];
  const sel = outs.map((o) => `<option value="${o}"${o === outcome ? " selected" : ""}>${e((OUTCOME[o] || [o])[0])}</option>`).join("");
  const bots = Object.keys(await D.kv("bots")).sort().map((b) => `<option value="${e(b)}"${b === bot ? " selected" : ""}>${e(b)}</option>`).join("");
  const form = `<form class="filters" method="get" action="/ideas">
<label>search notes<input name="q" value="${e(text)}" size="32" placeholder="e.g. corridor farm"
 autofocus></label>
<label>bot<select name="bot"><option value="">any</option>${bots}</select></label>
<label>outcome<select name="outcome"><option value="">any</option>${sel}</select></label>
<button type="submit">Search</button> <a href="/ideas">clear</a></form>`;
  const items = found.map((x) => {
    const v = x.verdict || {};
    const opp = (v.opponents || []).filter((o) => o.opponent !== (x.parent || "")).map((o) => `<span class="chip">${e(o.opponent)} ${rec(o)}</span>`).join(" ");
    return `<div class="idea"><div class="head">
<b>${subLink(D, x.id)}</b> ${outcomeChip(x.outcome)}
${x.promoted && x.outcome !== "rejected" ? '<span class="chip win">promoted</span>' : ""}
<span class="muted">${who(x.owner, x.agent)} · ${when(x.created)}</span>
${x.parent ? `<span>parent ${subLink(D, x.parent, true)}: ${parentVerdict(v)}</span>` : ""}
</div>
${x.reason ? `<div class="flash err">${e(x.reason)}</div>` : ""}
<pre>${e(x.note) || '<span class="muted">(no note)</span>'}</pre>
${opp ? `<div class="sub">vs top: ${opp}</div>` : ""}
${x.source ? `<div class="sub">source: ${sourceLink(x.source)}</div>` : ""}
</div>`;
  });
  const params = Object.fromEntries(Object.entries({ q: text, bot, outcome }).filter(([, v]) => v));
  const api = "/api/v1/ideas" + (Object.keys(params).length ? "?" + urlencode(params) : "");
  const body = `<h1>Ideas</h1><p class="sub">Every submission's note with what happened to it: the team's experiment log, newest first.</p>${form}`
    + `<p class="sub">${found.length} found</p>` + (items.join("") || '<p class="muted">Nothing matches.</p>');
  return layout("Ideas", body, api, "/ideas");
}

// ---------------------------------------------------------------- submit / queue / server
export async function submitPage(D) {
  const bots = Object.keys(await D.kv("bots")).sort().map((b) => `<option value="${e(b)}">`).join("");
  const parents = (await D.subsAll()).slice().sort((a, b) => (a.created < b.created ? 1 : a.created > b.created ? -1 : 0))
    .filter((x) => !["external", "rejected"].includes(x.status)).map((x) => `<option value="${e(x.id)}">${e(x.bot)} · ${e(x.status)}</option>`).join("");
  const ownerRow = `<label for="owner">owner</label><input id="owner" name="owner"
 placeholder="only for shared (tagged) machines">`;
  const body = `<h1>Submit a bot</h1>
<p>Submitting as <b>${e(VISITOR)}</b> (browser)
<span class="muted">· no Tailscale user login here (local or tagged device), so you may set owner</span></p>
<form id="sub" class="stack" method="post" action="/api/v1/submissions" enctype="multipart/form-data">
<label for="file">zip</label><input id="file" type="file" name="file" accept=".zip" required>
<label for="bot">bot</label><input id="bot" name="bot" list="bots" required
 placeholder="the bot's name; its submissions form a line">
<label for="parent">parent</label><input id="parent" name="parent" list="parents"
 placeholder="the submission this builds on (optional)">
<label for="note">note</label><textarea id="note" name="note"
 placeholder="The hypothesis and what changed (markdown)"></textarea>
<label for="source">source</label><input id="source" name="source"
 placeholder="https://github.com/org/repo/tree/<sha>/bots/name (optional)">
<label for="lane">lane</label><select id="lane" name="lane">
<option value="draft" selected>draft: plays its parent and the top 3, unranked</option>
<option value="ranked">ranked: full placement, joins the leaderboard</option></select>
<label for="agent">agent</label><input id="agent" name="agent"
 placeholder="optional label, e.g. worker-3">
${ownerRow}
<span></span><span><button type="submit">Submit</button></span>
</form>
<div id="out"></div>
<datalist id="bots">${bots}</datalist><datalist id="parents">${parents}</datalist>
<p class="sub">Agents: <code>curl -F file=@bot.zip -F bot=NAME -F parent=ID -F note=... \\
http://&lt;arena&gt;/api/v1/submissions</code>. See <a href="/llms.txt">/llms.txt</a>.</p>
<script>
const f = document.getElementById("sub"), out = document.getElementById("out");
f.onsubmit = async (ev) => {
  ev.preventDefault();
  const b = f.querySelector("button"); b.disabled = true;
  out.className = "flash"; out.textContent = "uploading…";
  const fd = new FormData(f);
  for (const k of ["parent", "source", "agent", "owner"]) if (fd.get(k) === "") fd.delete(k);
  try {
    const r = await fetch(f.action, {method: "POST", body: fd});
    const j = await r.json();
    if (!r.ok) throw new Error(typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail));
    out.textContent = "";
    const a = document.createElement("a");
    a.href = "/s/" + encodeURIComponent(j.id); a.textContent = j.id;
    out.append(j.duplicate ? "Already submitted as " : "Submitted: ", a,
               " (" + j.status + "). The draft verdict follows in a few minutes.");
  } catch (err) {
    out.className = "flash err"; out.textContent = "Rejected: " + err.message;
  } finally { b.disabled = false; }
};
</script>`;
  return layout("Submit", body, "/api/v1/submissions", "/submit");
}

export { QUEUE_BODY } from "./queue.js";
export async function serverPage() {
  const body = '<h1>Competition server</h1><div class="flash">The server bridge isn\'t '
    + "configured on this arena (no server key), so there's nothing to show.</div>";
  return layout("Server", body, "/api/v1/server", "/server");
}

// ---------------------------------------------------------------- Python bits
export function pyRound(x, d) {           // round(x, d) on a float, half to even
  return Number(fixed(x, d));
}
export function pyRepr(x) {               // repr() of a str
  const str = String(x);
  return str.includes("'") && !str.includes('"') ? `"${str}"` : `'${str.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}
export function pyBool(v, dflt) {         // FastAPI's bool query parameter
  if (v == null) return dflt;
  return ["1", "true", "on", "yes"].includes(v.toLowerCase());
}
export function pyJson(x) {               // json.dumps(x) (ensure_ascii)
  return JSON.stringify(x).replace(/[\u007f-￿]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
}
export function pyJsonIndent(x, indent) { // json.dumps(x, indent=n)
  const pad = (n) => "\n" + " ".repeat(n * indent);
  const go = (v, lvl) => {
    if (v === null) return "null";
    if (Array.isArray(v)) return v.length ? "[" + v.map((y) => pad(lvl + 1) + go(y, lvl + 1)).join(",") + pad(lvl) + "]" : "[]";
    if (typeof v === "object") {
      const ks = Object.keys(v);
      return ks.length ? "{" + ks.map((k) => pad(lvl + 1) + pyJson(k) + ": " + go(v[k], lvl + 1)).join(",") + pad(lvl) + "}" : "{}";
    }
    return pyJson(v);
  };
  return go(x, 0);
}
