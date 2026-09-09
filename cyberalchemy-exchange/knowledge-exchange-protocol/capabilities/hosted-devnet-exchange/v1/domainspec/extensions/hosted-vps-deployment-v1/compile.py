#!/usr/bin/env python3
"""Compile the KEP hosted VPS DomainSpec extension over the admitted base graph."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent
BASE = ROOT.parents[1]
VERTICAL = BASE.parent
GENERATED = ROOT / "generated"
BASE_ADMISSION_SHA256 = "7b16adbccae027686cc7316699c9a45985e0fdc0fba628063c85d10f358b5677"
BASE_CANDIDATE_SHA256 = "37b5b8531e13058bc39a61ee7572ea3059376cd54851f9717f19e02de2359aa4"
BASE_SET_DIGEST = "8aa30019a659b5131c9f524e7bcdb3b7679b7ea5712e3e8e6ebd28a46d281c1f"
SELECTORS = [
    "kep-hosted-vps-deployment-transition",
    "kep-hosted-vps-deployment-observation",
    "kep-hosted-offhost-backup",
    "kep-hosted-disposable-restore-verification",
]


def canonical(value: object) -> bytes:
    return (json.dumps(value, indent=2, sort_keys=True) + "\n").encode()


def sha_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha(path: Path) -> str:
    return sha_bytes(path.read_bytes())


def load(path: Path) -> dict:
    value = json.loads(path.read_text())
    if not isinstance(value, dict):
        raise ValueError(f"{path} must contain one object")
    return value


def compile_outputs() -> dict[str, bytes]:
    project = load(ROOT / "project.json")
    feature = load(ROOT / "feature.json")
    nodes = [load(path) for path in sorted((ROOT / "nodes").glob("*.json"))]
    edges = [load(path) for path in sorted((ROOT / "edges").glob("*.json"))]
    if {item["node_id"] for item in nodes} != set(feature["nodes"]):
        raise ValueError("extension node registry is not closed")
    if {item["edge_id"] for item in edges} != set(feature["edges"]):
        raise ValueError("extension edge registry is not closed")

    admission_path = VERTICAL / "decisions/system-ontology-admission-001.json"
    candidate_path = BASE / "system-ontology-candidate.json"
    if sha(admission_path) != BASE_ADMISSION_SHA256 or sha(candidate_path) != BASE_CANDIDATE_SHA256:
        raise ValueError("admitted base system ontology drift")
    admission = load(admission_path)
    if admission.get("admission", {}).get("admitted_candidate_set_digest") != BASE_SET_DIGEST:
        raise ValueError("admitted base candidate-set drift")
    for item in admission["subject"]["artifacts"]:
        path = (VERTICAL / "decisions" / item["path"]).resolve()
        if sha(path) != item["sha256"]:
            raise ValueError(f"admitted base artifact drift: {item['path']}")

    base_graph = load(BASE / "generated/compiled-graph.json")
    base_system = load(BASE / "generated/system-ontology.json")
    base_bridge = load(BASE / "generated/bridge.json")
    node_ids = {item["node_id"] for item in base_graph["nodes"]} | {item["node_id"] for item in nodes}
    for edge in edges:
        if edge["source_node_id"] not in node_ids or edge["target_node_id"] not in node_ids:
            raise ValueError(f"extension edge endpoint is not closed: {edge['edge_id']}")

    graph = dict(base_graph)
    graph["schema_version"] = "domainspec.compiled-graph-extension/v1"
    graph["extension_project_id"] = project["project_id"]
    graph["base_system_ontology_admission_sha256"] = BASE_ADMISSION_SHA256
    graph["features"] = list(base_graph["features"]) + [feature]
    graph["nodes"] = list(base_graph["nodes"]) + nodes
    graph["edges"] = list(base_graph["edges"]) + edges
    graph_bytes = canonical(graph)

    system = dict(base_system)
    system["schema_version"] = "domainspec.system-ontology-extension/v1"
    system["revision"] = "002"
    system["source_graph_sha256"] = sha_bytes(graph_bytes)
    system["base_admission_sha256"] = BASE_ADMISSION_SHA256
    system["operations"] = list(base_system["operations"]) + [item for item in nodes if item["kind"] == "Operation"]
    system["tests"] = list(base_system["tests"]) + [item for item in nodes if item["kind"] == "Test"]
    system["runtime_constraints"] = list(base_system["runtime_constraints"]) + SELECTORS
    system_bytes = canonical(system)

    bridge = dict(base_bridge)
    bridge["schema_version"] = "cav2.business-system-bridge-extension/v1"
    bridge["system_ontology_revision"] = "002"
    bridge["system_only_selectors"] = [
        {"selector": selector, "reason": "deployment and recovery runtime behavior; does not redefine business meaning"}
        for selector in SELECTORS
    ]
    bridge_bytes = canonical(bridge)

    source_paths = [ROOT / "project.json", ROOT / "feature.json", ROOT / "compile.py"]
    source_paths += sorted((ROOT / "nodes").glob("*.json"))
    source_paths += sorted((ROOT / "edges").glob("*.json"))
    dependency_paths = [admission_path, candidate_path]
    dependency_paths += [(VERTICAL / "decisions" / item["path"]).resolve() for item in admission["subject"]["artifacts"]]
    manifest = {
        "schema_version": "domainspec.source-manifest-extension/v1",
        "files": [{"path": str(path.relative_to(ROOT)), "sha256": sha(path)} for path in source_paths],
        "dependencies": [{"path": str(path.relative_to(VERTICAL)), "sha256": sha(path)} for path in dependency_paths],
    }
    manifest_bytes = canonical(manifest)
    receipt = {
        "schema_version": "domainspec.compilation-receipt-extension/v1",
        "compiler": "hosted-vps-deployment-v1/compile.py",
        "base_system_ontology_admission_sha256": BASE_ADMISSION_SHA256,
        "source_manifest_sha256": sha_bytes(manifest_bytes),
        "compiled_graph_sha256": sha_bytes(graph_bytes),
        "system_ontology_sha256": sha_bytes(system_bytes),
        "bridge_sha256": sha_bytes(bridge_bytes),
        "selectors": SELECTORS,
        "result": "PASS",
        "authority_effect": "none",
    }
    return {
        "bridge.json": bridge_bytes,
        "compilation-receipt.json": canonical(receipt),
        "compiled-graph.json": graph_bytes,
        "source-manifest.json": manifest_bytes,
        "system-ontology.json": system_bytes,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    outputs = compile_outputs()
    if args.check:
        stale = [name for name, value in outputs.items() if not (GENERATED / name).is_file() or (GENERATED / name).read_bytes() != value]
        print(json.dumps({"result": "PASS" if not stale else "FAIL", "stale": stale, "authority_effect": "none"}, indent=2))
        return 1 if stale else 0
    GENERATED.mkdir(parents=True, exist_ok=True)
    for name, value in outputs.items():
        (GENERATED / name).write_bytes(value)
    print(json.dumps({"result": "PASS", "outputs": sorted(outputs), "authority_effect": "none"}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
