#!/usr/bin/env python3
"""Generate the exact WPRA v2 projection from the E2 Plan contracts."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


REPO = Path(__file__).resolve().parents[7]
RUN = Path(
    "projects/domainspec-v2/development/meta-type-closure-epoch/"
    "invoke-plan/20260824T183501Z-meta-type-closure-e2"
)
ABS_RUN = REPO / RUN
DEFINE_RESULT = Path(
    "projects/domainspec-v2/development/meta-type-closure-epoch/"
    "invoke-define/20260824T183501Z-meta-type-closure-e2/DEFINE-RESULT.json"
)
IDENTITY_RESULT = Path(
    "projects/domainspec-v2/development/meta-type-closure-epoch/"
    "invoke-define/20260824T183501Z-meta-type-closure-e2/IDENTITY-DENOMINATOR-RESULT.json"
)
DESIGN_RESULT = Path(
    "projects/domainspec-v2/development/meta-type-closure-epoch/"
    "invoke-design/20260824T183501Z-meta-type-closure-e2/DESIGN-RESULT.json"
)
DESIGN_SELECTION = Path(
    "projects/domainspec-v2/development/meta-type-closure-epoch/"
    "invoke-design/20260824T183501Z-meta-type-closure-e2/DESIGN-SELECTION-RESULT.json"
)
TERMINAL_SCHEMA = Path(
    "arcanum/arcana/task-session/schemas/governance-terminal-receipt.schema.json"
)
TERMINAL_VALIDATOR = Path(
    "arcanum/arcana/task-session/scripts/plan-once-material-controller.py"
)
PRECLOSEOUT_SCHEMA = Path(
    "arcanum/arcana/task-session/schemas/precloseout-execution-receipt.schema.json"
)
OWNER_CLOSEOUT_SCHEMA = Path(
    "arcanum/spells/invoke/schemas/precloseout-refresh-closeout-receipt.schema.json"
)
CONTINUITY_SCHEMA = Path(
    "arcanum/spells/work-pack-readiness-audit/schemas/selection-handoff.schema.json"
)
CONTINUATION_ROUTER_SCHEMA = Path(
    "arcanum/arcana/continuation-router/schemas/continuation-route.schema.json"
)


def exact(path: Path) -> dict[str, object]:
    data = (REPO / path).read_bytes()
    return {
        "path": path.as_posix(),
        "sha256": hashlib.sha256(data).hexdigest(),
        "size_bytes": len(data),
    }


def binding(binding_id: str, owner: str, path: Path, selector: str) -> dict[str, object]:
    return {
        "binding_id": binding_id,
        "owner_ref": owner,
        "artifact_ref": exact(path),
        "selector": selector,
    }


def main() -> int:
    manifest = json.loads((ABS_RUN / "SWU-MANIFEST.json").read_text(encoding="utf-8"))
    contracts_doc = json.loads((ABS_RUN / "SWU-CONTRACTS.json").read_text(encoding="utf-8"))
    validations_doc = json.loads((ABS_RUN / "VALIDATION-CONTRACTS.json").read_text(encoding="utf-8"))
    entry = json.loads((ABS_RUN / "EXECUTION-ENTRY.json").read_text(encoding="utf-8"))
    audit_bindings_path = RUN / "readiness/AUDIT-BINDINGS.json"
    authorization_path = RUN / "CANONICAL-ORDER-AUTHORIZATION.json"
    routes = {route["frontier_swu"]: route for route in entry["execution_policy"]["allowed_routes"]}
    contracts = {contract["swu_id"]: contract for contract in contracts_doc["contracts"]}
    validations = {unit["unit_id"]: unit for unit in validations_doc["units"]}
    execution = []
    expected = []
    closeouts = []
    typed_closeouts = []

    for unit in manifest["units"]:
        swu = unit["swu_id"]
        route = routes[swu]
        contract = contracts[swu]
        validation = validations[swu]
        expected_receipt = contract["expected_receipt"]
        governance_outputs = [
            path
            for path in contract["write_scope"]
            if "/precloseout/" in path or "/receipts/" in path or "/closeouts/" in path
        ]
        if expected_receipt not in governance_outputs:
            raise SystemExit(f"expected receipt is not an execution output: {swu}")
        material = [path for path in contract["write_scope"] if path not in governance_outputs]
        validation_contracts = [
            {
                "command_id": command["command_id"],
                "argv": command["argv"],
                "cwd": command["cwd"],
                "timeout_seconds": command["timeout_seconds"],
                "max_output_bytes": command["max_output_bytes"],
            }
            for command in validation["commands"]
        ]
        task_id = Path(unit["task"]).stem
        successor = unit["successor"] if unit["successor"] is not None else "__complete__"
        execution.append(
            {
                "task_id": task_id,
                "swu_id": swu,
                "lifecycle_owner": "task-session",
                "authority_class": "private",
                "publication_class": "private",
                "attempt_contract": {
                    "id_policy": "attempt-id-equals-fresh-task-session-run-id",
                    "collision_policy": "all-declared-targets-absent-or-exact-separately-accepted-baseline",
                    "success_teardown": "retain-material-postimage-terminal-receipt-and-refresh-closeout",
                    "failure_teardown": "retain-first-failure-and-terminal-block-receipt-without-status-masking",
                },
                "unit_id": swu,
                "dependencies": unit["dependencies"],
                "canonical_successors": [successor],
                "command": {
                    "argv": [
                        "task-session",
                        "--from",
                        (RUN / "WORK-PACK.md").as_posix(),
                        "--task",
                        task_id,
                        "--swu",
                        swu,
                        "--runtime",
                        "codex",
                    ],
                    "cwd": ".",
                    "risk_class": "bounded-write",
                },
                "validation_contracts": validation_contracts,
                "material_writes": material,
                "execution_outputs": governance_outputs,
                "allowed_writes": contract["write_scope"],
                "material_package": {
                    "package_ref": None,
                    "producer_owner_ref": "task-session",
                    "producer_receipt_ref": None,
                    "schema_ref": None,
                    "declared_sha256": None,
                    "target_inventory_ref": None,
                },
                "byte_baselines": [],
            }
        )
        expected.append(
            binding(
                f"expected-{swu.lower()}",
                "task-session",
                audit_bindings_path,
                f"/expected_receipts/{swu}",
            )
        )
        closeouts.append(
            {
                "unit_id": swu,
                "allowed_delta_policy_ref": binding(
                    f"closeout-deltas-{swu.lower()}",
                    "invoke",
                    audit_bindings_path,
                    "/closeout_contract/allowed_delta_classes",
                ),
                "owner_receipt_contract_ref": binding(
                    f"closeout-contract-{swu.lower()}",
                    "invoke",
                    audit_bindings_path,
                    "/closeout_contract",
                ),
                "compensation": {
                    "mode": "none",
                    "rationale": "Readiness executes no SWU; later Task Session rollback is unit-owned and exact.",
                },
            }
        )
        typed_closeouts.append(
            {
                "unit_id": swu,
                "receipt_profile": "precloseout-execution-v1",
                "precloseout_execution_schema_ref": binding(
                    f"precloseout-execution-schema-{swu.lower()}",
                    "task-session",
                    PRECLOSEOUT_SCHEMA,
                    "",
                ),
                "expected_owner_receipt_schema_ref": binding(
                    f"invoke-refresh-owner-schema-{swu.lower()}",
                    "invoke",
                    OWNER_CLOSEOUT_SCHEMA,
                    "",
                ),
                "declared_owner_receipt_schema_identity": "invoke.precloseout-refresh-closeout-receipt.v1",
                "final_terminal_schema_ref": binding(
                    f"final-terminal-schema-{swu.lower()}",
                    "task-session",
                    TERMINAL_SCHEMA,
                    "",
                ),
                "continuity_schema_ref": binding(
                    f"continuity-schema-{swu.lower()}",
                    "work-pack-readiness-audit",
                    CONTINUITY_SCHEMA,
                    "",
                ),
                "continuation_router_schema_ref": binding(
                    f"continuation-router-schema-{swu.lower()}",
                    "continuation-router",
                    CONTINUATION_ROUTER_SCHEMA,
                    "",
                ),
            }
        )

    def status(name: str, value: str, owner: str) -> dict[str, object]:
        return {
            "value": value,
            "owner_ref": owner,
            "receipt_ref": binding(
                f"status-{name.replace('_', '-')}",
                owner,
                audit_bindings_path,
                f"/status/{name}",
            ),
        }

    config = {
        "schema_version": "2.0.0",
        "admission_timing": "selected-unit-at-task-session",
        "audit_id": "WP-MTC-001-E2-READINESS-20260824T183501Z",
        "repository_root": ".",
        "evidence_ceiling": "frozen-input-contractual-readiness",
        "classifier_version": "wpra-plan-semantics-1.0.0",
        "expected_source_snapshot_digest": None,
        "expected_semantic_digest": "1794ccd1388c99700218edfde6b7876470a2d42cd02bf28d31df11c8a3346249",
        "objective_ref": binding("objective-wp-mtc-001-e2", "invoke", audit_bindings_path, "/objective"),
        "closure_receipt_refs": [
            binding("define-e2-closure", "invoke", DEFINE_RESULT, "/phase_status"),
            binding("identity-e2-closure", "invoke", IDENTITY_RESULT, "/verdict"),
            binding("design-e2-closure", "invoke", DESIGN_RESULT, "/phase_status"),
        ],
        "authority_bindings": {
            "canonical_authority_refs": [
                binding("design-selection-e2-authority", "invoke", DESIGN_SELECTION, "/verdict")
            ],
            "semantic_bindings": {
                "owner": binding("semantic-owner", "Rondelli", audit_bindings_path, "/objective/plan_acceptance_owner"),
                "material": binding("semantic-material", "task-session", audit_bindings_path, "/material_policy"),
                "validation": binding("semantic-validation", "task-session", audit_bindings_path, "/validation_policy"),
                "receipt": binding("semantic-receipt", "task-session", audit_bindings_path, "/receipt_contract"),
                "closeout": binding("semantic-closeout", "invoke", audit_bindings_path, "/closeout_contract"),
            },
        },
        "execution_bindings": execution,
        "receipt_bindings": {
            "terminal_schema_ref": binding("task-session-terminal-schema", "task-session", TERMINAL_SCHEMA, ""),
            "semantic_validator_ref": {
                "binding_id": "task-session-terminal-semantic-validator",
                "owner_ref": "task-session",
                "binding_mode": "opaque-exact-artifact",
                "artifact_ref": exact(TERMINAL_VALIDATOR),
            },
            "expected_receipt_refs": expected,
        },
        "closeout_bindings": closeouts,
        "task_session_closeout_contracts": typed_closeouts,
        "runtime_binding": {
            "requested_task_session_execution_mode": "routed-mutation",
            "task_session_admission_receipt_ref": None,
        },
        "status_receipt_refs": {
            "artifact_authored_status": status("artifact_authored", "pass", "invoke"),
            "registry_released_status": status("registry_released", "not-granted", "release-owner"),
            "mutation_runtime_ready_status": status("mutation_runtime_ready", "false", "task-session"),
            "audit_verdict": status("audit_verdict", "pending", "work-pack-readiness-audit"),
        },
        "lifecycle_status_refs": {
            "plan_artifact_status": status("plan_artifact", "pass", "invoke"),
            "audit_status": status("audit", "not-run", "work-pack-readiness-audit"),
            "approval_status": status("approval", "unapproved", "decision-gate"),
            "chain_status": status("chain", "not-started", "implementation-readiness"),
        },
        "approval_policy": {
            "approval_owner_ref": "Rondelli",
            "decision_gate_receipt_ref": binding("canonical-order-authorization", "Rondelli", authorization_path, "/status"),
            "run_budget": {"max_task_session_requests": 7},
            "risk_policy_ref": binding("risk-policy", "implementation-readiness", audit_bindings_path, "/risk_policy"),
            "allowed_audit_verdicts": ["pass"],
            "allowed_flag_classes": [],
        },
        "continuity_projection": {
            "cursor": "SWU-MTC-000",
            "completed_unit_receipt_refs": [],
            "joined_closeout_receipt_refs": [],
            "projected_next_successor": {
                "unit_id": "SWU-MTC-000",
                "canonical_successor_ref": binding("canonical-frontier", "invoke", audit_bindings_path, "/continuity/cursor"),
                "projection_owner_ref": "work-pack-readiness-audit",
                "equivalence_validator_ref": binding("continuity-equivalence", "work-pack-readiness-audit", audit_bindings_path, "/continuity/equivalence"),
                "continuation_router_verification_receipt_ref": binding("continuation-frontier-verification", "invoke", audit_bindings_path, "/continuity/verification"),
                "authority_effect": "none",
            },
        },
        "execution_policy": {
            key: entry["execution_policy"][key]
            for key in (
                "work_pack_id",
                "route_policy",
                "allowed_routes",
                "allowed_routes_digest",
                "automatic_decisions",
                "stop_decisions",
                "scope_source",
                "validation_policy",
            )
            if key in entry["execution_policy"] or key != "work_pack_id"
        },
    }
    config["execution_policy"]["work_pack_id"] = entry["work_pack_id"]
    output = ABS_RUN / "readiness/audit-config.json"
    output.write_text(json.dumps(config, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
