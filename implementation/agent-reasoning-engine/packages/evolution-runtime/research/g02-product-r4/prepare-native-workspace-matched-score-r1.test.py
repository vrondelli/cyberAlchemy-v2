"""Synthetic-only scoring preparation tests; no provider or real Gold reads.
Open Questions: G02-NATIVE-CANDIDATE-WORKSPACE-R1.md.
"""
import ast
import contextlib
import io
import json
import subprocess
import sys
import tempfile
import types
import unittest
from hashlib import sha256
from pathlib import Path
from unittest.mock import patch

SCRIPT = Path(__file__).with_name('prepare-native-workspace-matched-score-r1.py')
DATASET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
digest = lambda b: sha256(b).hexdigest()

class PreparationTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix='are-synthetic-score-test-')
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.run = self.root/'g02-native-workspace-matched-exposed-r1-20261006'
        self.run.mkdir()
        self.rows = []; cases = []; results = []
        self.dataset_bytes = b'SYNTHETIC DATASET: not actual Gold'
        dataset = self.root/'g01-r8-eight-task-evaluator-r1/full.parquet'
        dataset.parent.mkdir(); dataset.write_bytes(self.dataset_bytes)
        for n in range(1,13):
            pair = f'{n:02}-pr11-mixed-{n:02}'
            base = self.root/'g02-product-replication-r11-20261002/pairs'/pair/'raw/sources/session/base'
            base.mkdir(parents=True)
            (base/'source.py').write_text('def synthetic():\n    return 1\n')
            def git(*args):
                return subprocess.check_output(['git','-c','core.hooksPath=/dev/null',
                    '-c','user.name=Synthetic Test','-c','user.email=synthetic@example.invalid',
                    '-C',str(base),*args],stderr=subprocess.DEVNULL)
            git('init','--quiet'); git('add','source.py'); git('commit','--quiet','-m','synthetic source')
            commit = git('rev-parse','HEAD').decode().strip(); instance = f'synthetic-exposed-{n}'
            cases.append({'pair':pair,'instance_id':instance})
            gold_context = [{'file':'source.py','start_line':1,'end_line':2}]
            if n == 1:
                gold_context.append({'file':'native-absent.py','start_line':1,'end_line':2})
            self.rows.append({'instance_id':instance,'original_inst_id':instance,'repo':'synthetic',
                'repo_url':'https://example.invalid/synthetic.git','base_commit':commit,
                'gold_context':json.dumps(gold_context),'source':'synthetic','language':'python'})
            for arm in ['control','workspace']:
                out = self.run/(pair+'-'+arm); out.mkdir()
                pred = {'instance_id':instance,'repo_url':'https://example.invalid/synthetic.git','commit':commit,
                    'traj_data':{'pred_files':['source.py'],'pred_spans':{'source.py':[[1,2]]},
                        'pred_steps':[{'files':['source.py'],'spans':{'source.py':[[1,2]]}}]}}
                pred_bytes = self.save(out/'prediction.json',pred)
                result_bytes = self.save(out/'RESULT.json',{'native_export':True})
                pre_bytes = self.save(out/'PRE-SCORE-SEAL.json',{'status':'terminal-before-evaluator',
                    'score_unopened':True,'prediction_sha256':digest(pred_bytes)})
                results.append({'pair':pair,'arm':arm,'result_sha256':digest(result_bytes),
                    'pre_score_sha256':digest(pre_bytes)})
        freeze_bytes = self.save(self.run/'FREEZE.json',{'cases':cases})
        self.save(self.run/'PRE-SCORE-CAMPAIGN-SEAL.json',{'freeze_sha256':digest(freeze_bytes),'results':results})
        self.gold_calls = 0

    def save(self,path,data):
        data = (json.dumps(data)+'\n').encode(); path.write_bytes(data); return data

    def execute(self):
        test = self
        tree = ast.parse(SCRIPT.read_text())
        class SyntheticBindings(ast.NodeTransformer):
            def visit_Constant(self,node):
                if node.value == '/home/vlad_/are-benchmark-archive':
                    return ast.copy_location(ast.Constant(str(test.root)),node)
                if node.value == DATASET_SHA:
                    return ast.copy_location(ast.Constant(digest(test.dataset_bytes)),node)
                return node
        tree = ast.fix_missing_locations(SyntheticBindings().visit(tree))
        package = types.ModuleType('pyarrow'); package.__path__ = []
        fake = types.ModuleType('pyarrow.parquet')
        def read_table(path,columns,filters):
            test.gold_calls += 1
            test.assertNotIn('patch',columns); test.assertNotIn('test_patch',columns)
            test.assertEqual(filters,[('instance_id','in',[r['instance_id'] for r in test.rows])])
            return types.SimpleNamespace(to_pylist=lambda:test.rows)
        fake.read_table = read_table
        with patch.dict(sys.modules,{'pyarrow':package,'pyarrow.parquet':fake}), contextlib.redirect_stdout(io.StringIO()):
            exec(compile(tree,str(SCRIPT),'exec'),{'__file__':str(SCRIPT)})

    def test_all_twenty_four_bundles_preserve_exact_source_and_native_absence(self):
        self.execute(); self.assertEqual(self.gold_calls,1)
        bundles = self.run/'score-bundles'
        seal = json.loads((bundles/'BUNDLES-SEAL.json').read_bytes())
        self.assertEqual(len(seal['bundles']),24)
        for entry in seal['bundles']:
            out = bundles/(entry['pair']+'-'+entry['arm'])
            self.assertEqual(digest((out/'BUNDLE.json').read_bytes()),entry['bundle_sha256'])
            bundle = json.loads((out/'BUNDLE.json').read_bytes())
            self.assertEqual(digest((out/'base/source.py').read_bytes()),bundle['files_sha256']['source.py'])
            self.assertFalse((out/'base/native-absent.py').exists())
            if entry['pair'].startswith('01-'):
                self.assertEqual(bundle['missing_source_paths'],['native-absent.py'])
        with self.assertRaises(AssertionError):
            self.execute()  # No overwrite or partial replay.

    def test_missing_prediction_stops_before_loading_any_labels(self):
        (self.run/'01-pr11-mixed-01-control/prediction.json').unlink()
        with self.assertRaises(AssertionError): self.execute()
        self.assertEqual(self.gold_calls,0)

    def test_changed_prediction_stops_before_loading_any_labels(self):
        (self.run/'01-pr11-mixed-01-control/prediction.json').write_text('{}')
        with self.assertRaises(AssertionError): self.execute()
        self.assertEqual(self.gold_calls,0)

    def test_changed_source_never_creates_fabricated_bundle(self):
        base = self.root/'g02-product-replication-r11-20261002/pairs/01-pr11-mixed-01/raw/sources/session/base'
        (base/'source.py').write_text('mutated source\n')
        with self.assertRaises(AssertionError): self.execute()
        self.assertFalse((self.run/'score-bundles/01-pr11-mixed-01-control').exists())

if __name__ == '__main__':
    unittest.main()
