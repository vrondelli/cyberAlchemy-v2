#!/usr/bin/env python3
"""Validate the private Craft Product, Product Thesis, Project, and Method bindings."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator, FormatChecker


PACKAGE_ROOT = Path(__file__).resolve().parent
REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
PROJECT_ROOT = REPOSITORY_ROOT / "cyberAlchemy-v2/goals/projects/craft"
FEATURE_ROOT = PROJECT_ROOT / "product-feature"
SHARED_SCHEMA = REPOSITORY_ROOT / "cyberAlchemy-v2/product/schemas/product-thesis-record.schema.json"
MATERIAL_FILES = (
    "IDENTITY.json",
    "PRODUCT-THESIS.md",
    "README.md",
    "product-thesis.record.json",
    "product-thesis.sources.json",
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
    identity = load(PACKAGE_ROOT / "IDENTITY.json", errors)
    record = load(PACKAGE_ROOT / "product-thesis.record.json", errors)
    sources_doc = load(PACKAGE_ROOT / "product-thesis.sources.json", errors)
    decision = load(PROJECT_ROOT / "CRAFT-IDENTITY-DECISION.json", errors)
    project = load(PROJECT_ROOT / "project.json", errors)
    feature = load(FEATURE_ROOT / "product-feature.json", errors)
    schema = load(SHARED_SCHEMA, errors)

    if schema:
        Draft202012Validator.check_schema(schema)
        validator = Draft202012Validator(schema, format_checker=FormatChecker())
        for error in sorted(validator.iter_errors(record), key=lambda item: list(item.absolute_path)):
            location = ".".join(str(part) for part in error.absolute_path) or "$"
            errors.append(f"Product Thesis record schema violation at {location}: {error.message}")

    expected_identity = {
        "schema_version": "cav2-craft-product-identity/v2",
        "product_id": "CA2-PRODUCT-CRAFT",
        "display_name": "Craft",
        "former_display_name": "DomainSpec v2",
        "product_thesis_ref": "CA2-PRODUCT-THESIS-CRAFT",
        "parent_product_ref": "CA2-PRODUCT-CYBERALCHEMY",
        "coordinating_project_ref": "CA2-PROJECT-CRAFT",
        "building_method_ref": "CAV2-D20",
        "first_product_feature_ref": "CA2-PRODUCT-FEATURE-SYSTEM-CONSTRUCTION",
        "lineage_continuity": "same-product-renamed",
        "rename_posture": "selected-current-name-physical-and-authority-migration-pending",
        "visibility": "private",
        "authority_effect": "none",
    }
    for field, expected in expected_identity.items():
        if identity.get(field) != expected:
            errors.append(f"Product identity {field} must be {expected!r}")

    expected_record = {
        "schema_version": "cav2-product-thesis-record/v1",
        "canonical_kind": "product-thesis",
        "thesis_id": "CA2-PRODUCT-THESIS-CRAFT",
        "product_ref": "CA2-PRODUCT-CRAFT",
        "definition_ref": "CAV2-D63",
        "carrier_ref": "PRODUCT-THESIS.md",
        "commitment_state": "draft",
        "artifact_authority_state": "candidate",
        "authority_effect": "none",
    }
    for field, expected in expected_record.items():
        if record.get(field) != expected:
            errors.append(f"Product Thesis record {field} must be {expected!r}")

    decision_identities = decision.get("identities", {})
    if decision_identities.get("product_id") != identity.get("product_id"):
        errors.append("owner decision and Product identity do not match")
    if decision_identities.get("project_id") != project.get("project_id"):
        errors.append("owner decision and Project identity do not match")
    if decision_identities.get("method_ref") != identity.get("building_method_ref"):
        errors.append("owner decision and Craft Method identity do not match")
    if decision_identities.get("first_product_feature_id") != feature.get("feature_id"):
        errors.append("owner decision and first Product Feature identity do not match")

    product_context = feature.get("product_context", {})
    if product_context.get("source_id") != "SRC-CAV2-CRAFT-PRODUCT-THESIS":
        errors.append("first Product Feature must use the Craft Product Thesis as context")
    if product_context.get("ontology_node_id") != record.get("thesis_id"):
        errors.append("first Product Feature context does not resolve to the Craft Product Thesis")

    method_definition = (REPOSITORY_ROOT / "cyberAlchemy-v2/authority/definitions/DEFINITIONS.md").read_text(encoding="utf-8")
    for marker in (
        "## CAV2-D20: Craft Method",
        "Craft method is CyberAlchemy's governed recursive system-building method.",
        "Ledgering is the method's continuity mechanism; it is not the whole",
    ):
        if marker not in method_definition:
            errors.append(f"Craft Method definition missing marker: {marker}")

    sources = sources_doc.get("sources")
    if sources_doc.get("schema_version") != "cav2-craft-product-thesis-sources/v2":
        errors.append("source registry schema_version is invalid")
    if not isinstance(sources, list) or not sources:
        errors.append("source registry sources must be a non-empty list")
        sources = []
    source_ids: set[str] = set()
    for index, source in enumerate(sources):
        if not isinstance(source, dict):
            errors.append(f"sources[{index}] must be an object")
            continue
        if set(source) != {"id", "path", "sha256", "posture", "owner_route"}:
            errors.append(f"sources[{index}] has invalid keys")
            continue
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

    required_sources = {
        "SRC-CAV2-CRAFT-IDENTITY-DECISION",
        "SRC-CAV2-PRODUCT-THESIS-SCHEMA",
        "SRC-CAV2-PARENT-PRODUCT-THESIS",
        "SRC-CAV2-CRAFT-METHOD-DEFINITION",
        "SRC-CAV2-CRAFT-PROJECT",
        "SRC-DOMAINSPEC-V2-PRODUCT-THESIS",
        "SRC-DOMAINSPEC-V2-MIG-B-ARCHITECTURE-MAP",
    }
    missing_sources = sorted(required_sources - source_ids)
    if missing_sources:
        errors.append(f"missing required source IDs: {', '.join(missing_sources)}")

    carrier = (PACKAGE_ROOT / "PRODUCT-THESIS.md").read_text(encoding="utf-8")
    for marker in (
        "Thesis ID: `CA2-PRODUCT-THESIS-CRAFT`",
        "Product: `CA2-PRODUCT-CRAFT`",
        "Coordinating Project: `CA2-PROJECT-CRAFT`",
        "Building Method: `CAV2-D20`",
        "## Product Identity",
        "## Thesis",
        "## Product, Project, Method, And Feature",
        "## DomainSpec v2 Rename And Continuity",
        "## Open Product Decisions",
        "## Claim Ceiling",
    ):
        if marker not in carrier:
            errors.append(f"Product Thesis carrier missing marker: {marker}")

    naming_boundary = decision.get("naming_boundary", {})
    expected_non_collapse = "Shared naming and relationships do not merge Product, Project, Method, Product Feature, public capability, or repository-state identities."
    if naming_boundary.get("non_collapse_rule") != expected_non_collapse:
        errors.append("Craft Product/Project/Method non-collapse rule is missing or changed")

    return {
        "schema_version": "cav2-craft-product-validation/v1",
        "status": "PASS" if not errors else "BLOCK",
        "package_root": "cyberAlchemy-v2/product/craft",
        "product_id": identity.get("product_id"),
        "former_product_name": identity.get("former_display_name"),
        "lineage_continuity": identity.get("lineage_continuity"),
        "rename_posture": identity.get("rename_posture"),
        "product_thesis_id": record.get("thesis_id"),
        "project_id": project.get("project_id"),
        "method_ref": identity.get("building_method_ref"),
        "first_product_feature_id": feature.get("feature_id"),
        "parent_product_ref": identity.get("parent_product_ref"),
        "counts": {
            "sources": len(source_ids),
            "principles": len(record.get("first_order_principles", [])),
            "intended_outcomes": len(record.get("intended_outcomes", [])),
        },
        "material_digest": material_digest(errors),
        "commitment_state": record.get("commitment_state"),
        "claim_ceiling": record.get("claim_ceiling"),
        "authority_effect": "none",
        "errors": errors,
    }


def main() -> int:
    result = validate()
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
