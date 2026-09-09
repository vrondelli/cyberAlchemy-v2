#!/usr/bin/env python3
"""Derive an exact one-file candidate; preserve the original bundle. Open questions: WORKSPACE-LAUNCH.md."""
import hashlib
import json
import os
from pathlib import Path
import shutil
import sys

source, target = map(lambda value: Path(value).resolve(), sys.argv[1:3])
here = Path(__file__).resolve().parent
manifest_bytes = (source / 'MANIFEST.json').read_bytes()
sha = lambda data: hashlib.sha256(data).hexdigest()
assert sha(manifest_bytes) == '04384954e710e58fd4f965d7156eb67c306fab5168f1f19fd7c6946762671ff1'
original = json.loads(manifest_bytes)
changed = 'cyberAlchemy-v2/implementation/agent-reasoning-engine/src/gateway-session-client.mjs'
replacement = here.parents[3] / 'implementation/agent-reasoning-engine/src/gateway-session-client.mjs'
target.mkdir(mode=0o750)
files = []
for entry in original['files']:
    old = source / entry['path']
    assert sha(old.read_bytes()) == entry['sha256'], entry['path']
    dest = target / entry['path']; dest.parent.mkdir(parents=True, exist_ok=True)
    if entry['path'] == changed: shutil.copyfile(replacement, dest)
    else: os.link(old, dest)
    files.append(dict(path=entry['path'], sha256=sha(dest.read_bytes()), bytes=dest.stat().st_size))
manifest = dict(schema_version='are.vps-bound-task-bundle/v1', authority_effect='none',
    scope='Exact parent bundle plus host-owned hook decision binding; candidate only',
    parent_manifest_sha256=sha(manifest_bytes), parent_product_closure_digest=original['product_closure_digest'],
    changed_paths=[changed], files=files, open_questions_ref='workspace/plans/luna-vps/runtime/WORKSPACE-LAUNCH.md#open-questions')
(target / 'MANIFEST.json').write_text(json.dumps(manifest, indent=2) + '\n')
digest = sha((target / 'MANIFEST.json').read_bytes())
print(json.dumps(dict(manifest_sha256=digest, remote=f'/srv/are-luna-pilot/candidates/{digest[:16]}',
    local=str(target), changed_path=changed, source_sha256=sha(replacement.read_bytes()),
    authority_effect='none', open_questions_ref='../runtime/WORKSPACE-LAUNCH.md#open-questions'), indent=2))
