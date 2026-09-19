"""A Cargo failure alone must never satisfy a behavioral mutation obligation."""

import unittest

from mutations import COPY_IGNORE, IGNORED_COPY_PARTS, adjudicate


class MutationEvidenceTests(unittest.TestCase):
    case = {"test": "declared_oracle", "marker": "DECLARED_CAUSE"}
    build = {"exit_code": 0}
    killed = {
        "exit_code": 101,
        "output": "test declared_oracle ... FAILED\nDECLARED_CAUSE\n0 passed; 1 failed; 0 ignored",
    }

    def test_copy_excludes_ephemeral_runtime_state(self):
        names = ["authorization-service", ".runtime", "target", "__pycache__"]
        self.assertEqual(IGNORED_COPY_PARTS, {".runtime", "target", "__pycache__"})
        self.assertEqual(
            set(COPY_IGNORE("/tmp/auth-implementation", names)),
            {".runtime", "target", "__pycache__"},
        )

    def test_expected_assertion_requires_a_successful_build_and_changed_bytes(self):
        self.assertEqual(adjudicate(self.case, self.build, self.killed, True), "killed-for-declared-cause")
        self.assertEqual(adjudicate(self.case, {"exit_code": 101}, self.killed, True), "not_evaluable")
        self.assertEqual(adjudicate(self.case, self.build, self.killed, False), "not_evaluable")

    def test_crash_wrong_cause_wrong_test_and_empty_denominator_do_not_pass(self):
        for result in (
            {"exit_code": -11, "output": self.killed["output"]},
            {"exit_code": 101, "output": self.killed["output"].replace("DECLARED_CAUSE", "OTHER_CAUSE")},
            {"exit_code": 101, "output": self.killed["output"].replace("declared_oracle", "different_test")},
            {"exit_code": 0, "output": "0 passed; 0 failed; 0 ignored"},
        ):
            with self.subTest(result=result):
                self.assertEqual(adjudicate(self.case, self.build, result, True), "not_evaluable")

    def test_surviving_mutant_is_preserved(self):
        self.assertEqual(adjudicate(self.case, self.build, {
            "exit_code": 0, "output": "1 passed; 0 failed; 0 ignored"
        }, True), "survived")


if __name__ == "__main__":
    unittest.main()
