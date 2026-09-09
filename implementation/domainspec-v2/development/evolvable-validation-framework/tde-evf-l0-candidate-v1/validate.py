#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import stat
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[5]
sys.path.insert(0, str(ROOT))

from evf.join import build_join  # noqa: E402
from evf.runner import run  # noqa: E402
from evf.souffle_adapter import materialize, translate  # noqa: E402
from tde.neutral_obligation import assert_provider_neutral, derive  # noqa: E402


def schema_check(instance: dict[str, object], name: str) -> None:
    from jsonschema import Draft202012Validator

    schema = json.loads((ROOT / "contracts" / name).read_text())
    Draft202012Validator(schema).validate(instance)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--souffle", type=Path)
    args = parser.parse_args()
    errors: list[str] = []
    suite = unittest.defaultTestLoader.discover(str(ROOT / "tests"))
    tests = unittest.TextTestRunner(stream=sys.stderr, verbosity=1).run(suite)
    if not tests.wasSuccessful():
        errors.append("L0 unit or negative-control test failure")

    profile = json.loads((ROOT / "profile.json").read_text())
    obligation, facts = derive(REPO, profile)
    assert_provider_neutral(obligation)
    schema_check(obligation, "tde-neutral-graph-obligation.v1.schema.json")
    translation = translate(obligation, facts, ROOT / "providers/reachability.dl")

    executable = args.souffle.resolve() if args.souffle else (ROOT / "fixtures/souffle_test_double.py").resolve()
    runtime_kind = "souffle-2.5" if args.souffle else "test-double"
    if not args.souffle:
        executable.chmod(executable.stat().st_mode | stat.S_IXUSR)
    with tempfile.TemporaryDirectory() as temp:
        facts_dir, output_dir = materialize(translation, Path(temp))
        receipt = run(
            executable, facts_dir, output_dir, Path(temp) / "reachability.dl",
            obligation, facts, translation["translation_receipt"], runtime_kind=runtime_kind,
        )
    join = build_join(obligation, receipt)
    schema_check(receipt, "evf-souffle-provider-receipt.v1.schema.json")
    schema_check(join, "evf-single-provider-bounded-join.v1.schema.json")

    expected = "SUPPORTED_BOUNDED" if args.souffle else "NOT_EVALUABLE"
    if join["status"] != expected:
        errors.append(f"unexpected current join status: {join['status']}")
    report = {
        "result": "PASS" if not errors else "BLOCK",
        "construction_layer": "L0",
        "selected_property": profile["selected_property"]["property_id"],
        "obligation_id": obligation["obligation_id"],
        "runtime_kind": runtime_kind,
        "provider_outcome": receipt["normalized_outcome"],
        "l0_product_evidence_status": join["status"],
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
