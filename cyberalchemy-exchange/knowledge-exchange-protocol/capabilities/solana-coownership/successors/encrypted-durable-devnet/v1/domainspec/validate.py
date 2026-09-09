#!/usr/bin/env python3
"""Fail-closed validation for the encrypted durable Devnet DomainSpec candidate."""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Any


PACKAGE_ROOT = Path(__file__).resolve().parent
V1_ROOT = PACKAGE_ROOT.parent
REPO_ROOT = next(parent for parent in PACKAGE_ROOT.parents if (parent / "projects/domainspec-v2").is_dir())
ONTOLOGY_ROOT = V1_ROOT / "ontology"
FEATURE_ID = "encrypted-durable-devnet-coownership"
EXPECTED_SCHEMA = "cav2-kep-solana-encrypted-durable-devnet-domainspec-binding/v1"


def load_author():
    path = PACKAGE_ROOT / "author.py"
    spec = importlib.util.spec_from_file_location("kep_encrypted_durable_devnet_domainspec_author", path)
    if spec is None or spec.loader is None:
        raise RuntimeError("cannot load deterministic DomainSpec author")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def load_json(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"JSON root is not an object: {path}")
    return value


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


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
        f"/workspace/{container_relative}",
    ]
    completed = subprocess.run(command, cwd=REPO_ROOT, text=True, capture_output=True, check=False)
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


def ontology_validation() -> tuple[dict[str, Any] | None, str | None]:
    command = [sys.executable, str(ONTOLOGY_ROOT / "validate.py"), str(ONTOLOGY_ROOT / "candidate.json")]
    env = dict(os.environ)
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    completed = subprocess.run(command, cwd=REPO_ROOT, text=True, capture_output=True, check=False, env=env)
    raw = completed.stdout.strip() or completed.stderr.strip()
    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        result = None
    if completed.returncode != 0 or not isinstance(result, dict) or result.get("status") != "PASS":
        return result, f"selected ontology validation failed: {raw}"
    return result, None


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
    except Exception as exc:
        return {
            "schema_version": "cav2-kep-solana-encrypted-durable-devnet-domainspec-validation/v1",
            "result": "fail",
            "errors": [str(exc)],
            "authority_effect": "none",
            "external_effect": "none",
        }

    before = len(errors)
    if binding.get("schema_version") != EXPECTED_SCHEMA:
        errors.append("binding schema version is unsupported")
    if binding.get("lifecycle_status") != "authored-candidate":
        errors.append("binding lifecycle must remain authored-candidate")
    if binding.get("authority_effect") != "none" or binding.get("external_effect") != "none":
        errors.append("binding must remain non-authoritative and non-effectful")
    expected_authorization = {
        "domainspec_source_admission": "not-authorized-by-this-candidate",
        "compiled_graph_or_system_ontology_admission": "not-authorized",
        "implementation": "not-authorized",
        "credentials_or_wallets": "not-authorized",
        "devnet_transaction": "not-authorized",
        "publication": "not-authorized",
        "deployment": "not-authorized",
    }
    if binding.get("successor_authorization") != expected_authorization:
        errors.append("successor authorization ceiling drift")
    record("candidate-envelope", before, "The binding remains an authored, non-effectful candidate and grants no successor authority.")

    before = len(errors)
    predecessors = binding.get("predecessors")
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
    grammar = binding.get("grammar_binding", {})
    grammar_path = REPO_ROOT / str(grammar.get("path", ""))
    if not grammar_path.is_file() or sha256_file(grammar_path) != grammar.get("sha256"):
        errors.append("DomainSpec grammar binding drift")
    record("exact-predecessor-bytes", before, "The adopted capability, owner decisions, admitted ontology, and parser grammar match exact bound bytes.")

    before = len(errors)
    admission_path = REPO_ROOT / str(predecessors.get("ontology_admission", {}).get("path", ""))
    try:
        admission = load_json(admission_path)
        admitted = admission.get("admission", {})
        ontology_predecessor = predecessors.get("ontology_admission", {})
        if admitted.get("lifecycle_status") != "admitted":
            errors.append("ontology predecessor is not admitted")
        if admitted.get("admitted_ontology_id") != binding.get("ontology_id"):
            errors.append("ontology identity does not match admission")
        if admitted.get("admitted_candidate_sha256") != ontology_predecessor.get("admitted_candidate_sha256"):
            errors.append("ontology candidate digest does not match admission")
        if admitted.get("admitted_material_digest") != ontology_predecessor.get("admitted_material_digest"):
            errors.append("ontology material digest does not match admission")
    except Exception as exc:
        admission = {}
        errors.append(f"cannot read ontology admission: {exc}")
    record("ontology-admission", before, "The exact capability-local business ontology predecessor is admitted.")

    before = len(errors)
    selected = binding.get("selected_ontology_material")
    admitted_artifacts = admission.get("admitted_material", {}).get("artifacts", []) if isinstance(admission, dict) else []
    if selected != admitted_artifacts:
        errors.append("selected ontology material does not exactly equal the admitted artifact set")
    if not isinstance(selected, list):
        selected = []
    for artifact in selected:
        if not isinstance(artifact, dict):
            errors.append("invalid selected ontology material record")
            continue
        relative = artifact.get("path")
        expected = artifact.get("sha256")
        path = ONTOLOGY_ROOT / str(relative)
        if not path.is_file() or sha256_file(path) != expected:
            errors.append(f"selected ontology material drift: {relative}")
    try:
        sources_registry = load_json(ONTOLOGY_ROOT / "sources.json")
        selected_sources = binding.get("selected_source_dependencies", {})
        if selected_sources.get("sources") != sources_registry.get("sources"):
            errors.append("selected ontology source-record closure drift")
        if selected_sources.get("selections") != sources_registry.get("selections"):
            errors.append("selected ontology selector closure drift")
        if selected_sources.get("source_count") != 13 or selected_sources.get("selection_count") != 42:
            errors.append("selected ontology source or selector denominator drift")
    except Exception as exc:
        errors.append(f"cannot resolve selected ontology sources: {exc}")
    ontology_result, ontology_error = ontology_validation()
    if ontology_error:
        errors.append(ontology_error)
    elif ontology_result.get("material_digest") != predecessors.get("ontology_admission", {}).get("admitted_material_digest"):
        errors.append("validated ontology material digest does not match binding")
    record("selected-ontology-dependency-closure", before, "All 11 artifacts, 13 source records, and 42 selectors resolve through the admitted ontology digest.")

    before = len(errors)
    try:
        author = load_author()
        expected_left = author.build_outputs(source_root)
        expected_right = author.build_outputs(source_root)
        left = {path.relative_to(source_root): content for path, content in expected_left.items()}
        right = {path.relative_to(source_root): content for path, content in expected_right.items()}
        if left != right:
            errors.append("two in-memory authorship runs differ")
        issues = author.check_materialized(expected_left, source_root)
        errors.extend(f"authorship drift: {issue}" for issue in issues)
    except Exception as exc:
        expected_left = {}
        errors.append(f"cannot reproduce authored source: {exc}")
    record("deterministic-authorship", before, "Two independent in-memory authoring runs are identical and exactly reproduce every source byte.")

    before = len(errors)
    declared_nodes: set[str] = set()
    declared_edges: set[str] = set()
    source_paths: list[str] = []
    try:
        project = load_json(source_root / "project.json")
        feature_id = binding.get("feature_id")
        feature_path = source_root / "specs" / str(feature_id) / "feature.json"
        feature = load_json(feature_path)
        if project != {"schema_version": "domainspec.project/v1", "project_id": binding.get("source_project_id"), "features": [feature_id], "cross_feature_edges": []}:
            errors.append("project root does not exactly match the binding")
        if feature.get("schema_version") != "domainspec.feature/v1" or feature.get("feature_id") != feature_id:
            errors.append("feature root does not match the binding")
        node_ids = feature.get("nodes")
        edge_ids = feature.get("edges")
        if not isinstance(node_ids, list) or not isinstance(edge_ids, list):
            errors.append("feature nodes and edges must be arrays")
            node_ids, edge_ids = [], []
        declared_nodes = set(node_ids)
        declared_edges = set(edge_ids)
        expected_node_files = {f"specs/{feature_id}/nodes/{node_id}.json" for node_id in node_ids}
        expected_edge_files = {f"specs/{feature_id}/edges/{edge_id}.json" for edge_id in edge_ids}
        actual_node_files = {path.relative_to(source_root).as_posix() for path in (source_root / "specs" / str(feature_id) / "nodes").glob("*.json")}
        actual_edge_files = {path.relative_to(source_root).as_posix() for path in (source_root / "specs" / str(feature_id) / "edges").glob("*.json")}
        if expected_node_files != actual_node_files:
            errors.append("declared node files do not exactly equal authored node files")
        if expected_edge_files != actual_edge_files:
            errors.append("declared edge files do not exactly equal authored edge files")
        if binding.get("source_counts") != {"nodes": len(node_ids), "edges": len(edge_ids)}:
            errors.append("binding source counts do not match feature closure")
        source_paths = ["binding.json", "project.json", feature_path.relative_to(source_root).as_posix(), *sorted(expected_node_files), *sorted(expected_edge_files)]
    except Exception as exc:
        errors.append(f"cannot resolve authored source closure: {exc}")
    record("authored-source-closure", before, "The feature declares exactly 89 nodes and 204 edges with no undeclared DomainSpec JSON source.")

    before = len(errors)
    try:
        definitions = {item["definition_id"] for item in load_json(ONTOLOGY_ROOT / "definition-bindings.json")["bindings"]}
        ontology_nodes = {item["id"] for item in load_json(ONTOLOGY_ROOT / "nodes.json")["nodes"]}
        ontology_relations = {item["relation_id"]: item for item in load_json(ONTOLOGY_ROOT / "relations.json")["relations"]}
        ontology_rules = {item["rule_id"] for item in load_json(ONTOLOGY_ROOT / "rules.json")["rules"]}
        proof_requirements = {item["proof_id"] for item in load_json(ONTOLOGY_ROOT / "proof-requirements.json")["proof_requirements"]}
        mapping_sets = [
            ("definition", definitions, binding.get("definition_mappings"), declared_nodes),
            ("ontology node", ontology_nodes, binding.get("ontology_node_mappings"), declared_nodes),
            ("ontology rule", ontology_rules, binding.get("ontology_rule_mappings"), declared_nodes),
            ("proof requirement", proof_requirements, binding.get("proof_requirement_mappings"), declared_nodes),
        ]
        for label, expected_keys, mapping, allowed_targets in mapping_sets:
            if not isinstance(mapping, dict):
                errors.append(f"{label} mapping must be an object")
                continue
            if set(mapping) != expected_keys:
                errors.append(f"{label} mapping is not total and exact")
            targets: list[Any] = []
            for value in mapping.values():
                targets.extend(value if isinstance(value, list) else [value])
            unknown = {target for target in targets if not isinstance(target, str) or target not in allowed_targets}
            if unknown:
                errors.append(f"{label} mapping references unknown DomainSpec nodes: {sorted(map(str, unknown))}")
        relation_mapping = binding.get("ontology_relation_mappings")
        if not isinstance(relation_mapping, dict) or set(relation_mapping) != set(ontology_relations):
            errors.append("ontology relation mapping is not total and exact")
        elif isinstance(relation_mapping, dict):
            node_mapping = binding.get("ontology_node_mappings", {})
            for relation_id, relation in ontology_relations.items():
                projection = relation_mapping.get(relation_id, {})
                if projection.get("business_relationship") != relation["relationship"]:
                    errors.append(f"ontology relation label drift: {relation_id}")
                if projection.get("source_domain_nodes") != node_mapping.get(relation["source"]):
                    errors.append(f"ontology relation source mapping drift: {relation_id}")
                if projection.get("target_domain_nodes") != node_mapping.get(relation["target"]):
                    errors.append(f"ontology relation target mapping drift: {relation_id}")
                projected_edges = projection.get("system_projection_edges")
                if not isinstance(projected_edges, list) or not projected_edges or set(projected_edges) - declared_edges:
                    errors.append(f"ontology relation system projection is incomplete: {relation_id}")
    except Exception as exc:
        errors.append(f"cannot validate ontology mapping closure: {exc}")
    record("ontology-mapping-closure", before, "All 32 definitions, 49 nodes, 54 relations, 26 rules, and 13 proof requirements map totally to authored source.")

    native_envelope: dict[str, Any] | None = None
    if run_native:
        before = len(errors)
        native_envelope, native_error = native_lint(source_root)
        if native_error:
            errors.append(native_error)
        record("native-domainspec-lint", before, "The current DomainSpec v2 parser validates closed typed bodies, references, relationship signatures, and graph obligations.")

    candidate_digest = None
    if source_paths and all((source_root / relative).is_file() for relative in source_paths):
        candidate_digest = material_digest(source_root, source_paths)
    result: dict[str, Any] = {
        "schema_version": "cav2-kep-solana-encrypted-durable-devnet-domainspec-validation/v1",
        "result": "pass" if not errors else "fail",
        "binding_id": binding.get("binding_id"),
        "ontology_id": binding.get("ontology_id"),
        "lifecycle_status": "authored-candidate",
        "candidate_material_digest_algorithm": "sha256-path-null-bytes-null/v1",
        "candidate_material_digest": candidate_digest,
        "source_counts": {"nodes": len(declared_nodes), "edges": len(declared_edges)},
        "mapping_counts": {
            "definitions": len(binding.get("definition_mappings", {})),
            "ontology_nodes": len(binding.get("ontology_node_mappings", {})),
            "ontology_relations": len(binding.get("ontology_relation_mappings", {})),
            "ontology_rules": len(binding.get("ontology_rule_mappings", {})),
            "proof_requirements": len(binding.get("proof_requirement_mappings", {})),
        },
        "native_source_manifest_sha256": native_envelope.get("source_manifest", {}).get("manifest_sha256") if isinstance(native_envelope, dict) else None,
        "checks": checks,
        "downstream": [
            {"check_id": "domainspec-source-admission", "status": "not_evaluable", "causal_blocker": "Authorship and validation do not admit this exact candidate digest."},
            {"check_id": "compiled-graph-and-system-ontology", "status": "not_evaluable", "causal_blocker": "No separately authorized source admission or retained deterministic compilation exists."},
            {"check_id": "implementation-binding-and-conformance", "status": "not_evaluable", "causal_blocker": "No admitted compiled predecessor or exact Rust implementation binding exists."},
            {"check_id": "devnet-trial", "status": "not_evaluable", "causal_blocker": "Credentials, wallets, RPC, deployment, transactions, and external effects remain unauthorized and absent."},
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
    parser.add_argument("--skip-native", action="store_true")
    args = parser.parse_args()
    result = validate_candidate(args.source_root, run_native=not args.skip_native)
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["result"] == "pass" else 1


if __name__ == "__main__":
    sys.exit(main())
