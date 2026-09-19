#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[7]
HERE = Path(__file__).resolve().parent

TASK_PATH = "projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/tasks/TASK-APE-L1-ENUM-TYPESCRIPT.md"
WORK_PACK_PATH = "projects/domainspec-v2/development/architecture-pattern-enforcement/WORK-PACK.md"
MANIFEST_PATH = "projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/shared/SWU-MANIFEST.json"
CONTEXT_PATH = "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260805T233000Z-ts001a-readiness/task-session/context-pack.json"
SELECTION_PATH = "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260805T233000Z-ts001a-readiness/selection-receipt.json"
DEPENDENCY_PATH = "projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/receipts/SWU-APE-ENUM-TS-001.json"

TARGETS = [
    "projects/domainspec-v2/impl/architecture-conformance/typescript/runtime/enum/index.ts",
    "projects/domainspec-v2/impl/architecture-conformance/typescript/runtime-tests/enum/enum.test.ts",
    "projects/domainspec-v2/impl/architecture-conformance/typescript/runtime-tests/enum/tsconfig.json",
]


def artifact(path: str, authority_class: str = "private") -> dict[str, Any]:
    data = (ROOT / path).read_bytes()
    return {
        "path": path,
        "sha256": hashlib.sha256(data).hexdigest(),
        "size_bytes": len(data),
        "authority_class": authority_class,
    }


def output_ref(target: str) -> dict[str, Any]:
    staged = HERE / "staged" / target
    data = staged.read_bytes()
    return {
        "path": str(staged.relative_to(ROOT)),
        "sha256": hashlib.sha256(data).hexdigest(),
        "size_bytes": len(data),
    }


def canonical_digest(value: Any) -> str:
    encoded = json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


manifest = json.loads((ROOT / MANIFEST_PATH).read_text(encoding="utf-8"))
swu = next(item for item in manifest["swus"] if item["swu_id"] == "SWU-APE-ENUM-TS-001A")
contracts = swu["validation_contracts"]
selection = json.loads((ROOT / SELECTION_PATH).read_text(encoding="utf-8"))

package = {
    "schema_version": "1.0.0",
    "package_id": "ape-ts001a-provider-material-20260805T233000Z",
    "mutation_mode": "apply-approved",
    "mutation_state": "materialized",
    "lifecycle_owner": "projects/domainspec-v2",
    "authority_class": "private",
    "publication_class": "internal",
    "source_artifacts": [
        artifact(TASK_PATH),
        artifact(WORK_PACK_PATH),
        artifact(CONTEXT_PATH),
    ],
    "changes": [
        {
            "target_path": target,
            "operation": "create",
            "output_ref": output_ref(target),
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
            "artifact_ref": {
                key: value
                for key, value in artifact(DEPENDENCY_PATH).items()
                if key != "authority_class"
            },
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
    "validation_commands": [contract["command_id"] for contract in contracts],
    "plan_binding": {
        "task_id": "TASK-APE-L1-ENUM-TYPESCRIPT",
        "swu_id": "SWU-APE-ENUM-TS-001A",
        "plan_epoch_id": selection["planEpochId"],
        "unit_contract_digest": selection["unitContractDigest"],
        "selection_receipt_digest": artifact(SELECTION_PATH)["sha256"],
        "attempt_id": "task-session-ape-ts001a-20260805T233000Z",
        "validation_contract_digest": canonical_digest(contracts),
        "validation_contracts": contracts,
        "target_baselines": [
            {
                "path": target,
                "state": "absent",
                "sha256": None,
                "size_bytes": None,
            }
            for target in TARGETS
        ],
    },
}

(HERE / "material-package.json").write_text(
    json.dumps(package, indent=2, ensure_ascii=False) + "\n",
    encoding="utf-8",
)
