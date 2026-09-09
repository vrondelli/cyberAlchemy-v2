from __future__ import annotations

import hashlib
import base64
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from tde.neutral_obligation import digest_value


def _read_limited(path: Path, maximum: int) -> bytes:
    data = path.read_bytes()
    if len(data) > maximum:
        raise ValueError("provider output exceeds declared limit")
    return data


def run(
    executable: Path,
    facts_dir: Path,
    output_dir: Path,
    query_path: Path,
    obligation: dict[str, Any],
    fact_manifest: dict[str, Any],
    translation_receipt: dict[str, Any],
    *,
    runtime_kind: str,
    timeout_seconds: int = 30,
    max_output_bytes: int = 1_048_576,
) -> dict[str, Any]:
    if not executable.is_absolute() or not executable.is_file():
        raise ValueError("provider executable must be an exact absolute file")
    version = subprocess.run(
        [str(executable), "--version"], capture_output=True, text=True,
        timeout=5, check=False, env={"LANG": "C", "LC_ALL": "C", "PATH": ""},
    )
    version_text = (version.stdout + version.stderr).strip()
    if runtime_kind == "souffle-2.5" and (version.returncode != 0 or "2.5" not in version_text):
        raise ValueError("exact Souffle 2.5 runtime was not observed")
    if runtime_kind == "test-double" and "TEST-DOUBLE" not in version_text:
        raise ValueError("fixture executable is not the declared test double")
    argv = [str(executable)]
    if runtime_kind == "souffle-2.5":
        # EVF emits closed, generated Datalog without includes or macros.  Make
        # that contract explicit so Souffle cannot discover an ambient C
        # preprocessor through PATH.
        argv.append("--no-preprocessor")
    argv.extend(["-F", str(facts_dir), "-D", str(output_dir), str(query_path)])
    started_at = datetime.now(timezone.utc).isoformat()
    completed = subprocess.run(
        argv, capture_output=True, timeout=timeout_seconds, check=False,
        env={"LANG": "C", "LC_ALL": "C", "PATH": ""},
    )
    finished_at = datetime.now(timezone.utc).isoformat()
    if completed.returncode != 0:
        raise ValueError(f"provider execution failed with exit code {completed.returncode}")
    if len(completed.stdout) + len(completed.stderr) > max_output_bytes:
        raise ValueError("provider process output exceeds declared limit")
    violation_path = output_dir / "Violation.csv"
    if not violation_path.is_file():
        raise ValueError("provider omitted Violation.csv")
    extras = sorted(path.name for path in output_dir.iterdir() if path.name != "Violation.csv")
    if extras:
        raise ValueError(f"provider emitted undeclared output: {extras}")
    raw = _read_limited(violation_path, max_output_bytes)
    rows = [line for line in raw.decode().splitlines() if line]
    normalized = "counterexample" if rows else "no-counterexample"
    runtime_bytes = executable.read_bytes()
    receipt_payload = {
        "schema_version": "evf.souffle-provider-receipt/v1",
        "receipt_kind": "provider-evidence" if runtime_kind == "souffle-2.5" else "test-only-fixture-evidence",
        "obligation_id": obligation["obligation_id"],
        "fact_manifest_digest": obligation["fact_manifest_digest"],
        "source_facts_digest": fact_manifest["facts_digest"],
        "translation_digest": translation_receipt["translation_digest"],
        "provider": {
            "id": "souffle" if runtime_kind == "souffle-2.5" else "souffle-test-double",
            "version": "2.5" if runtime_kind == "souffle-2.5" else "fixture-v1",
            "runtime_sha256": hashlib.sha256(runtime_bytes).hexdigest(),
            "version_output": version_text,
        },
        "execution": {
            "argv": argv,
            "started_at": started_at,
            "finished_at": finished_at,
            "timeout_seconds": timeout_seconds,
            "max_output_bytes": max_output_bytes,
            "network": "forbidden-by-contract",
            "environment_allowlist": ["LANG", "LC_ALL", "PATH"],
            "preprocessing": (
                "disabled-generated-query-has-no-includes-or-macros"
                if runtime_kind == "souffle-2.5"
                else "fixture-controlled"
            ),
            "exit_code": completed.returncode,
            "stdout_sha256": hashlib.sha256(completed.stdout).hexdigest(),
            "stderr_sha256": hashlib.sha256(completed.stderr).hexdigest(),
            "violation_csv_sha256": hashlib.sha256(raw).hexdigest(),
            "stdout_base64": base64.b64encode(completed.stdout).decode(),
            "stderr_base64": base64.b64encode(completed.stderr).decode(),
            "violation_csv_base64": base64.b64encode(raw).decode(),
        },
        "native_result": {"violation_rows": rows},
        "normalized_outcome": normalized,
        "authority_effect": "none",
        "release_admission": "not-granted",
        "claim_ceiling": (
            "Exact closed-world Souffle 2.5 result for the bound obligation only."
            if runtime_kind == "souffle-2.5"
            else "Test-only orchestration evidence; not provider or product evidence."
        ),
    }
    return {**receipt_payload, "receipt_digest": digest_value(receipt_payload)}
