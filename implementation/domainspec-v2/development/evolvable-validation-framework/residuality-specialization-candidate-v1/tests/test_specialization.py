from __future__ import annotations

import copy
import importlib.util
import json
import unittest
from unittest import mock
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("evf_specialization_validator", ROOT / "validate.py")
assert SPEC is not None and SPEC.loader is not None
VALIDATOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(VALIDATOR)


class SpecializationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.profile = json.loads((ROOT / "profile.json").read_text())

    def test_authority_is_none_and_parent_is_conceptual_only(self) -> None:
        self.assertEqual("none", self.profile["authority_effect"])
        self.assertIn("conceptual provenance only", self.profile["specializes_conceptual_model"]["use"])

    def test_provider_mandate_is_not_inherited(self) -> None:
        self.assertIn("named provider mandate", self.profile["non_inheritance"])

    def test_parent_drift_rule_is_fail_closed(self) -> None:
        rule = self.profile["drift_and_recomposition"]["rule"]
        self.assertIn("BLOCK", rule)
        self.assertIn("must not be silently rebound", rule)

    def test_parent_digest_drift_blocks_validator(self) -> None:
        with mock.patch.object(VALIDATOR, "sha", return_value="0" * 64):
            self.assertEqual(1, VALIDATOR.main())

    def test_product_approval_and_authority_are_separate(self) -> None:
        states = {item["stage"]: item["status"] for item in self.profile["d65_provenance"]}
        self.assertEqual("not_requested", states["product-approval"])
        self.assertEqual("not_eligible", states["separate-authority-decisions"])


if __name__ == "__main__":
    unittest.main()
