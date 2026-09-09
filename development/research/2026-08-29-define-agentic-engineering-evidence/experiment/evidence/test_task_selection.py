#!/usr/bin/env python3
"""Regression checks for ambiguity classification and live selection shape."""

from __future__ import annotations

import copy
import json
from pathlib import Path

from validate_task_selection import validate_selection


FIXTURE = Path(__file__).resolve().parent / "fixtures/task-selection-pass.json"


def has(errors: list[str], marker: str) -> bool:
    return any(marker in error for error in errors)


def main() -> int:
    base = json.loads(FIXTURE.read_text(encoding="utf-8"))
    failures: list[str] = []
    if validate_selection(base):
        failures.append("synthetic selection fixture was rejected")

    wrong_class = copy.deepcopy(base)
    wrong_class["candidates"][0]["classification"] = "low_ambiguity_control"
    if not has(validate_selection(wrong_class), "AMBIGUITY_CLASS"):
        failures.append("wrong ambiguity classification was accepted")

    too_few_cases = copy.deepcopy(base)
    too_few_cases["candidates"][0]["hidden_case_count"] = 2
    if not has(validate_selection(too_few_cases), "HIDDEN_CASE_MINIMUM"):
        failures.append("selected task with fewer than three hidden cases was accepted")

    live = copy.deepcopy(base)
    live["evidence_kind"] = "live_run"
    prototype = live["candidates"][0]
    live["candidates"] = []
    for index in range(6):
        candidate = copy.deepcopy(prototype)
        candidate["candidate_id"] = f"live-shape-task-{index + 1}"
        if index < 2:
            candidate["ambiguity_scores"] = {
                "concept_meaning": 0,
                "context_boundary": 0,
                "ownership_authority": 0,
                "valid_outcome": 0,
            }
            candidate["classification"] = "low_ambiguity_control"
            candidate["classification_reason"] = "Synthetic low-ambiguity shape check."
        live["candidates"].append(candidate)
    if validate_selection(live, live_pilot=True):
        failures.append("valid six-task live selection shape was rejected")

    if failures:
        for failure in failures:
            print(failure)
        return 1
    print(json.dumps({
        "status": "pass",
        "checks": ["classification", "hidden_case_minimum", "live_six_task_shape"],
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
