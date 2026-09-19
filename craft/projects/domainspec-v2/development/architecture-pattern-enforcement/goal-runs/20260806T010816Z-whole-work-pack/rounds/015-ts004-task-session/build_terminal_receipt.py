#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from ts004_scope import TARGETS


ROOT = Path(__file__).resolve().parents[8]
HERE = Path(__file__).resolve().parent
BASE = HERE.relative_to(ROOT).as_posix()
READINESS = "projects/domainspec-v2/development/architecture-pattern-enforcement/goal-runs/20260806T010816Z-whole-work-pack/rounds/016-ts004-readiness"
RECEIPT_TARGET = "projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/receipts/SWU-APE-ENUM-TS-004.json"


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
execution_path = "projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/receipts/typescript/EXECUTION.json"
mutation_path = "projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/receipts/typescript/MUTATION.json"
replay_path = "projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/receipts/typescript/REPLAY.json"
scenario_path = "projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/receipts/typescript/SCENARIO-READINESS.json"
freeze_path = "projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/contracts/FROZEN-OBSERVATION.json"
execution = json.loads((ROOT / execution_path).read_text(encoding="utf-8"))
mutation = json.loads((ROOT / mutation_path).read_text(encoding="utf-8"))
replay = json.loads((ROOT / replay_path).read_text(encoding="utf-8"))
scenario = json.loads((ROOT / scenario_path).read_text(encoding="utf-8"))
freeze = json.loads((ROOT / freeze_path).read_text(encoding="utf-8"))
receipt = {
    "schema_version": "ape.swu-receipt.v1",
    "swu_id": "SWU-APE-ENUM-TS-004",
    "task_id": "TASK-APE-L1-ENUM-TYPESCRIPT",
    "wave": "W1",
    "layer": "L1",
    "result": "pass",
    "receipt_kind": "local-fallback",
    "capability_ref": ".agents/skills/task-session",
    "owner": "TypeScript observation-contract owner via Task Session",
    "executor": "ape-enum-typescript-trust-proof-executor",
    "attempt_id": "task-session-ape-ts004-goal-20260806T024000Z",
    "started_at": "2026-08-06T02:40:00Z",
    "completed_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "immutable_inputs": [
        ref("projects/domainspec-v2/development/architecture-pattern-enforcement/WORK-PACK.md"),
        ref("projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/tasks/TASK-APE-L1-ENUM-TYPESCRIPT.md", "SWU-APE-ENUM-TS-004"),
        ref("projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/shared/SWU-MANIFEST.json", "/swus/11"),
        ref("projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/receipts/SWU-APE-ENUM-TS-003.json"),
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
    "admitted_delta_classes": ["typescript-runner", "execution-receipt", "replay-receipt", "contract-freeze"],
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
        {"command_id": "validate-typescript-enum-trust-proof", "exit_code": 0, "result": "pass", "observed_post_state": True, "artifacts": 5},
        {"command_id": "validate-typescript-enum-trust-proof-tests", "exit_code": 0, "result": "pass", "observed_post_state": True, "test_files": 1, "tests": 2},
        {"command_id": "validate-typescript-enum-runner-types", "exit_code": 0, "result": "pass", "observed_post_state": True},
        {"command_id": "validate-evaluation-scenario-contract-readiness", "exit_code": 0, "result": "pass", "observed_post_state": True, "cases": 4},
        {"command_id": "validate-bte-development-proof-provider-regression", "exit_code": 0, "result": "pass", "observed_post_state": True, "test_files": 1, "tests": 5},
        {"command_id": "validate-typescript-parent-typecheck-after-trust-proof", "exit_code": 0, "result": "pass", "observed_post_state": True},
        {"command": "git diff --check -- <nine exact TS004 targets>", "exit_code": 0, "result": "pass"},
    ],
    "acceptance_accounting": {
        "projection_schema": "domainspec-observation-projection/v1",
        "protocol_id": "typescript.owned-const-object-enum/v1",
        "declared_cases": execution["declared_case_count"],
        "accounted_cases": execution["accounted_case_count"],
        "unaccounted_cases": execution["unaccounted_case_count"],
        "declared_mutants": mutation["declared_mutant_count"],
        "killed_mutants": mutation["killed_mutant_count"],
        "survived_mutants": mutation["survived_mutant_count"],
        "replay_byte_identical": replay["byte_identical"],
        "independent_recomposition": replay["independent_recomposition"],
        "scenario_result": scenario["result"],
        "bte_provider_adoption": scenario["provider_adoption"],
        "frozen": freeze["frozen"],
        "frozen_contract_sha256": freeze["frozen_contract_sha256"],
        "execution_receipt": ref(execution_path),
        "mutation_receipt": ref(mutation_path),
        "replay_receipt": ref(replay_path),
        "scenario_readiness_receipt": ref(scenario_path),
        "frozen_observation_contract": ref(freeze_path),
    },
    "redaction_posture": "No credentials or secrets; repository-relative private evidence references only.",
    "lifecycle_owner_validation": {"owner": "Task Session", "status": "pass", "expected_owner_receipt": RECEIPT_TARGET, "task_session_closeout": "receipt-backed local-fallback closeout", "synchronization_status": "pending invoke refresh"},
    "claim_ceiling": "TypeScript Enum trust proof and frozen observation contract only; no BTE provider adoption, cross-language parity, promotion, publication, deployment, release, or production authority.",
    "blockers": [],
    "residue": [
        "The isolated parent typecheck requires the existing validation/poker-team source tree and its Node dependency resolution as read-only mirror support.",
        "BTE provider adoption remains separately owner-gated; TS004 proves only scenario-contract compatibility and a current BTE provider regression.",
        "The governance runner reports owner-hook automation as not implemented; Invoke Refresh remains required to synchronize lifecycle status before the protected Python/Rust fan-out."
    ],
    "continuation": {"successor_policy": "Python and Rust may fan out only after a new exact dispatch confirmation.", "next_candidate": "Python/Rust fan-out only after new exact confirmation", "selected": False, "reroute": "Invoke Refresh then exact dispatch confirmation"},
    "handoff_note": "Rehash this receipt and the frozen observation contract before presenting the exact Python/Rust dispatch document."
}
target = ROOT / RECEIPT_TARGET
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
