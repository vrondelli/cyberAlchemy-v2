#!/usr/bin/env python3
"""Materialize or verify the exact Authorization API node-13 candidate."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


REPOSITORY = Path(__file__).resolve().parents[5]
OUTPUT = REPOSITORY / "projects/auth-foundation/development/auth-service-d65-r2-plan/authorization-api-v1/AUTHORIZATION-API-CANDIDATE.v1.json"
PREDECESSOR = "916e5c949a0bfc00e97516b30c3d90cf710ab5f7cd39d7a95b37ba0a68343f26"
FILES = [
    "projects/auth-foundation/development/auth-service-d65-r2-plan/AUTH-SERVICE-BUSINESS-ONTOLOGY.v1-candidate.json",
    "projects/auth-foundation/development/auth-service-d65-r2-plan/AUTH-SERVICE-DEFINITION-PACK.v1-candidate.json",
    "projects/auth-foundation/development/auth-service-d65-r2-plan/AUTH-SERVICE-DOMAINSPEC-SOURCE-SET.v1-candidate.json",
    "projects/auth-foundation/development/auth-service-d65-r2-plan/AUTH-SERVICE-PRODUCT-CAPABILITY.v1-candidate.json",
    "projects/auth-foundation/development/auth-service-d65-r2-plan/AUTH-SERVICE-PRODUCT-CONTRACTS.v1-candidate.json",
    "projects/auth-foundation/development/auth-service-d65-r2-plan/authorization-api-v1/AUTHORIZATION-API-DEFINITIONS.v1-candidate.json",
    "projects/auth-foundation/development/auth-service-d65-r2-plan/authorization-api-v1/AUTHORIZATION-API-ONTOLOGY.v1-candidate.json",
    "projects/auth-foundation/development/auth-service-d65-r2-plan/authorization-api-v1/AUTHORIZATION-API-PRODUCT-CONTRACT.v1-candidate.json",
    "projects/auth-foundation/development/auth-service-d65-r2-plan/authorization-api-v1/PLAN-DAG.md",
]
ROOTS = [
    "projects/auth-foundation/implementation/operation-source",
    "projects/auth-foundation/implementation/command-boundary-source",
    "projects/auth-foundation/implementation/trusted-input-source",
    "projects/auth-foundation/implementation/standard-runtime",
    "projects/auth-foundation/implementation/command-boundary-runtime",
    "projects/auth-foundation/implementation/trusted-input-runtime",
    "projects/auth-foundation/implementation/runtime-adapter",
    "projects/auth-foundation/implementation/sqlite-provider",
    "projects/auth-foundation/implementation/trusted-boundary",
    "projects/auth-foundation/implementation/trusted-input-provider",
    "projects/auth-foundation/implementation/authorization-service",
    "projects/auth-foundation/implementation/authorization-api",
]


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def canonical(value: object) -> bytes:
    return (json.dumps(value, sort_keys=True, separators=(",", ":")) + "\n").encode()


def selected_files() -> list[Path]:
    selected = {REPOSITORY / name for name in FILES}
    for name in ROOTS:
        selected.update(path for path in (REPOSITORY / name).rglob("*") if path.is_file())
    return sorted(
        path
        for path in selected
        if "target" not in path.parts
        and "__pycache__" not in path.parts
        and path != OUTPUT
        and path.name != "VALIDATION-RECEIPT.json"
        and not path.name.endswith(".pyc")
        and "evf" not in str(path.relative_to(REPOSITORY)).lower()
    )


def candidate() -> dict:
    files = []
    for path in selected_files():
        data = path.read_bytes()
        files.append({"path": str(path.relative_to(REPOSITORY)), "bytes": len(data), "sha256": sha256(data)})
    payload = {
        "schema_version": "auth-service.authorization-api-candidate/v1",
        "candidate_id": "AUTHORIZATION-API-V1-NODE-13-001",
        "status": "frozen-local-authorization-api-product-candidate",
        "construction_stage": "node-13-exact-local-candidate-freeze",
        "historical_predecessor_candidate_digest": PREDECESSOR,
        "files": files,
        "exclusions": [
            "EVF artifacts and evidence",
            "validation receipts to avoid self-reference",
            "build targets and Python caches",
            "listener, TLS, credentials, publication, release, deployment, and operations configuration",
        ],
        "authority_effect": "none",
        "claim_limit": "Exact local node-13 product candidate only; no EVF evidence join, product approval, admission, activation, publication, release, deployment, production readiness, or external-effect authority.",
    }
    return {**payload, "candidate_digest": sha256(canonical(payload))}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()
    value = candidate()
    encoded = json.dumps(value, indent=2, sort_keys=True) + "\n"
    if args.verify:
        if not OUTPUT.exists() or OUTPUT.read_text(encoding="utf-8") != encoded:
            raise SystemExit("AUTHORIZATION_API_CANDIDATE_DRIFT")
        print(json.dumps({"status": "pass", "candidate_digest": value["candidate_digest"], "files": len(value["files"])}, sort_keys=True))
        return 0
    OUTPUT.write_text(encoded, encoding="utf-8")
    print(json.dumps({"status": "materialized", "candidate_digest": value["candidate_digest"], "files": len(value["files"])}, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
