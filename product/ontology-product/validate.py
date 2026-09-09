#!/usr/bin/env python3
"""Validate the private Ontology Product thesis; write a receipt only on request."""

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
SHARED_SCHEMA = REPOSITORY_ROOT / "cyberAlchemy-v2/product/schemas/product-thesis-record.schema.json"
MATERIAL_FILES = (
    "IDENTITY-DECISION.json",
    "PRODUCT-THESIS.md",
    "product-thesis.record.json",
    "product-thesis.sources.json",
    "tests/test_validate.py",
    "validate.py",
)
THESIS_RECEIPT_SCHEMA = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": False,
    "required": [
        "schema_version", "status", "package_root", "product_id", "thesis_id",
        "parent_product_id", "relationship", "project_id", "goal_id",
        "material_digest", "counts", "goal_package_validation", "claim_ceiling",
        "authority_effect", "errors", "validated_at",
    ],
    "properties": {
        "schema_version": {"const": "cav2-ontology-product-thesis-validation/v1"},
        "status": {"const": "PASS"},
        "package_root": {"const": "cyberAlchemy-v2/product/ontology-product"},
        "product_id": {"const": "CA2-PRODUCT-ONTOLOGY"},
        "thesis_id": {"const": "CA2-PRODUCT-THESIS-ONTOLOGY"},
        "parent_product_id": {"const": "CA2-PRODUCT-CYBERALCHEMY"},
        "relationship": {"const": "subproduct_of"},
        "project_id": {"const": "CA2-PROJECT-ONTOLOGY-PRODUCT"},
        "goal_id": {"const": "CA2-GOAL-ONTOLOGY-PRODUCT-FOUNDATION"},
        "material_digest": {"type": "string", "pattern": "^[0-9a-f]{64}$"},
        "counts": {
            "type": "object", "additionalProperties": False,
            "required": ["sources", "principles", "intended_outcomes"],
            "properties": {
                "sources": {"type": "integer", "minimum": 1},
                "principles": {"const": 9},
                "intended_outcomes": {"type": "integer", "minimum": 1},
            },
        },
        "goal_package_validation": {"const": "not_evaluated"},
        "claim_ceiling": {"type": "string", "minLength": 1},
        "authority_effect": {"const": "none"},
        "errors": {"type": "array", "maxItems": 0},
        "validated_at": {"type": "string", "format": "date-time"},
    },
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


def validate_instance(instance: Any, schema: dict[str, Any], label: str, errors: list[str]) -> None:
    try:
        Draft202012Validator.check_schema(schema)
    except SchemaError as exc:
        errors.append(f"{label} schema is invalid: {exc.message}")
        return
    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    for error in sorted(validator.iter_errors(instance), key=lambda item: list(item.absolute_path)):
        location = ".".join(str(part) for part in error.absolute_path) or "$"
        errors.append(f"{label} schema violation at {location}: {error.message}")


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


def validate() -> dict[str, Any]:
    errors: list[str] = []
    decision = load(PACKAGE_ROOT / "IDENTITY-DECISION.json", errors)
    record = load(PACKAGE_ROOT / "product-thesis.record.json", errors)
    sources_doc = load(PACKAGE_ROOT / "product-thesis.sources.json", errors)
    schema = load(SHARED_SCHEMA, errors)

    exact_keys(sources_doc, {"schema_version", "sources"}, "source registry", errors)
    if sources_doc.get("schema_version") != "cav2-ontology-product-thesis-sources/v1":
        errors.append("source registry schema_version is invalid")
    if not isinstance(sources_doc.get("sources"), list) or not sources_doc.get("sources"):
        errors.append("source registry sources must be a non-empty list")

    if schema:
        validate_instance(record, schema, "product thesis record", errors)

    decision_keys = {
        "schema_version", "decision_id", "decided_at", "source", "product_id",
        "parent_product_id", "relationship", "thesis_id", "project_id", "goal_id",
        "product_root", "ontology_root", "owner_route", "ontology_owner_route",
        "visibility", "commitment_effect", "blocked_effects", "authority_effect",
    }
    exact_keys(decision, decision_keys, "identity decision", errors)
    expected_decision = {
        "schema_version": "cav2-ontology-product-identity-decision/v1",
        "product_id": "CA2-PRODUCT-ONTOLOGY",
        "parent_product_id": "CA2-PRODUCT-CYBERALCHEMY",
        "relationship": "subproduct_of",
        "thesis_id": "CA2-PRODUCT-THESIS-ONTOLOGY",
        "project_id": "CA2-PROJECT-ONTOLOGY-PRODUCT",
        "goal_id": "CA2-GOAL-ONTOLOGY-PRODUCT-FOUNDATION",
        "visibility": "private",
        "authority_effect": "none",
    }
    for field, expected in expected_decision.items():
        if decision.get(field) != expected:
            errors.append(f"identity decision {field} must be {expected!r}")

    properties = schema.get("properties", {})
    required = set(schema.get("required", []))
    exact_keys(record, required, "product thesis record", errors)
    extra = sorted(set(record) - set(properties))
    if extra:
        errors.append(f"product thesis record schema-unknown keys: {', '.join(extra)}")
    expected_record = {
        "schema_version": "cav2-product-thesis-record/v1",
        "canonical_kind": "product-thesis",
        "thesis_id": "CA2-PRODUCT-THESIS-ONTOLOGY",
        "product_ref": "CA2-PRODUCT-ONTOLOGY",
        "definition_ref": "CAV2-D63",
        "carrier_ref": "PRODUCT-THESIS.md",
        "commitment_state": "draft",
        "artifact_authority_state": "candidate",
        "authority_effect": "none",
    }
    for field, expected in expected_record.items():
        if record.get(field) != expected:
            errors.append(f"product thesis record {field} must be {expected!r}")
    if len(record.get("first_order_principles", [])) != 9:
        errors.append("product thesis record must contain the nine declared principles")
    if decision.get("product_id") != record.get("product_ref"):
        errors.append("identity decision product does not bind the thesis record")
    if decision.get("thesis_id") != record.get("thesis_id"):
        errors.append("identity decision thesis does not bind the thesis record")

    source_ids: set[str] = set()
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
        path = REPOSITORY_ROOT / str(source.get("path", ""))
        if not path.is_file():
            errors.append(f"missing source: {source.get('path')}")
        elif sha256(path) != source.get("sha256"):
            errors.append(f"source digest drift: {source_id}")
    for required_source in {
        "SRC-CAV2-DEFINITIONS",
        "SRC-CAV2-UMBRELLA-PRODUCT-THESIS",
        "SRC-CAV2-UMBRELLA-PRODUCT-THESIS-RECORD",
        "SRC-CAV2-ONTOLOGY-PRODUCT-IDENTITY-DECISION",
        "SRC-CAV2-PRODUCT-THESIS-SCHEMA",
    }:
        if required_source not in source_ids:
            errors.append(f"missing required source: {required_source}")
    schema_sources = [
        source for source in sources_doc.get("sources", [])
        if isinstance(source, dict) and source.get("id") == "SRC-CAV2-PRODUCT-THESIS-SCHEMA"
    ]
    if len(schema_sources) == 1 and schema_sources[0].get("path") != "cyberAlchemy-v2/product/schemas/product-thesis-record.schema.json":
        errors.append("shared thesis schema source path is invalid")

    for receipt_path in sorted((PACKAGE_ROOT / "receipts").glob("validation-*.json")):
        receipt = load(receipt_path, errors)
        if receipt:
            validate_instance(receipt, THESIS_RECEIPT_SCHEMA, f"stored receipt {receipt_path.name}", errors)

    carrier = (PACKAGE_ROOT / "PRODUCT-THESIS.md").read_text(encoding="utf-8")
    for marker in (
        "Thesis ID: CA2-PRODUCT-THESIS-ONTOLOGY",
        "Canonical definition: CAV2-D63",
        "Commitment state: draft",
        "## Product Identity",
        "## Thesis",
        "## Project",
        "## Goal",
        "## Revision Criteria",
        "## Claim Ceiling",
    ):
        if marker not in carrier:
            errors.append(f"product thesis carrier missing marker: {marker}")

    digest = material_digest(errors)
    return {
        "schema_version": "cav2-ontology-product-thesis-validation/v1",
        "status": "PASS" if not errors else "BLOCK",
        "package_root": "cyberAlchemy-v2/product/ontology-product",
        "product_id": record.get("product_ref"),
        "thesis_id": record.get("thesis_id"),
        "parent_product_id": decision.get("parent_product_id"),
        "relationship": decision.get("relationship"),
        "project_id": decision.get("project_id"),
        "goal_id": decision.get("goal_id"),
        "material_digest": digest,
        "counts": {
            "sources": len(source_ids),
            "principles": len(record.get("first_order_principles", [])),
            "intended_outcomes": len(record.get("intended_outcomes", [])),
        },
        "goal_package_validation": "not_evaluated",
        "claim_ceiling": record.get("claim_ceiling"),
        "authority_effect": "none",
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
