import unittest
import hashlib
import importlib.util
from pathlib import Path
spec = importlib.util.spec_from_file_location('jacoco_binder', Path(__file__).with_name('bind-jacoco-r5.py'))
binder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(binder)
execution_data, bind_report = binder.execution_data, binder.bind_report


class BindingTests(unittest.TestCase):
    def setUp(self):
        self.classes = [{'name': 'a/A', 'class_id': '0123456789abcdef', 'executable_lines': 1, 'analyzed': True, 'line_coverage_available': True, 'access_flags': 0}]
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

    def generated(self):
        return {'name': 'a/A$1', 'class_id': 'fedcba9876543210', 'executable_lines': None, 'analyzed': False, 'line_coverage_available': False, 'access_flags': 4096, 'method_count': 1, 'analysis_omission': 'Pinned Analyzer synthetic omission, unavailable lines'}

    def test_synthetic_exact_execution_not_source_lines(self):
        classes = self.classes + [self.generated()]
        data = self.data + bytes.fromhex('11fedcba98765432100005612f4124310101')
        execution = execution_data(data, classes)
        bound = bind_report(self.xml, self.sources, self.instrumentation, classes, execution)
        self.assertEqual(bound['unique_executed_source_lines'], 1)
        self.assertEqual(bound['omitted_generated_line_coverage_unavailable'], ['a/A$1'])
        self.assertEqual(bound['omitted_zero_line_classes'], [])
        self.assertEqual(bound['generated_execution_observations_not_source_lines'][0]['positive_probes'], 1)

    def test_synthetic_wrong_id_rejects(self):
        data = self.data + bytes.fromhex('11fedcba98765432100005612f4124310101')
        with self.assertRaisesRegex(ValueError, 'unmatched'):
            execution_data(data, self.classes + [{**self.generated(), 'class_id': '0000000000000000'}])

    def test_synthetic_unverified_flag_rejects(self):
        with self.assertRaisesRegex(ValueError, 'unverified-generated'):
            bind_report(self.xml, self.sources, self.instrumentation, self.classes + [{**self.generated(), 'access_flags': 0}], self.execution)

    def test_generated_null_not_fabricated_zero(self):
        with self.assertRaisesRegex(ValueError, 'unverified-generated'):
            bind_report(self.xml, self.sources, self.instrumentation, self.classes + [{**self.generated(), 'executable_lines': 0}], self.execution)

    def test_generated_unexpected_source_report_rejects(self):
        xml = self.xml.replace(b'</class>', b'</class><class name="a/A$1" sourcefilename="A.java"/>')
        with self.assertRaisesRegex(ValueError, 'unexpected-source-report'):
            bind_report(xml, self.sources, self.instrumentation, self.classes + [self.generated()], self.execution)

    def test_missing_declared_source_rejects(self):
        instrumentation = {'source_root': 'src', 'rows': [{'path': 'src/a/Missing.java', 'top_level_classes': ['a.Missing']}]}
        with self.assertRaisesRegex(ValueError, 'declared-source'):
            bind_report(self.xml, self.sources, instrumentation, self.classes, self.execution)

    def test_null_class_id_rejects_even_if_not_executed(self):
        with self.assertRaisesRegex(ValueError, 'complete-class-id'):
            execution_data(self.data, self.classes + [{**self.generated(), 'class_id': None}])


if __name__ == '__main__':
    unittest.main()
