#!/usr/bin/env python3
"""Validate the exact durable-storage semantic admission without granting effects."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator, FormatChecker


DECISION_ROOT = Path(__file__).resolve().parent
REPOSITORY_ROOT = Path(__file__).resolve().parents[4]


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


def material_digest(package_root: Path, relative_paths: list[str], errors: list[str]) -> str:
    digest = hashlib.sha256()
    for relative in sorted(relative_paths):
        candidate = Path(relative)
        if candidate.is_absolute() or ".." in candidate.parts:
            errors.append(f"unsafe material path: {relative}")
            continue
        path = package_root / candidate
        if not path.is_file():
            errors.append(f"missing material file: {relative}")
            continue
        digest.update(relative.encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def validate() -> dict[str, Any]:
    errors: list[str] = []
    decision = load(DECISION_ROOT / "selection.json", errors)
    schema = load(DECISION_ROOT / "selection.schema.json", errors)
    if decision and schema:
        validator = Draft202012Validator(schema, format_checker=FormatChecker())
        for error in sorted(validator.iter_errors(decision), key=lambda item: list(item.absolute_path)):
            location = ".".join(str(part) for part in error.absolute_path) or "$"
            errors.append(f"selection schema violation at {location}: {error.message}")

    subject = decision.get("subject", {}) if isinstance(decision, dict) else {}
    package_root = REPOSITORY_ROOT / str(subject.get("package_root", ""))
    relative_paths = subject.get("material_files", [])
    if not isinstance(relative_paths, list) or any(not isinstance(item, str) for item in relative_paths):
        errors.append("subject material_files must be a string array")
        relative_paths = []
    actual_material_digest = material_digest(package_root, relative_paths, errors)
    if actual_material_digest != subject.get("material_digest"):
        errors.append("admitted package material digest drift")

    product_path = REPOSITORY_ROOT / str(subject.get("product_capability_path", ""))
    if not product_path.is_file():
        errors.append("admitted Product Capability is missing")
        product = {}
    else:
        product = load(product_path, errors)
        if sha256(product_path) != subject.get("product_capability_digest"):
            errors.append("admitted Product Capability digest drift")
    if product.get("capability_id") != subject.get("product_capability_ref"):
        errors.append("admitted Product Capability identity mismatch")

    profile = load(package_root / "profile.json", errors)
    if profile.get("ontology_id") != subject.get("ontology_id"):
        errors.append("admitted business ontology identity mismatch")
    if profile.get("product_capability_ref") != subject.get("product_capability_ref"):
        errors.append("profile Product Capability identity mismatch")

    receipt_path = REPOSITORY_ROOT / str(subject.get("validation_receipt_ref", ""))
    if not receipt_path.is_file():
        errors.append("bound validation receipt is missing")
        receipt = {}
    else:
        receipt = load(receipt_path, errors)
        if sha256(receipt_path) != subject.get("validation_receipt_digest"):
            errors.append("bound validation receipt digest drift")
    if receipt.get("status") != "PASS" or receipt.get("errors") != []:
        errors.append("bound validation receipt is not a clean PASS")
    if receipt.get("material_digest") != subject.get("material_digest"):
        errors.append("bound validation receipt does not cover admitted material")
    if receipt.get("ontology_id") != subject.get("ontology_id"):
        errors.append("bound validation receipt covers the wrong ontology")

    return {
        "schema_version": "cav2-durable-storage-semantic-admission-validation/v1",
        "status": "PASS" if not errors else "BLOCK",
        "decision_id": decision.get("decision_id"),
        "decision_digest": sha256(DECISION_ROOT / "selection.json") if (DECISION_ROOT / "selection.json").is_file() else None,
        "ontology_id": subject.get("ontology_id"),
        "material_digest": actual_material_digest,
        "admission_effect": decision.get("admission_effect"),
        "effect_authorized": False,
        "authority_effect": "none",
        "errors": errors,
    }


if __name__ == "__main__":
    result = validate()
    print(json.dumps(result, indent=2, sort_keys=True))
    raise SystemExit(0 if result["status"] == "PASS" else 1)
