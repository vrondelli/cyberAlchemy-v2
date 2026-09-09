#!/usr/bin/env python3
"""Capture exact live or staged state for every material-package target."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


def artifact(path: Path, logical: str) -> dict[str, object]:
    content = path.read_bytes()
    return {
        "path": logical,
        "present": True,
        "sha256": hashlib.sha256(content).hexdigest(),
        "size_bytes": len(content),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--package", type=Path, required=True)
    parser.add_argument("--root", type=Path, required=True)
    parser.add_argument("--state", choices=("live", "staged"), required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    package = json.loads(args.package.read_text())
    records = []
    for change in package["changes"]:
        logical = change["target_path"]
        path = args.root / logical
        records.append(
            artifact(path, logical)
            if path.is_file()
            else {"path": logical, "present": False}
        )
    output = {
        "schema_version": "invoke.material-target-state.v1",
        "package_id": package["package_id"],
        "state": args.state,
        "target_count": len(records),
        "targets": records,
        "all_present": all(record["present"] for record in records),
        "authority_effect": "none",
    }
    args.output.write_text(json.dumps(output, indent=2) + "\n")
    return 0 if output["all_present"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
