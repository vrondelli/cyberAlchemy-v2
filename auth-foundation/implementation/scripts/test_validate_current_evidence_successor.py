#!/usr/bin/env python3
"""Pure controls for the current technical evidence successor verifier."""

from __future__ import annotations

import importlib.util
import copy
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("validate-current-evidence-successor.py")
SPEC = importlib.util.spec_from_file_location("validate_current_evidence_successor", SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class SuccessorVerifierTests(unittest.TestCase):
    def test_test_inventory_binds_names_not_only_count(self) -> None:
        first = MODULE.test_inventory("alpha: test\nbeta: test\n", 2)
        changed = MODULE.test_inventory("alpha: test\ngamma: test\n", 2)
        self.assertNotEqual(first["test_names_sha256"], changed["test_names_sha256"])
        with self.assertRaises(ValueError):
            MODULE.test_inventory("alpha: test\nalpha: test\n", 2)
        with self.assertRaises(ValueError):
            MODULE.test_inventory("alpha: test\n", 2)

    def test_exact_record_comparison_rejects_mutation(self) -> None:
        expected = {
            "current_sources": {"receipt": "a" * 64, "source": "b" * 64},
            "architecture": {"trusted_input_transaction_entrypoint": "resolve_in_transaction"},
            "verification": {"test_names_sha256": "c" * 64, "test_count": 21},
            "authority_effect": "none",
        }
        MODULE.verify(dict(expected), expected)
        changes = (
            ("current_sources", "receipt", "d" * 64),
            ("current_sources", "source", "e" * 64),
            ("architecture", "trusted_input_transaction_entrypoint", "resolve"),
            ("verification", "test_names_sha256", "f" * 64),
            ("verification", "test_count", 4),
        )
        for section, key, value in changes:
            mutated = copy.deepcopy(expected)
            mutated[section][key] = value
            with self.subTest(section=section, key=key), self.assertRaises(ValueError):
                MODULE.verify(mutated, expected)

    def test_path_cannot_escape_auth_root(self) -> None:
        with self.assertRaises(ValueError):
            MODULE.resolve_auth_path("../outside.json")
        with self.assertRaises(ValueError):
            MODULE.resolve_auth_path("implementation/no-such-file.json")


if __name__ == "__main__":
    unittest.main()
