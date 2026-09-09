#!/usr/bin/env python3
"""Regression tests for the Solana co-ownership definition candidate."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path


ORIGINAL_ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("kep_solana_definitions_validate", ORIGINAL_ROOT / "validate.py")
assert SPEC and SPEC.loader
VALIDATOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(VALIDATOR)


class SolanaDefinitionValidationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name) / "definitions"
        shutil.copytree(ORIGINAL_ROOT, self.root)
        VALIDATOR.DEFINITION_ROOT = self.root
        VALIDATOR.MANIFEST_PATH = self.root / "definition-set.json"
        VALIDATOR.DEFINITIONS_PATH = self.root / "DEFINITIONS.md"
        VALIDATOR.INDEX_PATH = self.root / "DEFINITIONS-INDEX.md"
        VALIDATOR.DRIFT_PATH = self.root / "DEFINITION-DRIFT-AUDIT.md"

    def tearDown(self) -> None:
        VALIDATOR.DEFINITION_ROOT = ORIGINAL_ROOT
        VALIDATOR.MANIFEST_PATH = ORIGINAL_ROOT / "definition-set.json"
        VALIDATOR.DEFINITIONS_PATH = ORIGINAL_ROOT / "DEFINITIONS.md"
        VALIDATOR.INDEX_PATH = ORIGINAL_ROOT / "DEFINITIONS-INDEX.md"
        VALIDATOR.DRIFT_PATH = ORIGINAL_ROOT / "DEFINITION-DRIFT-AUDIT.md"
        self.temporary.cleanup()

    def assert_blocked_with(self, marker: str) -> None:
        result = VALIDATOR.validate()
        self.assertEqual("BLOCK", result["status"])
        self.assertTrue(any(marker in error for error in result["errors"]), result["errors"])

    def test_baseline_is_deterministic_and_check_only(self) -> None:
        before = sorted(path.relative_to(self.root) for path in self.root.rglob("*"))
        first = VALIDATOR.validate()
        second = VALIDATOR.validate()
        after = sorted(path.relative_to(self.root) for path in self.root.rglob("*"))
        self.assertEqual("PASS", first["status"], first["errors"])
        self.assertEqual(first, second)
        self.assertEqual(before, after)
        self.assertEqual(10, first["definition_count"])
        self.assertEqual("none", first["authority_effect"])

    def test_definition_source_digest_drift_blocks(self) -> None:
        with (self.root / "DEFINITIONS.md").open("a", encoding="utf-8") as handle:
            handle.write("\nunauthorized drift\n")
        self.assert_blocked_with("candidate definition source digest drift")

    def test_missing_domain_voice_blocks(self) -> None:
        path = self.root / "DEFINITIONS.md"
        text = path.read_text(encoding="utf-8").replace("### Domain-Context Voice", "### Removed Voice", 1)
        path.write_text(text, encoding="utf-8")
        self.assert_blocked_with("KEP-SOL-D1 missing definition voice")

    def test_public_key_cannot_collapse_into_identity(self) -> None:
        path = self.root / "DEFINITIONS.md"
        text = path.read_text(encoding="utf-8").replace(
            "the public key is not the Knowledge Identity",
            "the public key represents the subject",
            1,
        )
        path.write_text(text, encoding="utf-8")
        self.assert_blocked_with("KEP-SOL-D1 missing critical distinction")

    def test_no_price_cannot_hide_network_costs(self) -> None:
        path = self.root / "DEFINITIONS.md"
        text = path.read_text(encoding="utf-8").replace(
            "Network transaction fees, account rent, or refundable rent\nreserves",
            "Infrastructure costs",
            1,
        )
        path.write_text(text, encoding="utf-8")
        self.assert_blocked_with("KEP-SOL-D9 missing critical distinction")

    def test_index_alias_closure_blocks_drift(self) -> None:
        path = self.root / "DEFINITIONS-INDEX.md"
        text = path.read_text(encoding="utf-8").replace(
            "| Solana signer binding | KEP-SOL-D1 |\n",
            "",
        )
        path.write_text(text, encoding="utf-8")
        self.assert_blocked_with("index missing Solana signer binding")

    def test_predecessor_digest_cannot_be_refreshed_implicitly(self) -> None:
        path = self.root / "definition-set.json"
        manifest = json.loads(path.read_text(encoding="utf-8"))
        manifest["base_definition_source"]["sha256"] = "0" * 64
        path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        self.assert_blocked_with("manifest base definition digest drift")


if __name__ == "__main__":
    unittest.main()
