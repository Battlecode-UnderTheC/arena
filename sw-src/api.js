// The arena's JSON API (api/http.py, api/duels.py, evals/web.py), read-only from the snapshot.
import { HTTPError, VISITOR, pyRepr, pyBool } from "./web/pages.js";

export const ENGINE_DOWN = "the arena engine is unavailable (ConnectError); try again in a moment";

// json.dumps with seeds kept exact (64-bit integers)
export function dumps(x) {
  return JSON.stringify(x, (k, v) => (k === "seed" && v != null && /^-?\d+$/.test(String(v)) ? `__SEED__${v}` : v))
    .replace(/"__SEED__(-?\d+)"/g, "$1");
}

const GAME_KEYS = ["id", "lane", "suite", "map", "seed", "a", "b", "winner", "rounds", "reason", "stats", "replay", "seconds", "error", "played", "meta"];
async function gameJson(D, g, full = false) {
  const stats = await D.gameStats(g.id);
  const d = {};
  for (const k of GAME_KEYS) d[k] = k === "stats" ? stats : g[k] ?? null;
  if (!full) {
    delete d.stats;
    d.summary = Object.fromEntries(Object.entries(stats.teams || {}).map(([k, t]) => [k, { died: t.died ?? null, dragons_used: t.dragons_used ?? null, points_max: t.points_max ?? null }]));
    if (stats.tiebreak) d.summary.tiebreak = stats.tiebreak;
  }
  d.source = g.lane === "server" ? "competition" : "arena";
  d.replay_url = g.replay ? `/api/v1/games/${g.id}/replay` : null;
  d.watch_url = g.replay ? `/games/${g.id}` : null;
  return d;
}

const int = (p, k, d, max = Infinity) => {
  const v = p.get(k);
  if (v == null) return d;
  const n = Number(v);
  if (!Number.isInteger(n) || n > max) throw new HTTPError(422, `${k}: invalid`);
  return n;
};

export async function api(D, path, p) {
  let m;
  if (path === "/api/v1/leaderboard") return D.leaderboard();
  if (path === "/api/v1/submissions") {
    const f = Object.fromEntries(["bot", "owner", "lane", "status", "agent"].map((k) => [k, p.get(k)]));
    const out = (await D.subsAll()).filter((s) => s.status !== "external" && Object.entries(f).every(([k, v]) => !v || s[k] === v))
      .sort((a, b) => (a.created < b.created ? 1 : a.created > b.created ? -1 : 0));
    return Promise.all(out.slice(0, int(p, "limit", 50)).map((s) => D.subJson(s)));
  }
  if ((m = /^\/api\/v1\/submissions\/([^/]+)(\/report|\/metrics|\/source)?$/.exec(path))) {
    const s = await D.sub(decodeURIComponent(m[1]));
    if (!s) throw new HTTPError(404, `no submission ${pyRepr(decodeURIComponent(m[1]))}`);
    if (!m[2]) return D.subJson(s, true);
    if (m[2] === "/report") return D.report(s.id);
    if (m[2] === "/metrics") return D.subMetrics(s.id);
    return { redirect: `source/${encodeURIComponent(s.id)}.zip` };
  }
  if (path === "/api/v1/lineage") return D.lineage(p.get("root"), p.get("bot"), pyBool(p.get("hide_rejected"), false));
  if (path === "/api/v1/bots") {
    const subs = await D.subsAll();
    return Object.entries(D.bots).sort(([a], [b]) => (a < b ? -1 : 1)).map(([name, b]) => ({ bot: name, ...b, submissions: subs.filter((s) => s.bot === name).length }));
  }
  if ((m = /^\/api\/v1\/bots\/([^/]+)$/.exec(path))) {
    const d = await D.botDetail(decodeURIComponent(m[1]));
    if (!d) throw new HTTPError(404, `no bot ${pyRepr(decodeURIComponent(m[1]))}`);
    return d;
  }
  if (path === "/api/v1/ideas") return D.ideas(p.get("q") || "", p.get("bot"), p.get("outcome"), int(p, "limit", 50));
  if (path === "/api/v1/games") {
    const games = await D.findGames({ sub: p.get("sub"), vs: p.get("vs"), map: p.get("map"), suite: p.get("suite"), lane: p.get("lane"),
      result: p.get("result"), limit: int(p, "limit", 50, 1000), source: p.get("source") });
    return Promise.all(games.map((g) => gameJson(D, g)));
  }
  if ((m = /^\/api\/v1\/games\/(\d+)(\/replay|\/metrics)?$/.exec(path))) {
    const g = await D.game(m[1]);
    if (!g || g.suite === "holdout" && m[2]) throw new HTTPError(404, `no game ${m[1]}`);
    if (m[2] === "/replay") throw new HTTPError(404, "replay not kept");
    if (m[2] === "/metrics") throw new HTTPError(404, "no metrics for this game yet (they're computed after the game, or by the background backfill)");
    return gameJson(D, g, true);
  }
  if (path === "/api/v1/metrics") return D.kv("describe");
  if (path === "/api/v1/stats/maps") return D.kv("map_stats");
  if (path === "/api/v1/queue") {
    const snap = { ...((await D.kv("queue")) || { running: [], checking: [], waiting: {}, workers: 0, totals: { left: 0 }, version: 0 }) };
    snap.live = false;
    const at = Date.parse(String(snap.updated));
    snap.age_s = Number.isNaN(at) ? null : Math.round((Date.now() - at) / 1000);
    return snap;
  }
  if (path === "/api/v1/queue/stream") throw new HTTPError(503, "the live queue comes from the engine");
  if (path === "/api/v1/scaler") return { enabled: false };
  if (path === "/api/v1/judge-checks") return { judge: "cpp", every: 50, ...(await D.kv("judge_checks")) };
  if (path === "/api/v1/duels") {
    const owner = p.get("owner");
    return (await D.kv("duels")).filter((u) => !owner || u.owner === owner).slice(0, int(p, "limit", 50));
  }
  if ((m = /^\/api\/v1\/duels\/([^/]+)$/.exec(path))) {
    const d = await D.duel(m[1]);
    if (!d) throw new HTTPError(404, `no duel ${pyRepr(m[1])}`);
    if (!pyBool(p.get("games"), true)) delete d.games;
    return d;
  }
  if ((m = /^\/api\/v1\/duels\/([^/]+)\/games\/(\d+)\/(replay|metrics)$/.exec(path))) {
    if (!(await D.duel(m[1]))) throw new HTTPError(404, `no duel ${pyRepr(m[1])}`);
    throw new HTTPError(404, `no ${m[3]} for game ${m[2]} (not played, or not kept)`);
  }
  if (path === "/api/v1/ephemeral") {
    const owner = p.get("owner");
    return (await D.kv("ephemeral")).filter((x) => !owner || x.owner === owner);
  }
  if ((m = /^\/api\/v1\/ephemeral\/([^/]+)$/.exec(path))) {
    const x = (await D.kv("ephemeral")).find((y) => y.id === m[1]);
    if (!x) throw new HTTPError(404, `no ephemeral bot ${pyRepr(m[1])}`);
    return x;
  }
  if (path === "/api/v1/evals") {
    const rep = await D.kv("evals_report");
    if (!rep) throw new HTTPError(404, "no evals report yet (is the evals service running?)");
    const w = p.get("window");
    if (w) {
      if (!(w in rep.windows)) throw new HTTPError(400, `window is one of ${JSON.stringify(Object.keys(rep.windows)).replace(/"/g, "'")}`);
      return { ...rep, windows: { [w]: rep.windows[w] } };
    }
    return rep;
  }
  if (path === "/api/v1/evals/status") return (await D.kv("evals_status")) || {};
  if ((m = /^\/api\/v1\/evals\/games\/(\d+)(\/replay)?$/.exec(path))) {
    const g = await D.evalsGame(m[1]);
    if (!g) throw new HTTPError(404, `no evals game ${m[1]}`);
    if (m[2]) throw new HTTPError(404, "replay not kept");
    return { ...g, metrics: null, replay_url: null };
  }
  if (path === "/api/v1/maps") {
    const meta = await D.kv("custom_maps");
    return { maps: Object.values(meta).filter((x) => x.suite === "custom"), hidden_uploads: Object.values(meta).filter((x) => x.suite === "holdout").length };
  }
  if (path === "/api/v1/whoami") return { owner: VISITOR, name: "browser", agent: p.get("agent") || null, tagged: true };
  if (path.startsWith("/api/v1/server") || path.startsWith("/api/v1/workers") || path === "/api/v1/compare") throw new HTTPError(503, ENGINE_DOWN);
  return undefined;
}
