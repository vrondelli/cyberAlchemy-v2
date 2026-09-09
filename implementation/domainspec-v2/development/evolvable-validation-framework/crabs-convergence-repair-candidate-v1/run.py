#!/usr/bin/env python3
from __future__ import annotations

import base64
import hashlib
import json
import os
import platform
import re
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[5]


def canonical_digest(value: object) -> str:
    encoded = (json.dumps(value, sort_keys=True, separators=(",", ":")) + "\n").encode()
    return hashlib.sha256(encoded).hexdigest()


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def execute(argv: list[str], *, timeout: int, env: dict[str, str]) -> subprocess.CompletedProcess[bytes]:
    try:
        return subprocess.run(argv, capture_output=True, timeout=timeout, check=False, env=env)
    except subprocess.TimeoutExpired as exc:
        stdout = exc.stdout if isinstance(exc.stdout, bytes) else (exc.stdout or "").encode()
        stderr = exc.stderr if isinstance(exc.stderr, bytes) else (exc.stderr or "").encode()
        return subprocess.CompletedProcess(argv, 124, stdout, stderr + b"\nEVF_TIMEOUT\n")


def skipped(argv: list[str], reason: str) -> subprocess.CompletedProcess[bytes]:
    return subprocess.CompletedProcess(argv, 125, b"", reason.encode())


def receipt(argv: list[str], result: subprocess.CompletedProcess[bytes]) -> dict[str, object]:
    return {
        "argv": argv,
        "exit_code": result.returncode,
        "stdout_sha256": sha(result.stdout),
        "stderr_sha256": sha(result.stderr),
        "stdout_base64": base64.b64encode(result.stdout).decode(),
        "stderr_base64": base64.b64encode(result.stderr).decode(),
    }


def target_result(output: bytes) -> str | None:
    text = output.decode(errors="replace")
    match = re.search(r"^\[main\.assertion\.3\].*:\s+(SUCCESS|FAILURE)$", text, re.MULTILINE)
    return match.group(1) if match else None


def main() -> int:
    validation = subprocess.run(
        ["python3", str(ROOT / "scripts/validate.py")],
        capture_output=True, text=True, check=False,
        env={"LANG": "C", "LC_ALL": "C", "PATH": os.environ.get("PATH", "")},
    )
    if validation.returncode != 0:
        print(validation.stdout, end="")
        print(validation.stderr, end="")
        return 1

    profile = json.loads((ROOT / "profile.json").read_text())
    manifest = json.loads((ROOT / "source-manifest.json").read_text())
    obligation = json.loads((ROOT / "obligation.json").read_text())
    schema = json.loads((ROOT / "schemas/run-record.schema.json").read_text())
    checkout = REPO / manifest["subject"]["local_checkout"]
    implementation = (checkout / "src/OT/ot_ordered_set.c").resolve()
    include = (checkout / "src").resolve()
    harness = (ROOT / "harness/ordered_set_commutativity.c").resolve()
    regression_harness = (ROOT / "harness/ordered_set_regression.c").resolve()
    dependencies = (ROOT / "harness/crabs_dependencies.c").resolve()
    cbmc = (REPO / manifest["provider_runtime"]["executable"]).resolve()
    gcc = Path(manifest["native_compiler"]["executable"]).resolve()
    timeout = profile["execution_policy"]["timeout_seconds"]
    maximum = profile["execution_policy"]["max_output_bytes"]
    env = {"LANG": "C", "LC_ALL": "C", "PATH": ""}
    started = datetime.now(timezone.utc)

    with tempfile.TemporaryDirectory(prefix="crabs-repair-native-") as temp:
        obligation_binary = Path(temp) / "commutativity"
        regression_binary = Path(temp) / "regression"
        common = [str(gcc), "-std=c11", "-O0", "-g", "-Wall", "-Wextra", "-Werror", "-D_POSIX_C_SOURCE=200809L", "-B/usr/bin", f"-I{include}"]
        compile_obligation_argv = common + [str(harness), str(dependencies), str(implementation), "-o", str(obligation_binary)]
        compile_regression_argv = common + [str(regression_harness), str(dependencies), str(implementation), "-o", str(regression_binary)]
        compiled_obligation = execute(compile_obligation_argv, timeout=timeout, env=env)
        compiled_regression = execute(compile_regression_argv, timeout=timeout, env=env)
        obligation_argv = [str(obligation_binary)]
        regression_argv = [str(regression_binary)]
        native_obligation = (
            execute(obligation_argv, timeout=timeout, env=env)
            if compiled_obligation.returncode == 0 else skipped(obligation_argv, "obligation compilation failed")
        )
        native_regression = (
            execute(regression_argv, timeout=timeout, env=env)
            if compiled_regression.returncode == 0 else skipped(regression_argv, "regression compilation failed")
        )

    cbmc_argv = [
        str(cbmc), "--function", "main", "--bounds-check", "--pointer-check",
        "--signed-overflow-check", "--unsigned-overflow-check", "--conversion-check",
        "--unwind", "4", "--unwindset", "memcmp.0:65,strncmp.0:65",
        "--property", "main.assertion.3", "--trace", "--compact-trace",
        "--slice-formula", f"-I{include}",
        str(harness), str(dependencies), str(implementation),
    ]
    with tempfile.TemporaryDirectory(prefix="crabs-repair-cbmc-path-") as temp:
        private_bin = Path(temp)
        os.symlink(gcc, private_bin / "gcc")
        cbmc_env = {"LANG": "C", "LC_ALL": "C", "PATH": str(private_bin)}
        checked = execute(cbmc_argv, timeout=timeout, env=cbmc_env)

    outputs = [compiled_obligation, compiled_regression, native_obligation, native_regression, checked]
    if sum(len(item.stdout) + len(item.stderr) for item in outputs) > maximum:
        checked = subprocess.CompletedProcess(cbmc_argv, 126, b"", b"EVF_OUTPUT_LIMIT_EXCEEDED\n")

    target = target_result(checked.stdout)
    native_ok = (
        compiled_obligation.returncode == 0 and compiled_regression.returncode == 0 and
        native_obligation.returncode == 0 and native_regression.returncode == 0
    )
    if native_ok and checked.returncode == 0 and target == "SUCCESS" and b"VERIFICATION SUCCESSFUL" in checked.stdout:
        outcome = "no-counterexample"
    elif checked.returncode != 0 and target == "FAILURE":
        outcome = "counterexample"
    else:
        outcome = "not-evaluable"
    finished = datetime.now(timezone.utc)
    identity = {
        "started_at": started.isoformat(),
        "repair": manifest["subject"]["repair_diff_sha256"],
        "manifest": canonical_digest(manifest),
        "obligation": canonical_digest(obligation),
    }
    run_id = f"crabs-repair-{canonical_digest(identity)[:16]}"
    row = {
        "schema_version": "evf.crabs-repair-run-record/v1",
        "run_id": run_id,
        "evidence_status": "live",
        "started_at": started.isoformat(),
        "finished_at": finished.isoformat(),
        "host": f"{platform.system()}-{platform.machine()}",
        "subject_base_commit": manifest["subject"]["base_commit"],
        "subject_candidate_commit": manifest["subject"]["candidate_commit"],
        "repair_diff_sha256": manifest["subject"]["repair_diff_sha256"],
        "source_manifest_digest": canonical_digest(manifest),
        "obligation_digest": canonical_digest(obligation),
        "provider": {
            "id": "cbmc",
            "version": manifest["provider_runtime"]["version"],
            "runtime_sha256": manifest["provider_runtime"]["executable_sha256"],
            "native_compiler_sha256": manifest["native_compiler"]["executable_sha256"],
        },
        "bounds": obligation["subject"]["bound"],
        "compile_obligation": receipt(compile_obligation_argv, compiled_obligation),
        "compile_regression": receipt(compile_regression_argv, compiled_regression),
        "native_obligation": receipt(obligation_argv, native_obligation),
        "native_regression": receipt(regression_argv, native_regression),
        "cbmc": receipt(cbmc_argv, checked),
        "normalized_outcome": outcome,
        "authority_effect": "none",
        "claim_ceiling": profile["claim_ceiling"],
    }
    Draft202012Validator(schema, format_checker=FormatChecker()).validate(row)
    evidence = ROOT / "evidence"
    evidence.mkdir(exist_ok=True)
    with (evidence / "runs.jsonl").open("a", encoding="utf-8") as stream:
        stream.write(json.dumps(row, sort_keys=True) + "\n")
    status = {"no-counterexample": "NO_COUNTEREXAMPLE_AT_BOUND", "counterexample": "COUNTEREXAMPLE", "not-evaluable": "NOT_EVALUABLE"}[outcome]
    summary = {
        "schema_version": "evf.crabs-repair-result-summary/v1",
        "run_id": run_id,
        "repair_diff_sha256": row["repair_diff_sha256"],
        "subject_candidate_commit": manifest["subject"]["candidate_commit"],
        "obligation_id": obligation["obligation_id"],
        "status": status,
        "plain_result": (
            "The native checks passed and CBMC found no violation of the repaired two-singleton commutativity obligation within the declared bound."
            if outcome == "no-counterexample" else
            "CBMC found a violation of the repaired two-singleton commutativity obligation."
            if outcome == "counterexample" else
            "The current run did not produce complete comparable native and CBMC evidence."
        ),
        "residue": obligation["residue"],
        "authority_effect": "none",
        "product_approval": "not-granted",
        "publication": "not-authorized",
        "claim_ceiling": profile["claim_ceiling"],
    }
    (evidence / "result-summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    print(json.dumps(summary, indent=2))
    return 0 if outcome == "no-counterexample" else 1


if __name__ == "__main__":
    raise SystemExit(main())
