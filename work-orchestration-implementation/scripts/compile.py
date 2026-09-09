#!/usr/bin/env python3
"""Compile the bounded ETL DomainSpec candidate into deterministic read models."""

from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from pathlib import Path
from typing import Any

import yaml
from jsonschema import Draft202012Validator


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = PACKAGE_ROOT.parents[1]
SOURCE_PATH = PACKAGE_ROOT / "domainspec/etl-small.json"
SCHEMA_PATH = PACKAGE_ROOT / "schemas/etl-small.schema.json"
GENERATED_ROOT = PACKAGE_ROOT / "generated"


class CompileError(RuntimeError):
    pass


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def canonical(value: Any) -> bytes:
    return (json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False) + "\n").encode()


def load(path: Path) -> Any:
    return json.loads(path.read_text())


def verify_bindings() -> dict[str, Any]:
    bindings = load(PACKAGE_ROOT / "bindings.json")
    checks = []

    def exact(relative: str, expected: str, label: str) -> Path:
        path = REPO_ROOT / relative
        actual = sha256(path)
        if actual != expected:
            raise CompileError(f"DEPENDENCY_DIGEST_MISMATCH:{label}:{actual}")
        checks.append({"binding": label, "path": relative, "sha256": actual, "status": "PASS"})
        return path

    predecessor = bindings["semantic_predecessor"]
    selection_path = exact(predecessor["path"], predecessor["sha256"], "semantic-predecessor")
    selection = load(selection_path)
    if selection.get("decision_status") != predecessor["required_status"]:
        raise CompileError("SEMANTIC_PREDECESSOR_NOT_ACCEPTED")
    if selection["subject"]["material_digest"] != predecessor["required_material_digest"]:
        raise CompileError("SEMANTIC_MATERIAL_BINDING_MISMATCH")
    if selection["subject"]["source_digest"] != predecessor["required_source_digest"]:
        raise CompileError("SEMANTIC_SOURCE_BINDING_MISMATCH")

    semantic_validator = REPO_ROOT / "cyberAlchemy-v2/work-orchestration/scripts/validate.py"
    report = json.loads(
        subprocess.check_output(
            [sys.executable, str(semantic_validator)],
            cwd=REPO_ROOT,
            text=True,
            env={"PYTHONDONTWRITEBYTECODE": "1"},
        )
    )
    if report["status"] != "PASS":
        raise CompileError("SEMANTIC_PACKAGE_VALIDATION_BLOCKED")
    if report["material_digest"] != predecessor["required_material_digest"]:
        raise CompileError("LIVE_SEMANTIC_MATERIAL_MISMATCH")
    if report["source_digest"] != predecessor["required_source_digest"]:
        raise CompileError("LIVE_SEMANTIC_SOURCE_MISMATCH")

    for binding_name, status_code in [
        ("capability_adoption", "CAPABILITY_ADOPTION_NOT_ACCEPTED"),
        ("realization_selection", "REALIZATION_SELECTION_NOT_ACCEPTED"),
    ]:
        decision_binding = bindings[binding_name]
        decision_path = exact(
            decision_binding["path"], decision_binding["sha256"], binding_name.replace("_", "-")
        )
        decision = load(decision_path)
        if decision.get("decision_status") != decision_binding["required_status"]:
            raise CompileError(status_code)
        if decision.get("decision_id") != decision_binding["decision_id"]:
            raise CompileError(f"{binding_name.upper()}_DECISION_ID_MISMATCH")

    domainspec = bindings["domainspec"]
    kinds_path = exact(domainspec["meta_types_path"], domainspec["meta_types_sha256"], "domainspec-meta-types")
    relationships_path = exact(
        domainspec["relationships_path"], domainspec["relationships_sha256"], "domainspec-relationships"
    )
    rwo = bindings["rwo"]
    exact(rwo["crate_manifest_path"], rwo["crate_manifest_sha256"], "rwo-crate-manifest")
    exact(rwo["semantic_kernel_path"], rwo["semantic_kernel_sha256"], "rwo-semantic-kernel")
    return {
        "bindings": bindings,
        "checks": checks,
        "kinds": yaml.safe_load(kinds_path.read_text()),
        "relationships": yaml.safe_load(relationships_path.read_text()),
    }


def validate_source(source: dict[str, Any], dependency: dict[str, Any]) -> None:
    schema = load(SCHEMA_PATH)
    errors = sorted(Draft202012Validator(schema).iter_errors(source), key=lambda error: list(error.path))
    if errors:
        detail = ";".join(f"{list(error.path)}:{error.message}" for error in errors)
        raise CompileError(f"SOURCE_SCHEMA_INVALID:{detail}")

    concepts = source["concepts"]
    node_by_id = {item["node_id"]: item for item in concepts}
    if len(node_by_id) != len(concepts):
        raise CompileError("DUPLICATE_CONCEPT_ID")
    edge_ids = [item["edge_id"] for item in source["relationships"]]
    if len(set(edge_ids)) != len(edge_ids):
        raise CompileError("DUPLICATE_RELATIONSHIP_ID")

    required_kinds = set(dependency["bindings"]["domainspec"]["selected_kinds"])
    observed_kind_labels: set[str] = set()

    def collect_labels(value: Any) -> None:
        if isinstance(value, dict):
            for key, item in value.items():
                if key in {"label", "name", "term"} and isinstance(item, str):
                    observed_kind_labels.add(item)
                collect_labels(item)
        elif isinstance(value, list):
            for item in value:
                collect_labels(item)

    collect_labels(dependency["kinds"])
    if not required_kinds <= observed_kind_labels:
        raise CompileError(f"DOMAINSPEC_KIND_BINDING_MISSING:{sorted(required_kinds - observed_kind_labels)}")

    signatures = dependency["relationships"].get("signatures", [])
    signature_by_id = {item["id"]: item for item in signatures if item.get("status") == "active"}
    expected_types = {
        "creates": ({"Operation"}, {"Entity"}),
        "enforces": ({"Rule"}, {"Operation"}),
        "maps": ({"Mapping"}, {"Entity", "Interface"}),
        "orchestrates": ({"Workflow"}, {"Operation"}),
        "produces": ({"Operation"}, {"Event"}),
        "reads": ({"Operation", "Query"}, {"Entity"}),
    }
    for relation in source["relationships"]:
        if relation["from"] not in node_by_id or relation["to"] not in node_by_id:
            raise CompileError(f"RELATIONSHIP_ENDPOINT_MISSING:{relation['edge_id']}")
        signature = signature_by_id.get(relation["type"])
        if not signature:
            raise CompileError(f"RELATIONSHIP_NOT_ACTIVE:{relation['type']}")
        sources, targets = expected_types[relation["type"]]
        actual = (node_by_id[relation["from"]]["kind"], node_by_id[relation["to"]]["kind"])
        if actual[0] not in sources or actual[1] not in targets:
            raise CompileError(f"RELATIONSHIP_KIND_MISMATCH:{relation['edge_id']}:{actual[0]}->{actual[1]}")

    workflow = source["workflow"]
    if node_by_id.get(workflow["workflow_ref"], {}).get("kind") != "Workflow":
        raise CompileError("WORKFLOW_REF_INVALID")
    if node_by_id.get(workflow["mapping_ref"], {}).get("kind") != "Mapping":
        raise CompileError("MAPPING_REF_INVALID")
    if node_by_id.get(workflow["validation_rule_ref"], {}).get("kind") != "Rule":
        raise CompileError("VALIDATION_RULE_REF_INVALID")
    operations = [step["operation_ref"] for step in workflow["steps"]]
    if len(set(operations)) != len(operations):
        raise CompileError("WORKFLOW_STEP_DUPLICATE")
    for step in workflow["steps"]:
        if node_by_id.get(step["operation_ref"], {}).get("kind") != "Operation":
            raise CompileError(f"WORKFLOW_STEP_NOT_OPERATION:{step['operation_ref']}")
        if node_by_id.get(step["completion_event_ref"], {}).get("kind") != "Event":
            raise CompileError(f"COMPLETION_EVENT_INVALID:{step['completion_event_ref']}")
    ordered = sorted(
        (item for item in source["relationships"] if item["type"] == "orchestrates"),
        key=lambda item: item.get("order", 0),
    )
    if [item["to"] for item in ordered] != operations:
        raise CompileError("ORCHESTRATION_ORDER_MISMATCH")
    produced = {(item["from"], item["to"]) for item in source["relationships"] if item["type"] == "produces"}
    for step in workflow["steps"]:
        if (step["operation_ref"], step["completion_event_ref"]) not in produced:
            raise CompileError(f"COMPLETION_EVENT_NOT_PRODUCED:{step['operation_ref']}")
    effect = source["effect_boundary"]
    if effect["operation_ref"] != operations[-1]:
        raise CompileError("EFFECT_BOUNDARY_NOT_TERMINAL_STEP")


def compile_documents(source: dict[str, Any], dependency: dict[str, Any]) -> dict[str, Any]:
    source_digest = hashlib.sha256(canonical(source)).hexdigest()
    nodes = sorted(source["concepts"], key=lambda item: item["node_id"])
    edges = sorted(source["relationships"], key=lambda item: item["edge_id"])
    graph = {
        "schema_version": "cav2-domainspec-compiled-graph/v1",
        "authority": "generated-candidate-read-model",
        "project_id": source["project_id"],
        "capability_ref": source["capability_ref"],
        "profile": source["profile"],
        "source_digest": source_digest,
        "nodes": nodes,
        "edges": edges,
        "workflow": source["workflow"],
        "effect_boundary": source["effect_boundary"],
    }
    graph_digest = hashlib.sha256(canonical(graph)).hexdigest()
    system_ontology = {
        "schema_version": "cav2-work-orchestration-system-ontology/v1",
        "status": "generated-candidate",
        "authority_effect": "none",
        "ontology_id": "cav2.work-orchestration.etl-system-candidate",
        "capability_ref": source["capability_ref"],
        "source_graph_digest": graph_digest,
        "nodes": nodes,
        "relations": edges,
        "runtime_projection": {
            "target": "RWO ExplicitComposition 1.0.0",
            "accepted_history_authority": "OrchestrationCursor",
            "physical_history": "deferred",
            "effect_owner": "contained ETL host adapter",
        },
    }
    workflow = source["workflow"]
    step_nodes = [
        {"node_id": workflow["workflow_ref"], "node_type": "DomainSpecWorkflow"},
        *[
            {"node_id": step["operation_ref"], "node_type": "DomainSpecOperation"}
            for step in workflow["steps"]
        ],
    ]
    rwo_edges = []
    source_node = workflow["workflow_ref"]
    for index, step in enumerate(workflow["steps"], start=1):
        rwo_edges.append(
            {
                "edge_id": f"etl-sequence-{index}",
                "source_node_id": source_node,
                "target_node_id": step["operation_ref"],
                "event_type": step["accepted_event"],
                "event_payload_schema": {"schema_id": "FixtureEventPayload", "schema_version": "1.0.0"},
                "command_type": step["command_type"],
                "command_payload_schema": {"schema_id": "FixtureCommandPayload", "schema_version": "1.0.0"},
                "payload_derivation": "copy-event-payload",
            }
        )
        source_node = step["operation_ref"]
    rwo = dependency["bindings"]["rwo"]
    composition = {
        "contract_id": rwo["contract_id"],
        "contract_version": rwo["contract_version"],
        "profile_id": rwo["profile_id"],
        "profile_version": rwo["profile_version"],
        "schema_id": "ExplicitComposition",
        "schema_version": "1.0.0",
        "composition_id": "customer-etl-v1",
        "nodes": sorted(step_nodes, key=lambda item: item["node_id"]),
        "edges": sorted(rwo_edges, key=lambda item: item["edge_id"]),
    }
    return {"graph": graph, "system_ontology": system_ontology, "composition": composition}


def build(write: bool = True) -> dict[str, Any]:
    dependency = verify_bindings()
    source = load(SOURCE_PATH)
    validate_source(source, dependency)
    documents = compile_documents(source, dependency)
    files = {
        "compiled-graph.json": documents["graph"],
        "system-ontology.json": documents["system_ontology"],
        "rwo-composition.json": documents["composition"],
    }
    output_digests = {name: hashlib.sha256(canonical(value)).hexdigest() for name, value in files.items()}
    receipt = {
        "schema_version": "cav2-work-orchestration-build-receipt/v1",
        "status": "PASS",
        "authority_effect": "none",
        "source_path": SOURCE_PATH.relative_to(REPO_ROOT).as_posix(),
        "source_digest": hashlib.sha256(canonical(source)).hexdigest(),
        "dependency_checks": dependency["checks"],
        "outputs": output_digests,
        "claim_ceiling": "Deterministic candidate read models and RWO binding only; no admission, execution, conformance, release, or external effect.",
    }
    files["build-receipt.json"] = receipt
    if write:
        GENERATED_ROOT.mkdir(parents=True, exist_ok=True)
        for name, value in files.items():
            (GENERATED_ROOT / name).write_bytes(canonical(value))
    return {**documents, "receipt": receipt, "bytes": {name: canonical(value) for name, value in files.items()}}


if __name__ == "__main__":
    result = build(write=True)
    print(json.dumps(result["receipt"], indent=2, sort_keys=True))
