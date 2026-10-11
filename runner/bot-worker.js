// One bot worker: hosts one dragon's sandbox (a C++ Box) at a time, reused after it dies.
// The host functions are sandbox.cc Box::host line by line.
import {
  S, Slot, Rng, MAX_MEMORY_PAGES, VIRTUAL_EPOCH_NS, WRITE_SYSCALL_COST, WRITE_BYTE_COST,
  READ_BYTE_COST, INT64_MAX, INT64_MIN, SLOT_BYTES,
} from "./shared.js";

const IS_NODE = typeof process !== "undefined" && !!process.versions?.node;
let port;
if (IS_NODE) port = (await import("node:worker_threads")).parentPort;

const OK = 0, E2BIG = 1, EACCES = 2, EBADF = 8, EINVAL = 28, EISDIR = 31, ENOENT = 44, ENOSYS = 52,
  ENOTDIR = 54, ENOTSUP = 58, ENOTTY = 59, ERANGE = 68;
const DIR = 3, CHARACTER = 2;
const ALL_RIGHTS = (1n << 64n) - 1n;
const W = "wasi_snapshot_preview1.", X = "wasix_32v1.";
const PY_ONLY = new Set(["wasix_32v1.reflect_signature", "wasix_32v1.call_dynamic"]);
const DENIED = new Set(["callback_signal", "dl_invalid_handle", "dlopen", "dlsym", "epoll_create", "epoll_ctl",
  "epoll_wait", "fd_event", "fd_pipe", "proc_exec4", "proc_fork", "proc_join", "proc_raise",
  "proc_signal", "proc_spawn3", "sock_connect", "sock_open", "sock_send", "sock_send_file",
  "sock_send_to", "thread-spawn", "thread_join", "thread_signal", "thread_sleep", "tty_set"]);
const EXITS = new Set(["proc_exit", "proc_exit2", "thread_exit"]);
const IMPLEMENTED = new Set([
  ...["args_sizes_get", "args_get", "environ_sizes_get", "environ_get", "clock_time_get", "clock_res_get",
    "random_get", "sched_yield", "poll_oneoff", "fd_prestat_get", "fd_prestat_dir_name", "fd_fdstat_get",
    "fd_fdstat_set_flags", "fd_filestat_get", "path_filestat_get", "path_readlink", "fd_close",
    "path_create_directory", "path_unlink_file", "path_rename", "path_remove_directory", "path_symlink",
    "path_link", "path_filestat_set_times", "fd_filestat_set_times", "fd_filestat_set_size", "fd_pwrite",
    "fd_advise", "fd_datasync", "fd_sync", "fd_renumber", "fd_read", "fd_pread", "fd_seek", "fd_tell",
    "fd_readdir", "fd_write", "proc_exit"].map((n) => W + n),
  ...["fd_fdflags_get", "fd_fdflags_set", "path_open2", "fd_dup", "clock_time_set", "proc_parent",
    "proc_raise_interval", "fd_dup2", "getcwd", "chdir", "tty_get", "thread_id", "thread_parallelism",
    "thread_exit", "proc_id", "proc_signals_sizes_get", "proc_signals_get", "proc_exit2", "futex_wait",
    "futex_wake", "futex_wake_all"].map((n) => X + n),
]);

// A trap that wasm can't catch (a JS throw would be caught by a bot's catch(...)).
const TRAP = new WebAssembly.Instance(new WebAssembly.Module(new Uint8Array([
  0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 7, 8, 1, 4, 98, 111, 111, 109, 0, 0,
  10, 5, 1, 3, 0, 0, 11]))).exports.boom;

class Exit { constructor(code) { this.code = code; } }
class HostError { constructor(msg) { this.msg = msg; } }
class Unsupported { constructor(msg) { this.msg = msg; } }
class Dead {}

let slot, teams, workerIndex, pool;

function onInit(msg) {
  slot = new Slot(msg.slots, msg.index * SLOT_BYTES);
  teams = msg.teams;                 // [{module, key, memMin, memMax}, x2]
  workerIndex = msg.index;
  pool = new Int32Array(msg.pool);
  Atomics.store(pool, 16 + workerIndex, 0);   // ready
  Atomics.add(pool, 1, 1);
  Atomics.notify(pool, 1);
  hostOne();
}

if (IS_NODE) port.once("message", onInit);
else self.onmessage = (e) => { self.onmessage = null; onInit(e.data); };

// One box, then this worker closes: its memory is freed with it (reusing workers left dead
// boxes' memories to the garbage collector, and browsers cap how many a process may hold).
function hostOne() {
  while (Atomics.load(slot.i, S.CMD) === 0) Atomics.wait(slot.i, S.CMD, 0);
  Atomics.store(slot.i, S.CMD, 0);
  let box = null;
  try { box = new Box(teams[slot.get(S.TEAM)]); box.run(); }
  catch (e) {                       // should not happen; fail the box instead of hanging the game
    slot.lock();
    if (!slot.get(S.FAILURE_LEN)) slot.setFailure("sandbox error: " + (e?.message || e));
    slot.set(S.OUT_CLOSED, 1);
    slot.notifyAll();
    slot.unlock();
  }
  const counted = box?.counted;
  box = null;
  slot.lock();
  while (!slot.get(S.DEAD)) slot.wait();
  slot.set(S.RUNNING, 0);
  slot.unlock();
  if (counted) Atomics.sub(pool, 2, 1);
  Atomics.store(pool, 16 + workerIndex, 2);   // closed: the main thread may reuse the slot
  if (IS_NODE) { port.postMessage({ type: "closed", index: workerIndex }); port.close(); process.exit(0); }
  else { self.postMessage({ type: "closed", index: workerIndex }); self.close(); }
}

// ---------------------------------------------------------------- Box
class Box {
  constructor(team) {
    this.team = team;
    this.rng = new Rng(team.key, "");
    this.renamed = false;
    this.fds = new Map([[3, { vpath: "/", kind: DIR, pos: 0n, preopen: true }],
      [4, { vpath: "/", kind: DIR, pos: 0n, preopen: true }]]);
    this.spent_ = 0n; this.last_ = INT64_MAX; this.turn_ = 0n; this.reported_ = 0n;
    this.sleptNs = 0n; this.first_ = true; this.ended = false;
    this.unsupported = [];
    this.pending = null;
    this.meter = null; this.exhausted = null;
  }

  run() {
    const team = this.team;
    let start;
    try {
      if (teams.cap) {                  // testing: imitate a browser's cap on live memories (pool[2] counts them)
        if (Atomics.add(pool, 2, 1) >= teams.cap) { Atomics.sub(pool, 2, 1); throw new Error("could not allocate memory (test cap)"); }
        this.counted = true;
      }
      this.memory = new WebAssembly.Memory({ initial: team.memMin,
        maximum: Math.min(team.memMax, MAX_MEMORY_PAGES), shared: true });
      const imports = { env: { memory: this.memory } };
      for (const imp of WebAssembly.Module.imports(team.module)) {
        if (imp.kind !== "function") continue;
        (imports[imp.module] ||= {})[imp.name] = this.dispatcher(imp.module, imp.name);
      }
      const inst = new WebAssembly.Instance(team.module, imports);
      const ex = inst.exports;
      this.meter = ex.wasmer_metering_remaining_points || null;
      this.exhausted = ex.wasmer_metering_points_exhausted || null;
      start = ex._start;
      if (!this.meter || typeof start !== "function") throw new Error("no meter or _start");
    } catch (e) {
      slot.lock();
      slot.setFailure("the sandbox failed to start: " + (e?.message || e));
      slot.set(S.EXIT_SET, 1); slot.set(S.EXIT_CODE, -1);
      slot.set(S.OUT_CLOSED, 1);
      slot.notifyAll();
      slot.unlock();
      return;
    }
    this.pending = null;
    let code = null, failMsg = "";
    try {
      start();
      code = 0;
    } catch (e) {
      const p = this.pending;
      if (p instanceof Exit) code = p.code;
      else if (this.unsupported.length) failMsg = "sandbox error: " + this.unsupported[0];
      else {
        const burnt = this.exhausted && this.exhausted.value !== 0;
        failMsg = burnt ? "exceeded CPU limit"
          : "sandbox error: " + (p ? (p.msg ?? "dead") : (e?.message || String(e)));
      }
    }
    this.spent();
    this.meter = null;
    slot.lock();
    if (code !== null) { slot.set(S.EXIT_SET, 1); slot.set(S.EXIT_CODE, code); }
    if (failMsg) slot.setFailure(failMsg);
    slot.set(S.OUT_CLOSED, 1);
    slot.notifyAll();
    slot.unlock();
  }

  dispatcher(mod, name) {
    const key = mod + "." + name;
    const waits = !EXITS.has(name);
    const implemented = IMPLEMENTED.has(key) && !PY_ONLY.has(key);
    const denied = DENIED.has(name);
    const self = this;
    return function (...a) {
      try {
        if (waits) {
          slot.lock();
          while (!slot.get(S.FROZEN)) slot.wait();
          const dead = slot.get(S.DEAD);
          slot.unlock();
          if (dead) throw new Dead();
        }
        if (!self.first_) self.mark();
        if (!implemented) {
          if (denied) return ENOTSUP;
          self.unsupported.push(key);
          throw new Unsupported(key);
        }
        return self.host(name, a);
      } catch (e) {
        if (e instanceof Exit || e instanceof Unsupported || e instanceof HostError || e instanceof Dead) self.pending = e;
        else self.pending = new HostError(e?.message || String(e));
        TRAP();
      }
    };
  }

  // --- metering (sandbox.Sandbox) ---
  meterGet() { return this.meter.value; }
  meterSet(v) { this.meter.value = v; }
  spent() {
    if (this.meter) {
      const now = this.meterGet();
      if (this.first_) this.first_ = false;
      else this.spent_ += this.last_ - now;
      this.last_ = now;
    }
    return this.spent_;
  }
  mark() {
    if (this.ended) return;
    this.reported_ = this.spent();
    slot.lock();
    slot.setLivePoints(this.reported_ - this.turn_);
    slot.set(S.LIVE_MEM, this.memory.buffer.byteLength);
    slot.unlock();
  }
  refill(points) {
    if (!this.meter) return;
    const gap = this.spent() - this.reported_;
    this.turn_ = this.reported_;
    this.ended = false;
    let left = points - gap;
    if (left < 0n) left = 0n;
    this.meterSet(left);
    this.last_ = left;
  }
  now() { return this.spent() + this.sleptNs; }
  charge(points) {
    if (!this.meter) return;
    const left = this.meterGet();
    const v = left - points;
    this.meterSet(v > 0n ? v : 0n);
  }
  chargeWrite(total) {
    if (!this.meter) return;
    const cost = WRITE_SYSCALL_COST + total * WRITE_BYTE_COST;
    const left = this.meterGet();
    let nv = left - cost;
    if (nv < INT64_MIN) nv = INT64_MIN;
    this.meterSet(nv);
    if (!this.first_) this.mark();
    if (left < cost) {
      if (this.exhausted) this.exhausted.value = 1;
      slot.lock(); slot.setFailure("exceeded CPU limit"); slot.unlock();
      throw new Exit(137);
    }
  }

  // --- memory ---
  dv() { return new DataView(this.memory.buffer); }
  u8() { return new Uint8Array(this.memory.buffer); }
  bound(ptr, n) {
    const len = this.memory.buffer.byteLength;
    if (ptr < 0 || n < 0 || ptr + n > len) throw new HostError(`guest pointer ${ptr}+${n} outside ${len} bytes`);
  }
  wr(ptr, data) { this.bound(ptr, data.length); if (data.length) this.u8().set(data, ptr); }
  rd(ptr, n) { this.bound(ptr, n); return this.u8().slice(ptr, ptr + n); }
  w8(p, v) { this.bound(p, 1); this.dv().setUint8(p, v & 0xff); }
  w32(p, v) { this.bound(p, 4); this.dv().setUint32(p, v >>> 0, true); }
  w64(p, v) { this.bound(p, 8); this.dv().setBigUint64(p, BigInt.asUintN(64, BigInt(v)), true); }
  r32(p) { this.bound(p, 4); return this.dv().getUint32(p, true); }
  iov(iovs, k) { this.bound(iovs + 8 * k, 8); const d = this.dv(); return [d.getUint32(iovs + 8 * k, true), d.getUint32(iovs + 8 * k + 4, true)]; }

  node(fd) { return this.fds.get(fd); }
  freeFd() { let fd = 3; while (this.fds.has(fd)) fd++; return fd; }
  filestatRoot(out) {
    const s = new Uint8Array(64), d = new DataView(s.buffer);
    d.setBigUint64(0, 1n, true); s[16] = DIR; d.setBigUint64(24, 1n, true); d.setBigUint64(32, 4096n, true);
    this.wr(out, s);
    return OK;
  }

  readStdin(iovs, n, out) {
    let total = 0;
    for (let k = 0; k < n; k++) {
      const [ptr, length] = this.iov(iovs, k);
      let chunk, refill = false;
      slot.lock();
      let parked = false;
      while (slot.inAvail() === 0 && !slot.get(S.IN_CLOSED)) {
        if (!parked) {
          parked = true;
          slot.set(S.PARKS, slot.get(S.PARKS) + 1);
          slot.notifyAll();
        }
        slot.wait();
      }
      chunk = slot.inTake(Math.min(slot.inAvail(), length));
      if (slot.get(S.BUDGET)) { refill = true; slot.set(S.BUDGET, 0); }
      if (!this.renamed && slot.get(S.NAME_LEN)) {   // start() renamed the spare's Rng
        this.rng = new Rng(this.team.key, slot.name());
        this.renamed = true;
      }
      slot.unlock();
      if (refill) this.refill(100_000_000n);
      if (chunk.length) this.wr(ptr, chunk);
      total += chunk.length;
      if (chunk.length < length) break;
    }
    this.charge(BigInt(total) * READ_BYTE_COST);
    this.w32(out, total);
    return OK;
  }

  fdWrite(fd, iovs, n, out) {
    const chunks = [];
    let total = 0n;
    for (let k = 0; k < n; k++) {
      const [ptr, length] = this.iov(iovs, k);
      chunks.push([ptr, length]);
      total += BigInt(length);
    }
    this.chargeWrite(total);
    for (const [ptr, length] of chunks) {
      this.bound(ptr, length);
      const p = this.u8().slice(ptr, ptr + length);
      slot.lock();
      if (fd === 2) slot.set(S.ERR_BYTES, slot.get(S.ERR_BYTES) + length);
      else if (slot.get(S.ATTACHED)) {
        if (slot.framerFeed(p)) { this.ended = true; slot.set(S.FROZEN, 0); }   // end_turn
        slot.notifyAll();
      }
      slot.unlock();
    }
    this.w32(out, Number(total & 0xffffffffn));
    return OK;
  }

  host(name, a) {
    const I = (k) => Number(a[k]);
    const L = (k) => BigInt(a[k]);
    const str = (p, n) => this.rd(p, Math.max(0, n));
    switch (name) {
      case "args_sizes_get": this.w32(I(0), 1); this.w32(I(1), 4); return OK;
      case "args_get": this.w32(I(0), I(1)); this.wr(I(1), new TextEncoder().encode("bot\0")); return OK;
      case "environ_sizes_get": this.w32(I(0), 1); this.w32(I(1), 10); return OK;
      case "environ_get": this.w32(I(0), I(1)); this.wr(I(1), new TextEncoder().encode("TERM=dumb\0")); return OK;
      case "clock_time_get": {
        const t = (I(0) === 0 ? VIRTUAL_EPOCH_NS : 0n) + this.now();
        this.w64(I(2), t);
        return OK;
      }
      case "clock_res_get": this.w64(I(1), 1n); return OK;
      case "random_get": {
        const n = I(1);
        this.wr(I(0), n > 0 ? this.rng.fill(n) : new Uint8Array(0));
        return OK;
      }
      case "sched_yield": return OK;
      case "poll_oneoff": {
        const subs = I(0), events = I(1), n = I(2), out = I(3);
        if (n === 0) return EINVAL;
        for (let k = 0; k < n; k++) if (this.rd(subs + 48 * k + 8, 1)[0] !== 0) return E2BIG;
        let wait = null;
        const fired = [];
        for (let k = 0; k < n; k++) {
          const b = subs + 48 * k;
          const ud = new DataView(this.rd(b, 8).buffer).getBigUint64(0, true);
          this.rd(b + 8, 1);
          const c = new DataView(this.rd(b + 16, 26).buffer);
          const timeout = c.getBigUint64(8, true), flags = c.getUint16(24, true);
          let nanos = timeout;
          if (flags & 1) { const d = timeout - this.now(); nanos = d > 0n ? d : 0n; }
          wait = wait === null ? nanos : (nanos < wait ? nanos : wait);
          fired.push(ud);
        }
        if (wait) this.sleptNs += wait;
        fired.forEach((ud, k) => {
          const e = new Uint8Array(28);
          new DataView(e.buffer).setBigUint64(0, ud, true);
          this.wr(events + 32 * k, e);
        });
        this.w32(out, fired.length);
        return OK;
      }
      case "fd_prestat_get": {
        const nd = this.node(I(0));
        if (!nd || !nd.preopen) return EBADF;
        const s = new Uint8Array(8); new DataView(s.buffer).setUint32(4, 1, true);
        this.wr(I(1), s);
        return OK;
      }
      case "fd_prestat_dir_name": {
        const nd = this.node(I(0));
        if (!nd || !nd.preopen) return EBADF;
        this.wr(I(1), I(2) >= 1 ? new Uint8Array([0x2f]) : new Uint8Array(0));
        return OK;
      }
      case "fd_fdstat_get": {
        const fd = I(0);
        let kind;
        if (fd >= 0 && fd <= 2) kind = CHARACTER;
        else { const nd = this.node(fd); if (!nd) return EBADF; kind = nd.kind; }
        const s = new Uint8Array(24), d = new DataView(s.buffer);
        s[0] = kind; d.setBigUint64(8, ALL_RIGHTS, true); d.setBigUint64(16, ALL_RIGHTS, true);
        this.wr(I(1), s);
        return OK;
      }
      case "fd_fdstat_set_flags": case "fd_fdflags_set": case "chdir": return OK;
      case "fd_fdflags_get": this.w32(I(1), 0); return OK;
      case "fd_filestat_get": {
        const fd = I(0);
        if (fd >= 0 && fd <= 2) {
          const s = new Uint8Array(64), d = new DataView(s.buffer);
          d.setBigUint64(0, 1n, true); d.setBigUint64(8, BigInt(fd), true); s[16] = CHARACTER; d.setBigUint64(24, 1n, true);
          this.wr(I(1), s);
          return OK;
        }
        return this.node(fd) ? this.filestatRoot(I(1)) : EBADF;
      }
      case "path_filestat_get": {
        const nd = this.node(I(0));
        if (!nd) return EBADF;
        const p = str(I(2), I(3));
        if (!resolvesToRoot(nd.vpath, p)) return ENOENT;
        return this.filestatRoot(I(4));
      }
      case "path_readlink": {
        const nd = this.node(I(0));
        if (!nd) return EBADF;
        return resolvesToRoot(nd.vpath, str(I(1), I(2))) ? EINVAL : ENOENT;
      }
      case "path_open2": {
        const nd = this.node(I(0));
        if (!nd) return EBADF;
        const p = str(I(2), I(3));
        const oflags = I(4);
        if ((oflags & 1) || (oflags & 8)) return EACCES;
        if (!resolvesToRoot(nd.vpath, p)) return ENOENT;
        const fd = this.freeFd();
        this.fds.set(fd, { vpath: "/", kind: DIR, pos: 0n, preopen: false });
        this.w32(I(9), fd);
        return OK;
      }
      case "fd_close": this.fds.delete(I(0)); return OK;
      case "path_create_directory": case "path_unlink_file": {
        if (!this.node(I(0))) return EBADF;
        str(I(1), I(2));
        return EACCES;
      }
      case "path_rename": {
        if (!this.node(I(0)) || !this.node(I(3))) return EBADF;
        str(I(1), I(2)); str(I(4), I(5));
        return EACCES;
      }
      case "path_remove_directory": case "path_filestat_set_times": {
        const rm = name === "path_remove_directory";
        const nd = this.node(I(0));
        if (!nd) return EBADF;
        const p = str(rm ? I(1) : I(2), rm ? I(2) : I(3));
        if (!resolvesToRoot(nd.vpath, p)) return ENOENT;
        return EACCES;
      }
      case "path_symlink": { if (!this.node(I(2))) return EBADF; str(I(3), I(4)); return EACCES; }
      case "path_link": { if (!this.node(I(4))) return EBADF; str(I(5), I(6)); return EACCES; }
      case "fd_filestat_set_times": case "fd_filestat_set_size": return this.node(I(0)) ? EACCES : EBADF;
      case "fd_pwrite": return this.fdWrite(I(0), I(1), I(2), I(4));
      case "fd_advise": case "fd_datasync": case "fd_sync": return this.node(I(0)) ? OK : EBADF;
      case "fd_dup": {
        const nd = this.node(I(0));
        if (!nd) return EBADF;
        const fd = this.freeFd();
        this.fds.set(fd, { ...nd });
        this.w32(I(1), fd);
        return OK;
      }
      case "clock_time_set": case "proc_parent": case "proc_raise_interval": return ENOSYS;
      case "fd_renumber": {
        const a0 = I(0), b0 = I(1), nd = this.node(a0);
        if (nd) { const c = { ...nd }; this.fds.delete(a0); this.fds.delete(b0); this.fds.set(b0, c); }
        return OK;
      }
      case "fd_dup2": {
        const a0 = I(0), b0 = I(2), nd = this.node(a0);
        if (nd && a0 !== b0) { const c = { ...nd }; this.fds.delete(b0); this.fds.set(b0, c); }
        this.w32(I(3), I(2));
        return OK;
      }
      case "fd_read": {
        const fd = I(0);
        if (fd === 0) return this.readStdin(I(1), I(2), I(3));
        return this.node(fd) ? EISDIR : EBADF;
      }
      case "fd_pread": {
        if (!this.node(I(0))) return EBADF;
        for (let k = 0; k < I(2); k++) { const [, length] = this.iov(I(1), k); if (length > 0) break; }
        this.charge(0n);
        this.w32(I(4), 0);
        return OK;
      }
      case "fd_seek": {
        const nd = this.node(I(0));
        if (!nd) return EBADF;
        const whence = I(2), off = L(1);
        let base;
        if (whence === 0 || whence === -3) base = 0n;
        else if (whence === 1 || whence === -2) base = nd.pos;
        else if (whence === 2 || whence === -1) base = 0n;
        else throw new HostError("tuple index out of range");
        const p = base + off;
        nd.pos = p > 0n ? BigInt.asUintN(64, p) : 0n;
        this.w64(I(3), nd.pos);
        return OK;
      }
      case "fd_tell": { const nd = this.node(I(0)); if (!nd) return EBADF; this.w64(I(1), nd.pos); return OK; }
      case "fd_readdir": {
        const nd = this.node(I(0));
        if (!nd) return EBADF;
        if (nd.kind !== DIR) return ENOTDIR;
        const buf = I(1), buflen = I(2), cookie = L(3);
        const names = [".", ".."];
        let blob = [];
        for (let index = 0; index < 2; index++) {
          if (BigInt(index) < cookie) continue;
          const e = new Uint8Array(24), d = new DataView(e.buffer);
          d.setBigUint64(0, BigInt(index + 1), true); d.setBigUint64(8, BigInt(index + 7), true);
          d.setUint32(16, names[index].length, true); e[20] = DIR;
          blob.push(...e, ...new TextEncoder().encode(names[index]));
          if (blob.length >= buflen) break;
        }
        const cut = buflen >= 0 ? Math.min(buflen, blob.length) : Math.max(0, blob.length + buflen);
        this.wr(buf, Uint8Array.from(blob.slice(0, cut)));
        this.w32(I(4), Math.min(blob.length, buflen));
        return OK;
      }
      case "fd_write": return this.fdWrite(I(0), I(1), I(2), I(3));
      case "getcwd": {
        const ptr = I(0), lenptr = I(1);
        const maxlen = this.r32(lenptr);
        this.w32(lenptr, 1);
        if (1 > maxlen) return ERANGE;
        if (ptr === 0 || maxlen === 0) return EINVAL;
        this.wr(ptr, new Uint8Array([0x2f]));
        if (1 < maxlen) this.wr(ptr + 1, new Uint8Array([0]));
        return OK;
      }
      case "tty_get": return ENOTTY;
      case "thread_id": case "thread_parallelism": case "proc_id": this.w32(I(0), 1); return OK;
      case "proc_signals_sizes_get": this.w32(I(0), 0); return OK;
      case "proc_signals_get": return OK;
      case "thread_exit": case "proc_exit": case "proc_exit2": throw new Exit(I(0));
      case "futex_wait": {
        const ptr = I(0), expected = I(1), tptr = I(2), woken = I(3);
        // u32 against the signed i32, as the judge compares
        if (this.r32(ptr) !== expected) { this.w8(woken, 1); return OK; }
        if (tptr && this.rd(tptr, 1)[0]) { this.w8(woken, 0); return OK; }
        this.unsupported.push("futex_wait would block forever (the judge runs one thread)");
        throw new Unsupported("futex_wait would block forever (the judge runs one thread)");
      }
      case "futex_wake": case "futex_wake_all": this.w8(I(1), 0); return OK;
    }
    throw new HostError("unhandled host function");
  }
}

// Sandbox._resolve: the root is an empty directory, so only "/" exists.
function resolvesToRoot(base, relBytes) {
  const rel = new TextDecoder().decode(relBytes);
  const v = rel.startsWith("/") ? rel : base + "/" + rel;
  const parts = [];
  for (const part of v.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(part);
  }
  return parts.length === 0;
}
