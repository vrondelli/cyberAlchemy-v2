#!/usr/bin/env python3
"""Validate replacement hosted implementation-binding candidate 005."""

from __future__ import annotations

import hashlib
import json
import os
import subprocess
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
VERTICAL = ROOT.parent
REPOSITORY = ROOT.parents[6]
SNAPSHOT_SHA256 = "544429b5ed32e9a433d09b52b262338780271a23eaab3ed477508aa3fa846c00"
MATERIAL_SHA256 = "a168eb6f68e56e0a35c571099a5ee987811e3c01d5ff447bb2d1641e39b52490"
SYSTEM_ADMISSION_SHA256 = "7b16adbccae027686cc7316699c9a45985e0fdc0fba628063c85d10f358b5677"
HISTORICAL_ACCEPTANCE_SHA256 = "993d8bb23435a0fe568b602f71f3988a2cf642ed5b529097499ca83f01991748"
DRIFT_ASSESSMENT_SHA256 = "be6664cb7246c287c9702b24a385ffe357b1dc0ada18e024dfb7b6638d4c06aa"


def load(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"{path} must contain one object")
    return value


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def material_digest(binding: dict[str, Any], errors: list[str]) -> str:
    digest = hashlib.sha256()
    for item in binding.get("files", []):
        relative = item.get("path")
        path = ROOT / str(relative)
        if not path.is_file():
            errors.append(f"missing implementation file: {relative}")
            continue
        value = path.read_bytes()
        actual = hashlib.sha256(value).hexdigest()
        if item.get("sha256") != actual:
            errors.append(f"implementation file digest drift: {relative}")
        digest.update(str(relative).encode())
        digest.update(b"\0")
        digest.update(value)
        digest.update(b"\0")
    for item in binding.get("source_assets", []):
        relative = item.get("path")
        path = REPOSITORY / str(relative)
        if not path.is_file():
            errors.append(f"missing source asset: {relative}")
            continue
        value = path.read_bytes()
        actual = hashlib.sha256(value).hexdigest()
        if item.get("sha256") != actual:
            errors.append(f"source asset digest drift: {relative}")
        digest.update(b"source-asset\0")
        digest.update(str(relative).encode())
        digest.update(b"\0")
        digest.update(value)
        digest.update(b"\0")
    return digest.hexdigest()


def validate() -> tuple[list[str], dict[str, int], str]:
    errors: list[str] = []
    candidate_path = ROOT / "implementation-binding-candidate-005.json"
    snapshot_path = ROOT / "implementation-binding-record-005.json"
    live_path = ROOT / "implementation-binding.json"
    system_admission_path = VERTICAL / "decisions/system-ontology-admission-001.json"
    historical_acceptance_path = VERTICAL / "decisions/implementation-binding-acceptance-001.json"
    drift_assessment_path = VERTICAL / "evidence/conformance-assessment.json"
    graph_path = VERTICAL / "domainspec/generated/compiled-graph.json"
    system_path = VERTICAL / "domainspec/generated/system-ontology.json"

    candidate = load(candidate_path)
    snapshot = load(snapshot_path)
    system_admission = load(system_admission_path)
    historical_acceptance = load(historical_acceptance_path)
    drift_assessment = load(drift_assessment_path)
    graph = load(graph_path)
    system = load(system_path)

    if sha(snapshot_path) != SNAPSHOT_SHA256:
        errors.append("immutable binding snapshot digest drift")
    if sha(live_path) != SNAPSHOT_SHA256:
        errors.append("live binding no longer matches immutable snapshot 005")
    if candidate.get("binding_record", {}).get("sha256") != SNAPSHOT_SHA256:
        errors.append("candidate snapshot digest drift")
    if candidate.get("live_binding_at_authorship", {}).get("sha256") != SNAPSHOT_SHA256:
        errors.append("candidate live-binding authorship digest drift")

    computed_material = material_digest(snapshot, errors)
    if computed_material != MATERIAL_SHA256:
        errors.append("replacement implementation material digest drift")
    if snapshot.get("implementation_material_sha256") != MATERIAL_SHA256:
        errors.append("snapshot implementation material identity drift")
    if candidate.get("implementation_material", {}).get("sha256") != MATERIAL_SHA256:
        errors.append("candidate implementation material identity drift")

    if sha(system_admission_path) != SYSTEM_ADMISSION_SHA256:
        errors.append("system ontology admission decision digest drift")
    if system_admission.get("admission", {}).get("lifecycle_status") != "admitted":
        errors.append("system ontology predecessor is not admitted")
    if sha(historical_acceptance_path) != HISTORICAL_ACCEPTANCE_SHA256:
        errors.append("historical acceptance decision digest drift")
    if historical_acceptance.get("acceptance", {}).get("lifecycle_status") != "accepted":
        errors.append("historical acceptance is not preserved")
    if sha(drift_assessment_path) != DRIFT_ASSESSMENT_SHA256:
        errors.append("replacement-trigger assessment digest drift")
    if drift_assessment.get("assessment_result") != "BLOCK":
        errors.append("replacement-trigger assessment is not BLOCK")

    selectors = snapshot.get("selector_bindings", {})
    node_items = selectors.get("graph_nodes", [])
    edge_items = selectors.get("graph_edges", [])
    constraint_items = selectors.get("runtime_constraints", [])
    expected_nodes = {item.get("node_id") for item in graph.get("nodes", [])}
    expected_edges = {item.get("edge_id") for item in graph.get("edges", [])}
    expected_constraints = set(system.get("runtime_constraints", []))
    if {item.get("selector") for item in node_items} != expected_nodes:
        errors.append("graph node selector closure drift")
    if {item.get("selector") for item in edge_items} != expected_edges:
        errors.append("graph edge selector closure drift")
    if {item.get("selector") for item in constraint_items} != expected_constraints:
        errors.append("runtime constraint selector closure drift")
    bound_paths = {item.get("path") for item in snapshot.get("files", [])}
    for group in (node_items, edge_items, constraint_items):
        for item in group:
            paths = item.get("implementation_paths", [])
            if not paths or not set(paths) <= bound_paths:
                errors.append(f"selector has empty or unbound paths: {item.get('selector')}")

    counts = {
        "files": len(snapshot.get("files", [])),
        "source_assets": len(snapshot.get("source_assets", [])),
        "graph_node_selectors": len(node_items),
        "graph_edge_selectors": len(edge_items),
        "runtime_constraint_selectors": len(constraint_items),
        "selector_bindings_total": len(node_items) + len(edge_items) + len(constraint_items),
    }
    declared = candidate.get("ontology_bindings", {})
    for key in ("graph_node_selectors", "graph_edge_selectors", "runtime_constraint_selectors", "selector_bindings_total"):
        if declared.get(key) != counts[key]:
            errors.append(f"candidate selector count drift: {key}")
    material = candidate.get("implementation_material", {})
    if material.get("file_count") != counts["files"] or material.get("source_asset_count") != counts["source_assets"]:
        errors.append("candidate material count drift")

    env = os.environ.copy()
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    current = subprocess.run(
        ["python3", str(ROOT / "author_binding.py"), "--check"],
        cwd=ROOT,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    if current.returncode != 0:
        errors.append("live binding author check failed")
    if candidate.get("acceptance_status") != "not-requested":
        errors.append("replacement candidate may not self-accept")
    if candidate.get("successor_authorization") != "none":
        errors.append("replacement candidate grants successor authority")
    return errors, counts, computed_material


if __name__ == "__main__":
    failures, counts, material = validate()
    result = {
        "result": "PASS" if not failures else "BLOCK",
        "candidate_id": "CA2-CANDIDATE-KEP-HOSTED-DEVNET-IMPLEMENTATION-BINDING-005",
        "candidate_sha256": sha(ROOT / "implementation-binding-candidate-005.json"),
        "immutable_binding_record_sha256": SNAPSHOT_SHA256,
        "implementation_material_sha256": material,
        "historical_acceptance_sha256": HISTORICAL_ACCEPTANCE_SHA256,
        "replacement_trigger_assessment_sha256": DRIFT_ASSESSMENT_SHA256,
        "counts": counts,
        "acceptance_status": "not-requested",
        "conformance": "not_evaluable",
        "authority_effect": "none",
        "external_effect": "none",
        "errors": failures,
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    raise SystemExit(1 if failures else 0)
