import importlib.util
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("call-edge-delivered-r1.py")
SPEC = importlib.util.spec_from_file_location("call_edge_delivered_r1", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class CallEdgeDeliveredTest(unittest.TestCase):
    def test_adds_only_delivered_same_file_callee(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source = root / "repo.go"
            source.write_text("package demo\n\nfunc Put() error {\n return nil\n}\n\n"
                              "func Update() error {\n return Put()\n}\n")
            original = {"traj_data": {"pred_files": ["repo.go"],
                                      "pred_spans": {"repo.go": [{"start": 7, "end": 9}]},
                                      "pred_steps": [{"spans": {"repo.go": [{"start": 1, "end": 5}]}},
                                                     {"spans": {"repo.go": [{"start": 7, "end": 9}]}}]}}
            candidate, additions, hashes = MODULE.select_call_edge(original, root)
            self.assertEqual(candidate["traj_data"]["pred_files"], ["repo.go"])
            self.assertEqual(candidate["traj_data"]["pred_spans"]["repo.go"],
                             [{"start": 7, "end": 9}, {"start": 1, "end": 5}])
            self.assertEqual(additions[0]["called_definitions"], ["Put"])
            self.assertIn("repo.go", hashes)
            self.assertEqual(original["traj_data"]["pred_spans"]["repo.go"], [{"start": 7, "end": 9}])

    def test_does_not_invent_an_undelivered_callee(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "repo.go").write_text("package demo\nfunc Put() error { return nil }\n"
                                          "func Update() error { return Put() }\n")
            original = {"traj_data": {"pred_files": ["repo.go"],
                                      "pred_spans": {"repo.go": [{"start": 3, "end": 3}]},
                                      "pred_steps": [{"spans": {"repo.go": [{"start": 3, "end": 3}]}}]}}
            candidate, additions, _ = MODULE.select_call_edge(original, root)
            self.assertEqual(additions, [])
            self.assertEqual(candidate, original)


if __name__ == "__main__":
    unittest.main()
