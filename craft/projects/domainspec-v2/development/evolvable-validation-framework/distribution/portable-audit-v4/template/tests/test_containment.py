#!/usr/bin/env python3
"""Real denial/allow probes and fail-closed launcher tests; synthetic files only."""
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import tempfile
import time
import unittest
from unittest import mock

sys.dont_write_bytecode = True
KIT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(KIT))
import containment as c


class ContainmentTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='evf-boundary-test-')
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.workspace = self.base / 'audit'
        self.workspace.mkdir()
        (self.workspace / 'input.txt').write_text('permitted input')
        self.runtime = self.base / 'runtime'
        self.runtime.mkdir()
        (self.runtime / 'data.txt').write_text('read-only runtime')
        self.outside = self.base / 'outside.txt'
        self.outside.write_text('outside secret')

    def policy(self):
        return c.policy(self.workspace, [self.runtime])

    def test_real_read_write_and_escape_attempts(self):
        with socket.socket() as network, socket.socket(socket.AF_UNIX) as host_socket:
            network.bind(('127.0.0.1', 0))
            network.listen()
            socket_path = str(self.base / 'host.sock')
            host_socket.bind(socket_path)
            host_socket.listen()
            fd = os.open(self.outside, os.O_RDONLY)
            self.addCleanup(os.close, fd)
            os.set_inheritable(fd, True)
            with mock.patch.dict(os.environ, {'EVF_PROBE_SECRET': 'never inherit'}):
                value = c.launch(self.policy(), ['/usr/bin/python3', '-I', '-B', KIT / 'tests/containment_probe.py',
                                 KIT, self.workspace, self.outside, self.runtime, fd, network.getsockname()[1], socket_path])
        self.assertEqual(value['exit_code'], 0, value)
        self.assertIsNone(value['failure'])
        observed = json.loads(value['stdout'])
        self.assertEqual(len(observed), 18)
        self.assertTrue(all(observed.values()), observed)
        self.assertEqual(self.outside.read_text(), 'outside secret')
        self.assertEqual((self.runtime / 'data.txt').read_text(), 'read-only runtime')
        self.assertEqual((self.workspace / 'result.txt').read_text(), 'permitted output')

    def test_workspace_hardlink_rejected_before_launch(self):
        os.link(self.outside, self.workspace / 'alias')
        with self.assertRaisesRegex(c.Blocked, 'hard-linked'):
            self.policy()

    def test_workspace_symlink_rejected_before_launch(self):
        (self.workspace / 'alias').symlink_to(self.outside)
        with self.assertRaisesRegex(c.Blocked, 'symlink'):
            self.policy()

    def test_socket_in_workspace_is_rejected(self):
        with socket.socket(socket.AF_UNIX) as stream:
            stream.bind(str(self.workspace / 'service.sock'))
            with self.assertRaisesRegex(c.Blocked, 'Socket'):
                self.policy()

    def test_socket_in_readonly_runtime_is_rejected(self):
        with socket.socket(socket.AF_UNIX) as stream:
            stream.bind(str(self.runtime / 'service.sock'))
            with self.assertRaisesRegex(c.Blocked, 'Socket'):
                self.policy()

    def test_fifo_in_workspace_is_rejected_without_opening(self):
        os.mkfifo(self.workspace / 'pipe')
        with self.assertRaisesRegex(c.Blocked, 'FIFO'):
            self.policy()

    def test_broad_host_roots_rejected(self):
        for path in ('/', '/tmp', '/home', str(Path.home())):
            with self.subTest(path=path), self.assertRaises(c.Blocked):
                c.bounded_path(path, workspace=True)

    def test_workspace_cannot_be_runtime(self):
        with self.assertRaisesRegex(c.Blocked, 'overlap'):
            c.policy(self.workspace, [self.workspace])

    def test_runtime_cannot_expand_to_workspace_parent(self):
        with self.assertRaisesRegex(c.Blocked, 'overlap'):
            c.policy(self.workspace, [self.base])

    def test_checkout_workspace_rejected(self):
        (self.workspace / '.git').mkdir()
        with self.assertRaisesRegex(c.Blocked, 'dedicated'):
            self.policy()

    def test_missing_bubblewrap_has_no_fallback(self):
        with mock.patch.object(c.shutil, 'which', return_value=None):
            with self.assertRaisesRegex(c.Blocked, 'No uncontained fallback'):
                c.runtime()

    def test_user_supplied_bubblewrap_is_rejected(self):
        fake = self.base / 'bwrap'
        fake.write_text('#!/bin/sh\nexit 0\n')
        fake.chmod(0o755)
        with mock.patch.object(c.shutil, 'which', return_value=str(fake)):
            with self.assertRaisesRegex(c.Blocked, 'distribution'):
                c.runtime()

    def test_failed_sandbox_never_executes_payload_on_host(self):
        value = self.policy()
        value['bubblewrap']['path'] = '/usr/bin/false'
        marker = self.workspace / 'must-not-exist'
        result = c.launch(value, ['/usr/bin/touch', marker])
        self.assertNotEqual(result['exit_code'], 0)
        self.assertFalse(marker.exists())

    def test_direct_python_execution_gate_cannot_be_disabled_by_environment(self):
        with mock.patch.dict(os.environ, {'EVF_SANDBOX': '1', 'EVF_CONTAINED': '1'}):
            with self.assertRaisesRegex(c.Blocked, 'containment required'):
                c.require_inside()

    def test_direct_provider_capture_is_blocked(self):
        sys.path.insert(0, str(KIT / 'adapters'))
        import common
        marker = self.workspace / 'must-not-exist'
        with self.assertRaises(c.Blocked):
            common.capture(['/usr/bin/touch', marker], self.workspace)
        self.assertFalse(marker.exists())

    def test_workspace_policy_file_does_not_grant_host_access(self):
        (self.workspace / '.evf-containment.json').write_text(json.dumps({'runtime_paths': ['/']}))
        value = self.policy()
        self.assertNotIn('/', value['read_only_runtime_paths'])
        result = c.launch(value, ['/usr/bin/python3', '-I', '-c',
                         'from pathlib import Path; import sys; sys.exit(Path(sys.argv[1]).exists())', self.outside])
        self.assertEqual(result['exit_code'], 0, result)

    def test_detached_descendant_does_not_outlive_sandbox(self):
        marker = self.workspace / 'escaped-child'
        child = 'import time; from pathlib import Path; time.sleep(1); Path(' + repr(str(marker)) + ').write_text("escaped")'
        script = 'import subprocess; subprocess.Popen(["/usr/bin/python3", "-c", ' + repr(child) + '], start_new_session=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)'
        result = c.launch(self.policy(), ['/usr/bin/python3', '-I', '-c', script])
        self.assertEqual(result['exit_code'], 0, result)
        time.sleep(1.2)
        self.assertFalse(marker.exists())

    def test_launch_output_is_bounded(self):
        result = c.launch(self.policy(), ['/usr/bin/python3', '-I', '-c', 'print("x"*100000)'], limit=1000)
        self.assertEqual(result['failure'], 'containment-output-limit')

    def test_launch_time_is_bounded(self):
        result = c.launch(self.policy(), ['/usr/bin/python3', '-I', '-c', 'import time; time.sleep(5)'], timeout=0.1)
        self.assertEqual(result['failure'], 'containment-timeout')

    def test_direct_tool_binding_stops_before_version_probe(self):
        import formal
        with mock.patch.object(formal, 'capture') as capture:
            with self.assertRaises(c.Blocked):
                formal.tools_bind(self.workspace, {'cc': '/usr/bin/gcc'}, True)
            capture.assert_not_called()

    def test_nested_user_namespace_cannot_remount_runtime_writable(self):
        result = c.launch(self.policy(), ['/usr/bin/unshare', '--user', '--map-root-user', '--mount', '--',
                         '/usr/bin/mount', '-o', 'remount,rw', str(self.runtime)])
        self.assertNotEqual(result['exit_code'], 0, result)
        self.assertEqual((self.runtime / 'data.txt').read_text(), 'read-only runtime')

    def test_custom_provider_uses_the_public_cli_boundary(self):
        root = self.base / 'custom-audit'
        def cli(*args):
            process = subprocess.run([sys.executable, '-B', str(KIT / 'evf'), *map(str, args)],
                                     capture_output=True, text=True, timeout=60)
            self.assertEqual(process.returncode, 0, process.stdout + process.stderr)
            return json.loads(process.stdout)
        cli('init', root)
        spec_path = root / 'audit.json'
        spec = json.loads(spec_path.read_text())
        spec['bindings'] = ['probe.py', 'positive.txt', 'negative.txt']
        spec['subject'] = 'Synthetic containment protocol probe'
        spec['claim_ceiling'] = 'Only test-fixture protocol behavior and outside-file access attempts, not an order theorem'
        (root / 'obligation.md').write_text('Test the public custom-provider launch path with synthetic positive/negative protocol outputs and forbidden host-file attempts.\n')
        check = spec['checks'][0]
        positive = check['expected']
        negative = check['negative_controls'][0]['expected']
        positive_input = (root / check['input']).read_text()
        script = ('import json, sys\nfrom pathlib import Path\n'
                  'try: Path(' + repr(str(self.outside)) + ').read_bytes()\n'
                  'except OSError: pass\n'
                  'else: sys.exit(77)\n'
                  'try: Path(' + repr(str(self.outside) + '.forbidden-write') + ').write_text("only a private tmpfs shadow")\n'
                  'except OSError: pass\n'
                  'answer = ' + repr(positive) + ' if Path(sys.argv[1]).read_text() == ' + repr(positive_input)
                  + ' else ' + repr(negative) + '\nprint(json.dumps(answer))\n')
        (root / 'probe.py').write_text(script)
        check.update(executable='/usr/bin/python3', args=['-I', str(root / 'probe.py'), '{input}'], tool_files=['probe.py'])
        spec_path.write_text(json.dumps(spec))
        profile = cli('freeze', '--workspace', root)['profile']
        result = cli('run', '--workspace', root, '--profile', profile, '--trust-local-providers')
        self.assertEqual(result['status'], 'passed')
        self.assertEqual(self.outside.read_text(), 'outside secret')
        self.assertFalse(Path(str(self.outside) + '.forbidden-write').exists())
        self.assertEqual(result['containment']['persistent_writes'], 'selected-audit-workspace-only')


if __name__ == '__main__':
    unittest.main(verbosity=2)
