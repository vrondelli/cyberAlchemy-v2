import importlib.util
import json
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("probe-indirect-python-calls-r1.py")
SPEC = importlib.util.spec_from_file_location("g02_indirect_calls", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class IndirectCallProbeTest(unittest.TestCase):
    def test_registry_resolver_to_indirect_call(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / "source.py").write_text(
                "def parse_map(value):\n    return value\n"
                "VALIDATORS = {'map': parse_map}\n"
                "def get_validator(kind):\n    return VALIDATORS.get(kind)\n"
                "def validate(kind, value):\n"
                "    checker = get_validator(kind)\n"
                "    return checker(value)\n")
            task = root / "task.json"
            task.write_text(json.dumps({"problem_statement": "Update `parse_map` without evaluation."}))
            prediction = root / "prediction.json"
            prediction.write_text(json.dumps({"traj_data": {"pred_files": ["source.py"]}}))
            result = MODULE.probe(task, prediction, root)
            self.assertEqual(len(result["findings"]), 1)
            self.assertEqual(result["findings"][0]["call_line"], 8)
            self.assertEqual(result["findings"][0]["issue_names"], ["parse_map"])

    def test_unmentioned_registry_does_not_trigger(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / "source.py").write_text(
                "def parse_map(value):\n    return value\n"
                "VALIDATORS = {'map': parse_map}\n"
                "def get_validator(kind):\n    return VALIDATORS.get(kind)\n"
                "def validate(kind, value):\n"
                "    checker = get_validator(kind)\n"
                "    return checker(value)\n")
            task = root / "task.json"
            task.write_text(json.dumps({"problem_statement": "Update `other_parser`."}))
            prediction = root / "prediction.json"
            prediction.write_text(json.dumps({"traj_data": {"pred_files": ["source.py"]}}))
            self.assertEqual(MODULE.probe(task, prediction, root)["findings"], [])


if __name__ == "__main__":
    unittest.main()
