"""The data the service-worker backend reads: one SQLite file (site.db) with the arena's raw
state (submissions, games, duel games, bots, ratings) and, since this is a frozen snapshot, the
expensive things the arena computed per request, computed once here (verdicts, reports,
leaderboard, head-to-heads, map stats, metric summaries, duel summaries).

The formulas are the arena's (arena/report.py, state.py, api/http.py, metrics/views.py,
duels.py, api/llms.py), re-implemented here: nothing of the arena is imported or run.

    python3 backend_data.py ~/tokenz-arena-data ~/tokenz-arena OUT
"""
from __future__ import annotations

import ast
import collections
import datetime as dt
import glob
import hashlib
import json
import math
import os
import re
import sqlite3
import sys
import zlib
from pathlib import Path

DATA, REPO, OUT = (Path(os.path.expanduser(p)) for p in sys.argv[1:4])
CACHE = Path(os.path.expanduser("~/.cache/tokenz-arena-unswbc"))
FROZEN = "2026-10-09T05:57:17Z"          # the last game: the arena's "now" in this snapshot
FROZEN_TS = dt.datetime.fromisoformat(FROZEN.replace("Z", "+00:00")).timestamp()
PUBLIC_URL = "https://battlecode-underthec.github.io/tokenz-arena-pages"

# names as published (the user's choice)
NAMES = [("seonghyeon.sh.hong@gmail.com", "equinox"), ("chansolpark7@gmail.com", "chansolpark7"),
         ("cyoung06", "syeyoung")]


def scrub(s):
    if isinstance(s, str):
        for a, b in NAMES:
            s = s.replace(a, b)
        return s
    if isinstance(s, list):
        return [scrub(x) for x in s]
    if isinstance(s, dict):
        return {scrub(k): scrub(v) for k, v in s.items()}
    return s


def jd(x) -> str:
    return json.dumps(scrub(x), separators=(",", ":"), ensure_ascii=False)


def load(p: Path, default=None):
    try:
        return json.loads(p.read_text())
    except (FileNotFoundError, ValueError):
        return default


# ---------------------------------------------------------------- maps (arena/maps.py)
def norm(name: str) -> str:
    return " ".join(str(name).lower().replace("_", " ").split())


def map_name(p: Path) -> str:
    name = p.stem
    with p.open(errors="replace") as f:
        for _, line in zip(range(8), f):
            if line.startswith("MAP_NAME"):
                name = line.split(None, 1)[1] if len(line.split(None, 1)) > 1 else name
                break
    return " ".join(name.lower().replace("_", " ").split())


EPOCH = int((FROZEN_TS - 1767225600) // (7 * 86400))
MAP_DIRS = {"official": [REPO / "maps/official"], "tournament": [REPO / "maps/tournament"],
            "server": [DATA / "maps/server"], "custom": [DATA / "maps/custom"],
            "rotating": [DATA / f"maps/rotating/e{EPOCH}"],
            "holdout": [DATA / "maps/holdout", DATA / "maps/holdout-custom"]}


def suite_files(suite: str) -> list[Path]:
    files = sorted(p for d in MAP_DIRS[suite] if d.is_dir() for p in d.glob("*.map"))
    if suite in ("official", "tournament"):
        server = {map_name(p) for p in suite_files("server")}
        files = [p for p in files if map_name(p) not in server]
    return files


SHA = {}


def file_sha(p: Path) -> str:
    if p not in SHA:
        SHA[p] = hashlib.sha256(p.read_bytes()).hexdigest()
    return SHA[p]


BY_KEY, BY_NAME = {}, {}
for suite in ("server", "official", "tournament", "custom", "rotating", "holdout"):
    for p in suite_files(suite):
        BY_KEY[(suite, p.stem)] = file_sha(p)
        BY_NAME.setdefault(norm(p.stem), file_sha(p))
LIVE_PUBLIC = {(suite, p.stem) for suite in ("official", "tournament", "server", "custom", "rotating")
               for p in suite_files(suite)}

# ---------------------------------------------------------------- state (arena/state.py)
SAME_RULES = {"1.2.7": "1.2.3", "1.2.9": "1.2.3"}
RULES_NOW = "1.2.3"                      # unswbc 1.2.9's rules
RATED_LANES = {"draft", "placement", "continuous"}
HIDDEN_SUITES = {"holdout", "check"}


def current_map(g) -> bool:
    if g["suite"] == "check" or g["lane"] == "server":
        return True
    sha = BY_KEY.get((g["suite"], g["map"])) or BY_NAME.get(norm(g["map"]))
    mine = (g.get("meta") or {}).get("map_sha")
    return sha is None or mine is None or mine == sha


def infra_error(e) -> bool:
    return bool(e) and (e.startswith("worker ") or "no verdict in judge output" in e)


def current_game(g) -> bool:
    m = g.get("meta") or {}
    if infra_error(g.get("error")) and len(set(m.get("final_workers") or ())) < 3:
        return False
    return SAME_RULES.get(m.get("engine", "1.2.3"), m.get("engine", "1.2.3")) == RULES_NOW and current_map(g)


def is_rated(g) -> bool:
    return (g["lane"] in RATED_LANES and g["suite"] not in HIDDEN_SUITES and not g.get("error")
            and g["a"] != g["b"] and current_game(g))


def result_for(g, sid):
    if g.get("error"):
        return None
    if g.get("winner") is None:
        return "D"
    return "W" if g["winner"] == ("A" if g["a"] == sid else "B") else "L"


def wdl(games, sid) -> dict:
    out = {"W": 0, "D": 0, "L": 0}
    for g in games:
        r = result_for(g, sid)
        if r:
            out[r] += 1
    return out


print("loading", flush=True)
subs = {}
for meta in sorted((DATA / "submissions").glob("*/meta.json")):
    d = load(meta)
    subs[d["id"]] = d
aliases = load(DATA / "aliases.json", {}) or {}
bots = load(DATA / "bots.json", {}) or {}
ratings = load(DATA / "ratings.json", {}) or {}


def resolve(sid):
    return aliases.get(sid, sid) if sid and sid not in subs else sid


src = sqlite3.connect(f"file:{DATA / 'games.db'}?mode=ro", uri=True)
games = [json.loads(d) for (d,) in src.execute("SELECT data FROM games ORDER BY id")]
by_sub = collections.defaultdict(list)
for g in games:
    g["_rated"] = is_rated(g)
    g["_current"] = current_game(g)
    by_sub[g["a"]].append(g)
    if g["b"] != g["a"]:
        by_sub[g["b"]].append(g)
print(len(games), "games", len(subs), "submissions", flush=True)

# ---------------------------------------------------------------- report.py


def _pct(r):
    n = r["W"] + r["D"] + r["L"]
    return round(100 * (r["W"] + r["D"] / 2) / n, 1) if n else None


def interval(r):
    n = r["W"] + r["D"] + r["L"]
    if not n:
        return {"ci": None, "significant": None, "games": 0}
    p, z = (r["W"] + r["D"] / 2) / n, 1.96
    c = (p + z * z / (2 * n)) / (1 + z * z / n)
    h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / (1 + z * z / n)
    lo, hi = round(100 * (c - h), 1), round(100 * (c + h), 1)
    return {"ci": [lo, hi], "significant": lo > 50 or hi < 50, "games": n}


def _row(r):
    return {**r, "score": _pct(r), **interval(r)}


def _beats(r):
    return True if r["W"] > r["L"] else False if r["W"] < r["L"] else None


def decided_by(g):
    return "draw" if g.get("winner") is None else (g.get("reason") or "?").split(",")[0].strip()


def report_build(sid):
    s = subs[sid]
    gs = [g for g in by_sub.get(sid, []) if g["a"] != g["b"]]
    local = [g for g in gs if g["_rated"]]
    holdout = [g for g in gs if g["suite"] == "holdout" and g["_current"] and not g.get("error")]
    historical = sum(1 for g in gs if not g["_current"])
    by_opp, by_map, deaths = {}, {}, {}
    errors, p99s, maxs, rounds, overruns, overrun_games, losses = 0, [], [], [], 0, 0, []
    for g in local:
        opp = g["b"] if g["a"] == sid else g["a"]
        by_opp.setdefault(opp, []).append(g)
        by_map.setdefault(f"{g['suite']}/{g['map']}", []).append(g)
        seat = "A" if g["a"] == sid else "B"
        st = g.get("stats") or {}
        t = (st.get("teams") or {}).get(seat, {})
        for cause, k in (t.get("deaths") or {}).items():
            deaths[cause] = deaths.get(cause, 0) + k
        errors += t.get("errors", 0) + (1 if g.get("error") else 0)
        if t.get("cpu_overruns"):
            overruns += t["cpu_overruns"]
            overrun_games += 1
        if t.get("points"):
            p99s.append(t["points"].get("p99", 0))
            maxs.append(t["points"].get("max", 0))
        if g.get("rounds"):
            rounds.append(g["rounds"])
        if result_for(g, sid) == "L":
            margin = st.get("tiebreak") or {}
            losses.append((0 if g.get("rounds") and g["rounds"] < 500 else 1,
                           -(margin.get("winner", 0) - margin.get("loser", 0)), g))
    by_seat = {"A": wdl([g for g in local if g["a"] == sid], sid), "B": wdl([g for g in local if g["b"] == sid], sid)}
    by_end, econ = {}, {50: [], 100: []}
    for g in local:
        end = "draw" if g.get("winner") is None else (g.get("reason") or "?").split(",")[0]
        row = by_end.setdefault(end, {"W": 0, "D": 0, "L": 0})
        row[result_for(g, sid) or "D"] += 1
        mine, theirs = (1, 2) if g["a"] == sid else (2, 1)
        for point in ((g.get("stats") or {}).get("dragons") or []):
            if point[0] in econ:
                econ[point[0]].append((point[mine], point[theirs]))
    economy = {f"r{k}": ({"dragons": round(sum(a for a, _ in v) / len(v), 1),
                          "opponent_dragons": round(sum(b for _, b in v) / len(v), 1), "games": len(v)} if v else None)
               for k, v in econ.items()}
    opp_rows = [{"opponent": o, **_row(wdl(v, sid))} for o, v in by_opp.items()]
    map_rows = [{"map": m, **_row(wdl(v, sid))} for m, v in by_map.items()]
    losses.sort(key=lambda x: (x[0], x[1]))
    rep = {
        "submission": sid, "status": s["status"], "lane": s["lane"], "games": len(local),
        "record": _row(wdl(local, sid)),
        "by_seat": {k: _row(v) for k, v in by_seat.items()},
        "by_end": {k: _row(v) for k, v in sorted(by_end.items(), key=lambda x: -sum(x[1].values()))},
        "economy": economy, "historical_games": historical,
        "by_opponent": sorted(opp_rows, key=lambda r: (r["score"] is None, r["score"] or 0)),
        "by_map": sorted(map_rows, key=lambda r: (r["score"] is None, r["score"] or 0)),
        "deaths": dict(sorted(deaths.items(), key=lambda x: -x[1])),
        "deaths_per_game": round(sum(deaths.values()) / len(local), 2) if local else None,
        "errors": errors,
        "cpu": {"p99_max": max(p99s, default=None), "max": max(maxs, default=None), "cap": 100_000_000,
                "headroom": (round(1 - max(maxs) / 100_000_000, 3) if maxs else None),
                "overruns": overruns, "overrun_games": overrun_games, "warn_at": 80_000_000,
                "warn": bool(overruns or max(maxs, default=0) >= 80_000_000)},
        "rounds_mean": round(sum(rounds) / len(rounds), 1) if rounds else None,
        "worst_losses": [{"game": g["id"], "map": g["map"], "opponent": g["b"] if g["a"] == sid else g["a"],
                          "rounds": g.get("rounds"), "reason": g.get("reason"),
                          "replay": f"/api/v1/games/{g['id']}/replay" if g.get("replay") else None}
                         for _, _, g in losses[:5]],
        "holdout": wdl(holdout, sid) if holdout else None,
    }
    if s.get("parent"):
        vs = [g for g in local if s["parent"] in (g["a"], g["b"])]
        r = wdl(vs, sid)
        rep["vs_parent"] = {"parent": s["parent"], **_row(r), "beats_parent": _beats(r) if vs else None}
    return rep


def verdict(sid):
    s = subs[sid]
    gs = [g for g in by_sub.get(sid, []) if g["lane"] in ("draft", "placement") and g["_rated"]]
    rows = [{"opponent": o, **_row(wdl([g for g in gs if o in (g["a"], g["b"])], sid))} for o in s.get("opponents") or []]
    out = {"complete": s["status"] in ("done", "rated"), "opponents": rows}
    if s.get("parent"):
        pg = [g for g in gs if s["parent"] in (g["a"], g["b"])]
        r = wdl(pg, sid)
        n = r["W"] + r["D"] + r["L"]
        out["vs_parent"] = {"parent": s["parent"], **_row(r), "beats_parent": _beats(r) if n else None}
        server = [g for g in pg if g["suite"] == "server"]
        out["vs_parent"]["server_maps"] = _row(wdl(server, sid)) if server else None
        ends = {}
        for g in pg:
            ends.setdefault(decided_by(g), []).append(g)
        out["vs_parent"]["by_end"] = {k: _row(wdl(v, sid)) for k, v in sorted(ends.items(), key=lambda x: -len(x[1]))}
        vp = out["vs_parent"]
        vp["summary"] = (None if not n else
                         f"{'beats' if vp['beats_parent'] else 'loses to' if vp['beats_parent'] is False else 'even with'}"
                         f" parent, {vp['score']}% (95% CI {vp['ci'][0]}-{vp['ci'][1]}) over {n} games"
                         + ("" if vp["significant"] else ": within noise"))
    return out


# ---------------------------------------------------------------- http.py
def current_subs():
    out = []
    for name, b in bots.items():
        s = subs.get(resolve(b.get("current") or ""))
        if b.get("active", True) and s and s["status"] in ("placing", "rated"):
            out.append(s)
    return out


def ranking():
    return [s["id"] for s in sorted(current_subs(), key=lambda s: (-((ratings.get(s["id"]) or {}).get("elo") or -1e9),
                                                                  s["created"]))]


def leaderboard():
    rows = []
    for rank, sid in enumerate(ranking(), 1):
        s = subs[sid]
        gs = [g for g in by_sub.get(sid, []) if g["_rated"]]
        r = wdl(gs, sid)
        n = sum(r.values())
        hold = [g for g in by_sub.get(sid, []) if g["suite"] == "holdout"]
        rows.append({"rank": rank, "submission": sid, "bot": s["bot"], "owner": s["owner"], "status": s["status"],
                     **(ratings.get(sid) or {"elo": None, "err": None}), "games": n, "record": r,
                     "score": round(100 * (r["W"] + r["D"] / 2) / n, 1) if n else None,
                     "holdout": wdl(hold, sid) if hold else None, "note": (s.get("note") or "")[:200]})
    return rows


def head_to_head(bot):
    cur = (bots.get(bot) or {}).get("current")
    out = []
    if cur:
        gs = [g for g in by_sub.get(cur, []) if g["_rated"]]
        for o in sorted({g["b"] if g["a"] == cur else g["a"] for g in gs}):
            out.append({"opponent": o, **wdl([g for g in gs if o in (g["a"], g["b"])], cur)})
    return out


def map_stats():
    rows = {}
    for g in games:
        if g.get("error") or g["suite"] in ("check", "holdout"):
            continue
        r = rows.setdefault(f"{g['suite']}/{g['map']}", {"map": g["map"], "suite": g["suite"], "games": 0,
                                                         "seat_a_wins": 0, "seat_b_wins": 0, "draws": 0, "ends": {}, "rounds": 0})
        r["games"] += 1
        r["rounds"] += g.get("rounds") or 0
        r[{"A": "seat_a_wins", "B": "seat_b_wins"}.get(g.get("winner") or "", "draws")] += 1
        end = (g.get("reason") or "?").split(",")[0]
        r["ends"][end] = r["ends"].get(end, 0) + 1
    for r in rows.values():
        r["rounds_mean"] = round(r.pop("rounds") / r["games"], 1)
        r["current"] = (r["suite"], r["map"]) in LIVE_PUBLIC
    return sorted(rows.values(), key=lambda r: (not r["current"], r["suite"], r["map"]))


# ---------------------------------------------------------------- metrics (describe, views.submission)
def describe():
    out = []
    for f in sorted((REPO / "arena/metrics/plugins").glob("*.py")):
        if f.name == "__init__.py":
            continue
        tree = ast.parse(f.read_text())
        env = {}
        for node in tree.body:                 # module constants an argument may use (e.g. CAP)
            if isinstance(node, ast.Assign) and isinstance(node.targets[0], ast.Name):
                try:
                    env[node.targets[0].id] = ast.literal_eval(node.value)
                except ValueError:
                    pass

        def value(n):
            try:
                return ast.literal_eval(n)
            except ValueError:
                return eval(compile(ast.Expression(n), f.name, "eval"), {"__builtins__": {}}, env)
        for node in ast.walk(tree):
            if not isinstance(node, ast.FunctionDef):
                continue
            for dec in node.decorator_list:
                if not (isinstance(dec, ast.Call) and getattr(dec.func, "id", None) in ("metric", "derived")):
                    continue
                kind = dec.func.id
                args = [value(a) for a in dec.args]
                kw = {k.arg: value(k.value) for k in dec.keywords}
                names = ["name", "title", "desc", "version", "unit", "better"] + (["fitted"] if kind == "derived" else [])
                d = {"desc": "", "version": 1, "unit": "", "better": "higher" if kind == "metric" else "none", "fitted": None}
                d.update(dict(zip(names, args)))
                d.update(kw)
                out.append({"name": d["name"], "title": d["title"], "desc": d["desc"], "version": d["version"],
                            "unit": d["unit"], "better": d["better"], "kind": "game" if kind == "derived" else "team",
                            "fitted": d["fitted"]})
    return out


DESCRIBE = describe()
REG = {d["name"]: d for d in DESCRIBE}
SUMMARY_ROUNDS = (50, 100, 200, 300, 400)


def at_round(m, rnd):
    idx = None
    for i, r in enumerate(m.get("rounds") or []):
        if r <= rnd:
            idx = i
    return idx


def mv_submission(sid, limit=300):
    gs = [g for g in reversed(games) if sid in (g["a"], g["b"]) and g["a"] != g["b"]
          and g["suite"] not in ("holdout", "check")][:limit]
    sums, n_games = {}, 0
    for g in gs:
        m = load(DATA / "metrics" / f"{g['id']}.json")
        if not m or m.get("error"):
            continue
        n_games += 1
        me = "A" if g["a"] == sid else "B"
        them = "B" if me == "A" else "A"
        points = [(f"r{r}", at_round(m, r)) for r in SUMMARY_ROUNDS if m["rounds"] and m["rounds"][-1] >= r]
        points.append(("end", len(m["rounds"]) - 1 if m["rounds"] else None))
        for name, s in (m.get("team") or {}).items():
            for label, i in points:
                if i is None:
                    continue
                a, b = s[me][i], s[them][i]
                if a is None or b is None:
                    continue
                cell = sums.setdefault(name, {}).setdefault(label, [0.0, 0.0, 0])
                cell[0] += a
                cell[1] += b
                cell[2] += 1
        ev = (m.get("game") or {}).get("eval")
        if ev:
            for label, i in points:
                if i is None or ev[i] is None:
                    continue
                cell = sums.setdefault("eval", {}).setdefault(label, [0.0, 0.0, 0])
                p = ev[i] if me == "A" else 1 - ev[i]
                cell[0] += p
                cell[1] += 1 - p
                cell[2] += 1
    out = {name: {"title": REG.get(name, {}).get("title", name), "better": REG.get(name, {}).get("better"),
                  "at": {k: {"own": round(v[0] / v[2], 3), "opponents": round(v[1] / v[2], 3), "games": v[2]}
                         for k, v in by.items()}} for name, by in sums.items()}
    return {"submission": sid, "games": n_games, "metrics": out}


# ---------------------------------------------------------------- duels (duels.py Book.summary)
QUEEN_CAUSES = ["hit a wall", "ran into itself", "ran into an enemy", "ran into an ally",
                "lost a head-to-head", "no valid action", "not recorded yet"]
mod = ast.parse((REPO / "arena/metrics/__init__.py").read_text())
for node in mod.body:
    if isinstance(node, ast.Assign) and getattr(node.targets[0], "id", None) == "QUEEN_CAUSES":
        QUEEN_CAUSES = ast.literal_eval(node.value)
SIDE_ROUNDS = (100, 200, 300, 400)
SIDE_METRICS = ("dragons", "total_length", "longest", "board_control", "pearl_rate", "queen_alive",
                "queen_length", "tiles_visited", "tiles_seen")
_STARTERS = {}


def starters(path):
    if path not in _STARTERS:
        n = collections.Counter()
        try:
            for line in Path(path).read_text().splitlines():
                p = line.split()
                if p and p[0] in ("DRAGON", "SNAKE"):
                    n[p[1]] += 1
        except OSError:
            pass
        sides = {"≤2" if c <= 2 else "3+" for c in n.values()} or {"?"}
        _STARTERS[path] = sides.pop() if len(sides) == 1 else "mixed"
    return _STARTERS[path]


def duel_sides(d: Path, u, played):
    acc = {x: collections.defaultdict(list) for x in ("a", "b")}
    queens = {x: {"died": 0, "rounds": [], "causes": collections.Counter()} for x in ("a", "b")}
    deaths = {x: collections.Counter() for x in ("a", "b")}
    cpu = {x: {"p99": [], "max": [], "overruns": 0} for x in ("a", "b")}
    for g in played:
        seat = {"a": "B" if g["swapped"] else "A", "b": "A" if g["swapped"] else "B"}
        teams = (g.get("stats") or {}).get("teams") or {}
        for x in ("a", "b"):
            t = teams.get(seat[x]) or {}
            deaths[x].update(t.get("deaths") or {})
            pts = t.get("points") or {}
            if pts:
                cpu[x]["p99"].append(pts.get("p99", 0))
                cpu[x]["max"].append(pts.get("max", 0))
            cpu[x]["overruns"] += t.get("cpu_overruns") or 0
        m = load(d / "metrics" / f"{g['n']}.json")
        if not m or m.get("error"):
            continue
        idx = {r: i for i, r in enumerate(m.get("rounds") or [])}
        for x in ("a", "b"):
            for k in SIDE_METRICS:
                series = ((m.get("team") or {}).get(k) or {}).get(seat[x])
                if not series:
                    continue
                for r in SIDE_ROUNDS:
                    if r in idx and series[idx[r]] is not None:
                        acc[x][f"{k}@{r}"].append(series[idx[r]])
                if series[-1] is not None:
                    acc[x][f"{k}@end"].append(series[-1])
            q = (m.get("queens") or {}).get(seat[x])
            if q:
                queens[x]["died"] += 1
                queens[x]["rounds"].append(q.get("round"))
                queens[x]["causes"][q.get("cause")] += 1
    out, n = {}, len(played)
    for x, bot in (("a", u["a"]), ("b", u["b"])):
        mean = {k: round(sum(v) / len(v), 4) for k, v in sorted(acc[x].items()) if v}
        q = queens[x]
        out[x] = {"bot": bot, "metrics": mean,
                  "queen": {"alive_at_end_pct": round(100 * (n - q["died"]) / n, 1) if n else None,
                            "median_death_round": sorted(q["rounds"])[len(q["rounds"]) // 2] if q["rounds"] else None,
                            "causes": {c: q["causes"][c] for c in QUEEN_CAUSES if q["causes"].get(c)}},
                  "deaths": dict(deaths[x].most_common()),
                  "cpu": {"p99_max": max(cpu[x]["p99"], default=None), "max": max(cpu[x]["max"], default=None),
                          "overruns": cpu[x]["overruns"]}}
    return out


DUEL_FIELDS = ["id", "owner", "a", "b", "suites", "seeds", "games_planned", "both_seats", "created", "status",
               "agent", "note", "reason", "finished", "schedule"]


def duel_summary(did, u, gms):
    meta = {k: u.get(k) for k in DUEL_FIELDS}
    meta.pop("schedule")
    played = [g for g in gms if not g.get("error")]
    done = {g["n"] for g in gms}
    left = 0 if u["status"] in ("done", "cancelled", "failed") else len(u.get("schedule") or []) - len(done)
    out = {**meta, "games_left": left, "games_played": len(played), "games_running": 0, "errors": len(gms) - len(played)}

    def a_result(g):
        if g.get("winner") is None:
            return "D"
        return "W" if g["winner"] == ("B" if g["swapped"] else "A") else "L"

    def row(gs):
        r = collections.Counter(a_result(g) for g in gs)
        return _row({"W": r["W"], "D": r["D"], "L": r["L"]})

    out["record"] = row(played)
    sched = u.get("schedule") or []
    groups = {"by_suite": lambda g: g["suite"], "by_map": lambda g: f"{g['suite']}/{g['map']}",
              "by_end": lambda g: "draw" if g.get("winner") is None else (g.get("reason") or "?").split(",")[0].strip(),
              "by_starters": lambda g: starters(sched[g["n"]]["path"].replace("/data/", str(DATA) + "/"))}
    for k, fn in groups.items():
        b = collections.defaultdict(list)
        for g in played:
            b[fn(g)].append(g)
        out[k] = {key: row(v) for key, v in sorted(b.items())}
    out["sides"] = duel_sides(DATA / "duels" / did, u, played)
    out["games"] = [{"n": g["n"], "suite": g["suite"], "map": g["map"], "seed": g["seed"], "seat_a": g["seat_a"],
                     "seat_b": g["seat_b"], "result_for_a": None if g.get("error") else a_result(g),
                     "winner_seat": g.get("winner"), "rounds": g.get("rounds"), "reason": g.get("reason"),
                     "error": g.get("error"), "judge": g.get("judge"),
                     "replay": f"/api/v1/duels/{did}/games/{g['n']}/replay" if g.get("replay") else None,
                     "watch": f"/duels/{did}/watch/{g['n']}" if g.get("replay") else None} for g in gms]
    return out, len(done), left


# ---------------------------------------------------------------- runnable games: maps and wasm
mapfiles = {}
for root in [DATA / "maps", REPO / "maps"] + [Path(p) for p in glob.glob(str(DATA / "duels/*/maps"))]:
    for p in root.rglob("*.map"):
        mapfiles.setdefault(file_sha(p), p)
wasm_cache = collections.defaultdict(list)
for f in os.listdir(CACHE):
    m = re.fullmatch(r"(.+)-([0-9a-f]{32})-([0-9a-f]{32})-metered\.wasm", f)
    if m:
        wasm_cache[m.group(1)].append(CACHE / f)
back = collections.defaultdict(list)
for old, new in aliases.items():
    back[new].append(old)
WASM = {}


def wasm_sha(bot):
    if bot not in WASM:
        WASM[bot] = None
        for name in [bot, aliases.get(bot)] + back.get(bot, []):
            if name and wasm_cache.get(name):
                p = max(wasm_cache[name], key=lambda p: p.stat().st_mtime)
                WASM[bot] = hashlib.sha256(p.read_bytes()).hexdigest()
                break
    return WASM[bot]


# ---------------------------------------------------------------- write site.db
OUT.mkdir(parents=True, exist_ok=True)
dbp = OUT / "site.db"
if dbp.exists():
    dbp.rename(OUT / "site.db.prev")
db = sqlite3.connect(dbp)
db.execute("PRAGMA page_size = 8192")
db.executescript("""
CREATE TABLE kv (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE subs (id TEXT PRIMARY KEY, bot TEXT, status TEXT, created TEXT, json TEXT, verdict TEXT);
CREATE TABLE sub_extra (id TEXT PRIMARY KEY, report TEXT, metrics TEXT);
CREATE TABLE games (id INTEGER PRIMARY KEY, lane TEXT, suite TEXT, map TEXT, seed TEXT, a TEXT, b TEXT,
  winner TEXT, rounds INTEGER, reason TEXT, replay TEXT, seconds REAL, error TEXT, played TEXT, meta TEXT,
  rated INTEGER, map_sha TEXT, runnable INTEGER);
CREATE TABLE game_stats (id INTEGER PRIMARY KEY, stats BLOB);
CREATE TABLE bot_extra (bot TEXT PRIMARY KEY, h2h TEXT);
CREATE TABLE duels (id TEXT PRIMARY KEY, created TEXT, summary TEXT);
CREATE TABLE duel_games (duel TEXT, n INTEGER, json TEXT, map_sha TEXT, runnable INTEGER, PRIMARY KEY (duel, n));
CREATE TABLE evals_games (id INTEGER PRIMARY KEY, json TEXT);
CREATE TABLE wasm (bot TEXT PRIMARY KEY, sha TEXT);
""")
kv = lambda k, v: db.execute("INSERT INTO kv VALUES (?, ?)", (k, jd(v)))

print("submissions", flush=True)
for sid, s in subs.items():
    v = verdict(sid) if s["status"] not in ("checking", "rejected", "external") else None
    db.execute("INSERT INTO subs VALUES (?,?,?,?,?,?)",
               (sid, s["bot"], s["status"], s["created"], jd(s), jd(v) if v is not None else None))
print("reports and metric summaries", flush=True)
for i, (sid, s) in enumerate(subs.items()):
    rep = report_build(sid) if s["status"] not in ("checking", "external") else None
    mv = mv_submission(sid) if s["status"] != "external" else None
    db.execute("INSERT INTO sub_extra VALUES (?,?,?)", (sid, jd(rep) if rep else None, jd(mv) if mv else None))
    if i % 100 == 0:
        print(" ", i, flush=True)

print("games", flush=True)
rows, srows = [], []
for g in games:
    m = g.get("meta") or {}
    sha_ = m.get("map_sha") if m.get("map_sha") in mapfiles else None
    runnable = int(bool(sha_) and not g["a"].startswith("server") and not g["b"].startswith("server")
                   and wasm_sha(g["a"]) is not None and wasm_sha(g["b"]) is not None)
    rows.append((g["id"], g["lane"], g["suite"], g["map"], str(g["seed"]) if g.get("seed") is not None else None,
                 scrub(g["a"]), scrub(g["b"]), g.get("winner"), g.get("rounds"), g.get("reason"), g.get("replay"),
                 g.get("seconds"), g.get("error"), g.get("played"), jd(m), int(g["_rated"]), sha_, runnable))
    srows.append((g["id"], zlib.compress(jd(g.get("stats") or {}).encode(), 9)))
    if len(rows) >= 20000:
        db.executemany("INSERT INTO games VALUES (" + ",".join("?" * 18) + ")", rows)
        db.executemany("INSERT INTO game_stats VALUES (?,?)", srows)
        rows, srows = [], []
db.executemany("INSERT INTO games VALUES (" + ",".join("?" * 18) + ")", rows)
db.executemany("INSERT INTO game_stats VALUES (?,?)", srows)

print("bots, leaderboard, maps", flush=True)
for bot in bots:
    db.execute("INSERT INTO bot_extra VALUES (?,?)", (bot, jd(head_to_head(bot))))
lb = leaderboard()
kv("bots", bots)
kv("ratings", ratings)
kv("aliases", aliases)
kv("leaderboard", lb)
kv("ranking", ranking())
kv("map_stats", map_stats())
kv("describe", DESCRIBE)
kv("game_subs", sorted({x for g in games for x in (g["a"], g["b"])}))
kv("game_maps", sorted({g["map"] for g in games}))
kv("suite_files", {suite: [p.stem for p in suite_files(suite)]
                   for suite in ("server", "official", "tournament", "custom", "rotating")})
kv("custom_maps", load(DATA / "maps/custom.json", {}) or {})
kv("queue", load(DATA / "queue.json", None))
kv("judge_checks", load(DATA / "judge-checks.json", None) or {"same": 0, "different": 0, "differences": []})
kv("evals_report", load(DATA / "evals/report.json", None))
kv("evals_status", load(DATA / "evals/status.json", None))
kv("frozen", FROZEN)
kv("n_games", len(games))
# map files for previews: /maps/<suite>/<name>, public suites only (pages._map_file)
preview = {}
for suite in ("server", "official", "tournament", "custom", "rotating"):
    d = DATA / f"maps/rotating/e{EPOCH}" if suite == "rotating" else MAP_DIRS[suite][0]
    for p in sorted(d.glob("*.map")) if d.is_dir() else []:
        preview[f"{suite}/{p.stem}"] = file_sha(p)
        mapfiles.setdefault(file_sha(p), p)
kv("map_previews", preview)
# docs
docs = {}
for name in ("TEAMMATES.md", "AGENTS.md", "METRICS.md", "EVALS.md", "SCALER.md"):
    docs[name] = (REPO / "docs" / name).read_text().replace("{ARENA}", PUBLIC_URL)
kv("docs", docs)
# llms.txt (api/llms.py render)
tmpl = None
for node in ast.parse((REPO / "arena/api/llms.py").read_text()).body:
    if isinstance(node, ast.Assign) and getattr(node.targets[0], "id", None) == "TEMPLATE":
        tmpl = ast.literal_eval(node.value)
top = []
for r in lb[:3]:
    elo = ("unrated" if r.get("elo") is None else f"{r['elo']:.0f}" if r.get("err") is None
           else f"{r['elo']:.0f}±{r['err']:.0f}")
    score = f"{r['score']}%" if r.get("score") is not None else "-"
    top.append(f"  {r['rank']}. {r['submission']} ({r['owner']}) elo {elo}, {r['games']} games, score {score}")
kv("llms", tmpl.format(base=PUBLIC_URL, unswbc="1.2.9", n_subs=sum(1 for s in subs.values() if s["status"] != "external"),
                       n_games=len(games), workers=0,
                       waiting=sum(1 for s in subs.values() if s["status"] in ("checking", "queued", "playing", "placing")),
                       top="\n".join(top) or "  (nobody ranked yet)", top_n=3, max_mb=4, cap=0))

print("duels", flush=True)
listing = []
for p in sorted((DATA / "duels").glob("*/meta.json")):
    u = load(p)
    if not u:
        continue
    did = u["id"]
    gms = sorted((load(f) for f in (p.parent / "games").glob("*.json")), key=lambda g: g["n"])
    summ, played_n, left = duel_summary(did, u, gms)
    db.execute("INSERT INTO duels VALUES (?,?,?)", (did, u["created"], jd(summ)))
    listing.append({"id": did, "owner": u["owner"], "a": u["a"], "b": u["b"], "status": u["status"], "created": u["created"],
                    "games_planned": u["games_planned"], "games_left": left, "games_played": played_n, "note": u.get("note", ""),
                    "url": f"/api/v1/duels/{did}"})
    sched = u.get("schedule") or []
    for g in gms:
        s = sched[g["n"]] if g["n"] < len(sched) else {}
        mp = Path((s.get("path") or "").replace("/data/", str(DATA) + "/"))
        msha = file_sha(mp) if mp.is_file() else None
        if msha:
            mapfiles.setdefault(msha, mp)
        runnable = int(bool(msha) and wasm_sha(g["seat_a"]) is not None and wasm_sha(g["seat_b"]) is not None)
        db.execute("INSERT INTO duel_games VALUES (?,?,?,?,?)", (did, g["n"], jd(g), msha, runnable))
listing.sort(key=lambda d: d["created"], reverse=True)
kv("duels", listing)
EPH_FIELDS = ["id", "name", "owner", "sha256", "expires", "status", "created", "agent", "language", "reason", "lane"]
eph = []
for p in sorted((DATA / "ephemeral").glob("*/meta.json")):
    d = load(p)
    if d:
        eph.append({**{k: d.get(k) for k in EPH_FIELDS}, "url": f"/api/v1/ephemeral/{d['id']}"})
eph.sort(key=lambda e: e["created"], reverse=True)
kv("ephemeral", eph)

print("evals games", flush=True)
for f in os.scandir(DATA / "evals/games"):
    g = load(Path(f.path))
    db.execute("INSERT INTO evals_games VALUES (?,?)", (g["id"], jd(g)))

print("wasm", flush=True)
for bot in sorted(set(WASM) | {x for g in games for x in (g["a"], g["b"])} | {u["a"] for u in listing} | {u["b"] for u in listing}):
    if not bot.startswith("server"):
        db.execute("INSERT INTO wasm VALUES (?,?)", (scrub(bot), wasm_sha(bot)))
(OUT / "mapfiles.json").write_text(json.dumps({k: str(v) for k, v in mapfiles.items()}))

db.executescript("""
CREATE INDEX games_a ON games(a, id);
CREATE INDEX games_b ON games(b, id);
CREATE INDEX games_lane ON games(lane, id);
CREATE INDEX games_map ON games(map, id);
CREATE INDEX subs_bot ON subs(bot);
""")
db.commit()
db.execute("VACUUM")
db.close()
print("site.db", round(dbp.stat().st_size / 1e6, 1), "MB")
