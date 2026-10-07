#!/usr/bin/env python3
"""Normalize one size-cap exception into a private, pinned failure-log source."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path


EXPECTED_JOB = "40368752256"
EXPECTED_ORDINAL = 19


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--raw", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()
    payload = json.loads(args.raw.read_bytes())
    if payload.get("job_id") != EXPECTED_JOB or not isinstance(payload.get("build_log"), str):
        raise SystemExit("job-or-log-drift")
    data = payload["build_log"].encode("utf-8")
    if not data.strip() or not (4 * 1024 * 1024 < len(data) < 8 * 1024 * 1024):
        raise SystemExit("oversize-bound-drift")
    target = args.output_dir / f"HTTP-PROVISIONAL-FAILURE-LOG-{EXPECTED_ORDINAL:02d}-{EXPECTED_JOB}.txt"
    fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"ordinal": EXPECTED_ORDINAL, "job_id": EXPECTED_JOB,
                      "raw_sha256": hashlib.sha256(args.raw.read_bytes()).hexdigest(),
                      "log_sha256": hashlib.sha256(data).hexdigest(),
                      "log_utf8_bytes": len(data)}))


if __name__ == "__main__":
    main()
