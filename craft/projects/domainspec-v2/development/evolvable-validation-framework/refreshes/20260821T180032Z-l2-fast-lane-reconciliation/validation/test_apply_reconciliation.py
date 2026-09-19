#!/usr/bin/env python3
"""Isolated hostile regressions for the EVF reconciliation apply driver."""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any


RUN = Path(
    "projects/domainspec-v2/development/evolvable-validation-framework/"
    "refreshes/20260821T180032Z-l2-fast-lane-reconciliation"
)
TARGETS = [
    "projects/domainspec-v2/.craft/ledger.yml",
    "projects/domainspec-v2/CRAFT.md",
    "projects/domainspec-v2/development/evolvable-validation-framework/EXECUTION-PACK.md",
    "projects/domainspec-v2/development/evolvable-validation-framework/IMPLEMENTATION-LAYERING.md",
    "projects/domainspec-v2/development/evolvable-validation-framework/PLAN.md",
    "projects/domainspec-v2/development/evolvable-validation-framework/WORK-PACK.md",
]


def execute(
    repo: Path,
    fixture: Path,
    *,
    material_root: Path,
    receipt: Path,
    hooks: list[dict[str, Any]] | None = None,
    preflight: bool = False,
) -> tuple[int, dict[str, Any]]:
    output = fixture / "APPLY-RESULT.json"
    command = [
        "python3",
        str(RUN / "material/apply_reconciliation.py"),
        "--repo-root", str(fixture),
        "--material-root", str(material_root),
        "--package", str(RUN / "material/MATERIAL-PACKAGE.json"),
        "--material-receipt", str(receipt),
        "--handoff", str(RUN / "material/REFRESH-MATERIAL-HANDOFF-RECEIPT.json"),
        "--output", str(output),
    ]
    if preflight:
        command.append("--preflight-only")
    environment = os.environ.copy()
    if hooks is not None:
        environment["EVF_L2_APPLY_TEST_HOOKS"] = json.dumps(hooks)
    completed = subprocess.run(
        command,
        cwd=repo,
        env=environment,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    return completed.returncode, json.loads(output.read_text(encoding="utf-8"))


def baseline_bytes(repo: Path) -> dict[str, bytes]:
    root = repo / RUN / "material/root/baselines"
    return {path: (root / path).read_bytes() for path in TARGETS}


def postimage_bytes(repo: Path) -> dict[str, bytes]:
    root = repo / RUN / "material/root/outputs"
    return {path: (root / path).read_bytes() for path in TARGETS}


def new_fixture(repo: Path) -> Path:
    fixture = Path(tempfile.mkdtemp(prefix="evf-l2-apply-test-"))
    shutil.copytree(repo / RUN / "material/root/baselines/projects", fixture / "projects")
    return fixture


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    repo = Path(args.repo_root).resolve()
    material = repo / RUN / "material/root"
    receipt = repo / RUN / "material/MATERIAL-RECEIPT.json"
    baselines = baseline_bytes(repo)
    postimages = postimage_bytes(repo)
    cases: list[dict[str, Any]] = []

    def record(case_id: str, passed: bool, evidence: dict[str, Any]) -> None:
        cases.append({"case_id": case_id, "status": "pass" if passed else "fail", **evidence})

    fixtures: list[Path] = []
    try:
        fixture = new_fixture(repo); fixtures.append(fixture)
        exit_code, result = execute(repo, fixture, material_root=material, receipt=receipt)
        record(
            "valid-exact-apply",
            exit_code == 0
            and result.get("status") == "pass"
            and all((fixture / path).read_bytes() == postimages[path] for path in TARGETS)
            and not list(fixture.rglob(".evf-l2-baseline-*.bak")),
            {"exit_code": exit_code, "result_status": result.get("status")},
        )

        fixture = new_fixture(repo); fixtures.append(fixture)
        (fixture / TARGETS[1]).write_bytes(b"baseline-drift")
        exit_code, result = execute(
            repo, fixture, material_root=material, receipt=receipt, preflight=True
        )
        record(
            "initial-baseline-drift",
            exit_code == 1
            and "LIVE_BASELINE_DRIFT:projects/domainspec-v2/CRAFT.md"
            in result.get("blockers", []),
            {"exit_code": exit_code, "blockers": result.get("blockers", [])},
        )

        fixture = new_fixture(repo); fixtures.append(fixture)
        tampered_receipt = fixture / "tampered-receipt.json"
        tampered_receipt.write_bytes(receipt.read_bytes() + b"\n")
        exit_code, result = execute(
            repo,
            fixture,
            material_root=material,
            receipt=tampered_receipt,
            preflight=True,
        )
        record(
            "material-receipt-byte-tamper",
            exit_code == 1
            and "FILE_BOUND_MATERIAL_RECEIPT_SHA_MISMATCH"
            in result.get("blockers", []),
            {"exit_code": exit_code, "blockers": result.get("blockers", [])},
        )

        fixture = new_fixture(repo); fixtures.append(fixture)
        isolated_material = fixture / "material-root"
        shutil.copytree(material, isolated_material)
        source = isolated_material / (
            "sources/projects/domainspec-v2/development/evolvable-validation-framework/"
            "evidence/SWU-GCP-007-C3/attempt-001/join-receipt.json"
        )
        source.write_bytes(source.read_bytes() + b"\n")
        exit_code, result = execute(
            repo,
            fixture,
            material_root=isolated_material,
            receipt=receipt,
            preflight=True,
        )
        record(
            "fresh-material-revalidation",
            exit_code == 1
            and any(
                item.startswith("APPLY_TIME_MATERIAL_VALIDATION_FAILED")
                for item in result.get("blockers", [])
            ),
            {"exit_code": exit_code, "blockers": result.get("blockers", [])},
        )

        fixture = new_fixture(repo); fixtures.append(fixture)
        hooks = [{
            "event": "before-target-check",
            "index": 1,
            "kind": "mutate-target",
            "path": TARGETS[1],
            "content": "concurrent-later-target-edit",
        }]
        exit_code, result = execute(
            repo, fixture, material_root=material, receipt=receipt, hooks=hooks
        )
        backups = result.get("recovery_backups", {})
        record(
            "mid-apply-later-target-drift",
            exit_code == 1
            and (fixture / TARGETS[0]).read_bytes() == baselines[TARGETS[0]]
            and (fixture / TARGETS[1]).read_bytes() == b"concurrent-later-target-edit"
            and TARGETS[1] in backups
            and Path(backups[TARGETS[1]]).is_file(),
            {
                "exit_code": exit_code,
                "blockers": result.get("blockers", []),
                "recovery_targets": sorted(backups),
                "recovery_files_verified_before_fixture_cleanup": True,
            },
        )

        fixture = new_fixture(repo); fixtures.append(fixture)
        hooks = [{
            "event": "after-replace",
            "index": 0,
            "kind": "mutate-target-and-raise",
            "path": TARGETS[0],
            "content": "concurrent-already-replaced-edit",
        }]
        exit_code, result = execute(
            repo, fixture, material_root=material, receipt=receipt, hooks=hooks
        )
        backups = result.get("recovery_backups", {})
        record(
            "rollback-preserves-concurrent-edit",
            exit_code == 1
            and (fixture / TARGETS[0]).read_bytes() == b"concurrent-already-replaced-edit"
            and any(item.startswith("ROLLBACK_SKIPPED_CONCURRENT_EDIT") for item in result.get("blockers", []))
            and TARGETS[0] in backups
            and Path(backups[TARGETS[0]]).is_file(),
            {
                "exit_code": exit_code,
                "blockers": result.get("blockers", []),
                "recovery_targets": sorted(backups),
                "recovery_files_verified_before_fixture_cleanup": True,
            },
        )

        fixture = new_fixture(repo); fixtures.append(fixture)
        hooks = [
            {"event": "after-replace", "index": 0, "kind": "raise"},
            {"kind": "fail-rollback", "path": TARGETS[0]},
        ]
        exit_code, result = execute(
            repo, fixture, material_root=material, receipt=receipt, hooks=hooks
        )
        backups = result.get("recovery_backups", {})
        record(
            "rollback-failure-preserves-recovery",
            exit_code == 1
            and (fixture / TARGETS[0]).read_bytes() == postimages[TARGETS[0]]
            and f"ROLLBACK_FAILED:{TARGETS[0]}:injected" in result.get("blockers", [])
            and TARGETS[0] in backups
            and Path(backups[TARGETS[0]]).is_file(),
            {
                "exit_code": exit_code,
                "blockers": result.get("blockers", []),
                "recovery_targets": sorted(backups),
                "recovery_files_verified_before_fixture_cleanup": True,
            },
        )

        fixture = new_fixture(repo); fixtures.append(fixture)
        hooks = [{"kind": "fail-receipt-write", "phase": "final-pass"}]
        exit_code, result = execute(
            repo, fixture, material_root=material, receipt=receipt, hooks=hooks
        )
        record(
            "final-receipt-write-failure-rolls-back",
            exit_code == 1
            and result.get("status") == "block"
            and result.get("rolled_back") is True
            and all((fixture / path).read_bytes() == baselines[path] for path in TARGETS),
            {
                "exit_code": exit_code,
                "result_status": result.get("status"),
                "rolled_back": result.get("rolled_back"),
                "blockers": result.get("blockers", []),
                "attempt_state": result.get("attempt_state"),
            },
        )
    finally:
        for fixture in fixtures:
            shutil.rmtree(fixture, ignore_errors=True)

    status = "pass" if all(case["status"] == "pass" for case in cases) else "block"
    result = {
        "schema_version": "evf-l2-reconciliation-driver-regression/v2",
        "status": status,
        "case_count": len(cases),
        "cases": cases,
        "canonical_targets_mutated": False,
        "temporary_fixtures_removed": True,
        "authority_effect": "none",
    }
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if status == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main())
