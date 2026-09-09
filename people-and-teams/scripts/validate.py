#!/usr/bin/env python3
"""Fail-closed validator for the private People and Teams business ontology."""

from __future__ import annotations

import copy
import hashlib
import json
import sys
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator, FormatChecker


SCRIPT_PATH = Path(__file__).resolve()
PACKAGE_ROOT = SCRIPT_PATH.parents[1]
REPOSITORY_ROOT = SCRIPT_PATH.parents[3]
PACKAGE_RELATIVE = "cyberAlchemy-v2/people-and-teams"

MATERIAL_FILES = (
    "README.md",
    "definitions.json",
    "nodes.json",
    "obligations.json",
    "product-capability.json",
    "product-thesis.json",
    "profile.json",
    "relations.json",
    "residue.json",
    "schemas/people-and-teams.schema.json",
    "scripts/validate.py",
    "sources.json",
    "tests/test_negative_mutations.py",
)

DOCUMENT_DEFS = {
    "profile.json": "profile",
    "definitions.json": "definitionRegistry",
    "product-thesis.json": "productThesis",
    "product-capability.json": "productCapability",
    "obligations.json": "obligationRegistry",
    "sources.json": "sourceRegistry",
    "nodes.json": "nodeRegistry",
    "relations.json": "relationRegistry",
    "residue.json": "residueRegistry",
}

EXPECTED_DEFINITIONS = {
    "CAV2-D63": "PT-SEL-D63",
    "CAV2-D65": "PT-SEL-D65",
    "CAV2-D67": "PT-SEL-D67",
    "CAV2-D68": "PT-SEL-D68",
    "CAV2-D69": "PT-SEL-D69",
}
EXPECTED_LOCAL_TERMS = {
    "PT-DEF-TEAM-MEMBERSHIP",
    "PT-DEF-TEAM-ROLE",
    "PT-DEF-RESPONSIBILITY",
}
EXPECTED_NODES = {
    "CA2-PRODUCT-CYBERALCHEMY",
    "PT-PRODUCT-PEOPLE-AND-TEAMS",
    "PT-THESIS-EXPLICIT-HUMAN-COLLABORATION",
    "PT-CAP-MODEL-PEOPLE-AND-TEAMS",
    "PT-ACTOR-PERSON",
    "PT-ACTOR-TEAM",
    "PT-CONCEPT-TEAM-MEMBERSHIP",
    "PT-CONCEPT-TEAM-ROLE",
    "PT-CONCEPT-RESPONSIBILITY",
    "CA2-CAP-CONTRACT-PEOPLE-AND-TEAMS-DECLARATION",
    "CA2-CAP-CONTRACT-PEOPLE-AND-TEAMS-MODEL",
    "CA2-CAP-POLICY-PEOPLE-PRIVACY-MINIMIZATION",
    "PT-RULE-IDENTITY-NON-COLLAPSE",
    "PT-RULE-EXPLICIT-MEMBERSHIP",
    "PT-RULE-ROLE-NOT-AUTHORITY",
    "PT-RULE-RESPONSIBILITY-EXPLICIT",
    "PT-RULE-PRIVACY-BOUNDARY",
    "PT-OUT-LEGIBLE-COLLABORATION",
    "PT-OUT-AUDITABLE-MEMBERSHIP",
    "PT-MEASURE-UNRESOLVED-PERSON-REFS",
    "PT-MEASURE-ORPHAN-RESPONSIBILITIES",
}
EXPECTED_RELATION_TYPES = {
    "subproduct_of",
    "claims_value_through",
    "includes_capability",
    "serves",
    "uses_concept",
    "membership_binds",
    "assigns_role",
    "carries_responsibility",
    "requires",
    "enables",
    "measured_by",
    "protects",
    "constrains",
}
EXPECTED_OBLIGATIONS = {
    "PT-OBL-001-STABLE-PERSON-IDENTITY",
    "PT-OBL-002-STABLE-TEAM-IDENTITY",
    "PT-OBL-003-EXPLICIT-MEMBERSHIP",
    "PT-OBL-004-ROLE-AUTHORITY-SEPARATION",
    "PT-OBL-005-RESPONSIBILITY-OWNERSHIP",
    "PT-OBL-006-PRIVACY-MINIMIZATION",
    "PT-OBL-007-LIFECYCLE-HISTORY",
    "PT-OBL-008-REFERENCE-CLOSURE",
}
EXPECTED_RESIDUE = {
    "PT-RES-DOMAINSPEC",
    "PT-RES-RUNTIME",
    "PT-RES-ADOPTION",
    "PT-RES-LOCAL-TERMS",
    "PT-RES-INSTANCES",
    "PT-RES-PRIVACY-EVIDENCE",
}

ROLE_CONTRACTS = {
    "subproduct_of": ({"product"}, {"product_projection"}),
    "claims_value_through": ({"product"}, {"thesis"}),
    "includes_capability": ({"product"}, {"product_capability"}),
    "serves": ({"product_capability"}, {"actor", "collective_actor"}),
    "uses_concept": (
        {"product_capability"},
        {"domain_concept", "input_contract", "output_contract", "policy"},
    ),
    "membership_binds": ({"domain_concept"}, {"actor", "collective_actor"}),
    "assigns_role": ({"domain_concept"}, {"domain_concept"}),
    "carries_responsibility": ({"domain_concept"}, {"domain_concept"}),
    "requires": ({"thesis"}, {"business_rule"}),
    "enables": ({"product_capability"}, {"outcome"}),
    "measured_by": ({"product"}, {"value_measure"}),
    "protects": ({"policy"}, {"actor"}),
    "constrains": ({"policy"}, {"product_capability"}),
}


def load_json(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"JSON_OBJECT_REQUIRED:{path}")
    return value


def load_documents(overrides: dict[str, dict[str, Any]] | None = None) -> dict[str, dict[str, Any]]:
    documents = {name: load_json(PACKAGE_ROOT / name) for name in DOCUMENT_DEFS}
    for name, value in (overrides or {}).items():
        if name not in documents or not isinstance(value, dict):
            raise ValueError(f"INVALID_OVERRIDE:{name}")
        documents[name] = copy.deepcopy(value)
    return documents


def heading_section_bytes(path: Path, selector: str) -> bytes:
    lines = path.read_bytes().splitlines(keepends=True)
    target = selector.encode()
    start = next(
        (index for index, line in enumerate(lines) if line.rstrip(b"\r\n") == target),
        None,
    )
    if start is None:
        raise ValueError(f"SELECTOR_NOT_FOUND:{selector}")
    end = len(lines)
    for index in range(start + 1, len(lines)):
        if lines[index].startswith(b"## "):
            end = index
            break
    return b"".join(lines[start:end])


def selected_source_bytes(source: dict[str, Any]) -> bytes:
    path = (REPOSITORY_ROOT / str(source.get("path", ""))).resolve()
    try:
        path.relative_to(REPOSITORY_ROOT)
    except ValueError as exc:
        raise ValueError(f"SOURCE_PATH_ESCAPE:{source.get('source_id')}") from exc
    if not path.is_file() or path.is_symlink():
        raise ValueError(f"SOURCE_FILE_UNAVAILABLE:{source.get('source_id')}")
    if source.get("scope_kind") == "whole-file" and source.get("selector") is None:
        return path.read_bytes()
    if source.get("scope_kind") == "heading-section" and isinstance(source.get("selector"), str):
        return heading_section_bytes(path, source["selector"])
    raise ValueError(f"SOURCE_SCOPE_INVALID:{source.get('source_id')}")


def material_digest() -> str:
    digest = hashlib.sha256()
    for relative in sorted(MATERIAL_FILES):
        path = PACKAGE_ROOT / relative
        if not path.is_file() or path.is_symlink():
            raise ValueError(f"MATERIAL_FILE_UNAVAILABLE:{relative}")
        digest.update(relative.encode())
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def append_unique(errors: list[str], message: str) -> None:
    if message not in errors:
        errors.append(message)


def unique_ids(records: Any, field: str, label: str, errors: list[str]) -> dict[str, dict[str, Any]]:
    if not isinstance(records, list):
        append_unique(errors, f"{label}_COLLECTION_REQUIRED")
        return {}
    index: dict[str, dict[str, Any]] = {}
    for record in records:
        if not isinstance(record, dict) or not isinstance(record.get(field), str):
            append_unique(errors, f"{label}_ID_REQUIRED")
            continue
        identity = record[field]
        if identity in index:
            append_unique(errors, f"{label}_ID_DUPLICATE:{identity}")
        index[identity] = record
    return index


def iter_source_refs(value: Any):
    if isinstance(value, dict):
        if set(value) == {"source_id", "selector"}:
            yield value
        for child in value.values():
            yield from iter_source_refs(child)
    elif isinstance(value, list):
        for child in value:
            yield from iter_source_refs(child)


def validate_schema_instances(
    schema: dict[str, Any], documents: dict[str, dict[str, Any]], errors: list[str]
) -> None:
    try:
        Draft202012Validator.check_schema(schema)
    except Exception as exc:  # jsonschema exposes several schema-error subclasses
        append_unique(errors, f"JSON_SCHEMA_INVALID:{exc.__class__.__name__}")
        return
    for filename, definition in DOCUMENT_DEFS.items():
        wrapper = {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "$ref": f"#/$defs/{definition}",
            "$defs": schema["$defs"],
        }
        validator = Draft202012Validator(wrapper, format_checker=FormatChecker())
        for issue in sorted(validator.iter_errors(documents[filename]), key=lambda item: list(item.absolute_path)):
            location = "/".join(str(part) for part in issue.absolute_path) or "$"
            append_unique(errors, f"SCHEMA_INSTANCE_INVALID:{filename}:{location}:{issue.message}")


def validate_source_contracts(documents: dict[str, dict[str, Any]], errors: list[str]) -> None:
    source_index = unique_ids(documents["sources.json"].get("sources"), "source_id", "SOURCE", errors)
    selected: dict[str, bytes] = {}
    for source_id, source in source_index.items():
        try:
            selected[source_id] = selected_source_bytes(source)
        except ValueError as exc:
            append_unique(errors, str(exc))
            continue
        actual = hashlib.sha256(selected[source_id]).hexdigest()
        if actual != source.get("expected_digest"):
            append_unique(errors, f"SOURCE_DIGEST_DRIFT:{source_id}:{actual}")

    reference_documents = (
        documents["definitions.json"],
        documents["nodes.json"],
        documents["relations.json"],
        documents["obligations.json"],
    )
    for document in reference_documents:
        for ref in iter_source_refs(document):
            source_id = ref.get("source_id")
            selector = ref.get("selector")
            if source_id not in source_index:
                append_unique(errors, f"SOURCE_REF_UNRESOLVED:{source_id}")
            elif source_id in selected and isinstance(selector, str):
                if selector.encode() not in selected[source_id]:
                    append_unique(errors, f"SOURCE_REF_SELECTOR_MISSING:{source_id}:{selector}")

    capability = documents["product-capability.json"]
    string_refs = list(capability.get("evidence_refs", []))
    for route in capability.get("owner_routes", []):
        if isinstance(route, dict):
            string_refs.extend(route.get("source_refs", []))
    for source_id in string_refs:
        if source_id not in source_index:
            append_unique(errors, f"CAPABILITY_SOURCE_REF_UNRESOLVED:{source_id}")


def validate_semantics(documents: dict[str, dict[str, Any]], errors: list[str]) -> None:
    definitions = documents["definitions.json"]
    binding_index = unique_ids(definitions.get("canonical_bindings"), "definition_ref", "DEFINITION", errors)
    actual_bindings = {identity: item.get("source_id") for identity, item in binding_index.items()}
    if actual_bindings != EXPECTED_DEFINITIONS:
        append_unique(errors, "CANONICAL_DEFINITION_SET_INVALID")
    local_index = unique_ids(definitions.get("local_terms"), "term_id", "LOCAL_TERM", errors)
    if set(local_index) != EXPECTED_LOCAL_TERMS:
        append_unique(errors, "LOCAL_TERM_SET_INVALID")

    nodes = documents["nodes.json"].get("nodes")
    node_index = unique_ids(nodes, "id", "NODE", errors)
    if set(node_index) != EXPECTED_NODES:
        append_unique(errors, "NODE_SET_INVALID")
    node_roles = {identity: node.get("role") for identity, node in node_index.items()}

    relation_document = documents["relations.json"]
    vocabulary = unique_ids(relation_document.get("relation_vocabulary"), "id", "RELATION_TYPE", errors)
    if set(vocabulary) != EXPECTED_RELATION_TYPES:
        append_unique(errors, "RELATION_TYPE_SET_INVALID")
    relation_index = unique_ids(relation_document.get("relations"), "id", "RELATION", errors)
    if len(relation_index) != 26:
        append_unique(errors, "RELATION_COUNT_INVALID")
    membership_targets: set[str] = set()
    for relation_id, relation in relation_index.items():
        relation_type = relation.get("type")
        source = relation.get("source")
        target = relation.get("target")
        if relation_type not in vocabulary:
            append_unique(errors, f"RELATION_TYPE_UNRESOLVED:{relation_id}:{relation_type}")
        if source not in node_index:
            append_unique(errors, f"RELATION_SOURCE_UNRESOLVED:{relation_id}:{source}")
        if target not in node_index:
            append_unique(errors, f"RELATION_TARGET_UNRESOLVED:{relation_id}:{target}")
        contract = ROLE_CONTRACTS.get(relation_type)
        if contract and source in node_roles and target in node_roles:
            source_roles, target_roles = contract
            if node_roles[source] not in source_roles or node_roles[target] not in target_roles:
                append_unique(errors, f"RELATION_ROLE_CONTRACT_INVALID:{relation_id}")
        if relation_type == "membership_binds":
            if source != "PT-CONCEPT-TEAM-MEMBERSHIP":
                append_unique(errors, f"MEMBERSHIP_BIND_SOURCE_INVALID:{relation_id}")
            membership_targets.add(str(target))
    if membership_targets != {"PT-ACTOR-PERSON", "PT-ACTOR-TEAM"}:
        append_unique(errors, "MEMBERSHIP_BIND_TARGETS_INVALID")

    thesis = documents["product-thesis.json"]
    for field in ("participants", "intended_outcomes"):
        for reference in thesis.get(field, []):
            if reference not in node_index:
                append_unique(errors, f"THESIS_NODE_REF_UNRESOLVED:{field}:{reference}")
    for field in ("product_ref", "parent_product_ref"):
        reference = thesis.get(field)
        if reference not in node_index:
            append_unique(errors, f"THESIS_NODE_REF_UNRESOLVED:{field}:{reference}")

    capability = documents["product-capability.json"]
    capability_node_fields = (
        "outcome_refs",
        "participant_refs",
        "consumer_refs",
        "input_contract_refs",
        "output_contract_refs",
        "context_policy_refs",
    )
    for field in capability_node_fields:
        for reference in capability.get(field, []):
            if reference not in node_index:
                append_unique(errors, f"CAPABILITY_NODE_REF_UNRESOLVED:{field}:{reference}")
    for field in ("product_ref", "business_ontology_ref"):
        reference = capability.get(field)
        if reference not in node_index:
            append_unique(errors, f"CAPABILITY_NODE_REF_UNRESOLVED:{field}:{reference}")
    posture = capability.get("lifecycle_posture", {})
    if posture.get("status") != "candidate" or posture.get("commitment") != "not-adopted":
        append_unique(errors, "CAPABILITY_LIFECYCLE_INFLATION")

    obligation_index = unique_ids(
        documents["obligations.json"].get("obligations"), "obligation_id", "OBLIGATION", errors
    )
    if set(obligation_index) != EXPECTED_OBLIGATIONS:
        append_unique(errors, "OBLIGATION_SET_INVALID")
    for obligation_id, obligation in obligation_index.items():
        if obligation.get("current_status") != "not-assessed" or obligation.get("evidence_state") != "not_evaluable":
            append_unique(errors, f"OBLIGATION_EVIDENCE_INFLATION:{obligation_id}")
        for reference in obligation.get("subject_refs", []):
            if reference not in node_index:
                append_unique(errors, f"OBLIGATION_SUBJECT_UNRESOLVED:{obligation_id}:{reference}")

    residue_index = unique_ids(documents["residue.json"].get("residue"), "residue_id", "RESIDUE", errors)
    if set(residue_index) != EXPECTED_RESIDUE:
        append_unique(errors, "RESIDUE_SET_INVALID")
    for residue_id, residue in residue_index.items():
        for reference in residue.get("subject_refs", []):
            if reference not in node_index:
                append_unique(errors, f"RESIDUE_SUBJECT_UNRESOLVED:{residue_id}:{reference}")
    for reference in posture.get("residue_refs", []):
        if reference not in residue_index:
            append_unique(errors, f"CAPABILITY_RESIDUE_REF_UNRESOLVED:{reference}")


def validate_authority(value: Any, errors: list[str], path: str = "$") -> None:
    if isinstance(value, dict):
        for key, child in value.items():
            child_path = f"{path}.{key}"
            if key == "authority_effect" and child != "none":
                append_unique(errors, f"AUTHORITY_EFFECT_FORBIDDEN:{child_path}:{child}")
            validate_authority(child, errors, child_path)
    elif isinstance(value, list):
        for index, child in enumerate(value):
            validate_authority(child, errors, f"{path}[{index}]")


def validate_human_and_inventory(errors: list[str]) -> None:
    actual = {
        path.relative_to(PACKAGE_ROOT).as_posix()
        for path in PACKAGE_ROOT.rglob("*")
        if path.is_file() and "receipts" not in path.parts and "__pycache__" not in path.parts
    }
    expected = set(MATERIAL_FILES)
    if actual != expected:
        missing = ",".join(sorted(expected - actual)) or "none"
        extra = ",".join(sorted(actual - expected)) or "none"
        append_unique(errors, f"MATERIAL_INVENTORY_INVALID:missing={missing}:extra={extra}")

    readme = (PACKAGE_ROOT / "README.md").read_text(encoding="utf-8")
    required_readme_phrases = (
        "21 business nodes, 13 relation types, 26 relation instances",
        "8 candidate obligations, and 6 explicit residue records",
        "membership != role != responsibility != ownership != authority",
        "no Person or Team instances",
    )
    for phrase in required_readme_phrases:
        if phrase not in readme:
            append_unique(errors, f"README_DERIVATION_DRIFT:{phrase}")

    definitions_text = (REPOSITORY_ROOT / "cyberAlchemy-v2/authority/definitions/DEFINITIONS.md").read_text(
        encoding="utf-8"
    )
    index_text = (REPOSITORY_ROOT / "cyberAlchemy-v2/authority/definitions/DEFINITIONS-INDEX.md").read_text(
        encoding="utf-8"
    )
    for definition, term in (("CAV2-D68", "Person"), ("CAV2-D69", "Team")):
        if f"## {definition}: {term}" not in definitions_text:
            append_unique(errors, f"CANONICAL_DEFINITION_HEADING_MISSING:{definition}")
        if definition not in index_text or term.lower() not in index_text.lower():
            append_unique(errors, f"CANONICAL_DEFINITION_INDEX_MISSING:{definition}")


def validate(overrides: dict[str, dict[str, Any]] | None = None) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []
    checks = [
        "closed-package-inventory",
        "json-schema-and-instance-validation",
        "canonical-definition-and-local-term-closure",
        "source-selection-digest-and-selector-currentness",
        "node-relation-obligation-and-residue-closure",
        "authority-and-lifecycle-non-inflation",
        "derived-human-view-consistency",
    ]
    try:
        documents = load_documents(overrides)
        schema = load_json(PACKAGE_ROOT / "schemas/people-and-teams.schema.json")
        validate_schema_instances(schema, documents, errors)
        validate_source_contracts(documents, errors)
        validate_semantics(documents, errors)
        for filename, document in documents.items():
            validate_authority(document, errors, f"$.{filename}")
        validate_human_and_inventory(errors)
        digest = material_digest()
    except Exception as exc:
        append_unique(errors, f"VALIDATOR_INTERNAL_BLOCK:{exc.__class__.__name__}:{exc}")
        digest = "0" * 64
        documents = {}

    counts = {
        "canonical_definitions": len(documents.get("definitions.json", {}).get("canonical_bindings", [])),
        "local_terms": len(documents.get("definitions.json", {}).get("local_terms", [])),
        "nodes": len(documents.get("nodes.json", {}).get("nodes", [])),
        "relation_types": len(documents.get("relations.json", {}).get("relation_vocabulary", [])),
        "relations": len(documents.get("relations.json", {}).get("relations", [])),
        "obligations": len(documents.get("obligations.json", {}).get("obligations", [])),
        "residue": len(documents.get("residue.json", {}).get("residue", [])),
        "sources": len(documents.get("sources.json", {}).get("sources", [])),
    }
    return {
        "schema_version": "cav2-people-and-teams-validation/v1",
        "status": "BLOCK" if errors else "PASS",
        "package_root": PACKAGE_RELATIVE,
        "ontology_id": "cav2.people-and-teams.business",
        "ontology_type": "business-domain",
        "branch": "business",
        "visibility": "private",
        "authority_effect": "none",
        "counts": counts,
        "material_digest": digest,
        "checks": checks,
        "warnings": warnings,
        "errors": sorted(errors),
        "claim_ceiling": (
            "Candidate product thesis, Product Capability, and business ontology package only; "
            "validation does not admit instances, adopt the capability, create DomainSpec artifacts, "
            "prove implementation conformance, or authorize publication, release, deployment, or external effects."
        ),
    }


def main() -> int:
    result = validate()
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
