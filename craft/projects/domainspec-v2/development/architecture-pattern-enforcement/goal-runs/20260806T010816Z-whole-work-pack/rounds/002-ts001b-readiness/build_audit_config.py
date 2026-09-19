#!/usr/bin/env python3
"""Derive the TS001B finite-frontier audit configuration from TS001A evidence."""

from __future__ import annotations

import copy
import hashlib
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[8]
RUN_DIR = Path(__file__).resolve().parent
SOURCE_CONFIG = ROOT / (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "refreshes/20260805T235000Z-ts001a-live-validation-repair/"
    "readiness/audit-config.json"
)
WORK_PACK = (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "WORK-PACK.md"
)
TASK = (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "work-pack/tasks/TASK-APE-L1-ENUM-TYPESCRIPT.md"
)
MANIFEST = (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "work-pack/shared/SWU-MANIFEST.json"
)
TS001A_RECEIPT = (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "instances/enum/receipts/SWU-APE-ENUM-TS-001A.json"
)
TS001B_RECEIPT = (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "instances/enum/receipts/SWU-APE-ENUM-TS-001B.json"
)
APPROVAL = (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "goal-runs/20260806T010816Z-whole-work-pack/rounds/"
    "002-ts001b-readiness/APPROVAL-EVIDENCE.json"
)


def exact_ref(path: str) -> dict[str, Any]:
    data = (ROOT / path).read_bytes()
    return {
        "path": path,
        "sha256": hashlib.sha256(data).hexdigest(),
        "size_bytes": len(data),
    }


def binding(
    binding_id: str,
    owner_ref: str,
    path: str,
    selector: str,
) -> dict[str, Any]:
    return {
        "binding_id": binding_id,
        "owner_ref": owner_ref,
        "artifact_ref": exact_ref(path),
        "selector": selector,
    }


def replace_current_refs(value: Any) -> None:
    if isinstance(value, dict):
        if set(("path", "sha256", "size_bytes")).issubset(value):
            path = value.get("path")
            if path in {WORK_PACK, TASK, MANIFEST}:
                current = exact_ref(path)
                value.update(current)
        for child in value.values():
            replace_current_refs(child)
    elif isinstance(value, list):
        for child in value:
            replace_current_refs(child)


config = json.loads(SOURCE_CONFIG.read_text(encoding="utf-8"))
replace_current_refs(config)
manifest = json.loads((ROOT / MANIFEST).read_text(encoding="utf-8"))
ts001b = manifest["swus"][8]
if not (
    manifest["nearest_candidate"] == "SWU-APE-ENUM-TS-001B"
    and ts001b["swu_id"] == "SWU-APE-ENUM-TS-001B"
    and len(ts001b["validation_contracts"]) == 3
):
    raise SystemExit("current manifest does not expose the complete TS001B contract")

config["audit_id"] = "ape-swu-ape-enum-ts-001b-goal-20260806T010816Z"
config["authority_bindings"] = {
    "canonical_authority_refs": [
        binding(
            "ape-canonical-enum-profile-activation-handle",
            "ape-plan-owner",
            MANIFEST,
            "/swus/8/source_anchors",
        )
    ],
    "semantic_bindings": {
        "owner": binding(
            "ape-semantic-owner-ts001b",
            "typescript-architecture-profile-owner",
            MANIFEST,
            "/swus/8/owner_validation",
        ),
        "material": binding(
            "ape-semantic-material-ts001b",
            "ape-plan-owner",
            MANIFEST,
            "/swus/8/write_scope",
        ),
        "validation": binding(
            "ape-semantic-validation-ts001b",
            "ape-plan-owner",
            MANIFEST,
            "/swus/8/validation_contracts",
        ),
        "receipt": binding(
            "ape-semantic-receipt-ts001b",
            "task-session",
            MANIFEST,
            "/swus/8/expected_receipt",
        ),
        "closeout": binding(
            "ape-semantic-closeout-ts001b",
            "task-session",
            MANIFEST,
            "/common_closeout_contract",
        ),
    },
}

config["execution_bindings"].append(
    {
        "task_id": ts001b["parent_task"],
        "swu_id": ts001b["swu_id"],
        "unit_id": ts001b["swu_id"],
        "lifecycle_owner": "projects/domainspec-v2",
        "authority_class": "private",
        "publication_class": "internal",
        "dependencies": ts001b["depends_on"],
        "canonical_successors": [ts001b["successor"]],
        "command": {
            "argv": ts001b["validation_contracts"][0]["argv"],
            "cwd": ".",
            "risk_class": "read-only",
        },
        "validation_contracts": ts001b["validation_contracts"],
        "attempt_contract": {
            "id_policy": "attempt-id-equals-task-session-run-id",
            "collision_policy": "reject-existing-different-attempt",
            "success_teardown": "retain-terminal-receipt-profile-and-fixture-evidence",
            "failure_teardown": "retain-block-receipt-and-bounded-profile-evidence",
        },
        "material_writes": ts001b["write_scope"],
        "execution_outputs": [TS001B_RECEIPT],
        "allowed_writes": ts001b["write_scope"] + [TS001B_RECEIPT],
        "material_package": {
            "package_ref": None,
            "producer_owner_ref": "task-session:selected-unit-materialization",
            "producer_receipt_ref": None,
            "schema_ref": None,
            "declared_sha256": None,
            "target_inventory_ref": None,
        },
        "byte_baselines": [],
    }
)

config["receipt_bindings"] = copy.deepcopy(config["receipt_bindings"])
config["receipt_bindings"]["terminal_schema_ref"] = binding(
    "ape-terminal-receipt-shape-ts001b",
    "task-session",
    MANIFEST,
    "/expected_result_shape",
)
config["receipt_bindings"]["semantic_validator_ref"] = binding(
    "ape-terminal-semantic-validator-ts001b",
    "typescript-architecture-profile-owner",
    MANIFEST,
    "/swus/8/owner_validation",
)
config["receipt_bindings"]["expected_receipt_refs"].append(
    binding(
        "ape-expected-terminal-receipt-swu-enum-ts-001b",
        "task-session",
        MANIFEST,
        "/swus/8/expected_receipt",
    )
)
config["closeout_bindings"].append(
    {
        "unit_id": "SWU-APE-ENUM-TS-001B",
        "allowed_delta_policy_ref": binding(
            "ape-allowed-delta-policy-swu-enum-ts-001b",
            "ape-plan-owner",
            MANIFEST,
            "/swus/8/admitted_delta_classes",
        ),
        "owner_receipt_contract_ref": binding(
            "ape-owner-receipt-contract-swu-enum-ts-001b",
            "typescript-architecture-profile-owner",
            MANIFEST,
            "/swus/8/owner_validation",
        ),
        "compensation": {
            "mode": "none",
            "rationale": "TS001B updates one candidate profile and its focused fixtures, then retains exact deterministic evidence for either terminal result.",
        },
    }
)

completed = config["continuity_projection"]["completed_unit_receipt_refs"]
completed.append(
    {
        "binding_id": "ape-completed-swu-ape-enum-ts-001a",
        "owner_ref": "task-session",
        "artifact_ref": exact_ref(TS001A_RECEIPT),
        "selector": "/result",
    }
)
joined = config["continuity_projection"]["joined_closeout_receipt_refs"]
joined.append(
    {
        "binding_id": "ape-closeout-swu-ape-enum-ts-001a",
        "owner_ref": "task-session",
        "artifact_ref": exact_ref(TS001A_RECEIPT),
        "selector": "/lifecycle_owner_validation/status",
    }
)
config["continuity_projection"]["cursor"] = "SWU-APE-ENUM-TS-001B"
config["continuity_projection"]["projected_next_successor"] = {
    "unit_id": "SWU-APE-ENUM-TS-001B",
    "canonical_successor_ref": binding(
        "ape-canonical-successor-enum-ts-001b",
        "ape-plan-owner",
        MANIFEST,
        "/swus/7/successor",
    ),
    "projection_owner_ref": "work-pack-readiness-audit",
    "equivalence_validator_ref": binding(
        "ape-equivalence-validator-enum-ts-001b",
        "work-pack-readiness-audit",
        MANIFEST,
        "/swus/8/split_analysis",
    ),
    "continuation_router_verification_receipt_ref": binding(
        "ape-continuation-verification-enum-ts-001b",
        "continuation-router",
        TS001A_RECEIPT,
        "/continuation/next_candidate",
    ),
    "authority_effect": "none",
}

config["status_receipt_refs"]["mutation_runtime_ready_status"] = {
    "value": "pass",
    "owner_ref": "task-session",
    "receipt_ref": binding(
        "ape-status-mutation-runtime-enum-ts-001b",
        "task-session",
        TS001A_RECEIPT,
        "/result",
    ),
}
config["status_receipt_refs"]["audit_verdict"] = {
    "value": "pass",
    "owner_ref": "task-session",
    "receipt_ref": binding(
        "ape-status-audit-verdict-enum-ts-001b",
        "task-session",
        TS001A_RECEIPT,
        "/result",
    ),
}
config["lifecycle_status_refs"] = {
    "plan_artifact_status": {
        "value": "SWU-APE-ENUM-TS-001B",
        "owner_ref": "ape-plan-owner",
        "receipt_ref": binding(
            "ape-lifecycle-plan-status-ts001b",
            "ape-plan-owner",
            MANIFEST,
            "/nearest_candidate",
        ),
    },
    "audit_status": {
        "value": "pass",
        "owner_ref": "task-session",
        "receipt_ref": binding(
            "ape-lifecycle-audit-status-ts001b",
            "task-session",
            TS001A_RECEIPT,
            "/result",
        ),
    },
    "approval_status": {
        "value": "approved",
        "owner_ref": "operator",
        "receipt_ref": binding(
            "ape-lifecycle-approval-status-ts001b",
            "operator",
            APPROVAL,
            "/decision",
        ),
    },
    "chain_status": {
        "value": "SWU-APE-ENUM-TS-001B",
        "owner_ref": "task-session",
        "receipt_ref": binding(
            "ape-lifecycle-chain-status-ts001b",
            "task-session",
            TS001A_RECEIPT,
            "/continuation/next_candidate",
        ),
    },
}
config["approval_policy"] = {
    "approval_owner_ref": "operator",
    "decision_gate_receipt_ref": binding(
        "ape-plan-decision-state-enum-ts-001b",
        "operator",
        APPROVAL,
        "/decision",
    ),
    "run_budget": {"max_task_session_requests": 1},
    "risk_policy_ref": binding(
        "ape-risk-policy-ts001b",
        "ape-plan-owner",
        MANIFEST,
        "/swus/8/baseline_binding",
    ),
    "allowed_audit_verdicts": ["pass"],
    "allowed_flag_classes": [],
}

task_route = {
    "route_id": "task-session-swu-ape-enum-ts-001b",
    "frontier_swu": "SWU-APE-ENUM-TS-001B",
    "capability": "task-session",
    "mode": "execute",
    "target": "SWU-APE-ENUM-TS-001B",
    "write_scope": ts001b["write_scope"],
    "effect_class": "repository-local-reversible",
    "required_inputs": ts001b["pre_execution_inputs"],
    "expected_receipt": TS001B_RECEIPT,
}
routes = [task_route]
config["execution_policy"] = {
    "work_pack_id": WORK_PACK,
    "route_policy": "automatic-in-scope",
    "allowed_routes": routes,
    "allowed_routes_digest": hashlib.sha256(
        json.dumps(routes, separators=(",", ":"), sort_keys=True).encode("utf-8")
    ).hexdigest(),
    "automatic_decisions": [
        "internal-tool-selection",
        "capability-owner-routing",
        "fresh-task-session-resumption",
    ],
    "stop_decisions": [
        "product-or-semantic-choice",
        "scope-expansion",
        "destructive-or-irreversible-effect",
        "failed-acceptance-critical-validation",
    ],
    "scope_source": "exact-work-pack-and-captured-frontier",
    "validation_policy": "owner-gates-remain-mandatory",
}

output = RUN_DIR / "audit-config.json"
output.write_text(
    json.dumps(config, indent=2, sort_keys=True) + "\n", encoding="utf-8"
)
print(output.relative_to(ROOT).as_posix())
