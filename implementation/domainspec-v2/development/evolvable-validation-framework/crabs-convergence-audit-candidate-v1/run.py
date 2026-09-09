#!/usr/bin/env python3
from __future__ import annotations

import base64
import hashlib
import json
import os
import platform
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[5]


def canonical_digest(value: object) -> str:
    data = (json.dumps(value, sort_keys=True, separators=(",", ":")) + "\n").encode()
    return hashlib.sha256(data).hexdigest()


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def execution(argv: list[str], completed: subprocess.CompletedProcess[bytes]) -> dict[str, object]:
    return {
        "argv": argv,
        "exit_code": completed.returncode,
        "stdout_sha256": sha(completed.stdout),
        "stderr_sha256": sha(completed.stderr),
        "stdout_base64": base64.b64encode(completed.stdout).decode(),
        "stderr_base64": base64.b64encode(completed.stderr).decode(),
    }


def main() -> int:
    validation = subprocess.run(
        ["python3", str(ROOT / "scripts/validate.py")],
        capture_output=True, text=True, check=False,
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
    cbmc = (REPO / manifest["provider_runtime"]["executable"]).resolve()
    gcc = Path(manifest["native_witness_compiler"]["executable"]).resolve()
    harness = (ROOT / "harness/ordered_set_commutativity.c").resolve()
    dependencies = (ROOT / "harness/crabs_dependencies.c").resolve()
    implementation = (checkout / "src/OT/ot_ordered_set.c").resolve()
    include = (checkout / "src").resolve()
    timeout = profile["execution_policy"]["timeout_seconds"]
    maximum = profile["execution_policy"]["max_output_bytes"]
    started = datetime.now(timezone.utc)

    with tempfile.TemporaryDirectory(prefix="crabs-cbmc-") as temp:
        binary = Path(temp) / "ordered-set-witness"
        compile_argv = [
            str(gcc), "-std=c11", "-O0", "-g", "-B/usr/bin", f"-I{include}",
            str(harness), str(dependencies), str(implementation), "-o", str(binary),
        ]
        compiled = subprocess.run(
            compile_argv, capture_output=True, timeout=timeout, check=False,
            env={"LANG": "C", "LC_ALL": "C", "PATH": ""},
        )
        if compiled.returncode != 0:
            print(compiled.stderr.decode(errors="replace"))
            return 1
        native_argv = [str(binary)]
        native = subprocess.run(
            native_argv, capture_output=True, timeout=timeout, check=False,
            env={"LANG": "C", "LC_ALL": "C", "PATH": ""},
        )

    cbmc_argv = [
        str(cbmc), "--function", "main", "--bounds-check", "--pointer-check",
        "--signed-overflow-check", "--unsigned-overflow-check", "--conversion-check",
        "--unwind", "8", "--unwinding-assertions",
        "--property", "main.assertion.1", "--trace", "--compact-trace", f"-I{include}",
        str(harness), str(dependencies), str(implementation),
    ]
    # CBMC delegates C preprocessing to a program named `gcc`. Expose only the
    # manifest-bound compiler, rather than inheriting an ambient tool search.
    with tempfile.TemporaryDirectory(prefix="crabs-cbmc-path-") as temp:
        private_bin = Path(temp)
        os.symlink(gcc, private_bin / "gcc")
        checked = subprocess.run(
            cbmc_argv, capture_output=True, timeout=timeout, check=False,
            env={"LANG": "C", "LC_ALL": "C", "PATH": str(private_bin)},
        )
    if len(native.stdout) + len(native.stderr) + len(checked.stdout) + len(checked.stderr) > maximum:
        raise ValueError("provider output exceeds declared limit")
    finished = datetime.now(timezone.utc)

    native_witness = native.returncode != 0 and b"ordered-set merge must be commutative" in native.stderr
    target_result = next(
        (
            line for line in checked.stdout.splitlines()
            if line.startswith(b"[main.assertion.1]")
            and b"ordered-set merge must be commutative" in line
        ),
        b"",
    )
    cbmc_witness = checked.returncode != 0 and target_result.endswith(b": FAILURE")
    outcome = "counterexample" if native_witness and cbmc_witness else "not-evaluable"
    identity = {
        "started_at": started.isoformat(),
        "subject": manifest["subject"]["commit"],
        "manifest": canonical_digest(manifest),
        "obligation": canonical_digest(obligation),
        "harness": sha(harness.read_bytes()),
        "dependencies": sha(dependencies.read_bytes()),
    }
    run_id = f"crabs-cbmc-{canonical_digest(identity)[:16]}"
    row = {
        "schema_version": "evf.crabs-cbmc-run-record/v1",
        "run_id": run_id,
        "evidence_status": "live",
        "started_at": started.isoformat(),
        "finished_at": finished.isoformat(),
        "host": f"{platform.system()}-{platform.machine()}",
        "subject_commit": manifest["subject"]["commit"],
        "source_manifest_digest": canonical_digest(manifest),
        "obligation_digest": canonical_digest(obligation),
        "provider": {
            "id": "cbmc",
            "version": manifest["provider_runtime"]["version"],
            "runtime_sha256": manifest["provider_runtime"]["executable_sha256"],
            "native_compiler_sha256": manifest["native_witness_compiler"]["executable_sha256"],
        },
        "bounds": obligation["subject"]["bound"],
        "native": execution(native_argv, native),
        "cbmc": execution(cbmc_argv, checked),
        "normalized_outcome": outcome,
        "authority_effect": "none",
        "claim_ceiling": profile["claim_ceiling"],
    }
    Draft202012Validator(schema, format_checker=FormatChecker()).validate(row)
    evidence = ROOT / "evidence"
    evidence.mkdir(exist_ok=True)
    with (evidence / "runs.jsonl").open("a", encoding="utf-8") as stream:
        stream.write(json.dumps(row, sort_keys=True) + "\n")
    summary = {
        "schema_version": "evf.crabs-convergence-result-summary/v1",
        "run_id": run_id,
        "subject_commit": row["subject_commit"],
        "obligation_id": obligation["obligation_id"],
        "status": "COUNTEREXAMPLE" if outcome == "counterexample" else "NOT_EVALUABLE",
        "plain_result": (
            "Merging singleton A into B produces a different order than merging B into A."
            if outcome == "counterexample"
            else "The bounded run did not produce comparable native and CBMC evidence."
        ),
        "residue": obligation["residue"],
        "authority_effect": "none",
        "product_approval": "not-granted",
        "publication": "not-authorized",
        "claim_ceiling": profile["claim_ceiling"],
    }
    (evidence / "result-summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    print(json.dumps(summary, indent=2))
    return 0 if outcome == "counterexample" else 1


if __name__ == "__main__":
    raise SystemExit(main())
