#!/usr/bin/env python3
"""Validate deployment candidate 003 with read-only local, VPS, and HTTPS checks."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import subprocess
import tarfile
import urllib.request


ROOT = Path(__file__).resolve().parent
CANDIDATE = ROOT / "prebuilt-image-deployment-candidate-003.json"
CANDIDATE_SHA256 = "c742b093a7d49dab81064676c217b0de3df222512ad51bc88fb4ac5405f76dec"
ACCEPTANCE = ROOT.parent / "decisions/deployment-implementation-binding-acceptance-003.json"
ACCEPTANCE_SHA256 = "87146a8a7b26e9912ff9ff6776a883c749296f1fed678d3dd53a4f1b4f924f42"
CONFORMANCE = ROOT / "evidence/deployment-conformance-assessment-003.json"
CONFORMANCE_SHA256 = "6dfaf84afc90efe912cbb372c82f8fc5a2827b41bc4071d2d3bd329eefd5aac9"
OBSERVATION = ROOT / "evidence/vps-predeployment-observation-003.json"
OBSERVATION_SHA256 = "d0c51977df021611926fa874000dc01f55f236b54612271f52f700f0789e099a"
ARCHIVE = Path("/tmp/ca2-kep-hosted-36d3ececb415a0f8d8a00cecb69918e097ae7e43065ffd150fa78f1ac01f1543.tar.gz")
ARCHIVE_SHA256 = "e1b7365bbca50cba0a4d651721be7cb22ec2ad83eafba4c9c8e481e40a959754"
ARCHIVE_SIZE = 37643717
COMPOSE_SHA256 = "33ab1e1c07582df9c0d7d7dbd0f14d512e60e5185ae633e91c3dc4bdd1bb2dde"
IMAGE_TAG = "ca2-kep-hosted-devnet:accepted-36d3ececb415a0f8d8a00cecb69918e097ae7e43065ffd150fa78f1ac01f1543"
IMAGE_ID = "sha256:9aa794863a8c839dd13d56fb594d997d0e5d6af4a94478fc3fb29303fe4a39e5"
EXPECTED_ROOT_SHA256 = "1dd76c1a232edc23b917308ce95d70493a52369f6e3af65a56ecf48df8583e98"
CURRENT_ROOT_SHA256 = "1565cff5f6130c990a49f68ed22b654df4965e3f5250b2310eae9f4147abe0bc"


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    candidate = json.loads(CANDIDATE.read_text())
    checks: list[dict[str, str]] = []
    errors: list[str] = []

    def check(check_id: str, condition: bool, failure: str) -> None:
        checks.append({"check_id": check_id, "status": "PASS" if condition else "BLOCK"})
        if not condition:
            errors.append(failure)

    for path, expected, check_id in (
        (CANDIDATE, CANDIDATE_SHA256, "candidate-byte-identity"),
        (ACCEPTANCE, ACCEPTANCE_SHA256, "accepted-vps-binding-current"),
        (CONFORMANCE, CONFORMANCE_SHA256, "deployment-conformance-current"),
        (OBSERVATION, OBSERVATION_SHA256, "predeployment-observation-current"),
        (ARCHIVE, ARCHIVE_SHA256, "image-archive-byte-identity"),
        (ROOT / "compose.yaml", COMPOSE_SHA256, "compose-byte-identity"),
    ):
        check(check_id, path.is_file() and sha(path) == expected, f"{check_id} missing or digest drift")
    check("image-archive-size", ARCHIVE.is_file() and ARCHIVE.stat().st_size == ARCHIVE_SIZE, "image archive size drift")

    manifest_ok = False
    if ARCHIVE.is_file():
        with tarfile.open(ARCHIVE, "r:gz") as archive:
            member = archive.extractfile("manifest.json")
            if member:
                manifest = json.load(member)
                manifest_ok = (
                    len(manifest) == 1
                    and manifest[0].get("Config") == "blobs/sha256/" + IMAGE_ID.removeprefix("sha256:")
                    and manifest[0].get("RepoTags") == [IMAGE_TAG]
                )
    check("archive-manifest-identity", manifest_ok, "archive manifest does not bind the exact image tag and config")

    exact = candidate.get("exact_material", {})
    guard = candidate.get("current_state_guard", {})
    envelope = candidate.get("execution_envelope", {})
    check("candidate-material-closure", exact.get("archive_sha256") == ARCHIVE_SHA256 and exact.get("expected_loaded_image_id") == IMAGE_ID and exact.get("compose_sha256") == COMPOSE_SHA256 and exact.get("expected_public_root_sha256") == EXPECTED_ROOT_SHA256, "candidate exact material closure mismatch")
    check("single-attempt-no-retry", envelope.get("attempts") == 1 and str(envelope.get("retry_policy", "")).startswith("none;"), "candidate does not fail closed after one attempt")
    forbidden = set(envelope.get("forbidden_effects", []))
    check("prohibitions-explicit", len(forbidden) >= 9 and any("Mainnet" in value for value in forbidden) and any("protocol transaction" in value for value in forbidden) and any("credential" in value for value in forbidden), "candidate prohibitions are incomplete")
    check("candidate-self-authority-none", candidate.get("candidate_status") == "awaiting-exact-digest-bound-owner-authorization" and candidate.get("authority_effect") == "none" and candidate.get("external_effect") == "none", "candidate improperly grants itself authority")

    remote_script = r'''set -eu
cd /srv/kep-hosted-devnet
printf 'marker_sha256=%s\n' "$(sha256sum .ca2-kep-deployment | cut -d' ' -f1)"
printf 'compose_sha256=%s\n' "$(sha256sum compose.yaml | cut -d' ' -f1)"
printf 'environment_sha256=%s\n' "$(sha256sum .env | cut -d' ' -f1)"
printf 'environment_mode=%s\n' "$(stat -c '%a' .env)"
printf 'available_bytes=%s\n' "$(df -B1 --output=avail . | tail -n1 | tr -d ' ')"
printf 'application=%s\n' "$(docker inspect --format '{{.State.Status}}|{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}|{{.Config.Image}}|{{.Image}}' kep-hosted-devnet-application-1)"
printf 'database=%s\n' "$(docker inspect --format '{{.State.Status}}|{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}|{{.Config.Image}}' kep-hosted-devnet-database-1)"
printf 'volume=%s\n' "$(docker volume inspect --format '{{.Name}}' kep-hosted-devnet_kep-postgres)"
printf 'edge_network=%s\n' "$(docker network inspect --format '{{.Name}}' troqar_edge)"
awk -F= '$1 == "PUBLIC_HOST" || $1 == "EDGE_NETWORK" || $1 == "KEP_IMAGE" || $1 == "CA2_KEP_DEVNET_RPC_URL" {print "env_" $1 "=" $2}' .env
'''
    completed = subprocess.run(
        ["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=12", "root@187.77.248.154", remote_script],
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    remote: dict[str, str] = {}
    if completed.returncode == 0:
        for line in completed.stdout.splitlines():
            key, separator, value = line.partition("=")
            if separator:
                remote[key] = value
    check("vps-read-only-observation", completed.returncode == 0, "read-only VPS observation failed")
    expected_remote = {
        "marker_sha256": guard.get("marker_sha256"),
        "compose_sha256": guard.get("compose_sha256"),
        "environment_sha256": guard.get("environment_sha256"),
        "environment_mode": "600",
        "application": "running|healthy|" + str(guard.get("active_image_tag")) + "|" + str(guard.get("active_image_id")),
        "database": "running|healthy|postgres:17-alpine",
        "volume": str(guard.get("postgres_volume")),
        "edge_network": "troqar_edge",
        "env_PUBLIC_HOST": "kep.cyberalchemylab.com",
        "env_EDGE_NETWORK": "troqar_edge",
        "env_KEP_IMAGE": str(guard.get("active_image_tag")),
        "env_CA2_KEP_DEVNET_RPC_URL": "https://api.devnet.solana.com",
    }
    check("vps-current-state-guard", completed.returncode == 0 and all(remote.get(key) == value for key, value in expected_remote.items()), "VPS state drifted from the frozen current-state guard")
    available = int(remote.get("available_bytes", "0")) if remote.get("available_bytes", "").isdigit() else 0
    check("vps-capacity", available >= int(guard.get("minimum_available_bytes", 0)), "VPS has insufficient free capacity")

    public_ok = False
    health_ok = False
    try:
        with urllib.request.urlopen("https://kep.cyberalchemylab.com/", timeout=15) as response:
            public_ok = hashlib.sha256(response.read()).hexdigest() == CURRENT_ROOT_SHA256
        with urllib.request.urlopen("https://kep.cyberalchemylab.com/health", timeout=15) as response:
            health = json.load(response)
            health_ok = health == {
                "status": "ok",
                "capability_id": "CA2-CAP-HOST-DEVNET-KNOWLEDGE-EXCHANGE",
                "network": "solana-devnet",
                "program_id": "ns5yjVYuX3bsaMWdG4pPF5hmajdD21xHDVLMbJUCeh1",
                "custody": "ciphertext-only",
            }
    except Exception:
        public_ok = False
        health_ok = False
    check("public-root-current-state-guard", public_ok, "public root drifted from the frozen current state")
    check("public-health-devnet-identity", health_ok, "public health or Solana Devnet identity drifted")

    result = "PASS" if not errors else "BLOCK"
    receipt = {
        "candidate_id": candidate.get("candidate_id"),
        "candidate_sha256": sha(CANDIDATE),
        "accepted_vps_binding_sha256": sha(ACCEPTANCE) if ACCEPTANCE.is_file() else None,
        "deployment_conformance_sha256": sha(CONFORMANCE) if CONFORMANCE.is_file() else None,
        "predeployment_observation_sha256": sha(OBSERVATION) if OBSERVATION.is_file() else None,
        "image_archive_sha256": sha(ARCHIVE) if ARCHIVE.is_file() else None,
        "checks": checks,
        "result": result,
        "deployment_authorization": "awaiting-exact-candidate-digest" if not errors else "not_evaluable",
        "authority_effect": "none",
        "external_effect": "read-only-network-observation",
        "errors": errors,
    }
    print(json.dumps(receipt, indent=2, sort_keys=True))
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
