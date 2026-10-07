import importlib.util
from pathlib import Path
import tempfile
import unittest


SCRIPT = Path(__file__).with_name("issue-identifier-delivered-r1.py")
SPEC = importlib.util.spec_from_file_location("issue_identifier_delivered", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class IssueIdentifierDeliveredTests(unittest.TestCase):
    def test_extracts_code_identifiers_not_generic_prose(self):
        self.assertEqual(MODULE.issue_identifiers("Fix `validateUsernameUnique` in Python"), {"validateUsernameUnique"})
        self.assertEqual(MODULE.issue_identifiers("Fix general context behavior"), set())

    def test_adds_only_one_delivered_read_without_file_or_step_drift(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "src/a.py"
            source.parent.mkdir()
            source.write_text("\n".join(["def selected():", "  return validateUsernameUnique()"] +
                                        [f"line_{n} = {n}" for n in range(3, 11)] +
                                        ["def validateUsernameUnique():", "  return True"] +
                                        [f"line_{n} = {n}" for n in range(13, 31)]) + "\n")
            original = {"traj_data": {"pred_files": ["src/a.py"], "pred_spans": {"src/a.py": [{"start": 1, "end": 2}]},
                                      "pred_steps": [{"spans": {"src/a.py": [{"start": 9, "end": 20}]}}]}}
            candidate, additions, hashes = MODULE.select_identifier_read(original, "Fix `validateUsernameUnique`", root)
            self.assertEqual(len(additions), 1)
            self.assertEqual(additions[0]["span"], {"start": 9, "end": 20})
            self.assertEqual(candidate["traj_data"]["pred_files"], original["traj_data"]["pred_files"])
            self.assertEqual(candidate["traj_data"]["pred_steps"], original["traj_data"]["pred_steps"])
            self.assertEqual(original["traj_data"]["pred_spans"]["src/a.py"], [{"start": 1, "end": 2}])
            self.assertIn("src/a.py", hashes)

    def test_ignores_unread_source_even_if_identifier_occurs_there(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "a.py").write_text("\n".join(["def selected():", "  return validateUsernameUnique()"] +
                                                  ["line = 1"] * 25))
            original = {"traj_data": {"pred_files": ["a.py"], "pred_spans": {"a.py": [{"start": 1, "end": 2}]},
                                      "pred_steps": [{"spans": {"a.py": [{"start": 1, "end": 2}]}}]}}
            candidate, additions, _ = MODULE.select_identifier_read(original, "Fix `validateUsernameUnique`", root)
            self.assertFalse(additions)
            self.assertEqual(candidate, original)


if __name__ == "__main__":
    unittest.main()
