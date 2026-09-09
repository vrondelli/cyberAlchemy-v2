#!/usr/bin/env python3
"""Fail-closed loopback server for the pinned IOLM fixture boundary."""

from __future__ import annotations

import argparse
import hashlib
import json
import mimetypes
import os
import sys
from dataclasses import dataclass
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path, PurePosixPath
from types import MappingProxyType
from typing import Any, Mapping
from urllib.parse import urlsplit


PACKAGE_ROOT = Path(__file__).resolve().parent
BINDING_SCHEMA_NAME = "source-binding.v1.schema.json"

CANONICAL_FIXTURES = {
    "graph": {
        "path": "projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/expected/graph.json",
        "route": "/fixtures/graph.json",
        "sha256": "1f0691fac9ed9612605d62d8b390e9b39eca24b6f11a6b0868c7591c6179e7ae",
        "hash_code": "BIND_GRAPH_HASH_MISMATCH",
    },
    "source_manifest": {
        "path": "projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/expected/source-manifest.json",
        "route": "/fixtures/source-manifest.json",
        "sha256": "ed4a1fdf4684b26fb5dbf086cf98f80050734ffea1d2c845503f0bf429e9cd6e",
        "hash_code": "BIND_MANIFEST_HASH_MISMATCH",
    },
    "build_receipt": {
        "path": "projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/expected/build-receipt.json",
        "route": "/fixtures/build-receipt.json",
        "sha256": "14ac660824e8a697ef6ae3e20b18132bf99aa45f9adbe46e46e686db36260fbe",
        "hash_code": "BIND_RECEIPT_HASH_MISMATCH",
    },
}

EXPECTED = {
    "project_id": "key-and-door",
    "source_set_digest": "33b2b650bcd5e4f4ab8c4f03c892bca8fcc660d167c9b6220a775e0b5bccdb1c",
    "profile_ref": "feature-with-independent-node-files@1",
    "profile_digest": "0868785499944ce2b21b915962cba48f8b21d627b840c24d81c77194e8864478",
    "generator_version": "minted-project-tools/v1",
    "kinds_digest": "4394968327b785d50cd323ad58a799feb71b9debf7e06b650b4fd1e4008f9ede",
    "relationships_digest": "ffc97f2c358e4bebeebd8ceeb25aef59628be9c970cf6a7e510f7a37c9876d9f",
    "node_count": 4,
    "edge_count": 3,
    "node_ids": [
        "key-and-door.DoorUnlocked",
        "key-and-door.HasKeyRule",
        "key-and-door.Player",
        "key-and-door.UnlockDoor",
    ],
    "edge_ids": [
        "key-and-door.edge.has-key-rule-enforces-unlock-door",
        "key-and-door.edge.player-performs-unlock-door",
        "key-and-door.edge.unlock-door-produces-door-unlocked",
    ],
}

EXPECTED_NODE_MEANING = {
    "key-and-door.DoorUnlocked": "Event",
    "key-and-door.HasKeyRule": "Rule",
    "key-and-door.Player": "Entity",
    "key-and-door.UnlockDoor": "Operation",
}

EXPECTED_EDGE_MEANING = {
    "key-and-door.edge.has-key-rule-enforces-unlock-door": (
        "enforces",
        "key-and-door.HasKeyRule",
        "key-and-door.UnlockDoor",
    ),
    "key-and-door.edge.player-performs-unlock-door": (
        "performs",
        "key-and-door.Player",
        "key-and-door.UnlockDoor",
    ),
    "key-and-door.edge.unlock-door-produces-door-unlocked": (
        "produces",
        "key-and-door.UnlockDoor",
        "key-and-door.DoorUnlocked",
    ),
}

INELIGIBLE_FOR = [
    "SWU-IOLM-00C-B",
    "SWU-IOLM-00C-C",
    "G-DSV2-SG",
    "CROSS_FEATURE_UNSUPPORTED",
    "promotion",
    "publication",
]

# Future A2/A3 assets are explicit now so they can become addressable only after
# their owning SWU creates them and the server is restarted. Missing files are 404.
APPLICATION_ROUTES = {
    "/": "index.html",
    "/index.html": "index.html",
    "/contracts/source-binding.v1.json": "contracts/source-binding.v1.json",
    "/contracts/source-binding.v1.schema.json": "contracts/source-binding.v1.schema.json",
    "/assets/gateway.mjs": "assets/gateway.mjs",
    "/assets/binding-guard.mjs": "assets/binding-guard.mjs",
    "/assets/demo-snapshot-v1.mjs": "assets/demo-snapshot-v1.mjs",
    "/assets/question-slice.mjs": "assets/question-slice.mjs",
    "/assets/demo.css": "assets/demo.css",
    "/assets/app.mjs": "assets/app.mjs",
    "/assets/selection.mjs": "assets/selection.mjs",
    "/assets/graph-view.mjs": "assets/graph-view.mjs",
    "/assets/outline-view.mjs": "assets/outline-view.mjs",
    "/assets/table-view.mjs": "assets/table-view.mjs",
    "/assets/provenance-inspector.mjs": "assets/provenance-inspector.mjs",
    "/generated/read-models/demo-snapshot.v1.json": "generated/read-models/demo-snapshot.v1.json",
}


class BindingError(ValueError):
    """Typed boundary failure safe for task evidence and CLI reporting."""

    def __init__(
        self,
        code: str,
        field: str,
        message: str,
        *,
        expected: Any | None = None,
        actual: Any | None = None,
    ) -> None:
        super().__init__(f"{code}: {message}")
        self.code = code
        self.field = field
        self.message = message
        self.expected = expected
        self.actual = actual

    def as_dict(self) -> dict[str, Any]:
        def json_safe(value: Any) -> Any:
            if isinstance(value, set):
                return sorted(json_safe(item) for item in value)
            if isinstance(value, (list, tuple)):
                return [json_safe(item) for item in value]
            if isinstance(value, dict):
                return {str(key): json_safe(item) for key, item in value.items()}
            if isinstance(value, Path):
                return str(value)
            return value

        result: dict[str, Any] = {
            "status": "block",
            "code": self.code,
            "field": self.field,
            "message": self.message,
            "owner_route": "private-learning-map-product-owner",
            "recovery": "Restore the pinned contract or route the defect to SWU-IOLM-00C-UI-A1.",
            "posture": "candidate",
            "authority_effect": "none",
            "ineligible_for": list(INELIGIBLE_FOR),
        }
        if self.expected is not None:
            result["expected"] = json_safe(self.expected)
        if self.actual is not None:
            result["actual"] = json_safe(self.actual)
        return result


@dataclass(frozen=True)
class ValidatedBoundary:
    report: Mapping[str, Any]
    fixture_paths: Mapping[str, Path]
    fixture_payloads: Mapping[str, bytes]


def _sha256(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def _require_equal(
    actual: Any,
    expected: Any,
    code: str,
    field: str,
    message: str,
) -> None:
    if actual != expected:
        raise BindingError(
            code,
            field,
            message,
            expected=expected,
            actual=actual,
        )


def _duplicate_guard(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise BindingError(
                "JSON_DUPLICATE_KEY",
                key,
                "JSON objects must not contain duplicate keys.",
            )
        result[key] = value
    return result


def _decode_json(payload: bytes, field: str) -> dict[str, Any]:
    try:
        value = json.loads(payload, object_pairs_hook=_duplicate_guard)
    except BindingError:
        raise
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise BindingError(
            "JSON_INVALID",
            field,
            "Artifact is not valid UTF-8 JSON.",
            actual=str(error),
        ) from error
    if not isinstance(value, dict):
        raise BindingError("JSON_ROOT_INVALID", field, "JSON root must be an object.")
    return value


def _read_json_file(path: Path, field: str) -> dict[str, Any]:
    try:
        payload = path.read_bytes()
    except OSError as error:
        raise BindingError(
            "BIND_FILE_UNREADABLE",
            field,
            "Required binding artifact cannot be read.",
            actual=str(error),
        ) from error
    return _decode_json(payload, field)


def _absolute_lexical(path: str | os.PathLike[str]) -> Path:
    return Path(os.path.abspath(os.fspath(path)))


def _reject_symlink_components(path: Path, field: str) -> None:
    absolute = _absolute_lexical(path)
    current = Path(absolute.anchor)
    for part in absolute.parts[1:]:
        current = current / part
        if current.is_symlink():
            raise BindingError(
                "BIND_PATH_SYMLINKED",
                field,
                "No path component may be a symbolic link.",
                actual=str(current),
            )


def _resolve_repo_root(repo_root: str | os.PathLike[str]) -> Path:
    root = _absolute_lexical(repo_root)
    _reject_symlink_components(root, "repo_root")
    try:
        resolved = root.resolve(strict=True)
    except OSError as error:
        raise BindingError(
            "BIND_REPO_ROOT_INVALID",
            "repo_root",
            "The explicit repository root must exist.",
            actual=str(error),
        ) from error
    if not resolved.is_dir():
        raise BindingError(
            "BIND_REPO_ROOT_INVALID",
            "repo_root",
            "The explicit repository root must be a directory.",
            actual=str(resolved),
        )
    return resolved


def _validate_relative_fixture_path(role: str, value: Any) -> str:
    if not isinstance(value, str):
        raise BindingError(
            "BIND_PATH_NOT_CANONICAL_ALLOWLIST",
            f"inputs.{role}.path",
            "Fixture path must be the literal canonical string.",
            actual=value,
        )
    parsed = PurePosixPath(value)
    if parsed.is_absolute() or ".." in parsed.parts:
        raise BindingError(
            "BIND_PATH_OUTSIDE_REPO_ROOT",
            f"inputs.{role}.path",
            "Absolute paths and parent traversal are forbidden.",
            actual=value,
        )
    expected = CANONICAL_FIXTURES[role]["path"]
    if value != expected:
        raise BindingError(
            "BIND_PATH_NOT_CANONICAL_ALLOWLIST",
            f"inputs.{role}.path",
            "Alternate paths are forbidden even when they resolve to the same bytes.",
            expected=expected,
            actual=value,
        )
    return value


def _resolve_fixture_path(repo_root: Path, role: str, relative_path: str) -> Path:
    lexical = repo_root.joinpath(*PurePosixPath(relative_path).parts)
    _reject_symlink_components(lexical, f"inputs.{role}.path")
    try:
        resolved = lexical.resolve(strict=True)
    except OSError as error:
        raise BindingError(
            "BIND_FILE_UNREADABLE",
            f"inputs.{role}.path",
            "Pinned fixture file must exist.",
            actual=str(error),
        ) from error
    try:
        resolved.relative_to(repo_root)
    except ValueError as error:
        raise BindingError(
            "BIND_PATH_OUTSIDE_REPO_ROOT",
            f"inputs.{role}.path",
            "Resolved fixture path escapes the explicit repository root.",
            actual=str(resolved),
        ) from error
    if not resolved.is_file():
        raise BindingError(
            "BIND_FILE_UNREADABLE",
            f"inputs.{role}.path",
            "Pinned fixture path must resolve to a regular file.",
            actual=str(resolved),
        )
    return resolved


def _validate_schema_file(schema_path: Path) -> None:
    _reject_symlink_components(schema_path, "binding_schema")
    schema = _read_json_file(schema_path, "binding_schema")
    _require_equal(
        schema.get("$schema"),
        "https://json-schema.org/draft/2020-12/schema",
        "BIND_SCHEMA_INVALID",
        "binding_schema.$schema",
        "Binding schema must use Draft 2020-12.",
    )
    _require_equal(
        schema.get("type"),
        "object",
        "BIND_SCHEMA_INVALID",
        "binding_schema.type",
        "Binding schema root must be an object.",
    )
    _require_equal(
        schema.get("additionalProperties"),
        False,
        "BIND_SCHEMA_INVALID",
        "binding_schema.additionalProperties",
        "Binding schema must be default-deny.",
    )


def validate_binding_contract(binding: Any) -> dict[str, Any]:
    if not isinstance(binding, dict):
        raise BindingError("BIND_SCHEMA_INVALID", "binding", "Binding root must be an object.")

    expected_root_keys = {
        "$schema",
        "schema_version",
        "binding_id",
        "artifact_role",
        "posture",
        "authority_effect",
        "owner_route",
        "inputs",
        "expected",
        "ineligible_for",
    }
    _require_equal(
        set(binding),
        expected_root_keys,
        "BIND_SCHEMA_INVALID",
        "binding.keys",
        "Binding root fields must match the v1 contract exactly.",
    )
    fixed = {
        "$schema": BINDING_SCHEMA_NAME,
        "schema_version": "iolm-source-binding/v1",
        "binding_id": "key-and-door-pinned-fixture",
        "artifact_role": "fixture-binding",
        "posture": "candidate",
        "authority_effect": "none",
        "owner_route": "private-learning-map-product-owner",
    }
    for field, expected in fixed.items():
        _require_equal(
            binding.get(field),
            expected,
            "BIND_SCHEMA_INVALID",
            field,
            "Binding identity or posture field is invalid.",
        )

    inputs = binding.get("inputs")
    if not isinstance(inputs, dict):
        raise BindingError("BIND_SCHEMA_INVALID", "inputs", "Inputs must be an object.")
    _require_equal(
        set(inputs),
        set(CANONICAL_FIXTURES),
        "BIND_SCHEMA_INVALID",
        "inputs.keys",
        "Binding must name exactly the three fixture roles.",
    )
    for role, canonical in CANONICAL_FIXTURES.items():
        entry = inputs.get(role)
        if not isinstance(entry, dict):
            raise BindingError(
                "BIND_SCHEMA_INVALID",
                f"inputs.{role}",
                "Fixture entry must be an object.",
            )
        _require_equal(
            set(entry),
            {"path", "route", "sha256"},
            "BIND_SCHEMA_INVALID",
            f"inputs.{role}.keys",
            "Fixture entry fields must match the v1 contract exactly.",
        )
        _validate_relative_fixture_path(role, entry.get("path"))
        _require_equal(
            entry.get("route"),
            canonical["route"],
            "BIND_ROUTE_MISMATCH",
            f"inputs.{role}.route",
            "Fixture route is not canonical.",
        )
        _require_equal(
            entry.get("sha256"),
            canonical["sha256"],
            canonical["hash_code"],
            f"inputs.{role}.sha256",
            "Pinned artifact hash is not canonical.",
        )

    expected_block = binding.get("expected")
    if not isinstance(expected_block, dict):
        raise BindingError("BIND_SCHEMA_INVALID", "expected", "Expected block must be an object.")
    _require_equal(
        set(expected_block),
        set(EXPECTED),
        "BIND_SCHEMA_INVALID",
        "expected.keys",
        "Expected fields must match the v1 contract exactly.",
    )
    field_codes = {
        "source_set_digest": "BIND_SOURCE_SET_MISMATCH",
        "profile_ref": "BIND_PROFILE_MISMATCH",
        "profile_digest": "BIND_PROFILE_MISMATCH",
        "generator_version": "BIND_GENERATOR_MISMATCH",
        "kinds_digest": "BIND_REGISTRY_MISMATCH",
        "relationships_digest": "BIND_REGISTRY_MISMATCH",
    }
    for field, expected in EXPECTED.items():
        _require_equal(
            expected_block.get(field),
            expected,
            field_codes.get(field, "BIND_EXPECTATION_MISMATCH"),
            f"expected.{field}",
            "Pinned expectation is not canonical.",
        )
    _require_equal(
        binding.get("ineligible_for"),
        INELIGIBLE_FOR,
        "BIND_ELIGIBILITY_FENCE_MISMATCH",
        "ineligible_for",
        "The complete eligibility fence is mandatory and ordered.",
    )
    return binding


def _validate_graph(graph: dict[str, Any], expected: dict[str, Any]) -> None:
    _require_equal(graph.get("schema_version"), "minted-graph/v1", "BIND_GRAPH_SCHEMA_MISMATCH", "graph.schema_version", "Unexpected graph schema.")
    _require_equal(graph.get("authority"), "generated-semantic-read-model", "BIND_GRAPH_AUTHORITY_MISMATCH", "graph.authority", "Unexpected graph authority label.")
    _require_equal(graph.get("project_id"), expected["project_id"], "BIND_PROJECT_MISMATCH", "graph.project_id", "Graph project is not pinned.")
    _require_equal(graph.get("source_set_digest"), expected["source_set_digest"], "BIND_SOURCE_SET_MISMATCH", "graph.source_set_digest", "Graph source-set digest differs.")
    language = graph.get("language")
    if not isinstance(language, dict):
        raise BindingError("BIND_PROFILE_MISMATCH", "graph.language", "Graph language binding is required.")
    for field in ("profile_digest", "kinds_digest", "relationships_digest"):
        _require_equal(language.get(field), expected[field], "BIND_PROFILE_MISMATCH" if field == "profile_digest" else "BIND_REGISTRY_MISMATCH", f"graph.language.{field}", "Graph language digest differs.")

    nodes = graph.get("nodes")
    edges = graph.get("edges")
    if not isinstance(nodes, list) or not isinstance(edges, list):
        raise BindingError("BIND_GRAPH_SHAPE_INVALID", "graph", "Graph nodes and edges must be arrays.")
    node_ids = [node.get("node_id") for node in nodes if isinstance(node, dict)]
    edge_ids = [edge.get("edge_id") for edge in edges if isinstance(edge, dict)]
    _require_equal(len(node_ids), len(nodes), "BIND_GRAPH_SHAPE_INVALID", "graph.nodes", "Every node must be an object with an ID.")
    _require_equal(len(edge_ids), len(edges), "BIND_GRAPH_SHAPE_INVALID", "graph.edges", "Every edge must be an object with an ID.")
    _require_equal(node_ids, expected["node_ids"], "BIND_NODE_SET_MISMATCH", "graph.nodes[].node_id", "Node IDs or order differ from the pinned set.")
    _require_equal(edge_ids, expected["edge_ids"], "BIND_EDGE_SET_MISMATCH", "graph.edges[].edge_id", "Edge IDs or order differ from the pinned set.")
    _require_equal(len(set(node_ids)), expected["node_count"], "BIND_NODE_SET_MISMATCH", "graph.nodes[].node_id", "Node IDs must be unique.")
    _require_equal(len(set(edge_ids)), expected["edge_count"], "BIND_EDGE_SET_MISMATCH", "graph.edges[].edge_id", "Edge IDs must be unique.")

    for node in nodes:
        node_id = node["node_id"]
        _require_equal(node.get("feature_id"), expected["project_id"], "BIND_FEATURE_NAMESPACE_MISMATCH", f"graph.nodes[{node_id}].feature_id", "Node feature namespace differs.")
        _require_equal(node.get("kind"), EXPECTED_NODE_MEANING[node_id], "BIND_NODE_MEANING_MISMATCH", f"graph.nodes[{node_id}].kind", "Pinned node kind differs.")
    node_set = set(node_ids)
    for edge in edges:
        edge_id = edge["edge_id"]
        relation, source, target = EXPECTED_EDGE_MEANING[edge_id]
        if edge.get("from") not in node_set or edge.get("to") not in node_set:
            raise BindingError("EDGE_ENDPOINT_UNRESOLVED", f"graph.edges[{edge_id}]", "Edge endpoints must resolve to pinned nodes.")
        _require_equal((edge.get("type"), edge.get("from"), edge.get("to")), (relation, source, target), "BIND_EDGE_MEANING_MISMATCH", f"graph.edges[{edge_id}]", "Pinned relation meaning or direction differs.")


def _validate_manifest(manifest: dict[str, Any], graph: dict[str, Any], expected: dict[str, Any]) -> None:
    _require_equal(manifest.get("schema_version"), "minted-source-manifest/v1", "BIND_MANIFEST_SCHEMA_MISMATCH", "source_manifest.schema_version", "Unexpected source-manifest schema.")
    _require_equal(manifest.get("authority"), "generated-provenance-read-model", "BIND_MANIFEST_AUTHORITY_MISMATCH", "source_manifest.authority", "Unexpected manifest authority label.")
    _require_equal(manifest.get("project_id"), expected["project_id"], "BIND_PROJECT_MISMATCH", "source_manifest.project_id", "Manifest project is not pinned.")
    _require_equal(manifest.get("source_set_digest"), expected["source_set_digest"], "BIND_SOURCE_SET_MISMATCH", "source_manifest.source_set_digest", "Manifest source-set digest differs.")
    inputs = manifest.get("inputs")
    records = manifest.get("records")
    if not isinstance(inputs, list) or not isinstance(records, list):
        raise BindingError("BIND_MANIFEST_SHAPE_INVALID", "source_manifest", "Manifest inputs and records must be arrays.")
    source_digests: dict[str, str] = {}
    for item in inputs:
        if not isinstance(item, dict) or not isinstance(item.get("path"), str) or not isinstance(item.get("digest"), str):
            raise BindingError("BIND_MANIFEST_SHAPE_INVALID", "source_manifest.inputs", "Every input requires path and digest.")
        if item["path"] in source_digests:
            raise BindingError("MANIFEST_SOURCE_AMBIGUOUS", item["path"], "Manifest source paths must be unique.")
        source_digests[item["path"]] = item["digest"]

    expected_ids = set(expected["node_ids"] + expected["edge_ids"])
    records_by_id: dict[str, dict[str, Any]] = {}
    for record in records:
        if not isinstance(record, dict) or not isinstance(record.get("graph_id"), str):
            raise BindingError("BIND_MANIFEST_SHAPE_INVALID", "source_manifest.records", "Every provenance record requires a graph ID.")
        graph_id = record["graph_id"]
        if graph_id in records_by_id:
            raise BindingError("MANIFEST_JOIN_AMBIGUOUS", graph_id, "Each graph ID must join to exactly one provenance record.")
        records_by_id[graph_id] = record
    missing = sorted(expected_ids - set(records_by_id))
    extra = sorted(set(records_by_id) - expected_ids)
    if missing:
        raise BindingError("MANIFEST_JOIN_MISSING", "source_manifest.records", "Every graph ID requires one provenance record.", expected=sorted(expected_ids), actual=sorted(records_by_id))
    if extra:
        raise BindingError("MANIFEST_JOIN_UNKNOWN", "source_manifest.records", "Manifest contains unpinned graph IDs.", expected=sorted(expected_ids), actual=sorted(records_by_id))

    node_ids = set(expected["node_ids"])
    for graph_id, record in records_by_id.items():
        expected_type = "node" if graph_id in node_ids else "edge"
        _require_equal(record.get("record_type"), expected_type, "MANIFEST_RECORD_TYPE_MISMATCH", f"source_manifest.records[{graph_id}].record_type", "Provenance record type differs from graph record type.")
        source_path = record.get("source_path")
        source_digest = record.get("source_digest")
        if source_path not in source_digests:
            raise BindingError("MANIFEST_SOURCE_MISSING", f"source_manifest.records[{graph_id}].source_path", "Provenance source must exist in manifest inputs.", actual=source_path)
        _require_equal(source_digest, source_digests[source_path], "MANIFEST_SOURCE_DIGEST_MISMATCH", f"source_manifest.records[{graph_id}].source_digest", "Provenance digest must equal its source input digest.")

    graph_ids = {node["node_id"] for node in graph["nodes"]} | {edge["edge_id"] for edge in graph["edges"]}
    _require_equal(set(records_by_id), graph_ids, "MANIFEST_JOIN_MISSING", "source_manifest.records", "Manifest and graph stable-ID sets must match.")


def _validate_receipt(receipt: dict[str, Any], expected: dict[str, Any], binding: dict[str, Any]) -> None:
    _require_equal(receipt.get("schema_version"), "minted-build-receipt/v1", "BIND_RECEIPT_SCHEMA_MISMATCH", "build_receipt.schema_version", "Unexpected build-receipt schema.")
    _require_equal(receipt.get("authority"), "generated-verification-evidence", "BIND_RECEIPT_AUTHORITY_MISMATCH", "build_receipt.authority", "Unexpected receipt authority label.")
    _require_equal(receipt.get("status"), "pass", "BIND_RECEIPT_STATUS_MISMATCH", "build_receipt.status", "Pinned build receipt must pass.")
    _require_equal(receipt.get("project_id"), expected["project_id"], "BIND_PROJECT_MISMATCH", "build_receipt.project_id", "Receipt project is not pinned.")
    _require_equal(receipt.get("source_set_digest"), expected["source_set_digest"], "BIND_SOURCE_SET_MISMATCH", "build_receipt.source_set_digest", "Receipt source-set digest differs.")
    language = receipt.get("language")
    if not isinstance(language, dict):
        raise BindingError("BIND_PROFILE_MISMATCH", "build_receipt.language", "Receipt language binding is required.")
    profile_id, profile_version = expected["profile_ref"].rsplit("@", 1)
    _require_equal(language.get("profile_id"), profile_id, "BIND_PROFILE_MISMATCH", "build_receipt.language.profile_id", "Receipt profile ID differs.")
    _require_equal(language.get("profile_version"), profile_version, "BIND_PROFILE_MISMATCH", "build_receipt.language.profile_version", "Receipt profile version differs.")
    for field in ("profile_digest", "kinds_digest", "relationships_digest"):
        _require_equal(language.get(field), expected[field], "BIND_PROFILE_MISMATCH" if field == "profile_digest" else "BIND_REGISTRY_MISMATCH", f"build_receipt.language.{field}", "Receipt language digest differs.")
    _require_equal(receipt.get("generator_version"), expected["generator_version"], "BIND_GENERATOR_MISMATCH", "build_receipt.generator_version", "Receipt generator differs.")
    artifacts = receipt.get("artifacts")
    if not isinstance(artifacts, dict):
        raise BindingError("BIND_RECEIPT_SHAPE_INVALID", "build_receipt.artifacts", "Receipt artifacts block is required.")
    _require_equal(artifacts.get("graph_digest"), binding["inputs"]["graph"]["sha256"], "BIND_GRAPH_HASH_MISMATCH", "build_receipt.artifacts.graph_digest", "Receipt graph digest differs from binding.")
    _require_equal(artifacts.get("source_manifest_digest"), binding["inputs"]["source_manifest"]["sha256"], "BIND_MANIFEST_HASH_MISMATCH", "build_receipt.artifacts.source_manifest_digest", "Receipt manifest digest differs from binding.")


def validate_bundle_structure(binding: dict[str, Any], artifacts: Mapping[str, dict[str, Any]]) -> None:
    expected = binding["expected"]
    graph = artifacts["graph"]
    manifest = artifacts["source_manifest"]
    receipt = artifacts["build_receipt"]
    _validate_graph(graph, expected)
    _validate_manifest(manifest, graph, expected)
    _validate_receipt(receipt, expected, binding)


def validate_boundary(
    repo_root: str | os.PathLike[str],
    binding_path: str | os.PathLike[str],
) -> ValidatedBoundary:
    root = _resolve_repo_root(repo_root)
    binding_file = _absolute_lexical(binding_path)
    _reject_symlink_components(binding_file, "binding")
    if not binding_file.is_file():
        raise BindingError("BIND_FILE_UNREADABLE", "binding", "Binding file must exist.", actual=str(binding_file))
    binding = validate_binding_contract(_read_json_file(binding_file, "binding"))
    _validate_schema_file(binding_file.parent / BINDING_SCHEMA_NAME)

    fixture_paths: dict[str, Path] = {}
    fixture_payloads: dict[str, bytes] = {}
    decoded: dict[str, dict[str, Any]] = {}
    for role, entry in binding["inputs"].items():
        resolved = _resolve_fixture_path(root, role, entry["path"])
        payload = resolved.read_bytes()
        actual_hash = _sha256(payload)
        _require_equal(actual_hash, entry["sha256"], CANONICAL_FIXTURES[role]["hash_code"], f"inputs.{role}.sha256", "Fixture bytes do not match the pinned digest.")
        fixture_paths[role] = resolved
        fixture_payloads[role] = payload
        decoded[role] = _decode_json(payload, role)

    validate_bundle_structure(binding, decoded)
    report = {
        "status": "pass",
        "handle": "iolm-fixture-boundary/v1",
        "artifact_role": "demo-evidence",
        "claim": "pinned fixture and loopback read boundary validated",
        "posture": "candidate",
        "authority_effect": "none",
        "repo_root": str(root),
        "binding": str(binding_file),
        "counts": {"nodes": EXPECTED["node_count"], "edges": EXPECTED["edge_count"]},
        "fixtures": {
            role: {
                "path": binding["inputs"][role]["path"],
                "route": binding["inputs"][role]["route"],
                "sha256": binding["inputs"][role]["sha256"],
            }
            for role in CANONICAL_FIXTURES
        },
        "ineligible_for": list(INELIGIBLE_FOR),
    }
    return ValidatedBoundary(
        report=MappingProxyType(report),
        fixture_paths=MappingProxyType(fixture_paths),
        fixture_payloads=MappingProxyType(fixture_payloads),
    )


def _safe_application_payload(relative_path: str) -> bytes | None:
    parsed = PurePosixPath(relative_path)
    if parsed.is_absolute() or ".." in parsed.parts:
        raise BindingError("HTTP_ROUTE_CONFIGURATION_INVALID", relative_path, "Application route target must be a safe relative path.")
    lexical = PACKAGE_ROOT.joinpath(*parsed.parts)
    if not lexical.exists():
        return None
    _reject_symlink_components(lexical, f"application.{relative_path}")
    resolved = lexical.resolve(strict=True)
    try:
        resolved.relative_to(PACKAGE_ROOT)
    except ValueError as error:
        raise BindingError("HTTP_ROUTE_CONFIGURATION_INVALID", relative_path, "Application route escapes the sidecar package.", actual=str(resolved)) from error
    if not resolved.is_file():
        return None
    return resolved.read_bytes()


def build_payload_surface(boundary: ValidatedBoundary) -> Mapping[str, tuple[bytes, str]]:
    payloads: dict[str, tuple[bytes, str]] = {}
    for role, canonical in CANONICAL_FIXTURES.items():
        payloads[canonical["route"]] = (boundary.fixture_payloads[role], "application/json; charset=utf-8")
    for route, relative_path in APPLICATION_ROUTES.items():
        if not route.startswith("/") or "?" in route or "#" in route:
            raise BindingError("HTTP_ROUTE_CONFIGURATION_INVALID", route, "Application route is invalid.")
        payload = _safe_application_payload(relative_path)
        if payload is None:
            continue
        content_type = mimetypes.guess_type(relative_path)[0] or "application/octet-stream"
        if relative_path.endswith(".mjs"):
            content_type = "text/javascript"
        if content_type.startswith("text/") or content_type in {"application/json", "text/javascript"}:
            content_type += "; charset=utf-8"
        payloads[route] = (payload, content_type)
    return MappingProxyType(payloads)


def make_handler(payloads: Mapping[str, tuple[bytes, str]]) -> type[BaseHTTPRequestHandler]:
    class PinnedFixtureHandler(BaseHTTPRequestHandler):
        server_version = "IOLMPinnedFixture/1"

        def _serve(self, *, include_body: bool) -> None:
            route = urlsplit(self.path).path
            item = payloads.get(route)
            if item is None:
                self.send_error(404, "Route not allowlisted")
                return
            payload, content_type = item
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(payload)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            if include_body:
                self.wfile.write(payload)

        def do_GET(self) -> None:  # noqa: N802
            self._serve(include_body=True)

        def do_HEAD(self) -> None:  # noqa: N802
            self._serve(include_body=False)

        def _method_not_allowed(self) -> None:
            self.send_response(405)
            self.send_header("Allow", "GET, HEAD")
            self.send_header("Content-Length", "0")
            self.end_headers()

        do_POST = _method_not_allowed
        do_PUT = _method_not_allowed
        do_PATCH = _method_not_allowed
        do_DELETE = _method_not_allowed
        do_OPTIONS = _method_not_allowed
        do_CONNECT = _method_not_allowed
        do_TRACE = _method_not_allowed
        do_PROPFIND = _method_not_allowed
        do_MKCOL = _method_not_allowed

        def __getattr__(self, name: str) -> Any:
            if name.startswith("do_"):
                return self._method_not_allowed
            raise AttributeError(name)

        def log_message(self, format: str, *args: object) -> None:
            return

    return PinnedFixtureHandler


def _validate_host(host: str) -> None:
    if host != "127.0.0.1":
        raise BindingError(
            "HTTP_HOST_NOT_LOOPBACK",
            "host",
            "The demo server may bind only the explicit IPv4 loopback address.",
            expected="127.0.0.1",
            actual=host,
        )


def create_server(
    repo_root: str | os.PathLike[str],
    binding_path: str | os.PathLike[str],
    host: str = "127.0.0.1",
    port: int = 4173,
) -> tuple[ThreadingHTTPServer, ValidatedBoundary]:
    _validate_host(host)
    if not 0 <= port <= 65535:
        raise BindingError("HTTP_PORT_INVALID", "port", "Port must be between 0 and 65535.", actual=port)
    boundary = validate_boundary(repo_root, binding_path)
    payloads = build_payload_surface(boundary)
    server = ThreadingHTTPServer((host, port), make_handler(payloads))
    return server, boundary


def _parse_args(argv: list[str] | None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", required=True, help="Explicit repository root used for fixture containment.")
    parser.add_argument("--binding", required=True, help="Path to source-binding.v1.json.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=4173)
    parser.add_argument("--check", action="store_true", help="Validate without creating a listener.")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv)
    try:
        _validate_host(args.host)
        if args.check:
            boundary = validate_boundary(args.repo_root, args.binding)
            payloads = build_payload_surface(boundary)
            result = dict(boundary.report)
            result["request_surface"] = sorted(payloads)
            result["listener_opened"] = False
            print(json.dumps(result, indent=2, sort_keys=True))
            return 0
        server, boundary = create_server(args.repo_root, args.binding, args.host, args.port)
    except BindingError as error:
        print(json.dumps(error.as_dict(), indent=2, sort_keys=True), file=sys.stderr)
        return 2

    address, port = server.server_address[:2]
    print(
        f"IOLM pinned fixture boundary {boundary.report['handle']} at http://{address}:{port}",
        file=sys.stderr,
    )
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
