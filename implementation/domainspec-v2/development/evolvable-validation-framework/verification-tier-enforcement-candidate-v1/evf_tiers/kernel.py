from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator


TIERS = ("V0", "V1", "V2")
CANONICAL_ROOT = Path(__file__).resolve().parents[1]
OUTCOME_MAP = {
    "counterexample": "counterexample",
    "no-counterexample": "no_counterexample_within_bounds",
    "unresolved": "inconclusive",
}


def digest_value(value: Any) -> str:
    raw = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    return hashlib.sha256(raw).hexdigest()


def _digest_receipt(receipt: dict[str, Any]) -> str:
    return digest_value({key: value for key, value in receipt.items() if key != "payload_digest"})


def _exact_ref(repo: Path, ref: object) -> bool:
    if not isinstance(ref, dict):
        return False
    path = ref.get("path")
    if not isinstance(path, str) or path.startswith("/") or ".." in Path(path).parts:
        return False
    target = repo / path
    if not target.is_file():
        return False
    data = target.read_bytes()
    return len(data) == ref.get("size_bytes") and hashlib.sha256(data).hexdigest() == ref.get("sha256")


def _profile_current(repo: Path, root: Path, record: dict[str, Any]) -> tuple[bool, dict[str, Any] | None]:
    path = record.get("path")
    if not isinstance(path, str) or path.startswith("/") or ".." in Path(path).parts:
        return False, None
    target = repo / path
    if not target.is_file():
        return False, None
    data = target.read_bytes()
    canonical_data = (root / "profile.json").read_bytes()
    canonical_digest = hashlib.sha256(canonical_data).hexdigest()
    if hashlib.sha256(data).hexdigest() != record.get("sha256") or record.get("sha256") != canonical_digest:
        return False, None
    try:
        profile = json.loads(data)
    except json.JSONDecodeError:
        return False, None
    profile_schema = json.loads((root / "contracts/profile.v1.schema.json").read_text())
    schema_ok = not list(Draft202012Validator(profile_schema).iter_errors(profile))
    return (
        schema_ok
        and data == canonical_data
        and
        profile.get("profile_id") == record.get("profile_id")
        and profile.get("profile_version") == record.get("profile_version"),
        profile,
    )


def _result(
    request_id: str,
    requested_tier: str | None,
    verified_tier: str | None,
    available_lower_tier: str | None,
    contract_state: str,
    property_outcome: str,
    receipt_digests: list[str],
    checks: list[dict[str, Any]],
    residue: list[str],
) -> dict[str, Any]:
    payload = {
        "schema_version": "evf.verification-tier-result/v1",
        "request_id": request_id,
        "requested_tier": requested_tier,
        "verified_tier": verified_tier,
        "available_lower_tier": available_lower_tier,
        "contract_state": contract_state,
        "property_outcome": property_outcome,
        "provider_receipt_digests": receipt_digests,
        "checks": checks,
        "residue": sorted(set(residue)),
        "claim_ceiling": "Exact invocation, property, subject, bounds and provider evidence only; no product approval, admission or runtime authority.",
        "authority_effect": "none",
    }
    return {**payload, "result_digest": digest_value(payload)}


def _check(checks: list[dict[str, Any]], check_id: str, passed: bool, *blockers: str) -> None:
    checks.append({
        "check_id": check_id,
        "status": "PASS" if passed else "FAIL",
        "blockers": sorted(set(blockers)) if not passed else [],
    })


def _requirements(profile: dict[str, Any], tier: str) -> dict[str, Any]:
    requirements = profile.get("tier_requirements", {}).get(tier)
    if not isinstance(requirements, dict):
        raise ValueError(f"profile-does-not-support:{tier}")
    return requirements


def _provider_findings(
    invocation: dict[str, Any], profile: dict[str, Any], tier: str, checks: list[dict[str, Any]]
) -> tuple[list[str], list[dict[str, Any]], list[str]]:
    findings: list[str] = []
    property_record = invocation["property"]
    subject = invocation["subject"]
    bounds = invocation["bounds"]
    providers = invocation["providers"]
    required = _requirements(profile, tier)
    applicable_capabilities = {
        capability
        for trait in property_record["traits"]
        for capability in profile.get("trait_capabilities", {}).get(trait, [])
    }
    supplied_capabilities = {item["capability"] for item in providers}
    capabilities_ok = bool(supplied_capabilities) and supplied_capabilities <= applicable_capabilities
    _check(checks, "provider.capabilities-compatible", capabilities_ok, "provider-capability-not-applicable")
    if not capabilities_ok:
        findings.append("provider-capability-not-applicable")

    enough = len(providers) >= required["minimum_provider_routes"]
    _check(checks, "provider.minimum-routes", enough, "insufficient-provider-routes")
    if not enough:
        findings.append("insufficient-provider-routes")

    route_ids = [item["route_id"] for item in providers]
    groups = [item["independence_group"] for item in providers]
    independent = len(route_ids) == len(set(route_ids)) and len(groups) == len(set(groups))
    if required["independent_routes"]:
        _check(checks, "provider.route-independence", independent, "provider-routes-not-independent")
        if not independent:
            findings.append("provider-routes-not-independent")

    valid: list[dict[str, Any]] = []
    receipt_digests: list[str] = []
    for index, receipt in enumerate(providers):
        prefix = f"provider.{index}.{receipt['provider_id']}"
        digest_ok = receipt["payload_digest"] == _digest_receipt(receipt)
        binding_ok = (
            receipt["property_id"] == property_record["property_id"]
            and receipt["obligation_id"] == property_record["obligation_id"]
            and receipt["subject_sha256"] == subject["sha256"]
            and receipt["bounds_digest"] == bounds["digest"]
        )
        evidence_ok = (
            receipt["receipt_kind"] == "provider-evidence"
            and not receipt["fixture"]
            and receipt["fresh"]
            and receipt["raw_evidence_valid"]
            and receipt["exact_bindings"]
            and receipt["execution_state"] == "completed"
            and receipt["observation_count"] == bounds["denominator"]
        )
        _check(checks, f"{prefix}.digest", digest_ok, "provider-receipt-digest-invalid")
        _check(checks, f"{prefix}.bindings", binding_ok, "provider-binding-mismatch")
        _check(checks, f"{prefix}.evidence", evidence_ok, "provider-evidence-not-exact-current-real-complete")
        if digest_ok:
            receipt_digests.append(receipt["payload_digest"])
        if digest_ok and binding_ok and evidence_ok:
            valid.append(receipt)
        else:
            findings.append(f"invalid-provider-receipt:{receipt['provider_id']}")
    return findings, valid, receipt_digests


def _control_findings(invocation: dict[str, Any], profile: dict[str, Any], tier: str, checks: list[dict[str, Any]]) -> list[str]:
    required = set(_requirements(profile, tier)["negative_control_classes"])
    if not required:
        return []
    controls = invocation["controls"]
    covered = {item["class"] for item in controls if item["expected_non_success"] and item["detected"]}
    control_ids = [item["control_id"] for item in controls]
    every_declared_control_detected = all(item["expected_non_success"] and item["detected"] for item in controls)
    passed = required <= covered and every_declared_control_detected and len(control_ids) == len(set(control_ids))
    _check(checks, "controls.required-classes", passed, "negative-control-class-missing-or-survived")
    return [] if passed else ["negative-control-class-missing-or-survived"]


def _assess_tier(invocation: dict[str, Any], profile: dict[str, Any], tier: str) -> tuple[bool, list[str]]:
    checks: list[dict[str, Any]] = []
    provider_findings, valid, _ = _provider_findings(invocation, profile, tier, checks)
    control_findings = _control_findings(invocation, profile, tier, checks)
    outcomes = {item["normalized_outcome"] for item in valid}
    semantic_ok = bool(valid) and "unresolved" not in outcomes and len(outcomes) == 1
    return not provider_findings and not control_findings and semantic_ok, provider_findings + control_findings


def evaluate(repo: Path, root: Path, invocation: object) -> dict[str, Any]:
    request_id = invocation.get("request_id", "invalid-request") if isinstance(invocation, dict) else "invalid-request"
    requested = invocation.get("requested_tier") if isinstance(invocation, dict) else None
    if root.resolve() != CANONICAL_ROOT:
        return _result(request_id, requested if isinstance(requested, str) else None, None, None, "not_evaluable", "inconclusive", [], [], ["enforcement-root-not-canonical"])
    schema = json.loads((root / "contracts/invocation.v1.schema.json").read_text())
    errors = sorted(Draft202012Validator(schema).iter_errors(invocation), key=lambda item: list(item.path))
    if errors:
        residue = [f"schema:{'/'.join(map(str, item.path)) or '$'}:{item.message}" for item in errors]
        return _result(request_id, requested if isinstance(requested, str) else None, None, None, "invalid_request", "inconclusive", [], [], residue)

    assert isinstance(invocation, dict)
    checks: list[dict[str, Any]] = []
    residue: list[str] = []
    current, profile = _profile_current(repo, root, invocation["profile"])
    _check(checks, "profile.exact-current", current, "profile-binding-drift")
    if not current or profile is None:
        return _result(request_id, requested, None, None, "not_evaluable", "inconclusive", [], checks, ["profile-binding-drift"])

    definition_ok = _exact_ref(repo, invocation["property"]["definition_ref"])
    subject_ok = _exact_ref(repo, invocation["subject"])
    bounds_payload = {key: value for key, value in invocation["bounds"].items() if key != "digest"}
    bounds_ok = invocation["bounds"]["digest"] == digest_value(bounds_payload)
    _check(checks, "property.definition-current", definition_ok, "property-definition-drift")
    _check(checks, "subject.exact-current", subject_ok, "subject-binding-drift")
    _check(checks, "bounds.digest-current", bounds_ok, "bounds-digest-invalid")
    if not definition_ok:
        residue.append("property-definition-drift")
    if not subject_ok:
        residue.append("subject-binding-drift")
    if not bounds_ok:
        residue.append("bounds-digest-invalid")

    try:
        provider_findings, valid, receipt_digests = _provider_findings(invocation, profile, requested, checks)
        control_findings = _control_findings(invocation, profile, requested, checks)
    except ValueError as exc:
        return _result(request_id, requested, None, None, "invalid_request", "inconclusive", [], checks, [str(exc)])
    residue.extend(provider_findings)
    residue.extend(control_findings)

    outcomes = {item["normalized_outcome"] for item in valid}
    if len(outcomes) > 1:
        property_outcome = "conflicting_evidence"
        contract_state = "conflicting_evidence"
        residue.append("provider-disagreement-no-vote")
    elif outcomes == {"unresolved"}:
        property_outcome = "inconclusive"
        contract_state = "not_evaluable"
        residue.append("provider-outcome-unresolved")
    elif outcomes:
        property_outcome = OUTCOME_MAP[next(iter(outcomes))]
        contract_state = "satisfied" if not residue else "not_evaluable"
    else:
        property_outcome = "inconclusive"
        contract_state = "not_evaluable"

    available_lower: str | None = None
    if contract_state != "satisfied":
        requested_index = TIERS.index(requested)
        for candidate in reversed(TIERS[:requested_index]):
            satisfied, _ = _assess_tier(invocation, profile, candidate)
            if satisfied and definition_ok and subject_ok and bounds_ok:
                available_lower = candidate
                break

    verified = requested if contract_state == "satisfied" else None
    return _result(request_id, requested, verified, available_lower, contract_state, property_outcome, receipt_digests, checks, residue)
