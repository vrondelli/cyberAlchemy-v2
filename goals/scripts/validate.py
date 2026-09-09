#!/usr/bin/env python3
"""Validate the private CyberAlchemy v2 Goal package and append a receipt."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from validate_prototype_construction_binding import validate_current as validate_d65_prototype_binding


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
BINDING_REGISTRY_PATH = "bindings/recursive-instance-bindings.json"
CONSTRUCTION_BINDING_REGISTRY_PATH = "bindings/construction-bindings.json"
BINDING_RESIDUE_PATH = "bindings/residue.json"
AUTHORITY_CLAIM_REGISTRY_PATH = "bindings/authority-claims.json"
INHERITED_CONTRACT_REGISTRY_PATH = "bindings/inherited-contracts.json"
ADOPTION_DECISION_CANDIDATE_REGISTRY_PATH = "bindings/adoption-decision-candidates.json"
ADOPTED_PARENT_CONTRACT_REGISTRY_PATH = "bindings/adopted-parent-contracts.json"
CONFORMANCE_ASSESSMENT_REGISTRY_PATH = "bindings/conformance-assessments.json"
RELATION_CANDIDATE_REGISTRY_PATH = "bindings/model-instance-relation-candidates.json"
ADMITTED_RELATION_REGISTRY_PATH = "bindings/admitted-model-instance-relations.json"
PROJECT_SCHEMA_AMENDMENT_PATH = "ontology/project-binding-schema-amendment.json"
BINDING_PREREQUISITE_SCHEMA_AMENDMENT_PATH = "ontology/binding-prerequisite-schema-amendment.json"
ADOPTION_DECISION_SCHEMA_AMENDMENT_PATH = "ontology/adoption-decision-candidate-schema-amendment.json"
RELATION_CANDIDATE_SCHEMA_AMENDMENT_PATH = "ontology/model-instance-relation-candidate-schema-amendment.json"
RELATION_ADMISSION_SCHEMA_AMENDMENT_PATH = "ontology/model-instance-relation-admission-schema-amendment.json"
EXACT_PARENT_ADOPTION_SCHEMA_AMENDMENT_PATH = "ontology/exact-parent-adoption-schema-amendment.json"
CONFORMANCE_ASSESSMENT_SCHEMA_AMENDMENT_PATH = "ontology/conformance-assessment-schema-amendment.json"
CONSTRUCTION_BINDING_SCHEMA_AMENDMENT_PATH = "ontology/construction-binding-schema-amendment.json"
PROTOTYPE_CONSTRUCTION_SCHEMA_AMENDMENT_PATH = "ontology/prototype-construction-schema-amendment.json"
TWO_LANE_PLANNING_SCHEMA_AMENDMENT_PATH = "ontology/two-lane-planning-schema-amendment.json"
RELATION_DECISION_RECORD_PATH = "decisions/define-model-instance-relation/DECISION.md"
RELATION_DECISION_REQUEST_PATH = "decisions/define-model-instance-relation/option-admissibility-request.json"
RELATION_DECISION_RECEIPT_PATH = "decisions/define-model-instance-relation/option-admissibility-receipt.json"
RELATION_DECISION_SELECTION_PATH = "decisions/define-model-instance-relation/selection.json"
RELATION_ADMISSION_DECISION_RECORD_PATH = "decisions/define-model-instance-relation-admission/DECISION.md"
RELATION_ADMISSION_DECISION_REQUEST_PATH = "decisions/define-model-instance-relation-admission/option-admissibility-request.json"
RELATION_ADMISSION_DECISION_RECEIPT_PATH = "decisions/define-model-instance-relation-admission/option-admissibility-receipt.json"
RELATION_ADMISSION_DECISION_SELECTION_PATH = "decisions/define-model-instance-relation-admission/selection.json"
PARENT_ADOPTION_DECISION_RECORD_PATH = "decisions/define-exact-parent-adoption/DECISION.md"
PARENT_ADOPTION_DECISION_REQUEST_PATH = "decisions/define-exact-parent-adoption/option-admissibility-request.json"
PARENT_ADOPTION_DECISION_RECEIPT_PATH = "decisions/define-exact-parent-adoption/option-admissibility-receipt.json"
PARENT_ADOPTION_DECISION_SELECTION_PATH = "decisions/define-exact-parent-adoption/selection.json"
BASE_MATERIAL_FILES = (
    "README.md",
    "GOAL-DOCUMENT-TYPE.md",
    "profile.json",
    "sources.json",
    BINDING_REGISTRY_PATH,
    CONSTRUCTION_BINDING_REGISTRY_PATH,
    BINDING_RESIDUE_PATH,
    AUTHORITY_CLAIM_REGISTRY_PATH,
    INHERITED_CONTRACT_REGISTRY_PATH,
    RELATION_CANDIDATE_REGISTRY_PATH,
    ADMITTED_RELATION_REGISTRY_PATH,
    ADOPTION_DECISION_CANDIDATE_REGISTRY_PATH,
    ADOPTED_PARENT_CONTRACT_REGISTRY_PATH,
    CONFORMANCE_ASSESSMENT_REGISTRY_PATH,
    "ontology/goal-view.json",
    PROJECT_SCHEMA_AMENDMENT_PATH,
    BINDING_PREREQUISITE_SCHEMA_AMENDMENT_PATH,
    ADOPTION_DECISION_SCHEMA_AMENDMENT_PATH,
    RELATION_CANDIDATE_SCHEMA_AMENDMENT_PATH,
    RELATION_ADMISSION_SCHEMA_AMENDMENT_PATH,
    EXACT_PARENT_ADOPTION_SCHEMA_AMENDMENT_PATH,
    CONFORMANCE_ASSESSMENT_SCHEMA_AMENDMENT_PATH,
    CONSTRUCTION_BINDING_SCHEMA_AMENDMENT_PATH,
    PROTOTYPE_CONSTRUCTION_SCHEMA_AMENDMENT_PATH,
    TWO_LANE_PLANNING_SCHEMA_AMENDMENT_PATH,
    RELATION_DECISION_RECORD_PATH,
    RELATION_DECISION_REQUEST_PATH,
    RELATION_DECISION_RECEIPT_PATH,
    RELATION_DECISION_SELECTION_PATH,
    RELATION_ADMISSION_DECISION_RECORD_PATH,
    RELATION_ADMISSION_DECISION_REQUEST_PATH,
    RELATION_ADMISSION_DECISION_RECEIPT_PATH,
    RELATION_ADMISSION_DECISION_SELECTION_PATH,
    PARENT_ADOPTION_DECISION_RECORD_PATH,
    PARENT_ADOPTION_DECISION_REQUEST_PATH,
    PARENT_ADOPTION_DECISION_RECEIPT_PATH,
    PARENT_ADOPTION_DECISION_SELECTION_PATH,
    "schemas/goal-package.schema.json",
    "scripts/validate.py",
)


def load(relative_path: str, errors: list[str]) -> dict[str, Any]:
    path = PACKAGE_ROOT / relative_path
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"cannot load {relative_path}: {exc}")
        return {}
    if not isinstance(value, dict):
        errors.append(f"{relative_path} must contain one JSON object")
        return {}
    return value


def load_repository_json(relative_path: str, errors: list[str]) -> dict[str, Any]:
    path = REPOSITORY_ROOT / relative_path
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"cannot load repository record {relative_path}: {exc}")
        return {}
    if not isinstance(value, dict):
        errors.append(f"repository record {relative_path} must contain one JSON object")
        return {}
    return value


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def canonical_record_digest(value: dict[str, Any], digest_key: str) -> str:
    payload = {key: item for key, item in value.items() if key != digest_key}
    raw = json.dumps(
        payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False
    ).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def canonical_document_digest(value: dict[str, Any]) -> str:
    raw = json.dumps(
        value, sort_keys=True, separators=(",", ":"), ensure_ascii=False
    ).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def exact_keys(value: dict[str, Any], expected: set[str], label: str, errors: list[str]) -> None:
    missing = sorted(expected - set(value))
    extra = sorted(set(value) - expected)
    if missing:
        errors.append(f"{label} missing keys: {', '.join(missing)}")
    if extra:
        errors.append(f"{label} unknown keys: {', '.join(extra)}")


def discover_record_paths(pattern: str) -> tuple[str, ...]:
    return tuple(
        sorted(path.relative_to(PACKAGE_ROOT).as_posix() for path in PACKAGE_ROOT.glob(pattern))
    )


def material_digest(material_files: tuple[str, ...], errors: list[str]) -> str:
    digest = hashlib.sha256()
    for relative_path in sorted(material_files):
        path = PACKAGE_ROOT / relative_path
        if not path.is_file():
            errors.append(f"missing material file: {relative_path}")
            continue
        digest.update(relative_path.encode())
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write-receipt", action="store_true")
    args = parser.parse_args()
    errors: list[str] = []
    project_paths = discover_record_paths("projects/*/project.json")
    goal_paths = discover_record_paths("projects/*/goals/*.goal.json")
    material_files = BASE_MATERIAL_FILES + project_paths + goal_paths
    if not project_paths:
        errors.append("no Project records found")
    if not goal_paths:
        errors.append("no Goal records found")
    profile = load("profile.json", errors)
    sources_doc = load("sources.json", errors)
    projects = {path: load(path, errors) for path in project_paths}
    goals = {path: load(path, errors) for path in goal_paths}
    view = load("ontology/goal-view.json", errors)
    schema = load("schemas/goal-package.schema.json", errors)
    binding_registry = load(BINDING_REGISTRY_PATH, errors)
    construction_binding_registry = load(CONSTRUCTION_BINDING_REGISTRY_PATH, errors)
    binding_residue = load(BINDING_RESIDUE_PATH, errors)
    authority_claim_registry = load(AUTHORITY_CLAIM_REGISTRY_PATH, errors)
    inherited_contract_registry = load(INHERITED_CONTRACT_REGISTRY_PATH, errors)
    adoption_candidate_registry = load(
        ADOPTION_DECISION_CANDIDATE_REGISTRY_PATH, errors
    )
    adopted_parent_contract_registry = load(
        ADOPTED_PARENT_CONTRACT_REGISTRY_PATH, errors
    )
    conformance_assessment_registry = load(
        CONFORMANCE_ASSESSMENT_REGISTRY_PATH, errors
    )
    relation_candidate_registry = load(RELATION_CANDIDATE_REGISTRY_PATH, errors)
    admitted_relation_registry = load(ADMITTED_RELATION_REGISTRY_PATH, errors)
    project_schema_amendment = load(PROJECT_SCHEMA_AMENDMENT_PATH, errors)
    binding_prerequisite_schema_amendment = load(
        BINDING_PREREQUISITE_SCHEMA_AMENDMENT_PATH, errors
    )
    adoption_decision_schema_amendment = load(
        ADOPTION_DECISION_SCHEMA_AMENDMENT_PATH, errors
    )
    relation_candidate_schema_amendment = load(
        RELATION_CANDIDATE_SCHEMA_AMENDMENT_PATH, errors
    )
    relation_admission_schema_amendment = load(
        RELATION_ADMISSION_SCHEMA_AMENDMENT_PATH, errors
    )
    exact_parent_adoption_schema_amendment = load(
        EXACT_PARENT_ADOPTION_SCHEMA_AMENDMENT_PATH, errors
    )
    conformance_assessment_schema_amendment = load(
        CONFORMANCE_ASSESSMENT_SCHEMA_AMENDMENT_PATH, errors
    )
    construction_binding_schema_amendment = load(
        CONSTRUCTION_BINDING_SCHEMA_AMENDMENT_PATH, errors
    )
    prototype_construction_schema_amendment = load(
        PROTOTYPE_CONSTRUCTION_SCHEMA_AMENDMENT_PATH, errors
    )
    two_lane_planning_schema_amendment = load(
        TWO_LANE_PLANNING_SCHEMA_AMENDMENT_PATH, errors
    )
    relation_decision_request = load(RELATION_DECISION_REQUEST_PATH, errors)
    relation_decision_receipt = load(RELATION_DECISION_RECEIPT_PATH, errors)
    relation_decision_selection = load(RELATION_DECISION_SELECTION_PATH, errors)
    relation_admission_decision_request = load(
        RELATION_ADMISSION_DECISION_REQUEST_PATH, errors
    )
    relation_admission_decision_receipt = load(
        RELATION_ADMISSION_DECISION_RECEIPT_PATH, errors
    )
    relation_admission_decision_selection = load(
        RELATION_ADMISSION_DECISION_SELECTION_PATH, errors
    )
    parent_adoption_decision_request = load(
        PARENT_ADOPTION_DECISION_REQUEST_PATH, errors
    )
    parent_adoption_decision_receipt = load(
        PARENT_ADOPTION_DECISION_RECEIPT_PATH, errors
    )
    parent_adoption_decision_selection = load(
        PARENT_ADOPTION_DECISION_SELECTION_PATH, errors
    )
    governance_invariants = load_repository_json(
        "cyberAlchemy-v2/ontology/governance/invariants.json", errors
    )
    governance_rules = load_repository_json(
        "cyberAlchemy-v2/ontology/governance/rules.json", errors
    )
    define_profile = load_repository_json("cyberAlchemy-v2/define/profile.json", errors)
    define_system_profile = load_repository_json(
        "cyberAlchemy-v2/define/system-ontology/PROFILE.json", errors
    )
    research = load_repository_json(
        "cyberAlchemy-v2/research/projects/pythonconstraint-whole/research/pythonconstraint-admission/research.record.json",
        errors,
    )
    experiment = load_repository_json(
        "cyberAlchemy-v2/experiments/projects/pythonconstraint-whole/experiments/pythonconstraint-whole/experiment.record.json",
        errors,
    )

    exact_keys(profile, {
        "schema_ref", "schema_version", "package_id", "package_root", "package_owner",
        "definition_owner", "ontology_owner", "visibility", "status", "authority_effect",
        "canonical_goal_kind", "materialization", "source_registry", "ontology_view",
        "authority_claim_registry", "inherited_contract_registry",
        "model_instance_relation_candidate_registry",
        "admitted_model_instance_relation_registry", "adoption_decision_candidate_registry",
        "adopted_parent_contract_registry",
        "conformance_assessment_registry",
        "model_instance_relation_decision", "model_instance_relation_admission_decision",
        "exact_parent_adoption_decision",
        "instance_binding_registry", "construction_binding_registry", "project_binding_residue_registry",
        "project_schema_amendment", "binding_prerequisite_schema_amendment",
        "adoption_decision_schema_amendment", "model_instance_relation_schema_amendment",
        "model_instance_relation_admission_schema_amendment",
        "exact_parent_adoption_schema_amendment",
        "conformance_assessment_schema_amendment", "construction_binding_schema_amendment",
        "prototype_construction_schema_amendment",
        "two_lane_planning_schema_amendment",
        "schema_path", "validator_path", "blocked_effects"
    }, "profile", errors)
    if profile.get("package_root") != "cyberAlchemy-v2/goals":
        errors.append("profile package_root is not canonical")
    if profile.get("visibility") != "private" or profile.get("authority_effect") != "none":
        errors.append("profile must remain private with authority_effect none")
    if profile.get("schema_version") != "cav2-goal-package-profile/v11":
        errors.append("profile schema_version is invalid")
    if profile.get("authority_claim_registry") != AUTHORITY_CLAIM_REGISTRY_PATH:
        errors.append("profile authority_claim_registry is not canonical")
    if profile.get("inherited_contract_registry") != INHERITED_CONTRACT_REGISTRY_PATH:
        errors.append("profile inherited_contract_registry is not canonical")
    if profile.get("model_instance_relation_candidate_registry") != RELATION_CANDIDATE_REGISTRY_PATH:
        errors.append("profile model_instance_relation_candidate_registry is not canonical")
    if profile.get("admitted_model_instance_relation_registry") != ADMITTED_RELATION_REGISTRY_PATH:
        errors.append("profile admitted_model_instance_relation_registry is not canonical")
    if profile.get("adoption_decision_candidate_registry") != ADOPTION_DECISION_CANDIDATE_REGISTRY_PATH:
        errors.append("profile adoption_decision_candidate_registry is not canonical")
    if profile.get("adopted_parent_contract_registry") != ADOPTED_PARENT_CONTRACT_REGISTRY_PATH:
        errors.append("profile adopted_parent_contract_registry is not canonical")
    if profile.get("conformance_assessment_registry") != CONFORMANCE_ASSESSMENT_REGISTRY_PATH:
        errors.append("profile conformance_assessment_registry is not canonical")
    if profile.get("instance_binding_registry") != BINDING_REGISTRY_PATH:
        errors.append("profile instance_binding_registry is not canonical")
    if profile.get("construction_binding_registry") != CONSTRUCTION_BINDING_REGISTRY_PATH:
        errors.append("profile construction_binding_registry is not canonical")
    if profile.get("project_binding_residue_registry") != BINDING_RESIDUE_PATH:
        errors.append("profile project_binding_residue_registry is not canonical")
    if profile.get("project_schema_amendment") != PROJECT_SCHEMA_AMENDMENT_PATH:
        errors.append("profile project_schema_amendment is not canonical")
    if profile.get("binding_prerequisite_schema_amendment") != BINDING_PREREQUISITE_SCHEMA_AMENDMENT_PATH:
        errors.append("profile binding_prerequisite_schema_amendment is not canonical")
    if profile.get("adoption_decision_schema_amendment") != ADOPTION_DECISION_SCHEMA_AMENDMENT_PATH:
        errors.append("profile adoption_decision_schema_amendment is not canonical")
    if profile.get("model_instance_relation_decision") != RELATION_DECISION_SELECTION_PATH:
        errors.append("profile model_instance_relation_decision is not canonical")
    if profile.get("model_instance_relation_admission_decision") != RELATION_ADMISSION_DECISION_SELECTION_PATH:
        errors.append("profile model_instance_relation_admission_decision is not canonical")
    if profile.get("exact_parent_adoption_decision") != PARENT_ADOPTION_DECISION_SELECTION_PATH:
        errors.append("profile exact_parent_adoption_decision is not canonical")
    if profile.get("model_instance_relation_schema_amendment") != RELATION_CANDIDATE_SCHEMA_AMENDMENT_PATH:
        errors.append("profile model_instance_relation_schema_amendment is not canonical")
    if profile.get("model_instance_relation_admission_schema_amendment") != RELATION_ADMISSION_SCHEMA_AMENDMENT_PATH:
        errors.append("profile model_instance_relation_admission_schema_amendment is not canonical")
    if profile.get("exact_parent_adoption_schema_amendment") != EXACT_PARENT_ADOPTION_SCHEMA_AMENDMENT_PATH:
        errors.append("profile exact_parent_adoption_schema_amendment is not canonical")
    if profile.get("conformance_assessment_schema_amendment") != CONFORMANCE_ASSESSMENT_SCHEMA_AMENDMENT_PATH:
        errors.append("profile conformance_assessment_schema_amendment is not canonical")
    if profile.get("construction_binding_schema_amendment") != CONSTRUCTION_BINDING_SCHEMA_AMENDMENT_PATH:
        errors.append("profile construction_binding_schema_amendment is not canonical")
    if profile.get("prototype_construction_schema_amendment") != PROTOTYPE_CONSTRUCTION_SCHEMA_AMENDMENT_PATH:
        errors.append("profile prototype_construction_schema_amendment is not canonical")
    if profile.get("two_lane_planning_schema_amendment") != TWO_LANE_PLANNING_SCHEMA_AMENDMENT_PATH:
        errors.append("profile two_lane_planning_schema_amendment is not canonical")
    required_blocked_effects = {
        "candidate-authority-claim-activation",
        "child-package-relation-admission",
        "inherited-contract-adoption-by-registration",
        "adoption-candidate-treated-as-owner-decision",
        "semantic-relation-selection-by-validation",
        "selected-relation-candidate-treated-as-admitted",
        "relation-admission-treated-as-adoption-or-conformance",
        "adoption-decision-treated-as-conformance-or-binding",
        "conformance-by-validation-alone",
        "ontology-scaffold-treated-as-authority",
        "product-approval-before-exact-current-product-tests",
        "authority-request-before-exact-product-approval",
    }
    if not required_blocked_effects.issubset(set(profile.get("blocked_effects", []))):
        errors.append("profile does not block every prerequisite authority inflation path")
    required_defs = {
        "profile", "sourceRegistry", "project", "goal", "ontologyView",
        "recursiveInstanceBinding", "recursiveInstanceBindingEntry",
        "recursiveInstanceBindingRegistry", "projectBindingResidue",
        "projectBindingResidueRegistry", "projectSchemaAmendment",
        "authorityClaim", "authorityClaimRegistry", "inheritedContract",
        "inheritedContractRegistry", "bindingPrerequisiteSchemaAmendment",
        "adoptionDecisionCandidate", "adoptionDecisionCandidateRegistry",
        "adoptedParentContract", "adoptedParentContractRegistry",
        "adoptionDecisionSchemaAmendment", "modelInstanceRelationDecision",
        "modelInstanceRelationCandidate", "modelInstanceRelationCandidateRegistry",
        "modelInstanceRelationSchemaAmendment", "modelInstanceRelationAdmissionDecision",
        "admittedModelInstanceRelation", "admittedModelInstanceRelationRegistry",
        "modelInstanceRelationAdmissionSchemaAmendment",
        "exactParentAdoptionDecision", "exactParentAdoptionSchemaAmendment",
        "conformanceTermResult", "observedSystemValidation", "conformanceAssessment",
        "conformanceAssessmentRegistry", "conformanceAssessmentSchemaAmendment",
        "exactDigestRef", "exactPathRef", "prototypeConstructionStageStates",
        "operationalTask", "twoLaneConstructionPlan", "constructionBinding",
        "constructionBindingRegistry", "constructionBindingSchemaAmendment",
        "prototypeConstructionSchemaAmendment", "twoLanePlanningSchemaAmendment"
    }
    if "$defs" not in schema or not required_defs.issubset(schema.get("$defs", {})):
        errors.append("schema is missing required definitions")

    source_ids: set[str] = set()
    source_by_id: dict[str, dict[str, Any]] = {}
    for index, source in enumerate(sources_doc.get("sources", [])):
        label = f"sources[{index}]"
        if not isinstance(source, dict):
            errors.append(f"{label} must be an object")
            continue
        exact_keys(source, {"id", "path", "sha256", "posture", "owner_route"}, label, errors)
        source_id = source.get("id")
        if source_id in source_ids:
            errors.append(f"duplicate source id: {source_id}")
        if isinstance(source_id, str):
            source_ids.add(source_id)
            source_by_id[source_id] = source
        path = REPOSITORY_ROOT / str(source.get("path", ""))
        if not path.is_file():
            errors.append(f"missing source path: {source.get('path')}")
        elif sha256(path) != source.get("sha256"):
            errors.append(f"source digest drift: {source.get('id')}")

    project_keys = {"schema_ref", "schema_version", "project_id", "name", "purpose", "scope", "exclusions", "owner_routes", "goal_refs", "research_refs", "experiment_refs", "evidence_index", "thesis_refs", "instance_binding_refs", "construction_binding_refs", "lifecycle_state", "challenge_route", "authority_effect"}
    goal_keys = {"schema_ref", "schema_version", "canonical_kind", "goal_id", "title", "project_ref", "outcome", "rationale", "thesis_refs", "scope", "exclusions", "owner_route", "success_conditions", "evidence_requirements", "evidence_refs", "lifecycle_state", "achievement_state", "current_condition", "target_horizon", "revision_history", "challenge_route", "blocked_effects", "authority_effect"}
    project_by_id: dict[str, dict[str, Any]] = {}
    project_path_by_id: dict[str, str] = {}
    for path, project in projects.items():
        label = f"Project {path}"
        exact_keys(project, project_keys, label, errors)
        project_id = project.get("project_id")
        if not isinstance(project_id, str) or not re.fullmatch(r"CA2-PROJECT-[A-Z0-9-]+", project_id):
            errors.append(f"{label} project_id is invalid")
        elif project_id in project_by_id:
            errors.append(f"duplicate Project id: {project_id}")
        else:
            project_by_id[project_id] = project
            project_path_by_id[project_id] = path
        if project.get("schema_version") != "cav2-project/v3":
            errors.append(f"{label} schema_version is invalid")
        if project.get("authority_effect") != "none":
            errors.append(f"{label} authority_effect must be none")
        evidence_ids: set[str] = set()
        for index, item in enumerate(project.get("evidence_index", [])):
            if not isinstance(item, dict) or set(item) != {"evidence_id", "kind", "ref", "supports", "claim_limit"}:
                errors.append(f"{label} evidence_index[{index}] has an invalid shape")
                continue
            evidence_id = item.get("evidence_id")
            if evidence_id in evidence_ids:
                errors.append(f"{label} has duplicate evidence_id {evidence_id}")
            if isinstance(evidence_id, str):
                evidence_ids.add(evidence_id)
            if item.get("ref") not in source_ids:
                errors.append(f"{label} evidence {evidence_id} has unknown source ref {item.get('ref')}")
        for index, thesis_ref in enumerate(project.get("thesis_refs", [])):
            if not isinstance(thesis_ref, dict) or set(thesis_ref) != {"source_id", "selector", "ontology_node_id", "relation"}:
                errors.append(f"{label} thesis_refs[{index}] has an invalid shape")
                continue
            if thesis_ref.get("source_id") not in source_ids:
                errors.append(f"{label} thesis_refs[{index}] has unknown source")
        binding_refs = project.get("instance_binding_refs", [])
        if not isinstance(binding_refs, list) or len(binding_refs) != len(set(binding_refs)):
            errors.append(f"{label} instance_binding_refs must be a unique array")
        elif any(not isinstance(ref, str) or not re.fullmatch(r"CA2-BINDING-[A-Z0-9-]+", ref) for ref in binding_refs):
            errors.append(f"{label} instance_binding_refs contains an invalid binding id")
        construction_refs = project.get("construction_binding_refs", [])
        if not isinstance(construction_refs, list) or len(construction_refs) != len(set(construction_refs)):
            errors.append(f"{label} construction_binding_refs must be a unique array")
        elif any(not isinstance(ref, str) or not re.fullmatch(r"CA2-CONSTRUCTION-[A-Z0-9-]+", ref) for ref in construction_refs):
            errors.append(f"{label} construction_binding_refs contains an invalid construction id")

    goal_by_id: dict[str, dict[str, Any]] = {}
    goal_path_by_id: dict[str, str] = {}
    for path, goal in goals.items():
        label = f"Goal {path}"
        exact_keys(goal, goal_keys, label, errors)
        goal_id = goal.get("goal_id")
        if not isinstance(goal_id, str) or not re.fullmatch(r"CA2-GOAL-[A-Z0-9-]+", goal_id):
            errors.append(f"{label} goal_id is invalid")
        elif goal_id in goal_by_id:
            errors.append(f"duplicate Goal id: {goal_id}")
        else:
            goal_by_id[goal_id] = goal
            goal_path_by_id[goal_id] = path
        if goal.get("schema_version") != "cav2-goal/v1" or goal.get("canonical_kind") != "goal":
            errors.append(f"{label} kind or schema_version is invalid")
        if not path.endswith(".goal.json"):
            errors.append(f"{label} carrier must end in .goal.json")
        project_ref = goal.get("project_ref")
        if project_ref not in project_by_id:
            errors.append(f"{label} project_ref does not resolve")
        elif goal_id not in project_by_id[project_ref].get("goal_refs", []):
            errors.append(f"{label} is not included in its Project goal_refs")
        if goal.get("authority_effect") != "none":
            errors.append(f"{label} authority_effect must be none")
        for index, thesis_ref in enumerate(goal.get("thesis_refs", [])):
            if not isinstance(thesis_ref, dict) or set(thesis_ref) != {"source_id", "selector", "ontology_node_id", "relation"}:
                errors.append(f"{label} thesis_refs[{index}] has an invalid shape")
                continue
            if thesis_ref.get("source_id") not in source_ids:
                errors.append(f"{label} thesis_refs[{index}] has unknown source")

    for project_id, project in project_by_id.items():
        for goal_ref in project.get("goal_refs", []):
            if goal_ref not in goal_by_id:
                errors.append(f"Project {project_id} has unresolved goal_ref {goal_ref}")
            elif goal_by_id[goal_ref].get("project_ref") != project_id:
                errors.append(f"Project {project_id} has non-owned goal_ref {goal_ref}")
        linked_goal_states = {
            goal_by_id[goal_ref].get("lifecycle_state")
            for goal_ref in project.get("goal_refs", [])
            if goal_ref in goal_by_id
        }
        if project.get("lifecycle_state") == "proposed" and not linked_goal_states.intersection({"draft", "active"}):
            errors.append(f"proposed Project {project_id} requires a draft or active Goal")
        if project.get("lifecycle_state") == "active" and "active" not in linked_goal_states:
            errors.append(f"active Project {project_id} requires an active Goal")

    python_project = project_by_id.get("CA2-PROJECT-PYTHONCONSTRAINT-WHOLE", {})
    python_goal = goal_by_id.get("CA2-GOAL-PYTHONCONSTRAINT-WHOLE", {})
    if "CA2-RESEARCH-PYTHONCONSTRAINT-ADMISSION" not in python_project.get("research_refs", []):
        errors.append("project research_refs does not include the canonical research record")
    if "CA2-EXPERIMENT-PYTHONCONSTRAINT-WHOLE" not in python_project.get("experiment_refs", []):
        errors.append("project experiment_refs does not include the canonical experiment record")
    if research.get("research_id") not in python_project.get("research_refs", []):
        errors.append("canonical Research record does not close against project research_refs")
    if research.get("project_ref") != python_project.get("project_id") or python_goal.get("goal_id") not in research.get("goal_refs", []):
        errors.append("canonical Research record does not link back to the Project and Goal")
    if experiment.get("experiment_id") not in python_project.get("experiment_refs", []):
        errors.append("canonical Experiment record does not close against project experiment_refs")
    if experiment.get("project_ref") != python_project.get("project_id") or python_goal.get("goal_id") not in experiment.get("goal_refs", []):
        errors.append("canonical Experiment record does not link back to the Project and Goal")

    exact_keys(binding_registry, {
        "schema_ref", "schema_version", "registry_id", "canonical_definition_ref",
        "governance_invariant_ref", "operational_rule_ref", "record_owner_rule",
        "status", "validation_mode", "bindings", "residue_refs", "authority_effect"
    }, "binding registry", errors)
    exact_keys(construction_binding_registry, {
        "schema_ref", "schema_version", "registry_id", "canonical_definition_ref",
        "canonical_schema_ref", "governance_invariant_ref", "operational_rule_ref",
        "upstream_contract_registry_ref", "upstream_scaffold_registry_ref",
        "record_owner_rule", "status", "validation_mode", "bindings", "residue_refs",
        "claim_ceiling", "authority_effect", "enforcement_effect", "implementation_effect"
    }, "construction binding registry", errors)
    exact_keys(binding_residue, {
        "schema_ref", "schema_version", "records", "authority_effect"
    }, "binding residue registry", errors)
    exact_keys(project_schema_amendment, {
        "schema_ref", "schema_version", "amendment_id", "from_project_schema",
        "to_project_schema", "change_kind", "changes", "migration", "rollback",
        "claim_ceiling", "authority_effect"
    }, "Project schema amendment", errors)
    if binding_registry.get("schema_version") != "cav2-project-instance-binding-registry/v1":
        errors.append("binding registry schema_version is invalid")
    if binding_registry.get("canonical_definition_ref") != "CAV2-D64":
        errors.append("binding registry must bind CAV2-D64")
    invariant_ids = {
        row.get("id") for row in governance_invariants.get("invariants", [])
        if isinstance(row, dict)
    }
    rule_ids = {
        row.get("id") for row in governance_rules.get("rules", [])
        if isinstance(row, dict)
    }
    if binding_registry.get("governance_invariant_ref") not in invariant_ids:
        errors.append("binding registry Governance invariant ref does not resolve")
    if binding_registry.get("operational_rule_ref") not in rule_ids:
        errors.append("binding registry operational rule ref does not resolve")
    if binding_registry.get("status") != "candidate" or binding_registry.get("validation_mode") != "review-only":
        errors.append("binding registry must remain candidate and review-only")
    if binding_registry.get("authority_effect") != "none" or binding_residue.get("authority_effect") != "none":
        errors.append("binding registries must have authority_effect none")
    if (
        construction_binding_registry.get("schema_version") != "cav2-project-construction-binding-registry/v3"
        or construction_binding_registry.get("registry_id") != "cav2.project.construction-bindings"
        or construction_binding_registry.get("canonical_definition_ref") != "CAV2-D65"
        or construction_binding_registry.get("canonical_schema_ref") != "CAV2-D65-SCHEMA"
        or construction_binding_registry.get("governance_invariant_ref") != "GOV-INV-CAV2-D65"
        or construction_binding_registry.get("operational_rule_ref") != "GOV-RULE-D65-CONSTRUCTION-STAGES-COMPLETE"
        or construction_binding_registry.get("status") != "prototype-active"
        or construction_binding_registry.get("validation_mode") != "prototype"
    ):
        errors.append("construction binding registry identity or prototype posture is invalid")
    if construction_binding_registry.get("governance_invariant_ref") not in invariant_ids:
        errors.append("construction binding registry Governance invariant ref does not resolve")
    if construction_binding_registry.get("operational_rule_ref") not in rule_ids:
        errors.append("construction binding registry operational rule ref does not resolve")
    if any(construction_binding_registry.get(key) != "none" for key in ("authority_effect", "enforcement_effect", "implementation_effect")):
        errors.append("construction binding registry effects must remain none")
    if project_schema_amendment.get("from_project_schema") != "cav2-project/v1" or project_schema_amendment.get("to_project_schema") != "cav2-project/v2":
        errors.append("Project schema amendment must witness v1 to v2")
    if project_schema_amendment.get("authority_effect") != "none":
        errors.append("Project schema amendment must have authority_effect none")

    exact_keys(authority_claim_registry, {
        "schema_ref", "schema_version", "registry_id", "project_ref",
        "canonical_definition_ref", "status", "claims", "residue_refs",
        "claim_ceiling", "authority_effect"
    }, "authority claim registry", errors)
    exact_keys(inherited_contract_registry, {
        "schema_ref", "schema_version", "registry_id", "project_ref",
        "canonical_invariant_ref", "status", "contracts", "residue_refs",
        "claim_ceiling", "authority_effect"
    }, "inherited contract registry", errors)
    exact_keys(relation_candidate_registry, {
        "schema_ref", "schema_version", "registry_id", "project_ref",
        "canonical_coupling_ref", "canonical_invariant_ref", "status",
        "relations", "residue_refs", "claim_ceiling", "authority_effect",
        "admission_effect"
    }, "model-instance relation candidate registry", errors)
    exact_keys(binding_prerequisite_schema_amendment, {
        "schema_ref", "schema_version", "amendment_id", "from_package_schema",
        "to_package_schema", "from_profile_schema", "to_profile_schema",
        "change_kind", "changes", "migration", "rollback", "claim_ceiling",
        "authority_effect"
    }, "binding prerequisite schema amendment", errors)
    exact_keys(adoption_candidate_registry, {
        "schema_ref", "schema_version", "registry_id", "project_ref",
        "canonical_lifecycle_ref", "canonical_invariant_ref", "status",
        "candidates", "residue_refs", "claim_ceiling", "authority_effect",
        "adoption_effect"
    }, "adoption decision candidate registry", errors)
    exact_keys(adoption_decision_schema_amendment, {
        "schema_ref", "schema_version", "amendment_id", "from_package_schema",
        "to_package_schema", "from_profile_schema", "to_profile_schema",
        "change_kind", "changes", "migration", "rollback", "claim_ceiling",
        "authority_effect"
    }, "adoption decision schema amendment", errors)
    exact_keys(relation_candidate_schema_amendment, {
        "schema_ref", "schema_version", "amendment_id", "from_package_schema",
        "to_package_schema", "from_profile_schema", "to_profile_schema",
        "change_kind", "changes", "migration", "rollback", "claim_ceiling",
        "authority_effect"
    }, "model-instance relation candidate schema amendment", errors)
    exact_keys(exact_parent_adoption_schema_amendment, {
        "schema_ref", "schema_version", "amendment_id", "from_package_schema",
        "to_package_schema", "from_profile_schema", "to_profile_schema",
        "change_kind", "changes", "migration", "rollback", "claim_ceiling",
        "authority_effect"
    }, "exact parent adoption schema amendment", errors)
    exact_keys(conformance_assessment_schema_amendment, {
        "schema_ref", "schema_version", "amendment_id", "from_package_schema",
        "to_package_schema", "from_profile_schema", "to_profile_schema",
        "change_kind", "changes", "migration", "rollback", "claim_ceiling",
        "authority_effect"
    }, "conformance assessment schema amendment", errors)
    exact_keys(construction_binding_schema_amendment, {
        "schema_ref", "schema_version", "amendment_id", "from_package_schema",
        "to_package_schema", "from_profile_schema", "to_profile_schema",
        "from_project_schema", "to_project_schema", "change_kind", "changes",
        "migration", "rollback", "claim_ceiling", "authority_effect"
    }, "construction binding schema amendment", errors)
    exact_keys(prototype_construction_schema_amendment, {
        "schema_ref", "schema_version", "amendment_id", "from_package_schema",
        "to_package_schema", "from_profile_schema", "to_profile_schema",
        "project_schema", "change_kind", "changes", "migration", "rollback",
        "claim_ceiling", "authority_effect"
    }, "prototype construction schema amendment", errors)
    exact_keys(two_lane_planning_schema_amendment, {
        "schema_ref", "schema_version", "amendment_id", "from_package_schema",
        "to_package_schema", "from_profile_schema", "to_profile_schema",
        "project_schema", "change_kind", "changes", "migration", "rollback",
        "claim_ceiling", "authority_effect"
    }, "two-lane planning schema amendment", errors)
    if (
        construction_binding_schema_amendment.get("from_package_schema")
        != "https://cyberalchemy.local/private/schemas/goal-package/v8"
        or construction_binding_schema_amendment.get("to_package_schema")
        != "https://cyberalchemy.local/private/schemas/goal-package/v9"
        or construction_binding_schema_amendment.get("from_profile_schema")
        != "cav2-goal-package-profile/v8"
        or construction_binding_schema_amendment.get("to_profile_schema")
        != "cav2-goal-package-profile/v9"
        or construction_binding_schema_amendment.get("from_project_schema")
        != "cav2-project/v2"
        or construction_binding_schema_amendment.get("to_project_schema")
        != "cav2-project/v3"
        or construction_binding_schema_amendment.get("authority_effect") != "none"
    ):
        errors.append("construction binding schema amendment does not witness v8/v2 to v9/v3")
    if (
        prototype_construction_schema_amendment.get("from_package_schema")
        != "https://cyberalchemy.local/private/schemas/goal-package/v9"
        or prototype_construction_schema_amendment.get("to_package_schema")
        != "https://cyberalchemy.local/private/schemas/goal-package/v10"
        or prototype_construction_schema_amendment.get("from_profile_schema")
        != "cav2-goal-package-profile/v9"
        or prototype_construction_schema_amendment.get("to_profile_schema")
        != "cav2-goal-package-profile/v10"
        or prototype_construction_schema_amendment.get("project_schema")
        != "cav2-project/v3"
        or prototype_construction_schema_amendment.get("authority_effect") != "none"
    ):
        errors.append("prototype construction schema amendment does not witness no-effect v9 to v10")
    if (
        two_lane_planning_schema_amendment.get("from_package_schema")
        != "https://cyberalchemy.local/private/schemas/goal-package/v10"
        or two_lane_planning_schema_amendment.get("to_package_schema")
        != "https://cyberalchemy.local/private/schemas/goal-package/v11"
        or two_lane_planning_schema_amendment.get("from_profile_schema")
        != "cav2-goal-package-profile/v10"
        or two_lane_planning_schema_amendment.get("to_profile_schema")
        != "cav2-goal-package-profile/v11"
        or two_lane_planning_schema_amendment.get("project_schema")
        != "cav2-project/v3"
        or two_lane_planning_schema_amendment.get("change_kind")
        != "require-two-lane-construction-planning"
        or two_lane_planning_schema_amendment.get("authority_effect") != "none"
    ):
        errors.append("two-lane planning schema amendment does not witness no-effect v10 to v11")
    if (
        conformance_assessment_schema_amendment.get("from_package_schema")
        != "https://cyberalchemy.local/private/schemas/goal-package/v7"
        or conformance_assessment_schema_amendment.get("to_package_schema")
        != "https://cyberalchemy.local/private/schemas/goal-package/v8"
        or conformance_assessment_schema_amendment.get("from_profile_schema")
        != "cav2-goal-package-profile/v7"
        or conformance_assessment_schema_amendment.get("to_profile_schema")
        != "cav2-goal-package-profile/v8"
        or conformance_assessment_schema_amendment.get("authority_effect") != "none"
    ):
        errors.append("conformance assessment schema amendment must witness no-effect v7 to v8")
    if authority_claim_registry.get("schema_version") != "cav2-project-authority-claim-registry/v1":
        errors.append("authority claim registry schema_version is invalid")
    if authority_claim_registry.get("project_ref") != "CA2-PROJECT-DEFINE" or authority_claim_registry.get("canonical_definition_ref") != "CAV2-D34":
        errors.append("authority claim registry identity is invalid")
    if inherited_contract_registry.get("schema_version") != "cav2-project-inherited-contract-registry/v1":
        errors.append("inherited contract registry schema_version is invalid")
    if inherited_contract_registry.get("project_ref") != "CA2-PROJECT-DEFINE" or inherited_contract_registry.get("canonical_invariant_ref") != "CAV2-D64":
        errors.append("inherited contract registry identity is invalid")
    if authority_claim_registry.get("status") != "candidate" or inherited_contract_registry.get("status") != "candidate":
        errors.append("binding prerequisite registries must remain candidate")
    if authority_claim_registry.get("authority_effect") != "none" or inherited_contract_registry.get("authority_effect") != "none":
        errors.append("binding prerequisite registries must have authority_effect none")
    if binding_prerequisite_schema_amendment.get("from_package_schema") != "https://cyberalchemy.local/private/schemas/goal-package/v2" or binding_prerequisite_schema_amendment.get("to_package_schema") != "https://cyberalchemy.local/private/schemas/goal-package/v3":
        errors.append("binding prerequisite schema amendment must witness package v2 to v3")
    if binding_prerequisite_schema_amendment.get("from_profile_schema") != "cav2-goal-package-profile/v2" or binding_prerequisite_schema_amendment.get("to_profile_schema") != "cav2-goal-package-profile/v3":
        errors.append("binding prerequisite schema amendment must witness profile v2 to v3")
    if binding_prerequisite_schema_amendment.get("authority_effect") != "none":
        errors.append("binding prerequisite schema amendment authority_effect must be none")
    if relation_candidate_registry.get("schema_version") != "cav2-project-model-instance-relation-candidate-registry/v1":
        errors.append("model-instance relation candidate registry schema_version is invalid")
    if relation_candidate_registry.get("project_ref") != "CA2-PROJECT-DEFINE" or relation_candidate_registry.get("canonical_coupling_ref") != "CAV2-D16" or relation_candidate_registry.get("canonical_invariant_ref") != "CAV2-D64":
        errors.append("model-instance relation candidate registry identity is invalid")
    if relation_candidate_registry.get("status") != "candidate" or relation_candidate_registry.get("authority_effect") != "none" or relation_candidate_registry.get("admission_effect") != "none":
        errors.append("model-instance relation candidate registry must remain no-effect candidate")
    if adoption_candidate_registry.get("schema_version") != "cav2-project-adoption-decision-candidate-registry/v3":
        errors.append("adoption decision candidate registry schema_version is invalid")
    if adoption_candidate_registry.get("project_ref") != "CA2-PROJECT-DEFINE":
        errors.append("adoption decision candidate registry Project identity is invalid")
    if adoption_candidate_registry.get("canonical_lifecycle_ref") != "CAV2-D48" or adoption_candidate_registry.get("canonical_invariant_ref") != "CAV2-D64":
        errors.append("adoption decision candidate registry canonical refs are invalid")
    if adoption_candidate_registry.get("status") != "candidate":
        errors.append("adoption decision candidate registry must remain candidate")
    if adoption_candidate_registry.get("authority_effect") != "none" or adoption_candidate_registry.get("adoption_effect") != "none":
        errors.append("adoption decision candidate registry effects must remain none")
    if adoption_decision_schema_amendment.get("from_package_schema") != "https://cyberalchemy.local/private/schemas/goal-package/v3" or adoption_decision_schema_amendment.get("to_package_schema") != "https://cyberalchemy.local/private/schemas/goal-package/v4":
        errors.append("adoption decision schema amendment must witness package v3 to v4")
    if adoption_decision_schema_amendment.get("from_profile_schema") != "cav2-goal-package-profile/v3" or adoption_decision_schema_amendment.get("to_profile_schema") != "cav2-goal-package-profile/v4":
        errors.append("adoption decision schema amendment must witness profile v3 to v4")
    if adoption_decision_schema_amendment.get("authority_effect") != "none":
        errors.append("adoption decision schema amendment authority_effect must be none")
    if relation_candidate_schema_amendment.get("from_package_schema") != "https://cyberalchemy.local/private/schemas/goal-package/v4" or relation_candidate_schema_amendment.get("to_package_schema") != "https://cyberalchemy.local/private/schemas/goal-package/v5":
        errors.append("model-instance relation candidate schema amendment must witness package v4 to v5")
    if relation_candidate_schema_amendment.get("from_profile_schema") != "cav2-goal-package-profile/v4" or relation_candidate_schema_amendment.get("to_profile_schema") != "cav2-goal-package-profile/v5":
        errors.append("model-instance relation candidate schema amendment must witness profile v4 to v5")
    if relation_candidate_schema_amendment.get("authority_effect") != "none":
        errors.append("model-instance relation candidate schema amendment authority_effect must be none")
    if relation_admission_schema_amendment.get("from_package_schema") != "https://cyberalchemy.local/private/schemas/goal-package/v5" or relation_admission_schema_amendment.get("to_package_schema") != "https://cyberalchemy.local/private/schemas/goal-package/v6":
        errors.append("model-instance relation admission schema amendment must witness package v5 to v6")
    if relation_admission_schema_amendment.get("from_profile_schema") != "cav2-goal-package-profile/v5" or relation_admission_schema_amendment.get("to_profile_schema") != "cav2-goal-package-profile/v6":
        errors.append("model-instance relation admission schema amendment must witness profile v5 to v6")
    if relation_admission_schema_amendment.get("authority_effect") != "none":
        errors.append("model-instance relation admission schema amendment authority_effect must be none")
    if exact_parent_adoption_schema_amendment.get("from_package_schema") != "https://cyberalchemy.local/private/schemas/goal-package/v6" or exact_parent_adoption_schema_amendment.get("to_package_schema") != "https://cyberalchemy.local/private/schemas/goal-package/v7":
        errors.append("exact parent adoption schema amendment must witness package v6 to v7")
    if exact_parent_adoption_schema_amendment.get("from_profile_schema") != "cav2-goal-package-profile/v6" or exact_parent_adoption_schema_amendment.get("to_profile_schema") != "cav2-goal-package-profile/v7":
        errors.append("exact parent adoption schema amendment must witness profile v6 to v7")
    if exact_parent_adoption_schema_amendment.get("authority_effect") != "none":
        errors.append("exact parent adoption schema amendment authority_effect must be none")

    decision_id = "CA2-DECISION-DEFINE-MODEL-INSTANCE-RELATION-001"
    if relation_decision_request.get("decisionId") != decision_id:
        errors.append("relation decision request identity is invalid")
    if relation_decision_receipt.get("decisionId") != decision_id:
        errors.append("relation decision receipt identity is invalid")
    if relation_decision_receipt.get("requestDigest") != canonical_document_digest(relation_decision_request):
        errors.append("relation decision receipt does not bind the canonical request")
    if relation_decision_receipt.get("routeOutcome") != "gate" or relation_decision_receipt.get("decisionGateRequired") is not True:
        errors.append("relation admissibility prefilter must preserve its historical human-gate outcome")
    if relation_decision_receipt.get("directOptionId") is not None:
        errors.append("relation decision may not contain a direct selection")
    admissible_relation_options = {"REL-INSTANCE-OF", "REL-SPECIALIZES"}
    if not admissible_relation_options.issubset(set(relation_decision_receipt.get("presentedOptionIds", []))):
        errors.append("relation decision receipt is missing an admissible semantic option")
    decision_selection_keys = {
        "schema_ref", "schema_version", "decision_id", "decision_digest", "question",
        "selected_option_id", "selected_relation_kind", "selection_source", "selected_at",
        "owner_route", "decision_posture", "decision_effect", "admissibility_request_digest",
        "admissibility_receipt_ref", "considered_option_ids",
        "structurally_rejected_option_ids", "rationale", "remaining_blockers",
        "challenge_route", "authority_effect", "admission_effect", "adoption_effect"
    }
    exact_keys(relation_decision_selection, decision_selection_keys, "relation decision selection", errors)
    if relation_decision_selection.get("decision_id") != decision_id:
        errors.append("relation decision selection identity is invalid")
    if relation_decision_selection.get("decision_digest") != canonical_record_digest(relation_decision_selection, "decision_digest"):
        errors.append("relation decision selection digest does not bind canonical content")
    if relation_decision_selection.get("admissibility_request_digest") != canonical_document_digest(relation_decision_request) or relation_decision_selection.get("admissibility_request_digest") != relation_decision_receipt.get("requestDigest"):
        errors.append("relation decision selection does not bind the admitted prefilter request")
    if relation_decision_selection.get("selected_option_id") != "REL-INSTANCE-OF" or relation_decision_selection.get("selected_relation_kind") != "instance_of":
        errors.append("relation decision selection must be exact REL-INSTANCE-OF / instance_of")
    if relation_decision_selection.get("selected_option_id") not in relation_decision_receipt.get("presentedOptionIds", []):
        errors.append("relation decision selection was not presented as an admissible option")
    if relation_decision_selection.get("decision_posture") != "selected-candidate-not-admitted" or relation_decision_selection.get("decision_effect") != "semantic-candidate-selection-only":
        errors.append("relation decision selection must remain candidate-only")
    if relation_decision_selection.get("owner_route") != "CyberAlchemy v2 product owner plus CyberAlchemy v2 Define runtime owner":
        errors.append("relation decision selection owner route is invalid")
    if any(relation_decision_selection.get(key) != "none" for key in ("authority_effect", "admission_effect", "adoption_effect")):
        errors.append("relation decision selection effects must remain none")

    admission_decision_id = "CA2-DECISION-DEFINE-MODEL-INSTANCE-RELATION-ADMISSION-001"
    if relation_admission_decision_request.get("decisionId") != admission_decision_id:
        errors.append("relation admission decision request identity is invalid")
    if relation_admission_decision_receipt.get("decisionId") != admission_decision_id:
        errors.append("relation admission decision receipt identity is invalid")
    if relation_admission_decision_receipt.get("requestDigest") != canonical_document_digest(relation_admission_decision_request):
        errors.append("relation admission decision receipt does not bind the canonical request")
    expected_admission_options = {
        "ADMIT-INSTANCE-OF", "REJECT-INSTANCE-OF",
        "DEFER-RELATION-ADMISSION", "STOP-RELATION-ADMISSION"
    }
    admission_candidates = relation_admission_decision_request.get("candidates", [])
    admission_candidate_by_id = {
        row.get("optionId"): row for row in admission_candidates if isinstance(row, dict)
    }
    if set(admission_candidate_by_id) != expected_admission_options or len(admission_candidates) != len(expected_admission_options):
        errors.append("relation admission decision request option set is invalid")
    if relation_admission_decision_receipt.get("routeOutcome") != "gate" or relation_admission_decision_receipt.get("decisionGateRequired") is not True or relation_admission_decision_receipt.get("directOptionId") is not None:
        errors.append("relation admission decision must remain at the protected human gate")
    if set(relation_admission_decision_receipt.get("admissibleOptionIds", [])) != expected_admission_options or set(relation_admission_decision_receipt.get("presentedOptionIds", [])) != expected_admission_options:
        errors.append("relation admission decision receipt must present every admissible option")
    if relation_admission_decision_receipt.get("rejectedOptions") != [] or relation_admission_decision_receipt.get("reasons") != []:
        errors.append("relation admission decision receipt unexpectedly rejects a structurally admissible option")
    protected_owner_gate = "CyberAlchemy v2 product owner plus CyberAlchemy v2 Define runtime owner"
    for option_id in ("ADMIT-INSTANCE-OF", "REJECT-INSTANCE-OF"):
        option = admission_candidate_by_id.get(option_id, {})
        if option.get("optionKind") != "action" or option.get("structuralStatus") != "admissible" or option.get("reversibility") != "irreversible" or option.get("hazardClass") != "authority" or option.get("ownerGate") != protected_owner_gate:
            errors.append(f"relation admission option {option_id} lacks the exact protected owner gate")
    if admission_candidate_by_id.get("DEFER-RELATION-ADMISSION", {}).get("optionKind") != "defer" or admission_candidate_by_id.get("STOP-RELATION-ADMISSION", {}).get("optionKind") != "stop":
        errors.append("relation admission non-action options are invalid")
    admission_selection_keys = {
        "schema_ref", "schema_version", "decision_id", "decision_digest", "question",
        "subject_relation_candidate_ref", "subject_relation_candidate_digest",
        "prior_selection_ref", "prior_selection_digest", "selected_option_id",
        "selection_source", "selected_at", "owner_route", "decision_posture",
        "decision_effect", "admission_scope", "admissibility_request_digest",
        "admissibility_receipt_ref", "source_ref", "source_version_ref", "target_ref",
        "target_version_ref", "direction", "relation_kind", "inherited_contract_ref",
        "inherited_contract_digest", "rationale", "remaining_blockers", "forbidden_effects",
        "challenge_route", "admission_effect", "authority_effect", "adoption_effect",
        "conformance_effect", "binding_effect", "promotion_effect"
    }
    exact_keys(relation_admission_decision_selection, admission_selection_keys, "relation admission decision selection", errors)
    if relation_admission_decision_selection.get("decision_id") != admission_decision_id:
        errors.append("relation admission decision selection identity is invalid")
    if relation_admission_decision_selection.get("decision_digest") != canonical_record_digest(relation_admission_decision_selection, "decision_digest"):
        errors.append("relation admission decision digest does not bind canonical content")
    if relation_admission_decision_selection.get("selected_option_id") != "ADMIT-INSTANCE-OF" or relation_admission_decision_selection.get("selected_option_id") not in relation_admission_decision_receipt.get("presentedOptionIds", []):
        errors.append("relation admission decision must be exact presented ADMIT-INSTANCE-OF")
    expected_admission_selection = {
        "subject_relation_candidate_ref": "CA2-RELATION-CANDIDATE-DEFINE-SYSTEM-INSTANCE-OF-001",
        "subject_relation_candidate_digest": "333b9f251df3bdef157efa9c378ac13cd2905b6379410a62688f2136cc68475d",
        "prior_selection_ref": decision_id,
        "prior_selection_digest": relation_decision_selection.get("decision_digest"),
        "selection_source": "user-explicit-choice",
        "owner_route": protected_owner_gate,
        "decision_posture": "admitted-exact-relation-only",
        "decision_effect": "admits-exact-d16-typed-relation-only",
        "admission_scope": "typed-relation-witness-only",
        "admissibility_request_digest": canonical_document_digest(relation_admission_decision_request),
        "source_ref": "cav2.define.system-runtime.v1",
        "source_version_ref": "cav2.define.system-ontology.profile/v1",
        "target_ref": "cav2.define",
        "direction": "directed",
        "relation_kind": "instance_of",
        "inherited_contract_ref": "CA2-INHERITED-CONTRACT-DEFINE-SYSTEM-001",
        "admission_effect": "exact-d16-relation-admitted",
    }
    for key, expected in expected_admission_selection.items():
        if relation_admission_decision_selection.get(key) != expected:
            errors.append(f"relation admission decision {key} is not exact")
    if any(relation_admission_decision_selection.get(key) != "none" for key in ("authority_effect", "adoption_effect", "conformance_effect", "binding_effect", "promotion_effect")):
        errors.append("relation admission decision inflates a forbidden effect")

    claim_keys = {
        "authority_claim_id", "claim_digest", "claim_role", "scope", "owner_route",
        "authority_surface", "governed_object_ref", "allowed_operations",
        "basis_refs", "effect", "challenge_or_drift_route", "claim_posture",
        "separation_constraints", "authority_effect"
    }
    claim_ids: set[str] = set()
    claims_by_role: dict[str, dict[str, Any]] = {}
    for index, claim in enumerate(authority_claim_registry.get("claims", [])):
        label = f"authority claims[{index}]"
        if not isinstance(claim, dict):
            errors.append(f"{label} must be an object")
            continue
        exact_keys(claim, claim_keys, label, errors)
        claim_id = claim.get("authority_claim_id")
        if not isinstance(claim_id, str) or not re.fullmatch(r"CA2-AUTHORITY-CLAIM-[A-Z0-9-]+", claim_id):
            errors.append(f"{label} authority_claim_id is invalid")
        elif claim_id in claim_ids:
            errors.append(f"duplicate authority claim id: {claim_id}")
        else:
            claim_ids.add(claim_id)
        if claim.get("claim_digest") != canonical_record_digest(claim, "claim_digest"):
            errors.append(f"{label} claim_digest does not bind its canonical content")
        role = claim.get("claim_role")
        if role in claims_by_role:
            errors.append(f"duplicate authority claim role: {role}")
        elif isinstance(role, str):
            claims_by_role[role] = claim
        required_strings = [
            "scope", "owner_route", "authority_surface", "governed_object_ref",
            "effect", "challenge_or_drift_route"
        ]
        if any(not isinstance(claim.get(key), str) or not claim.get(key) for key in required_strings):
            errors.append(f"{label} is missing a D34 tuple field")
        for key in ("allowed_operations", "basis_refs", "separation_constraints"):
            values = claim.get(key)
            if not isinstance(values, list) or not values or len(values) != len(set(values)) or any(not isinstance(item, str) or not item for item in values):
                errors.append(f"{label} {key} is invalid")
        if set(claim.get("basis_refs", [])) - source_ids:
            errors.append(f"{label} has unresolved basis refs")
        surface_path = REPOSITORY_ROOT / str(claim.get("authority_surface", ""))
        if not surface_path.is_file():
            errors.append(f"{label} authority_surface does not resolve")
        if claim.get("claim_posture") != "source-declared-candidate" or claim.get("authority_effect") != "none":
            errors.append(f"{label} must remain source-declared-candidate with authority_effect none")
    if set(claims_by_role) != {"model-semantic-authority", "instance-semantic-authority"}:
        errors.append("authority claims must contain exactly separate model and instance roles")
    model_claim = claims_by_role.get("model-semantic-authority", {})
    instance_claim = claims_by_role.get("instance-semantic-authority", {})
    if model_claim.get("governed_object_ref") != "cav2.define" or model_claim.get("owner_route") != "CyberAlchemy v2 product owner":
        errors.append("model authority claim does not match the Define model owner and object")
    if instance_claim.get("governed_object_ref") != "cav2.define.system-runtime.v1" or instance_claim.get("owner_route") != "CyberAlchemy v2 Define runtime owner":
        errors.append("instance authority claim does not match the Define system owner and object")
    if model_claim.get("authority_claim_id") == instance_claim.get("authority_claim_id"):
        errors.append("model and instance authority claims collapse to one identity")

    contract_keys = {
        "inherited_contract_id", "contract_digest", "model_ref", "model_ontology_ref",
        "model_state_ref", "model_state_schema_version", "model_state_digest",
        "model_version_ref", "model_version_identity_kind", "model_authority_claim_ref",
        "instance_ref", "instance_kind", "instance_state_ref",
        "instance_version_ref", "instance_state_digest",
        "instance_authority_claim_ref", "relation_kind", "relation_admissibility",
        "relation_evidence_ref", "mandatory_contract_refs",
        "mandatory_contract_terms", "extension_scope", "forbidden_redefinitions",
        "contract_posture", "adoption_decision_ref", "adoption_owner_route",
        "conformance_ref", "challenge_route", "authority_effect"
    }
    contracts = inherited_contract_registry.get("contracts", [])
    contract_ids: set[str] = set()
    for index, contract in enumerate(contracts):
        label = f"inherited contracts[{index}]"
        if not isinstance(contract, dict):
            errors.append(f"{label} must be an object")
            continue
        exact_keys(contract, contract_keys, label, errors)
        contract_id = contract.get("inherited_contract_id")
        if not isinstance(contract_id, str) or not re.fullmatch(r"CA2-INHERITED-CONTRACT-[A-Z0-9-]+", contract_id):
            errors.append(f"{label} inherited_contract_id is invalid")
        elif contract_id in contract_ids:
            errors.append(f"duplicate inherited contract id: {contract_id}")
        else:
            contract_ids.add(contract_id)
        if contract.get("contract_digest") != canonical_record_digest(contract, "contract_digest"):
            errors.append(f"{label} contract_digest does not bind its canonical content")
        if contract.get("model_authority_claim_ref") not in claim_ids or contract.get("instance_authority_claim_ref") not in claim_ids:
            errors.append(f"{label} authority claim refs do not resolve")
        if contract.get("model_authority_claim_ref") == contract.get("instance_authority_claim_ref"):
            errors.append(f"{label} collapses model and instance authority refs")
        if contract.get("model_ref") != define_profile.get("package_id") or define_profile.get("package_version") != "0.4.0-candidate":
            errors.append(f"{label} model identity does not match the Define profile")
        if contract.get("model_state_schema_version") != define_profile.get("schema_version"):
            errors.append(f"{label} model state schema does not match the Define profile")
        if contract.get("model_state_digest") != source_by_id.get(str(contract.get("model_state_ref")), {}).get("sha256"):
            errors.append(f"{label} model state digest does not match its exact source")
        expected_model_version_ref = f"cav2.define@0.4.0-candidate#profile-sha256:{contract.get('model_state_digest')}"
        if contract.get("model_version_ref") != expected_model_version_ref:
            errors.append(f"{label} model_version_ref does not bind the exact candidate profile state")
        if contract.get("instance_ref") != define_system_profile.get("ontology_id"):
            errors.append(f"{label} instance identity does not match the system profile")
        if contract.get("instance_version_ref") != define_system_profile.get("schema_version"):
            errors.append(f"{label} instance version ref does not match the system profile")
        if contract.get("instance_state_digest") != source_by_id.get(str(contract.get("instance_state_ref")), {}).get("sha256"):
            errors.append(f"{label} instance state digest does not match its exact source")
        child_rows = {
            row.get("ontology_id"): row
            for row in define_profile.get("child_packages", [])
            if isinstance(row, dict)
        }
        system_child = child_rows.get("cav2.define.system-runtime.v1", {})
        branch_rows = {
            row.get("branch_id"): row
            for row in define_profile.get("branches", [])
            if isinstance(row, dict)
        }
        if contract.get("relation_kind") != "child-package" or contract.get("relation_admissibility") != "unresolved-candidate" or branch_rows.get("system", {}).get("ownership") != "child-package":
            errors.append(f"{label} child-package relation is not preserved as unresolved candidate")
        if system_child.get("owner_route") != instance_claim.get("owner_route") or system_child.get("authority_effect") != "none":
            errors.append(f"{label} child owner or authority ceiling does not match the instance claim")
        if contract.get("relation_evidence_ref") not in source_ids:
            errors.append(f"{label} relation evidence ref does not resolve")
        for ref in contract.get("mandatory_contract_refs", []):
            if str(ref).split("#", 1)[0] not in source_ids:
                errors.append(f"{label} mandatory contract ref does not resolve: {ref}")
        for key in ("mandatory_contract_terms", "extension_scope", "forbidden_redefinitions"):
            values = contract.get(key)
            if not isinstance(values, list) or not values or len(values) != len(set(values)) or any(not isinstance(item, str) or not item for item in values):
                errors.append(f"{label} {key} is invalid")
        if contract.get("contract_posture") != "candidate-not-adopted" or contract.get("adoption_decision_ref") is not None or contract.get("conformance_ref") is not None:
            errors.append(f"{label} must remain candidate, not adopted, and not conformance-evaluated")
        if contract.get("authority_effect") != "none":
            errors.append(f"{label} authority_effect must be none")
    if len(contracts) != 1:
        errors.append("exactly one inherited contract candidate is required in this slice")

    relation_candidate_keys = {
        "relation_candidate_id", "relation_digest", "project_ref", "source_ref",
        "source_role", "source_version_ref", "target_ref", "target_role",
        "target_version_ref", "inherited_contract_ref", "inherited_contract_digest",
        "direction", "relation_kind", "relation_meaning", "topology_relation_kind",
        "selection_decision_ref", "relation_owner_route", "evidence_refs",
        "relation_posture", "admission_decision_ref", "validation_effect",
        "promotion_effect", "forbidden_collapses", "residue_refs", "challenge_route",
        "authority_effect", "admission_effect", "adoption_effect",
        "conformance_effect", "binding_effect"
    }
    relation_candidates = relation_candidate_registry.get("relations", [])
    relation_candidate_ids: set[str] = set()
    relation_candidate_by_id: dict[str, dict[str, Any]] = {}
    relation_candidate_residue_refs: set[str] = set()
    expected_contract = contracts[0] if len(contracts) == 1 and isinstance(contracts[0], dict) else {}
    for key, expected in {
        "target_version_ref": expected_contract.get("model_version_ref"),
        "inherited_contract_digest": expected_contract.get("contract_digest"),
    }.items():
        if relation_admission_decision_selection.get(key) != expected:
            errors.append(f"relation admission decision {key} does not bind the exact inherited contract")
    for index, relation in enumerate(relation_candidates):
        label = f"model-instance relation candidates[{index}]"
        if not isinstance(relation, dict):
            errors.append(f"{label} must be an object")
            continue
        exact_keys(relation, relation_candidate_keys, label, errors)
        relation_id = relation.get("relation_candidate_id")
        if not isinstance(relation_id, str) or not re.fullmatch(r"CA2-RELATION-CANDIDATE-[A-Z0-9-]+", relation_id):
            errors.append(f"{label} relation_candidate_id is invalid")
        elif relation_id in relation_candidate_ids:
            errors.append(f"duplicate model-instance relation candidate id: {relation_id}")
        else:
            relation_candidate_ids.add(relation_id)
            relation_candidate_by_id[relation_id] = relation
        if relation.get("relation_digest") != canonical_record_digest(relation, "relation_digest"):
            errors.append(f"{label} relation_digest does not bind canonical content")
        expected_relation = {
            "project_ref": "CA2-PROJECT-DEFINE",
            "source_ref": define_system_profile.get("ontology_id"),
            "source_role": "instance-model-candidate",
            "source_version_ref": define_system_profile.get("schema_version"),
            "target_ref": define_profile.get("package_id"),
            "target_role": "parent-model-candidate",
            "target_version_ref": expected_contract.get("model_version_ref"),
            "inherited_contract_ref": expected_contract.get("inherited_contract_id"),
            "inherited_contract_digest": expected_contract.get("contract_digest"),
            "direction": "directed",
            "relation_kind": "instance_of",
            "topology_relation_kind": "child-package",
            "selection_decision_ref": decision_id,
            "relation_owner_route": "CyberAlchemy v2 product owner plus CyberAlchemy v2 Define runtime owner",
            "relation_posture": "selected-candidate-not-admitted",
            "validation_effect": "blocks-concrete-binding-until-relation-admission",
            "promotion_effect": "none",
        }
        for key, expected in expected_relation.items():
            if relation.get(key) != expected:
                errors.append(f"{label} {key} does not match the exact selected candidate contract")
        if relation.get("relation_kind") != relation_decision_selection.get("selected_relation_kind"):
            errors.append(f"{label} relation kind does not match the selected decision")
        if relation.get("admission_decision_ref") is not None:
            errors.append(f"{label} may not claim relation admission")
        if any(relation.get(key) != "none" for key in ("authority_effect", "admission_effect", "adoption_effect", "conformance_effect", "binding_effect", "promotion_effect")):
            errors.append(f"{label} effects must remain none")
        evidence_refs = relation.get("evidence_refs", [])
        allowed_relation_evidence = source_ids | contract_ids | {decision_id}
        if not isinstance(evidence_refs, list) or not evidence_refs or len(evidence_refs) != len(set(evidence_refs)) or set(evidence_refs) - allowed_relation_evidence:
            errors.append(f"{label} evidence refs must resolve to source, exact contract, and selection")
        required_relation_evidence = {"SRC-CAV2-DEFINE-PROFILE", "SRC-CAV2-DEFINE-SYSTEM-PROFILE", expected_contract.get("inherited_contract_id"), decision_id}
        if not required_relation_evidence.issubset(set(evidence_refs)):
            errors.append(f"{label} is missing exact parent, instance, contract, or selection evidence")
        forbidden_collapses = relation.get("forbidden_collapses", [])
        if not isinstance(forbidden_collapses, list) or len(forbidden_collapses) < 4 or len(forbidden_collapses) != len(set(forbidden_collapses)):
            errors.append(f"{label} forbidden_collapses are incomplete")
        residue_refs = relation.get("residue_refs", [])
        if not isinstance(residue_refs, list) or not residue_refs or len(residue_refs) != len(set(residue_refs)):
            errors.append(f"{label} residue_refs must be a non-empty unique array")
        else:
            relation_candidate_residue_refs.update(residue_refs)
    if len(relation_candidates) != 1:
        errors.append("exactly one model-instance relation candidate is required in this slice")

    admitted_relation_keys = {
        "admitted_relation_id", "admitted_relation_digest", "project_ref",
        "relation_candidate_ref", "relation_candidate_digest", "admission_decision_ref",
        "admission_decision_digest", "source_ref", "source_role", "source_version_ref",
        "target_ref", "target_role", "target_version_ref", "direction", "relation_kind",
        "relation_meaning", "topology_relation_kind", "inherited_contract_ref",
        "inherited_contract_digest", "admission_owner_route", "admitted_at", "admission_scope",
        "evidence_refs", "validation_effect", "forbidden_collapses", "residue_refs",
        "challenge_route", "admission_effect", "authority_effect", "adoption_effect",
        "conformance_effect", "binding_effect", "promotion_effect"
    }
    exact_keys(admitted_relation_registry, {
        "schema_ref", "schema_version", "registry_id", "project_ref", "canonical_coupling_ref",
        "canonical_invariant_ref", "status", "relations", "residue_refs", "claim_ceiling",
        "admission_effect", "authority_effect"
    }, "admitted relation registry", errors)
    if admitted_relation_registry.get("schema_version") != "cav2-project-admitted-model-instance-relation-registry/v1" or admitted_relation_registry.get("status") != "admitted":
        errors.append("admitted relation registry identity or status is invalid")
    if admitted_relation_registry.get("admission_effect") != "contains-exact-admitted-relations-only" or admitted_relation_registry.get("authority_effect") != "none":
        errors.append("admitted relation registry effects are invalid")
    admitted_relations = admitted_relation_registry.get("relations", [])
    admitted_relation_ids: set[str] = set()
    admitted_relation_by_id: dict[str, dict[str, Any]] = {}
    admitted_relation_residue_refs: set[str] = set()
    frozen_candidate = relation_candidate_by_id.get("CA2-RELATION-CANDIDATE-DEFINE-SYSTEM-INSTANCE-OF-001", {})
    for index, relation in enumerate(admitted_relations):
        label = f"admitted model-instance relations[{index}]"
        if not isinstance(relation, dict):
            errors.append(f"{label} must be an object")
            continue
        exact_keys(relation, admitted_relation_keys, label, errors)
        relation_id = relation.get("admitted_relation_id")
        if relation_id != "CA2-ADMITTED-RELATION-DEFINE-SYSTEM-INSTANCE-OF-001" or relation_id in admitted_relation_ids:
            errors.append(f"{label} admitted relation identity is invalid or duplicated")
        else:
            admitted_relation_ids.add(relation_id)
            admitted_relation_by_id[relation_id] = relation
        if relation.get("admitted_relation_digest") != canonical_record_digest(relation, "admitted_relation_digest"):
            errors.append(f"{label} admitted_relation_digest does not bind canonical content")
        exact_admitted = {
            "project_ref": "CA2-PROJECT-DEFINE",
            "relation_candidate_ref": frozen_candidate.get("relation_candidate_id"),
            "relation_candidate_digest": frozen_candidate.get("relation_digest"),
            "admission_decision_ref": admission_decision_id,
            "admission_decision_digest": relation_admission_decision_selection.get("decision_digest"),
            "source_ref": frozen_candidate.get("source_ref"), "source_role": frozen_candidate.get("source_role"),
            "source_version_ref": frozen_candidate.get("source_version_ref"), "target_ref": frozen_candidate.get("target_ref"),
            "target_role": frozen_candidate.get("target_role"), "target_version_ref": frozen_candidate.get("target_version_ref"),
            "direction": frozen_candidate.get("direction"), "relation_kind": frozen_candidate.get("relation_kind"),
            "topology_relation_kind": frozen_candidate.get("topology_relation_kind"),
            "inherited_contract_ref": frozen_candidate.get("inherited_contract_ref"),
            "inherited_contract_digest": frozen_candidate.get("inherited_contract_digest"),
            "admission_owner_route": protected_owner_gate, "admission_scope": "typed-relation-witness-only",
            "validation_effect": "eligible-as-typed-relation-witness-only", "admission_effect": "exact-d16-relation-admitted",
        }
        for key, expected in exact_admitted.items():
            if relation.get(key) != expected:
                errors.append(f"{label} {key} does not match the frozen admitted relation")
        if any(relation.get(key) != "none" for key in ("authority_effect", "adoption_effect", "conformance_effect", "binding_effect", "promotion_effect")):
            errors.append(f"{label} inflates a forbidden effect")
        allowed_evidence = source_ids | contract_ids | relation_candidate_ids | {decision_id, admission_decision_id}
        evidence_refs = relation.get("evidence_refs", [])
        if not isinstance(evidence_refs, list) or len(evidence_refs) != len(set(evidence_refs)) or set(evidence_refs) - allowed_evidence:
            errors.append(f"{label} evidence refs do not close")
        required_evidence = {"SRC-CAV2-DEFINITIONS", "SRC-CAV2-DEFINE-PROFILE", "SRC-CAV2-DEFINE-SYSTEM-PROFILE", frozen_candidate.get("inherited_contract_ref"), decision_id, frozen_candidate.get("relation_candidate_id"), admission_decision_id}
        if not required_evidence.issubset(set(evidence_refs)):
            errors.append(f"{label} is missing selection, admission, candidate, contract, parent, or instance evidence")
        residue_refs = relation.get("residue_refs", [])
        if isinstance(residue_refs, list):
            admitted_relation_residue_refs.update(residue_refs)
    if len(admitted_relations) != 1:
        errors.append("exactly one admitted model-instance relation is required in v6")

    adoption_candidate_keys = {
        "adoption_candidate_id", "candidate_digest", "project_ref", "model_ref",
        "model_version_ref", "instance_ref", "inherited_contract_ref",
        "inherited_contract_digest", "semantic_relation_decision_ref",
        "semantic_relation_candidate_ref", "semantic_relation_candidate_digest",
        "semantic_relation_admission_ref", "semantic_relation_admission_digest",
        "semantic_relation_kind", "decision_status", "selected_adoption_posture",
        "owner_decision_ref", "adoption_owner_route", "evidence_refs",
        "residue_refs", "challenge_route", "claim_ceiling", "authority_effect",
        "adoption_effect"
    }
    adoption_candidates = adoption_candidate_registry.get("candidates", [])
    adoption_candidate_ids: set[str] = set()
    adoption_candidate_residue_refs: set[str] = set()
    parent_adoption_decision_id = "CA2-DECISION-DEFINE-EXACT-PARENT-ADOPTION-001"
    contract_by_id = {
        contract.get("inherited_contract_id"): contract
        for contract in contracts
        if isinstance(contract, dict)
    }
    for index, candidate in enumerate(adoption_candidates):
        label = f"adoption decision candidates[{index}]"
        if not isinstance(candidate, dict):
            errors.append(f"{label} must be an object")
            continue
        exact_keys(candidate, adoption_candidate_keys, label, errors)
        candidate_id = candidate.get("adoption_candidate_id")
        if not isinstance(candidate_id, str) or not re.fullmatch(r"CA2-ADOPTION-CANDIDATE-[A-Z0-9-]+", candidate_id):
            errors.append(f"{label} adoption_candidate_id is invalid")
        elif candidate_id in adoption_candidate_ids:
            errors.append(f"duplicate adoption decision candidate id: {candidate_id}")
        else:
            adoption_candidate_ids.add(candidate_id)
        if candidate.get("candidate_digest") != canonical_record_digest(candidate, "candidate_digest"):
            errors.append(f"{label} candidate_digest does not bind its canonical content")
        contract = contract_by_id.get(candidate.get("inherited_contract_ref"), {})
        if not contract:
            errors.append(f"{label} inherited contract ref does not resolve")
        else:
            exact_matches = {
                "project_ref": adoption_candidate_registry.get("project_ref"),
                "model_ref": contract.get("model_ref"),
                "model_version_ref": contract.get("model_version_ref"),
                "instance_ref": contract.get("instance_ref"),
                "inherited_contract_digest": contract.get("contract_digest"),
                "adoption_owner_route": contract.get("adoption_owner_route"),
            }
            for key, expected in exact_matches.items():
                if candidate.get(key) != expected:
                    errors.append(f"{label} {key} does not match its exact inherited contract")
        if candidate.get("semantic_relation_decision_ref") != decision_id:
            errors.append(f"{label} does not bind the selected semantic relation decision")
        relation_candidate = relation_candidate_by_id.get(candidate.get("semantic_relation_candidate_ref"), {})
        if not relation_candidate:
            errors.append(f"{label} semantic relation candidate ref does not resolve")
        else:
            if candidate.get("semantic_relation_candidate_digest") != relation_candidate.get("relation_digest"):
                errors.append(f"{label} semantic relation candidate digest does not match")
            if candidate.get("semantic_relation_kind") != relation_candidate.get("relation_kind"):
                errors.append(f"{label} semantic relation kind does not match its candidate")
        admitted_relation = admitted_relation_by_id.get(candidate.get("semantic_relation_admission_ref"), {})
        if not admitted_relation:
            errors.append(f"{label} semantic relation admission ref does not resolve")
        elif candidate.get("semantic_relation_admission_digest") != admitted_relation.get("admitted_relation_digest"):
            errors.append(f"{label} semantic relation admission digest does not match")
        if candidate.get("decision_status") != "relation-admitted-adoption-unmade":
            errors.append(f"{label} decision_status must remain relation-admitted-adoption-unmade")
        if candidate.get("selected_adoption_posture") is not None or candidate.get("owner_decision_ref") is not None:
            errors.append(f"{label} may not contain an adoption posture or owner decision")
        evidence_refs = candidate.get("evidence_refs", [])
        if not isinstance(evidence_refs, list) or not evidence_refs or len(evidence_refs) != len(set(evidence_refs)):
            errors.append(f"{label} evidence_refs must be a non-empty unique array")
        else:
            unknown_evidence = set(evidence_refs) - source_ids - contract_ids - admitted_relation_ids
            if unknown_evidence:
                errors.append(f"{label} has unknown evidence refs: {', '.join(sorted(unknown_evidence))}")
        residue_refs = candidate.get("residue_refs", [])
        if not isinstance(residue_refs, list) or not residue_refs or len(residue_refs) != len(set(residue_refs)):
            errors.append(f"{label} residue_refs must be a non-empty unique array")
        else:
            adoption_candidate_residue_refs.update(residue_refs)
        if candidate.get("authority_effect") != "none" or candidate.get("adoption_effect") != "none":
            errors.append(f"{label} effects must remain none")
    if len(adoption_candidates) != 1:
        errors.append("exactly one adoption decision candidate is required in this slice")

    exact_adoption_candidate = adoption_candidates[0] if len(adoption_candidates) == 1 and isinstance(adoption_candidates[0], dict) else {}
    if parent_adoption_decision_request.get("decisionId") != parent_adoption_decision_id:
        errors.append("exact parent adoption decision request identity is invalid")
    if parent_adoption_decision_receipt.get("decisionId") != parent_adoption_decision_id:
        errors.append("exact parent adoption decision receipt identity is invalid")
    if parent_adoption_decision_receipt.get("requestDigest") != canonical_document_digest(parent_adoption_decision_request):
        errors.append("exact parent adoption decision receipt does not bind the canonical request")
    expected_parent_adoption_options = {
        "ADOPT-EXACT-PARENT-CONTRACT", "REJECT-EXACT-PARENT-CONTRACT",
        "DEFER-EXACT-PARENT-ADOPTION", "STOP-EXACT-PARENT-ADOPTION"
    }
    parent_adoption_candidates = parent_adoption_decision_request.get("candidates", [])
    parent_adoption_candidate_by_id = {
        row.get("optionId"): row for row in parent_adoption_candidates if isinstance(row, dict)
    }
    if set(parent_adoption_candidate_by_id) != expected_parent_adoption_options or len(parent_adoption_candidates) != len(expected_parent_adoption_options):
        errors.append("exact parent adoption decision request option set is invalid")
    if parent_adoption_decision_receipt.get("routeOutcome") != "gate" or parent_adoption_decision_receipt.get("decisionGateRequired") is not True or parent_adoption_decision_receipt.get("directOptionId") is not None:
        errors.append("exact parent adoption decision must remain at the protected human gate")
    if set(parent_adoption_decision_receipt.get("admissibleOptionIds", [])) != expected_parent_adoption_options or set(parent_adoption_decision_receipt.get("presentedOptionIds", [])) != expected_parent_adoption_options:
        errors.append("exact parent adoption decision receipt must present every admissible option")
    if parent_adoption_decision_receipt.get("rejectedOptions") != [] or parent_adoption_decision_receipt.get("reasons") != []:
        errors.append("exact parent adoption decision receipt unexpectedly rejects a structurally admissible option")
    exact_parent_adoption_owner = "CyberAlchemy v2 Define runtime owner"
    for option_id in ("ADOPT-EXACT-PARENT-CONTRACT", "REJECT-EXACT-PARENT-CONTRACT"):
        option = parent_adoption_candidate_by_id.get(option_id, {})
        if option.get("optionKind") != "action" or option.get("structuralStatus") != "admissible" or option.get("reversibility") != "irreversible" or option.get("hazardClass") != "authority" or option.get("ownerGate") != exact_parent_adoption_owner:
            errors.append(f"exact parent adoption option {option_id} lacks the protected Define runtime owner gate")
    if parent_adoption_candidate_by_id.get("DEFER-EXACT-PARENT-ADOPTION", {}).get("optionKind") != "defer" or parent_adoption_candidate_by_id.get("STOP-EXACT-PARENT-ADOPTION", {}).get("optionKind") != "stop":
        errors.append("exact parent adoption non-action options are invalid")
    frozen_predecision_candidate_digest = "90e225003215d9d1d31e0d4aa2a893528ce59bc79a9568687778117759e9ca67"
    exact_subject_strings = {
        frozen_predecision_candidate_digest,
        str(exact_adoption_candidate.get("model_version_ref")),
        str(exact_adoption_candidate.get("inherited_contract_digest")),
        str(exact_adoption_candidate.get("semantic_relation_admission_digest")),
    }
    adopt_evidence = parent_adoption_candidate_by_id.get("ADOPT-EXACT-PARENT-CONTRACT", {}).get("evidence", [])
    if not all(any(subject in item for item in adopt_evidence if isinstance(item, str)) for subject in exact_subject_strings):
        errors.append("exact parent adoption option does not bind every exact subject digest and version")
    parent_adoption_selection_keys = {
        "schema_ref", "schema_version", "decision_id", "decision_digest", "question",
        "subject_adoption_candidate_ref", "subject_adoption_candidate_digest",
        "selected_option_id", "selected_adoption_posture", "selection_source",
        "selected_at", "owner_route", "decision_posture", "decision_effect",
        "admissibility_request_digest", "admissibility_receipt_ref", "model_ref",
        "model_version_ref", "instance_ref", "inherited_contract_ref",
        "inherited_contract_digest", "semantic_relation_admission_ref",
        "semantic_relation_admission_digest", "rationale", "remaining_blockers",
        "forbidden_effects", "challenge_route", "adoption_effect", "authority_effect",
        "conformance_effect", "binding_effect", "promotion_effect"
    }
    exact_keys(parent_adoption_decision_selection, parent_adoption_selection_keys, "exact parent adoption decision selection", errors)
    if parent_adoption_decision_selection.get("decision_id") != parent_adoption_decision_id:
        errors.append("exact parent adoption decision selection identity is invalid")
    if parent_adoption_decision_selection.get("decision_digest") != canonical_record_digest(parent_adoption_decision_selection, "decision_digest"):
        errors.append("exact parent adoption decision digest does not bind canonical content")
    if parent_adoption_decision_selection.get("selected_option_id") != "ADOPT-EXACT-PARENT-CONTRACT" or parent_adoption_decision_selection.get("selected_option_id") not in parent_adoption_decision_receipt.get("presentedOptionIds", []):
        errors.append("exact parent adoption decision must be the presented ADOPT-EXACT-PARENT-CONTRACT option")
    expected_parent_adoption_selection = {
        "schema_version": "cav2-exact-parent-adoption-decision/v1",
        "subject_adoption_candidate_ref": "CA2-ADOPTION-CANDIDATE-DEFINE-SYSTEM-001",
        "subject_adoption_candidate_digest": frozen_predecision_candidate_digest,
        "selected_adoption_posture": "adopted",
        "selection_source": "user-explicit-choice",
        "owner_route": exact_parent_adoption_owner,
        "decision_posture": "exact-parent-contract-adopted-conformance-unproved",
        "decision_effect": "adopts-exact-parent-version-and-inherited-contract-only",
        "admissibility_request_digest": canonical_document_digest(parent_adoption_decision_request),
        "admissibility_receipt_ref": "option-admissibility-receipt.json",
        "model_ref": exact_adoption_candidate.get("model_ref"),
        "model_version_ref": exact_adoption_candidate.get("model_version_ref"),
        "instance_ref": exact_adoption_candidate.get("instance_ref"),
        "inherited_contract_ref": exact_adoption_candidate.get("inherited_contract_ref"),
        "inherited_contract_digest": exact_adoption_candidate.get("inherited_contract_digest"),
        "semantic_relation_admission_ref": exact_adoption_candidate.get("semantic_relation_admission_ref"),
        "semantic_relation_admission_digest": exact_adoption_candidate.get("semantic_relation_admission_digest"),
        "adoption_effect": "exact-parent-contract-adopted",
    }
    for key, expected in expected_parent_adoption_selection.items():
        if parent_adoption_decision_selection.get(key) != expected:
            errors.append(f"exact parent adoption decision {key} is not exact")
    if any(parent_adoption_decision_selection.get(key) != "none" for key in ("authority_effect", "conformance_effect", "binding_effect", "promotion_effect")):
        errors.append("exact parent adoption decision inflates a forbidden effect")
    if exact_adoption_candidate.get("candidate_digest") != frozen_predecision_candidate_digest or exact_adoption_candidate.get("decision_status") != "relation-admitted-adoption-unmade" or exact_adoption_candidate.get("selected_adoption_posture") is not None or exact_adoption_candidate.get("owner_decision_ref") is not None:
        errors.append("the frozen adoption candidate envelope changed after the owner decision")

    exact_keys(adopted_parent_contract_registry, {
        "schema_ref", "schema_version", "registry_id", "project_ref",
        "canonical_lifecycle_ref", "canonical_invariant_ref", "status", "adoptions",
        "residue_refs", "claim_ceiling", "adoption_effect", "authority_effect"
    }, "adopted parent contract registry", errors)
    if adopted_parent_contract_registry.get("schema_version") != "cav2-project-adopted-parent-contract-registry/v1" or adopted_parent_contract_registry.get("registry_id") != "cav2.project.adopted-parent-contracts":
        errors.append("adopted parent contract registry identity is invalid")
    if adopted_parent_contract_registry.get("project_ref") != "CA2-PROJECT-DEFINE" or adopted_parent_contract_registry.get("canonical_lifecycle_ref") != "CAV2-D48" or adopted_parent_contract_registry.get("canonical_invariant_ref") != "CAV2-D64":
        errors.append("adopted parent contract registry scope is invalid")
    if adopted_parent_contract_registry.get("status") != "adopted-conformance-unproved" or adopted_parent_contract_registry.get("adoption_effect") != "contains-one-exact-parent-contract-adoption" or adopted_parent_contract_registry.get("authority_effect") != "none":
        errors.append("adopted parent contract registry effects are invalid")
    adopted_parent_contract_keys = {
        "adopted_parent_contract_id", "adoption_digest", "project_ref",
        "adoption_candidate_ref", "adoption_candidate_digest",
        "adoption_decision_ref", "adoption_decision_digest", "model_ref",
        "model_version_ref", "instance_ref", "inherited_contract_ref",
        "inherited_contract_digest", "semantic_relation_admission_ref",
        "semantic_relation_admission_digest", "selected_adoption_posture",
        "adoption_owner_route", "conformance_ref", "evidence_refs", "residue_refs",
        "challenge_route", "claim_ceiling", "adoption_effect", "authority_effect",
        "conformance_effect", "binding_effect"
    }
    adopted_parent_contracts = adopted_parent_contract_registry.get("adoptions", [])
    adopted_parent_contract_ids: set[str] = set()
    adopted_parent_contract_residue_refs: set[str] = set()
    for index, adoption in enumerate(adopted_parent_contracts):
        label = f"adopted parent contracts[{index}]"
        if not isinstance(adoption, dict):
            errors.append(f"{label} must be an object")
            continue
        exact_keys(adoption, adopted_parent_contract_keys, label, errors)
        adoption_id = adoption.get("adopted_parent_contract_id")
        if adoption_id != "CA2-ADOPTED-PARENT-CONTRACT-DEFINE-SYSTEM-001" or adoption_id in adopted_parent_contract_ids:
            errors.append(f"{label} identity is invalid or duplicated")
        else:
            adopted_parent_contract_ids.add(adoption_id)
        if adoption.get("adoption_digest") != canonical_record_digest(adoption, "adoption_digest"):
            errors.append(f"{label} adoption_digest does not bind canonical content")
        expected_adoption = {
            "project_ref": "CA2-PROJECT-DEFINE",
            "adoption_candidate_ref": exact_adoption_candidate.get("adoption_candidate_id"),
            "adoption_candidate_digest": frozen_predecision_candidate_digest,
            "adoption_decision_ref": parent_adoption_decision_id,
            "adoption_decision_digest": parent_adoption_decision_selection.get("decision_digest"),
            "model_ref": exact_adoption_candidate.get("model_ref"),
            "model_version_ref": exact_adoption_candidate.get("model_version_ref"),
            "instance_ref": exact_adoption_candidate.get("instance_ref"),
            "inherited_contract_ref": exact_adoption_candidate.get("inherited_contract_ref"),
            "inherited_contract_digest": exact_adoption_candidate.get("inherited_contract_digest"),
            "semantic_relation_admission_ref": exact_adoption_candidate.get("semantic_relation_admission_ref"),
            "semantic_relation_admission_digest": exact_adoption_candidate.get("semantic_relation_admission_digest"),
            "selected_adoption_posture": "adopted",
            "adoption_owner_route": exact_parent_adoption_owner,
            "conformance_ref": None,
            "adoption_effect": "exact-parent-contract-adopted",
        }
        for key, expected in expected_adoption.items():
            if adoption.get(key) != expected:
                errors.append(f"{label} {key} is not exact")
        if any(adoption.get(key) != "none" for key in ("authority_effect", "conformance_effect", "binding_effect")):
            errors.append(f"{label} inflates a forbidden effect")
        allowed_adoption_evidence = source_ids | adoption_candidate_ids | contract_ids | admitted_relation_ids | {parent_adoption_decision_id}
        evidence_refs = adoption.get("evidence_refs", [])
        required_adoption_evidence = {
            "SRC-CAV2-DEFINE-PROFILE", "SRC-CAV2-DEFINE-SYSTEM-PROFILE",
            "CA2-ADOPTION-CANDIDATE-DEFINE-SYSTEM-001", parent_adoption_decision_id,
            "CA2-INHERITED-CONTRACT-DEFINE-SYSTEM-001",
            "CA2-ADMITTED-RELATION-DEFINE-SYSTEM-INSTANCE-OF-001",
        }
        if not isinstance(evidence_refs, list) or len(evidence_refs) != len(set(evidence_refs)) or set(evidence_refs) - allowed_adoption_evidence or not required_adoption_evidence.issubset(set(evidence_refs)):
            errors.append(f"{label} evidence refs do not close exactly")
        residue_refs = adoption.get("residue_refs", [])
        if not isinstance(residue_refs, list) or not residue_refs or len(residue_refs) != len(set(residue_refs)):
            errors.append(f"{label} residue refs are invalid")
        else:
            adopted_parent_contract_residue_refs.update(residue_refs)
    if len(adopted_parent_contracts) != 1:
        errors.append("exactly one adopted parent contract is required in v7")

    exact_keys(conformance_assessment_registry, {
        "schema_ref", "schema_version", "registry_id", "project_ref",
        "canonical_invariant_ref", "evaluation_rule_ref", "status", "assessments",
        "residue_refs", "claim_ceiling", "authority_effect", "conformance_effect"
    }, "conformance assessment registry", errors)
    if (
        conformance_assessment_registry.get("schema_version")
        != "cav2-project-conformance-assessment-registry/v1"
        or conformance_assessment_registry.get("registry_id")
        != "cav2.project.conformance-assessments"
        or conformance_assessment_registry.get("project_ref") != "CA2-PROJECT-DEFINE"
        or conformance_assessment_registry.get("canonical_invariant_ref") != "CAV2-D64"
        or conformance_assessment_registry.get("evaluation_rule_ref")
        != "GOV-RULE-D64-BINDING-COMPLETE"
    ):
        errors.append("conformance assessment registry identity is invalid")
    if (
        conformance_assessment_registry.get("status") != "indeterminate"
        or conformance_assessment_registry.get("authority_effect") != "none"
        or conformance_assessment_registry.get("conformance_effect") != "none"
    ):
        errors.append("conformance assessment registry must remain no-effect indeterminate")

    conformance_assessment_keys = {
        "conformance_assessment_id", "assessment_digest", "project_ref",
        "adopted_parent_contract_ref", "adopted_parent_contract_digest",
        "adoption_decision_ref", "adoption_decision_digest", "inherited_contract_ref",
        "inherited_contract_digest", "semantic_relation_admission_ref",
        "semantic_relation_admission_digest", "model_ref", "model_version_ref",
        "instance_ref", "instance_state_ref", "instance_state_digest", "evaluation_mode",
        "assessed_at", "assessor_route", "term_results", "observed_system_validation",
        "evidence_currency", "assessment_result", "conformance_posture",
        "binding_eligibility", "residue_refs", "challenge_route", "claim_ceiling",
        "authority_effect", "conformance_effect", "binding_effect"
    }
    conformance_term_keys = {
        "term_id", "contract_term_index", "contract_term_pointer", "contract_term",
        "contract_term_digest", "result", "evidence_refs", "reasoning"
    }
    observed_validation_keys = {
        "command", "observed_at", "schema_version", "ontology_id", "material_digest",
        "overall", "blocking_check_ids", "not_evaluable_check_ids",
        "cross_package_drift_refs", "observation_effect"
    }
    assessments = conformance_assessment_registry.get("assessments", [])
    conformance_assessment_ids: set[str] = set()
    conformance_assessment_residue_refs: set[str] = set()
    adopted_contract = (
        adopted_parent_contracts[0]
        if len(adopted_parent_contracts) == 1 and isinstance(adopted_parent_contracts[0], dict)
        else {}
    )
    exact_admitted_relation = admitted_relation_by_id.get(
        "CA2-ADMITTED-RELATION-DEFINE-SYSTEM-INSTANCE-OF-001", {}
    )
    required_term_evidence = {
        1: {"SRC-CAV2-DEFINE-SYSTEM-PROFILE"},
        2: {"SRC-CAV2-DEFINE-PROFILE", "SRC-CAV2-DEFINE-SYSTEM-PROFILE"},
        3: {"SRC-CAV2-DEFINE-AUTHORITY", "SRC-CAV2-DEFINE-CAPABILITY", "SRC-CAV2-DEFINE-SYSTEM-PROFILE"},
        4: {"SRC-CAV2-DEFINE-PROFILE", "SRC-CAV2-DEFINE-AUTHORITY", "SRC-CAV2-DEFINE-SYSTEM-PROFILE", "SRC-CAV2-DEFINE-SYSTEM-RESIDUE"},
    }
    mandatory_terms = expected_contract.get("mandatory_contract_terms", [])
    for index, assessment in enumerate(assessments):
        label = f"conformance assessments[{index}]"
        if not isinstance(assessment, dict):
            errors.append(f"{label} must be an object")
            continue
        exact_keys(assessment, conformance_assessment_keys, label, errors)
        assessment_id = assessment.get("conformance_assessment_id")
        if assessment_id != "CA2-CONFORMANCE-ASSESSMENT-DEFINE-SYSTEM-001" or assessment_id in conformance_assessment_ids:
            errors.append(f"{label} identity is invalid or duplicated")
        else:
            conformance_assessment_ids.add(assessment_id)
        if assessment.get("assessment_digest") != canonical_record_digest(assessment, "assessment_digest"):
            errors.append(f"{label} assessment_digest does not bind canonical content")
        expected_assessment = {
            "project_ref": "CA2-PROJECT-DEFINE",
            "adopted_parent_contract_ref": adopted_contract.get("adopted_parent_contract_id"),
            "adopted_parent_contract_digest": adopted_contract.get("adoption_digest"),
            "adoption_decision_ref": parent_adoption_decision_id,
            "adoption_decision_digest": parent_adoption_decision_selection.get("decision_digest"),
            "inherited_contract_ref": expected_contract.get("inherited_contract_id"),
            "inherited_contract_digest": expected_contract.get("contract_digest"),
            "semantic_relation_admission_ref": exact_admitted_relation.get("admitted_relation_id"),
            "semantic_relation_admission_digest": exact_admitted_relation.get("admitted_relation_digest"),
            "model_ref": expected_contract.get("model_ref"),
            "model_version_ref": expected_contract.get("model_version_ref"),
            "instance_ref": expected_contract.get("instance_ref"),
            "instance_state_ref": expected_contract.get("instance_state_ref"),
            "instance_state_digest": expected_contract.get("instance_state_digest"),
            "evaluation_mode": "review-only",
            "assessor_route": "CyberAlchemy v2 ontology route",
        }
        for key, expected in expected_assessment.items():
            if assessment.get(key) != expected:
                errors.append(f"{label} {key} is not exact")
        term_results = assessment.get("term_results", [])
        seen_term_indexes: set[int] = set()
        for term_index, term_result in enumerate(term_results):
            term_label = f"{label}.term_results[{term_index}]"
            if not isinstance(term_result, dict):
                errors.append(f"{term_label} must be an object")
                continue
            exact_keys(term_result, conformance_term_keys, term_label, errors)
            contract_term_index = term_result.get("contract_term_index")
            if not isinstance(contract_term_index, int) or contract_term_index not in {1, 2, 3, 4} or contract_term_index in seen_term_indexes:
                errors.append(f"{term_label} contract term index is invalid or duplicated")
                continue
            seen_term_indexes.add(contract_term_index)
            expected_term = mandatory_terms[contract_term_index - 1] if len(mandatory_terms) == 4 else None
            expected_term_id = f"CA2-CONFORMANCE-TERM-DEFINE-SYSTEM-{contract_term_index:03d}"
            expected_pointer = f"/contracts/0/mandatory_contract_terms/{contract_term_index - 1}"
            expected_term_digest = hashlib.sha256(str(expected_term).encode("utf-8")).hexdigest()
            if term_result.get("term_id") != expected_term_id:
                errors.append(f"{term_label} term identity is not exact")
            if term_result.get("contract_term_pointer") != expected_pointer:
                errors.append(f"{term_label} term pointer is not exact")
            if term_result.get("contract_term") != expected_term or term_result.get("contract_term_digest") != expected_term_digest:
                errors.append(f"{term_label} term text or digest drifted from the inherited contract")
            if term_result.get("result") != "supported":
                errors.append(f"{term_label} must record structural support only")
            evidence_refs = term_result.get("evidence_refs", [])
            if not isinstance(evidence_refs, list) or len(evidence_refs) != len(set(evidence_refs)) or set(evidence_refs) != required_term_evidence[contract_term_index]:
                errors.append(f"{term_label} evidence refs are not exact")
        if seen_term_indexes != {1, 2, 3, 4}:
            errors.append(f"{label} must assess all four inherited contract terms exactly once")
        observed_validation = assessment.get("observed_system_validation", {})
        if not isinstance(observed_validation, dict):
            errors.append(f"{label} observed_system_validation must be an object")
            observed_validation = {}
        exact_keys(observed_validation, observed_validation_keys, f"{label}.observed_system_validation", errors)
        expected_blockers = {
            "receipt-currency",
            "source-currency:domainspec.architecture-ontology",
            "source-currency:domainspec.current-implementation",
        }
        if (
            observed_validation.get("command")
            != "PYTHONDONTWRITEBYTECODE=1 python3 cyberAlchemy-v2/define/system-ontology/scripts/validate.py"
            or observed_validation.get("schema_version")
            != "cav2.define.system-ontology.validation-result/v1"
            or observed_validation.get("ontology_id") != "cav2.define.system-runtime.v1"
            or observed_validation.get("material_digest")
            != "9dfc1d9e55ef1f18c1d586d6a070a72dc1e1385a86d19107d61342f7b93d2f12"
            or observed_validation.get("overall") != "BLOCK"
            or set(observed_validation.get("blocking_check_ids", [])) != expected_blockers
            or set(observed_validation.get("not_evaluable_check_ids", []))
            != {"domainspec-v2-compilation"}
            or set(observed_validation.get("cross_package_drift_refs", []))
            != {"RES-CAV2-DEFINE-SYS-005"}
            or observed_validation.get("observation_effect") != "none"
        ):
            errors.append(f"{label} must preserve the exact blocking system validation observation")
        if (
            assessment.get("evidence_currency") != "blocked"
            or assessment.get("assessment_result") != "indeterminate"
            or assessment.get("conformance_posture") != "not-proven"
            or assessment.get("binding_eligibility") != "denied"
        ):
            errors.append(f"{label} may not inflate blocked evidence into conformance or binding eligibility")
        if any(assessment.get(key) != "none" for key in ("authority_effect", "conformance_effect", "binding_effect")):
            errors.append(f"{label} inflates a forbidden effect")
        residue_refs = assessment.get("residue_refs", [])
        if not isinstance(residue_refs, list) or not residue_refs or len(residue_refs) != len(set(residue_refs)):
            errors.append(f"{label} residue refs are invalid")
        else:
            conformance_assessment_residue_refs.update(residue_refs)
    if len(assessments) != 1:
        errors.append("exactly one indeterminate conformance assessment is required in v8")

    residue_records = binding_residue.get("records", [])
    residue_ids: set[str] = set()
    for index, row in enumerate(residue_records):
        label = f"binding residue[{index}]"
        if not isinstance(row, dict):
            errors.append(f"{label} must be an object")
            continue
        exact_keys(row, {
            "residue_id", "status", "kind", "statement", "owner_route",
            "subject_refs", "authority_effect"
        }, label, errors)
        residue_id = row.get("residue_id")
        if residue_id in residue_ids:
            errors.append(f"duplicate binding residue id: {residue_id}")
        if isinstance(residue_id, str):
            residue_ids.add(residue_id)
        if row.get("authority_effect") != "none":
            errors.append(f"{label} authority_effect must be none")
    if set(binding_registry.get("residue_refs", [])) - residue_ids:
        errors.append("binding registry has unresolved residue refs")
    if set(construction_binding_registry.get("residue_refs", [])) - residue_ids:
        errors.append("construction binding registry has unresolved residue refs")
    if set(authority_claim_registry.get("residue_refs", [])) - residue_ids:
        errors.append("authority claim registry has unresolved residue refs")
    if set(inherited_contract_registry.get("residue_refs", [])) - residue_ids:
        errors.append("inherited contract registry has unresolved residue refs")
    if set(relation_candidate_registry.get("residue_refs", [])) - residue_ids:
        errors.append("model-instance relation candidate registry has unresolved residue refs")
    if set(admitted_relation_registry.get("residue_refs", [])) - residue_ids:
        errors.append("admitted model-instance relation registry has unresolved residue refs")
    if set(adoption_candidate_registry.get("residue_refs", [])) - residue_ids:
        errors.append("adoption decision candidate registry has unresolved residue refs")
    if set(adopted_parent_contract_registry.get("residue_refs", [])) - residue_ids:
        errors.append("adopted parent contract registry has unresolved residue refs")
    if set(conformance_assessment_registry.get("residue_refs", [])) - residue_ids:
        errors.append("conformance assessment registry has unresolved residue refs")
    if adoption_candidate_residue_refs - residue_ids:
        errors.append("adoption decision candidate has unresolved residue refs")
    if adopted_parent_contract_residue_refs - residue_ids:
        errors.append("adopted parent contract has unresolved residue refs")
    if relation_candidate_residue_refs - residue_ids:
        errors.append("model-instance relation candidate has unresolved residue refs")
    if admitted_relation_residue_refs - residue_ids:
        errors.append("admitted model-instance relation has unresolved residue refs")
    if conformance_assessment_residue_refs - residue_ids:
        errors.append("conformance assessment has unresolved residue refs")

    binding_entries = binding_registry.get("bindings", [])
    binding_ids: set[str] = set()
    binding_project_refs: dict[str, set[str]] = {}
    binding_keys = {
        "binding_id", "project_ref", "model_ref", "model_version_ref",
        "model_authority_claim", "instance_ref", "instance_kind",
        "instance_authority_claim", "relation_kind", "inherited_contract_ref",
        "extension_scope", "adoption_decision_ref", "adoption_owner_route",
        "adoption_posture", "conformance_ref", "lifecycle_state", "altitude",
        "evidence_refs", "challenge_route", "drift_owner_route", "drift_route",
        "recomposition_route", "recursion_budget_or_stop",
        "terminal_owner_or_handoff", "authority_effect"
    }
    evaluation_keys = {"rule_ref", "evaluation_mode", "result", "residue_refs", "authority_effect"}
    for index, entry in enumerate(binding_entries):
        label = f"binding entries[{index}]"
        if not isinstance(entry, dict):
            errors.append(f"{label} must be an object")
            continue
        exact_keys(entry, {"binding", "evaluation"}, label, errors)
        binding = entry.get("binding", {})
        evaluation = entry.get("evaluation", {})
        if not isinstance(binding, dict) or not isinstance(evaluation, dict):
            errors.append(f"{label} binding and evaluation must be objects")
            continue
        exact_keys(binding, binding_keys, f"{label}.binding", errors)
        exact_keys(evaluation, evaluation_keys, f"{label}.evaluation", errors)
        binding_id = binding.get("binding_id")
        if binding_id in binding_ids:
            errors.append(f"duplicate binding id: {binding_id}")
        if isinstance(binding_id, str):
            binding_ids.add(binding_id)
        if not isinstance(binding_id, str) or not re.fullmatch(r"CA2-BINDING-[A-Z0-9-]+", binding_id):
            errors.append(f"{label} binding_id is invalid")
        project_ref = binding.get("project_ref")
        if not isinstance(project_ref, str) or not re.fullmatch(r"CA2-PROJECT-[A-Z0-9-]+", project_ref):
            errors.append(f"{label} project_ref is invalid")
        binding_project_refs.setdefault(str(project_ref), set()).add(str(binding_id))
        required_exact_strings = [
            "model_ref", "model_version_ref", "model_authority_claim", "instance_ref",
            "instance_kind", "instance_authority_claim", "relation_kind",
            "inherited_contract_ref", "adoption_decision_ref", "adoption_owner_route",
            "conformance_ref", "challenge_route", "drift_owner_route", "drift_route",
            "recomposition_route", "recursion_budget_or_stop", "terminal_owner_or_handoff"
        ]
        if any(not isinstance(binding.get(key), str) or not binding.get(key) for key in required_exact_strings):
            errors.append(f"{label} has missing exact binding fields")
        extension_scope = binding.get("extension_scope")
        evidence_refs = binding.get("evidence_refs")
        if not isinstance(extension_scope, list) or not extension_scope or len(extension_scope) != len(set(extension_scope)) or any(not isinstance(item, str) or not item for item in extension_scope):
            errors.append(f"{label} extension_scope is invalid")
        if not isinstance(evidence_refs, list) or not evidence_refs or len(evidence_refs) != len(set(evidence_refs)) or any(not isinstance(item, str) or not item for item in evidence_refs):
            errors.append(f"{label} evidence_refs is invalid")
        if not isinstance(binding.get("altitude"), int) or binding.get("altitude", -1) < 0:
            errors.append(f"{label} altitude is invalid")
        if binding.get("adoption_posture") not in {"adopted", "not-adopted", "rejected", "withdrawn"}:
            errors.append(f"{label} adoption_posture is invalid")
        if binding.get("lifecycle_state") not in {"candidate", "active", "retired", "superseded"}:
            errors.append(f"{label} lifecycle_state is invalid")
        if binding.get("model_authority_claim") == binding.get("instance_authority_claim"):
            errors.append(f"{label} collapses model and instance authority lanes")
        if binding.get("model_authority_claim") not in claim_ids or binding.get("instance_authority_claim") not in claim_ids:
            errors.append(f"{label} authority claim refs do not resolve through the prerequisite registry")
        if binding.get("inherited_contract_ref") not in contract_ids:
            errors.append(f"{label} inherited contract ref does not resolve through the prerequisite registry")
        if binding.get("adoption_decision_ref") in adoption_candidate_ids:
            errors.append(f"{label} may not use a candidate envelope as an owner adoption decision")
        if binding.get("adoption_decision_ref") in relation_candidate_ids or binding.get("adoption_decision_ref") in admitted_relation_ids or binding.get("adoption_decision_ref") in {decision_id, admission_decision_id}:
            errors.append(f"{label} may not use a relation selection, admission, or relation record as an owner adoption decision")
        if binding.get("adoption_decision_ref") != parent_adoption_decision_id:
            errors.append(f"{label} must reference the exact D48 owner adoption decision")
        if binding.get("relation_kind") == "owns":
            errors.append(f"{label} may not use owns as the model-instance relation")
        if binding.get("authority_effect") != "none" or evaluation.get("authority_effect") != "none":
            errors.append(f"{label} effects must remain none")
        if evaluation.get("rule_ref") != "GOV-RULE-D64-BINDING-COMPLETE" or evaluation.get("evaluation_mode") != "review-only":
            errors.append(f"{label} evaluation contract is invalid")
        if evaluation.get("result") not in {"satisfied", "violated", "indeterminate"}:
            errors.append(f"{label} evaluation result is invalid")
        if evaluation.get("result") != "satisfied" and not evaluation.get("residue_refs"):
            errors.append(f"{label} non-satisfied evaluation requires residue")
        if set(evaluation.get("residue_refs", [])) - residue_ids:
            errors.append(f"{label} evaluation has unresolved residue refs")
        if binding.get("adoption_posture") != "adopted" and evaluation.get("result") == "satisfied":
            errors.append(f"{label} cannot satisfy D64 without adopted posture")
        if binding.get("conformance_ref") in conformance_assessment_ids:
            errors.append(f"{label} may not use an indeterminate assessment as conformance proof")
    if binding_entries:
        errors.append("v11 two-lane planning slice does not change the empty RecursiveInstanceBinding registry")
    construction_binding_entries = construction_binding_registry.get("bindings", [])
    if not isinstance(construction_binding_entries, list):
        errors.append("construction binding registry bindings must be an array")
        construction_binding_entries = []
    if not construction_binding_entries:
        errors.append("v11 two-lane construction registry must contain at least one binding")
    construction_binding_ids = {
        row.get("construction_id")
        for row in construction_binding_entries
        if isinstance(row, dict) and isinstance(row.get("construction_id"), str)
    }
    construction_binding_project_refs: dict[str, set[str]] = {}
    for row in construction_binding_entries:
        if not isinstance(row, dict):
            continue
        project_ref = row.get("project_ref")
        construction_id = row.get("construction_id")
        if isinstance(project_ref, str) and isinstance(construction_id, str):
            construction_binding_project_refs.setdefault(project_ref, set()).add(construction_id)
    d65_errors, _ = validate_d65_prototype_binding()
    errors.extend(f"D65 prototype binding: {error}" for error in d65_errors)
    all_project_binding_refs: set[str] = set()
    for project_id, project in project_by_id.items():
        project_binding_refs = set(project.get("instance_binding_refs", []))
        all_project_binding_refs.update(project_binding_refs)
        if project_binding_refs != binding_project_refs.get(project_id, set()):
            errors.append(f"Project {project_id} instance_binding_refs and owned registry bindings do not close bidirectionally")
    if set(binding_project_refs) - set(project_by_id):
        errors.append("binding registry contains an unresolvable or non-owned project_ref")
    for project_id, project in project_by_id.items():
        project_construction_refs = set(project.get("construction_binding_refs", []))
        if project_construction_refs != construction_binding_project_refs.get(project_id, set()):
            errors.append(f"Project {project_id} construction_binding_refs and owned registry bindings do not close bidirectionally")
    if binding_entries and any(candidate.get("owner_decision_ref") != parent_adoption_decision_id for candidate in adoption_candidates if isinstance(candidate, dict)):
        errors.append("concrete bindings are forbidden without the exact D48 owner adoption decision")

    total_condition_ids = 0
    for goal_id, goal in goal_by_id.items():
        project = project_by_id.get(str(goal.get("project_ref")), {})
        evidence_ids = {
            item.get("evidence_id")
            for item in project.get("evidence_index", [])
            if isinstance(item, dict)
        }
        condition_ids: set[str] = set()
        all_met = True
        for index, condition in enumerate(goal.get("success_conditions", [])):
            if not isinstance(condition, dict) or set(condition) != {"id", "statement", "evidence_requirement", "status", "evidence_refs"}:
                errors.append(f"Goal {goal_id} success_conditions[{index}] has an invalid shape")
                continue
            condition_id = condition.get("id")
            if condition_id in condition_ids:
                errors.append(f"Goal {goal_id} has duplicate success condition: {condition_id}")
            if isinstance(condition_id, str):
                condition_ids.add(condition_id)
            if condition.get("status") not in {"unmet", "partial", "met"}:
                errors.append(f"Goal {goal_id} condition {condition_id} has invalid status")
            if condition.get("status") != "met":
                all_met = False
            for ref in condition.get("evidence_refs", []):
                if ref not in evidence_ids:
                    errors.append(f"Goal {goal_id} condition {condition_id} has unknown evidence {ref}")
        total_condition_ids += len(condition_ids)
        if goal.get("lifecycle_state") == "achieved" and (not all_met or goal.get("achievement_state") != "proved"):
            errors.append(f"Goal {goal_id} achieved requires every condition met and achievement_state proved")
        if goal.get("lifecycle_state") != "achieved" and goal.get("achievement_state") == "proved":
            errors.append(f"Goal {goal_id} achievement_state proved requires lifecycle_state achieved")
        for item in goal.get("evidence_refs", []):
            if not isinstance(item, dict):
                errors.append(f"Goal {goal_id} evidence_refs contains a non-object")
                continue
            if item.get("evidence_id") not in evidence_ids:
                errors.append(f"Goal {goal_id} has unknown Project evidence {item.get('evidence_id')}")
            for condition_ref in item.get("supports_conditions", []):
                if condition_ref not in condition_ids:
                    errors.append(f"Goal {goal_id} evidence points to unknown condition {condition_ref}")
            if item.get("source_id") not in source_ids:
                errors.append(f"Goal {goal_id} evidence uses unknown source {item.get('source_id')}")
        thesis_node_ids = {
            ref.get("ontology_node_id")
            for ref in goal.get("thesis_refs", [])
            if isinstance(ref, dict)
        }
        if "CA2-THESIS-GOVERNED-HMI" not in thesis_node_ids:
            errors.append(f"Goal {goal_id} must trace to the CyberAlchemy product thesis node")

    nodes = view.get("nodes", [])
    node_ids = {node.get("id") for node in nodes if isinstance(node, dict)}
    if len(node_ids) != len(nodes):
        errors.append("ontology view has duplicate or invalid node IDs")
    relation_types = {item.get("id") for item in view.get("relation_vocabulary", []) if isinstance(item, dict)}
    relation_ids: set[str] = set()
    relation_rows: list[dict[str, Any]] = []
    for relation in view.get("relations", []):
        if not isinstance(relation, dict):
            errors.append("ontology relation must be an object")
            continue
        relation_rows.append(relation)
        relation_id = relation.get("id")
        if relation_id in relation_ids:
            errors.append(f"ontology view has duplicate relation id: {relation_id}")
        if isinstance(relation_id, str):
            relation_ids.add(relation_id)
        if relation.get("source") not in node_ids or relation.get("target") not in node_ids:
            errors.append(f"ontology relation has unknown endpoint: {relation_id}")
        if relation.get("type") not in relation_types:
            errors.append(f"ontology relation has unknown type: {relation_id}")
        for evidence_ref in relation.get("evidence_refs", []):
            if evidence_ref not in source_ids and evidence_ref not in node_ids:
                errors.append(f"ontology relation {relation_id} has unknown evidence ref: {evidence_ref}")
    required_nodes = set(project_by_id) | set(goal_by_id) | {
        "CAV2-D16", "CAV2-D34", "CAV2-D48", "CAV2-D59", "CAV2-D60", "CAV2-D64", "CAV2-D65",
        "CAV2-PROJECT-AUTHORITY-CLAIM-REGISTRY",
        "CAV2-PROJECT-INHERITED-CONTRACT-REGISTRY",
        "CAV2-PROJECT-MODEL-INSTANCE-RELATION-CANDIDATE-REGISTRY",
        "CAV2-PROJECT-ADMITTED-MODEL-INSTANCE-RELATION-REGISTRY",
        "CAV2-PROJECT-ADOPTION-DECISION-CANDIDATE-REGISTRY",
        "CAV2-PROJECT-ADOPTED-PARENT-CONTRACT-REGISTRY",
        "CAV2-PROJECT-CONFORMANCE-ASSESSMENT-REGISTRY",
        "CAV2-PROJECT-INSTANCE-BINDING-REGISTRY",
        "CAV2-PROJECT-CONSTRUCTION-BINDING-REGISTRY", "CA2-THESIS-GOVERNED-HMI",
        "cav2.define", "cav2.define.system-runtime.v1",
        "CA2-DECISION-DEFINE-MODEL-INSTANCE-RELATION-001",
        "CA2-DECISION-DEFINE-MODEL-INSTANCE-RELATION-ADMISSION-001",
        "CA2-DECISION-DEFINE-EXACT-PARENT-ADOPTION-001",
        "CA2-ADOPTED-PARENT-CONTRACT-DEFINE-SYSTEM-001",
        "CA2-CONFORMANCE-ASSESSMENT-DEFINE-SYSTEM-001"
    }
    required_nodes.update(claim_ids)
    required_nodes.update(contract_ids)
    required_nodes.update(relation_candidate_ids)
    required_nodes.update(admitted_relation_ids)
    required_nodes.update(adoption_candidate_ids)
    for required in required_nodes:
        if required not in node_ids:
            errors.append(f"ontology view is missing required node: {required}")
    required_construction_edges = {
        ("CAV2-D60", "CAV2-PROJECT-CONSTRUCTION-BINDING-REGISTRY", "carries_construction_binding"),
        ("CAV2-PROJECT-CONSTRUCTION-BINDING-REGISTRY", "CAV2-D65", "shaped_by"),
    }
    observed_construction_edges = {
        (relation.get("source"), relation.get("target"), relation.get("type"))
        for relation in relation_rows
        if relation.get("id") in {"GOAL-REL-042", "GOAL-REL-043"}
    }
    if observed_construction_edges != required_construction_edges:
        errors.append("ontology view must project the Project-owned CAV2-D65 ConstructionBinding registry boundary exactly")
    projected_admitted_relations = [
        relation for relation in relation_rows
        if relation.get("source") == "cav2.define.system-runtime.v1"
        and relation.get("target") == "cav2.define"
        and relation.get("type") == "admitted_instance_of"
    ]
    if len(projected_admitted_relations) != 1:
        errors.append("ontology view must project exactly one qualified admitted_instance_of relation")
    elif set(projected_admitted_relations[0].get("evidence_refs", [])) != {
        "CA2-ADMITTED-RELATION-DEFINE-SYSTEM-INSTANCE-OF-001",
        "CA2-RELATION-CANDIDATE-DEFINE-SYSTEM-INSTANCE-OF-001",
        "CA2-DECISION-DEFINE-MODEL-INSTANCE-RELATION-001",
        "CA2-DECISION-DEFINE-MODEL-INSTANCE-RELATION-ADMISSION-001",
        "SRC-CAV2-DEFINE-PROFILE",
        "SRC-CAV2-DEFINE-SYSTEM-PROFILE",
    }:
        errors.append("admitted_instance_of projection must bind admitted relation, candidate, selections, parent, and instance evidence")
    if any(
        relation.get("source") == "cav2.define.system-runtime.v1"
        and relation.get("target") == "cav2.define"
        and relation.get("type") in {"instance_of", "candidate_instance_of"}
        for relation in relation_rows
    ):
        errors.append("ontology view may not weaken the admitted relation to candidate_instance_of or direct instance_of")
    projected_adoption_resolutions = [
        relation for relation in relation_rows
        if relation.get("source") == "CA2-ADOPTION-CANDIDATE-DEFINE-SYSTEM-001"
        and relation.get("target") == parent_adoption_decision_id
        and relation.get("type") == "resolved_by_adoption"
    ]
    if len(projected_adoption_resolutions) != 1 or set(projected_adoption_resolutions[0].get("evidence_refs", [])) != {
        "CA2-ADOPTION-CANDIDATE-DEFINE-SYSTEM-001", parent_adoption_decision_id
    }:
        errors.append("ontology view must project exactly one resolved exact parent adoption envelope")
    projected_exact_adoptions = [
        relation for relation in relation_rows
        if relation.get("source") == parent_adoption_decision_id
        and relation.get("target") == "CA2-INHERITED-CONTRACT-DEFINE-SYSTEM-001"
        and relation.get("type") == "adopts_exact_contract"
    ]
    if len(projected_exact_adoptions) != 1 or set(projected_exact_adoptions[0].get("evidence_refs", [])) != {
        parent_adoption_decision_id,
        "CA2-INHERITED-CONTRACT-DEFINE-SYSTEM-001",
        "CA2-ADMITTED-RELATION-DEFINE-SYSTEM-INSTANCE-OF-001",
    }:
        errors.append("ontology view must project exactly one exact owner parent-contract adoption")
    projected_adoption_registry_edges = [
        relation for relation in relation_rows
        if relation.get("source") == "CAV2-PROJECT-ADOPTED-PARENT-CONTRACT-REGISTRY"
        and relation.get("target") == "CA2-ADOPTED-PARENT-CONTRACT-DEFINE-SYSTEM-001"
        and relation.get("type") == "contains_adoption"
    ]
    if len(projected_adoption_registry_edges) != 1:
        errors.append("ontology view must project the Project-owned adopted parent contract registry")
    projected_adoption_decision_edges = [
        relation for relation in relation_rows
        if relation.get("source") == "CA2-ADOPTED-PARENT-CONTRACT-DEFINE-SYSTEM-001"
        and relation.get("target") == parent_adoption_decision_id
        and relation.get("type") == "projects_adoption_decision"
    ]
    if len(projected_adoption_decision_edges) != 1:
        errors.append("ontology view must close the adopted parent contract projection to its owner decision")
    projected_conformance_registry_edges = [
        relation for relation in relation_rows
        if relation.get("source") == "CAV2-PROJECT-CONFORMANCE-ASSESSMENT-REGISTRY"
        and relation.get("target") == "CA2-CONFORMANCE-ASSESSMENT-DEFINE-SYSTEM-001"
        and relation.get("type") == "contains_assessment"
    ]
    if len(projected_conformance_registry_edges) != 1:
        errors.append("ontology view must project the Project-owned conformance assessment registry")
    projected_conformance_assessment_edges = [
        relation for relation in relation_rows
        if relation.get("source") == "CA2-CONFORMANCE-ASSESSMENT-DEFINE-SYSTEM-001"
        and relation.get("target") == "CA2-ADOPTED-PARENT-CONTRACT-DEFINE-SYSTEM-001"
        and relation.get("type") == "assesses_conformance_of"
    ]
    if len(projected_conformance_assessment_edges) != 1 or set(projected_conformance_assessment_edges[0].get("evidence_refs", [])) != {
        "CA2-CONFORMANCE-ASSESSMENT-DEFINE-SYSTEM-001",
        "CA2-ADOPTED-PARENT-CONTRACT-DEFINE-SYSTEM-001",
        "SRC-CAV2-DEFINE-SYSTEM-PROFILE",
        "SRC-CAV2-DEFINE-SYSTEM-RESIDUE",
    }:
        errors.append("ontology view must project one exact indeterminate assessment of the adopted contract")

    digest = material_digest(material_files, errors)
    status = "PASS" if not errors else "BLOCK"
    receipt = {
        "schema_version": "cav2-goal-package-validation/v1",
        "validated_at": datetime.now(timezone.utc).isoformat() if args.write_receipt else None,
        "status": status,
        "package_root": "cyberAlchemy-v2/goals",
        "material_digest": digest,
        "counts": {"sources": len(source_ids), "projects": len(project_by_id), "goals": len(goal_by_id), "authority_claim_candidates": len(claim_ids), "inherited_contract_candidates": len(contract_ids), "model_instance_relation_candidates": len(relation_candidate_ids), "admitted_model_instance_relations": len(admitted_relation_ids), "adoption_decision_candidates": len(adoption_candidate_ids), "adopted_parent_contracts": len(adopted_parent_contract_ids), "conformance_assessments": len(conformance_assessment_ids), "project_bindings": len(binding_ids), "construction_bindings": len(construction_binding_ids), "binding_residue": len(residue_ids), "success_conditions": total_condition_ids, "ontology_nodes": len(node_ids), "ontology_relations": len(view.get("relations", []))},
        "authority_effect": "none",
        "errors": errors,
    }
    if args.write_receipt:
        receipts = PACKAGE_ROOT / "receipts"
        receipts.mkdir(exist_ok=True)
        receipt_path = receipts / f"validation-{digest[:16]}.json"
        if not receipt_path.exists():
            receipt_path.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(receipt, indent=2))
    return 0 if status == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
