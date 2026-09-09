#!/usr/bin/env python3
"""Install one fresh immutable RWO pilot; never reset prior state. Open questions: README.md."""
import hashlib
import json
import os
from pathlib import Path
import pwd
import re
import shutil
import socket
import subprocess
import sys

stage = Path(sys.argv[1]).resolve()
manifest = json.loads((stage / 'MANIFEST.json').read_text())
assert os.geteuid() == 0
remote = Path(manifest['remote'])
assert re.fullmatch(r'/srv/are-luna-pilot/rwo/[0-9a-f]{16}', str(remote))
expected_names = {'host.json', 'adapter.json', 'adapter.mjs', 'rwo-are-pilot-kernel', 'are-rwo-luna.service', 'are-rwo-workspace.service', 'install-deployment.py'}
assert set(manifest['files']) == expected_names
for name, expected in manifest['files'].items():
    assert hashlib.sha256((stage / name).read_bytes()).hexdigest() == expected, name
assert not remote.exists()
units = ['are-rwo-luna.service', 'are-rwo-workspace.service']
states = [Path('/var/lib/are-luna-pilot/rwo-host'), Path('/var/lib/are-luna-pilot/rwo-history')]
for path in states + [Path('/etc/systemd/system') / name for name in units]:
    assert not path.exists(), f'Existing target requires inspection: {path}'
assert Path('/run/cyberalchemy-orchestrator/openai_api_key').is_file()
with socket.socket() as probe:
    probe.bind(('127.0.0.1', 18082))
account = pwd.getpwnam('are-luna')
remote.mkdir(parents=True, mode=0o750)
os.chown(remote, 0, account.pw_gid)
for name in expected_names | {'MANIFEST.json'}:
    dest = remote / name
    shutil.copyfile(stage / name, dest)
    os.chown(dest, 0, account.pw_gid)
    os.chmod(dest, 0o750 if name == 'rwo-are-pilot-kernel' else 0o640)
for path in states:
    path.mkdir(mode=0o700)
    os.chown(path, account.pw_uid, account.pw_gid)
subprocess.run(['systemd-analyze', 'verify', *[str(remote / unit) for unit in units]], check=True)
subprocess.run(['systemd-run', '--unit=are-rwo-prepare', '--wait', '--pipe', '--collect',
    '-p', 'User=are-luna', '-p', 'Group=are-luna', '-p', 'RuntimeDirectory=are-rwo-luna', '-p', 'RuntimeDirectoryMode=0700',
    '-p', 'UMask=0077', '-p', 'NoNewPrivileges=true',
    '/srv/are-luna-pilot/candidates/04384954e710e58f/bin/node',
    '/srv/are-luna-pilot/launchers/22ddddd79b0f96af/pilot-host.mjs', str(remote / 'host.json'), '--prepare'], check=True)
for unit in units:
    shutil.copyfile(remote / unit, Path('/etc/systemd/system') / unit)
subprocess.run(['systemctl', 'daemon-reload'], check=True)
subprocess.run(['systemctl', 'enable', '--now', *units], check=True)
print(json.dumps({'status': 'INSTALLED', 'remote': str(remote), 'units': units,
                  'live_dispatch_performed': False, 'open_questions_ref': 'README.md#open-questions'}))
