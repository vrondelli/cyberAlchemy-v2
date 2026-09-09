#!/usr/bin/env python3
"""Mutation coverage for the encrypted durable Devnet DomainSpec candidate."""

from __future__ import annotations

import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
VALIDATOR_PATH = PACKAGE_ROOT / "validate.py"


def load_validator():
    spec = importlib.util.spec_from_file_location("kep_encrypted_durable_devnet_domainspec_validator", VALIDATOR_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError("cannot load DomainSpec validator")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class DomainSpecValidationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.validator = load_validator()

    def candidate_copy(self):
        temporary = tempfile.TemporaryDirectory(prefix="kep-sol2-domainspec-test-")
        target = Path(temporary.name) / "domainspec"
        shutil.copytree(PACKAGE_ROOT, target, ignore=shutil.ignore_patterns("__pycache__"))
        return temporary, target

    @staticmethod
    def mutate_json(path: Path, callback) -> None:
        value = json.loads(path.read_text(encoding="utf-8"))
        callback(value)
        path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    def assert_blocked(self, mutation) -> None:
        temporary, target = self.candidate_copy()
        try:
            mutation(target)
            result = self.validator.validate_candidate(target, run_native=False)
            self.assertEqual("fail", result["result"], result)
        finally:
            temporary.cleanup()

    def test_baseline_passes_structural_validation(self) -> None:
        result = self.validator.validate_candidate(PACKAGE_ROOT, run_native=False)
        self.assertEqual("pass", result["result"], result)

    def test_lifecycle_promotion_is_rejected(self) -> None:
        self.assert_blocked(lambda root: self.mutate_json(root / "binding.json", lambda value: value.__setitem__("lifecycle_status", "admitted")))

    def test_predecessor_digest_drift_is_rejected(self) -> None:
        self.assert_blocked(lambda root: self.mutate_json(root / "binding.json", lambda value: value["predecessors"]["ontology_admission"].__setitem__("sha256", "0" * 64)))

    def test_selected_material_drift_is_rejected(self) -> None:
        self.assert_blocked(lambda root: self.mutate_json(root / "binding.json", lambda value: value["selected_ontology_material"][0].__setitem__("sha256", "0" * 64)))

    def test_selected_selector_drift_is_rejected(self) -> None:
        self.assert_blocked(lambda root: self.mutate_json(root / "binding.json", lambda value: value["selected_source_dependencies"]["selections"][0].__setitem__("selection_sha256", "0" * 64)))

    def test_missing_node_file_is_rejected(self) -> None:
        def mutation(root: Path) -> None:
            (root / "specs/encrypted-durable-devnet-coownership/nodes/artifact-state.json").unlink()
        self.assert_blocked(mutation)

    def test_undeclared_node_file_is_rejected(self) -> None:
        def mutation(root: Path) -> None:
            source = root / "specs/encrypted-durable-devnet-coownership/nodes/artifact-state.json"
            shutil.copyfile(source, source.with_name("unexpected-node.json"))
        self.assert_blocked(mutation)

    def test_definition_mapping_omission_is_rejected(self) -> None:
        self.assert_blocked(lambda root: self.mutate_json(root / "binding.json", lambda value: value["definition_mappings"].pop("KEP-SOL-D1")))

    def test_ontology_node_mapping_target_drift_is_rejected(self) -> None:
        self.assert_blocked(lambda root: self.mutate_json(root / "binding.json", lambda value: value["ontology_node_mappings"]["CA2-IDENTITY-KNOWLEDGE-PARTICIPANT"].append("unknown-node")))

    def test_relation_projection_edge_drift_is_rejected(self) -> None:
        relation_id = "KEP-SOL2-REL-CAP-EXTENDS-SOLANA"
        self.assert_blocked(lambda root: self.mutate_json(root / "binding.json", lambda value: value["ontology_relation_mappings"][relation_id].__setitem__("system_projection_edges", ["unknown-edge"])))

    def test_rule_predicate_drift_is_rejected(self) -> None:
        path = "specs/encrypted-durable-devnet-coownership/nodes/rule-preserve-a.json"
        self.assert_blocked(lambda root: self.mutate_json(root / path, lambda value: value["body"].__setitem__("predicate", "A may be removed.")))

    def test_successor_authority_inflation_is_rejected(self) -> None:
        self.assert_blocked(lambda root: self.mutate_json(root / "binding.json", lambda value: value["successor_authorization"].__setitem__("implementation", "authorized")))


if __name__ == "__main__":
    unittest.main()
