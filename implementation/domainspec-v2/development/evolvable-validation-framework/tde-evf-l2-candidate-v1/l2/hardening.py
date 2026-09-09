from __future__ import annotations

import base64
import hashlib
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

from tde.neutral_obligation import digest_value


PROVIDERS = ("souffle", "alloy")
OUTCOMES = {"counterexample", "no-counterexample", "unresolved"}


def _check(
    checks: list[dict[str, Any]],
    check_id: str,
    status: str,
    *,
    blockers: list[str] | None = None,
) -> None:
    checks.append({
        "check_id": check_id,
        "status": status,
        "blockers": sorted(set(blockers or [])),
    })


def _decode(value: object) -> bytes:
    if not isinstance(value, str):
        raise ValueError("raw output is not base64 text")
    return base64.b64decode(value, validate=True)


def _timestamp(value: object) -> datetime:
    if not isinstance(value, str):
        raise ValueError("timestamp is not text")
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise ValueError("timestamp has no timezone")
    return parsed.astimezone(timezone.utc)


def _receipt_digest_valid(receipt: dict[str, Any]) -> bool:
    payload = {key: value for key, value in receipt.items() if key != "receipt_digest"}
    return receipt.get("receipt_digest") == digest_value(payload)


def _exact_ref_current(repo: Path, ref: object) -> bool:
    if not isinstance(ref, dict):
        return False
    relative = ref.get("path")
    expected_hash = ref.get("sha256")
    expected_size = ref.get("size_bytes")
    if not isinstance(relative, str) or "#synthetic-negative-control" in relative:
        return False
    path = repo / relative
    if not path.is_file():
        return False
    data = path.read_bytes()
    return hashlib.sha256(data).hexdigest() == expected_hash and len(data) == expected_size


def _subject_checks(
    repo: Path,
    obligation: dict[str, Any],
    facts: dict[str, Any],
    checks: list[dict[str, Any]],
) -> list[str]:
    findings: list[str] = []
    fact_digest_current = obligation.get("fact_manifest_digest") == digest_value(facts)
    _check(checks, "subject.fact-manifest-digest-current", "PASS" if fact_digest_current else "FAIL")
    if not fact_digest_current:
        findings.append("fact-manifest-digest-drift")

    obligation_payload = {key: value for key, value in obligation.items() if key != "obligation_id"}
    obligation_current = obligation.get("obligation_id") == f"tde.obligation.{digest_value(obligation_payload)}"
    _check(checks, "subject.obligation-identity-current", "PASS" if obligation_current else "FAIL")
    if not obligation_current:
        findings.append("obligation-identity-drift")

    refs = [obligation.get("property_definition_ref"), *facts.get("selected_source_refs", [])]
    stale_refs = [
        ref.get("path", "malformed-ref") if isinstance(ref, dict) else "malformed-ref"
        for ref in refs
        if not _exact_ref_current(repo, ref)
    ]
    _check(
        checks,
        "subject.selected-source-bytes-current",
        "PASS" if not stale_refs else "FAIL",
        blockers=[f"stale:{item}" for item in stale_refs],
    )
    if stale_refs:
        findings.append("selected-source-bytes-stale")
    return findings


def _raw_output_findings(provider: str, receipt: dict[str, Any]) -> list[str]:
    execution = receipt.get("execution")
    if not isinstance(execution, dict):
        return [f"{provider}-execution-record-malformed"]
    try:
        stdout = _decode(execution.get("stdout_base64"))
        stderr = _decode(execution.get("stderr_base64"))
        raw_size = len(stdout) + len(stderr)
        if provider == "souffle":
            violation = _decode(execution.get("violation_csv_base64"))
            raw_size += len(violation)
            expected = {
                "stdout_sha256": hashlib.sha256(stdout).hexdigest(),
                "stderr_sha256": hashlib.sha256(stderr).hexdigest(),
                "violation_csv_sha256": hashlib.sha256(violation).hexdigest(),
            }
            if any(execution.get(key) != value for key, value in expected.items()):
                return ["souffle-raw-output-digest-invalid"]
            rows = [line for line in violation.decode().splitlines() if line]
            raw_outcome = "counterexample" if rows else "no-counterexample"
            if receipt.get("normalized_outcome") != raw_outcome or receipt.get("native_result", {}).get("violation_rows") != rows:
                return ["souffle-normalized-result-mismatch"]
        else:
            alloy_receipt = _decode(execution.get("receipt_json_base64"))
            parsed = json.loads(alloy_receipt)
            if not isinstance(parsed, dict):
                return ["alloy-raw-receipt-malformed"]
            raw_size += len(alloy_receipt)
            files = execution.get("solution_files")
            if not isinstance(files, list):
                return ["alloy-solution-file-list-malformed"]
            names: list[str] = []
            decoded_solutions: list[dict[str, Any]] = []
            for item in files:
                if not isinstance(item, dict) or not isinstance(item.get("name"), str):
                    return ["alloy-solution-file-malformed"]
                names.append(item["name"])
                decoded = _decode(item.get("bytes_base64"))
                raw_size += len(decoded)
                solution = json.loads(decoded)
                if not isinstance(solution, dict):
                    return ["alloy-solution-file-malformed"]
                decoded_solutions.append(solution)
            if len(names) != len(set(names)):
                return ["alloy-solution-file-denominator-invalid"]
            command = parsed.get("commands", {}).get("NoViolation", {})
            summaries = command.get("solution", [])
            if not isinstance(summaries, list) or summaries != decoded_solutions:
                return ["alloy-raw-solution-mismatch"]
            raw_outcome = "unresolved" if command.get("status") == "unknown" else ("counterexample" if summaries else "no-counterexample")
            native = receipt.get("native_result", {})
            if receipt.get("normalized_outcome") != raw_outcome or native.get("solution_count") != (None if raw_outcome == "unresolved" else len(summaries)):
                return ["alloy-normalized-result-mismatch"]
        maximum = execution.get("max_output_bytes")
        if not isinstance(maximum, int) or maximum <= 0 or raw_size > maximum:
            return [f"{provider}-output-limit-invalid"]
    except (ValueError, TypeError, json.JSONDecodeError):
        return [f"{provider}-raw-output-malformed"]
    return []


def _provider_checks(
    provider: str,
    receipt: dict[str, Any] | None,
    obligation: dict[str, Any],
    facts: dict[str, Any],
    expected_translation_digest: str,
    runtime_binding: dict[str, Any],
    evaluated_at: datetime,
    max_age_seconds: int,
    max_timeout_seconds: int,
    max_output_bytes: int,
    checks: list[dict[str, Any]],
) -> list[str]:
    findings: list[str] = []
    prefix = f"provider.{provider}"
    if receipt is None:
        _check(checks, f"{prefix}.receipt-present", "FAIL", blockers=[f"missing-{provider}-evidence"])
        for dependent in ("digest-valid", "binding-current", "raw-output-valid", "limits-current", "fresh", "exact-evidence"):
            _check(checks, f"{prefix}.{dependent}", "NOT_EVALUABLE", blockers=[f"missing-{provider}-evidence"])
        return [f"missing-{provider}-evidence"]
    _check(checks, f"{prefix}.receipt-present", "PASS")

    digest_valid = _receipt_digest_valid(receipt)
    _check(checks, f"{prefix}.digest-valid", "PASS" if digest_valid else "FAIL")
    if not digest_valid:
        findings.append(f"{provider}-receipt-digest-invalid")

    provider_record = receipt.get("provider")
    execution = receipt.get("execution")
    provider_record = provider_record if isinstance(provider_record, dict) else {}
    execution = execution if isinstance(execution, dict) else {}
    expected_id = provider
    bindings = runtime_binding.get("runtimes", {})
    provider_binding = bindings.get(provider, {}) if isinstance(bindings, dict) else {}
    binding_current = (
        receipt.get("obligation_id") == obligation.get("obligation_id")
        and receipt.get("fact_manifest_digest") == obligation.get("fact_manifest_digest")
        and receipt.get("source_facts_digest") == facts.get("facts_digest")
        and receipt.get("translation_digest") == expected_translation_digest
        and provider_record.get("id") == expected_id
    )
    if provider == "souffle":
        binding_current = binding_current and provider_record.get("runtime_sha256") == provider_binding.get("sha256")
    else:
        java_binding = bindings.get("java", {}) if isinstance(bindings, dict) else {}
        binding_current = (
            binding_current
            and provider_record.get("alloy_jar_sha256") == provider_binding.get("sha256")
            and provider_record.get("java_sha256") == java_binding.get("sha256")
            and provider_record.get("solver") == provider_binding.get("solver")
        )
    _check(checks, f"{prefix}.binding-current", "PASS" if binding_current else "FAIL")
    if not binding_current:
        findings.append(f"{provider}-binding-drift")

    raw_findings = _raw_output_findings(provider, receipt)
    _check(
        checks,
        f"{prefix}.raw-output-valid",
        "PASS" if not raw_findings else "FAIL",
        blockers=raw_findings,
    )
    findings.extend(raw_findings)

    timeout_limit = execution.get("timeout_seconds")
    output_limit = execution.get("max_output_bytes")
    limits_current = (
        isinstance(timeout_limit, int)
        and 0 < timeout_limit <= max_timeout_seconds
        and isinstance(output_limit, int)
        and 0 < output_limit <= max_output_bytes
    )
    _check(checks, f"{prefix}.limits-current", "PASS" if limits_current else "FAIL")
    if not limits_current:
        findings.append(f"{provider}-execution-limit-drift")

    try:
        started = _timestamp(execution.get("started_at"))
        finished = _timestamp(execution.get("finished_at"))
        fresh = started <= finished <= evaluated_at and (evaluated_at - finished).total_seconds() <= max_age_seconds
    except (ValueError, TypeError):
        fresh = False
    _check(checks, f"{prefix}.fresh", "PASS" if fresh else "FAIL")
    if not fresh:
        findings.append(f"{provider}-evidence-stale")

    exact = receipt.get("receipt_kind") == "provider-evidence"
    _check(checks, f"{prefix}.exact-evidence", "PASS" if exact else "FAIL")
    if not exact:
        findings.append(f"exact-{provider}-evidence-missing")

    if execution.get("exit_code") != 0:
        findings.append(f"{provider}-execution-not-successful")
    if receipt.get("normalized_outcome") not in OUTCOMES:
        findings.append(f"{provider}-outcome-malformed")
    return findings


def capture_provider(provider: str, invocation: Callable[[], dict[str, Any]]) -> dict[str, Any]:
    """Turn a provider exception into typed non-pass evidence for collect-all evaluation."""
    try:
        return {"provider": provider, "receipt": invocation(), "failure": None}
    except subprocess.TimeoutExpired:
        return {"provider": provider, "receipt": None, "failure": f"{provider}-timeout"}
    except ValueError as exc:
        message = str(exc).lower()
        code = f"{provider}-output-limit" if "exceeds declared limit" in message else f"{provider}-malformed-output"
        return {"provider": provider, "receipt": None, "failure": code}


def evaluate(
    repo: Path,
    obligation: dict[str, Any],
    facts: dict[str, Any],
    translations: dict[str, str],
    runtime_binding: dict[str, Any],
    receipts: dict[str, dict[str, Any] | None],
    *,
    failures: dict[str, str] | None = None,
    evaluated_at: datetime | None = None,
    max_age_seconds: int = 300,
    max_timeout_seconds: int = 30,
    max_output_bytes: int = 1_048_576,
) -> dict[str, Any]:
    now = (evaluated_at or datetime.now(timezone.utc)).astimezone(timezone.utc)
    checks: list[dict[str, Any]] = []
    findings = _subject_checks(repo, obligation, facts, checks)
    failures = failures or {}
    for provider in PROVIDERS:
        failure = failures.get(provider)
        receipt = receipts.get(provider)
        if failure:
            _check(checks, f"provider.{provider}.execution", "FAIL", blockers=[failure])
            receipt = None
            findings.append(failure)
        else:
            _check(checks, f"provider.{provider}.execution", "PASS" if receipt else "NOT_EVALUABLE")
        findings.extend(_provider_checks(
            provider,
            receipt,
            obligation,
            facts,
            translations.get(provider, ""),
            runtime_binding,
            now,
            max_age_seconds,
            max_timeout_seconds,
            max_output_bytes,
            checks,
        ))

    comparable_blockers = [
        item for item in findings
        if item.endswith(("digest-invalid", "binding-drift", "limit-drift", "malformed", "limit-invalid", "mismatch"))
        or "malformed-output" in item
        or "output-limit" in item
        or item in {"fact-manifest-digest-drift", "obligation-identity-drift"}
    ]
    comparable = not comparable_blockers and all(receipts.get(item) is not None for item in PROVIDERS)
    _check(
        checks,
        "join.comparable",
        "PASS" if comparable else "NOT_EVALUABLE",
        blockers=comparable_blockers or [item for item in findings if item.startswith("missing-") or item.endswith("timeout")],
    )
    outcomes = {provider: receipts.get(provider, {}).get("normalized_outcome") if receipts.get(provider) else None for provider in PROVIDERS}
    if comparable and "unresolved" in outcomes.values():
        _check(checks, "join.outcomes-consistent", "NOT_EVALUABLE", blockers=["provider-outcome-unresolved"])
        findings.append("provider-outcome-unresolved")
    elif comparable and len(set(outcomes.values())) == 1:
        _check(checks, "join.outcomes-consistent", "PASS")
    elif comparable:
        _check(checks, "join.outcomes-consistent", "FAIL", blockers=["provider-disagreement-no-vote"])
        findings.append("provider-disagreement-no-vote")
    else:
        _check(checks, "join.outcomes-consistent", "NOT_EVALUABLE", blockers=["provider-evidence-not-comparable"])

    findings = sorted(set(findings))
    hard_block = any(
        item.endswith(("digest-invalid", "binding-drift", "limit-drift", "malformed", "limit-invalid", "mismatch", "not-successful"))
        or "malformed-output" in item
        or "output-limit" in item
        or item in {"fact-manifest-digest-drift", "obligation-identity-drift"}
        for item in findings
    )
    if hard_block:
        status, consistency = "BLOCK", "invalid-or-tampered"
    elif "provider-disagreement-no-vote" in findings:
        status, consistency = "CONFLICT", "provider-disagreement"
    elif any(item.endswith("evidence-stale") or item == "selected-source-bytes-stale" for item in findings):
        status, consistency = "NOT_EVALUABLE", "stale"
    elif any(item.startswith("missing-") or item.endswith("timeout") or item.startswith("exact-") for item in findings):
        status, consistency = "NOT_EVALUABLE", "incomplete"
    elif "unresolved" in outcomes.values():
        status, consistency = "NOT_EVALUABLE", "unresolved"
    elif "counterexample" in outcomes.values():
        status, consistency = "COUNTEREXAMPLE", "counterexample-consistent"
    else:
        status, consistency = "SUPPORTED_BOUNDED", "no-counterexample-consistent-under-declared-bounds"

    payload = {
        "schema_version": "evf.l2-hardening-evaluation/v1",
        "obligation_id": obligation.get("obligation_id"),
        "evaluated_at": now.isoformat(),
        "freshness_limit_seconds": max_age_seconds,
        "checks": checks,
        "provider_receipt_digests": {
            provider: receipts.get(provider, {}).get("receipt_digest") if receipts.get(provider) else None
            for provider in PROVIDERS
        },
        "mapped_results": outcomes,
        "status": status,
        "consistency_class": consistency,
        "residue": findings,
        "collect_all": True,
        "voting": "forbidden",
        "authority_effect": "none",
        "product_approval": "not-granted",
        "runtime_admission": "not-granted",
        "release_admission": "not-granted",
        "claim_ceiling": "Reliability of two exact bounded observations for one obligation only.",
    }
    return {**payload, "evaluation_digest": digest_value(payload)}
