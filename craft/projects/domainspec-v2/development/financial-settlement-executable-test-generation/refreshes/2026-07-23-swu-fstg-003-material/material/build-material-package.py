#!/usr/bin/env python3
"""Build the exact Invoke material package for SWU-FSTG-003."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


def repo_root() -> Path:
    for candidate in Path(__file__).resolve().parents:
        if (candidate / ".git").exists():
            return candidate
    raise RuntimeError("repository root not found")


ROOT = repo_root()
MATERIAL = Path(__file__).resolve().parent
STAGED = MATERIAL.relative_to(ROOT) / "staged"
PREFIX = "projects/domainspec-v2/development/financial-settlement-executable-test-generation"
TARGETS = [
    "projects/domainspec-v2/impl/test-derivation-engine/src/bte/feature-projector.test.ts",
    "projects/domainspec-v2/impl/test-derivation-engine/src/bte/feature-projector.ts",
]
SOURCES = [
    f"{PREFIX}/PLAN.md",
    f"{PREFIX}/WORK-PACK.md",
    f"{PREFIX}/session-evidence/SWU-FSTG-003/20260723T193213Z-feature-projector/context-pack.json",
]
DEPENDENCY = (
    f"{PREFIX}/session-evidence/SWU-FSTG-002/"
    "20260723T191821Z-collecting-instance-validation/task-session-receipt.json"
)
COMMANDS = [
    (
        "npx vitest run projects/domainspec-v2/impl/"
        "test-derivation-engine/src/bte/feature-projector.test.ts"
    ),
    "npm --prefix projects/domainspec-v2/impl run verify:bte",
]


def ref(path: str) -> dict[str, object]:
    content = (ROOT / path).read_bytes()
    return {
        "path": path,
        "sha256": hashlib.sha256(content).hexdigest(),
        "size_bytes": len(content),
    }


def main() -> None:
    package = {
        "schema_version": "1.0.0",
        "package_id": "dsv2-fstg-swu-003-20260723T193213Z",
        "mutation_mode": "apply-approved",
        "mutation_state": "materialized",
        "lifecycle_owner": "projects/domainspec-v2",
        "authority_class": "private",
        "publication_class": "internal",
        "source_artifacts": [
            {**ref(path), "authority_class": "private"} for path in SOURCES
        ],
        "changes": [
            {
                "target_path": target,
                "operation": "create",
                "output_ref": ref(str(STAGED / target)),
            }
            for target in TARGETS
        ],
        "target_inventory": [
            {
                "target_path": target,
                "lifecycle_owner": "projects/domainspec-v2",
                "authority_class": "private",
                "publication_class": "internal",
                "dependency_ids": ["SWU-FSTG-002"],
            }
            for target in TARGETS
        ],
        "dependencies": [
            {
                "dependency_id": "SWU-FSTG-002",
                "artifact_ref": ref(DEPENDENCY),
            }
        ],
        "mirror_groups": [],
        "approval": {
            "class": "explicit-apply",
            "owner": "projects/domainspec-v2",
            "scope_paths": TARGETS,
            "authority_classes": ["private"],
            "publication_classes": ["internal"],
        },
        "validation_commands": COMMANDS,
    }
    (MATERIAL / "MATERIAL-PACKAGE.json").write_text(
        json.dumps(package, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
