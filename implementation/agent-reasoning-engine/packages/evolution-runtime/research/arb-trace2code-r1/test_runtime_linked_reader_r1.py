"""Open Questions: evidence/G01-RUNTIME-LINKED-READER-R1.json."""
import json
import runpy
import tempfile
import unittest
from pathlib import Path

M = runpy.run_path(str(Path(__file__).with_name('build-runtime-linked-reader-r1.py')))


class MatchedRuntimeTest(unittest.TestCase):
    def test_empty_source(self):
        self.assertEqual(M['excerpt']('', 'query', [], set()), [])

    def test_missing_coverage_not_negative(self):
        rows = M['excerpt']('alpha\nbeta', 'alpha', [], None)
        self.assertTrue(all(r['execution'] == 'unavailable' for r in rows))

    def test_stack_coordinate_preferred(self):
        rows = M['excerpt']('\n'.join(['noise']*20 + ['failure'] + ['rest']*10), 'noise', [21], set())
        self.assertEqual(rows[0]['line'], 18)
        self.assertIn(21, [r['line'] for r in rows])

    def test_invalid_stack_falls_back(self):
        self.assertEqual(M['excerpt']('alpha\nbeta', 'alpha', [0, 99], set()), M['excerpt']('alpha\nbeta', 'alpha', [], set()))

    def test_observation_boolean_not_count(self):
        text = '\n'.join(['same']*30)
        self.assertEqual(M['excerpt'](text, 'same', [], {15})[0]['line'], 6)
        self.assertEqual(M['excerpt'](text, 'same', [], set(range(15, 30)))[0]['line'], 6)

    def test_unicode_and_partial_line(self):
        rows = M['excerpt']('漢'*500, '', [], {1})
        self.assertEqual(len(rows[0]['text']), 450)
        self.assertTrue(rows[0]['partial_line'])
        self.assertEqual(rows[0]['execution'], 'observed')

    def test_whole_line_budget(self):
        rows = M['excerpt']('\n'.join(['a'*200]*10), '', [], set())
        self.assertEqual(len(rows), 2)
        self.assertFalse(any(r['partial_line'] for r in rows))

    def test_grouping_preserves_records_and_ids(self):
        records = [{'candidate_id': 1, 'path': 'a', 'stack_positions': [], 'file_execution': 'unavailable'},
                   {'candidate_id': 2, 'path': 'b', 'stack_positions': [2], 'file_execution': 'observed'},
                   {'candidate_id': 3, 'path': 'c', 'stack_positions': [1], 'file_execution': 'not-observed'}]
        self.assertEqual([r['candidate_id'] for r in M['ordered'](records, 'plain')], [1, 2, 3])
        self.assertEqual([r['candidate_id'] for r in M['ordered'](records, 'linked')], [2, 3, 1])
        self.assertEqual(sorted(M['ordered'](records, 'linked'), key=lambda r: r['candidate_id']), records)
        for arm in ['plain', 'linked']:
            prompt = M['render']('failure', records, arm, 'unavailable')
            rows = [json.loads(s) for s in prompt.splitlines() if s.startswith('{')]
            self.assertEqual(sorted(rows, key=lambda r: r['candidate_id']), records)

    def test_atomic_no_overwrite(self):
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / 'receipt.json'
            M['save'](path, b'complete')
            with self.assertRaises(FileExistsError):
                M['save'](path, b'replacement')
            self.assertEqual(path.read_bytes(), b'complete')
            self.assertEqual(len(list(Path(temporary).iterdir())), 1)

    def test_pinned_input_rejects_drift(self):
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / 'input.json'
            M['save'](path, b'{"case":16}')
            self.assertEqual(M['read_pinned'](path, M['sha'](b'{"case":16}')), {'case': 16})
            with self.assertRaises(ValueError):
                M['read_pinned'](path, '0'*64)

    def test_unknown_arm_rejected(self):
        with self.assertRaises(ValueError):
            M['ordered']([], 'gold')


if __name__ == '__main__':
    unittest.main()
