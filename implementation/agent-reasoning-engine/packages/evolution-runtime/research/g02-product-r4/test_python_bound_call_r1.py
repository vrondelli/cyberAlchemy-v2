import ast
import runpy
import unittest
from pathlib import Path

bound_calls = runpy.run_path(str(Path(__file__).with_name('python-bound-call-r1.py')))['bound_calls']


def calls(text, extra, source='pkg/client.py'):
    docs = {source: ast.parse(text), **{p: ast.parse(t) for p, t in extra.items()}}
    return bound_calls(source, docs, [{'start': 1, 'end': 999}])


class BindingTest(unittest.TestCase):
    def test_alias_exact(self):
        hits = calls('from pkg.impl import work as execute\nexecute()', {'pkg/impl.py': 'def work(): pass'})
        self.assertEqual(hits[0]['path'], 'pkg/impl.py')

    def test_module_alias_and_relative(self):
        self.assertEqual(len(calls('from . import impl\nimpl.work()', {'pkg/impl.py': 'def work(): pass'})), 1)
        self.assertEqual(len(calls('import pkg.impl\npkg.impl.work()', {'pkg/impl.py': 'def work(): pass'})), 1)

    def test_parameter_and_assignment_shadow(self):
        for text in ['from pkg.impl import work\ndef f(work):\n work()',
                     'from pkg.impl import work\nwork = lambda: None\nwork()',
                     'from pkg.impl import work\ndef f():\n work()\n work = lambda: None']:
            self.assertEqual(calls(text, {'pkg/impl.py': 'def work(): pass'}), [])

    def test_ambiguity_and_same_name_no_guess(self):
        self.assertEqual(calls('from pkg.impl import work\nwork()', {'pkg/impl.py': 'def work(): pass', 'lib/pkg/impl.py': 'def work(): pass'}), [])
        self.assertEqual(calls('work()', {'pkg/impl.py': 'def work(): pass'}), [])

    def test_class_method_and_span(self):
        hits = calls('from pkg.impl import C\nC.work()', {'pkg/impl.py': 'class C:\n def work(): pass'})
        self.assertEqual(hits[0]['line'], 2)
        docs = {'pkg/client.py': ast.parse('from pkg.impl import work\nwork()'), 'pkg/impl.py': ast.parse('def work(): pass')}
        self.assertEqual(bound_calls('pkg/client.py', docs, [{'start': 1, 'end': 1}]), [])


if __name__ == '__main__':
    unittest.main()
