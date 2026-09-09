#!/usr/bin/env python3
"""Plan, validate, select, and summarize PythonConstraint proof-agent experiments."""

from __future__ import annotations

import argparse
import hashlib
import json
import random
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator


BASE = Path(__file__).resolve().parent.parent
PROTOCOL_PATH = BASE / "protocol.json"
MODELS_PATH = BASE / "models.json"
TASKS_PATH = BASE / "tasks.json"
SCHEMA_PATH = BASE / "schemas/run-record.schema.json"
RUNS = BASE / "runs"
HEX = set("0123456789abcdef")
UNKNOWN_PATHS = {
    "timing.wall_ms", "timing.sum_worker_active_ms", "timing.root_orchestration_ms",
    "timing.wait_ms", "timing.input_tokens", "timing.output_tokens",
}


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def canonical(value: Any) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":")).encode("utf-8")


def sha(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def file_sha(path: Path) -> str:
    return sha(path.read_bytes())


def is_sha(value: Any) -> bool:
    return isinstance(value, str) and len(value) == 64 and set(value) <= HEX


def load_contracts() -> tuple[dict[str, Any], dict[str, Any], dict[str, Any], dict[str, Any]]:
    return read_json(PROTOCOL_PATH), read_json(MODELS_PATH), read_json(TASKS_PATH), read_json(SCHEMA_PATH)


def validate_shape(row: Any) -> list[str]:
    errors: list[str] = []
    if not isinstance(row, dict):
        return ["TYPE:run-record"]
    required = {"schema_version", "harness_id", "run_id", "stage", "status", "identity", "frozen", "execution", "timing", "outcome", "validation", "unknown_fields", "deviations", "claim_ceiling"}
    missing = sorted(required - set(row))
    if missing:
        return [f"REQUIRED:{key}" for key in missing]
    if row["schema_version"] != "pyc-proof-agent-run-record/v1": errors.append("ENUM:schema_version")
    if row["harness_id"] != "PYC-PROOF-AGENT-HARNESS-001": errors.append("ENUM:harness_id")
    if row["stage"] not in {"smoke", "screen", "replicate"}: errors.append("ENUM:stage")
    if row["status"] not in {"completed", "blocked", "protocol_deviation"}: errors.append("ENUM:status")
    return errors


def validate_row(row: Any, protocol: dict[str, Any], models: dict[str, Any], tasks: dict[str, Any]) -> list[str]:
    errors = validate_shape(row)
    if errors:
        return errors
    ident, frozen, execution, timing, outcome, validation = (row[k] for k in ("identity", "frozen", "execution", "timing", "outcome", "validation"))
    model_map = {item["id"]: item for item in models["profiles"]}
    task_map = {item["id"]: item for item in tasks["tasks"]}
    topology_map = {item["id"]: item for item in protocol["factors"]["topologies"]}
    model = model_map.get(ident.get("model_profile_id"))
    task = task_map.get(ident.get("task_id"))
    topology = topology_map.get(ident.get("topology_id"))
    if model is None: errors.append("MODEL_PROFILE:unknown")
    if task is None: errors.append("TASK:unknown")
    if topology is None: errors.append("TOPOLOGY:unknown")
    if ident.get("context_condition") not in protocol["factors"]["context_conditions"]: errors.append("CONTEXT:unknown")
    if task and frozen.get("fact_set_digest") != task["fact_set_digest"]: errors.append("FACT_PARITY:mismatch")
    for key in ("protocol_digest", "task_digest", "fact_set_digest", "presentation_digest", "prompt_digest", "sandbox_digest", "toolchain_digest"):
        if not is_sha(frozen.get(key)): errors.append(f"DIGEST:frozen.{key}")
    if model:
        if execution.get("worker_model_id") != model["model"]: errors.append("MODEL_ID:mismatch")
        if execution.get("reasoning_effort") != model["reasoning_effort"]: errors.append("REASONING_EFFORT:mismatch")
    if topology:
        for observed, expected in (("planned_subagents", topology["planned_subagents"]), ("max_parallel_subagents", topology["max_parallel_subagents"])):
            if execution.get(observed) != expected: errors.append(f"TOPOLOGY:{observed}")
        if row["status"] == "completed":
            if execution.get("actual_spawn_count") != topology["planned_subagents"]: errors.append("SPAWN_COUNT:mismatch")
            if execution.get("actual_peak_parallelism") != topology["max_parallel_subagents"]: errors.append("PARALLELISM:mismatch")
            if execution.get("all_workers_joined") is not True: errors.append("JOIN:incomplete")
            if execution.get("all_workers_closed") is not True: errors.append("CLOSE:incomplete")
    sessions = execution.get("worker_session_ids", [])
    if not isinstance(sessions, list) or len(sessions) != len(set(sessions)): errors.append("SESSIONS:not-unique")
    unknown = row.get("unknown_fields", [])
    if not isinstance(unknown, list) or len(unknown) != len(set(unknown)): errors.append("UNKNOWN_FIELDS:shape")
    else:
        for path in unknown:
            if path not in UNKNOWN_PATHS: errors.append(f"UNKNOWN_PATH:{path}")
    for key, value in timing.items():
        path = f"timing.{key}"
        if value is None and path not in unknown: errors.append(f"UNKNOWN_UNDECLARED:{path}")
        if value is not None and path in unknown: errors.append(f"UNKNOWN_NOT_NULL:{path}")
        if value is not None and (not isinstance(value, int) or isinstance(value, bool) or value < 0): errors.append(f"RANGE:{path}")
    attempted = outcome.get("proofs_attempted")
    chain = [outcome.get("proofs_compiled"), outcome.get("grader_passed"), outcome.get("axiom_clean")]
    if not isinstance(attempted, int) or attempted < 0 or any(not isinstance(v, int) or v < 0 for v in chain): errors.append("RANGE:proof-counts")
    elif any(v > attempted for v in chain): errors.append("PROOF_COUNT:exceeds-attempted")
    if row["status"] == "completed":
        if row["deviations"]: errors.append("COMPLETED:has-deviations")
        if outcome.get("blocker_class") != "NONE": errors.append("COMPLETED:has-blocker")
        if validation.get("grader_native_status") == "not_evaluable": errors.append("COMPLETED:grader-not-evaluable")
    if validation.get("grader_native_status") == "pass" and outcome.get("grader_passed") != attempted: errors.append("GRADER_COUNT:mismatch")
    return errors


def contract_errors(protocol: dict[str, Any], models: dict[str, Any], tasks: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    for source in protocol.get("source_dependencies", []):
        path = (BASE / source["path"]).resolve()
        if not path.is_file(): errors.append(f"SOURCE_MISSING:{source['path']}")
        elif file_sha(path) != source["sha256"]: errors.append(f"SOURCE_DRIFT:{source['path']}")
    model_ids = [item["id"] for item in models.get("profiles", [])]
    if not model_ids or len(model_ids) != len(set(model_ids)): errors.append("MODELS:identity")
    topology_ids = [item["id"] for item in protocol.get("factors", {}).get("topologies", [])]
    if topology_ids != ["one_worker", "two_sequential", "two_parallel"]: errors.append("TOPOLOGIES:closure")
    task_ids = [item["id"] for item in tasks.get("tasks", [])]
    if not task_ids or len(task_ids) != len(set(task_ids)): errors.append("TASKS:identity")
    for task in tasks.get("tasks", []):
        expected = sha(canonical(sorted(task["fact_ids"])))
        if expected != task["fact_set_digest"]: errors.append(f"TASK_FACT_DIGEST:{task['id']}")
        if not task.get("plain_packet_selector") or not task.get("ontology_packet_selector"): errors.append(f"TASK_PRESENTATION:{task['id']}")
    return errors


def plan(stage_id: str) -> dict[str, Any]:
    protocol, models, tasks, _ = load_contracts()
    stage = next((item for item in protocol["stages"] if item["id"] == stage_id), None)
    if stage is None:
        raise SystemExit(f"unknown stage: {stage_id}")
    enabled = [item for item in models["profiles"] if item["enabled"]]
    selected_models = enabled[:1] if stage["model_selection"] == "first-enabled" else enabled
    screening = [item for item in tasks["tasks"] if item["screening"]]
    selected_tasks = screening[:1] if stage["task_selection"] == "first-screening" else screening
    runs: list[dict[str, Any]] = []
    for model in selected_models:
        for task in selected_tasks:
            for topology in stage["topology_selection"]:
                for context in stage["contexts"]:
                    for repetition in range(1, stage["repetitions"] + 1):
                        slug = f"{stage_id}-{model['id']}-{task['id']}-{topology}-{context}-{repetition}".upper().replace("_", "-").replace(".", "-")
                        seed = int(sha(slug.encode())[:8], 16)
                        runs.append({"run_id": f"PYC-RUN-{slug}", "stage": stage_id, "model_profile_id": model["id"], "task_id": task["id"], "topology_id": topology, "context_condition": context, "repetition": repetition, "randomization_seed": seed})
    random.Random(20260901 if stage_id == "screen" else 17).shuffle(runs)
    body = {"schema_version": "pyc-proof-agent-plan/v1", "harness_id": protocol["harness_id"], "stage": stage_id, "run_count": len(runs), "runs": runs}
    body["plan_digest"] = sha(canonical(body))
    return body


def load_run_files() -> list[tuple[Path, Any]]:
    result = []
    for path in sorted(RUNS.glob("*.json")):
        try: result.append((path, read_json(path)))
        except Exception as exc: result.append((path, {"_parse_error": str(exc)}))
    return result


def command_validate() -> int:
    protocol, models, tasks, schema = load_contracts()
    errors = contract_errors(protocol, models, tasks)
    if schema.get("$id") != "https://cyberalchemy.local/private/schemas/pyc-proof-agent-run-record/v1": errors.append("SCHEMA:id")
    try:
        Draft202012Validator.check_schema(schema)
        schema_validator = Draft202012Validator(schema)
    except Exception as exc:
        errors.append(f"SCHEMA:invalid:{exc}")
        schema_validator = None
    pass_row = read_json(BASE / "fixtures/pass-run.json")
    pass_errors = validate_row(pass_row, protocol, models, tasks)
    if schema_validator:
        pass_errors.extend(f"SCHEMA:{item.message}" for item in schema_validator.iter_errors(pass_row))
    if pass_errors: errors.extend(f"PASS_FIXTURE:{item}" for item in pass_errors)
    fail_row = read_json(BASE / "fixtures/fail-context-parity.json")
    fail_errors = validate_row(fail_row, protocol, models, tasks)
    if schema_validator:
        fail_schema_errors = list(schema_validator.iter_errors(fail_row))
        if fail_schema_errors: errors.extend(f"NEGATIVE_FIXTURE_SCHEMA:{item.message}" for item in fail_schema_errors)
    if "FACT_PARITY:mismatch" not in fail_errors: errors.append("NEGATIVE_FIXTURE:false-pass")
    live = []
    for path, row in load_run_files():
        row_errors = ["PARSE"] if "_parse_error" in row else validate_row(row, protocol, models, tasks)
        if schema_validator and "_parse_error" not in row:
            row_errors.extend(f"SCHEMA:{item.message}" for item in schema_validator.iter_errors(row))
        live.append({"path": str(path.relative_to(BASE)), "status": "PASS" if not row_errors else "BLOCK", "errors": row_errors})
        errors.extend(f"RUN:{path.name}:{item}" for item in row_errors)
    result = {"schema_version": "pyc-proof-agent-validation/v1", "status": "PASS" if not errors else "BLOCK", "errors": errors, "source_dependencies": len(protocol["source_dependencies"]), "models": len(models["profiles"]), "tasks": len(tasks["tasks"]), "topologies": len(protocol["factors"]["topologies"]), "smoke_runs": plan("smoke")["run_count"], "screen_runs": plan("screen")["run_count"], "live_runs": live, "authority_effect": "none"}
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if not errors else 1


def command_next(stage: str) -> int:
    planned = plan(stage)
    completed = {row.get("run_id") for _, row in load_run_files() if isinstance(row, dict)}
    next_run = next((item for item in planned["runs"] if item["run_id"] not in completed), None)
    print(json.dumps({"stage": stage, "next": next_run, "remaining": sum(item["run_id"] not in completed for item in planned["runs"]), "dispatch_authorized": False}, indent=2, sort_keys=True))
    return 0


def command_report() -> int:
    protocol, models, tasks, _ = load_contracts()
    rows = []
    invalid = []
    for path, row in load_run_files():
        errors = ["PARSE"] if "_parse_error" in row else validate_row(row, protocol, models, tasks)
        if errors: invalid.append({"path": path.name, "errors": errors})
        else: rows.append(row)
    groups: dict[tuple[str, str, str], list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        i = row["identity"]
        groups[(i["model_profile_id"], i["topology_id"], i["context_condition"])].append(row)
    summaries = []
    for key, group in sorted(groups.items()):
        wall = [row["timing"]["wall_ms"] for row in group if row["timing"]["wall_ms"] is not None]
        summaries.append({"model_profile_id": key[0], "topology_id": key[1], "context_condition": key[2], "runs": len(group), "completed": sum(row["status"] == "completed" for row in group), "grader_passed": sum(row["outcome"]["grader_passed"] for row in group), "median_wall_ms": sorted(wall)[len(wall)//2] if wall else None})
    result = {"schema_version": "pyc-proof-agent-report/v1", "status": "not_evaluable" if not rows else "exploratory", "valid_runs": len(rows), "invalid_runs": invalid, "groups": summaries, "model_ranking": None, "ontology_effect": None, "parallel_speedup": None, "claim_ceiling": "No causal or ranking claim without complete paired comparison cells."}
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if not invalid else 1


def main() -> int:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("validate")
    for name in ("plan", "next"):
        p = sub.add_parser(name); p.add_argument("--stage", choices=("smoke", "screen"), default="smoke")
    sub.add_parser("report")
    args = parser.parse_args()
    if args.command == "validate": return command_validate()
    if args.command == "plan": print(json.dumps(plan(args.stage), indent=2, sort_keys=True)); return 0
    if args.command == "next": return command_next(args.stage)
    return command_report()


if __name__ == "__main__":
    sys.exit(main())
