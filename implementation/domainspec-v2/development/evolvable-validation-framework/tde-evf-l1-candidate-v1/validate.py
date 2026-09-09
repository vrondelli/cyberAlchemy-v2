#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import stat
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[5]
L0 = ROOT.parent / "tde-evf-l0-candidate-v1"
sys.path.insert(0, str(L0))
sys.path.insert(0, str(ROOT))

from evf.runner import run as run_souffle  # noqa: E402
from evf.souffle_adapter import materialize as materialize_souffle  # noqa: E402
from evf.souffle_adapter import translate as translate_souffle  # noqa: E402
from l1.alloy_adapter import materialize as materialize_alloy  # noqa: E402
from l1.alloy_adapter import translate as translate_alloy  # noqa: E402
from l1.alloy_runner import run as run_alloy  # noqa: E402
from l1.dual_join import build_join  # noqa: E402
from tde.neutral_obligation import derive  # noqa: E402


def schema_check(instance: dict[str, object], path: Path) -> None:
    from jsonschema import Draft202012Validator

    Draft202012Validator(json.loads(path.read_text())).validate(instance)


def bound_path(binding: dict[str, object], key: str) -> Path:
    runtime = binding["runtimes"][key]
    path = (REPO / runtime["path"]).resolve()
    if not path.is_file():
        raise ValueError(f"bound {key} runtime is missing: {runtime['path']}")
    actual = hashlib.sha256(path.read_bytes()).hexdigest()
    if actual != runtime["sha256"]:
        raise ValueError(f"bound {key} runtime digest drift")
    return path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--souffle", type=Path)
    parser.add_argument("--java", type=Path)
    parser.add_argument("--alloy-jar", type=Path)
    parser.add_argument("--use-local-runtimes", action="store_true")
    args = parser.parse_args()
    if args.use_local_runtimes and any((args.souffle, args.java, args.alloy_jar)):
        parser.error("--use-local-runtimes cannot be combined with explicit runtime paths")
    if args.use_local_runtimes:
        binding = json.loads((ROOT / "runtime-bindings.local.json").read_text())
        if (
            binding.get("status") != "available-local-not-admitted"
            or binding.get("authority_effect") != "none"
            or binding.get("runtime_admission") != "not-granted"
        ):
            raise ValueError("local runtime binding status or authority drift")
        args.souffle = bound_path(binding, "souffle")
        args.java = bound_path(binding, "java")
        args.alloy_jar = bound_path(binding, "alloy")
    if any((args.java, args.alloy_jar)) and not all((args.java, args.alloy_jar)):
        parser.error("--java and --alloy-jar must be supplied together")
    errors: list[str] = []
    tests = unittest.TextTestRunner(stream=sys.stderr, verbosity=1).run(
        unittest.defaultTestLoader.discover(str(ROOT / "tests"))
    )
    if not tests.wasSuccessful():
        errors.append("L1 unit or negative-control test failure")

    l0_profile = json.loads((L0 / "profile.json").read_text())
    l1_profile = json.loads((ROOT / "profile.json").read_text())
    obligation, facts = derive(REPO, l0_profile)
    if obligation["obligation_id"] != l1_profile["predecessor"]["expected_obligation_id"]:
        errors.append("L0 obligation identity drift")

    souffle_runtime = "souffle-2.5" if args.souffle else "test-double"
    alloy_runtime = "alloy-6.2.0" if args.java and args.alloy_jar else "test-double"
    souffle_fixture = (L0 / "fixtures/souffle_test_double.py").resolve()
    alloy_fixture = (ROOT / "fixtures/alloy_test_double.py").resolve()
    for fixture in (souffle_fixture, alloy_fixture):
        fixture.chmod(fixture.stat().st_mode | stat.S_IXUSR)

    with tempfile.TemporaryDirectory() as souffle_temp, tempfile.TemporaryDirectory() as alloy_temp:
        souffle_translation = translate_souffle(obligation, facts, L0 / "providers/reachability.dl")
        souffle_facts, souffle_output = materialize_souffle(souffle_translation, Path(souffle_temp))
        souffle = run_souffle(
            args.souffle.resolve() if args.souffle else souffle_fixture,
            souffle_facts, souffle_output, Path(souffle_temp) / "reachability.dl",
            obligation, facts, souffle_translation["translation_receipt"], runtime_kind=souffle_runtime,
        )
        alloy_translation = translate_alloy(obligation, facts)
        model, alloy_output = materialize_alloy(alloy_translation, Path(alloy_temp))
        alloy = run_alloy(
            model, alloy_output, obligation, facts, alloy_translation,
            runtime_kind=alloy_runtime,
            java_executable=args.java.resolve() if args.java else None,
            alloy_jar=args.alloy_jar.resolve() if args.alloy_jar else None,
            fixture_executable=alloy_fixture if alloy_runtime == "test-double" else None,
        )
    join = build_join(obligation, souffle, alloy)
    schema_check(alloy, ROOT / "contracts/evf-alloy-provider-receipt.v1.schema.json")
    schema_check(join, ROOT / "contracts/evf-dual-provider-bounded-join.v1.schema.json")
    exact_runtimes = souffle_runtime == "souffle-2.5" and alloy_runtime == "alloy-6.2.0"
    expected = "SUPPORTED_BOUNDED" if exact_runtimes else "NOT_EVALUABLE"
    if join["status"] != expected:
        errors.append(f"unexpected current dual-join status: {join['status']}")
    report = {
        "result": "PASS" if not errors else "BLOCK",
        "construction_layer": "L1",
        "obligation_id": obligation["obligation_id"],
        "runtimes": {"souffle": souffle_runtime, "alloy": alloy_runtime},
        "mapped_results": join["mapped_results"],
        "consistency_class": join["consistency_class"],
        "l1_product_evidence_status": join["status"],
        "residue": join["residue"],
        "errors": errors,
        "authority_effect": "none",
        "product_approval": "not-granted",
        "release_admission": "not-granted",
    }
    print(json.dumps(report, indent=2))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
