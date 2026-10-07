#!/usr/bin/env python3
"""Fast fail-closed controls for the v4 technical successor."""

import importlib.util
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("validate-current-evidence-successor-v4.py")
SPEC = importlib.util.spec_from_file_location("auth_current_evidence_v4", SCRIPT)
assert SPEC is not None and SPEC.loader is not None
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class CurrentEvidenceV4Tests(unittest.TestCase):
    def test_production_pool_and_integration_control(self) -> None:
        result = MODULE.source_path_checks()
        self.assertEqual(result["all_native_entrypoints_closed"], False)
        self.assertIn("cfg-selected concrete production pool", result["source_check_scope"])

    def test_current_v4b_remains_indeterminate(self) -> None:
        result = MODULE.v4b_current_successor()
        self.assertEqual(result["status"], "indeterminate")
        self.assertFalse(result["runtime_guarantees_observed"])

    def test_historical_archive_stays_v3(self) -> None:
        self.assertEqual(MODULE.PREIMAGES.parent.name, "current-evidence-successor-v3")
        self.assertEqual(len(MODULE.archive_preimages()), 9)


if __name__ == "__main__":
    unittest.main()
