#!/usr/bin/env python3
"""Join task selection, condition manifests, and run rows by exact digests."""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path
from typing import Any

from validate_condition_manifest import validate_manifest
from validate_run import CONDITIONS, validate_path
from validate_task_selection import validate_selection


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_json(path: Path) -> tuple[dict[str, Any] | None, str | None]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return None, f"READ:{path}:{exc}"
    if not isinstance(payload, dict):
        return None, f"TYPE:{path}:expected-object"
    return payload, None


def validate_bundle(
    selection_path: Path,
    rows_path: Path,
    manifest_paths: list[Path],
    live_pilot: bool = False,
) -> tuple[dict[str, Any], list[str]]:
    errors: list[str] = []
    selection, read_error = read_json(selection_path)
    if read_error:
        return {}, [read_error]
    assert selection is not None
    errors.extend(f"SELECTION:{error}" for error in validate_selection(selection, live_pilot=live_pilot))

    rows, row_errors = validate_path(rows_path, live_pilot=live_pilot)
    errors.extend(f"ROWS:{error}" for error in row_errors)

    manifests: dict[str, tuple[dict[str, Any], Path]] = {}
    for path in manifest_paths:
        manifest, manifest_read_error = read_json(path)
        if manifest_read_error:
            errors.append(manifest_read_error)
            continue
        assert manifest is not None
        errors.extend(f"MANIFEST[{path.name}]:{error}" for error in validate_manifest(manifest))
        task_id = manifest.get("task_id")
        if not isinstance(task_id, str):
            errors.append(f"MANIFEST_TASK_ID:{path.name}")
        elif task_id in manifests:
            errors.append(f"MANIFEST_DUPLICATE_TASK:{task_id}")
        else:
            manifests[task_id] = (manifest, path)

    selected_candidates = {
        candidate.get("candidate_id"): candidate
        for candidate in selection.get("candidates", [])
        if isinstance(candidate, dict) and candidate.get("selected") is True
    }
    row_task_ids = {row.get("task_id") for row in rows if isinstance(row, dict)}
    if set(selected_candidates) != row_task_ids:
        errors.append("JOIN:selection_to_rows:task_ids")
    if set(manifests) != row_task_ids:
        errors.append("JOIN:manifests_to_rows:task_ids")

    selection_digest = sha256(selection_path)
    evidence_kinds = {selection.get("evidence_kind")}
    for task_id in sorted(row_task_ids & set(manifests) & set(selected_candidates)):
        manifest, manifest_path = manifests[task_id]
        candidate = selected_candidates[task_id]
        block = [row for row in rows if row.get("task_id") == task_id]
        by_condition = {row.get("condition"): row for row in block}
        prefix = f"JOIN[{task_id}]"
        manifest_digest = sha256(manifest_path)
        evidence_kinds.add(manifest.get("evidence_kind"))
        evidence_kinds.update(row.get("evidence_kind") for row in block)
        if set(by_condition) != CONDITIONS or len(block) != 4:
            errors.append(f"{prefix}:conditions")
            continue
        if candidate.get("classification") != manifest.get("task_class"):
            errors.append(f"{prefix}:selection_manifest_task_class")
        if candidate.get("repository_commit") != manifest.get("repository_commit"):
            errors.append(f"{prefix}:selection_manifest_repository_commit")
        if any(
            candidate.get("hidden_case_count") != row["outcomes"]["hidden_cases_total"]
            for row in block
        ):
            errors.append(f"{prefix}:selection_rows_hidden_case_count")
        for condition, row in by_condition.items():
            frozen = row["frozen"]
            manifest_condition = manifest["conditions"][condition]
            if frozen.get("task_selection_digest") != selection_digest:
                errors.append(f"{prefix}:{condition}:task_selection_digest")
            if frozen.get("condition_manifest_digest") != manifest_digest:
                errors.append(f"{prefix}:{condition}:condition_manifest_digest")
            for row_key, manifest_key in (
                ("repository_commit", "repository_commit"),
                ("source_packet_digest", "source_packet_digest"),
                ("fact_set_digest", "fact_set_digest"),
            ):
                if frozen.get(row_key) != manifest.get(manifest_key):
                    errors.append(f"{prefix}:{condition}:{row_key}")
            for key in ("condition_packet_digest", "definition_pack_digest", "gate_policy_digest"):
                if frozen.get(key) != manifest_condition.get(key):
                    errors.append(f"{prefix}:{condition}:{key}")
            cost = manifest["costs"]["conditions"][condition]
            expected_minutes = cost["direct_material_minutes"] + cost["allocated_fact_set_minutes"]
            expected_tokens = cost["direct_material_tokens"] + cost["allocated_fact_set_tokens"]
            if row["timing"].get("material_preparation_minutes") != expected_minutes:
                errors.append(f"{prefix}:{condition}:material_preparation_minutes")
            if row["timing"].get("material_preparation_tokens") != expected_tokens:
                errors.append(f"{prefix}:{condition}:material_preparation_tokens")
    if len(evidence_kinds) != 1:
        errors.append("JOIN:evidence_kind")

    summary = {
        "status": "fail" if errors else "pass",
        "tasks": len(row_task_ids),
        "manifests": len(manifests),
        "rows": len(rows),
        "evidence_kinds": sorted(value for value in evidence_kinds if isinstance(value, str)),
        "shared_cost_reporting": {
            task_id: {
                "fact_set_preparation_minutes": manifest["costs"]["fact_set_preparation_minutes"],
                "parity_review_minutes": manifest["costs"]["parity_review_minutes"],
            }
            for task_id, (manifest, _) in manifests.items()
            if isinstance(manifest.get("costs"), dict)
        },
    }
    return summary, errors


def main() -> int:
    args = sys.argv[1:]
    live_pilot = False
    if args and args[0] == "--live-pilot":
        live_pilot = True
        args = args[1:]
    if len(args) < 3:
        print(
            "usage: validate_experiment_bundle.py [--live-pilot] "
            "<task-selection.json> <rows.jsonl> <condition-manifest.json> [...]",
            file=sys.stderr,
        )
        return 2
    summary, errors = validate_bundle(
        Path(args[0]), Path(args[1]), [Path(value) for value in args[2:]],
        live_pilot=live_pilot,
    )
    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        print(json.dumps({**summary, "errors": len(errors)}, sort_keys=True))
        return 1
    print(json.dumps(summary, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
