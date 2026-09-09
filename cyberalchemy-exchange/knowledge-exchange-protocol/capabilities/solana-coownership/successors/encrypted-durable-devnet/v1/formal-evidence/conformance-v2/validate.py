#!/usr/bin/env python3
"""Validate the refreshed 13-obligation conformance plan candidate."""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
PLAN = HERE / "plan.json"
V1 = HERE.parents[1]


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def main() -> int:
    try:
        plan = json.loads(PLAN.read_text())
        accepted = plan["accepted_predecessors"]
        refs = (
            (accepted["rust_binding"]["path"], accepted["rust_binding"]["sha256"]),
            (accepted["rust_binding"]["acceptance_path"], accepted["rust_binding"]["acceptance_sha256"]),
            (accepted["local_conformance_assessment"]["path"], accepted["local_conformance_assessment"]["sha256"]),
            (accepted["local_conformance_assessment"]["acceptance_path"], accepted["local_conformance_assessment"]["acceptance_sha256"]),
            (plan["current_evidence"]["formal_claims_path"], plan["current_evidence"]["formal_claims_sha256"]),
            (plan["current_evidence"]["provider_receipt_path"], plan["current_evidence"]["provider_receipt_sha256"]),
            (plan["current_evidence"]["relation_evidence_path"], plan["current_evidence"]["relation_evidence_sha256"]),
        )
        for relative, expected in refs:
            path = (HERE / relative).resolve()
            require(path.is_file(), f"missing predecessor: {relative}")
            require(digest(path) == expected, f"predecessor drift: {relative}")
        obligations = plan["obligations"]
        ids = {item["proof_id"] for item in obligations}
        registry = json.loads((V1 / "ontology/proof-requirements.json").read_text())
        registry_ids = {item["proof_id"] for item in registry["proof_requirements"]}
        require(len(obligations) == len(ids) == 13, "obligation plan must contain 13 distinct records")
        require(ids == registry_ids, "obligation plan does not close over admitted proof registry")
        require(len(plan["providers"]) == len(set(plan["providers"])), "provider IDs are not distinct")
        for item in obligations:
            require(set(item["required_providers"]).issubset(plan["providers"]), f"unknown provider: {item['proof_id']}")
            require(item["local_state"] not in {"accepted", "conformant", "discharged"}, f"inflated state: {item['proof_id']}")
        require(plan["current_evidence"]["formal_claim_count"] == 7, "formal claim closure drift")
        require(plan["current_evidence"]["relation_evidence_count"] == 204, "relation closure drift")
        require(plan["authority_effect"] == "none", "plan cannot grant authority")
        print(json.dumps({
            "result": "PASS",
            "plan_sha256": digest(PLAN),
            "obligations": 13,
            "formal_claims": 7,
            "relations": 204,
            "authority_effect": "none",
        }, indent=2))
        return 0
    except (OSError, ValueError, KeyError, json.JSONDecodeError) as exc:
        print(json.dumps({"result": "BLOCK", "error": str(exc), "authority_effect": "none"}, indent=2), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
