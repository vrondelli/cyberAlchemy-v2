import importlib.util
import json
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('content_review', Path(__file__).with_name('review-archive-content.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ContentReviewTest(unittest.TestCase):
    def test_reports_locations_without_copying_values(self):
        fake = 'ghp_' + 'x' * 36
        data = ('/home/example/private\nC:\\Users\\example\\data\n' + fake + '\n-----BEGIN PRIVATE KEY-----').encode()
        hits, mode = module.findings('fixture.txt', data)
        self.assertEqual(mode, 'utf8')
        self.assertEqual(hits[0], {'kind': 'workstation-path', 'lines': [1, 2]})
        self.assertEqual({h['kind'] for h in hits}, set(module.PATTERNS))
        self.assertNotIn(fake, json.dumps(hits))
        self.assertNotIn('example', json.dumps(hits))

    def test_non_utf8_is_explicitly_unscanned(self):
        self.assertEqual(module.findings('binary', b'\xff'), ([], 'non-utf8'))


if __name__ == '__main__':
    unittest.main()
