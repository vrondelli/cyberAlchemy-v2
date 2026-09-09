#!/usr/bin/env python3
"""Regression tests for positive and deliberately invalid ACFT fixtures."""

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
    return subprocess.run(
        [PYTHON, *arguments], cwd=ROOT, text=True, capture_output=True, check=False
    )


class EvidenceHarnessTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        generated = run("generate_fixtures.py")
        if generated.returncode != 0:
            raise RuntimeError(generated.stdout + generated.stderr)

    def validate(self, manifest: str, rows: str) -> subprocess.CompletedProcess[str]:
        return run(
            "validate_harness.py",
            "--manifest", manifest,
            "--rows", rows,
        )

    def test_positive_bundle_passes(self) -> None:
        result = self.validate("fixtures/arm-manifest-pass.json", "fixtures/run-pass.jsonl")
        self.assertEqual(result.returncode, 0, result.stderr)
        receipt = json.loads(result.stdout)
        self.assertEqual(receipt["status"], "pass")
        self.assertEqual(receipt["pairs"], 7)
        self.assertEqual(receipt["rows"], 14)

    def test_unequal_evidence_and_leakage_fail(self) -> None:
        result = self.validate(
            "fixtures/arm-manifest-fail-unequal-evidence.json",
            "fixtures/run-pass.jsonl",
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("EVIDENCE_PARITY", result.stderr)
        self.assertIn("LEAKAGE", result.stderr)

    def test_missing_metadata_fails(self) -> None:
        result = self.validate(
            "fixtures/arm-manifest-pass.json",
            "fixtures/run-fail-missing-metadata.jsonl",
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("FIELDS:rows[0]", result.stderr)

    def test_invalid_metric_arithmetic_fails(self) -> None:
        result = self.validate(
            "fixtures/arm-manifest-pass.json",
            "fixtures/run-fail-invalid-metric.jsonl",
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("ARITHMETIC:rows[0].outcomes.semantic_fidelity", result.stderr)

    def test_calculator_refuses_invalid_rows(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            output = Path(temporary) / "must-not-exist.json"
            result = run(
                "calculate_metrics.py",
                "--manifest", "fixtures/arm-manifest-pass.json",
                "--rows", "fixtures/run-fail-invalid-metric.jsonl",
                "--output", str(output),
            )
            self.assertNotEqual(result.returncode, 0)
            self.assertFalse(output.exists())
            self.assertIn('"status": "blocked"', result.stdout)

    def test_synthetic_summary_has_no_effect_verdict(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            output = Path(temporary) / "summary.json"
            result = run(
                "calculate_metrics.py",
                "--manifest", "fixtures/arm-manifest-pass.json",
                "--rows", "fixtures/run-pass.jsonl",
                "--output", str(output),
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            summary = json.loads(output.read_text(encoding="utf-8"))
            self.assertEqual(summary["effect_verdict"], "not_evaluable")
            self.assertEqual(summary["claim_status"], "synthetic_fixture_no_human_or_product_claim")
            self.assertIsNone(summary["p2_components"]["composite"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
