"""Analysis regression tests. Open questions: README.md#open-questions."""
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

spec=importlib.util.spec_from_file_location('analyze',Path(__file__).with_name('analyze.py'))
a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)

class AnalysisTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=Path(self.temp.name)

    def write(self,p,value):
        p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(value,indent=2)+'\n');return p

    def fixture(self,name='sample',identity='one',bad_binding=False):
        p=self.root/name/'initial/trial-00/result.json'
        manifest={'context_policy':{'recycle_at':8000},'sources':[]}
        self.write(p.with_name('manifest.json'),manifest)
        text=json.dumps({'authority_effect':'none','expected_base_tree_sha256':'a'*64,'changes':[{'operation':'replace-file','path':'src/subject.mjs','expected_file_sha256':'b'*64,'utf8':'export const x=1;'}]})
        self.write(p.with_name('visible-trace.json'),{'receipts':[{'kind':'model','status':200,'input_tokens':10,'output_tokens':5}], 'completion_gate':{'passed':True},'final_response_evidence':{'text':text,'text_sha256':a.digest(text.encode()),'truncated':False},'history':[{'calls':[{'name':'read-file','arguments':{'path':'cases','offset':0}},{'name':'read-file','arguments':{'path':'cases','offset':10}},{'name':'read-file','arguments':{'path':'cases','offset':0}}]}]})
        result={'schema_version':'are.glm-episodes-result/v1','manifest_sha256':'wrong' if bad_binding else a.canonical(manifest),'arms':[{'index':0,'directory':identity,'agent_result_sha256':'digest-'+identity,'episode_id':'test','task_sha256':'task','fixture_tree_sha256':'fixture','patch_correct':False,'agent_status':'BLOCK','reasons':['glm.candidate-invalid'],'continuity':{'passed':False},'recycles':0}]}
        self.write(p,result);return p

    def test_manifest_uses_canonical_not_formatted_byte_hash(self):
        self.fixture();c=a.Corpus(self.root);rows,_,_=a.discover(c);self.assertEqual(len(rows),1);self.assertEqual(c.diagnostics,[])

    def test_corrupt_manifest_binding_excluded(self):
        self.fixture(bad_binding=True);c=a.Corpus(self.root);rows,_,_=a.discover(c);self.assertEqual(rows,[]);self.assertEqual(c.diagnostics[0]['code'],'manifest-binding-mismatch')

    def test_duplicate_exports_not_identical_new_trials(self):
        self.fixture('a','same');self.fixture('b','same');self.fixture('c','different')
        c=a.Corpus(self.root);rows,_,_=a.discover(c);self.assertEqual(len(rows),2);self.assertEqual(len(c.diagnostics),1)

    def test_pagination_is_not_duplicate_read(self):
        self.fixture();rows,_,_=a.discover(a.Corpus(self.root));self.assertEqual(rows[0]['read_calls'],3);self.assertEqual(rows[0]['duplicate_exact_reads'],1)

    def test_incomplete_campaign_and_unobserved_final_stay_unknown(self):
        self.fixture();self.write(self.root/'sample/run/manifest.json',{'rounds':3,'trials':36});self.write(self.root/'sample/run/result.json',{'status':'COMPLETED','completed_trials':12,'planned_trials':36,'rounds':[{}]})
        rows,_,_=a.discover(a.Corpus(self.root));self.assertEqual(rows[0]['cohort'],'qualification-incomplete');self.assertIsNone(rows[0]['final_pass'])

    def test_labels_overlap_but_no_recycling_is_not_continuity_failure(self):
        r={'schema_ok':False,'public_before_ok':False,'transport_failures':1,'recycles':0,'continuity':False}
        self.assertEqual(a.classify(r),['schema','semantic','transport-observed'])

    def test_correction_timeout_separate_from_semantic(self):
        r={'final_pass':False,'feedback_reasons':['feedback.request-failed'],'reasons':['glm.candidate-invalid']}
        self.assertEqual(a.final_failure(r,[{'phase':'correction','status':None}]),'correction-transport')

    def test_schema_projection_preserves_all_issues_and_no_source_text(self):
        payload={'id':'test','text':json.dumps({'changes':[],'unexpected':True})}
        p=subprocess.run(['node',str(a.HERE/'diagnose.mjs')],input=json.dumps(payload)+'\n',text=True,capture_output=True,check=True)
        x=json.loads(p.stdout);paths={i['instance_path'] for i in x['issues']}
        self.assertTrue({'/schema_version','/authority_effect','/expected_base_tree_sha256','/changes','/unexpected'}<=paths)
        self.assertNotIn('text',x);self.assertFalse(x['protected_fields_present'])

    def test_unjoined_feedback_cannot_replace_trial(self):
        self.fixture();self.write(self.root/'sample/retained/result.json',{'results':[{'id':'test','result':{'status':'REPAIRED'}}],'oracle':[{'id':'test','result':{'ok':True}}]})
        c=a.Corpus(self.root);rows,_,calls=a.discover(c);reuse=a.join_feedback(c,rows,calls)
        self.assertEqual(len(reuse),1);self.assertIsNone(rows[0]['final_pass'])

if __name__=='__main__':unittest.main()
