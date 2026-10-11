"""After backend_data.py: the files the site serves. site.db in 32 MB chunks (GitHub refuses files
over 100 MB), every map a game was played on by sha256, and each submission's source zip.

    python3 pack.py ~/tokenz-arena-data BACKEND_OUT SITE_OUT
"""
import json
import os
import shutil
import sys
from pathlib import Path

DATA, BACK, OUT = (Path(os.path.expanduser(p)) for p in sys.argv[1:4])
CHUNK = 32 << 20
for d in ("data/site", "maps", "source"):
    (OUT / d).mkdir(parents=True, exist_ok=True)
blob = (BACK / "site.db").read_bytes()
n = (len(blob) + CHUNK - 1) // CHUNK
for i in range(n):
    (OUT / f"data/site/site.db.{i:03d}").write_bytes(blob[i * CHUNK:(i + 1) * CHUNK])
(OUT / "data/site/config.json").write_text(json.dumps({"chunkSize": CHUNK, "length": len(blob), "chunks": n}))
for sha, p in json.loads((BACK / "mapfiles.json").read_text()).items():
    shutil.copyfile(p, OUT / "maps" / f"{sha}.map")
for d in (DATA / "submissions").iterdir():
    if (d / "source.zip").exists():
        shutil.copyfile(d / "source.zip", OUT / "source" / f"{d.name}.zip")
print(n, "chunks")
