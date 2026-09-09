#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import subprocess
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker, ValidationError

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[5]


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def canonical_digest(value: object) -> str:
    encoded = (json.dumps(value, sort_keys=True, separators=(",", ":")) + "\n").encode()
    return hashlib.sha256(encoded).hexdigest()


def main() -> int:
    errors: list[str] = []
    profile = json.loads((ROOT / "profile.json").read_text())
    manifest = json.loads((ROOT / "source-manifest.json").read_text())
    obligation = json.loads((ROOT / "obligation.json").read_text())
    schema = json.loads((ROOT / "schemas/run-record.schema.json").read_text())

    if profile.get("authority_effect") != "none" or profile.get("product_approval") != "not-granted":
        errors.append("profile authority posture drift")
    if obligation.get("authority_effect") != "none" or "cbmc" in json.dumps(obligation).lower():
        errors.append("obligation is not provider-neutral")
    if profile.get("selected_obligation") != obligation.get("obligation_id"):
        errors.append("profile obligation binding drift")

    subject = manifest["subject"]
    checkout = REPO / subject["local_checkout"]
    selected_paths = [entry["path"] for entry in manifest["selected_sources"]]
    if not checkout.is_dir():
        errors.append("repair checkout missing")
    else:
        head = subprocess.run(
            ["git", "-C", str(checkout), "rev-parse", "HEAD"],
            capture_output=True, text=True, check=False,
        ).stdout.strip()
        branch = subprocess.run(
            ["git", "-C", str(checkout), "branch", "--show-current"],
            capture_output=True, text=True, check=False,
        ).stdout.strip()
        if head != subject["candidate_commit"]:
            errors.append("repair candidate commit drift")
        if branch != subject["local_branch"]:
            errors.append("repair branch drift")
        for entry in manifest["selected_sources"]:
            source = checkout / entry["path"]
            if not source.is_file() or digest(source) != entry["sha256"]:
                errors.append(f"repair source drift: {entry['path']}")
        diff = subprocess.run(
            ["git", "-C", str(checkout), "diff", f"{subject['base_commit']}..{subject['candidate_commit']}", "--", *selected_paths],
            capture_output=True, check=False,
        )
        if diff.returncode != 0 or hashlib.sha256(diff.stdout).hexdigest() != subject["repair_diff_sha256"]:
            errors.append("repair diff drift")

    patch = ROOT / subject["patch_path"]
    if not patch.is_file() or digest(patch) != subject["patch_sha256"]:
        errors.append("durable repair patch missing or drifted")
    pristine = REPO / ".formal-tools/crabs/9e3a0a6fbaa3f163d0afc5afa94a65fbc5be1937/repo"
    if pristine.is_dir() and patch.is_file():
        applies = subprocess.run(
            ["git", "-C", str(pristine), "apply", "--check", str(patch)],
            capture_output=True, check=False,
        )
        if applies.returncode != 0:
            errors.append("durable repair patch does not apply to the pinned base")
    else:
        errors.append("pinned pristine checkout missing")

    for entry in manifest["harnesses"]:
        path = ROOT / entry["path"]
        if not path.is_file() or digest(path) != entry["sha256"]:
            errors.append(f"harness drift: {entry['path']}")

    runtime = manifest["provider_runtime"]
    cbmc = REPO / runtime["executable"]
    package = REPO / runtime["source_package"]
    if not cbmc.is_file() or digest(cbmc) != runtime["executable_sha256"]:
        errors.append("CBMC executable missing or drifted")
    if not package.is_file() or digest(package) != runtime["source_package_sha256"]:
        errors.append("CBMC source package missing or drifted")
    if cbmc.is_file():
        version = subprocess.run([str(cbmc), "--version"], capture_output=True, text=True, check=False)
        if version.returncode != 0 or version.stdout.strip() != "6.11.0 (cbmc-6.11.0)":
            errors.append("CBMC version output drift")

    compiler = manifest["native_compiler"]
    gcc = Path(compiler["executable"])
    if not gcc.is_file() or digest(gcc) != compiler["executable_sha256"]:
        errors.append("native compiler missing or drifted")

    try:
        Draft202012Validator.check_schema(schema)
    except Exception as exc:
        errors.append(f"run schema invalid: {exc}")
    runs = ROOT / "evidence/runs.jsonl"
    if runs.exists():
        for number, line in enumerate(runs.read_text().splitlines(), start=1):
            if not line:
                continue
            try:
                Draft202012Validator(schema, format_checker=FormatChecker()).validate(json.loads(line))
            except (json.JSONDecodeError, ValidationError) as exc:
                errors.append(f"live run row {number} invalid: {exc}")

    report = {
        "result": "PASS" if not errors else "BLOCK",
        "candidate": profile["candidate_id"],
        "subject_base_commit": subject["base_commit"],
        "repair_diff_sha256": subject["repair_diff_sha256"],
        "source_manifest_digest": canonical_digest(manifest),
        "obligation_digest": canonical_digest(obligation),
        "errors": errors,
        "authority_effect": "none",
    }
    print(json.dumps(report, indent=2))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
