# arena

The tokenz team arena (unswbc dragons bots), frozen when it shut down on 2026-10-09 and served from
GitHub Pages at https://battlecode-underthec.github.io/arena/. The pages are the arena's own website, unchanged: its backend runs in the browser.

## How it works

- **The backend is a service worker** (`sw.js`, built from `sw-src/`). It answers the arena's URLs
  (`/`, `/s/<id>`, `/bots/<bot>`, `/games`, `/games/<id>`, `/lineage`, `/ideas`, `/maps`, `/duels`,
  `/evals`, `/docs`, `/llms.txt`, `/api/v1/...`) with the HTML and JSON the arena served: a port of
  `arena/web/*.py`, `arena/api/http.py` and friends. Checked against the arena's own rendering of
  its pages: identical apart from who the visitor is and which games say "watch".
- **The data is one SQLite file** (`data/site/site.db.*`, 32 MB chunks) read in place with HTTP
  range requests through a wa-sqlite VFS. Since the arena is frozen, what it computed per request
  (verdicts, reports, leaderboard, head-to-heads, map stats, metric summaries, duel summaries) is
  computed once by the exporter.
- **Replays aren't stored: games are re-run in the browser.** A game is deterministic given its map,
  seed and both bots, and everything is wasm. The game page runs the official engine
  (`wasm/engine.wasm.gz`, unswbc 1.2.9) and both bots' metered builds (`wasm/bots/<sha256>.wasm.gz`,
  exactly what the judge ran) with a port of the judge's sandbox (`runner/`): one Web Worker per
  dragon, CPU points refilled to 100M per turn, a virtual clock, seeded random numbers. The toolkit's
  replay viewer (`viewer/`) shows it live every 25 rounds, and says whether the result matches the
  arena's record.
- Writes (submitting, promoting, notes) and the live competition server answer as the arena's
  website did with its engine offline.
- GitHub Pages can't send COOP/COEP; the service worker adds them (the runner needs
  SharedArrayBuffer). `index.html` and `404.html` install it on a first visit.

Browsers: WebAssembly exception handling with exnref (Chrome 137+, Firefox 131+, Safari 18.4+).
Chrome caps a page at ~125 wasm memories and a game can have 128 dragons: each worker frees its
dragon's memory when it dies, and if a memory still can't be had the runner evicts the dragon that is
cheapest to rebuild and later replays its input into a new sandbox (exact).

## Layout

| path | what |
|---|---|
| `sw-src/` | the backend: `sw.js` (routes), `db.js` (wa-sqlite + HTTP VFS + data functions), `api.js`, `web/` (pages, duels, docs, evals, compare, viewer) |
| `runner/` | the judge in the browser (`game.js` `runGame`) |
| `viewer/` | the toolkit's viewer bundle (`webview.js/css` from unswbc 1.2.9's replay-viewer.vsix) |
| `data/site/` | site.db in chunks |
| `wasm/`, `maps/`, `source/` | bots' metered wasm and the engine, maps by sha256, submissions' zips |
| `exporter/` | `export.py` (bots' wasm), `backend_data.py` (site.db), `pack.py` (chunks, maps, zips) |
| `tools/serve.mjs` | a local stand-in for Pages: `node tools/serve.mjs 8000`, then http://localhost:8000/arena/ |

## Building

    npm install && npm run build          # sw-src/ -> sw.js

On the arena host (reads an allowlist of the data folder; never arena.toml, tokens, scaler/,
leases.json; never imports or runs the arena):

    python3 exporter/export.py ~/tokenz-arena-data ~/tokenz-arena OUT         # wasm/
    python3 exporter/backend_data.py ~/tokenz-arena-data ~/tokenz-arena BACK  # site.db
    python3 exporter/pack.py ~/tokenz-arena-data BACK OUT                     # data/site, maps, source

The runner's own check: `node --experimental-wasm-exnref runner/node-check.mjs <fixtures>`.
