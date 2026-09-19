#!/usr/bin/env python3
"""Build the exact Invoke material package for the L0 RED payload-scope refresh."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[8]
REFRESH_ROOT = Path(__file__).resolve().parent.parent
STAGED_PREFIX = REFRESH_ROOT.relative_to(REPO_ROOT) / "material" / "staged"
OUTPUT = Path(__file__).resolve().parent / "MATERIAL-PACKAGE.json"

PACKAGE_ID = "dsv2-bte-l0-red-payload-scope-apply-20260804"
LIFECYCLE_OWNER = "private DomainSpec v2 BTE planning owner via invoke:refresh"
BASE = "projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness"

TARGETS = [
    f"{BASE}/WORK-PACK.md",
    f"{BASE}/EXECUTION-PACK.md",
    f"{BASE}/IMPLEMENTATION-LAYERING.md",
    f"{BASE}/transport-report.json",
    f"{BASE}/work-pack/shared/DECISIONS.md",
    f"{BASE}/work-pack/shared/GAPS.md",
    f"{BASE}/work-pack/shared/TRACEABILITY.md",
    f"{BASE}/work-pack/tasks/TASK-BTE-L0-PROOF-PRIMITIVES.md",
    f"{BASE}/work-pack/waves/W1B-L0-VALIDATION-EXECUTION.md",
]

PROPOSAL = f"{BASE}/refreshes/2026-08-04-l0-red-fixture-payload-scope/REFRESH-PATCH-PROPOSAL.md"
DEPENDENCIES = {
    "approved-proposal": PROPOSAL,
    "l0a-publication-receipt": f"{BASE}/runs/20260723T020759Z/l0a/contract-publication-receipt.json",
    "l0a-write-manifest": f"{BASE}/runs/20260723T020759Z/l0a/output-write-manifest.json",
    "red-manifest-contract": "projects/domainspec-v2/impl/test-derivation-engine/src/bte/contracts/red-fixture-manifest.v1.schema.json",
    "artifact-handle-contract": "projects/domainspec-v2/impl/test-derivation-engine/src/bte/contracts/artifact-handle.v1.schema.json",
    "closed-diagnostic-registry": "projects/domainspec-v2/impl/test-derivation-engine/src/bte/validation/diagnostics.ts",
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
    staged_paths = {target: (STAGED_PREFIX / target).as_posix() for target in TARGETS}
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
            *[{**exact_ref(target), "authority_class": "private"} for target in TARGETS],
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
            {"dependency_id": dependency_id, "artifact_ref": exact_ref(path)}
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
            f"python3 .agents/skills/dispatch-spec/scripts/validate-dispatch.py {BASE}/refreshes/2026-08-04-l0-red-fixture-payload-scope/REFRESH-DISPATCH.json",
            "npm --prefix projects/domainspec-v2/impl run verify:bte:contract-publication",
            f"jq empty {BASE}/transport-report.json",
            "git -c core.whitespace=-blank-at-eof diff --check",
        ],
    }
    OUTPUT.write_text(json.dumps(document, indent=2, sort_keys=True) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
