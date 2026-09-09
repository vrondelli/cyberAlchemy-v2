#!/usr/bin/env python3
"""Regression tests for the Solana completion definition successor."""

from __future__ import annotations

import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path


ORIGINAL_ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("kep_solana_completion_definitions_validate", ORIGINAL_ROOT / "validate.py")
assert SPEC and SPEC.loader
VALIDATOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(VALIDATOR)


class SolanaCompletionDefinitionValidationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name) / "002"
        shutil.copytree(ORIGINAL_ROOT, self.root)
        VALIDATOR.DEFINITION_ROOT = self.root
        VALIDATOR.MANIFEST_PATH = self.root / "definition-set.json"
        VALIDATOR.DEFINITIONS_PATH = self.root / "DEFINITIONS.md"
        VALIDATOR.INDEX_PATH = self.root / "DEFINITIONS-INDEX.md"
        VALIDATOR.DRIFT_PATH = self.root / "DEFINITION-DRIFT-AUDIT.md"
        VALIDATOR.PACK_PATH = self.root / "definition-pack-candidate.json"

    def tearDown(self) -> None:
        VALIDATOR.DEFINITION_ROOT = ORIGINAL_ROOT
        VALIDATOR.MANIFEST_PATH = ORIGINAL_ROOT / "definition-set.json"
        VALIDATOR.DEFINITIONS_PATH = ORIGINAL_ROOT / "DEFINITIONS.md"
        VALIDATOR.INDEX_PATH = ORIGINAL_ROOT / "DEFINITIONS-INDEX.md"
        VALIDATOR.DRIFT_PATH = ORIGINAL_ROOT / "DEFINITION-DRIFT-AUDIT.md"
        VALIDATOR.PACK_PATH = ORIGINAL_ROOT / "definition-pack-candidate.json"
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
        self.assertEqual(7, first["definition_count"])
        self.assertEqual("none", first["authority_effect"])

    def test_definition_extension_digest_drift_blocks(self) -> None:
        with (self.root / "DEFINITIONS.md").open("a", encoding="utf-8") as handle:
            handle.write("\nunauthorized drift\n")
        self.assert_blocked_with("candidate definition extension digest drift")

    def test_missing_domain_voice_blocks(self) -> None:
        path = self.root / "DEFINITIONS.md"
        text = path.read_text(encoding="utf-8").replace("### Domain-Context Voice", "### Removed Voice", 1)
        path.write_text(text, encoding="utf-8")
        self.assert_blocked_with("KEP-SOL-D11 missing definition voice")

    def test_predecessor_digest_cannot_be_refreshed_implicitly(self) -> None:
        path = self.root / "definition-set.json"
        manifest = json.loads(path.read_text(encoding="utf-8"))
        manifest["predecessor_definition_set"]["sha256"] = "0" * 64
        path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        self.assert_blocked_with("manifest predecessor definition source digest drift")

    def test_durable_dependency_digest_cannot_drift(self) -> None:
        path = self.root / "definition-set.json"
        manifest = json.loads(path.read_text(encoding="utf-8"))
        manifest["durable_storage_dependency"]["sha256"] = "0" * 64
        path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        self.assert_blocked_with("manifest Durable Storage definition source digest drift")

    def test_index_alias_closure_blocks_drift(self) -> None:
        path = self.root / "DEFINITIONS-INDEX.md"
        text = path.read_text(encoding="utf-8").replace(
            "| protocol cryptographic profile | KEP-SOL-D11 |\n",
            "",
        )
        path.write_text(text, encoding="utf-8")
        self.assert_blocked_with("index missing protocol cryptographic profile")

    def test_specialization_requires_parent_definitions(self) -> None:
        path = self.root / "definition-pack-candidate.json"
        pack = json.loads(path.read_text(encoding="utf-8"))
        pack["concepts"][1].pop("parent_definition_refs")
        path.write_text(json.dumps(pack, indent=2) + "\n", encoding="utf-8")
        self.assert_blocked_with("must name its parent definitions")

    def test_disposition_must_be_one_known_value(self) -> None:
        path = self.root / "definition-pack-candidate.json"
        pack = json.loads(path.read_text(encoding="utf-8"))
        pack["concepts"][0]["current_disposition"] = ["propose", "reuse"]
        path.write_text(json.dumps(pack, indent=2) + "\n", encoding="utf-8")
        self.assert_blocked_with("must have one valid disposition")

    def test_storage_instantiation_cannot_select_postgresql(self) -> None:
        path = self.root / "DEFINITIONS.md"
        text = path.read_text(encoding="utf-8").replace(
            "PostgreSQL is\nnot part of this definition",
            "PostgreSQL is\nrequired by this definition",
            1,
        )
        path.write_text(text, encoding="utf-8")
        self.assert_blocked_with("KEP-SOL-D12 missing critical distinction")


if __name__ == "__main__":
    unittest.main()
