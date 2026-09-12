#!/usr/bin/env python3
from __future__ import annotations

import argparse
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
SUBJECT_COMMIT = "477799721668652988bf98a4a9067d08f5bdaebf"
ZERO_HASH = "0" * 64


def load_generator():
    path = ROOT / "generator/cases.py"
    specification = importlib.util.spec_from_file_location("evf_case_generator", path)
    if specification is None or specification.loader is None:
        raise RuntimeError("cannot load case generator")
    module = importlib.util.module_from_spec(specification)
    specification.loader.exec_module(module)
    return module


GENERATOR = load_generator()
EXPECTED_CASES = GENERATOR.enumerate_cases()
EXPECTED_BY_ID = {item["case_id"]: item for item in EXPECTED_CASES}


def schema_errors(schema_path: Path, value: Any) -> list[str]:
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    validator = Draft202012Validator(schema)
    return [error.message for error in validator.iter_errors(value)]


def raw(path: str) -> dict[str, Any]:
    return {"path": path, "size": 0, "sha256": hashlib.sha256(b"").hexdigest()}


def process(path: str) -> dict[str, Any]:
    return {
        "argv": ["/fixture/tool", "--case-id", path],
        "status": "completed",
        "exit_code": 0,
        "stdout": raw(f"raw/{path}.stdout"),
        "stderr": raw(f"raw/{path}.stderr"),
    }


def observation(case: dict[str, Any]) -> dict[str, Any]:
    return {
        "construction_ok": True,
        "inputs_disjoint": True,
        "merge_success": True,
        "source_unchanged": True,
        "rejection_destination_unchanged": True,
        "invariants_ok": True,
        "oracle_ok": True,
        "merge_calls": 2,
        "merge_rejections": 0,
        "visible_order": case["expected_visible_order"],
        "normal_form": f"normal::{case['delivery_order']}::{case['move_version']}",
        "sanitizer_diagnostic": "none",
    }


def case_row(case: dict[str, Any], tool_kind: str) -> dict[str, Any]:
    return {
        "schema_version": "evf.crabs-partial-knowledge-case-record/v1",
        "run_id": "fixture-run",
        "tool_kind": tool_kind,
        "case_id": case["case_id"],
        "delivery_order": case["delivery_order"],
        "move_version": case["move_version"],
        "role_permutation": case["role_permutation"],
        "association": case["association"],
        "expected_visible_order": case["expected_visible_order"],
        "process": process(f"{tool_kind}/{case['case_id']}"),
        "observation": observation(case),
        "convergence_status": "no-counterexample",
        "implementation_invariant_status": "no-detected-violation",
        "safety_status": "not-applicable" if tool_kind == "native" else "no-detected-violation",
    }


def base_receipt() -> dict[str, Any]:
    cases = [case_row(case, tool) for tool in ("native", "sanitizer") for case in EXPECTED_CASES]
    cbmc = []
    for representative, assertion in (
        ("b-newer", "EVF_CBMC_B_NEWER_CONVERGENCE"),
        ("c-newer", "EVF_CBMC_C_NEWER_CONVERGENCE"),
    ):
        cbmc.append(
            {
                "representative_id": representative,
                "property_id": "main.assertion.1",
                "assertion_text": assertion,
                "bound_manifest_sha256": "b" * 64,
                "bound_sufficiency_status": "pass",
                "process": process(f"cbmc/{representative}"),
                "cbmc_status": "no-counterexample-at-bound",
            }
        )
    return {
        "schema_version": "evf.crabs-partial-knowledge-run-record/v1",
        "run_id": "fixture-run",
        "subject_commit": SUBJECT_COMMIT,
        "plan_sha256": "a" * 64,
        "obligation_sha256": "c" * 64,
        "case_set_sha256": GENERATOR.case_set_digest(EXPECTED_CASES),
        "denominator": 48,
        "cases": cases,
        "cbmc": cbmc,
        "convergence_status": "no-counterexample-in-matrix",
        "implementation_invariant_status": "no-detected-violation",
        "safety_status": "no-detected-violation",
        "receipt_status": "pass",
        "promotion_verdict": "PASS",
        "summary": {
            "native_total": 48,
            "sanitizer_total": 48,
            "cbmc_total": 2,
            "native_counterexamples": 0,
            "invariant_violations": 0,
            "safety_violations": 0,
            "cbmc_counterexamples": 0,
            "not_evaluable": 0,
        },
        "authority_effect": "none",
        "claim_ceiling": "Synthetic fixture for receipt semantics only.",
    }


def expected_native(row: dict[str, Any]) -> tuple[str, str]:
    process_value = row["process"]
    observed = row["observation"]
    if process_value["status"] != "completed" or process_value["exit_code"] != 0 or not observed["construction_ok"]:
        return "not-evaluable", "not-evaluable"
    convergence = "no-counterexample"
    if not observed["merge_success"] or not observed["oracle_ok"]:
        convergence = "counterexample"
    invariant = "no-detected-violation"
    if (not observed["inputs_disjoint"] or not observed["source_unchanged"] or
            not observed["invariants_ok"] or
            (not observed["merge_success"] and not observed["rejection_destination_unchanged"])):
        invariant = "violation"
    return convergence, invariant


def expected_safety(row: dict[str, Any]) -> str:
    observed = row["observation"]
    if observed["sanitizer_diagnostic"] != "none":
        return "violation"
    process_value = row["process"]
    if process_value["status"] == "completed" and process_value["exit_code"] == 0:
        return "no-detected-violation"
    return "not-evaluable"


def validate_raw(row: dict[str, Any], attempt_root: Path, findings: list[str]) -> None:
    for stream in ("stdout", "stderr"):
        reference = row["process"][stream]
        candidate = (attempt_root / reference["path"]).resolve()
        if attempt_root.resolve() not in candidate.parents:
            findings.append("raw-path-escape")
            continue
        if not candidate.is_file():
            findings.append("raw-output-missing")
            continue
        content = candidate.read_bytes()
        if len(content) != reference["size"] or hashlib.sha256(content).hexdigest() != reference["sha256"]:
            findings.append("raw-output-digest")


def validate_receipt(value: dict[str, Any], attempt_root: Path | None = None) -> list[str]:
    findings: list[str] = []
    if schema_errors(ROOT / "schemas/run-record.schema.json", value):
        return ["schema-invalid"]
    for row in value["cases"]:
        if schema_errors(ROOT / "schemas/case-record.schema.json", row):
            return ["case-schema-invalid"]

    if value["subject_commit"] != SUBJECT_COMMIT:
        findings.append("subject-digest-mismatch")
    if value["denominator"] != 48 or value["case_set_sha256"] != GENERATOR.case_set_digest(EXPECTED_CASES):
        findings.append("denominator-or-case-set-mismatch")

    rows_by_tool: dict[str, list[dict[str, Any]]] = {
        "native": [row for row in value["cases"] if row["tool_kind"] == "native"],
        "sanitizer": [row for row in value["cases"] if row["tool_kind"] == "sanitizer"],
    }
    expected_ids = set(EXPECTED_BY_ID)
    for tool, rows in rows_by_tool.items():
        ids = [row["case_id"] for row in rows]
        if len(ids) != len(set(ids)):
            findings.append(f"duplicate-case-id:{tool}")
        if set(ids) != expected_ids:
            findings.append(f"case-coverage-mismatch:{tool}")

    native_expected: list[tuple[str, str]] = []
    sanitizer_expected: list[str] = []
    configuration_forms: dict[tuple[str, str], set[str]] = {}
    for row in value["cases"]:
        definition = EXPECTED_BY_ID.get(row["case_id"])
        if definition is None:
            continue
        bindings = ("delivery_order", "move_version", "role_permutation", "association", "expected_visible_order")
        if any(row[key] != definition[key] for key in bindings):
            findings.append("case-binding-mismatch")
        expected_convergence, expected_invariant = expected_native(row)
        if row["convergence_status"] != expected_convergence:
            findings.append("convergence-row-mismatch")
        if row["implementation_invariant_status"] != expected_invariant:
            findings.append("invariant-row-mismatch")
        if row["tool_kind"] == "native":
            native_expected.append((expected_convergence, expected_invariant))
            if expected_convergence == "no-counterexample":
                key = (row["delivery_order"], row["move_version"])
                configuration_forms.setdefault(key, set()).add(row["observation"]["normal_form"])
            if row["safety_status"] != "not-applicable":
                findings.append("native-safety-mismatch")
        else:
            safety = expected_safety(row)
            sanitizer_expected.append(safety)
            if row["safety_status"] != safety:
                findings.append("safety-row-mismatch")
        if row["observation"]["visible_order"] != row["expected_visible_order"] and row["observation"]["oracle_ok"]:
            findings.append("oracle-mismatch")
        if attempt_root is not None:
            validate_raw(row, attempt_root, findings)

    divergent = any(len(forms) > 1 for forms in configuration_forms.values())
    if any(status == "counterexample" for status, _ in native_expected) or divergent:
        convergence = "counterexample"
    elif any(status == "not-evaluable" for status, _ in native_expected) or len(native_expected) != 48:
        convergence = "not-evaluable"
    else:
        convergence = "no-counterexample-in-matrix"
    if divergent:
        findings.append("configuration-normal-form-divergence")

    if any(status == "violation" for _, status in native_expected):
        invariant = "violation"
    elif any(status == "not-evaluable" for _, status in native_expected) or len(native_expected) != 48:
        invariant = "not-evaluable"
    else:
        invariant = "no-detected-violation"

    if any(status == "violation" for status in sanitizer_expected):
        safety = "violation"
    elif any(status == "not-evaluable" for status in sanitizer_expected) or len(sanitizer_expected) != 48:
        safety = "not-evaluable"
    else:
        safety = "no-detected-violation"

    expected_cbmc = {
        "b-newer": ("main.assertion.1", "EVF_CBMC_B_NEWER_CONVERGENCE"),
        "c-newer": ("main.assertion.1", "EVF_CBMC_C_NEWER_CONVERGENCE"),
    }
    cbmc_by_id = {row["representative_id"]: row for row in value["cbmc"]}
    if set(cbmc_by_id) != set(expected_cbmc):
        findings.append("cbmc-coverage-mismatch")
    cbmc_statuses: list[str] = []
    for representative, expected in expected_cbmc.items():
        row = cbmc_by_id.get(representative)
        if row is None:
            cbmc_statuses.append("not-evaluable")
            continue
        if (row["property_id"], row["assertion_text"]) != expected:
            findings.append("cbmc-property-mismatch")
        process_value = row["process"]
        if row["bound_sufficiency_status"] != "pass":
            status = "not-evaluable"
        elif process_value["status"] != "completed":
            status = "not-evaluable"
        elif row["cbmc_status"] == "counterexample" and process_value["exit_code"] not in (None, 0):
            status = "counterexample"
        elif process_value["exit_code"] == 0:
            status = "no-counterexample-at-bound"
        else:
            status = "not-evaluable"
        cbmc_statuses.append(status)
        if row["cbmc_status"] != status:
            findings.append("cbmc-status-mismatch")
        if attempt_root is not None:
            validate_raw(row, attempt_root, findings)

    expected_summary = {
        "native_total": len(rows_by_tool["native"]),
        "sanitizer_total": len(rows_by_tool["sanitizer"]),
        "cbmc_total": len(value["cbmc"]),
        "native_counterexamples": sum(status == "counterexample" for status, _ in native_expected),
        "invariant_violations": sum(status == "violation" for _, status in native_expected),
        "safety_violations": sum(status == "violation" for status in sanitizer_expected),
        "cbmc_counterexamples": sum(status == "counterexample" for status in cbmc_statuses),
        "not_evaluable": (
            sum(status == "not-evaluable" or invariant_status == "not-evaluable" for status, invariant_status in native_expected)
            + sum(status == "not-evaluable" for status in sanitizer_expected)
            + sum(status == "not-evaluable" for status in cbmc_statuses)
        ),
    }
    if value["summary"] != expected_summary:
        findings.append("summary-mismatch")
    if value["convergence_status"] != convergence:
        findings.append("aggregate-convergence-mismatch")
    if value["implementation_invariant_status"] != invariant:
        findings.append("aggregate-invariant-mismatch")
    if value["safety_status"] != safety:
        findings.append("aggregate-safety-mismatch")

    subject_failure = convergence == "counterexample" or invariant == "violation" or safety == "violation" or "counterexample" in cbmc_statuses
    incomplete = convergence == "not-evaluable" or invariant == "not-evaluable" or safety == "not-evaluable" or "not-evaluable" in cbmc_statuses
    expected_promotion = "BLOCK" if subject_failure else ("PARTIAL_NOT_EVALUABLE" if incomplete else "PASS")
    if value["promotion_verdict"] != expected_promotion:
        findings.append("promotion-verdict-mismatch")

    expected_receipt = "pass" if not findings else "block"
    if value["receipt_status"] != expected_receipt:
        findings.append("receipt-status-mismatch")
    return sorted(set(findings))


def mutate(receipt: dict[str, Any], mutation: str) -> None:
    if mutation == "none":
        return
    if mutation == "wrong-denominator":
        receipt["denominator"] = 49
    elif mutation == "duplicate-case-id":
        receipt["cases"].append(copy.deepcopy(receipt["cases"][0]))
    elif mutation == "missing-case":
        receipt["cases"].pop(0)
    elif mutation == "pass-with-rejected-merge":
        receipt["cases"][0]["observation"]["merge_success"] = False
        receipt["cases"][0]["observation"]["merge_rejections"] = 1
    elif mutation == "wrong-expected-order":
        receipt["cases"][0]["expected_visible_order"] = "CAB"
    elif mutation == "sanitizer-violation-as-pass":
        receipt["cases"][48]["observation"]["sanitizer_diagnostic"] = "asan"
    elif mutation == "wrong-cbmc-property":
        receipt["cbmc"][0]["property_id"] = "main.assertion.99"
    elif mutation == "missing-raw-output-hash":
        del receipt["cases"][0]["process"]["stdout"]["sha256"]
    elif mutation == "wrong-subject-digest":
        receipt["subject_commit"] = "0" * 40
    elif mutation == "inconsistent-summary-totals":
        receipt["summary"]["native_total"] = 47
    elif mutation == "timeout-as-subject-failure":
        row = receipt["cases"][0]
        row["process"]["status"] = "timeout"
        row["process"]["exit_code"] = None
        row["convergence_status"] = "counterexample"
    else:
        raise ValueError(f"unknown fixture mutation: {mutation}")


def validate_suite(suite: Path) -> dict[str, Any]:
    rows: list[dict[str, Any]] = []
    for path in sorted(suite.rglob("*.json")):
        descriptor = json.loads(path.read_text(encoding="utf-8"))
        receipt = base_receipt()
        mutate(receipt, descriptor["mutation"])
        findings = validate_receipt(receipt)
        accepted = not findings
        expected_accept = descriptor["expect"] == "pass"
        expected_code = descriptor.get("expected_code")
        passed = accepted == expected_accept and (expected_code is None or expected_code in findings)
        rows.append({"fixture": str(path.relative_to(suite)), "passed": passed, "findings": findings})
    return {
        "schema_version": "evf.crabs-partial-knowledge-fixture-validation/v1",
        "fixtures": rows,
        "passed": bool(rows) and all(row["passed"] for row in rows),
        "authority_effect": "none",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--receipt", type=Path)
    group.add_argument("--suite", type=Path)
    parser.add_argument("--attempt-root", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    if args.suite:
        result: dict[str, Any] = validate_suite(args.suite)
        passed = result["passed"]
    else:
        value = json.loads(args.receipt.read_text(encoding="utf-8"))
        findings = validate_receipt(value, args.attempt_root)
        result = {"valid": not findings, "findings": findings}
        passed = not findings
    encoded = json.dumps(result, indent=2, sort_keys=True) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(encoded, encoding="utf-8")
    print(encoded, end="")
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
