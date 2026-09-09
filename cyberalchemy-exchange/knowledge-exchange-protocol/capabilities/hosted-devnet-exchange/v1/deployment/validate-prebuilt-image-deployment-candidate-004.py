#!/usr/bin/env python3
"""Validate corrected staged continuation candidate 004 without remote writes."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import subprocess
import urllib.request


ROOT = Path(__file__).resolve().parent
VERTICAL = ROOT.parent
CANDIDATE = ROOT / "prebuilt-image-deployment-candidate-004.json"
CANDIDATE_SHA256 = "1d00e94ae3fdee86831b9e37c90e98550d7487b9e317ed5c4a19bb3d66330fec"
EXECUTION_003 = ROOT / "evidence/prebuilt-image-deployment-execution-003.json"
EXECUTION_003_SHA256 = "1432d4f16c72c7316ab6b3fc1e4051efdda2d81b0f36b5be805f89e5b9e98181"
ACCEPTANCE_003 = VERTICAL / "decisions/prebuilt-image-deployment-acceptance-003.json"
ACCEPTANCE_003_SHA256 = "187dee4df80b9962a94f536722c9062c77eb2d9b2d236ddeb87a343ea20ebb16"
BINDING_ACCEPTANCE = VERTICAL / "decisions/deployment-implementation-binding-acceptance-003.json"
BINDING_ACCEPTANCE_SHA256 = "87146a8a7b26e9912ff9ff6776a883c749296f1fed678d3dd53a4f1b4f924f42"
CONFORMANCE = ROOT / "evidence/deployment-conformance-assessment-003.json"
CONFORMANCE_SHA256 = "6dfaf84afc90efe912cbb372c82f8fc5a2827b41bc4071d2d3bd329eefd5aac9"
OBSERVATION = ROOT / "evidence/vps-staged-continuation-observation-004.json"
OBSERVATION_SHA256 = "d50151c7f5bddeb7ade6ae2ddada9c233e40bbb97074c86fbe125f61477336d8"
IMAGE_TAG = "ca2-kep-hosted-devnet:accepted-36d3ececb415a0f8d8a00cecb69918e097ae7e43065ffd150fa78f1ac01f1543"
REMOTE_IMAGE_ID = "sha256:889fb231f7ec30c9d770f8d6aa5b7ebb74fc21e9a405b50af43c1721333fab04"
PROJECTION_SHA256 = "f08f968b0f845c6021defc5413d28bf6bb70baf471a33e5f7997db708e7c55d8"
OLD_ROOT_SHA256 = "1565cff5f6130c990a49f68ed22b654df4965e3f5250b2310eae9f4147abe0bc"


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def projection_sha(image: dict[str, object]) -> str:
    config = image.get("Config") or {}
    projection = {
        "Architecture": image.get("Architecture"),
        "Os": image.get("Os"),
        "Created": image.get("Created"),
        "Entrypoint": config.get("Entrypoint"),
        "Env": config.get("Env"),
        "ExposedPorts": config.get("ExposedPorts"),
        "User": config.get("User"),
        "RootFS": image.get("RootFS"),
    }
    material = (json.dumps(projection, sort_keys=True, separators=(",", ":")) + "\n").encode()
    return hashlib.sha256(material).hexdigest()


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
        (EXECUTION_003, EXECUTION_003_SHA256, "stopped-execution-current"),
        (ACCEPTANCE_003, ACCEPTANCE_003_SHA256, "consumed-acceptance-current"),
        (BINDING_ACCEPTANCE, BINDING_ACCEPTANCE_SHA256, "accepted-vps-binding-current"),
        (CONFORMANCE, CONFORMANCE_SHA256, "deployment-conformance-current"),
        (OBSERVATION, OBSERVATION_SHA256, "staged-observation-current"),
    ):
        check(check_id, path.is_file() and sha(path) == expected, f"{check_id} missing or digest drift")

    execution = json.loads(EXECUTION_003.read_text())
    identity = candidate.get("corrected_identity_rule", {})
    envelope = candidate.get("execution_envelope", {})
    check("predecessor-attempt-consumed", execution.get("result") == "STOPPED_AFTER_EFFECTFUL_FAILURE" and execution.get("attempt", {}).get("consumed_attempts") == 1 and execution.get("attempt", {}).get("retry_authority") == "none", "predecessor attempt status mismatch")
    check("corrected-semantic-rule", identity.get("semantic_projection_sha256") == PROJECTION_SHA256 and identity.get("remote_engine_image_id") == REMOTE_IMAGE_ID and identity.get("rejected_rule") == "local engine image ID must equal remote engine image ID", "corrected identity rule mismatch")
    check("one-corrected-continuation", envelope.get("corrected_continuations") == 1 and str(envelope.get("retry_policy", "")).startswith("none;"), "continuation count or retry posture mismatch")
    forbidden = set(envelope.get("forbidden_effects", []))
    check("no-repeated-effects", any("upload, rebuild, image load" in value for value in forbidden) and any("automatic rollback or retry" in value for value in forbidden), "repeated-effect prohibitions are incomplete")
    check("candidate-self-authority-none", candidate.get("candidate_status") == "awaiting-exact-digest-bound-owner-authorization" and candidate.get("authority_effect") == "none" and candidate.get("external_effect") == "none", "candidate improperly grants authority")

    remote_script = r'''set -eu
cd /srv/kep-hosted-devnet
printf 'marker_sha256=%s\n' "$(sha256sum .ca2-kep-deployment | cut -d' ' -f1)"
printf 'active_compose_sha256=%s\n' "$(sha256sum compose.yaml | cut -d' ' -f1)"
printf 'active_environment_sha256=%s\n' "$(sha256sum .env | cut -d' ' -f1)"
printf 'active_environment_mode=%s\n' "$(stat -c '%a' .env)"
printf 'staged_archive_sha256=%s\n' "$(sha256sum artifacts/image-36d3ececb415a0f8d8a00cecb69918e097ae7e43065ffd150fa78f1ac01f1543.tar.gz.next | cut -d' ' -f1)"
printf 'staged_archive_size=%s\n' "$(stat -c '%s' artifacts/image-36d3ececb415a0f8d8a00cecb69918e097ae7e43065ffd150fa78f1ac01f1543.tar.gz.next)"
printf 'staged_compose_sha256=%s\n' "$(sha256sum compose.yaml.next | cut -d' ' -f1)"
printf 'staged_environment_sha256=%s\n' "$(sha256sum .env.next | cut -d' ' -f1)"
printf 'staged_environment_mode=%s\n' "$(stat -c '%a' .env.next)"
active_rest="$(grep -v '^KEP_IMAGE=' .env | sha256sum | cut -d' ' -f1)"
staged_rest="$(grep -v '^KEP_IMAGE=' .env.next | sha256sum | cut -d' ' -f1)"
test "$active_rest" = "$staged_rest"
test "$(grep -c '^KEP_IMAGE=ca2-kep-hosted-devnet:accepted-36d3ececb415a0f8d8a00cecb69918e097ae7e43065ffd150fa78f1ac01f1543$' .env.next)" = 1
printf 'staged_environment_delta=KEP_IMAGE-only\n'
printf 'dump_sha256=%s\n' "$(sha256sum artifacts/predeploy-003.dump | cut -d' ' -f1)"
printf 'dump_size=%s\n' "$(stat -c '%s' artifacts/predeploy-003.dump)"
printf 'dump_mode=%s\n' "$(stat -c '%a' artifacts/predeploy-003.dump)"
printf 'loaded_image_id=%s\n' "$(docker image inspect --format '{{.Id}}' ca2-kep-hosted-devnet:accepted-36d3ececb415a0f8d8a00cecb69918e097ae7e43065ffd150fa78f1ac01f1543)"
printf 'loaded_image_size=%s\n' "$(docker image inspect --format '{{.Size}}' ca2-kep-hosted-devnet:accepted-36d3ececb415a0f8d8a00cecb69918e097ae7e43065ffd150fa78f1ac01f1543)"
printf 'application=%s\n' "$(docker inspect --format '{{.State.Status}}|{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}|{{.Config.Image}}|{{.Image}}' kep-hosted-devnet-application-1)"
printf 'database=%s\n' "$(docker inspect --format '{{.State.Status}}|{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}|{{.Config.Image}}' kep-hosted-devnet-database-1)"
printf 'volume=%s\n' "$(docker volume inspect --format '{{.Name}}' kep-hosted-devnet_kep-postgres)"
printf 'edge_network=%s\n' "$(docker network inspect --format '{{.Name}}' troqar_edge)"
printf 'rollback_compose_004=%s\n' "$(test -e compose.yaml.rollback-004 && printf present || printf absent)"
printf 'rollback_environment_004=%s\n' "$(test -e .env.rollback-004 && printf present || printf absent)"
printf 'available_bytes=%s\n' "$(df -B1 --output=avail . | tail -n1 | tr -d ' ')"
docker compose --env-file .env.next --file compose.yaml.next config --quiet
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
    check("vps-read-only-observation", completed.returncode == 0, "read-only VPS staged observation failed")
    expected_remote = {
        "marker_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "active_compose_sha256": "33ab1e1c07582df9c0d7d7dbd0f14d512e60e5185ae633e91c3dc4bdd1bb2dde",
        "active_environment_sha256": "0e378cb55319708e25be629565c44e025b169e037380024d0a26b54d8bb8bfee",
        "active_environment_mode": "600",
        "staged_archive_sha256": "e1b7365bbca50cba0a4d651721be7cb22ec2ad83eafba4c9c8e481e40a959754",
        "staged_archive_size": "37643717",
        "staged_compose_sha256": "33ab1e1c07582df9c0d7d7dbd0f14d512e60e5185ae633e91c3dc4bdd1bb2dde",
        "staged_environment_sha256": "758b1b96fcf4ca0ddf864bfd5ccdd0debe5868cf0c25bf138394fdb4512c8778",
        "staged_environment_mode": "600",
        "staged_environment_delta": "KEP_IMAGE-only",
        "dump_sha256": "18a60e72c8098d0d91be2849a09b8c27391fa8f1c29d7799f6f824fdfc0948cd",
        "dump_size": "7596",
        "dump_mode": "600",
        "loaded_image_id": REMOTE_IMAGE_ID,
        "loaded_image_size": "102676830",
        "application": "running|healthy|ca2-kep-hosted-devnet:prebuilt-060f9d54b348|sha256:6c77327caa228e8bf5d4f344df7b402b861fb9dc3a9c07a501ba1b8952bda3f4",
        "database": "running|healthy|postgres:17-alpine",
        "volume": "kep-hosted-devnet_kep-postgres",
        "edge_network": "troqar_edge",
        "rollback_compose_004": "absent",
        "rollback_environment_004": "absent",
    }
    check("exact-staged-and-active-guard", completed.returncode == 0 and all(remote.get(key) == value for key, value in expected_remote.items()), "staged or active VPS state drifted")
    available = int(remote.get("available_bytes", "0")) if remote.get("available_bytes", "").isdigit() else 0
    check("vps-capacity", available >= 1_000_000_000, "VPS has insufficient free capacity")

    local_image = json.loads(subprocess.check_output(["docker", "image", "inspect", IMAGE_TAG], text=True))[0]
    remote_image_result = subprocess.run(
        ["ssh", "-o", "BatchMode=yes", "root@187.77.248.154", "docker", "image", "inspect", IMAGE_TAG],
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    remote_projection = None
    if remote_image_result.returncode == 0:
        remote_projection = projection_sha(json.loads(remote_image_result.stdout)[0])
    local_projection = projection_sha(local_image)
    check("local-semantic-image-projection", local_projection == PROJECTION_SHA256, "local semantic image projection drift")
    check("remote-semantic-image-projection", remote_projection == PROJECTION_SHA256, "remote semantic image projection drift")

    root_ok = False
    health_ok = False
    try:
        with urllib.request.urlopen("https://kep.cyberalchemylab.com/", timeout=15) as response:
            root_ok = hashlib.sha256(response.read()).hexdigest() == OLD_ROOT_SHA256
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
        root_ok = False
        health_ok = False
    check("public-old-root-current", root_ok, "public old root drifted")
    check("public-health-devnet-current", health_ok, "public health or Devnet identity drifted")

    result = "PASS" if not errors else "BLOCK"
    output = {
        "candidate_id": candidate.get("candidate_id"),
        "candidate_sha256": sha(CANDIDATE),
        "predecessor_execution_sha256": sha(EXECUTION_003),
        "staged_observation_sha256": sha(OBSERVATION),
        "semantic_projection_sha256": PROJECTION_SHA256,
        "checks": checks,
        "result": result,
        "deployment_authorization": "awaiting-exact-candidate-digest" if not errors else "not_evaluable",
        "authority_effect": "none",
        "external_effect": "read-only-network-observation",
        "errors": errors,
    }
    print(json.dumps(output, indent=2, sort_keys=True))
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
