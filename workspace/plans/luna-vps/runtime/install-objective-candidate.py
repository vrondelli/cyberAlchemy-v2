#!/usr/bin/env python3
"""Install only the exact verified one-file runtime delta. Open questions: WORKSPACE-LAUNCH.md."""
import hashlib
import json
import os
from pathlib import Path
import pwd
import sys

stage = Path(sys.argv[1]).resolve()
sha = lambda data: hashlib.sha256(data).hexdigest()
data = (stage / 'MANIFEST.json').read_bytes(); manifest = json.loads(data)
base = Path('/srv/are-luna-pilot/candidates/04384954e710e58f')
assert os.geteuid() == 0
assert sha((base / 'MANIFEST.json').read_bytes()) == manifest['parent_manifest_sha256'] == '04384954e710e58fd4f965d7156eb67c306fab5168f1f19fd7c6946762671ff1'
old = {entry['path']: entry for entry in json.loads((base / 'MANIFEST.json').read_text())['files']}
new = {entry['path']: entry for entry in manifest['files']}
changed = 'cyberAlchemy-v2/implementation/agent-reasoning-engine/src/gateway-session-client.mjs'
assert set(old) == set(new) and manifest['changed_paths'] == [changed]
for name, entry in new.items():
    assert sha((base / name).read_bytes()) == old[name]['sha256'], name
    if name != changed: assert entry == old[name], name
assert sha((stage / 'gateway-session-client.mjs').read_bytes()) == new[changed]['sha256']
target = Path('/srv/are-luna-pilot/candidates') / sha(data)[:16]
target.mkdir(mode=0o750)
group = pwd.getpwnam('are-luna').pw_gid
for name in new:
    dest = target / name; dest.parent.mkdir(parents=True, exist_ok=True)
    if name == changed:
        dest.write_bytes((stage / 'gateway-session-client.mjs').read_bytes()); os.chown(dest, 0, group); os.chmod(dest, 0o640)
    else: os.link(base / name, dest)
(target / 'MANIFEST.json').write_bytes(data); os.chown(target / 'MANIFEST.json', 0, group); os.chmod(target / 'MANIFEST.json', 0o640)
for path in [target, *[p for p in target.rglob('*') if p.is_dir()]]: os.chown(path, 0, group); os.chmod(path, 0o750)
print(json.dumps(dict(status='PASS', remote=str(target), manifest_sha256=sha(data), changed_paths=[changed], original_candidate_unchanged=True,
    open_questions_ref='../runtime/WORKSPACE-LAUNCH.md#open-questions'), indent=2))
