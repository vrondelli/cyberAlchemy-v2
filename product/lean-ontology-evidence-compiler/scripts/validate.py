#!/usr/bin/env python3
"""Replay the complete local LOEC candidate chain without granting authority."""

from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from pathlib import Path
from typing import Any


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = PACKAGE_ROOT.parents[2]
IMPLEMENTATION_ROOT = PACKAGE_ROOT / "implementation"
EXPECTED_CAPABILITY = "CA2-CAP-COMPILE-LEAN-ONTOLOGY-EVIDENCE"
EXPECTED_BINDING = "CA2-CAP-BIND-LEAN-ONTOLOGY-EVIDENCE-CANDIDATE"
EXPECTED_SYSTEM_ONTOLOGY = "cav2.lean-ontology-evidence-compiler.system.v1"
EXPECTED_COMMIT = "169d4a46aeaafba62c8bad127fc0522c3223e962"
EXPECTED_GRAPH_DIGEST = "69641073ff96d5a3d58c265e2cc6e132749dcc206474306537c051dc664db16a"


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


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(command: list[str], errors: list[str], label: str) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(
        command,
        cwd=REPOSITORY_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        detail = (result.stderr or result.stdout).strip()
        errors.append(f"{label} failed ({result.returncode}): {detail}")
    return result


def check_authority(value: Any, label: str, errors: list[str]) -> None:
    if isinstance(value, dict):
        if "authority_effect" in value and value["authority_effect"] != "none":
            errors.append(f"{label} exceeds authority ceiling")
        for key, child in value.items():
            check_authority(child, f"{label}.{key}", errors)
    elif isinstance(value, list):
        for index, child in enumerate(value):
            check_authority(child, f"{label}[{index}]", errors)


def validate() -> dict[str, Any]:
    errors: list[str] = []
    checks: list[dict[str, Any]] = []

    profile = load("profile.json", errors)
    definitions = load("definitions/DEFINITION-PACK.v1-candidate.json", errors)
    capability = load("product-capability.json", errors)
    business_profile = load("business-ontology/PROFILE.json", errors)
    business_sources = load("business-ontology/SOURCES.json", errors)
    business_nodes = load("business-ontology/NODES.json", errors)
    business_relations = load("business-ontology/RELATIONS.json", errors)
    business_invariants = load("business-ontology/INVARIANTS.json", errors)
    system_profile = load("system-ontology/PROFILE.json", errors)
    system_nodes = load("system-ontology/NODES.json", errors)
    system_relations = load("system-ontology/RELATIONS.json", errors)
    bridge = load("system-ontology/BRIDGE.json", errors)
    graph = load("domainspec-project/.domainspec/generated/graph.json", errors)
    receipt = load("domainspec-project/.domainspec/generated/build-receipt.json", errors)
    binding = load("implementation/BINDING.json", errors)
    manifest = load("implementation/IMPLEMENTATION-MANIFEST.json", errors)
    assessment = load("conformance/assessment.json", errors)

    if profile.get("capability_ref") != EXPECTED_CAPABILITY:
        errors.append("profile capability reference changed")
    if profile.get("source_commit") != EXPECTED_COMMIT:
        errors.append("profile source commit changed")
    if definitions.get("status") != "candidate":
        errors.append("definition pack must remain candidate")
    if capability.get("capability_id") != EXPECTED_CAPABILITY:
        errors.append("Product Capability identity changed")
    if capability.get("lifecycle_posture", {}).get("commitment", {}).get("value") != "not-adopted":
        errors.append("Product Capability must remain not adopted")
    if business_profile.get("status") != "candidate-not-admitted":
        errors.append("business ontology must remain candidate-not-admitted")
    if system_profile.get("status") != "candidate-not-admitted":
        errors.append("system ontology must remain candidate-not-admitted")
    if binding.get("binding_id") != EXPECTED_BINDING:
        errors.append("implementation binding identity changed")
    if binding.get("system_ontology_ref") != EXPECTED_SYSTEM_ONTOLOGY:
        errors.append("implementation binding targets the wrong system ontology")
    if binding.get("status") != "candidate-self-validated-not-accepted":
        errors.append("implementation binding must remain unaccepted")
    if assessment.get("assessment_result") != "pass-bounded-local-static-evidence":
        errors.append("conformance assessment exceeds or misses the bounded result")

    for label, value in (
        ("profile", profile), ("definitions", definitions), ("capability", capability),
        ("business profile", business_profile), ("business sources", business_sources),
        ("business nodes", business_nodes), ("business relations", business_relations),
        ("business invariants", business_invariants), ("system profile", system_profile),
        ("system nodes", system_nodes), ("system relations", system_relations),
        ("bridge", bridge), ("binding", binding), ("implementation manifest", manifest),
        ("assessment", assessment),
    ):
        check_authority(value, label, errors)

    source_by_id = {item.get("source_id"): item for item in business_sources.get("sources", [])}
    for source_id, source in source_by_id.items():
        path = REPOSITORY_ROOT / str(source.get("path", ""))
        if not path.is_file():
            errors.append(f"selected source missing: {source_id}")
        elif sha256(path) != source.get("sha256"):
            errors.append(f"selected source digest mismatch: {source_id}")
    selected_source_ids = {item.get("source_id") for item in business_sources.get("selections", [])}
    missing_source_ids = sorted(selected_source_ids - set(source_by_id))
    if missing_source_ids:
        errors.append(f"selections reference missing sources: {', '.join(missing_source_ids)}")

    business_node_ids = {item.get("id") for item in business_nodes.get("nodes", [])}
    for relation in business_relations.get("relations", []):
        for endpoint in ("source", "target"):
            if relation.get(endpoint) not in business_node_ids:
                errors.append(f"business relation {relation.get('id')} has missing {endpoint}")
    checks.append({"check": "business-ontology-closure", "nodes": len(business_node_ids), "relations": len(business_relations.get("relations", []))})

    graph_path = PACKAGE_ROOT / "domainspec-project/.domainspec/generated/graph.json"
    graph_digest = sha256(graph_path) if graph_path.is_file() else ""
    if graph_digest != EXPECTED_GRAPH_DIGEST:
        errors.append("generated graph digest changed")
    if receipt.get("artifacts", {}).get("graph_digest") != graph_digest:
        errors.append("build receipt graph digest mismatch")
    if system_profile.get("compiled_graph_digest") != graph_digest:
        errors.append("system profile graph digest mismatch")
    for registry, kind in ((system_nodes, "nodes"), (system_relations, "relations")):
        if registry.get("source_graph_digest") != graph_digest:
            errors.append(f"system {kind} source graph digest mismatch")
    graph_node_ids = {item.get("node_id") for item in graph.get("nodes", [])}
    for edge in graph.get("edges", []):
        if edge.get("from") not in graph_node_ids or edge.get("to") not in graph_node_ids:
            errors.append(f"compiled edge {edge.get('edge_id')} is not closed")
    checks.append({"check": "compiled-graph", "digest": graph_digest, "nodes": len(graph_node_ids), "relations": len(graph.get("edges", []))})

    for group_name in ("files", "selected_dependency_digests"):
        for item in manifest.get(group_name, []):
            path = (IMPLEMENTATION_ROOT / str(item.get("path", ""))).resolve()
            try:
                path.relative_to(REPOSITORY_ROOT.resolve())
            except ValueError:
                errors.append(f"manifest path escapes repository: {item.get('path')}")
                continue
            if not path.is_file():
                errors.append(f"manifest file missing: {item.get('path')}")
            elif sha256(path) != item.get("sha256"):
                errors.append(f"manifest digest mismatch: {item.get('path')}")
    checks.append({"check": "implementation-manifest", "files": len(manifest.get("files", [])), "selected_dependencies": len(manifest.get("selected_dependency_digests", []))})

    compile_result = run([
        str(REPOSITORY_ROOT / "toolchains/node-typescript/bin/node-env"), "run",
        "--project", "projects/domainspec-v2/impl", "--", "node", "--import", "tsx",
        "../../../cyberAlchemy-v2/product/lean-ontology-evidence-compiler/scripts/compile-domainspec.ts",
        "--check",
    ], errors, "DomainSpec deterministic check")
    checks.append({"check": "domainspec-check", "result": "pass" if compile_result.returncode == 0 else "fail"})

    unit_result = run([
        sys.executable, "-m", "unittest", "discover",
        "cyberAlchemy-v2/product/lean-ontology-evidence-compiler/implementation/tests", "-v",
    ], errors, "implementation unit tests")
    checks.append({"check": "implementation-unit-tests", "result": "pass" if unit_result.returncode == 0 else "fail", "tests": 8})

    fixtures = sorted((IMPLEMENTATION_ROOT / "fixtures").glob("*.json"))
    positive_count = 0
    negative_count = 0
    for fixture in fixtures:
        result = subprocess.run(
            [sys.executable, str(IMPLEMENTATION_ROOT / "validate_typed_edge.py"), str(fixture)],
            cwd=REPOSITORY_ROOT, capture_output=True, text=True, check=False,
        )
        try:
            payload = json.loads(result.stdout)
        except json.JSONDecodeError:
            errors.append(f"fixture emitted invalid JSON: {fixture.name}")
            continue
        if fixture.name == "positive.json":
            positive_count += 1
            if result.returncode != 0 or payload.get("status") != "reviewable-candidate-evidence":
                errors.append("positive fixture did not produce reviewable candidate evidence")
            if payload.get("resolved_selectors") != [
                "SpecificationOntology.Edge.WellTyped",
                "SpecificationOntology.Independence.reversed_formalizes_edge_not_well_typed",
            ]:
                errors.append("positive fixture resolved the wrong Lean declarations")
        else:
            negative_count += 1
            if result.returncode == 0 or payload.get("status") != "rejected":
                errors.append(f"negative fixture did not reject: {fixture.name}")
    if positive_count != 1 or negative_count != 6:
        errors.append(f"fixture inventory changed: positive={positive_count}, negative={negative_count}")
    checks.append({"check": "persisted-fixtures", "positive": positive_count, "negative": negative_count})

    return {
        "schema_version": "cav2-loec-package-validation-result/v1",
        "status": "pass" if not errors else "fail",
        "checks": checks,
        "errors": errors,
        "claim_limit": "Local deterministic candidate validation only; no acceptance, admission, semantic conformance, publication, release, deployment, or external effect.",
        "authority_effect": "none",
    }


def main() -> int:
    result = validate()
    print(json.dumps(result, ensure_ascii=False, sort_keys=True, separators=(",", ":")))
    return 0 if result["status"] == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main())
