#!/usr/bin/env python3
"""Compile the generic bounded-work DomainSpec source into deterministic system views."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = PACKAGE_ROOT.parents[1]
GENERATED_ROOT = PACKAGE_ROOT / "generated"


def canonical(value: Any) -> bytes:
    return (json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False) + "\n").encode()


def load(relative: str) -> Any:
    return json.loads((PACKAGE_ROOT / relative).read_text())


def digest_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def file_digest(relative: str) -> str:
    return digest_bytes((PACKAGE_ROOT / relative).read_bytes())


def validate_source(source: dict[str, Any], bindings: dict[str, Any]) -> None:
    if source["capability_ref"] != "CA2-CAP-EXECUTE-BOUNDED-COMPOSITE-WORK":
        raise ValueError("GENERIC_CAPABILITY_MISMATCH")
    operations = source["workflow"]["operations"]
    contracts = source["operation_contracts"]
    if operations != [item["operation"] for item in contracts]:
        raise ValueError("GENERIC_OPERATION_CONTRACT_CLOSURE_FAILED")
    if len(operations) != len(set(operations)):
        raise ValueError("GENERIC_DUPLICATE_OPERATION")
    required = {
        "domainspec_source",
        "system_bindings",
        "accepted_history_port",
        "protocol_adapters",
        "reference_implementation",
    }
    if set(bindings["generic_runtime"]) != required:
        raise ValueError("GENERIC_BINDING_SHAPE_MISMATCH")


def build(write: bool = True) -> dict[str, Any]:
    source = load("domainspec/bounded-composite-work.json")
    system_bindings = load("domainspec/system-bindings.json")
    bindings = load("bindings.json")
    port = load("ports/accepted-history.json")
    http = load("protocols/http.json")
    grpc = load("protocols/grpc.json")
    validate_source(source, bindings)
    if system_bindings["domainspec_source"] != "domainspec/bounded-composite-work.json":
        raise ValueError("GENERIC_SYSTEM_SOURCE_MISMATCH")
    if port["authority_cardinality"] != "exactly-one-per-stream":
        raise ValueError("GENERIC_HISTORY_AUTHORITY_CARDINALITY_MISMATCH")
    if http["ownership"] != "transport translation only" or grpc["ownership"] != "transport translation only":
        raise ValueError("GENERIC_PROTOCOL_OWNERSHIP_MISMATCH")

    operation_nodes = [
        {"node_id": item["operation"], "node_type": "DomainSpecOperation", "owner": item["owner"]}
        for item in source["operation_contracts"]
    ]
    graph = {
        "schema_version": "cav2-domainspec-compiled-graph/v1",
        "status": "deterministic-candidate",
        "authority_effect": "none",
        "project_id": source["project_id"],
        "capability_ref": source["capability_ref"],
        "source_digest": digest_bytes(canonical(source)),
        "nodes": sorted(operation_nodes, key=lambda item: item["node_id"]),
        "sequence": source["workflow"]["operations"],
        "invariants": source["invariants"],
    }
    graph_digest = digest_bytes(canonical(graph))
    contract_refs = []
    for contract in system_bindings["contracts"]:
        contract_refs.append({**contract, "sha256": file_digest(contract["path"])})
    implementation_refs = []
    for component in system_bindings["components"]:
        implementation_path = REPO_ROOT / component["implementation"].split("#", 1)[0]
        if not implementation_path.is_file():
            raise ValueError(f"GENERIC_IMPLEMENTATION_MISSING:{component['id']}")
        implementation_refs.append({**component, "sha256": digest_bytes(implementation_path.read_bytes())})
    system_ontology = {
        "schema_version": "cav2-work-orchestration-generic-system-ontology/v1",
        "ontology_id": "cav2.work-orchestration.rwo.system",
        "ontology_type": "system",
        "branch": "system",
        "status": "compiled-candidate",
        "authority_effect": "none",
        "capability_ref": source["capability_ref"],
        "compiled_from": {
            "domainspec_source": {"path": "domainspec/bounded-composite-work.json", "sha256": file_digest("domainspec/bounded-composite-work.json")},
            "system_bindings": {"path": "domainspec/system-bindings.json", "sha256": file_digest("domainspec/system-bindings.json")},
            "realization_selection": {"path": bindings["realization_selection"]["path"], "sha256": bindings["realization_selection"]["sha256"]},
        },
        "source_graph_digest": graph_digest,
        "components": implementation_refs,
        "contracts": sorted(contract_refs, key=lambda item: item["id"]),
        "operation_bindings": source["operation_contracts"],
        "bridges": system_bindings["bridges"],
        "ownership": {
            "structural_semantics": "rwo-rust-core",
            "accepted_history": "accepted-history-port",
            "domain_recovery": "DomainSpec workflow owner",
            "effects": "external authorized effect owner",
        },
        "production_gates": source["production_gates"],
    }
    outputs = {
        "generic-compiled-graph.json": graph,
        "generic-system-ontology.json": system_ontology,
    }
    output_digests = {name: digest_bytes(canonical(value)) for name, value in outputs.items()}
    receipt = {
        "schema_version": "cav2-work-orchestration-generic-build-receipt/v1",
        "status": "PASS",
        "deterministic": True,
        "authority_effect": "none",
        "source_digest": digest_bytes(canonical(source)),
        "outputs": output_digests,
        "claim_ceiling": "Deterministic generic compiled graph and system-ontology candidate only; no ontology admission, production delivery, release, or deployment.",
    }
    outputs["generic-build-receipt.json"] = receipt
    encoded = {name: canonical(value) for name, value in outputs.items()}
    if write:
        GENERATED_ROOT.mkdir(parents=True, exist_ok=True)
        for name, value in encoded.items():
            (GENERATED_ROOT / name).write_bytes(value)
    return {"graph": graph, "system_ontology": system_ontology, "receipt": receipt, "bytes": encoded}


if __name__ == "__main__":
    print(json.dumps(build(write=True)["receipt"], indent=2, sort_keys=True))
