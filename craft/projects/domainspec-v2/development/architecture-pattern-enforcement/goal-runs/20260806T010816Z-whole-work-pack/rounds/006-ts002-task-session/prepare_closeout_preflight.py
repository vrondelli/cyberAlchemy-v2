#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import subprocess
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[8]
HERE = Path(__file__).resolve().parent
POLICY_PATH = "arcanum/arcana/task-session/decision-validation-policy.json"
WORK_PACK_PATH = "projects/domainspec-v2/development/architecture-pattern-enforcement/WORK-PACK.md"
TASK_PATH = "projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/tasks/TASK-APE-L1-ENUM-TYPESCRIPT.md"
MANIFEST_PATH = "projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/shared/SWU-MANIFEST.json"
RECEIPT_PATH = "projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/receipts/SWU-APE-ENUM-TS-002.json"
GOVERNANCE_OUTPUT = "projects/domainspec-v2/development/architecture-pattern-enforcement/goal-runs/20260806T010816Z-whole-work-pack/rounds/006-ts002-task-session/governance-evaluation.json"


def digest(path: str) -> str:
    return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()


def exact_ref(path: str) -> dict[str, Any]:
    data = (ROOT / path).read_bytes()
    return {"path": path, "sha256": hashlib.sha256(data).hexdigest(), "size_bytes": len(data)}


def write(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


validation_commands = [
    "validate-typescript-enum-adapter-runtime",
    "validate-typescript-enum-adapter-types",
    "validate-typescript-parent-typecheck-after-adapter",
]
declared_inventory = [WORK_PACK_PATH, TASK_PATH, MANIFEST_PATH, RECEIPT_PATH]
baseline = {
    WORK_PACK_PATH: digest(WORK_PACK_PATH),
    TASK_PATH: digest(TASK_PATH),
    MANIFEST_PATH: digest(MANIFEST_PATH),
    RECEIPT_PATH: "absent",
}

preflight = {
    "schema_version": "task-session.closeout-preflight.v1",
    "run_id": "task-session-ape-ts002-goal-20260806T014900Z",
    "task_id": "TASK-APE-L1-ENUM-TYPESCRIPT",
    "swu_id": "SWU-APE-ENUM-TS-002",
    "sync_expected": True,
    "terminal_source_receipt_contract": {
        "schema_version": "ape.swu-receipt.v1",
        "expected_path": RECEIPT_PATH,
        "required_result": "pass",
    },
    "declared_target_inventory": declared_inventory,
    "baseline_state": baseline,
    "allowed_delta_classes": ["evidence_added", "status_changed", "route_changed"],
    "validation_commands": validation_commands,
    "expected_owner_receipt": {
        "route": "invoke:refresh:apply-approved",
        "owner": "projects/domainspec-v2",
        "accepted_results": ["pass", "no-op"],
    },
    "successor_policy": {
        "requested": False,
        "declared": True,
        "candidate": "SWU-APE-ENUM-TS-003",
        "candidate_count": 1,
        "dependency_ready_only_after_current_pass": True,
        "execute_successor": False,
    },
    "result": "PROCEED",
    "authority_ceiling": "preflight-only",
}
write(HERE / "closeout-preflight.json", preflight)

governance_request = {
    "schema_version": "task-session.governance-evaluation-request.v1",
    "request_id": "ape-ts002-closeout-preflight-evaluation",
    "evaluation_kind": "closeout-preflight",
    "policy_ref": exact_ref(POLICY_PATH),
    "input": {
        "sync_expected": True,
        "terminal_source_receipt_contract": {
            "schema_version": "ape.swu-receipt.v1",
            "expected_path": RECEIPT_PATH,
        },
        "declared_target_inventory": declared_inventory,
        "baseline_state": {
            "work_pack": baseline[WORK_PACK_PATH],
            "task_contract": baseline[TASK_PATH],
            "swu_manifest": baseline[MANIFEST_PATH],
            "terminal_receipt": "absent",
        },
        "allowed_delta_classes": preflight["allowed_delta_classes"],
        "validation_commands": validation_commands,
        "expected_owner_receipt": preflight["expected_owner_receipt"],
        "successor_selection": {
            "requested": False,
            "declared": True,
            "dependency_ready": False,
            "candidate_count": 1,
        },
    },
    "output_path": GOVERNANCE_OUTPUT,
}
request_path = HERE / "governance-evaluation-request.json"
write(request_path, governance_request)
subprocess.run(
    [
        "python3",
        str(ROOT / ".agents/skills/task-session/scripts/evaluate-governance.py"),
        "--request",
        str(request_path),
        "--policy",
        POLICY_PATH,
        "--request-schema",
        str(ROOT / "arcanum/arcana/task-session/schemas/governance-evaluation-request.schema.json"),
        "--receipt-schema",
        str(ROOT / "arcanum/arcana/task-session/schemas/governance-evaluation-receipt.schema.json"),
    ],
    cwd=ROOT,
    shell=False,
    check=True,
)

result = json.loads((ROOT / GOVERNANCE_OUTPUT).read_text(encoding="utf-8"))
if result["outcome"] != "PROCEED":
    raise SystemExit("TS002 closeout preflight did not proceed")
print("PASS: TS002 closeout preflight governance evaluation")
