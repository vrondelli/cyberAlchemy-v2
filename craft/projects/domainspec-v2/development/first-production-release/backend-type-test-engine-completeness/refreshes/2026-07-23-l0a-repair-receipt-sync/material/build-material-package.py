#!/usr/bin/env python3
"""Build the exact Invoke material package for L0A repair receipt sync."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[8]
REFRESH_ROOT = Path(__file__).resolve().parent.parent
STAGED_PREFIX = REFRESH_ROOT.relative_to(REPO_ROOT) / "material" / "staged"
OUTPUT = Path(__file__).resolve().parent / "MATERIAL-PACKAGE.json"

PACKAGE_ID = "dsv2-bte-l0a-repair-receipt-sync-apply-20260723"
LIFECYCLE_OWNER = "private DomainSpec v2 BTE planning and Craft owner via invoke:refresh"

TARGETS = [
    "projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/PLAN.md",
    "projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/IMPLEMENTATION-LAYERING.md",
    "projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/WORK-PACK.md",
    "projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/EXECUTION-PACK.md",
    "projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/EXECUTION-DISPATCH.json",
    "projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/DISTILL-VALIDATION.md",
    "projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/work-pack/shared/CONTEXT.md",
    "projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/work-pack/shared/DECISIONS.md",
    "projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/work-pack/shared/GAPS.md",
    "projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/work-pack/shared/TRACEABILITY.md",
    "projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/work-pack/tasks/TASK-BTE-L0-PROOF-PRIMITIVES.md",
    "projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/work-pack/waves/W1-L0-PROOF-PRIMITIVES.md",
    "projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/work-pack/waves/W1B-L0-VALIDATION-EXECUTION.md",
    "projects/domainspec-v2/.craft/ledger.yml",
    "projects/domainspec-v2/CRAFT.md",
]

PROPOSAL = (
    "projects/domainspec-v2/development/first-production-release/"
    "backend-type-test-engine-completeness/refreshes/"
    "2026-07-23-l0a-repair-receipt-sync/REFRESH-PATCH-PROPOSAL.md"
)

DEPENDENCIES = {
    "approved-proposal": PROPOSAL,
    "l0a-repair-execution-receipt": (
        "projects/domainspec-v2/development/first-production-release/"
        "backend-type-test-engine-completeness/work-pack/session-evidence/"
        "SWU-BTE-L0A-REPAIR-001/20260723T100352Z-exact-byte-repair/execution-receipt.json"
    ),
    "l0a-repair-continuation-handoff": (
        "projects/domainspec-v2/development/first-production-release/"
        "backend-type-test-engine-completeness/work-pack/session-evidence/"
        "SWU-BTE-L0A-REPAIR-001/20260723T100352Z-exact-byte-repair/continuation-handoff.json"
    ),
    "l0a-publication-receipt": (
        "projects/domainspec-v2/development/first-production-release/"
        "backend-type-test-engine-completeness/runs/20260723T020759Z/l0a/"
        "contract-publication-receipt.json"
    ),
    "l0a-write-manifest": (
        "projects/domainspec-v2/development/first-production-release/"
        "backend-type-test-engine-completeness/runs/20260723T020759Z/l0a/"
        "output-write-manifest.json"
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
            "python3 .agents/skills/dispatch-spec/scripts/validate-dispatch.py projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/EXECUTION-DISPATCH.json",
            "python3 projects/domainspec-v2/development/first-production-release/visibility/tools/build-roadmap.py --check",
            ".agents/skills/inventory/scripts/validate-index-json.sh .arcanum/inventory/index.json",
            "git -c core.whitespace=-blank-at-eof diff --check",
        ],
    }
    OUTPUT.write_text(
        json.dumps(document, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
