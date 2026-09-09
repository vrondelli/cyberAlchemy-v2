#!/usr/bin/env python3
from __future__ import annotations

import copy
import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
VALIDATOR_PATH = PACKAGE_ROOT / "scripts/validate.py"
SPEC = importlib.util.spec_from_file_location("cav2_review_validate", VALIDATOR_PATH)
assert SPEC and SPEC.loader
validator = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(validator)


def write_json(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")


class ReviewCapabilityNegativeMutations(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name) / "review"
        shutil.copytree(PACKAGE_ROOT, self.root)

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def validate(self) -> dict:
        return validator.validate_package(self.root, skip_build=True)

    def test_source_selection_drift_blocks(self) -> None:
        path = self.root / "sources.json"
        value = json.loads(path.read_text())
        value["selections"][0]["sha256"] = "0" * 64
        write_json(path, value)
        result = self.validate()
        self.assertEqual("BLOCK", result["status"])
        self.assertTrue(any("source selection digest drift" in item for item in result["errors"]))

    def test_missing_support_record_blocks(self) -> None:
        path = self.root / "capabilities/support.json"
        value = json.loads(path.read_text())
        value["records"] = [item for item in value["records"] if item["id"] != "CA2-CAP-CONTRACT-DECISION-RESULT"]
        write_json(path, value)
        result = self.validate()
        self.assertEqual("BLOCK", result["status"])
        self.assertTrue(any("support refs missing" in item for item in result["errors"]))

    def test_dangling_business_relation_blocks(self) -> None:
        path = self.root / "business-ontology.json"
        value = json.loads(path.read_text())
        value["relations"][0]["target"] = "CA2-MISSING"
        write_json(path, value)
        result = self.validate()
        self.assertEqual("BLOCK", result["status"])
        self.assertTrue(any("relation endpoint missing" in item for item in result["errors"]))

    def test_conformance_inflation_blocks(self) -> None:
        path = self.root / "conformance.json"
        value = json.loads(path.read_text())
        value["status"] = "PASS"
        write_json(path, value)
        result = self.validate()
        self.assertEqual("BLOCK", result["status"])
        self.assertTrue(any("conformance" in item.lower() for item in result["errors"]))


if __name__ == "__main__":
    unittest.main()
