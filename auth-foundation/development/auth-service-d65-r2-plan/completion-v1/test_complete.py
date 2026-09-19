import copy
import unittest

from complete import require_verified_aggregate


class FinalVerificationTests(unittest.TestCase):
    def setUp(self):
        self.aggregate = {"aggregate_state": "passed", "evidence_payload_digest": "a" * 64,
                          "verification_receipt": {"verdict": "passed", "all_refs_current": True, "replay_equal": True}}
        self.verification = {"schema_version": "evf.final-verification-result/v1", "verdict": "passed",
                             "aggregate_state": "passed", "evidence_payload_digest": "a" * 64,
                             "verified_stage_ids": [f"S{i}" for i in range(13)]}

    def test_currentness_is_read_from_the_verified_embedded_receipt(self):
        require_verified_aggregate(self.aggregate, self.verification)

    def test_missing_or_false_currentness_and_replay_are_rejected(self):
        for field in ("all_refs_current", "replay_equal"):
            for value in (None, False, "true"):
                aggregate = copy.deepcopy(self.aggregate)
                aggregate["verification_receipt"][field] = value
                with self.subTest(field=field, value=value), self.assertRaises(ValueError):
                    require_verified_aggregate(aggregate, self.verification)

    def test_wrong_digest_failed_verdict_and_missing_stages_are_rejected(self):
        for field, value in (("evidence_payload_digest", "b" * 64), ("verdict", "failed"),
                             ("aggregate_state", "failed"), ("verified_stage_ids", ["S0"])):
            verification = {**self.verification, field: value}
            with self.subTest(field=field), self.assertRaises(ValueError):
                require_verified_aggregate(self.aggregate, verification)
