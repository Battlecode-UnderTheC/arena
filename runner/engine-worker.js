// The engine worker: unswbc_engine.wasm (engine.py EngineModule) plus each dragon's controller
// (sandbox.cc Dragon / turn.py TurnBot.ask, with arena/strictjudge.py's no-retry rule).
// bot_reply is synchronous, so this thread blocks on the dragon's slot while it thinks.
import { S, Slot, SLOT_BYTES, MAX_TURN_POINTS, DEBUG_ALL, DEBUG_LIMITS, dec, utf8Replace } from "./shared.js";

const IS_NODE = typeof process !== "undefined" && !!process.versions?.node;
let port;
if (IS_NODE) port = (await import("node:worker_threads")).parentPort;
const post = (m, t) => (IS_NODE ? port.postMessage(m, t) : self.postMessage(m, t));

if (IS_NODE) port.once("message", (m) => main(m));
else self.onmessage = (e) => { self.onmessage = null; main(e.data); };

const enc = new TextEncoder();
const DEATH = { W: "hit a wall", S: "hit itself", O: "hit another dragon", H: "lost a head-to-head", A: "no valid action" };

let slots, pool, retry;

function main(m) {
  try {
    post({ type: "done", ...play(m) });
  } catch (e) {
    post({ type: "error", message: e?.stack || String(e) });
  }
}

// ---------------------------------------------------------------- worker pool
// Pool states (pool[16 + i]): 0 ready (a spare waiting for a box), 1 busy, 2 closed, 3 starting.
// Each worker hosts one box and then closes, so a dead dragon's memory is freed at once (a
// browser caps the wasm memories one process may hold: about 125 in Chrome). The main thread
// keeps a few spares started; "need" asks it for one more.
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

function acquire() {
  let asked = false;
  for (;;) {
    const g = Atomics.load(pool, 1);
    const count = Atomics.load(pool, 0);
    for (let i = 0; i < count; i++)
      if (Atomics.compareExchange(pool, 16 + i, 0, 1) === 0) { post({ type: "need" }); return i; }
    if (!asked) { post({ type: "need" }); asked = true; }
    Atomics.wait(pool, 1, g, 200);
  }
}

// ---------------------------------------------------------------- Dragon (SandboxBot)
function payload(block, activate) {
  const n = block.length;
  const ends = n >= 2 && block[n - 1] === 10 && block[n - 2] === 10;
  const out = new Uint8Array((activate ? 1 : 0) + n + (ends ? 0 : 1));
  let o = 0;
  if (activate) out[o++] = 0x52;
  out.set(block, o);
  if (!ends) out[o + n] = 10;
  return out;
}
const concat = (a, b) => { const o = new Uint8Array(a.length + b.length); o.set(a); o.set(b, a.length); return o; };
const NO_MEMORY = "could not allocate memory";
const dragons = new Map();             // id -> Dragon, the live ones (for eviction)
let asking = null;                     // the dragon whose turn it is
export const evictions = { count: 0, replayed: 0 };

// Frees one dragon's sandbox to make room: the cheapest to rebuild (fewest CPU points since its
// box started). It keeps every block it was sent, and is rebuilt by sending them again (its clock,
// CPU points and random numbers depend only on those), before its next turn.
function evictOne(except) {
  let best = null;
  for (const d of dragons.values())
    if (d.slot && !d.slot.get(S.OUT_CLOSED) && d !== except && d !== asking && (!best || d.cost < best.cost)) best = d;
  if (!best) return false;
  best.stop();
  best.evicted = true;
  evictions.count++;
  return true;
}

class Dragon {
  constructor(team, init, name) {
    this.team = team; this.init = init; this.name = name;
    this.activate = false; this.isNew = false; this.written = 0; this.parksSeen = 0;
    this.error = null; this.slot = null; this.index = -1;
    this.history = []; this.cost = 0n; this.evicted = false;
  }
  start() {
    this.stop();
    for (let tries = 0; ; tries++) {
      const index = acquire();
      const slot = new Slot(slots, index * SLOT_BYTES);
      slot.lock();
      slot.reset();
      slot.set(S.TEAM, this.team);
      slot.set(S.RUNNING, 1);
      slot.unlock();
      Atomics.store(slot.i, S.CMD, 1);
      Atomics.notify(slot.i, S.CMD);
      // boot to the first stdin read, as WasmPool's spares are
      slot.lock();
      while (slot.get(S.PARKS) === 0 && !slot.get(S.OUT_CLOSED)) slot.wait();
      const why = slot.get(S.OUT_CLOSED) ? slot.failure() : "";
      const failed = why.startsWith("the sandbox failed to start");
      if (!failed) { slot.setName(this.name); slot.set(S.ATTACHED, 1); }
      slot.unlock();
      this.slot = slot; this.index = index;
      if (!failed) break;
      this.stop();
      if (!why.includes(NO_MEMORY) || tries > 200) throw new Error(why);
      // out of memories: closing workers free theirs in a moment; else make room
      if (tries % 4 === 3 && !evictOne(this)) throw new Error(why);
      sleep(tries % 4 === 3 ? 40 : 10);
    }
    this.activate = false;
  }
  stop() {
    const slot = this.slot;
    if (slot) {
      slot.lock();
      slot.set(S.ATTACHED, 0); slot.set(S.FROZEN, 1); slot.set(S.IN_CLOSED, 1); slot.set(S.DEAD, 1);
      slot.notifyAll();
      slot.unlock();
    }
    this.slot = null;
  }
  fresh() { this.start(); this.written = 0; this.isNew = true; this.history = []; this.cost = 0n; }
  write(data) {
    const slot = this.slot;
    slot.lock();
    if (slot.get(S.OUT_CLOSED)) { slot.unlock(); return false; }
    slot.set(S.BUDGET, 1);
    this.parksSeen = slot.get(S.PARKS);
    slot.inAppend(data);
    slot.set(S.FROZEN, 1);
    slot.notifyAll();
    slot.unlock();
    return true;
  }
  // after a write: wait for the turn to end; the reply, or null if the box exited
  finish() {
    const slot = this.slot;
    slot.lock();
    for (;;) {
      // poll(): data / exit / park / wait, then the finished test, under one lock
      const done = slot.get(S.F_DONE);
      const parked = slot.get(S.PARKS) > this.parksSeen;
      const parkAt = slot.get(S.F_PARK_SET) && slot.get(S.F_PARK_AT) === this.written;
      if (done || parkAt || parked) {
        const out = slot.framerTake();
        slot.unlock();
        return out;
      }
      if (slot.get(S.OUT_CLOSED)) { slot.unlock(); return null; }
      slot.wait();
    }
  }
  // an evicted dragon: a new box, sent everything the old one was sent
  rebuild() {
    const history = this.history;
    this.start();
    this.written = 0;
    this.evicted = false;
    for (const data of history) {
      const slot = this.slot;
      slot.lock(); slot.framerArm(); slot.unlock();
      if (!this.write(data)) throw new Error(`rebuilding dragon ${this.name}: its box exited`);
      this.written += data.length;
      if (this.finish() === null) throw new Error(`rebuilding dragon ${this.name}: its box exited`);
    }
    evictions.replayed++;
  }
  reason() {
    const slot = this.slot;
    if (!slot) return "exited";
    slot.lock();
    const f = slot.get(S.FAILURE_LEN) ? slot.failure() : "";
    const code = slot.get(S.EXIT_SET) ? slot.get(S.EXIT_CODE) : 0;
    slot.unlock();
    return f || `exited with code ${code}`;
  }
  skip(r) { this.error = r; this.stop(); this.evicted = false; return new Uint8Array(0); }
  ask(block) {
    this.error = null;
    asking = this;
    if (this.evicted) this.rebuild();
    if (!this.slot) this.fresh();
    for (let attempt = 0; attempt < 2; attempt++) {
      const slot = this.slot;
      slot.lock(); slot.framerArm(); slot.unlock();
      const data = payload(this.isNew ? concat(this.init, block) : block, this.activate);
      if (!this.write(data)) {
        if (attempt === 0) { this.fresh(); continue; }
        return this.skip(this.reason());
      }
      this.history.push(data);
      this.written += data.length;
      this.activate = this.isNew = false;
      const out = this.finish();
      if (out !== null) { this.cost += this.livePoints(); return out; }
      slot.lock();
      const said = slot.framerSaid();
      slot.unlock();
      const r = this.reason();
      if (attempt || said || !retry) return this.skip(r);
      this.fresh();
    }
    return new Uint8Array(0);
  }
  livePoints() {
    if (!this.slot) return 0n;
    this.slot.lock();
    const v = this.slot.livePoints();
    this.slot.unlock();
    return v;
  }
}

// ---------------------------------------------------------------- the game (run.py execute)
function play(m) {
  slots = m.slots; pool = new Int32Array(m.pool);
  retry = !!m.retry;
  const seed = BigInt(m.seed);
  const debug = m.debug ?? (DEBUG_ALL | DEBUG_LIMITS);
  const live = dragons, teamOf = new Map();
  const deaths = [], notices = [], spent = { A: [], B: [] }, errors = [];
  const t0 = Date.now();
  let lastRound = -1;

  let memory, exports;
  const mem = () => new Uint8Array(memory.buffer);
  let longReply = null, pendingErr = "";

  const firstLine = (b) => { let k = b.indexOf(10); if (k < 0) k = b.length; return dec(b.subarray(0, k)); };
  const imports = {
    unswbc: {
      bot_reply(id, ptr, len, out, cap) {
        let reply;
        if (longReply) { reply = longReply; longReply = null; }
        else {
          const block = mem().slice(ptr, ptr + len);
          const [h0, h1] = firstLine(block).trim().split(/\s+/);
          if (h0 === "ROUND" && h1 !== undefined) {
            const round = Number(h1);
            if (round !== lastRound) {
              lastRound = round;
              let a = 0, b = 0;
              for (const k of live.keys()) (teamOf.get(k) === "B" ? b++ : a++);
              post({ type: "round", round, alive: [a, b], seconds: (Date.now() - t0) / 1000 });
              if (m.liveReplayEvery && round > 0 && round % m.liveReplayEvery === 0) {
                try { const r = replayBytes(); post({ type: "partial", round, replay: r }, [r.buffer]); } catch (e) { /* not supported mid-game */ }
              }
            }
          }
          const bot = live.get(id);
          if (!bot) reply = new Uint8Array(0);
          else {
            reply = bot.ask(block);
            if (bot.error) errors.push({ round: lastRound, id, team: teamOf.get(id), error: bot.error });
            const pts = bot.slot ? bot.livePoints() : 0n;
            if (pts) spent[teamOf.get(id) || "A"].push(pts);
          }
        }
        if (reply.length > cap) { longReply = reply; return reply.length; }
        mem().set(reply, out);
        return reply.length;
      },
      log(id, round, reason) {
        const team = teamOf.get(id) || "?";
        deaths.push({ round, id, team, cause: DEATH[String.fromCharCode(reason)] || "died" });
        const b = live.get(id);
        if (b) { b.stop(); live.delete(id); }
      },
      bot_spawn(id, ptr, len) {
        const init = mem().slice(ptr, ptr + len);
        let team = "A";
        for (const line of dec(init).split("\n"))
          if (line.startsWith("TEAM")) { team = line.split(/\s+/)[1]; break; }
        teamOf.set(id, team);
        live.set(id, new Dragon(team === "B" ? 1 : 0, init, String(id)));
      },
    },
    wasi_snapshot_preview1: {
      fd_write(fd, iovs, n, out) {
        const dv = new DataView(memory.buffer);
        let total = 0;
        for (let k = 0; k < n; k++) {
          const p = dv.getUint32(iovs + 8 * k, true), l = dv.getUint32(iovs + 8 * k + 4, true);
          if (fd === 2) {
            pendingErr += dec(utf8Replace(mem().slice(p, p + l)));
            let at;
            while ((at = pendingErr.indexOf("\n")) >= 0) { notices.push(pendingErr.slice(0, at)); pendingErr = pendingErr.slice(at + 1); }
          }
          total += l;
        }
        dv.setUint32(out, total, true);
        return 0;
      },
      clock_time_get(id, prec, out) { new DataView(memory.buffer).setBigUint64(out, 0n, true); return 0; },
      environ_sizes_get(a, b) { const dv = new DataView(memory.buffer); dv.setUint32(a, 0, true); dv.setUint32(b, 0, true); return 0; },
      environ_get() { return 0; },
      fd_close() { return 0; },
      fd_prestat_get() { return 8; },
      fd_prestat_dir_name() { return 8; },
      fd_seek() { return 8; },
      proc_exit(code) { throw new Error(`engine exited with code ${code}`); },
    },
  };
  const inst = new WebAssembly.Instance(m.engine, imports);
  exports = inst.exports;
  memory = exports.memory;
  if (exports._initialize) exports._initialize();

  function readError() {
    const p = exports.ubc_error();
    const u = mem();
    let e = p; while (u[e]) e++;
    return dec(utf8Replace(u.slice(p, e))) || "engine failed";
  }
  function replayBytes() {
    const names = [];
    for (const n of [m.nameA, m.nameB]) {
      const b = enc.encode(n);
      const p = exports.ubc_alloc(b.length);
      mem().set(b, p);
      names.push(p, b.length);
    }
    const size = exports.ubc_replay(names[0], names[1], names[2], names[3]);
    exports.ubc_free(names[0]); exports.ubc_free(names[2]);
    if (size < 0) throw new Error(readError());
    const base = exports.ubc_replay_ptr();
    return mem().slice(base, base + size);
  }

  const map = m.map;
  const mapPtr = exports.ubc_alloc(map.length);
  mem().set(map, mapPtr);
  const outPtr = exports.ubc_alloc(48);
  const signed = seed >= (1n << 63n) ? seed - (1n << 64n) : seed;
  let code;
  try {
    code = exports.ubc_run(mapPtr, map.length, debug, signed, outPtr);
  } finally {
    for (const b of live.values()) b.stop();
  }
  if (pendingErr) notices.push(pendingErr);
  if (code !== 0) throw new Error(readError());
  const v = new Int32Array(mem().slice(outPtr, outPtr + 48).buffer);
  const r = { rounds: v[0], winner_code: v[1], end_reason: v[2], a_dragons: v[3], b_dragons: v[4], a_length: v[5],
    b_length: v[6], events: v[7], a_queen: v[8], b_queen: v[9], a_longest: v[10], b_longest: v[11] };
  const replay = m.replay === false ? null : replayBytes();
  const pct = (o, q) => o[Math.max(0, Math.floor((q * o.length + 99) / 100) - 1)];
  const points = {};
  for (const t of ["A", "B"]) {
    const o = spent[t].slice().sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
    if (!o.length) continue;
    const sum = o.reduce((x, y) => x + y, 0n);
    points[t] = { p50: Number(pct(o, 50)), p99: Number(pct(o, 99)), mean: Number(sum / BigInt(o.length)),
      max: Number(o[o.length - 1]), turns: o.length };
  }
  return {
    winner: r.winner_code === 1 ? "A" : r.winner_code === 2 ? "B" : null,
    rounds: r.rounds + 1, reason: verdict(r), raw: r, deaths, errors, notices, points,
    seconds: (Date.now() - t0) / 1000, replay, evictions: { ...evictions },
  };
}

function verdict(r) {
  if (r.end_reason === 0) return r.winner_code ? "elimination" : "both teams eliminated";
  const a = [r.a_queen, r.a_longest, r.a_length], b = [r.b_queen, r.b_longest, r.b_length];
  if (r.winner_code === 0) return `equal length: queen ${a[0]}, longest ${a[1]}, total ${a[2]} each`;
  const won = r.winner_code === 1 ? a : b, lost = r.winner_code === 1 ? b : a;
  const labels = ["longer queen", "longest dragon", "total length"];
  for (let i = 0; i < 3; i++) if (won[i] !== lost[i]) return `${labels[i]}, ${won[i]} to ${lost[i]}`;
  return "on length";
}
