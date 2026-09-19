#!/usr/bin/env python3
"""Strengthen S06 evidence without rewriting the original tournament receipt."""

from __future__ import annotations

import hashlib
import json
import shutil
import sys
from pathlib import Path
from typing import Any


SCRIPT_DIR = Path(__file__).resolve().parent
STAGES_DIR = SCRIPT_DIR.parent
TOY_DIR = STAGES_DIR / "S06-invoke-design-toy-game/toy-game"
sys.path.insert(0, str(TOY_DIR))

from toy_compiler import CompileFailure, compile_project, pretty_bytes, sha256_file  # noqa: E402


class RepairFailure(Exception):
    def __init__(self, code: str, detail: str):
        super().__init__(f"{code}: {detail}")
        self.code = code
        self.detail = detail


def repository_root() -> Path:
    for parent in [SCRIPT_DIR, *SCRIPT_DIR.parents]:
        if (parent / ".git").exists():
            return parent
    raise RuntimeError("repository root not found")


REPO_ROOT = repository_root()
META_TYPES = REPO_ROOT / "projects/domainspec-v2/definitions/meta-types/meta-types.yml"
RELATIONSHIPS = REPO_ROOT / "projects/domainspec-v2/definitions/relationships/relationships.yml"


def load(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write(path: Path, value: Any) -> None:
    path.write_bytes(pretty_bytes(value))


def digest_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def canonical_bytes(value: Any) -> bytes:
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n").encode("utf-8")


def resolve_source(root: Path, relative: str) -> Path:
    rel = Path(relative)
    if rel.is_absolute():
        raise RepairFailure("source-path-escape", relative)
    path = (root / rel).resolve()
    try:
        path.relative_to(root.resolve())
    except ValueError as exc:
        raise RepairFailure("source-path-escape", relative) from exc
    if not path.is_file():
        raise RepairFailure("stale-source", f"missing {relative}")
    return path


def contains_record(path: Path, record_type: str, record_id: str) -> bool:
    value = load(path)
    if record_type == "node":
        if value.get("node_id") == record_id:
            return True
        return any(item.get("node_id") == record_id for item in value.get("nodes", []) if isinstance(item, dict))
    if value.get("edge_id") == record_id:
        return True
    if any(item.get("edge_id") == record_id for item in value.get("connections", []) if isinstance(item, dict)):
        return True
    return any(item.get("edge_id") == record_id for item in value.get("connections", []) if isinstance(item, dict))


def verify_source_and_navigation(candidate: Path, output: Path) -> dict[str, Any]:
    graph = load(output / "graph.json")
    manifest = load(output / "source-manifest.json")
    receipt = load(output / "build-receipt.json")

    actual_inputs: list[dict[str, str]] = []
    for source in manifest["inputs"]:
        path = resolve_source(candidate, source["path"])
        actual_digest = sha256_file(path)
        if actual_digest != source["sha256"]:
            raise RepairFailure("stale-source", source["path"])
        actual_inputs.append({"path": source["path"], "sha256": actual_digest})

    source_set_digest = digest_bytes(canonical_bytes(actual_inputs))
    if source_set_digest != manifest.get("source_set_sha256") or source_set_digest != receipt.get("source_set_sha256"):
        raise RepairFailure("stale-source", "source-set digest mismatch")

    records: dict[tuple[str, str], dict[str, Any]] = {}
    for record in manifest["records"]:
        key = (record["record_type"], record["record_id"])
        if key in records:
            raise RepairFailure("duplicate-provenance-record", f"{key!r}")
        path = resolve_source(candidate, record["source_path"])
        if sha256_file(path) != record["source_sha256"]:
            raise RepairFailure("stale-source", record["source_path"])
        if not contains_record(path, *key):
            raise RepairFailure("unresolved-navigation", f"{key!r} not found in {record['source_path']}")
        records[key] = record

    graph_nodes = {node["node_id"] for node in graph["nodes"]}
    graph_edges = {edge["edge_id"] for edge in graph["edges"]}
    manifest_nodes = {record_id for record_type, record_id in records if record_type == "node"}
    manifest_edges = {record_id for record_type, record_id in records if record_type == "edge"}
    if graph_nodes != manifest_nodes or graph_edges != manifest_edges:
        raise RepairFailure("unresolved-navigation", "graph and source-manifest record sets differ")

    return {
        "result": "PASS",
        "source_set_sha256": source_set_digest,
        "nodes_resolved": len(graph_nodes),
        "edges_resolved": len(graph_edges),
        "all_paths_project_local": True,
    }


def run() -> dict[str, Any]:
    work = SCRIPT_DIR / ".work"
    if work.exists():
        shutil.rmtree(work)
    work.mkdir(parents=True)

    layouts: dict[str, Any] = {}
    for layout in ("layout-a", "layout-b", "layout-c"):
        layouts[layout] = verify_source_and_navigation(TOY_DIR / "candidates" / layout, TOY_DIR / "generated" / layout)

    stale_candidate = work / "stale-source"
    shutil.copytree(TOY_DIR / "candidates/layout-a", stale_candidate)
    player_path = stale_candidate / "specs/key-and-door/nodes/player.json"
    player = load(player_path)
    player["intent"] = "Changed after compilation."
    write(player_path, player)
    try:
        verify_source_and_navigation(stale_candidate, TOY_DIR / "generated/layout-a")
        stale_source = {"result": "FAIL", "expected_failure": "stale-source", "actual_failure": "none"}
    except RepairFailure as exc:
        stale_source = {"result": "PASS" if exc.code == "stale-source" else "FAIL", "expected_failure": "stale-source", "actual_failure": exc.code, "detail": exc.detail}

    digest_candidate = work / "language-digest-mismatch"
    shutil.copytree(TOY_DIR / "candidates/layout-a", digest_candidate)
    project_path = digest_candidate / "project.json"
    project = load(project_path)
    project["language"]["relationships_digest"] = "0" * 64
    write(project_path, project)
    try:
        compile_project(digest_candidate, work / "language-output", META_TYPES, RELATIONSHIPS)
        language_mismatch = {"result": "FAIL", "expected_failure": "language-digest-mismatch", "actual_failure": "none"}
    except CompileFailure as exc:
        language_mismatch = {"result": "PASS" if exc.code == "language-digest-mismatch" else "FAIL", "expected_failure": "language-digest-mismatch", "actual_failure": exc.code, "detail": exc.detail}

    result = "PASS" if all(item["result"] == "PASS" for item in layouts.values()) and stale_source["result"] == "PASS" and language_mismatch["result"] == "PASS" else "FAIL"
    evidence = {
        "schema_version": "toy-game-repair-evidence/v0",
        "result": result,
        "original_evidence": {
            "path": "stages/S06-invoke-design-toy-game/toy-game/EVIDENCE.json",
            "sha256": sha256_file(TOY_DIR / "EVIDENCE.json"),
            "preserved_mutation_count": 8,
        },
        "navigation_and_source_binding": layouts,
        "additional_mutations": [
            {"case_id": "stale-source", **stale_source},
            {"case_id": "language-digest-mismatch", **language_mismatch},
        ],
        "combined_negative_control_count": 10,
        "claim_calibration": {
            "measured": ["graph byte equality", "Markdown byte equality", "repeat-build determinism", "source-file count", "failure classes", "graph-to-source navigation"],
            "assessed": ["authority clarity", "edit locality"],
            "selection_scope": "layout-a is the L0 default while edges have no independently witnessed owner or evidence lifecycle",
        },
        "plan_constraints": [
            "production compilation must execute admitted node-formation/profile validation",
            "production minter must resolve and contain generated_root",
        ],
    }
    (SCRIPT_DIR / "REPAIR-EVIDENCE.json").write_bytes(pretty_bytes(evidence))
    shutil.rmtree(work)
    return evidence


if __name__ == "__main__":
    evidence = run()
    print(json.dumps({"result": evidence["result"], "layouts": len(evidence["navigation_and_source_binding"]), "combined_negative_controls": evidence["combined_negative_control_count"]}, sort_keys=True))
    raise SystemExit(0 if evidence["result"] == "PASS" else 1)
