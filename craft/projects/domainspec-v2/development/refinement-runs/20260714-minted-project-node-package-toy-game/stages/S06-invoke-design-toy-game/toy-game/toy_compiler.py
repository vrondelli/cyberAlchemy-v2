#!/usr/bin/env python3
"""Disposable compiler for the Key and Door refinement tournament."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any

import yaml


class CompileFailure(Exception):
    def __init__(self, code: str, detail: str):
        super().__init__(f"{code}: {detail}")
        self.code = code
        self.detail = detail


def canonical_bytes(value: Any) -> bytes:
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n").encode("utf-8")


def pretty_bytes(value: Any) -> bytes:
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2) + "\n").encode("utf-8")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def load_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise CompileFailure("invalid-json", f"{path.name}: {exc}") from exc
    if not isinstance(value, dict):
        raise CompileFailure("invalid-record", f"{path.name} must contain an object")
    return value


def resolve_under(root: Path, base: Path, relative: str) -> Path:
    rel = Path(relative)
    if rel.is_absolute():
        raise CompileFailure("source-path-escape", f"absolute path is forbidden: {relative}")
    candidate = (base / rel).resolve()
    try:
        candidate.relative_to(root.resolve())
    except ValueError as exc:
        raise CompileFailure("source-path-escape", f"path leaves consumer project: {relative}") from exc
    if not candidate.is_file():
        raise CompileFailure("missing-source", f"source does not exist: {relative}")
    return candidate


def relative_path(root: Path, path: Path) -> str:
    return path.resolve().relative_to(root.resolve()).as_posix()


def require_fields(record: dict[str, Any], fields: list[str], record_name: str) -> None:
    for field in fields:
        if field not in record or record[field] is None or record[field] == "":
            raise CompileFailure("missing-machine-field", f"{record_name} lacks required field {field}")


def load_language(meta_types: Path, relationships: Path, project: dict[str, Any]) -> tuple[set[str], dict[str, dict[str, Any]], dict[str, str]]:
    actual = {
        "kinds_digest": sha256_file(meta_types),
        "relationships_digest": sha256_file(relationships),
    }
    declared = project.get("language")
    if declared != actual:
        raise CompileFailure("language-digest-mismatch", f"declared={declared!r} actual={actual!r}")

    meta_data = yaml.safe_load(meta_types.read_text(encoding="utf-8"))
    kinds = {member["term"] for member in meta_data.get("members", []) if member.get("term")}
    relationship_data = json.loads(relationships.read_text(encoding="utf-8"))
    signatures = {
        signature["id"]: signature
        for signature in relationship_data.get("signatures", [])
        if signature.get("status") == "active"
    }
    return kinds, signatures, actual


def collect_sources(root: Path) -> tuple[dict[str, Any], list[dict[str, Any]], list[dict[str, Any]], set[Path]]:
    project_path = root / "project.json"
    if not project_path.is_file():
        raise CompileFailure("missing-source", "project.json")
    project = load_json(project_path)
    require_fields(project, ["schema_version", "project_id", "language", "features"], "project")

    nodes: list[dict[str, Any]] = []
    edges: list[dict[str, Any]] = []
    source_files: set[Path] = {project_path.resolve()}

    features = project.get("features")
    if not isinstance(features, list) or not features:
        raise CompileFailure("missing-machine-field", "project features must be a non-empty list")

    for feature_ref in features:
        feature_path = resolve_under(root, root, feature_ref)
        source_files.add(feature_path)
        feature = load_json(feature_path)
        require_fields(feature, ["schema_version", "feature_id", "source_layout"], feature_path.name)
        layout = feature["source_layout"]

        if layout in {"per-node-connections", "per-node-plus-edges"}:
            refs = feature.get("node_sources")
            if not isinstance(refs, list) or not refs:
                raise CompileFailure("missing-machine-field", f"{feature_path.name} lacks node_sources")
            for ref in refs:
                path = resolve_under(root, feature_path.parent, ref)
                source_files.add(path)
                node = load_json(path)
                node["__source_path"] = relative_path(root, path)
                nodes.append(node)
                if layout == "per-node-connections":
                    connections = node.get("connections")
                    if not isinstance(connections, list):
                        raise CompileFailure("missing-machine-field", f"{path.name} lacks connections list")
                    for raw in connections:
                        if not isinstance(raw, dict):
                            raise CompileFailure("invalid-record", f"{path.name} connection must be an object")
                        edge = dict(raw)
                        edge["from"] = node.get("node_id")
                        edge["__source_path"] = relative_path(root, path)
                        edges.append(edge)

            if layout == "per-node-plus-edges":
                refs = feature.get("edge_sources")
                if not isinstance(refs, list) or not refs:
                    raise CompileFailure("missing-machine-field", f"{feature_path.name} lacks edge_sources")
                for ref in refs:
                    path = resolve_under(root, feature_path.parent, ref)
                    source_files.add(path)
                    edge = load_json(path)
                    edge["__source_path"] = relative_path(root, path)
                    edges.append(edge)

        elif layout == "aspect-bundles":
            refs = feature.get("aspect_sources")
            if not isinstance(refs, list) or not refs:
                raise CompileFailure("missing-machine-field", f"{feature_path.name} lacks aspect_sources")
            for ref in refs:
                path = resolve_under(root, feature_path.parent, ref)
                source_files.add(path)
                bundle = load_json(path)
                for raw_node in bundle.get("nodes", []):
                    if not isinstance(raw_node, dict):
                        raise CompileFailure("invalid-record", f"{path.name} node must be an object")
                    node = dict(raw_node)
                    node["__source_path"] = relative_path(root, path)
                    nodes.append(node)
                for raw_edge in bundle.get("connections", []):
                    if not isinstance(raw_edge, dict):
                        raise CompileFailure("invalid-record", f"{path.name} connection must be an object")
                    edge = dict(raw_edge)
                    edge["__source_path"] = relative_path(root, path)
                    edges.append(edge)
        else:
            raise CompileFailure("unknown-layout", str(layout))

    return project, nodes, edges, source_files


def validate_and_normalize(
    root: Path,
    project: dict[str, Any],
    nodes: list[dict[str, Any]],
    edges: list[dict[str, Any]],
    source_files: set[Path],
    kinds: set[str],
    signatures: dict[str, dict[str, Any]],
    language: dict[str, str],
) -> tuple[dict[str, Any], dict[str, Any]]:
    node_by_id: dict[str, dict[str, Any]] = {}
    node_records: list[dict[str, Any]] = []
    provenance_records: list[dict[str, Any]] = []

    for node in nodes:
        source_path = node.get("__source_path", "unknown")
        require_fields(node, ["schema_version", "node_id", "feature_id", "kind", "intent", "body"], source_path)
        node_id = node["node_id"]
        if node_id in node_by_id:
            raise CompileFailure("duplicate-node-id", node_id)
        if node["kind"] not in kinds:
            raise CompileFailure("unknown-kind", f"{node_id}: {node['kind']}")
        if not isinstance(node["body"], dict):
            raise CompileFailure("invalid-record", f"{node_id} body must be an object")
        node_by_id[node_id] = node
        node_records.append({
            "node_id": node_id,
            "feature_id": node["feature_id"],
            "kind": node["kind"],
            "intent": node["intent"],
            "body": node["body"],
        })
        source_file = root / source_path
        provenance_records.append({
            "record_type": "node",
            "record_id": node_id,
            "source_path": source_path,
            "source_sha256": sha256_file(source_file),
        })

    edge_by_id: dict[str, dict[str, Any]] = {}
    for edge in edges:
        source_path = edge.get("__source_path", "unknown")
        require_fields(edge, ["edge_id", "type", "from", "to"], source_path)
        edge_id = edge["edge_id"]
        if edge_id in edge_by_id:
            raise CompileFailure("duplicate-edge-id", edge_id)
        edge_by_id[edge_id] = edge

    edge_records: list[dict[str, Any]] = []
    for edge_id, edge in edge_by_id.items():
        source_id = edge["from"]
        target_id = edge["to"]
        if source_id not in node_by_id:
            raise CompileFailure("dangling-source", f"{edge_id}: {source_id}")
        if target_id not in node_by_id:
            raise CompileFailure("dangling-target", f"{edge_id}: {target_id}")
        signature = signatures.get(edge["type"])
        if signature is None:
            raise CompileFailure("unknown-relationship", f"{edge_id}: {edge['type']}")
        actual_pair = (node_by_id[source_id]["kind"], node_by_id[target_id]["kind"])
        expected_pair = (signature["source_type"], signature["target_type"])
        if actual_pair != expected_pair:
            raise CompileFailure("endpoint-invalid", f"{edge_id}: {actual_pair!r} != {expected_pair!r}")
        edge_records.append({
            "edge_id": edge_id,
            "type": edge["type"],
            "from": source_id,
            "to": target_id,
        })
        source_path = edge["__source_path"]
        provenance_records.append({
            "record_type": "edge",
            "record_id": edge_id,
            "source_path": source_path,
            "source_sha256": sha256_file(root / source_path),
        })

    graph = {
        "schema_version": "minted-graph/v0",
        "project_id": project["project_id"],
        "language": language,
        "nodes": sorted(node_records, key=lambda item: item["node_id"]),
        "edges": sorted(edge_records, key=lambda item: item["edge_id"]),
    }

    input_records = [
        {"path": relative_path(root, path), "sha256": sha256_file(path)}
        for path in sorted(source_files, key=lambda item: relative_path(root, item))
    ]
    source_manifest = {
        "schema_version": "minted-source-manifest/v0",
        "project_id": project["project_id"],
        "source_set_sha256": sha256_bytes(canonical_bytes(input_records)),
        "inputs": input_records,
        "records": sorted(provenance_records, key=lambda item: (item["record_type"], item["record_id"])),
    }
    return graph, source_manifest


def render_markdown(graph: dict[str, Any], graph_sha256: str) -> str:
    lines = [
        "# Key and Door Specification",
        "",
        "Generated human view. Canonical semantics live in the project-local machine sources.",
        "",
        f"Graph SHA-256: `{graph_sha256}`",
        "",
        "## Nodes",
        "",
        "| Node | Kind | Intent |",
        "| --- | --- | --- |",
    ]
    for node in graph["nodes"]:
        intent = str(node["intent"]).replace("|", "\\|")
        lines.append(f"| `{node['node_id']}` | {node['kind']} | {intent} |")
    lines.extend(["", "## Edges", "", "| Edge | From | Type | To |", "| --- | --- | --- | --- |"])
    for edge in graph["edges"]:
        lines.append(f"| `{edge['edge_id']}` | `{edge['from']}` | `{edge['type']}` | `{edge['to']}` |")
    lines.extend(["", "This file is generated; edit machine sources and rebuild.", ""])
    return "\n".join(lines)


def compile_project(root: Path, output: Path, meta_types: Path, relationships: Path) -> dict[str, Any]:
    root = root.resolve()
    project, nodes, edges, source_files = collect_sources(root)
    kinds, signatures, language = load_language(meta_types, relationships, project)
    graph, source_manifest = validate_and_normalize(root, project, nodes, edges, source_files, kinds, signatures, language)

    output.mkdir(parents=True, exist_ok=True)
    graph_bytes = pretty_bytes(graph)
    graph_sha256 = sha256_bytes(graph_bytes)
    markdown_bytes = render_markdown(graph, graph_sha256).encode("utf-8")
    manifest_bytes = pretty_bytes(source_manifest)

    (output / "graph.json").write_bytes(graph_bytes)
    (output / "source-manifest.json").write_bytes(manifest_bytes)
    (output / "SPEC.md").write_bytes(markdown_bytes)

    receipt = {
        "schema_version": "minted-build-receipt/v0",
        "project_id": project["project_id"],
        "language": language,
        "source_set_sha256": source_manifest["source_set_sha256"],
        "graph_sha256": graph_sha256,
        "source_manifest_sha256": sha256_bytes(manifest_bytes),
        "markdown_sha256": sha256_bytes(markdown_bytes),
    }
    (output / "build-receipt.json").write_bytes(pretty_bytes(receipt))
    return receipt


def verify_build(output: Path) -> dict[str, Any]:
    receipt = load_json(output / "build-receipt.json")
    checks = [
        ("graph.json", "graph_sha256", "stale-graph"),
        ("source-manifest.json", "source_manifest_sha256", "stale-source-manifest"),
        ("SPEC.md", "markdown_sha256", "stale-markdown"),
    ]
    for filename, field, failure_code in checks:
        path = output / filename
        if not path.is_file() or sha256_file(path) != receipt.get(field):
            raise CompileFailure(failure_code, filename)
    return receipt


def main() -> int:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command", required=True)
    compile_parser = subparsers.add_parser("compile")
    compile_parser.add_argument("--project-root", type=Path, required=True)
    compile_parser.add_argument("--output", type=Path, required=True)
    compile_parser.add_argument("--meta-types", type=Path, required=True)
    compile_parser.add_argument("--relationships", type=Path, required=True)
    verify_parser = subparsers.add_parser("verify")
    verify_parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    try:
        if args.command == "compile":
            result = compile_project(args.project_root, args.output, args.meta_types, args.relationships)
        else:
            result = verify_build(args.output)
    except CompileFailure as exc:
        print(json.dumps({"result": "FAIL", "failure_code": exc.code, "detail": exc.detail}, sort_keys=True))
        return 2
    print(json.dumps({"result": "PASS", "receipt": result}, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

