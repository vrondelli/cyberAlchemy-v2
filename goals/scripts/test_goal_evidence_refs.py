#!/usr/bin/env python3
"""Focused compatibility tests for Goal evidence references."""

from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("validate.py")
sys.path.insert(0, str(SCRIPT.parent))
SPEC = importlib.util.spec_from_file_location("goal_package_validate", SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class GoalEvidenceReferenceTest(unittest.TestCase):
    def validate(self, item: object, root: Path) -> list[str]:
        errors: list[str] = []
        MODULE.validate_goal_evidence_reference(
            item,
            label="evidence_refs[0]",
            evidence_ids={"EV-1"},
            condition_ids={"SC-1"},
            source_ids={"SRC-1"},
            errors=errors,
            repository_root=root,
        )
        return errors

    def test_accepts_registered_legacy_evidence_id(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            self.assertEqual(self.validate("EV-1", Path(directory)), [])

    def test_accepts_existing_repository_local_legacy_path(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            artifact = root / "evidence" / "receipt.json"
            artifact.parent.mkdir()
            artifact.write_text("{}", encoding="utf-8")
            self.assertEqual(self.validate("evidence/receipt.json", root), [])

    def test_rejects_missing_or_escaping_legacy_path(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.assertTrue(self.validate("missing.json", root))
            self.assertTrue(self.validate("../outside.json", root))

    def test_accepts_current_condition_binding(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            item = {
                "evidence_id": "EV-1",
                "source_id": "SRC-1",
                "supports_conditions": ["SC-1"],
                "claim_limit": "Bounded evidence only.",
            }
            self.assertEqual(self.validate(item, Path(directory)), [])

    def test_accepts_legacy_selector_binding(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            item = {
                "evidence_id": "EV-1",
                "source_id": "SRC-1",
                "selector": "# Receipt",
                "supports": "The receipt exists.",
                "claim_limit": "Existence only.",
            }
            self.assertEqual(self.validate(item, Path(directory)), [])

    def test_rejects_unversioned_object_shape_drift(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            item = {
                "evidence_id": "EV-1",
                "source_id": "SRC-1",
                "supports_conditions": ["SC-1"],
                "claim_limit": "Bounded evidence only.",
                "extra": True,
            }
            self.assertIn("invalid object shape", " ".join(self.validate(item, Path(directory))))


if __name__ == "__main__":
    unittest.main()
