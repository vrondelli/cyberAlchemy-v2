#!/usr/bin/env python3
"""Compile the authored ETL source into deterministic candidate artifacts."""
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


def write(relative: str, value) -> None:
    path = ROOT / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(canonical(value) + b"\n")


def main() -> None:
    source = load("domainspec/world-bank-indicators.pipeline.json")
    system_bindings = load("domainspec/system-bindings.json")
    ontology = load("ontology.json")
    capability = load("product-capability.json")
    workflow = source["workflow"]
    residue = source["residue_workflow"]
    nodes = [{"node_id": source["workflow_id"], "node_type": "DomainSpecWorkflow"}]
    nodes += [{"node_id": item["operation"], "node_type": "DomainSpecOperation"} for item in workflow + residue]
    edges = []

    def edge(edge_id, source_node, event_type, target):
        return {
            "edge_id": edge_id,
            "source_node_id": source_node,
            "target_node_id": target,
            "event_type": event_type,
            "command_type": target,
            "event_payload_schema": {"schema_id": "FixtureEventPayload", "schema_version": "1.0.0"},
            "command_payload_schema": {"schema_id": "FixtureCommandPayload", "schema_version": "1.0.0"},
            "payload_derivation": "copy-event-payload",
        }

    edges.append(edge("main-01", source["workflow_id"], "MaterializationRequested", workflow[0]["operation"]))
    for index, current in enumerate(workflow[:-1], 2):
        edges.append(edge(f"main-{index:02d}", current["operation"], current["success_event"], workflow[index - 1]["operation"]))
    # Validation rejection is a second, uniquely event-selected branch.
    validation = next(item for item in workflow if item["operation"] == "ValidateDataset")
    edges.append(edge("residue-01", validation["operation"], validation["failure_event"], residue[0]["operation"]))
    edges.append(edge("residue-02", residue[0]["operation"], residue[0]["success_event"], residue[1]["operation"]))

    composition = {
        "schema_id": "ExplicitComposition", "schema_version": "1.0.0",
        "contract_id": "RWO-SEMANTIC-CONTRACT", "contract_version": "1.0.0",
        "profile_id": "RWO-JCS-IJSON-SAFEINT", "profile_version": "1.0.0",
        "composition_id": source["workflow_id"], "nodes": sorted(nodes, key=lambda x: x["node_id"]),
        "edges": sorted(edges, key=lambda x: x["edge_id"]),
    }
    graph = {
        "graph_id": source["workflow_id"], "source_digest": digest(source),
        "nodes": composition["nodes"], "edges": composition["edges"],
        "terminal_events": [workflow[-1]["success_event"], residue[-1]["success_event"]],
    }
    source_operations = [item["operation"] for item in workflow + residue]
    handlers = {item["operation"]: item["handler"] for item in system_bindings["operation_handlers"]}
    if set(source_operations) != set(ontology["operations"]) or set(handlers) != set(source_operations):
        raise ValueError("SYSTEM_OPERATION_BINDING_CLOSURE_FAILED")
    if system_bindings["business_ontology_id"] != ontology["ontology_id"]:
        raise ValueError("SYSTEM_BUSINESS_ONTOLOGY_ID_MISMATCH")
    if system_bindings["product_capability_id"] != capability["capability_id"]:
        raise ValueError("SYSTEM_CAPABILITY_ID_MISMATCH")

    system_ids = set(handlers.values())
    for collection in ["components", "data_structures", "tables", "constraints", "test_evidence", "observability", "known_gaps"]:
        values = system_bindings[collection]
        ids = [item["id"] for item in values]
        if len(ids) != len(set(ids)):
            raise ValueError(f"SYSTEM_DUPLICATE_ID:{collection}")
        system_ids.update(ids)
    business_refs = {capability["capability_id"]}
    business_refs.update("rule:" + item["id"] for item in ontology["rules"])
    business_refs.update("invariant:" + item for item in capability["invariants"])
    business_refs.update("output:" + item for item in capability["outputs"])
    edge_ids = set()
    for edge_binding in system_bindings["bridge_edges"]:
        if edge_binding["id"] in edge_ids:
            raise ValueError("SYSTEM_DUPLICATE_BRIDGE_ID")
        edge_ids.add(edge_binding["id"])
        if edge_binding["business_ref"] not in business_refs:
            raise ValueError("SYSTEM_UNKNOWN_BUSINESS_REF:" + edge_binding["business_ref"])
        if edge_binding["system_ref"] not in system_ids:
            raise ValueError("SYSTEM_UNKNOWN_SYSTEM_REF:" + edge_binding["system_ref"])
    bridged_business_refs = {item["business_ref"] for item in system_bindings["bridge_edges"]}
    required_business_refs = {capability["capability_id"]}
    required_business_refs.update("rule:" + item["id"] for item in ontology["rules"])
    required_business_refs.update("invariant:" + item for item in capability["invariants"])
    missing_bridges = sorted(required_business_refs - bridged_business_refs)
    if missing_bridges:
        raise ValueError("SYSTEM_BUSINESS_BRIDGE_GAPS:" + ",".join(missing_bridges))

    operation_bindings = []
    for operation in source_operations:
        incoming = [edge["edge_id"] for edge in composition["edges"] if edge["target_node_id"] == operation]
        terminal_event = next(item["success_event"] for item in workflow + residue if item["operation"] == operation)
        operation_bindings.append({
            "operation": operation,
            "handler": handlers[operation],
            "graph_node_id": operation,
            "enabled_by_edge_ids": sorted(incoming),
            "emits_success_event": terminal_event,
        })
    event_bindings = [{
        "event_type": edge["event_type"],
        "source_node_id": edge["source_node_id"],
        "target_node_id": edge["target_node_id"],
        "command_type": edge["command_type"],
        "rwo_edge_id": edge["edge_id"],
    } for edge in composition["edges"]]
    event_bindings.extend([
        {"event_type": workflow[-1]["success_event"], "source_node_id": workflow[-1]["operation"], "target_node_id": None, "command_type": None, "rwo_edge_id": None},
        {"event_type": residue[-1]["success_event"], "source_node_id": residue[-1]["operation"], "target_node_id": None, "command_type": None, "rwo_edge_id": None},
    ])
    system_ontology = {
        "schema_version": "cav2-trusted-dataset-system-ontology/v1",
        "ontology_id": system_bindings["system_ontology_id"],
        "ontology_type": "system", "branch": "system", "status": "compiled-candidate",
        "compiled_from": {
            "business_ontology": {"path":"ontology.json", "digest":digest(ontology)},
            "product_capability": {"path":"product-capability.json", "digest":digest(capability)},
            "domainspec_pipeline": {"path":"domainspec/world-bank-indicators.pipeline.json", "digest":digest(source)},
            "system_bindings": {"path":"domainspec/system-bindings.json", "digest":digest(system_bindings)},
            "implementation_bindings": {"path":"bindings.json", "digest":file_digest("bindings.json")},
            "system_ontology_schema": {"path":"schemas/system-ontology.schema.json", "digest":file_digest("schemas/system-ontology.schema.json")},
            "postgres_schema": {"path":"postgres/schema.sql", "digest":file_digest("postgres/schema.sql")},
            "pipeline_runtime": {"path":"runtime/pipeline.py", "digest":file_digest("runtime/pipeline.py")},
            "postgres_runtime": {"path":"runtime/postgres_store.py", "digest":file_digest("runtime/postgres_store.py")},
            "rwo_adapter": {"path":"rwo-adapter/src/main.rs", "digest":file_digest("rwo-adapter/src/main.rs")},
            "rwo_semantic_kernel": {"path":"projects/cyberalchemy-orchestrator/implementations/rwo-rust/src/lib.rs", "digest":repo_file_digest("projects/cyberalchemy-orchestrator/implementations/rwo-rust/src/lib.rs")},
            "rwo_composition": {"path":"generated/rwo-composition.json", "digest":digest(composition)}
        },
        "components": system_bindings["components"],
        "data_structures": system_bindings["data_structures"],
        "tables": system_bindings["tables"],
        "constraints": system_bindings["constraints"],
        "workflow": {"workflow_id":source["workflow_id"], "graph_id":graph["graph_id"], "terminal_events":graph["terminal_events"]},
        "operation_bindings": sorted(operation_bindings, key=lambda item:item["operation"]),
        "event_bindings": sorted(event_bindings, key=lambda item:(item["event_type"], item["source_node_id"])),
        "bridge_edges": sorted(system_bindings["bridge_edges"], key=lambda item:item["id"]),
        "test_evidence": system_bindings["test_evidence"],
        "observability": system_bindings["observability"],
        "known_gaps": system_bindings["known_gaps"],
    }
    write("generated/rwo-composition.json", composition)
    write("generated/compiled-graph.json", graph)
    write("generated/system-ontology.json", system_ontology)
    write("generated/build-receipt.json", {
        "status": "candidate", "deterministic": True,
        "source_digest": digest(source), "system_binding_digest": digest(system_bindings), "composition_digest": digest(composition),
        "compiled_graph_digest": digest(graph), "system_ontology_digest": digest(system_ontology),
    })


if __name__ == "__main__":
    main()
