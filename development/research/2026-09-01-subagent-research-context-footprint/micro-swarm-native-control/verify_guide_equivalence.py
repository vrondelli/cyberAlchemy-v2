#!/usr/bin/env python3
"""Verify exact task, schema, and source exposure equivalence across arms."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[4]


def ref_for(path: Path) -> dict:
    data = path.read_bytes()
    return {"path": path.relative_to(REPO).as_posix(), "sha256": hashlib.sha256(data).hexdigest(), "size": len(data)}


def main() -> int:
    manifest = json.loads((ROOT / "GUIDE-MANIFEST.json").read_text())
    expected = [f"MAP-{index:03d}" for index in range(1, 7)]
    if manifest.get("task_ids") != expected:
        print("ARM_EQUIVALENCE=task-id-drift")
        return 1
    for field in ["shared_task_manifest", "shared_card_schema", "frozen_gold_cards"]:
        ref = manifest.get(field)
        if not isinstance(ref, dict):
            print(f"ARM_EQUIVALENCE=missing-{field}")
            return 1
        path = REPO / ref["path"]
        if not path.is_file() or ref_for(path) != ref:
            print(f"ARM_EQUIVALENCE=drift-{field}")
            return 1
    task_manifest = json.loads((REPO / manifest["shared_task_manifest"]["path"]).read_text())
    if [task["task_id"] for task in task_manifest["tasks"]] != expected:
        print("ARM_EQUIVALENCE=manifest-task-drift")
        return 1
    arms = manifest.get("arms", {})
    if set(arms) != {"luna_swarm", "sol_reference"}:
        print("ARM_EQUIVALENCE=arm-set-drift")
        return 1
    projections = {(arm["task_manifest_binding"], arm["card_schema_binding"], arm["source_policy"]) for arm in arms.values()}
    if len(projections) != 1:
        print("ARM_EQUIVALENCE=exposure-drift")
        return 1
    print("ARM_EQUIVALENCE=pass")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

