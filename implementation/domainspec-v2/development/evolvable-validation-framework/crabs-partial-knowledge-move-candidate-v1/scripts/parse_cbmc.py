#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

LOOP_PATTERN = re.compile(r"^Loop ([^:]+):", re.MULTILINE)
PROPERTY_PATTERN = re.compile(r"^Property ([^:]+):", re.MULTILINE)


def loops(output: str) -> list[str]:
    return sorted(set(LOOP_PATTERN.findall(output)))


def properties(output: str) -> list[str]:
    return sorted(set(PROPERTY_PATTERN.findall(output)))


def target_result(output: str, property_id: str) -> str | None:
    pattern = re.compile(
        rf"^\[{re.escape(property_id)}\].*:\s+(SUCCESS|FAILURE)$", re.MULTILINE
    )
    match = pattern.search(output)
    return match.group(1) if match else None


def classify_target(process_status: str, exit_code: int | None,
                    output: str, property_id: str) -> str:
    result = target_result(output, property_id)
    if result == "FAILURE" and exit_code not in (None, 0):
        return "counterexample"
    if (process_status == "completed" and exit_code == 0 and result == "SUCCESS"
            and "VERIFICATION SUCCESSFUL" in output):
        return "no-counterexample-at-bound"
    return "not-evaluable"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=["loops", "properties", "target"])
    parser.add_argument("--stdout", type=Path, required=True)
    parser.add_argument("--property-id")
    parser.add_argument("--process-status", default="completed")
    parser.add_argument("--exit-code", type=int)
    args = parser.parse_args()
    output = args.stdout.read_text(encoding="utf-8", errors="replace")
    if args.mode == "loops":
        value: object = loops(output)
    elif args.mode == "properties":
        value = properties(output)
    else:
        if not args.property_id:
            parser.error("--property-id is required for target mode")
        value = classify_target(args.process_status, args.exit_code,
                                output, args.property_id)
    print(json.dumps(value, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
