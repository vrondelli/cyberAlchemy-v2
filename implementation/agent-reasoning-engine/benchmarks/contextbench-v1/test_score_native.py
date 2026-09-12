"""Counterexamples to source/annotation leakage and silent extraction failure."""
import copy, unittest
from types import SimpleNamespace
from score_native import prepare_prediction
class NativeGuardTests(unittest.TestCase):
    def setUp(self):
        self.gold=SimpleNamespace(id='fixture',repo_url='repo',commit='a'*40,_data={'inst_id':'fixture','patch':'REFERENCE PATCH','test_patch':'PRIVATE TEST'},files=lambda:['a.py'])
        self.pred={'instance_id':'fixture','repo_url':'repo','commit':'a'*40,'traj_data':{'pred_steps':[{'files':['a.py'],'spans':{'a.py':[{'start':1,'end':2}]}}],'pred_files':['a.py'],'pred_spans':{'a.py':[{'start':1,'end':2}]}}}
    def test_reference_fallback_removed_without_mutating_gold(self):
        _,safe=prepare_prediction(self.pred,self.gold)
        self.assertNotIn('patch',safe._data);self.assertNotIn('test_patch',safe._data)
        self.assertEqual(self.gold._data['patch'],'REFERENCE PATCH')
    def test_source_substitution_rejected(self):
        self.pred['repo_url']='other';self.assertRaisesRegex(ValueError,'source-mismatch',prepare_prediction,self.pred,self.gold)
    def test_missing_final_is_instrumentation_error(self):
        self.pred['traj_data']['pred_files']=[];self.pred['traj_data']['pred_spans']={}
        self.assertRaisesRegex(ValueError,'no-final-context',prepare_prediction,self.pred,self.gold)
    def test_files_without_spans_rejected(self):
        self.pred['traj_data']['pred_spans']={};self.assertRaisesRegex(ValueError,'file-span-mismatch',prepare_prediction,self.pred,self.gold)
    def test_path_escape_rejected(self):
        self.pred['traj_data']['pred_files']=['../a.py'];self.pred['traj_data']['pred_spans']={'../a.py':[{'start':1,'end':2}]}
        self.assertRaisesRegex(ValueError,'step.path',prepare_prediction,self.pred,self.gold)
    def test_empty_gold_is_not_a_vacuous_success(self):
        self.gold.files=lambda:[]
        self.assertRaisesRegex(ValueError,'gold.empty-context',prepare_prediction,self.pred,self.gold)
    def test_gold_input_rejected(self):
        self.pred['gold_context']=[];self.assertRaisesRegex(ValueError,'prediction.shape',prepare_prediction,self.pred,self.gold)
if __name__=='__main__':unittest.main()
