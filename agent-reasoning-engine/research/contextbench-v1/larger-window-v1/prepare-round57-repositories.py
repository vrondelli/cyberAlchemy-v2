#!/usr/bin/env python3
"""Bind locally transferable repositories for the Round 57 cohort."""
import hashlib
import json
import subprocess
import tempfile
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
SELECTION = json.loads((HERE / 'round57-task-selection.json').read_text())
CACHE_ROOT = Path.home() / '.local/share/are/contextbench-retained-v1/contextbench-confirmation-repositories-v1'

def run(args, **kwargs):
    return subprocess.run(args, text=True, capture_output=True, check=False, **kwargs)

def size(path):
    return sum(item.stat().st_size for item in path.rglob('*') if item.is_file()) if path.exists() else 0

CACHE_ROOT.mkdir(parents=True, exist_ok=True)
rows = []
for task in SELECTION['tasks']:
    url, commit = task['repo_url'], task['base_commit']
    cache = CACHE_ROOT / hashlib.sha256(url.encode()).hexdigest()[:20]
    if not cache.exists():
        result = run(['git', 'clone', '--filter=blob:none', '--no-checkout', '--', url, str(cache)], timeout=300)
        if result.returncode:
            raise RuntimeError(f'clone {url}: {result.stderr[-2000:]}')
    remote = run(['git', '-C', str(cache), 'remote', 'get-url', 'origin'])
    if remote.returncode or remote.stdout.strip() != url:
        raise RuntimeError('round57.repository-identity:' + url)
    before = size(cache)
    present = run(['git', '-C', str(cache), 'cat-file', '-e', commit + '^{commit}']).returncode == 0
    fetch = None
    if not present:
        started = time.monotonic()
        result = run(['git', '-C', str(cache), 'fetch', '--no-tags', 'origin', commit], timeout=300)
        fetch = {'returncode': result.returncode, 'elapsed_seconds': round(time.monotonic() - started, 3), 'stderr_tail': result.stderr[-2000:]}
        if result.returncode:
            raise RuntimeError(f'fetch {url}@{commit}: {result.stderr[-2000:]}')
    tree = run(['git', '-C', str(cache), 'rev-parse', commit + '^{tree}'])
    if tree.returncode:
        raise RuntimeError('round57.missing-commit:' + task['instance_id'])
    anchor = 'are-round57-' + commit[:12]
    if run(['git', '-C', str(cache), 'update-ref', 'refs/heads/' + anchor, commit]).returncode:
        raise RuntimeError('round57.anchor:' + task['instance_id'])
    refs = run(['git', '-C', str(cache), 'for-each-ref', '--format=%(refname)', 'refs/heads', 'refs/remotes', 'refs/tags'])
    for ref in refs.stdout.splitlines():
        if ref != 'refs/heads/' + anchor:
            run(['git', '-C', str(cache), 'update-ref', '-d', ref])
    run(['git', '-C', str(cache), 'symbolic-ref', 'HEAD', 'refs/heads/' + anchor])
    with tempfile.TemporaryDirectory(prefix='are-round57-transfer-') as temporary:
        clone = Path(temporary) / 'repo'
        copied = run(['git', 'clone', '--no-local', '--no-checkout', '--', str(cache), str(clone)], timeout=300)
        transfer = copied.returncode == 0 and run(['git', '-C', str(clone), 'cat-file', '-e', commit + '^{commit}']).returncode == 0
    hydration = None
    if not transfer:
        started = time.monotonic()
        result = run(['git', '-C', str(cache), 'fetch', '--no-tags', '--depth=1', '--refetch', '--no-filter', 'origin', commit], timeout=300)
        hydration = {'returncode': result.returncode, 'elapsed_seconds': round(time.monotonic() - started, 3), 'stderr_tail': result.stderr[-2000:]}
        if result.returncode:
            raise RuntimeError('round57.hydrate:' + task['instance_id'])
        run(['git', '-C', str(cache), 'update-ref', 'refs/heads/' + anchor, commit])
        with tempfile.TemporaryDirectory(prefix='are-round57-transfer-') as temporary:
            clone = Path(temporary) / 'repo'
            copied = run(['git', 'clone', '--no-local', '--no-checkout', '--', str(cache), str(clone)], timeout=300)
            transfer = copied.returncode == 0 and run(['git', '-C', str(clone), 'cat-file', '-e', commit + '^{commit}']).returncode == 0
    if not transfer:
        raise RuntimeError('round57.clone-transfer:' + task['instance_id'])
    after = size(cache)
    rows.append({'instance_id': task['instance_id'], 'repo_url': url, 'base_commit': commit, 'cache_path': str(cache), 'status': 'commit-present', 'commit_tree': tree.stdout.strip(), 'anchored_ref': 'refs/heads/' + anchor, 'clone_transfer_verified': True, 'present_before': present, 'bytes_before': before, 'bytes_after': after, 'bytes_added': after - before, 'fetch': fetch, 'hydration': hydration})

artifact = {
    'schema_version': 'are.contextbench-repository-inventory/v1',
    'status': 'ready',
    'policy': 'Retained content-addressed repository caches with one Round 57 anchor and verified unrestricted local transfer.',
    'repositories': rows,
    'bytes_added': sum(row['bytes_added'] for row in rows),
    'model_calls': 0,
    'authority_effect': 'none',
    'open_questions_ref': 'PLAN.md#open-questions',
}
(HERE / 'round57-repository-inventory.json').write_text(json.dumps(artifact, indent=2) + '\n')
print(json.dumps({'repositories': len(rows), 'bytes_added': artifact['bytes_added'], 'all_transfer_verified': True}))
