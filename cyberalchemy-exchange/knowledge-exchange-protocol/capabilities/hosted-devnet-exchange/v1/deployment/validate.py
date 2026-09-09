#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile


HERE = Path(__file__).resolve().parent
CAPABILITY = HERE.parent
IMPLEMENTATION = CAPABILITY / "implementation"
REPO = HERE.parents[6]
EVIDENCE = HERE / "evidence" / "preflight.json"
APPLICATION_ACCEPTANCE = CAPABILITY / "decisions" / "implementation-binding-acceptance-002.json"
APPLICATION_ACCEPTANCE_SHA256 = "15b7856fce63707c3579cf66b9ad053e269f1cec897f0bb4315971dda6f0c873"
APPLICATION_CONFORMANCE = CAPABILITY / "evidence" / "conformance-assessment-003.json"
APPLICATION_CONFORMANCE_SHA256 = "619a1c3a17a12dd92f5ad3aa3c86e189bacdddbfec266ba519e3b08fb488f67c"
DEPLOYMENT_ONTOLOGY_ADMISSION = CAPABILITY / "decisions" / "deployment-system-ontology-admission-002.json"
DEPLOYMENT_ONTOLOGY_ADMISSION_SHA256 = "ba4a83700868f9798eb58dc3dd09a2e2079fb1811c24cf90a762eb20a1408dd3"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(check_id: str, argv: list[str], env: dict[str, str] | None = None) -> dict[str, object]:
    completed = subprocess.run(
        argv,
        cwd=REPO,
        env=env,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
    )
    return {
        "check_id": check_id,
        "status": "pass" if completed.returncode == 0 else "fail",
        "returncode": completed.returncode,
        "output": completed.stdout[-4000:],
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--no-write", action="store_true")
    args = parser.parse_args()

    checks: list[dict[str, object]] = []
    checks.append(run(
        "accepted-application-material-byte-identity",
        ["python3", str(IMPLEMENTATION / "validate-binding-acceptance-002.py")],
    ))
    selected_predecessors = [
        (APPLICATION_ACCEPTANCE, APPLICATION_ACCEPTANCE_SHA256, "application-acceptance"),
        (APPLICATION_CONFORMANCE, APPLICATION_CONFORMANCE_SHA256, "application-conformance"),
        (DEPLOYMENT_ONTOLOGY_ADMISSION, DEPLOYMENT_ONTOLOGY_ADMISSION_SHA256, "deployment-system-ontology-admission"),
    ]
    predecessor_drift = [
        {"record": label, "expected": expected, "actual": sha256(path) if path.is_file() else None}
        for path, expected, label in selected_predecessors
        if not path.is_file() or sha256(path) != expected
    ]
    checks.append({
        "check_id": "selected-predecessor-currentness",
        "status": "pass" if not predecessor_drift else "fail",
        "drift": predecessor_drift,
    })

    required = [
        IMPLEMENTATION / "src/bin/hosted.rs",
        IMPLEMENTATION / "Dockerfile.hosted",
        HERE / "compose.yaml",
        HERE / ".env.example",
        HERE / ".gitignore",
        HERE / "deploy-vps.sh",
        HERE / "backup-postgres.sh",
        HERE / "restore-postgres.sh",
        HERE / "IMPLEMENTATION-LAYERING.md",
    ]
    missing = [str(path.relative_to(CAPABILITY)) for path in required if not path.is_file()]
    checks.append({"check_id": "required-files", "status": "pass" if not missing else "fail", "missing": missing})

    for script in [HERE / "deploy-vps.sh", HERE / "backup-postgres.sh", HERE / "restore-postgres.sh"]:
        checks.append(run(f"shell-syntax:{script.name}", ["sh", "-n", str(script)]))

    env = os.environ.copy()
    env.update({
        "PUBLIC_HOST": "kep.example.invalid",
        "EDGE_NETWORK": "troqar_edge",
        "TRAEFIK_ENTRYPOINT": "websecure",
        "TRAEFIK_CERT_RESOLVER": "letsencrypt",
        "KEP_IMAGE": "ca2-kep-hosted-devnet:preflight",
        "KEP_DB_PASSWORD": "preflight-not-a-live-secret",
        "CA2_KEP_DEVNET_RPC_URL": "https://api.devnet.solana.com",
    })
    checks.append(run("compose-config", ["docker", "compose", "--file", str(HERE / "compose.yaml"), "config", "--quiet"], env))
    checks.append(run("hosted-rust-check", ["cargo", "check", "--locked", "--manifest-path", str(IMPLEMENTATION / "Cargo.toml"), "--features", "ui", "--bin", "hosted"]))
    node = os.environ.get("CA2_NODE") or shutil.which("node")
    known_linux_node = Path("/home/vrondelli/.nvm/versions/node/v22.13.0/bin/node")
    if not node and known_linux_node.is_file():
        node = str(known_linux_node)
    if node:
        checks.append(run("browser-source-tests", [node, "--test", str(IMPLEMENTATION / "ui-src/app.test.js")]))
        checks.append(run("browser-bundle-identity", [node, str(IMPLEMENTATION / "ui-src/check-bundle.js")]))
    else:
        checks.append({"check_id": "browser-source-tests", "status": "fail", "output": "Linux Node.js runtime not found"})
        checks.append({"check_id": "browser-bundle-identity", "status": "fail", "output": "Linux Node.js runtime not found"})

    forbidden = []
    for path in required + [HERE / "README.md"]:
        if not path.is_file() or path.name == ".env.example":
            continue
        text = path.read_text(errors="ignore")
        for marker in ["BEGIN OPENSSH PRIVATE KEY", "BEGIN PRIVATE KEY", "solana-keygen", "mainnet-beta"]:
            if marker in text:
                forbidden.append({"path": str(path.relative_to(CAPABILITY)), "marker": marker})
    checks.append({"check_id": "credential-and-mainnet-markers", "status": "pass" if not forbidden else "fail", "findings": forbidden})

    results = {item["check_id"]: item["status"] for item in checks}
    overall = "pass" if all(value == "pass" for value in results.values()) else "fail"
    receipt = {
        "schema_version": "ca2-kep-vps-deployment-preflight/v1",
        "route_id": "CA2-ROUTE-IMPLEMENT",
        "capability_id": "CA2-CAP-HOST-DEVNET-KNOWLEDGE-EXCHANGE",
        "selected_ontology_dependencies": {
            "hosted_system_ontology": "CA2-SYSTEM-ONTOLOGY-KEP-HOSTED-DEVNET-EXCHANGE",
            "orodi_model": "domainspec.orodi.ontology@1",
            "selectors": [
                "participant-workbench",
                "hosted-exchange-api",
                "ciphertext-repository",
                "devnet-finality-observer",
                "kep-hosted-vps-deployment-transition",
                "kep-hosted-vps-deployment-observation",
                "kep-hosted-offhost-backup",
                "kep-hosted-disposable-restore-verification",
            ],
        },
        "result": overall,
        "checks": checks,
        "remote_effects": "none",
        "deployment_conformance": "not_evaluable",
        "causal_blockers": [
            "The exact successor VPS implementation binding is not yet accepted.",
            "No exact VPS image, DNS, credential, and backup envelope is authorized.",
        ],
        "authority_effect": "none",
        "claim_limit": "Local implementation preflight only; not ontology admission, binding acceptance, deployment conformance, credential use, publication, release, deployment, backup execution, restore execution, or external effect.",
    }
    if not args.no_write:
        EVIDENCE.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile("w", dir=EVIDENCE.parent, delete=False) as handle:
            json.dump(receipt, handle, indent=2)
            handle.write("\n")
            temporary = Path(handle.name)
        temporary.replace(EVIDENCE)
    print(json.dumps(receipt, indent=2))
    return 0 if overall == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main())
