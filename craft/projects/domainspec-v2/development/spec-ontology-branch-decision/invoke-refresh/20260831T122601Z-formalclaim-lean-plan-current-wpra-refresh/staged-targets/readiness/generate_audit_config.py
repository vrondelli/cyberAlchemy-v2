#!/usr/bin/env python3
"""Generate the exact WPRA v2 projection from run-local Plan artifacts."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


REPO = Path(__file__).resolve().parents[7]
RUN = Path("projects/domainspec-v2/development/spec-ontology-branch-decision/invoke-plan/20260824T165704Z-formalclaim-lean-evf-implementation")
ABS_RUN = REPO / RUN
DESIGN_ACCEPTANCE = Path("projects/domainspec-v2/development/spec-ontology-branch-decision/invoke-design/20260824T150641Z-formalclaim-lean-evf-integration/owner-admission/RONDELLI-DESIGN-ACCEPTANCE.json")
TERMINAL_SCHEMA = Path("arcanum/arcana/task-session/schemas/governance-terminal-receipt.schema.json")
TERMINAL_VALIDATOR = Path("arcanum/arcana/task-session/scripts/plan-once-material-controller.py")
PRECLOSEOUT_SCHEMA = Path("arcanum/arcana/task-session/schemas/precloseout-execution-receipt.schema.json")
OWNER_CLOSEOUT_SCHEMA = Path("arcanum/spells/invoke/schemas/precloseout-refresh-closeout-receipt.schema.json")
CONTINUITY_SCHEMA = Path("arcanum/arcana/task-session/continuity.schema.json")
CONTINUATION_SCHEMA = Path("arcanum/arcana/continuation-router/schemas/continuation-route.schema.json")
SWU1_RECEIPT = Path("projects/domainspec-v2/development/spec-ontology-branch-decision/evidence/formalclaim-lean-evf/SWU-FCL-001/RECEIPT.json")
SWU1_OWNER_RECEIPT = Path("projects/domainspec-v2/development/spec-ontology-branch-decision/evidence/formalclaim-lean-evf/SWU-FCL-001/task-session/ts-fcl-001-20260824t181605z/INVOKE-REFRESH-CLOSEOUT-RECEIPT.json")
SWU1_OWNER_SCHEMA = Path("projects/domainspec-v2/development/spec-ontology-branch-decision/evidence/formalclaim-lean-evf/SWU-FCL-001/task-session/ts-fcl-001-20260824t181605z/INVOKE-REFRESH-CLOSEOUT-RECEIPT.schema.json")
SWU1_CURSOR = Path("projects/domainspec-v2/development/spec-ontology-branch-decision/evidence/formalclaim-lean-evf/SWU-FCL-001/task-session/ts-fcl-001-20260824t181605z/OBSERVATION.json")


def exact(path: Path) -> dict[str, object]:
    data = (REPO / path).read_bytes()
    return {"path": path.as_posix(), "sha256": hashlib.sha256(data).hexdigest(), "size_bytes": len(data)}


def binding(binding_id: str, owner: str, path: Path, selector: str) -> dict[str, object]:
    return {"binding_id": binding_id, "owner_ref": owner, "artifact_ref": exact(path), "selector": selector}


def main() -> int:
    manifest = json.loads((ABS_RUN / "work-pack/SWU-MANIFEST.json").read_text())
    entry = json.loads((ABS_RUN / "EXECUTION-ENTRY.json").read_text())
    audit_bindings_path = RUN / "readiness/AUDIT-BINDINGS.json"
    design_ref = exact(DESIGN_ACCEPTANCE)
    audit_ref = exact(audit_bindings_path)

    task_paths = {p.stem.split("-", 2)[-1]: p for p in (ABS_RUN / "work-pack/tasks").glob("*.md")}
    execution = []
    closeouts = []
    expected = []
    typed_closeouts = []
    routes = {r["frontier_swu"]: r for r in entry["execution_policy"]["allowed_routes"]}

    for unit in manifest["units"]:
        swu = unit["swu_id"]
        validation_path = RUN / f"work-pack/shared/validation-contracts/{swu}-VALIDATION.json"
        validation = json.loads((REPO / validation_path).read_text())
        route = routes[swu]
        task_matches = sorted((ABS_RUN / "work-pack/tasks").glob(f"*{unit['task_id'].removeprefix('TASK-FCL-')}*.md"))
        task_path = task_matches[0] if task_matches else next(p for p in (ABS_RUN / "work-pack/tasks").glob("*.md") if unit["task_id"] in p.read_text())
        task_rel = task_path.relative_to(REPO)
        receipt = route["expected_receipt"]
        outputs = [receipt]
        material = list(unit["material_writes"])
        producer_id = f'task-session:{swu.lower()}'
        all_outputs = material + outputs
        target_dispositions = []
        output_contracts = []
        byte_baselines = []
        for path_value in all_outputs:
            existing = (REPO / path_value).is_file()
            disposition = 'update' if existing else 'create'
            target_dispositions.append({
                'path': path_value,
                'disposition': disposition,
                'producer_id': producer_id,
                'parent_path': Path(path_value).parent.as_posix(),
                'collision_policy': 'replace-declared' if existing else 'fail-if-exists',
                'baseline_obligation': 'required-at-admission' if existing else 'none',
            })
            if existing:
                byte_baselines.append({'path': path_value, 'sha256': hashlib.sha256((REPO / path_value).read_bytes()).hexdigest()})
            output_contracts.append({
                'expected_path': path_value,
                'disposition': disposition,
                'producer_id': producer_id,
                'schema_ref': None,
                'semantic_predicate': f"{swu} structured post-produce validation accepts this {'material' if path_value in material else 'execution'} output",
                'failure_behavior': 'block-before-successor',
                'validation_phase': 'post-produce',
            })
        execution.append({
            "task_id": unit["task_id"],
            "swu_id": swu,
            "lifecycle_owner": "task-session",
            "authority_class": "private",
            "publication_class": "private",
            "attempt_contract": {
                "id_policy": "attempt-id-equals-fresh-task-session-run-id",
                "collision_policy": "all-declared-targets-absent-or-exact-separately-accepted-baseline",
                "success_teardown": "retain-material-postimage-terminal-receipt-and-refresh-closeout",
                "failure_teardown": "retain-first-failure-and-terminal-block-receipt-without-status-masking"
            },
            "unit_id": swu,
            "dependencies": unit["dependencies"],
            "canonical_successors": [unit["successor"]],
            "producer_id": producer_id,
            "target_dispositions": target_dispositions,
            "command": {"argv":["task-session","--from",str(RUN / "WORK-PACK.md"),"--task",unit["task_id"],"--swu",swu,"--runtime","codex"],"cwd":".","risk_class":"bounded-write"},
            "validation_contracts": [{**row, "phase": "post-produce"} for row in validation["validation_commands"]],
            "output_contracts": output_contracts,
            "material_writes": material,
            "execution_outputs": outputs,
            "allowed_writes": material + outputs,
            "material_package": {"package_ref":None,"producer_owner_ref":"task-session","producer_receipt_ref":None,"schema_ref":None,"declared_sha256":None,"target_inventory_ref":None},
            "byte_baselines": byte_baselines
        })
        expected.append(binding(f"expected-{swu.lower()}", "task-session", audit_bindings_path, f"/expected_receipts/{swu}"))
        typed_closeouts.append({
            'unit_id': swu,
            'receipt_profile': 'precloseout-execution-v1',
            'precloseout_execution_schema_ref': binding(f'{swu.lower()}-precloseout-execution-schema', 'task-session', PRECLOSEOUT_SCHEMA, ''),
            'expected_owner_receipt_schema_ref': binding(f'{swu.lower()}-expected-owner-receipt-schema', 'invoke', OWNER_CLOSEOUT_SCHEMA, ''),
            'declared_owner_receipt_schema_identity': 'invoke.precloseout-refresh-closeout-receipt.v1',
            'final_terminal_schema_ref': binding(f'{swu.lower()}-final-terminal-schema', 'task-session', TERMINAL_SCHEMA, ''),
            'continuity_schema_ref': binding(f'{swu.lower()}-continuity-schema', 'task-session', CONTINUITY_SCHEMA, ''),
            'continuation_router_schema_ref': binding(f'{swu.lower()}-continuation-router-schema', 'continuation-router', CONTINUATION_SCHEMA, ''),
        })
        closeouts.append({
            "unit_id": swu,
            "allowed_delta_policy_ref": binding(f"closeout-deltas-{swu.lower()}", "invoke", audit_bindings_path, "/closeout_contract/allowed_delta_classes"),
            "owner_receipt_contract_ref": binding(f"closeout-contract-{swu.lower()}", "invoke", audit_bindings_path, "/closeout_contract"),
            "compensation": {"mode":"none","rationale":"Readiness executes no SWU; later Task Session rollback is unit-owned and exact."}
        })

    def status(name: str, value: str, owner: str) -> dict[str, object]:
        return {"value":value,"owner_ref":owner,"receipt_ref":binding(f"status-{name.replace('_','-')}","invoke",audit_bindings_path,f"/status/{name}")}

    config = {
        "schema_version": "2.0.0",
        "admission_timing": "selected-unit-at-task-session",
        "audit_id": "DS-FORMALCLAIM-LEAN-EVF-READINESS-20260824T165704Z-CURRENT-WPRA-20260831T122601Z",
        "repository_root": ".",
        "evidence_ceiling": "frozen-input-contractual-readiness",
        "classifier_version": "wpra-plan-semantics-1.0.0",
        "objective_ref": binding("objective-formalclaim-lean-evf", "invoke", audit_bindings_path, "/objective"),
        "closure_receipt_refs": [{"binding_id":"accepted-design-closure","owner_ref":"Rondelli","artifact_ref":design_ref,"selector":"/design_status"}],
        "authority_bindings": {
            "canonical_authority_refs": [{"binding_id":"accepted-design-authority","owner_ref":"Rondelli","artifact_ref":design_ref,"selector":"/implementation_authorization/status"}],
            "semantic_bindings": {
                "owner": binding("semantic-owner","Rondelli",audit_bindings_path,"/objective/plan_acceptance_owner"),
                "material": binding("semantic-material","task-session",audit_bindings_path,"/material_policy"),
                "validation": binding("semantic-validation","task-session",audit_bindings_path,"/validation_policy"),
                "receipt": binding("semantic-receipt","task-session",audit_bindings_path,"/receipt_contract"),
                "closeout": binding("semantic-closeout","invoke",audit_bindings_path,"/closeout_contract")
            }
        },
        "execution_bindings": execution,
        "receipt_bindings": {
            "terminal_schema_ref": binding("task-session-terminal-schema","task-session",TERMINAL_SCHEMA,""),
            "semantic_validator_ref": {"binding_id":"task-session-terminal-semantic-validator","owner_ref":"task-session","binding_mode":"opaque-exact-artifact","artifact_ref":exact(TERMINAL_VALIDATOR)},
            "expected_receipt_refs": expected
        },
        "closeout_bindings": closeouts,
        "task_session_closeout_contracts": typed_closeouts,
        "runtime_binding": {"requested_task_session_execution_mode":"routed-mutation","task_session_admission_receipt_ref":None},
        "status_receipt_refs": {
            "artifact_authored_status": status("artifact_authored","pass","invoke"),
            "registry_released_status": status("registry_released","not-granted","release-owner"),
            "mutation_runtime_ready_status": status("mutation_runtime_ready","false","task-session"),
            "audit_verdict": status("audit_verdict","pending","work-pack-readiness-audit")
        },
        "lifecycle_status_refs": {
            "plan_artifact_status": status("plan_artifact","pass","invoke"),
            "audit_status": status("audit","not-run","work-pack-readiness-audit"),
            "approval_status": status("approval","unapproved","decision-gate"),
            "chain_status": status("chain","not-started","implementation-readiness")
        },
        "approval_policy": {
            "approval_owner_ref":"Rondelli",
            "decision_gate_receipt_ref":{"binding_id":"design-planning-authorization","owner_ref":"Rondelli","artifact_ref":design_ref,"selector":"/implementation_authorization/status"},
            "run_budget":{"max_task_session_requests":14},
            "risk_policy_ref":binding("risk-policy","implementation-readiness",audit_bindings_path,"/risk_policy"),
            "allowed_audit_verdicts":["pass","flag"],
            "allowed_flag_classes":["observability-residue"]
        },
        "continuity_projection": {
            "cursor":"SWU-FCL-002",
            "completed_unit_receipt_refs":[{"binding_id":"completed-SWU-FCL-001","owner_ref":"task-session","artifact_ref":exact(SWU1_RECEIPT),"selector":"/result"}],
            "joined_closeout_receipt_refs":[{
                "evidence_profile":"task-session-joined-owner-closeout-v1",
                "binding_id":"joined-closeout-SWU-FCL-001",
                "owner_ref":"task-session",
                "terminal_receipt_ref":exact(SWU1_RECEIPT),
                "joined_owner_receipt_ref":exact(SWU1_OWNER_RECEIPT),
                "owner_receipt_schema_ref":{
                    "binding_id":"historical-owner-schema-SWU-FCL-001",
                    "owner_ref":"invoke",
                    "artifact_ref":exact(SWU1_OWNER_SCHEMA),
                    "selector":""
                },
                "continuation_cursor_ref":exact(SWU1_CURSOR)
            }],
            "projected_next_successor": {
                "unit_id":"SWU-FCL-002",
                "canonical_successor_ref":binding("canonical-frontier","invoke",audit_bindings_path,"/continuity/cursor"),
                "projection_owner_ref":"work-pack-readiness-audit",
                "equivalence_validator_ref":binding("continuity-equivalence","work-pack-readiness-audit",audit_bindings_path,"/continuity/equivalence"),
                "continuation_router_verification_receipt_ref":binding("continuation-frontier-verification","invoke",audit_bindings_path,"/continuity/verification"),
                "authority_effect":"none"
            }
        },
        "execution_policy": {
            "work_pack_id":entry["work_pack_id"],
            "route_policy":entry["execution_policy"]["route_policy"],
            "allowed_routes":entry["execution_policy"]["allowed_routes"],
            "allowed_routes_digest":entry["execution_policy"]["allowed_routes_digest"],
            "automatic_decisions":entry["execution_policy"]["automatic_decisions"],
            "stop_decisions":entry["execution_policy"]["stop_decisions"],
            "scope_source":entry["execution_policy"]["scope_source"],
            "validation_policy":entry["execution_policy"]["validation_policy"]
        }
    }
    output = ABS_RUN / "readiness/audit-config.json"
    output.write_text(json.dumps(config, indent=2, sort_keys=True) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
