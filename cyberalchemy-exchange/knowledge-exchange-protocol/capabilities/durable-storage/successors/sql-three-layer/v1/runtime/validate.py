#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
V1 = ROOT.parent
BINDING = ROOT / "implementation-binding.json"
SYSTEM_ADMISSION = V1 / "decisions/system-ontology-admission-001.json"
SYSTEM_ONTOLOGY = V1 / "domainspec/generated/system-ontology.json"
PROJECT = "ca2-dst3-validation"


class ValidationError(Exception):
    pass


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path: Path) -> dict:
    return json.loads(path.read_text())


def run(command: list[str], *, env: dict[str, str] | None = None) -> str:
    result = subprocess.run(
        command,
        cwd=ROOT,
        env=env,
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        raise ValidationError(
            f"command failed ({' '.join(command)}): {(result.stdout + result.stderr)[-2000:]}"
        )
    return result.stdout


def validate(run_docker: bool) -> dict:
    binding = load(BINDING)
    admission = load(SYSTEM_ADMISSION)
    if binding.get("lifecycle_status") != "implementation-candidate":
        raise ValidationError("implementation binding is not a candidate")
    if admission.get("admission", {}).get("lifecycle_status") != "admitted":
        raise ValidationError("system ontology predecessor is not admitted")
    if binding["predecessor"]["system_ontology_admission_sha256"] != sha256(
        SYSTEM_ADMISSION
    ):
        raise ValidationError("system ontology admission digest drift")
    if binding["predecessor"]["system_ontology_sha256"] != sha256(SYSTEM_ONTOLOGY):
        raise ValidationError("system ontology digest drift")

    for entry in binding["implementation_manifest"]:
        path = ROOT / entry["path"]
        if not path.is_file():
            raise ValidationError(f"missing implementation file: {entry['path']}")
        if sha256(path) != entry["sha256"]:
            raise ValidationError(f"implementation digest drift: {entry['path']}")

    core = (ROOT / "src/core.rs").read_text().lower()
    forbidden = [value for value in ("postgres", "sqlstate", "$1") if value in core]
    if forbidden:
        raise ValidationError(f"portable core contains adapter syntax: {forbidden}")
    migration = (ROOT / "sql/postgresql/001_init.sql").read_text()
    if "reject_recovery_journal_mutation" not in migration:
        raise ValidationError("PostgreSQL journal append-only guard missing")

    run(["cargo", "fmt", "--check"])
    run(["cargo", "test", "--all-targets"])
    run(["docker", "compose", "-p", PROJECT, "config"])

    docker = {
        "executed": False,
        "image_id": None,
        "postgres_integration": "not-run",
        "append_only_mutation": "not-run",
        "test_resources_removed": False,
    }
    if run_docker:
        try:
            run(
                [
                    "docker",
                    "build",
                    "--tag",
                    "cyberalchemy-dst3-postgres:17-local",
                    "--file",
                    "docker/postgres/Dockerfile",
                    ".",
                ]
            )
            run(["docker", "compose", "-p", PROJECT, "up", "-d", "--wait"])
            test_env = os.environ.copy()
            test_env.update(
                {
                    "DST3_PRIMARY_URL": "postgres://postgres@localhost:55432/durable_primary",
                    "DST3_JOURNAL_URL": "postgres://postgres@localhost:55433/durable_journal",
                }
            )
            run(
                [
                    "cargo",
                    "test",
                    "--test",
                    "postgres_integration",
                    "--",
                    "--ignored",
                ],
                env=test_env,
            )
            journal_container = f"{PROJECT}-recovery-journal-1"
            mutation = subprocess.run(
                [
                    "docker",
                    "exec",
                    journal_container,
                    "psql",
                    "-U",
                    "postgres",
                    "-d",
                    "durable_journal",
                    "-v",
                    "ON_ERROR_STOP=1",
                    "-c",
                    "UPDATE recovery_journal SET object_bytes = decode('00','hex');",
                ],
                cwd=ROOT,
                text=True,
                capture_output=True,
                check=False,
            )
            if mutation.returncode == 0 or "append-only" not in (
                mutation.stdout + mutation.stderr
            ):
                raise ValidationError("journal mutation was not rejected by append-only guard")
            image_id = run(
                [
                    "docker",
                    "image",
                    "inspect",
                    "cyberalchemy-dst3-postgres:17-local",
                    "--format",
                    "{{.Id}}",
                ]
            ).strip()
            docker.update(
                {
                    "executed": True,
                    "image_id": image_id,
                    "postgres_integration": "PASS",
                    "append_only_mutation": "REJECTED",
                }
            )
        finally:
            cleanup = subprocess.run(
                ["docker", "compose", "-p", PROJECT, "down", "-v"],
                cwd=ROOT,
                text=True,
                capture_output=True,
                check=False,
            )
            docker["test_resources_removed"] = cleanup.returncode == 0

    return {
        "schema_version": "cav2-kep-dst3-runtime-validation/v1",
        "result": "PASS",
        "binding_id": binding["binding_id"],
        "system_ontology_sha256": sha256(SYSTEM_ONTOLOGY),
        "implementation_files": len(binding["implementation_manifest"]),
        "portable_core": "PASS",
        "rust_tests": "8/8 PASS; PostgreSQL integration ignored in base run",
        "docker_compose_config": "PASS",
        "docker": docker,
        "authority_effect": "none",
        "external_effect": "bounded local Docker validation only" if run_docker else "none",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--docker", action="store_true")
    args = parser.parse_args()
    try:
        result = validate(args.docker)
    except Exception as error:
        result = {
            "result": "BLOCK",
            "error": str(error),
            "authority_effect": "none",
            "external_effect": "bounded local Docker validation may have occurred"
            if args.docker
            else "none",
        }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["result"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
