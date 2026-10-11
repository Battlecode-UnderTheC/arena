// Re-running a stored game in the browser: the official engine and both bots' metered wasm,
// with the judge's sandbox (runner/), then the replay in the toolkit's viewer.
import { runGame } from "../runner/game.js";

const modules = new Map();
const url = (p) => new URL(`../${p}`, import.meta.url);

async function gunzip(path) {
  const r = await fetch(url(path));
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
  return new Uint8Array(await new Response(r.body.pipeThrough(new DecompressionStream("gzip"))).arrayBuffer());
}

async function wasm(path) {
  if (!modules.has(path)) {
    modules.set(path, (async () => {
      const bytes = await gunzip(path);
      return { bytes, module: await WebAssembly.compile(bytes) };
    })());
  }
  return modules.get(path);
}

export function canRun() {
  if (!globalThis.crossOriginIsolated) return "This page isn't cross-origin isolated yet (the service worker adds that); reload the page once.";
  try { new WebAssembly.Module(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 10, 8, 1, 6, 0, 31, 64, 0, 11, 11])); }
  catch { return "This browser can't run the bots: they need WebAssembly exception handling with exnref (Chrome 137+, Firefox 131+, Safari 18.4+)."; }
  return null;
}

// The viewer frame: resolves once its bundle said ready; show({type: "open"|"map", ...}).
export function viewer(frame) {
  let ready;
  const isReady = new Promise((r) => { ready = r; });
  const onMsg = (e) => { if (e.source === frame.contentWindow && e.data?.__viewerReady) ready(); };
  window.addEventListener("message", onMsg);
  return {
    async show(m) { await isReady; frame.contentWindow.postMessage({ __viewer: true, ...m }, "*"); },
    close() { window.removeEventListener("message", onMsg); },
  };
}

export async function play(game, bots, { onStatus, onRound, onPartial, signal }) {
  onStatus?.("loading the engine and both bots…");
  const [engine, a, b, map] = await Promise.all([
    wasm("wasm/engine.wasm.gz"),
    wasm(bots[game.a].wasm),
    wasm(bots[game.b].wasm),
    fetch(url(`maps/${game.map_sha}.map`)).then((r) => r.arrayBuffer()).then((x) => new Uint8Array(x)),
  ]);
  onStatus?.("playing…");
  const t0 = performance.now();
  const r = await runGame({
    engine: engine.module, bots: [a, b], map, seed: game.seed, names: [game.a, game.b],
    liveReplayEvery: 25, onRound, onPartial, signal,
    maxWorkers: 384,
  });
  r.wall = (performance.now() - t0) / 1000;
  return r;
}
