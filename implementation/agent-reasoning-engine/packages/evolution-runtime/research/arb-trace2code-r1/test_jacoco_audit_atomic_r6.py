"""Open Questions: evidence/G01-JACOCO-PROJECT-CAPACITY-R6.json."""
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('audit_r6', Path(__file__).with_name('audit-jacoco-project-capacity-r6.py'))
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)

class AtomicAuditTest(unittest.TestCase):
    def test_private_complete_and_no_replay(self):
        with tempfile.TemporaryDirectory(prefix='are-audit-r6-') as directory:
            path = Path(directory) / 'RESULT.json'
            data = b'{"status":"synthetic"}\n'
            audit.save_exclusive(path, data)
            self.assertEqual(json.loads(path.read_bytes()), {'status': 'synthetic'})
            self.assertEqual(path.stat().st_mode & 0o777, 0o600)
            for proposal in [data, b'changed']:
                with self.assertRaises(FileExistsError):
                    audit.save_exclusive(path, proposal)
            self.assertEqual(path.read_bytes(), data)

    def test_independent_binary_identity_unchanged(self):
        spec = importlib.util.spec_from_file_location('audit_r5', Path(__file__).with_name('audit-jacoco-project-capacity-r5.py'))
        previous = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(previous)
        self.assertEqual(audit.CRC_TABLE, previous.CRC_TABLE)
        for data in [b'abc', b'\xca\xfe\xba\xbe\x00\x00\x00\x35' + bytes(range(256))]:
            self.assertEqual(audit.class_id(data), previous.class_id(data))

if __name__ == '__main__':
    unittest.main()
