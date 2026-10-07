import runpy
import unittest
from pathlib import Path

excerpt = runpy.run_path(str(Path(__file__).with_name('build-canonical-entity-reader-r1.py')))['excerpt']


class ExcerptTest(unittest.TestCase):
    def test_empty(self):
        self.assertEqual(excerpt('', 'abc'), (1, ''))

    def test_earliest_tie(self):
        self.assertEqual(excerpt('\n'.join(['alpha']*40), 'alpha')[0], 1)

    def test_cap_and_unicode(self):
        line, value = excerpt('alpha ' + '漢'*600, 'alpha')
        self.assertEqual(line, 1)
        self.assertEqual(len(value), 450)

    def test_query_window(self):
        line, value = excerpt('\n'.join(['none']*30 + ['target']*20), 'target')
        # Distinct query overlap ties once target appears; earliest tie wins.
        self.assertEqual(line, 21)
        self.assertIn('target', value)


if __name__ == '__main__':
    unittest.main()
