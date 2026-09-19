#!/usr/bin/env python3
"""Build the exact Invoke material package for SWU-FSTG-002."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


PACKAGE_ID = "dsv2-fstg-swu-002-20260723T191821Z"
LIFECYCLE_OWNER = "projects/domainspec-v2"


def find_repo_root() -> Path:
    for candidate in Path(__file__).resolve().parents:
        if (candidate / ".git").exists():
            return candidate
    raise RuntimeError("repository root not found")


REPO_ROOT = find_repo_root()
MATERIAL_ROOT = Path(__file__).resolve().parent
STAGED_PREFIX = MATERIAL_ROOT.relative_to(REPO_ROOT) / "staged"
OUTPUT = MATERIAL_ROOT / "MATERIAL-PACKAGE.json"

WORK_PACK = (
    "projects/domainspec-v2/development/"
    "financial-settlement-executable-test-generation/WORK-PACK.md"
)
PLAN = (
    "projects/domainspec-v2/development/"
    "financial-settlement-executable-test-generation/PLAN.md"
)
CONTEXT_PACK = (
    "projects/domainspec-v2/development/"
    "financial-settlement-executable-test-generation/session-evidence/"
    "SWU-FSTG-002/20260723T191821Z-collecting-instance-validation/"
    "context-pack.json"
)
DEPENDENCY_RECEIPT = (
    "projects/domainspec-v2/development/"
    "financial-settlement-executable-test-generation/session-evidence/"
    "SWU-FSTG-001/20260723T181831Z-declared-subset-apply/"
    "task-session-closeout-join-receipt.json"
)
TARGETS = [
    (
        "projects/domainspec-v2/impl/test-derivation-engine/"
        "src/bte/development-engine.test.ts"
    ),
    (
        "projects/domainspec-v2/impl/test-derivation-engine/"
        "src/bte/development-engine.ts"
    ),
    (
        "projects/domainspec-v2/impl/test-derivation-engine/"
        "src/bte/proof-engine.test.ts"
    ),
    (
        "projects/domainspec-v2/impl/test-derivation-engine/"
        "src/bte/proof-engine.ts"
    ),
]
VALIDATION_COMMANDS = [
    (
        "npx vitest run projects/domainspec-v2/impl/"
        "test-derivation-engine/src/bte/development-engine.test.ts "
        "projects/domainspec-v2/impl/test-derivation-engine/"
        "src/bte/proof-engine.test.ts"
    ),
    "npm --prefix projects/domainspec-v2/impl run verify:bte",
]


def sha256(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def exact_ref(path: str, root: Path = REPO_ROOT) -> dict[str, object]:
    content = (root / path).read_bytes()
    return {
        "path": path,
        "sha256": sha256(content),
        "size_bytes": len(content),
    }


def main() -> None:
    changes = []
    inventory = []
    for target in TARGETS:
        staged_path = str(STAGED_PREFIX / target)
        changes.append(
            {
                "target_path": target,
                "operation": "update",
                "output_ref": exact_ref(staged_path),
            }
        )
        inventory.append(
            {
                "target_path": target,
                "lifecycle_owner": LIFECYCLE_OWNER,
                "authority_class": "private",
                "publication_class": "internal",
                "dependency_ids": ["SWU-FSTG-001"],
            }
        )

    package = {
        "schema_version": "1.0.0",
        "package_id": PACKAGE_ID,
        "mutation_mode": "apply-approved",
        "mutation_state": "materialized",
        "lifecycle_owner": LIFECYCLE_OWNER,
        "authority_class": "private",
        "publication_class": "internal",
        "source_artifacts": [
            {**exact_ref(PLAN), "authority_class": "private"},
            {**exact_ref(WORK_PACK), "authority_class": "private"},
            {**exact_ref(CONTEXT_PACK), "authority_class": "private"},
        ],
        "changes": changes,
        "target_inventory": inventory,
        "dependencies": [
            {
                "dependency_id": "SWU-FSTG-001",
                "artifact_ref": exact_ref(DEPENDENCY_RECEIPT),
            }
        ],
        "mirror_groups": [],
        "approval": {
            "class": "explicit-apply",
            "owner": LIFECYCLE_OWNER,
            "scope_paths": TARGETS,
            "authority_classes": ["private"],
            "publication_classes": ["internal"],
        },
        "validation_commands": VALIDATION_COMMANDS,
    }
    OUTPUT.write_text(
        json.dumps(package, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
