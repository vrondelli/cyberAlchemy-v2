#!/usr/bin/env python3
"""Validate the exact Auth Lean receipt-to-EVF-handle integration."""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

from jsonschema import Draft202012Validator


ROOT = Path(__file__).resolve().parents[5]
EVF = ROOT / "projects/domainspec-v2/development/evolvable-validation-framework"
CASE = ROOT / "projects/auth-foundation/formalization/cases/AF-EXACT-SESSION-ROLE-PERMISSION-001"


def load(path: Path) -> dict:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"object required: {path}")
    return value


def canonical_digest(value: dict) -> str:
    data = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    return hashlib.sha256(data).hexdigest()


def validate(schema_name: str, value: dict) -> None:
    schema = load(EVF / "contracts" / schema_name)
    errors = list(Draft202012Validator(schema).iter_errors(value))
    if errors:
        raise ValueError(errors[0].message)


def main() -> int:
    try:
        receipt_path = CASE / "THEOREM-OBLIGATION-RECEIPT.v1.json"
        handle_path = CASE / "EVF-FORMAL-EVIDENCE-HANDLE.v1.json"
        receipt = load(receipt_path)
        handle = load(handle_path)
        validate("lean-theorem-receipt.v1.schema.json", receipt)
        validate("evf-formal-evidence-handle.v1.schema.json", handle)
        receipt_payload = {key: value for key, value in receipt.items() if key != "receipt_payload_digest"}
        handle_payload = {key: value for key, value in handle.items() if key != "handle_payload_digest"}
        if canonical_digest(receipt_payload) != receipt["receipt_payload_digest"]:
            raise ValueError("receipt payload digest mismatch")
        if canonical_digest(handle_payload) != handle["handle_payload_digest"]:
            raise ValueError("handle payload digest mismatch")
        receipt_bytes = receipt_path.read_bytes()
        ref = handle["provider_receipt_ref"]
        if hashlib.sha256(receipt_bytes).hexdigest() != ref["sha256"] or len(receipt_bytes) != ref["size_bytes"]:
            raise ValueError("handle receipt reference mismatch")
        if receipt["native_outcome"] != "checked" or receipt["execution"]["deterministic"] is not True:
            raise ValueError("expected deterministic Lean check")
        if receipt["source_analysis"]["theorem_declaration_count"] != 0:
            raise ValueError("Auth source unexpectedly contains a theorem declaration")
        if receipt["proof_status"] != "not-established-no-theorem-declaration":
            raise ValueError("proof status overstates or misstates current source")
        if handle["claim_ceiling"] != "lean-elaboration-only-no-theorem-proof":
            raise ValueError("EVF handle claim ceiling mismatch")
    except (OSError, ValueError, json.JSONDecodeError) as error:
        print(f"FORMALCLAIM_LEAN_EVF_INTEGRATION=block\nDETAIL={error}", file=sys.stderr)
        return 1
    print("FORMALCLAIM_LEAN_EVF_INTEGRATION=pass")
    print("LEAN_NATIVE_OUTCOME=checked")
    print("EVF_NORMALIZED_OUTCOME=elaboration-checked")
    print("THEOREM_PROOF=not-established")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
