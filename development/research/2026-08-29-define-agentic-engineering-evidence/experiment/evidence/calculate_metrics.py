#!/usr/bin/env python3
"""Calculate descriptive, claim-bounded metrics from validated Define rows."""

from __future__ import annotations

import json
import sys
from collections import defaultdict
from pathlib import Path
from statistics import mean, median

from validate_run import CONDITIONS, validate_path


def summarize(rows: list[dict]) -> dict:
    evidence_kinds = sorted({row["evidence_kind"] for row in rows})
    if len(evidence_kinds) != 1:
        raise ValueError("mixed evidence kinds are not comparable")

    blocks: dict[tuple[str, int], list[dict]] = defaultdict(list)
    for row in rows:
        blocks[(row["task_id"], row["repetition"])].append(row)
    eligible_blocks = {
        key for key, block in blocks.items()
        if len(block) == 4
        and all(
            row["status"] == "completed"
            and not row["deviations"]
            and not row["unknown_fields"]
            for row in block
        )
    }

    eligible_rows = [
        row for row in rows
        if (row["task_id"], row["repetition"]) in eligible_blocks
    ]

    def row_metrics(row: dict) -> dict:
        return {
            "plan_semantic_score_0_12": mean(review["plan_total"] for review in row["reviews"]),
            "hidden_acceptance_pass_rate": (
                row["outcomes"]["hidden_cases_passed"] / row["outcomes"]["hidden_cases_total"]
                if row["outcomes"]["hidden_cases_total"] else None
            ),
            "weighted_semantic_defects": row["outcomes"]["weighted_semantic_defects"],
            "comprehension_score_0_4": mean(review["comprehension_score"] for review in row["reviews"]),
            "rework_minutes": row["timing"]["rework_minutes"],
            "total_active_minutes": (
                row["timing"]["material_preparation_minutes"]
                + row["timing"]["planning_minutes"]
                + row["timing"]["implementation_minutes"]
                + row["timing"]["review_minutes"]
                + row["timing"]["rework_minutes"]
            ),
        }

    def aggregate(source_rows: list[dict]) -> dict[str, dict]:
        grouped: dict[str, list[dict]] = defaultdict(list)
        for row in source_rows:
            grouped[row["condition"]].append(row)
        result: dict[str, dict] = {}
        for condition in sorted(CONDITIONS):
            items = grouped.get(condition, [])
            measures = [row_metrics(row) for row in items]
            hidden_passes = sum(row["outcomes"]["hidden_cases_passed"] for row in items)
            hidden_total = sum(row["outcomes"]["hidden_cases_total"] for row in items)
            result[condition] = {
                "n": len(items),
                "mean_plan_semantic_score_0_12": mean(item["plan_semantic_score_0_12"] for item in measures) if items else None,
                "hidden_acceptance_pass_rate": hidden_passes / hidden_total if hidden_total else None,
                "outcome_match_rate": mean(row["outcomes"]["outcome_match"] for row in items) if items else None,
                "mean_weighted_semantic_defects": mean(item["weighted_semantic_defects"] for item in measures) if items else None,
                "mean_comprehension_score_0_4": mean(item["comprehension_score_0_4"] for item in measures) if items else None,
                "mean_owner_corrections": mean(row["outcomes"]["owner_corrections"] for row in items) if items else None,
                "mean_scope_violations": mean(row["outcomes"]["scope_violations"] for row in items) if items else None,
                "mean_rework_minutes": mean(item["rework_minutes"] for item in measures) if items else None,
                "mean_total_active_minutes": mean(item["total_active_minutes"] for item in measures) if items else None,
                "mean_material_preparation_minutes": mean(row["timing"]["material_preparation_minutes"] for row in items) if items else None,
                "mean_material_preparation_tokens": mean(row["timing"]["material_preparation_tokens"] for row in items) if items else None,
                "mean_total_tokens": mean(row["timing"]["total_tokens"] for row in items) if items else None,
                "critical_semantic_defects": sum(row["outcomes"]["semantic_defects"]["critical"] for row in items),
            }
        return result

    condition_summary = aggregate(eligible_rows)
    stratum_condition_summary = {
        task_class: aggregate([row for row in eligible_rows if row["task_class"] == task_class])
        for task_class in ("low_ambiguity_control", "high_ambiguity")
    }

    def delta(left: str, right: str, metric: str):
        left_value = condition_summary[left][metric]
        right_value = condition_summary[right][metric]
        if left_value is None or right_value is None:
            return None
        return left_value - right_value

    comparisons = {
        "selected_information": {
            "left": "equivalent_notes",
            "right": "ticket_only",
        },
        "define_structure": {
            "left": "definition_pack",
            "right": "equivalent_notes",
        },
        "evidence_enforcement": {
            "left": "definition_pack_evidence_gate",
            "right": "definition_pack",
        },
        "combined_system": {
            "left": "definition_pack_evidence_gate",
            "right": "ticket_only",
        },
    }
    metrics = (
        "mean_plan_semantic_score_0_12",
        "hidden_acceptance_pass_rate",
        "mean_weighted_semantic_defects",
        "mean_comprehension_score_0_4",
        "mean_rework_minutes",
        "mean_total_active_minutes",
    )
    comparison_summary = {}
    for name, pair in comparisons.items():
        comparison_summary[name] = {
            "left": pair["left"],
            "right": pair["right"],
            "left_minus_right": {
                metric: delta(pair["left"], pair["right"], metric)
                for metric in metrics
            },
        }

    task_summary = {}
    for row in rows:
        task_summary.setdefault(row["task_id"], {"task_class": row["task_class"], "conditions": {}})
        measures = row_metrics(row) if (row["task_id"], row["repetition"]) in eligible_blocks else None
        task_summary[row["task_id"]]["conditions"][row["condition"]] = {
            "status": row["status"],
            "deviation_count": len(row["deviations"]),
            "weighted_semantic_defects": row["outcomes"]["weighted_semantic_defects"],
            "hidden_acceptance_pass_rate": (
                row["outcomes"]["hidden_cases_passed"] / row["outcomes"]["hidden_cases_total"]
                if row["outcomes"]["hidden_cases_total"] else None
            ),
            "outcome_match": row["outcomes"]["outcome_match"],
            "eligible_for_comparison": measures is not None,
            **(measures or {}),
        }
    paired_metric_names = (
        "plan_semantic_score_0_12", "hidden_acceptance_pass_rate",
        "weighted_semantic_defects", "comprehension_score_0_4",
        "rework_minutes", "total_active_minutes",
    )
    for task_id, task in task_summary.items():
        conditions = task["conditions"]
        task["paired_deltas"] = {}
        if set(conditions) != CONDITIONS or not all(item["eligible_for_comparison"] for item in conditions.values()):
            continue
        for name, pair in comparisons.items():
            left = conditions[pair["left"]]
            right = conditions[pair["right"]]
            task["paired_deltas"][name] = {
                metric: (
                    left[metric] - right[metric]
                    if left[metric] is not None and right[metric] is not None else None
                )
                for metric in paired_metric_names
            }
    for name in comparisons:
        task_deltas = {
            task_id: task["paired_deltas"][name]
            for task_id, task in task_summary.items()
            if name in task["paired_deltas"]
        }
        comparison_summary[name]["task_deltas"] = task_deltas
        comparison_summary[name]["median_left_minus_right"] = {
            metric: (
                median(delta[metric] for delta in task_deltas.values() if delta[metric] is not None)
                if any(delta[metric] is not None for delta in task_deltas.values()) else None
            )
            for metric in paired_metric_names
        }
    stratum_counts = {
        task_class: len({row["task_id"] for row in rows if row["task_class"] == task_class})
        for task_class in ("low_ambiguity_control", "high_ambiguity")
    }
    return {
        "protocol_id": "define-downstream-utility@1",
        "evidence_kinds": evidence_kinds,
        "condition_summary": condition_summary,
        "stratum_condition_summary": stratum_condition_summary,
        "task_summary": task_summary,
        "stratum_task_counts": stratum_counts,
        "excluded_blocks": [
            {"task_id": key[0], "repetition": key[1]}
            for key in sorted(set(blocks) - eligible_blocks)
        ],
        "excluded_from_aggregate": [
            row["run_id"] for row in rows
            if (row["task_id"], row["repetition"]) not in eligible_blocks
        ],
        "comparisons": comparison_summary,
        "claim_status": (
            "synthetic_fixture_no_product_claim"
            if evidence_kinds == ["synthetic_fixture"]
            else "live_data_requires_owner_adjudication"
        ),
    }


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: calculate_metrics.py <validated-rows.jsonl>", file=sys.stderr)
        return 2
    rows, errors = validate_path(Path(sys.argv[1]))
    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        return 1
    print(json.dumps(summarize(rows), indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
