#!/usr/bin/env python3
"""Normalize a valid Lean provider receipt into one bounded EVF handle."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator

try:
    from .identity import canonical_digest, exact_ref, load_json, repository_root
except ImportError:  # pragma: no cover - direct script entry
    from identity import canonical_digest, exact_ref, load_json, repository_root  # type: ignore[no-redef]


EVF_ROOT = Path(__file__).resolve().parents[2]
RECEIPT_SCHEMA = EVF_ROOT / "contracts/lean-theorem-receipt.v1.schema.json"
HANDLE_SCHEMA = EVF_ROOT / "contracts/evf-formal-evidence-handle.v1.schema.json"


def _validate(schema_path: Path, value: Any, label: str) -> None:
    schema = load_json(schema_path)
    errors = sorted(Draft202012Validator(schema).iter_errors(value), key=lambda error: list(error.absolute_path))
    if errors:
        first = errors[0]
        raise ValueError(f"{label} invalid: {first.message}")


def _verify_payload_digest(receipt: dict[str, Any]) -> None:
    payload = {key: value for key, value in receipt.items() if key != "receipt_payload_digest"}
    if canonical_digest(payload) != receipt.get("receipt_payload_digest"):
        raise ValueError("receipt payload digest mismatch")


def build_evidence_handle(receipt_path: Path, root: Path | None = None) -> dict[str, Any]:
    root = (root or repository_root(receipt_path)).resolve()
    receipt_path = receipt_path.resolve(strict=True)
    receipt = load_json(receipt_path)
    _validate(RECEIPT_SCHEMA, receipt, "receipt")
    _verify_payload_digest(receipt)
    handle: dict[str, Any] = {
        "schema_version": "evf.formal-evidence-handle/v1",
        "handle_id": f"{receipt['receipt_id']}.evf-handle/v1",
        "request_id": receipt["request_id"],
        "provider_receipt_ref": exact_ref(root, receipt_path),
        "evidence_kind": "lean-theorem" if receipt["normalized_outcome"] == "theorem-checked" else "lean-elaboration",
        "normalized_outcome": receipt["normalized_outcome"],
        "proof_status": receipt["proof_status"],
        "residue": receipt["residue"],
        "authority_effect": "none",
        "release_admission": "not-granted",
        "claim_ceiling": receipt["claim_ceiling"],
    }
    handle["handle_payload_digest"] = canonical_digest(handle)
    _validate(HANDLE_SCHEMA, handle, "handle")
    return handle


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--receipt", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    try:
        handle = build_evidence_handle(args.receipt)
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(handle, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    except (OSError, ValueError) as error:
        print(f"EVF_LEAN_ADAPTER_ERROR={error}", file=sys.stderr)
        return 2
    print(f"EVF_EVIDENCE_KIND={handle['evidence_kind']}")
    print(f"PROOF_STATUS={handle['proof_status']}")
    print(f"HANDLE={args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
