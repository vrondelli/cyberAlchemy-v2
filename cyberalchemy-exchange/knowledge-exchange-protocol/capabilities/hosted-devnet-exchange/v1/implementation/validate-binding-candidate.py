#!/usr/bin/env python3
"""Validate the immutable hosted implementation-binding candidate."""

from __future__ import annotations

import hashlib
import json
import subprocess
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
VERTICAL = ROOT.parent
BINDING_SHA256 = "50a0e5ce9cbc811c8e9d5249b28ae0c1bb4b19824d27a8b4adce7dd7afd2bf92"
MATERIAL_SHA256 = "e96a517ca08db35294010db5002a02ae8ccc37e1d2b0d14bc834cc2eca92795f"
SYSTEM_ADMISSION_SHA256 = "7b16adbccae027686cc7316699c9a45985e0fdc0fba628063c85d10f358b5677"
SYSTEM_CANDIDATE_SHA256 = "37b5b8531e13058bc39a61ee7572ea3059376cd54851f9717f19e02de2359aa4"
SYSTEM_SET_DIGEST = "8aa30019a659b5131c9f524e7bcdb3b7679b7ea5712e3e8e6ebd28a46d281c1f"


def load(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"{path} must contain one object")
    return value


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def validate() -> tuple[list[str], dict[str, int]]:
    errors: list[str] = []
    candidate = load(ROOT / "implementation-binding-candidate.json")
    binding = load(ROOT / "implementation-binding.json")
    admission_path = VERTICAL / "decisions/system-ontology-admission-001.json"
    admission = load(admission_path)
    graph = load(VERTICAL / "domainspec/generated/compiled-graph.json")
    system = load(VERTICAL / "domainspec/generated/system-ontology.json")

    if sha(ROOT / "implementation-binding.json") != BINDING_SHA256:
        errors.append("implementation binding record digest drift")
    if candidate.get("binding_record", {}).get("sha256") != BINDING_SHA256:
        errors.append("candidate binding-record digest drift")
    if binding.get("implementation_material_sha256") != MATERIAL_SHA256:
        errors.append("implementation material digest drift")
    if candidate.get("implementation_material", {}).get("sha256") != MATERIAL_SHA256:
        errors.append("candidate implementation material digest drift")

    current = subprocess.run(
        ["python3", str(ROOT / "author_binding.py"), "--check"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
        env={"PYTHONDONTWRITEBYTECODE": "1"},
    )
    if current.returncode != 0:
        errors.append("implementation binding is not current")

    if sha(admission_path) != SYSTEM_ADMISSION_SHA256:
        errors.append("system ontology admission decision digest drift")
    admitted = admission.get("admission", {})
    if admitted.get("lifecycle_status") != "admitted":
        errors.append("system ontology predecessor is not admitted")
    if admitted.get("admitted_candidate_sha256") != SYSTEM_CANDIDATE_SHA256:
        errors.append("admitted system ontology candidate digest drift")
    if admitted.get("admitted_candidate_set_digest") != SYSTEM_SET_DIGEST:
        errors.append("admitted system ontology candidate-set digest drift")
    bound_admission = binding.get("system_ontology_admission", {})
    if bound_admission.get("sha256") != SYSTEM_ADMISSION_SHA256:
        errors.append("binding does not reference exact system ontology admission")

    file_paths = {item.get("path") for item in binding.get("files", [])}
    for item in binding.get("files", []):
        path = ROOT / str(item.get("path"))
        if not path.is_file() or item.get("sha256") != sha(path):
            errors.append(f"bound implementation file drift: {item.get('path')}")
    repository = ROOT.parents[6]
    for item in binding.get("source_assets", []):
        path = repository / str(item.get("path"))
        if not path.is_file() or item.get("sha256") != sha(path):
            errors.append(f"bound source asset drift: {item.get('path')}")

    selectors = binding.get("selector_bindings", {})
    node_items = selectors.get("graph_nodes", [])
    edge_items = selectors.get("graph_edges", [])
    constraint_items = selectors.get("runtime_constraints", [])
    expected_nodes = {item.get("node_id") for item in graph.get("nodes", [])}
    expected_edges = {item.get("edge_id") for item in graph.get("edges", [])}
    expected_constraints = set(system.get("runtime_constraints", []))
    if {item.get("selector") for item in node_items} != expected_nodes:
        errors.append("graph node selector binding closure drift")
    if {item.get("selector") for item in edge_items} != expected_edges:
        errors.append("graph edge selector binding closure drift")
    if {item.get("selector") for item in constraint_items} != expected_constraints:
        errors.append("runtime constraint selector binding closure drift")
    for group in (node_items, edge_items, constraint_items):
        for item in group:
            paths = item.get("implementation_paths", [])
            if not paths or not set(paths) <= file_paths:
                errors.append(f"selector has empty or unbound implementation paths: {item.get('selector')}")

    counts = {
        "files": len(binding.get("files", [])),
        "source_assets": len(binding.get("source_assets", [])),
        "graph_node_selectors": len(node_items),
        "graph_edge_selectors": len(edge_items),
        "runtime_constraint_selectors": len(constraint_items),
        "selector_bindings_total": len(node_items) + len(edge_items) + len(constraint_items),
    }
    expected_counts = candidate.get("ontology_bindings", {})
    for key in ("graph_node_selectors", "graph_edge_selectors", "runtime_constraint_selectors", "selector_bindings_total"):
        if expected_counts.get(key) != counts[key]:
            errors.append(f"candidate selector count drift: {key}")
    material = candidate.get("implementation_material", {})
    if material.get("file_count") != counts["files"] or material.get("source_asset_count") != counts["source_assets"]:
        errors.append("candidate material count drift")
    if candidate.get("acceptance_status") != "not-requested":
        errors.append("implementation binding candidate may not self-accept")
    if candidate.get("successor_authorization") != "none":
        errors.append("implementation binding candidate grants successor authority")
    return errors, counts


if __name__ == "__main__":
    failures, counts = validate()
    result = {
        "result": "PASS" if not failures else "BLOCK",
        "candidate_id": "CA2-CANDIDATE-KEP-HOSTED-DEVNET-IMPLEMENTATION-BINDING-001",
        "candidate_sha256": sha(ROOT / "implementation-binding-candidate.json"),
        "binding_record_sha256": BINDING_SHA256,
        "implementation_material_sha256": MATERIAL_SHA256,
        "system_ontology_admission_sha256": SYSTEM_ADMISSION_SHA256,
        "counts": counts,
        "acceptance_status": "not-requested",
        "conformance": "not_evaluable",
        "authority_effect": "none",
        "external_effect": "none",
        "errors": failures,
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    raise SystemExit(1 if failures else 0)
