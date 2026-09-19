"""Fail-closed Auth adapters for the existing ORODI evidence contracts.

The module evaluates local JSON values only. It does not discover credentials,
call a cloud API, deploy, inject a fault, roll back, or claim runtime admission.
"""

from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


EVIDENCE_STATES = (
    "passed",
    "failed",
    "missing",
    "invalid",
    "inconclusive",
    "stale",
    "not-run",
)
CONTROL_IDS = tuple(f"C{i:02d}" for i in range(1, 21))
HOSTILE_IDS = tuple(f"M{i:02d}" for i in range(1, 18))
PIPELINE_IDS = tuple(f"P{i:02d}" for i in range(1, 7))
PLACEHOLDER = "TO-BE-BOUND-BY-B0"


def _finding(code: str, path: str, detail: str) -> dict[str, str]:
    return {"code": code, "path": path, "detail": detail}


def _placeholders(value: Any, path: str = "$") -> list[dict[str, str]]:
    findings: list[dict[str, str]] = []
    if isinstance(value, str) and value.startswith("TO-BE-BOUND-BY-"):
        gate = value.removeprefix("TO-BE-BOUND-BY-")
        findings.append(_finding("ORODI_BINDING_MISSING", path, f"replace the {gate} placeholder with an exact owner-bound value"))
    elif isinstance(value, dict):
        for key in sorted(value):
            findings.extend(_placeholders(value[key], f"{path}.{key}"))
    elif isinstance(value, list):
        for index, item in enumerate(value):
            findings.extend(_placeholders(item, f"{path}[{index}]"))
    return findings


def _ids(entries: Any, expected: tuple[str, ...], path: str) -> list[dict[str, str]]:
    if not isinstance(entries, list):
        return [_finding("ORODI_DENOMINATOR_INVALID", path, "expected an ordered array")]
    actual = [entry.get("id") if isinstance(entry, dict) else None for entry in entries]
    findings: list[dict[str, str]] = []
    if actual != list(expected):
        findings.append(_finding("ORODI_DENOMINATOR_INCOMPLETE", path, f"expected {','.join(expected)}"))
    for index, entry in enumerate(entries):
        if not isinstance(entry, dict) or entry.get("state") not in EVIDENCE_STATES:
            findings.append(_finding("ORODI_EVIDENCE_STATE_INVALID", f"{path}[{index}].state", "state must use the seven-state ORODI vocabulary"))
    return findings


def preflight_binding(binding: Any) -> dict[str, Any]:
    findings: list[dict[str, str]] = []
    if not isinstance(binding, dict):
        findings.append(_finding("ORODI_BINDING_INVALID", "$", "expected one JSON object"))
        binding = {}
    if binding.get("schema_version") != "auth.orodi-evaluation-binding/v1-candidate":
        findings.append(_finding("ORODI_BINDING_VERSION", "$.schema_version", "unsupported binding version"))
    if tuple(binding.get("evidence_states", ())) != EVIDENCE_STATES:
        findings.append(_finding("ORODI_STATE_VOCABULARY_DRIFT", "$.evidence_states", "expected the exact ordered seven-state ORODI vocabulary"))
    findings.extend(_ids(binding.get("control_denominator"), CONTROL_IDS, "$.control_denominator"))
    findings.extend(_ids(binding.get("hostile_denominator"), HOSTILE_IDS, "$.hostile_denominator"))
    findings.extend(_ids(binding.get("evidence_pipeline_hostile_controls"), PIPELINE_IDS, "$.evidence_pipeline_hostile_controls"))
    findings.extend(_placeholders(binding))

    context = binding.get("context") if isinstance(binding.get("context"), dict) else {}
    for field in ("created_at", "expires_at"):
        if context.get(field) is None:
            findings.append(_finding("ORODI_BINDING_MISSING", f"$.context.{field}", "bind an exact timestamp"))
    if not context.get("invalidation_keys"):
        findings.append(_finding("ORODI_BINDING_MISSING", "$.context.invalidation_keys", "bind at least one invalidation key"))

    for index, member in enumerate(binding.get("control_denominator", [])):
        if isinstance(member, dict) and isinstance(member.get("required"), str):
            findings.append(_finding("ORODI_OWNER_DECISION_MISSING", f"$.control_denominator[{index}].required", "extension applicability requires an owner decision"))

    findings.sort(key=lambda item: (item["path"], item["code"], item["detail"]))
    invalid_codes = {"ORODI_BINDING_INVALID", "ORODI_BINDING_VERSION", "ORODI_STATE_VOCABULARY_DRIFT", "ORODI_DENOMINATOR_INVALID", "ORODI_DENOMINATOR_INCOMPLETE", "ORODI_EVIDENCE_STATE_INVALID"}
    evidence_state = "invalid" if any(item["code"] in invalid_codes for item in findings) else ("missing" if findings else "passed")
    return {
        "schema_version": "auth.orodi-b0-preflight-result/v1-candidate",
        "binding_id": binding.get("binding_id"),
        "verdict": "ready" if not findings else "blocked",
        "evidence_state": evidence_state,
        "counts": {
            "controls": len(binding.get("control_denominator", [])),
            "hostile_controls": len(binding.get("hostile_denominator", [])),
            "pipeline_hostile_controls": len(binding.get("evidence_pipeline_hostile_controls", [])),
            "findings": len(findings),
        },
        "findings": findings,
        "deployment_effect": False,
        "authority_effect": "none",
    }


def preflight_profile(binding: Any) -> dict[str, Any]:
    """Evaluate the owner/profile slice needed before product gap analysis.

    Artifact, environment instance, observation window, and invalidation values
    belong to final B1 closure and remain visible in the full preflight.
    """
    full = preflight_binding(binding)
    profile_prefixes = (
        "$.context.fixtures_and_queries",
        "$.context.observers",
        "$.context.owners",
        "$.context.policies_and_thresholds",
        "$.context.profiles_and_tools",
        "$.control_denominator",
    )
    findings = [item for item in full["findings"] if item["path"].startswith(profile_prefixes)]
    return {
        "schema_version": "auth.orodi-b0-profile-preflight-result/v1-candidate",
        "binding_id": full["binding_id"],
        "verdict": "ready" if not findings else "blocked",
        "evidence_state": "passed" if not findings else "missing",
        "findings": findings,
        "full_binding_findings_deferred_to_b1": full["counts"]["findings"] - len(findings),
        "deployment_effect": False,
        "authority_effect": "none",
    }


def evaluate_ledger(entries: Any, required_ids: tuple[str, ...]) -> dict[str, Any]:
    findings: list[dict[str, str]] = []
    if not isinstance(entries, list):
        entries = []
        findings.append(_finding("ORODI_LEDGER_INVALID", "$", "expected an array"))
    ids = [entry.get("id") if isinstance(entry, dict) else None for entry in entries]
    duplicates = sorted(item for item, count in Counter(ids).items() if item is not None and count > 1)
    for item in duplicates:
        findings.append(_finding("ORODI_LEDGER_DUPLICATE", "$", f"duplicate member {item}"))
    by_id = {entry.get("id"): entry for entry in entries if isinstance(entry, dict) and isinstance(entry.get("id"), str)}
    for member_id in required_ids:
        if member_id not in by_id:
            findings.append(_finding("ORODI_LEDGER_MISSING", "$", f"missing required member {member_id}"))
    states: list[str] = []
    for member_id in required_ids:
        state = by_id.get(member_id, {}).get("state")
        if state is not None:
            if state not in EVIDENCE_STATES:
                findings.append(_finding("ORODI_EVIDENCE_STATE_INVALID", f"$.{member_id}.state", "unknown state"))
            else:
                states.append(state)
    state_counts = {state: states.count(state) for state in EVIDENCE_STATES}
    non_passing = sorted({state for state in states if state != "passed"})
    if findings:
        claim_state = "invalid" if any(item["code"] in {"ORODI_LEDGER_INVALID", "ORODI_LEDGER_DUPLICATE", "ORODI_EVIDENCE_STATE_INVALID"} for item in findings) else "missing"
    elif non_passing:
        claim_state = non_passing[0] if len(non_passing) == 1 else "inconclusive"
    else:
        claim_state = "passed"
    return {
        "schema_version": "auth.orodi-ledger-evaluation/v1-candidate",
        "verdict": "pass" if claim_state == "passed" and not findings else "reject",
        "claim_state": claim_state,
        "required_ids": list(required_ids),
        "state_counts": state_counts,
        "non_passing_states": non_passing,
        "findings": sorted(findings, key=lambda item: (item["code"], item["detail"])),
        "authority_effect": "none",
    }


def evaluate_telemetry(accounting: Any) -> dict[str, Any]:
    keys = ("offered", "queued", "rejected", "exported", "dropped", "pending")
    if not isinstance(accounting, dict) or any(not isinstance(accounting.get(key), int) or isinstance(accounting.get(key), bool) or accounting[key] < 0 for key in keys):
        return {"state": "invalid", "conserved": False, "findings": ["ORODI_TELEMETRY_ACCOUNTING_INVALID"], "authority_effect": "none"}
    offered_closed = accounting["offered"] == accounting["queued"] + accounting["rejected"]
    queued_closed = accounting["queued"] == accounting["exported"] + accounting["dropped"] + accounting["pending"]
    conserved = offered_closed and queued_closed
    return {
        "state": "passed" if conserved else "inconclusive",
        "conserved": conserved,
        "offered_closed": offered_closed,
        "queued_closed": queued_closed,
        "required_drops_zero": accounting["dropped"] == 0,
        "findings": [] if conserved else ["ORODI_TELEMETRY_CONSERVATION_OPEN"],
        "authority_effect": "none",
    }


def _timestamp(value: Any) -> datetime | None:
    if not isinstance(value, str):
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed if parsed.tzinfo is not None else parsed.replace(tzinfo=timezone.utc)


def evaluate_rollback(inventory: Any, observations: Any, deadline: str) -> dict[str, Any]:
    findings: list[str] = []
    if not isinstance(inventory, list) or not inventory:
        return {"state": "invalid", "restored": False, "findings": ["ORODI_ROLLBACK_INVENTORY_INVALID"], "authority_effect": "none"}
    if not isinstance(observations, list):
        observations = []
    inventory_ids = [item.get("resource_id") for item in inventory if isinstance(item, dict)]
    observation_ids = [item.get("resource_id") for item in observations if isinstance(item, dict)]
    if len(inventory_ids) != len(set(inventory_ids)) or len(observation_ids) != len(set(observation_ids)):
        findings.append("ORODI_ROLLBACK_DUPLICATE_RESOURCE")
    deadline_at = _timestamp(deadline)
    if deadline_at is None:
        findings.append("ORODI_ROLLBACK_DEADLINE_INVALID")
    observed = {item.get("resource_id"): item for item in observations if isinstance(item, dict)}
    for resource in inventory:
        if not isinstance(resource, dict) or not isinstance(resource.get("resource_id"), str):
            findings.append("ORODI_ROLLBACK_INVENTORY_INVALID")
            continue
        item = observed.get(resource["resource_id"])
        if item is None:
            findings.append(f"ORODI_ROLLBACK_OBSERVATION_MISSING:{resource['resource_id']}")
            continue
        if item.get("candidate_refs") != 0:
            findings.append(f"ORODI_ROLLBACK_CANDIDATE_REFERENCE_SURVIVES:{resource['resource_id']}")
        if item.get("stable_digest") != resource.get("expected_stable_digest"):
            findings.append(f"ORODI_ROLLBACK_STABLE_IDENTITY_MISMATCH:{resource['resource_id']}")
        if item.get("critical_outcomes_restored") is not True:
            findings.append(f"ORODI_ROLLBACK_CRITICAL_OUTCOME_MISSING:{resource['resource_id']}")
        observed_at = _timestamp(item.get("observed_at"))
        if deadline_at is not None and (observed_at is None or observed_at > deadline_at):
            findings.append(f"ORODI_ROLLBACK_DEADLINE_EXCEEDED:{resource['resource_id']}")
    extras = sorted(set(observation_ids) - set(inventory_ids))
    if extras:
        findings.append(f"ORODI_ROLLBACK_INVENTORY_INCOMPLETE:{','.join(extras)}")
    invalid = any("INVALID" in item or "DUPLICATE" in item for item in findings)
    missing = any("MISSING" in item for item in findings)
    state = "passed" if not findings else ("invalid" if invalid else ("inconclusive" if missing else "failed"))
    return {
        "schema_version": "auth.orodi-rollback-restoration-result/v1-candidate",
        "state": state,
        "restored": state == "passed",
        "inventory_count": len(inventory),
        "observation_count": len(observations),
        "findings": sorted(findings),
        "authority_effect": "none",
    }


def load_json(path: str | Path) -> Any:
    import json

    return json.loads(Path(path).read_text(encoding="utf-8"))
