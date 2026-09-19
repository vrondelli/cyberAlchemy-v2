from __future__ import annotations

import unittest

from provider import analyze_source, bind_expected_declarations


class ProviderSourceAnalysisTests(unittest.TestCase):
    def test_definition_is_not_a_theorem(self) -> None:
        analysis = analyze_source("def obligation : Prop := True\n")
        self.assertEqual(analysis["theorem_declaration_count"], 0)

    def test_theorem_and_lemma_are_detected(self) -> None:
        analysis = analyze_source("theorem first : True := by trivial\nlemma second : True := by trivial\n")
        self.assertEqual(analysis["declaration_names"], ["first", "second"])

    def test_declarations_are_qualified_by_namespace(self) -> None:
        analysis = analyze_source(
            "namespace Auth.Service\n"
            "theorem permitted : True := by trivial\n"
            "end Auth.Service\n"
        )
        self.assertEqual(analysis["declaration_names"], ["Auth.Service.permitted"])

    def test_comments_do_not_trigger_controls(self) -> None:
        analysis = analyze_source("-- sorry\n/- axiom hidden : Prop -/\ntheorem clean : True := by trivial\n")
        self.assertEqual(analysis["forbidden_constructs"], [])

    def test_forbidden_constructs_are_detected(self) -> None:
        analysis = analyze_source("axiom invented : Prop\ntheorem bad : invented := by sorry\n")
        self.assertEqual(analysis["forbidden_constructs"], ["sorry", "axiom"])

    def test_expected_declarations_are_exactly_bound(self) -> None:
        analysis = analyze_source("namespace Auth\ntheorem allowed : True := by trivial\nend Auth\n")
        bound = bind_expected_declarations(
            analysis, ["Auth.allowed", "Auth.requiredButMissing"]
        )
        self.assertEqual(bound["expected_declarations"], ["Auth.allowed", "Auth.requiredButMissing"])
        self.assertEqual(bound["missing_expected_declarations"], ["Auth.requiredButMissing"])


if __name__ == "__main__":
    unittest.main()
