#!/usr/bin/env python3
"""Regression tests for the Knowledge Exchange Protocol product model."""

from __future__ import annotations

import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path


ORIGINAL_ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("knowledge_exchange_validate", ORIGINAL_ROOT / "validate.py")
assert SPEC and SPEC.loader
VALIDATOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(VALIDATOR)


class KnowledgeExchangeValidatorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.package_root = Path(self.temporary.name) / "knowledge-exchange-protocol"
        shutil.copytree(ORIGINAL_ROOT, self.package_root)
        VALIDATOR.PACKAGE_ROOT = self.package_root

    def tearDown(self) -> None:
        VALIDATOR.PACKAGE_ROOT = ORIGINAL_ROOT
        self.temporary.cleanup()

    def read_json(self, relative: str) -> dict:
        return json.loads((self.package_root / relative).read_text(encoding="utf-8"))

    def write_json(self, relative: str, value: dict) -> None:
        (self.package_root / relative).write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")

    def assert_blocked_with(self, expected: str) -> None:
        result = VALIDATOR.validate()
        self.assertEqual("BLOCK", result["status"])
        self.assertTrue(any(expected in error for error in result["errors"]), result["errors"])

    def test_baseline_is_deterministic_and_check_only(self) -> None:
        before = sorted(path.relative_to(self.package_root) for path in self.package_root.rglob("*"))
        first = VALIDATOR.validate()
        second = VALIDATOR.validate()
        after = sorted(path.relative_to(self.package_root) for path in self.package_root.rglob("*"))
        self.assertEqual("PASS", first["status"], first["errors"])
        self.assertEqual(first, second)
        self.assertEqual(before, after)

    def test_owner_set_rule_cannot_be_removed(self) -> None:
        ontology = self.read_json("business-ontology.json")
        ontology["rules"] = [rule for rule in ontology["rules"] if rule["rule_id"] != "KEP-RULE-OWNER-SET-MONOTONIC-FIRST-PROOF"]
        self.write_json("business-ontology.json", ontology)
        self.assert_blocked_with("missing required business rules")

    def test_model_cannot_claim_runtime_proof(self) -> None:
        ontology = self.read_json("business-ontology.json")
        ontology["proof_requirements"][0]["evidence_state"] = "PASS"
        self.write_json("business-ontology.json", ontology)
        self.assert_blocked_with("proof requirements must remain not_evaluable")

    def test_compromised_key_rule_cannot_be_removed(self) -> None:
        ontology = self.read_json("business-ontology.json")
        ontology["rules"] = [rule for rule in ontology["rules"] if rule["rule_id"] != "KEP-RULE-COMPROMISE-NEW-EPOCH"]
        self.write_json("business-ontology.json", ontology)
        self.assert_blocked_with("missing required business rules")

    def test_admitted_capability_cannot_lose_adoption(self) -> None:
        capability = self.read_json("grant-encrypted-knowledge-coownership.product-capability.json")
        capability["lifecycle_posture"]["commitment"]["value"] = "not-adopted"
        self.write_json("grant-encrypted-knowledge-coownership.product-capability.json", capability)
        result = VALIDATOR.validate()
        self.assertEqual("BLOCK", result["status"])
        self.assertTrue(any("adopted predecessor capability commitment" in error for error in result["errors"]), result["errors"])

    def test_definition_binding_cannot_be_removed(self) -> None:
        ontology = self.read_json("business-ontology.json")
        ontology["definition_bindings"] = [
            binding for binding in ontology["definition_bindings"] if binding["definition_id"] != "KEP-D11"
        ]
        self.write_json("business-ontology.json", ontology)
        self.assert_blocked_with("definition binding closure mismatch")

    def test_definition_digest_drift_blocks(self) -> None:
        ontology = self.read_json("business-ontology.json")
        ontology["definition_source"]["sha256"] = "0" * 64
        self.write_json("business-ontology.json", ontology)
        self.assert_blocked_with("ontology definition source digest drift")

    def test_admission_postimage_digest_drift_blocks(self) -> None:
        ontology = self.read_json("business-ontology.json")
        ontology["nodes"][0]["meaning"] += " Drifted after admission."
        self.write_json("business-ontology.json", ontology)
        self.assert_blocked_with("admission decision business_ontology postimage digest mismatch")

    def test_preacceptance_is_non_authoritative_and_does_not_require_decision(self) -> None:
        (self.package_root / "decisions/ontology-admission.json").unlink()
        result = VALIDATOR.validate(require_admission=False)
        self.assertEqual("PASS", result["status"], result["errors"])
        self.assertEqual("none", result["authority_effect"])

    def test_shared_schema_digest_drift_blocks(self) -> None:
        sources = self.read_json("product-thesis.sources.json")
        target = next(source for source in sources["sources"] if source["id"] == "SRC-KEP-PRODUCT-CAPABILITY-SCHEMA")
        target["sha256"] = "0" * 64
        self.write_json("product-thesis.sources.json", sources)
        self.assert_blocked_with("source digest drift: SRC-KEP-PRODUCT-CAPABILITY-SCHEMA")


if __name__ == "__main__":
    unittest.main()
