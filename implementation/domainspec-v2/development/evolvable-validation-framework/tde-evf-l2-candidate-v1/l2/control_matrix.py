from __future__ import annotations

import base64
import copy
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from l2.hardening import evaluate
from tde.neutral_obligation import digest_value


def _redigest(receipt: dict[str, Any]) -> None:
    payload = {key: value for key, value in receipt.items() if key != "receipt_digest"}
    receipt["receipt_digest"] = digest_value(payload)


def _alloy_counterexample(receipt: dict[str, Any]) -> None:
    execution = receipt["execution"]
    raw = json.loads(base64.b64decode(execution["receipt_json_base64"]))
    solution = {
        "duration": 0,
        "utctime": "l2-negative-control",
        "instances": [{"values": {"Violation": {"tuples": [["N0"]]}}}],
    }
    raw["commands"]["NoViolation"].pop("status", None)
    raw["commands"]["NoViolation"]["solution"] = [solution]
    execution["receipt_json_base64"] = base64.b64encode(
        json.dumps(raw, sort_keys=True).encode()
    ).decode()
    execution["solution_files"] = [{
        "name": "NoViolation-solution-0.json",
        "bytes_base64": base64.b64encode(json.dumps(solution, sort_keys=True).encode()).decode(),
    }]
    receipt["native_result"]["solution_count"] = 1
    receipt["native_result"]["counterexamples"] = [solution]
    receipt["normalized_outcome"] = "counterexample"
    _redigest(receipt)


def _alloy_unresolved(receipt: dict[str, Any]) -> None:
    execution = receipt["execution"]
    raw = json.loads(base64.b64decode(execution["receipt_json_base64"]))
    command = raw["commands"]["NoViolation"]
    command.pop("solution", None)
    command["status"] = "unknown"
    execution["receipt_json_base64"] = base64.b64encode(
        json.dumps(raw, sort_keys=True).encode()
    ).decode()
    execution["solution_files"] = []
    receipt["native_result"]["solution_count"] = None
    receipt["native_result"]["counterexamples"] = []
    receipt["normalized_outcome"] = "unresolved"
    _redigest(receipt)


def run_matrix(
    repo: Path,
    obligation: dict[str, Any],
    facts: dict[str, Any],
    translations: dict[str, str],
    runtime_binding: dict[str, Any],
    receipts: dict[str, dict[str, Any]],
    *,
    evaluated_at: datetime,
) -> dict[str, Any]:
    cases: list[tuple[str, str, dict[str, Any]]] = []

    cases.append(("positive-control", "SUPPORTED_BOUNDED", {}))
    cases.append(("identical-replay", "SUPPORTED_BOUNDED", {}))
    cases.append(("missing-alloy-evidence", "NOT_EVALUABLE", {"receipts": {"alloy": None}}))
    cases.append(("souffle-timeout", "NOT_EVALUABLE", {
        "receipts": {"souffle": None}, "failures": {"souffle": "souffle-timeout"},
    }))
    cases.append(("alloy-malformed-output", "BLOCK", {
        "receipts": {"alloy": None}, "failures": {"alloy": "alloy-malformed-output"},
    }))

    tampered = copy.deepcopy(receipts["souffle"])
    tampered["normalized_outcome"] = "counterexample"
    cases.append(("receipt-tamper", "BLOCK", {"receipts": {"souffle": tampered}}))

    stale = copy.deepcopy(receipts["souffle"])
    stale_time = evaluated_at - timedelta(days=1)
    stale["execution"]["started_at"] = stale_time.isoformat()
    stale["execution"]["finished_at"] = stale_time.isoformat()
    stale["all_current"] = True
    _redigest(stale)
    cases.append(("stale-with-forged-all-current", "NOT_EVALUABLE", {"receipts": {"souffle": stale}}))

    runtime_drift = copy.deepcopy(receipts["souffle"])
    runtime_drift["provider"]["runtime_sha256"] = "0" * 64
    _redigest(runtime_drift)
    cases.append(("runtime-drift", "BLOCK", {"receipts": {"souffle": runtime_drift}}))

    replay = copy.deepcopy(receipts["alloy"])
    replay["obligation_id"] = "tde.obligation.replayed-from-another-subject"
    _redigest(replay)
    cases.append(("cross-obligation-replay", "BLOCK", {"receipts": {"alloy": replay}}))

    malformed = copy.deepcopy(receipts["alloy"])
    malformed["execution"]["receipt_json_base64"] = "not-base64"
    _redigest(malformed)
    cases.append(("malformed-raw-output", "BLOCK", {"receipts": {"alloy": malformed}}))

    oversized = copy.deepcopy(receipts["alloy"])
    oversized["execution"]["max_output_bytes"] = 1
    _redigest(oversized)
    cases.append(("declared-output-limit-exceeded", "BLOCK", {"receipts": {"alloy": oversized}}))

    expanded_limit = copy.deepcopy(receipts["alloy"])
    expanded_limit["execution"]["max_output_bytes"] = 2_097_152
    _redigest(expanded_limit)
    cases.append(("declared-output-limit-expanded", "BLOCK", {"receipts": {"alloy": expanded_limit}}))

    disagreement = copy.deepcopy(receipts["alloy"])
    _alloy_counterexample(disagreement)
    cases.append(("provider-disagreement", "CONFLICT", {"receipts": {"alloy": disagreement}}))

    unresolved = copy.deepcopy(receipts["alloy"])
    _alloy_unresolved(unresolved)
    cases.append(("provider-unresolved", "NOT_EVALUABLE", {"receipts": {"alloy": unresolved}}))

    cases.append(("adapter-translation-mutation", "BLOCK", {
        "translations": {"alloy": "0" * 64},
    }))

    stale_subject = copy.deepcopy(obligation)
    stale_subject["property_definition_ref"]["sha256"] = "0" * 64
    payload = {key: value for key, value in stale_subject.items() if key != "obligation_id"}
    stale_subject["obligation_id"] = f"tde.obligation.{digest_value(payload)}"
    cases.append(("selected-source-stale", "BLOCK", {"obligation": stale_subject}))

    results: list[dict[str, Any]] = []
    replay_digest: str | None = None
    for control_id, expected_status, overrides in cases:
        case_receipts = copy.deepcopy(receipts)
        case_receipts.update(overrides.get("receipts", {}))
        case_translations = dict(translations)
        case_translations.update(overrides.get("translations", {}))
        evaluation = evaluate(
            repo,
            overrides.get("obligation", obligation),
            facts,
            case_translations,
            runtime_binding,
            case_receipts,
            failures=overrides.get("failures"),
            evaluated_at=evaluated_at,
        )
        passed = evaluation["status"] == expected_status and (
            expected_status != "SUPPORTED_BOUNDED" or not evaluation["residue"]
        )
        if control_id == "positive-control":
            replay_digest = evaluation["evaluation_digest"]
        if control_id == "identical-replay":
            passed = passed and evaluation["evaluation_digest"] == replay_digest
        results.append({
            "control_id": control_id,
            "expected_status": expected_status,
            "actual_status": evaluation["status"],
            "passed": passed,
            "residue": evaluation["residue"],
        })

    return {
        "schema_version": "evf.l2-negative-control-matrix/v1",
        "collect_all": True,
        "controls": results,
        "all_controls_passed": all(item["passed"] for item in results),
        "authority_effect": "none",
    }
