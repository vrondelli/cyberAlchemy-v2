#!/usr/bin/env python3
"""Diagnose one legacy D65 revision-1 binding without granting authority."""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator


REPOSITORY_ROOT = Path(__file__).resolve().parents[4]
GOVERNANCE_ROOT = Path(__file__).resolve().parents[1]
BINDING_PATH = GOVERNANCE_ROOT / "construction-bindings.json"
SCHEMA_PATH = GOVERNANCE_ROOT / "schemas/construction-binding.schema.json"
STAGE_ORDER = [
    "definition",
    "product_ontology",
    "business_ontology",
    "domainspec_source",
    "compiled_graph",
    "system_ontology",
    "implementation",
    "static_conformance",
    "runtime_evidence",
]


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def canonical_json_bytes(value: Any) -> bytes:
    return (json.dumps(value, sort_keys=True, separators=(",", ":")) + "\n").encode()


def heading_section_bytes(path: Path, selector: str) -> bytes:
    lines = path.read_text(encoding="utf-8").splitlines(keepends=True)
    start = next((index for index, line in enumerate(lines) if line.rstrip("\r\n") == selector), None)
    if start is None:
        raise ValueError(f"selector not found: {selector}")
    end = len(lines)
    for index in range(start + 1, len(lines)):
        if lines[index].startswith("## "):
            end = index
            break
    return "".join(lines[start:end]).encode()


def json_record_bytes(path: Path, selector: str) -> bytes:
    collection, expression = selector.split(":", 1)
    field, expected = expression.split("=", 1)
    document = load_json(path)
    records = document.get(collection)
    if not isinstance(records, list):
        raise ValueError(f"record collection not found: {collection}")
    matches = [item for item in records if isinstance(item, dict) and str(item.get(field)) == expected]
    if len(matches) != 1:
        raise ValueError(f"selector must resolve exactly one record: {selector}")
    return canonical_json_bytes(matches[0])


def selected_bytes(binding: dict[str, Any]) -> bytes:
    path = REPOSITORY_ROOT / binding["path"]
    scope = binding["scope_kind"]
    selector = binding.get("selector")
    if scope == "whole-file":
        return path.read_bytes()
    if not isinstance(selector, str):
        raise ValueError("selector is required for a selected scope")
    if scope == "heading-section":
        return heading_section_bytes(path, selector)
    if scope == "json-record":
        return json_record_bytes(path, selector)
    raise ValueError(f"unsupported scope: {scope}")


def validate_schema(instance: Any, schema: dict[str, Any], label: str, errors: list[str]) -> None:
    for violation in sorted(Draft202012Validator(schema).iter_errors(instance), key=lambda item: list(item.path)):
        location = ".".join(str(part) for part in violation.path) or "$"
        errors.append(f"{label}.{location}: {violation.message}")


def validate_product_capability(record: dict[str, Any], errors: list[str]) -> None:
    schema_path = REPOSITORY_ROOT / "cyberAlchemy-v2/capability/schemas/capability.schema.json"
    schema = copy.deepcopy(load_json(schema_path))
    schema["$defs"]["productCapability"]["properties"]["schema_ref"]["const"] = (
        "../../../capability/schemas/capability.schema.json#/$defs/productCapability"
    )
    schema["$ref"] = "#/$defs/productCapability"
    validate_schema(record, schema, "product capability", errors)

    support = load_json(GOVERNANCE_ROOT / "first-invariant/product-capability-support.json")
    support_ids = {item.get("id") for item in support.get("records", []) if isinstance(item, dict)}
    referenced = set(record.get("input_contract_refs", []))
    referenced |= set(record.get("output_contract_refs", []))
    referenced |= set(record.get("context_policy_refs", []))
    referenced |= set(record.get("realization_binding_refs", []))
    referenced.add(record.get("obligation_registry_ref"))
    missing = sorted(ref for ref in referenced if ref not in support_ids)
    if missing:
        errors.append(f"product capability support refs do not resolve: {missing}")

    product_nodes = load_json(GOVERNANCE_ROOT / "product/nodes.json").get("nodes", [])
    product_ids = {item.get("id") for item in product_nodes if isinstance(item, dict)}
    product_refs = {
        record.get("product_ref"),
        record.get("business_ontology_ref"),
        *record.get("outcome_refs", []),
        *record.get("participant_refs", []),
        *record.get("consumer_refs", []),
    }
    missing_product = sorted(ref for ref in product_refs if ref not in product_ids)
    if missing_product:
        errors.append(f"product capability business refs do not resolve: {missing_product}")


def verify_materialized_build(binding: dict[str, Any], errors: list[str]) -> None:
    command = [
        str(REPOSITORY_ROOT / "toolchains/node-typescript/bin/node-env"),
        "run",
        "--project",
        "projects/domainspec-v2/impl",
        "--",
        "node",
        "--import",
        "tsx",
        "../../../cyberAlchemy-v2/ontology/governance/first-invariant/scripts/build.ts",
        "--emit-json",
    ]
    first = subprocess.run(command, cwd=REPOSITORY_ROOT, capture_output=True, text=True, check=False)
    second = subprocess.run(command, cwd=REPOSITORY_ROOT, capture_output=True, text=True, check=False)
    if first.returncode != 0 or second.returncode != 0:
        diagnostic = (first.stderr or second.stderr).strip().splitlines()
        errors.append(f"DomainSpec build is not evaluable: {diagnostic[-1] if diagnostic else 'unknown error'}")
        return
    if first.stdout != second.stdout:
        errors.append("DomainSpec build is non-deterministic across two independent invocations")
        return
    try:
        artifacts = json.loads(first.stdout)
    except json.JSONDecodeError as exc:
        errors.append(f"DomainSpec build output is not JSON: {exc}")
        return
    generated_root = GOVERNANCE_ROOT / "first-invariant/domainspec/generated"
    for name, content in artifacts.items():
        path = generated_root / name
        if not path.is_file() or path.read_text(encoding="utf-8") != content:
            errors.append(f"generated DomainSpec artifact is stale: {name}")


def verify_dependencies(binding: dict[str, Any], errors: list[str]) -> None:
    allowed = {
        "capability-ontology": "cyberAlchemy-v2/capability/scripts/validate.py",
        "governance-product-ontology": "cyberAlchemy-v2/ontology/governance/product/scripts/validate.py",
        "governance-authority-ontology": "cyberAlchemy-v2/ontology/governance/scripts/validate.py",
    }
    records = binding.get("dependency_validations", [])
    if not isinstance(records, list) or {item.get("id") for item in records if isinstance(item, dict)} != set(allowed):
        errors.append("dependency validations must cover the exact Capability, Governance product, and Governance authority validators")
        return
    environment = dict(os.environ)
    environment["PYTHONDONTWRITEBYTECODE"] = "1"
    for record in records:
        dependency_id = record.get("id")
        expected_ref = allowed.get(dependency_id)
        if record.get("validator_ref") != expected_ref:
            errors.append(f"dependency validator route is not exact: {dependency_id}")
            continue
        completed = subprocess.run(
            [sys.executable, str(REPOSITORY_ROOT / expected_ref)],
            cwd=REPOSITORY_ROOT,
            env=environment,
            capture_output=True,
            text=True,
            check=False,
        )
        try:
            receipt = json.loads(completed.stdout)
        except json.JSONDecodeError:
            errors.append(f"dependency validator did not return JSON: {dependency_id}")
            continue
        if completed.returncode != 0 or receipt.get("status") != record.get("expected_status"):
            errors.append(f"dependency validation is not PASS: {dependency_id}")
        if receipt.get("material_digest") != record.get("expected_material_digest"):
            errors.append(f"dependency material digest drift: {dependency_id}")


def evaluate_registry(
    registry: dict[str, Any],
    *,
    verify_build: bool,
    verify_dependency_checks: bool = True,
) -> dict[str, Any]:
    errors: list[str] = []
    blockers: list[str] = ["D65_REVISION_2_EVALUATOR_NOT_IMPLEMENTED"]
    warnings: list[str] = [
        "Legacy revision-1 stage diagnostics only; this evaluator cannot prove the "
        "prototype-first chain, product approval, or authority-request eligibility."
    ]
    validate_schema(registry, load_json(SCHEMA_PATH), "construction registry", errors)

    bindings = registry.get("bindings", [])
    if not isinstance(bindings, list) or len(bindings) != 1:
        errors.append("the first invariant registry must contain exactly one non-vacuous binding")
        return result(errors, blockers, warnings, [])
    binding = bindings[0]
    if not isinstance(binding, dict):
        errors.append("construction binding must be an object")
        return result(errors, blockers, warnings, [])

    ids: set[str] = set()
    for file_binding in binding.get("file_bindings", []):
        if not isinstance(file_binding, dict):
            continue
        binding_id = str(file_binding.get("id"))
        if binding_id in ids:
            errors.append(f"duplicate file binding id: {binding_id}")
        ids.add(binding_id)
        try:
            actual = sha256_bytes(selected_bytes(file_binding))
        except (OSError, ValueError, KeyError, json.JSONDecodeError) as exc:
            errors.append(f"file binding {binding_id} is not evaluable: {exc}")
            continue
        if actual != file_binding.get("sha256"):
            errors.append(f"file binding drift: {binding_id}: expected {file_binding.get('sha256')}, got {actual}")

    product_capability_path = GOVERNANCE_ROOT / "first-invariant/product-capability.json"
    try:
        validate_product_capability(load_json(product_capability_path), errors)
    except (OSError, json.JSONDecodeError, KeyError) as exc:
        errors.append(f"product capability is not evaluable: {exc}")

    if verify_dependency_checks and not errors:
        verify_dependencies(binding, errors)

    stages = binding.get("stages", [])
    stage_names = [item.get("name") for item in stages if isinstance(item, dict)]
    if stage_names != STAGE_ORDER:
        errors.append(f"stages must preserve the exact D65 order: {STAGE_ORDER}")
    stage_by_name = {item.get("name"): item for item in stages if isinstance(item, dict)}

    domainspec = binding.get("domainspec", {})
    expected_domainspec_keys = {
        "project_ref", "development_profile_ref", "profile_id", "profile_version",
        "profile_digest", "profile_release_admission", "source_set_digest",
        "compiler_ref", "compiler_version_ref", "compiler_digest", "views_ref",
        "views_digest", "compiled_graph_ref", "compiled_graph_digest",
        "system_ontology_ref", "system_ontology_digest", "projection_receipt_ref",
    }
    if not isinstance(domainspec, dict) or set(domainspec) != expected_domainspec_keys:
        errors.append("domainspec binding does not have the exact closed field set")
        domainspec = {}
    else:
        profile = load_json(REPOSITORY_ROOT / domainspec["development_profile_ref"])
        if profile.get("handle") != "governance-d65-development-explicit-v0.1":
            errors.append("DomainSpec development profile handle is not exact")
        for field in ("profile_id", "profile_version"):
            selected = profile.get("profiles", [{}])[0]
            expected = selected.get("id" if field == "profile_id" else "version")
            if domainspec.get(field) != expected:
                errors.append(f"DomainSpec {field} is not current")
        if sha256_file(REPOSITORY_ROOT / domainspec["development_profile_ref"]) != domainspec.get("profile_digest"):
            errors.append("DomainSpec development profile digest drift")
        if profile.get("release_admission") != domainspec.get("profile_release_admission"):
            errors.append("DomainSpec profile release-admission claim is non-current")
        if profile.get("release_admission") != "granted":
            blockers.append("DOMAINSPEC_PROFILE_NOT_ADMITTED")
        expected_paths = {
            "compiler_ref": "compiler_digest",
            "views_ref": "views_digest",
            "compiled_graph_ref": "compiled_graph_digest",
            "system_ontology_ref": "system_ontology_digest",
        }
        for path_field, digest_field in expected_paths.items():
            path = REPOSITORY_ROOT / str(domainspec.get(path_field, ""))
            if not path.is_file() or sha256_file(path) != domainspec.get(digest_field):
                errors.append(f"DomainSpec exact binding drift: {path_field}")
        try:
            build_receipt = load_json(
                GOVERNANCE_ROOT / "first-invariant/domainspec/generated/build-receipt.json"
            )
            projection = load_json(REPOSITORY_ROOT / domainspec["projection_receipt_ref"])
            if build_receipt.get("source_set_digest") != domainspec.get("source_set_digest"):
                errors.append("DomainSpec source-set digest drift")
            if projection.get("deterministic_runs") != 2 or not projection.get("equal_graph_bytes") or not projection.get("equal_system_ontology_bytes"):
                errors.append("system-ontology projection lacks two-run determinism evidence")
            if projection.get("source_graph_digest") != domainspec.get("compiled_graph_digest"):
                errors.append("system-ontology projection is not bound to the exact compiled graph")
            if projection.get("system_ontology_digest") != domainspec.get("system_ontology_digest"):
                errors.append("system-ontology projection digest drift")
            if projection.get("status") != "admitted":
                blockers.append("SYSTEM_ONTOLOGY_NOT_ADMITTED")
        except (OSError, json.JSONDecodeError, KeyError) as exc:
            errors.append(f"generated DomainSpec evidence is not evaluable: {exc}")

    implementation = binding.get("implementation", {})
    expected_implementation_keys = {
        "target_ref", "target_digest", "system_ontology_ref", "system_ontology_digest",
        "realization_baseline_ref", "realization_baseline_digest",
        "owner_acceptance_ref", "conformance_ref",
    }
    if not isinstance(implementation, dict) or set(implementation) != expected_implementation_keys:
        errors.append("implementation binding does not have the exact closed field set")
        implementation = {}
    else:
        target = REPOSITORY_ROOT / str(implementation.get("target_ref", ""))
        if not target.is_file() or sha256_file(target) != implementation.get("target_digest"):
            errors.append("implementation target digest drift")
        if implementation.get("system_ontology_ref") != domainspec.get("system_ontology_ref") or implementation.get("system_ontology_digest") != domainspec.get("system_ontology_digest"):
            errors.append("implementation is not bound to the exact system ontology")
        if implementation.get("realization_baseline_ref") is None or implementation.get("owner_acceptance_ref") is None:
            blockers.append("IMPLEMENTATION_BASELINE_NOT_OWNER_ACCEPTED")
        if implementation.get("conformance_ref") is None:
            blockers.append("STATIC_CONFORMANCE_NOT_ADMITTED")

    expected_states = {
        "definition": "validated",
        "product_ontology": "validated",
        "business_ontology": "validated",
        "domainspec_source": "blocked",
        "compiled_graph": "not_evaluable",
        "system_ontology": "not_evaluable",
        "implementation": "not_evaluable",
        "static_conformance": "not_evaluable",
        "runtime_evidence": "not_evaluable",
    }
    for name, expected_state in expected_states.items():
        stage = stage_by_name.get(name, {})
        if stage.get("state") != expected_state:
            errors.append(f"stage {name} must be {expected_state!r} in the current unadmitted epoch")

    for index, name in enumerate(STAGE_ORDER):
        state = stage_by_name.get(name, {}).get("state")
        if state == "validated":
            predecessors = STAGE_ORDER[:index]
            invalid = [prior for prior in predecessors if stage_by_name.get(prior, {}).get("state") != "validated"]
            if invalid:
                errors.append(f"stage {name} skips non-validated predecessors: {invalid}")

    if verify_build and not errors:
        verify_materialized_build(binding, errors)

    if registry.get("authority_effect") != "none" or binding.get("authority_effect") != "none":
        errors.append("construction validation must preserve authority_effect none")
    return result(errors, blockers, warnings, stages)


def result(
    errors: list[str], blockers: list[str], warnings: list[str], stages: list[dict[str, Any]]
) -> dict[str, Any]:
    status = "BLOCK" if errors else "NOT_EVALUABLE" if blockers else "PASS"
    return {
        "schema_version": "cav2-governance-d65-evaluation/v1",
        "status": status,
        "invariant_ref": "CAV2-D65",
        "rule_ref": "GOV-RULE-D65-CONSTRUCTION-STAGES-COMPLETE",
        "authority_effect": "none",
        "stage_states": {item.get("name"): item.get("state") for item in stages if isinstance(item, dict)},
        "blockers": sorted(set(blockers)),
        "errors": errors,
        "warnings": warnings,
        "claim_ceiling": "Legacy revision-1 diagnostic assessment only. It cannot prove CAV2-D65 revision 2, product approval, authority-request eligibility, profile or system-ontology admission, implementation acceptance, repository-wide conformance, Constitution activation, enforcement, publication, release, deployment, or external effect.",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--verify-build",
        action="store_true",
        help="Replay the pinned DomainSpec compiler when its container runtime is visible.",
    )
    args = parser.parse_args()
    try:
        registry = load_json(BINDING_PATH)
        evaluation = evaluate_registry(
            registry,
            verify_build=args.verify_build,
            verify_dependency_checks=True,
        )
    except (OSError, json.JSONDecodeError) as exc:
        evaluation = result([f"construction registry unavailable: {exc}"], [], [], [])
    print(json.dumps(evaluation, indent=2, sort_keys=True))
    return 0 if evaluation["status"] == "PASS" else 2


if __name__ == "__main__":
    sys.exit(main())
