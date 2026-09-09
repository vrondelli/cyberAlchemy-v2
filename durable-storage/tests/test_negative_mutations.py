#!/usr/bin/env python3
"""Hostile mutation tests for the Durable Capability State model."""

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
SPEC = importlib.util.spec_from_file_location("durable_storage_validate", VALIDATOR_PATH)
assert SPEC and SPEC.loader
VALIDATOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(VALIDATOR)


class DurableStorageNegativeMutationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.package = Path(self.temp.name) / "durable-storage"
        shutil.copytree(PACKAGE_ROOT, self.package)
        self.original_package_root = VALIDATOR.PACKAGE_ROOT
        VALIDATOR.PACKAGE_ROOT = self.package

    def tearDown(self) -> None:
        VALIDATOR.PACKAGE_ROOT = self.original_package_root
        self.temp.cleanup()

    def load(self, relative: str) -> dict:
        return json.loads((self.package / relative).read_text(encoding="utf-8"))

    def save(self, relative: str, value: dict) -> None:
        (self.package / relative).write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")

    def assert_blocked(self, mutation) -> None:
        mutation()
        result = VALIDATOR.validate()
        self.assertEqual("BLOCK", result["status"], result)
        self.assertTrue(result["errors"], result)

    def test_baseline_passes(self) -> None:
        result = VALIDATOR.validate()
        self.assertEqual("PASS", result["status"], result)

    def test_source_digest_drift_blocks(self) -> None:
        def mutate() -> None:
            value = self.load("sources.json")
            value["sources"][0]["sha256"] = "0" * 64
            self.save("sources.json", value)
        self.assert_blocked(mutate)

    def test_missing_capability_coverage_blocks(self) -> None:
        def mutate() -> None:
            value = self.load("storage-requirements.json")
            value["requirements"].pop()
            self.save("storage-requirements.json", value)
        self.assert_blocked(mutate)

    def test_duplicate_capability_coverage_blocks(self) -> None:
        def mutate() -> None:
            value = self.load("storage-requirements.json")
            duplicate = copy.deepcopy(value["requirements"][0])
            duplicate["requirement_id"] = "DS-REQ-DUPLICATE"
            value["requirements"].append(duplicate)
            self.save("storage-requirements.json", value)
        self.assert_blocked(mutate)

    def test_external_capability_assignment_blocks(self) -> None:
        def mutate() -> None:
            value = self.load("storage-requirements.json")
            external = next(item for item in value["requirements"] if item["subject_ref"] == "CA2-REF-ARC-INVOKE-DEFINE")
            external["need_posture"] = "evidenced-existing"
            external["binding_state"] = "unselected"
            external["artifact_kinds"] = ["public-runtime-state"]
            external["durability_class_refs"] = ["DS-CLASS-AUTHORITATIVE-VERSIONED"]
            self.save("storage-requirements.json", value)
        self.assert_blocked(mutate)

    def test_path_capture_blocks(self) -> None:
        def mutate() -> None:
            value = self.load("storage-requirements.json")
            value["requirements"][0]["artifact_kinds"] = ["cyberAlchemy-v2/**"]
            self.save("storage-requirements.json", value)
        self.assert_blocked(mutate)

    def test_selected_provider_blocks(self) -> None:
        def mutate() -> None:
            value = self.load("product-capability-support.json")
            value["realization_binding"]["provider_ref"] = "DS-PROVIDER-LOCAL-FILESYSTEM"
            self.save("product-capability-support.json", value)
        self.assert_blocked(mutate)

    def test_authority_inflation_blocks(self) -> None:
        def mutate() -> None:
            value = self.load("nodes.json")
            value["nodes"][0]["authority_effect"] = "granted"
            self.save("nodes.json", value)
        self.assert_blocked(mutate)

    def test_unknown_relation_endpoint_blocks(self) -> None:
        def mutate() -> None:
            value = self.load("relations.json")
            value["relations"][0]["target"] = "DS-MISSING-NODE"
            self.save("relations.json", value)
        self.assert_blocked(mutate)

    def test_product_identity_change_blocks(self) -> None:
        def mutate() -> None:
            value = self.load("product-capability.json")
            value["product_ref"] = "CA2-PRODUCT-OTHER"
            self.save("product-capability.json", value)
        self.assert_blocked(mutate)

    def test_domainspec_surface_blocks(self) -> None:
        def mutate() -> None:
            (self.package / "domainspec").mkdir()
        self.assert_blocked(mutate)

    def test_registration_regression_blocks(self) -> None:
        def mutate() -> None:
            value = self.load("residue.json")
            registration = next(
                item for item in value["residue"]
                if item["residue_id"] == "CAP-RES-DURABLE-STORAGE-REGISTRATION"
            )
            registration["status"] = "deferred"
            self.save("residue.json", value)
        self.assert_blocked(mutate)


if __name__ == "__main__":
    unittest.main(verbosity=2)
