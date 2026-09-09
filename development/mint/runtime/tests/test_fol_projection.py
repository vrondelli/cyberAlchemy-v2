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
fol = load("fol_projection", RUNTIME / "fol_projection.py")


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


class FolProjectionTests(unittest.TestCase):
    def setUp(self) -> None:
        self.package = json.loads(FIXTURE.read_text(encoding="utf-8"))

    def test_contracts_are_valid_and_outputs_conform(self) -> None:
        output = fol.compile_fol(self.package)
        for key, name in (
            ("projection", "authority-fol-projection.v0.1.schema.json"),
            ("receipt", "authority-fol-receipt.v0.1.schema.json"),
        ):
            schema = json.loads((RUNTIME / "contracts" / name).read_text())
            Draft202012Validator.check_schema(schema)
            Draft202012Validator(schema).validate(output[key])

    def test_package_relations_and_invariants_round_trip(self) -> None:
        output = fol.compile_fol(self.package)
        projection = output["projection"]
        self.assertEqual(projection["status"], "ready")
        self.assertEqual(len(projection["statements"]), 25)
        self.assertTrue(all(item["parity_state"] == "pass" for item in projection["per_unit_parity"]))
        self.assertTrue(all(item["parity_state"] == "pass" for item in projection["invariant_parity"]))
        facts = [item["parsed_ast"] for item in projection["statements"] if item["statement_kind"] == "fact"]
        relations = {(item["predicate"], tuple(item["arguments"])) for item in facts}
        for rule in self.package["rules"]:
            self.assertIn(("rule_constitution", (rule["rule_id"], rule["constitution_ref"])), relations)
        method = self.package["methods"][0]
        self.assertIn(("method_kind", (method["method_id"], method["authority_kind_refs"][0])), relations)

    def test_predicate_and_argument_mutations_fail_parity(self) -> None:
        statements = fol.compile_fol(self.package)["projection"]["statements"]
        relation = next(item for item in statements if item["parsed_ast"].get("predicate") == "rule_constitution")
        mutations = (
            relation["statement"].replace("rule_constitution(", "rule_owner("),
            relation["statement"].replace("CONSTITUTION.MARKETPLACE", "CONSTITUTION.MUTATED"),
        )
        for mutation in mutations:
            with self.subTest(mutation=mutation):
                self.assertFalse(fol.statement_has_parity(mutation, relation["parsed_ast"]))

    def test_quantifier_mutation_fails_parity(self) -> None:
        statement, ast = fol.INVARIANTS["rule_constitution_total"]
        self.assertTrue(fol.statement_has_parity(statement, ast))
        self.assertFalse(fol.statement_has_parity(statement.replace("! [R]", "? [R]"), ast))
        self.assertFalse(fol.statement_has_parity(statement.replace("? [C]", "! [C]"), ast))

    def test_multi_kind_method_preserves_both_relations(self) -> None:
        package = multi_kind_package(self.package)
        output = fol.compile_fol(package)
        self.assertEqual(output["receipt"]["status"], "ready")
        facts = [item["parsed_ast"] for item in output["projection"]["statements"] if item["statement_kind"] == "fact"]
        method_relations = [item for item in facts if item["predicate"] == "method_kind"]
        self.assertEqual(len(method_relations), 2)

    def test_invalid_package_blocks_without_program(self) -> None:
        invalid = copy.deepcopy(self.package)
        invalid["status"] = "validated"
        output = fol.compile_fol(invalid)
        self.assertEqual(output["receipt"]["status"], "blocked")
        self.assertEqual(output["projection"]["program"], "")
        self.assertEqual(output["projection"]["statements"], [])

    def test_output_is_deterministic_zero_write_and_bounded(self) -> None:
        first = authority_package.canonical_bytes(fol.compile_fol(self.package))
        second = authority_package.canonical_bytes(fol.compile_fol(copy.deepcopy(self.package)))
        self.assertEqual(first, second)
        receipt = json.loads(first)["receipt"]
        self.assertEqual(receipt["writes_performed"], 0)
        self.assertEqual(receipt["authority_effect"], "none")
        self.assertIn("no theorem proving", receipt["proof_ceiling"])

    def test_cli_emits_ready_projection(self) -> None:
        run = subprocess.run(
            [sys.executable, str(RUNTIME / "mint.py"), "package-fol", "--input", str(FIXTURE)],
            capture_output=True,
            check=False,
        )
        self.assertEqual(run.returncode, 0, run.stderr.decode())
        self.assertEqual(json.loads(run.stdout)["receipt"]["status"], "ready")


if __name__ == "__main__":
    unittest.main()
