#!/usr/bin/env python3
"""Validate the private Ontology Product ontology; write a receipt only on request."""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator, FormatChecker
from jsonschema.exceptions import SchemaError


PACKAGE_ROOT = Path(__file__).resolve().parent
REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
MATERIAL_FILES = (
    "README.md",
    "nodes.json",
    "profile.json",
    "relations.json",
    "residue.json",
    "schema.json",
    "sources.json",
    "tests/test_validate.py",
    "validate.py",
)
NODE_KEYS = {
    "id", "label", "role", "plain_language", "claim", "scope", "source_refs",
    "owner_route", "candidate_status", "evidence_confidence",
    "commitment_confidence", "authority_effect", "forbidden_collapse",
    "open_questions",
}
RELATION_KEYS = {
    "id", "type", "source", "target", "source_refs", "owner_route",
    "authority_effect", "forbidden_collapse",
}
RESIDUE_KEYS = {
    "id", "label", "description", "status", "owner_route", "next_action",
    "subject_refs", "source_refs",
}
ALLOWED_ROLES = {
    "product", "actor", "problem", "thesis", "capability", "product_output",
    "outcome", "business_rule", "project", "goal",
}


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


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def exact_keys(value: dict[str, Any], expected: set[str], label: str, errors: list[str]) -> None:
    missing = sorted(expected - set(value))
    extra = sorted(set(value) - expected)
    if missing:
        errors.append(f"{label} missing keys: {', '.join(missing)}")
    if extra:
        errors.append(f"{label} unknown keys: {', '.join(extra)}")


def validate_definition(
    instance: Any,
    root_schema: dict[str, Any],
    definition: str,
    label: str,
    errors: list[str],
) -> None:
    candidate_schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$defs": root_schema.get("$defs", {}),
        "$ref": f"#/$defs/{definition}",
    }
    try:
        Draft202012Validator.check_schema(candidate_schema)
    except SchemaError as exc:
        errors.append(f"{label} schema is invalid: {exc.message}")
        return
    validator = Draft202012Validator(candidate_schema, format_checker=FormatChecker())
    for error in sorted(validator.iter_errors(instance), key=lambda item: list(item.absolute_path)):
        location = ".".join(str(part) for part in error.absolute_path) or "$"
        errors.append(f"{label} schema violation at {location}: {error.message}")


def check_unique(values: list[str], label: str, errors: list[str]) -> None:
    duplicates = sorted({value for value in values if values.count(value) > 1})
    if duplicates:
        errors.append(f"duplicate {label}: {', '.join(duplicates)}")


def material_digest(errors: list[str]) -> str:
    digest = hashlib.sha256()
    for relative in sorted(MATERIAL_FILES):
        path = PACKAGE_ROOT / relative
        if not path.is_file():
            errors.append(f"missing material file: {relative}")
            continue
        digest.update(relative.encode())
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def check_source_refs(
    refs: Any,
    source_ids: set[str],
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
        source_id = ref.get("source_id")
        selector = ref.get("selector")
        if source_id not in source_ids:
            errors.append(f"{label} source_refs[{index}] has unknown source {source_id!r}")
        elif not isinstance(selector, str) or selector not in source_text.get(str(source_id), ""):
            errors.append(f"{label} source_refs[{index}] selector is absent: {selector!r}")


def validate() -> dict[str, Any]:
    errors: list[str] = []
    profile = load(PACKAGE_ROOT / "profile.json", errors)
    sources_doc = load(PACKAGE_ROOT / "sources.json", errors)
    nodes_doc = load(PACKAGE_ROOT / "nodes.json", errors)
    relations_doc = load(PACKAGE_ROOT / "relations.json", errors)
    residue_doc = load(PACKAGE_ROOT / "residue.json", errors)
    schema = load(PACKAGE_ROOT / "schema.json", errors)

    required_definitions = {
        "source_ref", "source", "node", "relation_type", "relation", "residue",
        "profile", "source_registry", "node_registry", "relation_registry",
        "residue_registry", "validation_receipt",
    }
    if not required_definitions.issubset(schema.get("$defs", {})):
        errors.append("schema is missing required definitions")
    else:
        for instance, definition, label in (
            (profile, "profile", "profile"),
            (sources_doc, "source_registry", "source registry"),
            (nodes_doc, "node_registry", "node registry"),
            (relations_doc, "relation_registry", "relation registry"),
            (residue_doc, "residue_registry", "residue registry"),
        ):
            validate_definition(instance, schema, definition, label, errors)

    profile_keys = {
        "schema_version", "ontology_id", "title", "ontology_type", "branch",
        "materialization", "package_root", "package_owner", "meaning_owner",
        "visibility", "candidate_status", "authority_effect", "product_node_id",
        "parent_product_node_id", "thesis_node_id", "project_node_id", "goal_node_id",
        "source_registry", "node_registry", "relation_registry", "residue_registry",
        "schema_path", "validator_path", "external_goal_package_validation",
        "blocked_outputs",
    }
    exact_keys(profile, profile_keys, "profile", errors)
    expected_profile = {
        "schema_version": "cav2-ontology-product-profile/v1",
        "ontology_id": "cav2.ontology-product",
        "ontology_type": "business-domain",
        "branch": "business",
        "materialization": "package-required",
        "package_root": "cyberAlchemy-v2/ontology/ontology-product",
        "visibility": "private",
        "candidate_status": "candidate",
        "authority_effect": "none",
        "product_node_id": "CA2-PRODUCT-ONTOLOGY",
        "parent_product_node_id": "CA2-PRODUCT-CYBERALCHEMY",
        "thesis_node_id": "CA2-THESIS-ONTOLOGY-PRODUCT",
        "project_node_id": "CA2-PROJECT-ONTOLOGY-PRODUCT",
        "goal_node_id": "CA2-GOAL-ONTOLOGY-PRODUCT-FOUNDATION",
        "external_goal_package_validation": "not_evaluated",
    }
    for field, expected in expected_profile.items():
        if profile.get(field) != expected:
            errors.append(f"profile {field} must be {expected!r}")
    source_ids: set[str] = set()
    source_text: dict[str, str] = {}
    source_paths: dict[str, Path] = {}
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
        relative_path = str(source.get("path", ""))
        path = REPOSITORY_ROOT / relative_path
        if not path.is_file():
            errors.append(f"missing source: {relative_path}")
            continue
        if sha256(path) != source.get("sha256"):
            errors.append(f"source digest drift: {source_id}")
        if isinstance(source_id, str):
            source_text[source_id] = path.read_text(encoding="utf-8")
            source_paths[source_id] = path
    for required in {
        "SRC-CAV2-DEFINITIONS",
        "SRC-CAV2-UMBRELLA-PRODUCT-THESIS-RECORD",
        "SRC-CAV2-ONTOLOGY-PRODUCT-IDENTITY-DECISION",
        "SRC-CAV2-ONTOLOGY-PRODUCT-THESIS",
        "SRC-CAV2-ONTOLOGY-PRODUCT-THESIS-RECORD",
        "SRC-CAV2-ONTOLOGY-PRODUCT-THESIS-RECEIPT",
    }:
        if required not in source_ids:
            errors.append(f"missing required source: {required}")
    thesis_receipt_path = source_paths.get("SRC-CAV2-ONTOLOGY-PRODUCT-THESIS-RECEIPT")
    thesis_receipt = load(thesis_receipt_path, errors) if thesis_receipt_path else {}
    if (
        thesis_receipt.get("status") != "PASS"
        or thesis_receipt.get("package_root") != "cyberAlchemy-v2/product/ontology-product"
        or thesis_receipt.get("product_id") != "CA2-PRODUCT-ONTOLOGY"
        or thesis_receipt.get("thesis_id") != "CA2-PRODUCT-THESIS-ONTOLOGY"
        or thesis_receipt.get("goal_package_validation") != "not_evaluated"
        or thesis_receipt.get("authority_effect") != "none"
    ):
        errors.append("registered product thesis receipt is not a compatible PASS identity")

    nodes = nodes_doc.get("nodes", [])
    if not isinstance(nodes, list) or not nodes:
        errors.append("nodes must be a non-empty list")
        nodes = []
    node_ids = [str(node.get("id")) for node in nodes if isinstance(node, dict)]
    check_unique(node_ids, "node IDs", errors)
    node_id_set = set(node_ids)
    for index, node in enumerate(nodes):
        if not isinstance(node, dict):
            errors.append(f"nodes[{index}] must be an object")
            continue
        label = f"node {node.get('id', index)}"
        exact_keys(node, NODE_KEYS, label, errors)
        if node.get("role") not in ALLOWED_ROLES:
            errors.append(f"{label} has unsupported role {node.get('role')!r}")
        if node.get("authority_effect") != "none":
            errors.append(f"{label} exceeds authority_effect none")
        check_source_refs(node.get("source_refs"), source_ids, source_text, label, errors)
    for field in ("product_node_id", "parent_product_node_id", "thesis_node_id", "project_node_id", "goal_node_id"):
        if profile.get(field) not in node_id_set:
            errors.append(f"profile {field} does not resolve")

    vocabulary = relations_doc.get("relation_vocabulary", [])
    relations = relations_doc.get("relations", [])
    relation_types = [str(item.get("id")) for item in vocabulary if isinstance(item, dict)]
    check_unique(relation_types, "relation type IDs", errors)
    relation_type_set = set(relation_types)
    relation_ids = [str(item.get("id")) for item in relations if isinstance(item, dict)]
    check_unique(relation_ids, "relation IDs", errors)
    observed: set[tuple[str, str, str]] = set()
    relation_slots: dict[tuple[str, str], list[str]] = {}
    for index, relation_type in enumerate(vocabulary):
        if not isinstance(relation_type, dict):
            errors.append(f"relation_vocabulary[{index}] must be an object")
            continue
        exact_keys(relation_type, {"id", "plain_language", "forbidden_collapse"}, f"relation type {index}", errors)
    for index, relation in enumerate(relations):
        if not isinstance(relation, dict):
            errors.append(f"relations[{index}] must be an object")
            continue
        label = f"relation {relation.get('id', index)}"
        exact_keys(relation, RELATION_KEYS, label, errors)
        relation_type = str(relation.get("type"))
        source = str(relation.get("source"))
        target = str(relation.get("target"))
        if relation_type not in relation_type_set:
            errors.append(f"{label} uses unknown relation type")
        if source not in node_id_set or target not in node_id_set:
            errors.append(f"{label} has an unknown endpoint")
        if relation.get("authority_effect") != "none":
            errors.append(f"{label} exceeds authority_effect none")
        check_source_refs(relation.get("source_refs"), source_ids, source_text, label, errors)
        observed.add((relation_type, source, target))
        relation_slots.setdefault((relation_type, source), []).append(target)
    required_relations = {
        "subproduct_of": ("subproduct_of", "CA2-PRODUCT-ONTOLOGY", "CA2-PRODUCT-CYBERALCHEMY"),
        "product_thesis": ("claims_value_through", "CA2-PRODUCT-ONTOLOGY", "CA2-THESIS-ONTOLOGY-PRODUCT"),
        "project_product": ("develops", "CA2-PROJECT-ONTOLOGY-PRODUCT", "CA2-PRODUCT-ONTOLOGY"),
        "project_thesis": ("tests_realization_of", "CA2-PROJECT-ONTOLOGY-PRODUCT", "CA2-THESIS-ONTOLOGY-PRODUCT"),
        "goal_project": ("belongs_to", "CA2-GOAL-ONTOLOGY-PRODUCT-FOUNDATION", "CA2-PROJECT-ONTOLOGY-PRODUCT"),
        "goal_thesis": ("advances", "CA2-GOAL-ONTOLOGY-PRODUCT-FOUNDATION", "CA2-THESIS-ONTOLOGY-PRODUCT"),
    }
    relationship_status: dict[str, bool] = {}
    for name, relation in required_relations.items():
        relation_type, source, target = relation
        targets = relation_slots.get((relation_type, source), [])
        relationship_status[name] = targets == [target]
        if not targets:
            errors.append(f"missing required relationship: {name}")
        elif targets != [target]:
            errors.append(
                f"conflicting core relationship {name}: expected exactly [{target!r}], observed {targets!r}"
            )

    residue = residue_doc.get("residue", [])
    if not isinstance(residue, list):
        errors.append("residue must be a list")
        residue = []
    residue_ids = [str(item.get("id")) for item in residue if isinstance(item, dict)]
    check_unique(residue_ids, "residue IDs", errors)
    for index, item in enumerate(residue):
        if not isinstance(item, dict):
            errors.append(f"residue[{index}] must be an object")
            continue
        label = f"residue {item.get('id', index)}"
        exact_keys(item, RESIDUE_KEYS, label, errors)
        for subject_ref in item.get("subject_refs", []):
            if subject_ref not in node_id_set:
                errors.append(f"{label} has unknown subject {subject_ref!r}")
        check_source_refs(item.get("source_refs"), source_ids, source_text, label, errors)
    goal_residue = [
        item for item in residue
        if isinstance(item, dict) and item.get("id") == "CA2-RES-ONTOLOGY-PRODUCT-GOAL-PACKAGE"
    ]
    if len(goal_residue) != 1:
        errors.append("Goal-package validation residue must occur exactly once")
    else:
        item = goal_residue[0]
        expected_subjects = {
            "CA2-PROJECT-ONTOLOGY-PRODUCT",
            "CA2-GOAL-ONTOLOGY-PRODUCT-FOUNDATION",
        }
        if item.get("status") != "blocked":
            errors.append("Goal-package validation residue status must be blocked")
        if set(item.get("subject_refs", [])) != expected_subjects or len(item.get("subject_refs", [])) != 2:
            errors.append("Goal-package validation residue subjects must be exactly Project and Goal")
        if "not_evaluated" not in str(item.get("description", "")):
            errors.append("Goal-package validation residue must state not_evaluated")

    if "validation_receipt" in schema.get("$defs", {}):
        for receipt_path in sorted((PACKAGE_ROOT / "receipts").glob("validation-*.json")):
            receipt = load(receipt_path, errors)
            if receipt:
                validate_definition(receipt, schema, "validation_receipt", f"stored receipt {receipt_path.name}", errors)

    digest = material_digest(errors)
    return {
        "schema_version": "cav2-ontology-product-validation/v1",
        "status": "PASS" if not errors else "BLOCK",
        "package_root": "cyberAlchemy-v2/ontology/ontology-product",
        "ontology_id": "cav2.ontology-product",
        "ontology_type": "business-domain",
        "branch": "business",
        "visibility": "private",
        "authority_effect": "none",
        "material_digest": digest,
        "counts": {
            "sources": len(source_ids),
            "nodes": len(nodes),
            "relation_types": len(vocabulary),
            "relations": len(relations),
            "residue": len(residue),
        },
        "required_relationships": relationship_status,
        "external_goal_package_validation": "not_evaluated",
        "claim_ceiling": "Exact candidate package closure only; not product value, Goal achievement, runtime implementation, Arcanum replacement, publication, release, deployment, or production readiness.",
        "errors": errors,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write-receipt", action="store_true")
    args = parser.parse_args()
    result = validate()
    if args.write_receipt and result["status"] == "PASS":
        receipt = dict(result)
        receipt["validated_at"] = datetime.now(timezone.utc).isoformat()
        receipts = PACKAGE_ROOT / "receipts"
        receipts.mkdir(exist_ok=True)
        path = receipts / f"validation-{result['material_digest'][:16]}.json"
        if path.exists():
            receipt = load(path, [])
        else:
            path.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
        result["receipt"] = str(path.relative_to(REPOSITORY_ROOT))
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
