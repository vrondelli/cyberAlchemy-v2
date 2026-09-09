#!/usr/bin/env python3
"""Validate the bounded Alch product/business Definition Pack without writes."""

from __future__ import annotations

import json
import hashlib
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent


def load(name: str) -> dict:
    return json.loads((ROOT / name).read_text(encoding="utf-8"))


def validate(root: Path = ROOT) -> dict:
    errors: list[str] = []
    def read_json(name: str) -> dict:
        return json.loads((root / name).read_text(encoding="utf-8"))

    pack = read_json("definition-pack.json")
    product = read_json("product-ontology.json")
    business = read_json("business-ontology.json")
    definitions = (root / "DEFINITIONS.md").read_text(encoding="utf-8")
    index = (root / "DEFINITIONS-INDEX.md").read_text(encoding="utf-8")
    source = (root / "alch-language-model.alch").read_text(encoding="utf-8")
    raw_source_digest = hashlib.sha256(source.encode("utf-8")).hexdigest()
    if pack.get("alch_source_sha256") != raw_source_digest:
        errors.append("Definition Pack Alch source digest drift")

    required = pack["required_definition_ids"]
    for definition_id in required:
        if len(re.findall(rf"^## {re.escape(definition_id)}\b", definitions, re.M)) != 1:
            errors.append(f"definition must occur once: {definition_id}")
        if len(re.findall(rf"^\| {re.escape(definition_id)} \|", index, re.M)) != 1:
            errors.append(f"index entry must occur once: {definition_id}")

    required_voices = ("**Normative.**", "**Formal.**", "**Operational.**", "**Plain language.**", "**Boundary.**")
    sections = re.split(r"(?=^## ALCH-D\d+\b)", definitions, flags=re.M)[1:]
    if len(sections) != len(required):
        errors.append("definition section count disagrees with required definitions")
    for section in sections:
        heading = section.splitlines()[0]
        for voice in required_voices:
            if voice not in section:
                errors.append(f"{heading} lacks {voice}")

    def validate_graph(document: dict, label: str) -> None:
        node_ids = [node["id"] for node in document["nodes"]]
        edge_ids = [edge["id"] for edge in document["relations"]]
        if len(node_ids) != len(set(node_ids)):
            errors.append(f"{label} node IDs are not unique")
        if len(edge_ids) != len(set(edge_ids)):
            errors.append(f"{label} relation IDs are not unique")
        known = set(node_ids)
        for edge in document["relations"]:
            if edge["source"] not in known or edge["target"] not in known:
                errors.append(f"{label} dangling relation: {edge['id']}")

    validate_graph(product, "product ontology")
    validate_graph(business, "business ontology")

    product_kinds = {node["kind"] for node in product["nodes"]}
    for kind in {"product", "product_capability", "product_interface", "user", "user_job", "input_contract", "product_output", "outcome", "constraint", "replaceable_realization"}:
        if kind not in product_kinds:
            errors.append(f"product ontology lacks kind: {kind}")

    business_nodes = {node["id"]: node for node in business["nodes"]}
    required_business_ids = {
        "b_language", "b_model", "b_owner", "b_term", "b_edge", "b_rule", "b_state", "b_transition", "b_event",
        "b_action", "b_permission", "b_example", "b_question", "b_boundary", "b_contract", "b_declaration",
        "b_entity", "b_value", "b_record", "b_enum", "b_rule_decl", "b_lifecycle", "b_event_decl",
        "b_action_decl", "b_permission_decl", "b_boundary_decl", "b_configuration", "b_query", "b_calculation",
        "b_mapping", "b_policy", "b_command", "b_projection", "b_route", "b_request", "b_normalization",
        "b_storage", "b_ui", "b_view", "b_compiler_capability", "b_compiler_binding"
    }
    missing = sorted(required_business_ids - set(business_nodes))
    if missing:
        errors.append(f"business ontology lacks nodes: {missing}")
    if business_nodes.get("b_record", {}).get("kind") != "data_shape_declaration":
        errors.append("record is not restricted to data-shape declaration")

    known_definition_ids = set(required)
    referenced_definition_ids = {
        node["definition_ref"]
        for document in (product, business)
        for node in document["nodes"]
        if "definition_ref" in node
    }
    unknown_definition_ids = sorted(referenced_definition_ids - known_definition_ids)
    if unknown_definition_ids:
        errors.append(f"ontology references unknown definitions: {unknown_definition_ids}")
    unreferenced_definition_ids = sorted(known_definition_ids - referenced_definition_ids)
    if unreferenced_definition_ids:
        errors.append(f"critical definitions are absent from ontology views: {unreferenced_definition_ids}")

    orthogonality = business.get("orthogonality", {})
    if len(orthogonality) != len(set(orthogonality.values())):
        errors.append("orthogonality maps different meanings to the same construct")
    if orthogonality.get("closed_data_shape") != "record":
        errors.append("closed data shape is not mapped to record")

    forbidden_product_kinds = {"record", "entity", "mapping", "policy"}
    if product_kinds & forbidden_product_kinds:
        errors.append("product ontology collapses product meaning into language declarations")

    if re.search(r"^record\b", source, re.M):
        errors.append("semantic-core Alch source wrongly models concepts as records")
    for declaration in ("enum SemanticDisposition:", "value-object SemanticIdentity:", "entity GovernedDomainDescription:", "rule RecordsAreDataShapesOnly:", "states GovernedDomainDescription:", "boundary domain-meaning-authority:", "permission accept-domain-meaning:", "action AcceptDomainMeaning:", "event DomainMeaningAccepted:"):
        if declaration not in source:
            errors.append(f"Alch semantic source lacks: {declaration}")

    if pack["completion_criteria"].get("user_facing_open_questions") != 0:
        errors.append("user-facing open questions must be zero")
    for document, label in ((pack, "definition pack"), (product, "product ontology"), (business, "business ontology")):
        if document.get("authority_effect") != "none":
            errors.append(f"{label} exceeds authority ceiling")

    generated = root / "generated"
    required_generated = {"domain.graph.json", "domain.machine.ts", "domain.types.ts", "manifest.json"}
    if generated.is_dir():
        absent = sorted(name for name in required_generated if not (generated / name).is_file())
        if absent:
            errors.append(f"compiled evidence incomplete: {absent}")
        else:
            manifest = json.loads((generated / "manifest.json").read_text(encoding="utf-8"))
            carrier = json.loads((generated / "domain.carrier.json").read_text(encoding="utf-8"))
            canonical_carrier = json.dumps(carrier, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
            carrier_digest = hashlib.sha256(canonical_carrier).hexdigest()
            if manifest.get("source_digest") != carrier_digest:
                errors.append("compiled manifest carrier digest drift")
            for name, expected in manifest.get("files", {}).items():
                path = generated / name
                actual = hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else None
                if actual != expected:
                    errors.append(f"compiled artifact digest drift: {name}")
    else:
        errors.append("compiled evidence directory is absent")

    return {
        "status": "PASS" if not errors else "FAIL",
        "definitions": len(required),
        "product_nodes": len(product["nodes"]),
        "product_relations": len(product["relations"]),
        "business_nodes": len(business["nodes"]),
        "business_relations": len(business["relations"]),
        "open_questions": 0,
        "errors": errors,
        "authority_effect": "none"
    }


def main() -> int:
    result = validate()
    print(json.dumps(result, indent=2))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
