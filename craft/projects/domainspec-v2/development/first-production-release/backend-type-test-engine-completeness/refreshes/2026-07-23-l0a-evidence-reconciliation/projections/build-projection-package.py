#!/usr/bin/env python3
"""Build the exact Invoke package for BTE Inventory and roadmap read models."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[8]
REFRESH_ROOT = Path(__file__).resolve().parent.parent
STAGED_PREFIX = REFRESH_ROOT.relative_to(REPO_ROOT) / "projections" / "staged-repo"
OUTPUT = Path(__file__).resolve().parent / "PROJECTION-MATERIAL-PACKAGE.json"

PACKAGE_ID = "dsv2-bte-l0a-evidence-reconciliation-projections-20260723"
LIFECYCLE_OWNER = "private DomainSpec v2 BTE read-model owner via invoke:refresh"

TARGETS = [
    ".arcanum/inventory/entries/domainspec-v2-bte-full-work-refresh-applied-result.md",
    ".arcanum/inventory/index.json",
    ".arcanum/inventory/index.md",
    "projects/domainspec-v2/development/first-production-release/visibility/roadmap-data.json",
    "projects/domainspec-v2/development/first-production-release/visibility/roadmap.html",
]

PROPOSAL = (
    "projects/domainspec-v2/development/first-production-release/"
    "backend-type-test-engine-completeness/refreshes/"
    "2026-07-23-l0a-evidence-reconciliation/REFRESH-PATCH-PROPOSAL.md"
)

DEPENDENCIES = {
    "approved-proposal": PROPOSAL,
    "authority-material-receipt": (
        "projects/domainspec-v2/development/first-production-release/"
        "backend-type-test-engine-completeness/refreshes/"
        "2026-07-23-l0a-evidence-reconciliation/material/MATERIAL-RECEIPT.json"
    ),
    "applied-craft-ledger": "projects/domainspec-v2/.craft/ledger.yml",
    "concurrent-reasoning-inventory-entry": (
        ".arcanum/inventory/entries/"
        "agent-reasoning-engine-contract-strategy-result-synthesis.md"
    ),
    "concurrent-orchestrator-inventory-entry": (
        ".arcanum/inventory/entries/"
        "cyberalchemy-orchestrator-reasoning-engine-purpose-strategy-result-synthesis.md"
    ),
}


def exact_ref(path: str) -> dict[str, object]:
    content = (REPO_ROOT / path).read_bytes()
    return {
        "path": path,
        "sha256": hashlib.sha256(content).hexdigest(),
        "size_bytes": len(content),
    }


def main() -> None:
    dependency_ids = list(DEPENDENCIES)
    staged_paths = {
        target: (STAGED_PREFIX / target).as_posix() for target in TARGETS
    }
    document = {
        "schema_version": "1.0.0",
        "package_id": PACKAGE_ID,
        "mutation_mode": "apply-approved",
        "mutation_state": "materialized",
        "lifecycle_owner": LIFECYCLE_OWNER,
        "authority_class": "private",
        "publication_class": "private",
        "source_artifacts": [
            {**exact_ref(PROPOSAL), "authority_class": "private"},
            {**exact_ref("projects/domainspec-v2/.craft/ledger.yml"), "authority_class": "private"},
            *[
                {**exact_ref(target), "authority_class": "private"}
                for target in TARGETS
            ],
        ],
        "changes": [
            {
                "target_path": target,
                "operation": "update",
                "output_ref": exact_ref(staged_paths[target]),
            }
            for target in TARGETS
        ],
        "target_inventory": [
            {
                "target_path": target,
                "lifecycle_owner": LIFECYCLE_OWNER,
                "authority_class": "private",
                "publication_class": "private",
                "dependency_ids": dependency_ids,
            }
            for target in TARGETS
        ],
        "dependencies": [
            {
                "dependency_id": dependency_id,
                "artifact_ref": exact_ref(path),
            }
            for dependency_id, path in DEPENDENCIES.items()
        ],
        "mirror_groups": [],
        "approval": {
            "class": "explicit-apply",
            "owner": LIFECYCLE_OWNER,
            "scope_paths": TARGETS,
            "authority_classes": ["private"],
            "publication_classes": ["private"],
        },
        "validation_commands": [
            ".agents/skills/inventory/scripts/validate-index-json.sh .arcanum/inventory/index.json",
            "python3 projects/domainspec-v2/development/first-production-release/visibility/tools/build-roadmap.py --check",
            "git diff --check",
        ],
    }
    OUTPUT.write_text(
        json.dumps(document, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
