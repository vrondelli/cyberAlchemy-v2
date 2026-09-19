#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[8]
HERE = Path(__file__).resolve().parent
BASE = HERE.relative_to(ROOT).as_posix()
READINESS = "projects/domainspec-v2/development/architecture-pattern-enforcement/goal-runs/20260806T010816Z-whole-work-pack/rounds/007-ts002-readiness"
RECEIPT_TARGET = "projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/receipts/SWU-APE-ENUM-TS-002.json"
TARGETS = [
    "projects/domainspec-v2/impl/architecture-conformance/typescript/adapter/enum/index.ts",
    "projects/domainspec-v2/impl/architecture-conformance/typescript/adapter-tests/enum/adapter.test.ts",
    "projects/domainspec-v2/impl/architecture-conformance/typescript/adapter-tests/enum/fixtures/order-status.ts",
    "projects/domainspec-v2/impl/architecture-conformance/typescript/adapter-tests/enum/fixtures/native-status.ts",
    "projects/domainspec-v2/impl/architecture-conformance/typescript/adapter-tests/enum/tsconfig.json",
]


def ref(path: str, selector: str | None = None) -> dict[str, object]:
    data = (ROOT / path).read_bytes()
    item: dict[str, object] = {"path": path, "sha256": hashlib.sha256(data).hexdigest(), "size_bytes": len(data)}
    if selector is not None:
        item["selector"] = selector
    return item


admission_path = f"{BASE}/mutation-admission-receipt.json"
admission = json.loads((ROOT / admission_path).read_text())
selection_path = f"{READINESS}/selection-receipt.json"
selection = json.loads((ROOT / selection_path).read_text())
admission_reference = ref(admission_path)
ledger = f"{BASE}/.admission-consumption/{admission_reference['sha256']}.json"
receipt = {
    "schema_version": "ape.swu-receipt.v1",
    "swu_id": "SWU-APE-ENUM-TS-002",
    "task_id": "TASK-APE-L1-ENUM-TYPESCRIPT",
    "wave": "W1",
    "layer": "L1",
    "result": "pass",
    "receipt_kind": "local-fallback",
    "capability_ref": ".agents/skills/task-session",
    "owner": "TypeScript adapter owner via Task Session",
    "executor": "ape-enum-typescript-adapter-executor",
    "attempt_id": "task-session-ape-ts002-goal-20260806T014900Z",
    "started_at": "2026-08-06T01:49:00Z",
    "completed_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "immutable_inputs": [
        ref("projects/domainspec-v2/development/architecture-pattern-enforcement/WORK-PACK.md"),
        ref("projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/tasks/TASK-APE-L1-ENUM-TYPESCRIPT.md", "SWU-APE-ENUM-TS-002"),
        ref("projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/shared/SWU-MANIFEST.json", "/swus/9"),
        ref("projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/receipts/SWU-APE-ENUM-TS-001B.json"),
        ref("projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/typescript-strict.profile.json"),
        ref(selection_path),
        ref(f"{BASE}/context-pack.json"),
        admission_reference,
    ],
    "target_inventory": [
        {"path": target, "initial_unit_baseline": {"state": "absent", "sha256": None, "size_bytes": None}, "post_state": {"state": "present", "sha256": ref(target)["sha256"], "size_bytes": ref(target)["size_bytes"]}}
        for target in TARGETS
    ],
    "synchronization_targets": [
        "projects/domainspec-v2/development/architecture-pattern-enforcement/WORK-PACK.md",
        "projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/tasks/TASK-APE-L1-ENUM-TYPESCRIPT.md",
        "projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/shared/SWU-MANIFEST.json",
        RECEIPT_TARGET,
    ],
    "admitted_delta_classes": ["typescript-adapter", "focused-unit-test"],
    "plan_once_admission": {
        "plan_epoch_id": selection["planEpochId"],
        "unit_contract_digest": selection["unitContractDigest"],
        "attempt_id": admission["attemptId"],
        "selection_receipt_ref": ref(selection_path),
        "mutation_admission_receipt_ref": admission_reference,
        "admission_token": admission["admissionToken"],
        "target_baseline_digest": admission["targetBaselineDigest"],
        "validation_contract_digest": admission["validationContractDigest"],
        "consumption_ledger_ref": ref(ledger),
    },
    "execution_evidence": {
        "ticket_ref": ref(f"{BASE}/governance-run/execution-ticket.json"),
        "executor_receipt_ref": ref(f"{BASE}/governance-run/terminal-executor-receipt.json"),
        "reconciliation_ref": ref(f"{BASE}/governance-run/reconciliation.json"),
        "commit_receipt_ref": ref(f"{BASE}/governance-run/commit-receipt.json"),
        "failed_parent_support_ref": ref(f"{BASE}/diagnostic-missing-parent-support-executor-receipt.json"),
        "incomplete_parent_support_ref": ref(f"{BASE}/diagnostic-incomplete-parent-support-executor-receipt.json"),
        "missing_parent_modules_ref": ref(f"{BASE}/diagnostic-missing-parent-node-modules-executor-receipt.json"),
    },
    "validation": [
        {"command_id": "validate-typescript-enum-adapter-runtime", "exit_code": 0, "result": "pass", "observed_post_state": True, "test_files": 1, "tests": 3},
        {"command_id": "validate-typescript-enum-adapter-types", "exit_code": 0, "result": "pass", "observed_post_state": True},
        {"command_id": "validate-typescript-parent-typecheck-after-adapter", "exit_code": 0, "result": "pass", "observed_post_state": True},
        {"command": "git diff --check -- <five exact TS002 targets>", "exit_code": 0, "result": "pass"},
    ],
    "acceptance_accounting": {
        "projection_schema": "domainspec-observation-projection/v1",
        "protocol_id": "typescript.owned-const-object-enum/v1",
        "exact_provider_binding": "pass",
        "real_source_positive": "pass",
        "native_enum_typed_unsupported": "pass",
        "stale_provider_identity_blocking": "pass",
        "ontology_defined_fact_projection": "pass",
        "raw_source_and_owner_provenance": "pass",
        "adapter_source": ref(TARGETS[0]),
    },
    "redaction_posture": "No credentials or secrets; repository-relative private evidence references only.",
    "lifecycle_owner_validation": {"owner": "Task Session", "status": "pass", "expected_owner_receipt": RECEIPT_TARGET, "task_session_closeout": "receipt-backed local-fallback closeout", "synchronization_status": "pending invoke refresh"},
    "claim_ceiling": "TypeScript Enum real-source adapter and focused evidence only; no full fixture denominator, freeze, parity, promotion, publication, deployment, release, or production authority.",
    "blockers": [],
    "residue": [
        "The isolated parent typecheck required the existing validation/poker-team source tree and its Node dependency resolution as read-only mirror support; two incomplete support attempts failed before live writes and are preserved.",
        "TS003 owns the full one-cause mutant denominator; TS002 proves only the admitted positive, native-Enum unsupported behavior, and stale provider identity block.",
        "The governance runner reports owner-hook automation as not implemented; Invoke Refresh remains required to synchronize lifecycle status and route TS003."
    ],
    "continuation": {"successor_policy": "TS003 becomes the only candidate after this receipt and current adapter digest verification.", "next_candidate": "SWU-APE-ENUM-TS-003", "selected": False, "reroute": "Invoke Refresh then Task Session"},
    "handoff_note": "Rehash this receipt, adapter source, active profile, and provider before admitting the TS003 fixture denominator."
}
target = ROOT / RECEIPT_TARGET
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
