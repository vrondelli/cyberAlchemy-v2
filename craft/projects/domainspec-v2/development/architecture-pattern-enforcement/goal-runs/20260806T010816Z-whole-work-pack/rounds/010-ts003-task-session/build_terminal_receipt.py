#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from ts003_scope import ADAPTER, TARGETS


ROOT = Path(__file__).resolve().parents[8]
HERE = Path(__file__).resolve().parent
BASE = HERE.relative_to(ROOT).as_posix()
READINESS = "projects/domainspec-v2/development/architecture-pattern-enforcement/goal-runs/20260806T010816Z-whole-work-pack/rounds/012-ts003-readiness"
RECEIPT_TARGET = "projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/receipts/SWU-APE-ENUM-TS-003.json"


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
context = json.loads((HERE / "context-pack.json").read_text(encoding="utf-8"))
baselines = {item["path"]: item for item in context["target_baselines"]}
receipt = {
    "schema_version": "ape.swu-receipt.v1",
    "swu_id": "SWU-APE-ENUM-TS-003",
    "task_id": "TASK-APE-L1-ENUM-TYPESCRIPT",
    "wave": "W1",
    "layer": "L1",
    "result": "pass",
    "receipt_kind": "local-fallback",
    "capability_ref": ".agents/skills/task-session",
    "owner": "TypeScript fixture-matrix owner via Task Session",
    "executor": "ape-enum-typescript-fixture-matrix-executor",
    "attempt_id": "task-session-ape-ts003-goal-20260806T022200Z",
    "started_at": "2026-08-06T02:22:00Z",
    "completed_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "immutable_inputs": [
        ref("projects/domainspec-v2/development/architecture-pattern-enforcement/WORK-PACK.md"),
        ref("projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/tasks/TASK-APE-L1-ENUM-TYPESCRIPT.md", "SWU-APE-ENUM-TS-003"),
        ref("projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/shared/SWU-MANIFEST.json", "/swus/10"),
        ref("projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/receipts/SWU-APE-ENUM-TS-002.json"),
        ref("projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/typescript-strict.profile.json"),
        ref(selection_path),
        ref(f"{BASE}/context-pack.json"),
        admission_reference,
    ],
    "target_inventory": [
        {"path": target, "initial_unit_baseline": baselines[target], "post_state": {"state": "present", "sha256": ref(target)["sha256"], "size_bytes": ref(target)["size_bytes"]}}
        for target in TARGETS
    ],
    "synchronization_targets": [
        "projects/domainspec-v2/development/architecture-pattern-enforcement/WORK-PACK.md",
        "projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/tasks/TASK-APE-L1-ENUM-TYPESCRIPT.md",
        "projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/shared/SWU-MANIFEST.json",
        RECEIPT_TARGET,
    ],
    "admitted_delta_classes": ["typescript-fixture", "expected-result-manifest", "focused-test", "typescript-adapter-observation-repair"],
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
    },
    "validation": [
        {"command_id": "validate-typescript-enum-fixture-matrix", "exit_code": 0, "result": "pass", "observed_post_state": True, "test_files": 1, "tests": 1, "cases": 13},
        {"command_id": "validate-typescript-enum-adapter-regression-after-fixtures", "exit_code": 0, "result": "pass", "observed_post_state": True, "test_files": 1, "tests": 3},
        {"command_id": "validate-typescript-enum-fixture-types", "exit_code": 0, "result": "pass", "observed_post_state": True},
        {"command_id": "validate-typescript-parent-typecheck-after-fixtures", "exit_code": 0, "result": "pass", "observed_post_state": True},
        {"command": "git diff --check -- <seventeen exact TS003 targets>", "exit_code": 0, "result": "pass"},
    ],
    "acceptance_accounting": {
        "projection_schema": "domainspec-observation-projection/v1",
        "protocol_id": "typescript.owned-const-object-enum/v1",
        "declared_cases": 13,
        "accounted_cases": 13,
        "unaccounted_cases": 0,
        "passing_positive_cases": 1,
        "supported_mutants_with_exact_findings": 5,
        "unsupported_forms_with_stable_diagnostics": 7,
        "non_collapse_value_object": "pass",
        "non_collapse_state_machine": "pass",
        "stale_binding_evidence_mutation": "pass",
        "adapter_regression_tests": 3,
        "adapter_source": ref(ADAPTER),
        "expected_results_manifest": ref("projects/domainspec-v2/impl/architecture-conformance/typescript/fixtures/enum/expected-results.json"),
    },
    "redaction_posture": "No credentials or secrets; repository-relative private evidence references only.",
    "lifecycle_owner_validation": {"owner": "Task Session", "status": "pass", "expected_owner_receipt": RECEIPT_TARGET, "task_session_closeout": "receipt-backed local-fallback closeout", "synchronization_status": "pending invoke refresh"},
    "claim_ceiling": "TypeScript Enum discriminating fixture denominator only; no trust freeze, cross-language parity, promotion, publication, deployment, release, or production authority.",
    "blockers": [],
    "residue": [
        "The isolated parent typecheck requires the existing validation/poker-team source tree and its Node dependency resolution as read-only mirror support.",
        "The empty-object mutation has one causal source mutation and three exact findings because three independent ontology constraints observe that absence.",
        "The governance runner reports owner-hook automation as not implemented; Invoke Refresh remains required to synchronize lifecycle status and route TS004."
    ],
    "continuation": {"successor_policy": "TS004 becomes the only candidate after this receipt and current matrix digest verification.", "next_candidate": "SWU-APE-ENUM-TS-004", "selected": False, "reroute": "Invoke Refresh then Task Session"},
    "handoff_note": "Rehash this receipt, matrix, adapter source, active profile, and provider before admitting the TS004 trust proof."
}
target = ROOT / RECEIPT_TARGET
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
