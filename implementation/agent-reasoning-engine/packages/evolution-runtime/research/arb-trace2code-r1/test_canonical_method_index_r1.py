"""Synthetic compiler/parser tests, no benchmark labels.
Open Questions: evidence/G01-CANONICAL-METHOD-INDEX-R1.json.
"""
import hashlib
import json
import re
import subprocess
import tempfile
import unittest
from pathlib import Path
JAVA = Path('/home/vlad_/.local/share/are-toolchains/defects4j-v3/jdk-11.0.32.1+1/bin/java')
SOURCE = Path(__file__).with_name('CanonicalMethodIndexR1.java')


def check_spans(row, raw):
    text = raw.decode('utf8')
    utf16 = text.encode('utf-16-le')
    for entity in row.get('classes', []) + row.get('methods', []) + row.get('calls', []):
        span = entity['span']
        if not span['complete']:
            continue
        part = utf16[span['start_utf16']*2:span['end_utf16']*2].decode('utf-16-le')
        before = utf16[:span['start_utf16']*2].decode('utf-16-le')
        if len(before.encode()) != span['start_utf8'] or raw[span['start_utf8']:span['end_utf8']].decode() != part:
            raise ValueError('independent.utf16-utf8-span')
        if 'source' in span and span['source'] != part:
            raise ValueError('independent.source-text')
        line = len(re.findall(r'\r\n|\r|\n', before))+1
        if line != span['start_line']:
            raise ValueError('independent.physical-line')


class ParserTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temporary = tempfile.TemporaryDirectory()
        cls.root = Path(cls.temporary.name)
        cls.fixtures = {
            'Names.java': b'package p; class $Type { $Type(){} void run(int n){foo(n); Runnable r=()->foo(2); Object o=new Object(){void nested(){ foo(3); }};} void run(String n){} static void foo(int n){} }',
            'Unicode.java': '/* 🧪 */\r\nclass Unicode {\r\n void call(){ String s="fake() {}"; /* fake() */ real(); }\r\n void real(){}\r\n}'.encode(),
            'Abstract.java': b'interface I { void empty(); default int n(){ return 1; } }',
            'Malformed.java': b'class Broken { void x( { }',
            'Encoding.java': b'class X {}\xff',
            'Unresolved.java': b'class Unresolved { MissingType make(){ return new MissingType(); } }',
            'Reference.java': b'class Reference { void x(){ Runnable r=this::target; } void target(){} }',
            'Escape.java': br'class Escape { void x(){ \u000a target(); } void target(){} }',
            'Enum.java': b'enum Kind { A, B; int value(){ return ordinal(); } }',
        }
        for path, raw in cls.fixtures.items():
            (cls.root/path).write_bytes(raw)
        paths = list(cls.fixtures) + ['../outside.java']
        process = subprocess.run([str(JAVA), '-Xmx512m', '--add-modules', 'jdk.compiler', str(SOURCE), str(cls.root)],
                                 input='\n'.join(paths)+'\n', text=True, capture_output=True, timeout=60, check=True)
        cls.rows = {r['path']: r for r in map(json.loads, process.stdout.splitlines())}

    @classmethod
    def tearDownClass(cls):
        cls.temporary.cleanup()

    def test_dollar_overloads_and_constructors(self):
        row = self.rows['Names.java']
        self.assertEqual(row['status'], 'parsed')
        self.assertIn('$Type', [c['name'] for c in row['classes']])
        self.assertIn('', [c['name'] for c in row['classes']])
        overloads = [m for m in row['methods'] if m['name'] == 'run']
        self.assertEqual(len(overloads), 2)
        self.assertEqual(len({m['entity_id'] for m in overloads}), 2)
        self.assertEqual(sum(m['kind'] == 'constructor' for m in row['methods']), 1)

    def test_lambda_and_anonymous_scope(self):
        row = self.rows['Names.java']
        self.assertEqual(sum(c['inside_lambda'] for c in row['calls']), 1)
        methods = {m['entity_id']: m for m in row['methods']}
        nested_calls = [c for c in row['calls'] if c['enclosing_method_id'] and methods[c['enclosing_method_id']]['name'] == 'nested']
        self.assertEqual(len(nested_calls), 1)
        self.assertTrue(all(c['resolution'] == 'unresolved-syntactic-reference' for c in row['calls']))

    def test_exact_unicode_crlf_and_comments(self):
        row = self.rows['Unicode.java']
        self.assertEqual(row['status'], 'parsed')
        check_spans(row, self.fixtures['Unicode.java'])
        self.assertEqual([c['target_syntax'] for c in row['calls']], ['real'])
        self.assertGreater(row['methods'][0]['span']['start_utf8'], row['methods'][0]['span']['start_utf16'])

    def test_abstract_is_not_body(self):
        self.assertEqual([m['has_body'] for m in self.rows['Abstract.java']['methods']], [False, True])

    def test_malformed_and_invalid_encoding_explicit(self):
        self.assertEqual(self.rows['Malformed.java']['status'], 'parse-or-span-unqualified')
        self.assertTrue(self.rows['Malformed.java']['errors'])
        self.assertEqual(self.rows['Encoding.java']['status'], 'invalid-utf8')

    def test_no_type_analysis_or_execution(self):
        row = self.rows['Unresolved.java']
        self.assertEqual(row['status'], 'parsed')
        self.assertEqual(row['calls'][0]['target_syntax'], 'MissingType')
        self.assertEqual(row['calls'][0]['resolution'], 'unresolved-syntactic-reference')

    def test_member_reference(self):
        self.assertEqual(self.rows['Reference.java']['calls'][0]['kind'], 'member-reference')

    def test_unicode_escapes_source_not_runtime_line_claim(self):
        row = self.rows['Escape.java']
        self.assertEqual(row['status'], 'parsed')
        check_spans(row, self.fixtures['Escape.java'])
        self.assertEqual(row['methods'][0]['span']['end_line'], 1)

    def test_outside_root_rejected(self):
        self.assertEqual(self.rows['../outside.java']['status'], 'parser-failed')

    def test_full_source_hash_and_span_bindings(self):
        for path, raw in self.fixtures.items():
            row = self.rows[path]
            self.assertEqual(row['source_sha256'], hashlib.sha256(raw).hexdigest())
            if row['status'] == 'parsed':
                check_spans(row, raw)

    def test_enum_references_accounted(self):
        row = self.rows['Enum.java']
        self.assertEqual(len(row['methods']), 1)
        self.assertEqual(row['status'], 'parsed')
        self.assertEqual(row['unavailable_declaration_spans'], 0)
        self.assertEqual(row['unavailable_reference_spans'], 2)
        check_spans(row, self.fixtures['Enum.java'])
        self.assertTrue(all(c['resolution'] == ('unresolved-syntactic-reference' if c['span']['complete'] else 'unavailable-source-position') for c in row['calls']))


if __name__ == '__main__':
    unittest.main()
