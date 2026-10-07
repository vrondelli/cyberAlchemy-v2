import importlib.util
from pathlib import Path
import unittest


SCRIPT = Path(__file__).with_name("audit-cross-branch-gold-eligibility-r1.py")
SPEC = importlib.util.spec_from_file_location("cross_branch_gold", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class Loader:
    def get(self, identifier):
        if identifier == "error":
            raise RuntimeError("private gold path must not escape")
        if identifier == "yes":
            return type("Gold", (), {"files": lambda self: ["private/path.py"]})()
        return None


class GoldEligibilityTests(unittest.TestCase):
    def test_source_filter_excludes_manifested_and_incomplete_rows(self):
        fields = ("instance_id", "original_inst_id", "repo", "repo_url", "language",
                  "base_commit", "problem_statement", "source")
        def row(identifier, **changes):
            return {**dict(zip(fields, (identifier, identifier, "r", "u", "go", "a" * 40, "fix", "Pro"))), **changes}
        result = MODULE.eligible_source_rows([row("seen"), row("yes"), row("bad", base_commit="bad"),
                                               row("blank", problem_statement="")], fields, {"seen"})
        self.assertEqual(result, [{"instance_id": "yes", "repo": "r", "language": "go", "source": "Pro"}])

    def test_only_boolean_eligibility_and_error_bit_escape(self):
        rows, totals = MODULE.evaluate([{"instance_id": value, "repo": "r", "language": "go", "source": "Pro"}
                                        for value in ("yes", "no", "error")], Loader())
        self.assertEqual(totals, {"eligible": 1, "ineligible": 2, "loader_errors": 1})
        self.assertEqual([row["native_gold_files_present"] for row in rows], [True, False, False])
        self.assertNotIn("private/path.py", str(rows))
        self.assertNotIn("private gold path", str(rows))


if __name__ == "__main__":
    unittest.main()
