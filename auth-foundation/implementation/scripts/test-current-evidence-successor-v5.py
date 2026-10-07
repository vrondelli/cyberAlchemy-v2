#!/usr/bin/env python3
"""Fast source and lineage controls for current Auth technical evidence v5."""

import importlib.util
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("validate-current-evidence-successor-v5.py")
SPEC = importlib.util.spec_from_file_location("auth_current_evidence_v5", SCRIPT)
assert SPEC is not None and SPEC.loader is not None
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class CurrentEvidenceV5Tests(unittest.TestCase):
    def test_selected_production_path_uses_ready(self) -> None:
        result = MODULE.selected_path()
        self.assertIn("SqliteAdmissionService::with_ready", result["production_path"])
        self.assertFalse(result["source_shape_is_semantic_proof"])

    def test_selected_normal_roots_exclude_legacy_decisions(self) -> None:
        for root in MODULE.ROOTS:
            self.assertFalse(set(MODULE.closure(root)) & MODULE.FORBIDDEN)

    def test_historical_archive_is_unchanged(self) -> None:
        self.assertEqual(len(MODULE.historical_archive()), 9)

    def test_stale_older_runtime_evidence_is_explicit(self) -> None:
        result = MODULE.current_controls()
        self.assertEqual(result["stale_record_refs"], ["runtime_evidence.adapter_source"])
        self.assertEqual(result["owner_scope_freshness"], "current")
        self.assertFalse(result["runtime_guarantees_observed"])


if __name__ == "__main__":
    unittest.main()
