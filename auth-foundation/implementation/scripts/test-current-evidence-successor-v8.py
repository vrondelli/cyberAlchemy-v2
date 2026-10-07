#!/usr/bin/env python3
"""Fast delta and claim controls for the current v5-defined inventory successor."""

import importlib.util
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("validate-current-evidence-successor-v8.py")
SPEC = importlib.util.spec_from_file_location("auth_current_evidence_v8", SCRIPT)
assert SPEC is not None and SPEC.loader is not None
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class CurrentEvidenceV8Tests(unittest.TestCase):
    def fixture(self):
        baseline = {"status": "intermediate-not-current-complete",
                 "runtime_guarantees_observed": False, "authority_effect": "none",
                 "intermediate_source_count": 2, "changed_sources": {"a": {}},
                 "deferred_source": {"path": "timeout", "sha256": "b" * 64}}
        intermediate = {"a": "a" * 64, "c": "c" * 64}
        return baseline, {**intermediate, "timeout": "b" * 64}, intermediate

    def test_exact_completion_passes(self) -> None:
        baseline, full, intermediate = self.fixture()
        self.assertEqual(MODULE.checked_completion(baseline, full, intermediate, True)["path"], "timeout")

    def test_missing_or_modified_deferred_test_fails(self) -> None:
        for action in ("missing", "modified"):
            with self.subTest(action=action):
                baseline, full, intermediate = self.fixture()
                if action == "missing":
                    del full["timeout"]
                else:
                    full["timeout"] = "d" * 64
                with self.assertRaises(ValueError):
                    MODULE.checked_completion(baseline, full, intermediate, True)

    def test_extra_or_changed_source_fails(self) -> None:
        for action in ("extra", "changed"):
            with self.subTest(action=action):
                baseline, full, intermediate = self.fixture()
                full["extra" if action == "extra" else "a"] = "d" * 64
                with self.assertRaisesRegex(ValueError, "v5-defined source map"):
                    MODULE.checked_completion(baseline, full, intermediate, True)

    def test_false_trace_or_runtime_claim_fails(self) -> None:
        baseline, full, intermediate = self.fixture()
        with self.assertRaisesRegex(ValueError, "trace-enabled"):
            MODULE.checked_completion(baseline, full, intermediate, False)
        baseline["runtime_guarantees_observed"] = True
        with self.assertRaisesRegex(ValueError, "claim ceiling"):
            MODULE.checked_completion(baseline, full, intermediate, True)


if __name__ == "__main__":
    unittest.main()
