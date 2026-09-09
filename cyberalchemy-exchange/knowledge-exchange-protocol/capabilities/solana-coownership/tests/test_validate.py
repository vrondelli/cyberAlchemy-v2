#!/usr/bin/env python3
"""Regression tests for the no-price Solana Product Capability candidate."""

from __future__ import annotations

import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path


ORIGINAL_PACKAGE_ROOT = Path(__file__).resolve().parents[1]
ORIGINAL_PRODUCT_ROOT = Path(__file__).resolve().parents[3]
SPEC = importlib.util.spec_from_file_location("kep_solana_capability_validate", ORIGINAL_PACKAGE_ROOT / "validate.py")
assert SPEC and SPEC.loader
VALIDATOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(VALIDATOR)


class SolanaCapabilityValidationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.product_root = Path(self.temporary.name) / "knowledge-exchange-protocol"
        self.package_root = self.product_root / "capabilities/solana-coownership"
        self.package_root.parent.mkdir(parents=True)
        shutil.copytree(ORIGINAL_PACKAGE_ROOT, self.package_root)
        shutil.copy2(
            ORIGINAL_PRODUCT_ROOT / "realize-no-price-solana-coownership.product-capability.json",
            self.product_root,
        )
        shutil.copy2(
            ORIGINAL_PRODUCT_ROOT / "grant-encrypted-knowledge-coownership.product-capability.json",
            self.product_root,
        )
        (self.product_root / "decisions").mkdir()
        shutil.copy2(ORIGINAL_PRODUCT_ROOT / "decisions/ontology-admission.json", self.product_root / "decisions")
        VALIDATOR.configure(self.package_root, self.product_root)

    def tearDown(self) -> None:
        VALIDATOR.configure(ORIGINAL_PACKAGE_ROOT, ORIGINAL_PRODUCT_ROOT)
        self.temporary.cleanup()

    def read_json(self, path: Path) -> dict:
        return json.loads(path.read_text(encoding="utf-8"))

    def write_json(self, path: Path, value: dict) -> None:
        path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")

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
        self.assertEqual("accepted", first["definition_status"])
        self.assertEqual("authored-candidate", first["capability_status"])

    def test_accepted_definition_digest_drift_blocks(self) -> None:
        path = self.package_root / "authority/definitions/DEFINITIONS.md"
        path.write_text(path.read_text(encoding="utf-8") + "\nunauthorized drift\n", encoding="utf-8")
        self.assert_blocked_with("accepted definition source digest drift")

    def test_owner_decision_must_remain_exact(self) -> None:
        path = self.package_root / "decisions/definition-set-acceptance-001.json"
        decision = self.read_json(path)
        decision["source"]["exact_user_decision"] = "Accept something else"
        self.write_json(path, decision)
        self.assert_blocked_with("does not preserve the exact owner decision")

    def test_definition_decision_cannot_authorize_implementation(self) -> None:
        path = self.package_root / "decisions/definition-set-acceptance-001.json"
        decision = self.read_json(path)
        decision["successor_authorization"]["implementation"] = "authorized"
        self.write_json(path, decision)
        self.assert_blocked_with("over-authorizes implementation")

    def test_capability_cannot_be_silently_adopted(self) -> None:
        path = self.product_root / "realize-no-price-solana-coownership.product-capability.json"
        capability = self.read_json(path)
        capability["lifecycle_posture"]["status"]["value"] = "adopted"
        self.write_json(path, capability)
        self.assert_blocked_with("must remain an authored candidate")

    def test_no_price_exclusion_cannot_be_removed(self) -> None:
        path = self.product_root / "realize-no-price-solana-coownership.product-capability.json"
        capability = self.read_json(path)
        capability["exclusions"] = [
            item
            for item in capability["exclusions"]
            if item != "knowledge price, escrow, seller payout, royalty, treasury consideration, or token transfer"
        ]
        self.write_json(path, capability)
        self.assert_blocked_with("no-price or secret-custody exclusions drift")

    def test_capability_schema_rejects_unknown_fields(self) -> None:
        path = self.product_root / "realize-no-price-solana-coownership.product-capability.json"
        capability = self.read_json(path)
        capability["implementation_authorized"] = True
        self.write_json(path, capability)
        self.assert_blocked_with("Product Capability schema violation")

    def test_candidate_digest_drift_blocks(self) -> None:
        path = self.package_root / "product-capability-candidate.json"
        candidate = self.read_json(path)
        candidate["capability"]["sha256"] = "0" * 64
        self.write_json(path, candidate)
        self.assert_blocked_with("candidate Product Capability digest drift")


if __name__ == "__main__":
    unittest.main()
