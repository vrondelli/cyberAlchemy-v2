"""Rank contract regressions; Open Questions: G03-INDEX-RETRIEVAL-R88.json."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('r88', Path(__file__).with_name('screen-index-retrieval-r88.py'))
r88 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(r88)


class Retrieval(unittest.TestCase):
    def test_query_excludes_alternatives(self):
        self.assertEqual(r88.query_text('Which action?\nA. SECRET\nB. OTHER'), 'Which action?')

    def test_response_direction_excluded(self):
        self.assertEqual(r88.query_text('Biography update. Your final answer SECRET'), 'Biography update. ')

    def test_metadata_only_and_missing_note_retained(self):
        raw = {'a': 'orders', 'b': 'biography'}
        arms = r88.retrieve('biography', raw, {'a': 'orders'})
        self.assertEqual(arms['plain_metadata'][0], 'b')
        self.assertEqual(set(arms['optional_note_rrf']), set(raw))

    def test_equal_width_deterministic(self):
        raw = {str(i): 'orders' for i in range(20)}
        arms = r88.retrieve('orders', raw, {})
        self.assertEqual(len(arms['plain_metadata']), 8)
        self.assertEqual(arms['plain_metadata'], arms['optional_note_rrf'])
        self.assertEqual(arms, r88.retrieve('orders', raw, {}))


if __name__ == '__main__':
    unittest.main()
