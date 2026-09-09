#!/usr/bin/env python3
"""Validate the AlchLang semantic predecessor package without writing."""

from __future__ import annotations

import copy
import hashlib
import json
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = Path(__file__).resolve().parents[5]
SHARED_CAPABILITY_SCHEMA = REPOSITORY_ROOT / "cyberAlchemy-v2/capability/schemas/capability.schema.json"
MATERIAL_FILES = (
    "README.md",
    "author-intent.json",
    "profile.json",
    "sources.json",
    "definitions.json",
    "product-capability.json",
    "nodes.json",
    "relations.json",
    "reference-examples.json",
    "residue.json",
    "schemas/alchlang.schema.json",
    "scripts/validate.py",
    "tests/test_negative_mutations.py",
)


def canonical_json(value: Any) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sha256(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


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


def validate_definition(instance: dict[str, Any], schema: dict[str, Any], definition: str, label: str, errors: list[str]) -> None:
    local = {"$schema": "https://json-schema.org/draft/2020-12/schema", "$defs": schema.get("$defs", {}), "$ref": f"#/$defs/{definition}"}
    for violation in sorted(Draft202012Validator(local).iter_errors(instance), key=lambda item: list(item.path)):
        locator = ".".join(str(part) for part in violation.path)
        errors.append(f"{label}{'.' + locator if locator else ''}: {violation.message}")


def json_pointer(value: Any, pointer: str) -> Any:
    if pointer in {"", "/"}:
        return value
    current = value
    for raw in pointer.lstrip("/").split("/"):
        part = raw.replace("~1", "/").replace("~0", "~")
        current = current[int(part)] if isinstance(current, list) else current[part]
    return current


def selected_bytes(source: dict[str, Any], raw: bytes) -> bytes:
    kind = source["selector_kind"]
    selector = source["selector"]
    if kind == "markdown-heading":
        lines = raw.decode("utf-8").splitlines(keepends=True)
        starts = [index for index, line in enumerate(lines) if line.rstrip("\r\n") == selector]
        if len(starts) != 1:
            raise ValueError(f"heading resolves {len(starts)} times")
        start = starts[0]
        end = next((index for index in range(start + 1, len(lines)) if lines[index].startswith("## ")), len(lines))
        return "".join(lines[start:end]).encode("utf-8")
    parsed = json.loads(raw)
    if kind == "json-pointer":
        return canonical_json(json_pointer(parsed, selector))
    if kind == "json-record":
        collection = json_pointer(parsed, selector)
        matches = [item for item in collection if isinstance(item, dict) and item.get(source["id_field"]) == source["id_value"]]
        if len(matches) != 1:
            raise ValueError(f"record resolves {len(matches)} times")
        return canonical_json(matches[0])
    raise ValueError(f"unsupported selector kind: {kind!r}")


def material_digest(root: Path, errors: list[str]) -> str:
    digest = hashlib.sha256()
    for relative in sorted(MATERIAL_FILES):
        path = root / relative
        if not path.is_file():
            errors.append(f"missing material file: {relative}")
            continue
        digest.update(relative.encode("utf-8") + b"\0" + path.read_bytes() + b"\0")
    return digest.hexdigest()


def validate(package_root: Path = PACKAGE_ROOT, repository_root: Path = REPOSITORY_ROOT) -> dict[str, Any]:
    errors: list[str] = []
    schema = load(package_root / "schemas/alchlang.schema.json", errors)
    author_intent = load(package_root / "author-intent.json", errors)
    profile = load(package_root / "profile.json", errors)
    sources_doc = load(package_root / "sources.json", errors)
    definitions = load(package_root / "definitions.json", errors)
    product_capability = load(package_root / "product-capability.json", errors)
    nodes_doc = load(package_root / "nodes.json", errors)
    relations_doc = load(package_root / "relations.json", errors)
    reference_examples = load(package_root / "reference-examples.json", errors)
    residue_doc = load(package_root / "residue.json", errors)
    shared_schema = load(repository_root / "cyberAlchemy-v2/capability/schemas/capability.schema.json", errors)

    try:
        Draft202012Validator.check_schema(schema)
    except Exception as exc:
        errors.append(f"AlchLang schema is invalid: {exc}")
    for instance, definition, label in (
        (author_intent, "authorIntent", "author intent"),
        (profile, "profile", "profile"),
        (sources_doc, "sourceRegistry", "sources"),
        (definitions, "definitionRegistry", "definitions"),
        (nodes_doc, "nodeRegistry", "nodes"),
        (relations_doc, "relationRegistry", "relations"),
        (reference_examples, "referenceExampleRegistry", "reference examples"),
        (residue_doc, "residueRegistry", "residue"),
    ):
        validate_definition(instance, schema, definition, label, errors)

    localized_shared = copy.deepcopy(shared_schema)
    try:
        localized_shared["$defs"]["productCapability"]["properties"]["schema_ref"]["const"] = "../../../capability/schemas/capability.schema.json#/$defs/productCapability"
        validate_definition(product_capability, localized_shared, "productCapability", "product capability", errors)
    except (KeyError, TypeError) as exc:
        errors.append(f"shared Product Capability schema is unavailable: {exc}")

    source_ids: list[str] = []
    for source in sources_doc.get("sources", []):
        if not isinstance(source, dict):
            continue
        source_id = str(source.get("source_id"))
        source_ids.append(source_id)
        relative = Path(str(source.get("path", "")))
        if relative.is_absolute() or ".." in relative.parts or not str(relative).startswith("cyberAlchemy-v2/"):
            errors.append(f"unbounded source path: {relative}")
            continue
        path = repository_root / relative
        try:
            selected = selected_bytes(source, path.read_bytes())
        except (OSError, KeyError, IndexError, TypeError, ValueError, json.JSONDecodeError, UnicodeDecodeError) as exc:
            errors.append(f"source selection failed for {source_id}: {exc}")
            continue
        if sha256(selected) != source.get("selection_sha256"):
            errors.append(f"selected source digest drift: {source_id}")
    if len(source_ids) != len(set(source_ids)):
        errors.append("source IDs must be unique")
    known_sources = set(source_ids)

    required_reference_sources = {
        "CAP-SEL-ALCHLANG-REFERENCE-ACCEPTANCE",
        "CAP-SEL-ALCHLANG-REFERENCE-PRE-ACCEPTANCE-RECEIPT",
        "CAP-SEL-ALCHLANG-REFERENCE-BINDING-CREDIT",
        "CAP-SEL-ALCHLANG-REFERENCE-BINDING-INVENTORY",
        "CAP-SEL-ALCHLANG-REFERENCE-BINDING-ROLLBACK",
    }
    missing_reference_sources = sorted(required_reference_sources - known_sources)
    if missing_reference_sources:
        errors.append(f"reference-example sources are missing: {missing_reference_sources}")

    def check_refs(refs: Any, label: str) -> None:
        if not isinstance(refs, list) or not refs:
            errors.append(f"{label} lacks source refs")
            return
        unknown = sorted(set(map(str, refs)) - known_sources)
        if unknown:
            errors.append(f"{label} has unknown source refs: {unknown}")

    def package_ref_path(ref: Any, label: str, *, directory: bool = False) -> Path | None:
        relative = Path(str(ref or ""))
        if relative.is_absolute() or ".." in relative.parts or not relative.parts or relative.parts[0] != "plans":
            errors.append(f"{label} has unbounded package ref: {relative}")
            return None
        path = package_root / relative
        if directory and not path.is_dir():
            errors.append(f"{label} directory is missing: {relative}")
            return None
        if not directory and not path.is_file():
            errors.append(f"{label} file is missing: {relative}")
            return None
        return path

    def exact_artifact(record: Any, label: str) -> tuple[Path | None, dict[str, Any]]:
        if not isinstance(record, dict):
            errors.append(f"{label} must be an artifact record")
            return None, {}
        path = package_ref_path(record.get("ref"), label)
        value = load(path, errors) if path is not None else {}
        if path is not None and sha256(path.read_bytes()) != record.get("sha256"):
            errors.append(f"{label} digest drift")
        return path, value

    decision_path, decision = exact_artifact(reference_examples.get("decision"), "reference decision")
    reviewed_path, reviewed_receipt = exact_artifact(reference_examples.get("reviewed_receipt"), "reviewed pre-acceptance receipt")
    check_refs([reference_examples.get("decision", {}).get("source_ref")], "reference decision")
    check_refs([reference_examples.get("reviewed_receipt", {}).get("source_ref")], "reviewed pre-acceptance receipt")
    if decision.get("acceptance") != "accept-all-three-reference-verticals":
        errors.append("reference decision does not accept all three verticals")
    if decision.get("campaign_id") != reference_examples.get("campaign_id"):
        errors.append("reference decision campaign identity disagrees")
    if decision.get("authority_effect") != "none" or reference_examples.get("authority_effect") != "none":
        errors.append("reference integration exceeds authority ceiling")
    if decision.get("reviewed_receipt", {}).get("sha256") != reference_examples.get("reviewed_receipt", {}).get("sha256"):
        errors.append("decision and registry reviewed-receipt digests disagree")
    if reviewed_receipt.get("status") != "FLAG" or reviewed_receipt.get("checks", {}).get("independent_user_validation") != "not_evaluable":
        errors.append("reviewed receipt is not the frozen pre-acceptance state")

    definition_pack_path = package_root / "define/initial-language-terms/ALCHLANG-INITIAL-LANGUAGE-DEFINITION-PACK.v1-candidate.json"
    definition_pack_digest = sha256(definition_pack_path.read_bytes()) if definition_pack_path.is_file() else ""
    if not definition_pack_digest:
        errors.append("initial AlchLang definition pack is missing")

    decision_rows = {
        str(item.get("vertical_id")): item
        for item in decision.get("verticals", [])
        if isinstance(item, dict)
    }
    reviewed_rows = {
        str(item.get("vertical_id")): item
        for item in reviewed_receipt.get("verticals", [])
        if isinstance(item, dict)
    }
    examples = reference_examples.get("examples", [])
    example_ids = [str(item.get("vertical_id")) for item in examples if isinstance(item, dict)]
    required_example_ids = {"customer-credit-release", "inventory-reservation", "production-rollback"}
    if set(example_ids) != required_example_ids or len(example_ids) != 3:
        errors.append("reference registry must contain exactly the three accepted verticals")

    for example in examples:
        if not isinstance(example, dict):
            continue
        vertical_id = str(example.get("vertical_id"))
        label = f"reference example {vertical_id}"
        if example.get("authority_effect") != "none":
            errors.append(f"{label} exceeds authority ceiling")
        product_path, product = exact_artifact(example.get("product_capability"), f"{label} Product Capability")
        ontology_path, ontology = exact_artifact(example.get("business_ontology"), f"{label} business ontology")
        source_path, source = exact_artifact(example.get("alchlang_source"), f"{label} AlchLang source")
        graph_path, graph = exact_artifact(example.get("compiled_graph"), f"{label} compiled graph")
        system_path, system = exact_artifact(example.get("system_ontology"), f"{label} system ontology")
        receipt_path, generation = exact_artifact(example.get("generation_receipt"), f"{label} generation receipt")
        conformance_path, conformance = exact_artifact(example.get("accepted_conformance"), f"{label} accepted conformance")
        binding_path, binding = exact_artifact(example.get("accepted_construction_binding"), f"{label} accepted binding")
        check_refs([example.get("accepted_construction_binding", {}).get("source_ref")], f"{label} accepted binding")

        if source.get("domain_id") != vertical_id or generation.get("domain_id") != vertical_id or conformance.get("vertical_id") != vertical_id:
            errors.append(f"{label} identity closure failed")
        if product.get("capability_id") != source.get("capability_ref") or ontology.get("capability_ref") != source.get("capability_ref"):
            errors.append(f"{label} capability identity closure failed")
        if ontology.get("ontology_id") != source.get("business_ontology_ref"):
            errors.append(f"{label} business-ontology identity closure failed")
        if any(item.get("authority_effect") != "none" for item in (product, ontology, source, generation, conformance, binding)):
            errors.append(f"{label} transitive artifact exceeds authority ceiling")

        summary = example.get("ontology_summary", {})
        if summary.get("term_ids") != [item.get("id") for item in source.get("terms", [])]:
            errors.append(f"{label} ontology-term summary drift")
        if summary.get("edge_ids") != [item.get("id") for item in source.get("ontology_edges", [])]:
            errors.append(f"{label} ontology-edge summary drift")
        ontology_node_ids = {item.get("id") for item in ontology.get("nodes", []) if isinstance(item, dict)}
        ontology_relation_ids = {item.get("id") for item in ontology.get("relations", []) if isinstance(item, dict)}
        if not set(summary.get("term_ids", [])) <= ontology_node_ids:
            errors.append(f"{label} summarized terms do not resolve in business ontology")
        if not set(summary.get("edge_ids", [])) <= ontology_relation_ids:
            errors.append(f"{label} summarized edges do not resolve in business ontology")

        inputs = generation.get("inputs", {})
        expected_input_digests = {
            "product_capability_sha256": example.get("product_capability", {}).get("sha256"),
            "business_ontology_sha256": example.get("business_ontology", {}).get("sha256"),
            "alchlang_source_sha256": example.get("alchlang_source", {}).get("sha256"),
            "domainspec_source_manifest_sha256": example.get("domainspec_source", {}).get("manifest_sha256"),
        }
        if any(inputs.get(key) != value for key, value in expected_input_digests.items()):
            errors.append(f"{label} generation-input digest closure failed")
        if generation.get("compiled_graph_sha256") != example.get("compiled_graph", {}).get("sha256"):
            errors.append(f"{label} compiled-graph receipt closure failed")
        if generation.get("system_ontology_sha256") != example.get("system_ontology", {}).get("sha256"):
            errors.append(f"{label} system-ontology receipt closure failed")
        if generation.get("implementation_sha256") != example.get("implementation", {}).get("digest"):
            errors.append(f"{label} implementation receipt closure failed")
        if graph.get("source_manifest", {}).get("manifest_sha256") != example.get("domainspec_source", {}).get("manifest_sha256"):
            errors.append(f"{label} DomainSpec manifest closure failed")
        if system.get("source_graph_sha256") != example.get("compiled_graph", {}).get("sha256"):
            errors.append(f"{label} graph-to-system-ontology closure failed")

        implementation_path = package_ref_path(example.get("implementation", {}).get("ref"), f"{label} implementation", directory=True)
        output_digests = generation.get("outputs", {})
        if implementation_path is not None:
            for artifact_name, expected_digest in output_digests.items():
                artifact_path = implementation_path / artifact_name
                if not artifact_path.is_file() or sha256(artifact_path.read_bytes()) != expected_digest:
                    errors.append(f"{label} implementation artifact drift: {artifact_name}")
            implementation_digest = sha256("\n".join(
                f"{name}:{output_digests[name]}" for name in sorted(output_digests) if name.endswith(".ts")
            ).encode("utf-8"))
            if implementation_digest != example.get("implementation", {}).get("digest"):
                errors.append(f"{label} implementation aggregate digest drift")

        expected_binding = {
            "definitions": definition_pack_digest,
            "product_capability": example.get("product_capability", {}).get("sha256"),
            "business_ontology": example.get("business_ontology", {}).get("sha256"),
            "alchlang_source": example.get("alchlang_source", {}).get("sha256"),
            "domainspec_source": example.get("domainspec_source", {}).get("manifest_sha256"),
            "compiled_graph": example.get("compiled_graph", {}).get("sha256"),
            "system_ontology": example.get("system_ontology", {}).get("sha256"),
            "implementation": example.get("implementation", {}).get("digest"),
            "conformance": example.get("accepted_conformance", {}).get("sha256"),
        }
        actual_binding = {
            "definitions": binding.get("definitions", {}).get("digest"),
            "product_capability": binding.get("product_capability", {}).get("digest"),
            "business_ontology": binding.get("business_ontology", {}).get("digest"),
            "alchlang_source": binding.get("alchlang_source", {}).get("digest"),
            "domainspec_source": binding.get("domainspec_source", {}).get("manifest_digest"),
            "compiled_graph": binding.get("compiled_graph", {}).get("digest"),
            "system_ontology": binding.get("system_ontology", {}).get("digest"),
            "implementation": binding.get("implementation", {}).get("digest"),
            "conformance": binding.get("conformance", {}).get("digest"),
        }
        if actual_binding != expected_binding:
            errors.append(f"{label} D65 binding closure failed")

        decision_row = decision_rows.get(vertical_id, {})
        reviewed_row = reviewed_rows.get(vertical_id, {})
        accepted_binding_digest = example.get("accepted_construction_binding", {}).get("sha256")
        if decision_row.get("decision") != "accept" or decision_row.get("binding_sha256") != accepted_binding_digest:
            errors.append(f"{label} owner-decision closure failed")
        if reviewed_row.get("binding_sha256") != accepted_binding_digest:
            errors.append(f"{label} reviewed-receipt closure failed")

    campaign_path = package_root / "plans/three-vertical-compilation-campaign/CAMPAIGN.v1-candidate.json"
    authorization_path = package_root / "plans/three-vertical-compilation-campaign/execution/AUTHORIZATION.v1.json"
    campaign = load(campaign_path, errors)
    authorization = load(authorization_path, errors)
    if sha256(campaign_path.read_bytes()) != authorization.get("campaign_sha256"):
        errors.append("historical campaign authorization digest drift")
    predecessor_drift: set[str] = set()
    for predecessor in campaign.get("source_snapshot", []):
        relative = str(predecessor.get("path", ""))
        path = repository_root / relative
        if not path.is_file() or sha256(path.read_bytes()) != predecessor.get("sha256"):
            predecessor_drift.add(relative)
    expected_predecessor_drift = set(
        reference_examples.get("source_campaign_posture", {}).get("expected_superseded_predecessor_paths", [])
    )
    if predecessor_drift != expected_predecessor_drift:
        errors.append(
            "historical campaign predecessor drift differs from the declared integration boundary: "
            f"expected {sorted(expected_predecessor_drift)}, observed {sorted(predecessor_drift)}"
        )

    for binding in definitions.get("canonical_bindings", []):
        check_refs([binding.get("source_ref")], f"definition {binding.get('definition_ref')}")
    if {item.get("definition_ref") for item in definitions.get("canonical_bindings", [])} != {"CAV2-D65", "CAV2-D67"}:
        errors.append("canonical bindings must be exactly CAV2-D65 and CAV2-D67")
    for term in definitions.get("local_terms", []):
        check_refs(term.get("source_refs"), f"term {term.get('term_id')}")
        if term.get("authority_effect") != "none":
            errors.append(f"term exceeds authority ceiling: {term.get('term_id')}")

    node_by_id = {str(node.get("id")): node for node in nodes_doc.get("nodes", []) if isinstance(node, dict)}
    if len(node_by_id) != len(nodes_doc.get("nodes", [])):
        errors.append("node IDs must be unique")
    for node_id, node in node_by_id.items():
        check_refs(node.get("source_refs"), f"node {node_id}")
        if node.get("authority_effect") != "none":
            errors.append(f"node exceeds authority ceiling: {node_id}")

    required_node_refs = {
        product_capability.get("business_ontology_ref"),
        *product_capability.get("outcome_refs", []),
        *product_capability.get("participant_refs", []),
        *product_capability.get("consumer_refs", []),
        *product_capability.get("input_contract_refs", []),
        *product_capability.get("output_contract_refs", []),
        *product_capability.get("context_policy_refs", []),
    }
    missing_nodes = sorted(str(item) for item in required_node_refs if item not in node_by_id)
    if missing_nodes:
        errors.append(f"Product Capability refs do not resolve: {missing_nodes}")
    if product_capability.get("capability_id") != profile.get("product_capability_ref"):
        errors.append("profile and Product Capability identity disagree")
    if product_capability.get("product_ref") != profile.get("product_ref"):
        errors.append("profile and Product identity disagree")
    if product_capability.get("authority_effect") != "none":
        errors.append("Product Capability exceeds authority ceiling")
    if product_capability.get("lifecycle_posture", {}).get("commitment", {}).get("value") != "not-adopted-pending-digest-review":
        errors.append("Product Capability must remain not adopted pending digest review")
    check_refs(product_capability.get("evidence_refs"), "Product Capability evidence")
    for owner in product_capability.get("owner_routes", []):
        check_refs(owner.get("source_refs"), f"owner route {owner.get('responsibility')}")

    vocabulary = {str(item.get("type")): item for item in relations_doc.get("relation_vocabulary", []) if isinstance(item, dict)}
    relations = relations_doc.get("relations", [])
    relation_ids = [str(item.get("id")) for item in relations if isinstance(item, dict)]
    if len(relation_ids) != len(set(relation_ids)):
        errors.append("relation IDs must be unique")
    observed: set[tuple[str, str, str]] = set()
    for relation in relations:
        if not isinstance(relation, dict):
            continue
        label = f"relation {relation.get('id')}"
        source = str(relation.get("source"))
        target = str(relation.get("target"))
        relation_type = str(relation.get("type"))
        contract = vocabulary.get(relation_type)
        if source not in node_by_id or target not in node_by_id:
            errors.append(f"{label} has dangling endpoint")
        elif contract is None:
            errors.append(f"{label} has unknown type")
        else:
            if node_by_id[source].get("role") not in contract.get("source_roles", []):
                errors.append(f"{label} has invalid source role")
            if node_by_id[target].get("role") not in contract.get("target_roles", []):
                errors.append(f"{label} has invalid target role")
        check_refs(relation.get("source_refs"), label)
        if relation.get("authority_effect") != "none":
            errors.append(f"{label} exceeds authority ceiling")
        observed.add((relation_type, source, target))

    required_relations = {
        ("offers", "CA2-PRODUCT-CYBERALCHEMY", "B-ALCHLANG-MODEL-GOVERNED-DOMAINS"),
        ("accepts", "B-ALCHLANG-MODEL-GOVERNED-DOMAINS", "CA2-CAP-CONTRACT-ALCHLANG-DOMAIN-DESCRIPTION"),
        ("contains", "B-ALCHLANG-CONCEPT-GOVERNED-DOMAIN-DESCRIPTION", "B-ALCHLANG-CONCEPT-ONTOLOGY-TERM"),
        ("contains", "B-ALCHLANG-CONCEPT-GOVERNED-DOMAIN-DESCRIPTION", "B-ALCHLANG-CONCEPT-ONTOLOGY-EDGE"),
        ("contains", "B-ALCHLANG-CONCEPT-GOVERNED-DOMAIN-DESCRIPTION", "B-ALCHLANG-CONCEPT-DOMAIN-EXAMPLE"),
        ("constrains", "B-ALCHLANG-RULE-TERM-COVERAGE", "B-ALCHLANG-MODEL-GOVERNED-DOMAINS"),
        ("constrains", "B-ALCHLANG-RULE-EDGE-CLOSURE", "B-ALCHLANG-MODEL-GOVERNED-DOMAINS"),
        ("constrains", "B-ALCHLANG-RULE-AUTHORITY-PRESERVATION", "B-ALCHLANG-MODEL-GOVERNED-DOMAINS"),
        ("prepares", "CA2-CAP-CONTRACT-ALCHLANG-GOVERNED-DOMAIN-MODEL", "B-ALCHLANG-BOUNDARY-DOMAINSPEC-HANDOFF"),
    }
    missing_relations = sorted(required_relations - observed)
    if missing_relations:
        errors.append(f"required AlchLang relations are missing: {missing_relations}")

    residue_ids = {str(item.get("residue_id")) for item in residue_doc.get("residue", []) if isinstance(item, dict)}
    required_residue = {
        "CAP-RES-ALCHLANG-ADOPTION",
        "CAP-RES-ALCHLANG-LANGUAGE-PROJECT-INTEGRATION",
        "CAP-RES-ALCHLANG-BUSINESS-ONTOLOGY",
        "CAP-RES-ALCHLANG-DOMAINSPEC",
        "CAP-RES-ALCHLANG-SYSTEM-ONTOLOGY",
        "CAP-RES-ALCHLANG-REALIZATION",
        "CAP-RES-ALCHLANG-CONFORMANCE",
    }
    if residue_ids != required_residue:
        errors.append("D65 residue must enumerate adoption, ontology, DomainSpec, system ontology, realization, and conformance")
    for item in residue_doc.get("residue", []):
        check_refs(item.get("evidence_refs"), f"residue {item.get('residue_id')}")
        unknown_subjects = sorted(set(item.get("subject_refs", [])) - set(node_by_id))
        if unknown_subjects:
            errors.append(f"residue {item.get('residue_id')} has unknown subjects: {unknown_subjects}")
        if item.get("authority_effect") != "none":
            errors.append(f"residue exceeds authority ceiling: {item.get('residue_id')}")

    for forbidden in ("domainspec", "system-ontology", "implementation"):
        if (package_root / forbidden).exists():
            errors.append(f"semantic predecessor package must not contain {forbidden}")

    digest = material_digest(package_root, errors)
    return {
        "schema_version": "cav2-alchlang-validation/v1",
        "status": "PASS" if not errors else "BLOCK",
        "package_root": "cyberAlchemy-v2/language/capabilities/alchlang",
        "ontology_id": "cav2.alchlang.business",
        "ontology_type": "business-domain",
        "branch": "business",
        "authority_effect": "none",
        "material_digest": digest,
        "counts": {
            "sources": len(source_ids),
            "canonical_definitions": len(definitions.get("canonical_bindings", [])),
            "local_terms": len(definitions.get("local_terms", [])),
            "nodes": len(node_by_id),
            "relation_types": len(vocabulary),
            "relations": len(relations),
            "accepted_reference_examples": len(example_ids),
            "residue": len(residue_ids),
        },
        "construction": {
            "definitions": "validated-reference",
            "product_capability": "candidate-validated-shape",
            "business_ontology": "candidate-validated-package",
            "accepted_reference_verticals": "three-exact-D65-chains-validated",
            "domainspec_source": "reference-candidates-validated;canonical-absent",
            "compiled_graph": "reference-candidates-validated;canonical-not_evaluable",
            "system_ontology": "reference-candidates-validated;canonical-not_evaluable",
            "implementation_binding": "reference-candidates-owner-accepted;canonical-not_evaluable",
            "conformance": "reference-source-local-and-user-accepted;canonical-not_evaluable",
        },
        "claim_ceiling": "Current source-bound AlchLang Product Capability and business ontology candidate plus three exact owner-accepted reference D65 vertical candidates. No canonical capability or ontology admission, general compiler/runtime conformance, product proof, publication, release, deployment, or external effect.",
        "errors": errors,
    }


if __name__ == "__main__":
    result = validate()
    print(json.dumps(result, indent=2, ensure_ascii=False))
    raise SystemExit(0 if result["status"] == "PASS" else 1)
