#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[8]
HERE = Path(__file__).resolve().parent
BASE = "projects/domainspec-v2/development/architecture-pattern-enforcement/goal-runs/20260806T010816Z-whole-work-pack/rounds/003-ts001b-task-session"
RUN_ID = "task-session-ape-ts001b-goal-20260806T010816Z"
RUN_DIR = f"{BASE}/governance-run"
WORK_PACK = "projects/domainspec-v2/development/architecture-pattern-enforcement/WORK-PACK.md"
TASK = "projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/tasks/TASK-APE-L1-ENUM-TYPESCRIPT.md"
SELECTION = "projects/domainspec-v2/development/architecture-pattern-enforcement/goal-runs/20260806T010816Z-whole-work-pack/rounds/002-ts001b-readiness/selection-receipt.json"
ADMISSION = f"{BASE}/mutation-admission-receipt.json"
TERMINAL = "projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/receipts/SWU-APE-ENUM-TS-001B.json"
EXECUTOR_SCHEMA = "arcanum/arcana/task-session/schemas/executor-receipt.schema.json"

TARGETS = [
    "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/typescript-strict.profile.json",
    "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/examples/enum/profiles/check-profile-resolution.mjs",
    "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/examples/enum/profiles/activation-cases.json",
    "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/examples/enum/profiles/activation-evaluations.expected.json",
]
DECLARED_OUTPUTS = [f"{BASE}/governance-staged/{target}" for target in TARGETS]


def exact_ref(path: str) -> dict[str, Any]:
    data = (ROOT / path).read_bytes()
    return {"path": path, "sha256": hashlib.sha256(data).hexdigest(), "size_bytes": len(data)}


def write(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


executor_config = {
    "schema_version": "task-session.executor-launch-config.v1",
    "argv": [
        "python3",
        f"{BASE}/executor.py",
        "--repo-root",
        ".",
        "--run-dir",
        RUN_DIR,
    ],
    "cwd": ".",
    "environment_names": ["PATH"],
    "timeout_seconds": 120,
    "max_output_bytes": 1048576,
    "owner_identity": {
        "capability": "projects/domainspec-v2",
        "subject": "ape-enum-typescript-profile-activation-executor",
    },
    "expected_receipt_path": f"{RUN_DIR}/terminal-executor-receipt.json",
    "expected_receipt_schema_ref": exact_ref(EXECUTOR_SCHEMA),
}
write(HERE / "executor-config.json", executor_config)

output_only_admission = {
    "schemaVersion": "1.2.0",
    "executionMode": "routed-mutation",
    "taskId": "TASK-APE-L1-ENUM-TYPESCRIPT",
    "swuId": "SWU-APE-ENUM-TS-001B",
    "materialWrites": [],
    "executionOutputs": DECLARED_OUTPUTS,
    "allowedWrites": DECLARED_OUTPUTS,
    "writeProfile": "execution-output-only",
    "admissionVerdict": "admit",
    "mutationReady": True,
    "reasons": [],
}
write(HERE / "output-only-admission.json", output_only_admission)

admission = json.loads((ROOT / ADMISSION).read_text(encoding="utf-8"))
material = json.loads((HERE / "material-package.json").read_text(encoding="utf-8"))
binding = material["plan_binding"]
admission_ref = exact_ref(ADMISSION)

control_paths = [
    f"{BASE}/governance-evaluation.json",
    f"{BASE}/closeout-preflight.json",
    f"{BASE}/executor-config.json",
    ADMISSION,
    SELECTION,
]
request = {
    "schema_version": "task-session.governance-run-request.v1",
    "entry_profile": "work-pack-fast-entry",
    "admission_profile": "plan-once-selected-unit",
    "request_id": "ape-ts001b-task-session",
    "run_id": RUN_ID,
    "work_pack_ref": exact_ref(WORK_PACK),
    "swu_ref": exact_ref(TASK),
    "task_id": "TASK-APE-L1-ENUM-TYPESCRIPT",
    "swu_id": "SWU-APE-ENUM-TS-001B",
    "control_refs": [exact_ref(path) for path in control_paths],
    "fast_execution_entry": {
        "request_ref": exact_ref(f"{BASE}/fast-entry-request.json"),
        "receipt_ref": exact_ref(f"{BASE}/fast-entry-receipt.json"),
    },
    "plan_admission": {
        "plan_epoch_id": binding["plan_epoch_id"],
        "unit_contract_digest": binding["unit_contract_digest"],
        "attempt_id": RUN_ID,
        "selection_receipt_ref": exact_ref(SELECTION),
        "mutation_admission_receipt_ref": admission_ref,
        "admission_token": admission["admissionToken"],
        "target_baseline_digest": admission["targetBaselineDigest"],
        "validation_contract_digest": admission["validationContractDigest"],
        "consumption_ledger_path": (
            f"{BASE}/.admission-consumption/{admission_ref['sha256']}.json"
        ),
    },
    "execution_contract": {
        "allowed_writes": TARGETS,
        "declared_outputs": DECLARED_OUTPUTS,
        "validation_commands": binding["validation_contracts"],
        "timeout_seconds": 120,
        "max_output_bytes": 1048576,
    },
    "owner_identity": {
        "capability": "task-session",
        "subject": "ape-enum-typescript-profile-activation",
    },
    "idempotency_key": "ape.enum.ts001b.plan-once.20260806",
    "closeout_contract": {
        "required_owner_capabilities": ["continuation-router", "invoke"],
        "continuation_policy": "emit-cursor-never-execute-successor",
        "terminal_receipt_path": TERMINAL,
    },
}
write(HERE / "governance-request.json", request)
