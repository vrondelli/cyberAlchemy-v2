#!/usr/bin/env python3
"""Validate the Goals D65 prototype-construction consumer slice."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
REGISTRY_PATH = PACKAGE_ROOT / "bindings/construction-bindings.json"
UPSTREAM_CONSTRUCTIONS_PATH = REPOSITORY_ROOT / "cyberAlchemy-v2/ontology/governance/prototype-constructions.json"
UPSTREAM_SCAFFOLDS_PATH = REPOSITORY_ROOT / "cyberAlchemy-v2/ontology/governance/ontology-scaffolds.json"
EXPECTED_CONSTRUCTION_ID = "GOV-D65-R2-PROTOTYPE-CONSTRUCTION-001"
EXPECTED_SCAFFOLD_ID = "GOV-D65-R2-SCAFFOLD-001"


def load(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"{path} must contain one object")
    return value


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def validate_documents(
    registry: dict[str, Any],
    projects: dict[str, dict[str, Any]],
    goals: dict[str, dict[str, Any]],
    upstream: dict[str, Any],
    scaffolds: dict[str, Any],
) -> list[str]:
    errors: list[str] = []
    expected_registry_keys = {
        "schema_ref", "schema_version", "registry_id", "canonical_definition_ref",
        "canonical_schema_ref", "governance_invariant_ref", "operational_rule_ref",
        "upstream_contract_registry_ref", "upstream_scaffold_registry_ref",
        "record_owner_rule", "status", "validation_mode", "bindings", "residue_refs",
        "claim_ceiling", "authority_effect", "enforcement_effect", "implementation_effect",
    }
    if set(registry) != expected_registry_keys:
        errors.append("construction registry keys do not match the v2 contract")
    expected_identity = {
        "schema_version": "cav2-project-construction-binding-registry/v3",
        "registry_id": "cav2.project.construction-bindings",
        "canonical_definition_ref": "CAV2-D65",
        "canonical_schema_ref": "CAV2-D65-SCHEMA",
        "governance_invariant_ref": "GOV-INV-CAV2-D65",
        "operational_rule_ref": "GOV-RULE-D65-CONSTRUCTION-STAGES-COMPLETE",
        "status": "prototype-active",
        "validation_mode": "prototype",
    }
    for key, expected in expected_identity.items():
        if registry.get(key) != expected:
            errors.append(f"construction registry {key} is not {expected}")
    for key in ("authority_effect", "enforcement_effect", "implementation_effect"):
        if registry.get(key) != "none":
            errors.append(f"construction registry {key} must be none")

    upstream_rows = upstream.get("constructions", [])
    upstream_by_id = {
        row.get("construction_id"): row for row in upstream_rows if isinstance(row, dict)
    }
    scaffold_rows = scaffolds.get("scaffolds", [])
    scaffold_by_id = {
        row.get("scaffold_id"): row for row in scaffold_rows if isinstance(row, dict)
    }
    selected_upstream = upstream_by_id.get(EXPECTED_CONSTRUCTION_ID)
    selected_scaffold = scaffold_by_id.get(EXPECTED_SCAFFOLD_ID)
    if not selected_upstream:
        errors.append("selected upstream D65 prototype construction does not resolve")
    if not selected_scaffold:
        errors.append("selected upstream D65 ontology scaffold does not resolve")
    if selected_scaffold and selected_scaffold.get("canonicality") != "non-authoritative":
        errors.append("selected ontology scaffold must remain non-authoritative")

    bindings = registry.get("bindings")
    if not isinstance(bindings, list) or not bindings:
        errors.append("prototype construction registry must be non-vacuous")
        return errors
    construction_ids: set[str] = set()
    owned_by_project: dict[str, set[str]] = {}
    expected_stage_keys = {
        "definition_prototypes", "ontology_scaffolds", "product_capability",
        "business_ontology", "domainspec_source", "compiled_graph", "system_ontology",
        "implementation", "testable_product_candidate", "product_test_evidence",
        "product_approval",
    }
    stage_order = [
        "definition_prototypes", "ontology_scaffolds", "product_capability",
        "business_ontology", "domainspec_source", "compiled_graph",
        "system_ontology", "implementation", "testable_product_candidate",
        "product_test_evidence", "product_approval",
    ]
    completed_states = {
        "definition_prototypes": {"prototype", "tested"},
        "ontology_scaffolds": {"prototype", "tested"},
        "product_capability": {"prototype", "tested"},
        "business_ontology": {"prototype", "tested"},
        "domainspec_source": {"prototype", "tested"},
        "compiled_graph": {"prototype", "tested"},
        "system_ontology": {"prototype", "tested"},
        "implementation": {"prototype", "tested"},
        "testable_product_candidate": {"frozen"},
        "product_test_evidence": {"passing"},
        "product_approval": {"approved"},
    }
    for index, binding in enumerate(bindings):
        label = f"construction bindings[{index}]"
        if not isinstance(binding, dict):
            errors.append(f"{label} must be an object")
            continue
        construction_id = binding.get("construction_id")
        if not isinstance(construction_id, str) or construction_id in construction_ids:
            errors.append(f"{label} construction_id is missing or duplicated")
        else:
            construction_ids.add(construction_id)
        if binding.get("binding_kind") != "project-prototype-construction":
            errors.append(f"{label} binding_kind is invalid")
        project_ref = binding.get("project_ref")
        if project_ref not in projects:
            errors.append(f"{label} project_ref does not resolve")
        elif isinstance(construction_id, str):
            owned_by_project.setdefault(project_ref, set()).add(construction_id)
        goal_refs = binding.get("goal_refs")
        if not isinstance(goal_refs, list) or not goal_refs:
            errors.append(f"{label} goal_refs must be non-empty")
        else:
            for goal_ref in goal_refs:
                goal = goals.get(goal_ref)
                if not goal or goal.get("project_ref") != project_ref:
                    errors.append(f"{label} goal_ref {goal_ref} does not resolve within its Project")

        contract = binding.get("prototype_contract", {})
        if not isinstance(contract, dict):
            errors.append(f"{label} prototype_contract must be an object")
            contract = {}
        if contract.get("construction_ref") != EXPECTED_CONSTRUCTION_ID:
            errors.append(f"{label} construction_ref does not select the tested D65 contract")
        if contract.get("ontology_scaffold_ref") != EXPECTED_SCAFFOLD_ID:
            errors.append(f"{label} ontology_scaffold_ref does not select the D65 scaffold")
        if selected_upstream:
            candidate = selected_upstream.get("testable_product_candidate", {})
            if contract.get("testable_product_candidate_ref") != candidate.get("candidate_id"):
                errors.append(f"{label} candidate identity does not match upstream")
            if contract.get("candidate_manifest_sha256") != candidate.get("manifest_sha256"):
                errors.append(f"{label} candidate manifest does not match upstream")
            if selected_upstream.get("state") != "tested" or contract.get("contract_test_state") != "tested":
                errors.append(f"{label} may bind only the tested upstream contract")
            if selected_upstream.get("product_approval") is not None:
                errors.append("upstream product approval must remain absent for this prototype binding")
            if selected_upstream.get("authority_requests") != []:
                errors.append("upstream authority requests must remain empty for this prototype binding")
        if contract.get("product_approval_state") != "absent":
            errors.append(f"{label} product approval must remain absent")
        if contract.get("authority_request_eligibility") != "not_eligible":
            errors.append(f"{label} authority requests must remain ineligible")
        if binding.get("authority_request_refs") != []:
            errors.append(f"{label} may not contain preapproval authority requests")
        if binding.get("authority_effect") != "none":
            errors.append(f"{label} authority_effect must be none")

        stages = binding.get("stage_states")
        stage_evidence_rows = binding.get("project_stage_evidence", [])
        if not isinstance(stage_evidence_rows, list):
            errors.append(f"{label} project_stage_evidence must be an array")
            stage_evidence_rows = []
        stage_evidence: dict[str, dict[str, Any]] = {}
        for evidence_index, evidence in enumerate(stage_evidence_rows):
            evidence_label = f"{label} project_stage_evidence[{evidence_index}]"
            if not isinstance(evidence, dict):
                errors.append(f"{evidence_label} must be an object")
                continue
            stage = evidence.get("stage")
            if not isinstance(stage, str) or stage in stage_evidence:
                errors.append(f"{evidence_label} stage is missing or duplicated")
                continue
            stage_evidence[stage] = evidence
            expected_claimed_state = {
                "testable_product_candidate": "frozen",
                "product_test_evidence": "passing",
                "product_approval": "approved",
            }.get(stage, "tested")
            if evidence.get("claimed_state") != expected_claimed_state:
                errors.append(
                    f"{evidence_label} claimed_state must be {expected_claimed_state} for {stage}"
                )
            repository = evidence.get("repository")
            if repository != "/home/vrondelli/projects/CyberAlchemy-lab":
                errors.append(f"{evidence_label} repository is not the bound CyberAlchemy Lab repository")
                continue
            repository_root = Path(repository)
            candidate_path = repository_root / str(evidence.get("candidate_path", ""))
            receipt_path = repository_root / str(evidence.get("evidence_path", ""))
            if not candidate_path.is_file() or sha256(candidate_path) != evidence.get("candidate_sha256"):
                errors.append(f"{evidence_label} candidate bytes are missing or stale")
            if not receipt_path.is_file() or sha256(receipt_path) != evidence.get("evidence_sha256"):
                errors.append(f"{evidence_label} evidence bytes are missing or stale")
                continue
            try:
                receipt = load(receipt_path)
            except (OSError, ValueError, json.JSONDecodeError) as exc:
                errors.append(f"{evidence_label} evidence is unreadable: {exc}")
                continue
            if receipt.get("result") != evidence.get("required_result"):
                errors.append(f"{evidence_label} result does not match the required PASS")
            expected_receipt_state = {
                "testable_product_candidate": "TESTED_PRODUCT",
                "product_test_evidence": "TESTED_PRODUCT",
                "product_approval": "PRODUCT_APPROVED",
            }.get(stage, "TESTED_PROTOTYPE")
            if (
                evidence.get("required_stage_state") != expected_receipt_state
                or receipt.get("stage_state") != expected_receipt_state
            ):
                errors.append(
                    f"{evidence_label} stage state does not match {expected_receipt_state}"
                )
            expected_product_approval = "approved" if stage == "product_approval" else "not-requested"
            expected_authority_effect = "product-approval-only" if stage == "product_approval" else "none"
            if evidence.get("product_approval") != expected_product_approval or evidence.get("authority_effect") != expected_authority_effect:
                errors.append(f"{evidence_label} declared product approval or authority effect is invalid for {stage}")
            if receipt.get("product_approval") != expected_product_approval or receipt.get("authority_effect") != expected_authority_effect:
                errors.append(f"{evidence_label} product approval or authority effect is invalid for {stage}")
            if stage == "product_approval":
                try:
                    approval = load(candidate_path)
                except (OSError, ValueError, json.JSONDecodeError) as exc:
                    errors.append(f"{evidence_label} approval decision is unreadable: {exc}")
                    continue
                if approval.get("decision_id") != binding.get("product_approval_ref"):
                    errors.append(f"{evidence_label} decision identity does not match product_approval_ref")
                if approval.get("selected_option", {}).get("option_id") != "D65PAPP-1":
                    errors.append(f"{evidence_label} does not bind D65PAPP-1")
                if receipt.get("implementation_admitted") is not False or receipt.get("cutover_authorized") is not False:
                    errors.append(f"{evidence_label} exceeds the product-approval authority ceiling")
        if not isinstance(stages, dict) or set(stages) != expected_stage_keys:
            errors.append(f"{label} stage_states do not match the prototype contract")
        else:
            if stages["definition_prototypes"] != "prototype" or stages["ontology_scaffolds"] != "prototype":
                errors.append(f"{label} must expose definition and ontology prototypes")
            for key in expected_stage_keys - {"definition_prototypes", "ontology_scaffolds"}:
                if stages[key] == "absent":
                    if key in stage_evidence:
                        errors.append(f"{label} stage {key} has evidence but remains absent")
                    continue
                evidence = stage_evidence.get(key)
                if not evidence or stages[key] != evidence.get("claimed_state"):
                    errors.append(f"{label} stage {key} exceeds current evidence")
            if stages["product_approval"] == "approved":
                if binding.get("product_approval_ref") is None:
                    errors.append(f"{label} approved product must name its exact decision")
            elif binding.get("product_approval_ref") is not None:
                errors.append(f"{label} may not name product approval before approval evidence")

        plan = binding.get("work_plan")
        if not isinstance(plan, dict):
            errors.append(f"{label} work_plan must be an object")
            plan = {}
        expected_plan_keys = {
            "schema_version", "product_stage_state_ref", "current_product_frontier",
            "operational_tasks", "continuation_status", "continuation_policy",
            "blocking_policy", "residue_policy", "authority_effect",
        }
        if set(plan) != expected_plan_keys:
            errors.append(f"{label} work_plan keys do not match the two-lane contract")
        expected_plan_values = {
            "schema_version": "cav2-d65-two-lane-construction-plan/v1",
            "product_stage_state_ref": "stage_states",
            "continuation_policy": "continue-dependency-ready-product-construction",
            "blocking_policy": "only-exact-frontier-prerequisite-or-applicable-boundary",
            "residue_policy": "defer-visible-operational-support",
            "authority_effect": "none",
        }
        for key, expected in expected_plan_values.items():
            if plan.get(key) != expected:
                errors.append(f"{label} work_plan {key} is not {expected}")
        frontier = None
        if isinstance(stages, dict) and set(stages) == expected_stage_keys:
            frontier = next(
                (stage for stage in stage_order if stages.get(stage) not in completed_states[stage]),
                None,
            )
        if plan.get("current_product_frontier") != frontier:
            errors.append(f"{label} work_plan frontier does not match stage_states")
        operational_tasks = plan.get("operational_tasks")
        if not isinstance(operational_tasks, list):
            errors.append(f"{label} operational_tasks must be an array")
            operational_tasks = []
        operational_ids: set[str] = set()
        operational_blocks_frontier = False
        allowed_basis = {
            "none", "exact-prerequisite", "safety-boundary", "privacy-boundary",
            "authority-boundary", "destructive-action-boundary",
            "credential-boundary", "external-effect-boundary",
        }
        for task_index, task in enumerate(operational_tasks):
            task_label = f"{label} operational_tasks[{task_index}]"
            if not isinstance(task, dict):
                errors.append(f"{task_label} must be an object")
                continue
            if set(task) != {
                "task_id", "lane", "state", "applies_to_stage", "blocking_basis",
                "detail", "owner_route", "authority_effect",
            }:
                errors.append(f"{task_label} keys do not match the operational-task contract")
            task_id = task.get("task_id")
            if not isinstance(task_id, str) or not task_id or task_id in operational_ids:
                errors.append(f"{task_label} task_id is missing or duplicated")
            else:
                operational_ids.add(task_id)
            if task.get("lane") != "operational-support":
                errors.append(f"{task_label} lane must be operational-support")
            state = task.get("state")
            if state not in {"pending", "blocked", "complete", "not_applicable"}:
                errors.append(f"{task_label} state is invalid")
            basis = task.get("blocking_basis")
            target = task.get("applies_to_stage")
            if basis not in allowed_basis:
                errors.append(f"{task_label} blocking_basis is invalid")
            if basis == "none" and target is not None:
                errors.append(f"{task_label} nonblocking task may not name a stage")
            if basis != "none" and target not in stage_order:
                errors.append(f"{task_label} blocking task must name one exact D65 stage")
            if task.get("authority_effect") != "none":
                errors.append(f"{task_label} authority_effect must be none")
            if state in {"pending", "blocked"} and basis != "none" and target == frontier:
                operational_blocks_frontier = True
        expected_continuation = (
            "complete" if frontier is None else
            "blocked" if operational_blocks_frontier else
            "runnable"
        )
        if plan.get("continuation_status") != expected_continuation:
            errors.append(
                f"{label} continuation_status must be {expected_continuation} for the exact frontier"
            )

    for project_id, project in projects.items():
        refs = project.get("construction_binding_refs", [])
        if set(refs) != owned_by_project.get(project_id, set()):
            errors.append(f"Project {project_id} construction binding refs do not close bidirectionally")
    return errors


def validate_current() -> tuple[list[str], int]:
    registry = load(REGISTRY_PATH)
    projects = {
        doc["project_id"]: doc
        for path in sorted((PACKAGE_ROOT / "projects").glob("*/project.json"))
        for doc in [load(path)]
    }
    goals = {
        doc["goal_id"]: doc
        for path in sorted((PACKAGE_ROOT / "projects").glob("*/goals/*.goal.json"))
        for doc in [load(path)]
    }
    upstream = load(UPSTREAM_CONSTRUCTIONS_PATH)
    scaffolds = load(UPSTREAM_SCAFFOLDS_PATH)
    errors = validate_documents(registry, projects, goals, upstream, scaffolds)
    source_checks = (
        ("upstream_contract_registry_ref", UPSTREAM_CONSTRUCTIONS_PATH),
        ("upstream_scaffold_registry_ref", UPSTREAM_SCAFFOLDS_PATH),
    )
    for key, path in source_checks:
        ref = registry.get(key, {})
        if not isinstance(ref, dict) or ref.get("sha256") != sha256(path):
            errors.append(f"{key} exact source digest drift")
    return errors, len(registry.get("bindings", [])) if isinstance(registry.get("bindings"), list) else 0


def main() -> int:
    try:
        errors, count = validate_current()
        registry = load(REGISTRY_PATH)
    except (OSError, ValueError, KeyError, json.JSONDecodeError) as exc:
        errors, count, registry = [str(exc)], 0, {}
    result = {
        "schema_version": "cav2-goals-d65-prototype-binding-validation/v1",
        "status": "PASS" if not errors else "BLOCK",
        "construction_bindings": count,
        "product_approval": "approved" if not errors and any(
            binding.get("stage_states", {}).get("product_approval") == "approved"
            for binding in registry.get("bindings", []) if isinstance(binding, dict)
        ) else "absent",
        "authority_requests": 0,
        "authority_effect": "none",
        "errors": errors,
    }
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
