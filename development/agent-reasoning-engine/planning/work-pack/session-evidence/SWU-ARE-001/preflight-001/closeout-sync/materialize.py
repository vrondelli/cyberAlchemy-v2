#!/usr/bin/env python3
"""Materialize the one-line evaluator task status closeout."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


RUN = Path(__file__).resolve().parent
ROOT = RUN.parents[5]
TARGET = "planning/work-pack/tasks/TASK-ARE-EVALUATOR-001.md"
BASELINE = "05ede37403155f861e4d1204e91f6b1fd838bc66a72f34cdd6b99267e5629255"
OUTPUT = RUN / "staging" / TARGET


def ref(path: str) -> dict[str, object]:
    content = (ROOT / path).read_bytes()
    return {
        "path": path,
        "sha256": hashlib.sha256(content).hexdigest(),
        "size_bytes": len(content),
    }


def main() -> None:
    current = (ROOT / TARGET).read_text(encoding="utf-8")
    if hashlib.sha256(current.encode()).hexdigest() != BASELINE:
        raise ValueError("evaluator task baseline drift")
    old = "Layer: L0. Status: **selected, blocked by TASK-ARE-READINESS-001**."
    new = (
        "Layer: L0. Status: **selected, ready; execution authorized by the "
        "current Task Session**."
    )
    if current.count(old) != 1:
        raise ValueError("expected exactly one stale evaluator status")
    staged = current.replace(old, new, 1)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(staged, encoding="utf-8")
    output_path = OUTPUT.relative_to(ROOT).as_posix()
    package = {
        "schema_version": "1.0.0",
        "package_id": "ARE-SWU-001-PREFLIGHT-CLOSEOUT-20260723",
        "mutation_mode": "apply-approved",
        "mutation_state": "materialized",
        "lifecycle_owner": "invoke",
        "authority_class": "private",
        "publication_class": "internal",
        "source_artifacts": [
            {
                **ref(
                    "planning/work-pack/session-evidence/SWU-ARE-001/"
                    "preflight-001/execution-receipt.json"
                ),
                "authority_class": "private",
            },
            {
                **ref(
                    "planning/work-pack/session-evidence/SWU-ARE-001/"
                    "preflight-001/CONTINUATION.json"
                ),
                "authority_class": "private",
            },
            {
                **ref(
                    "decisions/implementation-readiness/session-evidence/"
                    "TASK-ARE-READINESS-001-RECEIPT.json"
                ),
                "authority_class": "private",
            },
        ],
        "changes": [
            {
                "target_path": TARGET,
                "operation": "update",
                "output_ref": ref(output_path),
            }
        ],
        "target_inventory": [
            {
                "target_path": TARGET,
                "lifecycle_owner": "invoke",
                "authority_class": "private",
                "publication_class": "internal",
                "dependency_ids": ["evaluator-task-baseline"],
            }
        ],
        "dependencies": [
            {
                "dependency_id": "evaluator-task-baseline",
                "artifact_ref": ref(TARGET),
            }
        ],
        "mirror_groups": [],
        "approval": {
            "class": "explicit-apply",
            "owner": "invoke",
            "scope_paths": [TARGET],
            "authority_classes": ["private"],
            "publication_classes": ["internal"],
        },
        "validation_commands": [
            "rg -n '^Layer: L0\\. Status: \\*\\*selected, ready; execution authorized by the current Task Session\\*\\*\\.$' planning/work-pack/tasks/TASK-ARE-EVALUATOR-001.md"
        ],
    }
    (RUN / "material-package.json").write_text(
        json.dumps(package, indent=2) + "\n", encoding="utf-8"
    )
    print("CLOSEOUT_MATERIALIZATION=pass")


if __name__ == "__main__":
    main()
