#!/usr/bin/env python3
"""Validate the exact People and Teams semantic admission without granting effects."""

from __future__ import annotations

import hashlib
import json
import os
import subprocess
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
        if not path.is_file() or path.is_symlink():
            errors.append(f"missing or unsafe material file: {relative}")
            continue
        digest.update(relative.encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def run_native_validator(errors: list[str]) -> dict[str, Any]:
    environment = os.environ.copy()
    environment["PYTHONDONTWRITEBYTECODE"] = "1"
    try:
        completed = subprocess.run(
            ["python3", "cyberAlchemy-v2/people-and-teams/scripts/validate.py"],
            cwd=REPOSITORY_ROOT,
            env=environment,
            capture_output=True,
            text=True,
            timeout=30,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        errors.append(f"native package validator unavailable: {exc}")
        return {}
    try:
        result = json.loads(completed.stdout)
    except json.JSONDecodeError as exc:
        errors.append(f"native package validator emitted invalid JSON: {exc}")
        return {}
    if completed.returncode != 0 or result.get("status") != "PASS" or result.get("errors") != []:
        errors.append("native package validator is not a clean current PASS")
    return result


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

    thesis_path = REPOSITORY_ROOT / str(subject.get("product_thesis_path", ""))
    thesis = load(thesis_path, errors) if thesis_path.is_file() else {}
    if not thesis_path.is_file():
        errors.append("admitted Product Thesis is missing")
    elif sha256(thesis_path) != subject.get("product_thesis_digest"):
        errors.append("admitted Product Thesis digest drift")
    if thesis.get("thesis_id") != subject.get("product_thesis_ref"):
        errors.append("admitted Product Thesis identity mismatch")
    if thesis.get("product_ref") != subject.get("product_ref"):
        errors.append("admitted Product identity mismatch")

    capability_path = REPOSITORY_ROOT / str(subject.get("product_capability_path", ""))
    capability = load(capability_path, errors) if capability_path.is_file() else {}
    if not capability_path.is_file():
        errors.append("admitted Product Capability is missing")
    elif sha256(capability_path) != subject.get("product_capability_digest"):
        errors.append("admitted Product Capability digest drift")
    if capability.get("capability_id") != subject.get("product_capability_ref"):
        errors.append("admitted Product Capability identity mismatch")
    if capability.get("product_ref") != subject.get("product_ref"):
        errors.append("Product Capability product identity mismatch")

    profile = load(package_root / "profile.json", errors)
    for field in ("ontology_id", "product_ref", "product_thesis_ref", "product_capability_ref"):
        if profile.get(field) != subject.get(field):
            errors.append(f"profile {field} identity mismatch")

    receipt_path = REPOSITORY_ROOT / str(subject.get("validation_receipt_ref", ""))
    receipt = load(receipt_path, errors) if receipt_path.is_file() else {}
    if not receipt_path.is_file():
        errors.append("bound validation receipt is missing")
    elif sha256(receipt_path) != subject.get("validation_receipt_digest"):
        errors.append("bound validation receipt digest drift")
    if receipt.get("status") != "PASS" or receipt.get("errors") != []:
        errors.append("bound validation receipt is not a clean PASS")
    if receipt.get("material_digest") != subject.get("material_digest"):
        errors.append("bound validation receipt does not cover admitted material")
    if receipt.get("ontology_id") != subject.get("ontology_id"):
        errors.append("bound validation receipt covers the wrong ontology")

    native_result = run_native_validator(errors)
    if native_result.get("material_digest") != subject.get("material_digest"):
        errors.append("current native validation does not cover admitted material")
    if native_result.get("ontology_id") != subject.get("ontology_id"):
        errors.append("current native validation covers the wrong ontology")

    return {
        "schema_version": "cav2-people-and-teams-semantic-admission-validation/v1",
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
