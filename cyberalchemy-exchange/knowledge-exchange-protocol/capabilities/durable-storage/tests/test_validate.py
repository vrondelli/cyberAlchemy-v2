#!/usr/bin/env python3
"""Mutation tests for the durable-storage Definition Pack validator."""

from __future__ import annotations

import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path


ORIGINAL_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = Path(__file__).resolve().parents[6]
SPEC = importlib.util.spec_from_file_location("kep_durable_storage_validate", ORIGINAL_ROOT / "validate.py")
assert SPEC and SPEC.loader
VALIDATOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(VALIDATOR)


class DurableStorageDefinitionValidationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name) / "durable-storage"
        shutil.copytree(ORIGINAL_ROOT, self.root)

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def validate(self) -> dict[str, object]:
        return VALIDATOR.validate_candidate(self.root, REPOSITORY_ROOT)

    def assert_blocked_with(self, marker: str) -> None:
        result = self.validate()
        self.assertEqual("BLOCK", result["result"])
        self.assertTrue(any(marker in error for error in result["errors"]), result["errors"])

    def test_baseline_is_deterministic_and_check_only(self) -> None:
        before = sorted(path.relative_to(self.root) for path in self.root.rglob("*") if path.is_file())
        first = self.validate()
        second = self.validate()
        after = sorted(path.relative_to(self.root) for path in self.root.rglob("*") if path.is_file())
        self.assertEqual("PASS", first["result"], first["errors"])
        self.assertEqual(first, second)
        self.assertEqual(before, after)
        self.assertEqual(15, first["counts"]["definitions"])
        self.assertEqual(30, first["counts"]["aliases"])
        self.assertEqual("none", first["authority_effect"])

    def test_missing_definition_voice_blocks(self) -> None:
        path = self.root / "authority/definitions/DEFINITIONS.md"
        text = path.read_text(encoding="utf-8").replace(
            "### Plain-Language Intuition", "### Removed Intuition", 1
        )
        path.write_text(text, encoding="utf-8")
        self.assert_blocked_with("KEP-DST-D1 missing definition voice")

    def test_invalid_concept_disposition_blocks(self) -> None:
        path = self.root / "definition-pack-candidate.json"
        pack = json.loads(path.read_text(encoding="utf-8"))
        pack["concepts"][0]["current_disposition"] = "accepted"
        path.write_text(json.dumps(pack, indent=2) + "\n", encoding="utf-8")
        self.assert_blocked_with("invalid disposition")

    def test_generic_definition_cannot_own_solana_behavior(self) -> None:
        path = self.root / "authority/definitions/DEFINITIONS.md"
        text = path.read_text(encoding="utf-8").replace(
            "The Knowledge Exchange Protocol uses durable objects",
            "Solana directly owns durable objects",
            1,
        )
        path.write_text(text, encoding="utf-8")
        self.assert_blocked_with("leaks Solana consumer meaning into generic storage")

    def test_index_mapping_drift_blocks(self) -> None:
        path = self.root / "authority/definitions/DEFINITIONS-INDEX.md"
        text = path.read_text(encoding="utf-8").replace(
            "| retrieval locator | KEP-DST-D4 |\n", ""
        )
        path.write_text(text, encoding="utf-8")
        self.assert_blocked_with("index missing mappings")

    def test_predecessor_source_digest_drift_blocks(self) -> None:
        path = self.root / "definition-pack-candidate.json"
        pack = json.loads(path.read_text(encoding="utf-8"))
        pack["sources"][0]["sha256"] = "0" * 64
        path.write_text(json.dumps(pack, indent=2) + "\n", encoding="utf-8")
        self.assert_blocked_with("source digest drift")

    def test_unresolved_relationship_endpoint_blocks(self) -> None:
        path = self.root / "definition-pack-candidate.json"
        pack = json.loads(path.read_text(encoding="utf-8"))
        pack["relationships"][0]["target_concept_id"] = "kep-storage.missing"
        path.write_text(json.dumps(pack, indent=2) + "\n", encoding="utf-8")
        self.assert_blocked_with("unresolved target_concept_id")

    def test_solana_instantiation_fields_cannot_be_implicit(self) -> None:
        path = self.root / "definition-pack-candidate.json"
        pack = json.loads(path.read_text(encoding="utf-8"))
        pack["responsibility_model"]["first_consumer"]["must_bind"].pop()
        path.write_text(json.dumps(pack, indent=2) + "\n", encoding="utf-8")
        self.assert_blocked_with("Solana semantic instantiation field closure drift")


if __name__ == "__main__":
    unittest.main()
