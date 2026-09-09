#!/usr/bin/env python3
"""Validate the private governance ontology without activating governance."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = Path(__file__).resolve().parents[4]

MATERIAL_FILES = (
    "README.md",
    "profile.json",
    "sources.json",
    "nodes.json",
    "relations.json",
    "invariants.json",
    "rules.json",
    "product-bindings.json",
    "ontology-scaffolds.json",
    "prototype-constructions.json",
    "identity-policy.json",
    "residue.json",
    "migration.json",
    "schema-amendment-d64.json",
    "schema-amendment-d65-r2.json",
    "module.json",
    "documents.json",
    "docs/AUTHORITY.md",
    "docs/DOMAIN-MODEL.md",
    "docs/EVIDENCE.md",
    "docs/LIFECYCLE.md",
    "docs/PRODUCT.md",
    "docs/RUNTIME.md",
    "schemas/governance-ontology.schema.json",
    "schemas/ontology-scaffold.schema.json",
    "schemas/prototype-construction.schema.json",
    "scripts/validate-prototype-construction.py",
    "scripts/validate.py",
    "scripts/validate-module.py",
    "tests/test_d65_prototype_construction.py",
    "receipts/d65-r2-prototype-tests.json",
)

PROFILE_KEYS = {
    "schema_ref", "schema_version", "ontology_id", "title", "ontology_type",
    "branch", "materialization", "package_root", "package_owner", "meaning_owner",
    "visibility", "candidate_status", "authority_effect", "enforcement_effect",
    "source_registry", "node_registry", "relation_registry", "invariant_registry",
    "rule_registry", "product_binding_registry",
    "ontology_scaffold_registry", "prototype_construction_registry",
    "ontology_scaffold_schema", "prototype_construction_schema",
    "prototype_construction_validator", "prototype_construction_amendment",
    "identity_policy", "residue_registry", "migration_manifest", "module_manifest", "schema_path",
    "validator_path", "blocked_outputs",
}
SOURCE_KEYS = {
    "id", "path", "import_sha256", "digest_role", "posture", "owner_route",
    "required_selectors",
}
NODE_KEYS = {
    "id", "label", "domainspec_v2_meta_type_id", "domainspec_v2_meta_type",
    "mapping_posture", "canonical_definition_ref", "identity", "required_fields",
    "allowed_values", "owner_route", "candidate_status", "authority_effect",
    "enforcement_effect", "forbidden_collapse",
}
VOCABULARY_KEYS = {"id", "label", "source_type", "target_type", "forbidden_collapse"}
RELATION_KEYS = {
    "id", "type", "source", "target", "direction", "owner_route",
    "authority_effect", "enforcement_effect", "forbidden_collapse",
}
INVARIANT_KEYS = {
    "id", "owner_qualified_version", "instance_of", "canonical_definition_ref",
    "canonical_schema_ref", "canonical_selector", "canonical_meaning_owner",
    "registration_owner", "source_status", "registry_status", "semantic_version_ref",
    "basis_refs", "axiom_grounding", "validation_mode", "operational_rule_refs",
    "authority_effect", "enforcement_effect", "implementation_effect", "forbidden_collapse",
}
RULE_KEYS = {
    "id", "owner_qualified_version", "instance_of", "operationalizes", "rule_kind",
    "subject_kind", "evaluation_contract_ref", "review_outcomes", "validation_mode",
    "owner_route", "adoption_state", "constitution_refs", "enforcement_binding_refs",
    "authority_effect", "enforcement_effect", "implementation_effect", "forbidden_collapse",
}
BINDING_KEYS = {
    "id", "source_kind", "source_ref", "target_node_id", "target_expectation",
    "relation", "binding_status", "currentness", "authority_effect",
    "enforcement_effect", "implementation_effect", "claim_ceiling",
}
RESIDUE_KEYS = {"id", "issue", "effect", "status", "owner_route", "subject_refs"}
DOCUMENT_KEYS = {
    "id", "path", "title", "role", "intended_canonical_kind", "durability",
    "status", "canonical_status", "authority_state", "owner_route",
    "projection_refs", "required_headings", "authority_effect",
    "enforcement_effect", "claim_ceiling",
}

META_TYPES = {
    "DS-D1.1": "Entity",
    "DS-D1.2": "Value Object",
    "DS-D1.3": "Enum",
    "DS-D1.6": "Calculation",
    "DS-D1.7": "Rule",
    "DS-D1.8": "Policy",
    "DS-D1.9": "Workflow",
    "DS-D1.12": "Event",
}
CANONICAL_REFS = {"CAV2-D34", "CAV2-D50", "CAV2-D53", "CAV2-D54", "CAV2-D58"}
RELATION_CONTRACTS = {
    "grounds": ("GovernanceAxiom", "GovernanceInvariant"),
    "is_operationalized_by": ("GovernanceInvariant", "GovernanceRule"),
    "is_classified_as": ("GovernanceRule", "GovernanceRuleKind"),
    "is_observed_by": ("GovernanceRule", "GovernanceObservation"),
    "supports": ("GovernanceEvidence", "GovernanceAssessment"),
    "produces": ("AssessGovernance", "GovernanceAssessment"),
    "is_evaluated_under": ("GovernanceAssessment", "GovernancePolicy"),
    "may_inform": ("GovernancePolicy", "GovernanceDecision"),
    "adopts_exact": ("GovernanceDecision", "GovernanceConstitution"),
    "contains_rule": ("GovernanceConstitution", "GovernanceRule"),
    "contains_policy": ("GovernanceConstitution", "GovernancePolicy"),
    "is_realized_by": ("GovernanceDiscipline", "RunGovernanceDiscipline"),
    "coordinates": ("RunGovernanceDiscipline", "AssessGovernance"),
    "is_scoped_by": ("GovernanceRule", "GovernanceAuthority"),
    "is_measured_by": ("GovernanceRule", "FrictionMetricContract"),
}
EXPECTED_BINDINGS = {
    "GOV-PRODUCT-001": ("cav2.governance-model", "GOV-PRODUCT-MODULE", "is_candidate_domain_ontology_of"),
    "GOV-PRODUCT-002": ("cav2.governance-model", "GOV-CAP-ENFORCE-ACTIVE-RULES", "provides_candidate_domain_model_for"),
    "GOV-PRODUCT-003": ("GovernanceConstitution", "GOV-RULE-ONLY-ADOPTED-APPLICABLE-RULES-ENFORCE", "provides_candidate_adoption_and_scope_semantics_for"),
    "GOV-PRODUCT-004": ("GovernanceAuthority", "GOV-RULE-ONLY-ADOPTED-APPLICABLE-RULES-ENFORCE", "provides_candidate_authority_semantics_for"),
    "GOV-PRODUCT-005": ("GovernanceRule", "GOV-RULE-ONLY-ADOPTED-APPLICABLE-RULES-ENFORCE", "is_constrained_by_candidate_product_rule"),
    "GOV-PRODUCT-006": ("GovernanceRule", "GOV-RULE-HARM-BASIS-REQUIRED", "provides_candidate_assessment_subject_semantics_for"),
    "GOV-PRODUCT-007": ("GovernanceAssessment", "GOV-OUTPUT-GOVERNANCE-ASSESSMENT", "provides_candidate_output_semantics_for"),
    "GOV-PRODUCT-008": ("FrictionMetricContract", "GOV-MEASURE-REFRESH-CHURN", "provides_candidate_measure_contract_for"),
    "GOV-PRODUCT-009": ("cav2.governance-model", "GOV-OUT-CONTROLLED-CONSEQUENCES", "intends_to_contribute_to"),
}


def load_json(relative_path: str, errors: list[str]) -> dict[str, Any]:
    path = PACKAGE_ROOT / relative_path
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        errors.append(f"missing package file: {relative_path}")
        return {}
    except json.JSONDecodeError as exc:
        errors.append(f"invalid JSON in {relative_path}: {exc}")
        return {}
    if not isinstance(value, dict):
        errors.append(f"{relative_path} must contain one JSON object")
        return {}
    return value


def exact_keys(value: Any, expected: set[str], label: str, errors: list[str]) -> None:
    if not isinstance(value, dict):
        errors.append(f"{label} must be an object")
        return
    missing = sorted(expected - set(value))
    extra = sorted(set(value) - expected)
    if missing:
        errors.append(f"{label} missing keys: {', '.join(missing)}")
    if extra:
        errors.append(f"{label} has unknown keys: {', '.join(extra)}")


def unique_ids(records: list[Any], label: str, errors: list[str]) -> list[str]:
    values = [record.get("id") for record in records if isinstance(record, dict)]
    ids = [value for value in values if isinstance(value, str) and value]
    duplicates = sorted({value for value in ids if ids.count(value) > 1})
    if len(ids) != len(records):
        errors.append(f"every {label} must have a non-empty string id")
    if duplicates:
        errors.append(f"duplicate {label} IDs: {', '.join(duplicates)}")
    return ids


def no_effect(record: dict[str, Any], label: str, errors: list[str], *, implementation: bool = False) -> None:
    for field in ("authority_effect", "enforcement_effect"):
        if record.get(field) != "none":
            errors.append(f"{label} {field} must equal 'none'")
    if implementation and record.get("implementation_effect") != "none":
        errors.append(f"{label} implementation_effect must equal 'none'")


def material_digest(errors: list[str]) -> str:
    digest = hashlib.sha256()
    for relative_path in sorted(MATERIAL_FILES):
        path = PACKAGE_ROOT / relative_path
        if not path.is_file():
            errors.append(f"missing material file: {relative_path}")
            continue
        digest.update(relative_path.encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def contains_hash_key(value: Any) -> bool:
    if isinstance(value, dict):
        return any("hash" in str(key).lower() or contains_hash_key(item) for key, item in value.items())
    if isinstance(value, list):
        return any(contains_hash_key(item) for item in value)
    return False


def check_sources(sources_doc: dict[str, Any], errors: list[str]) -> tuple[list[dict[str, Any]], dict[str, str]]:
    exact_keys(sources_doc, {"schema_ref", "sources"}, "sources registry", errors)
    sources = sources_doc.get("sources", [])
    if not isinstance(sources, list) or not sources:
        errors.append("sources registry must contain a non-empty sources list")
        return [], {}
    unique_ids(sources, "source", errors)
    source_text: dict[str, str] = {}
    for index, source in enumerate(sources):
        label = f"source[{index}]"
        exact_keys(source, SOURCE_KEYS, label, errors)
        if not isinstance(source, dict):
            continue
        import_digest = source.get("import_sha256")
        if not isinstance(import_digest, str) or not re.fullmatch(r"[0-9a-f]{64}", import_digest):
            errors.append(f"{label} import_sha256 must be lowercase SHA-256 provenance")
        if "import provenance" not in str(source.get("digest_role", "")):
            errors.append(f"{label} digest_role must identify immutable import provenance")
        path_text = source.get("path")
        if not isinstance(path_text, str) or Path(path_text).is_absolute() or ".." in Path(path_text).parts:
            errors.append(f"{label} path must be repository-relative")
            continue
        path = REPOSITORY_ROOT / path_text
        if not path.is_file():
            errors.append(f"{label} source path is missing: {path_text}")
            continue
        text = path.read_text(encoding="utf-8")
        source_text[str(source.get("id"))] = text
        selectors = source.get("required_selectors")
        if not isinstance(selectors, list) or not selectors:
            errors.append(f"{label} required_selectors must be non-empty")
            continue
        for selector in selectors:
            if not isinstance(selector, str) or selector not in text:
                errors.append(f"{label} selector missing from live source: {selector!r}")
    required_governed_selectors = {
        "GOV-SRC-CAV2-DEFINITIONS": {
            "## CAV2-D64: Recursive Instance Ownership Invariant",
            "## CAV2-D65: DomainSpec-Governed Construction Invariant",
        },
        "GOV-SRC-CAV2-DEFINITION-SCHEMAS": {
            "| `CAV2-D64-SCHEMA` |",
            "| `CAV2-D65-SCHEMA` |",
        },
    }
    sources_by_id = {
        str(source.get("id")): source for source in sources if isinstance(source, dict)
    }
    for source_id, required in required_governed_selectors.items():
        declared = set(sources_by_id.get(source_id, {}).get("required_selectors", []))
        missing = sorted(required - declared)
        if missing:
            errors.append(
                f"{source_id} omits governed selector(s): {', '.join(missing)}"
            )
    return [s for s in sources if isinstance(s, dict)], source_text


def check_meta_types(source_text: dict[str, str], errors: list[str]) -> None:
    text = source_text.get("GOV-SRC-DSV2-META-TYPES", "")
    for meta_id, term in META_TYPES.items():
        pattern = rf"(?ms)^  - id: {re.escape(meta_id)}\n(?:(?!^  - id: ).)*?^    term: {re.escape(term)}\n(?:(?!^  - id: ).)*?^    status: active$"
        if not re.search(pattern, text):
            errors.append(f"active DomainSpec v2 pair not found: {meta_id} -> {term}")


def check_nodes(nodes_doc: dict[str, Any], source_text: dict[str, str], errors: list[str]) -> tuple[list[dict[str, Any]], set[str]]:
    exact_keys(nodes_doc, {"schema_ref", "nodes"}, "node registry", errors)
    nodes = nodes_doc.get("nodes", [])
    if not isinstance(nodes, list) or not nodes:
        errors.append("node registry must contain a non-empty nodes list")
        return [], set()
    node_ids = set(unique_ids(nodes, "node", errors))
    definitions = source_text.get("GOV-SRC-CAV2-DEFINITIONS", "")
    for index, node in enumerate(nodes):
        label = f"node[{index}]"
        exact_keys(node, NODE_KEYS, label, errors)
        if not isinstance(node, dict):
            continue
        expected_term = META_TYPES.get(str(node.get("domainspec_v2_meta_type_id")))
        if expected_term != node.get("domainspec_v2_meta_type"):
            errors.append(f"{label} has an invalid DomainSpec v2 id-term mapping")
        if node.get("mapping_posture") != "candidate-semantic-alignment":
            errors.append(f"{label} must remain a candidate semantic alignment")
        canonical_ref = node.get("canonical_definition_ref")
        if canonical_ref is not None:
            if canonical_ref not in CANONICAL_REFS:
                errors.append(f"{label} uses unsupported canonical definition {canonical_ref!r}")
            elif f"## {canonical_ref}:" not in definitions:
                errors.append(f"{label} canonical definition does not resolve: {canonical_ref}")
        if node.get("candidate_status") != "candidate":
            errors.append(f"{label} candidate_status must equal 'candidate'")
        if not isinstance(node.get("owner_route"), str) or not node["owner_route"].strip():
            errors.append(f"{label} must declare an owner_route")
        no_effect(node, label, errors)
    if nodes_doc.get("nodes"):
        by_id = {node.get("id"): node for node in nodes if isinstance(node, dict)}
        discipline = by_id.get("GovernanceDiscipline", {})
        run = by_id.get("RunGovernanceDiscipline", {})
        metric = by_id.get("FrictionMetricContract", {})
        invariant = by_id.get("GovernanceInvariant", {})
        if discipline.get("domainspec_v2_meta_type") != "Entity" or discipline.get("canonical_definition_ref") != "CAV2-D50":
            errors.append("GovernanceDiscipline must be the CAV2-D50 Entity authority artifact")
        if run.get("domainspec_v2_meta_type") != "Workflow":
            errors.append("RunGovernanceDiscipline must be a Workflow")
        if metric.get("domainspec_v2_meta_type") != "Entity":
            errors.append("FrictionMetricContract must be identity-bearing Entity")
        if invariant.get("domainspec_v2_meta_type") != "Rule" or invariant.get("canonical_definition_ref") != "CAV2-D54":
            errors.append("GovernanceInvariant must remain the generic CAV2-D54 Rule concept type; concrete D64 belongs in invariants.json")
    return [n for n in nodes if isinstance(n, dict)], node_ids


def check_relations(relations_doc: dict[str, Any], node_ids: set[str], errors: list[str]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    exact_keys(relations_doc, {"schema_ref", "relation_vocabulary", "relations"}, "relation registry", errors)
    vocabulary = relations_doc.get("relation_vocabulary", [])
    relations = relations_doc.get("relations", [])
    if not isinstance(vocabulary, list) or not vocabulary:
        errors.append("relation vocabulary must be non-empty")
        vocabulary = []
    if not isinstance(relations, list) or not relations:
        errors.append("relations must be non-empty")
        relations = []
    vocabulary_ids = set(unique_ids(vocabulary, "relation vocabulary", errors))
    unique_ids(relations, "relation", errors)
    if vocabulary_ids != set(RELATION_CONTRACTS):
        errors.append("relation vocabulary must match the bounded governance relation contract")
    for index, item in enumerate(vocabulary):
        label = f"relation_vocabulary[{index}]"
        exact_keys(item, VOCABULARY_KEYS, label, errors)
        if not isinstance(item, dict):
            continue
        relation_id = item.get("id")
        expected = RELATION_CONTRACTS.get(str(relation_id))
        actual = (item.get("source_type"), item.get("target_type"))
        if expected != actual:
            errors.append(f"{label} endpoint contract must be {expected}, got {actual}")
        for endpoint in actual:
            if endpoint not in node_ids:
                errors.append(f"{label} endpoint does not resolve: {endpoint!r}")
    seen_types: list[str] = []
    for index, relation in enumerate(relations):
        label = f"relation[{index}]"
        exact_keys(relation, RELATION_KEYS, label, errors)
        if not isinstance(relation, dict):
            continue
        relation_type = str(relation.get("type"))
        seen_types.append(relation_type)
        actual = (relation.get("source"), relation.get("target"))
        if RELATION_CONTRACTS.get(relation_type) != actual:
            errors.append(f"{label} violates the endpoint contract for {relation_type!r}")
        if relation.get("direction") != "directed":
            errors.append(f"{label} direction must equal 'directed'")
        if not isinstance(relation.get("owner_route"), str) or not relation["owner_route"].strip():
            errors.append(f"{label} must declare an owner_route")
        no_effect(relation, label, errors)
        if relation_type == "enforces" or actual == ("GovernanceRule", "Operation"):
            errors.append(f"{label} illegally claims that GovernanceRule enforces a work operation")
    if set(seen_types) != set(RELATION_CONTRACTS) or len(seen_types) != len(RELATION_CONTRACTS):
        errors.append("relations must instantiate every allowed relation contract exactly once")
    return [v for v in vocabulary if isinstance(v, dict)], [r for r in relations if isinstance(r, dict)]


def check_governed_instances(
    invariants_doc: dict[str, Any],
    rules_doc: dict[str, Any],
    node_ids: set[str],
    source_text: dict[str, str],
    errors: list[str],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], set[str]]:
    exact_keys(
        invariants_doc,
        {"schema_ref", "schema_version", "ontology_id", "invariants", "authority_effect", "enforcement_effect", "implementation_effect"},
        "invariant registry",
        errors,
    )
    exact_keys(
        rules_doc,
        {"schema_ref", "schema_version", "ontology_id", "rules", "authority_effect", "enforcement_effect", "implementation_effect"},
        "rule registry",
        errors,
    )
    expected_top = {
        "schema_version": "cav2-governance-invariant-registry/v1",
        "ontology_id": "cav2.governance-model",
    }
    for field, expected in expected_top.items():
        if invariants_doc.get(field) != expected:
            errors.append(f"invariant registry {field} must equal {expected!r}")
    expected_top["schema_version"] = "cav2-governance-rule-registry/v1"
    for field, expected in expected_top.items():
        if rules_doc.get(field) != expected:
            errors.append(f"rule registry {field} must equal {expected!r}")
    no_effect(invariants_doc, "invariant registry", errors, implementation=True)
    no_effect(rules_doc, "rule registry", errors, implementation=True)

    invariants = invariants_doc.get("invariants", [])
    rules = rules_doc.get("rules", [])
    if not isinstance(invariants, list) or not invariants:
        errors.append("invariant registry must contain at least one invariant instance")
        invariants = []
    if not isinstance(rules, list) or not rules:
        errors.append("rule registry must contain at least one rule instance")
        rules = []
    invariant_ids = set(unique_ids(invariants, "invariant instance", errors))
    rule_ids = set(unique_ids(rules, "rule instance", errors))
    expected_invariants = {
        "GOV-INV-CAV2-D64": {
            "owner_qualified_version": "GOV-INV-CAV2-D64/v1-candidate",
            "canonical_definition_ref": "CAV2-D64",
            "canonical_schema_ref": "CAV2-D64-SCHEMA",
            "basis_refs": {"CAV2-D16", "CAV2-D30", "CAV2-D34", "CAV2-D41", "CAV2-D48", "CAV2-D54"},
            "residue_ref": "GOV-RES-008",
            "operational_rule_ref": "GOV-RULE-D64-BINDING-COMPLETE",
        },
        "GOV-INV-CAV2-D65": {
            "owner_qualified_version": "GOV-INV-CAV2-D65/v2-candidate",
            "canonical_definition_ref": "CAV2-D65",
            "canonical_schema_ref": "CAV2-D65-SCHEMA",
            "basis_refs": {"CAV2-D16", "CAV2-D25", "CAV2-D34", "CAV2-D38", "CAV2-D41", "CAV2-D48", "CAV2-D64"},
            "residue_ref": "GOV-RES-009",
            "operational_rule_ref": "GOV-RULE-D65-CONSTRUCTION-STAGES-COMPLETE",
        },
    }
    expected_rules = {
        "GOV-RULE-D64-BINDING-COMPLETE": {
            "owner_qualified_version": "GOV-RULE-D64-BINDING-COMPLETE/v1-candidate",
            "source_ref": "GOV-INV-CAV2-D64",
            "rule_kind": "authority",
            "subject_kind": "RecursiveInstanceBinding",
            "evaluation_contract_ref": "CAV2-D64-SCHEMA",
        },
        "GOV-RULE-D65-CONSTRUCTION-STAGES-COMPLETE": {
            "owner_qualified_version": "GOV-RULE-D65-CONSTRUCTION-STAGES-COMPLETE/v2-candidate",
            "source_ref": "GOV-INV-CAV2-D65",
            "rule_kind": "lifecycle",
            "subject_kind": "ConstructionBinding",
            "evaluation_contract_ref": "CAV2-D65-SCHEMA",
        },
    }
    if invariant_ids != set(expected_invariants):
        errors.append("the governed invariant epoch must contain exactly the D64 and D65 registrations")
    if rule_ids != set(expected_rules):
        errors.append("the governed rule epoch must contain exactly the D64 and D65 operational rules")

    definitions = source_text.get("GOV-SRC-CAV2-DEFINITIONS", "")
    definition_schemas = source_text.get("GOV-SRC-CAV2-DEFINITION-SCHEMAS", "")
    for index, invariant in enumerate(invariants):
        label = f"invariant[{index}]"
        exact_keys(invariant, INVARIANT_KEYS, label, errors)
        if not isinstance(invariant, dict):
            continue
        registration = expected_invariants.get(str(invariant.get("id")))
        expected = {
            "instance_of": "GovernanceInvariant",
            "source_status": "active",
            "registry_status": "candidate",
            "semantic_version_ref": None,
            "validation_mode": "review-only",
        }
        for field, value in expected.items():
            if invariant.get(field) != value:
                errors.append(f"{label} {field} must equal {value!r}")
        if invariant.get("instance_of") not in node_ids:
            errors.append(f"{label} instance_of does not resolve to a concept type")
        if registration is None:
            errors.append(f"{label} is not an admitted governed invariant registration")
            registration = {}
        for field in ("owner_qualified_version", "canonical_definition_ref", "canonical_schema_ref"):
            if invariant.get(field) != registration.get(field):
                errors.append(f"{label} {field} must equal {registration.get(field)!r}")
        selector = invariant.get("canonical_selector")
        if not isinstance(selector, str) or selector not in definitions:
            errors.append(f"{label} canonical definition selector does not resolve")
        schema_row = f"| `{registration.get('canonical_schema_ref')}` |"
        if schema_row not in definition_schemas:
            errors.append(f"{label} canonical documentary schema row does not resolve")
        if set(invariant.get("basis_refs", [])) != registration.get("basis_refs"):
            errors.append(f"{label} must preserve the exact declared invariant basis refs")
        grounding = invariant.get("axiom_grounding", {})
        exact_keys(grounding, {"posture", "axiom_refs", "residue_ref"}, f"{label} axiom_grounding", errors)
        if not isinstance(grounding, dict) or grounding.get("posture") != "unresolved" or grounding.get("axiom_refs") != [] or grounding.get("residue_ref") != registration.get("residue_ref"):
            errors.append(f"{label} must preserve its unresolved axiom grounding residue")
        if invariant.get("operational_rule_refs") != [registration.get("operational_rule_ref")]:
            errors.append(f"{label} must resolve exactly one candidate operational rule")
        no_effect(invariant, label, errors, implementation=True)

    for index, rule in enumerate(rules):
        label = f"rule[{index}]"
        exact_keys(rule, RULE_KEYS, label, errors)
        if not isinstance(rule, dict):
            continue
        registration = expected_rules.get(str(rule.get("id")))
        expected = {
            "instance_of": "GovernanceRule",
            "validation_mode": "review-only",
            "adoption_state": "not-adopted",
            "constitution_refs": [],
            "enforcement_binding_refs": [],
        }
        for field, value in expected.items():
            if rule.get(field) != value:
                errors.append(f"{label} {field} must equal {value!r}")
        if registration is None:
            errors.append(f"{label} is not an admitted governed operational rule")
            registration = {}
        for field in ("owner_qualified_version", "rule_kind", "subject_kind", "evaluation_contract_ref"):
            if rule.get(field) != registration.get(field):
                errors.append(f"{label} {field} must equal {registration.get(field)!r}")
        if rule.get("instance_of") not in node_ids:
            errors.append(f"{label} instance_of does not resolve to a concept type")
        if set(rule.get("review_outcomes", [])) != {"satisfied", "violated", "indeterminate"}:
            errors.append(f"{label} review outcomes must preserve satisfied, violated, and indeterminate")
        link = rule.get("operationalizes", {})
        exact_keys(link, {"relation_type", "source_ref", "source_type", "target_ref", "target_type", "direction"}, f"{label} operationalizes", errors)
        expected_link = {
            "relation_type": "is_operationalized_by",
            "source_ref": registration.get("source_ref"),
            "source_type": "GovernanceInvariant",
            "target_ref": rule.get("id"),
            "target_type": "GovernanceRule",
            "direction": "directed",
        }
        if not isinstance(link, dict) or any(link.get(field) != value for field, value in expected_link.items()):
            errors.append(f"{label} must carry its exact typed operationalization link")
        if RELATION_CONTRACTS.get(str(link.get("relation_type"))) != (link.get("source_type"), link.get("target_type")):
            errors.append(f"{label} operationalization link violates the relation vocabulary")
        if link.get("source_ref") not in invariant_ids or link.get("target_ref") not in rule_ids:
            errors.append(f"{label} operationalization endpoints do not resolve")
        no_effect(rule, label, errors, implementation=True)

    return (
        [item for item in invariants if isinstance(item, dict)],
        [item for item in rules if isinstance(item, dict)],
        invariant_ids | rule_ids,
    )


def check_product_bindings(bindings_doc: dict[str, Any], node_ids: set[str], errors: list[str]) -> list[dict[str, Any]]:
    exact_keys(bindings_doc, {"schema_ref", "target_ontology", "bindings"}, "product binding registry", errors)
    if contains_hash_key(bindings_doc):
        errors.append("product bindings must not contain registry or package hashes")
    target = bindings_doc.get("target_ontology", {})
    exact_keys(target, {"ontology_id", "profile_path", "nodes_path", "binding_policy"}, "target ontology", errors)
    if not isinstance(target, dict):
        return []
    profile_path = REPOSITORY_ROOT / str(target.get("profile_path", ""))
    nodes_path = REPOSITORY_ROOT / str(target.get("nodes_path", ""))
    try:
        product_profile = json.loads(profile_path.read_text(encoding="utf-8"))
        product_nodes_doc = json.loads(nodes_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"cannot resolve target product ontology: {exc}")
        return []
    if product_profile.get("ontology_id") != target.get("ontology_id") or target.get("ontology_id") != "governance.product":
        errors.append("target product ontology identity does not resolve")
    product_nodes = {node.get("id"): node for node in product_nodes_doc.get("nodes", []) if isinstance(node, dict)}
    bindings = bindings_doc.get("bindings", [])
    if not isinstance(bindings, list) or not bindings:
        errors.append("product bindings must be non-empty")
        return []
    binding_ids = set(unique_ids(bindings, "product binding", errors))
    if binding_ids != set(EXPECTED_BINDINGS):
        errors.append("product bindings must match the exact outbound governance-to-product view")
    for index, binding in enumerate(bindings):
        label = f"binding[{index}]"
        exact_keys(binding, BINDING_KEYS, label, errors)
        if not isinstance(binding, dict):
            continue
        expected = EXPECTED_BINDINGS.get(str(binding.get("id")))
        actual = (binding.get("source_ref"), binding.get("target_node_id"), binding.get("relation"))
        if expected != actual:
            errors.append(f"{label} does not match its exact outbound binding contract")
        source_kind = binding.get("source_kind")
        source_ref = binding.get("source_ref")
        if source_kind == "ontology" and source_ref != "cav2.governance-model":
            errors.append(f"{label} ontology source does not resolve")
        if source_kind == "node" and source_ref not in node_ids:
            errors.append(f"{label} source node does not resolve: {source_ref!r}")
        product_node = product_nodes.get(binding.get("target_node_id"))
        if product_node is None:
            errors.append(f"{label} target product node does not resolve")
        else:
            expectation = binding.get("target_expectation", {})
            exact_keys(expectation, {"label", "role", "candidate_status", "authority_effect"}, f"{label} target_expectation", errors)
            if isinstance(expectation, dict):
                for field in ("label", "role", "candidate_status", "authority_effect"):
                    if product_node.get(field) != expectation.get(field):
                        errors.append(f"{label} selected target field is non-current: {field}")
        if binding.get("binding_status") != "candidate" or binding.get("currentness") != "current":
            errors.append(f"{label} must remain a current candidate binding")
        no_effect(binding, label, errors, implementation=True)
    return [b for b in bindings if isinstance(b, dict)]


def check_identity(identity: dict[str, Any], errors: list[str]) -> None:
    expected = {
        "schema_ref", "schema_version", "identity_axes", "semantic_identity",
        "instance_registration_role",
        "source_digest_role", "package_digest_role", "product_binding_role",
        "currentness_behavior", "forbidden_uses",
    }
    exact_keys(identity, expected, "identity policy", errors)
    required_axes = {
        "semantic_identity", "lifecycle_state", "reference_currentness",
        "authority_state", "product_contribution", "observation_evidence",
    }
    axes = identity.get("identity_axes", [])
    if not isinstance(axes, list) or set(axes) != required_axes:
        errors.append("identity policy must keep all six axes separate")
    forbidden = identity.get("forbidden_uses", [])
    required_phrases = {
        "whole-repository lifecycle clock", "automatic lifecycle refresh",
        "selector digest as semantic version", "candidate registration as adoption",
    }
    if not isinstance(forbidden, list) or not required_phrases.issubset(set(forbidden)):
        errors.append("identity policy must forbid repository-wide lifecycle hashes and automatic refresh")
    digest_role = str(identity.get("source_digest_role", "")).lower()
    if "import" not in digest_role or "provenance" not in digest_role:
        errors.append("identity policy must treat source digests as import provenance")


def check_residue(residue_doc: dict[str, Any], allowed_subject_refs: set[str], errors: list[str]) -> list[dict[str, Any]]:
    exact_keys(residue_doc, {"schema_ref", "residue"}, "residue registry", errors)
    residue = residue_doc.get("residue", [])
    if not isinstance(residue, list):
        errors.append("residue must be a list")
        return []
    unique_ids(residue, "residue", errors)
    allowed_refs = allowed_subject_refs | {"cav2.governance-model"}
    for index, item in enumerate(residue):
        label = f"residue[{index}]"
        exact_keys(item, RESIDUE_KEYS, label, errors)
        if not isinstance(item, dict):
            continue
        refs = item.get("subject_refs", [])
        if not isinstance(refs, list) or not refs:
            errors.append(f"{label} subject_refs must be non-empty")
        else:
            for ref in refs:
                if ref not in allowed_refs:
                    errors.append(f"{label} subject ref does not resolve: {ref!r}")
    return [r for r in residue if isinstance(r, dict)]


def check_migration(migration: dict[str, Any], errors: list[str]) -> None:
    expected = {
        "schema_ref", "schema_version", "source_seed", "migration_posture",
        "imported", "excluded", "superseded", "authority_effect", "enforcement_effect",
    }
    exact_keys(migration, expected, "migration manifest", errors)
    no_effect(migration, "migration manifest", errors)
    if migration.get("migration_posture") != "selective-semantic-materialization":
        errors.append("migration must declare selective semantic materialization")
    excluded = migration.get("excluded", [])
    if not any(
        isinstance(item, dict)
        and item.get("seed_section") == "first_vertical"
        and item.get("status") == "not_evaluable"
        for item in excluded if isinstance(excluded, list)
    ):
        errors.append("migration must explicitly exclude first_vertical as not_evaluable")
    superseded = migration.get("superseded", [])
    if not any(
        isinstance(item, dict)
        and item.get("seed_section") == "product_bindings"
        and item.get("replacement") == "product-bindings.json"
        for item in superseded if isinstance(superseded, list)
    ):
        errors.append("migration must supersede seed product_bindings with the outbound registry")
    imported = migration.get("imported", [])
    if not any(
        isinstance(item, dict)
        and item.get("seed_section") == "post-seed-cav2-d64-instance-epoch"
        and item.get("target") == "invariants.json and rules.json"
        for item in imported if isinstance(imported, list)
    ):
        errors.append("migration must record the D64 candidate instance-registry epoch")


def check_schema_amendment(witness: dict[str, Any], errors: list[str]) -> None:
    expected_keys = {
        "schema_ref", "schema_version", "amendment_id", "status",
        "previous_schema_version", "new_schema_version", "change_kind", "rationale",
        "affected_files", "migration_impact", "rollback", "authority_effect",
        "enforcement_effect", "implementation_effect", "claim_ceiling",
    }
    exact_keys(witness, expected_keys, "D64 schema amendment witness", errors)
    expected = {
        "schema_version": "cav2-governance-schema-amendment/v1",
        "amendment_id": "GOV-SCHEMA-AMEND-D64-001",
        "status": "user-requested-candidate",
        "previous_schema_version": "cav2-governance-ontology-profile/v1",
        "new_schema_version": "cav2-governance-ontology-profile/v2",
        "change_kind": "additive-governed-instance-registries",
    }
    for field, value in expected.items():
        if witness.get(field) != value:
            errors.append(f"D64 schema amendment witness {field} must equal {value!r}")
    required_files = {"profile.json", "invariants.json", "rules.json", "schemas/governance-ontology.schema.json", "scripts/validate.py"}
    if not required_files.issubset(set(witness.get("affected_files", []))):
        errors.append("D64 schema amendment witness does not name every load-bearing registry change")
    no_effect(witness, "D64 schema amendment witness", errors, implementation=True)


def check_prototype_construction_amendment(witness: dict[str, Any], errors: list[str]) -> None:
    schema = load_json("schemas/governance-ontology.schema.json", errors)
    amendment_schema = schema.get("$defs", {}).get("prototypeConstructionAmendment", {})
    for violation in sorted(Draft202012Validator(amendment_schema).iter_errors(witness), key=lambda item: list(item.path)):
        location = ".".join(str(part) for part in violation.path) or "$"
        errors.append(f"D65 revision-2 schema amendment.{location}: {violation.message}")
    required_files = {
        "profile.json", "ontology-scaffolds.json", "prototype-constructions.json",
        "schemas/governance-ontology.schema.json", "schemas/ontology-scaffold.schema.json",
        "schemas/prototype-construction.schema.json", "scripts/validate-prototype-construction.py",
        "scripts/validate.py", "tests/test_d65_prototype_construction.py",
        "receipts/d65-r2-prototype-tests.json",
    }
    if set(witness.get("affected_files", [])) != required_files:
        errors.append("D65 revision-2 amendment must name its exact implementation surface")


def check_prototype_construction_runtime(errors: list[str]) -> dict[str, Any]:
    completed = subprocess.run(
        [sys.executable, str(PACKAGE_ROOT / "scripts/validate-prototype-construction.py")],
        cwd=REPOSITORY_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    try:
        result = json.loads(completed.stdout)
    except json.JSONDecodeError as exc:
        errors.append(f"D65 revision-2 evaluator did not return JSON: {exc}")
        return {}
    construction_id = "GOV-D65-R2-PROTOTYPE-CONSTRUCTION-001"
    eligibility = result.get("eligibility", {}).get(construction_id, {})
    if completed.returncode != 0 or result.get("status") != "PASS":
        errors.append(f"D65 revision-2 evaluator is not PASS: {result.get('errors', [])}")
    if result.get("definition_revision") != 2 or result.get("authority_effect") != "none":
        errors.append("D65 revision-2 evaluator identity or authority boundary is invalid")
    if eligibility.get("product_approval_request") != "eligible":
        errors.append("the exact tested prototype must be eligible for a product-approval request")
    if eligibility.get("authority_request") != "not_eligible":
        errors.append("authority requests must remain ineligible before product approval")
    return result


def check_module(module: dict[str, Any], errors: list[str]) -> None:
    expected = {
        "schema_ref", "schema_version", "module_id", "title", "package_root",
        "module_owner", "visibility", "candidate_status", "host_context",
        "owned_ontologies", "internal_binding_registry", "perennial_document_registry", "aggregate_validator",
        "planned_surfaces", "authority_effect", "enforcement_effect",
        "implementation_effect", "blocked_outputs",
    }
    exact_keys(module, expected, "module manifest", errors)
    expected_values = {
        "schema_version": "governance-module/v1", "module_id": "governance",
        "package_root": "cyberAlchemy-v2/ontology/governance", "visibility": "private",
        "candidate_status": "candidate", "internal_binding_registry": "product-bindings.json",
        "perennial_document_registry": "documents.json",
        "aggregate_validator": "scripts/validate-module.py", "authority_effect": "none",
        "enforcement_effect": "none", "implementation_effect": "none",
    }
    for field, expected_value in expected_values.items():
        if module.get(field) != expected_value:
            errors.append(f"module manifest {field} must equal {expected_value!r}")
    host = module.get("host_context", {})
    exact_keys(host, {"host_id", "relationship", "target_path", "source_authority_dependency", "product_ontology_dependency", "claim_ceiling"}, "module host context", errors)
    if isinstance(host, dict):
        if host.get("host_id") != "cyberalchemy-v2" or host.get("relationship") != "module_of":
            errors.append("module must retain its CyberAlchemy v2 host-context link")
        if host.get("source_authority_dependency") != "canonical-selector-bindings":
            errors.append("module must preserve its canonical source-authority dependency")
        if host.get("product_ontology_dependency") != "none":
            errors.append("module must not depend on the CyberAlchemy-wide product ontology")
    owned = module.get("owned_ontologies", [])
    expected_owned = {
        ("cav2.governance-model", "authority-governance", "none", "profile.json", "scripts/validate.py", True),
        ("governance.product", "business-domain", "business", "product/profile.json", "product/scripts/validate.py", True),
    }
    actual_owned = {
        (item.get("id"), item.get("ontology_type"), item.get("branch"), item.get("profile_path"), item.get("validator_path"), item.get("required"))
        for item in owned if isinstance(item, dict)
    } if isinstance(owned, list) else set()
    if actual_owned != expected_owned:
        errors.append("module must own exactly the authority-governance and business-product ontologies")


def check_documents(documents: dict[str, Any], node_ids: set[str], residue: list[dict[str, Any]], errors: list[str]) -> list[dict[str, Any]]:
    expected_registry = {
        "schema_ref", "schema_version", "status", "durability",
        "canonical_admission", "source_order", "documents", "authority_effect",
        "enforcement_effect", "claim_ceiling",
    }
    exact_keys(documents, expected_registry, "document registry", errors)
    expected_values = {
        "schema_version": "governance-perennial-documents/v1",
        "status": "candidate", "durability": "perennial",
        "authority_effect": "none", "enforcement_effect": "none",
    }
    for field, expected in expected_values.items():
        if documents.get(field) != expected:
            errors.append(f"document registry {field} must equal {expected!r}")
    admission = documents.get("canonical_admission", {})
    exact_keys(admission, {"status", "reason", "owner_route", "authority_effect", "enforcement_effect"}, "document canonical admission", errors)
    if isinstance(admission, dict):
        if admission.get("status") != "blocked":
            errors.append("candidate perennial documents must remain not admitted")
        no_effect(admission, "document canonical admission", errors)
    source_order = documents.get("source_order", [])
    if not isinstance(source_order, list) or len(source_order) < 5 or len(source_order) != len(set(source_order)):
        errors.append("document source order must contain at least five unique precedence entries")
    records = documents.get("documents", [])
    if not isinstance(records, list) or len(records) != 6:
        errors.append("document registry must contain exactly six candidate perennial documents")
        records = []
    document_ids = unique_ids(records, "document", errors)
    if document_ids != [f"GOV-DOC-{index:03d}" for index in range(1, 7)]:
        errors.append("document IDs must be the ordered stable range GOV-DOC-001 through GOV-DOC-006")
    paths = [item.get("path") for item in records if isinstance(item, dict)]
    if len(paths) != len(set(paths)):
        errors.append("document paths must be unique")
    expected_roles = {
        "product-meaning", "domain-model", "authority-boundary",
        "lifecycle-model", "evidence-model", "runtime-intent",
    }

    try:
        product_nodes_doc = json.loads((PACKAGE_ROOT / "product/nodes.json").read_text(encoding="utf-8"))
        product_residue_doc = json.loads((PACKAGE_ROOT / "product/residue.json").read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"cannot resolve document product projections: {exc}")
        product_nodes_doc, product_residue_doc = {}, {}
    available_refs = set(node_ids) | {item.get("id") for item in residue if isinstance(item, dict)}
    available_refs |= {item.get("id") for item in product_nodes_doc.get("nodes", []) if isinstance(item, dict)}
    available_refs |= {item.get("id") for item in product_residue_doc.get("residue", []) if isinstance(item, dict)}
    available_refs |= {"cav2.governance-model", "governance.product", "CAV2-D34"}

    actual_roles: set[str] = set()
    status_line = "Status: perennial candidate. No authority or enforcement effect."
    for index, record in enumerate(records):
        label = f"document[{index}]"
        exact_keys(record, DOCUMENT_KEYS, label, errors)
        if not isinstance(record, dict):
            continue
        actual_roles.add(str(record.get("role")))
        expected_record = {
            "intended_canonical_kind": "spec", "durability": "perennial",
            "status": "candidate", "canonical_status": "not-admitted",
            "authority_state": "none", "authority_effect": "none",
            "enforcement_effect": "none",
        }
        for field, expected in expected_record.items():
            if record.get(field) != expected:
                errors.append(f"{label} {field} must equal {expected!r}")
        refs = record.get("projection_refs", [])
        if not isinstance(refs, list) or not refs:
            errors.append(f"{label} projection_refs must be non-empty")
        else:
            for ref in refs:
                if ref not in available_refs:
                    errors.append(f"{label} projection ref does not resolve: {ref!r}")
        relative = record.get("path")
        if not isinstance(relative, str) or Path(relative).is_absolute() or ".." in Path(relative).parts or not relative.startswith("docs/"):
            errors.append(f"{label} path must be a safe docs-relative path")
            continue
        path = PACKAGE_ROOT / relative
        if not path.is_file():
            errors.append(f"{label} file is missing: {relative}")
            continue
        text = path.read_text(encoding="utf-8")
        if not text.startswith(f"# {record.get('title')}\n"):
            errors.append(f"{label} title does not match the document H1")
        if status_line not in text[:500]:
            errors.append(f"{label} must declare perennial candidate and no effects near the top")
        headings = record.get("required_headings", [])
        if not isinstance(headings, list) or not headings:
            errors.append(f"{label} required_headings must be non-empty")
        else:
            for heading in headings:
                if not isinstance(heading, str) or text.count(heading) != 1:
                    errors.append(f"{label} heading must occur exactly once: {heading!r}")
        if "Status: active" in text or "canonical_status: admitted" in text:
            errors.append(f"{label} contains a forbidden admission or activation claim")
        no_effect(record, label, errors)
    if actual_roles != expected_roles:
        errors.append("document roles must cover product, domain, authority, lifecycle, evidence, and runtime intent exactly once")
    return [item for item in records if isinstance(item, dict)]


def check_readme(nodes: int, relations: int, invariants: int, rules: int, bindings: int, documents: int, errors: list[str]) -> None:
    try:
        text = (PACKAGE_ROOT / "README.md").read_text(encoding="utf-8")
    except OSError as exc:
        errors.append(f"cannot read README.md: {exc}")
        return
    for expected in (
        f"{nodes} candidate DomainSpec v2-aligned governance concept types",
        f"{relations} typed governance relation contracts",
        f"{invariants} candidate governed invariant instance",
        f"{rules} candidate operational rule instance",
        "Authority effect: none",
        "Enforcement effect: none",
        "migration.json",
        f"{documents} candidate perennial documents",
    ):
        if expected not in text:
            errors.append(f"README view is non-current: missing {expected!r}")
    if f"{bindings} target-level bindings" not in text:
        if "target-level bindings to the module-owned Governance business product ontology" not in text:
            errors.append("README does not describe the product binding view")


def build_result(write_receipt: bool) -> tuple[dict[str, Any], int]:
    errors: list[str] = []
    warnings: list[str] = [
        "Import SHA-256 values are provenance only; validation intentionally does not compare live whole-file hashes."
    ]
    profile = load_json("profile.json", errors)
    sources_doc = load_json("sources.json", errors)
    nodes_doc = load_json("nodes.json", errors)
    relations_doc = load_json("relations.json", errors)
    invariants_doc = load_json("invariants.json", errors)
    rules_doc = load_json("rules.json", errors)
    bindings_doc = load_json("product-bindings.json", errors)
    identity = load_json("identity-policy.json", errors)
    residue_doc = load_json("residue.json", errors)
    migration = load_json("migration.json", errors)
    schema_amendment = load_json("schema-amendment-d64.json", errors)
    prototype_construction_amendment = load_json("schema-amendment-d65-r2.json", errors)
    module = load_json("module.json", errors)
    documents_doc = load_json("documents.json", errors)
    schema = load_json("schemas/governance-ontology.schema.json", errors)

    exact_keys(profile, PROFILE_KEYS, "profile", errors)
    expected_profile = {
        "schema_version": "cav2-governance-ontology-profile/v3",
        "ontology_id": "cav2.governance-model",
        "ontology_type": "authority-governance",
        "branch": "none",
        "materialization": "package-required",
        "package_root": "cyberAlchemy-v2/ontology/governance",
        "visibility": "private",
        "candidate_status": "candidate",
        "authority_effect": "none",
        "enforcement_effect": "none",
        "module_manifest": "module.json",
        "invariant_registry": "invariants.json",
        "rule_registry": "rules.json",
        "ontology_scaffold_registry": "ontology-scaffolds.json",
        "prototype_construction_registry": "prototype-constructions.json",
        "ontology_scaffold_schema": "schemas/ontology-scaffold.schema.json",
        "prototype_construction_schema": "schemas/prototype-construction.schema.json",
        "prototype_construction_validator": "scripts/validate-prototype-construction.py",
        "prototype_construction_amendment": "schema-amendment-d65-r2.json",
    }
    for field, expected in expected_profile.items():
        if profile.get(field) != expected:
            errors.append(f"profile {field} must equal {expected!r}")
    required_defs = {
        "profile", "sourceRegistry", "nodeRegistry", "relationRegistry",
        "invariantRegistry", "ruleRegistry", "schemaAmendmentWitness",
        "productBindingRegistry", "identityPolicy", "residueRegistry",
        "migrationManifest", "documentAdmission", "document", "documentRegistry",
        "prototypeConstructionAmendment", "moduleManifest", "moduleValidationReceipt", "validationReceipt",
    }
    if not isinstance(schema.get("$defs"), dict) or not required_defs.issubset(schema["$defs"]):
        errors.append("schema does not expose every closed package definition")

    sources, source_text = check_sources(sources_doc, errors)
    check_meta_types(source_text, errors)
    nodes, node_ids = check_nodes(nodes_doc, source_text, errors)
    vocabulary, relations = check_relations(relations_doc, node_ids, errors)
    invariants, rules, governed_instance_ids = check_governed_instances(
        invariants_doc, rules_doc, node_ids, source_text, errors
    )
    bindings = check_product_bindings(bindings_doc, node_ids, errors)
    check_identity(identity, errors)
    residue = check_residue(residue_doc, node_ids | governed_instance_ids, errors)
    check_migration(migration, errors)
    check_schema_amendment(schema_amendment, errors)
    check_prototype_construction_amendment(prototype_construction_amendment, errors)
    prototype_result = check_prototype_construction_runtime(errors)
    check_module(module, errors)
    documents = check_documents(documents_doc, node_ids, residue, errors)
    check_readme(len(nodes), len(relations), len(invariants), len(rules), len(bindings), len(documents), errors)

    digest = material_digest(errors)
    receipt_dir = PACKAGE_ROOT / "receipts"
    if not receipt_dir.is_dir():
        errors.append("receipts directory is missing")
    stale_receipts = 0
    if receipt_dir.is_dir():
        for path in sorted(receipt_dir.glob("validation-*.json")):
            try:
                old = json.loads(path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                warnings.append(f"historical receipt is unreadable: {path.name}")
                continue
            if old.get("material_digest") != digest:
                stale_receipts += 1
    if stale_receipts:
        warnings.append(f"{stale_receipts} prior validation receipt(s) describe historical package material and remain append-only.")

    status = "PASS" if not errors else "BLOCK"
    checks = [
        "closed package record shapes",
        "stable unique identifiers",
        "selector-scoped source currentness",
        "active DomainSpec v2 id-term mappings",
        "canonical CAV2 definition references",
        "typed relation endpoint closure",
        "candidate governed invariant and operational rule instance closure",
        "non-effectful authority boundaries",
        "target-level internal Governance product bindings",
        "identity and lifecycle separation",
        "migration exclusions and residue closure",
        "perennial document registry, projection, and heading closure",
        "deterministic package material digest",
        "D65 revision-2 prototype construction and request eligibility",
    ]
    result: dict[str, Any] = {
        "status": status,
        "package_root": "cyberAlchemy-v2/ontology/governance",
        "ontology_id": profile.get("ontology_id"),
        "ontology_type": profile.get("ontology_type"),
        "visibility": profile.get("visibility"),
        "authority_effect": profile.get("authority_effect"),
        "enforcement_effect": profile.get("enforcement_effect"),
        "counts": {
            "sources": len(sources),
            "nodes": len(nodes),
            "relation_types": len(vocabulary),
            "relations": len(relations),
            "governed_invariants": len(invariants),
            "operational_rules": len(rules),
            "product_bindings": len(bindings),
            "documents": len(documents),
            "residue": len(residue),
            "prototype_constructions": prototype_result.get("counts", {}).get("constructions", 0),
            "ontology_scaffolds": prototype_result.get("counts", {}).get("ontology_scaffolds", 0),
        },
        "material_digest": digest,
        "checks": checks,
        "warnings": warnings,
        "errors": errors,
    }

    if write_receipt and status == "PASS":
        receipt = {
            "schema_ref": "../schemas/governance-ontology.schema.json#/$defs/validationReceipt",
            "schema_version": "cav2-governance-ontology-validation/v1",
            "validated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "status": status,
            "package_root": "cyberAlchemy-v2/ontology/governance",
            "ontology_type": "authority-governance",
            "branch": "none",
            "visibility": "private",
            "authority_effect": "none",
            "enforcement_effect": "none",
            "validator_path": "scripts/validate.py",
            "command": "python3 cyberAlchemy-v2/ontology/governance/scripts/validate.py --write-receipt",
            "counts": result["counts"],
            "material_digest": digest,
            "checks": checks,
            "warnings": warnings,
            "errors": [],
        }
        receipt_path = receipt_dir / f"validation-{digest[:16]}.json"
        if receipt_path.exists():
            result["receipt"] = str(receipt_path.relative_to(REPOSITORY_ROOT))
            result["receipt_write"] = "existing-append-only-receipt-preserved"
        else:
            receipt_path.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
            result["receipt"] = str(receipt_path.relative_to(REPOSITORY_ROOT))
            result["receipt_write"] = "created"
    elif write_receipt:
        result["receipt_write"] = "blocked"

    return result, 0 if status == "PASS" else 1


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write-receipt", action="store_true", help="append one receipt after PASS")
    args = parser.parse_args()
    result, status = build_result(args.write_receipt)
    json.dump(result, sys.stdout, indent=2, sort_keys=True)
    sys.stdout.write("\n")
    return status


if __name__ == "__main__":
    raise SystemExit(main())
