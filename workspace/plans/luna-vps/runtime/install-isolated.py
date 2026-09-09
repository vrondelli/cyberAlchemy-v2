#!/usr/bin/env python3
"""Stage a verified fixture runtime, without a service. Open questions: ../HOST-PLAN.md."""
import argparse
import grp
import hashlib
import json
import os
from pathlib import Path
import pwd
import shutil
import subprocess

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('source', type=Path)
parser.add_argument('manifest_sha256')
parser.add_argument('--install', action='store_true', help='Create the isolated VPS paths and service identity')
args = parser.parse_args()
source = args.source.resolve()
manifest_bytes = (source / 'MANIFEST.json').read_bytes()
assert hashlib.sha256(manifest_bytes).hexdigest() == args.manifest_sha256, 'Manifest hash mismatch'
manifest = json.loads(manifest_bytes)
assert manifest['schema_version'] == 'are.vps-fixture-bundle/v1'
for item in manifest['files']:
    path = source / item['path']
    assert path.resolve().is_relative_to(source) and not path.is_symlink(), 'Unsafe source path'
    assert hashlib.sha256(path.read_bytes()).hexdigest() == item['sha256'], 'File hash mismatch: ' + item['path']
expected = {f['path'] for f in manifest['files']} | {'MANIFEST.json', 'SHA256SUMS'}
assert {str(p.relative_to(source)) for p in source.rglob('*') if p.is_file()} == expected, 'Unexpected bundle files'
assert not any(p.is_symlink() for p in source.rglob('*')), 'Symlink in bundle'
target = Path('/srv/are-luna-pilot')
home = Path('/var/lib/are-luna-pilot')
candidate = target / 'candidates' / args.manifest_sha256[:16]
if not args.install:
    print(json.dumps({'status': 'PASS', 'files_verified': len(manifest['files']), 'target': str(candidate), 'effects': 'none'}))
else:
    assert os.geteuid() == 0, 'Root installation required'
    assert not target.exists() and not home.exists(), 'Installation target already exists; inspect before replacing'
    for database in [pwd.getpwnam, grp.getgrnam]:
        try:
            database('are-luna')
        except KeyError:
            pass
        else:
            raise RuntimeError('are-luna identity already exists; inspect before reuse')
    subprocess.run(['groupadd', '--system', 'are-luna'], check=True)
    subprocess.run(['useradd', '--system', '--gid', 'are-luna', '--home-dir', str(home),
                    '--create-home', '--shell', '/usr/sbin/nologin', 'are-luna'], check=True)
    identity = pwd.getpwnam('are-luna')
    home.chmod(0o700)
    candidate.parent.mkdir(parents=True)
    shutil.copytree(source, candidate)
    for path in [target, *target.rglob('*')]:
        os.chown(path, 0, identity.pw_gid)
        path.chmod(0o750 if path.is_dir() or path in [candidate / 'bin/node', candidate / 'bin/codex'] else 0o640)
    receipt = {'schema_version': 'are.vps-isolated-runtime-install/v1', 'status': 'STAGED',
               'candidate': str(candidate), 'manifest_sha256': args.manifest_sha256,
               'service_user': 'are-luna', 'home': str(home), 'service_activated': False,
               'credentials_installed': False, 'public_ports': [], 'authority_effect': 'none',
               'open_questions_ref': 'workspace/plans/luna-vps/HOST-PLAN.md#open-questions'}
    (target / 'installation.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps(receipt))
