#!/usr/bin/env python3
"""Validate the immutable hosted system-ontology candidate set."""

from __future__ import annotations

import hashlib
import json
import subprocess
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
GENERATED = ROOT / "generated"
DOMAINSPEC_ADMISSION_SHA256 = "9df4785c383cb8fe22854c1070d6966bc7217a2f2545ad9fee256179019d191f"
DOMAINSPEC_CANDIDATE_SHA256 = "4a14ac7c158376a3db13f55b2dc828ea1c3ec83e40d4ec0d7bd70a69a68650e4"
DOMAINSPEC_SOURCE_DIGEST = "0df6308ca5b32a273ca0798ca624491dc1fe44c4607e3f0d55e663f1e4fd314b"
CANDIDATE_SET_DIGEST = "8aa30019a659b5131c9f524e7bcdb3b7679b7ea5712e3e8e6ebd28a46d281c1f"
SYSTEM_ONTOLOGY_ADMISSION_SHA256 = "7b16adbccae027686cc7316699c9a45985e0fdc0fba628063c85d10f358b5677"
ARTIFACT_PATHS = (
    "generated/bridge.json",
    "generated/compilation-receipt.json",
    "generated/compiled-graph.json",
    "generated/source-manifest.json",
    "generated/system-ontology.json",
)


def load(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"{path} must contain one object")
    return value


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def path_bytes_digest(paths: tuple[str, ...]) -> str:
    result = hashlib.sha256()
    for candidate_relative in sorted(paths):
        relative = Path(candidate_relative).relative_to("generated").as_posix()
        result.update(relative.encode("utf-8"))
        result.update(b"\0")
        result.update((GENERATED / relative).read_bytes())
        result.update(b"\0")
    return result.hexdigest()


def validate() -> tuple[list[str], dict[str, int], str]:
    errors: list[str] = []
    candidate = load(ROOT / "system-ontology-candidate.json")
    source_admission_path = ROOT.parent / "decisions/domainspec-source-admission-001.json"
    source_admission = load(source_admission_path)
    manifest = load(GENERATED / "source-manifest.json")
    graph = load(GENERATED / "compiled-graph.json")
    system = load(GENERATED / "system-ontology.json")
    bridge = load(GENERATED / "bridge.json")
    receipt = load(GENERATED / "compilation-receipt.json")
    system_admission_path = ROOT.parent / "decisions/system-ontology-admission-001.json"
    system_admission = load(system_admission_path)

    if sha(source_admission_path) != DOMAINSPEC_ADMISSION_SHA256:
        errors.append("DomainSpec source admission decision digest drift")
    admission = source_admission.get("admission", {})
    if admission.get("lifecycle_status") != "admitted":
        errors.append("DomainSpec source predecessor is not admitted")
    if admission.get("admitted_candidate_sha256") != DOMAINSPEC_CANDIDATE_SHA256:
        errors.append("DomainSpec admitted candidate digest drift")
    if admission.get("admitted_source_material_digest") != DOMAINSPEC_SOURCE_DIGEST:
        errors.append("DomainSpec admitted source material digest drift")

    artifacts = candidate.get("artifacts", [])
    artifact_paths = [item.get("path") for item in artifacts]
    if artifact_paths != list(ARTIFACT_PATHS):
        errors.append("candidate artifact set or order drift")
    for item in artifacts:
        relative = item.get("path")
        if not isinstance(relative, str) or not (ROOT / relative).is_file():
            errors.append(f"missing candidate artifact: {relative}")
        elif item.get("sha256") != sha(ROOT / relative):
            errors.append(f"candidate artifact digest drift: {relative}")
    candidate_set_digest = path_bytes_digest(ARTIFACT_PATHS)
    if candidate_set_digest != CANDIDATE_SET_DIGEST:
        errors.append("candidate set material digest drift")
    if candidate.get("candidate_set_digest") != candidate_set_digest:
        errors.append("candidate envelope set digest drift")
    if candidate.get("candidate_set_root") != "generated":
        errors.append("candidate set digest root drift")
    if candidate.get("admission_status") != "not-requested":
        errors.append("system ontology candidate may not self-admit")
    if candidate.get("successor_authorization") != "none":
        errors.append("system ontology candidate grants successor authority")

    if sha(system_admission_path) != SYSTEM_ONTOLOGY_ADMISSION_SHA256:
        errors.append("system ontology admission decision digest drift")
    decision_subject = system_admission.get("subject", {})
    if decision_subject.get("candidate_sha256") != sha(ROOT / "system-ontology-candidate.json"):
        errors.append("system ontology admission candidate digest drift")
    if decision_subject.get("candidate_set_digest") != candidate_set_digest:
        errors.append("system ontology admission candidate-set digest drift")
    admitted = system_admission.get("admission", {})
    if admitted.get("lifecycle_status") != "admitted":
        errors.append("system ontology admission decision is not admitted")
    if admitted.get("admitted_candidate_sha256") != sha(ROOT / "system-ontology-candidate.json"):
        errors.append("admitted system ontology candidate digest drift")
    if admitted.get("admitted_candidate_set_digest") != candidate_set_digest:
        errors.append("admitted system ontology candidate-set digest drift")
    if system_admission.get("predecessor", {}).get("domainspec_source_admission", {}).get("sha256") != DOMAINSPEC_ADMISSION_SHA256:
        errors.append("system ontology admission predecessor drift")

    node_ids = {node.get("node_id") for node in graph.get("nodes", [])}
    edges = graph.get("edges", [])
    for edge in edges:
        if edge.get("source_node_id") not in node_ids or edge.get("target_node_id") not in node_ids:
            errors.append(f"compiled graph edge endpoint is not closed: {edge.get('edge_id')}")
    if system.get("ontology_id") != candidate.get("system_ontology_id"):
        errors.append("system ontology identity drift")
    if system.get("source_graph_sha256") != sha(GENERATED / "compiled-graph.json"):
        errors.append("system ontology source graph drift")
    if bridge.get("bridge_id") != candidate.get("bridge_id"):
        errors.append("bridge identity drift")
    if bridge.get("system_ontology_ref") != system.get("ontology_id"):
        errors.append("bridge system ontology reference drift")
    if receipt.get("compiled_graph_sha256") != sha(GENERATED / "compiled-graph.json"):
        errors.append("compilation receipt graph digest drift")
    if receipt.get("system_ontology_sha256") != sha(GENERATED / "system-ontology.json"):
        errors.append("compilation receipt system ontology digest drift")
    if receipt.get("bridge_sha256") != sha(GENERATED / "bridge.json"):
        errors.append("compilation receipt bridge digest drift")
    if receipt.get("source_manifest_sha256") != sha(GENERATED / "source-manifest.json"):
        errors.append("compilation receipt source manifest digest drift")

    counts = {
        "source_files": len(manifest.get("files", [])),
        "selected_dependencies": len(manifest.get("dependencies", [])),
        "features": len(graph.get("features", [])),
        "graph_nodes": len(graph.get("nodes", [])),
        "graph_edges": len(edges),
        "system_components": len(system.get("components", [])),
        "system_operations": len(system.get("operations", [])),
        "system_tests": len(system.get("tests", [])),
        "runtime_constraints": len(system.get("runtime_constraints", [])),
        "bridge_links": len(bridge.get("links", [])),
    }
    if candidate.get("model_counts") != counts:
        errors.append("candidate model counts drift")

    check = subprocess.run(
        ["python3", str(ROOT / "compile.py"), "--check"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if check.returncode != 0:
        errors.append("deterministic compilation check failed")

    return errors, counts, candidate_set_digest


if __name__ == "__main__":
    failures, counts, set_digest = validate()
    result = {
        "result": "PASS" if not failures else "BLOCK",
        "candidate_id": "CA2-CANDIDATE-KEP-HOSTED-DEVNET-SYSTEM-ONTOLOGY-001",
        "candidate_sha256": sha(ROOT / "system-ontology-candidate.json"),
        "candidate_set_digest": set_digest,
        "domainspec_source_admission_sha256": DOMAINSPEC_ADMISSION_SHA256,
        "counts": counts,
        "system_ontology_admission_status": "admitted",
        "system_ontology_admission_decision_sha256": SYSTEM_ONTOLOGY_ADMISSION_SHA256,
        "authority_effect": "none",
        "external_effect": "none",
        "errors": failures,
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    raise SystemExit(1 if failures else 0)
