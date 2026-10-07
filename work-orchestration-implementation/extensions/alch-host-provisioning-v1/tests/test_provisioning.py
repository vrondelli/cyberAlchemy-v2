import fcntl
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import host

spec = importlib.util.spec_from_file_location('provision_compile', ROOT / 'compile.py')
compiler = importlib.util.module_from_spec(spec)
spec.loader.exec_module(compiler)


class ProvisioningTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='alch-provision-')
        self.root = Path(self.temp.name)

    def tearDown(self):
        self.temp.cleanup()

    def invoke(self, *args):
        return subprocess.run([sys.executable, str(ROOT / 'host.py'), '--run-root', str(self.root), *args],
                              capture_output=True, text=True, timeout=50)

    def rows(self):
        with sqlite3.connect(self.root / 'history.sqlite') as db:
            return [json.loads(row[0]) for row in db.execute('SELECT body FROM history ORDER BY seq')]

    def test_local_host_test_harness_is_in_exact_source_closure(self):
        script = ROOT / 'run-local-host-tests.sh'
        key = str(script.relative_to(compiler.REPO))
        manifest = host.load(ROOT / 'source-manifest.json')
        self.assertEqual(manifest['sources'].get(key), hashlib.sha256(script.read_bytes()).hexdigest())

    def test_real_ansible_dag_and_restart(self):
        first = self.invoke()
        self.assertEqual(first.returncode, 0, first.stdout + first.stderr)
        rows = self.rows()
        self.assertEqual(len(rows), 6)
        configure = next(r for r in rows if r['event'] and r['event']['node_id'] == 'configure')
        self.assertGreater(configure['event']['output_ref']['changed'], 0)
        self.assertEqual({c['node_id'] for c in configure['commands']}, {'verify-config', 'verify-storage'})
        ready = next(c for r in rows for c in r['commands'] if c['node_id'] == 'ready')
        self.assertEqual(len(ready['input']['dependencies']), 2)
        second = self.invoke()
        self.assertEqual(second.returncode, 0, second.stdout)
        self.assertEqual(self.rows(), rows)
        self.assertFalse(json.loads(second.stdout)['cursor']['outputs']['ready']['runtime_activated'])

    def test_real_ansible_second_application_has_zero_changes(self):
        contract = host.load(ROOT / 'domainspec.json')
        with (self.root / 'owner.lock').open('a') as lock:
            a = host.configure(self.root, contract, lock.fileno(), 30)
            b = host.configure(self.root, contract, lock.fileno(), 30)
        self.assertGreater(a['changed'], 0)
        self.assertEqual(b['changed'], 0)

    def test_lost_effect_result_is_reconciled_after_process_restart(self):
        crashed = self.invoke('--crash-after', 'configure')
        self.assertEqual(crashed.returncode, 75, crashed.stdout + crashed.stderr)
        path = self.root / 'target/config/host.json'
        before = path.stat().st_mtime_ns
        self.assertEqual(len(self.rows()), 2)
        resumed = self.invoke()
        self.assertEqual(resumed.returncode, 0, resumed.stdout)
        self.assertEqual(path.stat().st_mtime_ns, before)
        event = next(r['event'] for r in self.rows() if r['event'] and r['event']['node_id'] == 'configure')
        self.assertTrue(event['output_ref']['reconciled'])

    def test_failed_configuration_blocks_dependents_and_stays_failed(self):
        failed = self.invoke('--fail-node', 'configure')
        self.assertEqual(failed.returncode, 1)
        value = json.loads(failed.stdout)
        for node in ('verify-config', 'verify-storage', 'ready'):
            self.assertEqual(value['cursor']['node_status'][node], 'blocked')
        before = self.rows()
        self.assertEqual(self.invoke().returncode, 1)
        self.assertEqual(before, self.rows())
        self.assertFalse((self.root / 'target').exists())

    def test_failed_verifier_prevents_sibling_effect_and_readiness(self):
        failure = self.invoke('--fail-node', 'verify-config')
        self.assertEqual(failure.returncode, 1)
        nodes = [r['event']['node_id'] for r in self.rows() if r['event']]
        self.assertNotIn('verify-storage', nodes)
        self.assertNotIn('ready', nodes)
        self.assertEqual(self.invoke().returncode, 1)

    def test_drifted_configuration_is_repaired_before_acceptance(self):
        self.assertEqual(self.invoke('--crash-after', 'configure').returncode, 75)
        (self.root / 'target/config/host.json').write_text('{}')
        self.assertEqual(self.invoke().returncode, 0)
        event = next(r['event'] for r in self.rows() if r['event'] and r['event']['node_id'] == 'configure')
        self.assertFalse(event['output_ref']['reconciled'])

    def test_symlink_target_is_rejected_without_touching_destination(self):
        with tempfile.TemporaryDirectory() as outside:
            (self.root / 'target').symlink_to(outside, target_is_directory=True)
            result = self.invoke()
            self.assertEqual(result.returncode, 1)
            self.assertIn('UNSAFE_TARGET_PATH', result.stdout)
            self.assertEqual(list(Path(outside).iterdir()), [])

    def test_run_has_one_owner(self):
        with (self.root / 'owner.lock').open('a') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            result = self.invoke()
            self.assertEqual(result.returncode, 1)
            self.assertIn('RUN_ALREADY_OWNED', result.stdout)

    def test_durable_deadline_survives_restart(self):
        self.assertEqual(self.invoke('--crash-after', 'configure').returncode, 75)
        with sqlite3.connect(self.root / 'history.sqlite') as db:
            value = json.loads(db.execute('SELECT body FROM metadata').fetchone()[0])
            value['deadline'] = 0
            db.execute('UPDATE metadata SET body=?', (json.dumps(value),))
        self.assertEqual(self.invoke().returncode, 1)
        self.assertIn('DAG_DEADLINE_EXCEEDED', str(self.rows()))

    def test_journal_tampering_is_detected_by_rwo_replay(self):
        self.assertEqual(self.invoke('--crash-after', 'configure').returncode, 75)
        with sqlite3.connect(self.root / 'history.sqlite') as db:
            value = json.loads(db.execute('SELECT body FROM history WHERE seq=1').fetchone()[0])
            value['commands'] = []
            db.execute('UPDATE history SET body=? WHERE seq=1', (json.dumps(value),))
        result = self.invoke()
        self.assertEqual(result.returncode, 1)
        self.assertIn('ACCEPTED_HISTORY_DRIFT', result.stdout)

    def test_acceptance_conflict_duplicate_and_divergence(self):
        self.assertEqual(self.invoke('--crash-after', 'configure').returncode, 75)
        dag = host.load(ROOT / 'generated/dag.json')
        with sqlite3.connect(self.root / 'history.sqlite', isolation_level=None) as db:
            state, events = host.replay(db, dag)
            self.assertEqual(host.accept(db, dag, events[0], 'old'), 'Duplicate')
            divergent = dict(events[0], output_ref={'changed': 'meaning'})
            with self.assertRaisesRegex(RuntimeError, 'DIVERGENT_EVENT'):
                host.accept(db, dag, divergent, 'old')
            cmd = state['transitions'][-1]['commands'][0]
            event = {'event_id': 'conflict', 'node_id': cmd['node_id'], 'command_id': cmd['command_id'],
                     'outcome': 'succeeded', 'output_ref': {}, 'error': None}
            with self.assertRaisesRegex(RuntimeError, 'CURSOR_CONFLICT'):
                host.accept(db, dag, event, 'old')
            self.assertEqual(db.execute('SELECT count(*) FROM history').fetchone()[0], 2)

    def test_compiler_is_deterministic_and_outputs_current(self):
        first = compiler.build()
        self.assertEqual(first, compiler.build())
        for name, content in first.items():
            self.assertEqual(content, (ROOT / 'generated' / name).read_bytes())

    def test_failed_history_append_leaves_cursor_and_commands_unchanged(self):
        self.assertEqual(self.invoke('--crash-after', 'configure').returncode, 75)
        dag = host.load(ROOT / 'generated/dag.json')
        before = self.rows()
        with sqlite3.connect(self.root / 'history.sqlite', isolation_level=None) as db:
            state, _ = host.replay(db, dag)
            command = state['transitions'][-1]['commands'][0]
            event = {'event_id': 'append-fault', 'node_id': command['node_id'],
                     'command_id': command['command_id'], 'outcome': 'succeeded',
                     'output_ref': {'verified': True}, 'error': None}
            db.execute("CREATE TRIGGER reject_append BEFORE INSERT ON history BEGIN SELECT RAISE(ABORT, 'injected-disk-failure'); END")
            with self.assertRaisesRegex(sqlite3.IntegrityError, 'injected-disk-failure'):
                host.accept(db, dag, event, host.digest(host.encoded(state['transitions'][-1]['cursor'])))
        self.assertEqual(before, self.rows())

    def test_rwo_rejects_cycle(self):
        dag = host.load(ROOT / 'generated/dag.json')
        dag['nodes'][0]['depends_on'] = ['ready']
        dag['nodes'][0]['release'] = {'mode': 'all'}
        with self.assertRaisesRegex(RuntimeError, 'DAG_CYCLE_DETECTED'):
            host.derive(dag, [])

    def test_adapter_timeout_kills_subprocess_group(self):
        with self.assertRaisesRegex(RuntimeError, 'COMMAND_TIMEOUT'):
            host.child(['/usr/bin/python3', '-c', 'import time; time.sleep(30)'], timeout=.05, cwd=self.root)

    def test_nonlocal_root_and_unknown_adapter_are_rejected(self):
        with self.assertRaisesRegex(RuntimeError, 'ROOT_MUST_BE_PRIVATE_TMP_FIXTURE'):
            host.open_root('/home/anything')
        with self.assertRaisesRegex(RuntimeError, 'ROOT_MUST_BE_PRIVATE_TMP_FIXTURE'):
            host.open_root('/var/tmp/alch-provision-valid/child')
        with self.assertRaisesRegex(RuntimeError, 'ADAPTER_NOT_ALLOWED'):
            host.execute('shell', self.root, {}, None, 1)

    def test_private_var_tmp_root_is_accepted(self):
        with tempfile.TemporaryDirectory(prefix='alch-provision-', dir='/var/tmp') as value:
            self.assertEqual(host.open_root(value), Path(value))


if __name__ == '__main__':
    unittest.main()
