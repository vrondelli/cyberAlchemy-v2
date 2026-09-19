#!/usr/bin/env python3
"""Derive the TS001A finite-frontier audit configuration from TS001 evidence."""

from __future__ import annotations

import copy
import hashlib
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[7]
RUN_DIR = Path(__file__).resolve().parent
SOURCE_CONFIG = ROOT / (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "refreshes/20260805T205406Z-ts001-validation-contract-apply-approved/"
    "readiness/20260805T221111Z-continuity-repair/audit-config.json"
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
TS001_RECEIPT = (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "instances/enum/receipts/SWU-APE-ENUM-TS-001.json"
)
TS001A_RECEIPT = (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "instances/enum/receipts/SWU-APE-ENUM-TS-001A.json"
)
APPROVAL = (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "refreshes/20260805T233000Z-ts001a-readiness/APPROVAL-EVIDENCE.json"
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
ts001a = manifest["swus"][7]
if not (
    manifest["nearest_candidate"] == "SWU-APE-ENUM-TS-001A"
    and ts001a["swu_id"] == "SWU-APE-ENUM-TS-001A"
    and len(ts001a["validation_contracts"]) == 3
):
    raise SystemExit("current manifest does not expose the complete TS001A contract")

config["audit_id"] = "ape-swu-ape-enum-ts-001a-validation-repair-20260805T235000Z"
config["authority_bindings"] = {
    "canonical_authority_refs": [
        binding(
            "ape-canonical-enum-provider-handle",
            "ape-plan-owner",
            MANIFEST,
            "/swus/7/source_anchors",
        )
    ],
    "semantic_bindings": {
        "owner": binding(
            "ape-semantic-owner-ts001a",
            "typescript-runtime-owner",
            MANIFEST,
            "/swus/7/owner_validation",
        ),
        "material": binding(
            "ape-semantic-material-ts001a",
            "ape-plan-owner",
            MANIFEST,
            "/swus/7/write_scope",
        ),
        "validation": binding(
            "ape-semantic-validation-ts001a",
            "ape-plan-owner",
            MANIFEST,
            "/swus/7/validation_contracts",
        ),
        "receipt": binding(
            "ape-semantic-receipt-ts001a",
            "task-session",
            MANIFEST,
            "/swus/7/expected_receipt",
        ),
        "closeout": binding(
            "ape-semantic-closeout-ts001a",
            "task-session",
            MANIFEST,
            "/common_closeout_contract",
        ),
    },
}

config["execution_bindings"].append(
    {
        "task_id": ts001a["parent_task"],
        "swu_id": ts001a["swu_id"],
        "unit_id": ts001a["swu_id"],
        "lifecycle_owner": "projects/domainspec-v2",
        "authority_class": "private",
        "publication_class": "internal",
        "dependencies": ts001a["depends_on"],
        "canonical_successors": [ts001a["successor"]],
        "command": {
            "argv": ts001a["validation_contracts"][0]["argv"],
            "cwd": ".",
            "risk_class": "read-only",
        },
        "validation_contracts": ts001a["validation_contracts"],
        "attempt_contract": {
            "id_policy": "attempt-id-equals-task-session-run-id",
            "collision_policy": "reject-existing-different-attempt",
            "success_teardown": "retain-terminal-receipt-provider-and-test-evidence",
            "failure_teardown": "retain-block-receipt-and-bounded-test-evidence",
        },
        "material_writes": ts001a["write_scope"],
        "execution_outputs": [TS001A_RECEIPT],
        "allowed_writes": ts001a["write_scope"] + [TS001A_RECEIPT],
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
    "ape-terminal-receipt-shape-ts001a",
    "task-session",
    MANIFEST,
    "/expected_result_shape",
)
config["receipt_bindings"]["semantic_validator_ref"] = binding(
    "ape-terminal-semantic-validator-ts001a",
    "typescript-runtime-owner",
    MANIFEST,
    "/swus/7/owner_validation",
)
config["receipt_bindings"]["expected_receipt_refs"].append(
    binding(
        "ape-expected-terminal-receipt-swu-enum-ts-001a",
        "task-session",
        MANIFEST,
        "/swus/7/expected_receipt",
    )
)
config["closeout_bindings"].append(
    {
        "unit_id": "SWU-APE-ENUM-TS-001A",
        "allowed_delta_policy_ref": binding(
            "ape-allowed-delta-policy-swu-enum-ts-001a",
            "ape-plan-owner",
            MANIFEST,
            "/swus/7/admitted_delta_classes",
        ),
        "owner_receipt_contract_ref": binding(
            "ape-owner-receipt-contract-swu-enum-ts-001a",
            "typescript-runtime-owner",
            MANIFEST,
            "/swus/7/owner_validation",
        ),
        "compensation": {
            "mode": "none",
            "rationale": "TS001A creates an isolated provider/test subtree and append-only receipt; Task Session retains exact validation evidence for either terminal result.",
        },
    }
)

completed = config["continuity_projection"]["completed_unit_receipt_refs"]
completed.append(
    {
        "binding_id": "ape-completed-swu-ape-enum-ts-001",
        "owner_ref": "task-session",
        "artifact_ref": exact_ref(TS001_RECEIPT),
        "selector": "/result",
    }
)
joined = config["continuity_projection"]["joined_closeout_receipt_refs"]
joined.append(
    {
        "binding_id": "ape-closeout-swu-ape-enum-ts-001",
        "owner_ref": "task-session",
        "artifact_ref": exact_ref(TS001_RECEIPT),
        "selector": "/lifecycle_owner_validation/status",
    }
)
config["continuity_projection"]["cursor"] = "SWU-APE-ENUM-TS-001A"
config["continuity_projection"]["projected_next_successor"] = {
    "unit_id": "SWU-APE-ENUM-TS-001A",
    "canonical_successor_ref": binding(
        "ape-canonical-successor-enum-ts-001a",
        "ape-plan-owner",
        MANIFEST,
        "/swus/6/successor",
    ),
    "projection_owner_ref": "work-pack-readiness-audit",
    "equivalence_validator_ref": binding(
        "ape-equivalence-validator-enum-ts-001a",
        "work-pack-readiness-audit",
        MANIFEST,
        "/swus/7/split_analysis",
    ),
    "continuation_router_verification_receipt_ref": binding(
        "ape-continuation-verification-enum-ts-001a",
        "continuation-router",
        TS001_RECEIPT,
        "/continuation/next_candidate",
    ),
    "authority_effect": "none",
}

config["status_receipt_refs"]["mutation_runtime_ready_status"] = {
    "value": "pass",
    "owner_ref": "task-session",
    "receipt_ref": binding(
        "ape-status-mutation-runtime-enum-ts-001a",
        "task-session",
        TS001_RECEIPT,
        "/result",
    ),
}
config["status_receipt_refs"]["audit_verdict"] = {
    "value": "pass",
    "owner_ref": "task-session",
    "receipt_ref": binding(
        "ape-status-audit-verdict-enum-ts-001a",
        "task-session",
        TS001_RECEIPT,
        "/result",
    ),
}
config["lifecycle_status_refs"] = {
    "plan_artifact_status": {
        "value": "SWU-APE-ENUM-TS-001A",
        "owner_ref": "ape-plan-owner",
        "receipt_ref": binding(
            "ape-lifecycle-plan-status-ts001a",
            "ape-plan-owner",
            MANIFEST,
            "/nearest_candidate",
        ),
    },
    "audit_status": {
        "value": "pass",
        "owner_ref": "task-session",
        "receipt_ref": binding(
            "ape-lifecycle-audit-status-ts001a",
            "task-session",
            TS001_RECEIPT,
            "/result",
        ),
    },
    "approval_status": {
        "value": "approved",
        "owner_ref": "operator",
        "receipt_ref": binding(
            "ape-lifecycle-approval-status-ts001a",
            "operator",
            APPROVAL,
            "/decision",
        ),
    },
    "chain_status": {
        "value": "SWU-APE-ENUM-TS-001A",
        "owner_ref": "task-session",
        "receipt_ref": binding(
            "ape-lifecycle-chain-status-ts001a",
            "task-session",
            TS001_RECEIPT,
            "/continuation/next_candidate",
        ),
    },
}
config["approval_policy"] = {
    "approval_owner_ref": "operator",
    "decision_gate_receipt_ref": binding(
        "ape-plan-decision-state-enum-ts-001a",
        "operator",
        APPROVAL,
        "/decision",
    ),
    "run_budget": {"max_task_session_requests": 1},
    "risk_policy_ref": binding(
        "ape-risk-policy-ts001a",
        "ape-plan-owner",
        MANIFEST,
        "/swus/7/baseline_binding",
    ),
    "allowed_audit_verdicts": ["pass"],
    "allowed_flag_classes": [],
}

task_route = {
    "route_id": "task-session-swu-ape-enum-ts-001a",
    "frontier_swu": "SWU-APE-ENUM-TS-001A",
    "capability": "task-session",
    "mode": "execute",
    "target": "SWU-APE-ENUM-TS-001A",
    "write_scope": ts001a["write_scope"],
    "effect_class": "repository-local-reversible",
    "required_inputs": ts001a["pre_execution_inputs"],
    "expected_receipt": TS001A_RECEIPT,
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
