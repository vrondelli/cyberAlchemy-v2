"""Independent auditor regressions; Open Questions: G01-JACOCO-PROJECT-CAPACITY-R5.json."""
import importlib.util
import json
from pathlib import Path
import unittest

HERE = Path(__file__).parent
spec = importlib.util.spec_from_file_location('audit', HERE / 'audit-jacoco-project-capacity-r5.py')
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)
ROOT = Path('/home/vlad_/are-benchmark-archive/g01-jacoco-class-identity-r5-20261006')
PARENT = Path('/home/vlad_/are-benchmark-archive/g01-jacoco-project-capacity-r4-20261006')


class Identity(unittest.TestCase):
    def test_all14_complete_byte_inventory_crcs_and_binary_headers(self):
        files = sorted(ROOT.glob('*-BOUND-CLASSINFO.json'))
        self.assertEqual(len(files), 14)
        for file in files:
            case_id = file.name.removesuffix('-BOUND-CLASSINFO.json')
            result = json.loads((PARENT / case_id / 'RESULT.json').read_bytes())
            for row in json.loads(file.read_bytes())['rows']:
                b = (PARENT / case_id / 'trusted-fixture' / result['compiled_root'] / row['path']).read_bytes()
                self.assertEqual(audit.class_id(b), row['class_id'])
                self.assertEqual(audit.binary_facts(b), (row['access_flags'], row['method_count'], row['name']))

    def test_truncated_header_rejects(self):
        with self.assertRaisesRegex(ValueError, 'binary-header'):
            audit.binary_facts(b'bad')

    def test_java9_compatibility(self):
        file = ROOT / 'Defects4J-Cli-5-BOUND-CLASSINFO.json'
        row = json.loads(file.read_bytes())['rows'][0]
        result = json.loads((PARENT / 'Defects4J-Cli-5/RESULT.json').read_bytes())
        b = bytearray((PARENT / 'Defects4J-Cli-5/trusted-fixture' / result['compiled_root'] / row['path']).read_bytes())
        b[6], b[7] = 0, 53
        v9 = audit.class_id(b)
        b[7] = 52
        self.assertEqual(v9, audit.class_id(b))


if __name__ == '__main__':
    unittest.main()
