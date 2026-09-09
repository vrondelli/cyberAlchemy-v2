from __future__ import annotations

import base64
import hashlib
import json
import subprocess
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from tde.neutral_obligation import canonical_bytes, digest_value


def _record(value: object, label: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ValueError(f"{label} must be an object")
    return value


def _verify_alloy_jar(path: Path) -> str:
    try:
        with zipfile.ZipFile(path) as archive:
            manifest = archive.read("META-INF/MANIFEST.MF").decode(errors="strict")
    except (KeyError, OSError, UnicodeError, zipfile.BadZipFile) as exc:
        raise ValueError("Alloy runtime is not a readable jar with a manifest") from exc
    version_lines = [
        line for line in manifest.splitlines()
        if line.startswith(("Bundle-Version:", "Implementation-Version:"))
    ]
    if not any("6.2.0" in line for line in version_lines):
        raise ValueError("Alloy jar manifest does not identify version 6.2.0")
    return " | ".join(version_lines)


def _parse(output_dir: Path, command_source: str) -> tuple[str, list[dict[str, Any]], bytes, list[tuple[str, bytes]]]:
    receipt_path = output_dir / "receipt.json"
    if not receipt_path.is_file():
        raise ValueError("Alloy omitted receipt.json")
    receipt_bytes = receipt_path.read_bytes()
    receipt = _record(json.loads(receipt_bytes), "Alloy receipt")
    if receipt.get("solver") != "sat4j":
        raise ValueError("Alloy receipt solver is not exact Sat4j")
    commands = _record(receipt.get("commands"), "Alloy commands")
    if set(commands) != {"NoViolation"}:
        raise ValueError("Alloy command denominator is not exact")
    command = _record(commands["NoViolation"], "NoViolation command")
    expected_scope = command_source.removeprefix("check NoViolation for ")
    if (
        command.get("name") != "NoViolation"
        or command.get("type") != "check"
        or command.get("source") != command_source
        or command.get("scopes") != [expected_scope]
    ):
        raise ValueError("Alloy command source, scope, or kind drifted")
    if command.get("status") == "unknown":
        if "solution" in command:
            raise ValueError("unknown Alloy result cannot contain solutions")
        return "unresolved", [], receipt_bytes, []
    summaries = command.get("solution", [])
    if not isinstance(summaries, list):
        raise ValueError("Alloy solution summary is malformed")
    solution_files = sorted(output_dir.glob("NoViolation-solution-*.json"))
    if len(solution_files) != len(summaries):
        raise ValueError("Alloy embedded and file solution counts disagree")
    parsed: list[dict[str, Any]] = []
    raw_files: list[tuple[str, bytes]] = []
    for index, (summary, path) in enumerate(zip(summaries, solution_files, strict=True)):
        if path.name != f"NoViolation-solution-{index}.json":
            raise ValueError("Alloy solution-file denominator is not exact")
        raw = path.read_bytes()
        item = _record(json.loads(raw), path.name)
        if canonical_bytes(summary) != canonical_bytes(item):
            raise ValueError("Alloy embedded and file solution evidence disagree")
        instances = item.get("instances")
        if not isinstance(instances, list) or not instances:
            raise ValueError("Alloy SAT evidence has no instance")
        parsed.append(item)
        raw_files.append((path.name, raw))
    extras = sorted(
        path.name for path in output_dir.iterdir()
        if path.name != "receipt.json" and path not in solution_files
    )
    if extras:
        raise ValueError(f"Alloy emitted undeclared output: {extras}")
    return ("counterexample" if parsed else "no-counterexample"), parsed, receipt_bytes, raw_files


def run(
    model_path: Path,
    output_dir: Path,
    obligation: dict[str, Any],
    fact_manifest: dict[str, Any],
    translation: dict[str, Any],
    *,
    runtime_kind: str,
    java_executable: Path | None = None,
    alloy_jar: Path | None = None,
    fixture_executable: Path | None = None,
    timeout_seconds: int = 30,
    max_output_bytes: int = 1_048_576,
) -> dict[str, Any]:
    if runtime_kind == "alloy-6.2.0":
        if java_executable is None or alloy_jar is None:
            raise ValueError("exact Java and Alloy jar paths are required")
        if not java_executable.is_absolute() or not java_executable.is_file():
            raise ValueError("Java executable must be an exact absolute file")
        if not alloy_jar.is_absolute() or not alloy_jar.is_file() or "6.2.0" not in alloy_jar.name:
            raise ValueError("exact Alloy 6.2.0 jar is required")
        alloy_manifest_version = _verify_alloy_jar(alloy_jar)
        java_version = subprocess.run(
            [str(java_executable), "-version"], capture_output=True, text=True,
            timeout=5, check=False, env={"LANG": "C", "LC_ALL": "C", "PATH": ""},
        )
        if java_version.returncode != 0:
            raise ValueError("exact Java runtime version probe failed")
        argv = [
            str(java_executable), "-jar", str(alloy_jar), "exec", "-q", "-f",
            "-s", "sat4j", "-t", "json", "-o", str(output_dir), "-c",
            "NoViolation", str(model_path),
        ]
        runtime_refs = {
            "java_sha256": hashlib.sha256(java_executable.read_bytes()).hexdigest(),
            "java_version_output": (java_version.stdout + java_version.stderr).strip(),
            "alloy_jar_sha256": hashlib.sha256(alloy_jar.read_bytes()).hexdigest(),
            "alloy_manifest_version": alloy_manifest_version,
        }
    elif runtime_kind == "test-double":
        if fixture_executable is None or not fixture_executable.is_absolute() or not fixture_executable.is_file():
            raise ValueError("exact Alloy test-double path is required")
        version = subprocess.run(
            [str(fixture_executable), "--version"], capture_output=True, text=True,
            timeout=5, check=False, env={"LANG": "C", "LC_ALL": "C", "PATH": ""},
        )
        if version.returncode != 0 or "ALLOY-TEST-DOUBLE" not in (version.stdout + version.stderr):
            raise ValueError("fixture executable is not the declared Alloy test double")
        argv = [
            str(fixture_executable), "exec", "-q", "-f", "-s", "sat4j",
            "-t", "json", "-o", str(output_dir), "-c", "NoViolation", str(model_path),
        ]
        runtime_refs = {"fixture_sha256": hashlib.sha256(fixture_executable.read_bytes()).hexdigest()}
    else:
        raise ValueError("unsupported Alloy runtime kind")
    started_at = datetime.now(timezone.utc).isoformat()
    completed = subprocess.run(
        argv, capture_output=True, timeout=timeout_seconds, check=False,
        env={"LANG": "C", "LC_ALL": "C", "PATH": ""},
    )
    finished_at = datetime.now(timezone.utc).isoformat()
    if completed.returncode != 0:
        raise ValueError(f"Alloy execution failed with exit code {completed.returncode}")
    outcome, solutions, receipt_bytes, solution_files = _parse(output_dir, translation["command_source"])
    raw_size = len(completed.stdout) + len(completed.stderr) + len(receipt_bytes) + sum(len(data) for _, data in solution_files)
    if raw_size > max_output_bytes:
        raise ValueError("Alloy output exceeds declared limit")
    payload = {
        "schema_version": "evf.alloy-provider-receipt/v1",
        "receipt_kind": "provider-evidence" if runtime_kind == "alloy-6.2.0" else "test-only-fixture-evidence",
        "obligation_id": obligation["obligation_id"],
        "fact_manifest_digest": obligation["fact_manifest_digest"],
        "source_facts_digest": fact_manifest["facts_digest"],
        "translation_digest": translation["translation_receipt"]["translation_digest"],
        "provider": {
            "id": "alloy" if runtime_kind == "alloy-6.2.0" else "alloy-test-double",
            "version": "6.2.0" if runtime_kind == "alloy-6.2.0" else "fixture-v1",
            "solver": "sat4j",
            **runtime_refs,
        },
        "execution": {
            "argv": argv,
            "started_at": started_at,
            "finished_at": finished_at,
            "timeout_seconds": timeout_seconds,
            "max_output_bytes": max_output_bytes,
            "network": "forbidden-by-contract",
            "exit_code": completed.returncode,
            "stdout_base64": base64.b64encode(completed.stdout).decode(),
            "stderr_base64": base64.b64encode(completed.stderr).decode(),
            "receipt_json_base64": base64.b64encode(receipt_bytes).decode(),
            "solution_files": [
                {"name": name, "bytes_base64": base64.b64encode(data).decode()}
                for name, data in solution_files
            ],
        },
        "native_result": {
            "command": "NoViolation",
            "exact_scope": translation["exact_scope"],
            "solution_count": len(solutions) if outcome != "unresolved" else None,
            "counterexamples": solutions if outcome == "counterexample" else [],
        },
        "normalized_outcome": outcome,
        "authority_effect": "none",
        "release_admission": "not-granted",
        "claim_ceiling": (
            "Exact Alloy 6.2.0 Sat4j result inside the generated scope only."
            if runtime_kind == "alloy-6.2.0"
            else "Test-only orchestration evidence; not provider or product evidence."
        ),
    }
    return {**payload, "receipt_digest": digest_value(payload)}
