#!/usr/bin/env python3
"""Regression checks for cross-artifact identity and cost joins."""

from __future__ import annotations

import copy
import hashlib
import json
import tempfile
from pathlib import Path

from validate_experiment_bundle import validate_bundle


ROOT = Path(__file__).resolve().parent
SELECTION = ROOT / "fixtures/task-selection-pass.json"
ROWS = ROOT / "fixtures/pass.jsonl"
MANIFEST = ROOT / "fixtures/condition-manifest-pass.json"


def has(errors: list[str], marker: str) -> bool:
    return any(marker in error for error in errors)


def main() -> int:
    failures: list[str] = []
    summary, errors = validate_bundle(SELECTION, ROWS, [MANIFEST])
    if errors or summary.get("status") != "pass":
        failures.append("joined pass fixtures were rejected")

    rows = [json.loads(line) for line in ROWS.read_text(encoding="utf-8").splitlines() if line.strip()]
    with tempfile.TemporaryDirectory() as directory:
        temp = Path(directory)
        bad_digest = copy.deepcopy(rows)
        bad_digest[0]["frozen"]["condition_manifest_digest"] = "f" * 64
        bad_digest_path = temp / "bad-digest.jsonl"
        bad_digest_path.write_text(
            "".join(json.dumps(row, separators=(",", ":")) + "\n" for row in bad_digest),
            encoding="utf-8",
        )
        _, digest_errors = validate_bundle(SELECTION, bad_digest_path, [MANIFEST])
        if not has(digest_errors, "condition_manifest_digest"):
            failures.append("condition-manifest digest mismatch was accepted")

        bad_cost = copy.deepcopy(rows)
        bad_cost[1]["timing"]["material_preparation_minutes"] += 1
        bad_cost_path = temp / "bad-cost.jsonl"
        bad_cost_path.write_text(
            "".join(json.dumps(row, separators=(",", ":")) + "\n" for row in bad_cost),
            encoding="utf-8",
        )
        _, cost_errors = validate_bundle(SELECTION, bad_cost_path, [MANIFEST])
        if not has(cost_errors, "material_preparation_minutes"):
            failures.append("row-to-manifest cost mismatch was accepted")

        denominator_drift = copy.deepcopy(rows)
        denominator_drift[3]["outcomes"]["hidden_cases_total"] = 11
        denominator_path = temp / "denominator-drift.jsonl"
        denominator_path.write_text(
            "".join(json.dumps(row, separators=(",", ":")) + "\n" for row in denominator_drift),
            encoding="utf-8",
        )
        _, denominator_errors = validate_bundle(SELECTION, denominator_path, [MANIFEST])
        if not (
            has(denominator_errors, "outcomes.hidden_cases_total")
            and has(denominator_errors, "selection_rows_hidden_case_count")
        ):
            failures.append("non-first-condition hidden-case denominator drift was accepted")

        base_selection = json.loads(SELECTION.read_text(encoding="utf-8"))
        base_manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        base_selection["evidence_kind"] = "live_run"
        prototype = base_selection["candidates"][0]
        base_selection["candidates"] = []
        task_specs = []
        for index in range(6):
            task_id = f"live-shape-task-{index + 1}"
            task_class = "low_ambiguity_control" if index < 2 else "high_ambiguity"
            candidate = copy.deepcopy(prototype)
            candidate["candidate_id"] = task_id
            candidate["classification"] = task_class
            candidate["classification_reason"] = "Temporary live-shape regression case."
            if task_class == "low_ambiguity_control":
                candidate["ambiguity_scores"] = {
                    "concept_meaning": 0,
                    "context_boundary": 0,
                    "ownership_authority": 0,
                    "valid_outcome": 0,
                }
            base_selection["candidates"].append(candidate)
            task_specs.append((task_id, task_class))
        live_selection_path = temp / "live-selection.json"
        live_selection_path.write_text(json.dumps(base_selection, indent=2) + "\n", encoding="utf-8")
        selection_digest = hashlib.sha256(live_selection_path.read_bytes()).hexdigest()

        live_rows = []
        live_manifests = []
        for task_index, (task_id, task_class) in enumerate(task_specs, start=1):
            manifest = copy.deepcopy(base_manifest)
            manifest["evidence_kind"] = "live_run"
            manifest["task_id"] = task_id
            manifest["task_class"] = task_class
            manifest_path = temp / f"{task_id}-manifest.json"
            manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
            manifest_digest = hashlib.sha256(manifest_path.read_bytes()).hexdigest()
            live_manifests.append(manifest_path)
            for base_row in rows:
                row = copy.deepcopy(base_row)
                row["evidence_kind"] = "live_run"
                row["task_id"] = task_id
                row["task_class"] = task_class
                row["run_id"] = f"{task_id}-{row['condition']}"
                row["frozen"]["task_selection_digest"] = selection_digest
                row["frozen"]["condition_manifest_digest"] = manifest_digest
                row["execution"]["planner_session_id"] = f"planner-{task_index}-{row['condition']}"
                row["execution"]["implementer_session_id"] = f"implementer-{task_index}-{row['condition']}"
                live_rows.append(row)
        live_rows_path = temp / "live-rows.jsonl"
        live_rows_path.write_text(
            "".join(json.dumps(row, separators=(",", ":")) + "\n" for row in live_rows),
            encoding="utf-8",
        )
        live_summary, live_errors = validate_bundle(
            live_selection_path, live_rows_path, live_manifests, live_pilot=True,
        )
        if live_errors or live_summary.get("status") != "pass":
            failures.append("temporary 24-row live-shape bundle was rejected")

    if failures:
        for failure in failures:
            print(failure)
        return 1
    print(json.dumps({
        "status": "pass",
        "checks": [
            "joined_fixture", "manifest_digest", "cost_allocation",
            "hidden_case_denominator_identity", "temporary_live_shape_24_rows",
        ],
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
