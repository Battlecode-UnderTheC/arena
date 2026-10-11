"""Export tokenz-arena's data folder to the static site's data (run on poscatgpu2).

    python3 export.py ~/tokenz-arena-data ~/tokenz-arena OUT

Reads only an allowlist: games.db, duels/*/{meta.json,games/*.json,maps/}, bots/, ephemeral/,
submissions/*/meta.json, maps/, ratings.json, bots.json, aliases.json, evals/{games,battles}/,
and the judge's cache of metered bot wasm. Never arena.toml, worker tokens, scaler/, leases.json.

OUT/
  data/arena.db         SQLite for sql.js-httpvfs: games (arena + duel games), duels, bots, maps, evals
  data/*.json           small summaries the pages load directly
  wasm/engine.wasm      unswbc 1.2.9's engine
  wasm/bots/<id>.wasm   each bot's metered build, exactly what the judge ran
  maps/<sha256>.map     every map a game was played on, by content
"""
from __future__ import annotations

import collections
import glob
import gzip
import hashlib
import json
import math
import os
import re
import shutil
import sqlite3
import subprocess
import sys
from pathlib import Path

DATA, REPO, OUT = (Path(os.path.expanduser(p)) for p in sys.argv[1:4])
CACHE = Path(os.path.expanduser("~/.cache/tokenz-arena-unswbc"))
ENGINE = Path(os.path.expanduser("~/tap-work/.venv/lib/python3.12/site-packages/unswbc/unswbc_engine.wasm"))

RATED_LANES = {"draft", "placement", "continuous"}
HIDDEN_SUITES = {"holdout", "check"}


def sha(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def load(p: Path, default=None):
    try:
        return json.loads(p.read_text())
    except FileNotFoundError:
        return default


# ---------------------------------------------------------------- maps
def map_name(text: str, stem: str) -> str:
    for line in text.splitlines()[:8]:
        if line.startswith("MAP_NAME"):
            parts = line.split(None, 1)
            return parts[1].strip() if len(parts) > 1 else stem
    return stem


maps: dict[str, dict] = {}            # sha -> {file bytes, names, suites}


def add_map(blob: bytes, suite: str, stem: str, src: str) -> str:
    h = sha(blob)
    m = maps.setdefault(h, {"blob": blob, "keys": set(), "src": src})
    m["keys"].add((suite, stem))
    return h


live = {}                             # (suite, stem) -> sha of the map in play at the end
for suite, d in [("server", DATA / "maps/server"), ("custom", DATA / "maps/custom"),
                 ("official", REPO / "maps/official"), ("tournament", REPO / "maps/tournament")]:
    for p in sorted(d.glob("*.map")):
        live[(suite, p.stem)] = add_map(p.read_bytes(), suite, p.stem, str(p))
epochs = sorted((DATA / "maps/rotating").glob("e*"), key=lambda p: int(re.sub(r"\D", "", p.name) or 0))
for e in epochs:
    for p in sorted(e.glob("*.map")):
        h = add_map(p.read_bytes(), "rotating", p.stem, str(p))
        if e == epochs[-1]:
            live[("rotating", p.stem)] = h
for p in sorted((DATA / "maps").glob("holdout*/**/*.map")) + sorted((DATA / "maps/holdout").glob("*.map")):
    add_map(p.read_bytes(), "holdout", p.stem, str(p))
for p in sorted(glob.glob(str(DATA / "duels/*/maps/*/*.map"))):
    p = Path(p)
    add_map(p.read_bytes(), p.parent.name, p.stem, str(p))
# older versions of the repo's maps, from git history
revs = subprocess.run(["git", "-C", str(REPO), "log", "--all", "--format=%H", "--", "maps"],
                      capture_output=True, text=True).stdout.split()
for rev in revs:
    for line in subprocess.run(["git", "-C", str(REPO), "ls-tree", "-r", "--format=%(objectname) %(path)", rev, "maps"],
                               capture_output=True, text=True).stdout.splitlines():
        obj, path = line.split(" ", 1)
        if path.endswith(".map"):
            blob = subprocess.run(["git", "-C", str(REPO), "cat-file", "-p", obj], capture_output=True).stdout
            add_map(blob, path.split("/")[1], Path(path).stem, f"git:{rev[:8]}:{path}")

# ---------------------------------------------------------------- bots
cache = collections.defaultdict(list)
for f in os.listdir(CACHE):
    m = re.fullmatch(r"(.+)-([0-9a-f]{32})-([0-9a-f]{32})-metered\.wasm", f)
    if m:
        cache[m.group(1)].append(CACHE / f)
aliases = load(DATA / "aliases.json", {})          # old id -> new id
back = collections.defaultdict(list)
for old, new in aliases.items():
    back[new].append(old)


def wasm_for(bot: str) -> Path | None:
    for name in [bot, aliases.get(bot)] + back.get(bot, []):
        if name and cache.get(name):
            return max(cache[name], key=lambda p: p.stat().st_mtime)
    return None


def source_dir(bot: str) -> Path | None:
    for name in [bot, aliases.get(bot)] + back.get(bot, []):
        for root in ("bots", "ephemeral"):
            if name and (DATA / root / name).is_dir():
                return DATA / root / name
    return None


# ---------------------------------------------------------------- output db
OUT.mkdir(parents=True, exist_ok=True)
(OUT / "data").mkdir(exist_ok=True)
dbp = OUT / "data/arena.db"
if dbp.exists():
    dbp.unlink()
db = sqlite3.connect(dbp)
db.execute("PRAGMA page_size = 4096")
db.executescript("""
CREATE TABLE games (
  id INTEGER PRIMARY KEY, lane TEXT, suite TEXT, map TEXT, map_id INTEGER, a TEXT, b TEXT,
  seed TEXT, winner TEXT, rounds INTEGER, reason TEXT, played TEXT, engine TEXT, judge TEXT,
  rated INTEGER, duel TEXT, duel_n INTEGER, replay TEXT, replayable INTEGER, seconds REAL,
  error TEXT, stats TEXT, meta TEXT);
CREATE TABLE duels (
  id TEXT PRIMARY KEY, a TEXT, b TEXT, owner TEXT, created TEXT, finished TEXT, status TEXT,
  note TEXT, suites TEXT, seeds TEXT, both_seats INTEGER, games_planned INTEGER, games INTEGER,
  a_wins INTEGER, b_wins INTEGER, draws INTEGER, first_game INTEGER);
CREATE TABLE bots (
  id TEXT PRIMARY KEY, line TEXT, owner TEXT, lane TEXT, status TEXT, agent TEXT, parent TEXT,
  note TEXT, created TEXT, elo REAL, err REAL, rated_games INTEGER, games INTEGER,
  wins INTEGER, losses INTEGER, draws INTEGER, wasm TEXT, wasm_sha TEXT, has_source INTEGER,
  ephemeral INTEGER, first_played TEXT, last_played TEXT);
CREATE TABLE info (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE maps (id INTEGER PRIMARY KEY, sha TEXT UNIQUE, name TEXT, suites TEXT, names TEXT, width INTEGER,
  height INTEGER, games INTEGER, live INTEGER);
CREATE TABLE evals (
  id INTEGER PRIMARY KEY, battle INTEGER, at TEXT, ranked INTEGER, map TEXT, a TEXT, b TEXT,
  a_elo INTEGER, b_elo INTEGER, winner TEXT, end TEXT, rounds INTEGER, replay TEXT);
""")


STAT_KEYS = ("turns", "moves", "sprints", "splits", "sonars", "died", "dragons_used", "errors", "cpu_overruns",
             "points_max")
DEATH_KEYS = ("hit a wall", "hit itself", "hit another dragon", "lost a head-to-head", "no valid action")


def compact_stats(st: dict | None) -> str | None:
    """{"A": [turns, moves, sprints, splits, sonars, died, dragons_used, errors, cpu_overruns, points_max,
    points p50, deaths: wall, self, other, head-to-head, no valid action], "B": [...]}"""
    if not st or not st.get("teams"):
        return None
    out = {}
    for t, v in st["teams"].items():
        d = v.get("deaths") or {}
        out[t] = [v.get(k) for k in STAT_KEYS] + [(v.get("points") or {}).get("p50")] + [d.get(k, 0) for k in DEATH_KEYS]
    return json.dumps(out, separators=(",", ":"))


bot_ids: set[str] = set()
map_id: dict[str, int] = {}
map_games = collections.Counter()
unresolved = collections.Counter()


def game_row(g: dict, *, gid, lane, duel=None, duel_n=None, map_sha=None, rated=0, replay=None):
    meta = dict(g.get("meta") or {})
    sha_ = map_sha or meta.get("map_sha")
    if sha_ not in maps:
        unresolved[(g.get("suite"), g.get("map"), (sha_ or "-")[:8])] += 1
        sha_ = None if (sha_ or "").startswith("older") or sha_ not in maps else sha_
    a, b = g["a"], g["b"]
    for x in (a, b):
        if not x.startswith("server:"):
            bot_ids.add(x)
    replayable = int(bool(sha_) and not a.startswith("server:") and not b.startswith("server:")
                     and wasm_for(a) is not None and wasm_for(b) is not None)
    if sha_:
        map_games[sha_] += 1
    mid = map_id.setdefault(sha_, len(map_id) + 1) if sha_ else None
    for k in ("map_sha", "engine", "judge"):
        meta.pop(k, None)
    return (gid, lane, g.get("suite"), g.get("map"), mid, a, b, str(g.get("seed")) if g.get("seed") is not None else None,
            g.get("winner"), g.get("rounds"), g.get("reason"), g.get("played"),
            (g.get("meta") or {}).get("engine"), (g.get("meta") or {}).get("judge"), rated, duel, duel_n,
            replay, replayable, g.get("seconds"), g.get("error"), compact_stats(g.get("stats")),
            json.dumps(meta, separators=(",", ":")) if meta else None)


def is_rated(g: dict) -> bool:
    if g["lane"] not in RATED_LANES or g["suite"] in HIDDEN_SUITES or g.get("error") or g["a"] == g["b"]:
        return False
    m = g.get("meta") or {}
    want = live.get((g["suite"], g["map"]))
    mine = m.get("map_sha")
    return want is None or mine is None or mine == want


src = sqlite3.connect(f"file:{DATA / 'games.db'}?mode=ro", uri=True)
rows = []
last = 0
for gid, data in src.execute("SELECT id, data FROM games ORDER BY id"):
    g = json.loads(data)
    last = max(last, gid)
    rows.append(game_row(g, gid=gid, lane=g["lane"], rated=int(is_rated(g)), replay=g.get("replay")))
    if len(rows) >= 20000:
        db.executemany("INSERT INTO games VALUES (" + ",".join("?" * 23) + ")", rows)
        rows = []
db.executemany("INSERT INTO games VALUES (" + ",".join("?" * 23) + ")", rows)
print("arena games to", last, flush=True)

# ---------------------------------------------------------------- duels
nid = last
duel_rows = []
for dd in sorted(os.listdir(DATA / "duels")):
    meta = load(DATA / "duels" / dd / "meta.json")
    if not meta:
        continue
    sched = meta.get("schedule") or []
    files = sorted(glob.glob(str(DATA / "duels" / dd / "games/*.json")), key=lambda p: int(Path(p).stem))
    wins = {"a": 0, "b": 0, "d": 0}
    first = None
    rows = []
    for f in files:
        g = load(Path(f))
        n = g["n"]
        s = sched[n] if n < len(sched) else {}
        p = (s.get("path") or "").replace("/data/", str(DATA) + "/")
        msha = sha(Path(p).read_bytes()) if p and Path(p).exists() else None
        nid += 1
        first = first or nid
        row = {"a": g["seat_a"], "b": g["seat_b"], "suite": g.get("suite"), "map": g.get("map"),
               "seed": g.get("seed"), "winner": g.get("winner"), "rounds": g.get("rounds"),
               "reason": g.get("reason"), "played": g.get("at"), "seconds": g.get("seconds"),
               "error": g.get("error"), "stats": g.get("stats"),
               "meta": {"duel": [dd, n], "worker": g.get("worker"), "swapped": g.get("swapped"),
                        "engine": (g.get("meta") or {}).get("engine"), "judge": (g.get("meta") or {}).get("judge")}}
        rows.append(game_row(row, gid=nid, lane="duel", duel=dd, duel_n=n, map_sha=msha,
                             replay=g.get("replay")))
        w = g.get("winner")
        if w is None:
            wins["d"] += 1
        else:
            seat = g["seat_a"] if w == "A" else g["seat_b"]
            wins["a" if seat == meta["a"] else "b"] += 1
    db.executemany("INSERT INTO games VALUES (" + ",".join("?" * 23) + ")", rows)
    for x in (meta["a"], meta["b"]):
        bot_ids.add(x)
    duel_rows.append((dd, meta["a"], meta["b"], meta.get("owner"), meta.get("created"), meta.get("finished"),
                      meta.get("status"), meta.get("note"), json.dumps(meta.get("suites")), str(meta.get("seeds")),
                      int(bool(meta.get("both_seats"))), meta.get("games_planned"), len(files),
                      wins["a"], wins["b"], wins["d"], first))
db.executemany("INSERT INTO duels VALUES (" + ",".join("?" * 17) + ")", duel_rows)
print("duel games to", nid, "duels", len(duel_rows), flush=True)

# ---------------------------------------------------------------- evals (server battles; not re-runnable)
erows = []
for f in os.scandir(DATA / "evals/games"):
    g = load(Path(f.path))
    s = g.get("seats") or {}
    erows.append((g["id"], g.get("battle"), g.get("at"), int(bool(g.get("ranked"))), g.get("map"),
                  (s.get("A") or {}).get("name"), (s.get("B") or {}).get("name"),
                  (s.get("A") or {}).get("elo"), (s.get("B") or {}).get("elo"), g.get("winner"), g.get("end"),
                  g.get("rounds"), g.get("replay")))
db.executemany("INSERT INTO evals VALUES (" + ",".join("?" * 13) + ")", erows)
print("evals", len(erows), flush=True)

# ---------------------------------------------------------------- bots
(OUT / "wasm/bots").mkdir(parents=True, exist_ok=True)
(OUT / "wasm/engine.wasm.gz").write_bytes(gzip.compress(ENGINE.read_bytes(), 9, mtime=0))
ratings = load(DATA / "ratings.json", {})
lines = load(DATA / "bots.json", {})
rec = collections.defaultdict(lambda: [0, 0, 0, 0, None, None])     # games, w, l, d, first, last
for a, b, w, played in db.execute("SELECT a, b, winner, played FROM games WHERE lane != 'duel' AND error IS NULL"):
    for me, seat in ((a, "A"), (b, "B")):
        r = rec[me]
        r[0] += 1
        if w is None:
            r[3] += 1
        elif w == seat:
            r[1] += 1
        else:
            r[2] += 1
        r[4] = min(r[4] or played, played)
        r[5] = max(r[5] or played, played)
brows = []
missing = []
for bid in sorted(bot_ids):
    sub = load(DATA / "submissions" / bid / "meta.json") or {}
    w = wasm_for(bid)
    wsha = None
    if w:
        blob = w.read_bytes()
        wsha = sha(blob)
        dest = OUT / "wasm/bots" / f"{wsha}.wasm.gz"
        if not dest.exists():
            dest.write_bytes(gzip.compress(blob, 9, mtime=0))
    else:
        missing.append(bid)
    rt = ratings.get(bid) or {}
    r = rec.get(bid, [0, 0, 0, 0, None, None])
    brows.append((bid, sub.get("bot"), sub.get("owner"), sub.get("lane"), sub.get("status"), sub.get("agent"),
                  sub.get("parent"), sub.get("note"), sub.get("created") or sub.get("submitted"), rt.get("elo"),
                  rt.get("err"), rt.get("games"), r[0], r[1], r[2], r[3], f"wasm/bots/{wsha}.wasm.gz" if w else None, wsha,
                  int(source_dir(bid) is not None), int(bid.startswith("eph-")), r[4], r[5]))
db.executemany("INSERT INTO bots VALUES (" + ",".join("?" * 22) + ")", brows)
print("bots", len(brows), "without wasm", len(missing), missing[:20], flush=True)

# ---------------------------------------------------------------- maps
(OUT / "maps").mkdir(exist_ok=True)
mrows = []
live_shas = set(live.values())
for h, m in maps.items():
    text = m["blob"].decode(errors="replace")
    keys = sorted(m["keys"])
    w = hgt = None
    for line in text.splitlines()[:20]:
        if line.startswith(("SIZE", "WIDTH", "DIM")):
            nums = [int(x) for x in re.findall(r"\d+", line)]
            if len(nums) >= 2:
                w, hgt = nums[:2]
    (OUT / "maps" / f"{h}.map").write_bytes(m["blob"])
    mrows.append((map_id.setdefault(h, len(map_id) + 1), h, map_name(text, keys[0][1]), json.dumps(sorted({k[0] for k in keys})),
                  json.dumps(sorted({k[1] for k in keys})), w, hgt, map_games.get(h, 0), int(h in live_shas)))
db.executemany("INSERT INTO maps VALUES (?,?,?,?,?,?,?,?,?)", mrows)
print("maps", len(mrows), "unresolved game maps", sum(unresolved.values()), unresolved.most_common(8), flush=True)

db.executescript("""
CREATE INDEX games_a ON games(a, id);
CREATE INDEX games_b ON games(b, id);
CREATE INDEX games_map ON games(map_id, id);
CREATE INDEX games_lane ON games(lane, id);
CREATE INDEX games_duel ON games(duel, duel_n);
CREATE INDEX games_played ON games(played);
CREATE INDEX evals_a ON evals(a);
CREATE INDEX evals_b ON evals(b);
""")
db.commit()
db.execute("PRAGMA journal_mode = DELETE")
db.execute("VACUUM")
db.close()
print("db", dbp.stat().st_size / 1e6, "MB")
