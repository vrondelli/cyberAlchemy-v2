#!/usr/bin/env python3
"""Validate the private Craft Project and its draft Product Feature thesis."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator


PACKAGE_ROOT = Path(__file__).resolve().parent
REPOSITORY_ROOT = Path(__file__).resolve().parents[4]
SHARED_SCHEMA = REPOSITORY_ROOT / "cyberAlchemy-v2/goals/schemas/goal-package.schema.json"
GOAL_PATH = PACKAGE_ROOT / "goals/establish-craft-product-feature.goal.json"
FEATURE_ROOT = PACKAGE_ROOT / "product-feature"
PRODUCT_ROOT = REPOSITORY_ROOT / "cyberAlchemy-v2/product/craft"
MATERIAL_FILES = (
    "CRAFT-IDENTITY-DECISION.json",
    "README.md",
    "goals/establish-craft-product-feature.goal.json",
    "product-feature/THESIS.md",
    "product-feature/product-feature.json",
    "product-feature/sources.json",
    "project.json",
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


def validate_schema(instance: dict[str, Any], schema: dict[str, Any], definition: str, errors: list[str]) -> None:
    subschema = schema.get("$defs", {}).get(definition)
    if not isinstance(subschema, dict):
        errors.append(f"shared schema is missing $defs/{definition}")
        return
    validator = Draft202012Validator(subschema)
    for error in sorted(validator.iter_errors(instance), key=lambda item: list(item.absolute_path)):
        location = ".".join(str(part) for part in error.absolute_path) or "$"
        errors.append(f"{definition} schema violation at {location}: {error.message}")


def validate() -> dict[str, Any]:
    errors: list[str] = []
    decision = load(PACKAGE_ROOT / "CRAFT-IDENTITY-DECISION.json", errors)
    project = load(PACKAGE_ROOT / "project.json", errors)
    goal = load(GOAL_PATH, errors)
    feature = load(FEATURE_ROOT / "product-feature.json", errors)
    sources_doc = load(FEATURE_ROOT / "sources.json", errors)
    schema = load(SHARED_SCHEMA, errors)

    if schema:
        Draft202012Validator.check_schema(schema)
        validate_schema(project, schema, "project", errors)
        validate_schema(goal, schema, "goal", errors)

    expected_decision = {
        "schema_version": "cav2-craft-identity-decision/v3",
        "decision_id": "CA2-DECISION-CRAFT-IDENTITY-003",
        "display_name": "Craft",
        "rename_posture": "selected-current-name-legacy-paths-retained-for-migration",
        "visibility": "private",
        "authority_effect": "none",
    }
    for field, expected in expected_decision.items():
        if decision.get(field) != expected:
            errors.append(f"identity decision {field} must be {expected!r}")

    expected_feature = {
        "schema_version": "cav2-craft-product-feature-thesis/v1",
        "artifact_kind": "project-product-feature-thesis-candidate",
        "feature_thesis_id": "CA2-PRODUCT-FEATURE-THESIS-SYSTEM-CONSTRUCTION",
        "feature_id": "CA2-PRODUCT-FEATURE-SYSTEM-CONSTRUCTION",
        "project_ref": "CA2-PROJECT-CRAFT",
        "carrier_ref": "THESIS.md",
        "definition_posture": "project-local-candidate-term-not-canonically-admitted",
        "commitment_state": "draft",
        "artifact_authority_state": "candidate",
        "authority_effect": "none",
    }
    for field, expected in expected_feature.items():
        if feature.get(field) != expected:
            errors.append(f"Product Feature thesis {field} must be {expected!r}")

    identities = decision.get("identities", {})
    if project.get("project_id") != identities.get("project_id"):
        errors.append("Project carrier does not match the selected Project identity")
    if goal.get("project_ref") != project.get("project_id"):
        errors.append("Goal does not belong to the Craft Project")
    if goal.get("goal_id") not in project.get("goal_refs", []):
        errors.append("Project does not link its Craft Goal")
    if feature.get("project_ref") != project.get("project_id"):
        errors.append("Product Feature thesis does not belong to the Craft Project")

    product_context = feature.get("product_context", {})
    if product_context.get("source_id") != "SRC-CAV2-CRAFT-PRODUCT-THESIS":
        errors.append("Product Feature must use the Craft Product Thesis as its immediate context")
    if product_context.get("ontology_node_id") != "CA2-PRODUCT-THESIS-CRAFT":
        errors.append("Product Feature product context must resolve to CA2-PRODUCT-THESIS-CRAFT")
    thesis_refs = project.get("thesis_refs", [])
    if not any(ref.get("ontology_node_id") == "CA2-THESIS-GOVERNED-HMI" for ref in thesis_refs if isinstance(ref, dict)):
        errors.append("Craft Project must trace to the CyberAlchemy Product Thesis")

    naming_boundary = decision.get("naming_boundary", {})
    expected_non_collapse = "Shared naming and relationships do not merge Product, Project, Method, Product Feature, public capability, or repository-state identities."
    if naming_boundary.get("non_collapse_rule") != expected_non_collapse:
        errors.append("Craft naming non-collapse rule is missing or changed")
    if not (PRODUCT_ROOT / "IDENTITY.json").is_file() or not (PRODUCT_ROOT / "PRODUCT-THESIS.md").is_file():
        errors.append("Craft Product identity and Product Thesis must resolve from the Craft Project")
    if identities.get("product_id") != "CA2-PRODUCT-CRAFT":
        errors.append("Craft identity decision must select CA2-PRODUCT-CRAFT")
    if identities.get("method_ref") != "CAV2-D20":
        errors.append("Craft identity decision must bind CAV2-D20 Craft Method")
    if identities.get("first_product_feature_id") != feature.get("feature_id"):
        errors.append("Craft identity decision and Product Feature identity do not match")
    product_lineage = decision.get("product_lineage", {})
    if product_lineage.get("former_name") != "DomainSpec v2":
        errors.append("Craft identity decision must preserve DomainSpec v2 as the former Product name")
    if product_lineage.get("continuity") != "same-product-renamed":
        errors.append("Craft and DomainSpec v2 must remain one renamed Product lineage")

    sources = sources_doc.get("sources")
    if sources_doc.get("schema_version") != "cav2-craft-product-feature-sources/v2":
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

    required_source_ids = {
        "SRC-CAV2-CRAFT-IDENTITY-DECISION",
        "SRC-CAV2-CRAFT-PRODUCT-THESIS",
        "SRC-CAV2-CRAFT-METHOD-DEFINITION",
        "SRC-CAV2-GOAL-PACKAGE-SCHEMA",
        "SRC-CAV2-PARENT-PRODUCT-THESIS",
        "SRC-DOMAINSPEC-V2-PRODUCT-THESIS",
        "SRC-DOMAINSPEC-V2-MIG-B-ARCHITECTURE-MAP",
    }
    missing_sources = sorted(required_source_ids - source_ids)
    if missing_sources:
        errors.append(f"missing required source IDs: {', '.join(missing_sources)}")

    carrier = (FEATURE_ROOT / "THESIS.md").read_text(encoding="utf-8")
    for marker in (
        "Project: `CA2-PROJECT-CRAFT`",
        "Product Feature: `CA2-PRODUCT-FEATURE-SYSTEM-CONSTRUCTION`",
        "Product context: `CA2-PRODUCT-CRAFT` / `CA2-PRODUCT-THESIS-CRAFT`",
        "Building Method: `CAV2-D20`",
        "## Project Identity",
        "## Product Context",
        "## Product Feature",
        "## Thesis",
        "## DomainSpec v2 Rename And Lineage",
        "## Open Decisions",
        "## Claim Ceiling",
    ):
        if marker not in carrier:
            errors.append(f"Product Feature thesis carrier missing marker: {marker}")

    open_decisions = carrier.split("## Open Decisions", 1)[-1].split("\n## ", 1)[0]
    open_decision_count = sum(
        1
        for line in open_decisions.splitlines()
        if any(line.startswith(f"{number}. ") for number in range(1, 100))
    )

    return {
        "schema_version": "cav2-craft-project-validation/v1",
        "status": "PASS" if not errors else "BLOCK",
        "package_root": "cyberAlchemy-v2/goals/projects/craft",
        "project_id": project.get("project_id"),
        "product_id": identities.get("product_id"),
        "method_ref": identities.get("method_ref"),
        "goal_id": goal.get("goal_id"),
        "product_feature_id": feature.get("feature_id"),
        "product_context_node_id": product_context.get("ontology_node_id"),
        "former_product_name": product_lineage.get("former_name"),
        "lineage_continuity": product_lineage.get("continuity"),
        "legacy_project_space_ref": product_lineage.get("legacy_project_space_ref"),
        "rename_posture": decision.get("rename_posture"),
        "counts": {
            "sources": len(source_ids),
            "principles": len(feature.get("first_order_principles", [])),
            "intended_outcomes": len(feature.get("intended_outcomes", [])),
            "open_decisions": open_decision_count,
        },
        "material_digest": material_digest(errors),
        "commitment_state": feature.get("commitment_state"),
        "claim_ceiling": feature.get("claim_ceiling"),
        "authority_effect": "none",
        "errors": errors,
    }


def main() -> int:
    result = validate()
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
