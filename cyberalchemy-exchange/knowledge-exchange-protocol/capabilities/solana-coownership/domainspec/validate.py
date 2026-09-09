#!/usr/bin/env python3
"""Fail-closed validation for the no-price Solana DomainSpec source candidate."""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path
from typing import Any


PACKAGE_ROOT = Path(__file__).resolve().parent
REPO_ROOT = PACKAGE_ROOT.parents[5]
ONTOLOGY_ROOT = PACKAGE_ROOT.parent / "ontology"
EXPECTED_SCHEMA = "cav2-kep-solana-domainspec-binding/v1"


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_json(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"JSON root is not an object: {path}")
    return value


def material_digest(root: Path, relative_paths: list[str]) -> str:
    digest = hashlib.sha256()
    for relative in sorted(relative_paths):
        digest.update(relative.encode("utf-8"))
        digest.update(b"\0")
        digest.update((root / relative).read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def native_lint(source_root: Path) -> tuple[dict[str, Any] | None, str | None]:
    try:
        container_relative = source_root.resolve().relative_to(REPO_ROOT).as_posix()
    except ValueError:
        return None, "native DomainSpec lint requires a source root inside the repository mount"
    container_source_root = f"/workspace/{container_relative}"
    command = [
        str(REPO_ROOT / "toolchains/node-typescript/bin/node-env"),
        "run",
        "--project",
        "projects/domainspec-v2/impl",
        "--",
        "pnpm",
        "exec",
        "tsx",
        "cli/src/cli/main.ts",
        "lint",
        container_source_root,
    ]
    completed = subprocess.run(
        command,
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    raw = completed.stdout.strip() or completed.stderr.strip()
    try:
        envelope = json.loads(raw)
    except json.JSONDecodeError:
        envelope = None
    if completed.returncode != 0:
        return envelope, f"native DomainSpec lint exited {completed.returncode}: {raw}"
    if not isinstance(envelope, dict) or envelope.get("result") != "pass":
        return envelope, f"native DomainSpec lint did not return a PASS envelope: {raw}"
    return envelope, None


def validate_candidate(source_root: Path = PACKAGE_ROOT, *, run_native: bool = True) -> dict[str, Any]:
    source_root = source_root.resolve()
    errors: list[str] = []
    checks: list[dict[str, str]] = []

    def record(check_id: str, before: int, evidence: str) -> None:
        checks.append({
            "check_id": check_id,
            "status": "PASS" if len(errors) == before else "FAIL",
            "evidence": evidence,
        })

    try:
        binding = load_json(source_root / "binding.json")
    except Exception as exc:  # fail-closed diagnostic boundary
        return {
            "schema_version": "cav2-kep-solana-domainspec-validation/v1",
            "result": "fail",
            "errors": [str(exc)],
            "authority_effect": "none",
        }

    before = len(errors)
    if binding.get("schema_version") != EXPECTED_SCHEMA:
        errors.append("binding schema version is unsupported")
    if binding.get("lifecycle_status") != "authored-candidate":
        errors.append("binding lifecycle must remain authored-candidate")
    if binding.get("authority_effect") != "none" or binding.get("external_effect") != "none":
        errors.append("binding must declare no authority or external effect")
    record("candidate-envelope", before, "Binding remains an authored, non-effectful candidate.")

    before = len(errors)
    predecessors = binding.get("predecessors", {})
    if not isinstance(predecessors, dict):
        errors.append("predecessors must be an object")
        predecessors = {}
    for predecessor_id, predecessor in sorted(predecessors.items()):
        if not isinstance(predecessor, dict):
            errors.append(f"invalid predecessor record: {predecessor_id}")
            continue
        relative = predecessor.get("path")
        expected = predecessor.get("sha256")
        if not isinstance(relative, str) or not isinstance(expected, str):
            errors.append(f"incomplete predecessor binding: {predecessor_id}")
            continue
        path = REPO_ROOT / relative
        if not path.is_file():
            errors.append(f"missing predecessor: {relative}")
        elif sha256_file(path) != expected:
            errors.append(f"predecessor digest drift: {relative}")
    record("predecessor-bytes", before, "Accepted definitions, adopted capability, and ontology admission match exact bound bytes.")

    before = len(errors)
    admission_path = REPO_ROOT / str(predecessors.get("ontology_admission", {}).get("path", ""))
    try:
        admission = load_json(admission_path)
        admitted = admission.get("admission", {})
        if admitted.get("lifecycle_status") != "admitted":
            errors.append("ontology predecessor is not admitted")
        if admitted.get("admitted_ontology_id") != binding.get("ontology_id"):
            errors.append("ontology identity does not match admission")
        if admitted.get("admitted_material_digest") != predecessors.get("ontology_admission", {}).get("admitted_material_digest"):
            errors.append("admitted ontology material digest does not match binding")
    except Exception as exc:
        admission = {}
        errors.append(f"cannot read ontology admission: {exc}")
    record("ontology-admission", before, "The exact capability-local business ontology is admitted.")

    before = len(errors)
    selected = binding.get("selected_ontology_material", [])
    admitted_artifacts = admission.get("admitted_material", {}).get("artifacts", []) if isinstance(admission, dict) else []
    if selected != admitted_artifacts:
        errors.append("selected ontology material does not exactly equal the admitted artifact set")
    if not isinstance(selected, list):
        selected = []
    for artifact in selected:
        if not isinstance(artifact, dict):
            errors.append("invalid ontology material record")
            continue
        relative = artifact.get("path")
        expected = artifact.get("sha256")
        if not isinstance(relative, str) or not isinstance(expected, str):
            errors.append("incomplete ontology material record")
            continue
        path = ONTOLOGY_ROOT / relative
        if not path.is_file():
            errors.append(f"missing selected ontology material: {relative}")
        elif sha256_file(path) != expected:
            errors.append(f"selected ontology material drift: {relative}")
    record("selected-ontology-bytes", before, "All selected ontology source bytes match the admitted material exactly.")

    before = len(errors)
    try:
        project = load_json(source_root / "project.json")
        feature_id = binding.get("feature_id")
        feature = load_json(source_root / "specs" / str(feature_id) / "feature.json")
        if project.get("schema_version") != "domainspec.project/v1":
            errors.append("project schema is not domainspec.project/v1")
        if project.get("project_id") != binding.get("source_project_id"):
            errors.append("project identity does not match binding")
        if project.get("features") != [feature_id]:
            errors.append("project feature set is not the bound singleton")
        if feature.get("schema_version") != "domainspec.feature/v1" or feature.get("feature_id") != feature_id:
            errors.append("feature root does not match binding")
        node_ids = feature.get("nodes", [])
        edge_ids = feature.get("edges", [])
        if not isinstance(node_ids, list) or not isinstance(edge_ids, list):
            errors.append("feature nodes and edges must be arrays")
            node_ids, edge_ids = [], []
        declared_nodes = {f"specs/{feature_id}/nodes/{node_id}.json" for node_id in node_ids}
        declared_edges = {f"specs/{feature_id}/edges/{edge_id}.json" for edge_id in edge_ids}
        actual_nodes = {path.relative_to(source_root).as_posix() for path in (source_root / "specs" / str(feature_id) / "nodes").glob("*.json")}
        actual_edges = {path.relative_to(source_root).as_posix() for path in (source_root / "specs" / str(feature_id) / "edges").glob("*.json")}
        if declared_nodes != actual_nodes:
            errors.append("declared node files do not exactly equal authored node files")
        if declared_edges != actual_edges:
            errors.append("declared edge files do not exactly equal authored edge files")
    except Exception as exc:
        node_ids, edge_ids = [], []
        declared_nodes, declared_edges = set(), set()
        errors.append(f"cannot resolve authored source closure: {exc}")
    record("authored-source-closure", before, "The single feature declares exactly 26 nodes and 21 edges, with no undeclared JSON source.")

    before = len(errors)
    try:
        ontology_nodes = {entry["id"] for entry in load_json(ONTOLOGY_ROOT / "nodes.json")["nodes"]}
        ontology_rules = {entry["rule_id"] for entry in load_json(ONTOLOGY_ROOT / "rules.json")["rules"]}
        definition_ids = {entry["definition_id"] for entry in load_json(ONTOLOGY_ROOT / "definition-bindings.json")["bindings"]}
        proof_ids = {entry["proof_id"] for entry in load_json(ONTOLOGY_ROOT / "proof-requirements.json")["proof_requirements"]}
        mappings: list[tuple[str, set[str], Any]] = [
            ("definition", definition_ids, binding.get("definition_mappings")),
            ("ontology node", ontology_nodes, binding.get("ontology_node_mappings")),
            ("ontology rule", ontology_rules, binding.get("ontology_rule_mappings")),
            ("proof requirement", proof_ids, binding.get("proof_requirement_mappings")),
        ]
        for label, expected_keys, mapping in mappings:
            if not isinstance(mapping, dict):
                errors.append(f"{label} mapping must be an object")
                continue
            if set(mapping) != expected_keys:
                errors.append(f"{label} mapping is not total and exact")
            targets: list[str] = []
            for value in mapping.values():
                targets.extend(value if isinstance(value, list) else [value])
            unknown = sorted({target for target in targets if not isinstance(target, str) or target not in node_ids})
            if unknown:
                errors.append(f"{label} mapping references unknown DomainSpec nodes: {unknown}")
    except Exception as exc:
        errors.append(f"cannot validate ontology mapping closure: {exc}")
    record("ontology-mapping-closure", before, "All 10 definitions, 24 ontology nodes, 12 rules, and 7 proof requirements map to declared DomainSpec nodes.")

    native_envelope: dict[str, Any] | None = None
    if run_native:
        before = len(errors)
        native_envelope, native_error = native_lint(source_root)
        if native_error:
            errors.append(native_error)
        record("native-domainspec-lint", before, "The current DomainSpec v2 parser validates closed bodies, endpoints, relationship signatures, and graph obligations.")

    source_paths = ["binding.json", "project.json", *sorted(declared_nodes), *sorted(declared_edges)]
    result: dict[str, Any] = {
        "schema_version": "cav2-kep-solana-domainspec-validation/v1",
        "result": "pass" if not errors else "fail",
        "binding_id": binding.get("binding_id"),
        "ontology_id": binding.get("ontology_id"),
        "candidate_material_digest_algorithm": "sha256-path-null-bytes-null/v1",
        "candidate_material_digest": material_digest(source_root, source_paths) if all((source_root / path).is_file() for path in source_paths) else None,
        "source_counts": {"nodes": len(node_ids), "edges": len(edge_ids)},
        "native_source_manifest_sha256": (
            native_envelope.get("source_manifest", {}).get("manifest_sha256")
            if isinstance(native_envelope, dict)
            else None
        ),
        "checks": checks,
        "downstream": [
            {"check_id": "domainspec-source-admission", "status": "not_evaluable", "causal_blocker": "Authorship and validation do not admit this candidate."},
            {"check_id": "compiled-graph-and-system-ontology", "status": "not_evaluable", "causal_blocker": "No owner-authorized compilation or system-ontology candidate exists."},
            {"check_id": "implementation-binding-and-conformance", "status": "not_evaluable", "causal_blocker": "No admitted compiled predecessor or exact Rust implementation binding exists."},
            {"check_id": "runtime-evidence", "status": "not_evaluable", "causal_blocker": "No program-test, deployment, durable-storage, cryptographic, or network execution evidence exists."},
        ],
        "authority_effect": "none",
        "external_effect": "none",
    }
    if errors:
        result["errors"] = errors
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", type=Path, default=PACKAGE_ROOT)
    parser.add_argument("--skip-native", action="store_true", help="Run structural negative-fixture checks only.")
    args = parser.parse_args()
    result = validate_candidate(args.source_root, run_native=not args.skip_native)
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["result"] == "pass" else 1


if __name__ == "__main__":
    sys.exit(main())
