import importlib.util
import tempfile
import unittest
from pathlib import Path


SOURCE = Path(__file__).with_name("selective-delivered-r1.py")
SPEC = importlib.util.spec_from_file_location("selective_delivered_r1", SOURCE)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class SelectiveDeliveredTest(unittest.TestCase):
    def test_adds_only_bounded_enclosing_read_in_selected_file(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "a.py").write_text("def parse_record(value):\n    publisher = value.strip()\n    return publisher\n")
            (root / "b.py").write_text("def parse_record(value):\n    return value\n")
            original = {"traj_data": {"pred_files": ["a.py"],
                "pred_spans": {"a.py": [{"start": 2, "end": 2}]},
                "pred_steps": [
                    {"files": ["a.py"], "spans": {"a.py": [{"start": 2, "end": 2}]}},
                    {"files": ["a.py"], "spans": {"a.py": [{"start": 1, "end": 3}]}},
                    {"files": ["b.py"], "spans": {"b.py": [{"start": 1, "end": 2}]}},
                ]}}
            candidate, additions, hashes = MODULE.select_enclosing_reads(
                original, "Please parse the publisher record correctly", root)
            self.assertEqual(candidate["traj_data"]["pred_files"], ["a.py"])
            self.assertEqual(candidate["traj_data"]["pred_spans"]["a.py"],
                             [{"start": 2, "end": 2}, {"start": 1, "end": 3}])
            self.assertEqual(len(additions), 1)
            self.assertEqual(additions[0]["matched_issue_words"], ["parse", "publisher", "record"])
            self.assertEqual(set(hashes), {"a.py"})
            self.assertEqual(original["traj_data"]["pred_spans"]["a.py"], [{"start": 2, "end": 2}])

    def test_leaves_broad_selection_unchanged(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "a.py").write_text("def parse_record(value):\n    publisher = value.strip()\n    return publisher\n")
            original = {"traj_data": {"pred_files": ["a.py"],
                "pred_spans": {"a.py": [{"start": 1, "end": 3}]},
                "pred_steps": [{"files": ["a.py"], "spans": {"a.py": [{"start": 1, "end": 3}]}}]}}
            candidate, additions, _ = MODULE.select_enclosing_reads(original, "parse publisher record", root)
            self.assertEqual(candidate, original)
            self.assertEqual(additions, [])


if __name__ == "__main__":
    unittest.main()
