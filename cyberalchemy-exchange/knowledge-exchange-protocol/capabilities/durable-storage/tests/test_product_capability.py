#!/usr/bin/env python3
"""Mutation tests for the Durable Storage Product Capability candidate."""

from __future__ import annotations

import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path


ORIGINAL_PACKAGE = Path(__file__).resolve().parents[1]
ORIGINAL_PRODUCT = ORIGINAL_PACKAGE.parents[1]
SPEC = importlib.util.spec_from_file_location(
    "kep_durable_storage_capability_validate",
    ORIGINAL_PACKAGE / "validate-product-capability.py",
)
assert SPEC and SPEC.loader
VALIDATOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(VALIDATOR)


class DurableStorageProductCapabilityTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.product = Path(self.temporary.name) / "knowledge-exchange-protocol"
        self.package = self.product / "capabilities/durable-storage"
        self.package.parent.mkdir(parents=True)
        shutil.copytree(
            ORIGINAL_PACKAGE,
            self.package,
            ignore=shutil.ignore_patterns("target", "__pycache__"),
        )
        shutil.copy2(
            ORIGINAL_PRODUCT / "persist-and-verify-encrypted-knowledge-material.product-capability.json",
            self.product,
        )

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def validate(self) -> dict[str, object]:
        return VALIDATOR.validate_candidate(self.package, self.product)

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
        self.assertEqual(15, first["definition_count"])

    def test_capability_digest_drift_blocks(self) -> None:
        path = self.product / "persist-and-verify-encrypted-knowledge-material.product-capability.json"
        capability = json.loads(path.read_text(encoding="utf-8"))
        capability["outcome"] += " drift"
        path.write_text(json.dumps(capability, indent=2) + "\n", encoding="utf-8")
        self.assert_blocked_with("candidate capability digest drift")

    def test_provider_selection_blocks(self) -> None:
        path = self.product / "persist-and-verify-encrypted-knowledge-material.product-capability.json"
        capability = json.loads(path.read_text(encoding="utf-8"))
        capability["scope"] += " Use Arweave."
        path.write_text(json.dumps(capability, indent=2) + "\n", encoding="utf-8")
        self.assert_blocked_with("selects provider")

    def test_responsibility_lane_cannot_disappear(self) -> None:
        path = self.package / "product-capability-candidate.json"
        envelope = json.loads(path.read_text(encoding="utf-8"))
        del envelope["responsibility_boundary"]["consumer_instantiation_owns"]
        path.write_text(json.dumps(envelope, indent=2) + "\n", encoding="utf-8")
        self.assert_blocked_with("three-owner responsibility boundary drift")

    def test_definition_acceptance_digest_drift_blocks(self) -> None:
        path = self.package / "product-capability-candidate.json"
        envelope = json.loads(path.read_text(encoding="utf-8"))
        envelope["predecessors"]["definition_acceptance"]["sha256"] = "0" * 64
        path.write_text(json.dumps(envelope, indent=2) + "\n", encoding="utf-8")
        self.assert_blocked_with("candidate predecessor acceptance digest drift")


if __name__ == "__main__":
    unittest.main()
