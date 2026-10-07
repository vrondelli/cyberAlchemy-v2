"""Synthetic class bytes and source-coordinate ambiguities, no subject execution.
Open Questions: evidence/G01-COMPILED-METHOD-COORDINATES-R1.json.
"""
import importlib.util
from pathlib import Path
import struct
import unittest
spec = importlib.util.spec_from_file_location('coords', Path(__file__).with_name('compiled-method-coordinates-r1.py'))
coords = importlib.util.module_from_spec(spec)
spec.loader.exec_module(coords)
u2 = lambda n: struct.pack('>H', n)
u4 = lambda n: struct.pack('>I', n)


def fixture(line=10, pc=0):
    texts = ['p/A', 'f', '(I)V', 'Code', 'LineNumberTable', 'SourceFile', 'A.java']
    pool = b''.join(b'\x01' + u2(len(t)) + t.encode() for t in texts) + b'\x07' + u2(1)
    table = u2(1) + u2(pc) + u2(line)
    code = u2(1) + u2(2) + u4(1) + b'\xb1' + u2(0) + u2(1) + u2(5) + u4(len(table)) + table
    method = u2(1) + u2(2) + u2(3) + u2(1) + u2(4) + u4(len(code)) + code
    return b'\xca\xfe\xba\xbe' + u2(0) + u2(52) + u2(9) + pool + u2(1) + u2(8) + u2(0) + u2(0) + u2(0) + u2(1) + method + u2(1) + u2(6) + u4(2) + u2(7)


class Tests(unittest.TestCase):
    def test_binary_descriptor_coordinates(self):
        parsed = coords.parse_class(fixture())
        self.assertEqual(parsed['name'], 'p/A')
        self.assertEqual(parsed['source_filename'], 'A.java')
        self.assertEqual(parsed['methods'][0]['line_table'], [{'start_pc': 0, 'line': 10}])
        self.assertEqual(parsed['methods'][0]['descriptor'], '(I)V')

    def test_every_truncation_fails(self):
        raw = fixture()
        for n in range(len(raw)):
            with self.assertRaises((ValueError, IndexError)):
                coords.parse_class(raw[:n])
        with self.assertRaises(ValueError):
            coords.parse_class(raw + b'!')

    def test_bad_debug_coordinates(self):
        for raw in [fixture(line=0), fixture(pc=1)]:
            with self.assertRaises(ValueError):
                coords.parse_class(raw)

    def test_descriptors(self):
        self.assertEqual(coords.descriptor_arity('([[I[Ljava/lang/String;JD)Ljava/lang/Object;'), 4)
        for value in ['I', '(V)V', '(I)', '()Vjunk', '([)V', '(L;)V']:
            with self.assertRaises(ValueError):
                coords.descriptor_arity(value)

    def test_association_not_overload_guess(self):
        compiled = coords.parse_class(fixture())['methods'][0]
        record = {'classes': [{'entity_id': 'c', 'name': 'A', 'parent_class_id': None}],
                  'methods': [{'entity_id': 'm', 'name': 'f', 'has_body': True,
                               'parameter_types_syntax': ['int'], 'owner_class_id': 'c',
                               'span': {'complete': True, 'start_line': 9, 'end_line': 12}}]}
        self.assertEqual(coords.associate_method('p/A', compiled, record)['source_method_id'], 'm')
        record['methods'].append({**record['methods'][0], 'entity_id': 'overload'})
        self.assertEqual(coords.associate_method('p/A', compiled, record)['status'], 'ambiguous-or-unmatched')

    def test_generated_missing_and_wrong_owner(self):
        method = coords.parse_class(fixture())['methods'][0]
        for flags in [0x1000, 0x40]:
            self.assertEqual(coords.associate_method('p/A', {**method, 'access_flags': flags}, {})['status'], 'generated-or-initializer')
        self.assertEqual(coords.associate_method('p/A', {**method, 'line_table': []}, {})['status'], 'debug-lines-unavailable')
        record = {'classes': [], 'methods': []}
        self.assertEqual(coords.associate_method('p/A$1', method, record)['source_method_id'], None)


if __name__ == '__main__':
    unittest.main()
