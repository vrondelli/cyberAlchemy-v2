#!/usr/bin/env python3
"""Assess accepted VPS deployment binding 003 without external effects."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys


ROOT = Path(__file__).resolve().parent
VERTICAL = ROOT.parent
EVIDENCE = ROOT / "evidence/deployment-conformance-assessment-003.json"
ACCEPTANCE = VERTICAL / "decisions/deployment-implementation-binding-acceptance-003.json"
ACCEPTANCE_SHA256 = "87146a8a7b26e9912ff9ff6776a883c749296f1fed678d3dd53a4f1b4f924f42"
CANDIDATE = ROOT / "implementation-binding-candidate-003.json"
CANDIDATE_SHA256 = "93d7eb08f5444b85b2cef28e47b95bac76d04a9b167f99c9876348c5c512011d"
RECORD = ROOT / "implementation-binding-record-003.json"
RECORD_SHA256 = "f8f0d3465cc76a32827c25c64cc8481071b502ca755537e95edc71010f81c17b"
ACCEPTANCE_VALIDATION = ROOT / "evidence/implementation-binding-acceptance-validation-003.json"
ACCEPTANCE_VALIDATION_SHA256 = "309842c8061ebf49f77ca34ea3d1f7b2df7751884a0f8c48d2a64bc970abfe2e"
ARCHIVE = Path("/tmp/ca2-kep-hosted-36d3ececb415a0f8d8a00cecb69918e097ae7e43065ffd150fa78f1ac01f1543.tar.gz")
ARCHIVE_SHA256 = "e1b7365bbca50cba0a4d651721be7cb22ec2ad83eafba4c9c8e481e40a959754"
IMAGE_TAG = "ca2-kep-hosted-devnet:accepted-36d3ececb415a0f8d8a00cecb69918e097ae7e43065ffd150fa78f1ac01f1543"
IMAGE_ID = "sha256:9aa794863a8c839dd13d56fb594d997d0e5d6af4a94478fc3fb29303fe4a39e5"


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(check_id: str, argv: list[str], env: dict[str, str] | None = None) -> dict[str, object]:
    completed = subprocess.run(
        argv,
        cwd=VERTICAL,
        env=env,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    result: dict[str, object] = {
        "check_id": check_id,
        "status": "PASS" if completed.returncode == 0 else "BLOCK",
        "exit_code": completed.returncode,
    }
    if completed.returncode != 0:
        result["stdout"] = completed.stdout[-4000:]
        result["stderr"] = completed.stderr[-4000:]
    return result


def main() -> int:
    checks: list[dict[str, object]] = []
    errors: list[str] = []
    frozen = (
        (ACCEPTANCE, ACCEPTANCE_SHA256, "accepted-deployment-binding"),
        (CANDIDATE, CANDIDATE_SHA256, "immutable-deployment-binding-candidate"),
        (RECORD, RECORD_SHA256, "immutable-deployment-binding-record"),
        (ACCEPTANCE_VALIDATION, ACCEPTANCE_VALIDATION_SHA256, "acceptance-validation"),
        (ARCHIVE, ARCHIVE_SHA256, "exact-image-archive"),
    )
    for path, expected, check_id in frozen:
        actual = sha(path) if path.is_file() else None
        status = "PASS" if actual == expected else "BLOCK"
        checks.append({"check_id": check_id, "status": status, "expected_sha256": expected, "actual_sha256": actual})
        if status != "PASS":
            errors.append(f"{check_id} missing or digest drift")

    env = os.environ.copy()
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    checks.append(run("accepted-binding-validation", [sys.executable, str(ROOT / "validate-binding-acceptance-003.py")], env))
    checks.append(run("deployment-preflight", [sys.executable, str(ROOT / "validate.py"), "--no-write"], env))
    for script in ("deploy-vps.sh", "backup-postgres.sh", "restore-postgres.sh"):
        checks.append(run(f"shell-syntax:{script}", ["sh", "-n", str(ROOT / script)], env))

    compose_env = env | {
        "PUBLIC_HOST": "kep.cyberalchemylab.com",
        "EDGE_NETWORK": "troqar_edge",
        "TRAEFIK_ENTRYPOINT": "websecure",
        "TRAEFIK_CERT_RESOLVER": "letsencrypt",
        "KEP_IMAGE": IMAGE_TAG,
        "KEP_DB_PASSWORD": "conformance-placeholder-not-live",
        "CA2_KEP_DEVNET_RPC_URL": "https://api.devnet.solana.com",
    }
    checks.append(run("compose-config", ["docker", "compose", "--file", str(ROOT / "compose.yaml"), "config", "--quiet"], compose_env))
    checks.append(run("local-image-id", ["sh", "-c", f'test "$(docker image inspect --format={{{{.Id}}}} {IMAGE_TAG})" = "{IMAGE_ID}"'], env))

    failed = [str(item["check_id"]) for item in checks if item["status"] != "PASS"]
    errors.extend(f"failed check: {check_id}" for check_id in failed)
    result = "PASS_BOUNDED" if not errors else "BLOCK"
    receipt = {
        "schema_version": "cav2-kep-hosted-vps-deployment-conformance-assessment/v1",
        "assessment_id": "CA2-ASSESS-KEP-HOSTED-DEVNET-VPS-BINDING-003",
        "assessed_at": "2026-09-03",
        "route_id": "CA2-ROUTE-PUBLISH",
        "accepted_target": {
            "decision_sha256": ACCEPTANCE_SHA256,
            "candidate_sha256": CANDIDATE_SHA256,
            "binding_record_sha256": RECORD_SHA256,
            "image_archive_sha256": ARCHIVE_SHA256,
            "image_tag": IMAGE_TAG,
            "local_image_id": IMAGE_ID,
        },
        "selected_ontology_dependencies": [
            "kep-hosted-vps-deployment-transition",
            "kep-hosted-vps-deployment-observation",
            "kep-hosted-offhost-backup",
            "kep-hosted-disposable-restore-verification",
        ],
        "checks": checks,
        "assessment_result": result,
        "deployment_conformance": result,
        "vps_execution": "not-authorized",
        "authority_effect": "none",
        "external_effect": "none",
        "errors": errors,
        "claim_limit": "Post-acceptance local deployment-layer conformance only. It does not prove the VPS state or authorize credentials, SSH, upload, activation, transaction submission, publication, release, or any external effect.",
    }
    EVIDENCE.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n")
    print(json.dumps(receipt, indent=2, sort_keys=True))
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
