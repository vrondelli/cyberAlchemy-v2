#!/usr/bin/env python3
"""Validate the theorem-bearing Auth Lean candidate and its EVF evidence."""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

from jsonschema import Draft202012Validator


ROOT = Path(__file__).resolve().parents[5]
EVF = ROOT / "projects/domainspec-v2/development/evolvable-validation-framework"
CASE = ROOT / "projects/auth-foundation/formalization/cases/AF-EXACT-SESSION-ROLE-PERMISSION-001"
EXPECTED = [
    "AuthFoundation.ExactSessionRolePermission.exactSessionRolePermission_of_laws",
    "AuthFoundation.ExactSessionRolePermission.referenceModelSatisfies",
]


def load(path: Path) -> dict:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"object required: {path}")
    return value


def digest_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def canonical_digest(value: dict) -> str:
    data = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    return digest_bytes(data)


def validate(schema_name: str, value: dict) -> None:
    schema = load(EVF / "contracts" / schema_name)
    errors = list(Draft202012Validator(schema).iter_errors(value))
    if errors:
        raise ValueError(errors[0].message)


def verify_ref(ref: dict) -> None:
    path = ROOT / ref["path"]
    data = path.read_bytes()
    if digest_bytes(data) != ref["sha256"] or len(data) != ref["size_bytes"]:
        raise ValueError(f"exact reference mismatch: {ref['path']}")


def canonical_proposition(source: str) -> str:
    begin = "  -- DOMAINSPEC-CANONICAL-PROPOSITION-BEGIN\n"
    end = "  -- DOMAINSPEC-CANONICAL-PROPOSITION-END"
    if source.count(begin) != 1 or source.count(end) != 1:
        raise ValueError("canonical proposition markers are not singular")
    return source.split(begin, 1)[1].split(end, 1)[0]


def main() -> int:
    try:
        request_path = CASE / "THEOREM-OBLIGATION-REQUEST.v3-theorem-ready.json"
        receipt_path = CASE / "THEOREM-OBLIGATION-RECEIPT.v2.json"
        handle_path = CASE / "EVF-FORMAL-EVIDENCE-HANDLE.v2.json"
        request = load(request_path)
        receipt = load(receipt_path)
        handle = load(handle_path)

        validate("lean-theorem-request.v1.schema.json", request)
        validate("lean-theorem-receipt.v1.schema.json", receipt)
        validate("evf-formal-evidence-handle.v1.schema.json", handle)

        if request["expected_declarations"] != EXPECTED:
            raise ValueError("request does not bind the exact expected declarations")
        for name in (
            "formal_claim_lean_binding_ref",
            "theorem_statement_ref",
            "provider_profile_ref",
            "runtime_binding_ref",
            "execution_policy_ref",
        ):
            verify_ref(request[name])
        verify_ref(receipt["request_ref"])
        for ref in receipt["input_refs"]:
            verify_ref(ref)
        verify_ref(handle["provider_receipt_ref"])

        receipt_payload = {
            key: value for key, value in receipt.items() if key != "receipt_payload_digest"
        }
        handle_payload = {
            key: value for key, value in handle.items() if key != "handle_payload_digest"
        }
        if canonical_digest(receipt_payload) != receipt["receipt_payload_digest"]:
            raise ValueError("receipt payload digest mismatch")
        if canonical_digest(handle_payload) != handle["handle_payload_digest"]:
            raise ValueError("handle payload digest mismatch")

        analysis = receipt["source_analysis"]
        if analysis["expected_declarations"] != EXPECTED:
            raise ValueError("receipt expected declarations differ from request")
        if analysis["missing_expected_declarations"]:
            raise ValueError("receipt is missing an expected declaration")
        if not set(EXPECTED).issubset(set(analysis["declaration_names"])):
            raise ValueError("expected declaration absent from analyzed source")
        if analysis["forbidden_constructs"]:
            raise ValueError("forbidden Lean construct detected")

        execution = receipt["execution"]
        if receipt["native_outcome"] != "checked":
            raise ValueError("native Lean outcome is not checked")
        if receipt["normalized_outcome"] != "theorem-checked":
            raise ValueError("EVF outcome is not theorem-checked")
        if receipt["proof_status"] != "lean-theorem-declarations-checked":
            raise ValueError("proof status mismatch")
        if execution["repetition_count"] != 2 or execution["deterministic"] is not True:
            raise ValueError("expected two deterministic runs")
        run_fingerprints = {
            (run["exit_code"], run["timed_out"], run["stdout_sha256"], run["stderr_sha256"])
            for run in execution["runs"]
        }
        if run_fingerprints != {(0, False, hashlib.sha256(b"").hexdigest(), hashlib.sha256(b"").hexdigest())}:
            raise ValueError("Lean runs did not both complete cleanly")

        old_source = (CASE / "ExactSessionRolePermission.lean").read_text(encoding="utf-8")
        new_source = (CASE / "ExactSessionRolePermission.v2.lean").read_text(encoding="utf-8")
        if canonical_proposition(old_source) != canonical_proposition(new_source):
            raise ValueError("canonical proposition changed in theorem-bearing source")
        if handle["evidence_kind"] != "lean-theorem":
            raise ValueError("EVF handle evidence kind mismatch")
        if handle["claim_ceiling"] != "exact-lean-theorem-declarations-checked-only":
            raise ValueError("EVF handle claim ceiling mismatch")
        if handle["release_admission"] != "not-granted":
            raise ValueError("EVF handle improperly grants release admission")
    except (OSError, ValueError, json.JSONDecodeError) as error:
        print(f"AUTH_LEAN_THEOREM_V2_INTEGRATION=block\nDETAIL={error}", file=sys.stderr)
        return 1

    print("AUTH_LEAN_THEOREM_V2_INTEGRATION=pass")
    print("EXPECTED_DECLARATIONS=2")
    print("LEAN_RUNS=2")
    print("EVF_NORMALIZED_OUTCOME=theorem-checked")
    print("PRODUCTION_AUTH_CONFORMANCE=not-established")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
