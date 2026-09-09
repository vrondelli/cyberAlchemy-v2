from __future__ import annotations

import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("solana_domainspec_validate", PACKAGE_ROOT / "validate.py")
assert SPEC and SPEC.loader
VALIDATE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(VALIDATE)


class DomainSpecCandidateValidationTests(unittest.TestCase):
    def copied_candidate(self) -> tuple[tempfile.TemporaryDirectory[str], Path]:
        temporary = tempfile.TemporaryDirectory()
        target = Path(temporary.name) / "domainspec"
        shutil.copytree(PACKAGE_ROOT, target, ignore=shutil.ignore_patterns("__pycache__"))
        return temporary, target

    def test_structural_candidate_passes(self) -> None:
        result = VALIDATE.validate_candidate(PACKAGE_ROOT, run_native=False)
        self.assertEqual("pass", result["result"], result.get("errors"))

    def test_missing_ontology_mapping_fails_closed(self) -> None:
        temporary, target = self.copied_candidate()
        self.addCleanup(temporary.cleanup)
        binding_path = target / "binding.json"
        binding = json.loads(binding_path.read_text(encoding="utf-8"))
        del binding["ontology_node_mappings"]["CA2-SOLANA-COOWNER-MEMBERSHIP"]
        binding_path.write_text(json.dumps(binding, indent=2) + "\n", encoding="utf-8")
        result = VALIDATE.validate_candidate(target, run_native=False)
        self.assertEqual("fail", result["result"])
        self.assertTrue(any("ontology node mapping is not total" in error for error in result["errors"]))

    def test_undeclared_node_fails_closed(self) -> None:
        temporary, target = self.copied_candidate()
        self.addCleanup(temporary.cleanup)
        extra = target / "specs/no-price-solana-coownership/nodes/ambient.json"
        extra.write_text("{}\n", encoding="utf-8")
        result = VALIDATE.validate_candidate(target, run_native=False)
        self.assertEqual("fail", result["result"])
        self.assertIn("declared node files do not exactly equal authored node files", result["errors"])


if __name__ == "__main__":
    unittest.main()
