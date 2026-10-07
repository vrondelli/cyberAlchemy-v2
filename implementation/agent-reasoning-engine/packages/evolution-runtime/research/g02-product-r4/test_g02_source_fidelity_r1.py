import runpy
import unittest
from pathlib import Path

helper = runpy.run_path(str(Path(__file__).with_name('audit-g02-r11-source-fidelity-r1.py')))
inspect_span, normalize = helper['inspect_span'], helper['normalize']


class FidelityTest(unittest.TestCase):
    def check(self, text, start, end, content):
        return inspect_span(text, {'start_line': start, 'end_line': end, 'content': content})

    def test_inclusive_bounds(self):
        r = self.check('one\ntwo\nthree\n', 2, 3, 'two\nthree')
        self.assertTrue(r['bounds_valid']); self.assertTrue(r['interval_content_equal'])

    def test_no_clamp_or_boolean(self):
        for start, end in [(0, 1), (1, 4), (2, 1), (True, 2)]:
            self.assertFalse(self.check('one\ntwo\nthree', start, end, 'one')['bounds_valid'])

    def test_elsewhere_does_not_repair(self):
        r = self.check('one\ntwo\nthree', 1, 1, 'three')
        self.assertFalse(r['interval_content_equal']); self.assertTrue(r['content_occurs_elsewhere'])

    def test_unknown_content(self):
        self.assertIsNone(self.check('one', 1, 1, '')['interval_content_equal'])

    def test_line_endings_and_trailing_space(self):
        self.assertTrue(self.check('one\r\ntwo', 1, 2, 'one\ntwo')['interval_content_equal'])
        r = self.check('one  \ntwo', 1, 2, 'one\ntwo')
        self.assertFalse(r['interval_content_equal']); self.assertTrue(r['trailing_whitespace_equal'])

    def test_paths(self):
        self.assertEqual(normalize('/workspace/repo/src/a.py'), 'src/a.py')
        for path in ['../secret', '', './a/../../b']:
            with self.assertRaises(ValueError):
                normalize(path)


if __name__ == '__main__':
    unittest.main()
