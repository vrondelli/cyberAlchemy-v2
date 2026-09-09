#!/usr/bin/env python3
from __future__ import annotations

import base64
import hashlib
import json
import subprocess
import sys
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker, ValidationError

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[5]


def canonical_digest(value: object) -> str:
    data = (json.dumps(value, sort_keys=True, separators=(",", ":")) + "\n").encode()
    return hashlib.sha256(data).hexdigest()


def file_digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def validate_row(row: object, schema: dict[str, object]) -> None:
    Draft202012Validator(schema, format_checker=FormatChecker()).validate(row)


def main() -> int:
    errors: list[str] = []
    profile = json.loads((ROOT / "profile.json").read_text())
    manifest = json.loads((ROOT / "source-manifest.json").read_text())
    obligation = json.loads((ROOT / "obligation.json").read_text())
    schema = json.loads((ROOT / "schemas/run-record.schema.json").read_text())
    correction_schema = json.loads((ROOT / "schemas/correction-record.schema.json").read_text())

    if profile.get("authority_effect") != "none" or profile.get("product_approval") != "not-granted":
        errors.append("profile authority posture drift")
    if obligation.get("authority_effect") != "none" or "cbmc" in json.dumps(obligation).lower():
        errors.append("neutral obligation authority or provider-neutrality drift")
    if profile.get("selected_obligation") != obligation.get("obligation_id"):
        errors.append("profile obligation binding drift")

    subject = manifest["subject"]
    checkout = REPO / subject["local_checkout"]
    if not checkout.is_dir():
        errors.append("exact CRABS checkout missing")
    else:
        head = subprocess.run(
            ["git", "-C", str(checkout), "rev-parse", "HEAD"],
            capture_output=True, text=True, check=False,
        ).stdout.strip()
        if head != subject["commit"]:
            errors.append("CRABS commit drift")
        status = subprocess.run(
            ["git", "-C", str(checkout), "status", "--porcelain"],
            capture_output=True, text=True, check=False,
        ).stdout
        if status:
            errors.append("CRABS checkout has local byte drift")
        tree = subprocess.run(
            ["git", "-C", str(checkout), "ls-tree", "HEAD", "deps/openabe-c"],
            capture_output=True, text=True, check=False,
        ).stdout
        if subject["openabe_submodule_commit"] not in tree:
            errors.append("OpenABE submodule identity drift")
        for source in manifest["selected_sources"]:
            path = checkout / source["path"]
            if not path.is_file() or file_digest(path) != source["sha256"]:
                errors.append(f"selected CRABS source drift: {source['path']}")

    runtime = manifest["provider_runtime"]
    cbmc = REPO / runtime["executable"]
    package = REPO / runtime["source_package"]
    if not cbmc.is_file() or file_digest(cbmc) != runtime["executable_sha256"]:
        errors.append("CBMC executable missing or drifted")
    if not package.is_file() or file_digest(package) != runtime["source_package_sha256"]:
        errors.append("CBMC source package missing or drifted")
    if cbmc.is_file():
        version = subprocess.run([str(cbmc), "--version"], capture_output=True, text=True, check=False)
        if version.returncode != 0 or version.stdout.strip() != "6.11.0 (cbmc-6.11.0)":
            errors.append("CBMC version output drift")

    compiler = manifest["native_witness_compiler"]
    gcc = Path(compiler["executable"])
    if not gcc.is_file() or file_digest(gcc) != compiler["executable_sha256"]:
        errors.append("native witness compiler missing or drifted")

    passing = [json.loads(line) for line in (ROOT / "fixtures/passing-run.jsonl").read_text().splitlines() if line]
    failing = [json.loads(line) for line in (ROOT / "fixtures/failing-run.jsonl").read_text().splitlines() if line]
    if len(passing) != 1 or len(failing) != 1:
        errors.append("fixture denominator is not exact")
    else:
        try:
            validate_row(passing[0], schema)
        except ValidationError as exc:
            errors.append(f"passing fixture rejected: {exc.message}")
        try:
            validate_row(failing[0], schema)
            errors.append("deliberately failing fixture was accepted")
        except ValidationError:
            pass

    runs = ROOT / "evidence/runs.jsonl"
    run_ids: set[str] = set()
    run_rows: dict[str, dict[str, object]] = {}
    if runs.exists():
        for index, line in enumerate(runs.read_text().splitlines(), start=1):
            if not line:
                continue
            try:
                row = json.loads(line)
                validate_row(row, schema)
                run_ids.add(row["run_id"])
                run_rows[row["run_id"]] = row
            except (json.JSONDecodeError, ValidationError) as exc:
                errors.append(f"live run row {index} invalid: {exc}")

    corrections = ROOT / "evidence/corrections.jsonl"
    if corrections.exists():
        for index, line in enumerate(corrections.read_text().splitlines(), start=1):
            if not line:
                continue
            try:
                row = json.loads(line)
                validate_row(row, correction_schema)
                if row["corrected_run_id"] not in run_ids:
                    errors.append(f"correction row {index} names a missing corrected run")
                if row["replacement_run_id"] not in run_ids:
                    errors.append(f"correction row {index} names a missing replacement run")
                if row["corrected_run_id"] in run_rows:
                    output = base64.b64decode(
                        run_rows[row["corrected_run_id"]]["cbmc"]["stdout_base64"]
                    )
                    if not any(
                        line.startswith(b"[main.assertion.1]") and line.endswith(b": SUCCESS")
                        for line in output.splitlines()
                    ):
                        errors.append(f"correction row {index} lacks corrected-run target SUCCESS evidence")
                if row["replacement_run_id"] in run_rows:
                    output = base64.b64decode(
                        run_rows[row["replacement_run_id"]]["cbmc"]["stdout_base64"]
                    )
                    if not any(
                        line.startswith(b"[main.assertion.1]") and line.endswith(b": FAILURE")
                        for line in output.splitlines()
                    ):
                        errors.append(f"correction row {index} lacks replacement target FAILURE evidence")
            except (json.JSONDecodeError, ValidationError) as exc:
                errors.append(f"correction row {index} invalid: {exc}")

    report = {
        "result": "PASS" if not errors else "BLOCK",
        "candidate": profile["candidate_id"],
        "subject_commit": subject["commit"],
        "source_manifest_digest": canonical_digest(manifest),
        "obligation_digest": canonical_digest(obligation),
        "fixture_validation": "PASS" if not errors else "BLOCK",
        "errors": errors,
        "authority_effect": "none",
    }
    print(json.dumps(report, indent=2))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
