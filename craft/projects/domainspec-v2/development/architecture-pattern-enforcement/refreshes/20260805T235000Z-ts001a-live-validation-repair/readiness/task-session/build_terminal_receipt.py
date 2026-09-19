#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[8]
HERE = Path(__file__).resolve().parent
BASE = "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260805T235000Z-ts001a-live-validation-repair/readiness/task-session"
REPAIR_BASE = "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260805T235000Z-ts001a-live-validation-repair"
RECEIPT_TARGET = "projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/receipts/SWU-APE-ENUM-TS-001A.json"

TARGETS = [
    "projects/domainspec-v2/impl/architecture-conformance/typescript/runtime/enum/index.ts",
    "projects/domainspec-v2/impl/architecture-conformance/typescript/runtime-tests/enum/enum.test.ts",
    "projects/domainspec-v2/impl/architecture-conformance/typescript/runtime-tests/enum/tsconfig.json",
]


def exact_ref(path: str, selector: str | None = None) -> dict[str, Any]:
    data = (ROOT / path).read_bytes()
    result: dict[str, Any] = {
        "path": path,
        "sha256": hashlib.sha256(data).hexdigest(),
        "size_bytes": len(data),
    }
    if selector is not None:
        result["selector"] = selector
    return result


selection_path = f"{REPAIR_BASE}/readiness/selection-receipt.json"
admission_path = f"{BASE}/mutation-admission-receipt.json"
selection = json.loads((ROOT / selection_path).read_text(encoding="utf-8"))
admission = json.loads((ROOT / admission_path).read_text(encoding="utf-8"))
admission_ref = exact_ref(admission_path)
ledger_path = f"{BASE}/.admission-consumption/{admission_ref['sha256']}.json"

post_states = [exact_ref(target) for target in TARGETS]
receipt = {
    "schema_version": "ape.swu-receipt.v1",
    "swu_id": "SWU-APE-ENUM-TS-001A",
    "task_id": "TASK-APE-L1-ENUM-TYPESCRIPT",
    "wave": "W1",
    "layer": "L1",
    "result": "pass",
    "receipt_kind": "local-fallback",
    "capability_ref": ".agents/skills/task-session",
    "owner": "TypeScript runtime owner via Task Session",
    "executor": "ape-enum-typescript-runtime-provider-executor",
    "attempt_id": "task-session-ape-ts001a-validation-repair-20260805T235000Z",
    "started_at": "2026-08-05T23:30:00Z",
    "completed_at": "2026-08-05T23:38:20Z",
    "immutable_inputs": [
        exact_ref("projects/domainspec-v2/development/architecture-pattern-enforcement/WORK-PACK.md"),
        exact_ref(
            "projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/tasks/TASK-APE-L1-ENUM-TYPESCRIPT.md",
            "SWU-APE-ENUM-TS-001A",
        ),
        exact_ref(
            "projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/shared/SWU-MANIFEST.json",
            "/swus/7",
        ),
        exact_ref(
            "projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/decisions/typescript-representation.json",
            "/selected_protocol",
        ),
        exact_ref(
            "projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/receipts/SWU-APE-ENUM-TS-001.json",
            "/continuation",
        ),
        exact_ref(selection_path),
        exact_ref(f"{BASE}/context-pack.json"),
        admission_ref,
        exact_ref(f"{REPAIR_BASE}/FAILED-ATTEMPT-EVIDENCE.json"),
    ],
    "target_inventory": [
        {
            "path": target,
            "initial_unit_baseline": {
                "state": "absent",
                "sha256": None,
                "size_bytes": None,
            },
            "repair_attempt_baseline": {
                "state": "present",
                "sha256": post["sha256"],
                "size_bytes": post["size_bytes"],
            },
            "post_state": {
                "state": "present",
                "sha256": post["sha256"],
                "size_bytes": post["size_bytes"],
            },
        }
        for target, post in zip(TARGETS, post_states, strict=True)
    ],
    "synchronization_targets": [
        "projects/domainspec-v2/development/architecture-pattern-enforcement/WORK-PACK.md",
        "projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/tasks/TASK-APE-L1-ENUM-TYPESCRIPT.md",
        "projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/shared/SWU-MANIFEST.json",
        RECEIPT_TARGET,
    ],
    "admitted_delta_classes": [
        "typescript-runtime-provider",
        "runtime-test",
        "type-level-test",
    ],
    "plan_once_admission": {
        "plan_epoch_id": selection["planEpochId"],
        "unit_contract_digest": selection["unitContractDigest"],
        "attempt_id": admission["attemptId"],
        "selection_receipt_ref": exact_ref(selection_path),
        "mutation_admission_receipt_ref": admission_ref,
        "admission_token": admission["admissionToken"],
        "target_baseline_digest": admission["targetBaselineDigest"],
        "validation_contract_digest": admission["validationContractDigest"],
        "consumption_ledger_ref": exact_ref(ledger_path),
    },
    "execution_evidence": {
        "ticket_ref": exact_ref(f"{BASE}/governance-run/execution-ticket.json"),
        "executor_receipt_ref": exact_ref(
            f"{BASE}/governance-run/terminal-executor-receipt.json"
        ),
        "reconciliation_ref": exact_ref(f"{BASE}/governance-run/reconciliation.json"),
        "commit_receipt_ref": exact_ref(f"{BASE}/governance-run/commit-receipt.json"),
        "first_attempt_commit_ref": exact_ref(
            "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260805T233000Z-ts001a-readiness/task-session/governance-run/commit-receipt.json"
        ),
        "failed_live_validation_ref": exact_ref(
            f"{REPAIR_BASE}/FAILED-ATTEMPT-EVIDENCE.json"
        ),
    },
    "validation": [
        {
            "command_id": "validate-typescript-enum-provider-runtime",
            "exit_code": 0,
            "result": "pass",
            "observed_post_state": True,
            "test_files": 1,
            "tests": 9,
        },
        {
            "command_id": "validate-typescript-enum-provider-types",
            "exit_code": 0,
            "result": "pass",
            "observed_post_state": True,
        },
        {
            "command_id": "validate-typescript-parent-typecheck",
            "exit_code": 0,
            "result": "pass",
            "observed_post_state": True,
        },
        {
            "command": "cmp <repair staged provider/test/config> <live targets>",
            "exit_code": 0,
            "result": "pass",
        },
        {
            "command": "git diff --check -- <live provider/test/config>",
            "exit_code": 0,
            "result": "pass",
        },
    ],
    "acceptance_accounting": {
        "protocol_id": "typescript.owned-const-object-enum/v1",
        "required_exports": ["defineEnum", "composeEnum", "EnumValue"],
        "provider_source": post_states[0],
        "runtime_freeze": "pass",
        "string_only_direct_and_named_composition": "pass",
        "nested_composition": "pass",
        "duplicate_key_and_value_blocking": "pass",
        "prototype_sensitive_key_blocking": "pass",
        "repeated_component_and_contribution_blocking": "pass",
        "cyclic_raw_graph_blocking": "pass",
        "module_owned_identity": "pass",
        "compile_time_literal_union": "pass",
        "profile_activation": "deferred-to-SWU-APE-ENUM-TS-001B",
    },
    "redaction_posture": "No credentials or secrets; repository-relative private evidence references only.",
    "lifecycle_owner_validation": {
        "owner": "Task Session",
        "status": "pass",
        "expected_owner_receipt": RECEIPT_TARGET,
        "task_session_closeout": "receipt-backed local-fallback closeout",
        "synchronization_status": "pending invoke refresh",
    },
    "claim_ceiling": "Owned TypeScript Enum runtime provider and its focused runtime/type evidence only; no profile activation, source adapter proof, ontology promotion, publication, deployment, release, or production-readiness authority.",
    "blockers": [],
    "residue": [
        "The first live-validation attempt failed because its npm exec arguments did not isolate repository-root discovery; the validation-only Invoke Refresh repaired both command paths, and the second Task Session adopted byte-identical provider targets without rewriting them.",
        "Runtime construction cannot determine whether accepted source used computed-property syntax; TS001B/TS002 own source-form admission and observation.",
        "The governance runner reports owner-hook automation as not implemented; Invoke Refresh remains required to synchronize lifecycle status and route the declared successor."
    ],
    "continuation": {
        "successor_policy": "SWU-APE-ENUM-TS-001B becomes the only candidate after this receipt and current provider-digest verification.",
        "next_candidate": "SWU-APE-ENUM-TS-001B",
        "selected": False,
        "reroute": "Invoke Refresh then Task Session",
    },
    "handoff_note": "Rehash this receipt, the provider source, and TS-001 decision before admitting TS001B profile activation."
}

target = ROOT / RECEIPT_TARGET
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
