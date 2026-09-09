#!/usr/bin/env python3
"""Validate Registry Context v2 meaning, graph, sources, schema, and runtime."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import subprocess
import sys
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
SCHEMA_PATH = PACKAGE_ROOT / "schemas/registry-context.schema.json"
RUNTIME_PATH = PACKAGE_ROOT / "scripts/registry_context_cli.py"

MATERIAL_FILES = (
    "README.md", "profile.json", "definitions.json", "nodes.json",
    "relations.json", "product-ontology.json", "business-ontology.json",
    "registry.json", "residue.json", "migration.json",
    "examples/registry-context-project.request.json",
    "schemas/registry-context.schema.json",
    "domainspec-project/project.json",
    "domainspec-project/development-profile-source.json",
    "domainspec-project/development-profile.json",
    "domainspec-project/specs/registry-context-runtime/feature.json",
    "domainspec-project/specs/registry-context-runtime/nodes/registered-context.json",
    "domainspec-project/specs/registry-context-runtime/nodes/registry-context-integrity-policy.json",
    "domainspec-project/specs/registry-context-runtime/nodes/registry-context-request.json",
    "domainspec-project/specs/registry-context-runtime/nodes/registry-context-resolver-interface.json",
    "domainspec-project/specs/registry-context-runtime/nodes/registry-context-view.json",
    "domainspec-project/specs/registry-context-runtime/nodes/resolve-registry-context.json",
    "domainspec-project/.domainspec/generated/graph.json",
    "domainspec-project/.domainspec/generated/source-manifest.json",
    "domainspec-project/.domainspec/generated/SPEC.md",
    "domainspec-project/.domainspec/generated/markdown-view.json",
    "domainspec-project/.domainspec/generated/build-receipt.json",
    "system-ontology/BRIDGE.json", "system-ontology/NODES.json",
    "system-ontology/RELATIONS.json", "system-ontology/PROFILE.json",
    "scripts/compile-domainspec.ts", "scripts/registry_context_cli.py",
    "scripts/validate.py", "tests/test_runtime.py",
)

CLAIM_CEILING = (
    "Candidate product/business ontology, deterministic DomainSpec v2 "
    "development-profile projection, and one local read-only prototype only; "
    "no canonical Registry Context promotion, DomainSpec release admission, "
    "runtime adoption, publication, release, deployment, or external effect."
)


def canonical_bytes(value: Any) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load(relative: str, errors: list[str]) -> dict[str, Any]:
    path = PACKAGE_ROOT / relative
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"cannot load {relative}: {exc}")
        return {}
    if not isinstance(value, dict):
        errors.append(f"{relative} must contain one JSON object")
        return {}
    return value


def validate_instance(
    schema: dict[str, Any], definition: str, instance: dict[str, Any],
    label: str, errors: list[str],
) -> None:
    validation_schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$defs": schema["$defs"],
        "$ref": f"#/$defs/{definition}",
    }
    validator = Draft202012Validator(validation_schema)
    for violation in sorted(validator.iter_errors(instance), key=lambda item: list(item.path)):
        locator = ".".join(str(part) for part in violation.path)
        errors.append(f"{label}{'.' + locator if locator else ''}: {violation.message}")


def material_sha(errors: list[str]) -> str:
    state = hashlib.sha256()
    for relative in sorted(MATERIAL_FILES):
        path = PACKAGE_ROOT / relative
        if not path.is_file():
            errors.append(f"missing material file: {relative}")
            continue
        state.update(relative.encode())
        state.update(b"\0")
        state.update(path.read_bytes())
        state.update(b"\0")
    return state.hexdigest()


def main() -> int:
    errors: list[str] = []
    warnings: list[str] = []
    checks: list[str] = []

    schema = load("schemas/registry-context.schema.json", errors)
    try:
        Draft202012Validator.check_schema(schema)
        checks.append("Draft 2020-12 schema is structurally valid")
    except Exception as exc:  # jsonschema emits several specific schema exceptions
        errors.append(f"schema is invalid: {exc}")

    documents = {
        "profile": ("profile.json", "profile"),
        "definitions": ("definitions.json", "definitionRegistry"),
        "nodes": ("nodes.json", "nodeRegistry"),
        "relations": ("relations.json", "relationRegistry"),
        "product": ("product-ontology.json", "ontologyView"),
        "business": ("business-ontology.json", "ontologyView"),
        "residue": ("residue.json", "residueRegistry"),
        "bridge": ("system-ontology/BRIDGE.json", "systemBridge"),
        "registry": ("registry.json", "registry"),
        "request": ("examples/registry-context-project.request.json", "request"),
        "migration": ("migration.json", "migration"),
    }
    loaded: dict[str, dict[str, Any]] = {}
    for name, (relative, definition) in documents.items():
        instance = load(relative, errors)
        loaded[name] = instance
        if schema and instance:
            validate_instance(schema, definition, instance, relative, errors)
    if not errors:
        checks.append("eleven agent-facing JSON artifacts validate against closed schemas")

    nodes = loaded.get("nodes", {}).get("nodes", [])
    node_ids = [item.get("id") for item in nodes if isinstance(item, dict)]
    if len(node_ids) != len(set(node_ids)):
        errors.append("node IDs must be unique")
    relations = loaded.get("relations", {}).get("relations", [])
    relation_ids = [item.get("id") for item in relations if isinstance(item, dict)]
    if len(relation_ids) != len(set(relation_ids)):
        errors.append("relation IDs must be unique")
    for relation in relations:
        if relation.get("source") not in node_ids or relation.get("target") not in node_ids:
            errors.append(f"relation endpoint is unknown: {relation.get('id')}")
    for view_name in ("product", "business"):
        view = loaded.get(view_name, {})
        for ref in view.get("node_refs", []):
            if ref not in node_ids:
                errors.append(f"{view_name} ontology uses unknown node: {ref}")
        for ref in view.get("relation_refs", []):
            if ref not in relation_ids:
                errors.append(f"{view_name} ontology uses unknown relation: {ref}")
    if not any("Context is not" in item.get("forbidden_collapse", "") for item in loaded.get("definitions", {}).get("definitions", [])):
        errors.append("Registry Context definition must preserve Context non-collapse boundaries")
    checks.append("ontology node, relation, view, and Context non-collapse closure checked")

    registry = loaded.get("registry", {})
    selection_ids = [item.get("selection_id") for item in registry.get("selections", [])]
    if len(selection_ids) != len(set(selection_ids)):
        errors.append("registered selection IDs must be unique")
    for selection in registry.get("selections", []):
        raw_path = selection.get("path", "")
        relative = Path(raw_path)
        if relative.is_absolute() or ".." in relative.parts or not raw_path.startswith("cyberAlchemy-v2/"):
            errors.append(f"unbounded registered path: {raw_path}")
            continue
        source_path = REPOSITORY_ROOT / relative
        try:
            raw = source_path.read_bytes()
            content = json.loads(raw)
        except (OSError, json.JSONDecodeError) as exc:
            errors.append(f"cannot read registered selection {selection.get('selection_id')}: {exc}")
            continue
        if sha256(raw) != selection.get("expected_file_sha256"):
            errors.append(f"registered file digest drift: {selection.get('selection_id')}")
        if sha256(canonical_bytes(content)) != selection.get("expected_selection_sha256"):
            errors.append(f"registered selection digest drift: {selection.get('selection_id')}")
    for context in registry.get("contexts", []):
        if not set(context.get("allowed_selection_ids", [])).issubset(set(selection_ids)):
            errors.append(f"Context allows unknown selection IDs: {context.get('context_ref')}")
        context_path = REPOSITORY_ROOT / context.get("context_path", "")
        try:
            context_value = json.loads(context_path.read_text(encoding="utf-8"))
            current = sha256(canonical_bytes(context_value))
            if current != context.get("expected_context_sha256"):
                errors.append(f"registered Context digest drift: {context.get('context_ref')}")
        except (OSError, json.JSONDecodeError) as exc:
            errors.append(f"cannot load registered Context: {exc}")
    checks.append("registered Context and selection source currency checked fail-closed")

    migration = loaded.get("migration", {})
    for item in migration.get("v1_inventory", []):
        path = PACKAGE_ROOT / "compat/v1" / item.get("path", "")
        if not path.is_file() or sha256(path.read_bytes()) != item.get("sha256"):
            errors.append(f"v1 compatibility byte drift: {item.get('path')}")
    checks.append("v1 compatibility inventory bytes checked")

    graph = load("domainspec-project/.domainspec/generated/graph.json", errors)
    source_manifest = load("domainspec-project/.domainspec/generated/source-manifest.json", errors)
    build_receipt = load("domainspec-project/.domainspec/generated/build-receipt.json", errors)
    system_nodes = load("system-ontology/NODES.json", errors)
    system_relations = load("system-ontology/RELATIONS.json", errors)
    system_profile = load("system-ontology/PROFILE.json", errors)
    bridge = loaded.get("bridge", {})
    generated_root = PACKAGE_ROOT / "domainspec-project/.domainspec/generated"
    domainspec_source_root = PACKAGE_ROOT / "domainspec-project"
    graph_sha = sha256((generated_root / "graph.json").read_bytes())
    source_manifest_sha = sha256((generated_root / "source-manifest.json").read_bytes())
    markdown_view_sha = sha256((generated_root / "markdown-view.json").read_bytes())
    markdown_content_sha = sha256((generated_root / "SPEC.md").read_bytes())
    build_receipt_sha = sha256((generated_root / "build-receipt.json").read_bytes())
    development_profile_sha = sha256((PACKAGE_ROOT / "domainspec-project/development-profile.json").read_bytes())
    compiler_sha = sha256((PACKAGE_ROOT / "scripts/compile-domainspec.ts").read_bytes())
    if system_profile.get("compiled_graph_digest") != graph_sha:
        errors.append("system ontology graph digest does not match generated DomainSpec graph")
    if graph.get("language", {}).get("profile_digest") != development_profile_sha:
        errors.append("DomainSpec graph profile digest does not bind the explicit Registry Context development profile")
    if system_profile.get("domainspec_conformance") != "development-profile-build-pass-release-admission-not-granted":
        errors.append("system ontology must preserve DomainSpec no-release-admission posture")
    if system_profile.get("implementation_state") != "local-read-only-prototype-implemented-not-adopted":
        errors.append("system ontology implementation state must match the local prototype without implying adoption")
    if system_profile.get("compiler_digest") != compiler_sha:
        errors.append("system ontology compiler digest drift")
    if system_profile.get("domainspec_build_receipt_digest") != build_receipt_sha:
        errors.append("system ontology build receipt digest drift")
    if not (
        graph.get("source_set_digest")
        == source_manifest.get("source_set_digest")
        == build_receipt.get("source_set_digest")
        == system_profile.get("source_set_digest")
    ):
        errors.append("DomainSpec source-set digest does not close across graph, manifest, receipt, and system profile")
    receipt_artifacts = build_receipt.get("artifacts", {})
    expected_artifact_digests = {
        "graph_digest": graph_sha,
        "source_manifest_digest": source_manifest_sha,
        "markdown_view_digest": markdown_view_sha,
        "markdown_content_digest": markdown_content_sha,
    }
    for field, expected in expected_artifact_digests.items():
        if receipt_artifacts.get(field) != expected:
            errors.append(f"DomainSpec build receipt {field} drift")
    if build_receipt.get("status") != "pass" or build_receipt.get("authority") != "generated-verification-evidence":
        errors.append("DomainSpec build receipt posture is invalid")
    for source in source_manifest.get("inputs", []):
        relative = Path(source.get("path", ""))
        if relative.is_absolute() or ".." in relative.parts:
            errors.append(f"DomainSpec source manifest path is unbounded: {relative}")
            continue
        source_path = domainspec_source_root / relative
        if not source_path.is_file() or sha256(source_path.read_bytes()) != source.get("digest"):
            errors.append(f"DomainSpec source manifest input drift: {relative}")
    expected_system_nodes = [{**item, "authority_effect": "none"} for item in graph.get("nodes", [])]
    expected_system_relations = [{**item, "authority_effect": "none"} for item in graph.get("edges", [])]
    if system_nodes.get("source_graph_digest") != graph_sha or system_nodes.get("nodes") != expected_system_nodes:
        errors.append("system NODES projection does not exactly match the DomainSpec graph")
    if system_relations.get("source_graph_digest") != graph_sha or system_relations.get("relations") != expected_system_relations:
        errors.append("system RELATIONS projection does not exactly match the DomainSpec graph")
    graph_node_ids = {item.get("node_id") for item in graph.get("nodes", [])}
    for mapping in bridge.get("mappings", []):
        if mapping.get("business_ref") not in node_ids:
            errors.append(f"system bridge uses unknown business node: {mapping.get('business_ref')}")
        if mapping.get("system_ref") not in graph_node_ids:
            errors.append(f"system bridge uses unknown DomainSpec node: {mapping.get('system_ref')}")
    checks.append("DomainSpec source manifest, build receipt, compiler, graph, and exact system projections checked")

    runtime_source = RUNTIME_PATH.read_text(encoding="utf-8")
    forbidden_imports = ("import socket", "import sqlite", "import requests", "import urllib", "import subprocess")
    for forbidden in forbidden_imports:
        if forbidden in runtime_source:
            errors.append(f"runtime includes forbidden mechanism: {forbidden}")
    checks.append("runtime mechanism ceiling checked")

    spec = importlib.util.spec_from_file_location("registry_context_cli", RUNTIME_PATH)
    assert spec and spec.loader
    runtime = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(runtime)
    request = loaded.get("request", {})
    try:
        first = runtime.resolve(request)
        second = runtime.resolve(request)
        if canonical_bytes(first) != canonical_bytes(second):
            errors.append("two identical resolutions are not deterministic")
        if schema:
            validate_instance(schema, "view", first, "runtime view", errors)
    except Exception as exc:
        errors.append(f"runtime example did not resolve: {exc}")
        first = {}
    checks.append("runtime example resolved twice deterministically and View schema checked")

    test_run = subprocess.run(
        [sys.executable, str(PACKAGE_ROOT / "tests/test_runtime.py")],
        check=False, capture_output=True, text=True,
    )
    if test_run.returncode != 0:
        errors.append(f"runtime hostile tests failed: {test_run.stdout}{test_run.stderr}")
    else:
        checks.append("runtime hostile inputs and exit codes passed")

    for path in PACKAGE_ROOT.rglob("*"):
        if path.is_file() and "compat/v1" not in path.as_posix():
            data = path.read_bytes()
            if any(line.endswith((b" ", b"\t")) for line in data.splitlines()):
                errors.append(f"trailing whitespace: {path.relative_to(PACKAGE_ROOT)}")

    result = {
        "schema_ref": "schemas/registry-context.schema.json#/$defs/validationReceipt",
        "schema_version": "cav2-registry-context-validation/v2",
        "status": "PASS" if not errors else "BLOCK",
        "package_root": "cyberAlchemy-v2/registry-context",
        "counts": {
            "nodes": len(node_ids), "relations": len(relation_ids),
            "contexts": len(registry.get("contexts", [])),
            "registered_selections": len(selection_ids),
            "residue": len(loaded.get("residue", {}).get("residue", [])),
            "compatibility_files": len(migration.get("v1_inventory", [])),
            "domainspec_nodes": len(graph.get("nodes", [])),
            "domainspec_edges": len(graph.get("edges", [])),
            "runtime_records": len(first.get("selected_records", [])),
        },
        "material_sha256": material_sha(errors),
        "checks": checks,
        "warnings": warnings,
        "errors": errors,
        "authority_effect": "none",
        "claim_ceiling": CLAIM_CEILING,
    }
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
