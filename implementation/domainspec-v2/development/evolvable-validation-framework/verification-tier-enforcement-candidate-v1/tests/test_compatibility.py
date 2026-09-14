from __future__ import annotations

import copy
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[4]

from evf_tiers.compatibility import evaluate_tde_compatibility  # noqa: E402


class CompatibilityTests(unittest.TestCase):
    def mapping(self) -> dict:
        return json.loads(ROOT.joinpath("compatibility/tde.v1-candidate.json").read_text())

    def test_tde_mapping_is_not_evaluable_when_pinned_runtimes_are_absent(self) -> None:
        mapping = self.mapping()
        mapping["runtime_root"] = "deliberately-missing-runtime-root"
        result = evaluate_tde_compatibility(REPO, mapping)
        self.assertEqual("not_evaluable", result["overall_state"])
        self.assertTrue(all(item["tier_granted"] is False for item in result["mappings"]))
        self.assertTrue(any("runtime-missing" in residue for item in result["mappings"] for residue in item["residue"]))

    def test_profile_digest_drift_blocks_only_eligibility_and_never_grants_tier(self) -> None:
        mapping = copy.deepcopy(self.mapping())
        mapping["mappings"][0]["profile"]["sha256"] = "0" * 64
        result = evaluate_tde_compatibility(REPO, mapping)
        l0 = result["mappings"][0]
        self.assertEqual("not_evaluable", l0["compatibility_state"])
        self.assertFalse(l0["tier_granted"])
        self.assertIn("profile-digest-drift", l0["residue"])

    def test_missing_binding_is_typed_not_evaluable(self) -> None:
        mapping = copy.deepcopy(self.mapping())
        mapping["runtime_binding"]["path"] = "missing.json"
        result = evaluate_tde_compatibility(REPO, mapping)
        self.assertEqual("not_evaluable", result["overall_state"])
        self.assertEqual("missing", result["runtime_binding_check"]["reason"])


if __name__ == "__main__":
    unittest.main()
