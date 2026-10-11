// runGame(): one game of the official judge, re-run on this machine.
//   engine: WebAssembly.Module of unswbc_engine.wasm
//   bots:   [{ module, bytes }, { module, bytes }]  (metered wasm; bytes for the memory limits)
//   map:    Uint8Array, seed: decimal string (u64), names: [a, b] for the replay header
// Resolves to { winner, rounds, reason, deaths, points, replay (Uint8Array), ... }.
import { SLOT_BYTES, memoryLimits } from "./shared.js";

const IS_NODE = typeof process !== "undefined" && !!process.versions?.node;
const here = (f) => new URL(f, import.meta.url);

async function makeWorker(file, onMessage) {
  if (IS_NODE) {
    const { Worker } = await import("node:worker_threads");
    const w = new Worker(here(file));
    w.on("message", onMessage);
    w.on("error", (e) => onMessage({ type: "error", message: String(e?.stack || e) }));
    return w;
  }
  const w = new Worker(here(file), { type: "module" });
  w.onmessage = (e) => onMessage(e.data);
  w.onerror = (e) => onMessage({ type: "error", message: e.message || "worker error" });
  return w;
}

export async function runGame({ engine, bots, map, seed, names, onRound, onPartial, liveReplayEvery = 0,
  maxWorkers = 512, spares = 6, retry = false, signal = null, memoryCap = 0 }) {
  const key = BigInt(seed).toString(16).padStart(16, "0");
  const teams = bots.map((b, t) => {
    const [memMin, memMax] = memoryLimits(b.bytes);
    return { module: b.module, key: `${key}-${t ? "b" : "a"}`, memMin, memMax };
  });
  const slots = new SharedArrayBuffer(SLOT_BYTES * 8, { maxByteLength: SLOT_BYTES * maxWorkers });
  const poolSab = new SharedArrayBuffer(4 * (16 + maxWorkers));
  const pool = new Int32Array(poolSab);
  const workers = new Map();           // slot index -> worker
  const free = [];                     // slot indices of closed workers
  let engineWorker, failed = null;
  const onBot = (m) => {
    if (m.type === "closed") { workers.delete(m.index); free.push(m.index); }
    else if (m.type === "error") failed?.(new Error("bot worker: " + m.message));
  };
  const spawn = async () => {         // one more spare bot worker
    let index = free.pop();
    if (index === undefined) {
      index = Atomics.load(pool, 0);
      if (index >= maxWorkers) return;
      if (slots.byteLength < (index + 1) * SLOT_BYTES) slots.grow((index + 1) * SLOT_BYTES);
      Atomics.store(pool, 16 + index, 3);
      Atomics.store(pool, 0, index + 1);
    } else Atomics.store(pool, 16 + index, 3);
    const w = await makeWorker("bot-worker.js", onBot);
    workers.set(index, w);
    w.postMessage({ slots, pool: poolSab, index, teams: Object.assign(teams.slice(), { cap: memoryCap }) });
  };
  try {
    return await new Promise(async (resolve, reject) => {
      failed = reject;
      if (signal) {
        if (signal.aborted) return reject(new Error("aborted"));
        signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
      }
      for (let i = 0; i < spares; i++) spawn();
      engineWorker = await makeWorker("engine-worker.js", async (m) => {
        if (m.type === "need") spawn();
        else if (m.type === "round") onRound?.(m);
        else if (m.type === "partial") onPartial?.(m);
        else if (m.type === "done") resolve(m);
        else if (m.type === "error") reject(new Error(m.message));
      });
      engineWorker.postMessage({ engine, slots, pool: poolSab, map, seed: String(seed), nameA: names[0],
        nameB: names[1], retry, liveReplayEvery });
    });
  } finally {
    engineWorker?.terminate();
    for (const w of workers.values()) w.terminate();
  }
}
