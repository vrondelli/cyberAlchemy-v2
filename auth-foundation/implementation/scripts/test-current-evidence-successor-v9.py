#!/usr/bin/env python3
"""Fast controls for the expanded enumerated Auth technical source set."""

import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


SCRIPT = Path(__file__).with_name("validate-current-evidence-successor-v9.py")
SPEC = importlib.util.spec_from_file_location("auth_current_evidence_v9", SCRIPT)
assert SPEC is not None and SPEC.loader is not None
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class CurrentEvidenceV9Tests(unittest.TestCase):
    def fixture(self):
        base = {"old": "a" * 64}
        expanded = {**base, **{name: "b" * 64 for name in MODULE.ADDED}}
        return base, expanded

    def test_exact_eight_additions_pass(self) -> None:
        base, expanded = self.fixture()
        self.assertEqual(set(MODULE.checked_expansion(base, expanded)), MODULE.ADDED)
        self.assertEqual(len(MODULE.ADDED), 8)

    def test_missing_extra_or_changed_old_source_fails(self) -> None:
        for action in ("missing", "extra", "changed"):
            with self.subTest(action=action):
                base, expanded = self.fixture()
                if action == "missing":
                    del expanded[next(iter(MODULE.ADDED))]
                elif action == "extra":
                    expanded["unreviewed"] = "c" * 64
                else:
                    expanded["old"] = "c" * 64
                with self.assertRaises(ValueError):
                    MODULE.checked_expansion(base, expanded)

    def test_invalid_hash_fails(self) -> None:
        base, expanded = self.fixture()
        expanded[next(iter(MODULE.ADDED))] = "invalid"
        with self.assertRaisesRegex(ValueError, "added source hash"):
            MODULE.checked_expansion(base, expanded)

    def test_trace_package_exact_files(self) -> None:
        self.assertEqual(MODULE.trace_package_files(), MODULE.TRACE)

    def test_trace_package_symlink_or_extra_file_fails(self) -> None:
        with tempfile.TemporaryDirectory(dir=MODULE.IMPL) as directory:
            root = Path(directory)
            source = root / "source"
            source.write_text("source", encoding="utf-8")
            link = root / "link"
            link.symlink_to(source)
            with patch.object(MODULE, "TRACE_DIR", root):
                with self.assertRaisesRegex(ValueError, "symlinked trace input"):
                    MODULE.trace_package_files()
            link.unlink()
            with patch.object(MODULE, "TRACE_DIR", root):
                with self.assertRaisesRegex(ValueError, "trace package file set changed"):
                    MODULE.trace_package_files()


if __name__ == "__main__":
    unittest.main()
