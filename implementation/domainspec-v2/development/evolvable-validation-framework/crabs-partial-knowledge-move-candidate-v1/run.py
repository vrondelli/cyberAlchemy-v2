#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
import platform
import re
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parent
PLAN = ROOT.parent / "crabs-convergence-repair-candidate-v1/partial-knowledge-move-run-plan.md"
ATTEMPT_TOKEN = "@ATTEMPT_DIR@"
MAX_OUTPUT = 4 * 1024 * 1024


def load_module(name: str, path: Path):
    specification = importlib.util.spec_from_file_location(name, path)
    if specification is None or specification.loader is None:
        raise RuntimeError(f"cannot load {path}")
    module = importlib.util.module_from_spec(specification)
    specification.loader.exec_module(module)
    return module


GENERATOR = load_module("evf_cases", ROOT / "generator/cases.py")
SEMANTICS = load_module("evf_semantics", ROOT / "scripts/validate_semantics.py")
SANITIZER = load_module("evf_sanitizer", ROOT / "scripts/parse_sanitizer.py")
CBMC_PARSER = load_module("evf_cbmc_parser", ROOT / "scripts/parse_cbmc.py")


def sha_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha_file(path: Path) -> str:
    return sha_bytes(path.read_bytes())


def canonical_bytes(value: Any) -> bytes:
    return (json.dumps(value, sort_keys=True, separators=(",", ":")) + "\n").encode()


def atomic_write(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, name = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    temporary = Path(name)
    try:
        with os.fdopen(descriptor, "wb") as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    finally:
        if temporary.exists():
            temporary.unlink()


def write_json(path: Path, value: Any) -> None:
    atomic_write(path, json.dumps(value, indent=2, sort_keys=True).encode() + b"\n")


def append_jsonl(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o644)
    try:
        os.write(descriptor, canonical_bytes(value))
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def json_value(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def validate_schema(path: Path, value: Any) -> list[str]:
    schema = json_value(path)
    return [error.message for error in Draft202012Validator(schema).iter_errors(value)]


def source_findings() -> list[str]:
    findings: list[str] = []
    manifest = json_value(ROOT / "source-manifest.json")
    if sha_file(PLAN) != manifest["plan"]["sha256"]:
        findings.append("plan-digest-drift")
    checkout = Path(manifest["subject"]["local_checkout"])
    commit = subprocess.run(
        ["git", "-C", str(checkout), "rev-parse", "HEAD"],
        capture_output=True, text=True, check=False,
    )
    if commit.returncode != 0 or commit.stdout.strip() != manifest["subject"]["commit"]:
        findings.append("subject-commit-drift")
    for item in manifest["subject_sources"]:
        path = checkout / item["path"]
        if not path.is_file() or sha_file(path) != item["sha256"]:
            findings.append(f"subject-source-drift:{item['path']}")
    for item in manifest["package_sources"]:
        path = ROOT / item["path"]
        if not path.is_file() or sha_file(path) != item["sha256"]:
            findings.append(f"package-source-drift:{item['path']}")
    return findings


def tool_findings() -> list[str]:
    findings: list[str] = []
    manifest = json_value(ROOT / "tool-manifest.json")
    for name in ("python", "gcc", "cbmc"):
        item = manifest[name]
        path = Path(item["executable"])
        if not path.is_file() or sha_file(path) != item["sha256"]:
            findings.append(f"tool-drift:{name}")
    for item in manifest["sanitizer_runtime"]:
        path = Path(item["path"])
        if not path.is_file() or sha_file(path) != item["sha256"]:
            findings.append(f"sanitizer-runtime-drift:{item['path']}")
    return findings


def command_findings() -> list[str]:
    findings: list[str] = []
    commands = json_value(ROOT / "commands.json")
    if Path(commands["cwd"]).resolve() != ROOT:
        findings.append("command-cwd-mismatch")

    def inspect(value: Any) -> None:
        if isinstance(value, str):
            residue = value.replace(ATTEMPT_TOKEN, "")
            if "$" in residue or "`" in residue or "*" in residue or "?" in residue:
                findings.append("unresolved-command-expression")
        elif isinstance(value, list):
            for item in value:
                inspect(item)
        elif isinstance(value, dict):
            for item in value.values():
                inspect(item)

    inspect(commands["commands"])
    return findings


def cbmc_construction_findings() -> list[str]:
    findings: list[str] = []
    manifest = json_value(ROOT / "cbmc-bound-manifest.json")
    findings.extend(
        f"cbmc-bound-schema:{item}"
        for item in validate_schema(ROOT / "schemas/cbmc-bound-manifest.schema.json", manifest)
    )
    if manifest.get("status") != "frozen" or manifest.get("blockers"):
        findings.append("cbmc-bound-not-frozen")
    receipt = json_value(ROOT / "construction/cbmc-discovery/receipt.json")
    command_binding = json_value(ROOT / "commands.json")["commands"]["cbmc"]
    if receipt.get("status") != "pass" or receipt.get("blockers"):
        findings.append("cbmc-construction-receipt-blocked")
    for representative in receipt.get("representatives", []):
        representative_id = representative.get("representative_id")
        frozen = next(
            (item for item in manifest.get("representatives", []) if item.get("id") == representative_id),
            None,
        )
        if frozen is None:
            findings.append(f"cbmc-frozen-representative-missing:{representative_id}")
            continue
        for key in ("loop_discovery", "property_discovery", "bound_sufficiency", "target"):
            item = representative[key]
            for stream in ("stdout", "stderr"):
                path = ROOT / item[f"{stream}_path"]
                if not path.is_file() or sha_file(path) != item[f"{stream}_sha256"]:
                    findings.append(f"cbmc-construction-raw-drift:{path.name}")
        loop_output = ROOT / representative["loop_discovery"]["stdout_path"]
        property_output = ROOT / representative["property_discovery"]["stdout_path"]
        frozen_loop_ids = {item["loop_id"] for item in frozen["loops"]}
        if loop_output.is_file() and set(CBMC_PARSER.loops(loop_output.read_text(encoding="utf-8", errors="replace"))) != frozen_loop_ids:
            findings.append(f"cbmc-loop-binding-mismatch:{representative_id}")
        expected_binding = command_binding["representatives"].get(representative_id, {})
        if (frozen["property_id"] != expected_binding.get("property_id") or
                frozen["assertion_text"] != expected_binding.get("assertion_text") or
                sha_file(ROOT / expected_binding.get("harness", "missing")) != frozen["harness_sha256"]):
            findings.append(f"cbmc-property-or-harness-binding-mismatch:{representative_id}")
        if property_output.is_file():
            property_text = property_output.read_text(encoding="utf-8", errors="replace")
            if (f"Property {frozen['property_id']}:" not in property_text or
                    frozen["assertion_text"] not in property_text):
                findings.append(f"cbmc-property-output-mismatch:{representative_id}")
        unwind_pairs = {
            item.split(":", 1)[0]: int(item.split(":", 1)[1])
            for item in command_binding["unwindset"].split(",")
        }
        if unwind_pairs != {item["loop_id"]: item["unwind"] for item in frozen["loops"]}:
            findings.append(f"cbmc-unwindset-mismatch:{representative_id}")
        if representative.get("bound_sufficiency_status") != "pass":
            findings.append(f"cbmc-bound-sufficiency:{representative.get('representative_id')}")
        if representative.get("target_status") not in (
            "counterexample", "no-counterexample-at-bound"
        ):
            findings.append(f"cbmc-target-not-evaluable:{representative.get('representative_id')}")
    return findings


def compile_preflight() -> list[str]:
    findings: list[str] = []
    commands = json_value(ROOT / "commands.json")
    environment = commands["environment"]
    with tempfile.TemporaryDirectory(prefix="evf-partial-construction-") as name:
        attempt = Path(name)
        (attempt / "build").mkdir()
        for command_name in ("generate_cases", "compile_native", "compile_sanitizer"):
            contract = commands["commands"][command_name]
            argv = [item.replace(ATTEMPT_TOKEN, str(attempt)) for item in contract["argv"]]
            try:
                result = subprocess.run(
                    argv, cwd=ROOT, env=environment, capture_output=True,
                    timeout=contract["timeout_seconds"], check=False,
                )
            except subprocess.TimeoutExpired:
                findings.append(f"construction-timeout:{command_name}")
                continue
            if result.returncode not in contract["expected_exit_codes"]:
                findings.append(f"construction-command-failed:{command_name}")
        generated = attempt / "generated/cases.json"
        header = attempt / "generated/cases.h"
        if not generated.is_file() or not header.is_file():
            findings.append("generated-case-artifact-missing")
        else:
            document = json_value(generated)
            if document.get("denominator") != 48 or document.get("case_set_sha256") != json_value(ROOT / "case-manifest.json")["case_set_sha256"]:
                findings.append("generated-case-manifest-mismatch")
            if f'#define EVF_CASE_SET_SHA256 "{document["case_set_sha256"]}"' not in header.read_text(encoding="ascii"):
                findings.append("generated-header-digest-mismatch")
        if not (attempt / "build/native-harness").is_file():
            findings.append("native-binary-missing")
        if not (attempt / "build/sanitizer-harness").is_file():
            findings.append("sanitizer-binary-missing")
        else:
            linked = subprocess.run(
                ["/usr/bin/ldd", str(attempt / "build/sanitizer-harness")],
                capture_output=True, text=True, check=False,
                env={"LANG": "C", "LC_ALL": "C", "PATH": "/usr/bin"},
            )
            linked_paths = {
                str(Path(match).resolve())
                for match in re.findall(r"(?:=>\s+)?(/[^\s(]+)", linked.stdout)
            }
            required_paths = {
                str(Path(item["path"]).resolve())
                for item in json_value(ROOT / "tool-manifest.json")["sanitizer_runtime"]
            }
            if linked.returncode != 0 or not required_paths.issubset(linked_paths):
                findings.append("sanitizer-linked-runtime-mismatch")
    return findings


def construction_validation(write_outputs: bool) -> dict[str, Any]:
    fixture_result = SEMANTICS.validate_suite(ROOT / "fixtures/receipt-semantics")
    findings = source_findings() + tool_findings() + command_findings()
    if not fixture_result["passed"]:
        findings.append("receipt-adversary-suite-failed")
    findings += cbmc_construction_findings()
    findings += compile_preflight()
    findings = sorted(set(findings))
    plan_status = "pass" if not findings else "block"
    findings.append("task-session-request-schema-not-bound")
    findings = sorted(set(findings))
    status = "block"
    report = {
        "schema_version": "evf.crabs-partial-knowledge-construction-readiness/v1",
        "status": status,
        "plan_contract_status": plan_status,
        "canonical_work_pack_audit_status": "not-evaluable",
        "runtime_admission_status": "not-evaluable-task-session-contract-unavailable",
        "completed_units": ["C0", "C1", "C2"] if plan_status == "pass" else [],
        "ready_frontier": "C3" if plan_status == "pass" else None,
        "selected_unit": None,
        "mutation_ready": False,
        "receipt_semantics": "pass" if fixture_result["passed"] else "block",
        "blockers": findings,
        "authority_effect": "none",
        "next_owner": "governed Task Session contract owner",
        "claim_ceiling": "Construction readiness only; no live matrix execution or product approval.",
    }
    if write_outputs:
        write_json(ROOT / "construction/fixture-validation.json", fixture_result)
        audit = ROOT / "construction/readiness-audit"
        write_json(audit / "work-pack-readiness-report.json", report)
        markdown = (
            "# Work-pack readiness report\n\n"
            f"- Plan contract: {report['plan_contract_status']}\n"
            f"- Runtime admission: {report['runtime_admission_status']}\n"
            f"- Receipt semantics: {report['receipt_semantics']}\n"
            f"- Ready frontier: {report['ready_frontier'] or 'none'}\n"
            "- Selected unit: none\n"
            "- Mutation ready: false\n"
            f"- Blockers: {', '.join(findings) if findings else 'none'}\n"
            "- Authority effect: none\n"
        )
        atomic_write(audit / "WORK-PACK-READINESS-REPORT.md", markdown.encode())
        write_json(
            audit / "REFRESH-SIGNAL-PACK.json",
            {
                "schema_version": "evf.crabs-partial-knowledge-refresh-signal/v1",
                "authority_effect": "none",
                "mutation_ready": False,
                "mutation_mode": "proposal-only",
                "signals": [],
                "next_owner": "governed Task Session contract owner",
            },
        )
    return report


def resolve(value: Any, attempt: Path) -> Any:
    if isinstance(value, str):
        return value.replace(ATTEMPT_TOKEN, str(attempt))
    if isinstance(value, list):
        return [resolve(item, attempt) for item in value]
    if isinstance(value, dict):
        return {key: resolve(item, attempt) for key, item in value.items()}
    return value


def process_receipt(argv: list[str], status: str, exit_code: int | None,
                    stdout_path: Path, stderr_path: Path, attempt: Path) -> dict[str, Any]:
    return {
        "argv": argv,
        "status": status,
        "exit_code": exit_code,
        "stdout": {
            "path": str(stdout_path.relative_to(attempt)),
            "size": stdout_path.stat().st_size,
            "sha256": sha_file(stdout_path),
        },
        "stderr": {
            "path": str(stderr_path.relative_to(attempt)),
            "size": stderr_path.stat().st_size,
            "sha256": sha_file(stderr_path),
        },
    }


def execute_process(argv: list[str], timeout: int, environment: dict[str, str],
                    stdout_path: Path, stderr_path: Path, attempt: Path) -> dict[str, Any]:
    status = "completed"
    exit_code: int | None
    try:
        result = subprocess.run(
            argv, cwd=ROOT, env=environment, capture_output=True,
            timeout=timeout, check=False,
        )
        stdout, stderr, exit_code = result.stdout, result.stderr, result.returncode
    except subprocess.TimeoutExpired as error:
        stdout = error.stdout if isinstance(error.stdout, bytes) else b""
        stderr = error.stderr if isinstance(error.stderr, bytes) else b""
        stderr += b"\nEVF_TIMEOUT\n"
        exit_code = None
        status = "timeout"
    if len(stdout) > MAX_OUTPUT or len(stderr) > MAX_OUTPUT:
        stdout = stdout[:MAX_OUTPUT]
        stderr = stderr[:MAX_OUTPUT]
        status = "output-limit"
    atomic_write(stdout_path, stdout)
    atomic_write(stderr_path, stderr)
    return process_receipt(argv, status, exit_code, stdout_path, stderr_path, attempt)


def not_run_process(argv: list[str], reason: str, stdout_path: Path,
                    stderr_path: Path, attempt: Path) -> dict[str, Any]:
    atomic_write(stdout_path, b"")
    atomic_write(stderr_path, (reason + "\n").encode())
    return process_receipt(argv, "not-run", None, stdout_path, stderr_path, attempt)


def empty_observation(expected_order: str) -> dict[str, Any]:
    return {
        "construction_ok": False,
        "inputs_disjoint": False,
        "merge_success": False,
        "source_unchanged": False,
        "rejection_destination_unchanged": False,
        "invariants_ok": False,
        "oracle_ok": False,
        "merge_calls": 0,
        "merge_rejections": 0,
        "visible_order": "",
        "normal_form": "",
        "sanitizer_diagnostic": "none",
    }


def classify_case(definition: dict[str, Any], tool: str, process_value: dict[str, Any],
                  stdout_path: Path, stderr_path: Path) -> dict[str, Any]:
    observed = empty_observation(definition["expected_visible_order"])
    if process_value["status"] == "completed" and process_value["exit_code"] == 0:
        try:
            parsed = json.loads(stdout_path.read_text(encoding="utf-8"))
            if parsed.get("case_id") != definition["case_id"]:
                raise ValueError("case id mismatch")
            observed.update({key: parsed[key] for key in observed if key != "sanitizer_diagnostic"})
        except (ValueError, KeyError, json.JSONDecodeError):
            process_value["status"] = "launch-failed"
    if tool == "sanitizer":
        sanitizer = SANITIZER.classify(
            process_value["status"], process_value["exit_code"],
            stdout_path.read_bytes(), stderr_path.read_bytes(),
        )
        observed["sanitizer_diagnostic"] = sanitizer["diagnostic"]
        safety = sanitizer["safety_status"]
    else:
        safety = "not-applicable"
    convergence, invariant = SEMANTICS.expected_native(
        {"process": process_value, "observation": observed}
    )
    return {
        "schema_version": "evf.crabs-partial-knowledge-case-record/v1",
        "run_id": "",
        "tool_kind": tool,
        "case_id": definition["case_id"],
        "delivery_order": definition["delivery_order"],
        "move_version": definition["move_version"],
        "role_permutation": definition["role_permutation"],
        "association": definition["association"],
        "expected_visible_order": definition["expected_visible_order"],
        "process": process_value,
        "observation": observed,
        "convergence_status": convergence,
        "implementation_invariant_status": invariant,
        "safety_status": safety,
    }


def summarize(run_id: str, rows: list[dict[str, Any]], cbmc_rows: list[dict[str, Any]]) -> dict[str, Any]:
    native = [row for row in rows if row["tool_kind"] == "native"]
    sanitizer = [row for row in rows if row["tool_kind"] == "sanitizer"]
    forms: dict[tuple[str, str], set[str]] = {}
    for row in native:
        if row["convergence_status"] == "no-counterexample":
            forms.setdefault((row["delivery_order"], row["move_version"]), set()).add(row["observation"]["normal_form"])
    divergent = any(len(values) > 1 for values in forms.values())
    if divergent or any(row["convergence_status"] == "counterexample" for row in native):
        convergence = "counterexample"
    elif len(native) != 48 or any(row["convergence_status"] == "not-evaluable" for row in native):
        convergence = "not-evaluable"
    else:
        convergence = "no-counterexample-in-matrix"
    if any(row["implementation_invariant_status"] == "violation" for row in native):
        invariant = "violation"
    elif len(native) != 48 or any(row["implementation_invariant_status"] == "not-evaluable" for row in native):
        invariant = "not-evaluable"
    else:
        invariant = "no-detected-violation"
    if any(row["safety_status"] == "violation" for row in sanitizer):
        safety = "violation"
    elif len(sanitizer) != 48 or any(row["safety_status"] == "not-evaluable" for row in sanitizer):
        safety = "not-evaluable"
    else:
        safety = "no-detected-violation"
    cbmc_statuses = [row["cbmc_status"] for row in cbmc_rows]
    subject_failure = convergence == "counterexample" or invariant == "violation" or safety == "violation" or "counterexample" in cbmc_statuses
    incomplete = convergence == "not-evaluable" or invariant == "not-evaluable" or safety == "not-evaluable" or "not-evaluable" in cbmc_statuses
    promotion = "BLOCK" if subject_failure else ("PARTIAL_NOT_EVALUABLE" if incomplete else "PASS")
    summary = {
        "native_total": len(native),
        "sanitizer_total": len(sanitizer),
        "cbmc_total": len(cbmc_rows),
        "native_counterexamples": sum(row["convergence_status"] == "counterexample" for row in native),
        "invariant_violations": sum(row["implementation_invariant_status"] == "violation" for row in native),
        "safety_violations": sum(row["safety_status"] == "violation" for row in sanitizer),
        "cbmc_counterexamples": sum(status == "counterexample" for status in cbmc_statuses),
        "not_evaluable": (
            sum(row["convergence_status"] == "not-evaluable" or row["implementation_invariant_status"] == "not-evaluable" for row in native)
            + sum(row["safety_status"] == "not-evaluable" for row in sanitizer)
            + sum(status == "not-evaluable" for status in cbmc_statuses)
        ),
    }
    return {
        "convergence_status": convergence,
        "implementation_invariant_status": invariant,
        "safety_status": safety,
        "promotion_verdict": promotion,
        "summary": summary,
    }


def snapshot() -> dict[str, Any]:
    paths = [
        PLAN, ROOT / "README.md", ROOT / "profile.json", ROOT / "obligation.json",
        ROOT / "case-manifest.json", ROOT / "commands.json", ROOT / "source-manifest.json",
        ROOT / "tool-manifest.json", ROOT / "cbmc-bound-manifest.json", ROOT / "run.py",
    ]
    for directory in ("generator", "harness", "schemas", "scripts", "fixtures"):
        paths.extend(path for path in (ROOT / directory).rglob("*") if path.is_file() and "__pycache__" not in path.parts)
    entries = [
        {"path": str(path.resolve()), "size": path.stat().st_size, "sha256": sha_file(path)}
        for path in sorted(set(paths))
    ]
    value = {"entries": entries}
    value["snapshot_sha256"] = sha_bytes(canonical_bytes(entries))
    return value


def execute_live(rerun_of: str | None) -> int:
    readiness = construction_validation(write_outputs=False)
    if readiness["status"] != "pass":
        print(json.dumps({"status": "blocked", "blockers": readiness["blockers"]}, sort_keys=True))
        return 1
    captured = snapshot()
    started = datetime.now(timezone.utc)
    timestamp = started.strftime("%Y%m%dT%H%M%S%fZ")
    run_id = f"{timestamp}__{captured['snapshot_sha256'][:12]}"
    attempts = ROOT / "evidence/attempts"
    attempts.mkdir(parents=True, exist_ok=True)
    if rerun_of and not (attempts / rerun_of).is_dir():
        raise ValueError("rerun source does not exist")
    attempt = attempts / run_id
    attempt.mkdir()
    for directory in ("generated", "build", "raw/tool", "raw/native", "raw/sanitizer", "raw/cbmc"):
        (attempt / directory).mkdir(parents=True)
    captured["run_id"] = run_id
    captured["started_at"] = started.isoformat()
    captured["rerun_of"] = rerun_of
    write_json(attempt / "snapshot.json", captured)
    commands = resolve(json_value(ROOT / "commands.json"), attempt)
    write_json(attempt / "resolved-commands.json", commands)
    environment = commands["environment"]
    tool_runs: list[dict[str, Any]] = []

    for name in ("generate_cases", "compile_native", "compile_sanitizer"):
        contract = commands["commands"][name]
        process_value = execute_process(
            contract["argv"], contract["timeout_seconds"], environment,
            attempt / f"raw/tool/{name}.stdout", attempt / f"raw/tool/{name}.stderr", attempt,
        )
        tool_runs.append({"unit": name, "process": process_value})
        append_jsonl(attempt / "tool-runs.jsonl", tool_runs[-1])

    generated_path = attempt / "generated/cases.json"
    definitions = json_value(generated_path)["cases"] if generated_path.is_file() else GENERATOR.enumerate_cases()
    rows: list[dict[str, Any]] = []
    for tool, command_name, aggregate_limit in (
        ("native", "native_case", 60), ("sanitizer", "sanitizer_case", 120)
    ):
        contract = commands["commands"][command_name]
        binary = Path(contract["argv_prefix"][0])
        phase_started = time.monotonic()
        for definition in definitions:
            argv = contract["argv_prefix"] + [definition["case_id"]]
            stdout_path = attempt / f"raw/{tool}/{definition['case_id']}.stdout"
            stderr_path = attempt / f"raw/{tool}/{definition['case_id']}.stderr"
            case_environment = dict(environment)
            case_environment.update(contract.get("environment", {}))
            if not binary.is_file():
                process_value = not_run_process(argv, "compile prerequisite failed", stdout_path, stderr_path, attempt)
            elif time.monotonic() - phase_started >= aggregate_limit:
                process_value = not_run_process(argv, "aggregate timeout exhausted", stdout_path, stderr_path, attempt)
            else:
                process_value = execute_process(
                    argv, contract["timeout_seconds"], case_environment,
                    stdout_path, stderr_path, attempt,
                )
            row = classify_case(definition, tool, process_value, stdout_path, stderr_path)
            row["run_id"] = run_id
            rows.append(row)
            append_jsonl(attempt / "cases.jsonl", row)

    bound_manifest = json_value(ROOT / "cbmc-bound-manifest.json")
    bound_hash = sha_file(ROOT / "cbmc-bound-manifest.json")
    cbmc_rows: list[dict[str, Any]] = []
    cbmc_contract = commands["commands"]["cbmc"]
    for representative in bound_manifest["representatives"]:
        representative_id = representative["id"]
        harness = cbmc_contract["representatives"][representative_id]["harness"]
        discovery = {}
        discovery_ok = True
        for mode, flag in (("loops", "--show-loops"), ("properties", "--show-properties")):
            argv = [cbmc_contract["executable"], "--function", "main", flag,
                    cbmc_contract["include"], harness, cbmc_contract["dependency"], cbmc_contract["implementation"]]
            process_value = execute_process(
                argv, cbmc_contract["timeout_seconds"], environment,
                attempt / f"raw/cbmc/{representative_id}-{mode}.stdout",
                attempt / f"raw/cbmc/{representative_id}-{mode}.stderr", attempt,
            )
            discovery[mode] = process_value
            expected_hash = representative["discovery"][f"{mode}_stdout_sha256"]
            if process_value["status"] != "completed" or process_value["exit_code"] != 0 or process_value["stdout"]["sha256"] != expected_hash:
                discovery_ok = False
            append_jsonl(attempt / "tool-runs.jsonl", {"unit": f"cbmc-{representative_id}-{mode}", "process": process_value})

        complete_stdout = attempt / f"raw/cbmc/{representative_id}-bound-sufficiency.stdout"
        complete_stderr = attempt / f"raw/cbmc/{representative_id}-bound-sufficiency.stderr"
        target_stdout = attempt / f"raw/cbmc/{representative_id}-target.stdout"
        target_stderr = attempt / f"raw/cbmc/{representative_id}-target.stderr"
        if discovery_ok:
            complete_process = execute_process(
                representative["complete_check_argv"], cbmc_contract["timeout_seconds"], environment,
                complete_stdout, complete_stderr, attempt,
            )
            complete_text = complete_stdout.read_text(encoding="utf-8", errors="replace")
            complete_passed = (complete_process["status"] == "completed" and
                               complete_process["exit_code"] == 0 and
                               "VERIFICATION SUCCESSFUL" in complete_text and
                               re.search(r": FAILURE$", complete_text, re.MULTILINE) is None)
            target_process = execute_process(
                representative["target_check_argv"], cbmc_contract["timeout_seconds"], environment,
                target_stdout, target_stderr, attempt,
            )
            target_status = CBMC_PARSER.classify_target(
                target_process["status"], target_process["exit_code"],
                target_stdout.read_text(encoding="utf-8", errors="replace"),
                representative["property_id"],
            )
        else:
            complete_process = not_run_process(representative["complete_check_argv"], "discovery drift", complete_stdout, complete_stderr, attempt)
            target_process = not_run_process(representative["target_check_argv"], "discovery drift", target_stdout, target_stderr, attempt)
            complete_passed = False
            target_status = "not-evaluable"
        append_jsonl(attempt / "tool-runs.jsonl", {"unit": f"cbmc-{representative_id}-bound-sufficiency", "process": complete_process})
        append_jsonl(attempt / "tool-runs.jsonl", {"unit": f"cbmc-{representative_id}-target", "process": target_process})
        cbmc_rows.append(
            {
                "representative_id": representative_id,
                "property_id": representative["property_id"],
                "assertion_text": representative["assertion_text"],
                "bound_manifest_sha256": bound_hash,
                "bound_sufficiency_status": "pass" if complete_passed else "not-evaluable",
                "process": target_process,
                "cbmc_status": target_status if complete_passed else "not-evaluable",
            }
        )

    aggregates = summarize(run_id, rows, cbmc_rows)
    receipt = {
        "schema_version": "evf.crabs-partial-knowledge-run-record/v1",
        "run_id": run_id,
        "subject_commit": "477799721668652988bf98a4a9067d08f5bdaebf",
        "plan_sha256": sha_file(PLAN),
        "obligation_sha256": sha_file(ROOT / "obligation.json"),
        "case_set_sha256": json_value(ROOT / "case-manifest.json")["case_set_sha256"],
        "denominator": 48,
        "cases": rows,
        "cbmc": cbmc_rows,
        "convergence_status": aggregates["convergence_status"],
        "implementation_invariant_status": aggregates["implementation_invariant_status"],
        "safety_status": aggregates["safety_status"],
        "receipt_status": "pass",
        "promotion_verdict": aggregates["promotion_verdict"],
        "summary": aggregates["summary"],
        "authority_effect": "none",
        "claim_ceiling": "Exactly 48 native cases, the matching sanitizer observations, and two actual-C CBMC representatives at the frozen bounds only.",
    }
    write_json(attempt / "run-record.json", receipt)
    findings = SEMANTICS.validate_receipt(receipt, attempt)
    if snapshot()["snapshot_sha256"] != captured["snapshot_sha256"]:
        findings.append("snapshot-drift")
    if findings:
        receipt["receipt_status"] = "block"
        if receipt["promotion_verdict"] == "PASS":
            receipt["promotion_verdict"] = "PARTIAL_NOT_EVALUABLE"
        write_json(attempt / "run-record.json", receipt)
    write_json(attempt / "receipt-validation.json", {"valid": not findings, "findings": sorted(set(findings))})
    result_summary = {
        "schema_version": "evf.crabs-partial-knowledge-result-summary/v1",
        "run_id": run_id,
        "convergence_status": receipt["convergence_status"],
        "implementation_invariant_status": receipt["implementation_invariant_status"],
        "safety_status": receipt["safety_status"],
        "cbmc_statuses": {row["representative_id"]: row["cbmc_status"] for row in cbmc_rows},
        "receipt_status": receipt["receipt_status"],
        "promotion_verdict": receipt["promotion_verdict"],
        "counts": receipt["summary"],
        "authority_effect": "none",
        "claim_ceiling": receipt["claim_ceiling"],
    }
    write_json(attempt / "result-summary.json", result_summary)
    report = (
        "# Partial-knowledge move run\n\n"
        f"- Run ID: `{run_id}`\n"
        f"- Convergence: `{receipt['convergence_status']}`\n"
        f"- Implementation invariants: `{receipt['implementation_invariant_status']}`\n"
        f"- Safety: `{receipt['safety_status']}`\n"
        f"- Receipt: `{receipt['receipt_status']}`\n"
        f"- Promotion verdict: `{receipt['promotion_verdict']}`\n"
        "- Authority effect: `none`\n\n"
        "This result is bounded to the declared matrix and CBMC bounds.\n"
    )
    atomic_write(attempt / "REPORT.md", report.encode())
    terminal = {
        "run_id": run_id,
        "finished_at": datetime.now(timezone.utc).isoformat(),
        "host": platform.node(),
        "attempt": str(attempt.relative_to(ROOT)),
        "run_record_sha256": sha_file(attempt / "run-record.json"),
        "result_summary_sha256": sha_file(attempt / "result-summary.json"),
        "receipt_status": receipt["receipt_status"],
        "promotion_verdict": receipt["promotion_verdict"],
        "authority_effect": "none",
    }
    append_jsonl(ROOT / "evidence/runs.jsonl", terminal)
    print(json.dumps(terminal, sort_keys=True))
    return 0 if receipt["receipt_status"] == "pass" else 1


def main() -> int:
    if len(sys.argv) > 1 and sys.argv[1] in {"v2-freeze", "v2-execute", "v2-recover"}:
        mapped = {"v2-freeze": "freeze", "v2-execute": "execute", "v2-recover": "recover"}[sys.argv[1]]
        return subprocess.run(
            [sys.executable, str(ROOT / "scripts/runner_v2.py"), mapped, *sys.argv[2:]],
            cwd=ROOT, check=False,
        ).returncode
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("validate-construction")
    execute_parser = subparsers.add_parser("execute")
    execute_parser.add_argument("--profile", default="profile.json")
    execute_parser.add_argument("--commands", default="commands.json")
    execute_parser.add_argument("--rerun-of")
    args = parser.parse_args()
    if args.command == "validate-construction":
        report = construction_validation(write_outputs=True)
        print(json.dumps(report, sort_keys=True))
        return 0 if report["status"] == "pass" else 1
    if args.profile != "profile.json" or args.commands != "commands.json":
        raise ValueError("only the frozen package profile and commands are accepted")
    return execute_live(args.rerun_of)


if __name__ == "__main__":
    raise SystemExit(main())
