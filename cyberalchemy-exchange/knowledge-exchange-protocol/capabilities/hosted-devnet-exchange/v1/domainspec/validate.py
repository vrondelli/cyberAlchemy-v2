#!/usr/bin/env python3
"""Validate the hosted DomainSpec source candidate and generated previews."""

from __future__ import annotations

import hashlib
import json
import subprocess
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[6]
SPEC = ROOT / "specs/hosted-devnet-exchange"
GENERATED = ROOT / "generated"
ONTOLOGY_ADMISSION_SHA256 = "409015aefa426abd0ceeb7438fa96b434a7e15e7d58c3feeb8209012ca2d6706"
ONTOLOGY_CANDIDATE_SHA256 = "d70444430addaf592efac682273898ce7d8856e0a9599c08a8d95a48b6c2f1a4"
ONTOLOGY_MATERIAL_DIGEST = "561fa9497a13a3b011908d703dbea5ebd4e21919a382ef2b408e6e8cc56a8c1d"
DOMAINSPEC_CANDIDATE_SHA256 = "4a14ac7c158376a3db13f55b2dc828ea1c3ec83e40d4ec0d7bd70a69a68650e4"
DOMAINSPEC_SOURCE_MATERIAL_DIGEST = "0df6308ca5b32a273ca0798ca624491dc1fe44c4607e3f0d55e663f1e4fd314b"
DOMAINSPEC_ADMISSION_SHA256 = "9df4785c383cb8fe22854c1070d6966bc7217a2f2545ad9fee256179019d191f"
SYSTEM_ONTOLOGY_CANDIDATE_SHA256 = "37b5b8531e13058bc39a61ee7572ea3059376cd54851f9717f19e02de2359aa4"
SYSTEM_ONTOLOGY_CANDIDATE_SET_DIGEST = "8aa30019a659b5131c9f524e7bcdb3b7679b7ea5712e3e8e6ebd28a46d281c1f"
SYSTEM_ONTOLOGY_PREACCEPTANCE_SHA256 = "d878a45d4e5c698d9aec6f308be8fb8872b5a2a36ad11540bd8963dd0628d488"
SYSTEM_ONTOLOGY_ADMISSION_SHA256 = "7b16adbccae027686cc7316699c9a45985e0fdc0fba628063c85d10f358b5677"
GENERATED_FILES = (
    "bridge.json",
    "compilation-receipt.json",
    "compiled-graph.json",
    "source-manifest.json",
    "system-ontology.json",
)


def load(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"{path} must contain one object")
    return value


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def path_bytes_digest(root: Path, paths: list[str]) -> str:
    result = hashlib.sha256()
    for relative in sorted(paths):
        result.update(relative.encode("utf-8"))
        result.update(b"\0")
        result.update((root / relative).read_bytes())
        result.update(b"\0")
    return result.hexdigest()


def validate() -> tuple[list[str], dict[str, int], str, str]:
    errors: list[str] = []
    binding = load(ROOT / "binding.json")
    project = load(ROOT / "project.json")
    feature = load(SPEC / "feature.json")
    candidate = load(ROOT / "candidate.json")
    manifest = load(GENERATED / "source-manifest.json")
    graph = load(GENERATED / "compiled-graph.json")
    system = load(GENERATED / "system-ontology.json")
    bridge = load(GENERATED / "bridge.json")
    receipt = load(GENERATED / "compilation-receipt.json")
    system_candidate_path = ROOT / "system-ontology-candidate.json"
    system_preacceptance_path = ROOT / "evidence/system-ontology-preacceptance-001.json"
    system_candidate = load(system_candidate_path)
    system_preacceptance = load(system_preacceptance_path)
    system_admission_path = ROOT.parent / "decisions/system-ontology-admission-001.json"
    system_admission = load(system_admission_path)

    admission_path = ROOT.parent / "decisions/ontology-admission-001.json"
    domainspec_admission_path = ROOT.parent / "decisions/domainspec-source-admission-001.json"
    ontology_candidate_path = ROOT.parent / "ontology/candidate.json"
    admission = load(admission_path)
    domainspec_admission = load(domainspec_admission_path)
    ontology_candidate = load(ontology_candidate_path)
    if sha(admission_path) != ONTOLOGY_ADMISSION_SHA256:
        errors.append("business ontology admission decision digest drift")
    if sha(ontology_candidate_path) != ONTOLOGY_CANDIDATE_SHA256:
        errors.append("business ontology candidate digest drift")
    if admission.get("admission", {}).get("lifecycle_status") != "admitted":
        errors.append("business ontology predecessor is not admitted")
    if admission.get("admission", {}).get("admitted_material_digest") != ONTOLOGY_MATERIAL_DIGEST:
        errors.append("business ontology admitted material drift")
    if ontology_candidate.get("material_digest") != ONTOLOGY_MATERIAL_DIGEST:
        errors.append("business ontology candidate material drift")

    if sha(domainspec_admission_path) != DOMAINSPEC_ADMISSION_SHA256:
        errors.append("DomainSpec source admission decision digest drift")
    decision_subject = domainspec_admission.get("subject", {})
    if decision_subject.get("candidate_sha256") != DOMAINSPEC_CANDIDATE_SHA256:
        errors.append("DomainSpec admission candidate digest drift")
    if decision_subject.get("source_material_digest") != DOMAINSPEC_SOURCE_MATERIAL_DIGEST:
        errors.append("DomainSpec admission source material digest drift")
    if decision_subject.get("binding_sha256") != sha(ROOT / "binding.json"):
        errors.append("DomainSpec admission binding digest drift")
    source_admission = domainspec_admission.get("admission", {})
    if source_admission.get("lifecycle_status") != "admitted":
        errors.append("DomainSpec source admission decision is not admitted")
    if source_admission.get("admitted_candidate_sha256") != DOMAINSPEC_CANDIDATE_SHA256:
        errors.append("DomainSpec admitted candidate digest drift")
    if source_admission.get("admitted_source_material_digest") != DOMAINSPEC_SOURCE_MATERIAL_DIGEST:
        errors.append("DomainSpec admitted source material digest drift")

    expected_status = {
        "definitions": "accepted",
        "product_capability": "adopted",
        "business_ontology": "admitted",
    }
    if binding.get("predecessor_status") != expected_status:
        errors.append("binding predecessor lifecycle drift")
    predecessor = binding.get("predecessors", {}).get("business_ontology_admission", {})
    if predecessor.get("sha256") != ONTOLOGY_ADMISSION_SHA256:
        errors.append("binding ontology-admission digest drift")
    if predecessor.get("ontology_candidate_sha256") != ONTOLOGY_CANDIDATE_SHA256:
        errors.append("binding ontology-candidate digest drift")
    if predecessor.get("admitted_material_digest") != ONTOLOGY_MATERIAL_DIGEST:
        errors.append("binding admitted-material digest drift")
    if binding.get("status") != "authored-candidate-awaiting-owner-admission":
        errors.append("DomainSpec binding may not self-admit")
    if binding.get("successor_status", {}).get("domainspec_source_admission") != "not-requested":
        errors.append("DomainSpec source admission must remain not-requested")

    declared_files = manifest.get("files", [])
    declared_paths = [item.get("path") for item in declared_files]
    actual_paths = ["project.json", "binding.json", "specs/hosted-devnet-exchange/feature.json"]
    actual_paths += [str(path.relative_to(ROOT)) for path in sorted((SPEC / "nodes").glob("*.json"))]
    actual_paths += [str(path.relative_to(ROOT)) for path in sorted((SPEC / "edges").glob("*.json"))]
    if set(declared_paths) != set(actual_paths) or len(declared_paths) != len(actual_paths):
        errors.append("DomainSpec source file closure drift")
    for item in declared_files:
        relative = item.get("path")
        if not isinstance(relative, str) or not (ROOT / relative).is_file():
            errors.append(f"missing DomainSpec source: {relative}")
        elif item.get("sha256") != sha(ROOT / relative):
            errors.append(f"DomainSpec source digest drift: {relative}")
    source_material_digest = path_bytes_digest(ROOT, actual_paths)

    expected_dependency_paths = {
        str(admission_path.relative_to(REPO)),
        str(ontology_candidate_path.relative_to(REPO)),
    }
    expected_dependency_paths.update(
        str((ontology_candidate_path.parent / item["path"]).relative_to(REPO))
        for item in ontology_candidate.get("artifacts", [])
    )
    dependencies = manifest.get("dependencies", [])
    dependency_paths = [item.get("path") for item in dependencies]
    if set(dependency_paths) != expected_dependency_paths or len(dependency_paths) != len(expected_dependency_paths):
        errors.append("selected ontology dependency closure drift")
    for item in dependencies:
        relative = item.get("path")
        if not isinstance(relative, str) or not (REPO / relative).is_file():
            errors.append(f"missing selected dependency: {relative}")
        elif item.get("sha256") != sha(REPO / relative):
            errors.append(f"selected dependency digest drift: {relative}")

    node_files = sorted((SPEC / "nodes").glob("*.json"))
    edge_files = sorted((SPEC / "edges").glob("*.json"))
    nodes = [load(path) for path in node_files]
    edges = [load(path) for path in edge_files]
    node_ids = {node.get("node_id") for node in nodes}
    edge_ids = {edge.get("edge_id") for edge in edges}
    if node_ids != set(feature.get("nodes", [])):
        errors.append("feature node registry is not closed")
    if edge_ids != set(feature.get("edges", [])):
        errors.append("feature edge registry is not closed")
    for edge in edges:
        if edge.get("source_node_id") not in node_ids or edge.get("target_node_id") not in node_ids:
            errors.append(f"edge endpoint is not closed: {edge.get('edge_id')}")

    admission_ref = {
        "decision_id": "CA2-DECISION-KEP-HOSTED-DEVNET-ONTOLOGY-ADMISSION-001",
        "decision_sha256": ONTOLOGY_ADMISSION_SHA256,
        "ontology_id": "CA2-ONTOLOGY-KEP-HOSTED-DEVNET-EXCHANGE",
        "ontology_candidate_sha256": ONTOLOGY_CANDIDATE_SHA256,
        "admitted_material_digest": ONTOLOGY_MATERIAL_DIGEST,
    }
    if graph.get("business_ontology_admission") != admission_ref:
        errors.append("compiled graph ontology-admission binding drift")
    if system.get("business_ontology_admission") != admission_ref:
        errors.append("system ontology admission binding drift")
    if bridge.get("business_ontology_admission") != admission_ref:
        errors.append("business-system bridge admission binding drift")
    if system.get("source_graph_sha256") != sha(GENERATED / "compiled-graph.json"):
        errors.append("system ontology source-graph digest drift")
    if bridge.get("system_ontology_ref") != system.get("ontology_id"):
        errors.append("bridge system-ontology reference drift")
    if receipt.get("source_manifest_sha256") != sha(GENERATED / "source-manifest.json"):
        errors.append("compilation receipt source-manifest drift")
    if receipt.get("compiled_graph_sha256") != sha(GENERATED / "compiled-graph.json"):
        errors.append("compilation receipt graph drift")
    if receipt.get("system_ontology_sha256") != sha(GENERATED / "system-ontology.json"):
        errors.append("compilation receipt system-ontology drift")
    if receipt.get("bridge_sha256") != sha(GENERATED / "bridge.json"):
        errors.append("compilation receipt bridge drift")

    check = subprocess.run(
        ["python3", str(ROOT / "compile.py"), "--check"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if check.returncode != 0:
        errors.append("deterministic compilation check failed")

    if candidate.get("binding_sha256") != sha(ROOT / "binding.json"):
        errors.append("candidate binding digest drift")
    if sha(ROOT / "candidate.json") != DOMAINSPEC_CANDIDATE_SHA256:
        errors.append("DomainSpec candidate record digest drift")
    if candidate.get("source_material_digest") != source_material_digest:
        errors.append("candidate source material digest drift")
    if source_material_digest != DOMAINSPEC_SOURCE_MATERIAL_DIGEST:
        errors.append("admitted DomainSpec source material drift")
    if candidate.get("source_manifest", {}).get("sha256") != sha(GENERATED / "source-manifest.json"):
        errors.append("candidate source-manifest digest drift")
    if candidate.get("source_manifest", {}).get("source_file_count") != len(actual_paths):
        errors.append("candidate source file count drift")
    if candidate.get("source_manifest", {}).get("selected_dependency_count") != len(expected_dependency_paths):
        errors.append("candidate dependency count drift")
    if candidate.get("admission_status") != "not-requested":
        errors.append("DomainSpec candidate may not self-admit")
    admitted_source = domainspec_admission.get("admitted_source", {})
    if admitted_source.get("source_file_count") != len(actual_paths):
        errors.append("DomainSpec admission source file count drift")
    if admitted_source.get("source_counts") != {
        "features": 1,
        "nodes": len(nodes),
        "edges": len(edges),
    }:
        errors.append("DomainSpec admission source counts drift")
    if admitted_source.get("selected_dependency_count") != len(expected_dependency_paths):
        errors.append("DomainSpec admission dependency count drift")
    if admitted_source.get("native_source_manifest_sha256") != sha(GENERATED / "source-manifest.json"):
        errors.append("DomainSpec admission source-manifest drift")
    generated_preview = candidate.get("generated_preview", {})
    for key, filename in (
        ("compiled_graph_sha256", "compiled-graph.json"),
        ("system_ontology_sha256", "system-ontology.json"),
        ("bridge_sha256", "bridge.json"),
        ("compilation_receipt_sha256", "compilation-receipt.json"),
    ):
        if generated_preview.get(key) != sha(GENERATED / filename):
            errors.append(f"candidate generated preview drift: {filename}")

    if sha(system_candidate_path) != SYSTEM_ONTOLOGY_CANDIDATE_SHA256:
        errors.append("system ontology candidate record digest drift")
    if system_candidate.get("candidate_set_digest") != SYSTEM_ONTOLOGY_CANDIDATE_SET_DIGEST:
        errors.append("system ontology candidate set digest drift")
    if system_candidate.get("admission_status") != "not-requested":
        errors.append("system ontology candidate may not self-admit")
    if sha(system_preacceptance_path) != SYSTEM_ONTOLOGY_PREACCEPTANCE_SHA256:
        errors.append("system ontology preacceptance receipt digest drift")
    if system_preacceptance.get("candidate_sha256") != SYSTEM_ONTOLOGY_CANDIDATE_SHA256:
        errors.append("system ontology preacceptance candidate digest drift")
    if system_preacceptance.get("candidate_set_digest") != SYSTEM_ONTOLOGY_CANDIDATE_SET_DIGEST:
        errors.append("system ontology preacceptance set digest drift")
    if system_preacceptance.get("result") != "PASS":
        errors.append("system ontology preacceptance did not pass")
    if sha(system_admission_path) != SYSTEM_ONTOLOGY_ADMISSION_SHA256:
        errors.append("system ontology admission decision digest drift")
    if system_admission.get("admission", {}).get("lifecycle_status") != "admitted":
        errors.append("system ontology admission decision is not admitted")
    if system_admission.get("admission", {}).get("admitted_candidate_sha256") != SYSTEM_ONTOLOGY_CANDIDATE_SHA256:
        errors.append("system ontology admitted candidate digest drift")
    if system_admission.get("admission", {}).get("admitted_candidate_set_digest") != SYSTEM_ONTOLOGY_CANDIDATE_SET_DIGEST:
        errors.append("system ontology admitted candidate-set digest drift")
    system_check = subprocess.run(
        ["python3", str(ROOT / "validate-system-ontology.py")],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if system_check.returncode != 0:
        errors.append("system ontology candidate validation failed")

    counts = {
        "source_files": len(actual_paths),
        "selected_dependencies": len(expected_dependency_paths),
        "features": 1,
        "nodes": len(nodes),
        "edges": len(edges),
    }
    generated_set_digest = path_bytes_digest(GENERATED, list(GENERATED_FILES))
    return errors, counts, source_material_digest, generated_set_digest


if __name__ == "__main__":
    failures, counts, source_digest, generated_digest = validate()
    result = {
        "result": "PASS" if not failures else "BLOCK",
        "binding_id": "CA2-D65-KEP-HOSTED-DEVNET-DOMAINSPEC-001",
        "candidate_sha256": sha(ROOT / "candidate.json"),
        "source_material_digest": source_digest,
        "generated_preview_set_digest": generated_digest,
        "counts": counts,
        "domainspec_admission_status": "admitted",
        "domainspec_admission_decision_sha256": DOMAINSPEC_ADMISSION_SHA256,
        "system_ontology_candidate_sha256": SYSTEM_ONTOLOGY_CANDIDATE_SHA256,
        "system_ontology_candidate_set_digest": SYSTEM_ONTOLOGY_CANDIDATE_SET_DIGEST,
        "system_ontology_preacceptance_sha256": SYSTEM_ONTOLOGY_PREACCEPTANCE_SHA256,
        "system_ontology_admission_decision_sha256": SYSTEM_ONTOLOGY_ADMISSION_SHA256,
        "system_ontology_candidate_status": "admitted-by-separate-owner-decision",
        "system_ontology_admission_status": "admitted",
        "authority_effect": "none",
        "external_effect": "none",
        "errors": failures,
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    raise SystemExit(1 if failures else 0)
