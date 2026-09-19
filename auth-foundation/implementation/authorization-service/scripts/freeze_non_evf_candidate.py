#!/usr/bin/env python3
"""Materialize or verify the exact non-EVF Auth Service implementation candidate."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


REPOSITORY = Path(__file__).resolve().parents[5]
OUTPUT = REPOSITORY / "projects/auth-foundation/development/auth-service-d65-r2-plan/non-evf-candidate-v1/AUTH-SERVICE-NON-EVF-CANDIDATE.v1.json"

FILES = [
    "projects/auth-foundation/development/auth-service-d65-r2-plan/AUTH-SERVICE-BUSINESS-ONTOLOGY.v1-candidate.json",
    "projects/auth-foundation/development/auth-service-d65-r2-plan/AUTH-SERVICE-DEFINITION-PACK.v1-candidate.json",
    "projects/auth-foundation/development/auth-service-d65-r2-plan/AUTH-SERVICE-DOMAINSPEC-SOURCE-SET.v1-candidate.json",
    "projects/auth-foundation/development/auth-service-d65-r2-plan/AUTH-SERVICE-PRODUCT-CAPABILITY.v1-candidate.json",
    "projects/auth-foundation/development/auth-service-d65-r2-plan/AUTH-SERVICE-PRODUCT-CONTRACTS.v1-candidate.json",
    "projects/auth-foundation/implementation/authorization-service/scripts/freeze_non_evf_candidate.py",
    "projects/auth-foundation/implementation/authorization-service/scripts/validate_non_evf.py",
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
]


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def canonical(value: object) -> bytes:
    return (json.dumps(value, sort_keys=True, separators=(",", ":")) + "\n").encode()


def selected_files() -> list[Path]:
    selected = {REPOSITORY / path for path in FILES}
    for root_name in ROOTS:
        root = REPOSITORY / root_name
        selected.update(path for path in root.rglob("*") if path.is_file())
    return sorted(
        path for path in selected
        if "target" not in path.parts
        and "__pycache__" not in path.parts
        and path != OUTPUT
        and "evf" not in str(path.relative_to(REPOSITORY)).lower()
        and not path.name.endswith(".pyc")
    )


def candidate() -> dict:
    files = []
    for path in selected_files():
        data = path.read_bytes()
        files.append({
            "path": str(path.relative_to(REPOSITORY)),
            "bytes": len(data),
            "sha256": sha256(data),
        })
    payload = {
        "schema_version": "auth-service.non-evf-candidate/v1",
        "candidate_id": "AUTH-SERVICE-NON-EVF-IMPLEMENTATION-001",
        "status": "frozen-local-non-evf-implementation-candidate",
        "construction_stage": "local-w4-non-evf-freeze",
        "files": files,
        "exclusions": [
            "EVF artifacts and EVF evidence",
            "PLAN-DAG planning bytes",
            "build target directories and Python caches",
            "credentials, tokens, HTTP, administrative APIs, publication, and deployment",
        ],
        "authority_effect": "none",
        "claim_limit": "Exact local non-EVF implementation candidate only; not complete D65 F0, not a complete product-evidence join, not product approval, and not admission, activation, publication, release, deployment, or external-effect authority.",
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
            raise SystemExit("NON_EVF_CANDIDATE_DRIFT")
        print(json.dumps({"status": "pass", "candidate_digest": value["candidate_digest"], "files": len(value["files"])}, sort_keys=True))
        return 0
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(encoded, encoding="utf-8")
    print(json.dumps({"status": "materialized", "candidate_digest": value["candidate_digest"], "files": len(value["files"])}, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
