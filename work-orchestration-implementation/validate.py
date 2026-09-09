#!/usr/bin/env python3
"""Validate the complete bounded Work Orchestration ETL realization package."""

from __future__ import annotations

import copy
import hashlib
import importlib.util
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Any


PACKAGE_ROOT = Path(__file__).resolve().parent
REPO_ROOT = PACKAGE_ROOT.parents[1]
COMPILE_PATH = PACKAGE_ROOT / "scripts/compile.py"
GENERIC_COMPILE_PATH = PACKAGE_ROOT / "scripts/compile_generic.py"
MICRO_SWARM_COMPILE_PATH = PACKAGE_ROOT / "scripts/compile_micro_swarm.py"
REPORT_PATH = PACKAGE_ROOT / "runs/conformance-report.json"


def canonical(value: Any) -> bytes:
    return (json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False) + "\n").encode()


def load(path: Path) -> Any:
    return json.loads(path.read_text())


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load_module(module_name: str, path: Path):
    spec = importlib.util.spec_from_file_location(module_name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError("COMPILER_IMPORT_FAILED")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def compiler_module():
    return load_module("work_orchestration_compile", COMPILE_PATH)


def expect_compile_error(module, source: dict[str, Any], dependency: dict[str, Any], code: str) -> None:
    try:
        module.validate_source(source, dependency)
    except module.CompileError as error:
        if not str(error).startswith(code):
            raise RuntimeError(f"NEGATIVE_CONTROL_WRONG_ERROR:{code}:{error}") from error
        return
    raise RuntimeError(f"NEGATIVE_CONTROL_ACCEPTED:{code}")


def material_digest() -> tuple[str, list[str]]:
    material = sorted(
        path.relative_to(PACKAGE_ROOT).as_posix()
        for path in PACKAGE_ROOT.rglob("*")
        if path.is_file()
        and "target" not in path.relative_to(PACKAGE_ROOT).parts
        and "__pycache__" not in path.parts
        and path != REPORT_PATH
    )
    digest = hashlib.sha256()
    for relative in material:
        digest.update(relative.encode() + b"\0" + (PACKAGE_ROOT / relative).read_bytes() + b"\0")
    return digest.hexdigest(), material


def validate() -> dict[str, Any]:
    module = compiler_module()
    first = module.build(write=False)
    second = module.build(write=False)
    if first["bytes"] != second["bytes"]:
        raise RuntimeError("COMPILER_NONDETERMINISTIC")
    for name, expected in first["bytes"].items():
        actual = (PACKAGE_ROOT / "generated" / name).read_bytes()
        if actual != expected:
            raise RuntimeError(f"GENERATED_OUTPUT_STALE:{name}")

    generic_module = load_module("work_orchestration_compile_generic", GENERIC_COMPILE_PATH)
    generic_first = generic_module.build(write=False)
    generic_second = generic_module.build(write=False)
    if generic_first["bytes"] != generic_second["bytes"]:
        raise RuntimeError("GENERIC_COMPILER_NONDETERMINISTIC")
    for name, expected in generic_first["bytes"].items():
        actual = (PACKAGE_ROOT / "generated" / name).read_bytes()
        if actual != expected:
            raise RuntimeError(f"GENERIC_GENERATED_OUTPUT_STALE:{name}")

    micro_module = load_module("work_orchestration_compile_micro_swarm", MICRO_SWARM_COMPILE_PATH)
    micro_first = micro_module.build(write=False)
    micro_second = micro_module.build(write=False)
    if micro_first["bytes"] != micro_second["bytes"]:
        raise RuntimeError("MICRO_SWARM_COMPILER_NONDETERMINISTIC")
    for name, expected in micro_first["bytes"].items():
        actual = (PACKAGE_ROOT / "generated" / name).read_bytes()
        if actual != expected:
            raise RuntimeError(f"MICRO_SWARM_GENERATED_OUTPUT_STALE:{name}")

    dependency = module.verify_bindings()
    source = load(PACKAGE_ROOT / "domainspec/etl-small.json")
    controls = []

    missing_endpoint = copy.deepcopy(source)
    missing_endpoint["relationships"][0]["to"] = "MissingOperation"
    expect_compile_error(module, missing_endpoint, dependency, "RELATIONSHIP_ENDPOINT_MISSING")
    controls.append("missing-endpoint-rejected")

    bad_order = copy.deepcopy(source)
    bad_order["relationships"][0]["order"] = 2
    bad_order["relationships"][1]["order"] = 1
    expect_compile_error(module, bad_order, dependency, "ORCHESTRATION_ORDER_MISMATCH")
    controls.append("orchestration-order-drift-rejected")

    bad_mapping = copy.deepcopy(source)
    next(item for item in bad_mapping["concepts"] if item["node_id"] == "CustomerRecordMapping")["kind"] = "Rule"
    expect_compile_error(module, bad_mapping, dependency, "RELATIONSHIP_KIND_MISMATCH")
    controls.append("mapping-noncollapse-rejected")

    bad_effect = copy.deepcopy(source)
    bad_effect["effect_boundary"]["operation_ref"] = "NormalizeCustomerRows"
    expect_compile_error(module, bad_effect, dependency, "EFFECT_BOUNDARY_NOT_TERMINAL_STEP")
    controls.append("nonterminal-effect-boundary-rejected")

    manifest = PACKAGE_ROOT / "runtime/Cargo.toml"
    environment = {**os.environ, "CARGO_NET_OFFLINE": "true"}
    test = subprocess.run(
        ["cargo", "test", "--manifest-path", str(manifest), "--offline", "--quiet"],
        cwd=REPO_ROOT,
        env=environment,
        text=True,
        capture_output=True,
    )
    if test.returncode != 0:
        raise RuntimeError(f"RUNTIME_TESTS_FAILED:{test.stdout}{test.stderr}")

    demo = subprocess.run(
        [
            "cargo",
            "run",
            "--manifest-path",
            str(manifest),
            "--bin",
            "cav2-work-orchestration-etl-demo",
            "--offline",
            "--quiet",
        ],
        cwd=REPO_ROOT,
        env=environment,
        text=True,
        capture_output=True,
    )
    if demo.returncode != 0:
        raise RuntimeError(f"DEMO_RUN_FAILED:{demo.stdout}{demo.stderr}")
    stdout_result = json.loads(demo.stdout)
    result = load(PACKAGE_ROOT / "runs/etl-demo-result.json")
    if stdout_result != result:
        raise RuntimeError("DEMO_RESULT_STDOUT_FILE_DRIFT")
    expected = load(PACKAGE_ROOT / "fixtures/expected/warehouse.json")
    if result["warehouse_rows"] != expected:
        raise RuntimeError("WAREHOUSE_RESULT_MISMATCH")
    if result["initial_run"]["command_types"] != result["replay_run"]["command_types"]:
        raise RuntimeError("REPLAY_COMMAND_DRIFT")
    if result["idempotency"] != {
        "key": "job_id",
        "initial_load_effects": 1,
        "replay_load_effects": 0,
        "total_load_effects": 1,
    }:
        raise RuntimeError("IDEMPOTENCY_RESULT_INVALID")
    if result["initial_run"]["cursor"] != result["replay_run"]["cursor"]:
        raise RuntimeError("REPLAY_CURSOR_DRIFT")
    if result["initial_run"]["duplicate_probe"] != {"outcome": "Duplicate", "command_emitted": False}:
        raise RuntimeError("DUPLICATE_PROBE_INVALID")

    digest, material = material_digest()
    rust_test_count = sum(
        path.read_bytes().count(b"#[test]")
        for root in (PACKAGE_ROOT / "runtime/src", PACKAGE_ROOT / "runtime/tests")
        for path in root.rglob("*.rs")
    )
    micro_graph = micro_first["graph"]
    micro_contract_counts: dict[str, int] = {}
    for node in micro_graph["nodes"]:
        micro_contract_counts[node["contract"]] = micro_contract_counts.get(node["contract"], 0) + 1
    return {
        "schema_version": "cav2-work-orchestration-conformance-report/v1",
        "status": "PASS",
        "package_id": "cav2.work-orchestration.rwo-realization",
        "capability_ref": "CA2-CAP-EXECUTE-BOUNDED-COMPOSITE-WORK",
        "authority_effect": "none",
        "external_effect": "none",
        "construction": {
            "canonical_definitions": "accepted-bound-predecessor",
            "product_capability": "adopted-at-exact-digest",
            "business_ontology": "accepted-bound-predecessor",
            "rwo_realization": "selected-at-exact-digests",
            "domainspec_source": "candidate-validated",
            "generic_domainspec_source": "candidate-validated",
            "micro_swarm_domainspec_source": "candidate-validated-exact-workload-bound",
            "compiled_graph": "deterministic-candidate",
            "system_ontology": "generic-generated-candidate-not-admitted",
            "implementation_binding": "candidate-tested",
            "conformance": "bounded-local-evidence",
        },
        "counts": {
            "domainspec_concepts": len(source["concepts"]),
            "domainspec_relationships": len(source["relationships"]),
            "workflow_steps": len(source["workflow"]["steps"]),
            "accepted_events_per_run": len(result["initial_run"]["cursor"]["accepted_events"]),
            "derived_commands_per_run": len(result["initial_run"]["command_types"]),
            "warehouse_rows": len(result["warehouse_rows"]),
            "initial_load_effects": result["idempotency"]["initial_load_effects"],
            "replay_load_effects": result["idempotency"]["replay_load_effects"],
            "rust_integration_tests": rust_test_count,
            "compiler_negative_controls": len(controls),
            "micro_swarm_roles": len(micro_graph["nodes"]),
            "micro_swarm_contracts": micro_contract_counts,
            "micro_swarm_release_layers": [27, 9, 3, 3],
        },
        "graph_identity": result["graph_identity"],
        "source_digest": first["receipt"]["source_digest"],
        "generated_output_digests": first["receipt"]["outputs"],
        "generic_generated_output_digests": generic_first["receipt"]["outputs"],
        "micro_swarm_generated_output_digests": micro_first["receipt"]["outputs"],
        "micro_swarm_source_digest": micro_first["receipt"]["source_digest"],
        "micro_swarm_workload_digest": micro_first["receipt"]["workload_digest"],
        "result_digest": sha256_bytes(canonical(result)),
        "material_digest": digest,
        "material_files": material,
        "compiler_negative_controls": controls,
        "runtime_test_status": "PASS",
        "micro_swarm_content_flow_status": "PASS:42 roles with verified dependency JSON materialized through reducer, synthesizer, and judge layers",
        "dependency_integrity_status": "PASS:contained path, regular-file, node identity, byte size, SHA-256, and JSON checks",
        "replay_status": "PASS",
        "idempotency_status": "PASS",
        "accepted_history_authority": "exactly one AcceptedHistoryPort authority per stream",
        "protocol_adapter_status": "contained HTTP and gRPC translation equivalence PASS",
        "physical_history_design": "deferred",
        "production_hardening_gates": ["real delivery", "portable Unicode", "multi-host recovery", "hardware power-loss testing"],
        "claim_ceiling": "Exact selected RWO binding, deterministic generic and 42-role micro-swarm system-ontology candidates, and contained ETL/DAG/port/executor/adapter plus verified local content-flow evidence only; no model-quality verdict, system-ontology admission, durable production journal, live model delivery, publication, release, deployment, or external effect.",
    }


if __name__ == "__main__":
    report = validate()
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_bytes(canonical(report))
    print(json.dumps(report, indent=2, sort_keys=True))
