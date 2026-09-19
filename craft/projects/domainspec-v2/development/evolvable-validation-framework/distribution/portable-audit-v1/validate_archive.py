#!/usr/bin/env python3
"""Test the actual local archive in a new non-repository directory; never publish it."""
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tarfile
import tempfile

HERE = Path(__file__).resolve().parent
ARTIFACTS = HERE / "artifacts"
ARCHIVE = ARTIFACTS / "evf-audit-kit-0.1.0-linux-x86_64.tar.gz"


def main():
    checksum = hashlib.sha256(ARCHIVE.read_bytes()).hexdigest()
    expected = (ARTIFACTS / "SHA256SUMS").read_text().strip()
    if expected != checksum + "  " + ARCHIVE.name:
        raise RuntimeError("Archive checksum mismatch")
    report_path = HERE / "VALIDATION.json"
    if report_path.exists():
        raise RuntimeError("Preserve the existing report; choose a new validation epoch explicitly")
    temporary = Path(tempfile.mkdtemp(prefix="evf-portable-release-"))
    print("Validation directory: " + str(temporary), flush=True)
    with tarfile.open(ARCHIVE, "r:gz") as archive:
        members = archive.getmembers()
        if len({member.name for member in members}) != len(members):
            raise RuntimeError("Duplicate archive entries")
        for member in members:
            path = Path(member.name)
            if not member.isfile() or path.is_absolute() or ".." in path.parts or path.parts[0] != "evf-audit-kit-0.1.0":
                raise RuntimeError("Non-regular or unsafe archive member")
            if path.parts[1:3] == ("runtime", "target"):
                raise RuntimeError("Build leftovers entered archive")
        archive.extractall(temporary, filter="data")
    kit = temporary / "evf-audit-kit-0.1.0"
    manifest = json.loads((kit / "KIT-MANIFEST.json").read_text())
    shipped = {member.name.removeprefix("evf-audit-kit-0.1.0/") for member in members}
    if shipped != {item["path"] for item in manifest["files"]} | {"KIT-MANIFEST.json"}:
        raise RuntimeError("Archive does not exactly match its manifest")
    if (kit / ".git").exists() or (kit / "runtime/target").exists():
        raise RuntimeError("Extracted package contains repository/build state")

    checks = []
    def run(name, command, environment, expected_marker=None):
        print("Running " + name, flush=True)
        result = subprocess.run(command, cwd=kit, env=environment, capture_output=True, text=True, timeout=600)
        output = result.stdout + result.stderr
        with (temporary / (name + ".log")).open("x") as stream:
            stream.write(output)
        print(output[-12000:], flush=True)
        if result.returncode or (expected_marker and expected_marker not in output):
            raise RuntimeError(name + " failed; retained logs at " + str(temporary))
        checks.append({"name": name, "result": "passed", "exit_code": result.returncode,
                       "log_sha256": hashlib.sha256(output.encode()).hexdigest()})

    base_environment = {"PATH": os.defpath, "LANG": "C", "LC_ALL": "C", "PYTHONDONTWRITEBYTECODE": "1"}
    run("shipped-doctor", [sys.executable, "evf", "doctor"], base_environment, '"status": "ready"')
    run("shipped-cli-tests", [sys.executable, "tests/test_cli.py"], base_environment, "Ran 14 tests")
    rustup = shutil.which("rustup")
    if not rustup:
        raise RuntimeError("This validation host needs rustup to resolve its installed toolchain explicitly")
    cargo = Path(subprocess.check_output([rustup, "which", "cargo"], text=True).strip())
    empty_cache = temporary / "empty-cargo-cache"
    empty_cache.mkdir()
    build_environment = dict(base_environment, PATH=str(cargo.parent) + os.pathsep + os.defpath, CARGO_HOME=str(empty_cache))
    unshare = shutil.which("unshare")
    if not unshare:
        raise RuntimeError("Missing namespace tool")
    run("offline-rebuild", [unshare, "--user", "--map-root-user", "--net", "--", sys.executable, "build.py"],
        build_environment, "8 passed; 0 failed")
    run("rebuilt-cli-tests", [sys.executable, "tests/test_cli.py"], base_environment, "Ran 14 tests")
    result = {"schema_version": "evf.portable-package-validation/v1", "verdict": "passed",
              "validated_at": datetime.now(timezone.utc).isoformat(),
              "archive": ARCHIVE.name, "archive_sha256": checksum, "archive_size_bytes": ARCHIVE.stat().st_size,
              "archive_files": len(members), "checks": checks,
              "execution_conditions": {"new_directory_outside_repository": True, "git_checkout_in_package": False,
                                       "preexisting_build_outputs": False, "offline_rebuild_empty_cargo_cache": True,
                                       "offline_rebuild_network_namespace": True, "independent_host_os_tested": False},
              "test_counts": {"rust_contract_tests": 8, "cli_integration_tests_per_binary_build": 14,
                              "tested_binary_builds": ["shipped", "offline-rebuilt"]},
              "claim_ceiling": "Standalone executable-audit packaging tests on one Linux host; no solver adapters, hostile-code sandbox, or whole-program proof",
              "product_approval": "not-inherited", "published": False, "authority_effect": "none",
              "retained_test_directory": str(temporary)}
    with report_path.open("x") as stream:
        json.dump(result, stream, indent=2)
        stream.write("\n")
    print(json.dumps(result, indent=2), flush=True)


if __name__ == "__main__":
    try:
        main()
    except (OSError, RuntimeError, ValueError, subprocess.CalledProcessError, subprocess.TimeoutExpired) as error:
        print("Validation failed: " + str(error), file=sys.stderr)
        sys.exit(2)
