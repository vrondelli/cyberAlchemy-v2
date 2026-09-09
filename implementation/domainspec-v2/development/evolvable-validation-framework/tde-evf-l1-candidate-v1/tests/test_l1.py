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
L0 = ROOT.parent / "tde-evf-l0-candidate-v1"
sys.path.insert(0, str(L0))
sys.path.insert(0, str(ROOT))

from evf.runner import run as run_souffle  # noqa: E402
from evf.souffle_adapter import materialize as materialize_souffle  # noqa: E402
from evf.souffle_adapter import translate as translate_souffle  # noqa: E402
from l1.alloy_adapter import materialize as materialize_alloy  # noqa: E402
from l1.alloy_adapter import translate as translate_alloy  # noqa: E402
from l1.alloy_runner import run as run_alloy  # noqa: E402
from l1.dual_join import build_join  # noqa: E402
from tde.neutral_obligation import derive, digest_value  # noqa: E402


class L1Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.profile = json.loads((ROOT / "profile.json").read_text())
        cls.l0_profile = json.loads((L0 / "profile.json").read_text())
        cls.souffle_fixture = (L0 / "fixtures/souffle_test_double.py").resolve()
        cls.alloy_fixture = (ROOT / "fixtures/alloy_test_double.py").resolve()
        for fixture in (cls.souffle_fixture, cls.alloy_fixture):
            fixture.chmod(fixture.stat().st_mode | stat.S_IXUSR)

    def derive(self, overrides=None):
        return derive(REPO, self.l0_profile, overrides)

    def execute(self, obligation, facts):
        with tempfile.TemporaryDirectory() as souffle_temp, tempfile.TemporaryDirectory() as alloy_temp:
            souffle_translation = translate_souffle(obligation, facts, L0 / "providers/reachability.dl")
            souffle_facts, souffle_output = materialize_souffle(souffle_translation, Path(souffle_temp))
            souffle = run_souffle(
                self.souffle_fixture, souffle_facts, souffle_output, Path(souffle_temp) / "reachability.dl",
                obligation, facts, souffle_translation["translation_receipt"], runtime_kind="test-double",
            )
            alloy_translation = translate_alloy(obligation, facts)
            model, alloy_output = materialize_alloy(alloy_translation, Path(alloy_temp))
            alloy = run_alloy(
                model, alloy_output, obligation, facts, alloy_translation,
                runtime_kind="test-double", fixture_executable=self.alloy_fixture,
            )
            return souffle, alloy, alloy_translation

    def test_l0_obligation_identity_is_preserved(self) -> None:
        obligation, _ = self.derive()
        self.assertEqual(self.profile["predecessor"]["expected_obligation_id"], obligation["obligation_id"])

    def test_alloy_translation_is_deterministic_and_exact_scope(self) -> None:
        obligation, facts = self.derive()
        left = translate_alloy(obligation, facts)
        right = translate_alloy(obligation, facts)
        self.assertEqual(left, right)
        self.assertEqual({"Node": 5}, left["exact_scope"])
        self.assertEqual(3, len(left["selected_tuples"]))

    def test_current_graph_has_two_agreeing_fixture_observations_but_no_product_evidence(self) -> None:
        obligation, facts = self.derive()
        souffle, alloy, _ = self.execute(obligation, facts)
        self.assertEqual("no-counterexample", souffle["normalized_outcome"])
        self.assertEqual("no-counterexample", alloy["normalized_outcome"])
        join = build_join(obligation, souffle, alloy)
        self.assertEqual("NOT_EVALUABLE", join["status"])
        self.assertEqual("fixture-agreement-only", join["consistency_class"])

    def test_deliberate_violation_is_seen_by_both_routes_without_inflation(self) -> None:
        generate_path = next(item for item in self.l0_profile["selected_subject"]["node_sources"] if item.endswith("nodes/generate-settlement.json"))
        generate = json.loads((REPO / generate_path).read_text())
        generate["connections"] = [edge for edge in generate["connections"] if edge["type"] != "produces"]
        obligation, facts = self.derive({generate_path: generate})
        souffle, alloy, _ = self.execute(obligation, facts)
        self.assertEqual("counterexample", souffle["normalized_outcome"])
        self.assertEqual("counterexample", alloy["normalized_outcome"])
        self.assertEqual("NOT_EVALUABLE", build_join(obligation, souffle, alloy)["status"])

    def test_provider_disagreement_is_conflict_not_vote(self) -> None:
        obligation, facts = self.derive()
        souffle, alloy, _ = self.execute(obligation, facts)
        disagrees = copy.deepcopy(alloy)
        disagrees["normalized_outcome"] = "counterexample"
        payload = {key: value for key, value in disagrees.items() if key != "receipt_digest"}
        disagrees["receipt_digest"] = digest_value(payload)
        join = build_join(obligation, souffle, disagrees)
        self.assertEqual("CONFLICT", join["status"])
        self.assertIn("provider-disagreement-no-vote", join["residue"])

    def test_missing_or_tampered_evidence_cannot_pass(self) -> None:
        obligation, facts = self.derive()
        souffle, alloy, _ = self.execute(obligation, facts)
        self.assertEqual("NOT_EVALUABLE", build_join(obligation, souffle, None)["status"])
        alloy["obligation_id"] = "tampered"
        self.assertEqual("BLOCK", build_join(obligation, souffle, alloy)["status"])


if __name__ == "__main__":
    unittest.main()
