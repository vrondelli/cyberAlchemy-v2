#!/usr/bin/env python3
"""Validate the Durable Storage business-ontology candidate without effects."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any


PACKAGE_ROOT = Path(__file__).resolve().parent
PRODUCT_ROOT = PACKAGE_ROOT.parents[2]
MATERIAL_FILES = (
    "README.md", "definition-bindings.json", "nodes.json", "premises.json", "profile.json",
    "proof-requirements.json", "relations.json", "residue.json", "rules.json", "schema.json", "sources.json",
)
EXPECTED_DEFINITION_IDS = {f"KEP-DST-D{index}" for index in range(1, 16)}
EXPECTED_SOURCE_IDS = {
    "SRC-KEP-DST-DEFINITIONS",
    "SRC-KEP-DST-DEFINITION-ACCEPTANCE",
    "SRC-KEP-DST-PRODUCT-CAPABILITY",
    "SRC-KEP-DST-PRODUCT-CAPABILITY-ADOPTION",
    "SRC-KEP-BASE-BUSINESS-ONTOLOGY",
}
EXPECTED_RULE_IDS = {
    "KEP-DST-RULE-IMMUTABLE-OBJECT",
    "KEP-DST-RULE-QUALIFIED-BYTE-IDENTITY",
    "KEP-DST-RULE-BINDING-POLICY-EXACT",
    "KEP-DST-RULE-LOCATOR-NOT-IDENTITY",
    "KEP-DST-RULE-WRITE-NOT-DURABILITY",
    "KEP-DST-RULE-VERIFY-BEFORE-DEPENDENT-USE",
    "KEP-DST-RULE-FAILURE-NO-SUCCESS",
    "KEP-DST-RULE-REISSUE-SEQUENCE",
    "KEP-DST-RULE-PROVIDER-NOT-OBJECT-IDENTITY",
    "KEP-DST-RULE-EVIDENCE-BOUNDED",
    "KEP-DST-RULE-COST-SEPARATION",
    "KEP-DST-RULE-NO-SECRET-MATERIAL",
    "KEP-DST-RULE-INSTANTIATION-COMPLETE",
}
EXPECTED_CONSTRUCTION_STATE = {
    "canonical_definitions": "accepted",
    "product_capability": "adopted",
    "business_ontology": "authored-candidate-awaiting-owner-admission",
    "domainspec_v2_source": "not_evaluable",
    "compiled_graph_and_system_ontology": "not_evaluable",
    "implementation_binding": "not_evaluable",
    "conformance_evidence": "not_evaluable",
    "runtime_evidence": "not_evaluable",
}


def configure(package_root: Path, product_root: Path | None = None) -> None:
    global PACKAGE_ROOT, PRODUCT_ROOT
    PACKAGE_ROOT = package_root.resolve()
    PRODUCT_ROOT = (product_root or PACKAGE_ROOT.parents[2]).resolve()


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(relative: str, errors: list[str]) -> dict[str, Any]:
    path = PACKAGE_ROOT / relative
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"cannot load {relative}: {exc}")
        return {}
    if not isinstance(value, dict):
        errors.append(f"{relative} must contain one object")
        return {}
    return value


def unique(records: list[Any], key: str, label: str, errors: list[str]) -> set[str]:
    result: set[str] = set()
    for record in records:
        if not isinstance(record, dict) or not isinstance(record.get(key), str):
            errors.append(f"{label} must contain objects with string {key}")
            continue
        value = record[key]
        if value in result:
            errors.append(f"duplicate {label}: {value}")
        result.add(value)
    return result


def resolve_product_path(relative: Any, errors: list[str], label: str) -> Path | None:
    if not isinstance(relative, str) or not relative or Path(relative).is_absolute() or ".." in Path(relative).parts:
        errors.append(f"{label} path must be safe and product-relative")
        return None
    path = (PRODUCT_ROOT / relative).resolve()
    try:
        path.relative_to(PRODUCT_ROOT)
    except ValueError:
        errors.append(f"{label} path escapes product root")
        return None
    if not path.is_file():
        errors.append(f"{label} source missing: {relative}")
        return None
    return path


def material_digest(errors: list[str]) -> str:
    digest = hashlib.sha256()
    for relative in sorted(MATERIAL_FILES):
        path = PACKAGE_ROOT / relative
        if not path.is_file():
            errors.append(f"missing ontology material: {relative}")
            continue
        digest.update(relative.encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def validate(package_root: Path = PACKAGE_ROOT, product_root: Path = PRODUCT_ROOT) -> dict[str, Any]:
    configure(package_root, product_root)
    errors: list[str] = []
    profile = load("profile.json", errors)
    sources = load("sources.json", errors)
    bindings = load("definition-bindings.json", errors)
    nodes = load("nodes.json", errors)
    relations = load("relations.json", errors)
    rules = load("rules.json", errors)
    premises = load("premises.json", errors)
    proofs = load("proof-requirements.json", errors)
    residue = load("residue.json", errors)
    receipts = load("receipts/index.json", errors)
    candidate = load("candidate.json", errors)

    if profile.get("ontology_id") != "CA2-ONTOLOGY-KEP-DURABLE-STORAGE":
        errors.append("ontology identity drift")
    if profile.get("ontology_type") != "business-domain" or profile.get("branch") != "business":
        errors.append("ontology type or branch drift")
    if profile.get("lifecycle_status") != "authored-candidate":
        errors.append("business ontology must remain an authored candidate")
    if profile.get("construction_state") != EXPECTED_CONSTRUCTION_STATE:
        errors.append("D65 business-ontology construction state drift")
    if any(profile.get(field) != "none" for field in ("authority_effect", "enforcement_effect", "external_effect")):
        errors.append("ontology profile exceeds its effect ceiling")

    source_records = sources.get("sources", [])
    source_ids = unique(source_records, "source_id", "source", errors)
    if source_ids != EXPECTED_SOURCE_IDS:
        errors.append("source identity closure drift")
    for source in source_records:
        if not isinstance(source, dict):
            continue
        path = resolve_product_path(source.get("path"), errors, str(source.get("source_id")))
        if path and source.get("sha256") != sha256(path):
            errors.append(f"source digest drift: {source.get('source_id')}")
        if not source.get("selectors"):
            errors.append(f"source has no selectors: {source.get('source_id')}")

    node_records = nodes.get("nodes", [])
    relation_records = relations.get("relations", [])
    rule_records = rules.get("rules", [])
    premise_records = premises.get("premises", [])
    proof_records = proofs.get("proof_requirements", [])
    residue_records = residue.get("residue", [])
    binding_records = bindings.get("bindings", [])
    node_ids = unique(node_records, "id", "node", errors)
    relation_ids = unique(relation_records, "id", "relation", errors)
    rule_ids = unique(rule_records, "rule_id", "rule", errors)
    premise_ids = unique(premise_records, "premise_id", "premise", errors)
    proof_ids = unique(proof_records, "proof_id", "proof", errors)
    unique(residue_records, "residue_id", "residue", errors)
    if rule_ids != EXPECTED_RULE_IDS:
        errors.append("required rule closure drift")
    if unique(binding_records, "definition_id", "definition binding", errors) != EXPECTED_DEFINITION_IDS:
        errors.append("definition-binding closure drift")
    ontology_refs = node_ids | relation_ids | rule_ids | premise_ids | proof_ids
    for binding in binding_records:
        if not isinstance(binding, dict):
            continue
        if binding.get("source_id") != "SRC-KEP-DST-DEFINITIONS" or binding.get("selector") != binding.get("definition_id"):
            errors.append(f"definition binding source or selector drift: {binding.get('definition_id')}")
        for ref in binding.get("ontology_refs", []):
            if ref not in ontology_refs:
                errors.append(f"definition binding has dangling ontology ref: {ref}")
    for relation in relation_records:
        if not isinstance(relation, dict):
            continue
        if relation.get("source") not in node_ids:
            errors.append(f"dangling relation source: {relation.get('id')}")
        if relation.get("target") not in node_ids:
            errors.append(f"dangling relation target: {relation.get('id')}")
    required_roles = {
        "product_capability", "actor", "stored_object", "value_identity", "binding", "locator",
        "stored_envelope", "write_evidence", "retrieval_evidence", "policy", "failure", "workflow",
        "realization_identity", "evidence", "infrastructure_cost", "confidentiality_boundary",
        "capability_instantiation", "contract", "context_policy", "obligation_registry", "outcome",
    }
    observed_roles = {record.get("role") for record in node_records if isinstance(record, dict)}
    if not required_roles <= observed_roles:
        errors.append(f"required business-role closure drift: {sorted(required_roles - observed_roles)}")
    for records, label in (
        (node_records, "node"), (relation_records, "relation"), (rule_records, "rule"),
        (premise_records, "premise"), (proof_records, "proof"), (residue_records, "residue"),
    ):
        for record in records:
            if not isinstance(record, dict):
                continue
            for source_ref in record.get("source_refs", []):
                if source_ref not in source_ids:
                    errors.append(f"{label} has unknown source ref: {source_ref}")
    if any(record.get("evidence_state") != "not_evaluable" for record in proof_records if isinstance(record, dict)):
        errors.append("candidate proofs must remain not_evaluable")
    if any(record.get("commitment_confidence") != "working-candidate" for record in premise_records if isinstance(record, dict)):
        errors.append("premises must remain working candidates")
    if receipts.get("append_only") is not True:
        errors.append("receipt registry must remain append-only")

    digest = material_digest(errors)
    if candidate.get("candidate_id") != "CA2-CANDIDATE-KEP-DURABLE-STORAGE-BUSINESS-ONTOLOGY-001":
        errors.append("ontology candidate identity drift")
    if candidate.get("ontology_id") != profile.get("ontology_id") or candidate.get("lifecycle_status") != "authored-candidate":
        errors.append("ontology candidate subject or lifecycle drift")
    if candidate.get("material_digest") != digest:
        errors.append("ontology candidate material digest drift")
    artifact_records = candidate.get("artifacts", [])
    if {item.get("path") for item in artifact_records if isinstance(item, dict)} != set(MATERIAL_FILES):
        errors.append("ontology candidate artifact closure drift")
    for artifact in artifact_records:
        if not isinstance(artifact, dict) or artifact.get("path") not in MATERIAL_FILES:
            continue
        path = PACKAGE_ROOT / artifact["path"]
        if artifact.get("sha256") != sha256(path):
            errors.append(f"ontology candidate artifact digest drift: {artifact.get('path')}")
    expected_counts = {
        "sources": len(source_records), "definition_bindings": len(binding_records),
        "nodes": len(node_records), "relations": len(relation_records), "rules": len(rule_records),
        "premises": len(premise_records), "proof_requirements": len(proof_records), "residue": len(residue_records),
    }
    if candidate.get("counts") != expected_counts:
        errors.append("ontology candidate count closure drift")
    predecessor = candidate.get("predecessor", {})
    if predecessor.get("sha256") != "5a8a4a3b7629cf9955af4173ed339451541262ead61d46a1a74ac8adb2063f84":
        errors.append("ontology candidate predecessor drift")
    if any(candidate.get(field) != "none" for field in ("successor_authorization", "enforcement_effect", "external_effect", "authority_effect")):
        errors.append("ontology candidate exceeds effect ceiling")

    return {
        "schema_version": "cav2-kep-durable-storage-business-ontology-validation/v1",
        "status": "PASS" if not errors else "BLOCK",
        "ontology_id": profile.get("ontology_id"),
        "material_digest": digest,
        "counts": expected_counts,
        "d65_last_evaluable_stage": "authored business ontology candidate",
        "authority_effect": "none",
        "external_effect": "none",
        "errors": errors,
    }


def main() -> int:
    result = validate()
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
