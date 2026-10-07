#!/usr/bin/env python3
"""Verify and locally restore the exact r14 scratch cold copy before VPS reclaim."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile


ARCHIVE = Path("/home/vlad_/are-benchmark-archive/g01-r14-scratch-layout-probe-r1-20261002")
COLD = ARCHIVE / "scratch"
PROBE = ARCHIVE / "SCRATCH-PROBE.json"
OUTPUT = ARCHIVE / "COLD-VERIFY.json"
HOST = "root@187.77.163.194"
REMOTE = "/tmp/are-g01-r14-scratch-layout-probe-r1"
PROBE_SHA = "cbd1c91ad1d2480b41009730ef501a8d1f156ca5e3943cd4eca3d9e54ed7adda"


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(argv, timeout=600):
    result = subprocess.run(argv, capture_output=True, text=True, timeout=timeout)
    if result.returncode:
        raise ValueError("command-failed:" + argv[0] + ":" + result.stderr[:300])
    return result.stdout


def count_regular(root):
    return sum(1 for path in root.rglob("*") if path.is_file() and not path.is_symlink())


def main():
    if OUTPUT.exists() or not COLD.is_dir() or COLD.is_symlink() or sha(PROBE) != PROBE_SHA:
        raise ValueError("cold-boundary")
    probe = json.loads(PROBE.read_text())
    if (probe["status"] != "passed-source-retained" or probe["scratch_root"] != REMOTE or
            len(probe["checkouts"]) != 4 or probe["model_calls"] != 0 or
            probe["gold_loaded"] is not False):
        raise ValueError("probe-shape")
    run(["ssh", "-o", "BatchMode=yes", HOST, "test", "-d", REMOTE])
    live_diff = run(["rsync", "-rltp", "--checksum", "--dry-run", "--itemize-changes",
                     f"{HOST}:{REMOTE}/", str(COLD) + "/"])
    if live_diff:
        raise ValueError("cold-copy-drift:" + live_diff[:300])
    regular = count_regular(COLD)
    if regular != 169516:
        raise ValueError("regular-file-count")
    with tempfile.TemporaryDirectory(prefix="restore-g01-r14-", dir=ARCHIVE) as temporary:
        restored = Path(temporary)
        run(["rsync", "-a", str(COLD) + "/", str(restored) + "/"])
        restore_diff = run(["rsync", "-rltp", "--checksum", "--dry-run", "--itemize-changes",
                            str(COLD) + "/", str(restored) + "/"])
        if restore_diff or count_regular(restored) != regular:
            raise ValueError("restore-drift:" + restore_diff[:300])
    size_output = run(["ssh", "-o", "BatchMode=yes", HOST, "du", "-sk", REMOTE])
    kib, exact = size_output.strip().split("\t", 1)
    if exact != REMOTE or not kib.isdigit():
        raise ValueError("remote-size-shape")
    receipt = {"schema_version": "are.g01-r14-scratch-cold-verification/v1",
               "status": "verified-cold-restored-not-yet-reclaimed",
               "vps_root": REMOTE, "wsl_cold_root": str(COLD),
               "probe_sha256": PROBE_SHA, "regular_files": regular,
               "vps_allocated_kib": int(kib), "live_checksum_dry_run_diff": 0,
               "restore_checksum_dry_run_diff": 0, "script_sha256": sha(Path(__file__)),
               "model_calls": 0, "gold_loaded": False,
               "claim_ceiling": "Recoverable exact rehearsal scratch only; no deletion, freeze, model score or superiority"}
    data = (json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"status": receipt["status"], "regular_files": regular,
                      "receipt_sha256": hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == "__main__":
    main()
