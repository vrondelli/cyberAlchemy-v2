#!/usr/bin/env python3
"""Install locked Playwright WebKit compatibility libraries without root."""
import concurrent.futures
import hashlib
import json
import os
import platform
import subprocess
import tempfile
import urllib.request
from pathlib import Path

here = Path(__file__).resolve().parent
lock_bytes = (here / "webkit-lock.json").read_bytes()
lock = json.loads(lock_bytes)
if 'VERSION_ID="26.04"' not in Path("/etc/os-release").read_text() or platform.machine() != "x86_64":
    raise SystemExit("WebKit dependency lock requires Ubuntu 26.04 x86_64")

digest = hashlib.sha256(lock_bytes).hexdigest()
base = Path(os.environ.get("XDG_DATA_HOME", str(Path.home() / ".local/share"))) / "cyberalchemy/toolchains"
root = base / ("webkit-" + digest[:16])
marker = root / "installation.json"
if marker.exists() and json.loads(marker.read_text())["lock_sha256"] == digest:
    print(root)
    raise SystemExit(0)

base.mkdir(parents=True, exist_ok=True)
cache = base / "webkit-downloads"
cache.mkdir(exist_ok=True)

def download(package):
    archive = cache / package["filename"]
    if archive.exists() and archive.stat().st_size == package["size"] and hashlib.sha256(archive.read_bytes()).hexdigest() == package["sha256"]:
        return archive
    with urllib.request.urlopen(package["uri"], timeout=120) as response:
        payload = response.read()
    if len(payload) != package["size"] or hashlib.sha256(payload).hexdigest() != package["sha256"]:
        raise RuntimeError("WebKit dependency digest mismatch: " + package["package"])
    archive.write_bytes(payload)
    return archive

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    archives = list(pool.map(download, lock["packages"]))

with tempfile.TemporaryDirectory(prefix=".webkit-", dir=base) as temporary:
    stage = Path(temporary) / "root"
    stage.mkdir()
    for archive in archives:
        subprocess.run(["dpkg-deb", "--extract", str(archive), str(stage)], check=True)
    (stage / "installation.json").write_text(json.dumps({
        "lock_sha256": digest,
        "playwright_webkit_revision": lock["playwright_webkit_revision"],
        "authority_effect": "none",
        "open_questions_ref": str(here / "README.md")
    }, indent=2) + "\n")
    stage.rename(root)
print(root)
