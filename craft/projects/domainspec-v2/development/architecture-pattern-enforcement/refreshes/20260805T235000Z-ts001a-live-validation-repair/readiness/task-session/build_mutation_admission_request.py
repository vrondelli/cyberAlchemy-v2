#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[8]
HERE = Path(__file__).resolve().parent

TASK_PATH = "projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/tasks/TASK-APE-L1-ENUM-TYPESCRIPT.md"
WORK_PACK_PATH = "projects/domainspec-v2/development/architecture-pattern-enforcement/WORK-PACK.md"
CONTEXT_PATH = "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260805T235000Z-ts001a-live-validation-repair/readiness/task-session/context-pack.json"
DEPENDENCY_PATH = "projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/receipts/SWU-APE-ENUM-TS-001.json"
MATERIAL_PATH = "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260805T235000Z-ts001a-live-validation-repair/readiness/task-session/material-package.json"
MATERIAL_RECEIPT_PATH = "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260805T235000Z-ts001a-live-validation-repair/readiness/task-session/material-receipt.json"
PRODUCER_SCHEMA_PATH = "arcanum/spells/invoke/schemas/material-package-receipt.schema.json"
PLAN_MANIFEST_PATH = "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260805T235000Z-ts001a-live-validation-repair/readiness/run-1/plan-semantic-manifest.json"
PLAN_MANIFEST_SCHEMA_PATH = "arcanum/spells/work-pack-readiness-audit/schemas/plan-semantic-manifest.schema.json"
SELECTION_PATH = "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260805T235000Z-ts001a-live-validation-repair/readiness/selection-receipt.json"
SELECTION_SCHEMA_PATH = "arcanum/spells/work-pack-readiness-audit/schemas/selection-receipt.schema.json"

TARGETS = [
    "projects/domainspec-v2/impl/architecture-conformance/typescript/runtime/enum/index.ts",
    "projects/domainspec-v2/impl/architecture-conformance/typescript/runtime-tests/enum/enum.test.ts",
    "projects/domainspec-v2/impl/architecture-conformance/typescript/runtime-tests/enum/tsconfig.json",
]
RECEIPT_TARGET = "projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/receipts/SWU-APE-ENUM-TS-001A.json"


def exact_ref(path: str) -> dict[str, Any]:
    data = (ROOT / path).read_bytes()
    return {
        "path": path,
        "sha256": hashlib.sha256(data).hexdigest(),
        "sizeBytes": len(data),
    }


def control_ref(path: str, role: str) -> dict[str, Any]:
    return {
        **exact_ref(path),
        "role": role,
        "authorityClass": "private",
    }


material = json.loads((ROOT / MATERIAL_PATH).read_text(encoding="utf-8"))
binding = material["plan_binding"]

request = {
    "schemaVersion": "1.2.0",
    "admissionProfile": "plan-once-selected-unit",
    "executionMode": "routed-mutation",
    "taskId": "TASK-APE-L1-ENUM-TYPESCRIPT",
    "swuId": "SWU-APE-ENUM-TS-001A",
    "controlArtifacts": [
        control_ref(TASK_PATH, "task-contract"),
        control_ref(WORK_PACK_PATH, "work-pack"),
        control_ref(CONTEXT_PATH, "context-pack"),
    ],
    "dependencyFrontier": [
        {
            "dependencyId": "SWU-APE-ENUM-TS-001",
            "artifactRef": exact_ref(DEPENDENCY_PATH),
        }
    ],
    "materialPackage": exact_ref(MATERIAL_PATH),
    "materialReceipt": exact_ref(MATERIAL_RECEIPT_PATH),
    "producerReceiptSchema": exact_ref(PRODUCER_SCHEMA_PATH),
    "materialWrites": TARGETS,
    "executionOutputs": [RECEIPT_TARGET],
    "allowedWrites": [*TARGETS, RECEIPT_TARGET],
    "validationCommands": [
        contract["command_id"] for contract in binding["validation_contracts"]
    ],
    "lifecycleOwner": "projects/domainspec-v2",
    "authorityClass": "private",
    "publicationClass": "internal",
    "planAdmission": {
        "planManifest": exact_ref(PLAN_MANIFEST_PATH),
        "planManifestSchema": exact_ref(PLAN_MANIFEST_SCHEMA_PATH),
        "selectionReceipt": exact_ref(SELECTION_PATH),
        "selectionReceiptSchema": exact_ref(SELECTION_SCHEMA_PATH),
        "planEpochId": binding["plan_epoch_id"],
        "unitContractDigest": binding["unit_contract_digest"],
        "attemptId": binding["attempt_id"],
        "targetBaselines": [
            {
                "path": baseline["path"],
                "state": baseline["state"],
                "sha256": baseline["sha256"],
                "sizeBytes": baseline["size_bytes"],
            }
            for baseline in binding["target_baselines"]
        ],
        "structuredValidationContracts": binding["validation_contracts"],
        "validationContractDigest": binding["validation_contract_digest"],
    },
}

(HERE / "mutation-admission-request.json").write_text(
    json.dumps(request, indent=2, ensure_ascii=False) + "\n",
    encoding="utf-8",
)
