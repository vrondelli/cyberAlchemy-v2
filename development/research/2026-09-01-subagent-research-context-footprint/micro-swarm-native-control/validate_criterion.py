#!/usr/bin/env python3
"""Read-only validator for the native micro-swarm criterion package."""

from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from pathlib import Path

from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[4]


def exact_ref(path: Path) -> dict:
    data = path.read_bytes()
    return {"path": path.relative_to(REPO).as_posix(), "sha256": hashlib.sha256(data).hexdigest(), "size": len(data)}


def main() -> int:
    criterion = json.loads((ROOT / "CRITERION.json").read_text())
    schema = json.loads((ROOT / "criterion.schema.json").read_text())
    errors = sorted(Draft202012Validator(schema).iter_errors(criterion), key=lambda e: list(e.path))
    if errors:
        for error in errors:
            print(f"SCHEMA_ERROR={list(error.path)}: {error.message}")
        return 1
    expected_tasks = [f"MAP-{index:03d}" for index in range(1, 7)]
    if criterion["arms"]["luna_swarm"]["task_ids"] != expected_tasks or criterion["arms"]["sol_reference"]["task_ids"] != expected_tasks:
        print("ARM_TASKS=drift")
        return 1
    for name, ref in criterion["bound_artifacts"].items():
        path = REPO / ref["path"]
        if not path.is_file() or exact_ref(path) != ref:
            print(f"BOUND_ARTIFACT_DRIFT={name}")
            return 1
    rendered = subprocess.run([sys.executable, str(ROOT / "render_criterion.py"), "--check"], capture_output=True, text=True)
    if rendered.returncode:
        print(rendered.stdout.strip() or rendered.stderr.strip())
        return 1
    print("CRITERION_VALIDATION=pass")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

