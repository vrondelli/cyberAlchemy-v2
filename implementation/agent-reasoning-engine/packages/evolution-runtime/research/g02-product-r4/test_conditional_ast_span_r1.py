import importlib.util
import tempfile
import unittest
from pathlib import Path


SOURCE = Path(__file__).with_name("conditional-ast-span-r1.py")
SPEC = importlib.util.spec_from_file_location("conditional_ast_span_r1", SOURCE)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class ConditionalAstSpanTest(unittest.TestCase):
    def test_issue_named_function_expands_but_unrelated_and_test_spans_do_not(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "pkg/tests").mkdir(parents=True)
            text = "def parse_record(value):\n    key = value.strip()\n    return key\n\ndef unrelated(value):\n    return value\n"
            (root / "pkg/code.py").write_text(text)
            (root / "pkg/tests/test_code.py").write_text("def parse_record(value):\n    return value\n")
            prediction = {"traj_data": {"pred_spans": {
                "pkg/code.py": [{"start": 2, "end": 2}, {"start": 6, "end": 6}],
                "pkg/tests/test_code.py": [{"start": 2, "end": 2}],
            }}}
            changes = MODULE.select_spans(prediction, "The record import misparses the publisher", root)
            self.assertEqual(prediction["traj_data"]["pred_spans"]["pkg/code.py"],
                             [{"start": 1, "end": 3}, {"start": 6, "end": 6}])
            self.assertEqual(prediction["traj_data"]["pred_spans"]["pkg/tests/test_code.py"],
                             [{"start": 2, "end": 2}])
            self.assertEqual(len(changes), 1)
            self.assertEqual(changes[0]["matched_words"], ["record"])


if __name__ == "__main__":
    unittest.main()
