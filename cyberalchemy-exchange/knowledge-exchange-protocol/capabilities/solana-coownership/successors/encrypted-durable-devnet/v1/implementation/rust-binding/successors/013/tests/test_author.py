#!/usr/bin/env python3
"""Determinism and fail-closed tests for deployment-continuation candidate 013."""

from __future__ import annotations

import copy
import importlib.util
import json
import unittest
from pathlib import Path


HERE = Path(__file__).resolve().parent
AUTHOR_PATH = HERE.parent / "author.py"
SPEC = importlib.util.spec_from_file_location("candidate_013_author", AUTHOR_PATH)
assert SPEC and SPEC.loader
author = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(author)


class Candidate013Tests(unittest.TestCase):
    def policy(self) -> dict:
        return json.loads(author.POLICY_PATH.read_text(encoding="utf-8"))

    def test_generated_candidate_is_deterministic(self) -> None:
        self.assertEqual(author.build_binding(), author.build_binding())

    def test_continuation_is_zero_replay_and_zero_protocol(self) -> None:
        binding = author.build_binding()
        contract = binding["continuation_contract"]
        self.assertEqual(56, contract["first_unwritten_chunk_index"])
        self.assertEqual(73, contract["exact_additional_deployment_submissions"])
        self.assertEqual(0, contract["replayed_predecessor_submissions"])
        self.assertEqual(0, contract["protocol_submissions"])

    def test_progress_or_runtime_drift_fails_closed(self) -> None:
        policy = self.policy()
        drifted = copy.deepcopy(policy)
        drifted["continuation_contract"]["first_unwritten_chunk_index"] = 55
        with self.assertRaises(author.BindingError):
            author.build_binding(drifted)

        drifted = copy.deepcopy(policy)
        drifted["local_evidence"]["runtime_material_digest"] = "0" * 64
        with self.assertRaises(author.BindingError):
            author.build_binding(drifted)


if __name__ == "__main__":
    unittest.main()
