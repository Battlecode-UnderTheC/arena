// Re-run stored games, compute their metrics from the replay (runner/metrics.js) and compare with
// the arena's stored metrics files.
//   node --experimental-wasm-exnref runner/metrics-check.mjs <fixtures dir> [game index ...]
import fs from "node:fs";
import path from "node:path";
import { runGame } from "./game.js";
import { computeMetrics } from "./metrics.js";

const dir = process.argv[2];
const games = JSON.parse(fs.readFileSync(path.join(dir, "games.json"), "utf8").replace(/"seed": (\d+)/g, '"seed": "$1"'));
const pick = process.argv.slice(3).map(Number);
const engine = await WebAssembly.compile(fs.readFileSync(path.join(dir, "unswbc_engine.wasm")));
const bot = async (n) => { const bytes = fs.readFileSync(path.join(dir, "bots", n + ".wasm")); return { bytes, module: await WebAssembly.compile(bytes) }; };
const close = (a, b) => a === b || (typeof a === "number" && typeof b === "number" && Math.abs(a - b) < 1e-9);
for (const [i, g] of games.entries()) {
  if (pick.length ? !pick.includes(i) : typeof g.id !== "number") continue;
  const f = path.join(dir, "metrics", `${g.id}.json`);
  if (!fs.existsSync(f)) continue;
  const want = JSON.parse(fs.readFileSync(f, "utf8"));
  const r = await runGame({ engine, bots: [await bot(g.a), await bot(g.b)], map: fs.readFileSync(path.join(dir, "maps", g.map_sha + ".map")), seed: g.seed, names: [g.a, g.b] });
  const got = await computeMetrics(r.replay);
  const bad = [];
  if (JSON.stringify(got.rounds) !== JSON.stringify(want.rounds)) bad.push("rounds");
  for (const k of Object.keys(want.team)) for (const t of "AB") {
    const a = got.team[k]?.[t] || [], b = want.team[k][t];
    const j = b.findIndex((v, x) => !close(a[x], v));
    if (j >= 0 || a.length !== b.length) bad.push(`${k}.${t}@r${want.rounds[j]}: ${a[j]} vs ${b[j]}`);
  }
  const ea = got.game.eval, eb = want.game.eval;
  const je = eb.findIndex((v, x) => !close(ea[x], v));
  if (je >= 0) bad.push(`eval@r${want.rounds[je]}: ${ea[je]} vs ${eb[je]}`);
  if (JSON.stringify(got.queens) !== JSON.stringify(want.queens)) bad.push(`queens ${JSON.stringify(got.queens)} vs ${JSON.stringify(want.queens)}`);
  console.log(`${bad.length ? "DIFF" : "SAME"} #${i} ${g.id} ${g.map}` + (bad.length ? `: ${bad.slice(0, 4).join("; ")}${bad.length > 4 ? ` (+${bad.length - 4})` : ""}` : ""));
}
process.exit(0);
