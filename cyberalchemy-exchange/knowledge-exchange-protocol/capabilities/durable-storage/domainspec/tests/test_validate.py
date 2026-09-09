#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path


ORIGINAL = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("dst_domainspec_validate", ORIGINAL / "validate.py")
assert SPEC and SPEC.loader
VALIDATOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(VALIDATOR)


class DomainSpecCandidateTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name) / "domainspec"
        shutil.copytree(ORIGINAL, self.root)

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def result(self) -> dict[str, object]:
        return VALIDATOR.validate(self.root, native=False)

    def assert_block(self, marker: str) -> None:
        result = self.result()
        self.assertEqual("fail", result["result"])
        self.assertTrue(any(marker in error for error in result["errors"]), result["errors"])

    def test_deterministic_baseline(self) -> None:
        first = self.result()
        second = self.result()
        self.assertEqual("pass", first["result"], first["errors"])
        self.assertEqual(first, second)

    def test_authority_self_promotion_blocks(self) -> None:
        path = self.root / "binding.json"
        value = json.loads(path.read_text())
        value["authority_effect"] = "admit"
        path.write_text(json.dumps(value))
        self.assert_block("cannot have authority")

    def test_mapping_must_be_total(self) -> None:
        path = self.root / "binding.json"
        value = json.loads(path.read_text())
        value["ontology_rule_mappings"].pop(next(iter(value["ontology_rule_mappings"])))
        path.write_text(json.dumps(value))
        self.assert_block("ontology_rule_mappings is not total")

    def test_dangling_edge_blocks(self) -> None:
        path = next((self.root / "specs/durable-storage/edges").glob("*.json"))
        value = json.loads(path.read_text())
        value["target_node_id"] = "missing"
        path.write_text(json.dumps(value))
        self.assert_block("edge endpoint closure drift")

    def test_undeclared_source_blocks(self) -> None:
        path = self.root / "specs/durable-storage/nodes/undeclared.json"
        path.write_text("{}\n")
        self.assert_block("declared source closure drift")


if __name__ == "__main__":
    unittest.main()
