import unittest
import hashlib
import importlib.util
from pathlib import Path
spec = importlib.util.spec_from_file_location('jacoco_binder', Path(__file__).with_name('bind-jacoco-r3.py'))
binder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(binder)
execution_data, bind_report = binder.execution_data, binder.bind_report


class BindingTests(unittest.TestCase):
    def setUp(self):
        self.classes = [{'name': 'a/A', 'class_id': '0123456789abcdef', 'executable_lines': 1}]
        self.data = bytes.fromhex('01c0c0100710000178') + bytes(16) + bytes.fromhex('110123456789abcdef0003612f410101')
        self.execution = execution_data(self.data, self.classes)
        self.source = b'package a; class A {}\n'
        self.sources = {'src/a/A.java': {'bytes': self.source, 'sha256': hashlib.sha256(self.source).hexdigest()}}
        self.instrumentation = {'source_root': 'src', 'rows': [{'path': 'src/a/A.java', 'top_level_classes': ['a.A']}]}
        self.xml = b'<report><package name="a"><class name="a/A" sourcefilename="A.java"><counter type="INSTRUCTION" covered="1" missed="0"/></class><sourcefile name="A.java"><line nr="1" mi="0" ci="1" mb="0" cb="0"/></sourcefile></package></report>'

    def test_exact_binding(self):
        result = bind_report(self.xml, self.sources, self.instrumentation, self.classes, self.execution)
        self.assertEqual(result['unique_executed_source_lines'], 1)

    def test_transformed_class_rejected(self):
        with self.assertRaisesRegex(ValueError, 'unmatched'):
            execution_data(self.data, [{**self.classes[0], 'class_id': '0000000000000000'}])

    def test_truncated_exec(self):
        with self.assertRaisesRegex(ValueError, 'truncated'):
            execution_data(self.data[:-1], self.classes)

    def test_wrong_source(self):
        with self.assertRaisesRegex(ValueError, 'class-source'):
            bind_report(self.xml.replace(b'A.java', b'B.java'), self.sources, self.instrumentation, self.classes, self.execution)

    def test_invalid_line(self):
        with self.assertRaisesRegex(ValueError, 'line-bounds'):
            bind_report(self.xml.replace(b'nr="1"', b'nr="99"'), self.sources, self.instrumentation, self.classes, self.execution)

    def test_missing_class_not_unexecuted(self):
        with self.assertRaises(ValueError):
            bind_report(b'<report/>', self.sources, self.instrumentation, self.classes, self.execution)


if __name__ == '__main__':
    unittest.main()
