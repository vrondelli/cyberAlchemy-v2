#!/usr/bin/env python3
"""Compile the exact historical workload into a deterministic RWO DAG candidate."""

from __future__ import annotations

import hashlib
import json
from collections import Counter, deque
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = PACKAGE_ROOT.parents[1]
SOURCE_PATH = PACKAGE_ROOT / "domainspec/micro-swarm-dag.json"
SCHEMA_PATH = PACKAGE_ROOT / "schemas/micro-swarm-dag.schema.json"
RUNTIME_SCHEMA_PATH = PACKAGE_ROOT / "schemas/rwo-dag-definition.schema.json"
GENERATED_ROOT = PACKAGE_ROOT / "generated"


def canonical(value: Any) -> bytes:
    return (json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False) + "\n").encode()


def load(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def verify_ref(ref: dict[str, Any], label: str) -> Path:
    path = REPO_ROOT / ref["path"]
    if not path.is_file():
        raise ValueError(f"MICRO_SWARM_REF_MISSING:{label}")
    data = path.read_bytes()
    if len(data) != ref["size"] or sha256_bytes(data) != ref["sha256"]:
        raise ValueError(f"MICRO_SWARM_REF_DRIFT:{label}")
    return path


def validate_source(source: dict[str, Any]) -> dict[str, Any]:
    errors = sorted(
        Draft202012Validator(load(SCHEMA_PATH)).iter_errors(source),
        key=lambda error: list(error.path),
    )
    if errors:
        detail = ";".join(f"{list(error.path)}:{error.message}" for error in errors)
        raise ValueError(f"MICRO_SWARM_SOURCE_SCHEMA_INVALID:{detail}")
    verify_ref(source["workload_builder_ref"], "workload-builder")
    workload = load(verify_ref(source["workload_ref"], "workload"))
    ref = source["workload_ref"]
    if workload.get("benchmark_id") != ref["benchmark_id"]:
        raise ValueError("MICRO_SWARM_BENCHMARK_ID_MISMATCH")
    if workload.get("source_strategy_id") != ref["strategy_id"]:
        raise ValueError("MICRO_SWARM_STRATEGY_ID_MISMATCH")
    roles = workload.get("roles")
    if not isinstance(roles, list) or len(roles) != source["expected_topology"]["roles"]:
        raise ValueError("MICRO_SWARM_ROLE_COUNT_MISMATCH")
    role_by_id = {role.get("role_id"): role for role in roles if isinstance(role, dict)}
    if len(role_by_id) != len(roles) or None in role_by_id:
        raise ValueError("MICRO_SWARM_ROLE_ID_INVALID")
    counts = Counter(role.get("contract") for role in roles)
    if dict(counts) != source["expected_topology"]["contracts"]:
        raise ValueError(f"MICRO_SWARM_CONTRACT_COUNTS_MISMATCH:{dict(counts)}")
    indegree = {role_id: 0 for role_id in role_by_id}
    dependents: dict[str, list[str]] = {role_id: [] for role_id in role_by_id}
    for role_id, role in role_by_id.items():
        dependencies = role.get("depends_on")
        if not isinstance(dependencies, list) or len(dependencies) != len(set(dependencies)):
            raise ValueError(f"MICRO_SWARM_DEPENDENCIES_INVALID:{role_id}")
        for dependency in dependencies:
            if dependency == role_id or dependency not in role_by_id:
                raise ValueError(f"MICRO_SWARM_DEPENDENCY_MISSING:{role_id}:{dependency}")
            indegree[role_id] += 1
            dependents[dependency].append(role_id)
    queue = deque(sorted(role_id for role_id, degree in indegree.items() if degree == 0))
    visited = 0
    while queue:
        current = queue.popleft()
        visited += 1
        for target in sorted(dependents[current]):
            indegree[target] -= 1
            if indegree[target] == 0:
                queue.append(target)
    if visited != len(role_by_id):
        raise ValueError("MICRO_SWARM_CYCLE_DETECTED")
    return workload


def static_input(role: dict[str, Any], workload: dict[str, Any]) -> dict[str, Any]:
    dataset = workload["datasets"][role["dataset_id"]]
    base = {"dataset_id": role["dataset_id"], "contract": role["contract"]}
    if role["contract"] == "micro_extractor":
        angle_index = role["angle_index"]
        return {
            **base,
            "angle": dataset["angles"][angle_index],
            "facet": role["facet"],
            "source_slice": dataset["source_slices"][angle_index],
        }
    if role["contract"] == "angle_reducer":
        return {**base, "angle": dataset["angles"][role["angle_index"]]}
    if role["contract"] == "judge":
        return {
            **base,
            "rubric": workload["rubric"],
            "withheld_gold": dataset["withheld_gold"],
            "frozen_sol_baseline": dataset["frozen_sol_baseline"],
            "candidate_identity": "blinded-at-executor-boundary",
        }
    return base


def build(write: bool = True) -> dict[str, Any]:
    source = load(SOURCE_PATH)
    workload = validate_source(source)
    dag = source["dag"]
    aliases = source["contract_aliases"]
    nodes = []
    for role in workload["roles"]:
        dependencies = sorted(role["depends_on"])
        nodes.append(
            {
                "node_id": role["role_id"],
                "contract": aliases[role["contract"]],
                "role_id": role["role_id"],
                "depends_on": dependencies,
                "release": {"mode": dag["join_policy"] if dependencies else "root"},
                "max_attempts": dag["max_attempts"],
                "static_input": static_input(role, workload),
            }
        )
    graph = {
        "schema_version": "cav2-rwo-dag-definition/v1",
        "dag_id": dag["dag_id"],
        "deadline_seconds": dag["deadline_seconds"],
        "max_parallelism": dag["max_parallelism"],
        "nodes": sorted(nodes, key=lambda item: item["node_id"]),
        "source": {
            "domainspec_path": SOURCE_PATH.relative_to(REPO_ROOT).as_posix(),
            "domainspec_sha256": sha256_bytes(SOURCE_PATH.read_bytes()),
            "workload_ref": source["workload_ref"],
            "workload_builder_ref": source["workload_builder_ref"],
        },
        "authority_effect": "none",
        "external_effect": "none",
        "claim_ceiling": source["claim_ceiling"],
    }
    graph_errors = sorted(
        Draft202012Validator(load(RUNTIME_SCHEMA_PATH)).iter_errors(graph),
        key=lambda error: list(error.path),
    )
    if graph_errors:
        detail = ";".join(f"{list(error.path)}:{error.message}" for error in graph_errors)
        raise ValueError(f"MICRO_SWARM_COMPILED_DAG_SCHEMA_INVALID:{detail}")
    graph_bytes = canonical(graph)
    system_ontology = {
        "schema_version": "cav2-work-orchestration-micro-swarm-system-ontology/v1",
        "ontology_id": "cav2.work-orchestration.micro-swarm.system",
        "ontology_type": "system",
        "branch": "system",
        "status": "compiled-candidate",
        "authority_effect": "none",
        "external_effect": "none",
        "capability_ref": source["capability_ref"],
        "source_graph_digest": sha256_bytes(graph_bytes),
        "runtime_components": ["DagEngine", "AcceptedHistoryPort", "StructuredAgentShell", "run_dag"],
        "node_count": len(nodes),
        "contract_counts": source["expected_topology"]["contracts"],
        "claim_ceiling": source["claim_ceiling"],
    }
    outputs = {
        "micro-swarm-dag.json": graph,
        "micro-swarm-system-ontology.json": system_ontology,
    }
    receipt = {
        "schema_version": "cav2-work-orchestration-micro-swarm-build-receipt/v1",
        "status": "PASS",
        "deterministic": True,
        "authority_effect": "none",
        "source_digest": sha256_bytes(SOURCE_PATH.read_bytes()),
        "workload_digest": source["workload_ref"]["sha256"],
        "outputs": {name: sha256_bytes(canonical(value)) for name, value in outputs.items()},
        "counts": source["expected_topology"],
        "claim_ceiling": source["claim_ceiling"],
    }
    outputs["micro-swarm-build-receipt.json"] = receipt
    encoded = {name: canonical(value) for name, value in outputs.items()}
    if write:
        GENERATED_ROOT.mkdir(parents=True, exist_ok=True)
        for name, value in encoded.items():
            (GENERATED_ROOT / name).write_bytes(value)
    return {"graph": graph, "system_ontology": system_ontology, "receipt": receipt, "bytes": encoded}


if __name__ == "__main__":
    print(json.dumps(build(write=True)["receipt"], indent=2, sort_keys=True))
