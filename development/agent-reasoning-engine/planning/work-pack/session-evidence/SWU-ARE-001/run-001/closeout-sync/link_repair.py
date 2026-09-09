#!/usr/bin/env python3
"""Materialize one Invoke-owned relative-link correction."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


RUN = Path(__file__).resolve().parent
ROOT = RUN.parents[5]
TARGET = "planning/WORK-PACK.md"
BASELINE = "9a8419ec8e44a4dd5e893129abd5636f93b2b26b33bbe2aa37f0588030d09cd1"
OUTPUT = RUN / "staging" / "link-repair" / TARGET


def digest(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def ref(path: str) -> dict[str, object]:
    content = (ROOT / path).read_bytes()
    return {
        "path": path,
        "sha256": digest(content),
        "size_bytes": len(content),
    }


def main() -> None:
    current = (ROOT / TARGET).read_bytes()
    if digest(current) != BASELINE:
        raise ValueError("Work Pack link-repair baseline drift")
    text = current.decode()
    old = (
        "](../../implementation/agent-reasoning-engine/generated/runs/"
        "evaluator-v1-20260723T-session-001/TERMINAL-RECEIPT.json)"
    )
    new = (
        "](../../../implementation/agent-reasoning-engine/generated/runs/"
        "evaluator-v1-20260723T-session-001/TERMINAL-RECEIPT.json)"
    )
    if text.count(old) != 1:
        raise ValueError("expected one broken relative witness link")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(text.replace(old, new, 1))
    output_path = OUTPUT.relative_to(ROOT).as_posix()
    dependency = ref(TARGET)
    package = {
        "schema_version": "1.0.0",
        "package_id": "ARE-SWU-001-INVOKE-LINK-REPAIR-20260723",
        "mutation_mode": "apply-approved",
        "mutation_state": "materialized",
        "lifecycle_owner": "invoke",
        "authority_class": "private",
        "publication_class": "internal",
        "source_artifacts": [
            {
                **ref(
                    "planning/work-pack/session-evidence/SWU-ARE-001/"
                    "run-001/execution-receipt.json"
                ),
                "authority_class": "private",
            }
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
                "dependency_ids": ["work-pack-closeout-baseline"],
            }
        ],
        "dependencies": [
            {
                "dependency_id": "work-pack-closeout-baseline",
                "artifact_ref": dependency,
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
            "rg -n '\\.\\./\\.\\./\\.\\./implementation/agent-reasoning-engine/"
            "generated/runs/evaluator-v1-20260723T-session-001/"
            "TERMINAL-RECEIPT.json' planning/WORK-PACK.md"
        ],
    }
    (RUN / "link-repair-invoke-material-package.json").write_text(
        json.dumps(package, indent=2) + "\n"
    )
    print("LINK_REPAIR_MATERIALIZATION=pass")


if __name__ == "__main__":
    main()
