#!/usr/bin/env python3
"""Regression tests for the no-price Solana business ontology candidate."""

from __future__ import annotations

import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path


ORIGINAL_PACKAGE_ROOT = Path(__file__).resolve().parents[1]
ORIGINAL_PRODUCT_ROOT = Path(__file__).resolve().parents[4]
SPEC = importlib.util.spec_from_file_location("kep_solana_business_ontology_validate", ORIGINAL_PACKAGE_ROOT / "validate.py")
assert SPEC and SPEC.loader
VALIDATOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(VALIDATOR)


class SolanaBusinessOntologyValidationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.product_root = Path(self.temporary.name) / "knowledge-exchange-protocol"
        self.package_root = self.product_root / "capabilities/solana-coownership/ontology"
        self.package_root.parent.mkdir(parents=True)
        shutil.copytree(ORIGINAL_PACKAGE_ROOT, self.package_root)
        required = (
            "business-ontology.json",
            "decisions/ontology-admission.json",
            "realize-no-price-solana-coownership.product-capability.json",
            "capabilities/solana-coownership/authority/definitions/DEFINITIONS.md",
            "capabilities/solana-coownership/decisions/definition-set-acceptance-001.json",
            "capabilities/solana-coownership/decisions/product-capability-adoption-001.json",
        )
        for relative in required:
            source = ORIGINAL_PRODUCT_ROOT / relative
            target = self.product_root / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
        VALIDATOR.configure(self.package_root, self.product_root)

    def tearDown(self) -> None:
        VALIDATOR.configure(ORIGINAL_PACKAGE_ROOT, ORIGINAL_PRODUCT_ROOT)
        self.temporary.cleanup()

    def read_json(self, relative: str) -> dict:
        return json.loads((self.package_root / relative).read_text(encoding="utf-8"))

    def write_json(self, relative: str, value: dict) -> None:
        (self.package_root / relative).write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")

    def assert_blocked_with(self, marker: str) -> None:
        result = VALIDATOR.validate()
        self.assertEqual("BLOCK", result["status"])
        self.assertTrue(any(marker in error for error in result["errors"]), result["errors"])

    def test_baseline_is_deterministic_and_check_only(self) -> None:
        before = sorted(path.relative_to(self.product_root) for path in self.product_root.rglob("*"))
        first = VALIDATOR.validate()
        second = VALIDATOR.validate()
        after = sorted(path.relative_to(self.product_root) for path in self.product_root.rglob("*"))
        self.assertEqual("PASS", first["status"], first["errors"])
        self.assertEqual(first, second)
        self.assertEqual(before, after)
        self.assertEqual(10, first["counts"]["definition_bindings"])
        self.assertEqual("authored-candidate", first["lifecycle_status"])

    def test_source_digest_drift_blocks(self) -> None:
        path = self.product_root / "capabilities/solana-coownership/authority/definitions/DEFINITIONS.md"
        path.write_text(path.read_text(encoding="utf-8") + "\nunauthorized drift\n", encoding="utf-8")
        self.assert_blocked_with("source digest drift: SRC-KEP-SOL-DEFINITIONS")

    def test_definition_binding_cannot_be_removed(self) -> None:
        value = self.read_json("definition-bindings.json")
        value["bindings"] = [record for record in value["bindings"] if record["definition_id"] != "KEP-SOL-D10"]
        self.write_json("definition-bindings.json", value)
        self.assert_blocked_with("definition-binding ID closure drift")

    def test_dangling_relation_blocks(self) -> None:
        value = self.read_json("relations.json")
        value["relations"][0]["target"] = "CA2-MISSING-NODE"
        self.write_json("relations.json", value)
        self.assert_blocked_with("dangling relation target")

    def test_ontology_cannot_self_admit(self) -> None:
        value = self.read_json("profile.json")
        value["lifecycle_status"] = "admitted"
        self.write_json("profile.json", value)
        self.assert_blocked_with("business ontology must remain an authored candidate")

    def test_runtime_proof_cannot_be_claimed(self) -> None:
        value = self.read_json("proof-requirements.json")
        value["proof_requirements"][0]["evidence_state"] = "PASS"
        self.write_json("proof-requirements.json", value)
        self.assert_blocked_with("proof requirements must remain not_evaluable")

    def test_no_price_boundary_cannot_be_removed(self) -> None:
        value = self.read_json("rules.json")
        value["rules"] = [record for record in value["rules"] if record["rule_id"] != "KEP-SOL-RULE-NO-PRICE-SEPARATES-NETWORK-COST"]
        self.write_json("rules.json", value)
        self.assert_blocked_with("required business-rule closure drift")

    def test_adoption_cannot_authorize_domainspec(self) -> None:
        path = self.product_root / "capabilities/solana-coownership/decisions/product-capability-adoption-001.json"
        value = json.loads(path.read_text(encoding="utf-8"))
        value["successor_authorization"]["domainspec_v2"] = "authorized"
        path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")
        self.assert_blocked_with("Product Capability adoption decision digest drift")

    def test_duplicate_node_blocks(self) -> None:
        value = self.read_json("nodes.json")
        value["nodes"].append(dict(value["nodes"][0]))
        self.write_json("nodes.json", value)
        self.assert_blocked_with("duplicate node id")

    def test_candidate_material_digest_drift_blocks(self) -> None:
        value = self.read_json("candidate.json")
        value["material_digest"] = "0" * 64
        self.write_json("candidate.json", value)
        self.assert_blocked_with("ontology candidate material digest drift")


if __name__ == "__main__":
    unittest.main()
