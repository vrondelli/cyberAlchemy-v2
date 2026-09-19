#!/usr/bin/env python3
"""Validate campaign readiness and synthetic evidence mechanics without running EVF."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import jsonschema

HERE = Path(__file__).resolve().parent
REPOSITORY = Path(__file__).resolve().parents[5]
EXPECTED_SEAMS = {"binding", "derivation", "lineage", "observation", "provider", "scope", "semantic"}


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rows(path: Path):
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def main() -> None:
    campaign = load(HERE / "campaign.json")
    schema = load(HERE / "observation.schema.json")
    errors: list[str] = []

    if campaign.get("status") != "prepared-not-run":
        errors.append("campaign status must remain prepared-not-run")
    seams = campaign.get("seams", [])
    seam_ids = [item.get("seam") for item in seams]
    case_ids = [case_id for item in seams for case_id in (item.get("neutral_case_id"), item.get("mutation_case_id"))]
    if set(seam_ids) != EXPECTED_SEAMS or len(seam_ids) != len(EXPECTED_SEAMS):
        errors.append("campaign must contain each of the seven seams exactly once")
    if len(case_ids) != 14 or len(case_ids) != len(set(case_ids)) or any(not item for item in case_ids):
        errors.append("case denominator must contain 14 non-empty unique neutral/mutation ids")
    for binding in campaign.get("candidate_bindings", []):
        path = REPOSITORY / binding["path"]
        if not path.is_file():
            errors.append(f"missing candidate binding: {binding['path']}")
        elif digest(path) != binding["sha256"]:
            errors.append(f"stale candidate binding: {binding['id']}")

    validator = jsonschema.Draft202012Validator(schema)
    passing = rows(HERE / "fixtures/synthetic-pass.jsonl")
    for index, row in enumerate(passing, 1):
        row_errors = list(validator.iter_errors(row))
        if row_errors:
            errors.append(f"passing fixture row {index} rejected: {row_errors[0].message}")
    if {row.get("seam") for row in passing} != EXPECTED_SEAMS or len(passing) != 7:
        errors.append("passing fixture must cover each seam exactly once")
    if any(row.get("status") != "mutation-detected" or row.get("tool_owned") is not True for row in passing):
        errors.append("passing fixture must be tool-owned mutation detection")

    failing = rows(HERE / "fixtures/synthetic-fail.jsonl")
    if not failing or all(not list(validator.iter_errors(row)) for row in failing):
        errors.append("failing fixture was not rejected")

    result = {
        "schema_version": "auth-service-evf-campaign-readiness/v1",
        "status": "PASS" if not errors else "BLOCK",
        "campaign_id": campaign.get("campaign_id"),
        "candidate_bindings": len(campaign.get("candidate_bindings", [])),
        "seams": len(seams),
        "cases": len(case_ids),
        "synthetic_passing_rows": len(passing),
        "synthetic_failing_rows": len(failing),
        "live_observations": 0,
        "evf_conformance": "not_evaluable",
        "errors": errors,
        "authority_effect": "none",
    }
    print(json.dumps(result, indent=2))
    if errors:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
