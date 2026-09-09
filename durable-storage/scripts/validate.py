#!/usr/bin/env python3
"""Validate the Durable Capability State model; write a receipt only on request."""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator, FormatChecker
from jsonschema.exceptions import SchemaError


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
SHARED_CAPABILITY_SCHEMA = REPOSITORY_ROOT / "cyberAlchemy-v2/capability/schemas/capability.schema.json"
MATERIAL_FILES = (
    "README.md",
    "definitions.json",
    "nodes.json",
    "product-capability-support.json",
    "product-capability.json",
    "profile.json",
    "relations.json",
    "residue.json",
    "schemas/durable-storage.schema.json",
    "scripts/validate.py",
    "sources.json",
    "storage-classes.json",
    "storage-requirements.json",
    "tests/test_negative_mutations.py",
)
EXPECTED_SUBJECTS = {
    "CA2-CAP-DEFINE-SHARED-MEANING",
    "CA2-CAP-RESOLVE-LANGUAGE-CONTEXT",
    "CA2-CAP-RESOLVE-REGISTRY-CONTEXT",
    "CA2-REF-ARC-INVOKE-DEFINE",
    "CA2-CAP-ONTOLOGY-SOURCE-ADMISSION",
    "CA2-CAP-ONTOLOGY-TYPED-MEANING",
    "CA2-CAP-ONTOLOGY-DETERMINISTIC-VALIDATION",
    "CA2-CAP-ONTOLOGY-BOUNDED-RETRIEVAL",
    "CA2-CAP-DEVELOP-GOVERNED-ESSAY",
    "CA2-CAP-INSPECT-ESSAYS-PRODUCT-MODEL",
    "CA2-CAP-ROUTE-REPOSITORY-WORK",
    "CA2-CAP-MANAGE-ONTOLOGIES",
    "CA2-CAP-VALIDATE-D65-CONSTRUCTION",
}
EXTERNAL_SUBJECT = "CA2-REF-ARC-INVOKE-DEFINE"


def load(path: Path, errors: list[str]) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"cannot load {path}: {exc}")
        return {}
    if not isinstance(value, dict):
        errors.append(f"{path} must contain one JSON object")
        return {}
    return value


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def unique(values: list[str], label: str, errors: list[str]) -> None:
    duplicates = sorted({value for value in values if values.count(value) > 1})
    if duplicates:
        errors.append(f"duplicate {label}: {', '.join(duplicates)}")


def validate_definition(
    instance: Any,
    root_schema: dict[str, Any],
    definition: str,
    label: str,
    errors: list[str],
) -> None:
    candidate = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$defs": root_schema.get("$defs", {}),
        "$ref": f"#/$defs/{definition}",
    }
    try:
        Draft202012Validator.check_schema(candidate)
    except SchemaError as exc:
        errors.append(f"{label} schema is invalid: {exc.message}")
        return
    validator = Draft202012Validator(candidate, format_checker=FormatChecker())
    for error in sorted(validator.iter_errors(instance), key=lambda item: list(item.absolute_path)):
        location = ".".join(str(part) for part in error.absolute_path) or "$"
        errors.append(f"{label} schema violation at {location}: {error.message}")


def markdown_section(text: str, heading: str) -> str | None:
    lines = text.splitlines(keepends=True)
    start: int | None = None
    for index, line in enumerate(lines):
        if line.rstrip("\r\n") == heading:
            start = index
            break
    if start is None:
        return None
    end = len(lines)
    for index in range(start + 1, len(lines)):
        if lines[index].startswith("## "):
            end = index
            break
    return "".join(lines[start:end])


def material_digest(errors: list[str]) -> str:
    digest = hashlib.sha256()
    for relative in sorted(MATERIAL_FILES):
        path = PACKAGE_ROOT / relative
        if not path.is_file():
            errors.append(f"missing material file: {relative}")
            continue
        digest.update(relative.encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def source_material(
    source: dict[str, Any],
    errors: list[str],
) -> tuple[bytes, str] | None:
    relative = str(source.get("path", ""))
    path = REPOSITORY_ROOT / relative
    if not path.is_file():
        errors.append(f"missing source: {relative}")
        return None
    raw = path.read_bytes()
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError as exc:
        errors.append(f"source is not UTF-8: {relative}: {exc}")
        return None
    if source.get("selection_kind") == "whole-file":
        selected = raw
        selected_text = text
    elif source.get("selection_kind") == "markdown-section":
        section = markdown_section(text, str(source.get("selector", "")))
        if section is None:
            errors.append(f"source selector missing: {source.get('source_id')}")
            return None
        selected = section.encode("utf-8")
        selected_text = section
    else:
        errors.append(f"unsupported source selection kind: {source.get('selection_kind')!r}")
        return None
    if sha256_bytes(selected) != source.get("sha256"):
        errors.append(f"source digest drift: {source.get('source_id')}")
    if str(source.get("selector", "")) not in selected_text:
        errors.append(f"source selector absent from selected material: {source.get('source_id')}")
    return selected, selected_text


def check_source_refs(
    refs: Any,
    source_text: dict[str, str],
    label: str,
    errors: list[str],
) -> None:
    if not isinstance(refs, list) or not refs:
        errors.append(f"{label} must have source_refs")
        return
    for index, ref in enumerate(refs):
        if not isinstance(ref, dict) or set(ref) != {"source_id", "selector"}:
            errors.append(f"{label} source_refs[{index}] has invalid shape")
            continue
        source_id = str(ref.get("source_id", ""))
        selector = str(ref.get("selector", ""))
        if source_id not in source_text:
            errors.append(f"{label} source_refs[{index}] has unknown source {source_id!r}")
        elif selector not in source_text[source_id]:
            errors.append(f"{label} source_refs[{index}] selector is absent: {selector!r}")


def check_shared_product_capability(
    product_capability: dict[str, Any],
    shared_schema: dict[str, Any],
    errors: list[str],
) -> None:
    localized = copy.deepcopy(shared_schema)
    try:
        localized["$defs"]["productCapability"]["properties"]["schema_ref"]["const"] = (
            "../capability/schemas/capability.schema.json#/$defs/productCapability"
        )
    except (KeyError, TypeError):
        errors.append("shared capability schema is missing the Product Capability schema_ref contract")
        return
    validate_definition(product_capability, localized, "productCapability", "product capability", errors)


def validate() -> dict[str, Any]:
    errors: list[str] = []
    schema = load(PACKAGE_ROOT / "schemas/durable-storage.schema.json", errors)
    profile = load(PACKAGE_ROOT / "profile.json", errors)
    sources_doc = load(PACKAGE_ROOT / "sources.json", errors)
    definitions_doc = load(PACKAGE_ROOT / "definitions.json", errors)
    product_capability = load(PACKAGE_ROOT / "product-capability.json", errors)
    support = load(PACKAGE_ROOT / "product-capability-support.json", errors)
    classes_doc = load(PACKAGE_ROOT / "storage-classes.json", errors)
    requirements_doc = load(PACKAGE_ROOT / "storage-requirements.json", errors)
    nodes_doc = load(PACKAGE_ROOT / "nodes.json", errors)
    relations_doc = load(PACKAGE_ROOT / "relations.json", errors)
    residue_doc = load(PACKAGE_ROOT / "residue.json", errors)
    shared_schema = load(SHARED_CAPABILITY_SCHEMA, errors)

    definitions_to_validate = (
        (profile, "profile", "profile"),
        (sources_doc, "sourceRegistry", "source registry"),
        (definitions_doc, "definitionRegistry", "definition registry"),
        (support, "productCapabilitySupport", "product capability support"),
        (classes_doc, "storageClassRegistry", "storage class registry"),
        (requirements_doc, "storageRequirementRegistry", "storage requirement registry"),
        (nodes_doc, "nodeRegistry", "node registry"),
        (relations_doc, "relationRegistry", "relation registry"),
        (residue_doc, "residueRegistry", "residue registry"),
    )
    for instance, definition, label in definitions_to_validate:
        validate_definition(instance, schema, definition, label, errors)
    check_shared_product_capability(product_capability, shared_schema, errors)

    source_ids: list[str] = []
    source_text: dict[str, str] = {}
    selected_bytes: dict[str, bytes] = {}
    for source in sources_doc.get("sources", []):
        if not isinstance(source, dict):
            continue
        source_id = str(source.get("source_id", ""))
        source_ids.append(source_id)
        result = source_material(source, errors)
        if result is not None:
            selected, text = result
            selected_bytes[source_id] = selected
            source_text[source_id] = text
    unique(source_ids, "source IDs", errors)
    source_id_set = set(source_ids)

    bindings = definitions_doc.get("canonical_bindings", [])
    binding_refs = [str(item.get("definition_ref")) for item in bindings if isinstance(item, dict)]
    if set(binding_refs) != {"CAV2-D65", "CAV2-D67"} or len(binding_refs) != 2:
        errors.append("canonical definition bindings must be exactly CAV2-D65 and CAV2-D67")
    for binding in bindings:
        if not isinstance(binding, dict):
            continue
        source_ref = str(binding.get("source_ref", ""))
        if source_ref not in source_id_set:
            errors.append(f"definition binding has unknown source: {source_ref}")
        elif binding.get("selector_sha256") != sha256_bytes(selected_bytes.get(source_ref, b"")):
            errors.append(f"definition binding digest mismatch: {binding.get('definition_ref')}")

    for field in ("evidence_refs",):
        for source_ref in product_capability.get(field, []):
            if source_ref not in source_id_set:
                errors.append(f"product capability has unknown evidence ref: {source_ref}")
    for owner in product_capability.get("owner_routes", []):
        if isinstance(owner, dict):
            for source_ref in owner.get("source_refs", []):
                if source_ref not in source_id_set:
                    errors.append(f"product capability owner route has unknown source: {source_ref}")

    nodes = nodes_doc.get("nodes", [])
    node_ids = [str(node.get("id")) for node in nodes if isinstance(node, dict)]
    unique(node_ids, "node IDs", errors)
    node_id_set = set(node_ids)
    node_roles = {str(node.get("id")): str(node.get("role")) for node in nodes if isinstance(node, dict)}
    for node in nodes:
        if isinstance(node, dict):
            check_source_refs(node.get("source_refs"), source_text, f"node {node.get('id')}", errors)
            if node.get("authority_effect") != "none":
                errors.append(f"node exceeds authority ceiling: {node.get('id')}")

    required_node_refs = {
        str(product_capability.get("business_ontology_ref", "")),
        *map(str, product_capability.get("outcome_refs", [])),
        *map(str, product_capability.get("participant_refs", [])),
        *map(str, product_capability.get("consumer_refs", [])),
        *map(str, product_capability.get("input_contract_refs", [])),
        *map(str, product_capability.get("output_contract_refs", [])),
        *map(str, product_capability.get("context_policy_refs", [])),
    }
    missing_node_refs = sorted(required_node_refs - node_id_set)
    if missing_node_refs:
        errors.append(f"product capability refs do not resolve: {', '.join(missing_node_refs)}")
    if product_capability.get("capability_id") != profile.get("product_capability_ref"):
        errors.append("profile and Product Capability identity disagree")
    if product_capability.get("product_ref") != profile.get("product_ref"):
        errors.append("profile and Product Capability product identity disagree")
    if support.get("capability_ref") != product_capability.get("capability_id"):
        errors.append("Product Capability support references the wrong capability")
    binding_id = str(support.get("realization_binding", {}).get("binding_id", ""))
    if product_capability.get("realization_binding_refs") != [binding_id]:
        errors.append("Product Capability realization binding does not resolve to the explicit unselected binding")
    obligation_id = str(support.get("obligation_registry", {}).get("registry_id", ""))
    if product_capability.get("obligation_registry_ref") != obligation_id:
        errors.append("Product Capability obligation registry does not resolve")

    class_ids = [str(item.get("class_id")) for item in classes_doc.get("classes", []) if isinstance(item, dict)]
    unique(class_ids, "storage class IDs", errors)
    class_id_set = set(class_ids)
    expected_classes = {
        "DS-CLASS-AUTHORITATIVE-VERSIONED",
        "DS-CLASS-APPEND-ONLY-EVIDENCE",
        "DS-CLASS-RECOVERABLE-WORKING-STATE",
        "DS-CLASS-IMMUTABLE-ARTIFACT",
        "DS-CLASS-REBUILDABLE-PROJECTION",
        "DS-CLASS-EXTERNAL-SECRET-REFERENCE",
        "DS-CLASS-EPHEMERAL",
    }
    if class_id_set != expected_classes:
        errors.append("storage classes must be exactly the seven provider-neutral model classes")

    requirements = requirements_doc.get("requirements", [])
    requirement_ids = [str(item.get("requirement_id")) for item in requirements if isinstance(item, dict)]
    subject_refs = [str(item.get("subject_ref")) for item in requirements if isinstance(item, dict)]
    unique(requirement_ids, "requirement IDs", errors)
    unique(subject_refs, "requirement subject refs", errors)
    observed_subjects = set(subject_refs)
    if observed_subjects != EXPECTED_SUBJECTS or len(subject_refs) != len(EXPECTED_SUBJECTS):
        missing = sorted(EXPECTED_SUBJECTS - observed_subjects)
        extra = sorted(observed_subjects - EXPECTED_SUBJECTS)
        errors.append(f"capability coverage mismatch; missing={missing!r}; extra={extra!r}")
    for requirement in requirements:
        if not isinstance(requirement, dict):
            continue
        subject_ref = str(requirement.get("subject_ref", ""))
        evidence_refs = requirement.get("evidence_refs", [])
        for source_ref in evidence_refs:
            if source_ref not in source_text:
                errors.append(f"requirement {subject_ref} has unknown evidence ref: {source_ref}")
            elif subject_ref not in source_text[source_ref]:
                errors.append(f"requirement {subject_ref} is absent from evidence source {source_ref}")
        unknown_classes = sorted(set(requirement.get("durability_class_refs", [])) - class_id_set)
        if unknown_classes:
            errors.append(f"requirement {subject_ref} has unknown storage classes: {unknown_classes!r}")
        artifact_kinds = requirement.get("artifact_kinds", [])
        if any(any(token in str(kind) for token in ("/", "\\", "*", "?")) for kind in artifact_kinds):
            errors.append(f"requirement {subject_ref} attempts path or glob capture")
        if subject_ref == EXTERNAL_SUBJECT:
            if (
                requirement.get("subject_kind") != "agent-capability-reference"
                or requirement.get("need_posture") != "external-owner"
                or requirement.get("binding_state") != "external-owner"
                or artifact_kinds
                or requirement.get("durability_class_refs")
            ):
                errors.append("external Invoke reference must remain external-owner with no assigned storage")
        else:
            if requirement.get("subject_kind") != "product-capability":
                errors.append(f"CyberAlchemy subject must be a Product Capability: {subject_ref}")
            if requirement.get("need_posture") in {"external-owner", "unknown"}:
                errors.append(f"seeded Product Capability has invalid resolved posture: {subject_ref}")
            if requirement.get("binding_state") != "unselected":
                errors.append(f"provider binding must remain unselected: {subject_ref}")
            if not artifact_kinds or not requirement.get("durability_class_refs"):
                errors.append(f"Product Capability requirement must name artifacts and classes: {subject_ref}")
        if requirement.get("authority_effect") != "none":
            errors.append(f"requirement exceeds authority ceiling: {subject_ref}")

    vocabulary = relations_doc.get("relation_vocabulary", [])
    relation_types = [str(item.get("type")) for item in vocabulary if isinstance(item, dict)]
    unique(relation_types, "relation types", errors)
    vocabulary_by_type = {
        str(item.get("type")): item for item in vocabulary if isinstance(item, dict)
    }
    relations = relations_doc.get("relations", [])
    relation_ids = [str(item.get("id")) for item in relations if isinstance(item, dict)]
    unique(relation_ids, "relation IDs", errors)
    observed_relations: set[tuple[str, str, str]] = set()
    for relation in relations:
        if not isinstance(relation, dict):
            continue
        label = f"relation {relation.get('id')}"
        source = str(relation.get("source", ""))
        target = str(relation.get("target", ""))
        relation_type = str(relation.get("type", ""))
        if source not in node_id_set or target not in node_id_set:
            errors.append(f"{label} has an unknown endpoint")
        relation_contract = vocabulary_by_type.get(relation_type)
        if relation_contract is None:
            errors.append(f"{label} has unknown relation type {relation_type!r}")
        else:
            if node_roles.get(source) not in relation_contract.get("source_roles", []):
                errors.append(f"{label} has invalid source role")
            if node_roles.get(target) not in relation_contract.get("target_roles", []):
                errors.append(f"{label} has invalid target role")
        check_source_refs(relation.get("source_refs"), source_text, label, errors)
        if relation.get("authority_effect") != "none":
            errors.append(f"{label} exceeds authority ceiling")
        observed_relations.add((relation_type, source, target))
    required_relations = {
        ("offers", "CA2-PRODUCT-CYBERALCHEMY", "DS-CAP-PRESERVE-DURABLE-CAPABILITY-STATE"),
        ("accepts", "DS-CAP-PRESERVE-DURABLE-CAPABILITY-STATE", "CA2-CAP-CONTRACT-DURABLE-STATE-DECLARATION"),
        ("produces", "DS-CAP-PRESERVE-DURABLE-CAPABILITY-STATE", "CA2-CAP-CONTRACT-DURABLE-STATE-REQUIREMENT"),
        ("scopes", "DS-CONCEPT-DURABLE-STATE-REQUIREMENT", "DS-CONCEPT-OWNED-ARTIFACT-SET"),
        ("classified_by", "DS-CONCEPT-DURABLE-STATE-REQUIREMENT", "DS-CONCEPT-DURABILITY-CLASS"),
        ("fulfilled_by", "DS-CONCEPT-DURABLE-STATE-REQUIREMENT", "DS-CONCEPT-STORAGE-BINDING"),
        ("verifies", "DS-CONCEPT-RECOVERY-RECEIPT", "DS-CONCEPT-DURABLE-STATE-REQUIREMENT"),
    }
    missing_relations = sorted(required_relations - observed_relations)
    if missing_relations:
        errors.append(f"missing required business relations: {missing_relations!r}")

    residue = residue_doc.get("residue", [])
    residue_ids = [str(item.get("residue_id")) for item in residue if isinstance(item, dict)]
    unique(residue_ids, "residue IDs", errors)
    resolvable_subjects = node_id_set | set(requirement_ids) | {binding_id}
    for item in residue:
        if not isinstance(item, dict):
            continue
        residue_id = str(item.get("residue_id", ""))
        unknown_subjects = sorted(set(item.get("subject_refs", [])) - resolvable_subjects)
        if unknown_subjects:
            errors.append(f"residue {residue_id} has unknown subjects: {unknown_subjects!r}")
        unknown_evidence = sorted(set(item.get("evidence_refs", [])) - source_id_set)
        if unknown_evidence:
            errors.append(f"residue {residue_id} has unknown evidence: {unknown_evidence!r}")
        if item.get("authority_effect") != "none":
            errors.append(f"residue exceeds authority ceiling: {residue_id}")
    required_residue = {
        "CAP-RES-DURABLE-STORAGE-DOMAINSPEC",
        "CAP-RES-DURABLE-STORAGE-RUNTIME",
        "CAP-RES-DURABLE-STORAGE-REGISTRATION",
        "CAP-RES-DURABLE-STORAGE-COVERAGE",
    }
    if not required_residue.issubset(set(residue_ids)):
        errors.append("required construction and coverage residue is missing")
    registration_residue = next(
        (
            item for item in residue
            if isinstance(item, dict)
            and item.get("residue_id") == "CAP-RES-DURABLE-STORAGE-REGISTRATION"
        ),
        None,
    )
    if not isinstance(registration_residue, dict) or registration_residue.get("status") != "closed":
        errors.append("ontology runtime registration residue must be closed")

    for forbidden_surface in ("domainspec", "system-ontology", "implementation"):
        if (PACKAGE_ROOT / forbidden_surface).exists():
            errors.append(f"model-first package must not contain {forbidden_surface}")

    if "validationReceipt" in schema.get("$defs", {}):
        for receipt_path in sorted((PACKAGE_ROOT / "receipts").glob("validation-*.json")):
            receipt = load(receipt_path, errors)
            if receipt:
                validate_definition(receipt, schema, "validationReceipt", f"stored receipt {receipt_path.name}", errors)

    source_digest_builder = hashlib.sha256()
    for source_id in sorted(selected_bytes):
        source_digest_builder.update(source_id.encode("utf-8"))
        source_digest_builder.update(b"\0")
        source_digest_builder.update(selected_bytes[source_id])
        source_digest_builder.update(b"\0")
    digest = material_digest(errors)
    product_capability_count = sum(1 for item in requirements if isinstance(item, dict) and item.get("subject_kind") == "product-capability")
    external_count = sum(1 for item in requirements if isinstance(item, dict) and item.get("subject_kind") == "agent-capability-reference")
    return {
        "schema_version": "cav2-durable-storage-validation/v1",
        "status": "PASS" if not errors else "BLOCK",
        "package_root": "cyberAlchemy-v2/durable-storage",
        "ontology_id": "cav2.durable-storage.business",
        "ontology_type": "business-domain",
        "branch": "business",
        "visibility": "private",
        "authority_effect": "none",
        "material_digest": digest,
        "source_digest": source_digest_builder.hexdigest(),
        "counts": {
            "sources": len(source_ids),
            "canonical_definitions": len(bindings),
            "local_terms": len(definitions_doc.get("local_terms", [])),
            "storage_classes": len(class_ids),
            "requirements": len(requirement_ids),
            "product_capabilities": product_capability_count,
            "external_agent_capability_references": external_count,
            "nodes": len(node_ids),
            "relation_types": len(relation_types),
            "relations": len(relation_ids),
            "residue": len(residue_ids),
        },
        "construction": {
            "definitions": "validated-reference",
            "product_capability": "candidate-validated-shape",
            "business_ontology": "candidate-validated-package",
            "domainspec_source": "absent",
            "compiled_graph": "not_evaluable",
            "system_ontology": "not_evaluable",
            "implementation_binding": "not_evaluable",
            "conformance": "not_evaluable",
        },
        "claim_ceiling": "Current source-bound candidate Product Capability and business ontology package only; no adoption, complete repository capability inventory, DomainSpec admission, provider, implementation, recovery proof, conformance, publication, release, deployment, or external effect.",
        "errors": errors,
    }


def write_receipt(result: dict[str, Any]) -> dict[str, Any]:
    if result.get("status") != "PASS":
        return result
    receipt = {"validated_at": datetime.now(timezone.utc).isoformat(), **result}
    schema_errors: list[str] = []
    schema = load(PACKAGE_ROOT / "schemas/durable-storage.schema.json", schema_errors)
    validate_definition(receipt, schema, "validationReceipt", "new validation receipt", schema_errors)
    if schema_errors:
        blocked = dict(result)
        blocked["status"] = "BLOCK"
        blocked["errors"] = schema_errors
        return blocked
    receipt_path = PACKAGE_ROOT / "receipts" / f"validation-{result['material_digest'][:16]}.json"
    if receipt_path.exists():
        existing = load(receipt_path, schema_errors)
        if schema_errors:
            blocked = dict(result)
            blocked["status"] = "BLOCK"
            blocked["errors"] = schema_errors
            return blocked
        return existing
    receipt_path.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    return receipt


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write-receipt", action="store_true")
    args = parser.parse_args()
    result = validate()
    if args.write_receipt:
        result = write_receipt(result)
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result.get("status") == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
