#!/usr/bin/env python3
"""Stage exact bound source for an isolated build. Open questions: README.md."""
import hashlib
import json
from pathlib import Path
import shutil
import sys

here = Path(__file__).resolve().parent
binding = json.loads((here / "source-binding.json").read_text())
source = (here / binding["source_root"]).resolve()
target = Path(sys.argv[1]).resolve()
target.mkdir(mode=0o700)  # Existing targets are never overwritten.
for name, expected in binding["files"].items():
    data = (source / name).read_bytes()
    assert hashlib.sha256(data).hexdigest() == expected, f"source drift: {name}"
    dest = target / "vendor/rwo-rust" / name
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)
for name in ["Cargo.toml", "src/main.rs"]:
    dest = target / name
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(here / name, dest)
if (here / "Cargo.lock").exists():
    shutil.copyfile(here / "Cargo.lock", target / "Cargo.lock")
print(json.dumps({"stage": str(target), "source": str(source), "verified_files": len(binding["files"])}))
