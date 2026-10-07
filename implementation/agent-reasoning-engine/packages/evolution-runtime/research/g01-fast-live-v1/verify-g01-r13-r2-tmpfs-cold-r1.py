#!/usr/bin/env python3
"""Verify exact terminal VPS tmpfs roots against WSL cold copies before reclaim."""
import hashlib
import json
import os
from pathlib import Path
import subprocess

BASE = Path("/home/vlad_/are-benchmark-archive")
OUTPUT_ROOT = BASE / "g01-r13-r2-tmpfs-reclaim-r1-20261002"
OUTPUT = OUTPUT_ROOT / "PRE-RECLAIM.json"
HOST = "root@187.77.163.194"
ROOTS = {
    "are-g01-r12-source-caches-r1": BASE / "g01-r12-source-caches-r1-20261001",
    "are-g01-r12-remaining-typescript-cache-r1": BASE / "g01-r12-remaining-typescript-qualification-r1-20261001/cache",
    **{name: BASE / "g01-terminal-tmpfs-cold-20261002" / name for name in (
        "are-g01-r37-transformers-next-order-r1",
        "are-g01-r31-django-import-validation-r1",
        "are-g01-r33-django-heading-pair-r1",
        "are-g01-r35-langchain-next-order-r1",
        "are-g01-r36-openlibrary-next-order-r1")},
}


def run(argv, timeout=180):
    result = subprocess.run(argv, capture_output=True, text=True, timeout=timeout)
    if result.returncode:
        raise ValueError("command-failed:" + argv[0] + ":" + result.stderr[:300])
    return result.stdout


def main():
    if OUTPUT.exists() or OUTPUT_ROOT.exists():
        raise ValueError("fresh-output-required")
    rows = []
    for name, destination in ROOTS.items():
        source = "/tmp/" + name
        if not destination.is_dir() or destination.is_symlink():
            raise ValueError("cold-target-invalid:" + name)
        run(["ssh", "-o", "BatchMode=yes", HOST, "test", "-d", source])
        diff = run(["rsync", "-rlt", "--checksum", "--dry-run", "--itemize-changes",
                    f"{HOST}:{source}/", str(destination) + "/"], timeout=300)
        if diff:
            raise ValueError("cold-copy-drift:" + name + ":" + diff[:300])
        size = run(["ssh", "-o", "BatchMode=yes", HOST, "du", "-sk", source])
        kib, exact = size.strip().split("\t", 1)
        if exact != source or not kib.isdigit():
            raise ValueError("remote-size-shape:" + name)
        rows.append({"vps_root": source, "wsl_cold_root": str(destination),
                     "vps_allocated_kib": int(kib), "checksum_dry_run_diff": 0})
    receipt = {"schema_version": "are.g01-r13-r2-tmpfs-cold-verification/v1",
               "status": "verified-cold-not-yet-reclaimed",
               "roots": rows, "total_vps_allocated_kib": sum(row["vps_allocated_kib"] for row in rows),
               "candidate_sha256": "e2a7a96ab1da7de1e0e7dba26a19a82ae8661ae481cefad1f504209cadadfe1d",
               "storage_census_sha256": "48ab5dd83b129382f80e37948a7695dc4fe9f0351161666a68ef3a98be4e164b",
               "script_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
               "model_calls": 0, "gold_loaded": False,
               "claim_ceiling": "Verified recoverable cold copies of exact terminal tmpfs roots; no deletion or storage admission yet"}
    OUTPUT_ROOT.mkdir(mode=0o700)
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write((json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode())
    print(json.dumps({"status": receipt["status"], "roots": len(rows),
                      "total_vps_allocated_kib": receipt["total_vps_allocated_kib"],
                      "receipt_sha256": hashlib.sha256(OUTPUT.read_bytes()).hexdigest()}, sort_keys=True))


if __name__ == "__main__":
    main()
