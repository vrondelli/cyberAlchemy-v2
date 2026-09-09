#!/usr/bin/env python3
"""Deterministically validate the no-price Solana business ontology candidate."""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator, FormatChecker
from jsonschema.exceptions import SchemaError


EXPECTED_DEFINITION_IDS = tuple(f"KEP-SOL-D{index}" for index in range(1, 11))
EXPECTED_CAPABILITY_DIGEST = "42ac5b6908f21635ca9938c5b0810f0ec2b7fa004790aa20a6b0bab822f38536"
EXPECTED_ADOPTION_DIGEST = "24e6f9959f71a0ecebcd4e776755be59654da9a9d76cde6b04ba462854fa1a49"
EXPECTED_USER_DECISION = "adopt and implement solona business ontology"
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
EXPECTED_SOURCE_IDS = {
    "SRC-KEP-SOL-DEFINITIONS",
    "SRC-KEP-SOL-DEFINITION-ACCEPTANCE",
    "SRC-KEP-SOL-PRODUCT-CAPABILITY",
    "SRC-KEP-SOL-PRODUCT-CAPABILITY-ADOPTION",
    "SRC-KEP-BASE-BUSINESS-ONTOLOGY",
    "SRC-KEP-BASE-ONTOLOGY-ADMISSION",
}
EXPECTED_REQUIRED_RULES = {
    "KEP-SOL-RULE-SIGNER-IDENTITY-NONCOLLAPSE",
    "KEP-SOL-RULE-ACCOUNT-AGGREGATE-BOUNDED",
    "KEP-SOL-RULE-PRESERVE-ORIGINATOR",
    "KEP-SOL-RULE-ENVELOPE-COMMITMENT-NO-SECRET",
    "KEP-SOL-RULE-SUBMISSION-NOT-SUCCESS",
    "KEP-SOL-RULE-ATOMIC-GRANT",
    "KEP-SOL-RULE-REPLAY-ONCE",
    "KEP-SOL-RULE-EVIDENCE-ENVIRONMENT-BOUNDED",
    "KEP-SOL-RULE-NO-PRICE-SEPARATES-NETWORK-COST",
    "KEP-SOL-RULE-PROGRAM-IDENTITY-EXACT",
    "KEP-SOL-RULE-POLICY-AND-REVISION-EXACT",
    "KEP-SOL-RULE-FAILURE-PRESERVES-STATE",
}
MATERIAL_FILES = (
    "README.md",
    "definition-bindings.json",
    "nodes.json",
    "premises.json",
    "profile.json",
    "proof-requirements.json",
    "relations.json",
    "residue.json",
    "rules.json",
    "schema.json",
    "sources.json",
)


def configure(package_root: Path, product_root: Path | None = None) -> None:
    global PACKAGE_ROOT, PRODUCT_ROOT, SCHEMA_PATH, PROFILE_PATH, SOURCES_PATH, CANDIDATE_PATH
    global BINDINGS_PATH, NODES_PATH, RELATIONS_PATH, RULES_PATH, PREMISES_PATH
    global PROOFS_PATH, RESIDUE_PATH, RECEIPTS_PATH, CAPABILITY_PATH, ADOPTION_PATH

    PACKAGE_ROOT = package_root.resolve()
    PRODUCT_ROOT = (product_root or PACKAGE_ROOT.parents[2]).resolve()
    SCHEMA_PATH = PACKAGE_ROOT / "schema.json"
    PROFILE_PATH = PACKAGE_ROOT / "profile.json"
    CANDIDATE_PATH = PACKAGE_ROOT / "candidate.json"
    SOURCES_PATH = PACKAGE_ROOT / "sources.json"
    BINDINGS_PATH = PACKAGE_ROOT / "definition-bindings.json"
    NODES_PATH = PACKAGE_ROOT / "nodes.json"
    RELATIONS_PATH = PACKAGE_ROOT / "relations.json"
    RULES_PATH = PACKAGE_ROOT / "rules.json"
    PREMISES_PATH = PACKAGE_ROOT / "premises.json"
    PROOFS_PATH = PACKAGE_ROOT / "proof-requirements.json"
    RESIDUE_PATH = PACKAGE_ROOT / "residue.json"
    RECEIPTS_PATH = PACKAGE_ROOT / "receipts/index.json"
    CAPABILITY_PATH = PRODUCT_ROOT / "realize-no-price-solana-coownership.product-capability.json"
    ADOPTION_PATH = PRODUCT_ROOT / "capabilities/solana-coownership/decisions/product-capability-adoption-001.json"


configure(Path(__file__).resolve().parent)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path: Path, errors: list[str]) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"cannot load {path}: {exc}")
        return {}
    if not isinstance(value, dict):
        errors.append(f"{path} must contain one object")
        return {}
    return value


def root_ref_schema(schema: dict[str, Any], definition: str) -> dict[str, Any]:
    selected = dict(schema)
    selected.pop("$id", None)
    selected["$ref"] = f"#/$defs/{definition}"
    return selected


def validate_instance(instance: Any, schema: dict[str, Any], definition: str, label: str, errors: list[str]) -> None:
    selected = root_ref_schema(schema, definition)
    try:
        Draft202012Validator.check_schema(selected)
    except SchemaError as exc:
        errors.append(f"{label} schema invalid: {exc.message}")
        return
    validator = Draft202012Validator(selected, format_checker=FormatChecker())
    for error in sorted(validator.iter_errors(instance), key=lambda item: list(item.absolute_path)):
        location = ".".join(str(part) for part in error.absolute_path) or "$"
        errors.append(f"{label} schema violation at {location}: {error.message}")


def unique_ids(records: list[Any], field: str, label: str, errors: list[str]) -> set[str]:
    found: set[str] = set()
    for record in records:
        if not isinstance(record, dict):
            continue
        value = record.get(field)
        if not isinstance(value, str):
            continue
        if value in found:
            errors.append(f"duplicate {label}: {value}")
        found.add(value)
    return found


def safe_product_path(relative: Any, errors: list[str], label: str) -> Path | None:
    if not isinstance(relative, str) or not relative or relative.startswith("/") or ".." in Path(relative).parts:
        errors.append(f"{label} path must be safe and product-relative")
        return None
    path = (PRODUCT_ROOT / relative).resolve()
    try:
        path.relative_to(PRODUCT_ROOT)
    except ValueError:
        errors.append(f"{label} path escapes the product root")
        return None
    if not path.is_file():
        errors.append(f"{label} source is missing: {relative}")
        return None
    return path


def definition_heading_bytes(path: Path, selector: str) -> bytes | None:
    definition_id = selector.removeprefix("## ").removesuffix(":")
    text = path.read_text(encoding="utf-8")
    matches = list(re.finditer(r"^## (KEP-SOL-D\d+): .+$", text, flags=re.MULTILINE))
    for index, match in enumerate(matches):
        if match.group(1) != definition_id:
            continue
        end = matches[index + 1].start() if index + 1 < len(matches) else text.find("\n## Candidate Claim Ceiling", match.end())
        if end < 0:
            end = len(text)
        return text[match.start():end].encode("utf-8")
    return None


def check_source_refs(records: list[Any], selection_ids: set[str], label: str, errors: list[str]) -> None:
    for record in records:
        if not isinstance(record, dict):
            continue
        for source_ref in record.get("source_refs", []):
            if source_ref not in selection_ids:
                errors.append(f"{label} has unknown source ref: {source_ref}")


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


def validate() -> dict[str, Any]:
    errors: list[str] = []
    schema = load(SCHEMA_PATH, errors)
    profile = load(PROFILE_PATH, errors)
    sources = load(SOURCES_PATH, errors)
    bindings = load(BINDINGS_PATH, errors)
    nodes = load(NODES_PATH, errors)
    relations = load(RELATIONS_PATH, errors)
    rules = load(RULES_PATH, errors)
    premises = load(PREMISES_PATH, errors)
    proofs = load(PROOFS_PATH, errors)
    residue = load(RESIDUE_PATH, errors)
    receipts = load(RECEIPTS_PATH, errors)
    candidate = load(CANDIDATE_PATH, errors)
    capability = load(CAPABILITY_PATH, errors)
    adoption = load(ADOPTION_PATH, errors)

    if schema:
        for instance, definition, label in (
            (profile, "profile", "profile"),
            (sources, "sourceRegistry", "source registry"),
            (bindings, "definitionBindingRegistry", "definition-binding registry"),
            (nodes, "nodeRegistry", "node registry"),
            (relations, "relationRegistry", "relation registry"),
            (rules, "ruleRegistry", "rule registry"),
            (premises, "premiseRegistry", "premise registry"),
            (proofs, "proofRegistry", "proof registry"),
            (residue, "residueRegistry", "residue registry"),
            (receipts, "receiptRegistry", "receipt registry"),
        ):
            validate_instance(instance, schema, definition, label, errors)

    if profile.get("ontology_id") != "CA2-ONTOLOGY-KEP-SOLANA-COOWNERSHIP":
        errors.append("ontology identity drift")
    if profile.get("ontology_type") != "business-domain" or profile.get("branch") != "business":
        errors.append("ontology type or branch drift")
    selection = profile.get("ontology_type_selection", {})
    if selection.get("source") != "inferred" or selection.get("confidence") != "high":
        errors.append("ontology type selection evidence drift")
    if profile.get("materialization") != "package-required" or profile.get("visibility") != "private":
        errors.append("ontology package materialization or visibility drift")
    if profile.get("lifecycle_status") != "authored-candidate":
        errors.append("business ontology must remain an authored candidate")
    if profile.get("construction_state") != EXPECTED_CONSTRUCTION_STATE:
        errors.append("D65 construction state must stop at the authored business ontology candidate")
    if profile.get("authority_effect") != "none" or profile.get("enforcement_effect") != "none" or profile.get("external_effect") != "none":
        errors.append("ontology profile exceeds its authority ceiling")

    source_records = sources.get("sources", [])
    source_ids = unique_ids(source_records, "source_id", "source id", errors)
    if source_ids != EXPECTED_SOURCE_IDS:
        errors.append(f"source identity closure drift: {sorted(source_ids)}")
    source_paths: dict[str, Path] = {}
    for record in source_records:
        if not isinstance(record, dict):
            continue
        source_id = record.get("source_id")
        path = safe_product_path(record.get("path"), errors, str(source_id))
        if path is None or not isinstance(source_id, str):
            continue
        source_paths[source_id] = path
        if record.get("sha256") != sha256(path):
            errors.append(f"source digest drift: {source_id}")

    selection_records = sources.get("selections", [])
    selection_ids = unique_ids(selection_records, "selection_id", "selection id", errors)
    expected_definition_selections = {f"KEP-SOL-SEL-D{index}" for index in range(1, 11)}
    if not expected_definition_selections <= selection_ids:
        errors.append("definition source-selection closure drift")
    for record in selection_records:
        if not isinstance(record, dict):
            continue
        source_id = record.get("source_id")
        path = source_paths.get(str(source_id))
        if path is None:
            errors.append(f"selection references unknown source: {source_id}")
            continue
        if record.get("selector_kind") == "whole-file":
            selected_digest = sha256(path)
        elif record.get("selector_kind") == "markdown-heading" and isinstance(record.get("selector"), str):
            selected = definition_heading_bytes(path, record["selector"])
            if selected is None:
                errors.append(f"selection heading missing: {record.get('selection_id')}")
                continue
            selected_digest = hashlib.sha256(selected).hexdigest()
        else:
            errors.append(f"unsupported selection: {record.get('selection_id')}")
            continue
        if record.get("selection_sha256") != selected_digest:
            errors.append(f"source selection digest drift: {record.get('selection_id')}")

    if sha256(CAPABILITY_PATH) != EXPECTED_CAPABILITY_DIGEST:
        errors.append("adopted Product Capability source digest drift")
    if sha256(ADOPTION_PATH) != EXPECTED_ADOPTION_DIGEST:
        errors.append("Product Capability adoption decision digest drift")
    if capability.get("capability_id") != profile.get("capability_ref"):
        errors.append("ontology-to-capability identity drift")
    if capability.get("business_ontology_ref") != profile.get("ontology_id"):
        errors.append("capability-to-ontology identity drift")
    if adoption.get("source", {}).get("exact_user_decision") != EXPECTED_USER_DECISION:
        errors.append("capability adoption does not preserve the exact owner decision")
    subject = adoption.get("subject", {})
    if subject.get("capability_id") != profile.get("capability_ref") or subject.get("sha256") != EXPECTED_CAPABILITY_DIGEST:
        errors.append("capability adoption subject drift")
    if adoption.get("adoption", {}).get("lifecycle_status") != "adopted":
        errors.append("Product Capability is not owner-adopted")
    if adoption.get("adoption", {}).get("adopted_capability_sha256") != EXPECTED_CAPABILITY_DIGEST:
        errors.append("Product Capability adoption postimage drift")
    successor = adoption.get("successor_authorization", {})
    if successor.get("business_ontology_authorship") != "authorized-candidate-only":
        errors.append("business-ontology authorship authorization drift")
    for forbidden in ("business_ontology_admission", "domainspec_v2", "system_ontology", "implementation"):
        if successor.get(forbidden) != "not-authorized":
            errors.append(f"capability adoption over-authorizes {forbidden}")
    if adoption.get("enforcement_effect") != "none" or adoption.get("external_effect") != "none":
        errors.append("capability adoption claims an enforcement or external effect")

    node_records = nodes.get("nodes", [])
    relation_records = relations.get("relations", [])
    rule_records = rules.get("rules", [])
    premise_records = premises.get("premises", [])
    proof_records = proofs.get("proof_requirements", [])
    residue_records = residue.get("residue", [])
    binding_records = bindings.get("bindings", [])
    node_ids = unique_ids(node_records, "id", "node id", errors)
    relation_ids = unique_ids(relation_records, "id", "relation id", errors)
    rule_ids = unique_ids(rule_records, "rule_id", "rule id", errors)
    premise_ids = unique_ids(premise_records, "premise_id", "premise id", errors)
    proof_ids = unique_ids(proof_records, "proof_id", "proof id", errors)
    unique_ids(residue_records, "residue_id", "residue id", errors)
    for relation in relation_records:
        if not isinstance(relation, dict):
            continue
        if relation.get("source") not in node_ids:
            errors.append(f"dangling relation source: {relation.get('id')}")
        if relation.get("target") not in node_ids:
            errors.append(f"dangling relation target: {relation.get('id')}")

    binding_ids = unique_ids(binding_records, "definition_id", "definition binding", errors)
    if binding_ids != set(EXPECTED_DEFINITION_IDS):
        errors.append("definition-binding ID closure drift")
    ontology_refs = node_ids | relation_ids | rule_ids | premise_ids | proof_ids
    for binding in binding_records:
        if not isinstance(binding, dict):
            continue
        expected_selection = f"KEP-SOL-SEL-{binding.get('definition_id', '').removeprefix('KEP-SOL-')}"
        if binding.get("source_selection_ref") != expected_selection:
            errors.append(f"definition binding selection drift: {binding.get('definition_id')}")
        for ontology_ref in binding.get("ontology_refs", []):
            if ontology_ref not in ontology_refs:
                errors.append(f"definition binding has dangling ontology ref: {ontology_ref}")

    if not EXPECTED_REQUIRED_RULES <= rule_ids:
        errors.append(f"required business-rule closure drift: {sorted(EXPECTED_REQUIRED_RULES - rule_ids)}")
    required_roles = {
        "identity", "key_binding", "artifact_version", "state_aggregate", "membership", "commitment",
        "instruction", "replay_domain", "consumption_record", "evidence", "economic_boundary",
        "infrastructure_cost", "program_identity", "environment", "outcome",
    }
    observed_roles = {record.get("role") for record in node_records if isinstance(record, dict)}
    if not required_roles <= observed_roles:
        errors.append(f"required business-role closure drift: {sorted(required_roles - observed_roles)}")
    if any(record.get("evidence_state") != "not_evaluable" for record in proof_records if isinstance(record, dict)):
        errors.append("candidate ontology proof requirements must remain not_evaluable")
    if any(record.get("commitment_confidence") != "working-candidate" for record in premise_records if isinstance(record, dict)):
        errors.append("ontology premises must remain working candidates")
    no_price_rule = next((record for record in rule_records if isinstance(record, dict) and record.get("rule_id") == "KEP-SOL-RULE-NO-PRICE-SEPARATES-NETWORK-COST"), {})
    if "no knowledge price" not in no_price_rule.get("statement", "") or "network fees and rent" not in no_price_rule.get("statement", ""):
        errors.append("no-price and network-cost distinction drift")
    if "CA2-SOLANA-NO-PRICE-BOUNDARY" not in node_ids or "CA2-SOLANA-NETWORK-COST" not in node_ids:
        errors.append("no-price boundary nodes are incomplete")

    for records, label in (
        (node_records, "node"), (relation_records, "relation"), (rule_records, "rule"),
        (premise_records, "premise"), (proof_records, "proof"), (residue_records, "residue"),
    ):
        check_source_refs(records, selection_ids, label, errors)
    for binding in binding_records:
        if isinstance(binding, dict) and binding.get("source_selection_ref") not in selection_ids:
            errors.append(f"definition binding has unknown source selection: {binding.get('definition_id')}")

    if receipts.get("append_only") is not True:
        errors.append("validation receipt registry must be append-only")
    digest = material_digest(errors)
    if candidate.get("schema_version") != "cav2-kep-solana-business-ontology-candidate/v1":
        errors.append("ontology candidate schema identity drift")
    if candidate.get("candidate_id") != "CA2-CANDIDATE-KEP-SOLANA-BUSINESS-ONTOLOGY-001":
        errors.append("ontology candidate identity drift")
    if candidate.get("ontology_id") != profile.get("ontology_id") or candidate.get("ontology_type") != "business-domain" or candidate.get("branch") != "business":
        errors.append("ontology candidate subject drift")
    if candidate.get("material_digest") != digest:
        errors.append("ontology candidate material digest drift")
    artifact_records = candidate.get("artifacts", [])
    artifact_paths = unique_ids(artifact_records, "path", "candidate artifact path", errors)
    if artifact_paths != set(MATERIAL_FILES):
        errors.append("ontology candidate artifact closure drift")
    for record in artifact_records:
        if not isinstance(record, dict):
            continue
        relative = record.get("path")
        if not isinstance(relative, str) or relative not in MATERIAL_FILES:
            continue
        path = PACKAGE_ROOT / relative
        if not path.is_file() or record.get("sha256") != sha256(path):
            errors.append(f"ontology candidate artifact digest drift: {relative}")
    candidate_predecessor = candidate.get("predecessor", {})
    if candidate_predecessor.get("decision_id") != "CA2-DECISION-KEP-SOLANA-PRODUCT-CAPABILITY-ADOPTION-001" or candidate_predecessor.get("sha256") != EXPECTED_ADOPTION_DIGEST:
        errors.append("ontology candidate predecessor drift")
    expected_candidate_counts = {
        "sources": len(source_ids),
        "selections": len(selection_ids),
        "definition_bindings": len(binding_ids),
        "nodes": len(node_ids),
        "relations": len(relation_ids),
        "rules": len(rule_ids),
        "premises": len(premise_ids),
        "proof_requirements": len(proof_ids),
        "residue": len(residue_records),
    }
    if candidate.get("counts") != expected_candidate_counts:
        errors.append("ontology candidate count closure drift")
    if candidate.get("lifecycle_status") != "authored-candidate" or candidate.get("admission_status") != "not-requested":
        errors.append("ontology candidate lifecycle drift")
    if candidate.get("successor_authorization") != "none" or candidate.get("enforcement_effect") != "none" or candidate.get("external_effect") != "none" or candidate.get("authority_effect") != "none":
        errors.append("ontology candidate exceeds its authority ceiling")
    for record in receipts.get("receipts", []):
        if not isinstance(record, dict):
            continue
        relative = record.get("path")
        if not isinstance(relative, str) or relative.startswith("/") or ".." in Path(relative).parts:
            errors.append("receipt path must be safe and package-relative")
            continue
        path = (PACKAGE_ROOT / relative).resolve()
        try:
            path.relative_to(PACKAGE_ROOT)
        except ValueError:
            errors.append("receipt path escapes ontology package")
            continue
        if not path.is_file() or record.get("sha256") != sha256(path):
            errors.append(f"receipt digest drift: {record.get('receipt_id')}")
        if record.get("material_digest") != digest:
            errors.append(f"stale validation receipt: {record.get('receipt_id')}")

    return {
        "schema_version": "cav2-kep-solana-business-ontology-validation/v1",
        "status": "PASS" if not errors else "BLOCK",
        "ontology_id": "CA2-ONTOLOGY-KEP-SOLANA-COOWNERSHIP",
        "ontology_type": "business-domain",
        "branch": "business",
        "lifecycle_status": "authored-candidate",
        "material_digest": digest,
        "counts": {
            "sources": len(source_ids),
            "selections": len(selection_ids),
            "definition_bindings": len(binding_ids),
            "nodes": len(node_ids),
            "relations": len(relation_ids),
            "rules": len(rule_ids),
            "premises": len(premise_ids),
            "proof_requirements": len(proof_ids),
            "residue": len(residue_records),
            "receipts": len(receipts.get("receipts", [])),
        },
        "d65_last_evaluable_stage": "authored no-price Solana business ontology candidate",
        "authority_effect": "none",
        "claim_ceiling": "Product Capability adopted and business ontology authored as a candidate only; no ontology admission, DomainSpec, system ontology, implementation, Solana execution, payment, publication, deployment, or external effect.",
        "errors": errors,
    }


def main() -> int:
    result = validate()
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
