import importlib.util
import unittest
from pathlib import Path


SOURCE = Path(__file__).with_name("delivered-read-ceiling-r1.py")
SPEC = importlib.util.spec_from_file_location("delivered_read_ceiling_r1", SOURCE)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class DeliveredReadCeilingTest(unittest.TestCase):
    def test_uses_delivered_steps_and_preserves_original(self):
        original = {"instance_id": "task", "traj_data": {
            "pred_files": ["a.py"], "pred_spans": {"a.py": [{"start": 4, "end": 4}]},
            "pred_steps": [
                {"files": ["a.py"], "spans": {"a.py": [{"start": 4, "end": 4}]}},
                {"files": ["a.py"], "spans": {"a.py": [{"start": 1, "end": 10}]}},
                {"files": ["b.py"], "spans": {"b.py": [{"start": 2, "end": 5}]}},
            ]}}
        candidate = MODULE.all_delivered_prediction(original)
        self.assertEqual(candidate["traj_data"]["pred_files"], ["a.py", "b.py"])
        self.assertEqual(candidate["traj_data"]["pred_spans"]["a.py"],
                         [{"start": 4, "end": 4}, {"start": 1, "end": 10}])
        self.assertEqual(original["traj_data"]["pred_files"], ["a.py"])

    def test_rejects_unbound_selection(self):
        original = {"traj_data": {"pred_files": ["a.py"],
                    "pred_spans": {"a.py": [{"start": 4, "end": 4}]},
                    "pred_steps": [{"files": ["a.py"], "spans": {"a.py": [{"start": 1, "end": 2}]}}]}}
        with self.assertRaisesRegex(ValueError, "not a delivered step"):
            MODULE.all_delivered_prediction(original)


if __name__ == "__main__":
    unittest.main()
