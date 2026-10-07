"""Metadata is admitted only by exact declared path and source SHA.
Open Questions: evidence/G01-COMPILED-METHOD-COORDINATES-R1.json.
"""
import hashlib
import importlib.util
from pathlib import Path
import unittest
spec = importlib.util.spec_from_file_location('successor', Path(__file__).with_name('census-compiled-method-coordinates-r1b.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class Tests(unittest.TestCase):
    def test_exact_metadata(self):
        raw = b'package p;'
        coverage = {'path': 'src/p/package-info.java', 'source_sha256': hashlib.sha256(raw).hexdigest()}
        self.assertEqual(module.validate_source_record(raw, coverage, {}, [coverage]), 'explicit-package-metadata-not-method-source')

    def test_unknown_duplicate_or_drift_not_admitted(self):
        raw = b'package p;'
        row = {'path': 'src/p/package-info.java', 'source_sha256': hashlib.sha256(raw).hexdigest()}
        for metadata in [[], [row, row], [{**row, 'source_sha256': 'bad'}]]:
            with self.assertRaises(ValueError):
                module.validate_source_record(raw, row, {}, metadata)
        with self.assertRaises(ValueError):
            module.validate_source_record(b'drift', row, {}, [row])
        unknown = {**row, 'path': 'src/p/Other.java'}
        with self.assertRaises(ValueError):
            module.validate_source_record(raw, unknown, {}, [unknown])


if __name__ == '__main__':
    unittest.main()
