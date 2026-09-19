"""Synthetic failure receipts only: no network, providers, or real extraction."""
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import test_acquire_source as helpers
from acquire_source import acquire, AcquisitionError
from project_stream import ProjectionError, QUESTION_IDS, projection_failure_diagnostic
from test_project_stream import fixture

class FailureDiagnosticsTests(unittest.TestCase):
    def run_failure(self, rows, injected=None):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); notice = root/'notice'; notice.write_bytes(b'MIT synthetic')
            raw = json.dumps(rows).encode(); clock = helpers.Clock()
            options = dict(license_path=notice, storage_guard=lambda _: {'status':'admitted'},
                transport=lambda *args: helpers.Response(raw), clock=clock.now, sleep=clock.sleep,
                expected_sha256=hashlib.sha256(raw).hexdigest(), expected_bytes=len(raw),
                expected_records=4, expected_license_sha256=hashlib.sha256(notice.read_bytes()).hexdigest())
            def run():
                with self.assertRaises(AcquisitionError) as caught: acquire(root/'out', **options)
                return caught.exception
            if injected is None: error = run()
            else:
                with patch('acquire_source.project_stream', side_effect=injected): error = run()
            text = (root/'out.attempt.json').read_text()
            self.assertFalse((root/'out').exists())
            self.assertFalse(list(root.glob('.source-acquisition-*')))
            self.assertFalse(list(root.glob('.unverified-source-*')))
            self.assertEqual(json.loads(text), error.receipt)
            return json.loads(text), text, len(raw)

    def test_literal_known_reason_with_read_ahead_and_record_index(self):
        rows = [fixture(q) for q in QUESTION_IDS]
        rows[0]['haystack_sessions'][0][0]['role'] = 'invalid'
        receipt, text, size = self.run_failure(rows)
        diagnostic = receipt['projection_failure']
        self.assertEqual(diagnostic['reason'], 'unsupported role')
        self.assertEqual(diagnostic['code'], 'projection.unsupported-role')
        self.assertEqual(diagnostic['record_index'], 1)
        self.assertEqual(diagnostic['source_bytes_read'], size)
        self.assertIn('read-ahead', diagnostic['byte_counter_scope'])
        for secret in ['PRIVATE_LABEL', 'secret.example', 'GOLD_SECRET', 'DO_NOT_LOG']:
            self.assertNotIn(secret, text)

    def test_unknown_projection_error_text_is_not_persisted(self):
        error = ProjectionError('https://secret.example/?X-Amz-Signature=PRIVATE_LABEL')
        error.record_index = True; error.source_bytes_read = 'PRIVATE_LABEL'
        receipt, text, _ = self.run_failure([fixture(q) for q in QUESTION_IDS], error)
        self.assertEqual(receipt['projection_failure'], {'code':'projection.unspecified-failure'})
        self.assertNotIn('PRIVATE_LABEL', text); self.assertNotIn('secret.example', text)

    def test_untyped_exception_text_is_not_persisted(self):
        receipt, text, _ = self.run_failure([fixture(q) for q in QUESTION_IDS],
            ValueError('https://secret.example/?X-Amz-Signature=PRIVATE_LABEL'))
        self.assertNotIn('projection_failure', receipt)
        self.assertNotIn('PRIVATE_LABEL', text); self.assertNotIn('secret.example', text)

    def test_metadata_is_bounded_and_never_formats_unknown_arguments(self):
        class Secret:
            def __str__(self): raise AssertionError('must not stringify arbitrary content')
            def __repr__(self): raise AssertionError('must not format arbitrary content')
        error = ProjectionError(Secret()); error.record_index = -1; error.source_bytes_read = 10**30
        self.assertEqual(projection_failure_diagnostic(error), {'code':'projection.unspecified-failure'})
        self.assertIsNone(projection_failure_diagnostic(ValueError('secret')))

if __name__ == '__main__': unittest.main()
