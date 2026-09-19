#!/usr/bin/env python3
"""Acceptance-critical lifecycle and command regressions for the staged TDE @4 proposal."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
from pathlib import Path
from typing import Any


EXPECTED_ID = "dsv2-tde-multiformalism-profile-epoch@4"
PREDECESSOR_ID = "dsv2-tde-multiformalism-profile-epoch@3"
INVALID_CURRENT_PATTERNS = (
    re.compile(r"(?i)(?:exact|direct|renewed|pending|final|fresh|new)\s+@2\b"),
    re.compile(r"(?i)TDE(?:\s+Multiformalism\s+Profile)?\s+Epoch\s+@2\b"),
    re.compile(r"(?i)TDE\s+epoch\s+@2\s+admission"),
    re.compile(r"(?i)(?:exact\s+final|final|fresh\s+exact)\s+@3\s+(?:Plan\s+successor|candidate(?:\s+manifest)?\s+digest)"),
)
HISTORICAL_MARKERS = ("historical provenance only", "does not transfer", "transfers to @4")


def write_result(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def lifecycle(root: Path, output: Path) -> int:
    findings: list[dict[str, Any]] = []
    allowed_historical: list[dict[str, Any]] = []
    files = sorted(path for path in root.rglob("*") if path.is_file())
    if len(files) != 84:
        findings.append({"code": "TARGET_COUNT_INVALID", "observed": len(files), "expected": 84})
    for path in files:
        relative = path.relative_to(root).as_posix()
        text = path.read_text(encoding="utf-8")
        if PREDECESSOR_ID in text:
            findings.append({"code": "PREDECESSOR_CANDIDATE_ID_CURRENT", "path": relative})
        for line_number, line in enumerate(text.splitlines(), start=1):
            lowered = line.lower()
            if "@2" in line and "@20260824t174651z" not in lowered:
                if any(marker in lowered for marker in HISTORICAL_MARKERS):
                    allowed_historical.append(
                        {"path": relative, "line": line_number, "text": line, "non_transfer": True}
                    )
                else:
                    findings.append(
                        {
                            "code": "UNTYPED_PREDECESSOR_TOKEN",
                            "path": relative,
                            "line": line_number,
                            "text": line,
                        }
                    )
            for pattern in INVALID_CURRENT_PATTERNS:
                if not pattern.search(line):
                    continue
                if "@20260824t174651z" in lowered:
                    continue
                if any(marker in lowered for marker in HISTORICAL_MARKERS):
                    continue
                findings.append(
                    {
                        "code": "STALE_CURRENT_LIFECYCLE_TOKEN",
                        "path": relative,
                        "line": line_number,
                        "text": line,
                        "pattern": pattern.pattern,
                    }
                )

    title_expectations = {
        "RESULT.md": "# TDE Multiformalism Profile Epoch @4 Result",
        "context/CONTEXT-PACK.md": "# Strict Context Pack — TDE Epoch @4",
        "context/context-pack.index.json": '"task": "TDE epoch @4 admission readiness"',
        "plan/DISTILL-VALIDATION.md": "# Distill Validation — TDE Epoch @4",
        "plan/EXECUTION-PACK.md": "# Execution Pack — TDE Multiformalism Profile Epoch @4",
        "plan/IMPLEMENTATION-PLAN.md": "# Implementation Plan — TDE Multiformalism Profile Epoch @4",
        "plan/IMPLEMENTATION-PLAN.md#refresh": "This Refresh materializes and validates the fresh @4 candidate.",
        "validation/VALIDATION-REPORT.md": "# Staged Validation Report — TDE Epoch @4",
    }
    title_checks = []
    for key, expected in title_expectations.items():
        relative = key.split("#", 1)[0]
        observed = (root / relative).read_text(encoding="utf-8")
        passed = expected in observed
        title_checks.append({"path": relative, "expected": expected, "status": "pass" if passed else "block"})
        if not passed:
            findings.append({"code": "CURRENT_IDENTITY_LABEL_INVALID", "path": relative, "expected": expected})

    candidate_fields = []
    for relative in (
        "plan/PLAN-STATUS.json",
        "plan/work-pack/shared/SWU-MANIFEST.json",
        "plan/work-pack/shared/EXECUTION-CONTRACTS.json",
        "validation/VALIDATION.json",
    ):
        value = json.loads((root / relative).read_text())
        observed = value.get("candidate_id")
        passed = observed == EXPECTED_ID
        candidate_fields.append({"path": relative, "observed": observed, "status": "pass" if passed else "block"})
        if not passed:
            findings.append({"code": "CANDIDATE_ID_INVALID", "path": relative, "observed": observed})

    result = {
        "schema_version": "domainspec-v2.tde-proposal-lifecycle-regression/v1",
        "status": "pass" if not findings else "block",
        "expected_candidate_id": EXPECTED_ID,
        "exact_staged_target_count": len(files),
        "scans_untracked_create_postimages": True,
        "findings": findings,
        "allowed_historical_provenance": allowed_historical,
        "current_identity_label_checks": title_checks,
        "candidate_field_checks": candidate_fields,
        "authority_effect": "none",
    }
    write_result(output, result)
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["status"] == "pass" else 2


def command(binding: Path, output: Path) -> int:
    document = json.loads(binding.read_text())
    staged_surfaces = document.get("staged_surfaces", [])
    apply_surfaces = document.get("apply_surfaces", [])
    expected_argv = document["staged_argv"]
    apply_argv = document["apply_argv"]
    findings: list[dict[str, Any]] = []
    try:
        index = expected_argv.index("--contracts")
        operand = Path(expected_argv[index + 1])
    except (ValueError, IndexError):
        operand = Path("__invalid__")
        findings.append({"code": "CONTRACTS_OPERAND_MISSING"})
    contracts = sorted(operand.glob("TDE-EPOCH-*-VALIDATION.json")) if operand.is_dir() else []
    if not operand.is_dir():
        findings.append({"code": "CONTRACTS_OPERAND_NOT_DIRECTORY", "operand": str(operand)})
    if len(contracts) != 10:
        findings.append({"code": "CONTRACT_COUNT_INVALID", "observed": len(contracts), "expected": 10})
    for surface in staged_surfaces:
        if surface.get("argv") != expected_argv:
            findings.append({"code": "ARGV_PARITY_INVALID", "surface": surface.get("surface")})
    for surface in apply_surfaces:
        if surface.get("argv") != apply_argv:
            findings.append({"code": "APPLY_ARGV_PARITY_INVALID", "surface": surface.get("surface")})
    try:
        apply_index = apply_argv.index("--contracts")
        apply_operand = Path(apply_argv[apply_index + 1])
    except (ValueError, IndexError):
        apply_operand = Path("__invalid__")
        findings.append({"code": "APPLY_CONTRACTS_OPERAND_MISSING"})
    if apply_operand.name == "VALIDATION-CONTRACTS.json" or apply_operand.name != "validation-contracts":
        findings.append({"code": "APPLY_CONTRACTS_OPERAND_KIND_INVALID", "operand": str(apply_operand)})

    completed = subprocess.run(
        expected_argv,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
    )
    if completed.returncode != 0 or "RESULT: pass" not in completed.stdout:
        findings.append(
            {
                "code": "EXACT_COMMAND_FAILED",
                "exit_code": completed.returncode,
                "output": completed.stdout,
            }
        )
    result = {
        "schema_version": "domainspec-v2.tde-proposal-command-binding-regression/v1",
        "status": "pass" if not findings else "block",
        "argv": expected_argv,
        "contracts_operand": str(operand),
        "contracts_operand_kind": "directory" if operand.is_dir() else "invalid",
        "matching_contract_count": len(contracts),
        "staged_surface_count": len(staged_surfaces),
        "apply_surface_count": len(apply_surfaces),
        "apply_argv": apply_argv,
        "apply_contracts_operand": str(apply_operand),
        "exact_command_exit": completed.returncode,
        "exact_command_output": completed.stdout,
        "findings": findings,
        "authority_effect": "none",
    }
    write_result(output, result)
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["status"] == "pass" else 2


def main() -> int:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="operation", required=True)
    lifecycle_parser = subparsers.add_parser("lifecycle")
    lifecycle_parser.add_argument("--staged-root", type=Path, required=True)
    lifecycle_parser.add_argument("--output", type=Path, required=True)
    command_parser = subparsers.add_parser("command")
    command_parser.add_argument("--binding", type=Path, required=True)
    command_parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.operation == "lifecycle":
        return lifecycle(args.staged_root, args.output)
    return command(args.binding, args.output)


if __name__ == "__main__":
    raise SystemExit(main())
