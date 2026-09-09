#!/usr/bin/env python3
"""Regression checks for unknowns, action scoring, evidence kinds, and pilot shape."""

from __future__ import annotations

import copy
import json
import tempfile
from pathlib import Path

from validate_run import validate_path, validate_row


FIXTURE = Path(__file__).resolve().parent / "fixtures/pass.jsonl"


def has(errors: list[str], marker: str) -> bool:
    return any(marker in error for error in errors)


def main() -> int:
    rows = [json.loads(line) for line in FIXTURE.read_text(encoding="utf-8").splitlines() if line.strip()]
    failures: list[str] = []

    honest_unknown = copy.deepcopy(rows[0])
    honest_unknown["status"] = "protocol_deviation"
    honest_unknown["timing"]["rework_minutes"] = None
    honest_unknown["unknown_fields"] = ["timing.rework_minutes"]
    honest_unknown["deviations"] = ["rework observation unavailable"]
    if validate_row(honest_unknown, 1):
        failures.append("declared unknown was rejected")

    coerced_zero = copy.deepcopy(honest_unknown)
    coerced_zero["timing"]["rework_minutes"] = 0
    if not has(validate_row(coerced_zero, 1), "UNKNOWN_NOT_NULL"):
        failures.append("declared unknown encoded as zero was accepted")

    completed_unknown = copy.deepcopy(honest_unknown)
    completed_unknown["status"] = "completed"
    completed_unknown["deviations"] = []
    if not has(validate_row(completed_unknown, 1), "COMPLETED_UNKNOWN"):
        failures.append("completed row with unknown was accepted")

    wrong_action_flag = copy.deepcopy(rows[0])
    wrong_action_flag["outcomes"]["outcome_match"] = False
    if not has(validate_row(wrong_action_flag, 1), "OUTCOME_FLAG"):
        failures.append("incorrect outcome_match flag was accepted")

    mixed = copy.deepcopy(rows)
    mixed[0]["evidence_kind"] = "live_run"
    with tempfile.NamedTemporaryFile(mode="w", suffix=".jsonl", encoding="utf-8") as handle:
        for row in mixed:
            handle.write(json.dumps(row, separators=(",", ":")) + "\n")
        handle.flush()
        _, mixed_errors = validate_path(Path(handle.name))
    if not has(mixed_errors, "EVIDENCE_KIND_MIXED"):
        failures.append("mixed evidence kinds were accepted")

    _, live_errors = validate_path(FIXTURE, live_pilot=True)
    for marker in ("LIVE_PILOT_EVIDENCE_KIND", "LIVE_PILOT_CARDINALITY", "LIVE_PILOT_STRATA"):
        if not has(live_errors, marker):
            failures.append(f"live pilot check missing {marker}")

    too_few_cases = copy.deepcopy(rows)
    for row in too_few_cases:
        row["evidence_kind"] = "live_run"
    too_few_cases[0]["outcomes"]["hidden_cases_total"] = 2
    too_few_cases[0]["outcomes"]["hidden_cases_passed"] = 2
    with tempfile.NamedTemporaryFile(mode="w", suffix=".jsonl", encoding="utf-8") as handle:
        for row in too_few_cases:
            handle.write(json.dumps(row, separators=(",", ":")) + "\n")
        handle.flush()
        _, hidden_case_errors = validate_path(Path(handle.name), live_pilot=True)
    if not has(hidden_case_errors, "LIVE_PILOT_HIDDEN_CASE_MINIMUM"):
        failures.append("live pilot accepted fewer than three hidden cases")

    if failures:
        for failure in failures:
            print(failure)
        return 1
    print(json.dumps({
        "status": "pass",
        "checks": [
            "honest_unknown", "zero_not_unknown", "completed_has_no_unknown",
            "outcome_match", "evidence_kind_separation", "live_pilot_shape",
            "live_hidden_case_minimum",
        ],
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
