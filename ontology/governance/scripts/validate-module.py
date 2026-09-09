#!/usr/bin/env python3
"""Validate every owned ontology in the standalone Governance module."""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = Path(__file__).resolve().parents[4]
CHILDREN = (
    ("governance.product", "product/scripts/validate.py"),
    ("cav2.governance-model", "scripts/validate.py"),
)


def run_child(relative: str, write_receipt: bool) -> tuple[dict[str, Any], str | None]:
    command = [sys.executable, str(PACKAGE_ROOT / relative)]
    if write_receipt:
        command.append("--write-receipt")
    completed = subprocess.run(
        command, cwd=REPOSITORY_ROOT, text=True, capture_output=True, check=False
    )
    if completed.returncode not in (0, 1):
        return {}, f"{relative} exited {completed.returncode}: {completed.stderr.strip()}"
    try:
        result = json.loads(completed.stdout)
    except json.JSONDecodeError as exc:
        return {}, f"{relative} returned invalid JSON: {exc}"
    if completed.returncode != 0 and result.get("status") != "BLOCK":
        return result, f"{relative} exit status and result status disagree"
    return result, None


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--write-receipts", action="store_true",
        help="ask each passing ontology to append its receipt, then append one module receipt",
    )
    args = parser.parse_args()

    errors: list[str] = []
    child_results: list[dict[str, Any]] = []
    digest_inputs: list[dict[str, Any]] = []
    for ontology_id, validator in CHILDREN:
        result, error = run_child(validator, args.write_receipts)
        if error:
            errors.append(error)
        if result.get("ontology_id") != ontology_id:
            errors.append(f"{validator} returned unexpected ontology identity {result.get('ontology_id')!r}")
        if result.get("status") != "PASS":
            errors.append(f"{validator} did not PASS")
        child_results.append({
            "ontology_id": result.get("ontology_id"),
            "status": result.get("status"),
            "material_digest": result.get("material_digest"),
            "counts": result.get("counts", {}),
            "authority_effect": result.get("authority_effect"),
            "enforcement_effect": result.get("enforcement_effect"),
            "receipt": result.get("receipt"),
        })
        digest_inputs.append({
            "ontology_id": result.get("ontology_id"),
            "material_digest": result.get("material_digest"),
        })
        if result.get("authority_effect") != "none" or result.get("enforcement_effect") != "none":
            errors.append(f"{validator} exceeded the module effect ceiling")

    manifest_digest = hashlib.sha256((PACKAGE_ROOT / "module.json").read_bytes()).hexdigest()
    digest_payload = {
        "module_id": "governance",
        "manifest_digest": manifest_digest,
        "children": digest_inputs,
    }
    module_digest = hashlib.sha256(
        json.dumps(digest_payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()
    status = "PASS" if not errors else "BLOCK"
    result: dict[str, Any] = {
        "status": status,
        "module_id": "governance",
        "package_root": "cyberAlchemy-v2/ontology/governance",
        "host_context": "cyberalchemy-v2",
        "host_source_authority_dependency": "canonical-selector-bindings",
        "host_product_ontology_dependency": "none",
        "authority_effect": "none",
        "enforcement_effect": "none",
        "implementation_effect": "none",
        "child_results": child_results,
        "module_digest": module_digest,
        "errors": errors,
    }

    if args.write_receipts and status == "PASS":
        receipt = {
            "schema_ref": "../schemas/governance-ontology.schema.json#/$defs/moduleValidationReceipt",
            "schema_version": "governance-module-validation/v1",
            "validated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "status": "PASS",
            "module_id": "governance",
            "package_root": "cyberAlchemy-v2/ontology/governance",
            "authority_effect": "none",
            "enforcement_effect": "none",
            "implementation_effect": "none",
            "child_results": child_results,
            "module_digest": module_digest,
            "errors": [],
        }
        receipt_path = PACKAGE_ROOT / "receipts" / f"module-validation-{module_digest[:16]}.json"
        if receipt_path.exists():
            result["receipt_write"] = "existing-append-only-receipt-preserved"
        else:
            receipt_path.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
            result["receipt_write"] = "created"
        result["receipt"] = str(receipt_path.relative_to(REPOSITORY_ROOT))
    elif args.write_receipts:
        result["receipt_write"] = "blocked"

    json.dump(result, sys.stdout, indent=2, sort_keys=True)
    sys.stdout.write("\n")
    return 0 if status == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
