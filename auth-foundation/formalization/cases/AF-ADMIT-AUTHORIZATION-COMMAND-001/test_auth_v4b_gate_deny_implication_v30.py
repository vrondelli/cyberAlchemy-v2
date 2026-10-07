#!/usr/bin/env python3
"""Focused hostile controls for the unselected V30 gate implication."""

import importlib.util
import unittest
from pathlib import Path


CASE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location(
    "auth_v30_gate_implication", CASE / "auth-v4b-gate-deny-implication-v30.py"
)
assert spec is not None and spec.loader is not None
v30 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v30)


class GateImplicationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.authority = (v30.IMPL / v30.AUTHORITY).read_text()
        cls.gate = (v30.IMPL / v30.GATE).read_text()

    def test_frozen_selected_source_and_normal_mir(self):
        result = v30.evaluate()
        self.assertTrue(result["source_model_gate_deny_unreachable"])
        self.assertEqual(result["status"], "indeterminate")
        for key in ("endpoint_set_closed", "all_path_ready_dominance",
                    "runtime_guarantees_observed"):
            self.assertIs(result[key], False)

    def test_structural_hostiles_fail_closed(self):
        cases = [
            (*v30.MUTANTS["cardinality"],),
            (*v30.MUTANTS["qualification"],),
            (*v30.MUTANTS["provenance"],),
            ("authentication_evidence_ref: request.authentication_evidence_ref.clone(),",
             "authentication_evidence_ref: request.route_id.clone(),",
             "gate request transfer"),
            ("resolved_authentication_evidence: snapshot\n            .authentication_evidence",
             "resolved_authentication_evidence: snapshot\n            .route_bindings",
             "authentication snapshot transfer"),
            ("resolved_route_bindings: snapshot\n            .route_bindings",
             "resolved_route_bindings: snapshot\n            .authentication_evidence",
             "route snapshot transfer"),
        ]
        for old, new, expected in cases:
            with self.subTest(expected=expected):
                self.assertEqual(self.authority.count(old), 1)
                mutant = self.authority.replace(old, new, 1)
                with self.assertRaisesRegex(ValueError, expected):
                    v30.check_source(mutant, self.gate, frozen=False)

    def test_gate_branch_and_count_hostiles_fail_closed(self):
        for old, new, expected in [
            (".count() == 1", ".count() >= 1", "gate exact occurrence count"),
            ("CommandBoundaryDecision::Ready\n    } else", "CommandBoundaryDecision::Deny\n    } else", "gate decision branch"),
        ]:
            with self.subTest(expected=expected):
                self.assertIn(old, self.gate)
                with self.assertRaisesRegex(ValueError, expected):
                    v30.check_source(self.authority, self.gate.replace(old, new, 1), frozen=False)


if __name__ == "__main__":
    unittest.main()
