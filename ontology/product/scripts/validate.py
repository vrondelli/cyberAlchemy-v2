#!/usr/bin/env python3
"""Check the private CyberAlchemy v2 product ontology package without writing."""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path
from typing import Any


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = Path(__file__).resolve().parents[4]

MATERIAL_FILES = (
    "README.md",
    "profile.json",
    "sources.json",
    "nodes.json",
    "relations.json",
    "residue.json",
    "schemas/product-ontology.schema.json",
    "scripts/validate.py",
)

NODE_KEYS = {
    "id",
    "label",
    "role",
    "plain_language",
    "claim",
    "scope",
    "source_refs",
    "owner_route",
    "candidate_status",
    "evidence_confidence",
    "commitment_confidence",
    "authority_effect",
    "forbidden_collapse",
    "open_questions",
}

RELATION_KEYS = {
    "id",
    "type",
    "source",
    "target",
    "direction",
    "owner_route",
    "source_refs",
    "authority_effect",
    "forbidden_collapse",
}

RESIDUE_KEYS = {
    "id",
    "label",
    "description",
    "status",
    "owner_route",
    "next_action",
    "subject_refs",
    "source_refs",
}

ALLOWED_ROLES = {
    "product",
    "actor",
    "work_domain",
    "problem",
    "thesis",
    "product_form",
    "capability",
    "product_output",
    "outcome",
    "business_rule",
    "method",
    "project",
    "goal",
    "research",
    "experiment",
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


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def check_exact_keys(
    value: dict[str, Any], required: set[str], label: str, errors: list[str]
) -> None:
    missing = sorted(required - set(value))
    extra = sorted(set(value) - required)
    if missing:
        errors.append(f"{label} missing keys: {', '.join(missing)}")
    if extra:
        errors.append(f"{label} has unknown keys: {', '.join(extra)}")


def check_unique(values: list[str], label: str, errors: list[str]) -> None:
    duplicates = sorted({item for item in values if values.count(item) > 1})
    if duplicates:
        errors.append(f"duplicate {label}: {', '.join(duplicates)}")


def check_source_refs(
    refs: Any, source_ids: set[str], label: str, errors: list[str]
) -> None:
    if not isinstance(refs, list) or not refs:
        errors.append(f"{label} must have at least one source ref")
        return
    for index, ref in enumerate(refs):
        if not isinstance(ref, dict) or set(ref) != {"source_id", "selector"}:
            errors.append(f"{label} source_refs[{index}] has an invalid shape")
            continue
        if ref["source_id"] not in source_ids:
            errors.append(
                f"{label} source_refs[{index}] uses unknown source {ref['source_id']}"
            )
        if not isinstance(ref["selector"], str) or not ref["selector"].strip():
            errors.append(f"{label} source_refs[{index}] has an empty selector")


def check_source_selectors(
    refs: Any, source_text_by_id: dict[str, str], label: str, errors: list[str]
) -> None:
    if not isinstance(refs, list):
        return
    for index, ref in enumerate(refs):
        if not isinstance(ref, dict):
            continue
        source_id = ref.get("source_id")
        selector = ref.get("selector")
        if not isinstance(source_id, str) or not isinstance(selector, str):
            continue
        source_text = source_text_by_id.get(source_id)
        if source_text is not None and selector not in source_text:
            errors.append(
                f"{label} source_refs[{index}] selector is missing from "
                f"source {source_id}: {selector!r}"
            )


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


def main() -> int:
    errors: list[str] = []

    profile = load_json("profile.json", errors)
    sources_doc = load_json("sources.json", errors)
    nodes_doc = load_json("nodes.json", errors)
    relations_doc = load_json("relations.json", errors)
    residue_doc = load_json("residue.json", errors)
    schema = load_json("schemas/product-ontology.schema.json", errors)

    expected_profile = {
        "schema_ref",
        "schema_version",
        "ontology_id",
        "title",
        "ontology_type",
        "branch",
        "materialization",
        "package_root",
        "package_owner",
        "meaning_owner",
        "visibility",
        "candidate_status",
        "authority_effect",
        "product_thesis_node_id",
        "source_registry",
        "node_registry",
        "relation_registry",
        "residue_registry",
        "schema_path",
        "validator_path",
        "blocked_outputs",
    }
    check_exact_keys(profile, expected_profile, "profile", errors)
    expected_profile_values = {
        "schema_version": "cav2-product-ontology-profile/v1",
        "ontology_id": "cav2.product-thesis",
        "ontology_type": "business-domain",
        "branch": "business",
        "materialization": "package-required",
        "package_root": "cyberAlchemy-v2/ontology/product",
        "visibility": "private",
        "candidate_status": "candidate",
        "authority_effect": "none",
    }
    for field, expected in expected_profile_values.items():
        if profile.get(field) != expected:
            errors.append(f"profile {field} must equal {expected!r}")

    if "$defs" not in schema:
        errors.append("schema must define $defs")
    else:
        required_defs = {
            "profile",
            "sourceRef",
            "sourceRegistry",
            "nodeRegistry",
            "relationRegistry",
            "residueRegistry",
            "validationReceipt",
        }
        missing_defs = sorted(required_defs - set(schema["$defs"]))
        if missing_defs:
            errors.append(f"schema missing definitions: {', '.join(missing_defs)}")

    sources = sources_doc.get("sources", [])
    if not isinstance(sources, list) or not sources:
        errors.append("sources.json must contain a non-empty sources list")
        sources = []
    source_ids = {source.get("id") for source in sources if isinstance(source, dict)}
    source_id_list = [item for item in source_ids if isinstance(item, str)]
    check_unique(source_id_list, "source IDs", errors)
    source_text_by_id: dict[str, str] = {}
    for index, source in enumerate(sources):
        if not isinstance(source, dict):
            errors.append(f"source[{index}] must be an object")
            continue
        expected_keys = {"id", "path", "sha256", "posture", "owner_route"}
        check_exact_keys(source, expected_keys, f"source[{index}]", errors)
        relative_path = source.get("path")
        if not isinstance(relative_path, str):
            errors.append(f"source[{index}] path must be a string")
            continue
        if relative_path.startswith("/") or ".." in Path(relative_path).parts:
            errors.append(f"source[{index}] path must be repository-relative")
            continue
        if not relative_path.startswith(
            ("cyberAlchemy-v2/", "arcanum/", "projects/ide-ergonomics/")
        ):
            errors.append(f"source[{index}] is outside the allowed source roots")
        source_path = REPOSITORY_ROOT / relative_path
        if not source_path.is_file():
            errors.append(f"source[{index}] is missing: {relative_path}")
            continue
        source_id = source.get("id")
        if isinstance(source_id, str):
            source_text_by_id[source_id] = source_path.read_text(encoding="utf-8")
        observed = sha256(source_path)
        if observed != source.get("sha256"):
            errors.append(
                f"source[{index}] digest drift for {relative_path}: "
                f"expected {source.get('sha256')}, observed {observed}"
            )

    nodes = nodes_doc.get("nodes", [])
    if not isinstance(nodes, list) or not nodes:
        errors.append("nodes.json must contain a non-empty nodes list")
        nodes = []
    node_ids = [node.get("id") for node in nodes if isinstance(node, dict)]
    node_id_strings = [item for item in node_ids if isinstance(item, str)]
    check_unique(node_id_strings, "node IDs", errors)
    node_id_set = set(node_id_strings)
    for index, node in enumerate(nodes):
        if not isinstance(node, dict):
            errors.append(f"node[{index}] must be an object")
            continue
        label = f"node {node.get('id', index)}"
        check_exact_keys(node, NODE_KEYS, label, errors)
        if node.get("role") not in ALLOWED_ROLES:
            errors.append(f"{label} has unsupported role {node.get('role')!r}")
        if node.get("authority_effect") != "none":
            errors.append(f"{label} exceeds the authority ceiling")
        check_source_refs(node.get("source_refs"), source_ids, label, errors)
        check_source_selectors(
            node.get("source_refs"), source_text_by_id, label, errors
        )

    thesis_id = profile.get("product_thesis_node_id")
    if thesis_id not in node_id_set:
        errors.append("profile product_thesis_node_id does not resolve")
    else:
        thesis = next(node for node in nodes if node.get("id") == thesis_id)
        if thesis.get("role") != "thesis":
            errors.append("profile product_thesis_node_id must reference a thesis node")

    vocabulary = relations_doc.get("relation_vocabulary", [])
    relations = relations_doc.get("relations", [])
    if not isinstance(vocabulary, list) or not vocabulary:
        errors.append("relations.json must contain relation_vocabulary")
        vocabulary = []
    relation_types = [item.get("id") for item in vocabulary if isinstance(item, dict)]
    relation_type_strings = [item for item in relation_types if isinstance(item, str)]
    check_unique(relation_type_strings, "relation vocabulary IDs", errors)
    relation_type_set = set(relation_type_strings)
    relation_ids = [item.get("id") for item in relations if isinstance(item, dict)]
    relation_id_strings = [item for item in relation_ids if isinstance(item, str)]
    check_unique(relation_id_strings, "relation IDs", errors)
    for index, relation in enumerate(relations):
        if not isinstance(relation, dict):
            errors.append(f"relation[{index}] must be an object")
            continue
        label = f"relation {relation.get('id', index)}"
        check_exact_keys(relation, RELATION_KEYS, label, errors)
        if relation.get("type") not in relation_type_set:
            errors.append(f"{label} uses unknown type {relation.get('type')!r}")
        if relation.get("source") not in node_id_set:
            errors.append(f"{label} has unknown source endpoint")
        if relation.get("target") not in node_id_set:
            errors.append(f"{label} has unknown target endpoint")
        if relation.get("authority_effect") != "none":
            errors.append(f"{label} exceeds the authority ceiling")
        check_source_refs(relation.get("source_refs"), source_ids, label, errors)
        check_source_selectors(
            relation.get("source_refs"), source_text_by_id, label, errors
        )

    required_language_sources = {
        "SRC-CAV2-GOVERNANCE-LANGUAGE",
        "SRC-CAV2-LANGUAGE-MEANING-BINDINGS",
        "SRC-CAV2-LANGUAGE-REALIZATION-BINDINGS",
        "SRC-CAV2-LANGUAGE-EDGE-VOCABULARY",
        "SRC-CAV2-LANGUAGE-AUTHORITY-BINDINGS",
    }
    missing_language_sources = sorted(required_language_sources - source_ids)
    if missing_language_sources:
        errors.append(
            "missing Language consultation sources: "
            + ", ".join(missing_language_sources)
        )
    required_language_nodes = {
        "CA2-CAP-RESOLVE-LANGUAGE-CONTEXT",
        "CA2-OUTPUT-LANGUAGE-CONTEXT-VIEW",
        "CA2-RULE-DEFINE-LANGUAGE-APPLICATION",
    }
    missing_language_nodes = sorted(required_language_nodes - node_id_set)
    if missing_language_nodes:
        errors.append(
            "missing Language consultation nodes: "
            + ", ".join(missing_language_nodes)
        )
    required_construction_nodes = {
        "CA2-FORM-GOVERNED-BASE",
        "CA2-RULE-DOMAINSPEC-GOVERNED-CONSTRUCTION",
    }
    missing_construction_nodes = sorted(required_construction_nodes - node_id_set)
    if missing_construction_nodes:
        errors.append(
            "missing DomainSpec construction nodes: "
            + ", ".join(missing_construction_nodes)
        )
    definition_pack = next(
        (item for item in nodes if item.get("id") == "CA2-OUTPUT-DEFINITION-PACK"),
        {},
    )
    definition_pack_claim = str(definition_pack.get("claim", ""))
    if not all(
        token in definition_pack_claim
        for token in (
            "Language Context View identity",
            "digest",
            "source epoch",
            "applied binding references",
        )
    ):
        errors.append("Definition Pack must preserve the consulted Language Context View binding")
    actual_edges = {
        (item.get("type"), item.get("source"), item.get("target"))
        for item in relations
        if isinstance(item, dict)
    }
    required_language_edges = {
        ("includes_capability", "CA2-PRODUCT-CYBERALCHEMY", "CA2-CAP-RESOLVE-LANGUAGE-CONTEXT"),
        ("produces", "CA2-CAP-RESOLVE-LANGUAGE-CONTEXT", "CA2-OUTPUT-LANGUAGE-CONTEXT-VIEW"),
        ("consumed_by", "CA2-OUTPUT-LANGUAGE-CONTEXT-VIEW", "CA2-CAP-DEFINE-SHARED-MEANING"),
        ("requires", "CA2-CAP-DEFINE-SHARED-MEANING", "CA2-RULE-DEFINE-LANGUAGE-APPLICATION"),
    }
    for relation_type, source, target in sorted(required_language_edges - actual_edges):
        errors.append(
            f"missing Language consultation edge: {relation_type} {source} -> {target}"
        )
    required_construction_edge = (
        "requires",
        "CA2-FORM-GOVERNED-BASE",
        "CA2-RULE-DOMAINSPEC-GOVERNED-CONSTRUCTION",
    )
    if required_construction_edge not in actual_edges:
        errors.append(
            "missing DomainSpec construction edge: requires "
            "CA2-FORM-GOVERNED-BASE -> CA2-RULE-DOMAINSPEC-GOVERNED-CONSTRUCTION"
        )

    residue = residue_doc.get("residue", [])
    if not isinstance(residue, list):
        errors.append("residue.json residue must be a list")
        residue = []
    residue_ids = [item.get("id") for item in residue if isinstance(item, dict)]
    residue_id_strings = [item for item in residue_ids if isinstance(item, str)]
    check_unique(residue_id_strings, "residue IDs", errors)
    for index, item in enumerate(residue):
        if not isinstance(item, dict):
            errors.append(f"residue[{index}] must be an object")
            continue
        label = f"residue {item.get('id', index)}"
        check_exact_keys(item, RESIDUE_KEYS, label, errors)
        for subject_ref in item.get("subject_refs", []):
            if subject_ref not in node_id_set:
                errors.append(f"{label} has unknown subject ref {subject_ref!r}")
        check_source_refs(item.get("source_refs"), source_ids, label, errors)
        check_source_selectors(
            item.get("source_refs"), source_text_by_id, label, errors
        )

    digest = material_digest(errors)
    status = "PASS" if not errors else "BLOCK"
    result = {
        "schema_version": "cav2-product-ontology-validation/v1",
        "status": status,
        "package_root": "cyberAlchemy-v2/ontology/product",
        "ontology_type": "business-domain",
        "branch": "business",
        "visibility": "private",
        "authority_effect": "none",
        "counts": {
            "sources": len(sources),
            "nodes": len(nodes),
            "relation_types": len(vocabulary),
            "relations": len(relations),
            "residue": len(residue),
        },
        "material_digest": digest,
        "errors": errors,
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if status == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
