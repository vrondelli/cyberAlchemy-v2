#!/usr/bin/env python3
"""Current Auth target successor replay and fail-closed delta controls."""

import copy
import importlib.util
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().with_name("validate-current-runtime-successor.py")
SPEC = importlib.util.spec_from_file_location("auth_current_receipts", SCRIPT)
assert SPEC and SPEC.loader
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)
OLD_AUTHORITY = "82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1"
NEW_AUTHORITY = "19790f73c6d1a401a37a1eeb90f1477fd53d388d2116102c414d9172893cb81f"


class CurrentRuntimeSuccessor(unittest.TestCase):
    def test_three_current_targets_replay_and_observe(self):
        result = module.verify()
        self.assertEqual(result["status"], "pass")
        self.assertEqual([row["id"] for row in result["targets"]], list(module.CASES))
        self.assertTrue(all(row["current_target_observed"] and row["historical_receipt_preserved"]
                            for row in result["targets"]))
        self.assertFalse(result["runtime_guarantees_observed"])

    def test_only_authority_and_self_digest_may_differ(self):
        old = {"semantic_contract": {"relationship_authority_sha256": OLD_AUTHORITY, "body": {"rule": "same"}},
               "receipt_sha256": "a" * 64, "plan_sha256": "p" * 64, "artifacts": [{"sha256": "x" * 64}]}
        new = copy.deepcopy(old)
        new["semantic_contract"]["relationship_authority_sha256"] = NEW_AUTHORITY
        new["receipt_sha256"] = "b" * 64
        module.compare_receipts(old, new, OLD_AUTHORITY, NEW_AUTHORITY, "a" * 64, "b" * 64, "p" * 64)
        for field, value in (("plan_sha256", "q" * 64), ("artifacts", [{"sha256": "y" * 64}])):
            changed = copy.deepcopy(new)
            changed[field] = value
            with self.subTest(field=field), self.assertRaises(module.ValidationFailure):
                module.compare_receipts(old, changed, OLD_AUTHORITY, NEW_AUTHORITY,
                                        "a" * 64, "b" * 64, "p" * 64)
        changed = copy.deepcopy(new)
        changed["semantic_contract"]["body"]["rule"] = "different"
        with self.assertRaises(module.ValidationFailure):
            module.compare_receipts(old, changed, OLD_AUTHORITY, NEW_AUTHORITY,
                                    "a" * 64, "b" * 64, "p" * 64)

    def test_missing_or_wrong_authority_and_receipt_digest_rejected(self):
        old = {"semantic_contract": {"relationship_authority_sha256": OLD_AUTHORITY},
               "receipt_sha256": "a" * 64, "plan_sha256": "p" * 64}
        new = copy.deepcopy(old)
        new["semantic_contract"]["relationship_authority_sha256"] = NEW_AUTHORITY
        new["receipt_sha256"] = "b" * 64
        with self.assertRaises(module.ValidationFailure):
            module.compare_receipts(old, new, OLD_AUTHORITY, "0" * 64,
                                    "a" * 64, "b" * 64, "p" * 64)
        with self.assertRaises(module.ValidationFailure):
            module.compare_receipts(old, new, OLD_AUTHORITY, NEW_AUTHORITY,
                                    "a" * 64, "0" * 64, "p" * 64)


if __name__ == "__main__":
    unittest.main()
