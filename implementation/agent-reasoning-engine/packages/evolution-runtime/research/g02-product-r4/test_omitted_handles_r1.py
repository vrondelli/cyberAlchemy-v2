import importlib.util
import unittest
from pathlib import Path


SOURCE = Path(__file__).with_name("omitted-handles-r1.py")
SPEC = importlib.util.spec_from_file_location("omitted_handles_r1", SOURCE)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class OmittedHandlesTest(unittest.TestCase):
    def test_adds_only_eligible_unshown_base_fragments(self):
        original = {"traj_data": {"pred_files": ["a.py"],
            "pred_spans": {"a.py": [{"start": 1, "end": 2}]}, "pred_steps": []}}
        packet = {"private": {"eligible_read_ids": ["shown", "hidden"],
                              "bindings": [{"read_id": "shown"}]}}
        projection = {"events": [{"id": "hidden", "path": "b.py", "delivered": True}],
            "projections": [{"read_id": "hidden", "event_ids": ["hidden"],
                             "unmapped_current_lines": [],
                             "fragments": [{"start": 3, "end": 7}]}]}
        candidate, omitted, additions, added_files = MODULE.selected_plus_omitted(
            original, packet, projection)
        self.assertEqual(omitted, 1)
        self.assertEqual(additions[0]["span"], {"start": 3, "end": 7})
        self.assertEqual(added_files, 1)
        self.assertEqual(candidate["traj_data"]["pred_files"], ["a.py", "b.py"])
        self.assertEqual(original["traj_data"]["pred_files"], ["a.py"])

    def test_rejects_unprojectable_omitted_read(self):
        original = {"traj_data": {"pred_files": [], "pred_spans": {}, "pred_steps": []}}
        packet = {"private": {"eligible_read_ids": ["hidden"], "bindings": []}}
        projection = {"events": [], "projections": []}
        with self.assertRaisesRegex(ValueError, "not projectable"):
            MODULE.selected_plus_omitted(original, packet, projection)


if __name__ == "__main__":
    unittest.main()
