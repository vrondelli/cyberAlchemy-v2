#!/usr/bin/env python3
"""Regression checks for the Ontology Product thesis validator."""

from __future__ import annotations

import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path


ORIGINAL_ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("ontology_product_thesis_validate", ORIGINAL_ROOT / "validate.py")
assert SPEC and SPEC.loader
VALIDATOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(VALIDATOR)


class ThesisValidatorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.package_root = Path(self.temporary.name) / "ontology-product"
        shutil.copytree(ORIGINAL_ROOT, self.package_root)
        VALIDATOR.PACKAGE_ROOT = self.package_root

    def tearDown(self) -> None:
        VALIDATOR.PACKAGE_ROOT = ORIGINAL_ROOT
        self.temporary.cleanup()

    def read_json(self, relative: str) -> dict:
        return json.loads((self.package_root / relative).read_text(encoding="utf-8"))

    def write_json(self, relative: str, value: dict) -> None:
        (self.package_root / relative).write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")

    def assert_blocked_with(self, text: str) -> None:
        result = VALIDATOR.validate()
        self.assertEqual("BLOCK", result["status"])
        self.assertTrue(any(text in error for error in result["errors"]), result["errors"])

    def test_shared_schema_digest_drift_blocks(self) -> None:
        sources = self.read_json("product-thesis.sources.json")
        schema_source = next(source for source in sources["sources"] if source["id"] == "SRC-CAV2-PRODUCT-THESIS-SCHEMA")
        schema_source["sha256"] = "0" * 64
        self.write_json("product-thesis.sources.json", sources)
        self.assert_blocked_with("source digest drift: SRC-CAV2-PRODUCT-THESIS-SCHEMA")

    def test_invalid_schema_enum_and_type_block(self) -> None:
        record = self.read_json("product-thesis.record.json")
        record["commitment_state"] = "wishful"
        record["participants"] = "everyone"
        self.write_json("product-thesis.record.json", record)
        result = VALIDATOR.validate()
        self.assertEqual("BLOCK", result["status"])
        self.assertTrue(any("commitment_state" in error for error in result["errors"]))
        self.assertTrue(any("participants" in error for error in result["errors"]))

    def test_unknown_registry_top_level_key_blocks(self) -> None:
        sources = self.read_json("product-thesis.sources.json")
        sources["unreviewed"] = True
        self.write_json("product-thesis.sources.json", sources)
        self.assert_blocked_with("source registry unknown keys: unreviewed")

    def test_stored_receipt_must_match_receipt_schema(self) -> None:
        receipt_path = next((self.package_root / "receipts").glob("validation-*.json"))
        receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
        receipt["goal_package_validation"] = "passed"
        receipt_path.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
        self.assert_blocked_with("stored receipt")

    def test_unchanged_runs_are_deterministic_and_check_only(self) -> None:
        before = sorted(path.name for path in (self.package_root / "receipts").glob("*.json"))
        first = VALIDATOR.validate()
        second = VALIDATOR.validate()
        after = sorted(path.name for path in (self.package_root / "receipts").glob("*.json"))
        self.assertEqual("PASS", first["status"], first["errors"])
        self.assertEqual(first, second)
        self.assertEqual(before, after)


if __name__ == "__main__":
    unittest.main()
