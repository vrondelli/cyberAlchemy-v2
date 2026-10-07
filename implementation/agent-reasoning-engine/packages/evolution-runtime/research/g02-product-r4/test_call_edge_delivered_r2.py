import importlib.util
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("call-edge-delivered-r2.py")
SPEC = importlib.util.spec_from_file_location("call_edge_delivered_r2", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def prediction(path, first, last, target_start, target_end):
    return {"traj_data": {"pred_files": [path],
                          "pred_spans": {path: [{"start": first, "end": last}]},
                          "pred_steps": [{"spans": {path: [{"start": target_start, "end": target_end}]}},
                                         {"spans": {path: [{"start": first, "end": last}]}}]}}


class CrossLanguageCallEdgeTest(unittest.TestCase):
    def assert_adds(self, suffix, text, selected, target, name):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            path = "example" + suffix
            (root / path).write_text(text)
            original = prediction(path, *selected, *target)
            candidate, additions, _ = MODULE.select_call_edge(original, root)
            self.assertEqual(candidate["traj_data"]["pred_files"], [path])
            self.assertEqual(candidate["traj_data"]["pred_spans"][path][-1],
                             {"start": target[0], "end": target[1]})
            self.assertEqual(additions[0]["called_definitions"], [name])
            self.assertEqual(original["traj_data"]["pred_spans"][path],
                             [{"start": selected[0], "end": selected[1]}])

    def test_python_method_call(self):
        self.assert_adds(".py", "class User:\n    def verify(self):\n        return True\n\n"
                         "    def update(self):\n        return self.verify()\n", (5, 6), (1, 3), "verify")

    def test_typescript_method_call(self):
        self.assert_adds(".ts", "class User {\n  verify() {\n    return true;\n  }\n"
                         "  update() {\n    return this.verify();\n  }\n}\n", (5, 7), (1, 4), "verify")

    def test_go_function_call(self):
        self.assert_adds(".go", "package demo\nfunc Verify() bool {\n return true\n}\n"
                         "func Update() bool {\n return Verify()\n}\n", (5, 7), (1, 4), "Verify")

    def test_undelivered_definition_is_not_added(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "example.py").write_text("def verify(): return True\ndef update(): return verify()\n")
            original = {"traj_data": {"pred_files": ["example.py"],
                                      "pred_spans": {"example.py": [{"start": 2, "end": 2}]},
                                      "pred_steps": [{"spans": {"example.py": [{"start": 2, "end": 2}]}}]}}
            candidate, additions, _ = MODULE.select_call_edge(original, root)
            self.assertEqual(additions, [])
            self.assertEqual(candidate, original)


if __name__ == "__main__":
    unittest.main()
