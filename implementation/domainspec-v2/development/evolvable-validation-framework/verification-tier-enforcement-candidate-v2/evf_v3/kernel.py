from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
CLASSES = {"subject", "oracle", "denominator", "evidence", "execution"}


def digest_value(value: Any) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()).hexdigest()


def exact_ref(repo: Path, ref: Any) -> bool:
    if not isinstance(ref, dict) or set(ref) != {"path", "sha256", "size_bytes"}:
        return False
    path = ref.get("path")
    if not isinstance(path, str) or path.startswith("/") or ".." in Path(path).parts:
        return False
    target = repo / path
    if not target.is_file():
        return False
    data = target.read_bytes()
    return len(data) == ref.get("size_bytes") and hashlib.sha256(data).hexdigest() == ref.get("sha256")


def _result(request_id: str, state: str, outcome: str, checks: list[dict[str, Any]], residue: list[str], shared: list[str]) -> dict[str, Any]:
    payload = {
        "schema_version": "evf.verification-tier-result/v2-candidate",
        "request_id": request_id,
        "requested_tier": "V3",
        "verified_tier": "V3" if state == "satisfied" else None,
        "contract_state": state,
        "property_outcome": outcome,
        "checks": checks,
        "residue": sorted(set(residue)),
        "shared_infrastructure": sorted(shared),
        "claim_ceiling": "Exact trait-complete V3 suite evidence within declared bounds only; no approval, admission, release, or runtime authority.",
        "authority_effect": "none"
    }
    return {**payload, "result_digest": digest_value(payload)}


def evaluate(repo: Path, invocation: Any) -> dict[str, Any]:
    request_id = invocation.get("request_id", "invalid") if isinstance(invocation, dict) else "invalid"
    checks: list[dict[str, Any]] = []
    residue: list[str] = []
    def check(cid: str, passed: bool, reason: str) -> None:
        checks.append({"check_id": cid, "status": "PASS" if passed else "FAIL", "blockers": [] if passed else [reason]})
        if not passed: residue.append(reason)

    if not isinstance(invocation, dict) or invocation.get("schema_version") != "evf.verification-tier-invocation/v2-candidate" or invocation.get("requested_tier") != "V3":
        return _result(request_id, "invalid_request", "inconclusive", checks, ["invocation-shape-invalid"], [])
    allowed = {"schema_version", "request_id", "requested_tier", "profile", "property_family", "subject", "bounds", "providers", "controls", "effect_ceiling"}
    check("invocation.closed", set(invocation) == allowed and invocation.get("effect_ceiling") == "read-only-isolated-verification", "invocation-shape-invalid")
    profile_ref = invocation.get("profile")
    profile_ok = exact_ref(repo, profile_ref)
    profile = None
    if profile_ok:
        profile_bytes = (repo / profile_ref["path"]).read_bytes()
        profile = json.loads(profile_bytes)
        profile_ok = profile_bytes == (ROOT / "profile.json").read_bytes() and profile.get("profile_id") == "evf.core.verification-tiers.v0-v3" and profile.get("profile_version") == "2"
    check("profile.exact-current", profile_ok, "profile-binding-drift")
    family = invocation.get("property_family", {})
    obligations = family.get("obligations", []) if isinstance(family, dict) else []
    obligation_ids = [o.get("obligation_id") for o in obligations if isinstance(o, dict)]
    traits = {o.get("trait") for o in obligations if isinstance(o, dict)}
    family_ok = bool(obligations) and len(obligation_ids) == len(set(obligation_ids)) and exact_ref(repo, family.get("definition_ref"))
    check("property-family.exact-complete", family_ok, "property-family-invalid-or-drift")
    subject_ok = exact_ref(repo, invocation.get("subject"))
    check("subject.exact-current", subject_ok, "subject-binding-drift")
    bounds = invocation.get("bounds", {})
    bounds_ok = isinstance(bounds, dict) and bounds.get("denominator") == len(obligations) and bounds.get("digest") == digest_value({k: v for k, v in bounds.items() if k != "digest"})
    check("bounds.exact-denominator", bounds_ok, "bounds-invalid")

    providers = invocation.get("providers", [])
    routes = [p.get("route_id") for p in providers if isinstance(p, dict)]
    groups = [p.get("independence_group") for p in providers if isinstance(p, dict)]
    producers = [p.get("producer_identity") for p in providers if isinstance(p, dict)]
    independent = bool(providers) and len(routes) == len(set(routes)) and len(groups) == len(set(groups)) and len(producers) == len(set(producers))
    check("providers.materially-independent", independent, "provider-independence-invalid")
    covered: set[str] = set()
    infra_counts: dict[str, int] = {}
    outcomes: dict[str, set[str]] = {}
    capabilities = profile.get("trait_capabilities", {}) if profile else {}
    for index, provider in enumerate(providers):
        prefix = f"provider.{index}.{provider.get('route_id', 'unknown')}"
        receipt_keys = {"schema_version", "route_id", "independence_group", "producer_identity", "capability", "obligation_id", "subject_sha256", "bounds_digest", "normalized_outcome", "fresh", "fixture", "execution_state", "raw_evidence_ref", "raw_evidence_sha256", "provider_profile_ref", "provider_profile_sha256", "input_refs", "infrastructure", "route_mutation", "payload_digest"}
        shape_ok = set(provider) == receipt_keys and provider.get("schema_version") == "evf.verification-tier-provider-receipt/v2-candidate"
        receipt_digest_ok = provider.get("payload_digest") == digest_value({k: v for k, v in provider.items() if k != "payload_digest"})
        oid = provider.get("obligation_id")
        obligation = next((o for o in obligations if o.get("obligation_id") == oid), None)
        capability_ok = obligation is not None and provider.get("capability") in capabilities.get(obligation.get("trait"), [])
        input_refs = provider.get("input_refs", [])
        direct = exact_ref(repo, provider.get("raw_evidence_ref")) and exact_ref(repo, provider.get("provider_profile_ref")) and isinstance(input_refs, list) and bool(input_refs) and all(exact_ref(repo, item) for item in input_refs)
        direct = direct and provider.get("raw_evidence_sha256") == provider.get("raw_evidence_ref", {}).get("sha256") and provider.get("provider_profile_sha256") == provider.get("provider_profile_ref", {}).get("sha256")
        semantic = provider.get("subject_sha256") == invocation.get("subject", {}).get("sha256") and provider.get("bounds_digest") == bounds.get("digest") and provider.get("execution_state") == "completed" and provider.get("fresh") is True and provider.get("fixture") is False and provider.get("normalized_outcome") in {"no-counterexample", "counterexample"}
        mutation = provider.get("route_mutation", {})
        mutation_ok = set(mutation) == {"mutation_id", "expected_non_success", "detected", "input_ref", "evidence_ref"} and mutation.get("expected_non_success") is True and mutation.get("detected") is True and exact_ref(repo, mutation.get("input_ref")) and exact_ref(repo, mutation.get("evidence_ref"))
        infrastructure = provider.get("infrastructure", [])
        infra_ok = isinstance(infrastructure, list) and bool(infrastructure) and all(isinstance(x, dict) and set(x) == {"component_id", "sha256"} and isinstance(x["sha256"], str) and len(x["sha256"]) == 64 for x in infrastructure)
        for item in infrastructure if infra_ok else []: infra_counts[item["component_id"]] = infra_counts.get(item["component_id"], 0) + 1
        check(prefix + ".shape", shape_ok, "provider-receipt-shape-invalid")
        check(prefix + ".receipt", receipt_digest_ok, "provider-receipt-digest-invalid")
        check(prefix + ".capability", capability_ok, "provider-capability-mismatch")
        check(prefix + ".direct-bindings", direct, "provider-direct-binding-invalid")
        check(prefix + ".execution", semantic, "provider-execution-invalid")
        check(prefix + ".mutation", mutation_ok, "route-mutation-missing-or-survived")
        check(prefix + ".infrastructure", infra_ok, "provider-infrastructure-undeclared")
        if all((shape_ok, receipt_digest_ok, capability_ok, direct, semantic, mutation_ok, infra_ok)):
            covered.add(oid)
            outcomes.setdefault(oid, set()).add(provider["normalized_outcome"])
    complete = set(obligation_ids) == covered and traits == set(profile.get("trait_capabilities", {})) if profile else False
    check("suite.trait-complete", complete, "trait-or-obligation-coverage-incomplete")
    controls = invocation.get("controls", [])
    control_ids = [c.get("control_id") for c in controls if isinstance(c, dict)]
    detected_classes = {c.get("class") for c in controls if c.get("expected_non_success") is True and c.get("detected") is True}
    controls_ok = CLASSES <= detected_classes and len(control_ids) == len(set(control_ids)) and all(c.get("expected_non_success") is True and c.get("detected") is True for c in controls)
    check("controls.v3-complete", controls_ok, "negative-control-class-missing-or-survived")
    shared = [name for name, count in infra_counts.items() if count > 1]
    conflict = any(len(values) > 1 for values in outcomes.values())
    if conflict: residue.append("provider-outcome-conflict-no-vote")
    state = "satisfied" if not residue else ("conflicting_evidence" if conflict else "not_evaluable")
    all_outcomes = {value for values in outcomes.values() for value in values}
    outcome = "conflicting_evidence" if conflict else ("counterexample" if "counterexample" in all_outcomes else ("no_counterexample_within_bounds" if all_outcomes == {"no-counterexample"} else "inconclusive"))
    return _result(request_id, state, outcome, checks, residue, shared)
