// Shared pieces of the browser judge: a port of unswbc 1.2.9 sandbox.py / turn.py
// (via tokenz-arena's judge/src/sandbox.cc, which was byte-identical to it).
// Threads talk through SharedArrayBuffers; a mutex + condition variable per slot
// stands in for the C++ Box's std::mutex / std::condition_variable.

export const MAX_TURN_POINTS = 100_000_000n;
export const MAX_MEMORY_PAGES = 768;
export const VIRTUAL_EPOCH_NS = 1_767_225_600_000_000_000n;
export const WRITE_SYSCALL_COST = 2_500_000n;
export const WRITE_BYTE_COST = 4_000n;
export const READ_BYTE_COST = 6n;
export const INT64_MAX = (1n << 63n) - 1n;
export const INT64_MIN = -(1n << 63n);
export const BUFFER_LIMIT = 10 * 1024;
export const DEBUG_ALL = 15, DEBUG_LIMITS = 16;

// ---------------------------------------------------------------- slot layout
// One slot per bot worker: the state the C++ Box shares with its controller.
export const S = {
  MU: 0, GEN: 1, FROZEN: 2, DEAD: 3, IN_CLOSED: 4, PARKS: 5, OUT_CLOSED: 6, BUDGET: 7,
  EXIT_SET: 8, EXIT_CODE: 9, F_ARMED: 10, F_DONE: 11, F_PARK_SET: 12, IN_LEN: 13, IN_OFF: 14,
  OUT_LEN: 15, LINE_LEN: 16, FAILURE_LEN: 17, ATTACHED: 18, CMD: 19, TEAM: 20, NAME_LEN: 21,
  LIVE_MEM: 22, RUNNING: 23, ERR_BYTES: 24, F_PARK_AT: 25, BOOTED: 26,
};
const HEADER = 256;                     // bytes of Int32 fields
const LIVE_PTS = 128;                   // BigInt64 at this byte offset (inside HEADER)
const FAILURE_OFF = HEADER, FAILURE_CAP = 1024;
const NAME_OFF = FAILURE_OFF + FAILURE_CAP, NAME_CAP = 64;
const OUT_OFF = NAME_OFF + NAME_CAP, OUT_CAP = BUFFER_LIMIT + 16;
const LINE_OFF = OUT_OFF + OUT_CAP, LINE_CAP = BUFFER_LIMIT + 16;
const IN_OFF_B = LINE_OFF + LINE_CAP;
export const IN_CAP = 256 << 10;
export const SLOT_BYTES = IN_OFF_B + IN_CAP;

export class Slot {
  constructor(sab, base = 0) {
    this.sab = sab;
    this.i = new Int32Array(sab, base, HEADER / 4);
    this.big = new BigInt64Array(sab, base + LIVE_PTS, 1);
    this.u8 = new Uint8Array(sab, base, SLOT_BYTES);
  }
  // --- mutex (Drepper's futex mutex) and condition variable ---
  lock() {
    const i = this.i;
    let c = Atomics.compareExchange(i, S.MU, 0, 1);
    if (c === 0) return;
    if (c !== 2) c = Atomics.exchange(i, S.MU, 2);
    while (c !== 0) {
      Atomics.wait(i, S.MU, 2);
      c = Atomics.exchange(i, S.MU, 2);
    }
  }
  unlock() {
    if (Atomics.sub(this.i, S.MU, 1) !== 1) {
      Atomics.store(this.i, S.MU, 0);
      Atomics.notify(this.i, S.MU, 1);
    }
  }
  wait(timeoutMs = Infinity) {           // cv.wait: call with the lock held
    const g = Atomics.load(this.i, S.GEN);
    this.unlock();
    Atomics.wait(this.i, S.GEN, g, timeoutMs);
    this.lock();
  }
  notifyAll() {
    Atomics.add(this.i, S.GEN, 1);
    Atomics.notify(this.i, S.GEN);
  }
  get(k) { return this.i[k]; }
  set(k, v) { this.i[k] = v; }

  // --- strings / buffers (lock held) ---
  setFailure(msg) {
    const b = new TextEncoder().encode(msg).subarray(0, FAILURE_CAP);
    this.u8.set(b, FAILURE_OFF);
    this.i[S.FAILURE_LEN] = b.length;
  }
  failure() { return dec(this.u8.slice(FAILURE_OFF, FAILURE_OFF + this.i[S.FAILURE_LEN])); }
  setName(name) {
    const b = new TextEncoder().encode(name).subarray(0, NAME_CAP);
    this.u8.set(b, NAME_OFF);
    this.i[S.NAME_LEN] = b.length;
  }
  name() { return dec(this.u8.slice(NAME_OFF, NAME_OFF + this.i[S.NAME_LEN])); }
  livePoints() { return this.big[0]; }
  setLivePoints(v) { this.big[0] = v; }

  // stdin pipe
  inAppend(bytes) {
    let len = this.i[S.IN_LEN], off = this.i[S.IN_OFF];
    if (off > 0) {                        // compact what is left unread
      this.u8.copyWithin(IN_OFF_B, IN_OFF_B + off, IN_OFF_B + len);
      len -= off; off = 0;
    }
    if (len + bytes.length > IN_CAP) throw new Error(`stdin block of ${len + bytes.length} bytes exceeds ${IN_CAP}`);
    this.u8.set(bytes, IN_OFF_B + len);
    this.i[S.IN_LEN] = len + bytes.length;
    this.i[S.IN_OFF] = off;
  }
  inAvail() { return this.i[S.IN_LEN] - this.i[S.IN_OFF]; }
  inTake(n) {
    const off = this.i[S.IN_OFF];
    const out = this.u8.slice(IN_OFF_B + off, IN_OFF_B + off + n);
    this.i[S.IN_OFF] = off + n;
    if (this.i[S.IN_OFF] === this.i[S.IN_LEN]) { this.i[S.IN_LEN] = 0; this.i[S.IN_OFF] = 0; }
    return out;
  }

  reset() {                              // a fresh Box in this slot
    for (const k of [S.FROZEN, S.DEAD, S.IN_CLOSED, S.PARKS, S.OUT_CLOSED, S.BUDGET, S.EXIT_SET, S.EXIT_CODE,
      S.F_ARMED, S.F_DONE, S.F_PARK_SET, S.F_PARK_AT, S.IN_LEN, S.IN_OFF, S.OUT_LEN, S.LINE_LEN,
      S.FAILURE_LEN, S.ATTACHED, S.NAME_LEN, S.LIVE_MEM, S.ERR_BYTES, S.BOOTED]) this.i[k] = 0;
    this.i[S.FROZEN] = 1;
    this.big[0] = 0n;
  }

  // --- turn.Framer, on the slot (lock held) ---
  framerArm() {
    this.i[S.OUT_LEN] = 0; this.i[S.LINE_LEN] = 0;
    this.i[S.F_ARMED] = 1; this.i[S.F_DONE] = 0; this.i[S.F_PARK_SET] = 0;
  }
  framerFeed(p) {                        // true when ENDTURN ends the turn
    const u8 = this.u8, i = this.i;
    for (let k = 0; k < p.length; k++) {
      const byte = p[k];
      if (byte !== 0x0A) {
        if (i[S.LINE_LEN] < BUFFER_LIMIT) u8[LINE_OFF + i[S.LINE_LEN]++] = byte;
        continue;
      }
      let n = i[S.LINE_LEN];
      if (n > 0 && u8[LINE_OFF + n - 1] === 0x0D) n--;
      const l = u8.subarray(LINE_OFF, LINE_OFF + n);
      i[S.LINE_LEN] = 0;
      if (eq(l, READY)) continue;
      if (startsWith(l, PARK)) {
        let a = PARK.length, b = n;
        while (a < b && isSpace(l[a])) a++;
        while (b > a && isSpace(l[b - 1])) b--;
        let digits = a < b;
        for (let q = a; q < b && digits; q++) digits = l[q] >= 0x30 && l[q] <= 0x39;
        let v = -1;
        if (digits && b - a <= 9) v = Number(dec(l.slice(a, b)));
        // counts beyond 9 digits never match what was written (blocks are < 1 MiB)
        i[S.F_PARK_SET] = 1; i[S.F_PARK_AT] = v;
        continue;
      }
      if (!i[S.F_ARMED]) continue;
      if (eq(l, ENDTURN)) { i[S.F_ARMED] = 0; i[S.F_DONE] = 1; return true; }
      const out = i[S.OUT_LEN];
      if (out < BUFFER_LIMIT) {
        const room = BUFFER_LIMIT - out, take = Math.min(room, n);
        u8.copyWithin(OUT_OFF + out, LINE_OFF, LINE_OFF + take);
        i[S.OUT_LEN] = out + take;
        if (i[S.OUT_LEN] < BUFFER_LIMIT) u8[OUT_OFF + i[S.OUT_LEN]++] = 0x0A;
      }
    }
    return false;
  }
  framerTake() {
    const i = this.i;
    if (i[S.OUT_LEN] < BUFFER_LIMIT && !i[S.F_DONE]) {
      const room = BUFFER_LIMIT - i[S.OUT_LEN], take = Math.min(room, i[S.LINE_LEN]);
      this.u8.copyWithin(OUT_OFF + i[S.OUT_LEN], LINE_OFF, LINE_OFF + take);
      i[S.OUT_LEN] += take;
    }
    i[S.LINE_LEN] = 0;
    const r = utf8Replace(this.u8.slice(OUT_OFF, OUT_OFF + i[S.OUT_LEN]));
    i[S.OUT_LEN] = 0;
    return r;
  }
  framerSaid() { return this.i[S.OUT_LEN] > 0 || this.i[S.LINE_LEN] > 0; }
}

const enc = (s) => new TextEncoder().encode(s);
const READY = enc("READY"), ENDTURN = enc("ENDTURN");
const PARK = new Uint8Array([0, ...enc("UNSWBC PARK")]);
const isSpace = (c) => c === 0x20 || (c >= 9 && c <= 13);
function eq(a, b) {
  if (a.length !== b.length) return false;
  for (let k = 0; k < a.length; k++) if (a[k] !== b[k]) return false;
  return true;
}
function startsWith(a, b) {
  if (a.length < b.length) return false;
  for (let k = 0; k < b.length; k++) if (a[k] !== b[k]) return false;
  return true;
}
export function dec(b) { return new TextDecoder().decode(b); }

// bytes.decode("utf-8", "replace").encode(): each maximal invalid subpart -> U+FFFD
export function utf8Replace(p) {
  const out = [];
  const n = p.length;
  let i = 0;
  while (i < n) {
    const b = p[i];
    if (b < 0x80) { out.push(b); i++; continue; }
    let need, lo = 0x80, hi = 0xBF;
    if (b >= 0xC2 && b <= 0xDF) need = 1;
    else if (b === 0xE0) { need = 2; lo = 0xA0; }
    else if ((b >= 0xE1 && b <= 0xEC) || b === 0xEE || b === 0xEF) need = 2;
    else if (b === 0xED) { need = 2; hi = 0x9F; }
    else if (b === 0xF0) { need = 3; lo = 0x90; }
    else if (b >= 0xF1 && b <= 0xF3) need = 3;
    else if (b === 0xF4) { need = 3; hi = 0x8F; }
    else { out.push(0xEF, 0xBF, 0xBD); i++; continue; }
    let k = 1, ok = true;
    for (; k <= need; k++) {
      if (i + k >= n) { ok = false; break; }
      const c = p[i + k], l2 = k === 1 ? lo : 0x80, h2 = k === 1 ? hi : 0xBF;
      if (c < l2 || c > h2) { ok = false; break; }
    }
    if (ok) { for (let q = 0; q <= need; q++) out.push(p[i + q]); i += need + 1; }
    else { out.push(0xEF, 0xBF, 0xBD); i += k; }
  }
  return Uint8Array.from(out);
}

// ---------------------------------------------------------------- sha256
const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]);
export function sha256(msg) {
  const l = msg.length, nb = ((l + 9 + 63) >> 6) << 6;
  const buf = new Uint8Array(nb);
  buf.set(msg); buf[l] = 0x80;
  const dv = new DataView(buf.buffer);
  dv.setUint32(nb - 4, (l * 8) >>> 0); dv.setUint32(nb - 8, Math.floor(l / 0x20000000));
  const h = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const w = new Uint32Array(64);
  const r = (x, n) => (x >>> n) | (x << (32 - n));
  for (let o = 0; o < nb; o += 64) {
    for (let t = 0; t < 16; t++) w[t] = dv.getUint32(o + t * 4);
    for (let t = 16; t < 64; t++) {
      const s0 = r(w[t - 15], 7) ^ r(w[t - 15], 18) ^ (w[t - 15] >>> 3);
      const s1 = r(w[t - 2], 17) ^ r(w[t - 2], 19) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let t = 0; t < 64; t++) {
      const t1 = (hh + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + K[t] + w[t]) >>> 0;
      const t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
      hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    h[0] += a; h[1] += b; h[2] += c; h[3] += d; h[4] += e; h[5] += f; h[6] += g; h[7] += hh;
  }
  const out = new Uint8Array(32), odv = new DataView(out.buffer);
  for (let t = 0; t < 8; t++) odv.setUint32(t * 4, h[t]);
  return out;
}

// ---------------------------------------------------------------- Rng (xoshiro256**)
const M64 = (1n << 64n) - 1n;
const rotl = (v, k) => ((v << k) | (v >> (64n - k))) & M64;
export class Rng {
  constructor(key = "", process = "") {
    const d = sha256(enc(key + "\0" + process));
    const dv = new DataView(d.buffer);
    this.s = [0, 1, 2, 3].map((i) => dv.getBigUint64(i * 8, true));
  }
  next() {
    const s = this.s;
    const out = (rotl((s[1] * 5n) & M64, 7n) * 9n) & M64;
    const t = (s[1] << 17n) & M64;
    s[2] ^= s[0]; s[3] ^= s[1]; s[1] ^= s[2]; s[0] ^= s[3]; s[2] ^= t;
    s[3] = rotl(s[3], 45n);
    return out;
  }
  fill(n) {
    const out = new Uint8Array(Math.ceil(n / 8) * 8), dv = new DataView(out.buffer);
    for (let o = 0; o < out.length; o += 8) dv.setBigUint64(o, this.next(), true);
    return out.subarray(0, n);
  }
}

// ---------------------------------------------------------------- wasm imports
// parse_imports: an imported memory's (minimum, maximum or 65536)
export function memoryLimits(bytes) {
  let j = 8;
  const uleb = () => {
    let r = 0, sh = 0, b;
    do { b = bytes[j++]; r += (b & 0x7f) * 2 ** sh; sh += 7; } while (b & 0x80);
    return r;
  };
  while (j < bytes.length) {
    const id = bytes[j++], size = uleb(), end = j + size;
    if (id === 2) {
      const n = uleb();
      for (let k = 0; k < n; k++) {
        let len = uleb(); j += len;       // module
        len = uleb(); j += len;           // name
        const kind = bytes[j++];
        if (kind === 0) uleb();
        else if (kind === 1) { j++; const lim = bytes[j++]; uleb(); if (lim & 1) uleb(); }
        else if (kind === 2) {
          const lim = bytes[j++], min = uleb();
          let max = null;
          if (lim & 1) max = uleb();
          return [min, max || 65536];
        } else if (kind === 3) { j += 2; }
        else if (kind === 4) { j += 1; uleb(); }
      }
    }
    j = end;
  }
  return [1, 65536];
}
