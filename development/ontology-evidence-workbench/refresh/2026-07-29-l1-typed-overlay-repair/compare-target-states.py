#!/usr/bin/env python3
"""Compare exact target arrays from two Refresh state captures."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--before", type=Path, required=True)
    parser.add_argument("--after", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--comparison-id", required=True)
    args = parser.parse_args()
    before = json.loads(args.before.read_text())
    after = json.loads(args.after.read_text())
    equal = before.get("targets") == after.get("targets")
    output = {
        "schema_version": "invoke.target-state-comparison.v1",
        "comparison_id": args.comparison_id,
        "before": str(args.before),
        "after": str(args.after),
        "target_count": len(before.get("targets", [])),
        "targets_equal": equal,
        "result": "pass" if equal else "block",
        "authority_effect": "none",
    }
    args.output.write_text(json.dumps(output, indent=2) + "\n")
    return 0 if equal else 1


if __name__ == "__main__":
    raise SystemExit(main())
