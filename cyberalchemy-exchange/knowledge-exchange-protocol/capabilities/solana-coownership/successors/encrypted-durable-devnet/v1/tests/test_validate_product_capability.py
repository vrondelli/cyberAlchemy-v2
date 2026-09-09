#!/usr/bin/env python3
"""Regression tests for the encrypted, durable Devnet capability candidate."""

from __future__ import annotations

import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path


ORIGINAL_ROOT = Path(__file__).resolve().parents[1]
ORIGINAL_REPOSITORY_ROOT = ORIGINAL_ROOT.parents[7]
ORIGINAL_SOLANA_ROOT = ORIGINAL_ROOT.parents[2]
ORIGINAL_PRODUCT_ROOT = ORIGINAL_SOLANA_ROOT.parents[1]
SPEC = importlib.util.spec_from_file_location("encrypted_durable_devnet_validate", ORIGINAL_ROOT / "validate-product-capability.py")
assert SPEC and SPEC.loader
VALIDATOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(VALIDATOR)


class ProductCapabilityValidationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.temp_repository = Path(self.temporary.name)
        self.product_root = self.temp_repository / "cyberAlchemy-v2/product/knowledge-exchange-protocol"
        self.solana_root = self.product_root / "capabilities/solana-coownership"
        self.package_root = self.solana_root / "successors/encrypted-durable-devnet/v1"
        self.package_root.parent.mkdir(parents=True)
        shutil.copytree(ORIGINAL_ROOT, self.package_root)
        local_predecessors = (
            "authority/definitions/DEFINITIONS.md",
            "authority/definitions/successors/002/DEFINITIONS.md",
            "decisions/definition-set-acceptance-002.json",
            "decisions/product-capability-adoption-001.json",
        )
        for relative in local_predecessors:
            destination = self.solana_root / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(ORIGINAL_SOLANA_ROOT / relative, destination)
        self.product_root.mkdir(parents=True, exist_ok=True)
        shutil.copy2(
            ORIGINAL_PRODUCT_ROOT / "realize-no-price-solana-coownership.product-capability.json",
            self.product_root,
        )
        VALIDATOR.configure(self.package_root, ORIGINAL_REPOSITORY_ROOT)

    def tearDown(self) -> None:
        VALIDATOR.configure(ORIGINAL_ROOT, ORIGINAL_REPOSITORY_ROOT)
        self.temporary.cleanup()

    @staticmethod
    def read_json(path: Path) -> dict:
        return json.loads(path.read_text(encoding="utf-8"))

    @staticmethod
    def write_json(path: Path, value: dict) -> None:
        path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")

    def assert_blocked_with(self, marker: str) -> None:
        result = VALIDATOR.validate()
        self.assertEqual("BLOCK", result["status"])
        self.assertTrue(any(marker in error for error in result["errors"]), result["errors"])

    def test_baseline_is_deterministic_and_check_only(self) -> None:
        before = sorted(path.relative_to(self.temp_repository) for path in self.temp_repository.rglob("*"))
        first = VALIDATOR.validate()
        second = VALIDATOR.validate()
        after = sorted(path.relative_to(self.temp_repository) for path in self.temp_repository.rglob("*"))
        self.assertEqual("PASS", first["status"], first["errors"])
        self.assertEqual(first, second)
        self.assertEqual(before, after)
        self.assertEqual("authored-candidate", first["capability_status"])
        self.assertEqual("none", first["authority_effect"])

    def test_local_dependency_digest_drift_blocks(self) -> None:
        path = self.package_root / "cryptographic-profile.json"
        path.write_text(path.read_text(encoding="utf-8") + "\n", encoding="utf-8")
        self.assert_blocked_with("cryptographic profile digest drift")

    def test_git_object_drift_blocks(self) -> None:
        path = self.package_root / "product-capability-candidate.json"
        candidate = self.read_json(path)
        candidate["predecessors"]["durable_storage_product_capability"]["git_object"] = "HEAD"
        self.write_json(path, candidate)
        self.assert_blocked_with("Git object drift")

    def test_git_dependency_digest_drift_blocks(self) -> None:
        path = self.package_root / "product-capability-candidate.json"
        candidate = self.read_json(path)
        candidate["predecessors"]["sql_three_layer_product_capability"]["sha256"] = "0" * 64
        self.write_json(path, candidate)
        self.assert_blocked_with("SQL three-layer Product Capability digest drift")

    def test_crypto_suite_drift_blocks(self) -> None:
        path = self.package_root / "cryptographic-profile.json"
        profile = self.read_json(path)
        profile["recipient_envelope"]["mode"] = "Auth"
        self.write_json(path, profile)
        self.assert_blocked_with("recipient-envelope suite drift")

    def test_storage_readiness_removal_blocks(self) -> None:
        path = self.package_root / "durable-storage-instantiation.json"
        instantiation = self.read_json(path)
        instantiation["readiness_rule"]["conditions"].pop()
        self.write_json(path, instantiation)
        self.assert_blocked_with("pre-submission storage readiness drift")

    def test_finalized_activation_weakening_blocks(self) -> None:
        path = self.package_root / "durable-storage-instantiation.json"
        instantiation = self.read_json(path)
        instantiation["activation_rule"]["solana_commitment"] = "confirmed"
        self.write_json(path, instantiation)
        self.assert_blocked_with("finalized activation boundary drift")

    def test_reissue_authority_collapse_blocks(self) -> None:
        path = self.package_root / "durable-storage-instantiation.json"
        instantiation = self.read_json(path)
        instantiation["reissue_rule"]["first_trial_fulfiller"] = "B self-fulfills"
        self.write_json(path, instantiation)
        self.assert_blocked_with("reissue authority drift")

    def test_silent_adoption_blocks(self) -> None:
        path = self.package_root / "product-capability-candidate.json"
        candidate = self.read_json(path)
        candidate["adoption_status"] = "adopted"
        self.write_json(path, candidate)
        self.assert_blocked_with("adoption was not authorized")

    def test_schema_unknown_field_blocks(self) -> None:
        path = self.package_root / "product-capability.json"
        capability = self.read_json(path)
        capability["undeclared_authority"] = True
        self.write_json(path, capability)
        self.assert_blocked_with("Product Capability schema violation")


if __name__ == "__main__":
    unittest.main()
