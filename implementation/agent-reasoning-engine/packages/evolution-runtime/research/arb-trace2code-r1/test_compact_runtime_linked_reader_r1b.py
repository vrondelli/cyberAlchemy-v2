"""Synthetic only. Open Questions: evidence/G01-RUNTIME-LINKED-READER-R1.json."""
import json
import runpy
import unittest
from pathlib import Path
M = runpy.run_path(str(Path(__file__).with_name('compact-runtime-linked-reader-r1b.py')))


class CompactTest(unittest.TestCase):
    def record(self):
        return {'candidate_id': 2, 'path': 'p/$Type.java', 'source_sha256': 'provenance', 'stack_positions': [1],
                'file_execution': 'unavailable', 'scope': 'partial',
                'lines': [{'line': 10, 'text': '漢 "[1]" {untrusted}', 'partial_line': True, 'execution': 'unavailable'}]}

    def test_tuple_preserves_delivered_fields(self):
        self.assertEqual(M['compact'](self.record()), [2, 'p/$Type.java', [1], 'unavailable', [[10, '漢 "[1]" {untrusted}', True, 'unavailable']]])

    def test_prompt_prefix_and_group_order(self):
        prompt = 'Failure:\nsame input\nRuntime availability: unavailable\nCandidate records:\nDerived evidence group: stack-only\n'+json.dumps(self.record())
        result = M['render'](prompt)
        prefix, rows = result.split('\nCandidate tuples:\n')
        self.assertTrue(prefix.startswith('Failure:\nsame input\nRuntime availability: unavailable\n'))
        self.assertEqual(rows.splitlines()[0], 'Derived evidence group: stack-only')
        self.assertEqual(json.loads(rows.splitlines()[1]), M['compact'](self.record()))

    def test_untrusted_separator_in_failure_not_consumed(self):
        prompt = 'Failure:\nCandidate records:\nuntrusted\nCandidate records:\n'+json.dumps(self.record())
        self.assertTrue(M['render'](prompt).startswith('Failure:\nCandidate records:\nuntrusted\n'))


if __name__ == '__main__':
    unittest.main()
