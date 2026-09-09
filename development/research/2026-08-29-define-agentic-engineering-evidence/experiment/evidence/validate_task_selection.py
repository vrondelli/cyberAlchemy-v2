#!/usr/bin/env python3
"""Validate pre-frozen task sampling and ambiguity classification."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any


SCHEMA_VERSION = "define-task-selection@1"
PROTOCOL_ID = "define-downstream-utility@1"
INCLUSION_KEYS = {
    "local_sandbox", "bounded_surface", "hidden_semantic_cases",
    "reviewable_meaning", "no_external_effects", "model_independence",
    "representation_parity", "privacy_safe",
}
EXCLUSION_KEYS = {
    "requires_open_decision", "semantics_indistinguishable_from_tests",
    "live_external_integration", "post_outcome_selection",
    "unstable_or_concurrent_bytes", "middle_ambiguity_band",
}
SCORE_KEYS = {
    "concept_meaning", "context_boundary", "ownership_authority", "valid_outcome",
}


def require(obj: Any, keys: set[str], prefix: str, errors: list[str]) -> bool:
    if not isinstance(obj, dict):
        errors.append(f"TYPE:{prefix}:expected-object")
        return False
    for key in sorted(keys):
        if key not in obj:
            errors.append(f"REQUIRED:{prefix}.{key}")
    return True


def classify(scores: dict[str, int]) -> str:
    total = sum(scores.values())
    if total <= 1 and 2 not in scores.values():
        return "low_ambiguity_control"
    if total >= 4 and 2 in scores.values():
        return "high_ambiguity"
    return "excluded_middle"


def validate_selection(payload: Any, live_pilot: bool = False) -> list[str]:
    errors: list[str] = []
    root_keys = {
        "schema_version", "protocol_id", "evidence_kind", "recorded_at",
        "recorded_by", "selection_locked_before_condition_outputs", "candidates",
    }
    if not require(payload, root_keys, "selection", errors):
        return errors
    if errors:
        return errors
    if payload["schema_version"] != SCHEMA_VERSION:
        errors.append("ENUM:selection.schema_version")
    if payload["protocol_id"] != PROTOCOL_ID:
        errors.append("ENUM:selection.protocol_id")
    if payload["evidence_kind"] not in {"synthetic_fixture", "live_run"}:
        errors.append("ENUM:selection.evidence_kind")
    if payload["selection_locked_before_condition_outputs"] is not True:
        errors.append("SELECTION_ORDER:selection.selection_locked_before_condition_outputs")

    candidates = payload["candidates"]
    if not isinstance(candidates, list) or not candidates:
        return errors + ["CARDINALITY:selection.candidates"]
    ids: list[str] = []
    selected: list[dict[str, Any]] = []
    candidate_keys = {
        "candidate_id", "repository_commit", "source_selectors",
        "inclusion_checks", "exclusion_checks", "ambiguity_scores",
        "classification", "classification_reason", "selected",
        "selection_reason", "condition_output_seen_before_selection",
        "hidden_case_count",
    }
    for index, candidate in enumerate(candidates):
        prefix = f"selection.candidates[{index}]"
        if not require(candidate, candidate_keys, prefix, errors):
            continue
        candidate_id = candidate.get("candidate_id")
        if not isinstance(candidate_id, str) or not candidate_id:
            errors.append(f"TYPE:{prefix}.candidate_id")
        else:
            ids.append(candidate_id)
        selectors = candidate.get("source_selectors")
        if not isinstance(selectors, list) or not selectors or any(not isinstance(item, str) or not item for item in selectors):
            errors.append(f"TYPE:{prefix}.source_selectors")
        inclusions = candidate.get("inclusion_checks")
        if not isinstance(inclusions, dict) or set(inclusions) != INCLUSION_KEYS or any(not isinstance(value, bool) for value in inclusions.values()):
            errors.append(f"INCLUSION_KEYS:{prefix}.inclusion_checks")
        exclusions = candidate.get("exclusion_checks")
        if not isinstance(exclusions, dict) or set(exclusions) != EXCLUSION_KEYS or any(not isinstance(value, bool) for value in exclusions.values()):
            errors.append(f"EXCLUSION_KEYS:{prefix}.exclusion_checks")
        scores = candidate.get("ambiguity_scores")
        if not isinstance(scores, dict) or set(scores) != SCORE_KEYS or any(not isinstance(value, int) or value < 0 or value > 2 for value in scores.values()):
            errors.append(f"AMBIGUITY_SCORES:{prefix}.ambiguity_scores")
        elif candidate.get("classification") != classify(scores):
            errors.append(f"AMBIGUITY_CLASS:{prefix}.classification")
        if not isinstance(candidate.get("selected"), bool):
            errors.append(f"TYPE:{prefix}.selected")
        if candidate.get("condition_output_seen_before_selection") is not False:
            errors.append(f"SELECTION_ORDER:{prefix}.condition_output_seen_before_selection")
        if candidate.get("selected") is True:
            selected.append(candidate)
            if isinstance(inclusions, dict) and not all(inclusions.values()):
                errors.append(f"SELECTED_INELIGIBLE:{prefix}.inclusion_checks")
            if isinstance(exclusions, dict) and any(exclusions.values()):
                errors.append(f"SELECTED_EXCLUDED:{prefix}.exclusion_checks")
            if candidate.get("classification") == "excluded_middle":
                errors.append(f"SELECTED_MIDDLE:{prefix}.classification")
            if not isinstance(candidate.get("hidden_case_count"), int) or candidate["hidden_case_count"] < 3:
                errors.append(f"HIDDEN_CASE_MINIMUM:{prefix}.hidden_case_count")
    if len(ids) != len(set(ids)):
        errors.append("UNIQUE:selection.candidates.candidate_id")

    if live_pilot:
        if payload["evidence_kind"] != "live_run":
            errors.append("LIVE_PILOT_EVIDENCE_KIND")
        if len(selected) != 6:
            errors.append("LIVE_PILOT_SELECTION_CARDINALITY")
        classes = {
            name: sum(candidate.get("classification") == name for candidate in selected)
            for name in ("low_ambiguity_control", "high_ambiguity")
        }
        if classes["low_ambiguity_control"] != 2 or classes["high_ambiguity"] != 4:
            errors.append("LIVE_PILOT_SELECTION_STRATA")
    return errors


def main() -> int:
    args = sys.argv[1:]
    live_pilot = False
    if args and args[0] == "--live-pilot":
        live_pilot = True
        args = args[1:]
    if len(args) != 1:
        print("usage: validate_task_selection.py [--live-pilot] <selection.json>", file=sys.stderr)
        return 2
    path = Path(args[0])
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"READ:{path}:{exc}", file=sys.stderr)
        return 1
    errors = validate_selection(payload, live_pilot=live_pilot)
    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        print(json.dumps({"status": "fail", "errors": len(errors)}))
        return 1
    selected = [candidate for candidate in payload["candidates"] if candidate["selected"]]
    print(json.dumps({
        "status": "pass",
        "candidates": len(payload["candidates"]),
        "selected": len(selected),
        "strata": {
            name: sum(candidate["classification"] == name for candidate in selected)
            for name in ("low_ambiguity_control", "high_ambiguity")
        },
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
