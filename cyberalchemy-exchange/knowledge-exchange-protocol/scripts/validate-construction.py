#!/usr/bin/env python3
"""Validate the current Product -> DomainSpec successor -> Rust D65 chain."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import tempfile
from pathlib import Path
from typing import Any


PACKAGE_ROOT = Path(__file__).resolve().parent.parent
REPOSITORY_ROOT = Path(__file__).resolve().parents[4]
ONTOLOGY_DIGEST = "32a354721df128dd3ba8b11e8f1a435914a8718952c93b5a7e69f12edae60a60"
ADMISSION_DECISION_ID = "CA2-DECISION-KEP-SYSTEM-ONTOLOGY-ADMISSION-002"
IMPLEMENTATION_ADMISSION_DECISION_ID = "CA2-DECISION-KEP-RUST-IMPLEMENTATION-ADMISSION-001"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run_json(command: list[str], errors: list[str], label: str) -> dict[str, Any]:
    environment = dict(os.environ)
    environment["PYTHONDONTWRITEBYTECODE"] = "1"
    completed = subprocess.run(
        command,
        cwd=REPOSITORY_ROOT,
        env=environment,
        capture_output=True,
        text=True,
        check=False,
    )
    if completed.returncode != 0:
        errors.append(f"{label} failed: {completed.stderr or completed.stdout}")
        return {}
    try:
        value = json.loads(completed.stdout)
    except json.JSONDecodeError as exc:
        errors.append(f"{label} returned invalid JSON: {exc}")
        return {}
    if not isinstance(value, dict):
        errors.append(f"{label} must return one JSON object")
        return {}
    return value


def verify_generated_build(errors: list[str]) -> None:
    command = [
        str(REPOSITORY_ROOT / "toolchains/node-typescript/bin/node-env"),
        "run",
        "--project",
        "projects/domainspec-v2/impl",
        "--",
        "node",
        "--import",
        "tsx",
        "../../../cyberAlchemy-v2/product/knowledge-exchange-protocol/scripts/build-successor-002.ts",
        "--emit-json",
    ]
    completed = subprocess.run(
        command,
        cwd=REPOSITORY_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if completed.returncode != 0:
        errors.append(f"successor DomainSpec rebuild failed: {completed.stderr or completed.stdout}")
        return
    try:
        artifacts = json.loads(completed.stdout)
    except json.JSONDecodeError as exc:
        errors.append(f"successor DomainSpec rebuild returned invalid JSON: {exc}")
        return
    generated = PACKAGE_ROOT / "domainspec/successors/002/generated"
    for name, expected_bytes in artifacts.items():
        path = generated / name
        if not path.is_file():
            errors.append(f"successor generated artifact missing: {name}")
        elif path.read_text(encoding="utf-8") != expected_bytes:
            errors.append(f"successor generated artifact drift: {name}")


def verify_runtime(errors: list[str]) -> None:
    manifest = PACKAGE_ROOT / "runtime/Cargo.toml"
    formatting = subprocess.run(
        ["cargo", "fmt", "--manifest-path", str(manifest), "--", "--check"],
        cwd=REPOSITORY_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if formatting.returncode != 0:
        errors.append(f"Rust formatting failed: {formatting.stderr or formatting.stdout}")
    with tempfile.TemporaryDirectory(prefix="cav2-kep-successor-cargo-") as target:
        environment = dict(os.environ)
        environment["CARGO_TARGET_DIR"] = target
        tests = subprocess.run(
            ["cargo", "test", "--locked", "--all-targets", "--manifest-path", str(manifest)],
            cwd=REPOSITORY_ROOT,
            env=environment,
            capture_output=True,
            text=True,
            check=False,
        )
    if tests.returncode != 0:
        errors.append(f"Rust tests failed: {tests.stderr or tests.stdout}")


def validate(verify_build: bool = False, verify_rust: bool = False) -> dict[str, Any]:
    errors: list[str] = []
    product = run_json(
        ["python3", str(PACKAGE_ROOT / "validate.py")],
        errors,
        "product model validator",
    )
    successor = run_json(
        [
            "python3",
            str(PACKAGE_ROOT / "scripts/validate-successor-002.py"),
            "--admitted",
        ],
        errors,
        "successor admission validator",
    )
    runtime = run_json(
        [
            "python3",
            str(PACKAGE_ROOT / "scripts/validate-runtime-binding.py"),
            "--admitted",
        ],
        errors,
        "Rust binding validator",
    )

    if product.get("status") != "PASS":
        errors.append("product model status is not PASS")
    if successor.get("status") != "PASS":
        errors.append("successor admission status is not PASS")
    if successor.get("system_ontology_digest") != ONTOLOGY_DIGEST:
        errors.append("successor admission does not bind the selected ontology digest")
    if runtime.get("status") != "PASS":
        errors.append("Rust implementation binding status is not PASS")
    if runtime.get("system_ontology_digest") != ONTOLOGY_DIGEST:
        errors.append("Rust implementation does not bind the selected ontology digest")
    if runtime.get("mode") != "admitted" or runtime.get("owner_acceptance") != "accepted":
        errors.append("Rust implementation binding lacks exact owner acceptance")
    if runtime.get("implementation_admission_decision_id") != IMPLEMENTATION_ADMISSION_DECISION_ID:
        errors.append("Rust implementation admission decision identity drift")

    decision_path = PACKAGE_ROOT / "decisions/system-ontology-admission-002.json"
    try:
        decision = json.loads(decision_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"cannot load current admission decision: {exc}")
        decision = {}
    if decision.get("decision_id") != ADMISSION_DECISION_ID:
        errors.append("current admission decision identity drift")

    if verify_build:
        verify_generated_build(errors)
    if verify_rust:
        verify_runtime(errors)

    binding_path = PACKAGE_ROOT / "runtime/implementation-binding.json"
    receipt_path = PACKAGE_ROOT / "runtime/conformance-receipt.json"
    return {
        "schema_version": "cav2-knowledge-exchange-construction-validation/v3",
        "status": "PASS" if not errors else "BLOCK",
        "product_material_digest": product.get("material_digest"),
        "system_ontology_digest": successor.get("system_ontology_digest"),
        "system_ontology_admission_decision_id": ADMISSION_DECISION_ID,
        "successor_material_digest": successor.get("material_digest"),
        "rust_binding_digest": sha256(binding_path) if binding_path.is_file() else None,
        "rust_conformance_receipt_digest": sha256(receipt_path) if receipt_path.is_file() else None,
        "runtime_material_digest": runtime.get("material_digest"),
        "local_behavioral_evidence": "PASS" if runtime.get("status") == "PASS" else "BLOCK",
        "owner_acceptance": "ACCEPTED" if runtime.get("owner_acceptance") == "accepted" else "BLOCK",
        "owner_acceptance_decision_id": runtime.get("implementation_admission_decision_id"),
        "static_conformance": "OWNER_ACCEPTED" if runtime.get("status") == "PASS" else "BLOCK",
        "independent_review": "OPTIONAL_NOT_PERFORMED",
        "clippy": "OPTIONAL_NOT_EVALUABLE",
        "causal_blockers": [],
        "residue": [
            "Runtime behavior in a deployed environment is not claimed.",
            "Cryptographic security and Solana realization remain outside this binding.",
        ],
        "effect_authorized": False,
        "authority_effect": "none",
        "claim_ceiling": "Owner-accepted local Rust D65 implementation binding and static conformance only; no runtime-in-environment, cryptographic security, Solana compatibility, publication, release, deployment, or external-effect authority.",
        "errors": errors,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--verify-build", action="store_true")
    parser.add_argument("--verify-rust", action="store_true")
    args = parser.parse_args()
    result = validate(verify_build=args.verify_build, verify_rust=args.verify_rust)
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
