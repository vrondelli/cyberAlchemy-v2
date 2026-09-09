from __future__ import annotations

from typing import Any

from tde.neutral_obligation import digest_value


def build_join(obligation: dict[str, Any], provider_receipt: dict[str, Any]) -> dict[str, Any]:
    receipt_payload = {key: value for key, value in provider_receipt.items() if key != "receipt_digest"}
    receipt_valid = provider_receipt.get("receipt_digest") == digest_value(receipt_payload)
    same_obligation = provider_receipt.get("obligation_id") == obligation.get("obligation_id")
    same_facts = provider_receipt.get("fact_manifest_digest") == obligation.get("fact_manifest_digest")
    real_provider = (
        provider_receipt.get("receipt_kind") == "provider-evidence"
        and provider_receipt.get("provider", {}).get("id") == "souffle"
        and provider_receipt.get("provider", {}).get("version") == "2.5"
    )
    outcome = provider_receipt.get("normalized_outcome")
    if not receipt_valid:
        status, residue = "BLOCK", ["provider-receipt-digest-invalid"]
    elif not same_obligation or not same_facts:
        status, residue = "BLOCK", ["provider-receipt-binding-mismatch"]
    elif not real_provider:
        status, residue = "NOT_EVALUABLE", ["exact-souffle-2.5-evidence-missing"]
    elif outcome == "counterexample":
        status, residue = "COUNTEREXAMPLE", []
    elif outcome == "no-counterexample":
        status, residue = "SUPPORTED_BOUNDED", []
    else:
        status, residue = "NOT_EVALUABLE", ["provider-outcome-unresolved"]
    payload = {
        "schema_version": "evf.single-provider-bounded-join/v1",
        "obligation_id": obligation["obligation_id"],
        "provider_receipt_digest": provider_receipt.get("receipt_digest"),
        "preflight": {
            "same_obligation": same_obligation,
            "same_fact_manifest": same_facts,
            "receipt_digest_valid": receipt_valid,
            "exact_provider": real_provider,
        },
        "provider_outcome": outcome,
        "status": status,
        "residue": residue,
        "authority_effect": "none",
        "product_approval": "not-granted",
        "release_admission": "not-granted",
        "claim_ceiling": "Single-provider exact closed-world reachability result only.",
    }
    return {**payload, "join_digest": digest_value(payload)}
