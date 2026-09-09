#!/usr/bin/env python3
"""Capture the six future 007T implementation targets to prove Refresh immutability."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


TARGETS = [
    "upstream/overlay/overlay-manifest.json",
    "upstream/overlay/first-working-version-manifest.json",
    "upstream/overlay/packages/dashboard/src/oew/types.ts",
    "upstream/overlay/packages/dashboard/src/oew/loadOewBundle.ts",
    "upstream/overlay/packages/dashboard/src/oew/store.ts",
    "upstream/L1-BUILD.lock.json",
]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--implementation-root", type=Path, required=True)
    parser.add_argument("--state", choices=("before", "after"), required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    records = []
    for relative in TARGETS:
        path = args.implementation_root / relative
        content = path.read_bytes()
        records.append(
            {
                "path": relative,
                "sha256": hashlib.sha256(content).hexdigest(),
                "size_bytes": len(content),
            }
        )
    output = {
        "schema_version": "oew.007t-future-target-state.v1",
        "state": args.state,
        "target_count": len(records),
        "targets": records,
        "authority_effect": "none",
    }
    args.output.write_text(json.dumps(output, indent=2) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
