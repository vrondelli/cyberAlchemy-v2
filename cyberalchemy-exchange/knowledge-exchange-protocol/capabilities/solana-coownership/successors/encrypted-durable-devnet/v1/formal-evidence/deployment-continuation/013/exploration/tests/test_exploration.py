from __future__ import annotations

import copy
import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("kep_bounded_explorer", ROOT / "author.py")
assert SPEC is not None and SPEC.loader is not None
AUTHOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(AUTHOR)


class BoundedExplorationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.model = json.loads((ROOT / "model.json").read_text())

    def test_declared_universe_is_exhaustively_enumerated(self) -> None:
        result = AUTHOR.evaluate(self.model)
        self.assertEqual(120, len(result["states"]))
        self.assertEqual("PASS_BOUNDED", result["status"])

    def test_unknown_effect_never_submits(self) -> None:
        result = AUTHOR.evaluate(self.model)
        unknown = [state for state in result["states"] if state["effect_state"] == "unknown-in-flight"]
        self.assertTrue(unknown)
        self.assertTrue(all(not state["submit_allowed"] and state["reconciliation_required"] for state in unknown))

    def test_allowing_unknown_effect_submit_produces_counterexample(self) -> None:
        model = copy.deepcopy(self.model)
        model["rules"]["submit_requires_effect_state"] = "unknown-in-flight"
        result = AUTHOR.evaluate(model)
        self.assertEqual("BLOCK", result["status"])
        self.assertIn("counterexample:bound-unknown-effect-state", result["issues"])

    def test_stale_and_future_revision_never_submit(self) -> None:
        result = AUTHOR.evaluate(self.model)
        selected = [state for state in result["states"] if state["revision_state"] in {"stale", "future"}]
        self.assertTrue(all(not state["submit_allowed"] for state in selected))

    def test_already_applied_never_resubmits(self) -> None:
        result = AUTHOR.evaluate(self.model)
        selected = [state for state in result["states"] if state["revision_state"] == "already-applied"]
        self.assertTrue(all(not state["submit_allowed"] and state["reconciliation_required"] for state in selected))

    def test_corrupt_journal_stops_restart(self) -> None:
        result = AUTHOR.evaluate(self.model)
        selected = [state for state in result["states"] if state["journal_state"] != "intact"]
        self.assertTrue(all(not state["submit_allowed"] and state["restart_stopped"] for state in selected))


if __name__ == "__main__":
    unittest.main()
