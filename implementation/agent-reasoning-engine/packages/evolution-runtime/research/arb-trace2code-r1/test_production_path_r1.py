"""Selector parity and retrospective membership audit, no gold reads.

Open Questions: G01-DEFECTS4J-CALLER-CONTEXT-SCREEN-2026-10-06.md.
"""
import importlib.util
import json
from pathlib import Path
import subprocess
import unittest
from production_path_r1 import production_path


class ProductionParity(unittest.TestCase):
    def test_js_parity(self):
        fixtures = ['src/Foo.java', 'src/FooTest.java', 'src/FooTests.java',
                    'src/TestFoo.java', 'src/FooTestCase.java', 'src/test/Foo.java',
                    'src/TESTING/Foo.java', 'src/testsrc/Foo.java', 'src/Test.java',
                    'src/Contest.java', 'src/Foo.py', 'src/tester/Foo.java']
        script = "import {productionPath} from './screen-defects4j-production-candidates-r1.mjs'; console.log(JSON.stringify(JSON.parse(process.argv[1]).map(productionPath)));"
        result = subprocess.check_output(['node', '--input-type=module', '-e', script, json.dumps(fixtures)], cwd=Path(__file__).parent)
        self.assertEqual([production_path(p) for p in fixtures], json.loads(result))

    def test_expected_names(self):
        self.assertTrue(production_path('src/Foo.java'))
        for name in ['FooTest', 'FooTests', 'TestFoo', 'FooTestCase']:
            self.assertFalse(production_path(f'src/{name}.java'))


if __name__ == '__main__':
    unittest.main()
