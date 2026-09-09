#!/usr/bin/env python3
"""Fail-closed validation for the Durable Storage DomainSpec v2 source."""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
from pathlib import Path
from typing import Any


PACKAGE_ROOT = Path(__file__).resolve().parent
REPO_ROOT = PACKAGE_ROOT.parents[5]
ONTOLOGY_ROOT = PACKAGE_ROOT.parent / "ontology"


def load(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"JSON root must be an object: {path}")
    return value


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def digest(root: Path, paths: list[str]) -> str:
    result = hashlib.sha256()
    for relative in sorted(paths):
        result.update(relative.encode())
        result.update(b"\0")
        result.update((root / relative).read_bytes())
        result.update(b"\0")
    return result.hexdigest()


def validate(source_root: Path = PACKAGE_ROOT, *, native: bool = True) -> dict[str, Any]:
    source_root = source_root.resolve()
    errors: list[str] = []
    try:
        binding = load(source_root / "binding.json")
        project = load(source_root / "project.json")
        feature_id = binding["feature_id"]
        feature = load(source_root / f"specs/{feature_id}/feature.json")
    except Exception as exc:
        return {"schema_version": "cav2-kep-durable-storage-domainspec-validation/v1", "result": "fail", "errors": [str(exc)], "authority_effect": "none", "external_effect": "none"}

    if binding.get("schema_version") != "cav2-kep-durable-storage-domainspec-binding/v1" or binding.get("lifecycle_status") != "authored-candidate":
        errors.append("binding must remain an authored Durable Storage DomainSpec candidate")
    if binding.get("authority_effect") != "none" or binding.get("external_effect") != "none":
        errors.append("candidate cannot have authority or external effect")
    for name, predecessor in sorted(binding.get("predecessors", {}).items()):
        path = REPO_ROOT / predecessor.get("path", "")
        if not path.is_file():
            errors.append(f"missing predecessor: {name}")
        elif sha(path) != predecessor.get("sha256"):
            errors.append(f"predecessor digest drift: {name}")
    admission = load(REPO_ROOT / binding["predecessors"]["ontology_admission"]["path"])
    if admission.get("admission", {}).get("lifecycle_status") != "admitted" or admission.get("subject", {}).get("ontology_id") != binding.get("ontology_id"):
        errors.append("ontology predecessor is not the bound admission")
    if admission.get("subject", {}).get("material_digest") != binding["predecessors"]["ontology_admission"].get("admitted_material_digest"):
        errors.append("ontology material digest drift")
    if binding.get("selected_ontology_material") != admission.get("admitted_material", {}).get("artifacts"):
        errors.append("selected ontology material is not the exact admitted set")
    for artifact in binding.get("selected_ontology_material", []):
        path = ONTOLOGY_ROOT / artifact.get("path", "")
        if not path.is_file() or sha(path) != artifact.get("sha256"):
            errors.append(f"selected ontology material drift: {artifact.get('path')}")

    node_ids = feature.get("nodes", [])
    edge_ids = feature.get("edges", [])
    if project != {"cross_feature_edges": [], "features": [feature_id], "project_id": "knowledge-exchange-protocol", "schema_version": "domainspec.project/v1"}:
        errors.append("project envelope drift")
    expected_nodes = {f"specs/{feature_id}/nodes/{node}.json" for node in node_ids}
    expected_edges = {f"specs/{feature_id}/edges/{edge}.json" for edge in edge_ids}
    actual_nodes = {p.relative_to(source_root).as_posix() for p in (source_root / f"specs/{feature_id}/nodes").glob("*.json")}
    actual_edges = {p.relative_to(source_root).as_posix() for p in (source_root / f"specs/{feature_id}/edges").glob("*.json")}
    if expected_nodes != actual_nodes or expected_edges != actual_edges:
        errors.append("declared source closure drift")
    for relative in sorted(expected_nodes):
        node = load(source_root / relative)
        if node.get("node_id") not in node_ids or node.get("feature_id") != feature_id:
            errors.append(f"node identity drift: {relative}")
    for relative in sorted(expected_edges):
        edge = load(source_root / relative)
        if edge.get("edge_id") not in edge_ids or edge.get("source_node_id") not in node_ids or edge.get("target_node_id") not in node_ids:
            errors.append(f"edge endpoint closure drift: {relative}")

    registries = [
        ("definition_mappings", "definition-bindings.json", "bindings", "definition_id"),
        ("ontology_node_mappings", "nodes.json", "nodes", "id"),
        ("ontology_rule_mappings", "rules.json", "rules", "rule_id"),
        ("proof_requirement_mappings", "proof-requirements.json", "proof_requirements", "proof_id"),
    ]
    for mapping_name, filename, list_key, id_key in registries:
        mapping = binding.get(mapping_name, {})
        expected = {item[id_key] for item in load(ONTOLOGY_ROOT / filename)[list_key]}
        if set(mapping) != expected:
            errors.append(f"{mapping_name} is not total and exact")
        for targets in mapping.values():
            for target in targets if isinstance(targets, list) else [targets]:
                if target not in node_ids:
                    errors.append(f"{mapping_name} unknown target: {target}")

    if native:
        try:
            relative = source_root.relative_to(REPO_ROOT).as_posix()
            completed = subprocess.run([
                str(REPO_ROOT / "toolchains/node-typescript/bin/node-env"), "run", "--project", "projects/domainspec-v2/impl", "--", "pnpm", "exec", "tsx", "cli/src/cli/main.ts", "lint", f"/workspace/{relative}"
            ], cwd=REPO_ROOT, capture_output=True, text=True, check=False)
            if completed.returncode != 0:
                errors.append(f"native DomainSpec lint failed: {completed.stdout or completed.stderr}")
        except Exception as exc:
            errors.append(f"native DomainSpec lint unavailable: {exc}")

    paths = ["binding.json", "project.json", f"specs/{feature_id}/feature.json", *sorted(expected_nodes), *sorted(expected_edges)]
    return {
        "schema_version": "cav2-kep-durable-storage-domainspec-validation/v1",
        "result": "pass" if not errors else "fail",
        "binding_id": binding.get("binding_id"),
        "ontology_id": binding.get("ontology_id"),
        "candidate_material_digest_algorithm": "sha256-path-null-bytes-null/v1",
        "candidate_material_digest": digest(source_root, paths),
        "source_counts": {"nodes": len(node_ids), "edges": len(edge_ids), "files": len(paths)},
        "errors": errors,
        "downstream": [
            {"check_id": "source-admission", "status": "not_evaluable", "causal_blocker": "Validation does not admit source bytes."},
            {"check_id": "system-ontology", "status": "not_evaluable", "causal_blocker": "Compilation requires exact source admission."},
            {"check_id": "implementation", "status": "not_evaluable", "causal_blocker": "Implementation requires an admitted compiled system ontology."}
        ],
        "authority_effect": "none",
        "external_effect": "none",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", type=Path, default=PACKAGE_ROOT)
    parser.add_argument("--no-native", action="store_true")
    args = parser.parse_args()
    result = validate(args.source_root, native=not args.no_native)
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["result"] == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main())
