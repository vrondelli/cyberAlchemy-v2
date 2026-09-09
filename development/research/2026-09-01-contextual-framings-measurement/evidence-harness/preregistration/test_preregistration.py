#!/usr/bin/env python3
"""Regression tests for the owner-controlled ACFT preregistration."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parent
PYTHON = sys.executable


def run(*arguments: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run([PYTHON, *arguments], cwd=ROOT, text=True, capture_output=True, check=False)


class PreregistrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        generated = run("generate_fixtures.py")
        if generated.returncode != 0:
            raise RuntimeError(generated.stdout + generated.stderr)

    def validate(self, decision: str, *extra: str) -> subprocess.CompletedProcess[str]:
        return run("validate.py", "--candidate", "candidate.json", "--decision", decision, *extra)

    def test_unresolved_template_is_valid_but_not_live_ready(self) -> None:
        result = self.validate("owner-decision-template.json")
        self.assertEqual(result.returncode, 0, result.stderr)
        receipt = json.loads(result.stdout)
        self.assertEqual(receipt["status"], "pass_candidate")
        self.assertEqual(receipt["decision_fields_total"], 22)
        self.assertEqual(receipt["decision_fields_resolved"], 0)
        self.assertFalse(receipt["live_ready"])

    def test_require_live_ready_fails_closed(self) -> None:
        result = self.validate("owner-decision-template.json", "--require-live-ready")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("LIVE_BLOCKED", result.stderr)

    def test_silent_default_is_rejected(self) -> None:
        result = self.validate("fixtures/fail-silent-default.json")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("SILENT_DEFAULT:decision.decisions.sample_size", result.stderr)

    def test_premature_claim_upgrade_is_rejected(self) -> None:
        result = self.validate("fixtures/fail-premature-claim-upgrade.json")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("CLAIM:decision.claim_status_update_allowed", result.stderr)

    def test_stale_candidate_binding_is_rejected(self) -> None:
        result = self.validate("fixtures/fail-stale-binding.json")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("EXACT_REF:decision.candidate_ref:digest", result.stderr)

    def test_valid_candidate_receipt_can_be_written(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            output = Path(temporary) / "readiness.json"
            result = self.validate("owner-decision-template.json", "--output", str(output))
            self.assertEqual(result.returncode, 0, result.stderr)
            receipt = json.loads(output.read_text(encoding="utf-8"))
            self.assertFalse(receipt["claim_status_update_allowed"])
            self.assertFalse(receipt["live_execution_authorized"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
