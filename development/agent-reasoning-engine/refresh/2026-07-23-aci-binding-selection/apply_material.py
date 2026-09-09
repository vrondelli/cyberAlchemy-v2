#!/usr/bin/env python3
"""Apply exact staged outputs after rechecking both ready handoffs."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


RUN = Path(__file__).resolve().parent
ROOT = next(parent for parent in RUN.parents if (parent / ".git").exists())


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    applied: list[str] = []
    for owner in ("invoke", "craft"):
        handoff = json.loads((RUN / f"{owner}-handoff.json").read_text())
        if not (
            handoff["phaseStatus"] == "pass"
            and handoff["handoffStatus"] == "ready"
            and handoff["mutationReady"] is True
            and not handoff["blockers"]
        ):
            raise ValueError(f"{owner} handoff is not mutation-ready")
        package = json.loads((RUN / f"{owner}-material-package.json").read_text())
        receipt = json.loads((RUN / f"{owner}-material-receipt.json").read_text())
        if receipt["packageId"] != package["package_id"]:
            raise ValueError(f"{owner} package identity mismatch")
        dependencies = {
            row["dependency_id"]: row["artifact_ref"]
            for row in package["dependencies"]
        }
        inventory = {
            row["target_path"]: row
            for row in package["target_inventory"]
        }
        for change in package["changes"]:
            relative = change["target_path"]
            dependency_ids = inventory[relative]["dependency_ids"]
            if len(dependency_ids) != 1:
                raise ValueError(f"{relative}: expected one baseline")
            baseline = dependencies[dependency_ids[0]]
            target = ROOT / relative
            if sha256(target) != baseline["sha256"]:
                raise ValueError(f"{relative}: baseline drift")
            staged_ref = change["output_ref"]
            staged = ROOT / staged_ref["path"]
            if sha256(staged) != staged_ref["sha256"]:
                raise ValueError(f"{relative}: staged output drift")
            target.write_bytes(staged.read_bytes())
            applied.append(relative)
    print(f"APPLIED={len(applied)}")
    for relative in applied:
        print(relative)


if __name__ == "__main__":
    main()

