from __future__ import annotations

from typing import Any

from tde.neutral_obligation import digest_value


def _valid(receipt: dict[str, Any]) -> bool:
    payload = {key: value for key, value in receipt.items() if key != "receipt_digest"}
    return receipt.get("receipt_digest") == digest_value(payload)


def build_join(
    obligation: dict[str, Any],
    souffle_receipt: dict[str, Any] | None,
    alloy_receipt: dict[str, Any] | None,
) -> dict[str, Any]:
    receipts = [item for item in (souffle_receipt, alloy_receipt) if item is not None]
    missing = [name for name, item in (("souffle", souffle_receipt), ("alloy", alloy_receipt)) if item is None]
    valid = len(receipts) == 2 and all(_valid(item) for item in receipts)
    same_obligation = len(receipts) == 2 and all(item.get("obligation_id") == obligation.get("obligation_id") for item in receipts)
    same_facts = len(receipts) == 2 and all(item.get("fact_manifest_digest") == obligation.get("fact_manifest_digest") for item in receipts)
    provider_kinds = (
        souffle_receipt is not None
        and alloy_receipt is not None
        and souffle_receipt.get("provider", {}).get("id") in {"souffle", "souffle-test-double"}
        and alloy_receipt.get("provider", {}).get("id") in {"alloy", "alloy-test-double"}
    )
    exact_providers = (
        provider_kinds
        and souffle_receipt.get("receipt_kind") == "provider-evidence"
        and alloy_receipt.get("receipt_kind") == "provider-evidence"
        and souffle_receipt.get("provider", {}).get("id") == "souffle"
        and alloy_receipt.get("provider", {}).get("id") == "alloy"
    )
    outcomes = [item.get("normalized_outcome") for item in receipts]
    if missing:
        status, consistency, residue = "NOT_EVALUABLE", "incomplete", [f"missing-{name}-evidence" for name in missing]
    elif not valid:
        status, consistency, residue = "BLOCK", "invalid", ["provider-receipt-digest-invalid"]
    elif not same_obligation or not same_facts or not provider_kinds:
        status, consistency, residue = "BLOCK", "not-comparable", ["provider-binding-not-comparable"]
    elif "unresolved" in outcomes:
        status, consistency, residue = "NOT_EVALUABLE", "unresolved", ["provider-outcome-unresolved"]
    elif len(set(outcomes)) != 1:
        status, consistency, residue = "CONFLICT", "provider-disagreement", ["provider-disagreement-no-vote"]
    elif not exact_providers:
        status, consistency = "NOT_EVALUABLE", "fixture-agreement-only"
        residue = [
            name for name, receipt in (("exact-souffle-2.5-evidence-missing", souffle_receipt), ("exact-alloy-6.2.0-evidence-missing", alloy_receipt))
            if receipt.get("receipt_kind") != "provider-evidence"
        ]
    elif outcomes[0] == "counterexample":
        status, consistency, residue = "COUNTEREXAMPLE", "counterexample-consistent", []
    else:
        status, consistency, residue = "SUPPORTED_BOUNDED", "no-counterexample-consistent-under-declared-bounds", []
    payload = {
        "schema_version": "evf.dual-provider-bounded-join/v1",
        "obligation_id": obligation["obligation_id"],
        "provider_receipt_digests": {
            "souffle": souffle_receipt.get("receipt_digest") if souffle_receipt else None,
            "alloy": alloy_receipt.get("receipt_digest") if alloy_receipt else None,
        },
        "preflight": {
            "both_receipts_present": not missing,
            "receipt_digests_valid": valid,
            "same_obligation": same_obligation,
            "same_fact_manifest": same_facts,
            "provider_kinds_exact": bool(provider_kinds),
            "exact_provider_evidence": bool(exact_providers),
        },
        "mapped_results": {
            "souffle": souffle_receipt.get("normalized_outcome") if souffle_receipt else None,
            "alloy": alloy_receipt.get("normalized_outcome") if alloy_receipt else None,
        },
        "status": status,
        "consistency_class": consistency,
        "residue": residue,
        "voting": "forbidden",
        "authority_effect": "none",
        "product_approval": "not-granted",
        "release_admission": "not-granted",
        "claim_ceiling": "Consistency or conflict between exact bounded provider observations only.",
    }
    return {**payload, "join_digest": digest_value(payload)}
