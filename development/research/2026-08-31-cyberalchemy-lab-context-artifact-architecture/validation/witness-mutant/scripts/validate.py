#!/usr/bin/env python3
"""Validate the synthetic CyberAlchemy-lab witness and its eight mutants."""

from __future__ import annotations

import copy
import hashlib
import importlib.util
import json
from pathlib import Path
from typing import Any


BASE = Path(__file__).resolve().parents[1]
PROTOCOL_PATH = BASE / "protocol.json"
SCHEMA_PATH = BASE / "schemas" / "witness-case.schema.json"
GENERATOR_PATH = BASE / "scripts" / "generate_projection.py"
WITNESS_PATH = BASE / "fixtures" / "positive-witness.json"
CASES_PATH = BASE / "fixtures" / "cases.jsonl"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_json(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"{path} must contain one JSON object")
    return value


def load_generator() -> Any:
    spec = importlib.util.spec_from_file_location("lab_projection", GENERATOR_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError("projection generator cannot be loaded")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def validate_case_shape(case: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    required = {"case_id", "kind", "description", "expected", "mutations"}
    if set(case) != required:
        errors.append("E_CASE_SCHEMA")
        return errors
    if case["kind"] not in {"positive_witness", "negative_mutant"}:
        errors.append("E_CASE_SCHEMA")
    if not isinstance(case["description"], str) or not case["description"]:
        errors.append("E_CASE_SCHEMA")
    expected = case["expected"]
    if not isinstance(expected, dict) or set(expected) != {"result", "error_codes"}:
        errors.append("E_CASE_SCHEMA")
    elif expected["result"] not in {"pass", "reject"} or not isinstance(expected["error_codes"], list):
        errors.append("E_CASE_SCHEMA")
    if not isinstance(case["mutations"], list):
        errors.append("E_CASE_SCHEMA")
    else:
        for mutation in case["mutations"]:
            if not isinstance(mutation, dict):
                errors.append("E_CASE_SCHEMA")
                continue
            if mutation.get("op") not in {"remove", "replace"}:
                errors.append("E_CASE_SCHEMA")
            if not isinstance(mutation.get("path"), str) or not mutation["path"].startswith("/"):
                errors.append("E_CASE_SCHEMA")
            if mutation.get("op") == "replace" and "value" not in mutation:
                errors.append("E_CASE_SCHEMA")
    return sorted(set(errors))


def resolve_parent(document: Any, pointer: str) -> tuple[Any, str]:
    parts = pointer.lstrip("/").split("/")
    if not parts or parts == [""]:
        raise ValueError("root mutation is forbidden")
    current = document
    for raw in parts[:-1]:
        token = raw.replace("~1", "/").replace("~0", "~")
        current = current[int(token)] if isinstance(current, list) else current[token]
    return current, parts[-1].replace("~1", "/").replace("~0", "~")


def apply_mutations(witness: dict[str, Any], mutations: list[dict[str, Any]]) -> dict[str, Any]:
    result = copy.deepcopy(witness)
    for mutation in mutations:
        parent, token = resolve_parent(result, mutation["path"])
        key: Any = int(token) if isinstance(parent, list) else token
        if mutation["op"] == "remove":
            if isinstance(parent, list):
                parent.pop(key)
            else:
                del parent[key]
        else:
            if isinstance(parent, list):
                parent[key] = copy.deepcopy(mutation["value"])
            else:
                if key not in parent:
                    raise KeyError(mutation["path"])
                parent[key] = copy.deepcopy(mutation["value"])
    return result


def nonempty(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def validate_bundle(bundle: dict[str, Any], protocol: dict[str, Any], generator: Any) -> list[str]:
    errors: list[str] = []
    artifact_type = bundle.get("artifact_type", {})
    artifact = bundle.get("artifact_instance", {})
    capability = bundle.get("capability_instance", {})
    projection = bundle.get("projection", {})
    admission = bundle.get("source_admission", {})

    if artifact_type.get("record_kind") != "artifact_type" or artifact.get("record_kind") != "artifact_instance":
        errors.append("E_RECORD_KIND")
    if artifact.get("artifact_type_ref") != artifact_type.get("artifact_type_id"):
        errors.append("E_ARTIFACT_TYPE_BINDING")
    if not nonempty(artifact_type.get("semantic_owner_ref")) or not nonempty(artifact.get("semantic_owner_ref")):
        errors.append("E_OWNER_MISSING")

    expected_schema = protocol["bindings"]["case_schema"]
    schema_binding = artifact_type.get("schema_binding", {})
    if (
        schema_binding.get("schema_ref") != expected_schema["path"]
        or schema_binding.get("schema_sha256") != expected_schema["sha256"]
        or sha256(SCHEMA_PATH) != expected_schema["sha256"]
    ):
        errors.append("E_SCHEMA_BINDING")

    expected_generator = protocol["bindings"]["projection_generator"]
    actual_generator = projection.get("generator", {})
    if (
        actual_generator.get("generator_id") != expected_generator["generator_id"]
        or actual_generator.get("version") != expected_generator["version"]
        or actual_generator.get("sha256") != expected_generator["sha256"]
        or generator.GENERATOR_ID != expected_generator["generator_id"]
        or generator.GENERATOR_VERSION != expected_generator["version"]
        or sha256(GENERATOR_PATH) != expected_generator["sha256"]
    ):
        errors.append("E_GENERATOR_BINDING")

    source_direction = "machine_canonical_to_generated_human"
    if (
        artifact_type.get("source_direction") != source_direction
        or artifact.get("source_direction") != source_direction
        or projection.get("source_direction") != source_direction
    ):
        errors.append("E_SOURCE_DIRECTION")

    render_inputs_present = all(
        nonempty(artifact.get(key))
        for key in (
            "title",
            "artifact_instance_id",
            "artifact_type_ref",
            "capability_instance_id",
            "context_id",
            "semantic_owner_ref",
            "authority_effect",
        )
    ) and nonempty(admission.get("status"))
    if render_inputs_present and projection.get("text") != generator.render(bundle):
        errors.append("E_PROJECTION_DRIFT")

    relations = bundle.get("relations")
    relation_ok = isinstance(relations, list) and len(relations) == 1
    if relation_ok:
        relation = relations[0]
        required_relation_fields = (
            "relation_id",
            "relation_kind",
            "source_endpoint",
            "source_context_id",
            "target_endpoint",
            "target_context_id",
            "direction",
            "owner_route",
            "evidence_ref",
            "contract_ref",
            "validation_effect",
            "promotion_effect",
        )
        relation_ok = all(nonempty(relation.get(key)) for key in required_relation_fields)
        relation_ok = relation_ok and relation.get("source_context_id") != relation.get("target_context_id")
        relation_ok = relation_ok and relation.get("direction") == "source_to_target"
        relation_ok = relation_ok and relation.get("promotion_effect") == "none"
    if not relation_ok:
        errors.append("E_CROSS_CONTEXT_CONTRACT")

    recursion = capability.get("recursion", {})
    stop = recursion.get("stop")
    recomposition = recursion.get("recomposition")
    recursion_ok = isinstance(stop, dict) and isinstance(recomposition, dict)
    if recursion_ok:
        recursion_ok = (
            isinstance(stop.get("current_depth"), int)
            and isinstance(stop.get("max_depth"), int)
            and stop["current_depth"] <= stop["max_depth"]
            and nonempty(stop.get("condition"))
            and nonempty(recomposition.get("route_ref"))
            and recomposition.get("effect") == "candidate_only"
            and nonempty(recursion.get("terminal_handoff_ref"))
        )
    if not recursion_ok:
        errors.append("E_RECURSION_BOUNDARY")

    if admission.get("status") == "admitted":
        decision = admission.get("decision_ref")
        admitted_ok = (
            isinstance(decision, dict)
            and decision.get("kind") == "owner_decision"
            and nonempty(decision.get("id"))
            and nonempty(decision.get("sha256"))
        )
        if not admitted_ok:
            errors.append("E_SOURCE_ADMISSION_DECISION")
    elif admission.get("status") != "not_admitted" or admission.get("decision_ref") is not None:
        errors.append("E_SOURCE_ADMISSION_DECISION")

    authority_effects = [
        artifact_type.get("authority_effect"),
        artifact.get("authority_effect"),
        recursion.get("authority_effect"),
        admission.get("authority_effect"),
    ]
    if authority_effects != ["none", "none", "none", "none"]:
        errors.append("E_AUTHORITY_EFFECT")

    return sorted(set(errors))


def main() -> int:
    protocol = load_json(PROTOCOL_PATH)
    witness = load_json(WITNESS_PATH)
    generator = load_generator()
    cases: list[dict[str, Any]] = []
    for line_number, raw in enumerate(CASES_PATH.read_text(encoding="utf-8").splitlines(), start=1):
        if not raw.strip():
            continue
        case = json.loads(raw)
        if not isinstance(case, dict):
            raise ValueError(f"case line {line_number} is not an object")
        cases.append(case)

    protocol_errors: list[str] = []
    if sha256(SCHEMA_PATH) != protocol["bindings"]["case_schema"]["sha256"]:
        protocol_errors.append("E_PROTOCOL_SCHEMA_DIGEST")
    if sha256(GENERATOR_PATH) != protocol["bindings"]["projection_generator"]["sha256"]:
        protocol_errors.append("E_PROTOCOL_GENERATOR_DIGEST")
    required = protocol["required_cases"]
    positive_count = sum(case.get("kind") == "positive_witness" for case in cases)
    negative_count = sum(case.get("kind") == "negative_mutant" for case in cases)
    if (positive_count, negative_count, len(cases)) != (required["positive"], required["negative"], required["total"]):
        protocol_errors.append("E_PROTOCOL_CASE_COUNT")

    results: list[dict[str, Any]] = []
    for case in cases:
        shape_errors = validate_case_shape(case)
        if shape_errors:
            actual_errors = shape_errors
        else:
            mutated = apply_mutations(witness, case["mutations"])
            actual_errors = validate_bundle(mutated, protocol, generator)
        actual_result = "pass" if not actual_errors else "reject"
        expected = case["expected"]
        matched = actual_result == expected["result"] and actual_errors == sorted(expected["error_codes"])
        results.append(
            {
                "case_id": case["case_id"],
                "kind": case["kind"],
                "expected_result": expected["result"],
                "actual_result": actual_result,
                "expected_error_codes": sorted(expected["error_codes"]),
                "actual_error_codes": actual_errors,
                "matched": matched,
            }
        )

    matched_count = sum(result["matched"] for result in results)
    status = "pass" if not protocol_errors and matched_count == len(results) else "fail"
    report = {
        "schema_version": "cav2.lab-artifact-witness-run-result/v1",
        "protocol_id": protocol["protocol_id"],
        "mode": protocol["mode"],
        "status": status,
        "protocol_errors": sorted(protocol_errors),
        "counts": {
            "total": len(results),
            "matched": matched_count,
            "positive": positive_count,
            "negative": negative_count,
        },
        "results": results,
        "evidence_status": "synthetic_contract_validation_only",
        "authority_effect": "none",
        "claim_ceiling": "A PASS proves only that this local synthetic validator accepts the positive witness and rejects the eight specified mutants. It does not select architecture, admit source, constitute owners, implement or prove enforcement, satisfy D64/D65, or establish v1.0.0."
    }
    print(json.dumps(report, indent=2, sort_keys=True))
    return 0 if status == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main())
