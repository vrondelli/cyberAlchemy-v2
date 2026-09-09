from __future__ import annotations

import copy
import hashlib
import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from jsonschema import Draft202012Validator


RUNTIME_DIR = Path(__file__).resolve().parents[1]
FIXTURE_DIR = Path(__file__).resolve().parent / "fixtures" / "authority-package"
VALID_FIXTURE = FIXTURE_DIR / "valid-minimal.json"
MATRIX_FIXTURE = FIXTURE_DIR / "case-mutations.json"
PACKAGE_SCHEMA = RUNTIME_DIR / "contracts" / "authority-package.v0.1.schema.json"
RECEIPT_SCHEMA = RUNTIME_DIR / "contracts" / "authority-package-validation-receipt.v0.1.schema.json"


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


authority_package = load_module("authority_package", RUNTIME_DIR / "authority_package.py")


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def resolve_pointer(document, pointer: str):
    parts = [part.replace("~1", "/").replace("~0", "~") for part in pointer.split("/")[1:]]
    current = document
    for part in parts[:-1]:
        current = current[int(part)] if isinstance(current, list) else current[part]
    return current, parts[-1] if parts else None


def apply_operations(base: dict, operations: list[dict]) -> dict:
    document = copy.deepcopy(base)
    for operation in operations:
        parent, key = resolve_pointer(document, operation["path"])
        if operation["op"] == "set":
            if key is None:
                document = copy.deepcopy(operation["value"])
            elif isinstance(parent, list):
                parent[int(key)] = copy.deepcopy(operation["value"])
            else:
                parent[key] = copy.deepcopy(operation["value"])
        elif operation["op"] == "append":
            target = document
            for part in operation["path"].split("/")[1:]:
                target = target[int(part)] if isinstance(target, list) else target[part]
            target.append(copy.deepcopy(operation["value"]))
        elif operation["op"] == "remove":
            if isinstance(parent, list):
                parent.pop(int(key))
            else:
                del parent[key]
        else:
            raise AssertionError(f"unsupported fixture operation: {operation['op']}")
    return document


def refresh_digests(document: dict) -> None:
    document["source_set_sha256"] = authority_package.source_set_digest(document)
    document["canonical_record_set_sha256"] = authority_package.record_set_digest(document)


class AuthorityPackageValidationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.valid = load_json(VALID_FIXTURE)
        cls.matrix = load_json(MATRIX_FIXTURE)["cases"]
        cls.package_schema = load_json(PACKAGE_SCHEMA)
        cls.receipt_schema = load_json(RECEIPT_SCHEMA)

    def case_document(self, case: dict) -> dict:
        document = apply_operations(self.valid, case["operations"])
        if case["refresh_digests"]:
            refresh_digests(document)
        return document

    def assert_receipt_schema(self, receipt: dict) -> None:
        Draft202012Validator(self.receipt_schema).validate(receipt)

    def test_contracts_are_draft_2020_12_and_valid(self) -> None:
        self.assertEqual(self.package_schema["$schema"], "https://json-schema.org/draft/2020-12/schema")
        self.assertEqual(self.receipt_schema["$schema"], "https://json-schema.org/draft/2020-12/schema")
        Draft202012Validator.check_schema(self.package_schema)
        Draft202012Validator.check_schema(self.receipt_schema)

    def test_smallest_complete_package_is_valid_and_receipt_conforms(self) -> None:
        Draft202012Validator(self.package_schema).validate(self.valid)
        receipt = authority_package.validate_authority_package(self.valid)
        self.assertEqual(receipt["status"], "valid")
        self.assertEqual(receipt["error_ids"], [])
        self.assertTrue(all(item["status"] == "pass" for item in receipt["validation_checks"]))
        self.assert_receipt_schema(receipt)

    def test_receipt_is_deterministic_and_path_independent(self) -> None:
        first = authority_package.canonical_bytes(authority_package.validate_authority_package(self.valid))
        second = authority_package.canonical_bytes(authority_package.validate_authority_package(copy.deepcopy(self.valid)))
        self.assertEqual(first, second)
        with tempfile.TemporaryDirectory() as temp:
            duplicate = Path(temp) / "renamed.json"
            duplicate.write_bytes(VALID_FIXTURE.read_bytes())
            self.assertEqual(
                authority_package.load_and_validate(VALID_FIXTURE),
                authority_package.load_and_validate(duplicate),
            )

    def test_semantic_canonicalization_sorts_record_and_set_arrays(self) -> None:
        reordered = copy.deepcopy(self.valid)
        reordered["source_bindings"][0]["owning_record_refs"].reverse()
        reordered["governed_actions"][0]["subject_refs"].reverse()
        reordered["rules"].reverse()
        self.assertEqual(
            authority_package.semantic_digest(self.valid),
            authority_package.semantic_digest(reordered),
        )
        self.assertEqual(
            authority_package.validate_authority_package(self.valid)["package_sha256"],
            authority_package.validate_authority_package(reordered)["package_sha256"],
        )

    def test_positive_four_facet_and_general_residue_cases(self) -> None:
        positives = [case for case in self.matrix if case["expected_status"] == "valid"]
        self.assertEqual(len(positives), 2)
        for case in positives:
            with self.subTest(case=case["name"]):
                receipt = authority_package.validate_authority_package(self.case_document(case))
                self.assertEqual(receipt["status"], "valid", receipt["errors"])
                self.assertEqual(receipt["error_ids"], [])
                self.assert_receipt_schema(receipt)

    def test_every_negative_fixture_blocks_with_stable_error_ids(self) -> None:
        negatives = [case for case in self.matrix if case["expected_status"] == "blocked"]
        self.assertGreaterEqual(len(negatives), 12)
        for case in negatives:
            with self.subTest(case=case["name"]):
                document = self.case_document(case)
                first = authority_package.validate_authority_package(document)
                second = authority_package.validate_authority_package(copy.deepcopy(document))
                self.assertEqual(first, second)
                self.assertEqual(first["status"], "blocked")
                self.assertTrue(set(case["expected_error_ids"]).issubset(first["error_ids"]), first)
                self.assert_receipt_schema(first)

    def test_d23_axes_are_separate_and_ambiguous_status_is_rejected(self) -> None:
        self.assertIn(self.valid["package_maturity"], {"draft", "candidate", "deprecated", "retired"})
        lifecycle = self.valid["definitions"][0]["lifecycle"]
        self.assertIn("lifecycle_status", lifecycle)
        self.assertIn("evidence_state", lifecycle)
        self.assertIn("commitment_state", lifecycle)
        case = next(item for item in self.matrix if item["name"] == "invalid-ambiguous-status-field")
        receipt = authority_package.validate_authority_package(self.case_document(case))
        self.assertIn("AP_STATUS_AXIS_COLLAPSE", receipt["error_ids"])

    def test_b1_b9_inventory_is_complete_ordered_and_linked(self) -> None:
        constitution = self.valid["constitutions"][0]
        self.assertEqual([item["baseline_id"] for item in constitution["baseline_inventory"]], list(authority_package.BASELINE_IDS))
        self.assertEqual([item["position"] for item in constitution["baseline_inventory"]], list(range(1, 10)))
        self.assertEqual([item["rule_ref"] for item in constitution["baseline_inventory"]], constitution["rule_refs"])

    def test_receipt_has_zero_effects_and_exact_proof_ceiling(self) -> None:
        receipt = authority_package.validate_authority_package(self.valid)
        for field in (
            "effects_planned", "effects_applied", "writes_attempted", "writes_performed",
            "external_commands_executed", "network_calls", "git_operations",
        ):
            self.assertEqual(receipt[field], 0)
        self.assertEqual(receipt["authority_effect"], "none")
        self.assertEqual(receipt["proof_ceiling"], authority_package.PROOF_CEILING)

    def test_cli_stdout_is_byte_identical_and_input_is_unchanged(self) -> None:
        command = [sys.executable, str(RUNTIME_DIR / "mint.py"), "package-check", "--input", str(VALID_FIXTURE)]
        before = file_sha256(VALID_FIXTURE)
        env = dict(os.environ)
        with tempfile.TemporaryDirectory() as cache:
            env["PYTHONPYCACHEPREFIX"] = cache
            first = subprocess.run(command, check=False, capture_output=True, env=env)
            second = subprocess.run(command, check=False, capture_output=True, env=env)
        self.assertEqual(first.returncode, 0, first.stderr.decode())
        self.assertEqual(second.returncode, 0, second.stderr.decode())
        self.assertEqual(first.stdout, second.stdout)
        self.assertEqual(before, file_sha256(VALID_FIXTURE))
        self.assertEqual(json.loads(first.stdout)["status"], "valid")

    def test_cli_executes_every_negative_case_with_exit_two(self) -> None:
        negatives = [case for case in self.matrix if case["expected_status"] == "blocked"]
        env = dict(os.environ)
        with tempfile.TemporaryDirectory() as temp, tempfile.TemporaryDirectory() as cache:
            env["PYTHONPYCACHEPREFIX"] = cache
            for index, case in enumerate(negatives):
                with self.subTest(case=case["name"]):
                    path = Path(temp) / f"negative-{index}.json"
                    path.write_bytes(authority_package.canonical_bytes(self.case_document(case)))
                    run = subprocess.run(
                        [sys.executable, str(RUNTIME_DIR / "mint.py"), "package-check", "--input", str(path)],
                        check=False, capture_output=True, env=env,
                    )
                    self.assertEqual(run.returncode, 2, run.stderr.decode())
                    receipt = json.loads(run.stdout)
                    self.assertEqual(receipt["status"], "blocked")
                    self.assertTrue(set(case["expected_error_ids"]).issubset(receipt["error_ids"]))


if __name__ == "__main__":
    unittest.main()
