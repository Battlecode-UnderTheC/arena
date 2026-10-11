// The arena's in-game metrics (arena/metrics: state.py, __init__.py compute_python, plugins/*),
// computed from a replay in the browser: the game page's eval strip and metric charts.
// Tiles are numbered y * W + x; everything else follows the Python line by line.

// ---------------------------------------------------------------- Cap'n Proto (state.py)
function unpack(data) {
  const out = [];
  let i = 0;
  const n = data.length;
  let buf = new Uint8Array(Math.max(1024, n * 2)), o = 0;
  const need = (k) => { if (o + k > buf.length) { const b = new Uint8Array(Math.max(buf.length * 2, o + k)); b.set(buf); buf = b; } };
  while (i < n) {
    const tag = data[i++];
    if (tag === 0) {
      const cnt = data[i++];
      need(8 * (cnt + 1)); o += 8 * (cnt + 1);
    } else if (tag === 0xff) {
      need(8); buf.set(data.subarray(i, i + 8), o); o += 8; i += 8;
      const cnt = data[i++];
      need(8 * cnt); buf.set(data.subarray(i, i + 8 * cnt), o); o += 8 * cnt; i += 8 * cnt;
    } else {
      need(8);
      for (let b = 0; b < 8; b++) buf[o++] = tag & (1 << b) ? data[i++] : 0;
    }
  }
  void out;
  return buf.subarray(0, o);
}

class Msg {
  constructor(raw) {
    const dv = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
    const nseg = dv.getUint32(0, true) + 1;
    let off = 4 + 4 * nseg;
    off += off % 8;
    this.segs = [];
    for (let k = 0; k < nseg; k++) {
      const s = dv.getUint32(4 + 4 * k, true);
      const seg = raw.subarray(off, off + 8 * s);
      this.segs.push({ bytes: seg, dv: new DataView(seg.buffer, seg.byteOffset, seg.byteLength) });
      off += 8 * s;
    }
  }
  lo(seg, idx) { return this.segs[seg].dv.getUint32(idx * 8, true); }
  hi(seg, idx) { return this.segs[seg].dv.getUint32(idx * 8 + 4, true); }
  // (kind, seg, target word, hi word of the pointer) or null
  resolve(seg, pidx) {
    const lo = this.lo(seg, pidx), hi = this.hi(seg, pidx);
    if (lo === 0 && hi === 0) return null;
    const kind = lo & 3;
    if (kind === 2) {
      const dbl = (lo >>> 2) & 1, landing = lo >>> 3, tseg = hi;
      if (!dbl) return this.resolve(tseg, landing);
      const cseg = this.hi(tseg, landing), cstart = this.lo(tseg, landing) >>> 3;
      const tlo = this.lo(tseg, landing + 1), thi = this.hi(tseg, landing + 1);
      return [tlo & 3, cseg, cstart, thi];
    }
    const off = (lo | 0) >> 2;
    return [kind, seg, pidx + 1 + off, hi];
  }
}

class Struct {
  constructor(m, seg, start, dw, pc) { this.m = m; this.seg = seg; this.start = start; this.dw = dw; this.pc = pc; }
  ok(o, size) { return o + size <= this.dw * 8; }
  get dv() { return this.m.segs[this.seg].dv; }
  u16(o) { return this.ok(o, 2) ? this.dv.getUint16(this.start * 8 + o, true) : 0; }
  i32(o) { return this.ok(o, 4) ? this.dv.getInt32(this.start * 8 + o, true) : 0; }
  u32(o) { return this.ok(o, 4) ? this.dv.getUint32(this.start * 8 + o, true) : 0; }
  u64(o) { return this.ok(o, 8) ? this.dv.getBigUint64(this.start * 8 + o, true) : 0n; }
  bit(n) { return this.ok(n >> 3, 1) ? (this.dv.getUint8(this.start * 8 + (n >> 3)) >> (n % 8)) & 1 : 0; }
  ptr(i) { return i >= this.pc ? null : this.m.resolve(this.seg, this.start + this.dw + i); }
  struct(i) {
    const r = this.ptr(i);
    if (!r) return null;
    const [, seg, tgt, hi] = r;
    return new Struct(this.m, seg, tgt, hi & 0xffff, hi >>> 16);
  }
  text(i) {
    const r = this.ptr(i);
    if (!r) return "";
    const [, seg, tgt, hi] = r;
    const n = hi >>> 3;
    return new TextDecoder().decode(this.m.segs[seg].bytes.subarray(tgt * 8, tgt * 8 + n - 1));
  }
  listU16(i) {
    const r = this.ptr(i);
    if (!r) return [];
    const [, seg, tgt, hi] = r;
    const n = hi >>> 3, dv = this.m.segs[seg].dv, out = [];
    for (let k = 0; k < n; k++) out.push(dv.getUint16(tgt * 8 + 2 * k, true));
    return out;
  }
  listStruct(i) {
    const r = this.ptr(i);
    if (!r) return [];
    const [, seg, tgt] = r;
    const tlo = this.m.lo(seg, tgt), thi = this.m.hi(seg, tgt);
    const n = tlo >>> 2, dw = thi & 0xffff, pc = thi >>> 16, step = dw + pc, out = [];
    for (let k = 0; k < n; k++) out.push(new Struct(this.m, seg, tgt + 1 + k * step, dw, pc));
    return out;
  }
}

function root(raw) {
  const m = new Msg(raw);
  const [, seg, tgt, hi] = m.resolve(0, 0);
  return new Struct(m, seg, tgt, hi & 0xffff, hi >>> 16);
}

const DIRS = "NESW";
const DEATH = ["wall", "self", "other_body", "head_to_head", "no_valid_action"];

function decodeEvent(e, fv, W) {
  const t = e.u16(0), p = e.struct(0);
  const pt = (s) => (s ? s.i32(4) * W + s.i32(0) : null);
  switch (t) {
    case 0: return ["roundStart", p.i32(0)];
    case 1: return ["turnStart", p.i32(0)];
    case 3: return ["tileChange", pt(p.struct(0)), p.bit(0)];
    case 4: {
      const a = p.struct(0);
      let act = null;
      if (a) {
        const w = a.u16(0);
        act = w === 0 ? ["move", a.listU16(0).map((d) => DIRS[d]).join("")] : w === 1 ? ["split", a.i32(4)] : ["suicide"];
      }
      return ["dragonAction", p.i32(0), act, p.bit(32)];
    }
    case 9: return ["dragonUpdate", p.i32(0), DIRS[p.u16(4)], pt(p.struct(0)), pt(p.struct(1))];
    case 10: return ["dragonSplit", p.i32(0), p.i32(4), "AB"[p.u16(8)], DIRS[p.u16(10)], p.listStruct(0).map(pt), p.listStruct(1).map(pt)];
    case 11: return ["dragonDeath", p.i32(0), DEATH[p.u16(4)]];
    default: return ["other", t];
  }
}

async function gunzipIf(bytes) {
  if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) return bytes;
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer());
}

export async function loadReplay(blob) {
  const raw = unpack(await gunzipIf(blob));
  const r = root(raw);
  const fv = r.u32(0);
  const res = r.struct(4);
  const result = { endReason: ["teamEliminated", "roundLimit"][res.u16(2)], winner: res.u16(4) === 1 ? "AB"[res.u16(6)] : null };
  const map = r.text(0);
  const g = new GameMap(map);
  const events = r.listStruct(3).map((e) => decodeEvent(e, fv, g.W));
  return { map, g, result, events };
}

// ---------------------------------------------------------------- the map (GameMap)
const DXY = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
export class GameMap {
  constructor(text) {
    this.name = "?"; this.W = 0; this.H = 0;
    this.edges = new Map();
    this.dragons = [];
    const portals = new Map();
    for (const line of text.split(/\r\n|\r|\n/)) {
      const p = line.split(/\s+/).filter(Boolean);
      if (!p.length) continue;
      const k = p[0];
      if (k === "MAP") { this.W = +p[1]; this.H = +p[2]; }
      else if (k === "MAP_NAME") this.name = line.slice(9).trim();
      else if (k === "EDGE") {
        const eid = +p[1], typ = +p[2], pid = +p[3];
        this.edges.set(eid, [typ, pid]);
        if (typ === 2) { if (!portals.has(pid)) portals.set(pid, []); portals.get(pid).push(eid); }
      } else if (k === "DRAGON" || k === "SNAKE") {
        const v = p.slice(1).map(Number), body = [];
        for (let i = 0; i < v[1]; i++) body.push(v[3 + 2 * i] * this.W + v[2 + 2 * i]);
        this.dragons.push(["AB"[v[0]], body]);
      }
    }
    this.partner = new Map();
    for (const es of portals.values()) if (es.length === 2) { this.partner.set(es[0], es[1]); this.partner.set(es[1], es[0]); }
    this.stepT = new Int32Array(this.W * this.H * 4);
    for (let y = 0; y < this.H; y++) for (let x = 0; x < this.W; x++) for (let d = 0; d < 4; d++) {
      const s = this.computeStep(x, y, DIRS[d]);
      this.stepT[(y * this.W + x) * 4 + d] = s === null ? -1 : s;
    }
  }
  edgeId(x, y, d) {
    const W = this.W, H = this.H;
    if (d === "N") return 2 * y * (W + 1) + x;
    if (d === "S") return 2 * ((y + 1) % H) * (W + 1) + x;
    if (d === "W") return (2 * y + 1) * (W + 1) + x;
    return (2 * y + 1) * (W + 1) + (x + 1) % W;
  }
  edgeTile(eid) {
    const r = this.W + 1, i = Math.floor(eid / r), a = eid % r;
    if (i % 2 === 0) return [a % this.W, Math.floor(i / 2) % this.H];
    return [a % this.W, Math.floor((i - 1) / 2) % this.H];
  }
  computeStep(x, y, d) {
    const eid = this.edgeId(x, y, d);
    const [typ] = this.edges.get(eid) || [0, -1];
    const mod = (a, m) => ((a % m) + m) % m;
    if (typ === 1) return null;
    if (typ === 2 && this.partner.has(eid)) {
      const [px, py] = this.edgeTile(this.partner.get(eid));
      if (d === "N") return mod(py - 1, this.H) * this.W + px;
      if (d === "W") return py * this.W + mod(px - 1, this.W);
      return py * this.W + px;
    }
    const [dx, dy] = DXY[d];
    return mod(y + dy, this.H) * this.W + mod(x + dx, this.W);
  }
  step(tile, d) { const s = this.stepT[tile * 4 + DIRS.indexOf(d)]; return s < 0 ? null : s; }
}

// ---------------------------------------------------------------- replaying (State, walk)
class State {
  constructor(g) {
    this.g = g;
    this.body = new Map(); this.team = new Map(); this.alive = new Set();
    g.dragons.forEach(([t, b], i) => { this.body.set(i, b.slice()); this.team.set(i, t); this.alive.add(i); });
    this.pearls = new Set();
    this.round = -1;
  }
}

function* walk(d) {
  const g = d.g, st = new State(g);
  let rec = null, inSpawn = false;
  const finish = () => {
    if (rec) {
      rec.len_after = rec.died === null ? st.body.get(rec.id).length : 0;
      const out = rec;
      rec = null;
      return out;
    }
    return null;
  };
  for (const ev of d.events) {
    const k = ev[0];
    if (k === "roundStart" || k === "turnStart") { const r = finish(); if (r) yield ["turn", st, r]; }
    if (k === "roundStart") {
      if (st.round >= 0) yield ["round_end", st, st.round];
      st.round = ev[1];
      inSpawn = true;
    } else if (k === "turnStart") {
      inSpawn = false;
      const cur = ev[1];
      rec = { round: st.round, id: cur, team: st.team.get(cur), action: null, len_before: st.body.get(cur).length,
        head_before: st.body.get(cur)[0], path: [], ate: 0, died: null, killed: [] };
    } else if (k === "dragonAction") {
      if (rec) rec.action = ev[2];
    } else if (k === "tileChange") {
      const [, tile, has] = ev;
      if (has) st.pearls.add(tile);
      else { st.pearls.delete(tile); if (rec) rec.ate += 1; }
      void inSpawn;
    } else if (k === "dragonUpdate") {
      const [, i, , head, tail] = ev;
      if (st.round < 0 || !rec || i !== rec.id) continue;
      const b = st.body.get(i), act = rec.action;
      if (act && act[0] === "move") {
        let t = b[0];
        let path = [];
        for (const s of act[1]) { t = g.step(t, s); if (t === null) break; path.push(t); }
        if (!path.length || path[path.length - 1] !== head) path = [head];
        for (const p of path) b.unshift(p);
        rec.path = path;
        let guard = 0;
        while (b.length && b[b.length - 1] !== tail && guard < 1000) { b.pop(); guard++; }
      }
    } else if (k === "dragonSplit") {
      const [, p, c, t, , pb, cb] = ev;
      const before = st.body.get(p).length;
      st.body.set(p, pb.slice());
      st.body.set(c, cb.slice());
      st.team.set(c, t);
      st.alive.add(c);
      yield ["split", st, [st.round, p, c, t, before, cb.length]];
    } else if (k === "dragonDeath") {
      const [, i, reason] = ev;
      let detail = "";
      const act = rec ? rec.action : null;
      if (reason === "head_to_head") {
        if (rec && i === rec.id) detail = "mover";
        else if (rec) {
          detail = "hit_by_" + (st.team.get(rec.id) === st.team.get(i) ? "ally" : "enemy");
          if (act && act[0] === "move" && act[1].length > 1) detail += "_lunge";
          rec.killed.push(i);
        }
      } else if (reason === "other_body" && rec && i === rec.id && act && act[0] === "move") {
        let t = st.body.get(i)[0];
        for (const s of act[1]) {
          const t2 = g.step(t, s);
          if (t2 === null) break;
          t = t2;
          let occ = null;
          for (const j of st.alive) if (j !== i && st.body.get(j).includes(t)) { occ = j; break; }
          if (occ !== null) { detail = "into_" + (st.team.get(occ) === st.team.get(i) ? "ally" : "enemy"); break; }
        }
      } else if (reason === "no_valid_action") {
        detail = act && act[0] === "split" ? "split_fail" : act === null || act[0] === "suicide" ? "resign" : "bad_" + act[0];
      }
      yield ["death", st, [st.round, i, st.team.get(i), reason, st.body.get(i).length, detail]];
      if (rec && i === rec.id) rec.died = reason;
      st.alive.delete(i);
    }
  }
  const r = finish();
  if (r) yield ["turn", st, r];
  yield ["round_end", st, st.round];
}

// ---------------------------------------------------------------- metrics (__init__.py, plugins)
// round(x, 4): the double's exact decimal value, half to even (Python's round)
const dv64 = new DataView(new ArrayBuffer(8));
function pyRound(x, d) {
  if (!Number.isFinite(x) || x === 0) return x;
  dv64.setFloat64(0, x);
  const hi = dv64.getUint32(0), lo = dv64.getUint32(4), neg = hi >>> 31 === 1, ex = (hi >>> 20) & 0x7ff;
  let mant = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo), e2;
  if (ex === 0) e2 = -1074; else { mant |= 1n << 52n; e2 = ex - 1075; }
  if (e2 >= 0) return x;
  const digits = mant * 5n ** BigInt(-e2), k = -e2;
  if (k <= d) return x;
  const div = 10n ** BigInt(k - d), r = digits % div, half = div / 2n;
  let q = digits / div;
  if (r > half || (r === half && q % 2n === 1n)) q += 1n;
  const v = Number(q) / 10 ** d;
  return neg ? -v : v;
}
const r4 = (x) => pyRound(x, 4);
const VISION = 7;
function view(g, tile) {
  const r = VISION >> 1, x = tile % g.W, y = Math.floor(tile / g.W), out = [];
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) out.push(((y + dy) % g.H + g.H) % g.H * g.W + ((x + dx) % g.W + g.W) % g.W);
  return out;
}
export const QUEEN_CAUSES = ["hit a wall", "ran into itself", "ran into an enemy", "ran into an ally",
  "head-on: an enemy moved into it", "head-on: lunged by an enemy", "head-on: moved into an enemy", "head-on: moved into an ally",
  "head-on: an ally moved into it", "no valid move", "other", "not recorded yet"];
function queenCause(reason, detail) {
  if (reason === "wall") return "hit a wall";
  if (reason === "self") return "ran into itself";
  if (reason === "other_body") return detail === "into_ally" ? "ran into an ally" : "ran into an enemy";
  if (reason === "head_to_head") {
    if (detail === "mover") return "head-on";
    if (detail.startsWith("hit_by_enemy")) return detail.endsWith("_lunge") ? "head-on: lunged by an enemy" : "head-on: an enemy moved into it";
    return "head-on: an ally moved into it";
  }
  if (reason === "no_valid_action") return "no valid move";
  return "other";
}
const other = (t) => (t === "A" ? "B" : "A");

class Ctx {
  constructor(st, g, rnd, cum, queens, past, explored) {
    Object.assign(this, { st, g, rnd, cum, queens, past, explored });
    this.cache = new Map();
  }
  ids(t) { return [...this.st.alive].filter((i) => this.st.team.get(i) === t); }
  lengths(t) { return this.ids(t).map((i) => this.st.body.get(i).length).sort((a, b) => b - a); }
  heads(t) { return this.ids(t).map((i) => this.st.body.get(i)[0]); }
  queen(t) { const q = this.queens[t]; return q !== undefined && this.st.alive.has(q) ? q : null; }
  occupied() {
    if (!this.cache.has("occ")) { const s = new Set(); for (const i of this.st.alive) for (const t of this.st.body.get(i)) s.add(t); this.cache.set("occ", s); }
    return this.cache.get("occ");
  }
  bfs(sources, blocked = null, limit = 1e9) {     // Int32Array of distances, -1 unreached
    const g = this.g, dist = new Int32Array(g.W * g.H).fill(-1);
    let frontier = [];
    for (const s of sources) if (dist[s] < 0) { dist[s] = 0; frontier.push(s); }
    let d = 0;
    while (frontier.length && d < limit) {
      d++;
      const nxt = [];
      for (const t of frontier) for (let k = 0; k < 4; k++) {
        const n = g.stepT[t * 4 + k];
        if (n >= 0 && dist[n] < 0 && !(blocked && blocked.has(n))) { dist[n] = d; nxt.push(n); }
      }
      frontier = nxt;
    }
    return dist;
  }
  rate(t, key, window) {
    const hist = this.past[t], w = Math.min(window, hist.length);
    if (w <= 0) return 0;
    const before = hist.length > w ? hist[hist.length - w - 1][key] : 0;
    return (this.cum[t][key] - before) / w;
  }
  headDist(t) { const k = "hd" + t; if (!this.cache.has(k)) this.cache.set(k, this.bfs(this.heads(t))); return this.cache.get(k); }
}

const BIG = 1e9;
const at = (dist, tile) => (dist[tile] < 0 ? BIG : dist[tile]);
const CAP = 30;
// registry order: plugins sorted by module (control, core, explore, queen), then the derived eval
const TEAM = [
  ["board_control", (c, t) => { const m = c.headDist(t), o = c.headDist(other(t)); let won = 0; for (let i = 0; i < m.length; i++) if (m[i] >= 0 && m[i] < at(o, i)) won++; return r4(won / (c.g.W * c.g.H)); }],
  ["pearl_control", (c, t) => { const m = c.headDist(t), o = c.headDist(other(t)); let n = 0; for (const p of c.st.pearls) if (at(m, p) < at(o, p)) n++; return n; }],
  ["dragons", (c, t) => c.ids(t).length],
  ["log_dragons", (c, t) => r4(Math.log1p(c.ids(t).length))],
  ["total_length", (c, t) => c.lengths(t).reduce((a, b) => a + b, 0)],
  ["longest", (c, t) => { const l = c.lengths(t); return l.length ? l[0] : 0; }],
  ["queen_alive", (c, t) => (c.queen(t) !== null ? 1 : 0)],
  ["queen_length", (c, t) => { const q = c.queen(t); return q !== null ? c.st.body.get(q).length : 0; }],
  ["pearls_eaten", (c, t) => c.cum[t].eat],
  ["pearl_rate", (c, t) => r4(c.rate(t, "eat", 50))],
  ["deaths", (c, t) => c.cum[t].deaths],
  ["deaths_self", (c, t) => c.cum[t].deaths_self],
  ["kills", (c, t) => c.cum[t].kills],
  ["splits", (c, t) => c.cum[t].splits],
  ["tiles_visited", (c, t) => r4(c.explored[t].visited.size / (c.g.W * c.g.H))],
  ["tiles_seen", (c, t) => r4(c.explored[t].seen.size / (c.g.W * c.g.H))],
  ["queen_room", (c, t) => {
    const q = c.queen(t);
    if (q === null) return 0;
    const head = c.st.body.get(q)[0], blocked = new Set(c.occupied()); blocked.delete(head);
    const d = c.bfs([head], blocked, 8); let n = 0; for (const x of d) if (x >= 0) n++; return n - 1;
  }],
  ["queen_danger", (c, t) => { const q = c.queen(t); if (q === null) return 0; const v = c.headDist(other(t))[c.st.body.get(q)[0]]; return Math.min(CAP, v < 0 ? CAP : v); }],
  ["queen_share", (c, t) => { const q = c.queen(t), total = c.lengths(t).reduce((a, b) => a + b, 0); return q !== null && total ? r4(c.st.body.get(q).length / total) : 0; }],
];

// plugins/eval.py
const WEIGHTS = { 10: [0.417, 1.531, 0.035, 0.213, 0.210], 20: [1.066, 1.947, 0.080, 0.117, 0.172], 50: [1.330, 2.178, 0.112, 0.195, 0.155],
  100: [1.045, 1.892, 0.098, 0.301, 0.109], 150: [0.907, 1.436, 0.047, 0.370, 0.299], 200: [0.766, 1.387, 0.029, 0.750, 0.255],
  250: [0.622, 1.309, 0.020, 0.818, 0.384], 300: [0.490, 1.402, 0.021, 1.194, 0.339], 350: [0.250, 1.943, 0.022, 1.569, 0.336],
  400: [0.079, 2.030, 0.030, 1.880, 0.583], 450: [-0.150, 1.989, 0.037, 2.243, 1.102], 490: [-0.164, 1.574, 0.045, 3.455, 2.166] };
const KNOTS = Object.keys(WEIGHTS).map(Number).sort((a, b) => a - b);
function weights(rnd) {
  if (rnd <= KNOTS[0]) return WEIGHTS[KNOTS[0]];
  if (rnd >= KNOTS[KNOTS.length - 1]) return WEIGHTS[KNOTS[KNOTS.length - 1]];
  const hi = KNOTS.find((k) => k >= rnd), lo = Math.max(...KNOTS.filter((k) => k <= rnd));
  if (hi === lo) return WEIGHTS[lo];
  const f = (rnd - lo) / (hi - lo);
  return WEIGHTS[lo].map((a, i) => a + f * (WEIGHTS[hi][i] - a));
}
function leader(v) {
  for (const k of ["queen_length", "longest", "total_length"]) {
    const a = v[k].A || 0, b = v[k].B || 0;
    if (a !== b) return a > b ? 1 : -1;
  }
  return 0;
}
function evalBar(v, rnd) {
  if (rnd >= 500) { const l = leader(v); return l > 0 ? 1 : l < 0 ? 0 : 0.5; }
  const w = weights(rnd), d = (k) => (v[k].A || 0) - (v[k].B || 0);
  const z = w[0] * d("log_dragons") + w[1] * d("board_control") + w[2] * d("longest") + w[3] * d("queen_alive") + w[4] * leader(v);
  if (v.dragons.A === 0 || v.dragons.B === 0) return v.dragons.B === 0 && v.dragons.A ? 1 : 0;
  return r4(1 / (1 + Math.exp(-z)));
}

// compute_python
export async function computeMetrics(blob, every = 10) {
  const d = await loadReplay(blob);
  const g = d.g;
  const queens = {};
  g.dragons.slice(0, 2).forEach(([t], i) => { queens[t] = i; });
  const queenIds = Object.fromEntries(Object.entries(queens).map(([t, i]) => [i, t]));
  const queenDeath = { A: null, B: null };
  const counter = () => ({ eat: 0, deaths: 0, deaths_enemy: 0, deaths_self: 0, lost: 0, splits: 0, kills: 0, paid: 0 });
  const cum = { A: counter(), B: counter() }, past = { A: [], B: [] };
  const explored = { A: { visited: new Set(), seen: new Set() }, B: { visited: new Set(), seen: new Set() } };
  for (const [t, body] of g.dragons) explored[t].visited.add(body[0]);
  const rounds = [], team = Object.fromEntries(TEAM.map(([n]) => [n, { A: [], B: [] }])), game = { eval: [] }, errors = {};
  const snapshot = (st, rnd) => {
    const ctx = new Ctx(st, g, rnd, cum, queens, past, explored), values = {};
    for (const [name, fn] of TEAM) {
      const v = {};
      for (const t of "AB") {
        let x;
        try { x = fn(ctx, t); } catch (e) { errors[name] ??= String(e); x = null; }
        v[t] = x;
        team[name][t].push(x);
      }
      values[name] = v;
    }
    let x;
    try { x = evalBar(values, rnd); } catch (e) { errors.eval ??= String(e); x = null; }
    game.eval.push(x);
    rounds.push(rnd);
  };
  let lastState = null, lastDone = 0;
  for (const [kind, st, info] of walk(d)) {
    if (kind === "turn") {
      const t = info.team;
      cum[t].eat += info.ate;
      const ex = explored[t];
      for (const v of view(g, info.head_before)) ex.seen.add(v);
      ex.visited.add(info.head_before);
      for (const p of info.path) ex.visited.add(p);
      const act = info.action;
      if (act && act[0] === "move") { const free = Math.ceil(info.len_before / 4); cum[t].paid += Math.max(0, act[1].length - free); }
      if (info.died === "head_to_head") {
        const enemy = info.killed.some((k) => st.team.get(k) !== t);
        if (enemy) { cum[t].deaths_enemy += 1; cum[other(t)].kills += 1; } else cum[t].deaths_self += 1;
        const qt = queenIds[info.id];
        if (qt && queenDeath[qt] && queenDeath[qt].cause === "head-on") queenDeath[qt].cause = enemy ? "head-on: moved into an enemy" : "head-on: moved into an ally";
      }
    } else if (kind === "death") {
      const [rnd, i, t, reason, length, detail] = info;
      if (i in queenIds) queenDeath[queenIds[i]] = { round: rnd + 1, cause: queenCause(reason, detail), length };
      cum[t].deaths += 1;
      cum[t].lost += length;
      if (reason === "head_to_head" && detail === "mover") continue;
      const enemy = (reason === "head_to_head" && String(detail).startsWith("hit_by_enemy")) || (reason === "other_body" && detail === "into_enemy");
      cum[t][enemy ? "deaths_enemy" : "deaths_self"] += 1;
      if (enemy) cum[other(t)].kills += 1;
    } else if (kind === "split") {
      cum[info[3]].splits += 1;
    } else if (kind === "round_end") {
      const rnd = info + 1;
      lastState = st; lastDone = rnd;
      for (const t of "AB") past[t].push({ eat: cum[t].eat, deaths: cum[t].deaths, kills: cum[t].kills, splits: cum[t].splits });
      if (rnd % every === 0 || rnd === 1) snapshot(st, rnd);
    }
  }
  if (lastState && (!rounds.length || rounds[rounds.length - 1] !== lastDone)) snapshot(lastState, lastDone);
  return { format: 2, queens: queenDeath, every, rounds, team, game, map: { name: g.name, W: g.W, H: g.H },
    result: { winner: d.result.winner, end: d.result.endReason }, errors };
}
