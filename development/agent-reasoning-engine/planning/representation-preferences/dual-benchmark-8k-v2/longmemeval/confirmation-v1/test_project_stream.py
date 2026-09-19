"""Synthetic-only tests: no source download, credentials or model calls."""
import hashlib
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from project_stream import QUESTION_IDS, ProjectionError, project_stream


def fixture(qid):
    # Labels deliberately precede the late selector, and occur in nested turns.
    return {'answer': 'GOLD_SECRET_SENTINEL', 'answer_session_ids': ['ANSWER_ID_SENTINEL'],
            'haystack_session_ids': ['answer_linked_session'],
            'unknown': {'array': [None, True, False, -2.5e12, {'labels': 'HIDDEN'}]},
            'question_type': 'multi-session', 'question': 'Which event? café 🐟 "quoted"\nnext',
            'question_date': '2024/01/03 (Wed) 12:00',
            'haystack_dates': ['2024/01/01 (Mon) 12:00', '2024/01/02 (Tue) 12:00'],
            'haystack_sessions': [[{'has_answer': True, 'role': 'user', 'content': 'café 🐟 \\ hi', 'metadata': {'gold': 'HIDDEN'}}],
                                 [{'content': 'Reply\tline', 'role': 'assistant', 'has_answer': False}]],
            'question_id': qid}


class Chunked(io.BytesIO):
    def __init__(self, raw, chunk): super().__init__(raw); self.chunk = chunk
    def read(self, count=-1): return super().read(min(count, self.chunk))


class ProjectionTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.out = Path(self.tmp.name) / 'projected'
        self.rows = [fixture(q) for q in QUESTION_IDS] + [fixture('unselected')]

    def project(self, rows=None, raw=None, **options):
        raw = raw if raw is not None else json.dumps(rows or self.rows, ensure_ascii=False).encode()
        base = dict(expected_sha256=hashlib.sha256(raw).hexdigest(), expected_bytes=len(raw),
                    expected_records=len(rows or self.rows), disk_floor=0)
        base.update(options)
        return project_stream(Chunked(raw, 3), self.out, **base)

    def assert_clean(self):
        self.assertFalse(self.out.exists())
        self.assertEqual(list(Path(self.tmp.name).glob('.unverified-source-*')), [])

    def test_late_id_nested_whitelist_and_all_stream_verified(self):
        receipt = self.project()
        self.assertEqual(receipt['source_records'], 5)
        self.assertEqual(len(receipt['selected']), 4)
        for row in receipt['selected']:
            raw = (self.out / row['path']).read_bytes()
            self.assertEqual(hashlib.sha256(raw).hexdigest(), row['sha256'])
            value = json.loads(raw)
            self.assertEqual(set(value), {'question_id', 'question_type', 'question', 'question_date', 'haystack_dates', 'haystack_sessions'})
            self.assertEqual(value['question'], self.rows[0]['question'])
            for session in value['haystack_sessions']:
                for turn in session: self.assertEqual(set(turn), {'role', 'content'})
            for forbidden in ['GOLD_SECRET_SENTINEL', 'ANSWER_ID_SENTINEL', 'has_answer', 'answer_linked_session', 'HIDDEN']:
                self.assertNotIn(forbidden, raw.decode())
        self.assertFalse(receipt['evaluation_references_emitted'])

    def test_every_utf8_boundary_and_json_escapes(self):
        raw = json.dumps(self.rows, ensure_ascii=False).encode()
        for chunk in [1, 2, 7, 65536]:
            with self.subTest(chunk=chunk):
                target = Path(self.tmp.name) / ('chunk-' + str(chunk))
                project_stream(Chunked(raw, chunk), target, expected_sha256=hashlib.sha256(raw).hexdigest(), expected_bytes=len(raw), expected_records=5, disk_floor=0)
                value = json.loads((target / ('source-' + QUESTION_IDS[0] + '.json')).read_text())
                self.assertEqual(value['haystack_sessions'][0][0]['content'], self.rows[0]['haystack_sessions'][0][0]['content'])
        # Force escaped Unicode and surrogate-pair encodings across every byte.
        self.project(raw=json.dumps(self.rows, ensure_ascii=True).encode())

    def test_missing_id(self):
        rows = self.rows[:-2] + [self.rows[-1]]
        with self.assertRaisesRegex(ProjectionError, 'missing selected'): self.project(rows=rows)
        self.assert_clean()

    def test_duplicate_ids(self):
        rows = self.rows + [fixture(QUESTION_IDS[0])]
        with self.assertRaisesRegex(ProjectionError, 'duplicate question ID'): self.project(rows=rows)
        self.assert_clean()

    def test_hash_mismatch_in_unselected_tail_fails_closed(self):
        original = json.dumps(self.rows, ensure_ascii=False).encode()
        self.rows[-1]['answer'] = 'different unselected label'
        with self.assertRaisesRegex(ProjectionError, 'SHA mismatch'):
            self.project(expected_sha256=hashlib.sha256(original).hexdigest())
        self.assert_clean()

    def test_byte_count_and_output_bounds(self):
        raw = json.dumps(self.rows, ensure_ascii=False).encode()
        for options, text in [({'expected_bytes': len(raw)-1}, 'byte ceiling'), ({'expected_bytes': len(raw)+1}, 'byte count'),
                              ({'row_limit': 80}, 'output ceiling'), ({'output_limit': 600}, 'output ceiling')]:
            with self.subTest(options=options), self.assertRaisesRegex(ProjectionError, text): self.project(raw=raw, **options)
            self.assert_clean()

    def test_source_shape_and_duplicate_keys(self):
        for change in ['dates', 'role', 'malformed-date', 'invalid-date', 'typed-date']:
            rows = [fixture(q) for q in QUESTION_IDS]
            if change == 'dates': rows[0]['haystack_dates'].pop()
            elif change == 'role': rows[0]['haystack_sessions'][0][0]['role'] = 'system'
            elif change == 'malformed-date': rows[0]['haystack_dates'][0] = 'yesterday'
            elif change == 'invalid-date': rows[0]['haystack_dates'][0] = '2024/02/31 (Mon) 12:00'
            else: rows[0]['haystack_dates'][0] = 123
            with self.subTest(change=change), self.assertRaises(ProjectionError): self.project(rows=rows)
            self.assert_clean()
        raw = json.dumps(self.rows).replace('"question_type": "multi-session"', '"question_type":"multi-session","question_type":"changed"', 1).encode()
        with self.assertRaisesRegex(ProjectionError, 'duplicate record key'): self.project(raw=raw)
        self.assert_clean()

    def test_unsorted_dates_preserve_source_session_order(self):
        self.rows[0]['haystack_dates'].reverse()
        receipt = self.project()
        value = json.loads((self.out / ('source-' + QUESTION_IDS[0] + '.json')).read_text())
        self.assertEqual(value['haystack_dates'], self.rows[0]['haystack_dates'])
        self.assertEqual(value['haystack_sessions'], [[{'role': turn['role'], 'content': turn['content']} for turn in session] for session in self.rows[0]['haystack_sessions']])
        self.assertFalse(receipt['selected'][0]['history_dates_nondecreasing'])
        self.assertTrue(receipt['selected'][1]['history_dates_nondecreasing'])

    def test_same_day_time_disorder_and_duplicate_dates_are_preserved(self):
        for index, dates in enumerate([
                ['2024/01/01 (Mon) 13:00', '2024/01/01 (Mon) 12:00'],
                ['2024/01/01 (Mon) 12:00', '2024/01/01 (Mon) 12:00']]):
            self.out = Path(self.tmp.name) / ('order-' + str(index))
            self.rows[0]['haystack_dates'] = dates
            receipt = self.project()
            value = json.loads((self.out / ('source-' + QUESTION_IDS[0] + '.json')).read_text())
            self.assertEqual(value['haystack_dates'], dates)
            self.assertEqual(receipt['selected'][0]['history_dates_nondecreasing'], index == 1)

    def test_invalid_utf8_and_trailing_content(self):
        raw = json.dumps(self.rows).encode()
        for invalid in [raw + b'x', raw.replace(b'Which event?', b'\xff', 1)]:
            with self.subTest(invalid=invalid[-1:]), self.assertRaises((ProjectionError, UnicodeDecodeError)):
                self.project(raw=invalid)
            self.assert_clean()

    def test_cancelled_stream_and_disk_write_failure_cleanup(self):
        raw = json.dumps(self.rows).encode()
        class Cancelled(Chunked):
            def __init__(self): super().__init__(raw, 3)
            def read(self, count):
                if self.tell() > 30: raise OSError('cancelled stream')
                return super().read(count)
        with self.assertRaisesRegex(OSError, 'cancelled'):
            project_stream(Cancelled(), self.out, disk_floor=0)
        self.assert_clean()
        with patch('project_stream.os.fsync', side_effect=OSError('disk failure')):
            with self.assertRaisesRegex(OSError, 'disk failure'): self.project()
        self.assert_clean()

    def test_existing_destination_never_overwritten(self):
        self.project()
        previous = (self.out / 'acquisition.json').read_bytes()
        with self.assertRaisesRegex(ProjectionError, 'already exists'): self.project()
        self.assertEqual((self.out / 'acquisition.json').read_bytes(), previous)


if __name__ == '__main__': unittest.main()
