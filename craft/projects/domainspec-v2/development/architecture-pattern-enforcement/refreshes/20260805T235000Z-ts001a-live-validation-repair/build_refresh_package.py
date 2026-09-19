#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[6]
HERE = Path(__file__).resolve().parent
MATERIAL = HERE / "material"

TARGETS = [
    "projects/domainspec-v2/development/architecture-pattern-enforcement/WORK-PACK.md",
    "projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/tasks/TASK-APE-L1-ENUM-TYPESCRIPT.md",
    "projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/shared/SWU-MANIFEST.json",
]
DEPENDENCY = "projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/receipts/SWU-APE-ENUM-TS-001.json"
SOURCE_PATHS = [
    "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260805T233000Z-ts001a-readiness/task-session/governance-run/commit-receipt.json",
    "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260805T233000Z-ts001a-readiness/task-session/governance-run/terminal-executor-receipt.json",
    "projects/domainspec-v2/impl/architecture-conformance/typescript/runtime/enum/index.ts",
    "projects/domainspec-v2/impl/architecture-conformance/typescript/runtime-tests/enum/enum.test.ts",
    "projects/domainspec-v2/impl/architecture-conformance/typescript/runtime-tests/enum/tsconfig.json",
]
VALIDATION_COMMANDS = [
    "npm --prefix projects/domainspec-v2/impl exec -- vitest --root projects/domainspec-v2/impl run architecture-conformance/typescript/runtime-tests/enum/enum.test.ts",
    "npm --prefix projects/domainspec-v2/impl exec -- tsc --noEmit -p projects/domainspec-v2/impl/architecture-conformance/typescript/runtime-tests/enum/tsconfig.json",
    "npm --prefix projects/domainspec-v2/impl run typecheck -- --pretty false",
    "python3 -m json.tool projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/shared/SWU-MANIFEST.json",
    "git diff --check -- projects/domainspec-v2/development/architecture-pattern-enforcement/WORK-PACK.md projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/tasks/TASK-APE-L1-ENUM-TYPESCRIPT.md projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/shared/SWU-MANIFEST.json",
]


def ref(path: str, authority_class: bool = False) -> dict[str, Any]:
    data = (ROOT / path).read_bytes()
    result: dict[str, Any] = {
        "path": path,
        "sha256": hashlib.sha256(data).hexdigest(),
        "size_bytes": len(data),
    }
    if authority_class:
        result["authority_class"] = "private"
    return result


def staged_ref(target: str) -> dict[str, Any]:
    path = MATERIAL / "staged" / target
    data = path.read_bytes()
    return {
        "path": path.relative_to(ROOT).as_posix(),
        "sha256": hashlib.sha256(data).hexdigest(),
        "size_bytes": len(data),
    }


def write(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


parser = argparse.ArgumentParser()
parser.add_argument("--handoff", action="store_true")
args = parser.parse_args()

if not args.handoff:
    package = {
        "schema_version": "1.0.0",
        "package_id": "dsv2-ape-ts001a-live-validation-repair-20260805T235000Z",
        "mutation_mode": "apply-approved",
        "mutation_state": "materialized",
        "lifecycle_owner": "projects/domainspec-v2",
        "authority_class": "private",
        "publication_class": "internal",
        "source_artifacts": [ref(path, authority_class=True) for path in SOURCE_PATHS],
        "changes": [
            {
                "target_path": target,
                "operation": "update",
                "output_ref": staged_ref(target),
            }
            for target in TARGETS
        ],
        "target_inventory": [
            {
                "target_path": target,
                "lifecycle_owner": "projects/domainspec-v2",
                "authority_class": "private",
                "publication_class": "internal",
                "dependency_ids": ["SWU-APE-ENUM-TS-001"],
            }
            for target in TARGETS
        ],
        "dependencies": [
            {
                "dependency_id": "SWU-APE-ENUM-TS-001",
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
        "validation_commands": VALIDATION_COMMANDS,
    }
    write(MATERIAL / "MATERIAL-PACKAGE.json", package)
else:
    receipt = json.loads((MATERIAL / "MATERIAL-RECEIPT.json").read_text(encoding="utf-8"))
    request = {
        "activationSource": "direct-user",
        "mutationMode": "apply-approved",
        "authoredPhaseStatus": "pass",
        "requestedHandoff": "ready",
        "expectedPackageId": receipt["packageId"],
        "expectedPackageDigest": receipt["packageDigest"],
        "materialReceipt": receipt,
    }
    write(MATERIAL / "REFRESH-HANDOFF-REQUEST.json", request)
