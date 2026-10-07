#!/usr/bin/env python3
"""Small negative controls for the exact current Auth evidence binding."""

from __future__ import annotations

import copy
import importlib.util
import json
import unittest
from pathlib import Path
from unittest.mock import patch


SCRIPT = Path(__file__).with_name("validate-current-evidence-successor-v2.py")
SPEC = importlib.util.spec_from_file_location("current_auth_evidence_v2", SCRIPT)
assert SPEC and SPEC.loader
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)


class BindingNegativeControls(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.binding = json.loads(module.BINDING.read_text())

    def test_claim_mutation_rejected(self) -> None:
        changed = copy.deepcopy(self.binding)
        changed["runtime_guarantees_observed"] = True
        with self.assertRaises(ValueError):
            module.verify(changed, self.binding)

    def test_source_and_historical_mutation_rejected(self) -> None:
        for section in ("current_sources", "historical_snapshots"):
            with self.subTest(section=section):
                changed = copy.deepcopy(self.binding)
                key = next(iter(changed[section]))
                changed[section][key] = "0" * 64
                with self.assertRaises(ValueError):
                    module.verify(changed, self.binding)

    def test_v1_substitution_rejected(self) -> None:
        changed = copy.deepcopy(self.binding)
        changed["architecture"]["active_decision_path"][2] = "trusted-boundary"
        with self.assertRaises(ValueError):
            module.verify(changed, self.binding)

    def test_same_count_rename_changes_inventory(self) -> None:
        original = module.inventory("one: test\ntwo: test\n")
        renamed = module.inventory("one: test\nthree: test\n")
        self.assertEqual(original["test_count"], renamed["test_count"])
        self.assertNotEqual(original["test_names_sha256"], renamed["test_names_sha256"])

    def test_duplicate_test_name_rejected(self) -> None:
        with self.assertRaises(ValueError):
            module.inventory("same: test\nsame: test\n")

    def test_escape_and_missing_paths_rejected(self) -> None:
        for path in ("../outside-auth", "implementation/does-not-exist"):
            with self.subTest(path=path), self.assertRaises(ValueError):
                module.source_path(path)

    def test_mutated_live_cargo_wiring_rejected(self) -> None:
        original = Path.read_text
        manifest = module.IMPLEMENTATION / "authorization-service/Cargo.toml"

        def mutated(path: Path, *args: object, **kwargs: object) -> str:
            value = original(path, *args, **kwargs)
            if path == manifest:
                return value.replace(
                    'path = "../trusted-boundary-pre-resolved-v2-candidate"',
                    'path = "../trusted-boundary"',
                )
            return value

        with patch.object(Path, "read_text", mutated), self.assertRaisesRegex(ValueError, "v2 Cargo dependency"):
            module.verify_wiring()

    def test_mutated_live_decision_call_rejected(self) -> None:
        original = Path.read_text
        source = module.IMPLEMENTATION / "authorization-service/src/lib.rs"

        def mutated(path: Path, *args: object, **kwargs: object) -> str:
            value = original(path, *args, **kwargs)
            return value.replace("authorize_pre_resolved(", "authorize_legacy(") if path == source else value

        with patch.object(Path, "read_text", mutated), self.assertRaisesRegex(ValueError, "service v2 decision call"):
            module.verify_wiring()


if __name__ == "__main__":
    unittest.main()
