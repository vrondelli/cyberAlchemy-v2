#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import importlib.util
import json
import os
import platform
import shutil
import subprocess
import sys
import time
from pathlib import Path


REPO = Path("/home/vrondelli/projects/cyberAlchemy-v2")
PACKAGE = REPO / "implementation/domainspec-v2/development/evolvable-validation-framework/crabs-partial-knowledge-move-candidate-v1"
EPOCH = PACKAGE / "construction/v2-epoch-004"
REVIEW = REPO / "implementation/domainspec-v2/development/evolvable-validation-framework/repair-assurance-expansion-plan-v1/execution/w3/reviewer-attempt-001"
SOURCE_ATTEMPT = PACKAGE / "evidence/attempts-v2/20260912T175527287719Z__bf54e23b5fd5"
CONTROLS = REVIEW / "control-attempts"


def load(path: Path):
    return json.loads(path.read_text())


def save(path: Path, value) -> None:
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n")


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def replace_root(value, old: str, new: str):
    if isinstance(value, str):
        return value.replace(old, new)
    if isinstance(value, list):
        return [replace_root(item, old, new) for item in value]
    if isinstance(value, dict):
        return {key: replace_root(item, old, new) for key, item in value.items()}
    return value


def fresh_control(name: str) -> tuple[Path, dict]:
    target = CONTROLS / name
    if target.exists():
        raise RuntimeError(f"reviewer control already exists: {target}")
    shutil.copytree(SOURCE_ATTEMPT, target)
    record = replace_root(load(target / "run-record.json"), str(SOURCE_ATTEMPT), str(target))
    save(target / "run-record.json", record)
    return target, record


def validate_control(name: str, mutate) -> dict:
    target, record = fresh_control(name)
    mutate(target, record)
    save(target / "run-record.json", record)
    argv = ["/usr/bin/python3", str(PACKAGE / "scripts/validate_v2.py"), "--attempt", str(target)]
    started = time.monotonic()
    completed = subprocess.run(argv, cwd=PACKAGE, capture_output=True, text=True, check=False)
    elapsed = time.monotonic() - started
    (target / "review-validator.stdout").write_text(completed.stdout)
    (target / "review-validator.stderr").write_text(completed.stderr)
    return {
        "name": name,
        "argv": argv,
        "elapsed_seconds": round(elapsed, 6),
        "exit_code": completed.returncode,
        "validation": load(target / "validation.json"),
        "authority_effect": "none",
    }


def mutate_denominator(_target: Path, record: dict) -> None:
    for index, row in enumerate(record["cases"]):
        if row["tool_kind"] == "native":
            del record["cases"][index]
            return
    raise RuntimeError("no native row to remove")


def mutate_oracle(_target: Path, record: dict) -> None:
    row = next(row for row in record["cases"] if row["tool_kind"] == "native")
    current = row["definition"]["expected_visible_order"]
    row["definition"]["expected_visible_order"] = "CAB" if current == "BAC" else "BAC"


def mutate_raw(target: Path, record: dict) -> None:
    row = next(row for row in record["cases"] if row["tool_kind"] == "native")
    raw = Path(row["process"]["stdout"]["path"])
    raw.write_bytes(raw.read_bytes() + b"reviewer-raw-mutation\n")


def hash_verification() -> dict:
    candidate = load(EPOCH / "candidate.json")
    bindings = []
    for name, expected in candidate["bindings"].items():
        actual = sha(EPOCH / name)
        bindings.append({"name": name, "expected_sha256": expected, "actual_sha256": actual, "match": expected == actual})
    canonical = (json.dumps(candidate["bindings"], sort_keys=True, separators=(",", ":")) + "\n").encode()
    source_rows = []
    for item in load(EPOCH / "source-manifest.json")["entries"]:
        path = Path(item["path"])
        source_rows.append({
            "path": str(path), "exists": path.is_file(),
            "expected_sha256": item["sha256"], "actual_sha256": sha(path) if path.is_file() else None,
            "expected_size_bytes": item["size_bytes"], "actual_size_bytes": path.stat().st_size if path.is_file() else None,
        })
    tools = []
    manifest = load(EPOCH / "tool-manifest.json")
    for name, item in manifest["tools"].items():
        path = Path(item["path"])
        tools.append({"name": name, "path": str(path), "exists": path.is_file(), "expected_sha256": item["sha256"], "actual_sha256": sha(path) if path.is_file() else None})
    runtime = []
    for item in manifest["sanitizer_runtime"]:
        path = Path(item["path"])
        runtime.append({"path": str(path), "exists": path.is_file(), "expected_sha256": item["sha256"], "actual_sha256": sha(path) if path.is_file() else None})
    bound = load(EPOCH / "cbmc-bound-manifest.json")["cbmc"]
    bound_path = Path(bound["executable"])
    return {
        "candidate_digest_declared": candidate["candidate_digest"],
        "candidate_digest_actual": hashlib.sha256(canonical).hexdigest(),
        "bindings": bindings,
        "sources": source_rows,
        "tools": tools,
        "sanitizer_runtime": runtime,
        "cbmc_bound_manifest_descriptive_executable": {"path": str(bound_path), "exists": bound_path.is_file(), "expected_sha256": bound["sha256"], "actual_sha256": sha(bound_path) if bound_path.is_file() else None},
        "authority_effect": "none",
    }


def process_controls(runner) -> list[dict]:
    root = REVIEW / "process-controls"
    cases = [
        ("timeout", [sys.executable, "-c", "import os,time; os.close(1); os.close(2); time.sleep(2)"], 0.15, 1024),
        ("output-limit", [sys.executable, "-c", "import os; os.write(1,b'x'*8192)"], 2.0, 128),
        ("launch-failure", ["/missing/reviewer-evf-tool"], 1.0, 1024),
    ]
    results = []
    for name, argv, timeout, maximum in cases:
        out = root / f"{name}.stdout"
        err = root / f"{name}.stderr"
        record = runner.supervise(argv, REVIEW, {"PATH": "/usr/bin:/bin"}, timeout, out, err, maximum, address_space=None)
        results.append({"name": name, "timeout_seconds": timeout, "max_stream_bytes": maximum, "process": record, "authority_effect": "none"})
    return results


def wrong_cbmc_assertion(runner) -> dict:
    representative = load(EPOCH / "cbmc-bound-manifest.json")["representatives"][0]
    argv = list(representative["target_check_argv"])
    argv[0] = load(EPOCH / "tool-manifest.json")["tools"]["cbmc"]["path"]
    argv[argv.index("--property") + 1] = "main.assertion.999"
    root = REVIEW / "process-controls"
    command = load(EPOCH / "command-manifest.json")
    record = runner.supervise(argv, PACKAGE, command["environment"], 30, root / "wrong-cbmc-assertion.stdout", root / "wrong-cbmc-assertion.stderr", 1024 * 1024)
    stdout = (root / "wrong-cbmc-assertion.stdout").read_text(errors="replace")
    stderr = (root / "wrong-cbmc-assertion.stderr").read_text(errors="replace")
    return {
        "name": "wrong-cbmc-assertion",
        "expected_missing_property": "main.assertion.999",
        "process": record,
        "detected": record["exit_code"] != 0 or "not found" in (stdout + stderr).lower() or "unknown" in (stdout + stderr).lower(),
        "authority_effect": "none",
    }


def main() -> int:
    runner = load_module("review_runner_v2", PACKAGE / "scripts/runner_v2.py")
    controls = [
        validate_control("denominator", mutate_denominator),
        validate_control("oracle-binding", mutate_oracle),
        validate_control("raw-evidence", mutate_raw),
    ]
    result = {
        "schema_version": "crabs.repair-assurance.reviewer-controls/v1",
        "reviewer": "independent Codex technical reviewer /root/l2_replay_final",
        "source_attempt": str(SOURCE_ATTEMPT),
        "hash_verification": hash_verification(),
        "receipt_controls": controls,
        "process_controls": process_controls(runner),
        "wrong_cbmc_assertion_control": wrong_cbmc_assertion(runner),
        "environment": {
            "captured_at_utc": subprocess.check_output(["/usr/bin/date", "-u", "+%Y-%m-%dT%H:%M:%SZ"], text=True).strip(),
            "platform": platform.platform(),
            "python": platform.python_version(),
            "uname": " ".join(os.uname()),
        },
        "authority_effect": "none",
    }
    save(REVIEW / "controls.json", result)
    print(json.dumps(result, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
