// Re-run stored games under node and compare winner / rounds with what the arena recorded.
//   node --experimental-wasm-exnref runner/node-check.mjs <fixtures dir> [game index ...]
import fs from "node:fs";
import path from "node:path";
import { runGame } from "./game.js";

const dir = process.argv[2];
const games = JSON.parse(fs.readFileSync(path.join(dir, "games.json"), "utf8").replace(/"seed": (\d+)/g, "\"seed\": \"$1\""));
const pick = process.argv.slice(3).map(Number);
const memoryCap = +(process.env.CAP || 0);
const engine = await WebAssembly.compile(fs.readFileSync(path.join(dir, "unswbc_engine.wasm")));
const cache = new Map();
async function bot(name) {
  if (!cache.has(name)) {
    const bytes = fs.readFileSync(path.join(dir, "bots", name + ".wasm"));
    cache.set(name, { bytes, module: await WebAssembly.compile(bytes) });
  }
  return cache.get(name);
}

let same = 0, diff = 0;
for (const [i, g] of games.entries()) {
  if (pick.length && !pick.includes(i)) continue;
  const map = fs.readFileSync(path.join(dir, "maps", g.map_sha + ".map"));
  const t0 = Date.now();
  try {
    const alive = new Map();
    const r = await runGame({ engine, bots: [await bot(g.a), await bot(g.b)], map, seed: g.seed, names: [g.a, g.b], memoryCap,
      onRound: (m) => alive.set(m.round, m.alive) });
    let firstDiff = null;
    for (const [round, a, b] of g.dragons || []) {
      const got = alive.get(round - 1);
      if (got && (got[0] !== a || got[1] !== b)) { firstDiff = `round ${round}: got ${got} want ${a},${b}`; break; }
    }
    const ok = r.winner === g.winner && r.rounds === g.rounds;
    ok ? same++ : diff++;
    console.log(`${ok ? "SAME" : "DIFF"} #${i} ${g.lane} ${g.map} ${g.a} vs ${g.b}: got ${r.winner} ${r.rounds} (${r.reason})` +
      ` want ${g.winner} ${g.rounds} (${g.reason})  ${((Date.now() - t0) / 1000).toFixed(1)}s` +
      (r.errors.length ? `  errors ${r.errors.length}: ${r.errors[0].error}` : "") + (firstDiff ? `  first diff ${firstDiff}` : "") + (r.evictions?.count ? `  evictions ${r.evictions.count}, rebuilt ${r.evictions.replayed}` : ""));
  } catch (e) {
    diff++;
    console.log(`FAIL #${i} ${g.map}: ${e.stack || e}`);
  }
}
console.log(`same ${same}, different ${diff}`);
process.exit(0);
