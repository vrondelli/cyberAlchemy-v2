#!/usr/bin/env python3
"""Validate the immutable KEP hosted VPS DomainSpec source extension candidate."""

from __future__ import annotations

import hashlib
import json
import os
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parent
BASE = ROOT.parents[1]
VERTICAL = BASE.parent
CANDIDATE_SHA256 = "5c311351d1b309cac0b3a8d894542a5946ff2b5edf914c3569e429279ac1c99a"
SOURCE_SHA256 = "74c11d4ca921cb169d52ab0701a3e0098869bef28e6cd7d513a00f3a18375215"
BASE_ADMISSION_SHA256 = "7b16adbccae027686cc7316699c9a45985e0fdc0fba628063c85d10f358b5677"
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
    candidate_path = ROOT / "candidate.json"
    candidate = load(candidate_path)
    manifest = load(ROOT / "generated/source-manifest.json")
    graph = load(ROOT / "generated/compiled-graph.json")
    system = load(ROOT / "generated/system-ontology.json")
    bridge = load(ROOT / "generated/bridge.json")
    receipt = load(ROOT / "generated/compilation-receipt.json")

    if sha(candidate_path) != CANDIDATE_SHA256:
        errors.append("candidate digest drift")
    if candidate.get("admission_status") != "not-requested":
        errors.append("candidate may not self-admit")
    if candidate.get("successor_authorization") != "none":
        errors.append("candidate grants successor authority")
    if set(candidate.get("selected_dependency_set", {}).get("selectors", [])) != SELECTORS:
        errors.append("candidate selector set drift")

    source = hashlib.sha256()
    declared_paths: list[str] = []
    for item in sorted(manifest.get("files", []), key=lambda value: value["path"]):
        relative = item["path"]
        declared_paths.append(relative)
        path = ROOT / relative
        if not path.is_file() or sha(path) != item["sha256"]:
            errors.append(f"source missing or drifted: {relative}")
            continue
        value = path.read_bytes()
        source.update(relative.encode())
        source.update(b"\0")
        source.update(value)
        source.update(b"\0")
    observed_source = source.hexdigest()
    if observed_source != SOURCE_SHA256 or candidate.get("source_material", {}).get("sha256") != SOURCE_SHA256:
        errors.append("source material digest drift")
    if len(declared_paths) != 11 or len(set(declared_paths)) != 11:
        errors.append("source manifest closure drift")

    for item in manifest.get("dependencies", []):
        path = VERTICAL / item["path"]
        if not path.is_file() or sha(path) != item["sha256"]:
            errors.append(f"base dependency missing or drifted: {item['path']}")
    admission = VERTICAL / "decisions/system-ontology-admission-001.json"
    if sha(admission) != BASE_ADMISSION_SHA256:
        errors.append("base system ontology admission drift")

    graph_nodes = {item["node_id"] for item in graph.get("nodes", [])}
    constraints = set(system.get("runtime_constraints", []))
    bridge_selectors = {item["selector"] for item in bridge.get("system_only_selectors", [])}
    if not SELECTORS <= graph_nodes:
        errors.append("compiled graph omits selected nodes")
    if not SELECTORS <= constraints:
        errors.append("system ontology omits selected constraints")
    if bridge_selectors != SELECTORS:
        errors.append("bridge system-only selector set drift")
    if system.get("ontology_id") != "CA2-SYSTEM-ONTOLOGY-KEP-HOSTED-DEVNET-EXCHANGE":
        errors.append("system ontology identity drift")
    if system.get("revision") != "002":
        errors.append("system ontology revision drift")
    if receipt.get("selectors") != list(candidate["selected_dependency_set"]["selectors"]):
        errors.append("compilation receipt selector order drift")

    expected_previews = {
        "compiled_graph_sha256": sha(ROOT / "generated/compiled-graph.json"),
        "system_ontology_sha256": sha(ROOT / "generated/system-ontology.json"),
        "bridge_sha256": sha(ROOT / "generated/bridge.json"),
        "compilation_receipt_sha256": sha(ROOT / "generated/compilation-receipt.json"),
    }
    for key, observed in expected_previews.items():
        if candidate.get("generated_preview", {}).get(key) != observed:
            errors.append(f"generated preview digest drift: {key}")

    env = dict(os.environ)
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    compile_check = subprocess.run(
        ["python3", str(ROOT / "compile.py"), "--check"],
        cwd=ROOT,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    if compile_check.returncode != 0:
        errors.append("deterministic compilation check failed")
    base_check = subprocess.run(
        ["python3", str(BASE / "validate-system-ontology.py")],
        cwd=BASE,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    if base_check.returncode != 0:
        errors.append("admitted base ontology validation failed")

    result = {
        "candidate_id": candidate.get("candidate_id"),
        "candidate_sha256": sha(candidate_path),
        "source_material_sha256": observed_source,
        "base_system_ontology_admission_sha256": sha(admission),
        "selectors": sorted(SELECTORS),
        "counts": {
            "source_files": len(declared_paths),
            "selected_dependencies": len(manifest.get("dependencies", [])),
            "graph_nodes": len(graph.get("nodes", [])),
            "graph_edges": len(graph.get("edges", [])),
            "system_operations": len(system.get("operations", [])),
            "system_tests": len(system.get("tests", [])),
            "runtime_constraints": len(system.get("runtime_constraints", [])),
        },
        "result": "PASS" if not errors else "BLOCK",
        "admission_status": "not-requested",
        "authority_effect": "none",
        "external_effect": "none",
        "errors": errors,
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
