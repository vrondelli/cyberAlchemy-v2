#!/usr/bin/env python3
"""Execute one fresh staged text task and stop its transient host. Open questions: TASKS.md."""
import hashlib
import json
import os
from pathlib import Path
import pwd
import re
import shutil
import subprocess
import sys
import time

stage = Path(sys.argv[1]).resolve()
m = json.loads((stage / 'MANIFEST.json').read_text())
assert os.geteuid() == 0
assert re.fullmatch(r'/srv/are-luna-pilot/tasks/[a-f0-9]{16}', m['remote'])
ident = Path(m['remote']).name
assert m['state'] == f'/var/lib/are-luna-pilot/tasks/{ident}'
assert m['runtime'] == f'/run/are-text-{ident}'
expected = {'pilot-host.mjs', 'task-host.mjs', 'task-contract.mjs', 'run-task-vps.py', 'rwo/adapter.mjs', 'rwo/task-adapter.mjs', 'rwo/rwo-are-pilot-kernel', 'host.json', 'adapter.json'}
assert set(m['files']) == expected
for name, digest in m['files'].items():
    assert hashlib.sha256((stage / name).read_bytes()).hexdigest() == digest, name
remote, state = Path(m['remote']), Path(m['state'])
assert not remote.exists() and not state.exists(), 'Existing task requires inspection; never reset or retry'
account = pwd.getpwnam('are-luna')
remote.mkdir(parents=True, mode=0o750)
for name in expected | {'MANIFEST.json'}:
    dest = remote / name
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(stage / name, dest)
    os.chown(dest, 0, account.pw_gid)
    os.chmod(dest, 0o750 if name.endswith('rwo-are-pilot-kernel') else 0o640)
for path in [remote, remote / 'rwo']:
    os.chown(path, 0, account.pw_gid); os.chmod(path, 0o750)
state.mkdir(parents=True, mode=0o700)
os.chown(state, account.pw_uid, account.pw_gid)
node = '/srv/are-luna-pilot/candidates/04384954e710e58f/bin/node'
unit = f'are-text-{ident}'
properties = ['-p', 'User=are-luna', '-p', 'Group=are-luna', '-p', f'RuntimeDirectory={unit}', '-p', 'RuntimeDirectoryMode=0700',
    '-p', 'UMask=0077', '-p', 'NoNewPrivileges=true', '-p', 'PrivateTmp=true', '-p', 'ProtectSystem=strict', '-p', 'ProtectHome=true',
    '-p', f'ReadWritePaths={state} {m["runtime"]}', '-p', 'Restart=no', '-p', 'KillMode=control-group']
def run(args, **kwargs):
    return subprocess.run(args, text=True, capture_output=True, check=True, **kwargs).stdout
def control_status():
    return json.loads(run(['runuser', '-u', 'are-luna', '--', node,
        '/srv/are-luna-pilot/launchers/22ddddd79b0f96af/pilot-control.mjs', m['runtime'] + '/control.sock', 'status'], timeout=5))
run(['systemd-run', '--wait', '--pipe', '--collect', '--unit=' + unit + '-prepare', *properties,
    node, str(remote / 'task-host.mjs'), str(remote / 'host.json'), '--prepare'], timeout=90)
run(['systemd-run', '--collect', '--unit=' + unit, *properties, '-p', 'LoadCredential=openai-api-key:/run/cyberalchemy-orchestrator/openai_api_key',
    node, str(remote / 'task-host.mjs'), str(remote / 'host.json')], timeout=10)
try:
    for _ in range(40):
        try:
            status = control_status()
            if status['ok'] and status['result']['ready']: break
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired, ValueError): pass
        time.sleep(.25)
    else: raise RuntimeError('Task host readiness failed; inspect before retry')
    assert status['result']['attempt'] is None
    command = ['runuser', '-u', 'are-luna', '--', node, str(remote / 'rwo/task-adapter.mjs'), str(remote / 'adapter.json')]
    result = json.loads(run(command + ['run'], timeout=110))
    assert result['history']['status'] == 'succeeded'
    assert result['history']['result']['task_digest'] == m['task_digest']
    run(['systemctl', 'stop', unit], timeout=20)
    replay = json.loads(run(command + ['run'], timeout=10))
    assert replay['replay'] and replay['new_provider_calls'] == 0
    projection = json.loads(run(command + ['verify'], timeout=10))
    print(json.dumps(dict(status='PASS', result=result, offline_replay=True, replay_provider_calls=0,
        transient_host_stopped=True, projection=projection, remote=str(remote), state=str(state),
        open_questions_ref='../runtime/TASKS.md#open-questions'), indent=2))
finally:
    subprocess.run(['systemctl', 'stop', unit], capture_output=True)
