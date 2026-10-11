# tokenz-arena-pages

A static copy of the tokenz team arena (unswbc dragons bots), for GitHub Pages: leaderboard, bots,
games, duels, maps and competition-server results. Replays aren't stored: the browser re-runs a game
from its map, seed and both bots' metered wasm with the official engine.

## Layout

| path | what |
|---|---|
| `index.html`, `app/` | the site (hash routes; no build step) |
| `runner/` | the judge in the browser: `game.js` (`runGame`), `engine-worker.js` (engine + each dragon's turn control), `bot-worker.js` (one dragon's sandbox), `shared.js` |
| `viewer/` | the toolkit's replay viewer (unswbc 1.2.9's VS Code webview bundle, unchanged) in a plain page |
| `data/db/` | `arena.db` in 32 MB chunks, read with HTTP range requests (sql.js-httpvfs) |
| `data/*.json` | summaries the pages load directly |
| `wasm/` | `engine.wasm.gz` and every bot's metered build, `bots/<sha256>.wasm.gz` |
| `maps/<sha256>.map` | every map version a game was played on |
| `vendor/` | sql.js-httpvfs 0.8.12 (one patch, `vendor/PATCHES.txt`); `coi-serviceworker.min.js` is coi-serviceworker 0.1.7 |
| `exporter/` | `export.py` + `finish.py`: tokenz-arena's data folder to `data/`, `wasm/`, `maps/` (run on the arena host) |
| `tools/serve.mjs` | a local static server like Pages (range requests, no COOP/COEP headers) |

## The browser judge

A port of unswbc 1.2.9's sandbox (`sandbox.py`/`turn.py`, via tokenz-arena's C++ judge, which was
byte-identical to it). One Web Worker per dragon blocks on a SharedArrayBuffer inside its stdin
read; the engine's worker blocks the same way inside `bot_reply`. CPU points come from the bots'
pre-metered wasm and are refilled to 100M per turn as in the judge, the clock is virtual (points
spent), random numbers are seeded from the match seed, and a dragon dying in its turn isn't retried
(the arena's strict rule). GitHub Pages can't send COOP/COEP, so `coi-serviceworker` adds them.

Chrome lets one page hold only ~125 wasm memories, and a game can have 128 dragons alive. Each
worker hosts one dragon and closes when it dies (so its memory is freed at once); when a memory still
can't be had, the engine evicts the live dragon that is cheapest to rebuild and later rebuilds it by
sending its new sandbox every block the old one got (exact: a dragon's state depends only on them).

Needs WebAssembly exception handling with exnref (Chrome 137+, Firefox 131+, Safari 18.4+).
Node 24 runs it with `--experimental-wasm-exnref`:

    node --experimental-wasm-exnref runner/node-check.mjs <fixtures dir> [game index ...]

## Rebuilding the data

On the arena host (reads an allowlist of the data folder; never `arena.toml`, worker tokens,
`scaler/`, `leases.json`):

    python3 exporter/export.py ~/tokenz-arena-data ~/tokenz-arena OUT
    python3 exporter/finish.py ~/tokenz-arena-data OUT

then copy `OUT/{data,wasm,maps}` here. Preview with `node tools/serve.mjs 8000`.
