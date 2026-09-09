import copy
import fcntl
import importlib.util
import json
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import adapter as a

AT = '2026-09-06T12:00:00.000Z'


class EvidenceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix='alch-provision-')
        cls.root = Path(cls.temp.name)
        result = a.host.run(str(cls.root))
        if result['status'] != 'Succeeded':
            raise RuntimeError(str(result))
        cls.snap = a.snapshot(str(cls.root))
        cls.bundle = a.project(cls.snap, AT)

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def test_real_ansible_history_projects_into_existing_orodi_schema(self):
        value = a.evaluate(self.bundle, AT)
        self.assertEqual(value['claim_state'], 'passed')
        self.assertEqual(len(self.bundle['observations']), 5)
        self.assertFalse(value['deployment_ready'])
        self.assertEqual(value['telemetry_export'], 'pending')
        self.assertNotIn(str(self.root), json.dumps(self.bundle))

    def test_projection_is_deterministic_and_preserves_database(self):
        before = (self.root / 'history.sqlite').read_bytes()
        self.assertEqual(a.observe(str(self.root), AT, AT)['bundle'], self.bundle)
        self.assertEqual(before, (self.root / 'history.sqlite').read_bytes())

    def test_incomplete_run_has_all_stages_and_rejects_readiness(self):
        with tempfile.TemporaryDirectory(prefix='alch-provision-') as root:
            result = subprocess.run([sys.executable, str(a.PROVISION / 'host.py'), '--run-root', root, '--crash-after', 'configure'], capture_output=True, timeout=40)
            self.assertEqual(result.returncode, 75)
            value = a.observe(root, AT, AT)
            self.assertEqual(value['evaluation']['claim_state'], 'not-run')
            self.assertEqual(value['evaluation']['stage_states']['configure'], 'not-run')
            self.assertEqual(len(value['bundle']['observations']), 5)
            a.host.run(root)
            resumed = a.observe(root, AT, AT)
            self.assertEqual(resumed['evaluation']['claim_state'], 'passed')
            self.assertNotEqual(resumed['bundle']['snapshot_sha256'], value['bundle']['snapshot_sha256'])

    def test_failure_and_dependency_absence_are_distinct(self):
        with tempfile.TemporaryDirectory(prefix='alch-provision-') as root:
            a.host.run(root, fail_node='configure')
            value = a.observe(root, AT, AT)
            states = value['evaluation']['stage_states']
            self.assertEqual(states['configure'], 'failed')
            self.assertEqual(states['verify-config'], 'not-run')
            self.assertEqual(value['evaluation']['claim_state'], 'failed')
            obs = next(o for o in value['bundle']['observations'] if o['attributes']['stage'] == 'ready')
            self.assertEqual(obs['attributes']['reason'], 'dependency-blocked')

    def test_active_run_is_not_observed(self):
        with (self.root / 'owner.lock').open('rb') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            with self.assertRaisesRegex(ValueError, 'RUN_BUSY'):
                a.snapshot(str(self.root))

    def test_missing_root_is_not_created(self):
        with tempfile.TemporaryDirectory(prefix='alch-provision-') as value:
            root = Path(value)
        with self.assertRaises(ValueError):
            a.snapshot(str(root))
        self.assertFalse(root.exists())

    def test_history_tampering_cannot_be_projected(self):
        with tempfile.TemporaryDirectory(prefix='alch-provision-') as root:
            a.host.run(root, fail_node='configure')
            with sqlite3.connect(Path(root) / 'history.sqlite') as db:
                row = json.loads(db.execute('SELECT body FROM history WHERE seq=1').fetchone()[0])
                row['commands'] = []
                db.execute('UPDATE history SET body=? WHERE seq=1', (json.dumps(row),))
            with self.assertRaisesRegex(RuntimeError, 'ACCEPTED_HISTORY_DRIFT'):
                a.snapshot(root)

    def test_false_success_payload_rejected(self):
        snap = copy.deepcopy(self.snap)
        event = next(e for e in snap['events'] if e['node_id'] == 'ready')
        event['output_ref']['runtime_activated'] = True
        with self.assertRaisesRegex(ValueError, 'SUCCESS_OUTPUT_INVALID'):
            a.project(snap, AT)

    def test_missing_or_duplicate_stage_cannot_pass(self):
        for change in ('missing', 'duplicate'):
            bundle = copy.deepcopy(self.bundle)
            if change == 'missing':
                bundle['observations'].pop()
            else:
                bundle['observations'][-1] = bundle['observations'][0]
            self.assertEqual(a.evaluate(bundle, AT)['claim_state'], 'invalid')

    def test_telemetry_fabrication_or_loss_cannot_pass(self):
        for field, value in [('offered', 4), ('exported', 1), ('partial_success', 1)]:
            bundle = copy.deepcopy(self.bundle)
            bundle['observations'][0]['telemetry'][field] = value
            self.assertEqual(a.evaluate(bundle, AT)['claim_state'], 'invalid')

    def test_privacy_and_authority_claims_cannot_expand(self):
        for field, value in [('deployment_effect', True), ('independently_observed', True), ('plane', 'product')]:
            bundle = copy.deepcopy(self.bundle)
            bundle['observations'][0][field] = value
            self.assertEqual(a.evaluate(bundle, AT)['claim_state'], 'invalid')
        bundle = copy.deepcopy(self.bundle)
        bundle['observations'][0]['attributes']['secret'] = 'never-export-this'
        self.assertEqual(a.evaluate(bundle, AT)['claim_state'], 'invalid')

    def test_freshness_and_future_time(self):
        self.assertEqual(a.evaluate(self.bundle, '2026-09-06T12:05:00.000Z')['claim_state'], 'stale')
        self.assertEqual(a.evaluate(self.bundle, '2026-09-06T11:59:59.000Z')['claim_state'], 'invalid')

    def test_source_binding_and_schema_drift_reject(self):
        bundle = copy.deepcopy(self.bundle)
        bundle['observations'][0]['invalidation_key_digest'] = '0' * 64
        self.assertEqual(a.evaluate(bundle, AT)['claim_state'], 'invalid')
        bundle['observations'][0]['schema_version'] = 'invented'
        self.assertIn('ORODI_OBSERVATION_SCHEMA_INVALID', a.evaluate(bundle, AT)['findings'])

    def test_cli_emits_valid_candidate_evidence(self):
        result = subprocess.run([sys.executable, str(ROOT / 'adapter.py'), '--run-root', str(self.root), '--observed-at', AT, '--evaluated-at', AT], capture_output=True, text=True, timeout=20)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(json.loads(result.stdout)['evaluation']['verdict'], 'pass')


if __name__ == '__main__':
    unittest.main()
