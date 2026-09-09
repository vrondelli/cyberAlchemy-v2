#!/usr/bin/env python3
"""Mutation tests for the Durable Storage business ontology."""

from __future__ import annotations

import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path


ORIGINAL_PACKAGE = Path(__file__).resolve().parents[1]
ORIGINAL_PRODUCT = ORIGINAL_PACKAGE.parents[2]
SPEC = importlib.util.spec_from_file_location("kep_dst_ontology_validate", ORIGINAL_PACKAGE / "validate.py")
assert SPEC and SPEC.loader
VALIDATOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(VALIDATOR)


class DurableStorageBusinessOntologyTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.product = Path(self.temporary.name) / "knowledge-exchange-protocol"
        durable_package = self.product / "capabilities/durable-storage"
        durable_package.parent.mkdir(parents=True)
        shutil.copytree(
            ORIGINAL_PACKAGE.parent,
            durable_package,
            ignore=shutil.ignore_patterns("target", "__pycache__"),
        )
        self.package = durable_package / "ontology"
        for relative in (
            "persist-and-verify-encrypted-knowledge-material.product-capability.json",
            "business-ontology.json",
        ):
            shutil.copy2(ORIGINAL_PRODUCT / relative, self.product / relative)

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def validate(self) -> dict[str, object]:
        return VALIDATOR.validate(self.package, self.product)

    def assert_blocked_with(self, marker: str) -> None:
        result = self.validate()
        self.assertEqual("BLOCK", result["status"])
        self.assertTrue(any(marker in error for error in result["errors"]), result["errors"])

    def test_baseline_is_deterministic_and_check_only(self) -> None:
        before = sorted(path.relative_to(self.product) for path in self.product.rglob("*") if path.is_file())
        first = self.validate()
        second = self.validate()
        after = sorted(path.relative_to(self.product) for path in self.product.rglob("*") if path.is_file())
        self.assertEqual("PASS", first["status"], first["errors"])
        self.assertEqual(first, second)
        self.assertEqual(before, after)
        self.assertEqual(15, first["counts"]["definition_bindings"])

    def test_dangling_relation_blocks(self) -> None:
        path = self.package / "relations.json"
        value = json.loads(path.read_text(encoding="utf-8"))
        value["relations"][0]["target"] = "CA2-MISSING"
        path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")
        self.assert_blocked_with("dangling relation target")

    def test_definition_binding_closure_blocks(self) -> None:
        path = self.package / "definition-bindings.json"
        value = json.loads(path.read_text(encoding="utf-8"))
        value["bindings"].pop()
        path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")
        self.assert_blocked_with("definition-binding closure drift")

    def test_proof_cannot_self_promote(self) -> None:
        path = self.package / "proof-requirements.json"
        value = json.loads(path.read_text(encoding="utf-8"))
        value["proof_requirements"][0]["evidence_state"] = "pass"
        path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")
        self.assert_blocked_with("candidate proofs must remain not_evaluable")

    def test_source_digest_drift_blocks(self) -> None:
        path = self.package / "sources.json"
        value = json.loads(path.read_text(encoding="utf-8"))
        value["sources"][0]["sha256"] = "0" * 64
        path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")
        self.assert_blocked_with("source digest drift")


if __name__ == "__main__":
    unittest.main()
