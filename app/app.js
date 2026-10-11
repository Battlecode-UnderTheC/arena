// tokenz arena, static: hash routes over the exported SQLite database and JSON summaries.
import { q, data } from "./db.js";
import { canRun, play, viewer } from "./play.js";

const main = document.getElementById("main");
const PAGE = 50;
const DEATHS = ["wall", "self", "other", "head-on", "no action"];
const STAT_KEYS = ["turns", "moves", "sprints", "splits", "sonars", "died", "dragons used", "errors", "CPU overruns",
  "max points"];

// ---------------------------------------------------------------- helpers
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const h = (strings, ...vals) => strings.reduce((o, s, i) => o + s + (i < vals.length ? vals[i] : ""), "");
const num = (n) => (n == null ? "" : Number(n).toLocaleString("en"));
const pct = (w, n) => (n ? `${Math.round((100 * w) / n)}%` : "");
const when = (s) => (s ? s.replace("T", " ").replace(/:\d\dZ$|Z$/, "") : "");
const botLink = (id) => (!id ? "" : id.startsWith("server:") ? `<span title="competition server team">${esc(id)}</span>`
  : `<a href="#/bot/${encodeURIComponent(id)}">${esc(id)}</a>`);
const gameLink = (id, text) => `<a href="#/game/${id}">${text ?? "#" + id}</a>`;
const mapLink = (g) => (g.map_id ? `<a href="#/map/${g.map_id}">${esc(g.map)}</a>` : esc(g.map));
const elo = (e, err) => (e == null ? "" : `${e.toFixed(0)}${err ? ` <span class="muted">±${err.toFixed(0)}</span>` : ""}`);
const set = (html) => { main.innerHTML = html; };
const params = () => new URLSearchParams(location.hash.split("?")[1] || "");
function hashWith(base, p) {
  const s = new URLSearchParams(Object.entries(p).filter(([, v]) => v !== "" && v != null)).toString();
  return `#${base}${s ? "?" + s : ""}`;
}
function result(g, me) {
  if (!g.winner) return "D";
  return (g.winner === "A") === (g.a === me) ? "W" : "L";
}
function record(w, l, d) {
  return `<span class="W">${num(w)}</span>–<span class="L">${num(l)}</span>–<span class="D">${num(d)}</span>`;
}
const withScore = (r) => ({ ...r, score: r.games ? (r.wins + r.draws / 2) / r.games : null });
async function botsById() {
  const m = {};
  for (const b of await data("bots.json")) m[b.id] = b;
  return m;
}

// sortable client-side table: cols = [{k, label, num, fmt(row)}]
function table(rows, cols, { id = "t", sort = null } = {}) {
  const st = { k: sort?.k, dir: sort?.dir ?? -1 };
  const render = () => {
    const r = st.k ? rows.slice().sort((x, y) => {
      const a = x[st.k], b = y[st.k];
      return (a == null) - (b == null) || (a < b ? -1 : a > b ? 1 : 0) * st.dir;
    }) : rows;
    return `<div class="scroll"><table id="${id}"><thead><tr>${cols.map((c) =>
      `<th class="sort ${c.num ? "num" : ""} ${c.cls || ""}" data-k="${c.k}">${c.label}${st.k === c.k ? (st.dir < 0 ? " ↓" : " ↑") : ""}</th>`).join("")}
      </tr></thead><tbody>${r.map((row) => `<tr>${cols.map((c) =>
      `<td class="${c.num ? "num" : ""} ${c.cls || ""}">${c.fmt ? c.fmt(row) : esc(row[c.k])}</td>`).join("")}</tr>`).join("")}
      </tbody></table></div>`;
  };
  const html = `<div data-table="${id}">${render()}</div>`;
  queueMicrotask(() => {
    const host = document.querySelector(`[data-table="${id}"]`);
    if (!host) return;
    host.addEventListener("click", (e) => {
      const th = e.target.closest("th[data-k]");
      if (!th) return;
      const k = th.dataset.k;
      st.dir = st.k === k ? -st.dir : (cols.find((c) => c.k === k)?.num ? -1 : 1);
      st.k = k;
      host.innerHTML = render();
    });
  });
  return html;
}

function gamesTable(games, me = null) {
  return table(games, [
    { k: "id", label: "game", num: true, fmt: (g) => gameLink(g.id) },
    { k: "played", label: "played", fmt: (g) => `<span class="muted">${when(g.played)}</span>` },
    { k: "lane", label: "lane", fmt: (g) => `<span class="tag">${esc(g.lane)}</span>` },
    { k: "map", label: "map", fmt: mapLink },
    { k: "a", label: "A", fmt: (g) => `<span class="ta">●</span> ${botLink(g.a)}` },
    { k: "b", label: "B", fmt: (g) => `<span class="tb">●</span> ${botLink(g.b)}` },
    ...(me ? [{ k: "res", label: "", fmt: (g) => `<span class="${result(g, me)}">${result(g, me)}</span>` }] : []),
    { k: "winner", label: "winner", fmt: (g) => (g.error ? `<span class="err">error</span>` : g.winner ? `<span class="${g.winner === "A" ? "ta" : "tb"}">${g.winner}</span>` : "draw") },
    { k: "rounds", label: "rounds", num: true },
    { k: "reason", label: "reason", cls: "hide-sm", fmt: (g) => `<span class="muted">${esc(g.reason)}</span>` },
  ], { id: "games" });
}

const GAME_COLS = "g.id, g.lane, g.suite, g.map, g.map_id, g.a, g.b, g.winner, g.rounds, g.reason, g.played, g.error, g.rated, g.replayable";

function pager(base, p, n) {
  const page = +(p.get("page") || 0);
  const prev = page > 0 ? `<a href="${hashWith(base, { ...Object.fromEntries(p), page: page - 1 || "" })}">← newer</a>` : `<span class="muted">← newer</span>`;
  const next = n === PAGE ? `<a href="${hashWith(base, { ...Object.fromEntries(p), page: page + 1 })}">older →</a>` : `<span class="muted">older →</span>`;
  return `<div class="pager">${prev}<span class="muted">page ${page + 1}</span>${next}</div>`;
}

// ---------------------------------------------------------------- pages
async function leaderboard() {
  const [board, info] = await Promise.all([data("leaderboard.json"), data("info.json")]);
  set(h`
    <h1>Leaderboard</h1>
    <p class="muted">The arena's final Bradley–Terry ratings, frozen when it shut down (${when(info.last)} UTC):
      each active line's current ranked submission, rated on local games over public maps.</p>
    <div class="cards">
      <div class="card"><div class="v">${num(info.games)}</div><div class="k">games</div></div>
      <div class="card"><div class="v">${num(info.replayable)}</div><div class="k">re-runnable in this browser</div></div>
      <div class="card"><div class="v">${num(info.bots)}</div><div class="k">bots</div></div>
      <div class="card"><div class="v">${num(info.maps)}</div><div class="k">maps</div></div>
      <div class="card"><div class="v">${num(info.lanes.duel)}</div><div class="k">duel games</div></div>
      <div class="card"><div class="v">${num(info.evals)}</div><div class="k">server games seen</div></div>
    </div>
    ${table(board.map((b, i) => ({ ...b, rank: i + 1 })), [
      { k: "rank", label: "#", num: true },
      { k: "id", label: "bot", fmt: (b) => botLink(b.id) },
      { k: "line", label: "line", cls: "hide-sm" },
      { k: "elo", label: "Elo", num: true, fmt: (b) => elo(b.elo, b.err) },
      { k: "rated_games", label: "rated games", num: true, fmt: (b) => num(b.rated_games) },
      { k: "games", label: "all games", num: true, cls: "hide-sm", fmt: (b) => num(b.games) },
      { k: "wins", label: "W–L–D (all)", num: true, fmt: (b) => record(b.wins, b.losses, b.draws) },
      { k: "owner", label: "owner", cls: "hide-sm", fmt: (b) => `<span class="muted">${esc(b.owner)}</span>` },
    ], { id: "board", sort: { k: "elo", dir: -1 } })}`);
}

async function botsPage() {
  const all = await data("bots.json");
  const p = params();
  const f = (p.get("q") || "").toLowerCase();
  const rows = all.filter((b) => !f || b.id.toLowerCase().includes(f) || (b.line || "").toLowerCase().includes(f) || (b.owner || "").toLowerCase().includes(f));
  set(h`
    <h1>Bots</h1>
    <p class="muted">Every bot that played in the arena or a duel (${num(all.length)}), including drafts and temporary duel bots.</p>
    <div class="filters"><input id="f" placeholder="filter by name, line or owner" value="${esc(p.get("q") || "")}" size="34"></div>
    ${table(rows, [
      { k: "id", label: "bot", fmt: (b) => botLink(b.id) },
      { k: "line", label: "line", cls: "hide-sm" },
      { k: "lane", label: "lane", fmt: (b) => (b.lane ? `<span class="tag">${esc(b.lane)}</span>` : b.ephemeral ? `<span class="tag">duel</span>` : "") },
      { k: "elo", label: "Elo", num: true, fmt: (b) => elo(b.elo, b.err) },
      { k: "games", label: "games", num: true, fmt: (b) => num(b.games) },
      { k: "wins", label: "W–L–D", num: true, fmt: (b) => record(b.wins, b.losses, b.draws) },
      { k: "last_played", label: "last played", cls: "hide-sm", fmt: (b) => `<span class="muted">${when(b.last_played)}</span>` },
      { k: "owner", label: "owner", cls: "hide-sm", fmt: (b) => `<span class="muted">${esc(b.owner)}</span>` },
    ], { id: "bots", sort: { k: "last_played", dir: -1 } })}`);
  const inp = document.getElementById("f");
  inp.addEventListener("change", () => { location.hash = hashWith("/bots", { q: inp.value }); });
}

async function botPage(id) {
  const bots = await botsById();
  const b = bots[id];
  if (!b) return set(`<h1>${esc(id)}</h1><p>No such bot.</p>`);
  const p = params();
  const page = +(p.get("page") || 0);
  set(`<h1>${esc(id)}</h1><p class="muted">Loading…</p>`);
  const [[full], h2h, maps, games, duels] = await Promise.all([
    q("SELECT * FROM bots WHERE id = ?", id),
    q("SELECT * FROM h2h WHERE bot = ? ORDER BY games DESC", id),
    q("SELECT * FROM botmap WHERE bot = ? ORDER BY games DESC", id),
    q(`SELECT ${GAME_COLS} FROM games g WHERE g.id IN (SELECT id FROM games WHERE a = ?1 UNION ALL SELECT id FROM games WHERE b = ?1
       ORDER BY id DESC LIMIT ${PAGE} OFFSET ${page * PAGE}) ORDER BY g.id DESC`, id),
    q("SELECT * FROM duels WHERE a = ?1 OR b = ?1 ORDER BY created DESC", id),
  ]);
  const children = Object.values(bots).filter((x) => x.parent === id);
  set(h`
    <h1>${esc(id)}</h1>
    <div class="row muted">
      ${b.line ? `<span>line <b>${esc(b.line)}</b></span>` : ""}
      ${b.owner ? `<span>${esc(b.owner)}</span>` : ""}
      ${b.lane ? `<span class="tag">${esc(b.lane)}</span>` : ""}
      ${b.status ? `<span class="tag">${esc(b.status)}</span>` : ""}
      ${b.agent ? `<span>agent ${esc(b.agent)}</span>` : ""}
      ${b.parent ? `<span>parent ${botLink(b.parent)}</span>` : ""}
      ${children.length ? `<span>children ${children.map((c) => botLink(c.id)).join(", ")}</span>` : ""}
    </div>
    <div class="cards">
      <div class="card"><div class="v">${b.elo != null ? elo(b.elo, b.err) : "—"}</div><div class="k">final Elo${b.elo == null ? " (not current at the end)" : ""}</div></div>
      <div class="card"><div class="v">${num(b.games)}</div><div class="k">games (arena)</div></div>
      <div class="card"><div class="v">${record(b.wins, b.losses, b.draws)}</div><div class="k">W–L–D</div></div>
      <div class="card"><div class="v">${pct(b.wins + b.draws / 2, b.games)}</div><div class="k">score</div></div>
      <div class="card"><div class="v">${b.runnable ? "yes" : "no"}</div><div class="k">wasm (re-runnable)</div></div>
    </div>
    ${full?.note ? `<h2>Notes</h2><div class="note">${esc(full.note)}</div>` : ""}
    ${b.runnable ? `<p><a href="${full.wasm}" download="${esc(id)}.wasm.gz">metered wasm</a> <span class="muted">(gzip; exactly what the judge ran)</span></p>` : ""}
    <h2>Head-to-head</h2>
    ${h2h.length ? table(h2h.map((r) => ({ ...withScore(r), opp_elo: bots[r.opp]?.elo ?? null })), [
      { k: "opp", label: "opponent", fmt: (r) => botLink(r.opp) },
      { k: "games", label: "games", num: true, fmt: (r) => num(r.games) },
      { k: "wins", label: "W–L–D", num: true, fmt: (r) => record(r.wins, r.losses, r.draws) },
      { k: "score", label: "score", num: true, fmt: (r) => pct(r.wins + r.draws / 2, r.games) },
      { k: "rated", label: "rated", num: true, cls: "hide-sm", fmt: (r) => num(r.rated) },
      { k: "opp_elo", label: "their Elo", num: true, cls: "hide-sm", fmt: (r) => elo(bots[r.opp]?.elo) },
    ], { id: "h2h", sort: { k: "games", dir: -1 } }) : `<p class="muted">No arena games.</p>`}
    <h2>By map</h2>
    ${maps.length ? table(maps.map(withScore), [
      { k: "map", label: "map", fmt: mapLink },
      { k: "games", label: "games", num: true },
      { k: "wins", label: "W–L–D", num: true, fmt: (r) => record(r.wins, r.losses, r.draws) },
      { k: "score", label: "score", num: true, fmt: (r) => pct(r.wins + r.draws / 2, r.games) },
    ], { id: "maps", sort: { k: "games", dir: -1 } }) : `<p class="muted">No arena games.</p>`}
    ${duels.length ? `<h2>Duels</h2>${duelsTable(duels)}` : ""}
    <h2>Games</h2>
    ${gamesTable(games, id)}
    ${pager(`/bot/${encodeURIComponent(id)}`, p, games.length)}`);
}

async function gamesPage() {
  const p = params();
  const page = +(p.get("page") || 0);
  const where = [], args = [];
  if (p.get("lane")) { where.push("lane = ?"); args.push(p.get("lane")); }
  if (p.get("map")) { where.push("map = ?"); args.push(p.get("map")); }
  if (p.get("bot")) { where.push("(a = ? OR b = ?)"); args.push(p.get("bot"), p.get("bot")); }
  if (p.get("rated")) where.push("rated = 1");
  if (p.get("runnable")) where.push("replayable = 1");
  const info = await data("info.json");
  set(`<h1>Games</h1><p class="muted">Loading…</p>`);
  const games = await q(`SELECT ${GAME_COLS} FROM games g ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY g.id DESC LIMIT ${PAGE} OFFSET ${page * PAGE}`, ...args);
  const lanes = Object.entries(info.lanes).sort((a, b) => b[1] - a[1]);
  set(h`
    <h1>Games</h1>
    <p class="muted">${num(info.games)} games, newest first. Lanes: ${lanes.map(([l, n]) => `${esc(l)} ${num(n)}`).join(", ")}.
      Duel games aren't in ratings; <i>server</i> games are the real competition-server battles the arena imported (no re-run: the opponents' code isn't ours).</p>
    <div class="filters">
      <select id="lane"><option value="">all lanes</option>${lanes.map(([l]) => `<option ${p.get("lane") === l ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>
      <input id="bot" placeholder="bot" value="${esc(p.get("bot") || "")}">
      <input id="map" placeholder="map name" value="${esc(p.get("map") || "")}">
      <label><input type="checkbox" id="rated" ${p.get("rated") ? "checked" : ""}> rated only</label>
      <label><input type="checkbox" id="runnable" ${p.get("runnable") ? "checked" : ""}> re-runnable only</label>
    </div>
    ${gamesTable(games)}
    ${pager("/games", p, games.length)}`);
  const go = () => {
    location.hash = hashWith("/games", { lane: lane.value, bot: bot.value.trim(), map: map.value.trim(),
      rated: rated.checked ? 1 : "", runnable: runnable.checked ? 1 : "" });
  };
  const [lane, bot, map, rated, runnable] = ["lane", "bot", "map", "rated", "runnable"].map((x) => document.getElementById(x));
  for (const el of [lane, bot, map, rated, runnable]) el.addEventListener("change", go);
}

function statsTable(stats) {
  if (!stats) return "";
  const s = JSON.parse(stats);
  const rows = STAT_KEYS.map((k, i) => ({ k, A: s.A?.[i], B: s.B?.[i] }))
    .concat([{ k: "points p50", A: s.A?.[10], B: s.B?.[10] }])
    .concat(DEATHS.map((k, i) => ({ k: "deaths: " + k, A: s.A?.[11 + i], B: s.B?.[11 + i] })));
  return `<div class="scroll"><table><thead><tr><th></th><th class="num ta">A</th><th class="num tb">B</th></tr></thead><tbody>${
    rows.map((r) => `<tr><td class="muted">${r.k}</td><td class="num">${num(r.A)}</td><td class="num">${num(r.B)}</td></tr>`).join("")}</tbody></table></div>`;
}

let current = null;   // the game being re-run: leaving the page aborts it
async function gamePage(id) {
  set(`<h1>Game #${esc(id)}</h1><p class="muted">Loading…</p>`);
  const rows = await q("SELECT g.*, m.sha AS map_sha, m.name AS map_name FROM games g LEFT JOIN maps m ON m.id = g.map_id WHERE g.id = ?", +id);
  const g = rows[0];
  const bots = {};
  if (g) for (const b of await q("SELECT id, wasm FROM bots WHERE id IN (?, ?)", g.a, g.b)) bots[b.id] = b;
  if (!g) return set(`<h1>Game #${esc(id)}</h1><p>No such game.</p>`);
  const meta = g.meta ? JSON.parse(g.meta) : {};
  const blocked = g.replayable ? canRun() : null;
  set(h`
    <h1>Game #${g.id}: ${botLink(g.a)} vs ${botLink(g.b)}</h1>
    <div class="row">
      <span class="tag">${esc(g.lane)}</span>
      ${g.duel ? `<span>duel <a href="#/duel/${esc(g.duel)}">${esc(g.duel)}</a> game ${g.duel_n}</span>` : ""}
      <span>${mapLink(g)} <span class="muted">(${esc(g.suite)})</span></span>
      <span class="muted">${when(g.played)} UTC</span>
      ${g.rated ? `<span class="tag">rated</span>` : ""}
    </div>
    <p style="font-size:16px">
      ${g.error ? `<span class="err">error: ${esc(g.error)}</span>` : g.winner
        ? `<b class="${g.winner === "A" ? "ta" : "tb"}">${esc(g.winner === "A" ? g.a : g.b)}</b> (${g.winner}) wins after ${g.rounds} rounds — ${esc(g.reason)}`
        : `Draw after ${g.rounds} rounds — ${esc(g.reason)}`}
    </p>
    <div class="kv mono">
      <div>seed</div><div>${esc(g.seed)}</div>
      <div>engine / judge</div><div>${esc(g.engine || "?")} / ${esc(g.judge || "?")}</div>
      ${g.map_sha ? `<div>map sha256</div><div>${esc(g.map_sha)}</div>` : ""}
      ${Object.entries(meta).filter(([, v]) => v != null && typeof v !== "object").map(([k, v]) => `<div>${esc(k)}</div><div>${esc(v)}</div>`).join("")}
    </div>
    <h2>Replay</h2>
    ${g.replayable
      ? blocked ? `<p class="err">${esc(blocked)}</p>`
        : `<p class="muted">Replays aren't stored: your browser re-plays the game from the map, the seed and both bots' metered wasm
             with the official engine, as the judge did (CPU points, clock and random numbers included). It takes about as long as the original
             (${g.seconds ? Math.round(g.seconds) + " s on the arena's worker" : "up to a few minutes"}) and uses all your cores.</p>
           <button class="primary" id="run">Re-run game</button> <span id="status" class="muted"></span>
           <div class="bar"><div id="prog"></div></div>
           <div id="check"></div>
           <iframe class="viewer" id="vf" src="viewer/index.html" title="replay viewer"></iframe>`
      : `<p class="muted">${g.lane === "server" ? "A competition-server battle: the opponent's code isn't ours, so it can't be re-run here."
        : !g.map_sha ? "The exact map version of this game wasn't recorded, so it can't be re-run."
        : "One of the bots' builds wasn't kept (an expired duel bot), so this game can't be re-run."}</p>`}
    <h2>Stats</h2>
    ${statsTable(g.stats)}`);
  if (!g.replayable || blocked) return;
  const frame = document.getElementById("vf"), v = viewer(frame);
  const status = document.getElementById("status"), prog = document.getElementById("prog"), btn = document.getElementById("run");
  let urlNow = null;
  const show = (bytes, name) => {
    if (urlNow) URL.revokeObjectURL(urlNow);
    urlNow = URL.createObjectURL(new Blob([bytes]));
    v.show({ type: "open", name, url: urlNow });
  };
  btn.onclick = async () => {
    btn.disabled = true;
    current?.abort();
    const token = (current = new AbortController());
    try {
      const r = await play(g, bots, {
        signal: token.signal,
        onStatus: (s) => { status.textContent = s; },
        onRound: (m) => {
          if (current !== token) return;
          prog.style.width = `${(100 * (m.round + 1)) / 500}%`;
          status.textContent = `round ${m.round + 1} · dragons ${m.alive[0]} vs ${m.alive[1]} · ${m.seconds.toFixed(0)} s`;
        },
        onPartial: (m) => { if (current === token) show(m.replay, `${g.a} vs ${g.b} (live, round ${m.round})`); },
      });
      if (current !== token) return;
      prog.style.width = "100%";
      show(r.replay, `${g.a} vs ${g.b} on ${g.map}`);
      const same = r.winner === g.winner && r.rounds === g.rounds;
      status.textContent = `done in ${r.wall.toFixed(0)} s`;
      document.getElementById("check").innerHTML = `<p class="${same ? "W" : "L"}">${same ? "✓ Same result as the arena recorded" : "✗ Different from the arena's record"}:
        ${r.winner ? `${esc(r.winner === "A" ? g.a : g.b)} (${r.winner}) wins` : "draw"} after ${r.rounds} rounds — ${esc(r.reason)}.
        <a id="dl" download="game-${g.id}.replay">download replay</a></p>`;
      document.getElementById("dl").href = urlNow;
    } catch (e) {
      if (token.signal.aborted) return;
      status.innerHTML = `<span class="err">${esc(e.message || e)}</span>`;
    } finally {
      btn.disabled = false;
    }
  };
}

function duelsTable(duels) {
  return table(duels, [
    { k: "id", label: "duel", fmt: (d) => `<a href="#/duel/${esc(d.id)}">${esc(d.id)}</a>` },
    { k: "created", label: "created", fmt: (d) => `<span class="muted">${when(d.created)}</span>` },
    { k: "a", label: "A", fmt: (d) => botLink(d.a) },
    { k: "b", label: "B", fmt: (d) => botLink(d.b) },
    { k: "a_wins", label: "A–B–draw", num: true, fmt: (d) => record(d.a_wins, d.b_wins, d.draws) },
    { k: "games", label: "games", num: true },
    { k: "owner", label: "by", cls: "hide-sm", fmt: (d) => `<span class="muted">${esc(d.owner)}</span>` },
    { k: "note", label: "note", cls: "hide-sm wrap", fmt: (d) => `<span class="muted">${esc((d.note || "").slice(0, 90))}</span>` },
  ], { id: "duels", sort: { k: "created", dir: -1 } });
}

async function duelsPage() {
  const duels = await data("duels.json");
  set(h`<h1>Duels</h1>
    <p class="muted">${num(duels.length)} duels: one bot against another on chosen maps and seeds, often a temporary bot, outside the ratings.</p>
    ${duelsTable(duels)}`);
}

async function duelPage(id) {
  set(`<h1>${esc(id)}</h1><p class="muted">Loading…</p>`);
  const [[d], games] = await Promise.all([
    q("SELECT * FROM duels WHERE id = ?", id),
    q(`SELECT ${GAME_COLS} FROM games g WHERE duel = ? ORDER BY duel_n`, id),
  ]);
  if (!d) return set(`<h1>${esc(id)}</h1><p>No such duel.</p>`);
  set(h`<h1>Duel ${esc(id)}: ${botLink(d.a)} vs ${botLink(d.b)}</h1>
    <div class="row muted"><span>${esc(d.owner)}</span><span>${when(d.created)} UTC</span><span class="tag">${esc(d.status)}</span>
      <span>suites ${esc(JSON.parse(d.suites || "[]").join(", "))}</span><span>seeds ${esc(d.seeds)}</span>${d.both_seats ? "<span>both seats</span>" : ""}</div>
    <div class="cards">
      <div class="card"><div class="v">${record(d.a_wins, d.b_wins, d.draws)}</div><div class="k">${esc(d.a)} – ${esc(d.b)} – draws</div></div>
      <div class="card"><div class="v">${num(d.games)} / ${num(d.games_planned)}</div><div class="k">games played / planned</div></div>
    </div>
    ${d.note ? `<div class="note">${esc(d.note)}</div>` : ""}
    <h2>Games</h2>${gamesTable(games, d.a)}`);
}

async function mapsPage() {
  const maps = await data("maps.json");
  set(h`<h1>Maps</h1>
    <p class="muted">${num(maps.length)} map versions by content (a map that changed is listed once per version).
      Suites: server (the competition's maps), official, tournament, custom, rotating (weekly generated sets), holdout (the arena's hidden test maps).</p>
    ${table(maps, [
      { k: "name", label: "map", fmt: (m) => `<a href="#/map/${m.id}">${esc(m.name)}</a>` },
      { k: "names", label: "file", cls: "hide-sm", fmt: (m) => `<span class="muted">${esc(m.names.join(", "))}</span>` },
      { k: "suites", label: "suites", fmt: (m) => m.suites.map((s) => `<span class="tag">${esc(s)}</span>`).join(" ") },
      { k: "games", label: "games", num: true, fmt: (m) => num(m.games) },
      { k: "live", label: "in play at the end", fmt: (m) => (m.live ? "yes" : "") },
      { k: "sha", label: "sha256", cls: "hide-sm", fmt: (m) => `<span class="mono muted">${esc(m.sha.slice(0, 12))}</span>` },
    ], { id: "maps", sort: { k: "games", dir: -1 } })}`);
}

async function mapPage(id) {
  const maps = await data("maps.json");
  const m = maps.find((x) => x.id === +id);
  if (!m) return set(`<h1>Map</h1><p>No such map.</p>`);
  set(`<h1>${esc(m.name)}</h1><p class="muted">Loading…</p>`);
  const p = params();
  const [text, best, games] = await Promise.all([
    fetch(`maps/${m.sha}.map`).then((r) => r.text()),
    q("SELECT * FROM botmap WHERE map_id = ? AND games >= 10 ORDER BY (wins + draws / 2.0) / games DESC LIMIT 25", m.id),
    q(`SELECT ${GAME_COLS} FROM games g WHERE map_id = ? ORDER BY id DESC LIMIT ${PAGE} OFFSET ${(+(p.get("page") || 0)) * PAGE}`, m.id),
  ]);
  set(h`<h1>${esc(m.name)}</h1>
    <div class="row muted">${m.suites.map((s) => `<span class="tag">${esc(s)}</span>`).join(" ")}<span>${num(m.games)} games</span>
      <span class="mono">${esc(m.sha)}</span><a href="maps/${m.sha}.map" download="${esc(m.names[0])}.map">download</a></div>
    <iframe class="viewer" id="vf" src="viewer/index.html?view=map" title="map preview" style="height:min(70vh,640px);margin-top:12px"></iframe>
    <h2>Best scores here <span class="muted">(10+ games)</span></h2>
    ${best.length ? table(best.map(withScore), [
      { k: "bot", label: "bot", fmt: (r) => botLink(r.bot) },
      { k: "games", label: "games", num: true },
      { k: "wins", label: "W–L–D", num: true, fmt: (r) => record(r.wins, r.losses, r.draws) },
      { k: "score", label: "score", num: true, fmt: (r) => pct(r.wins + r.draws / 2, r.games) },
    ], { id: "best" }) : `<p class="muted">Not enough games.</p>`}
    <h2>Games</h2>${gamesTable(games)}${pager(`/map/${m.id}`, p, games.length)}`);
  viewer(document.getElementById("vf")).show({ type: "map", text });
}

async function serverPage() {
  const p = params();
  const page = +(p.get("page") || 0);
  const team = p.get("team") || "";
  set(`<h1>Server</h1><p class="muted">Loading…</p>`);
  const rows = await q(`SELECT * FROM evals ${team ? "WHERE a = ?1 OR b = ?1" : ""} ORDER BY at DESC LIMIT ${PAGE} OFFSET ${page * PAGE}`, ...(team ? [team] : []));
  set(h`<h1>Competition server</h1>
    <p class="muted">Games between the competition's top teams, collected from the server for the arena's evaluation bar.
      Only results here: these can't be re-run (the teams' code isn't public), and their replays are kept outside this site.</p>
    <div class="filters"><input id="team" placeholder="team name" value="${esc(team)}"></div>
    ${table(rows, [
      { k: "id", label: "game", num: true },
      { k: "at", label: "played", fmt: (r) => `<span class="muted">${when(r.at)}</span>` },
      { k: "map", label: "map" },
      { k: "a", label: "A", fmt: (r) => `<a href="${hashWith("/server", { team: r.a })}">${esc(r.a)}</a> <span class="muted">${r.a_elo ?? ""}</span>` },
      { k: "b", label: "B", fmt: (r) => `<a href="${hashWith("/server", { team: r.b })}">${esc(r.b)}</a> <span class="muted">${r.b_elo ?? ""}</span>` },
      { k: "winner", label: "winner", fmt: (r) => (r.winner ? `<span class="${r.winner === "A" ? "ta" : "tb"}">${r.winner}</span>` : "draw") },
      { k: "rounds", label: "rounds", num: true },
      { k: "end", label: "end", cls: "hide-sm", fmt: (r) => `<span class="muted">${esc(r.end)}</span>` },
      { k: "ranked", label: "ranked", cls: "hide-sm", fmt: (r) => (r.ranked ? "yes" : "") },
    ], { id: "evals" })}
    ${pager("/server", p, rows.length)}`);
  const t = document.getElementById("team");
  t.addEventListener("change", () => { location.hash = hashWith("/server", { team: t.value.trim() }); });
}

async function about() {
  const info = await data("info.json");
  set(h`<h1>About</h1>
    <div class="note" style="max-height:none;font-size:14px">The tokenz arena was a team's private league for bots of the unswbc dragons game
(${when(info.first)} to ${when(info.last)} UTC). It played ${num(info.games - info.lanes.duel)} arena games and ${num(info.lanes.duel)} duel games with the official judge (${esc(info.engine)}).

This is a static copy. Its database is read in place from GitHub Pages with HTTP range requests (sql.js-httpvfs), so pages fetch only what they show.

No replays are stored. A game is deterministic given its map, its seed and both bots, and everything is WebAssembly: the page runs the official engine and both bots'
metered builds in your browser, one Web Worker per dragon, with a JavaScript port of the judge's sandbox (CPU points refilled each turn, a virtual clock that advances
with the points a bot spends, random numbers seeded from the match seed). A re-run ends with the same winner, rounds and verdict as the arena recorded.

Lanes: draft (new submissions' first games), placement, continuous (background games among current bots), holdout (games on the arena's hidden maps),
server (real competition-server battles, results only), duel (one-off matchups outside the ratings).

Ratings: Bradley–Terry over rated games (draft, placement and continuous lanes; public maps; current judge and map versions), one virtual draw per pair, on an Elo scale.</div>`);
}

// ---------------------------------------------------------------- router
const routes = [
  [/^\/?$/, leaderboard], [/^\/bots$/, botsPage], [/^\/bot\/(.+)$/, (m) => botPage(decodeURIComponent(m[1]))],
  [/^\/games$/, gamesPage], [/^\/game\/(\d+)$/, (m) => gamePage(m[1])], [/^\/duels$/, duelsPage],
  [/^\/duel\/(.+)$/, (m) => duelPage(decodeURIComponent(m[1]))], [/^\/maps$/, mapsPage], [/^\/map\/(\d+)$/, (m) => mapPage(m[1])],
  [/^\/server$/, serverPage], [/^\/about$/, about],
];
async function route() {
  current?.abort();
  current = null;
  const path = (location.hash.slice(1) || "/").split("?")[0];
  for (const a of document.querySelectorAll("nav a")) {
    const t = a.getAttribute("href").slice(1);
    a.classList.toggle("on", t === "/" ? path === "/" : path.startsWith(t.replace(/s$/, "")));
  }
  for (const [re, fn] of routes) {
    const m = path.match(re);
    if (m) {
      try { await (fn.length ? fn(m) : fn()); }
      catch (e) { set(`<h1>Something went wrong</h1><p class="err">${esc(e.stack || e)}</p>`); }
      window.scrollTo(0, 0);
      return;
    }
  }
  set(`<h1>Not found</h1><p><a href="#/">Leaderboard</a></p>`);
}
window.addEventListener("hashchange", route);
route();
