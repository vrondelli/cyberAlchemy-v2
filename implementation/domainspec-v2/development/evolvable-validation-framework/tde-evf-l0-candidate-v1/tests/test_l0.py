from __future__ import annotations

import copy
import json
import stat
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[5]
sys.path.insert(0, str(ROOT))

from evf.join import build_join  # noqa: E402
from evf.runner import run  # noqa: E402
from evf.souffle_adapter import materialize, translate  # noqa: E402
from tde.neutral_obligation import assert_provider_neutral, derive, digest_value  # noqa: E402


class L0Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.profile = json.loads((ROOT / "profile.json").read_text())
        cls.fixture = ROOT / "fixtures/souffle_test_double.py"
        cls.fixture.chmod(cls.fixture.stat().st_mode | stat.S_IXUSR)

    def derive(self, node_overrides=None):
        return derive(REPO, self.profile, node_overrides)

    def execute_fixture(self, obligation, facts):
        translation = translate(obligation, facts, ROOT / "providers/reachability.dl")
        with tempfile.TemporaryDirectory() as temp:
            facts_dir, output_dir = materialize(translation, Path(temp))
            return run(
                self.fixture.resolve(), facts_dir, output_dir, Path(temp) / "reachability.dl",
                obligation, facts, translation["translation_receipt"], runtime_kind="test-double",
            )

    def test_neutral_obligation_is_deterministic_and_provider_free(self) -> None:
        left = self.derive()
        right = self.derive()
        self.assertEqual(left, right)
        assert_provider_neutral(left[0])
        encoded = json.dumps(left[0]).lower()
        self.assertNotIn("souffle", encoded)
        self.assertNotIn("provider", encoded)

    def test_current_graph_has_no_reachability_violation_in_fixture(self) -> None:
        obligation, facts = self.derive()
        receipt = self.execute_fixture(obligation, facts)
        self.assertEqual("no-counterexample", receipt["normalized_outcome"])
        self.assertEqual("test-only-fixture-evidence", receipt["receipt_kind"])
        join = build_join(obligation, receipt)
        self.assertEqual("NOT_EVALUABLE", join["status"])
        self.assertIn("exact-souffle-2.5-evidence-missing", join["residue"])

    def test_deliberate_violation_is_observed_without_inflating_fixture_evidence(self) -> None:
        generate_path = next(
            item for item in self.profile["selected_subject"]["node_sources"]
            if item.endswith("nodes/generate-settlement.json")
        )
        generate = json.loads((REPO / generate_path).read_text())
        generate["connections"] = [edge for edge in generate["connections"] if edge["type"] != "produces"]
        obligation, facts = self.derive({generate_path: generate})
        receipt = self.execute_fixture(obligation, facts)
        self.assertEqual("counterexample", receipt["normalized_outcome"])
        self.assertEqual(2, len(receipt["native_result"]["violation_rows"]))
        self.assertEqual("NOT_EVALUABLE", build_join(obligation, receipt)["status"])

    def test_binding_drift_blocks_join(self) -> None:
        obligation, facts = self.derive()
        receipt = self.execute_fixture(obligation, facts)
        drifted = copy.deepcopy(receipt)
        drifted["obligation_id"] = "drifted"
        self.assertEqual("BLOCK", build_join(obligation, drifted)["status"])
        self.assertIn("provider-receipt-digest-invalid", build_join(obligation, drifted)["residue"])

    def test_join_digests_are_replayable(self) -> None:
        obligation, facts = self.derive()
        receipt = self.execute_fixture(obligation, facts)
        join = build_join(obligation, receipt)
        payload = {key: value for key, value in join.items() if key != "join_digest"}
        self.assertEqual(digest_value(payload), join["join_digest"])


if __name__ == "__main__":
    unittest.main()
