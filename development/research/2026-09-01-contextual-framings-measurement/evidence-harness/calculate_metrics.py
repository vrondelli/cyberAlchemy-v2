#!/usr/bin/env python3
"""Calculate descriptive ACFT metrics only after bundle validation passes."""

from __future__ import annotations

import argparse
import json
import statistics
import sys
from pathlib import Path
from typing import Any, Callable

from validate_harness import ROOT, validate_bundle


RESULT_VERSION = "acft-dry-run-result@1"


def mean(values: list[float]) -> float:
    return round(statistics.fmean(values), 6)


def by_condition(rows: list[dict[str, Any]], getter: Callable[[dict[str, Any]], float]) -> dict[str, float]:
    return {
        condition: mean([getter(row) for row in rows if row["condition"] == condition])
        for condition in ("baseline", "acft")
    }


def paired_delta(rows: list[dict[str, Any]], getter: Callable[[dict[str, Any]], float]) -> float:
    pairs: dict[str, dict[str, dict[str, Any]]] = {}
    for row in rows:
        pairs.setdefault(row["fixture_id"], {})[row["condition"]] = row
    return mean([
        getter(pair["acft"]) - getter(pair["baseline"])
        for pair in pairs.values()
    ])


def rate(numerator: float, denominator: float) -> float | None:
    if denominator == 0:
        return None
    return round(numerator / denominator, 6)


def condition_rate(rows: list[dict[str, Any]], numerator: Callable[[dict[str, Any]], float],
                   denominator: Callable[[dict[str, Any]], float]) -> dict[str, float | None]:
    result: dict[str, float | None] = {}
    for condition in ("baseline", "acft"):
        selected = [row for row in rows if row["condition"] == condition]
        result[condition] = rate(
            sum(numerator(row) for row in selected),
            sum(denominator(row) for row in selected),
        )
    return result


def build_result(protocol: dict[str, Any], manifest: dict[str, Any], rows: list[dict[str, Any]]) -> dict[str, Any]:
    boundary = lambda row: float(row["outcomes"]["boundary_errors"])
    semantic_retained = lambda row: float(row["outcomes"]["semantic_fidelity"]["retained"])
    semantic_total = lambda row: float(row["outcomes"]["semantic_fidelity"]["total"])
    restored = lambda row: float(row["outcomes"]["return_fidelity"]["restored"])
    return_total = lambda row: float(row["outcomes"]["return_fidelity"]["total"])
    counterfactual = lambda row: float(row["outcomes"]["counterfactual_correct"])
    transfer = lambda row: float(row["outcomes"]["transfer_correct"])
    seconds = lambda row: float(row["outcomes"]["completion_seconds"])
    actions = lambda row: float(row["outcomes"]["action_count"])
    help_events = lambda row: float(row["outcomes"]["help_event_count"])
    confidence = lambda row: float(row["outcomes"]["confidence"] or 0)
    acft_rows = [row for row in rows if row["condition"] == "acft"]
    harm = {
        severity: sum(row["outcomes"]["analogy_harm_events"][severity] for row in acft_rows)
        for severity in ("low", "major", "critical")
    }
    result = {
        "schema_version": RESULT_VERSION,
        "protocol_id": protocol["protocol_id"],
        "evidence_kind": manifest["evidence_kind"],
        "validation_status": "pass",
        "rows": len(rows),
        "pairs": len(manifest["fixtures"]),
        "witness_classes": sorted(fixture["witness_class"] for fixture in manifest["fixtures"]),
        "p1a_boundary_errors": {
            "mean_by_condition": by_condition(rows, boundary),
            "paired_mean_delta_acft_minus_baseline": paired_delta(rows, boundary),
            "decision": "not_evaluable_without_owner_selected_noninferiority_margin",
        },
        "p1b_analogy_harm": {
            "treatment_only_event_counts": harm,
            "adjudicated_event_rows": sum(
                1 for row in acft_rows
                if sum(row["outcomes"]["analogy_harm_events"].values()) > 0
            ),
            "decision": "not_evaluable_without_owner_selected_critical_event_threshold",
        },
        "p2_components": {
            "semantic_fidelity_rate": condition_rate(rows, semantic_retained, semantic_total),
            "return_fidelity_rate": condition_rate(rows, restored, return_total),
            "counterfactual_accuracy": by_condition(rows, counterfactual),
            "unfamiliar_transfer_accuracy": by_condition(rows, transfer),
            "composite": None,
            "decision": "not_evaluable_without_owner_selected_component_order_or_weights_and_benefit_threshold",
        },
        "secondary": {
            "completion_seconds_mean": by_condition(rows, seconds),
            "action_count_mean": by_condition(rows, actions),
            "help_event_count_mean": by_condition(rows, help_events),
            "confidence_mean": by_condition(rows, confidence),
            "interpretation": "descriptive_only",
        },
        "effect_verdict": "not_evaluable" if manifest["evidence_kind"] == "synthetic_fixture" else "requires_owner_adjudication",
        "claim_status": "synthetic_fixture_no_human_or_product_claim" if manifest["evidence_kind"] == "synthetic_fixture" else "live_run_requires_owner_adjudication",
        "allowed_result_language": protocol["claim_language"][manifest["evidence_kind"]],
        "blockers": [
            field for field, value in protocol["decision_policy"].items()
            if field not in {"live_execution_ready", "block_reason"} and value is None
        ],
    }
    if result["effect_verdict"] == "not_evaluable" and result["claim_status"] != "synthetic_fixture_no_human_or_product_claim":
        raise ValueError("synthetic claim boundary mismatch")
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--protocol", type=Path, default=ROOT / "protocol.json")
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--rows", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    protocol, manifest, rows, errors = validate_bundle(args.protocol, args.manifest, args.rows)
    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        print(json.dumps({"status": "blocked", "reason": "input_validation_failed", "errors": len(errors)}, sort_keys=True))
        return 1
    assert protocol is not None and manifest is not None
    result = build_result(protocol, manifest, rows)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, ensure_ascii=False, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": "pass",
        "output": str(args.output),
        "rows": result["rows"],
        "pairs": result["pairs"],
        "effect_verdict": result["effect_verdict"],
        "claim_status": result["claim_status"],
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
