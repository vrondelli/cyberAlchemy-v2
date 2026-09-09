#!/usr/bin/env python3
"""Check the private Knowledge Exchange Protocol model without writing state."""

from __future__ import annotations

import hashlib
import json
import argparse
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator, FormatChecker
from jsonschema.exceptions import SchemaError


PACKAGE_ROOT = Path(__file__).resolve().parent
REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
PRODUCT_THESIS_SCHEMA = REPOSITORY_ROOT / "cyberAlchemy-v2/product/schemas/product-thesis-record.schema.json"
CAPABILITY_SCHEMA = REPOSITORY_ROOT / "cyberAlchemy-v2/capability/schemas/capability.schema.json"
MATERIAL_FILES = (
    "IDENTITY-DECISION.json",
    "PRODUCT-THESIS.md",
    "README.md",
    "authority/definitions/DEFINITIONS.md",
    "authority/definitions/DEFINITIONS-INDEX.md",
    "business-ontology.json",
    "decisions/ontology-admission.json",
    "grant-encrypted-knowledge-coownership.product-capability.json",
    "product-thesis.record.json",
    "product-thesis.sources.json",
    "schema.json",
    "tests/test_validate.py",
    "validate.py",
)


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


def markdown_heading_bytes(path: Path, heading: str) -> bytes | None:
    text = path.read_text(encoding="utf-8")
    marker = f"{heading}\n"
    start = text.find(marker)
    if start < 0:
        return None
    end = text.find("\n## ", start + len(marker))
    selected = text[start:] if end < 0 else text[start:end + 1]
    return selected.encode("utf-8")


def validate_instance(instance: Any, schema: dict[str, Any], label: str, errors: list[str]) -> None:
    try:
        Draft202012Validator.check_schema(schema)
    except SchemaError as exc:
        errors.append(f"{label} schema invalid: {exc.message}")
        return
    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    for error in sorted(validator.iter_errors(instance), key=lambda item: list(item.absolute_path)):
        location = ".".join(str(part) for part in error.absolute_path) or "$"
        errors.append(f"{label} schema violation at {location}: {error.message}")


def root_ref_schema(schema: dict[str, Any], definition: str) -> dict[str, Any]:
    """Keep the root $defs available while selecting one validation entrypoint."""
    selected = dict(schema)
    selected.pop("$id", None)
    selected["$ref"] = f"#/$defs/{definition}"
    return selected


def material_digest(errors: list[str], include_admission: bool = True) -> str:
    digest = hashlib.sha256()
    for relative in sorted(MATERIAL_FILES):
        if relative == "decisions/ontology-admission.json" and not include_admission:
            continue
        path = PACKAGE_ROOT / relative
        if not path.is_file():
            errors.append(f"missing material file: {relative}")
            continue
        digest.update(relative.encode())
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def unique_ids(records: list[Any], field: str, label: str, errors: list[str]) -> set[str]:
    found: set[str] = set()
    for index, record in enumerate(records):
        if not isinstance(record, dict):
            continue
        value = record.get(field)
        if not isinstance(value, str):
            continue
        if value in found:
            errors.append(f"duplicate {label}: {value}")
        found.add(value)
    return found


def validate(require_admission: bool = True) -> dict[str, Any]:
    errors: list[str] = []
    local_schema = load(PACKAGE_ROOT / "schema.json", errors)
    identity = load(PACKAGE_ROOT / "IDENTITY-DECISION.json", errors)
    thesis = load(PACKAGE_ROOT / "product-thesis.record.json", errors)
    sources = load(PACKAGE_ROOT / "product-thesis.sources.json", errors)
    capability = load(PACKAGE_ROOT / "grant-encrypted-knowledge-coownership.product-capability.json", errors)
    ontology = load(PACKAGE_ROOT / "business-ontology.json", errors)
    admission = load(PACKAGE_ROOT / "decisions/ontology-admission.json", errors) if require_admission else {}
    thesis_schema = load(PRODUCT_THESIS_SCHEMA, errors)
    capability_schema = load(CAPABILITY_SCHEMA, errors)

    if local_schema:
        validate_instance(identity, root_ref_schema(local_schema, "identityDecision"), "identity decision", errors)
        validate_instance(sources, root_ref_schema(local_schema, "sourceRegistry"), "source registry", errors)
        validate_instance(ontology, root_ref_schema(local_schema, "businessOntology"), "business ontology", errors)
    if thesis_schema:
        validate_instance(thesis, thesis_schema, "product thesis", errors)
    if capability_schema:
        validate_instance(capability, root_ref_schema(capability_schema, "productCapability"), "product capability", errors)

    source_ids: set[str] = set()
    for source in sources.get("sources", []):
        if not isinstance(source, dict):
            continue
        source_id = source.get("id")
        if isinstance(source_id, str):
            if source_id in source_ids:
                errors.append(f"duplicate source id: {source_id}")
            source_ids.add(source_id)
        path = REPOSITORY_ROOT / str(source.get("path", ""))
        if not path.is_file():
            errors.append(f"missing source: {source.get('path')}")
        elif source.get("digest_scope") == "whole-file":
            if sha256(path) != source.get("sha256"):
                errors.append(f"source digest drift: {source_id}")
        elif source.get("digest_scope") == "markdown-heading":
            selected = markdown_heading_bytes(path, str(source.get("selector", "")))
            if selected is None:
                errors.append(f"source selector missing: {source_id}")
            elif hashlib.sha256(selected).hexdigest() != source.get("sha256"):
                errors.append(f"source selection digest drift: {source_id}")
        else:
            errors.append(f"unknown source digest scope: {source_id}")

    required_sources = {
        "SRC-KEP-DEFINITION-D63",
        "SRC-KEP-DEFINITION-D67",
        "SRC-KEP-PRODUCT-DEFINITIONS",
        "SRC-KEP-PARENT-PRODUCT-THESIS",
        "SRC-KEP-PARENT-PRODUCT-THESIS-RECORD",
        "SRC-KEP-PRODUCT-THESIS-SCHEMA",
        "SRC-KEP-PRODUCT-CAPABILITY-SCHEMA",
    }
    missing_sources = sorted(required_sources - source_ids)
    if missing_sources:
        errors.append(f"missing required sources: {', '.join(missing_sources)}")

    bindings = {
        "product": "CA2-PRODUCT-KNOWLEDGE-EXCHANGE-PROTOCOL",
        "thesis": "CA2-PRODUCT-THESIS-KNOWLEDGE-EXCHANGE-PROTOCOL",
        "project": "CA2-PROJECT-KNOWLEDGE-EXCHANGE-SOLANA-PROOF",
        "goal": "CA2-GOAL-KNOWLEDGE-EXCHANGE-ENCRYPTED-COOWNERSHIP",
        "capability": "CA2-CAP-GRANT-ENCRYPTED-KNOWLEDGE-COOWNERSHIP",
        "ontology": "CA2-ONTOLOGY-KNOWLEDGE-EXCHANGE-BUSINESS",
    }
    expected_pairs = (
        (identity.get("product_id"), bindings["product"], "identity product"),
        (identity.get("thesis_id"), bindings["thesis"], "identity thesis"),
        (identity.get("project_id"), bindings["project"], "identity project"),
        (identity.get("goal_id"), bindings["goal"], "identity goal"),
        (identity.get("capability_id"), bindings["capability"], "identity capability"),
        (thesis.get("product_ref"), bindings["product"], "thesis product"),
        (thesis.get("thesis_id"), bindings["thesis"], "thesis identity"),
        (capability.get("product_ref"), bindings["product"], "capability product"),
        (capability.get("capability_id"), bindings["capability"], "capability identity"),
        (capability.get("business_ontology_ref"), bindings["ontology"], "capability ontology"),
        (ontology.get("product_ref"), bindings["product"], "ontology product"),
        (ontology.get("capability_ref"), bindings["capability"], "ontology capability"),
    )
    for actual, expected, label in expected_pairs:
        if actual != expected:
            errors.append(f"{label} must be {expected}")

    nodes = ontology.get("nodes", [])
    relations = ontology.get("relations", [])
    residue = ontology.get("residue", [])
    node_ids = unique_ids(nodes, "id", "node id", errors)
    unique_ids(relations, "id", "relation id", errors)
    unique_ids(ontology.get("rules", []), "rule_id", "rule id", errors)
    unique_ids(ontology.get("proof_requirements", []), "proof_id", "proof id", errors)
    residue_ids = unique_ids(residue, "residue_id", "residue id", errors)
    selection_ids = unique_ids(ontology.get("source_selections", []), "selection_id", "selection id", errors)

    external_nodes = {"CA2-PRODUCT-CYBERALCHEMY"}
    for relation in relations:
        if not isinstance(relation, dict):
            continue
        for endpoint in ("source", "target"):
            value = relation.get(endpoint)
            if value not in node_ids | external_nodes:
                errors.append(f"dangling relation {relation.get('id')} {endpoint}: {value}")

    local_ref_fields = ("outcome_refs", "participant_refs", "consumer_refs", "input_contract_refs", "output_contract_refs", "context_policy_refs")
    for field in local_ref_fields:
        for value in capability.get(field, []):
            if value not in node_ids:
                errors.append(f"capability {field} has dangling ref: {value}")
    obligation_ref = capability.get("obligation_registry_ref")
    if obligation_ref not in node_ids:
        errors.append(f"capability obligation registry has dangling ref: {obligation_ref}")

    realization_refs = set(capability.get("realization_binding_refs", []))
    declared_bindings = {item.get("binding_ref") for item in residue if isinstance(item, dict) and item.get("binding_ref")}
    if not realization_refs <= declared_bindings:
        errors.append("future realization binding must remain declared as residue")

    evidence_refs = set(capability.get("evidence_refs", []))
    owner_source_refs = {
        ref
        for owner in capability.get("owner_routes", []) if isinstance(owner, dict)
        for ref in owner.get("source_refs", [])
    }
    unknown_selections = sorted((evidence_refs | owner_source_refs) - selection_ids)
    if unknown_selections:
        errors.append(f"capability has unknown source selections: {', '.join(unknown_selections)}")

    lifecycle_residue = set(capability.get("lifecycle_posture", {}).get("residue_refs", []))
    if not lifecycle_residue <= residue_ids:
        errors.append("capability lifecycle posture has dangling residue refs")
    if capability.get("lifecycle_posture", {}).get("status", {}).get("value") != "adopted":
        errors.append("admitted ontology requires an adopted predecessor capability status")
    if capability.get("lifecycle_posture", {}).get("commitment", {}).get("value") != "adopted":
        errors.append("admitted ontology requires an adopted predecessor capability commitment")

    definition_path = PACKAGE_ROOT / "authority/definitions/DEFINITIONS.md"
    expected_definition_ids = [f"KEP-D{index}" for index in range(1, 13)]
    definition_source = ontology.get("definition_source", {})
    if definition_source.get("path") != "cyberAlchemy-v2/product/knowledge-exchange-protocol/authority/definitions/DEFINITIONS.md":
        errors.append("ontology definition source path is not the product-local authority")
    if definition_source.get("sha256") != sha256(definition_path):
        errors.append("ontology definition source digest drift")
    if definition_source.get("definition_ids") != expected_definition_ids:
        errors.append("ontology definition source must select KEP-D1 through KEP-D12 exactly")
    definition_text = definition_path.read_text(encoding="utf-8")
    for definition_id in expected_definition_ids:
        if f"## {definition_id}:" not in definition_text:
            errors.append(f"selected product definition missing: {definition_id}")

    binding_records = ontology.get("definition_bindings", [])
    binding_ids = unique_ids(binding_records, "definition_id", "definition binding", errors)
    if binding_ids != set(expected_definition_ids):
        missing = sorted(set(expected_definition_ids) - binding_ids)
        extra = sorted(binding_ids - set(expected_definition_ids))
        errors.append(f"definition binding closure mismatch; missing={missing}, extra={extra}")
    ontology_ref_ids = node_ids | {
        item.get("rule_id") for item in ontology.get("rules", []) if isinstance(item, dict)
    } | {
        item.get("proof_id") for item in ontology.get("proof_requirements", []) if isinstance(item, dict)
    }
    for binding in binding_records:
        if not isinstance(binding, dict):
            continue
        for ontology_ref in binding.get("ontology_refs", []):
            if ontology_ref not in ontology_ref_ids:
                errors.append(f"definition binding has dangling ontology ref: {ontology_ref}")

    if "CA2-KEY-REISSUE" not in node_ids:
        errors.append("KEP-D11 requires a Key Reissue operation node separate from its request")
    required_relation_ids = {
        "KEP-REL-REISSUE-REQUEST-AUTHORIZES-OPERATION",
        "KEP-REL-REISSUE-REPLACES-ENVELOPE",
    }
    relation_ids = {item.get("id") for item in relations if isinstance(item, dict)}
    if not required_relation_ids <= relation_ids:
        errors.append("Key Reissue operation relations are incomplete")

    rules = {rule.get("rule_id"): rule for rule in ontology.get("rules", []) if isinstance(rule, dict)}
    required_rules = {
        "KEP-RULE-OWNER-SET-MONOTONIC-FIRST-PROOF",
        "KEP-RULE-NO-PUBLIC-SECRETS",
        "KEP-RULE-SEPARATE-KEY-ROLES",
        "KEP-RULE-REISSUE-PRESERVES-STATE",
        "KEP-RULE-COMPROMISE-NEW-EPOCH",
        "KEP-RULE-NO-PAYMENT-FIRST-PROOF",
    }
    missing_rules = sorted(required_rules - set(rules))
    if missing_rules:
        errors.append(f"missing required business rules: {', '.join(missing_rules)}")

    if any(item.get("evidence_state") != "not_evaluable" for item in ontology.get("proof_requirements", []) if isinstance(item, dict)):
        errors.append("model-only proof requirements must remain not_evaluable")

    construction = ontology.get("construction_state", {})
    expected_construction = {
        "canonical_definitions": "current",
        "product_capability": "adopted",
        "business_ontology": "admitted",
        "domainspec_v2_source": "blocked",
        "compiled_graph_and_system_ontology": "not_evaluable",
        "implementation_binding": "not_evaluable",
        "conformance_evidence": "not_evaluable",
    }
    if construction != expected_construction:
        errors.append("D65 construction state must stop at the admitted business ontology")

    if require_admission:
        preacceptance_errors: list[str] = []
        current_preacceptance_digest = material_digest(preacceptance_errors, include_admission=False)
        errors.extend(preacceptance_errors)
        preacceptance = admission.get("preacceptance", {})
        if preacceptance.get("runs") != 2 or preacceptance.get("outputs_identical") is not True:
            errors.append("admission decision must bind two identical preacceptance runs")
        if preacceptance.get("authority_effect") != "none":
            errors.append("preacceptance evidence must have no authority effect")
        if preacceptance.get("material_digest") != current_preacceptance_digest:
            errors.append("admission decision preacceptance material digest drift")
        if admission.get("schema_version") != "cav2-knowledge-exchange-ontology-admission/v1":
            errors.append("admission decision schema identity mismatch")
        if admission.get("decision_id") != "CA2-DECISION-KEP-ONTOLOGY-ADMISSION-001":
            errors.append("admission decision identity mismatch")
        if admission.get("source", {}).get("exact_user_decision") != "Do it":
            errors.append("admission decision does not preserve the exact owner direction")
        if admission.get("ontology_type") != "business-domain" or admission.get("branch") != "business":
            errors.append("admission decision ontology type or branch mismatch")
        supersedes = admission.get("supersedes", {})
        prior_decision_path = PACKAGE_ROOT / "decisions/model-acceptance.json"
        if supersedes.get("decision_id") != "CA2-DECISION-KEP-MODEL-ACCEPTANCE-001":
            errors.append("admission decision does not identify the superseded decision")
        if supersedes.get("path") != "decisions/model-acceptance.json" or supersedes.get("sha256") != sha256(prior_decision_path):
            errors.append("superseded decision digest mismatch")
        admitted_artifacts = admission.get("admitted_artifacts", {})
        expected_admitted_digests = {
            "definitions": ("authority/definitions/DEFINITIONS.md", sha256(definition_path)),
            "product_capability": ("grant-encrypted-knowledge-coownership.product-capability.json", sha256(PACKAGE_ROOT / "grant-encrypted-knowledge-coownership.product-capability.json")),
            "business_ontology": ("business-ontology.json", sha256(PACKAGE_ROOT / "business-ontology.json")),
            "schema": ("schema.json", sha256(PACKAGE_ROOT / "schema.json")),
            "source_registry": ("product-thesis.sources.json", sha256(PACKAGE_ROOT / "product-thesis.sources.json")),
        }
        for key, (path, digest_value) in expected_admitted_digests.items():
            record = admitted_artifacts.get(key, {})
            if record.get("path") != path or record.get("sha256") != digest_value:
                errors.append(f"admission decision {key} postimage digest mismatch")
        if admitted_artifacts.get("definitions", {}).get("selected_ids") != expected_definition_ids:
            errors.append("admission decision must select KEP-D1 through KEP-D12 exactly")
        expected_decisions = [
            "adopt-product-capability",
            "admit-business-ontology",
        ]
        if admission.get("ordered_decisions") != expected_decisions:
            errors.append("admission decision must preserve capability-before-ontology order")
        if admission.get("ontology_id") != bindings["ontology"]:
            errors.append("admission decision ontology identity mismatch")
        if admission.get("successor_authorization") != "none":
            errors.append("ontology admission must not authorize successor execution")
        if admission.get("enforcement_effect") != "none" or admission.get("external_effect") != "none":
            errors.append("ontology admission must remain non-enforcing and non-external")
        checks = {item.get("check_id"): item for item in admission.get("checks", []) if isinstance(item, dict)}
        required_admission_checks = {
            "definitions-current": "PASS",
            "capability-adopted": "PASS",
            "definition-binding-closure": "PASS",
            "relation-endpoint-closure": "PASS",
            "schema-validation": "PASS",
            "two-run-determinism": "PASS",
            "domainspec-admission": "not_evaluable",
            "implementation-conformance": "not_evaluable",
            "solana-realization": "not_evaluable",
        }
        for check_id, status in required_admission_checks.items():
            if checks.get(check_id, {}).get("status") != status:
                errors.append(f"admission decision check {check_id} must be {status}")
            if status == "not_evaluable" and not checks.get(check_id, {}).get("causal_blocker"):
                errors.append(f"admission decision check {check_id} must name a causal blocker")

    carrier = (PACKAGE_ROOT / "PRODUCT-THESIS.md").read_text(encoding="utf-8")
    for marker in (
        "Thesis ID: CA2-PRODUCT-THESIS-KNOWLEDGE-EXCHANGE-PROTOCOL",
        "Canonical definition: CAV2-D63",
        "## Product Identity",
        "## Project",
        "## Goal",
        "## Revision Criteria",
        "## Claim Ceiling",
        "owner set `{A}` to `{A, B}`",
    ):
        if marker not in carrier:
            errors.append(f"product thesis carrier missing marker: {marker}")

    digest = material_digest(errors, include_admission=require_admission)
    return {
        "schema_version": "cav2-knowledge-exchange-product-validation/v2",
        "status": "PASS" if not errors else "BLOCK",
        "package_root": "cyberAlchemy-v2/product/knowledge-exchange-protocol",
        "product_id": bindings["product"],
        "project_id": bindings["project"],
        "goal_id": bindings["goal"],
        "capability_id": bindings["capability"],
        "business_ontology_id": bindings["ontology"],
        "material_digest": digest,
        "counts": {
            "sources": len(source_ids),
            "nodes": len(node_ids),
            "relations": len(relations),
            "rules": len(rules),
            "proof_requirements": len(ontology.get("proof_requirements", [])),
            "residue": len(residue_ids),
        },
        "d65_last_evaluable_stage": "admitted capability-local business ontology" if require_admission else "proposed capability-local business ontology admission postimage",
        "authority_effect": "product-local capability adoption and business ontology admission only" if require_admission else "none",
        "claim_ceiling": "Adopted Product Capability and admitted product-local business ontology meaning only; no DomainSpec or system-ontology admission, implementation, conformance, cryptographic proof, Solana effect, publication, release, deployment, or external execution authority." if require_admission else "Preacceptance evidence for a proposed capability-adoption and ontology-admission postimage only; no authority, successor execution, or external effect.",
        "errors": errors,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--preacceptance", action="store_true")
    args = parser.parse_args()
    result = validate(require_admission=not args.preacceptance)
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
