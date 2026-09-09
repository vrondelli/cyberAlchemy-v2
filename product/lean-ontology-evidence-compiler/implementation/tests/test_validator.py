#!/usr/bin/env python3
import copy
import importlib.util
import json
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
IMPLEMENTATION = HERE.parent
ROOT = IMPLEMENTATION.parents[3]
SPEC = importlib.util.spec_from_file_location("validate_typed_edge", IMPLEMENTATION / "validate_typed_edge.py")
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader
SPEC.loader.exec_module(MODULE)
BASE = json.loads((IMPLEMENTATION / "fixtures" / "positive.json").read_text(encoding="utf-8"))


class ValidateTypedEdgeTests(unittest.TestCase):
    def validate(self, request):
        return MODULE.validate_request(request, ROOT)

    def test_positive_is_deterministic_and_reviewable(self):
        first = self.validate(BASE)
        second = self.validate(copy.deepcopy(BASE))
        self.assertEqual(first, second)
        self.assertEqual(first["status"], "reviewable-candidate-evidence")
        self.assertEqual(first["authority_effect"], "none")
        self.assertEqual(len(first["resolved_selectors"]), 2)

    def test_reversed_direction_rejected(self):
        request = copy.deepcopy(BASE)
        request["candidate_edge"] = {"source_kind": "BusinessMeaning", "predicate": "formalizes", "target_kind": "FormalClaim"}
        self.assertIn("REVERSED_DIRECTION", self.validate(request)["rejection_codes"])

    def test_missing_selector_rejected(self):
        request = copy.deepcopy(BASE)
        request["supporting_bindings"] = []
        self.assertIn("MISSING_SUPPORTING_BINDING", self.validate(request)["rejection_codes"])

    def test_mutated_selector_rejected(self):
        request = copy.deepcopy(BASE)
        request["supporting_bindings"][0]["declaration_line_sha256"] = "0" * 64
        self.assertIn("DECLARATION_LINE_DIGEST_MISMATCH", self.validate(request)["rejection_codes"])

    def test_wrong_qualified_name_rejected(self):
        request = copy.deepcopy(BASE)
        request["supporting_bindings"][0]["qualified_name"] = "SpecificationOntology.Edge.NotWellTyped"
        self.assertIn("QUALIFIED_NAME_MISMATCH", self.validate(request)["rejection_codes"])

    def test_unknown_field_rejected(self):
        request = copy.deepcopy(BASE)
        request["unexpected"] = True
        self.assertIn("UNKNOWN_FIELD", self.validate(request)["rejection_codes"])

    def test_wrong_source_commit_rejected(self):
        request = copy.deepcopy(BASE)
        request["source_commit"] = "0" * 40
        self.assertIn("WRONG_SOURCE_COMMIT", self.validate(request)["rejection_codes"])

    def test_authority_effect_rejected(self):
        request = copy.deepcopy(BASE)
        request["authority_effect"] = "admit"
        result = self.validate(request)
        self.assertIn("INVALID_AUTHORITY_EFFECT", result["rejection_codes"])
        self.assertEqual(result["authority_effect"], "none")


if __name__ == "__main__":
    unittest.main()
