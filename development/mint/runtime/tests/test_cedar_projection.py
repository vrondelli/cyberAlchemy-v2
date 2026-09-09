from __future__ import annotations

import copy
import importlib.util
import json
import subprocess
import sys
import unittest
from pathlib import Path

from jsonschema import Draft202012Validator


RUNTIME = Path(__file__).resolve().parents[1]
FIXTURE = Path(__file__).resolve().parent / "fixtures" / "authority-package" / "valid-minimal.json"


def load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


authority_package = load("authority_package", RUNTIME / "authority_package.py")
cedar = load("cedar_projection", RUNTIME / "cedar_projection.py")


def multi_kind_package(package: dict) -> dict:
    result = copy.deepcopy(package)
    second = copy.deepcopy(result["authority_kinds"][0])
    second["authority_kind_id"] = "KIND.MARKETPLACE-SECOND"
    result["authority_kinds"].append(second)
    result["methods"][0]["authority_kind_refs"].append(second["authority_kind_id"])
    result["record_inventory"]["authority_kinds"].append(second["authority_kind_id"])
    result["source_bindings"][0]["owning_record_refs"].append(second["authority_kind_id"])
    result["source_set_sha256"] = authority_package.source_set_digest(result)
    result["canonical_record_set_sha256"] = authority_package.record_set_digest(result)
    assert authority_package.validate_authority_package(result)["status"] == "valid"
    return result


class CedarProjectionTests(unittest.TestCase):
    def setUp(self) -> None:
        self.package = json.loads(FIXTURE.read_text(encoding="utf-8"))

    def test_contracts_are_valid_and_output_conforms(self) -> None:
        output = cedar.compile_cedar(self.package)
        for key, name in (
            ("projection", "authority-cedar-projection.v0.1.schema.json"),
            ("receipt", "authority-cedar-receipt.v0.1.schema.json"),
        ):
            schema = json.loads((RUNTIME / "contracts" / name).read_text())
            Draft202012Validator.check_schema(schema)
            Draft202012Validator(schema).validate(output[key])

    def test_one_kind_method_round_trips_with_exact_parity(self) -> None:
        output = cedar.compile_cedar(self.package)
        self.assertEqual(output["receipt"]["status"], "ready")
        self.assertEqual(len(output["projection"]["policies"]), 1)
        policy = output["projection"]["policies"][0]
        self.assertTrue(cedar.policy_has_parity(policy["policy"], policy["parsed_ast"]))
        self.assertEqual(output["projection"]["per_unit_parity"][0]["parity_state"], "pass")
        self.assertEqual(output["projection"]["residues"], [])

    def test_principal_action_resource_and_context_mutations_fail(self) -> None:
        policy = cedar.compile_cedar(self.package)["projection"]["policies"][0]
        original = policy["policy"]
        expected = policy["parsed_ast"]
        mutations = (
            original.replace("KIND.MARKETPLACE-CANDIDATE", "KIND.MUTATED"),
            original.replace("METHOD.PACKAGE-CHECK", "METHOD.MUTATED"),
            original.replace("DOMAIN.MARKETPLACE", "DOMAIN.MUTATED"),
            original.replace('"candidate"', '"active"'),
            original.replace("permit(", "forbid("),
        )
        for mutation in mutations:
            with self.subTest(mutation=mutation):
                self.assertFalse(cedar.policy_has_parity(mutation, expected))

    def test_multi_kind_method_emits_complete_translation_residue(self) -> None:
        output = cedar.compile_cedar(multi_kind_package(self.package))
        self.assertEqual(output["receipt"]["status"], "partial")
        self.assertEqual(output["projection"]["policies"], [])
        residue = output["projection"]["residues"][0]
        self.assertEqual(
            set(residue),
            {
                "residue_id", "residue_type", "source_operation_ref", "expected_condition",
                "observed_failure_locus", "reason_or_impossibility", "evidence_ref",
                "owner_route", "treatment", "action_effect", "promotion_effect",
            },
        )
        self.assertEqual(residue["residue_type"], "translation")
        self.assertEqual(residue["promotion_effect"], "block")

    def test_invalid_package_blocks_without_policies(self) -> None:
        invalid = copy.deepcopy(self.package)
        invalid["status"] = "validated"
        output = cedar.compile_cedar(invalid)
        self.assertEqual(output["receipt"]["status"], "blocked")
        self.assertEqual(output["projection"]["policies"], [])
        self.assertTrue(output["receipt"]["blockers"])

    def test_output_is_deterministic_and_zero_write(self) -> None:
        first = authority_package.canonical_bytes(cedar.compile_cedar(self.package))
        second = authority_package.canonical_bytes(cedar.compile_cedar(copy.deepcopy(self.package)))
        self.assertEqual(first, second)
        receipt = json.loads(first)["receipt"]
        self.assertEqual(receipt["writes_performed"], 0)
        self.assertEqual(receipt["authority_effect"], "none")
        self.assertIn("no official Cedar evaluation", receipt["proof_ceiling"])

    def test_cli_emits_ready_projection(self) -> None:
        run = subprocess.run(
            [sys.executable, str(RUNTIME / "mint.py"), "package-cedar", "--input", str(FIXTURE)],
            capture_output=True,
            check=False,
        )
        self.assertEqual(run.returncode, 0, run.stderr.decode())
        self.assertEqual(json.loads(run.stdout)["receipt"]["status"], "ready")


if __name__ == "__main__":
    unittest.main()
