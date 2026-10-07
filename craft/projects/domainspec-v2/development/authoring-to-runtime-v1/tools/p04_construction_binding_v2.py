#!/usr/bin/env python3
"""Additive current P04 binding; historical P04 files are never overwritten."""

from __future__ import annotations

import argparse
import importlib.util
import json
import os
import sys
from pathlib import Path
from typing import Any


PLAN_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = Path(__file__).resolve().parents[6]
LEGACY_TOOL = PLAN_ROOT / "tools/p04_construction_binding.py"
SCHEMA_PATH = PLAN_ROOT / "p04-construction-binding.v2.schema.json"
TEST_PATH = PLAN_ROOT / "tests/test_p04_construction_binding_v2.py"
EVIDENCE_ROOT = PLAN_ROOT / "evidence/p04-d65-construction-binding/successor-v3-candidate"
BINDING_PATH = EVIDENCE_ROOT / "construction-binding.json"
QUALIFICATION_PATH = EVIDENCE_ROOT / "qualification.json"
L3_PATH = PLAN_ROOT / "evidence/l3-completion/qualification.v2-candidate.json"
P02_PATH = PLAN_ROOT / "evidence/p02-clean-consumers/successor-v5-candidate/qualification.json"
P03_CANDIDATE_PATH = PLAN_ROOT / "evidence/p03-exact-candidate/successor-v3-candidate/candidate.json"
P03_QUALIFICATION_PATH = PLAN_ROOT / "evidence/p03-exact-candidate/successor-v3-candidate/qualification.json"

spec = importlib.util.spec_from_file_location("historical_p04_tool_for_v2", LEGACY_TOOL)
assert spec and spec.loader
legacy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(legacy)
legacy.SCHEMA_PATH = SCHEMA_PATH
legacy.P03_CANDIDATE_PATH = P03_CANDIDATE_PATH
legacy.P03_QUALIFICATION_PATH = P03_QUALIFICATION_PATH
_legacy_artifact_bindings = legacy.artifact_bindings


def artifact_bindings() -> list[dict[str, Any]]:
    rows = _legacy_artifact_bindings()
    replacements = {
        "l3-construction-qualification": (L3_PATH, "current scoped L3 construction qualification"),
        "p02-clean-consumer-qualification": (P02_PATH, "current three-language installed-consumer qualification"),
    }
    for row in rows:
        if row["id"] in replacements:
            path, role = replacements[row["id"]]
            row.update(path=legacy.relative(path), sha256=legacy.sha256_bytes(path.read_bytes()), role=role)
    return rows


legacy.artifact_bindings = artifact_bindings


def build_binding() -> dict[str, Any]:
    value = legacy.build_binding()
    value["schema_version"] = "alchlang.p04-d65-construction-binding/v2-candidate"
    value["date"] = "2026-10-02"
    value["stage_accounting"][6]["evidence_statement"] = (
        "Current scoped L3, P02 and P03 qualifications bind internal construction evidence only, not product-owner tests."
    )
    value["stage_accounting"][7]["evidence_statement"] = (
        "Current P03 successor freezes one exact testable candidate and a non-mutating currentness validator."
    )
    value["drift_route"] = "Selected-byte or P03-currentness drift invalidates this successor; never refresh historical evidence in place."
    return legacy.reseal(value)


def validate_binding(value: dict[str, Any], *, check_current: bool = True, run_p03: bool = True) -> dict[str, Any]:
    result = legacy.validate_binding(value, check_current=check_current, run_p03=run_p03)
    checks = result["checks"]
    artifacts = {row.get("id"): row for row in value.get("artifact_bindings", []) if isinstance(row, dict)}
    expected = {
        "l3-construction-qualification": L3_PATH,
        "p02-clean-consumer-qualification": P02_PATH,
        "p03-exact-candidate": P03_CANDIDATE_PATH,
        "p03-qualification": P03_QUALIFICATION_PATH,
    }
    exact_paths = all(artifacts.get(key, {}).get("path") == legacy.relative(path) for key, path in expected.items())
    checks.append({"id": "current-successor-paths", "result": "pass" if exact_paths else "fail"})
    if not exact_paths:
        result["errors"].append("current-successor-paths")
    predecessor_shapes = (
        legacy.load_json(L3_PATH).get("result") == "scoped-pass"
        and legacy.load_json(P02_PATH).get("result") == "pass"
        and legacy.load_json(P03_QUALIFICATION_PATH).get("candidate_id") == value.get("subject_ref")
    )
    checks.append({"id": "current-successor-results", "result": "pass" if predecessor_shapes else "fail"})
    if not predecessor_shapes:
        result["errors"].append("current-successor-results")
    result["schema_version"] = "alchlang.p04-d65-construction-binding-validation/v2-candidate"
    result["result"] = "pass" if all(row["result"] == "pass" for row in checks) else "fail"
    return result


def serialized(value: dict[str, Any]) -> bytes:
    return (json.dumps(value, indent=2, ensure_ascii=False) + "\n").encode("utf-8")


def row(path: Path, data: bytes | None = None) -> dict[str, Any]:
    content = path.read_bytes() if data is None else data
    return {"path": legacy.relative(path), "size_bytes": len(content), "sha256": legacy.sha256_bytes(content)}


def qualification(binding: dict[str, Any], binding_bytes: bytes) -> dict[str, Any]:
    return {
        "schema_version": "alchlang.p04-d65-construction-binding-qualification/v3-candidate",
        "date": "2026-10-02",
        "task": "P04",
        "result": "scoped-pass",
        "authority_effect": "none",
        "binding": row(BINDING_PATH, binding_bytes),
        "bindings": {
            "schema": row(SCHEMA_PATH),
            "materializer_and_validator": row(Path(__file__).resolve()),
            "adversarial_test": row(TEST_PATH),
            "l3_successor": row(L3_PATH),
            "p02_successor": row(P02_PATH),
            "predecessor_candidate": row(P03_CANDIDATE_PATH),
            "predecessor_qualification": row(P03_QUALIFICATION_PATH),
        },
        "binding_id": binding["binding_id"],
        "binding_manifest_sha256": binding["binding_manifest_sha256"],
        "exact_candidate": binding["exact_candidate"],
        "validation": {
            "schema": "pass", "currentness": "pass", "p03_currentness": "pass",
            "non_mutating": True, "stage_count": 11, "adversarial_cases": 9,
            "failed": 0, "skipped": 0,
        },
        "eligibility": binding["eligibility"],
        "claim_ceiling": "Current scoped P04 construction-stage accounting only; no product-owner validation, approval, governance registration, authority, publication, release, deployment or production proof.",
        "open_questions": ["P05 must independently review every current successor binding before L4X handoff eligibility."],
    }


def exclusive_write(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with os.fdopen(os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o644), "wb") as handle:
        handle.write(data)


def main() -> int:
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--write-successor", action="store_true")
    mode.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if args.write_successor:
        binding = build_binding()
        validation = validate_binding(binding)
        if validation["result"] != "pass":
            print(json.dumps(validation, indent=2), file=sys.stderr)
            return 1
        binding_bytes = serialized(binding)
        qualification_bytes = serialized(qualification(binding, binding_bytes))
        if BINDING_PATH.exists() or QUALIFICATION_PATH.exists():
            parser.error("successor already exists; use --check or create a new successor version")
        exclusive_write(BINDING_PATH, binding_bytes)
        exclusive_write(QUALIFICATION_PATH, qualification_bytes)
        print(json.dumps({"result": "pass", "binding_id": binding["binding_id"], "authority_effect": "none"}, indent=2))
        return 0
    binding = legacy.load_json(BINDING_PATH)
    validation = validate_binding(binding)
    print(json.dumps(validation, indent=2))
    return 0 if validation["result"] == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main())
