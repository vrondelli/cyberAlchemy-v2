#!/usr/bin/env python3
"""Validate the candidate ontology runtime package without writing receipts."""

from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator


PACKAGE_ROOT = Path(__file__).resolve().parent
REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
SCHEMA_PATH = PACKAGE_ROOT / "schema.json"
CAPABILITY_SCHEMA_PATH = REPOSITORY_ROOT / "cyberAlchemy-v2/capability/schemas/capability.schema.json"
STAGE_ORDER = [
    "definition", "product_ontology", "business_ontology", "domainspec_source",
    "compiled_graph", "system_ontology", "implementation", "static_conformance",
    "runtime_evidence",
]
MATERIAL_FILES = (
    "README.md",
    "business-ontology.json",
    "conformance.json",
    "construction-binding.json",
    "domainspec/development-profile.json",
    "domainspec/feature.json",
    "domainspec/generated/SPEC.md",
    "domainspec/generated/build-receipt.json",
    "domainspec/generated/graph.json",
    "domainspec/generated/markdown-view.json",
    "domainspec/generated/source-manifest.json",
    "domainspec/generated/system-ontology-receipt.json",
    "domainspec/generated/system-ontology.json",
    "domainspec/nodes/ontology-registration.json",
    "domainspec/nodes/ontology-runtime-invariant.json",
    "domainspec/nodes/ontology-snapshot.json",
    "domainspec/nodes/ontology-validation-run.json",
    "domainspec/project.json",
    "product-capability-support.json",
    "product-capability.json",
    "profile.json",
    "registry.json",
    "runtime.py",
    "schema.json",
    "scripts/build.ts",
    "tests/test_runtime.py",
    "validate.py",
)


def load(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"{path} must contain one JSON object")
    return value


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def canonical_json_bytes(value: Any) -> bytes:
    return (json.dumps(value, sort_keys=True, separators=(",", ":")) + "\n").encode()


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


def validate_definition(
    root_schema: dict[str, Any], definition: str, value: Any, label: str, errors: list[str]
) -> None:
    schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$defs": root_schema.get("$defs", {}),
        "$ref": f"#/$defs/{definition}",
    }
    for error in sorted(Draft202012Validator(schema).iter_errors(value), key=lambda item: list(item.absolute_path)):
        location = ".".join(str(part) for part in error.absolute_path) or "$"
        errors.append(f"{label} schema violation at {location}: {error.message}")


def load_runtime():
    spec = importlib.util.spec_from_file_location("cav2_ontology_runtime_validation", PACKAGE_ROOT / "runtime.py")
    if spec is None or spec.loader is None:
        raise RuntimeError("runtime import specification unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def json_record_set_digest(path: Path, selector: str) -> str:
    collection, expression = selector.split(":", 1)
    field, values = expression.split("=", 1)
    wanted = values.split(",")
    document = load(path)
    records = document.get(collection)
    if not isinstance(records, list):
        raise ValueError(f"missing collection {collection}")
    selected = []
    for value in wanted:
        matches = [item for item in records if isinstance(item, dict) and item.get(field) == value]
        if len(matches) != 1:
            raise ValueError(f"selector cardinality {field}={value}: {len(matches)}")
        selected.append(matches[0])
    return sha256_bytes(canonical_json_bytes(selected))


def verify_binding_digest(
    binding: dict[str, Any], ref_field: str, digest_field: str, errors: list[str], label: str
) -> None:
    ref = binding.get(ref_field)
    digest = binding.get(digest_field)
    if not isinstance(ref, str) or not isinstance(digest, str):
        errors.append(f"{label} binding fields are missing")
        return
    path = REPOSITORY_ROOT / ref
    if not path.is_file() or sha256_file(path) != digest:
        errors.append(f"{label} exact binding drift")


def validate() -> dict[str, Any]:
    errors: list[str] = []
    try:
        schema = load(SCHEMA_PATH)
        capability_schema = load(CAPABILITY_SCHEMA_PATH)
        profile = load(PACKAGE_ROOT / "profile.json")
        registry = load(PACKAGE_ROOT / "registry.json")
        business = load(PACKAGE_ROOT / "business-ontology.json")
        capability = load(PACKAGE_ROOT / "product-capability.json")
        support = load(PACKAGE_ROOT / "product-capability-support.json")
        binding = load(PACKAGE_ROOT / "construction-binding.json")
        conformance = load(PACKAGE_ROOT / "conformance.json")
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        return result([f"package document unavailable: {exc}"], "NOT_EVALUABLE", None, None)

    validate_definition(schema, "profile", profile, "profile", errors)
    validate_definition(schema, "registry", registry, "registry", errors)
    validate_definition(schema, "businessOntology", business, "business ontology", errors)
    validate_definition(capability_schema, "productCapability", capability, "Product Capability", errors)

    support_ids = {
        item.get("id") for item in support.get("records", []) if isinstance(item, dict)
    }
    required_support = set(capability.get("input_contract_refs", []))
    required_support.update(capability.get("output_contract_refs", []))
    required_support.update(capability.get("context_policy_refs", []))
    required_support.update(capability.get("realization_binding_refs", []))
    required_support.add(capability.get("obligation_registry_ref"))
    if not required_support.issubset(support_ids):
        errors.append(f"Product Capability support refs unresolved: {sorted(required_support - support_ids)}")
    residue_ids = {
        item.get("id") for item in support.get("residue", []) if isinstance(item, dict)
    }
    capability_residue = set(capability.get("lifecycle_posture", {}).get("residue_refs", []))
    if not capability_residue.issubset(residue_ids):
        errors.append("Product Capability residue refs do not resolve")

    runtime = load_runtime()
    source_ids: set[str] = set()
    for source in business.get("source_bindings", []):
        if not isinstance(source, dict):
            errors.append("business source binding must be an object")
            continue
        source_id = str(source.get("id", ""))
        source_ids.add(source_id)
        scope = source.get("scope_kind")
        expected = source.get("sha256")
        if scope in {"self-reference", "whole-file"} and expected is None:
            if source_id not in {
                "CAP-SEL-ONTOLOGY-RUNTIME-BUSINESS-ONTOLOGY",
                "CAP-SEL-ONTOLOGY-RUNTIME-REGISTRY",
            }:
                errors.append(f"unexpected unbound business source: {source_id}")
            continue
        path = REPOSITORY_ROOT / str(source.get("path", ""))
        try:
            if scope == "heading-section":
                actual = sha256_bytes(runtime.heading_section_bytes(path, str(source.get("selector"))))
            elif scope == "json-record-set":
                actual = json_record_set_digest(path, str(source.get("selector")))
            elif scope == "whole-file":
                actual = sha256_file(path)
            else:
                raise ValueError(f"unsupported scope {scope}")
            if actual != expected:
                errors.append(f"business source binding drift: {source_id}")
        except (OSError, ValueError, runtime.RuntimeContractError) as exc:
            errors.append(f"business source binding invalid: {source_id}: {exc}")
    if not set(capability.get("evidence_refs", [])).issubset(source_ids):
        errors.append("Product Capability evidence refs do not resolve in the business ontology")

    projection = load(PACKAGE_ROOT / "domainspec/generated/system-ontology-receipt.json")
    graph = load(PACKAGE_ROOT / "domainspec/generated/graph.json")
    system_ontology = load(PACKAGE_ROOT / "domainspec/generated/system-ontology.json")
    build_receipt = load(PACKAGE_ROOT / "domainspec/generated/build-receipt.json")
    graph_digest = sha256_file(PACKAGE_ROOT / "domainspec/generated/graph.json")
    system_digest = sha256_file(PACKAGE_ROOT / "domainspec/generated/system-ontology.json")
    if (
        projection.get("deterministic_runs") != 2
        or projection.get("equal_graph_bytes") is not True
        or projection.get("equal_system_ontology_bytes") is not True
    ):
        errors.append("DomainSpec projection lacks two-run determinism evidence")
    if projection.get("source_graph_digest") != graph_digest:
        errors.append("DomainSpec projection graph digest drift")
    if projection.get("system_ontology_digest") != system_digest:
        errors.append("DomainSpec projection system-ontology digest drift")
    if build_receipt.get("source_set_digest") != graph.get("source_set_digest"):
        errors.append("DomainSpec source-set digest drift")
    if system_ontology.get("source_graph_digest") != graph_digest:
        errors.append("system ontology is not derived from the exact graph")
    if runtime.SYSTEM_ONTOLOGY_DIGEST != system_digest:
        errors.append("runtime system-ontology constant drift")

    for item, ref_field, digest_field, label in (
        (binding["product_capability"], "ref", "sha256", "Product Capability"),
        (binding["business_ontology"], "ref", "sha256", "business ontology"),
        (binding["domainspec"], "project_ref", "project_digest", "DomainSpec project"),
        (binding["domainspec"], "development_profile_ref", "profile_digest", "DomainSpec development profile"),
        (binding["domainspec"], "compiler_ref", "compiler_digest", "DomainSpec compiler"),
        (binding["domainspec"], "views_ref", "views_digest", "DomainSpec views"),
        (binding["domainspec"], "compiled_graph_ref", "compiled_graph_digest", "compiled graph"),
        (binding["domainspec"], "system_ontology_ref", "system_ontology_digest", "system ontology"),
        (binding["domainspec"], "projection_receipt_ref", "projection_receipt_digest", "projection receipt"),
        (binding["implementation"], "target_ref", "target_digest", "runtime implementation"),
    ):
        verify_binding_digest(item, ref_field, digest_field, errors, label)
    if binding["implementation"].get("system_ontology_digest") != system_digest:
        errors.append("implementation binding does not name the exact system ontology")

    definition_refs = {item.get("definition_ref") for item in binding.get("definition_bindings", [])}
    if definition_refs != {"CAV2-D63", "CAV2-D65", "CAV2-D67"}:
        errors.append("construction definition binding set is not exact")
    for item in binding.get("definition_bindings", []):
        try:
            path = REPOSITORY_ROOT / item["path"]
            actual = sha256_bytes(runtime.heading_section_bytes(path, item["selector"]))
            if actual != item.get("sha256"):
                errors.append(f"construction definition drift: {item.get('definition_ref')}")
        except (KeyError, OSError, runtime.RuntimeContractError) as exc:
            errors.append(f"construction definition invalid: {exc}")

    stages = binding.get("stages", [])
    if [item.get("name") for item in stages if isinstance(item, dict)] != STAGE_ORDER:
        errors.append("construction stages are not complete and ordered")
    expected_states = {
        "definition": "validated",
        "product_ontology": "blocked",
        "business_ontology": "not_evaluable",
        "domainspec_source": "not_evaluable",
        "compiled_graph": "not_evaluable",
        "system_ontology": "not_evaluable",
        "implementation": "not_evaluable",
        "static_conformance": "not_evaluable",
        "runtime_evidence": "not_evaluable",
    }
    for stage in stages:
        if isinstance(stage, dict) and stage.get("state") != expected_states.get(stage.get("name")):
            errors.append(f"construction stage claim inflated: {stage.get('name')}")
    if binding.get("authority_effect") != "none":
        errors.append("construction binding exceeds authority_effect none")

    snapshot_first = runtime.compile_snapshot("cav2.ontology-product")
    snapshot_second = runtime.compile_snapshot("cav2.ontology-product")
    if snapshot_first.get("status") != "PASS" or snapshot_first != snapshot_second:
        errors.append("live selector-bound snapshot is not current and deterministic")
    native = runtime.run_native_validation("cav2.ontology-product")
    if (
        native.get("status") != "BLOCK"
        or native.get("runtime_status") != "succeeded"
        or native.get("native_status") != "BLOCK"
    ):
        errors.append("native Ontology Product BLOCK was not preserved exactly")

    if conformance.get("status") != "NOT_EVALUABLE":
        errors.append("static conformance must remain NOT_EVALUABLE")
    if conformance.get("subject_digest") != sha256_file(PACKAGE_ROOT / "runtime.py"):
        errors.append("conformance subject digest drift")
    if conformance.get("system_ontology_digest") != system_digest:
        errors.append("conformance system-ontology digest drift")
    if conformance.get("test_digest") != sha256_file(PACKAGE_ROOT / "tests/test_runtime.py"):
        errors.append("conformance test digest drift")
    if conformance.get("test_result") != "PASS" or conformance.get("test_count") != 16:
        errors.append("conformance test observation is incomplete")
    required_blockers = {
        "ONTOLOGY_PRODUCT_NATIVE_VALIDATION_BLOCKED",
        "DOMAINSPEC_PROFILE_NOT_ADMITTED",
        "SYSTEM_ONTOLOGY_NOT_ADMITTED",
        "IMPLEMENTATION_BASELINE_NOT_OWNER_ACCEPTED",
        "STATIC_CONFORMANCE_NOT_ADMITTED",
    }
    if set(conformance.get("blockers", [])) != required_blockers:
        errors.append("conformance blockers are not exact")
    if conformance.get("authority_effect") != "none":
        errors.append("conformance evidence exceeds authority_effect none")

    digest = material_digest(errors)
    return result(errors, "NOT_EVALUABLE", digest, native.get("native_status"))


def result(
    errors: list[str],
    construction_status: str,
    digest: str | None,
    native_status: str | None,
) -> dict[str, Any]:
    return {
        "schema_version": "cav2-ontology-runtime-package-validation/v1",
        "status": "PASS" if not errors else "BLOCK",
        "runtime_id": "cav2.ontology-runtime",
        "material_digest": digest,
        "construction_status": construction_status,
        "registered_ontology_native_status": native_status,
        "authority_effect": "none",
        "errors": errors,
        "claim_ceiling": "Package structure and observed behavior only; construction remains NOT_EVALUABLE and no Product Capability adoption, profile or system-ontology admission, baseline acceptance, conformance, publication, release, or deployment is established.",
    }


def main() -> int:
    try:
        evaluation = validate()
    except (OSError, json.JSONDecodeError, KeyError, ValueError) as exc:
        evaluation = result([f"package validation unavailable: {exc}"], "NOT_EVALUABLE", None, None)
    print(json.dumps(evaluation, indent=2, sort_keys=True))
    return 0 if evaluation["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
