#!/usr/bin/env python3
"""Validate the exact KEP Rust implementation binding and local evidence."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any


PACKAGE_ROOT = Path(__file__).resolve().parent.parent
FILES = {
    "system_ontology": "domainspec/successors/002/generated/system-ontology.json",
    "admission_decision": "decisions/system-ontology-admission-002.json",
    "manifest": "runtime/Cargo.toml",
    "lockfile": "runtime/Cargo.lock",
    "source": "runtime/src/lib.rs",
    "tests": "runtime/tests/protocol.rs",
    "implementation_binding": "runtime/implementation-binding.json",
    "conformance_receipt": "runtime/conformance-receipt.json",
}
EXPECTED_ONTOLOGY_DIGEST = "32a354721df128dd3ba8b11e8f1a435914a8718952c93b5a7e69f12edae60a60"
EXPECTED_DECISION_ID = "CA2-DECISION-KEP-SYSTEM-ONTOLOGY-ADMISSION-002"
IMPLEMENTATION_ADMISSION_PATH = PACKAGE_ROOT / "decisions/rust-implementation-admission-001.json"
EXPECTED_IMPLEMENTATION_ADMISSION_ID = "CA2-DECISION-KEP-RUST-IMPLEMENTATION-ADMISSION-001"
EXPECTED_BINDING_DIGEST = "86bb4c3c60e158a3f8b9ab6056992212320abbd63957c0640db61022f4ef1c6d"
EXPECTED_RECEIPT_DIGEST = "e6e46a4a62eb7bbd3096ff9f8c028ad071bd5a6d2b5661b85c5f9d20f014d4db"
EXPECTED_USER_DECISION = "We can admit it I’m authorizing if not we must remove this rule"
EXPECTED_OPERATIONS = {
    "grant_coownership",
    "acknowledge_decryption",
    "reissue_lost_key",
    "rotate_compromised_epoch",
}
EXPECTED_MECHANISMS = {
    "binding-validity-window-evaluation",
    "binding-challenge-commitment",
    "exact-state-revision-binding",
    "consumed-command-replay-protection",
    "consumed-challenge-replay-protection",
    "ciphertext-bound-acknowledgement",
    "same-epoch-single-envelope-reissue",
    "complete-owner-envelope-epoch-rotation",
}
EXPECTED_PROOFS = {
    "KEP-PROOF-OWNER-SET-EXPANSION",
    "KEP-PROOF-ENVELOPE-BINDING",
    "KEP-PROOF-RECIPIENT-ACKNOWLEDGEMENT",
    "KEP-PROOF-REISSUE-NON-MUTATION",
    "KEP-PROOF-COMPROMISE-EPOCH-ROTATION",
    "KEP-PROOF-NEGATIVE-AUTHORIZATION",
}


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def stable_digest(value: Any) -> str:
    data = json.dumps(value, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(data).hexdigest()


def load(path: Path, errors: list[str]) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"load:{path.relative_to(PACKAGE_ROOT)}:{exc}")
        return {}
    if not isinstance(value, dict):
        errors.append(f"object-required:{path.relative_to(PACKAGE_ROOT)}")
        return {}
    return value


def validate(require_admission: bool = False) -> dict[str, Any]:
    errors: list[str] = []
    checks: list[dict[str, str]] = []

    def check(check_id: str, condition: bool, detail: str) -> None:
        checks.append({"check_id": check_id, "status": "PASS" if condition else "FAIL"})
        if not condition:
            errors.append(f"{check_id}:{detail}")

    paths = {name: PACKAGE_ROOT / relative for name, relative in FILES.items()}
    actual = {name: digest(path) if path.is_file() else "missing" for name, path in paths.items()}
    ontology = load(paths["system_ontology"], errors)
    decision = load(paths["admission_decision"], errors)
    binding = load(paths["implementation_binding"], errors)
    receipt = load(paths["conformance_receipt"], errors)
    source = paths["source"].read_text(encoding="utf-8") if paths["source"].is_file() else ""
    tests = paths["tests"].read_text(encoding="utf-8") if paths["tests"].is_file() else ""

    check("ontology-exact", actual["system_ontology"] == EXPECTED_ONTOLOGY_DIGEST, "admitted ontology bytes drift")
    check(
        "decision-exact",
        decision.get("decision_id") == EXPECTED_DECISION_ID
        and decision.get("admission", {}).get("system_ontology_digest") == actual["system_ontology"],
        "admission decision does not bind ontology",
    )
    predecessor = binding.get("bound_predecessor", {})
    check(
        "binding-predecessor",
        predecessor.get("ontology_id") == ontology.get("ontology_id")
        and predecessor.get("system_ontology_sha256") == actual["system_ontology"]
        and predecessor.get("admission_decision_id") == EXPECTED_DECISION_ID
        and predecessor.get("admission_decision_sha256") == actual["admission_decision"],
        "implementation predecessor drift",
    )
    implementation = binding.get("implementation", {})
    for name, key in (
        ("manifest", "manifest"),
        ("lockfile", "lockfile"),
        ("source", "source"),
        ("tests", "tests"),
    ):
        check(
            f"binding-{name}",
            implementation.get(key, {}).get("sha256") == actual[name],
            f"{name} digest drift",
        )

    ontology_contract = ontology.get("implementation_contract", {})
    ontology_operations = set(ontology_contract.get("permitted_operations", []))
    bound_operations = set(binding.get("permitted_operations", {}))
    check(
        "operation-set",
        ontology_operations == bound_operations == EXPECTED_OPERATIONS,
        "permitted operation set drift",
    )
    for operation in sorted(EXPECTED_OPERATIONS):
        check(
            f"operation-source-{operation}",
            f"fn {operation}(" in source,
            f"missing Rust operation {operation}",
        )

    ontology_mechanisms = set(ontology_contract.get("required_runtime_mechanisms", []))
    bound_mechanisms = {
        item.get("mechanism_id")
        for item in binding.get("required_runtime_mechanisms", [])
        if isinstance(item, dict)
    }
    check(
        "mechanism-set",
        ontology_mechanisms == bound_mechanisms == EXPECTED_MECHANISMS,
        "runtime mechanism set drift",
    )
    mechanism_tokens = {
        "binding-validity-window-evaluation": "validate_current_at",
        "binding-challenge-commitment": "challenge_digest",
        "exact-state-revision-binding": "require_revision",
        "consumed-command-replay-protection": "consumed_command_digests",
        "consumed-challenge-replay-protection": "consumed_challenge_digests",
        "ciphertext-bound-acknowledgement": "ciphertext_digest",
        "same-epoch-single-envelope-reissue": "reissue_lost_key",
        "complete-owner-envelope-epoch-rotation": "IncompleteOwnerEnvelopeCoverage",
    }
    for mechanism, token in mechanism_tokens.items():
        check(
            f"mechanism-source-{mechanism}",
            token in source,
            f"missing source token {token}",
        )

    check(
        "source-constant-ontology",
        f'ADMITTED_SYSTEM_ONTOLOGY_DIGEST: &str =\n    "{EXPECTED_ONTOLOGY_DIGEST}"' in source,
        "Rust source does not bind admitted digest",
    )
    check(
        "source-constant-decision",
        EXPECTED_DECISION_ID in source,
        "Rust source does not bind decision id",
    )
    check(
        "no-unsafe",
        "unsafe" not in source,
        "unsafe Rust is outside the implementation boundary",
    )
    check(
        "no-production-dependencies",
        "[dependencies]" not in paths["manifest"].read_text(encoding="utf-8"),
        "unexpected production dependency section",
    )

    receipt_binding = receipt.get("implementation_binding", {})
    check(
        "receipt-binding",
        receipt_binding.get("binding_id") == binding.get("binding_id")
        and receipt_binding.get("sha256") == actual["implementation_binding"],
        "receipt implementation binding drift",
    )
    check(
        "receipt-ontology",
        receipt.get("admitted_system_ontology", {}).get("sha256") == actual["system_ontology"]
        and receipt.get("admitted_system_ontology", {}).get("admission_decision_id")
        == EXPECTED_DECISION_ID,
        "receipt ontology binding drift",
    )
    receipt_checks = {item.get("check_id"): item for item in receipt.get("checks", [])}
    check("rustfmt-pass", receipt_checks.get("rustfmt", {}).get("status") == "PASS", "rustfmt not passed")
    for run in ("cargo-test-run-001", "cargo-test-run-002"):
        item = receipt_checks.get(run, {})
        check(
            run,
            item.get("status") == "PASS"
            and item.get("tests_passed") == 13
            and item.get("tests_failed") == 0,
            f"{run} is not a 13-test pass",
        )
    clippy = receipt_checks.get("clippy", {})
    check(
        "clippy-honest-status",
        clippy.get("status") == "not_evaluable" and bool(clippy.get("causal_blocker")),
        "clippy result must remain explicitly not_evaluable",
    )
    proofs = {
        item.get("proof_id"): item
        for item in receipt.get("proof_obligations", [])
        if isinstance(item, dict)
    }
    check("proof-set", set(proofs) == EXPECTED_PROOFS, "proof obligation set drift")
    for proof_id in sorted(EXPECTED_PROOFS):
        item = proofs.get(proof_id, {})
        test_refs = item.get("test_refs", [])
        check(
            f"proof-{proof_id}",
            item.get("status") == "PASS"
            and bool(test_refs)
            and all(f"fn {test_ref}(" in tests for test_ref in test_refs),
            f"proof {proof_id} lacks passing test evidence",
        )
    check(
        "claim-ceiling",
        binding.get("successor_authorization") == "none"
        and binding.get("enforcement_effect") == "none"
        and binding.get("external_effect") == "none"
        and receipt.get("independent_acceptance") == "not_performed"
        and receipt.get("authority_effect") == "none",
        "implementation evidence exceeds authority",
    )

    implementation_admission: dict[str, Any] = {}
    if require_admission:
        implementation_admission = load(IMPLEMENTATION_ADMISSION_PATH, errors)
        subject = implementation_admission.get("subject", {})
        conformance = implementation_admission.get("conformance_evidence", {})
        admitted_predecessor = implementation_admission.get("admitted_predecessor", {})
        admission = implementation_admission.get("admission", {})
        corrections = implementation_admission.get("policy_corrections", {})
        preacceptance = implementation_admission.get("preacceptance", {})
        check(
            "implementation-admission-identity",
            implementation_admission.get("decision_id") == EXPECTED_IMPLEMENTATION_ADMISSION_ID
            and implementation_admission.get("route_id") == "CA2-ROUTE-GOVERNANCE",
            "implementation admission identity or route drift",
        )
        check(
            "implementation-admission-consent",
            implementation_admission.get("source", {}).get("exact_user_decision")
            == EXPECTED_USER_DECISION,
            "implementation admission does not preserve the exact owner decision",
        )
        check(
            "implementation-admission-binding",
            subject.get("binding_id") == binding.get("binding_id")
            and subject.get("path") == FILES["implementation_binding"]
            and subject.get("sha256") == actual["implementation_binding"]
            and actual["implementation_binding"] == EXPECTED_BINDING_DIGEST,
            "implementation admission does not bind the exact implementation candidate",
        )
        check(
            "implementation-admission-conformance",
            conformance.get("receipt_id") == receipt.get("receipt_id")
            and conformance.get("path") == FILES["conformance_receipt"]
            and conformance.get("sha256") == actual["conformance_receipt"]
            and actual["conformance_receipt"] == EXPECTED_RECEIPT_DIGEST
            and conformance.get("result") == receipt.get("result"),
            "implementation admission does not bind the exact conformance receipt",
        )
        check(
            "implementation-admission-predecessor",
            admitted_predecessor.get("ontology_id") == ontology.get("ontology_id")
            and admitted_predecessor.get("system_ontology_sha256") == actual["system_ontology"]
            and admitted_predecessor.get("admission_decision_id") == EXPECTED_DECISION_ID
            and admitted_predecessor.get("admission_decision_sha256") == actual["admission_decision"],
            "implementation admission predecessor drift",
        )
        check(
            "implementation-admission-status",
            admission.get("lifecycle_status") == "accepted"
            and admission.get("implementation_status") == "accepted-local-d65-realization"
            and admission.get("conformance_status") == "owner-accepted-static-conformance"
            and admission.get("runtime_evidence_status") == "not-claimed",
            "implementation admission status drift",
        )
        check(
            "independent-review-policy",
            corrections.get("independent_review")
            == "optional-not-required-for-owner-acceptance"
            and receipt.get("independent_acceptance") == "not_performed",
            "independent review must remain optional and honestly unperformed",
        )
        check(
            "clippy-policy",
            corrections.get("clippy") == "optional-nonblocking"
            and clippy.get("status") == "not_evaluable",
            "Clippy must remain optional and honestly not evaluable",
        )
        check(
            "implementation-admission-preacceptance",
            preacceptance.get("validator") == "scripts/validate-runtime-binding.py"
            and preacceptance.get("runs") == 2
            and preacceptance.get("outputs_identical") is True
            and preacceptance.get("checks_passed") == 39
            and preacceptance.get("material_digest")
            == "1676b222d0bd7556109c6f17b63d63f70939c38defbe0b2a191f81717129e42e",
            "implementation admission preacceptance evidence drift",
        )
        check(
            "implementation-admission-ceiling",
            implementation_admission.get("successor_authorization") == "none"
            and implementation_admission.get("enforcement_effect") == "none"
            and implementation_admission.get("external_effect") == "none",
            "implementation admission exceeds its bounded authority",
        )

    material = {
        name: actual[name]
        for name in (
            "system_ontology",
            "admission_decision",
            "manifest",
            "lockfile",
            "source",
            "tests",
            "implementation_binding",
            "conformance_receipt",
        )
    }
    return {
        "schema_version": "cav2-knowledge-exchange-rust-binding-validation/v1",
        "status": "PASS" if not errors else "FAIL",
        "mode": "admitted" if require_admission else "preacceptance",
        "binding_id": binding.get("binding_id"),
        "implementation_admission_decision_id": (
            implementation_admission.get("decision_id") if require_admission else None
        ),
        "owner_acceptance": "accepted" if require_admission and not errors else "not_claimed",
        "ontology_id": ontology.get("ontology_id"),
        "system_ontology_digest": actual["system_ontology"],
        "implementation_source_digest": actual["source"],
        "test_source_digest": actual["tests"],
        "material_digest": stable_digest(material),
        "checks": checks,
        "errors": errors,
        "authority_effect": "none",
        "claim_ceiling": (
            "Owner-accepted local Rust implementation binding and static conformance for the exact admitted ontology; independent review and Clippy are optional and not performed/evaluable; no runtime-in-environment, cryptographic security, Solana realization, publication, release, deployment, or external effect."
            if require_admission
            else "Local implementation and candidate conformance evidence only; no owner acceptance, cryptographic security proof, Solana realization, publication, release, deployment, or external effect."
        ),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--admitted",
        action="store_true",
        help="Require the exact owner-bound implementation admission decision.",
    )
    args = parser.parse_args()
    report = validate(require_admission=args.admitted)
    print(json.dumps(report, indent=2, sort_keys=True))
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
