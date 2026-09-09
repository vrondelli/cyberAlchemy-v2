from __future__ import annotations

import copy
import hashlib
import json
import stat
import subprocess
import sys
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[5]
L1 = ROOT.parent / "tde-evf-l1-candidate-v1"
L0 = ROOT.parent / "tde-evf-l0-candidate-v1"
sys.path.insert(0, str(L0))
sys.path.insert(0, str(L1))
sys.path.insert(0, str(ROOT))

from evf.runner import run as run_souffle  # noqa: E402
from evf.souffle_adapter import materialize as materialize_souffle  # noqa: E402
from evf.souffle_adapter import translate as translate_souffle  # noqa: E402
from l1.alloy_adapter import materialize as materialize_alloy  # noqa: E402
from l1.alloy_adapter import translate as translate_alloy  # noqa: E402
from l1.alloy_runner import run as run_alloy  # noqa: E402
from l2.control_matrix import run_matrix  # noqa: E402
from l2.hardening import capture_provider, evaluate  # noqa: E402
from tde.neutral_obligation import derive, digest_value  # noqa: E402


def redigest(receipt: dict[str, object]) -> None:
    payload = {key: value for key, value in receipt.items() if key != "receipt_digest"}
    receipt["receipt_digest"] = digest_value(payload)


class L2Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.l0_profile = json.loads((L0 / "profile.json").read_text())
        cls.souffle_fixture = (L0 / "fixtures/souffle_test_double.py").resolve()
        cls.alloy_fixture = (L1 / "fixtures/alloy_test_double.py").resolve()
        for fixture in (cls.souffle_fixture, cls.alloy_fixture):
            fixture.chmod(fixture.stat().st_mode | stat.S_IXUSR)

    def exact_synthetic_evidence(self):
        obligation, facts = derive(REPO, self.l0_profile)
        with tempfile.TemporaryDirectory() as souffle_temp, tempfile.TemporaryDirectory() as alloy_temp:
            st = translate_souffle(obligation, facts, L0 / "providers/reachability.dl")
            sf, so = materialize_souffle(st, Path(souffle_temp))
            souffle = run_souffle(
                self.souffle_fixture, sf, so, Path(souffle_temp) / "reachability.dl",
                obligation, facts, st["translation_receipt"], runtime_kind="test-double",
            )
            at = translate_alloy(obligation, facts)
            model, ao = materialize_alloy(at, Path(alloy_temp))
            alloy = run_alloy(
                model, ao, obligation, facts, at,
                runtime_kind="test-double", fixture_executable=self.alloy_fixture,
            )
        souffle_hash = hashlib.sha256(self.souffle_fixture.read_bytes()).hexdigest()
        alloy_hash = hashlib.sha256(self.alloy_fixture.read_bytes()).hexdigest()
        java_hash = "1" * 64
        souffle["receipt_kind"] = "provider-evidence"
        souffle["provider"].update({"id": "souffle", "version": "2.5", "runtime_sha256": souffle_hash})
        alloy["receipt_kind"] = "provider-evidence"
        alloy["provider"].update({
            "id": "alloy", "version": "6.2.0", "alloy_jar_sha256": alloy_hash,
            "java_sha256": java_hash, "solver": "sat4j",
        })
        redigest(souffle)
        redigest(alloy)
        binding = {
            "runtimes": {
                "souffle": {"sha256": souffle_hash},
                "alloy": {"sha256": alloy_hash, "solver": "sat4j"},
                "java": {"sha256": java_hash},
            }
        }
        translations = {
            "souffle": st["translation_receipt"]["translation_digest"],
            "alloy": at["translation_receipt"]["translation_digest"],
        }
        return obligation, facts, translations, binding, {"souffle": souffle, "alloy": alloy}

    def test_positive_exact_evidence_is_supported_bounded(self) -> None:
        obligation, facts, translations, binding, receipts = self.exact_synthetic_evidence()
        result = evaluate(REPO, obligation, facts, translations, binding, receipts)
        self.assertEqual("SUPPORTED_BOUNDED", result["status"])
        self.assertEqual([], result["residue"])
        self.assertTrue(all(item["status"] == "PASS" for item in result["checks"]))

    def test_complete_negative_control_matrix_fails_closed(self) -> None:
        obligation, facts, translations, binding, receipts = self.exact_synthetic_evidence()
        matrix = run_matrix(
            REPO, obligation, facts, translations, binding, receipts,
            evaluated_at=datetime.now(timezone.utc),
        )
        self.assertTrue(matrix["collect_all"])
        self.assertEqual(16, len(matrix["controls"]))
        self.assertTrue(matrix["all_controls_passed"], matrix["controls"])

    def test_missing_evidence_keeps_dependent_checks_visible(self) -> None:
        obligation, facts, translations, binding, receipts = self.exact_synthetic_evidence()
        receipts["alloy"] = None
        result = evaluate(REPO, obligation, facts, translations, binding, receipts)
        self.assertEqual("NOT_EVALUABLE", result["status"])
        alloy_checks = [item for item in result["checks"] if item["check_id"].startswith("provider.alloy")]
        self.assertTrue(any(item["status"] == "FAIL" for item in alloy_checks))
        self.assertTrue(any(item["status"] == "NOT_EVALUABLE" for item in alloy_checks))

    def test_forged_all_current_cannot_override_stale_timestamp(self) -> None:
        obligation, facts, translations, binding, receipts = self.exact_synthetic_evidence()
        stale = copy.deepcopy(receipts["souffle"])
        stale["execution"]["started_at"] = "2000-01-01T00:00:00+00:00"
        stale["execution"]["finished_at"] = "2000-01-01T00:00:00+00:00"
        stale["all_current"] = True
        redigest(stale)
        receipts["souffle"] = stale
        result = evaluate(REPO, obligation, facts, translations, binding, receipts)
        self.assertEqual("NOT_EVALUABLE", result["status"])
        self.assertIn("souffle-evidence-stale", result["residue"])

    def test_capture_provider_types_timeout_and_malformed_output(self) -> None:
        def timeout():
            raise subprocess.TimeoutExpired(["provider"], 0.01)

        def malformed():
            raise ValueError("provider omitted receipt.json")

        self.assertEqual("souffle-timeout", capture_provider("souffle", timeout)["failure"])
        self.assertEqual("alloy-malformed-output", capture_provider("alloy", malformed)["failure"])

    def test_evaluation_digest_is_replayable_at_one_epoch(self) -> None:
        obligation, facts, translations, binding, receipts = self.exact_synthetic_evidence()
        epoch = datetime.now(timezone.utc)
        left = evaluate(REPO, obligation, facts, translations, binding, receipts, evaluated_at=epoch)
        right = evaluate(REPO, obligation, facts, translations, binding, receipts, evaluated_at=epoch)
        self.assertEqual(left, right)


if __name__ == "__main__":
    unittest.main()
