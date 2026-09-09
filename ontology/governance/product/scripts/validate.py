#!/usr/bin/env python3
"""Validate the Governance module business product ontology without effects."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = Path(__file__).resolve().parents[5]
MATERIAL_FILES = (
    "README.md", "profile.json", "sources.json", "nodes.json", "relations.json",
    "residue.json", "schemas/governance-product-ontology.schema.json", "scripts/validate.py",
)

PROFILE_KEYS = {
    "schema_ref", "schema_version", "ontology_id", "title", "ontology_type", "branch",
    "materialization", "package_root", "package_owner", "meaning_owner", "visibility",
    "candidate_status", "authority_effect", "enforcement_effect", "product_node_id",
    "product_thesis_node_id", "source_registry", "node_registry", "relation_registry",
    "residue_registry", "schema_path", "validator_path", "blocked_outputs",
}
SOURCE_KEYS = {"id", "path", "import_sha256", "digest_role", "posture", "owner_route", "required_selectors"}
NODE_KEYS = {
    "id", "label", "role", "plain_language", "claim", "scope", "source_refs",
    "owner_route", "candidate_status", "evidence_confidence", "commitment_confidence",
    "authority_effect", "enforcement_effect", "forbidden_collapse", "open_questions",
}
VOCABULARY_KEYS = {"id", "label", "plain_language", "forbidden_collapse"}
RELATION_KEYS = {
    "id", "type", "source", "target", "direction", "owner_route", "source_refs",
    "authority_effect", "enforcement_effect", "forbidden_collapse",
}
RESIDUE_KEYS = {"id", "label", "description", "status", "owner_route", "next_action", "subject_refs", "source_refs"}
ALLOWED_ROLES = {
    "product", "actor", "work_domain", "problem", "thesis", "capability",
    "product_output", "outcome", "business_rule", "value_measure",
}
EXPECTED_ROLE_COUNTS = {
    "product": 1, "actor": 5, "work_domain": 1, "problem": 5, "thesis": 1,
    "capability": 7, "product_output": 5, "outcome": 3, "business_rule": 9,
    "value_measure": 6,
}
EXPECTED_NODE_IDS = {
    "GOV-PRODUCT-MODULE", "GOV-ACTOR-GOVERNANCE-STEWARD", "GOV-ACTOR-WORK-OWNER",
    "GOV-ACTOR-GOVERNED-PARTICIPANT", "GOV-ACTOR-INDEPENDENT-OBSERVER",
    "GOV-ACTOR-VALIDATOR-ENFORCER", "GOV-WORK-CONSEQUENTIAL-WORK",
    "GOV-PROBLEM-IMPLICIT-GOVERNANCE", "GOV-PROBLEM-AUTHORITY-AMBIGUITY",
    "GOV-PROBLEM-INCONSISTENT-GOVERNANCE", "GOV-PROBLEM-UNJUSTIFIED-GOVERNANCE",
    "GOV-PROBLEM-GOVERNANCE-ATTENUATION", "GOV-THESIS-PROPORTIONATE-EVIDENCE-GOVERNANCE",
    "GOV-CAP-MODEL-GOVERNANCE", "GOV-CAP-ROUTE-AUTHORITY-DECISIONS",
    "GOV-CAP-ASSESS-RULE-FITNESS", "GOV-CAP-ENFORCE-ACTIVE-RULES",
    "GOV-CAP-OBSERVE-EXPLAIN", "GOV-CAP-EVOLVE-GOVERNANCE",
    "GOV-CAP-OPERATE-GOVERNANCE", "GOV-OUTPUT-GOVERNANCE-CONTRACT",
    "GOV-OUTPUT-GOVERNANCE-DECISION", "GOV-OUTPUT-GOVERNANCE-ASSESSMENT",
    "GOV-OUTPUT-ENFORCEMENT-RESULT", "GOV-OUTPUT-GOVERNANCE-HEALTH",
    "GOV-OUT-ACCOUNTABLE-GOVERNANCE", "GOV-OUT-CONTROLLED-CONSEQUENCES",
    "GOV-OUT-PROPORTIONATE-GOVERNANCE", "GOV-RULE-HARM-BASIS-REQUIRED",
    "GOV-RULE-AUTHORITY-BOUNDED-VISIBLE", "GOV-RULE-ONLY-ADOPTED-APPLICABLE-RULES-ENFORCE",
    "GOV-RULE-NON-COLLAPSE", "GOV-RULE-RUNNABLE-GOVERNANCE",
    "GOV-RULE-INDEPENDENT-OBSERVATION", "GOV-RULE-GOVERNANCE-SERVES-WORK",
    "GOV-RULE-HASHES-NOT-LIFECYCLE-CLOCKS", "GOV-RULE-OWNED-EVOLUTION",
    "GOV-MEASURE-GOVERNANCE-COVERAGE", "GOV-MEASURE-CONTROL-EFFECTIVENESS",
    "GOV-MEASURE-AUTHORITY-LEGIBILITY", "GOV-MEASURE-GOVERNANCE-FRICTION",
    "GOV-MEASURE-REFRESH-CHURN", "GOV-MEASURE-GOVERNANCE-LEARNING",
}
RELATION_ROLE_CONTRACTS = {
    "serves": {("product", "actor")},
    "applies_to": {("product", "work_domain")},
    "addresses": {("product", "problem")},
    "claims_value_through": {("product", "thesis")},
    "includes_capability": {("product", "capability")},
    "participates_in": {("actor", "capability")},
    "produces": {("capability", "product_output")},
    "enables": {("product_output", "outcome"), ("capability", "outcome"), ("capability", "capability")},
    "requires": {("thesis", "business_rule")},
    "measured_by": {("product", "value_measure")},
    "observes": {("value_measure", "problem")},
}


def load_json(relative: str, errors: list[str]) -> dict[str, Any]:
    path = PACKAGE_ROOT / relative
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        errors.append(f"missing package file: {relative}")
        return {}
    except json.JSONDecodeError as exc:
        errors.append(f"invalid JSON in {relative}: {exc}")
        return {}
    if not isinstance(value, dict):
        errors.append(f"{relative} must contain one JSON object")
        return {}
    return value


def exact_keys(value: Any, expected: set[str], label: str, errors: list[str]) -> None:
    if not isinstance(value, dict):
        errors.append(f"{label} must be an object")
        return
    missing = sorted(expected - set(value))
    extra = sorted(set(value) - expected)
    if missing:
        errors.append(f"{label} missing keys: {', '.join(missing)}")
    if extra:
        errors.append(f"{label} has unknown keys: {', '.join(extra)}")


def unique_ids(records: list[Any], label: str, errors: list[str]) -> list[str]:
    ids = [record.get("id") for record in records if isinstance(record, dict)]
    valid = [item for item in ids if isinstance(item, str) and item]
    duplicates = sorted({item for item in valid if valid.count(item) > 1})
    if len(valid) != len(records):
        errors.append(f"every {label} must have a non-empty string id")
    if duplicates:
        errors.append(f"duplicate {label} IDs: {', '.join(duplicates)}")
    return valid


def no_effect(record: dict[str, Any], label: str, errors: list[str]) -> None:
    if record.get("authority_effect") != "none":
        errors.append(f"{label} authority_effect must equal 'none'")
    if record.get("enforcement_effect") != "none":
        errors.append(f"{label} enforcement_effect must equal 'none'")


def check_refs(refs: Any, source_ids: set[str], source_text: dict[str, str], label: str, errors: list[str]) -> None:
    if not isinstance(refs, list) or not refs:
        errors.append(f"{label} source_refs must be non-empty")
        return
    for index, ref in enumerate(refs):
        ref_label = f"{label} source_refs[{index}]"
        exact_keys(ref, {"source_id", "selector"}, ref_label, errors)
        if not isinstance(ref, dict):
            continue
        source_id = ref.get("source_id")
        selector = ref.get("selector")
        if source_id not in source_ids:
            errors.append(f"{ref_label} uses unknown source {source_id!r}")
        elif not isinstance(selector, str) or selector not in source_text.get(str(source_id), ""):
            errors.append(f"{ref_label} selector is missing from live source: {selector!r}")


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


def build_result(write_receipt: bool) -> tuple[dict[str, Any], int]:
    errors: list[str] = []
    warnings = ["Import SHA-256 values preserve provenance only; live whole-file hashes are intentionally not compared."]
    profile = load_json("profile.json", errors)
    sources_doc = load_json("sources.json", errors)
    nodes_doc = load_json("nodes.json", errors)
    relations_doc = load_json("relations.json", errors)
    residue_doc = load_json("residue.json", errors)
    schema = load_json("schemas/governance-product-ontology.schema.json", errors)

    exact_keys(profile, PROFILE_KEYS, "profile", errors)
    expected_profile = {
        "schema_version": "governance-product-ontology-profile/v1",
        "ontology_id": "governance.product", "ontology_type": "business-domain",
        "branch": "business", "materialization": "package-required",
        "package_root": "cyberAlchemy-v2/ontology/governance/product",
        "visibility": "private", "candidate_status": "candidate",
        "authority_effect": "none", "enforcement_effect": "none",
        "product_node_id": "GOV-PRODUCT-MODULE",
        "product_thesis_node_id": "GOV-THESIS-PROPORTIONATE-EVIDENCE-GOVERNANCE",
    }
    for field, expected in expected_profile.items():
        if profile.get(field) != expected:
            errors.append(f"profile {field} must equal {expected!r}")
    required_defs = {"sourceRef", "profile", "sourceRegistry", "nodeRegistry", "relationRegistry", "residueRegistry", "validationReceipt"}
    if not isinstance(schema.get("$defs"), dict) or not required_defs.issubset(schema["$defs"]):
        errors.append("schema does not expose every closed package definition")

    exact_keys(sources_doc, {"schema_ref", "sources"}, "source registry", errors)
    sources = sources_doc.get("sources", [])
    if not isinstance(sources, list) or not sources:
        errors.append("source registry must contain a non-empty sources list")
        sources = []
    source_ids = set(unique_ids(sources, "source", errors))
    source_text: dict[str, str] = {}
    for index, source in enumerate(sources):
        label = f"source[{index}]"
        exact_keys(source, SOURCE_KEYS, label, errors)
        if not isinstance(source, dict):
            continue
        digest = source.get("import_sha256")
        if not isinstance(digest, str) or not re.fullmatch(r"[0-9a-f]{64}", digest):
            errors.append(f"{label} import_sha256 must be lowercase SHA-256 provenance")
        role = str(source.get("digest_role", "")).lower()
        if "import" not in role or "provenance" not in role:
            errors.append(f"{label} digest_role must identify import provenance")
        relative = source.get("path")
        if not isinstance(relative, str) or Path(relative).is_absolute() or ".." in Path(relative).parts:
            errors.append(f"{label} path must be repository-relative")
            continue
        path = REPOSITORY_ROOT / relative
        if not path.is_file():
            errors.append(f"{label} source path is missing: {relative}")
            continue
        text = path.read_text(encoding="utf-8")
        source_text[str(source.get("id"))] = text
        selectors = source.get("required_selectors")
        if not isinstance(selectors, list) or not selectors:
            errors.append(f"{label} required_selectors must be non-empty")
        else:
            for selector in selectors:
                if not isinstance(selector, str) or selector not in text:
                    errors.append(f"{label} selector is missing from live source: {selector!r}")

    exact_keys(nodes_doc, {"schema_ref", "nodes"}, "node registry", errors)
    nodes = nodes_doc.get("nodes", [])
    if not isinstance(nodes, list) or not nodes:
        errors.append("node registry must contain a non-empty nodes list")
        nodes = []
    node_ids = set(unique_ids(nodes, "node", errors))
    if node_ids != EXPECTED_NODE_IDS:
        errors.append("node registry does not match the standalone Governance product vocabulary")
    nodes_by_id = {node.get("id"): node for node in nodes if isinstance(node, dict)}
    role_counts = {role: 0 for role in ALLOWED_ROLES}
    for index, node in enumerate(nodes):
        label = f"node[{index}]"
        exact_keys(node, NODE_KEYS, label, errors)
        if not isinstance(node, dict):
            continue
        role = node.get("role")
        if role not in ALLOWED_ROLES:
            errors.append(f"{label} has unsupported business role {role!r}")
        else:
            role_counts[str(role)] += 1
        if node.get("candidate_status") != "candidate":
            errors.append(f"{label} must remain candidate")
        if node.get("evidence_confidence") not in {"low", "medium", "high"}:
            errors.append(f"{label} has invalid evidence confidence")
        if node.get("commitment_confidence") not in {"low", "conditional", "committed"}:
            errors.append(f"{label} has invalid commitment confidence")
        if not isinstance(node.get("owner_route"), str) or not node["owner_route"].strip():
            errors.append(f"{label} must declare owner_route")
        no_effect(node, label, errors)
        check_refs(node.get("source_refs"), source_ids, source_text, label, errors)
    if role_counts != EXPECTED_ROLE_COUNTS:
        errors.append(f"business role counts are non-current: {role_counts}")
    if profile.get("product_node_id") not in node_ids or profile.get("product_thesis_node_id") not in node_ids:
        errors.append("profile product and thesis references must resolve")

    exact_keys(relations_doc, {"schema_ref", "relation_vocabulary", "relations"}, "relation registry", errors)
    vocabulary = relations_doc.get("relation_vocabulary", [])
    relations = relations_doc.get("relations", [])
    if not isinstance(vocabulary, list) or not vocabulary:
        errors.append("relation vocabulary must be non-empty")
        vocabulary = []
    if not isinstance(relations, list) or not relations:
        errors.append("relations must be non-empty")
        relations = []
    vocabulary_ids = set(unique_ids(vocabulary, "relation vocabulary", errors))
    if vocabulary_ids != set(RELATION_ROLE_CONTRACTS):
        errors.append("relation vocabulary does not match the standalone business contract")
    for index, item in enumerate(vocabulary):
        exact_keys(item, VOCABULARY_KEYS, f"relation_vocabulary[{index}]", errors)
    unique_ids(relations, "relation", errors)
    for index, relation in enumerate(relations):
        label = f"relation[{index}]"
        exact_keys(relation, RELATION_KEYS, label, errors)
        if not isinstance(relation, dict):
            continue
        relation_type = relation.get("type")
        source = nodes_by_id.get(relation.get("source"))
        target = nodes_by_id.get(relation.get("target"))
        if source is None or target is None:
            errors.append(f"{label} endpoint does not resolve")
        else:
            roles = (source.get("role"), target.get("role"))
            if roles not in RELATION_ROLE_CONTRACTS.get(str(relation_type), set()):
                errors.append(f"{label} role pair {roles} is invalid for {relation_type!r}")
        if relation_type not in vocabulary_ids:
            errors.append(f"{label} uses unknown relation type {relation_type!r}")
        if relation.get("direction") != "directed":
            errors.append(f"{label} direction must equal 'directed'")
        no_effect(relation, label, errors)
        check_refs(relation.get("source_refs"), source_ids, source_text, label, errors)

    exact_keys(residue_doc, {"schema_ref", "residue"}, "residue registry", errors)
    residue = residue_doc.get("residue", [])
    if not isinstance(residue, list):
        errors.append("residue must be a list")
        residue = []
    unique_ids(residue, "residue", errors)
    for index, item in enumerate(residue):
        label = f"residue[{index}]"
        exact_keys(item, RESIDUE_KEYS, label, errors)
        if not isinstance(item, dict):
            continue
        refs = item.get("subject_refs")
        if not isinstance(refs, list) or not refs:
            errors.append(f"{label} subject_refs must be non-empty")
        else:
            for ref in refs:
                if ref not in node_ids:
                    errors.append(f"{label} subject ref does not resolve: {ref!r}")
        check_refs(item.get("source_refs"), source_ids, source_text, label, errors)

    try:
        readme = (PACKAGE_ROOT / "README.md").read_text(encoding="utf-8")
    except OSError as exc:
        errors.append(f"cannot read README.md: {exc}")
        readme = ""
    for phrase in (
        f"The package owns {len(nodes)} business nodes",
        f"There are {len(vocabulary)} relation types and {len(relations)} relation instances.",
        "Authority effect: none", "Enforcement effect: none", "Integrity Evidence Must Not Become Semantic Authority",
    ):
        if phrase not in readme:
            errors.append(f"README view is non-current: missing {phrase!r}")

    digest = material_digest(errors)
    receipt_dir = PACKAGE_ROOT / "receipts"
    if not receipt_dir.is_dir():
        errors.append("receipts directory is missing")
    stale = 0
    if receipt_dir.is_dir():
        for path in sorted(receipt_dir.glob("validation-*.json")):
            try:
                old = json.loads(path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                warnings.append(f"historical receipt is unreadable: {path.name}")
                continue
            if old.get("material_digest") != digest:
                stale += 1
    if stale:
        warnings.append(f"{stale} prior receipt(s) describe historical package material and remain append-only.")

    checks = [
        "closed product record shapes", "stable product IDs and role counts",
        "selector-scoped source currentness", "business relation role closure",
        "product and thesis root resolution", "residue reference closure",
        "non-effectful candidate boundaries", "deterministic package material digest",
    ]
    status = "PASS" if not errors else "BLOCK"
    result: dict[str, Any] = {
        "status": status, "package_root": "cyberAlchemy-v2/ontology/governance/product",
        "ontology_id": profile.get("ontology_id"), "ontology_type": profile.get("ontology_type"),
        "branch": profile.get("branch"), "visibility": profile.get("visibility"),
        "authority_effect": profile.get("authority_effect"), "enforcement_effect": profile.get("enforcement_effect"),
        "counts": {"sources": len(sources), "nodes": len(nodes), "relation_types": len(vocabulary), "relations": len(relations), "residue": len(residue)},
        "material_digest": digest, "checks": checks, "warnings": warnings, "errors": errors,
    }
    if write_receipt and status == "PASS":
        receipt = {
            "schema_ref": "../schemas/governance-product-ontology.schema.json#/$defs/validationReceipt",
            "schema_version": "governance-product-ontology-validation/v1",
            "validated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "status": "PASS", "package_root": "cyberAlchemy-v2/ontology/governance/product",
            "ontology_type": "business-domain", "branch": "business", "visibility": "private",
            "authority_effect": "none", "enforcement_effect": "none", "validator_path": "scripts/validate.py",
            "command": "python3 cyberAlchemy-v2/ontology/governance/product/scripts/validate.py --write-receipt",
            "counts": result["counts"], "material_digest": digest, "checks": checks, "warnings": warnings, "errors": [],
        }
        receipt_path = receipt_dir / f"validation-{digest[:16]}.json"
        if receipt_path.exists():
            result["receipt_write"] = "existing-append-only-receipt-preserved"
        else:
            receipt_path.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
            result["receipt_write"] = "created"
        result["receipt"] = str(receipt_path.relative_to(REPOSITORY_ROOT))
    elif write_receipt:
        result["receipt_write"] = "blocked"
    return result, 0 if status == "PASS" else 1


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write-receipt", action="store_true", help="append one receipt after PASS")
    args = parser.parse_args()
    result, status = build_result(args.write_receipt)
    json.dump(result, sys.stdout, indent=2, sort_keys=True)
    sys.stdout.write("\n")
    return status


if __name__ == "__main__":
    raise SystemExit(main())
