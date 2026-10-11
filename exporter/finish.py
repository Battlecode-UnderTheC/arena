"""After export.py: summary JSON for the pages, and arena.db split into chunks for sql.js-httpvfs
(GitHub refuses files over 100 MB).

    python3 finish.py ~/tokenz-arena-data OUT
"""
from __future__ import annotations

import collections
import json
import os
import sqlite3
import sys
from pathlib import Path

DATA, OUT = (Path(os.path.expanduser(p)) for p in sys.argv[1:3])
CHUNK = 32 << 20
if not (OUT / "data/arena.db").exists():          # a second run: put the chunks back together
    parts = sorted((OUT / "data/db").glob("arena.db.*"))
    (OUT / "data/arena.db").write_bytes(b"".join(p.read_bytes() for p in parts))
db = sqlite3.connect(OUT / "data/arena.db")
# owners: an email address is published as its local part only (GitHub handles stay as they are)
for t in ("bots", "duels"):
    db.execute(f"UPDATE {t} SET owner = substr(owner, 1, instr(owner, '@') - 1) "
               f"WHERE owner LIKE '%@%' AND owner NOT LIKE '%@github'")
# head-to-heads and per-map records, so a bot's page doesn't scan its games over HTTP
db.executescript("""
DROP TABLE IF EXISTS h2h; DROP TABLE IF EXISTS botmap;
CREATE TABLE h2h AS
  SELECT me AS bot, opp, COUNT(*) AS games, SUM(res = 'W') AS wins, SUM(res = 'L') AS losses,
         SUM(res = 'D') AS draws, SUM(rated) AS rated, MAX(id) AS last_game FROM (
    SELECT id, a AS me, b AS opp, rated, CASE WHEN winner IS NULL THEN 'D' WHEN winner = 'A' THEN 'W' ELSE 'L' END AS res
      FROM games WHERE lane != 'duel' AND error IS NULL
    UNION ALL
    SELECT id, b, a, rated, CASE WHEN winner IS NULL THEN 'D' WHEN winner = 'B' THEN 'W' ELSE 'L' END
      FROM games WHERE lane != 'duel' AND error IS NULL)
  GROUP BY me, opp;
CREATE INDEX h2h_bot ON h2h(bot);
CREATE TABLE botmap AS
  SELECT me AS bot, map, map_id, COUNT(*) AS games, SUM(res = 'W') AS wins, SUM(res = 'L') AS losses,
         SUM(res = 'D') AS draws FROM (
    SELECT a AS me, map, map_id, CASE WHEN winner IS NULL THEN 'D' WHEN winner = 'A' THEN 'W' ELSE 'L' END AS res
      FROM games WHERE lane != 'duel' AND error IS NULL
    UNION ALL
    SELECT b, map, map_id, CASE WHEN winner IS NULL THEN 'D' WHEN winner = 'B' THEN 'W' ELSE 'L' END
      FROM games WHERE lane != 'duel' AND error IS NULL)
  GROUP BY me, map, map_id;
CREATE INDEX botmap_bot ON botmap(bot);
CREATE INDEX botmap_map ON botmap(map_id);
""")
db.commit()
db.execute("VACUUM")
db.row_factory = sqlite3.Row


def dump(name, value):
    (OUT / "data" / name).write_text(json.dumps(value, separators=(",", ":"), ensure_ascii=False))


rows = lambda q, *a: [dict(r) for r in db.execute(q, a)]

# leaderboard: the arena's last ratings (its current ranked submission of each active line)
ratings = json.loads((DATA / "ratings.json").read_text())
board = rows(f"SELECT id, line, owner, agent, parent, elo, err, rated_games, games, wins, losses, draws, last_played "
             f"FROM bots WHERE id IN ({','.join('?' * len(ratings))}) ORDER BY elo DESC", *ratings)
dump("leaderboard.json", board)

bots = rows("SELECT id, line, owner, lane, status, agent, parent, created, elo, err, rated_games, games, wins, losses, "
            "draws, wasm IS NOT NULL AS runnable, has_source, ephemeral, first_played, last_played FROM bots")
dump("bots.json", bots)

maps = rows("SELECT id, sha, name, suites, names, width, height, games, live FROM maps ORDER BY games DESC")
for m in maps:
    m["suites"], m["names"] = json.loads(m["suites"]), json.loads(m["names"])
dump("maps.json", maps)

dump("duels.json", rows("SELECT id, a, b, owner, created, status, note, suites, seeds, both_seats, games, a_wins, b_wins, "
                        "draws, first_game FROM duels ORDER BY created DESC"))

lanes = {r["lane"]: r["n"] for r in rows("SELECT lane, COUNT(*) n FROM games GROUP BY lane")}
span = rows("SELECT MIN(played) first, MAX(played) last FROM games WHERE lane != 'duel'")[0]
info = {"games": sum(lanes.values()), "lanes": lanes, "first": span["first"], "last": span["last"],
        "replayable": rows("SELECT COUNT(*) n FROM games WHERE replayable = 1")[0]["n"],
        "evals": rows("SELECT COUNT(*) n FROM evals")[0]["n"], "bots": len(bots), "maps": len(maps),
        "engine": "unswbc 1.2.9"}
dump("info.json", info)
db.close()

# chunks
blob = (OUT / "data/arena.db").read_bytes()
cdir = OUT / "data/db"
cdir.mkdir(exist_ok=True)
for old in cdir.glob("arena.db.*"):
    old.unlink()
n = (len(blob) + CHUNK - 1) // CHUNK
for i in range(n):
    (cdir / f"arena.db.{i:03d}").write_bytes(blob[i * CHUNK:(i + 1) * CHUNK])
(cdir / "config.json").write_text(json.dumps({
    "serverMode": "chunked", "requestChunkSize": 4096, "databaseLengthBytes": len(blob),
    "serverChunkSize": CHUNK, "urlPrefix": "arena.db.", "suffixLength": 3}))
(OUT / "data/arena.db").unlink()
print(info, n, "chunks")
