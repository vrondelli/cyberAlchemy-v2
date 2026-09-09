#!/usr/bin/env python3
"""Validate compiled system-ontology structure, source currency, and bridge evidence."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load(relative: str):
    return json.loads((ROOT / relative).read_text(encoding="utf-8"))


def canonical(value) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def digest(value) -> str:
    return "sha256:" + hashlib.sha256(canonical(value)).hexdigest()


def file_digest(relative: str) -> str:
    return "sha256:" + hashlib.sha256((ROOT / relative).read_bytes()).hexdigest()


def repo_file_digest(relative: str) -> str:
    return "sha256:" + hashlib.sha256((ROOT.parents[1] / relative).read_bytes()).hexdigest()


def main() -> None:
    system = load("generated/system-ontology.json")
    schema = load("schemas/system-ontology.schema.json")
    bindings = load("domainspec/system-bindings.json")
    business = load("ontology.json")
    capability = load("product-capability.json")
    pipeline = load("domainspec/world-bank-indicators.pipeline.json")
    composition = load("generated/rwo-composition.json")

    assert set(system) == set(schema["required"])
    assert system["schema_version"] == schema["properties"]["schema_version"]["const"]
    assert system["ontology_id"] == bindings["system_ontology_id"]
    assert system["ontology_type"] == "system" and system["branch"] == "system"
    assert system["status"] == "compiled-candidate"

    expected_sources = {
        "business_ontology": digest(business),
        "product_capability": digest(capability),
        "domainspec_pipeline": digest(pipeline),
        "system_bindings": digest(bindings),
        "implementation_bindings": file_digest("bindings.json"),
        "system_ontology_schema": file_digest("schemas/system-ontology.schema.json"),
        "postgres_schema": file_digest("postgres/schema.sql"),
        "pipeline_runtime": file_digest("runtime/pipeline.py"),
        "postgres_runtime": file_digest("runtime/postgres_store.py"),
        "rwo_adapter": file_digest("rwo-adapter/src/main.rs"),
        "rwo_semantic_kernel": repo_file_digest("projects/cyberalchemy-orchestrator/implementations/rwo-rust/src/lib.rs"),
        "rwo_composition": digest(composition),
    }
    assert set(system["compiled_from"]) == set(expected_sources)
    for source_id, expected_digest in expected_sources.items():
        assert system["compiled_from"][source_id]["digest"] == expected_digest

    system_ids = set()
    for collection in ["components", "data_structures", "tables", "constraints", "test_evidence", "observability", "known_gaps"]:
        ids = [item["id"] for item in system[collection]]
        assert len(ids) == len(set(ids))
        system_ids.update(ids)
    handlers = {item["handler"] for item in system["operation_bindings"]}
    system_ids.update(handlers)
    assert {item["operation"] for item in system["operation_bindings"]} == set(business["operations"])
    pipeline_source = (ROOT / "runtime/pipeline.py").read_text(encoding="utf-8")
    for handler in handlers:
        assert "def " + handler.split(".")[-1] + "(" in pipeline_source

    sql = (ROOT / "postgres/schema.sql").read_text(encoding="utf-8")
    for table in system["tables"]:
        assert table["relation"] in sql
    for constraint in system["constraints"]:
        assert constraint["implementation"] in sql

    graph_edges = {item["edge_id"]: item for item in composition["edges"]}
    bound_edges = {item["rwo_edge_id"]: item for item in system["event_bindings"] if item["rwo_edge_id"]}
    assert set(bound_edges) == set(graph_edges)
    for edge_id, edge in graph_edges.items():
        binding = bound_edges[edge_id]
        assert binding["event_type"] == edge["event_type"]
        assert binding["source_node_id"] == edge["source_node_id"]
        assert binding["target_node_id"] == edge["target_node_id"]
        assert binding["command_type"] == edge["command_type"]

    business_refs = {capability["capability_id"]}
    business_refs.update("rule:" + item["id"] for item in business["rules"])
    business_refs.update("invariant:" + item for item in capability["invariants"])
    business_refs.update("output:" + item for item in capability["outputs"])
    bridged = set()
    for edge in system["bridge_edges"]:
        assert edge["business_ref"] in business_refs
        assert edge["system_ref"] in system_ids
        bridged.add(edge["business_ref"])
    required = {capability["capability_id"]}
    required.update("rule:" + item["id"] for item in business["rules"])
    required.update("invariant:" + item for item in capability["invariants"])
    assert not required - bridged

    checked_evidence = 0
    for evidence in system["test_evidence"]:
        report = load(evidence["path"])
        if evidence["selector_kind"] == "report-status":
            actual = report["status"]
        else:
            matches = [item for item in report["checks"] if item["id"] == evidence["id"]]
            assert len(matches) == 1
            actual = matches[0]["status"]
        assert actual == evidence["required_status"]
        checked_evidence += 1

    result = {
        "status": "PASS",
        "ontology_id": system["ontology_id"],
        "components": len(system["components"]),
        "tables": len(system["tables"]),
        "constraints": len(system["constraints"]),
        "operation_bindings": len(system["operation_bindings"]),
        "event_bindings": len(system["event_bindings"]),
        "bridge_edges": len(system["bridge_edges"]),
        "test_evidence_selectors": checked_evidence,
        "known_gaps": len(system["known_gaps"]),
        "claim_ceiling": "compiled-candidate-not-admitted",
    }
    print(json.dumps(result, sort_keys=True))


if __name__ == "__main__":
    main()
