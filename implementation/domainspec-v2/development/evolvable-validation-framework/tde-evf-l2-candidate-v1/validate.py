#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import sys
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[5]
L1 = ROOT.parent / "tde-evf-l1-candidate-v1"
L0 = ROOT.parent / "tde-evf-l0-candidate-v1"
sys.path.insert(0, str(L0))
sys.path.insert(0, str(L1))
sys.path.insert(0, str(ROOT))

from evf.runner import run as run_souffle  # noqa: E402
from evf.souffle_adapter import materialize as materialize_souffle  # noqa: E402
from evf.souffle_adapter import translate as translate_souffle  # noqa: E402
from l1.alloy_adapter import materialize as materialize_alloy  # noqa: E402
from l1.alloy_adapter import translate as translate_alloy  # noqa: E402
from l1.alloy_runner import run as run_alloy  # noqa: E402
from l2.control_matrix import run_matrix  # noqa: E402
from l2.hardening import capture_provider, evaluate  # noqa: E402
from tde.neutral_obligation import derive  # noqa: E402


def bound_path(binding: dict[str, object], key: str) -> Path:
    runtime = binding["runtimes"][key]
    path = (REPO / runtime["path"]).resolve()
    if not path.is_file():
        raise ValueError(f"bound {key} runtime is missing: {runtime['path']}")
    if hashlib.sha256(path.read_bytes()).hexdigest() != runtime["sha256"]:
        raise ValueError(f"bound {key} runtime digest drift")
    return path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--use-local-runtimes", action="store_true")
    args = parser.parse_args()
    errors: list[str] = []
    tests = unittest.TextTestRunner(stream=sys.stderr, verbosity=1).run(
        unittest.defaultTestLoader.discover(str(ROOT / "tests"))
    )
    if not tests.wasSuccessful():
        errors.append("L2 construction or negative-control tests failed")

    if not args.use_local_runtimes:
        report = {
            "result": "PASS" if not errors else "BLOCK",
            "construction_layer": "L2",
            "construction_tests": "PASS" if tests.wasSuccessful() else "BLOCK",
            "l2_product_evidence_status": "NOT_EVALUABLE",
            "residue": ["exact-local-provider-run-not-requested"],
            "errors": errors,
            "authority_effect": "none",
            "product_approval": "not-granted",
            "runtime_admission": "not-granted",
            "release_admission": "not-granted",
        }
        print(json.dumps(report, indent=2))
        return 1 if errors else 0

    profile = json.loads((ROOT / "profile.json").read_text())
    l0_profile = json.loads((L0 / "profile.json").read_text())
    binding = json.loads((L1 / "runtime-bindings.local.json").read_text())
    if (
        binding.get("status") != "available-local-not-admitted"
        or binding.get("authority_effect") != "none"
        or binding.get("runtime_admission") != "not-granted"
    ):
        errors.append("local runtime binding posture drift")
    souffle_path = bound_path(binding, "souffle")
    java_path = bound_path(binding, "java")
    alloy_path = bound_path(binding, "alloy")

    obligation, facts = derive(REPO, l0_profile)
    if obligation["obligation_id"] != profile["predecessor"]["expected_obligation_id"]:
        errors.append("stable predecessor obligation identity drift")

    with tempfile.TemporaryDirectory() as souffle_temp, tempfile.TemporaryDirectory() as alloy_temp:
        st = translate_souffle(obligation, facts, L0 / "providers/reachability.dl")
        sf, so = materialize_souffle(st, Path(souffle_temp))
        souffle_capture = capture_provider("souffle", lambda: run_souffle(
            souffle_path, sf, so, Path(souffle_temp) / "reachability.dl",
            obligation, facts, st["translation_receipt"], runtime_kind="souffle-2.5",
        ))
        at = translate_alloy(obligation, facts)
        model, ao = materialize_alloy(at, Path(alloy_temp))
        alloy_capture = capture_provider("alloy", lambda: run_alloy(
            model, ao, obligation, facts, at, runtime_kind="alloy-6.2.0",
            java_executable=java_path, alloy_jar=alloy_path,
        ))

    receipts = {
        "souffle": souffle_capture["receipt"],
        "alloy": alloy_capture["receipt"],
    }
    failures = {
        item["provider"]: item["failure"]
        for item in (souffle_capture, alloy_capture)
        if item["failure"] is not None
    }
    translations = {
        "souffle": st["translation_receipt"]["translation_digest"],
        "alloy": at["translation_receipt"]["translation_digest"],
    }
    epoch = datetime.now(timezone.utc)
    evaluation = evaluate(
        REPO, obligation, facts, translations, binding, receipts,
        failures=failures, evaluated_at=epoch,
        max_age_seconds=profile["hardening_policy"]["freshness_limit_seconds"],
        max_timeout_seconds=profile["hardening_policy"]["max_provider_timeout_seconds"],
        max_output_bytes=profile["hardening_policy"]["max_provider_output_bytes"],
    )
    from jsonschema import Draft202012Validator

    schema = json.loads((ROOT / "contracts/evf-l2-hardening-evaluation.v1.schema.json").read_text())
    Draft202012Validator(schema).validate(evaluation)
    matrix = None
    if not failures and all(receipts.values()):
        matrix = run_matrix(REPO, obligation, facts, translations, binding, receipts, evaluated_at=epoch)
    if evaluation["status"] != "SUPPORTED_BOUNDED":
        errors.append(f"real-provider positive control did not support the bound: {evaluation['status']}")
    if matrix is None or not matrix["all_controls_passed"]:
        errors.append("L2 negative-control matrix did not close")

    report = {
        "result": "PASS" if not errors else "BLOCK",
        "construction_layer": "L2",
        "obligation_id": obligation["obligation_id"],
        "positive_control_status": evaluation["status"],
        "control_matrix": {
            "matrix_entries": len(matrix["controls"]) if matrix else 1 + len(profile["declared_hardening_controls"]),
            "passed": sum(1 for item in matrix["controls"] if item["passed"]) if matrix else 0,
            "all_passed": bool(matrix and matrix["all_controls_passed"]),
        },
        "l2_product_evidence_status": "SUPPORTED_BOUNDED" if not errors else "NOT_EVALUABLE",
        "residue": evaluation["residue"],
        "errors": errors,
        "authority_effect": "none",
        "product_approval": "not-granted",
        "runtime_admission": "not-granted",
        "release_admission": "not-granted",
    }
    print(json.dumps(report, indent=2))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
