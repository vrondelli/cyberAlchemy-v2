#!/usr/bin/env python3
"""Hostile controls for the exact one-source Auth technical successor."""

import copy
import importlib.util
import json
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("validate-current-evidence-successor-v6.py")
SPEC = importlib.util.spec_from_file_location("auth_current_evidence_v6", SCRIPT)
assert SPEC is not None and SPEC.loader is not None
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class CurrentEvidenceV6Tests(unittest.TestCase):
    def pair(self):
        prior = {"current_sources": {MODULE.SOURCE: MODULE.PINNED_PRIOR_SOURCE_SHA256,
                                     "other.rs": "b" * 64},
                 "runtime_guarantees_observed": False, "authority_effect": "none",
                 "selected_path": ["READY"]}
        current = copy.deepcopy(prior)
        current["current_sources"][MODULE.SOURCE] = "a" * 64
        return prior, current

    def test_only_one_selected_source_leaf_may_change(self) -> None:
        prior, current = self.pair()
        self.assertEqual(MODULE.checked_single_delta(prior, current),
                         (MODULE.PINNED_PRIOR_SOURCE_SHA256, "a" * 64))
        changed = copy.deepcopy(current)
        changed["current_sources"]["other.rs"] = "c" * 64
        with self.assertRaisesRegex(ValueError, "more than the selected"):
            MODULE.checked_single_delta(prior, changed)
        changed = copy.deepcopy(current)
        changed["selected_path"] = ["raw-policy"]
        with self.assertRaisesRegex(ValueError, "more than the selected"):
            MODULE.checked_single_delta(prior, changed)

    def test_source_set_predecessor_and_claim_ceiling_fail_closed(self) -> None:
        prior, current = self.pair()
        changed = copy.deepcopy(current)
        changed["current_sources"]["new.rs"] = "d" * 64
        with self.assertRaisesRegex(ValueError, "source inventory path set"):
            MODULE.checked_single_delta(prior, changed)
        changed = copy.deepcopy(current)
        changed["current_sources"][MODULE.SOURCE] = "invalid"
        with self.assertRaisesRegex(ValueError, "selected test source delta"):
            MODULE.checked_single_delta(prior, changed)
        changed = copy.deepcopy(current)
        changed["runtime_guarantees_observed"] = True
        with self.assertRaisesRegex(ValueError, "technical claim ceiling"):
            MODULE.checked_single_delta(prior, changed)
        changed = copy.deepcopy(prior)
        changed["current_sources"][MODULE.SOURCE] = "c" * 64
        with self.assertRaisesRegex(ValueError, "selected test source delta"):
            MODULE.checked_single_delta(changed, current)

    def test_current_v6_receipt_pins_unchanged_stale_v5_and_formatted_source(self) -> None:
        self.assertEqual(MODULE.sha(MODULE.PREDECESSOR.read_bytes()),
                         MODULE.PINNED_V5_SHA256)
        expected = MODULE.expected_binding()
        self.assertEqual(expected["predecessor_sha256"], MODULE.PINNED_V5_SHA256)
        self.assertEqual(expected["previous_source_sha256"],
                         MODULE.PINNED_PRIOR_SOURCE_SHA256)
        self.assertEqual(expected["current_source_sha256"],
                         MODULE.sha((MODULE.AUTH / MODULE.SOURCE).read_bytes()))
        self.assertEqual(expected["v6_inputs_sha256"], MODULE.v6_input_hashes())
        self.assertEqual(set(expected["v6_inputs_sha256"]), set(MODULE.V6_INPUTS))
        tampered = copy.deepcopy(expected)
        tampered["v6_inputs_sha256"][MODULE.V6_INPUTS[0]] = "0" * 64
        with self.assertRaisesRegex(ValueError, "current v6 technical binding differs"):
            MODULE.checked_binding(json.loads(MODULE.BINDING.read_bytes()), tampered)
        self.assertFalse(expected["runtime_guarantees_observed"])
        self.assertEqual(json.loads(MODULE.BINDING.read_bytes()), expected)
        self.assertEqual(MODULE.validate()["status"], "pass")


if __name__ == "__main__":
    unittest.main()
