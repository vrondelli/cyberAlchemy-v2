import json
import subprocess
import sys
import tempfile
import unittest
from copy import deepcopy
from pathlib import Path


IMPLEMENTATION = Path(__file__).resolve().parents[1]
PLAN_ROOT = IMPLEMENTATION.parent
sys.path.insert(0, str(IMPLEMENTATION))

from auth_orodi import (  # noqa: E402
    CONTROL_IDS,
    EVIDENCE_STATES,
    evaluate_ledger,
    evaluate_rollback,
    evaluate_telemetry,
    load_json,
    preflight_binding,
    preflight_profile,
)


class AuthOrodiTests(unittest.TestCase):
    @staticmethod
    def unbound_binding():
        binding = load_json(PLAN_ROOT / "EVALUATION-BINDING.v1-candidate.json")
        binding["subject"]["candidate_digest"] = "TO-BE-BOUND-BY-B1"
        return binding

    def test_unbound_candidate_is_missing_and_cannot_be_ready(self):
        result = preflight_binding(self.unbound_binding())
        self.assertEqual(result["verdict"], "blocked")
        self.assertEqual(result["evidence_state"], "missing")
        self.assertGreater(result["counts"]["findings"], 0)
        self.assertFalse(result["deployment_effect"])

    def test_profile_preflight_separates_b0_from_final_b1_closure(self):
        binding = self.unbound_binding()
        profile = preflight_profile(binding)
        full = preflight_binding(binding)
        self.assertEqual(profile["evidence_state"], "passed")
        self.assertEqual(profile["findings"], [])
        self.assertEqual(full["evidence_state"], "missing")
        self.assertGreater(profile["full_binding_findings_deferred_to_b1"], 0)
        self.assertLess(len(profile["findings"]), len(full["findings"]))

    def test_aggregate_pass_requires_every_required_member_to_pass(self):
        base = [{"id": member_id, "state": "passed"} for member_id in CONTROL_IDS]
        self.assertEqual(evaluate_ledger(base, CONTROL_IDS)["verdict"], "pass")
        for state in EVIDENCE_STATES:
            candidate = deepcopy(base)
            candidate[0]["state"] = state
            result = evaluate_ledger(candidate, CONTROL_IDS)
            self.assertEqual(result["verdict"], "pass" if state == "passed" else "reject")
            if state != "passed":
                self.assertIn(state, result["non_passing_states"])

    def test_missing_duplicate_and_unknown_states_fail_closed(self):
        base = [{"id": member_id, "state": "passed"} for member_id in CONTROL_IDS]
        self.assertEqual(evaluate_ledger(base[:-1], CONTROL_IDS)["claim_state"], "missing")
        duplicate = base + [deepcopy(base[0])]
        self.assertEqual(evaluate_ledger(duplicate, CONTROL_IDS)["claim_state"], "invalid")
        unknown = deepcopy(base)
        unknown[0]["state"] = "success"
        self.assertEqual(evaluate_ledger(unknown, CONTROL_IDS)["claim_state"], "invalid")

    def test_telemetry_conservation_keeps_loss_and_completeness_separate(self):
        passed = evaluate_telemetry({"offered": 10, "queued": 9, "rejected": 1, "exported": 9, "dropped": 0, "pending": 0})
        self.assertEqual((passed["state"], passed["conserved"], passed["required_drops_zero"]), ("passed", True, True))
        open_accounting = evaluate_telemetry({"offered": 10, "queued": 9, "rejected": 0, "exported": 8, "dropped": 0, "pending": 0})
        self.assertEqual((open_accounting["state"], open_accounting["conserved"]), ("inconclusive", False))
        conserved_loss = evaluate_telemetry({"offered": 10, "queued": 9, "rejected": 1, "exported": 8, "dropped": 1, "pending": 0})
        self.assertEqual((conserved_loss["state"], conserved_loss["required_drops_zero"]), ("passed", False))

    def test_rollback_requires_complete_inventory_zero_candidate_refs_and_stable_identity(self):
        inventory = [{"resource_id": "auth", "expected_stable_digest": "stable-a"}]
        observations = [{"resource_id": "auth", "candidate_refs": 0, "stable_digest": "stable-a", "critical_outcomes_restored": True, "observed_at": "2026-09-12T22:00:00Z"}]
        self.assertTrue(evaluate_rollback(inventory, observations, "2026-09-12T22:00:00Z")["restored"])
        survivor = deepcopy(observations)
        survivor[0]["candidate_refs"] = 1
        self.assertEqual(evaluate_rollback(inventory, survivor, "2026-09-12T22:00:00Z")["state"], "failed")
        self.assertEqual(evaluate_rollback(inventory, [], "2026-09-12T22:00:00Z")["state"], "inconclusive")

    def test_cli_structured_failure_and_exit_status_agree(self):
        with tempfile.TemporaryDirectory() as directory:
            fixture = Path(directory) / "unbound-binding.json"
            fixture.write_text(json.dumps(self.unbound_binding()), encoding="utf-8")
            run = subprocess.run(
                [sys.executable, str(IMPLEMENTATION / "cli.py"), "preflight", str(fixture)],
                text=True,
                capture_output=True,
                check=False,
            )
        result = json.loads(run.stdout)
        self.assertEqual(result["verdict"], "blocked")
        self.assertEqual(run.returncode, 2)


if __name__ == "__main__":
    unittest.main()
