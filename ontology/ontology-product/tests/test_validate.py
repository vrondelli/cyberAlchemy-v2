#!/usr/bin/env python3
"""Regression checks for the Ontology Product ontology validator."""

from __future__ import annotations

import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path


ORIGINAL_ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("ontology_product_validate", ORIGINAL_ROOT / "validate.py")
assert SPEC and SPEC.loader
VALIDATOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(VALIDATOR)


class OntologyValidatorTests(unittest.TestCase):
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

    def test_wrong_profile_path_and_unknown_registry_key_block(self) -> None:
        profile = self.read_json("profile.json")
        profile["relation_registry"] = "other.json"
        self.write_json("profile.json", profile)
        nodes = self.read_json("nodes.json")
        nodes["unreviewed"] = []
        self.write_json("nodes.json", nodes)
        result = VALIDATOR.validate()
        self.assertEqual("BLOCK", result["status"])
        self.assertTrue(any("relation_registry" in error for error in result["errors"]))
        self.assertTrue(any("unreviewed" in error for error in result["errors"]))

    def test_invalid_node_enum_blocks(self) -> None:
        nodes = self.read_json("nodes.json")
        nodes["nodes"][0]["candidate_status"] = "accepted"
        self.write_json("nodes.json", nodes)
        self.assert_blocked_with("candidate_status")

    def test_conflicting_core_relationship_blocks(self) -> None:
        relations = self.read_json("relations.json")
        conflicting = dict(relations["relations"][0])
        conflicting["id"] = "CA2-REL-ONTOLOGY-PRODUCT-SUBPRODUCT-CONFLICT"
        conflicting["target"] = "CA2-PRODUCT-ONTOLOGY"
        relations["relations"].append(conflicting)
        self.write_json("relations.json", relations)
        self.assert_blocked_with("conflicting core relationship subproduct_of")

    def test_conflicting_goal_project_relationship_blocks(self) -> None:
        relations = self.read_json("relations.json")
        belongs_to = next(item for item in relations["relations"] if item["type"] == "belongs_to")
        conflicting = dict(belongs_to)
        conflicting["id"] = "CA2-REL-ONTOLOGY-GOAL-BELONGS-CONFLICT"
        conflicting["target"] = "CA2-PRODUCT-ONTOLOGY"
        relations["relations"].append(conflicting)
        self.write_json("relations.json", relations)
        self.assert_blocked_with("conflicting core relationship goal_project")

    def test_goal_residue_contract_blocks_wrong_status_subjects_and_wording(self) -> None:
        residue = self.read_json("residue.json")
        goal_residue = next(item for item in residue["residue"] if item["id"] == "CA2-RES-ONTOLOGY-PRODUCT-GOAL-PACKAGE")
        goal_residue["status"] = "open"
        goal_residue["subject_refs"] = ["CA2-GOAL-ONTOLOGY-PRODUCT-FOUNDATION"]
        goal_residue["description"] = "External Goal validation is pending."
        self.write_json("residue.json", residue)
        result = VALIDATOR.validate()
        self.assertEqual("BLOCK", result["status"])
        for marker in ("status must be blocked", "subjects must be exactly", "must state not_evaluated"):
            self.assertTrue(any(marker in error for error in result["errors"]), result["errors"])

    def test_stored_receipt_must_match_receipt_schema(self) -> None:
        receipt_path = next((self.package_root / "receipts").glob("validation-*.json"))
        receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
        receipt["unreviewed"] = True
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
