"""Independent synthetic parser regressions; no real data, network, labels or providers.
Open questions/readiness: STREAMING-REVIEW.md. Failures intentionally expose parser gaps.
"""
import hashlib
import io
import json
from pathlib import Path
import tempfile
import unittest
from project_stream import QUESTION_IDS, ProjectionError, project_stream


def synthetic_rows():
    return [{'question_id': qid, 'question_type': 'synthetic', 'question': 'Public fixture question',
             'question_date': '2024/01/03 (Wed) 12:00',
             'haystack_dates': ['2024/01/01 (Mon) 12:00'],
             'haystack_sessions': [[{'role': 'user', 'content': 'SOURCE_PLACEHOLDER'}]],
             'ignored': {'nested': 'synthetic'}} for qid in QUESTION_IDS]


class IndependentParserRegression(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.out = Path(self.temp.name) / 'source'

    def project(self, raw):
        return project_stream(io.BytesIO(raw), self.out,
            expected_sha256=hashlib.sha256(raw).hexdigest(), expected_bytes=len(raw),
            expected_records=4, disk_floor=0)

    def clean(self):
        self.assertFalse(self.out.exists(), 'invalid input must not publish')
        self.assertEqual(list(Path(self.temp.name).glob('.unverified-source-*')), [])

    def test_duplicate_ignored_nested_object_rejected(self):
        raw = json.dumps(synthetic_rows()).replace('"nested": "synthetic"',
            '"nested":"one","nested":"two"', 1).encode()
        with self.assertRaises(ProjectionError):
            self.project(raw)
        self.clean()

    def test_escaped_equivalent_duplicate_ignored_key_rejected(self):
        raw = json.dumps(synthetic_rows()).replace('"nested": "synthetic"',
            '"nested":"one","\\u006eested":"two"', 1).encode()
        with self.assertRaises(ProjectionError):
            self.project(raw)
        self.clean()

    def test_unpaired_source_surrogate_rejected(self):
        # JSON syntax permits this escape spelling, but it is not scalar Unicode
        # source text; publishing it violates downstream UTF-8 fidelity.
        for invalid in ['\\ud800', '\\udc00', '\\ud800\\ud800', '\\ud800text']:
            with self.subTest(invalid=invalid):
                raw = json.dumps(synthetic_rows()).replace('SOURCE_PLACEHOLDER', invalid, 1).encode()
                with self.assertRaises(ProjectionError):
                    self.project(raw)
                self.clean()

    def test_valid_surrogate_pair_is_preserved(self):
        raw = json.dumps(synthetic_rows()).replace('SOURCE_PLACEHOLDER', '\\ud83d\\udc1f', 1).encode()
        self.project(raw)
        value = json.loads((self.out / ('source-' + QUESTION_IDS[0] + '.json')).read_text())
        self.assertEqual(value['haystack_sessions'][0][0]['content'], '🐟')


if __name__ == '__main__':
    unittest.main()
