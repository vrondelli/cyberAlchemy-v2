#!/usr/bin/env python3
"""Deterministically validate the encrypted durable Devnet business ontology."""

from __future__ import annotations

import hashlib
import json
import re
import subprocess
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator, FormatChecker
from jsonschema.exceptions import SchemaError


ONTOLOGY_ID = "CA2-ONTOLOGY-KEP-SOLANA-ENCRYPTED-DURABLE-DEVNET"
CAPABILITY_ID = "CA2-CAP-REALIZE-ENCRYPTED-DURABLE-DEVNET-COOWNERSHIP"
CAPABILITY_SHA256 = "1b841eff87f1e4cd87de71b7b339ecd6c67185337fd17c80c0df88977491470f"
ADOPTION_SHA256 = "c3c5b59d0380e53040f1cdcbae8b3ab36b76150b5f1de403881f9469bf8528e8"
GIT_OBJECT = "1b629e601"
SOLANA_IDS = tuple(f"KEP-SOL-D{index}" for index in range(1, 18))
STORAGE_IDS = tuple(f"KEP-DST-D{index}" for index in range(1, 16))
DEFINITION_IDS = SOLANA_IDS + STORAGE_IDS
CONSTRUCTION_STATE = {
    "canonical_definitions": "accepted",
    "product_capability": "adopted",
    "business_ontology": "authored-candidate-awaiting-owner-admission",
    "domainspec_v2_source": "not_evaluable",
    "compiled_graph_and_system_ontology": "not_evaluable",
    "implementation_binding": "not_evaluable",
    "conformance_evidence": "not_evaluable",
    "devnet_trial": "not_evaluable",
}
EXPECTED_SOURCE_IDS = {
    "SRC-KEP-SOL2-BASE-DEFINITIONS",
    "SRC-KEP-SOL2-COMPLETION-DEFINITIONS",
    "SRC-KEP-SOL2-DEFINITION-ACCEPTANCE",
    "SRC-KEP-SOL2-PRODUCT-CAPABILITY",
    "SRC-KEP-SOL2-PRODUCT-CAPABILITY-ADOPTION",
    "SRC-KEP-SOL2-CRYPTOGRAPHIC-PROFILE",
    "SRC-KEP-SOL2-STORAGE-INSTANTIATION",
    "SRC-KEP-SOL2-BASE-SOLANA-ONTOLOGY",
    "SRC-KEP-SOL2-BASE-SOLANA-ONTOLOGY-ADMISSION",
    "SRC-KEP-SOL2-DURABLE-STORAGE-DEFINITIONS",
    "SRC-KEP-SOL2-DURABLE-STORAGE-DEFINITION-ACCEPTANCE",
    "SRC-KEP-SOL2-SQL-THREE-LAYER-ONTOLOGY",
    "SRC-KEP-SOL2-SQL-THREE-LAYER-ONTOLOGY-ADMISSION",
}
REQUIRED_RULES = {
    "KEP-SOL2-RULE-KEY-ROLES-NONCOLLAPSE",
    "KEP-SOL2-RULE-PRESERVE-A",
    "KEP-SOL2-RULE-CRYPTOGRAPHIC-PROFILE-EXACT",
    "KEP-SOL2-RULE-EXACT-BYTE-IDENTITY",
    "KEP-SOL2-RULE-THREE-LAYER-READINESS",
    "KEP-SOL2-RULE-STORAGE-BEFORE-SUBMISSION",
    "KEP-SOL2-RULE-ATOMIC-CHAIN-GRANT",
    "KEP-SOL2-RULE-REPLAY-ONCE",
    "KEP-SOL2-RULE-FINALIZED-ACTIVATION",
    "KEP-SOL2-RULE-NO-CROSS-SYSTEM-ATOMICITY",
    "KEP-SOL2-RULE-B-REQUEST-ONLY",
    "KEP-SOL2-RULE-POLICY-SCOPED-A-FULFILLMENT",
    "KEP-SOL2-RULE-REISSUE-PRESERVES-PROTOCOL-STATE",
    "KEP-SOL2-RULE-OLD-ENVELOPE-REMAINS-ON-FAILURE",
    "KEP-SOL2-RULE-STORAGE-CONFIDENTIALITY",
    "KEP-SOL2-RULE-PROVIDER-UNBOUND",
    "KEP-SOL2-RULE-NO-PRICE-COST-SEPARATION",
    "KEP-SOL2-RULE-DEVNET-NONPRODUCTION",
    "KEP-SOL2-RULE-EVIDENCE-CLOSURE",
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


def configure(package_root: Path, working_root: Path | None = None, git_root: Path | None = None) -> None:
    global PACKAGE_ROOT, WORKING_ROOT, GIT_ROOT
    PACKAGE_ROOT = package_root.resolve()
    default_root = PACKAGE_ROOT.parents[8]
    WORKING_ROOT = (working_root or default_root).resolve()
    GIT_ROOT = (git_root or default_root).resolve()


configure(Path(__file__).resolve().parent)


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


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


def validate_instance(instance: Any, schema: dict[str, Any], definition: str, label: str, errors: list[str]) -> None:
    selected = dict(schema)
    selected.pop("$id", None)
    selected["$ref"] = f"#/$defs/{definition}"
    try:
        Draft202012Validator.check_schema(selected)
    except SchemaError as exc:
        errors.append(f"{label} schema invalid: {exc.message}")
        return
    validator = Draft202012Validator(selected, format_checker=FormatChecker())
    for error in sorted(validator.iter_errors(instance), key=lambda item: list(item.absolute_path)):
        location = ".".join(str(part) for part in error.absolute_path) or "$"
        errors.append(f"{label} schema violation at {location}: {error.message}")


def unique_ids(records: list[Any], key: str, label: str, errors: list[str]) -> set[str]:
    values: set[str] = set()
    for record in records:
        if not isinstance(record, dict) or not isinstance(record.get(key), str):
            errors.append(f"{label} record missing {key}")
            continue
        value = record[key]
        if value in values:
            errors.append(f"duplicate {label}: {value}")
        values.add(value)
    return values


def git_bytes(git_object: str, path: str, errors: list[str], label: str) -> bytes:
    try:
        result = subprocess.run(
            ["git", "show", f"{git_object}:{path}"],
            cwd=GIT_ROOT,
            check=False,
            capture_output=True,
        )
    except OSError as exc:
        errors.append(f"{label} Git resolution failed: {exc}")
        return b""
    if result.returncode != 0:
        errors.append(f"{label} Git source is missing")
        return b""
    return result.stdout


def source_bytes(record: dict[str, Any], errors: list[str]) -> bytes:
    source_id = str(record.get("source_id"))
    path = record.get("path")
    if not isinstance(path, str) or path.startswith("/") or ".." in Path(path).parts:
        errors.append(f"source path must be safe and repository-relative: {source_id}")
        return b""
    if record.get("location") == "working-tree":
        target = (WORKING_ROOT / path).resolve()
        try:
            target.relative_to(WORKING_ROOT)
        except ValueError:
            errors.append(f"source path escapes working root: {source_id}")
            return b""
        if not target.is_file():
            errors.append(f"source is missing: {source_id}")
            return b""
        value = target.read_bytes()
    elif record.get("location") == "git-object":
        if record.get("git_object") != GIT_OBJECT:
            errors.append(f"source Git object drift: {source_id}")
        value = git_bytes(str(record.get("git_object")), path, errors, source_id)
    else:
        errors.append(f"unknown source location: {source_id}")
        return b""
    if value and record.get("sha256") != sha256_bytes(value):
        errors.append(f"source digest drift: {source_id}")
    return value


def markdown_section(value: bytes, selector: str) -> bytes | None:
    definition_id = selector.removeprefix("## ").removesuffix(":")
    prefix = "KEP-SOL-" if definition_id.startswith("KEP-SOL-") else "KEP-DST-"
    text = value.decode("utf-8")
    matches = list(re.finditer(rf"^## ({re.escape(prefix)}D\d+): .+$", text, flags=re.MULTILINE))
    for index, match in enumerate(matches):
        if match.group(1) != definition_id:
            continue
        end = matches[index + 1].start() if index + 1 < len(matches) else text.find("\n## Candidate Claim Ceiling", match.end())
        if end < 0:
            end = len(text)
        return text[match.start():end].encode("utf-8")
    return None


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
    schema = load(PACKAGE_ROOT / "schema.json", errors)
    profile = load(PACKAGE_ROOT / "profile.json", errors)
    sources = load(PACKAGE_ROOT / "sources.json", errors)
    bindings = load(PACKAGE_ROOT / "definition-bindings.json", errors)
    nodes = load(PACKAGE_ROOT / "nodes.json", errors)
    relations = load(PACKAGE_ROOT / "relations.json", errors)
    rules = load(PACKAGE_ROOT / "rules.json", errors)
    premises = load(PACKAGE_ROOT / "premises.json", errors)
    proofs = load(PACKAGE_ROOT / "proof-requirements.json", errors)
    residue = load(PACKAGE_ROOT / "residue.json", errors)
    receipts = load(PACKAGE_ROOT / "receipts/index.json", errors)
    candidate = load(PACKAGE_ROOT / "candidate.json", errors)

    if schema:
        for instance, definition, label in (
            (profile, "profile", "profile"),
            (sources, "sourceRegistry", "source registry"),
            (bindings, "definitionBindingRegistry", "definition binding registry"),
            (nodes, "nodeRegistry", "node registry"),
            (relations, "relationRegistry", "relation registry"),
            (rules, "ruleRegistry", "rule registry"),
            (premises, "premiseRegistry", "premise registry"),
            (proofs, "proofRegistry", "proof registry"),
            (residue, "residueRegistry", "residue registry"),
            (receipts, "receiptRegistry", "receipt registry"),
        ):
            validate_instance(instance, schema, definition, label, errors)

    if profile.get("ontology_id") != ONTOLOGY_ID:
        errors.append("ontology identity drift")
    if profile.get("ontology_type") != "business-domain" or profile.get("branch") != "business":
        errors.append("ontology type or branch drift")
    if profile.get("lifecycle_status") != "authored-candidate":
        errors.append("business ontology must remain an authored candidate")
    if profile.get("composed_ontology_refs") != ["CA2-ONTOLOGY-KEP-SOLANA-COOWNERSHIP", "CA2-ONTOLOGY-KEP-DST-SQL-THREE-LAYER"]:
        errors.append("composed ontology closure drift")
    if profile.get("construction_state") != CONSTRUCTION_STATE:
        errors.append("D65 construction state must stop at the authored business ontology candidate")
    if any(profile.get(field) != "none" for field in ("authority_effect", "enforcement_effect", "external_effect")):
        errors.append("ontology profile exceeds its effect ceiling")

    source_records = sources.get("sources", [])
    source_ids = unique_ids(source_records, "source_id", "source id", errors)
    if source_ids != EXPECTED_SOURCE_IDS:
        errors.append("source identity closure drift")
    resolved: dict[str, bytes] = {}
    for record in source_records:
        if isinstance(record, dict) and isinstance(record.get("source_id"), str):
            resolved[record["source_id"]] = source_bytes(record, errors)

    selection_records = sources.get("selections", [])
    selection_ids = unique_ids(selection_records, "selection_id", "selection id", errors)
    expected_selection_ids = {
        *(f"KEP-SOL2-SEL-SOL-D{index}" for index in range(1, 18)),
        *(f"KEP-SOL2-SEL-DST-D{index}" for index in range(1, 16)),
        "KEP-SOL2-SEL-DEFINITION-ACCEPTANCE",
        "KEP-SOL2-SEL-PRODUCT-CAPABILITY",
        "KEP-SOL2-SEL-PRODUCT-CAPABILITY-ADOPTION",
        "KEP-SOL2-SEL-CRYPTOGRAPHIC-PROFILE",
        "KEP-SOL2-SEL-STORAGE-INSTANTIATION",
        "KEP-SOL2-SEL-BASE-SOLANA-ONTOLOGY",
        "KEP-SOL2-SEL-BASE-SOLANA-ONTOLOGY-ADMISSION",
        "KEP-SOL2-SEL-DST-DEFINITION-ACCEPTANCE",
        "KEP-SOL2-SEL-SQL-THREE-LAYER-ONTOLOGY",
        "KEP-SOL2-SEL-SQL-THREE-LAYER-ONTOLOGY-ADMISSION",
    }
    if selection_ids != expected_selection_ids:
        errors.append("source selection closure drift")
    for record in selection_records:
        if not isinstance(record, dict):
            continue
        value = resolved.get(str(record.get("source_id")), b"")
        if record.get("selector_kind") == "whole-file":
            selected = value
        elif record.get("selector_kind") == "markdown-heading" and isinstance(record.get("selector"), str):
            selected = markdown_section(value, record["selector"])
            if selected is None:
                errors.append(f"definition selector missing: {record.get('selection_id')}")
                continue
        else:
            errors.append(f"invalid selector: {record.get('selection_id')}")
            continue
        if selected and record.get("selection_sha256") != sha256_bytes(selected):
            errors.append(f"selection digest drift: {record.get('selection_id')}")

    def source_json(source_id: str) -> dict[str, Any]:
        try:
            value = json.loads(resolved.get(source_id, b""))
        except json.JSONDecodeError:
            errors.append(f"source JSON invalid: {source_id}")
            return {}
        return value if isinstance(value, dict) else {}

    capability = source_json("SRC-KEP-SOL2-PRODUCT-CAPABILITY")
    adoption = source_json("SRC-KEP-SOL2-PRODUCT-CAPABILITY-ADOPTION")
    crypto = source_json("SRC-KEP-SOL2-CRYPTOGRAPHIC-PROFILE")
    storage = source_json("SRC-KEP-SOL2-STORAGE-INSTANTIATION")
    base_admission = source_json("SRC-KEP-SOL2-BASE-SOLANA-ONTOLOGY-ADMISSION")
    sql_admission = source_json("SRC-KEP-SOL2-SQL-THREE-LAYER-ONTOLOGY-ADMISSION")
    if capability.get("capability_id") != CAPABILITY_ID or sha256_bytes(resolved.get("SRC-KEP-SOL2-PRODUCT-CAPABILITY", b"")) != CAPABILITY_SHA256:
        errors.append("Product Capability identity or digest drift")
    if adoption.get("adoption", {}).get("lifecycle_status") != "adopted" or adoption.get("adoption", {}).get("adopted_capability_sha256") != CAPABILITY_SHA256:
        errors.append("Product Capability is not exact-owner-adopted")
    if sha256_bytes(resolved.get("SRC-KEP-SOL2-PRODUCT-CAPABILITY-ADOPTION", b"")) != ADOPTION_SHA256:
        errors.append("Product Capability adoption digest drift")
    if crypto.get("status") != "candidate-test-only" or crypto.get("authority_effect") != "none":
        errors.append("cryptographic-profile test-only boundary drift")
    if storage.get("status") != "candidate" or storage.get("activation_rule", {}).get("solana_commitment") != "finalized":
        errors.append("storage instantiation or finalized activation drift")
    if base_admission.get("admission", {}).get("lifecycle_status") != "admitted" or base_admission.get("admission", {}).get("admitted_ontology_id") != "CA2-ONTOLOGY-KEP-SOLANA-COOWNERSHIP":
        errors.append("base Solana ontology is not admitted")
    if sql_admission.get("admission", {}).get("lifecycle_status") != "admitted":
        errors.append("SQL three-layer ontology is not admitted")

    binding_records = bindings.get("bindings", [])
    binding_ids = tuple(record.get("definition_id") for record in binding_records if isinstance(record, dict))
    if binding_ids != DEFINITION_IDS:
        errors.append("definition-binding ID closure drift")
    node_records = nodes.get("nodes", [])
    rule_records = rules.get("rules", [])
    node_ids = unique_ids(node_records, "id", "node id", errors)
    rule_ids = unique_ids(rule_records, "rule_id", "rule id", errors)
    ontology_ids = node_ids | rule_ids
    for record in binding_records:
        if not isinstance(record, dict):
            continue
        if record.get("source_selection_ref") not in selection_ids:
            errors.append(f"definition binding selection missing: {record.get('definition_id')}")
        for ontology_ref in record.get("ontology_refs", []):
            if ontology_ref not in ontology_ids:
                errors.append(f"definition binding target missing: {ontology_ref}")
    if not REQUIRED_RULES <= rule_ids:
        errors.append(f"required business-rule closure drift: {sorted(REQUIRED_RULES - rule_ids)}")
    if any(record.get("enforcement_state") != "candidate" for record in rule_records if isinstance(record, dict)):
        errors.append("candidate rule self-promotion")

    relation_records = relations.get("relations", [])
    unique_ids(relation_records, "relation_id", "relation id", errors)
    for record in relation_records:
        if not isinstance(record, dict):
            continue
        if record.get("source") not in node_ids:
            errors.append(f"dangling relation source: {record.get('relation_id')}")
        if record.get("target") not in node_ids:
            errors.append(f"dangling relation target: {record.get('relation_id')}")

    for records, label in (
        (node_records, "node"),
        (relation_records, "relation"),
        (rule_records, "rule"),
        (premises.get("premises", []), "premise"),
        (proofs.get("proof_requirements", []), "proof"),
        (residue.get("residue", []), "residue"),
    ):
        for record in records:
            if not isinstance(record, dict):
                continue
            for source_ref in record.get("source_refs", []):
                if source_ref not in selection_ids:
                    errors.append(f"{label} has unknown source ref: {source_ref}")
    if any(record.get("commitment_confidence") != "working-candidate" for record in premises.get("premises", []) if isinstance(record, dict)):
        errors.append("premise commitment self-promotion")
    if any(record.get("evidence_state") != "not_evaluable" for record in proofs.get("proof_requirements", []) if isinstance(record, dict)):
        errors.append("proof requirements must remain not_evaluable")
    if receipts.get("receipts") != []:
        errors.append("candidate receipt registry must remain empty")

    digest = material_digest(errors)
    expected_artifacts = [
        {"path": relative, "sha256": sha256(PACKAGE_ROOT / relative)}
        for relative in sorted(MATERIAL_FILES)
        if (PACKAGE_ROOT / relative).is_file()
    ]
    if candidate.get("candidate_id") != "CA2-CANDIDATE-KEP-SOLANA-ENCRYPTED-DURABLE-DEVNET-ONTOLOGY-001":
        errors.append("ontology candidate identity drift")
    if candidate.get("ontology_id") != ONTOLOGY_ID or candidate.get("material_digest") != digest:
        errors.append("ontology candidate material digest drift")
    if candidate.get("artifacts") != expected_artifacts:
        errors.append("ontology candidate artifact closure drift")
    if candidate.get("construction_state") != CONSTRUCTION_STATE:
        errors.append("candidate D65 construction-state drift")
    if candidate.get("admission_status") != "not-requested" or candidate.get("successor_authorization") != "none":
        errors.append("ontology candidate silently admits or authorizes a successor")
    if candidate.get("authority_effect") != "none" or candidate.get("external_effect") != "none":
        errors.append("ontology candidate exceeds its effect ceiling")

    return {
        "schema_version": "cav2-kep-solana-encrypted-durable-devnet-ontology-validation/v1",
        "status": "PASS" if not errors else "BLOCK",
        "ontology_id": ONTOLOGY_ID,
        "lifecycle_status": "authored-candidate",
        "material_digest": digest,
        "counts": {
            "sources": len(source_records),
            "selections": len(selection_records),
            "definition_bindings": len(binding_records),
            "nodes": len(node_records),
            "relations": len(relation_records),
            "rules": len(rule_records),
            "premises": len(premises.get("premises", [])),
            "proof_requirements": len(proofs.get("proof_requirements", [])),
            "residue": len(residue.get("residue", [])),
        },
        "d65_last_evaluable_stage": "authored capability-local business ontology candidate",
        "authority_effect": "none",
        "enforcement_effect": "none",
        "external_effect": "none",
        "claim_ceiling": "Validated authored business-ontology candidate only; no admission, DomainSpec, system ontology, implementation, conformance, transaction, publication, deployment, or external effect.",
        "errors": errors,
    }


def main() -> int:
    result = validate()
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
