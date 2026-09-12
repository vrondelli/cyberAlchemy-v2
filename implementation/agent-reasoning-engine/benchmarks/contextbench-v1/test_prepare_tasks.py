import unittest
from prepare_tasks import project_task,FIELDS

class TaskProjectionTests(unittest.TestCase):
    def setUp(self):
        self.row=dict(instance_id='task-1',original_inst_id='repo-1',repo='org/repo',
                      repo_url='https://github.com/org/repo.git',language='python',
                      base_commit='a'*40,problem_statement='Fix the public issue',source='Verified',
                      gold_context='SECRET_GOLD',patch='SECRET_PATCH',test_patch='SECRET_TEST',f2p='SECRET_ORACLE')
        self.identity={k:v for k,v in self.row.items() if k in FIELDS and k!='problem_statement'}
    def test_allowlist_excludes_evaluator_material(self):
        task=project_task(self.row,self.identity)
        self.assertEqual(set(task),set(FIELDS));self.assertNotIn('SECRET',str(task))
    def test_identity_mismatch_rejected(self):
        self.row['base_commit']='b'*40
        with self.assertRaisesRegex(ValueError,'identity-mismatch'):project_task(self.row,self.identity)
    def test_missing_issue_not_reconstructed_from_gold(self):
        self.row['problem_statement']=''
        with self.assertRaisesRegex(ValueError,'invalid-field:problem_statement'):project_task(self.row,self.identity)
    def test_path_injection_rejected(self):
        self.row['instance_id']=self.identity['instance_id']='../escape'
        with self.assertRaisesRegex(ValueError,'unsafe-instance-id'):project_task(self.row,self.identity)

if __name__=='__main__':unittest.main()
