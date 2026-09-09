#!/usr/bin/env python3
"""Validate append-only JSONL rows for the prepared Define experiment."""

from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any


SCHEMA_VERSION = "define-downstream-utility-run-row@1"
PROTOCOL_ID = "define-downstream-utility@1"
CONDITIONS = {
    "ticket_only",
    "equivalent_notes",
    "definition_pack",
    "definition_pack_evidence_gate",
}
TASK_CLASSES = {"low_ambiguity_control", "high_ambiguity"}
OUTCOMES = {"implement", "abstain", "ask", "escalate"}
STATUSES = {"completed", "blocked", "protocol_deviation"}
EVIDENCE_KINDS = {"synthetic_fixture", "live_run"}
DIGEST_RE = re.compile(r"^[0-9a-f]{64}$")
RUBRIC_KEYS = {
    "goal_intent_fidelity",
    "concept_context_fidelity",
    "assumptions_questions",
    "source_traceability",
    "authority_limits",
    "implementation_tests",
}
UNKNOWN_NUMERIC_PATHS = {
    "timing.material_preparation_minutes",
    "timing.material_preparation_tokens",
    "timing.planning_minutes",
    "timing.implementation_minutes",
    "timing.review_minutes",
    "timing.rework_minutes",
    "timing.total_tokens",
    "timing.artifact_characters",
    "outcomes.scope_violations",
    "outcomes.owner_corrections",
    "outcomes.review_rejections",
}


def require(obj: dict[str, Any], keys: set[str], prefix: str, errors: list[str]) -> None:
    for key in sorted(keys):
        if key not in obj:
            errors.append(f"REQUIRED:{prefix}.{key}")


def number(value: Any, minimum: float = 0.0) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and value >= minimum


def digest(value: Any, nullable: bool = False) -> bool:
    if nullable and value is None:
        return True
    return isinstance(value, str) and DIGEST_RE.fullmatch(value) is not None


def validate_row(row: Any, line_no: int) -> list[str]:
    errors: list[str] = []
    p = f"line[{line_no}]"
    if not isinstance(row, dict):
        return [f"TYPE:{p}:expected-object"]

    require(
        row,
        {
            "schema_version", "protocol_id", "evidence_kind", "run_id",
            "task_id", "task_class", "condition", "repetition", "status",
            "frozen", "execution", "controls", "timing", "outcomes",
            "reviews", "review_adjudication", "unknown_fields", "deviations",
        },
        p,
        errors,
    )
    if errors:
        return errors

    if row["schema_version"] != SCHEMA_VERSION:
        errors.append(f"ENUM:{p}.schema_version")
    if row["protocol_id"] != PROTOCOL_ID:
        errors.append(f"ENUM:{p}.protocol_id")
    if row["evidence_kind"] not in EVIDENCE_KINDS:
        errors.append(f"ENUM:{p}.evidence_kind")
    if row["condition"] not in CONDITIONS:
        errors.append(f"ENUM:{p}.condition")
    if row["task_class"] not in TASK_CLASSES:
        errors.append(f"ENUM:{p}.task_class")
    if row["status"] not in STATUSES:
        errors.append(f"ENUM:{p}.status")
    if not isinstance(row["repetition"], int) or row["repetition"] < 1:
        errors.append(f"RANGE:{p}.repetition")

    unknown_fields = row["unknown_fields"]
    if not isinstance(unknown_fields, list) or any(not isinstance(item, str) for item in unknown_fields):
        errors.append(f"TYPE:{p}.unknown_fields")
        unknown_fields = []
    elif len(unknown_fields) != len(set(unknown_fields)):
        errors.append(f"UNIQUE:{p}.unknown_fields")
    for field in unknown_fields:
        if field not in UNKNOWN_NUMERIC_PATHS:
            errors.append(f"UNKNOWN_PATH:{p}.unknown_fields:{field}")
    if row["status"] == "completed" and unknown_fields:
        errors.append(f"COMPLETED_UNKNOWN:{p}.unknown_fields")

    frozen = row["frozen"] if isinstance(row["frozen"], dict) else {}
    require(
        frozen,
        {
            "repository_commit", "source_packet_digest", "fact_set_digest",
            "truth_card_digest", "task_selection_digest",
            "condition_manifest_digest", "condition_packet_digest",
            "definition_pack_digest", "gate_policy_digest", "frozen_at",
        },
        f"{p}.frozen",
        errors,
    )
    for key in (
        "source_packet_digest", "fact_set_digest", "truth_card_digest",
        "task_selection_digest", "condition_manifest_digest", "condition_packet_digest",
    ):
        if key in frozen and not digest(frozen[key]):
            errors.append(f"DIGEST:{p}.frozen.{key}")
    for key in ("definition_pack_digest", "gate_policy_digest"):
        if key in frozen and not digest(frozen[key], nullable=True):
            errors.append(f"DIGEST:{p}.frozen.{key}")

    execution = row["execution"] if isinstance(row["execution"], dict) else {}
    require(
        execution,
        {
            "model_id", "harness_id", "randomization_seed", "condition_order",
            "budget_id", "sandbox_id", "planner_session_id",
            "implementer_session_id", "tool_versions",
        },
        f"{p}.execution",
        errors,
    )
    if execution.get("planner_session_id") == execution.get("implementer_session_id"):
        errors.append(f"SESSION_SEPARATION:{p}.execution")
    if not isinstance(execution.get("randomization_seed"), int) or execution["randomization_seed"] < 0:
        errors.append(f"RANGE:{p}.execution.randomization_seed")
    if not isinstance(execution.get("condition_order"), list) or set(execution["condition_order"]) != CONDITIONS or len(execution["condition_order"]) != 4:
        errors.append(f"ORDER:{p}.execution.condition_order")

    controls = row["controls"] if isinstance(row["controls"], dict) else {}
    control_keys = {
        "truth_card_frozen_before_assignment",
        "task_class_frozen_before_assignment",
        "source_access_equal",
        "information_parity_checked",
        "clean_planner_session",
        "clean_implementer_session",
        "conversation_history_separated",
    }
    require(controls, control_keys, f"{p}.controls", errors)
    for key in control_keys:
        if key in controls and not isinstance(controls[key], bool):
            errors.append(f"TYPE:{p}.controls.{key}")
    always_true = control_keys - {"information_parity_checked"}
    for key in always_true:
        if controls.get(key) is not True:
            errors.append(f"CONTROL_FALSE:{p}.controls.{key}")
    if row["condition"] in {"equivalent_notes", "definition_pack", "definition_pack_evidence_gate"}:
        if controls.get("information_parity_checked") is not True:
            errors.append(f"PARITY:{p}.controls.information_parity_checked")

    timing = row["timing"] if isinstance(row["timing"], dict) else {}
    timing_keys = {
        "material_preparation_minutes", "material_preparation_tokens",
        "planning_minutes", "implementation_minutes", "review_minutes",
        "rework_minutes", "total_tokens", "artifact_characters",
    }
    require(timing, timing_keys, f"{p}.timing", errors)
    for key in timing_keys:
        path = f"timing.{key}"
        if key not in timing:
            continue
        if timing[key] is None:
            if path not in unknown_fields:
                errors.append(f"UNKNOWN_UNDECLARED:{p}.{path}")
        elif path in unknown_fields:
            errors.append(f"UNKNOWN_NOT_NULL:{p}.{path}")
        elif not number(timing[key]):
            errors.append(f"RANGE:{p}.timing.{key}")

    outcomes = row["outcomes"] if isinstance(row["outcomes"], dict) else {}
    outcome_keys = {
        "gold_outcome", "observed_outcome", "hidden_cases_total",
        "hidden_cases_passed", "semantic_defects",
        "weighted_semantic_defects", "unnecessary_change",
        "incorrect_abstention", "outcome_match", "scope_violations", "owner_corrections",
        "review_rejections",
    }
    require(outcomes, outcome_keys, f"{p}.outcomes", errors)
    if outcomes.get("gold_outcome") not in OUTCOMES:
        errors.append(f"ENUM:{p}.outcomes.gold_outcome")
    if outcomes.get("observed_outcome") not in OUTCOMES:
        errors.append(f"ENUM:{p}.outcomes.observed_outcome")
    total = outcomes.get("hidden_cases_total")
    passed = outcomes.get("hidden_cases_passed")
    if not isinstance(total, int) or total < 0:
        errors.append(f"RANGE:{p}.outcomes.hidden_cases_total")
    if not isinstance(passed, int) or passed < 0 or not isinstance(total, int) or passed > total:
        errors.append(f"RANGE:{p}.outcomes.hidden_cases_passed")
    defects = outcomes.get("semantic_defects")
    if not isinstance(defects, dict):
        errors.append(f"TYPE:{p}.outcomes.semantic_defects")
    else:
        require(defects, {"critical", "major", "minor"}, f"{p}.outcomes.semantic_defects", errors)
        if all(isinstance(defects.get(k), int) and defects[k] >= 0 for k in ("critical", "major", "minor")):
            expected_weight = 5 * defects["critical"] + 2 * defects["major"] + defects["minor"]
            if outcomes.get("weighted_semantic_defects") != expected_weight:
                errors.append(f"WEIGHT:{p}.outcomes.weighted_semantic_defects")
        else:
            errors.append(f"RANGE:{p}.outcomes.semantic_defects")
    for key in ("scope_violations", "owner_corrections", "review_rejections"):
        path = f"outcomes.{key}"
        value = outcomes.get(key)
        if value is None:
            if path not in unknown_fields:
                errors.append(f"UNKNOWN_UNDECLARED:{p}.{path}")
        elif path in unknown_fields:
            errors.append(f"UNKNOWN_NOT_NULL:{p}.{path}")
        elif not isinstance(value, int) or value < 0:
            errors.append(f"RANGE:{p}.outcomes.{key}")
    for key in ("unnecessary_change", "incorrect_abstention"):
        if not isinstance(outcomes.get(key), bool):
            errors.append(f"TYPE:{p}.outcomes.{key}")
    expected_unnecessary = outcomes.get("gold_outcome") != "implement" and outcomes.get("observed_outcome") == "implement"
    expected_incorrect_abstention = outcomes.get("gold_outcome") == "implement" and outcomes.get("observed_outcome") == "abstain"
    expected_match = outcomes.get("gold_outcome") == outcomes.get("observed_outcome")
    if outcomes.get("unnecessary_change") != expected_unnecessary:
        errors.append(f"OUTCOME_FLAG:{p}.outcomes.unnecessary_change")
    if outcomes.get("incorrect_abstention") != expected_incorrect_abstention:
        errors.append(f"OUTCOME_FLAG:{p}.outcomes.incorrect_abstention")
    if outcomes.get("outcome_match") != expected_match:
        errors.append(f"OUTCOME_FLAG:{p}.outcomes.outcome_match")

    reviews = row["reviews"]
    if not isinstance(reviews, list) or len(reviews) != 2:
        errors.append(f"CARDINALITY:{p}.reviews")
    else:
        reviewer_ids: set[str] = set()
        for index, review in enumerate(reviews):
            rp = f"{p}.reviews[{index}]"
            if not isinstance(review, dict):
                errors.append(f"TYPE:{rp}")
                continue
            require(
                review,
                {
                    "reviewer_id", "blind_to_condition", "plan_rubric",
                    "plan_total", "comprehension_score", "accepted",
                    "condition_guess", "guess_confidence",
                },
                rp,
                errors,
            )
            reviewer_id = review.get("reviewer_id")
            if not isinstance(reviewer_id, str) or not reviewer_id:
                errors.append(f"TYPE:{rp}.reviewer_id")
            elif reviewer_id in reviewer_ids:
                errors.append(f"UNIQUE:{p}.reviews.reviewer_id")
            else:
                reviewer_ids.add(reviewer_id)
            if review.get("blind_to_condition") is not True:
                errors.append(f"BLINDING:{rp}.blind_to_condition")
            rubric = review.get("plan_rubric")
            if not isinstance(rubric, dict) or set(rubric) != RUBRIC_KEYS:
                errors.append(f"RUBRIC_KEYS:{rp}.plan_rubric")
            elif any(not isinstance(v, int) or v < 0 or v > 2 for v in rubric.values()):
                errors.append(f"RUBRIC_RANGE:{rp}.plan_rubric")
            elif review.get("plan_total") != sum(rubric.values()):
                errors.append(f"RUBRIC_SUM:{rp}.plan_total")
            if not isinstance(review.get("comprehension_score"), int) or not 0 <= review["comprehension_score"] <= 4:
                errors.append(f"RANGE:{rp}.comprehension_score")
            if not isinstance(review.get("accepted"), bool):
                errors.append(f"TYPE:{rp}.accepted")
            if review.get("condition_guess") not in CONDITIONS | {"unknown"}:
                errors.append(f"ENUM:{rp}.condition_guess")
            if not number(review.get("guess_confidence")) or review["guess_confidence"] > 1:
                errors.append(f"RANGE:{rp}.guess_confidence")

    adjudication = row["review_adjudication"]
    if not isinstance(adjudication, dict):
        errors.append(f"TYPE:{p}.review_adjudication")
    else:
        require(
            adjudication,
            {"acceptance_disagreement", "resolution", "adjudicator_id", "note"},
            f"{p}.review_adjudication",
            errors,
        )
        accepted_values = [
            review.get("accepted") for review in reviews
            if isinstance(review, dict)
        ] if isinstance(reviews, list) else []
        expected_disagreement = len(accepted_values) == 2 and accepted_values[0] != accepted_values[1]
        if adjudication.get("acceptance_disagreement") != expected_disagreement:
            errors.append(f"ADJUDICATION_FLAG:{p}.review_adjudication")
        if adjudication.get("resolution") not in {"none", "preserved", "adjudicated"}:
            errors.append(f"ENUM:{p}.review_adjudication.resolution")
        if expected_disagreement and adjudication.get("resolution") == "none":
            errors.append(f"ADJUDICATION_MISSING:{p}.review_adjudication")
        if adjudication.get("resolution") == "adjudicated" and not adjudication.get("adjudicator_id"):
            errors.append(f"ADJUDICATOR_MISSING:{p}.review_adjudication")

    if not isinstance(row["deviations"], list):
        errors.append(f"TYPE:{p}.deviations")
    if row["status"] == "completed" and row["deviations"]:
        errors.append(f"STATUS_DEVIATION:{p}")
    if row["status"] != "completed" and not row["deviations"]:
        errors.append(f"STATUS_DEVIATION_MISSING:{p}")
    return errors


def validate_blocks(rows: list[dict[str, Any]]) -> list[str]:
    errors: list[str] = []
    blocks: dict[tuple[str, int], list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        if isinstance(row, dict) and isinstance(row.get("task_id"), str) and isinstance(row.get("repetition"), int):
            blocks[(row["task_id"], row["repetition"])].append(row)
    for key, block in blocks.items():
        prefix = f"block[{key[0]}:{key[1]}]"
        conditions = [row.get("condition") for row in block]
        if set(conditions) != CONDITIONS or len(conditions) != 4:
            errors.append(f"BLOCK_CONDITIONS:{prefix}")
            continue
        by_condition = {row["condition"]: row for row in block}
        shared_paths = (
            ("task_class",),
            ("evidence_kind",),
            ("frozen", "repository_commit"),
            ("frozen", "source_packet_digest"),
            ("frozen", "fact_set_digest"),
            ("frozen", "truth_card_digest"),
            ("frozen", "task_selection_digest"),
            ("frozen", "condition_manifest_digest"),
            ("execution", "model_id"),
            ("execution", "harness_id"),
            ("execution", "randomization_seed"),
            ("execution", "condition_order"),
            ("execution", "budget_id"),
            ("execution", "sandbox_id"),
            ("execution", "tool_versions"),
            ("outcomes", "hidden_cases_total"),
        )
        for path in shared_paths:
            values = []
            for row in block:
                value: Any = row
                for segment in path:
                    value = value.get(segment) if isinstance(value, dict) else None
                values.append(json.dumps(value, sort_keys=True))
            if len(set(values)) != 1:
                errors.append(f"BLOCK_SHARED:{prefix}:{'.'.join(path)}")
        ticket = by_condition["ticket_only"]["frozen"]
        notes = by_condition["equivalent_notes"]["frozen"]
        pack = by_condition["definition_pack"]["frozen"]
        gated = by_condition["definition_pack_evidence_gate"]["frozen"]
        if ticket["definition_pack_digest"] is not None or ticket["gate_policy_digest"] is not None:
            errors.append(f"CONDITION_BINDING:{prefix}:ticket_only")
        if notes["definition_pack_digest"] is not None or notes["gate_policy_digest"] is not None:
            errors.append(f"CONDITION_BINDING:{prefix}:equivalent_notes")
        if pack["definition_pack_digest"] is None or pack["gate_policy_digest"] is not None:
            errors.append(f"CONDITION_BINDING:{prefix}:definition_pack")
        if gated["definition_pack_digest"] != pack["definition_pack_digest"] or gated["gate_policy_digest"] is None:
            errors.append(f"CONDITION_BINDING:{prefix}:definition_pack_evidence_gate")
        reviewer_sets = {
            tuple(sorted(review["reviewer_id"] for review in row["reviews"]))
            for row in block
            if isinstance(row.get("reviews"), list) and len(row["reviews"]) == 2
        }
        if len(reviewer_sets) != 1:
            errors.append(f"BLOCK_REVIEWERS:{prefix}")
        session_ids = []
        for row in block:
            session_ids.extend([
                row["execution"]["planner_session_id"],
                row["execution"]["implementer_session_id"],
            ])
        if len(set(session_ids)) != 8:
            errors.append(f"BLOCK_SESSION_UNIQUENESS:{prefix}")
    return errors


def load_rows(path: Path) -> tuple[list[dict[str, Any]], list[str]]:
    rows: list[dict[str, Any]] = []
    errors: list[str] = []
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError as exc:
        return [], [f"READ:{path}:{exc}"]
    for line_no, line in enumerate(lines, start=1):
        if not line.strip():
            continue
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError as exc:
            errors.append(f"JSON:line[{line_no}]:{exc.msg}")
    if not rows:
        errors.append("CARDINALITY:no-rows")
    return rows, errors


def validate_path(path: Path, live_pilot: bool = False) -> tuple[list[dict[str, Any]], list[str]]:
    rows, errors = load_rows(path)
    for line_no, row in enumerate(rows, start=1):
        errors.extend(validate_row(row, line_no))
    if not errors:
        errors.extend(validate_blocks(rows))
    evidence_kinds = {
        row.get("evidence_kind") for row in rows
        if isinstance(row, dict) and row.get("evidence_kind") in EVIDENCE_KINDS
    }
    if len(evidence_kinds) > 1:
        errors.append("EVIDENCE_KIND_MIXED")
    session_ids = []
    for row in rows:
        execution = row.get("execution") if isinstance(row, dict) else None
        if isinstance(execution, dict):
            session_ids.extend([
                execution.get("planner_session_id"),
                execution.get("implementer_session_id"),
            ])
    if session_ids and len(session_ids) != len(set(session_ids)):
        errors.append("SESSION_UNIQUENESS_GLOBAL")
    if live_pilot:
        if evidence_kinds != {"live_run"}:
            errors.append("LIVE_PILOT_EVIDENCE_KIND")
        blocks = {
            (row.get("task_id"), row.get("repetition")) for row in rows
            if isinstance(row, dict)
        }
        task_ids = {row.get("task_id") for row in rows if isinstance(row, dict)}
        if len(rows) != 24 or len(blocks) != 6 or len(task_ids) != 6:
            errors.append("LIVE_PILOT_CARDINALITY")
        classes = {
            task_class: len({
                row.get("task_id") for row in rows
                if isinstance(row, dict) and row.get("task_class") == task_class
            })
            for task_class in TASK_CLASSES
        }
        if classes.get("low_ambiguity_control") != 2 or classes.get("high_ambiguity") != 4:
            errors.append("LIVE_PILOT_STRATA")
        if any(
            not isinstance(row, dict)
            or not isinstance(row.get("outcomes"), dict)
            or row["outcomes"].get("hidden_cases_total", 0) < 3
            for row in rows
        ):
            errors.append("LIVE_PILOT_HIDDEN_CASE_MINIMUM")
    return rows, errors


def main() -> int:
    args = sys.argv[1:]
    live_pilot = False
    if args and args[0] == "--live-pilot":
        live_pilot = True
        args = args[1:]
    if len(args) != 1:
        print("usage: validate_run.py [--live-pilot] <rows.jsonl>", file=sys.stderr)
        return 2
    path = Path(args[0])
    rows, errors = validate_path(path, live_pilot=live_pilot)
    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        print(json.dumps({"status": "fail", "rows": len(rows), "errors": len(errors)}))
        return 1
    print(json.dumps({"status": "pass", "rows": len(rows), "blocks": len(rows) // 4, "evidence_kinds": sorted({row["evidence_kind"] for row in rows})}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
