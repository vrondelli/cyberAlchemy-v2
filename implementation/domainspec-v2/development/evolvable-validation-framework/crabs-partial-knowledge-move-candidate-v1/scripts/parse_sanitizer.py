#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path


def diagnostic(stdout: bytes, stderr: bytes) -> str:
    combined = stdout + b"\n" + stderr
    if b"ERROR: AddressSanitizer:" in combined:
        return "asan"
    if b"ERROR: LeakSanitizer:" in combined:
        return "lsan"
    if b"runtime error:" in combined:
        return "ubsan"
    return "none"


def classify(process_status: str, exit_code: int | None,
             stdout: bytes, stderr: bytes) -> dict[str, str]:
    found = diagnostic(stdout, stderr)
    if found != "none":
        status = "violation"
    elif process_status == "completed" and exit_code == 0:
        status = "no-detected-violation"
    else:
        status = "not-evaluable"
    return {"diagnostic": found, "safety_status": status}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--stdout", type=Path, required=True)
    parser.add_argument("--stderr", type=Path, required=True)
    parser.add_argument("--process-status", required=True)
    parser.add_argument("--exit-code", type=int)
    args = parser.parse_args()
    result = classify(args.process_status, args.exit_code,
                      args.stdout.read_bytes(), args.stderr.read_bytes())
    print(json.dumps(result, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
