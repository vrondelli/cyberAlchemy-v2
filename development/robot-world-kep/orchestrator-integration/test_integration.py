"""Real local orchestrator-process contract tests. Questions: PLAN.md."""
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

from worker import HERE, binding, canonical, digest, simulate
from build import ORCHESTRATOR, LAUNCHER


class NativeIntegration(unittest.TestCase):
    def command(self, root, worker=None):
        return [str(LAUNCHER), str(ORCHESTRATOR/'target/debug/world_contracts'),
                str(worker or HERE/'worker.py'), str(root/'binding.json'), str(root/'owner'), 'run']

    def setup_root(self, root):
        b=binding(10);(root/'binding.json').write_bytes(canonical(b));return b

    def run_command(self, root, worker=None):
        return subprocess.run(self.command(root, worker), capture_output=True, text=True, timeout=15)

    def test_run_verify_exact_bytes_and_offline_replay_without_worker(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);b=self.setup_root(root);r=self.run_command(root)
            self.assertEqual(r.returncode,0,r.stderr);report=json.loads(r.stdout)
            world=Path(report['world_output']);original=world.read_bytes()
            bundle=json.loads(original)['result']
            self.assertEqual(canonical(bundle),canonical(simulate(b)))
            self.assertEqual(report['verification']['source_output_sha256'],digest(original))
            self.assertEqual(report['capacity']['total_assignments_started'],2)
            r=self.run_command(root,root/'missing-worker.py')
            self.assertEqual(r.returncode,0,r.stderr)
            self.assertTrue(json.loads(r.stdout)['replayed']);self.assertEqual(world.read_bytes(),original)
            world.write_bytes(original+b' ')
            r=self.run_command(root);self.assertNotEqual(r.returncode,0)
            self.assertIn('WORLD_OUTPUT_DIGEST',r.stderr)

    def test_changed_binding_cannot_reuse_completed_owner(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);self.setup_root(root);r=self.run_command(root);self.assertEqual(r.returncode,0,r.stderr)
            (root/'binding.json').write_bytes(canonical(binding(11)))
            r=self.run_command(root);self.assertNotEqual(r.returncode,0);self.assertIn('WORLD_GRAPH_BINDING',r.stderr)

    def test_owner_cancellation_never_releases_verification_or_redispatches(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);self.setup_root(root);(root/'owner').mkdir();(root/'owner/cancel.request').touch()
            r=self.run_command(root);self.assertNotEqual(r.returncode,0);self.assertIn('WORLD_CANCELLED',r.stderr)
            self.assertFalse(list((root/'owner').rglob('verify-output.json')))
            outputs=list((root/'owner').rglob('world-output.json'));self.assertEqual(len(outputs),1)
            self.assertEqual(json.loads(outputs[0].read_bytes())['status'],'cancelled')
            (root/'owner/cancel.request').unlink()
            r=self.run_command(root);self.assertNotEqual(r.returncode,0);self.assertIn('RECONCILIATION',r.stderr)

    def test_malformed_fence_result_is_not_accepted_and_attempt_does_not_repeat(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);self.setup_root(root);fake=root/'wrong_fence.py'
            fake.write_text("import json,sys,hashlib\nfrom pathlib import Path\n"
                "q=Path(sys.argv[1]).read_bytes();r=json.loads(q)\n"
                "v={'schema_version':'robot-world.worker-result/v1','contract':r['contract'],"
                "'command_id':r['command_id'],'fencing_token':r['fencing_token']+1,"
                "'request_sha256':hashlib.sha256(q).hexdigest(),'status':'succeeded','result':{'binding':r['input']}}\n"
                "Path(sys.argv[2]).write_text(json.dumps(v))\n")
            r=self.run_command(root,fake);self.assertNotEqual(r.returncode,0);self.assertIn('WORLD_RESULT_BINDING',r.stderr)
            self.assertFalse(list((root/'owner').rglob('verify-output.json')))
            r=self.run_command(root);self.assertNotEqual(r.returncode,0);self.assertIn('RECONCILIATION',r.stderr)

    def test_success_label_without_run_artifacts_is_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);self.setup_root(root);fake=root/'empty_result.py'
            fake.write_text("import json,sys,hashlib\nfrom pathlib import Path\n"
                "raw=Path(sys.argv[1]).read_bytes();q=json.loads(raw)\n"
                "out={k:q[k] for k in ['contract','command_id','fencing_token']}\n"
                "out.update(schema_version='robot-world.worker-result/v1',request_sha256=hashlib.sha256(raw).hexdigest(),"
                "status='succeeded',result={'binding':q['input']})\n"
                "Path(sys.argv[2]).write_text(json.dumps(out))\n")
            r=self.run_command(root,fake);self.assertNotEqual(r.returncode,0);self.assertIn('WORLD_RESULT_SHAPE',r.stderr)
            self.assertFalse(list((root/'owner').rglob('verify-output.json')))


if __name__=='__main__':unittest.main()
