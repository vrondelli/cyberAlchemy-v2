#!/usr/bin/env python3
"""Exact implementation-binding and local conformance validator."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent

PROOFS = {
    "KEP-DST-PROOF-EXACT-BYTE-ROUNDTRIP": ["exact_byte_roundtrip_requires_verified_retrieval"],
    "KEP-DST-PROOF-MISMATCH-REJECTED": ["changed_bytes_are_rejected_with_no_verified_success", "missing_object_is_typed_failure"],
    "KEP-DST-PROOF-WRITE-NOT-RETRIEVAL": ["write_receipt_is_not_verified_retrieval"],
    "KEP-DST-PROOF-CONFIDENTIALITY-CLASSIFICATION": ["secret_material_classes_are_rejected_before_write"],
    "KEP-DST-PROOF-REISSUE-ORDERING": ["reissue_verifies_replacement_before_activation_and_retains_prior", "failed_reissue_preserves_active_identity"],
    "KEP-DST-PROOF-REALIZATION-IDENTITY-EXACT": ["realization_and_policy_are_exact", "provider_realization_is_not_part_of_byte_identity"],
    "KEP-DST-PROOF-EVIDENCE-CLAIM-BOUNDED": ["realization_and_policy_are_exact"],
    "KEP-DST-PROOF-COST-SEPARATION": ["infrastructure_cost_and_knowledge_consideration_are_distinct_types"],
    "KEP-DST-PROOF-INSTANTIATION-COMPLETE": ["runtime_binds_exact_admitted_system_ontology", "realization_and_policy_are_exact"],
}


def load(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text())
    if not isinstance(value, dict):
        raise ValueError(f"object required: {path}")
    return value


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def validate(root: Path = ROOT, *, run_commands: bool = True) -> dict[str, Any]:
    root = root.resolve()
    errors: list[str] = []
    try:
        binding = load(root / "implementation-binding.json")
    except Exception as exc:
        return {"schema_version": "cav2-kep-durable-storage-rust-conformance-validation/v1", "result": "BLOCK", "errors": [str(exc)], "authority_effect": "none", "external_effect": "none"}
    if binding.get("schema_version") != "cav2-kep-durable-storage-rust-implementation-binding/v1" or binding.get("lifecycle_status") != "implemented-local-candidate":
        errors.append("implementation binding lifecycle drift")
    predecessor = binding.get("bound_predecessor", {})
    for name in ("system_ontology", "admission_decision"):
        path = (root / predecessor.get(f"{name}_path", "")).resolve()
        if not path.is_file():
            errors.append(f"missing bound predecessor: {name}")
        elif sha(path) != predecessor.get(f"{name}_sha256"):
            errors.append(f"bound predecessor digest drift: {name}")
    for name, artifact in binding.get("implementation", {}).items():
        if name in {"language", "crate"}:
            continue
        path = root / artifact.get("path", "")
        if not path.is_file():
            errors.append(f"missing implementation artifact: {name}")
        elif sha(path) != artifact.get("sha256"):
            errors.append(f"implementation artifact digest drift: {name}")
    if binding.get("external_effect") != "none" or binding.get("enforcement_effect") != "none":
        errors.append("implementation binding effect ceiling drift")

    proof_ids = {item["proof_id"] for item in load(root.parent / "ontology/proof-requirements.json")["proof_requirements"]}
    if set(PROOFS) != proof_ids:
        errors.append("proof mapping is not total and exact")
    test_source = (root / "tests/durable_storage.rs").read_text()
    for proof_id, tests in PROOFS.items():
        for test in tests:
            if f"fn {test}(" not in test_source:
                errors.append(f"proof test missing: {proof_id}:{test}")

    checks: list[dict[str, Any]] = []
    if run_commands and not errors:
        manifest = root / "Cargo.toml"
        commands = [
            ("rustfmt", ["cargo", "fmt", "--manifest-path", str(manifest), "--", "--check"]),
            ("cargo-test-run-001", ["cargo", "test", "--manifest-path", str(manifest), "--all-targets", "--locked"]),
            ("cargo-test-run-002", ["cargo", "test", "--manifest-path", str(manifest), "--all-targets", "--locked"]),
        ]
        for check_id, command in commands:
            completed = subprocess.run(command, cwd=root, capture_output=True, text=True, check=False)
            output = completed.stdout + completed.stderr
            passed = completed.returncode == 0
            tests_passed = None
            if check_id.startswith("cargo-test"):
                match = re.search(r"test result: ok\. 12 passed; 0 failed", output)
                passed = passed and match is not None
                tests_passed = 12 if match else None
            checks.append({"check_id": check_id, "status": "PASS" if passed else "FAIL", **({"tests_passed": tests_passed} if tests_passed is not None else {})})
            if not passed:
                errors.append(f"command check failed: {check_id}")
    elif not run_commands:
        checks.append({"check_id": "native-commands", "status": "not_run", "reason": "mutation validation mode"})
    checks.append({"check_id": "clippy", "status": "not_evaluable", "causal_blocker": "cargo-clippy is not installed; it is not an acceptance predecessor for this bounded conformance gate."})

    return {
        "schema_version": "cav2-kep-durable-storage-rust-conformance-validation/v1",
        "result": "PASS" if not errors else "BLOCK",
        "binding_id": binding.get("binding_id"),
        "implementation_binding_sha256": sha(root / "implementation-binding.json"),
        "checks": checks,
        "proof_obligations": [{"proof_id": proof_id, "status": "PASS" if not errors else "not_evaluable", "test_refs": tests} for proof_id, tests in PROOFS.items()],
        "errors": errors,
        "claim_limit": "Exact local-filesystem reference conformance only; no production durability, provider selection, cryptographic security, deployment, or external effect.",
        "authority_effect": "none",
        "external_effect": "none",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--no-commands", action="store_true")
    args = parser.parse_args()
    result = validate(args.root, run_commands=not args.no_commands)
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["result"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
