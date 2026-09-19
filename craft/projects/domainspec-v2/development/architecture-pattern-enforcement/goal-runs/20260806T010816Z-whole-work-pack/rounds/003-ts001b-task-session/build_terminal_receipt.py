#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[8]
HERE = Path(__file__).resolve().parent
BASE = (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "goal-runs/20260806T010816Z-whole-work-pack/rounds/003-ts001b-task-session"
)
READINESS_BASE = (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "goal-runs/20260806T010816Z-whole-work-pack/rounds/002-ts001b-readiness"
)
RECEIPT_TARGET = (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "instances/enum/receipts/SWU-APE-ENUM-TS-001B.json"
)

TARGETS = [
    "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/typescript-strict.profile.json",
    "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/examples/enum/profiles/check-profile-resolution.mjs",
    "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/examples/enum/profiles/activation-cases.json",
    "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/examples/enum/profiles/activation-evaluations.expected.json",
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


selection_path = f"{READINESS_BASE}/selection-receipt.json"
admission_path = f"{BASE}/mutation-admission-receipt.json"
selection = json.loads((ROOT / selection_path).read_text(encoding="utf-8"))
admission = json.loads((ROOT / admission_path).read_text(encoding="utf-8"))
admission_ref = exact_ref(admission_path)
ledger_path = f"{BASE}/.admission-consumption/{admission_ref['sha256']}.json"
reconciliation = json.loads(
    (ROOT / BASE / "governance-run/reconciliation.json").read_text(encoding="utf-8")
)
classification_by_target = {
    item["target_path"]: item
    for item in reconciliation["classifications"]
}

target_inventory = []
for target in TARGETS:
    post = exact_ref(target)
    baseline = classification_by_target[target]["baseline"]
    target_inventory.append(
        {
            "path": target,
            "initial_unit_baseline": baseline,
            "post_state": {
                "state": "present",
                "sha256": post["sha256"],
                "size_bytes": post["size_bytes"],
            },
        }
    )

receipt = {
    "schema_version": "ape.swu-receipt.v1",
    "swu_id": "SWU-APE-ENUM-TS-001B",
    "task_id": "TASK-APE-L1-ENUM-TYPESCRIPT",
    "wave": "W1",
    "layer": "L1",
    "result": "pass",
    "receipt_kind": "local-fallback",
    "capability_ref": ".agents/skills/task-session",
    "owner": "TypeScript architecture-profile owner via Task Session",
    "executor": "ape-enum-typescript-profile-activation-executor",
    "attempt_id": "task-session-ape-ts001b-goal-20260806T010816Z",
    "started_at": "2026-08-06T01:08:16Z",
    "completed_at": "2026-08-06T01:36:30Z",
    "immutable_inputs": [
        exact_ref(
            "projects/domainspec-v2/development/architecture-pattern-enforcement/WORK-PACK.md"
        ),
        exact_ref(
            "projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/tasks/TASK-APE-L1-ENUM-TYPESCRIPT.md",
            "SWU-APE-ENUM-TS-001B",
        ),
        exact_ref(
            "projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/shared/SWU-MANIFEST.json",
            "/swus/8",
        ),
        exact_ref(
            "projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/decisions/typescript-representation.json",
            "/selected_protocol",
        ),
        exact_ref(
            "projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/receipts/SWU-APE-ENUM-TS-001A.json",
            "/acceptance_accounting/provider_source",
        ),
        exact_ref(
            "projects/domainspec-v2/impl/architecture-conformance/typescript/runtime/enum/index.ts"
        ),
        exact_ref(selection_path),
        exact_ref(f"{BASE}/context-pack.json"),
        admission_ref,
    ],
    "target_inventory": target_inventory,
    "synchronization_targets": [
        "projects/domainspec-v2/development/architecture-pattern-enforcement/WORK-PACK.md",
        "projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/tasks/TASK-APE-L1-ENUM-TYPESCRIPT.md",
        "projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/shared/SWU-MANIFEST.json",
        RECEIPT_TARGET,
    ],
    "admitted_delta_classes": [
        "typescript-profile-activation",
        "profile-evidence-binding",
        "profile-activation-fixtures",
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
        "prejoined_diagnostic_ref": exact_ref(
            f"{BASE}/diagnostic-prejoined-terminal-executor-receipt.json"
        ),
        "schema_rejection_diagnostic_ref": exact_ref(
            f"{BASE}/diagnostic-invalid-schema-terminal-executor-receipt.json"
        ),
    },
    "validation": [
        {
            "command_id": "validate-typescript-enum-profile-activation-1",
            "exit_code": 0,
            "result": "pass",
            "observed_post_state": True,
        },
        {
            "command_id": "validate-typescript-enum-profile-activation-2",
            "exit_code": 0,
            "result": "pass",
            "observed_post_state": True,
            "byte_identical_to_first_run": True,
            "stdout_sha256": "ade519b0184253d840edd54683fe02413617f40f53bebdf3b2e1e2bedaf9edb5",
        },
        {
            "command_id": "validate-typescript-profile-ontology-regression",
            "exit_code": 0,
            "result": "pass",
            "observed_post_state": True,
        },
        {
            "command": "cmp <governance staged profile/resolver/activation fixtures> <live targets>",
            "exit_code": 0,
            "result": "pass",
        },
        {
            "command": "git diff --check -- <four exact TS001B targets>",
            "exit_code": 0,
            "result": "pass",
        },
    ],
    "acceptance_accounting": {
        "selected_form": "typescript.owned-const-object-enum",
        "protocol_id": "typescript.owned-const-object-enum/v1",
        "provider_source": exact_ref(
            "projects/domainspec-v2/impl/architecture-conformance/typescript/runtime/enum/index.ts"
        ),
        "owner_decision_binding": "pass",
        "provider_receipt_binding": "pass",
        "provider_digest_binding": "pass",
        "unsupported_forms_explicit": 7,
        "missing_or_stale_evidence_blockers": 8,
        "focused_resolver_cases": 16,
        "focused_resolver_repeatability": "byte-identical",
        "ontology_regression": "pass",
        "profile_activation": "pass",
    },
    "redaction_posture": "No credentials or secrets; repository-relative private evidence references only.",
    "lifecycle_owner_validation": {
        "owner": "Task Session",
        "status": "pass",
        "expected_owner_receipt": RECEIPT_TARGET,
        "task_session_closeout": "receipt-backed local-fallback closeout",
        "synchronization_status": "pending invoke refresh",
    },
    "claim_ceiling": "TypeScript strict-profile activation for the TS001A owned Enum provider and its exact local evidence only; no source-adapter proof, cross-language parity, ontology promotion, publication, deployment, release, or production-readiness authority.",
    "blockers": [],
    "residue": [
        "The isolated executor first exposed a wrong validator-support path, then an exact validation command-id mismatch; both failed before live writes and were corrected within the same admitted target scope.",
        "A manual pre-joined receipt was rejected before admission consumption; the canonical join then consumed the admission and rejected an extra non-schema validation field before live writes. Both rejected receipts are preserved as diagnostics.",
        "The closeout preflight uses the shorthand validation label validate-ontology-regression, while the execution ticket and both isolated/live runs use the contract-exact validate-typescript-profile-ontology-regression id.",
        "The governance runner reports owner-hook automation as not implemented; Invoke Refresh remains required to synchronize lifecycle status and route the declared successor.",
    ],
    "continuation": {
        "successor_policy": "SWU-APE-ENUM-TS-002 becomes the only candidate after this receipt and current profile/provider binding verification.",
        "next_candidate": "SWU-APE-ENUM-TS-002",
        "selected": False,
        "reroute": "Invoke Refresh then Task Session",
    },
    "handoff_note": "Rehash this receipt, the active TypeScript profile, the TS001 decision, the TS001A receipt, and the provider before admitting TS002 source-shape observation."
}

target = ROOT / RECEIPT_TARGET
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
