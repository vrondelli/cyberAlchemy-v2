#!/usr/bin/env python3

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("craft_project_validate", PACKAGE_ROOT / "validate.py")
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class CraftProjectValidationTest(unittest.TestCase):
    def test_package_passes(self) -> None:
        result = MODULE.validate()
        self.assertEqual("PASS", result["status"], result["errors"])

    def test_project_owns_feature_and_goal(self) -> None:
        result = MODULE.validate()
        self.assertEqual("CA2-PROJECT-CRAFT", result["project_id"])
        self.assertEqual("CA2-PRODUCT-CRAFT", result["product_id"])
        self.assertEqual("CAV2-D20", result["method_ref"])
        self.assertEqual("CA2-GOAL-CRAFT-PRODUCT-FEATURE-FOUNDATION", result["goal_id"])
        self.assertEqual("CA2-PRODUCT-FEATURE-SYSTEM-CONSTRUCTION", result["product_feature_id"])
        self.assertEqual("CA2-PRODUCT-THESIS-CRAFT", result["product_context_node_id"])

    def test_product_topology_resolves(self) -> None:
        self.assertTrue((MODULE.PRODUCT_ROOT / "IDENTITY.json").is_file())
        self.assertTrue((MODULE.PRODUCT_ROOT / "PRODUCT-THESIS.md").is_file())

    def test_domainspec_v2_is_the_former_name_of_the_same_product(self) -> None:
        result = MODULE.validate()
        self.assertEqual("DomainSpec v2", result["former_product_name"])
        self.assertEqual("same-product-renamed", result["lineage_continuity"])
        self.assertEqual("projects/domainspec-v2", result["legacy_project_space_ref"])

    def test_authority_ceiling_remains_none(self) -> None:
        result = MODULE.validate()
        self.assertEqual("none", result["authority_effect"])
        self.assertEqual("draft", result["commitment_state"])


if __name__ == "__main__":
    unittest.main()
