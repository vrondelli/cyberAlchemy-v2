#!/usr/bin/env python3
"""Validate the KEP hosted VPS successor system-ontology candidate."""

from __future__ import annotations

import hashlib
import json
import os
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parent
BASE = ROOT.parents[1]
VERTICAL = BASE.parent
CANDIDATE = ROOT / "system-ontology-candidate-002.json"
CANDIDATE_SHA256 = "72c4222cac96cb5a691d88e8e3ba63fe5a8e2884e3dd8b3cacd10429b24bc00c"
CANDIDATE_SET_SHA256 = "97f9559f6133def75ffacd91fcd92ba272f3d546cc6880149f175a76923bd9c3"
SOURCE_ADMISSION_SHA256 = "a882682888023882eef227380591c5f905fa29349fd9541a4dea8071513c4371"
ARTIFACTS = (
    "bridge.json",
    "compilation-receipt.json",
    "compiled-graph.json",
    "source-manifest.json",
    "system-ontology.json",
)
SELECTORS = {
    "kep-hosted-vps-deployment-transition",
    "kep-hosted-vps-deployment-observation",
    "kep-hosted-offhost-backup",
    "kep-hosted-disposable-restore-verification",
}


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path: Path) -> dict:
    value = json.loads(path.read_text())
    if not isinstance(value, dict):
        raise ValueError(f"{path} must contain one object")
    return value


def main() -> int:
    errors: list[str] = []
    candidate = load(CANDIDATE)
    if sha(CANDIDATE) != CANDIDATE_SHA256:
        errors.append("candidate record digest drift")
    if candidate.get("admission_status") != "not-requested":
        errors.append("candidate may not self-admit")
    if candidate.get("successor_authorization") != "none":
        errors.append("candidate grants successor authority")

    declared = candidate.get("artifacts", [])
    if [item.get("path") for item in declared] != [f"generated/{name}" for name in ARTIFACTS]:
        errors.append("candidate artifact order or closure drift")
    material = hashlib.sha256()
    for name, item in zip(ARTIFACTS, declared):
        path = ROOT / "generated" / name
        if not path.is_file() or sha(path) != item.get("sha256"):
            errors.append(f"candidate artifact missing or drifted: {name}")
            continue
        value = path.read_bytes()
        material.update(name.encode())
        material.update(b"\0")
        material.update(value)
        material.update(b"\0")
    observed_set = material.hexdigest()
    if observed_set != CANDIDATE_SET_SHA256 or candidate.get("candidate_set_digest") != observed_set:
        errors.append("candidate set digest drift")

    decision = VERTICAL / "decisions/deployment-domainspec-source-admission-002.json"
    if not decision.is_file() or sha(decision) != SOURCE_ADMISSION_SHA256:
        errors.append("DomainSpec source admission decision missing or drifted")
    else:
        admitted = load(decision).get("admission", {})
        if admitted.get("lifecycle_status") != "admitted":
            errors.append("DomainSpec source predecessor is not admitted")
        if admitted.get("admitted_candidate_sha256") != "5c311351d1b309cac0b3a8d894542a5946ff2b5edf914c3569e429279ac1c99a":
            errors.append("DomainSpec admitted candidate drift")

    graph = load(ROOT / "generated/compiled-graph.json")
    system = load(ROOT / "generated/system-ontology.json")
    bridge = load(ROOT / "generated/bridge.json")
    graph_selectors = {item["node_id"] for item in graph.get("nodes", [])}
    constraint_selectors = set(system.get("runtime_constraints", []))
    bridge_selectors = {item["selector"] for item in bridge.get("system_only_selectors", [])}
    declared_selectors = set(candidate.get("selected_dependency_set", {}).get("selectors", []))
    if declared_selectors != SELECTORS:
        errors.append("declared selector set drift")
    if not SELECTORS <= graph_selectors or not SELECTORS <= constraint_selectors or bridge_selectors != SELECTORS:
        errors.append("selector closure across graph, system and bridge failed")
    counts = {
        "features": len(graph.get("features", [])),
        "graph_nodes": len(graph.get("nodes", [])),
        "graph_edges": len(graph.get("edges", [])),
        "system_components": len(system.get("components", [])),
        "system_operations": len(system.get("operations", [])),
        "system_tests": len(system.get("tests", [])),
        "runtime_constraints": len(system.get("runtime_constraints", [])),
        "bridge_links": len(bridge.get("links", [])),
        "system_only_bridge_selectors": len(bridge_selectors),
    }
    if candidate.get("model_counts") != counts:
        errors.append("candidate model counts drift")

    env = dict(os.environ)
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    for command, cwd, label in (
        (["python3", str(ROOT / "compile.py"), "--check"], ROOT, "extension compilation"),
        (["python3", str(ROOT / "validate.py")], ROOT, "extension source"),
        (["python3", str(BASE / "validate-system-ontology.py")], BASE, "admitted base ontology"),
    ):
        check = subprocess.run(command, cwd=cwd, env=env, capture_output=True, text=True, check=False)
        if check.returncode != 0:
            errors.append(f"{label} validation failed")

    result = {
        "candidate_id": candidate.get("candidate_id"),
        "candidate_sha256": sha(CANDIDATE),
        "candidate_set_sha256": observed_set,
        "source_admission_sha256": sha(decision) if decision.is_file() else None,
        "selectors": sorted(declared_selectors),
        "counts": counts,
        "result": "PASS" if not errors else "BLOCK",
        "system_ontology_admission_status": "not-requested",
        "implementation_binding_acceptance": "not_evaluable",
        "deployment": "not-authorized",
        "authority_effect": "none",
        "external_effect": "none",
        "errors": errors,
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
