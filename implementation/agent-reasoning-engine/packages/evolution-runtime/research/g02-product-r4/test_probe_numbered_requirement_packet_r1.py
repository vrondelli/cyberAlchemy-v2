import importlib.util
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("probe-numbered-requirement-packet-r1.py")
SPEC = importlib.util.spec_from_file_location("g02_numbered_packet", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def event_fixture():
    return [
        {"kind": "ranked-source-primer", "primer": {"hints": [
            {"path": "lib/app/core.py", "start_line": 1, "end_line": 20, "matched_terms": ["core", "setup"]},
            {"path": "lib/app/misc.py", "start_line": 3, "end_line": 25, "matched_terms": ["error", "message", "warn"]},
            {"path": "lib/app/cli/help.py", "start_line": 7, "end_line": 31, "matched_terms": ["cli", "help", "error"]},
        ]}},
        {"kind": "initial-source-packet", "receipt": [{"path": "lib/app/core.py"}]},
    ]


class NumberedPacketProbeTest(unittest.TestCase):
    def test_source_path_and_two_terms_select_cli(self):
        issue = {"problem_statement": "## Steps to Reproduce\n1. Set up the core.\n2. Cause a CLI error without help.\n3. Retry.\n\n## Expected Behavior\nHelp is displayed."}
        result = MODULE.select(issue, event_fixture())
        self.assertEqual(result["steps"], 3)
        self.assertEqual([item["path"] for item in result["proposals"]], ["lib/app/cli/help.py"])
        self.assertEqual(result["proposals"][0]["step"], 2)

    def test_existing_packet_suppresses_duplicate(self):
        issue = {"problem_statement": "## Steps to Reproduce\n1. Set up the core.\n2. Cause a CLI error without help.\n3. Retry.\n"}
        events = event_fixture()
        events[1]["receipt"].append({"path": "lib/app/cli/help.py"})
        self.assertEqual(MODULE.select(issue, events)["proposals"], [])

    def test_unstructured_issue_abstains(self):
        issue = {"problem_statement": "CLI help is missing."}
        self.assertEqual(MODULE.select(issue, event_fixture())["proposals"], [])


if __name__ == "__main__":
    unittest.main()
