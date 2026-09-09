#!/usr/bin/env python3
"""Regression tests for the encrypted durable Devnet ontology candidate."""

from __future__ import annotations

import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path


ORIGINAL_PACKAGE_ROOT = Path(__file__).resolve().parents[1]
ORIGINAL_REPOSITORY_ROOT = ORIGINAL_PACKAGE_ROOT.parents[8]
SPEC = importlib.util.spec_from_file_location("kep_solana_encrypted_durable_ontology_validate", ORIGINAL_PACKAGE_ROOT / "validate.py")
assert SPEC and SPEC.loader
VALIDATOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(VALIDATOR)


class OntologyValidationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.working_root = Path(self.temporary.name) / "repo"
        self.package_root = self.working_root / ORIGINAL_PACKAGE_ROOT.relative_to(ORIGINAL_REPOSITORY_ROOT)
        self.package_root.parent.mkdir(parents=True)
        shutil.copytree(ORIGINAL_PACKAGE_ROOT, self.package_root, ignore=shutil.ignore_patterns("__pycache__"))
        sources = json.loads((ORIGINAL_PACKAGE_ROOT / "sources.json").read_text(encoding="utf-8"))["sources"]
        for record in sources:
            if record["location"] != "working-tree":
                continue
            source = ORIGINAL_REPOSITORY_ROOT / record["path"]
            target = self.working_root / record["path"]
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
        VALIDATOR.configure(self.package_root, self.working_root, ORIGINAL_REPOSITORY_ROOT)

    def tearDown(self) -> None:
        VALIDATOR.configure(ORIGINAL_PACKAGE_ROOT, ORIGINAL_REPOSITORY_ROOT, ORIGINAL_REPOSITORY_ROOT)
        self.temporary.cleanup()

    @staticmethod
    def read_json(path: Path) -> dict:
        return json.loads(path.read_text(encoding="utf-8"))

    @staticmethod
    def write_json(path: Path, value: dict) -> None:
        path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")

    def assert_blocked_with(self, marker: str) -> None:
        result = VALIDATOR.validate()
        self.assertEqual("BLOCK", result["status"])
        self.assertTrue(any(marker in error for error in result["errors"]), result["errors"])

    def test_baseline_is_deterministic_and_check_only(self) -> None:
        before = sorted(path.relative_to(self.working_root) for path in self.working_root.rglob("*"))
        first = VALIDATOR.validate()
        second = VALIDATOR.validate()
        after = sorted(path.relative_to(self.working_root) for path in self.working_root.rglob("*"))
        self.assertEqual("PASS", first["status"], first["errors"])
        self.assertEqual(first, second)
        self.assertEqual(before, after)
        self.assertEqual(32, first["counts"]["definition_bindings"])
        self.assertEqual("authored-candidate", first["lifecycle_status"])

    def test_working_source_digest_drift_blocks(self) -> None:
        relative = "cyberAlchemy-v2/product/knowledge-exchange-protocol/capabilities/solana-coownership/authority/definitions/successors/002/DEFINITIONS.md"
        path = self.working_root / relative
        path.write_text(path.read_text(encoding="utf-8") + "\nunauthorized drift\n", encoding="utf-8")
        self.assert_blocked_with("source digest drift: SRC-KEP-SOL2-COMPLETION-DEFINITIONS")

    def test_git_object_drift_blocks(self) -> None:
        path = self.package_root / "sources.json"
        value = self.read_json(path)
        value["sources"][9]["git_object"] = "HEAD"
        self.write_json(path, value)
        self.assert_blocked_with("source Git object drift")

    def test_selector_digest_drift_blocks(self) -> None:
        path = self.package_root / "sources.json"
        value = self.read_json(path)
        value["selections"][10]["selection_sha256"] = "0" * 64
        self.write_json(path, value)
        self.assert_blocked_with("selection digest drift")

    def test_definition_binding_removal_blocks(self) -> None:
        path = self.package_root / "definition-bindings.json"
        value = self.read_json(path)
        value["bindings"].pop()
        self.write_json(path, value)
        self.assert_blocked_with("definition-binding ID closure drift")

    def test_dangling_relation_blocks(self) -> None:
        path = self.package_root / "relations.json"
        value = self.read_json(path)
        value["relations"][0]["target"] = "CA2-MISSING-NODE"
        self.write_json(path, value)
        self.assert_blocked_with("dangling relation target")

    def test_rule_cannot_self_promote(self) -> None:
        path = self.package_root / "rules.json"
        value = self.read_json(path)
        value["rules"][0]["enforcement_state"] = "enforced"
        self.write_json(path, value)
        self.assert_blocked_with("candidate rule self-promotion")

    def test_proof_cannot_self_promote(self) -> None:
        path = self.package_root / "proof-requirements.json"
        value = self.read_json(path)
        value["proof_requirements"][0]["evidence_state"] = "PASS"
        self.write_json(path, value)
        self.assert_blocked_with("proof requirements must remain not_evaluable")

    def test_finalized_activation_source_drift_blocks(self) -> None:
        relative = "cyberAlchemy-v2/product/knowledge-exchange-protocol/capabilities/solana-coownership/successors/encrypted-durable-devnet/v1/durable-storage-instantiation.json"
        path = self.working_root / relative
        value = self.read_json(path)
        value["activation_rule"]["solana_commitment"] = "confirmed"
        self.write_json(path, value)
        self.assert_blocked_with("storage instantiation or finalized activation drift")

    def test_ontology_cannot_self_admit(self) -> None:
        path = self.package_root / "profile.json"
        value = self.read_json(path)
        value["lifecycle_status"] = "admitted"
        self.write_json(path, value)
        self.assert_blocked_with("business ontology must remain an authored candidate")

    def test_candidate_material_digest_drift_blocks(self) -> None:
        path = self.package_root / "candidate.json"
        value = self.read_json(path)
        value["material_digest"] = "0" * 64
        self.write_json(path, value)
        self.assert_blocked_with("ontology candidate material digest drift")


if __name__ == "__main__":
    unittest.main()
