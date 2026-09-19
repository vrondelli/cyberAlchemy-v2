#!/usr/bin/env python3
"""Build the one-unit, plan-once WPRA configuration for SWU-ARE-001."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[9]
RUN = Path(__file__).resolve().parent
PLAN = "projects/domainspec-v2/development/refinement-runs/20260806T031658Z-enum-ontology-codegen-roundtrip/stages/09-invoke-plan"
WORK_PACK = f"{PLAN}/WORK-PACK.md"
MANIFEST = f"{PLAN}/SWU-MANIFEST.json"
ENTRY = f"{PLAN}/EXECUTION-ENTRY.json"
PLAN_RECEIPT = f"{PLAN}/NATIVE-RECEIPT.json"
TASK = f"{PLAN}/work-pack/tasks/TASK-ARE-L0-CONTRACTS.md"
CONTEXT = f"{PLAN}/execution-runs/20260806T141445Z-swu-are-001/context-pack.json"
ONTOLOGY = "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/ontology.json"
BASE_PROFILE = "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/base-domain.profile.json"
TS_PROFILE = "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/typescript-strict.profile.json"
TERMINAL_SCHEMA = "arcanum/arcana/task-session/schemas/governance-terminal-receipt.schema.json"
RECEIPT = "projects/domainspec-v2/development/architecture-realization-compiler/receipts/SWU-ARE-001.red.json"


def exact(path: str) -> dict[str, Any]:
    data = (ROOT / path).read_bytes()
    return {
        "path": path,
        "sha256": hashlib.sha256(data).hexdigest(),
        "size_bytes": len(data),
    }


def binding(binding_id: str, owner: str, path: str, selector: str) -> dict[str, Any]:
    return {
        "binding_id": binding_id,
        "owner_ref": owner,
        "artifact_ref": exact(path),
        "selector": selector,
    }


manifest = json.loads((ROOT / MANIFEST).read_text(encoding="utf-8"))
entry = json.loads((ROOT / ENTRY).read_text(encoding="utf-8"))
swu = manifest["swus"][0]
if swu["swu_id"] != "SWU-ARE-001" or entry["frontier"] != ["SWU-ARE-001"]:
    raise SystemExit("SWU-ARE-001 is not the exact captured frontier")

all_writes = list(swu["write_scope"])
material_writes = all_writes[:-1]
validation_contracts = [
    {
        "command_id": "verify-red-realization-spec",
        "argv": [
            "node",
            "projects/domainspec-v2/development/architecture-realization-compiler/tools/verify-red-realization-spec.mjs",
        ],
        "cwd": ".",
        "timeout_seconds": 30,
        "max_output_bytes": 65536,
    }
]

config = {
    "schema_version": "2.0.0",
    "audit_id": "wp-are-enum-ts-001-swu-are-001-20260806T141445Z",
    "repository_root": ".",
    "evidence_ceiling": "frozen-input-contractual-readiness",
    "classifier_version": "wpra-plan-once-v1",
    "admission_timing": "selected-unit-at-task-session",
    "objective_ref": binding("are001-objective", "invoke-plan-owner", MANIFEST, "/swus/0/primary_behavior"),
    "closure_receipt_refs": [
        binding("are-plan-pass", "invoke-plan", PLAN_RECEIPT, "/status"),
        binding("are-distill-pass", "distill", PLAN_RECEIPT, "/distill_validation"),
    ],
    "authority_bindings": {
        "canonical_authority_refs": [
            binding("are-enum-type", "ontology-owner", ONTOLOGY, "/concept_types/2"),
            binding("are-base-profile", "architecture-profile-owner", BASE_PROFILE, ""),
            binding("are-ts-profile", "typescript-profile-owner", TS_PROFILE, ""),
        ],
        "semantic_bindings": {
            "owner": binding("are001-owner", "invoke-plan-owner", MANIFEST, "/swus/0/execution_owner"),
            "material": binding("are001-material", "invoke-plan-owner", MANIFEST, "/swus/0/write_scope"),
            "validation": binding("are001-validation", "invoke-plan-owner", MANIFEST, "/swus/0/validation"),
            "receipt": binding("are001-receipt", "task-session", MANIFEST, "/swus/0/expected_result_shape"),
            "closeout": binding("are001-closeout", "invoke-plan-owner", MANIFEST, "/swus/0/closeout_ref"),
        },
    },
    "execution_bindings": [
        {
            "task_id": swu["parent_task"],
            "swu_id": swu["swu_id"],
            "unit_id": swu["swu_id"],
            "lifecycle_owner": "projects/domainspec-v2",
            "authority_class": "private",
            "publication_class": "internal",
            "dependencies": [],
            "canonical_successors": ["__complete__"],
            "command": {
                "argv": validation_contracts[0]["argv"],
                "cwd": ".",
                "risk_class": "bounded-write",
            },
            "validation_contracts": validation_contracts,
            "attempt_contract": {
                "id_policy": "attempt-id-equals-task-session-run-id",
                "collision_policy": "reject-existing-different-attempt",
                "success_teardown": "retain-terminal-red-receipt-and-contract-evidence",
                "failure_teardown": "retain-block-receipt-and-no-target-mutation-evidence",
            },
            "material_writes": material_writes,
            "execution_outputs": [RECEIPT],
            "allowed_writes": all_writes,
            "material_package": {
                "package_ref": None,
                "producer_owner_ref": "independent-obligation-fixture-owner",
                "producer_receipt_ref": None,
                "schema_ref": None,
                "declared_sha256": None,
                "target_inventory_ref": None,
            },
            "byte_baselines": [],
        }
    ],
    "receipt_bindings": {
        "terminal_schema_ref": binding("task-session-terminal-schema", "task-session", TERMINAL_SCHEMA, ""),
        "semantic_validator_ref": binding("are001-terminal-semantics", "independent-obligation-fixture-owner", MANIFEST, "/swus/0/done_criteria"),
        "expected_receipt_refs": [
            binding("are001-expected-receipt", "task-session", MANIFEST, "/swus/0/expected_result_shape")
        ],
    },
    "closeout_bindings": [
        {
            "unit_id": "SWU-ARE-001",
            "allowed_delta_policy_ref": binding("are001-closeout-delta-policy", "invoke-plan-owner", ENTRY, "/execution_policy/allowed_routes/1"),
            "owner_receipt_contract_ref": binding("are001-closeout-receipt-contract", "invoke", ENTRY, "/execution_policy/allowed_routes/1/expected_receipt"),
            "compensation": {
                "mode": "none",
                "rationale": "The red-contract slice is append-only in an isolated development package; failure retains evidence and stops before successor execution.",
            },
        }
    ],
    "runtime_binding": {
        "requested_task_session_execution_mode": "routed-mutation",
        "task_session_admission_receipt_ref": None,
    },
    "status_receipt_refs": {
        "artifact_authored_status": {"value": "pass", "owner_ref": "invoke-plan", "receipt_ref": binding("are-plan-status", "invoke-plan", PLAN_RECEIPT, "/status")},
        "registry_released_status": {"value": "not-applicable", "owner_ref": "projects/domainspec-v2", "receipt_ref": binding("are-publication-status", "invoke-plan", PLAN_RECEIPT, "/authority_effect")},
        "mutation_runtime_ready_status": {"value": "pending-selection", "owner_ref": "implementation-readiness", "receipt_ref": binding("are-runtime-status", "invoke-plan", ENTRY, "/execution_entry/state")},
        "audit_verdict": {"value": "pending", "owner_ref": "work-pack-readiness-audit", "receipt_ref": binding("are-audit-status", "invoke-plan", PLAN_RECEIPT, "/status")},
    },
    "lifecycle_status_refs": {
        "plan_artifact_status": {"value": "pass", "owner_ref": "invoke-plan", "receipt_ref": binding("are-lifecycle-plan", "invoke-plan", PLAN_RECEIPT, "/status")},
        "audit_status": {"value": "pending", "owner_ref": "work-pack-readiness-audit", "receipt_ref": binding("are-lifecycle-audit", "invoke-plan", PLAN_RECEIPT, "/status")},
        "approval_status": {"value": "execution-intent-pending", "owner_ref": "implementation-readiness", "receipt_ref": binding("are-lifecycle-approval", "invoke-plan", ENTRY, "/execution_entry/next_owner")},
        "chain_status": {"value": "selection-ready", "owner_ref": "implementation-readiness", "receipt_ref": binding("are-lifecycle-chain", "invoke-plan", ENTRY, "/execution_entry/state")},
    },
    "approval_policy": {
        "approval_owner_ref": "implementation-readiness",
        "decision_gate_receipt_ref": binding("are-direct-intent-boundary", "invoke-plan", ENTRY, "/execution_entry"),
        "run_budget": {"max_task_session_requests": 1},
        "risk_policy_ref": binding("are-risk-policy", "invoke-plan", ENTRY, "/execution_policy/stop_decisions"),
        "allowed_audit_verdicts": ["pass"],
        "allowed_flag_classes": [],
    },
    "continuity_projection": {
        "cursor": "SWU-ARE-001",
        "completed_unit_receipt_refs": [],
        "joined_closeout_receipt_refs": [],
        "projected_next_successor": {
            "unit_id": "SWU-ARE-001",
            "canonical_successor_ref": binding("are001-current-frontier", "invoke-plan", ENTRY, "/frontier/0"),
            "projection_owner_ref": "work-pack-readiness-audit",
            "equivalence_validator_ref": binding("are001-split-proof", "distill", MANIFEST, "/swus/0/split_analysis"),
            "continuation_router_verification_receipt_ref": binding("are001-route-projection", "invoke-plan", ENTRY, "/execution_policy/allowed_routes/0/frontier_swu"),
            "authority_effect": "none",
        },
    },
    "expected_material_digests": {},
    "execution_policy": {
        "work_pack_id": entry["work_pack_id"],
        "route_policy": entry["execution_policy"]["route_policy"],
        "allowed_routes": entry["execution_policy"]["allowed_routes"],
        "allowed_routes_digest": entry["execution_policy"]["allowed_routes_digest"],
        "automatic_decisions": entry["execution_policy"]["automatic_decisions"],
        "stop_decisions": entry["execution_policy"]["stop_decisions"],
        "scope_source": entry["execution_policy"]["scope_source"],
        "validation_policy": entry["execution_policy"]["validation_policy"],
    },
}

(RUN / "audit-config.json").write_text(
    json.dumps(config, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
)
