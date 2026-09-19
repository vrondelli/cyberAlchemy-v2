#!/usr/bin/env python3
"""Validate the exact SWU-BTE-L0A-REPAIR-001 preimage or postimage."""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
from pathlib import Path


def sha256(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def repo_root() -> Path:
    for candidate in Path(__file__).resolve().parents:
        if (candidate / ".git").exists():
            return candidate
    raise RuntimeError("repository root not found")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=("pre", "post"), required=True)
    args = parser.parse_args()

    root = repo_root()
    index_path = Path(__file__).resolve().parent / "context-index.json"
    index = json.loads(index_path.read_text(encoding="utf-8"))
    failures: list[str] = []

    for target in index["byte_targets"]:
        path = root / target["path"]
        content = path.read_bytes()
        actual = sha256(content)
        if args.mode == "pre":
            if actual != target["pre_sha256"]:
                failures.append(f"preimage mismatch: {target['path']}")
            if sha256(content + b"\n") != target["post_sha256"]:
                failures.append(f"one-LF relation mismatch: {target['path']}")
        elif actual != target["post_sha256"]:
            failures.append(f"postimage mismatch: {target['path']}")

        if args.mode == "post" and path.suffix == ".json":
            try:
                json.loads(content)
            except json.JSONDecodeError as error:
                failures.append(f"JSON parse failed: {target['path']}: {error}")

    for control in index["forbidden_controls"]:
        path = root / control["path"]
        if sha256(path.read_bytes()) != control["sha256"]:
            failures.append(f"forbidden control changed: {control['path']}")

    if args.mode == "post":
        bte_source = (
            "projects/domainspec-v2/impl/test-derivation-engine/src/bte"
        )
        result = subprocess.run(
            ["git", "diff", "--name-only", "--", bte_source],
            cwd=root,
            check=True,
            capture_output=True,
            text=True,
        )
        changed = {line for line in result.stdout.splitlines() if line}
        expected = {target["path"] for target in index["byte_targets"]}
        if changed != expected:
            failures.append(
                "changed-path allowlist mismatch: "
                f"expected={sorted(expected)} actual={sorted(changed)}"
            )

    if failures:
        for failure in failures:
            print(f"BLOCK: {failure}")
        return 1

    print(
        f"PASS: SWU-BTE-L0A-REPAIR-001 {args.mode} validation "
        f"({len(index['byte_targets'])} targets, "
        f"{len(index['forbidden_controls'])} preserved controls)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
