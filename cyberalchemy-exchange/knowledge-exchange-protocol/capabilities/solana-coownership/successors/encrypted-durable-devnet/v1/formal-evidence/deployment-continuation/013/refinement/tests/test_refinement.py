from __future__ import annotations

import copy
import importlib.util
import json
import unittest
from unittest import mock
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("kep_refinement_author", ROOT / "author.py")
assert SPEC is not None and SPEC.loader is not None
AUTHOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(AUTHOR)


class RefinementModelTests(unittest.TestCase):
    def setUp(self) -> None:
        self.model = json.loads((ROOT / "refinement-model.json").read_text())
        claims_path = (ROOT / self.model["baseline"]["claims_path"]).resolve()
        self.claims = json.loads(claims_path.read_text())
        self.source_texts = {
            item["path"]: (AUTHOR.REPO / item["path"]).read_text()
            for item in self.model["runtime"]["sources"]
        }
        self.tests = {test for item in self.model["mappings"] for test in item["tests"]}

    def evaluate(self, model: dict[str, object] | None = None) -> list[str]:
        return AUTHOR.validate_structure(model or self.model, self.claims, self.source_texts, self.tests)

    def test_all_ten_obligations_have_exact_trace_closure(self) -> None:
        self.assertEqual([], self.evaluate())
        self.assertEqual(10, len(self.model["mappings"]))

    def test_missing_obligation_mapping_blocks(self) -> None:
        model = copy.deepcopy(self.model)
        model["mappings"].pop()
        self.assertTrue(any(item.startswith("missing-obligation-mappings:") for item in self.evaluate(model)))

    def test_formal_theorem_substitution_blocks(self) -> None:
        model = copy.deepcopy(self.model)
        model["mappings"][0]["formal_theorems"] = ["inventedTheorem"]
        self.assertIn("formal-theorem-mapping-drift:CONTINUATION-EXACT-ARITHMETIC", self.evaluate(model))

    def test_missing_rust_symbol_blocks(self) -> None:
        model = copy.deepcopy(self.model)
        model["mappings"][0]["rust_symbols"].append("invented_rust_symbol")
        self.assertTrue(any("missing-rust-symbol:" in item for item in self.evaluate(model)))

    def test_missing_focused_test_blocks(self) -> None:
        model = copy.deepcopy(self.model)
        model["mappings"][0]["tests"].append("invented::test")
        self.assertTrue(any("missing-focused-test:" in item for item in self.evaluate(model)))

    def test_authority_and_provider_policy_remain_bounded(self) -> None:
        self.assertEqual("none", self.model["authority_effect"])
        self.assertIn("no provider brand", self.model["provider_policy"])

    def test_exact_source_digest_drift_blocks_authoring(self) -> None:
        with mock.patch.object(AUTHOR, "sha_file", return_value="0" * 64):
            with self.assertRaisesRegex(ValueError, "formal claims baseline drift"):
                AUTHOR.build()


if __name__ == "__main__":
    unittest.main()
