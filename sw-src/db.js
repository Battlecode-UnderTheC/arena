// The snapshot's data for the backend: site.db, read in place with HTTP range requests through a
// wa-sqlite VFS, plus the arena's data functions (api/http.py) over it.
import SQLiteAsyncESMFactory from "wa-sqlite/dist/wa-sqlite-async.mjs";
import * as SQLite from "wa-sqlite/src/sqlite-api.js";
import * as VFS from "wa-sqlite/src/VFS.js";

const BLOCK = 64 << 10;
const EXPORTED_URL = "https://battlecode-underthec.github.io/tokenz-arena-pages";

// JSON.parse, keeping 64-bit integers (seeds) exact: as strings
export const parse = (text) => JSON.parse(text.replace(/([:\[,]\s*)(-?\d{16,})(?=\s*[,}\]])/g, '$1"$2"'));

// Read-only file over HTTP: site.db split into chunks (data/site/site.db.000, ...).
class HttpVFS extends VFS.Base {
  name = "http";
  constructor(base, config) {
    super();
    this.base = base; this.cfg = config;
    this.blocks = new Map();             // block index -> Promise<Uint8Array>
    this.files = new Map();
  }
  block(i) {
    if (!this.blocks.has(i)) {
      const start = i * BLOCK, chunk = Math.floor(start / this.cfg.chunkSize);
      const off = start - chunk * this.cfg.chunkSize;
      const end = Math.min(off + BLOCK, this.cfg.chunkSize, this.cfg.length - chunk * this.cfg.chunkSize) - 1;
      const url = new URL(`data/site/site.db.${String(chunk).padStart(3, "0")}`, this.base);
      const p = fetch(url, { headers: { Range: `bytes=${off}-${end}` } }).then(async (r) => {
        if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
        const buf = new Uint8Array(await r.arrayBuffer());
        return r.status === 206 ? buf : buf.subarray(off, end + 1);
      });
      this.blocks.set(i, p);
      p.catch(() => this.blocks.delete(i));
      if (this.blocks.size > 2048) this.blocks.delete(this.blocks.keys().next().value);   // ~128 MB
    }
    return this.blocks.get(i);
  }
  xOpen(name, fileId, flags, pOutFlags) {
    this.files.set(fileId, name);
    pOutFlags.setInt32(0, VFS.SQLITE_OPEN_READONLY, true);
    return VFS.SQLITE_OK;
  }
  xClose(fileId) { this.files.delete(fileId); return VFS.SQLITE_OK; }
  xRead(fileId, pData, iOffset) {
    return this.handleAsync(async () => {
      const n = pData.byteLength;
      const len = this.cfg.length;
      let got = 0;
      while (got < n && iOffset + got < len) {
        const pos = iOffset + got, i = Math.floor(pos / BLOCK), b = await this.block(i);
        const from = pos - i * BLOCK, take = Math.min(n - got, b.length - from);
        pData.set(b.subarray(from, from + take), got);
        got += take;
      }
      if (got < n) { pData.fill(0, got); return VFS.SQLITE_IOERR_SHORT_READ; }
      return VFS.SQLITE_OK;
    });
  }
  xWrite() { return VFS.SQLITE_READONLY; }
  xTruncate() { return VFS.SQLITE_READONLY; }
  xSync() { return VFS.SQLITE_OK; }
  xFileSize(fileId, pSize64) { pSize64.setBigInt64(0, BigInt(this.cfg.length), true); return VFS.SQLITE_OK; }
  xLock() { return VFS.SQLITE_OK; }
  xUnlock() { return VFS.SQLITE_OK; }
  xCheckReservedLock(fileId, pResOut) { pResOut.setInt32(0, 0, true); return VFS.SQLITE_OK; }
  xFileControl() { return VFS.SQLITE_NOTFOUND; }
  xDeviceCharacteristics() { return VFS.SQLITE_IOCAP_IMMUTABLE; }
  xAccess(name, flags, pResOut) { pResOut.setInt32(0, 0, true); return VFS.SQLITE_OK; }
  xDelete() { return VFS.SQLITE_IOERR; }
}

let ready = null;
export function open(base) {
  if (!ready) ready = (async () => {
    const config = await (await fetch(new URL("data/site/config.json", base))).json();
    const module = await SQLiteAsyncESMFactory({ locateFile: (f) => new URL(`vendor/${f}`, base).href });
    const sqlite3 = SQLite.Factory(module);
    const vfs = new HttpVFS(base, config);
    sqlite3.vfs_register(vfs, false);
    const db = await sqlite3.open_v2("site.db", SQLite.SQLITE_OPEN_READONLY, vfs.name);
    const D = new Data(sqlite3, db, base);
    await D.init();
    return D;
  })();
  ready.catch(() => { ready = null; });
  return ready;
}

// ---------------------------------------------------------------- the arena's data functions
const byCreated = (a, b) => (a.created < b.created ? -1 : a.created > b.created ? 1 : 0);
const GAME_COLS = "id, lane, suite, map, seed, a, b, winner, rounds, reason, replay, seconds, error, played, meta, rated, map_sha, runnable";

class Data {
  constructor(sqlite3, db, base) {
    this.sqlite3 = sqlite3; this.db = db; this.base = base;
    this.lock = Promise.resolve();
    this.kvCache = new Map();
  }
  // one statement at a time: an Asyncify build can't interleave calls
  query(sql, params = []) {
    const run = this.lock.then(async () => {
      const out = [];
      for await (const stmt of this.sqlite3.statements(this.db, sql)) {
        if (params.length) this.sqlite3.bind_collection(stmt, params);
        const cols = this.sqlite3.column_names(stmt);
        while (await this.sqlite3.step(stmt) === SQLite.SQLITE_ROW) {
          const row = this.sqlite3.row(stmt);
          out.push(Object.fromEntries(cols.map((c, i) => [c, row[i]])));
        }
      }
      return out;
    });
    this.lock = run.catch(() => {});
    return run;
  }
  async init() {
    this.subs = new Map();
    this.verdicts = new Map();
    for (const r of await this.query("SELECT id, json, verdict FROM subs")) {
      this.subs.set(r.id, parse(r.json));
      if (r.verdict) this.verdicts.set(r.id, parse(r.verdict));
    }
    this.aliases = await this.kv("aliases");
    this.bots = await this.kv("bots");
    this.ratingsMap = await this.kv("ratings");
  }
  async kv(key) {
    if (!this.kvCache.has(key)) {
      const [r] = await this.query("SELECT value FROM kv WHERE key = ?", [key]);
      // the exporter wrote the site's address into llms.txt and the docs: use where it's served now
      const text = r ? r.value.split(EXPORTED_URL).join(new URL(this.base).href.replace(/\/$/, "")) : null;
      this.kvCache.set(key, text ? parse(text) : null);
    }
    return this.kvCache.get(key);
  }
  resolve(sid) { return sid && !this.subs.has(sid) ? this.aliases[sid] ?? sid : sid; }
  subLite(sid) { return sid ? this.subs.get(this.resolve(sid)) : undefined; }
  async sub(sid) { return this.subLite(sid) || null; }
  async subsAll() { return [...this.subs.values()]; }
  async verdict(sid) { return this.verdicts.get(this.resolve(sid)) || {}; }
  async ratings() { return this.ratingsMap; }
  async leaderboard() { return this.kv("leaderboard"); }
  async checkLog(sid) { return (this.subLite(sid) || {}).check_log || null; }
  async report(sid) { const [r] = await this.query("SELECT report FROM sub_extra WHERE id = ?", [sid]); return r && r.report ? parse(r.report) : null; }
  async subMetrics(sid) { const [r] = await this.query("SELECT metrics FROM sub_extra WHERE id = ?", [sid]); return r && r.metrics ? parse(r.metrics) : null; }

  // http.sub_json
  async subJson(s, detail = false) {
    const d = { ...s };
    if (!detail) delete d.check_log;
    d.url = `/api/v1/submissions/${s.id}`;
    d.rating = this.ratingsMap[s.id] ?? null;
    if (!["checking", "rejected", "external"].includes(s.status)) d.verdict = this.verdicts.get(s.id) || null;
    return d;
  }
  // http.bot_detail
  async botDetail(bot) {
    const b = this.bots[bot];
    if (!b) return null;
    const subs = [...this.subs.values()].filter((s) => s.bot === bot).sort(byCreated);
    const [h] = await this.query("SELECT h2h FROM bot_extra WHERE bot = ?", [bot]);
    return { bot, ...b, submissions: await Promise.all(subs.map((s) => this.subJson(s))),
      lineage: subs.map((s) => ({ id: s.id, parent: s.parent })), head_to_head: h ? parse(h.h2h) : [] };
  }
  // http.ideas
  async ideas(q = "", bot = null, outcome = null, limit = 50) {
    const terms = q.split(/\s+/).filter(Boolean).map((t) => t.toLowerCase());
    const out = [];
    for (const s of [...this.subs.values()].sort((a, b) => -byCreated(a, b))) {
      if (s.status === "external" || (bot && s.bot !== bot)) continue;
      const text = `${s.note} ${s.bot} ${s.id}`.toLowerCase();
      if (terms.length && !terms.every((t) => text.includes(t))) continue;
      const v = !["checking", "rejected"].includes(s.status) ? this.verdicts.get(s.id) || {} : {};
      const beats = (v.vs_parent || {}).beats_parent;
      const promoted = s.lane === "ranked";
      const o = s.status === "rejected" ? "rejected" : !v.complete ? "pending" : !s.parent ? "no_parent"
        : beats ? "beat_parent" : beats === false ? "lost_to_parent" : "tied_parent";
      if (outcome && ![o, promoted ? "promoted" : "-"].includes(outcome)) continue;
      out.push({ id: s.id, bot: s.bot, owner: s.owner, agent: s.agent, parent: s.parent, note: s.note, source: s.source,
        created: s.created, status: s.status, promoted, outcome: o, reason: s.reason, verdict: v });
      if (out.length >= limit) break;
    }
    return out;
  }
  // http.lineage
  async lineage(root = null, bot = null, hideRejected = false) {
    const subs = new Map([...this.subs].filter(([, s]) => s.status !== "external" && !(hideRejected && s.status === "rejected")));
    const kids = new Map();
    for (const s of subs.values()) {
      const k = subs.has(s.parent) ? s.parent : null;
      if (!kids.has(k)) kids.set(k, []);
      kids.get(k).push(s);
    }
    const current = new Set(Object.values(this.bots).map((b) => b.current));
    const node = (s) => {
      const v = !["checking", "rejected"].includes(s.status) ? this.verdicts.get(s.id) || {} : {};
      const vp = v.vs_parent || null;
      return { id: s.id, bot: s.bot, owner: s.owner, agent: s.agent, lane: s.lane, status: s.status, created: s.created,
        current: current.has(s.id), note: s.note, elo: (this.ratingsMap[s.id] || {}).elo ?? null,
        vs_parent: vp ? Object.fromEntries(["W", "D", "L", "score", "beats_parent", "significant"].map((k) => [k, vp[k] ?? null])) : null,
        children: (kids.get(s.id) || []).slice().sort(byCreated).map(node) };
    };
    const containsBot = (n) => n.bot === bot || n.children.some(containsBot);
    root = this.resolve(root);
    if (root) return subs.has(root) ? [node(subs.get(root))] : [];
    const forest = (kids.get(null) || []).slice().sort(byCreated).map(node);
    return bot ? forest.filter(containsBot) : forest;
  }

  // games
  row(r) {
    r.meta = r.meta ? parse(r.meta) : {};
    return r;
  }
  async findGames({ sub = "", vs = "", map = "", suite = "", lane = "", result = "", limit = 50, source = null } = {}) {
    sub = this.resolve(sub || null); vs = this.resolve(vs || null);
    const where = ["suite != 'holdout'"], args = [];
    if (source === "arena") where.push("lane != 'server'");
    if (source === "competition") where.push("lane = 'server'");
    if (vs) { where.push("(a = ? OR b = ?)"); args.push(vs, vs); }
    if (map) { where.push("map = ?"); args.push(map); }
    if (suite) { where.push("suite = ?"); args.push(suite); }
    if (lane) { where.push("lane = ?"); args.push(lane); }
    if (result && sub) {
      const R = result.toUpperCase().slice(0, 1);
      const res = "CASE WHEN error IS NOT NULL THEN 'E' WHEN winner IS NULL THEN 'D' WHEN winner = (CASE WHEN a = ? THEN 'A' ELSE 'B' END) THEN 'W' ELSE 'L' END";
      where.push(`${res} = ?`); args.push(sub, R);
    }
    const n = Math.max(1, limit | 0), w = where.join(" AND ");
    let sql, params;
    if (sub) {     // each seat newest first from its index, then merged: no scan of a bot's whole history
      sql = `SELECT * FROM (SELECT ${GAME_COLS} FROM games WHERE a = ? AND ${w} ORDER BY id DESC LIMIT ${n})
        UNION ALL SELECT * FROM (SELECT ${GAME_COLS} FROM games WHERE b = ? AND a != b AND ${w} ORDER BY id DESC LIMIT ${n})
        ORDER BY id DESC LIMIT ${n}`;
      params = [sub, ...args, sub, ...args];
    } else {
      sql = `SELECT ${GAME_COLS} FROM games WHERE ${w} ORDER BY id DESC LIMIT ${n}`;
      params = args;
    }
    return (await this.query(sql, params)).map((r) => this.row(r));
  }
  async recentComp(n) {
    return (await this.query(`SELECT ${GAME_COLS} FROM games WHERE lane = 'server' ORDER BY id DESC LIMIT ${n}`)).map((r) => this.row(r));
  }
  async game(gid) {
    const [r] = await this.query(`SELECT ${GAME_COLS} FROM games WHERE id = ?`, [Number(gid)]);
    return r ? this.row(r) : null;
  }
  async gameStats(gid) {
    const [r] = await this.query("SELECT stats FROM game_stats WHERE id = ?", [Number(gid)]);
    if (!r) return {};
    const text = await new Response(new Blob([r.stats]).stream().pipeThrough(new DecompressionStream("deflate"))).text();
    return parse(text);
  }
  async wasmFor(bots) {
    const out = {};
    for (const b of bots) { const [r] = await this.query("SELECT sha FROM wasm WHERE bot = ?", [b]); out[b] = r ? r.sha : null; }
    return out;
  }
  async duel(did) { const [r] = await this.query("SELECT summary FROM duels WHERE id = ?", [did]); return r ? parse(r.summary) : null; }
  async duelGame(did, n) { const [r] = await this.query("SELECT json, map_sha, runnable FROM duel_games WHERE duel = ? AND n = ?", [did, Number(n)]); return r ? { ...parse(r.json), map_sha: r.map_sha, runnable: r.runnable } : null; }
  async evalsGame(gid) { const [r] = await this.query("SELECT json FROM evals_games WHERE id = ?", [Number(gid)]); return r ? parse(r.json) : null; }
  async mapText(sha) { return (await fetch(new URL(`maps/${sha}.map`, this.base))).text(); }
}
