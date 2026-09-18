#!/usr/bin/env python3
"""Make the eight Round 53 pinned commits locally cloneable."""
import hashlib, json, subprocess, sys, tempfile, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ROUND = int(sys.argv[1]) if len(sys.argv) > 1 else 53
SELECTION = json.loads((ROOT / f'round{ROUND}-task-selection.json').read_text())
CACHE_ROOT = Path('/home/vrondelli/.local/share/are/contextbench-retained-v1/contextbench-confirmation-repositories-v1')

def run(args, **kwargs):
    return subprocess.run(args, text=True, capture_output=True, check=False, **kwargs)

def size(path):
    return sum(p.stat().st_size for p in path.rglob('*') if p.is_file()) if path.exists() else 0

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
        raise RuntimeError('repository-identity:' + url)
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
        raise RuntimeError('missing-commit:' + task['instance_id'])
    anchor = f'are-round{ROUND}-' + commit[:12]
    if run(['git', '-C', str(cache), 'branch', '-f', anchor, commit]).returncode:
        raise RuntimeError('anchor:' + task['instance_id'])
    anchor_ref = 'refs/heads/' + anchor
    refs = run(['git', '-C', str(cache), 'for-each-ref', '--format=%(refname)', 'refs/heads', 'refs/remotes', 'refs/tags'])
    for ref in refs.stdout.splitlines():
        if not ref.startswith('refs/heads/are-round'):
            run(['git', '-C', str(cache), 'update-ref', '-d', ref])
    run(['git', '-C', str(cache), 'symbolic-ref', 'HEAD', anchor_ref])
    def transfer_ok():
        with tempfile.TemporaryDirectory(prefix='are-r53-transfer-') as temp:
            clone = Path(temp) / 'repo'
            copied = run(['git', 'clone', '--no-local', '--no-checkout', '--', str(cache), str(clone)], timeout=300)
            return copied.returncode == 0 and run(['git', '-C', str(clone), 'cat-file', '-e', commit + '^{commit}']).returncode == 0
    transfer = transfer_ok()
    hydration = None
    if not transfer:
        started = time.monotonic()
        result = run(['git', '-C', str(cache), 'fetch', '--no-tags', '--depth=1', '--refetch', '--no-filter', 'origin', commit], timeout=300)
        hydration = {'returncode': result.returncode, 'elapsed_seconds': round(time.monotonic() - started, 3), 'stderr_tail': result.stderr[-2000:]}
        if result.returncode:
            raise RuntimeError('hydrate:' + task['instance_id'])
        run(['git', '-C', str(cache), 'branch', '-f', anchor, commit])
        transfer = transfer_ok()
    if not transfer:
        raise RuntimeError('clone-transfer:' + task['instance_id'])
    after = size(cache)
    rows.append({'instance_id': task['instance_id'], 'repo_url': url, 'base_commit': commit, 'cache_path': str(cache),
                 'status': 'commit-present', 'commit_tree': tree.stdout.strip(), 'anchored_ref': anchor_ref,
                 'clone_transfer_verified': True, 'present_before': present, 'bytes_before': before,
                 'bytes_after': after, 'bytes_added': after - before, 'fetch': fetch, 'hydration': hydration})

artifact = {'schema_version': 'are.contextbench-repository-inventory/v1', 'status': 'ready',
            'policy': 'Retained per-repository caches with exact pinned commits and verified unrestricted local transfer.',
            'repositories': rows, 'bytes_added': sum(row['bytes_added'] for row in rows),
            'model_calls': 0, 'authority_effect': 'none',
            'open_questions': ['Will every source tree reconstruct during independent confirmation?']}
(ROOT / f'round{ROUND}-repository-inventory.json').write_text(json.dumps(artifact, indent=2) + '\n')
print(json.dumps({'repositories': len(rows), 'bytes_added': artifact['bytes_added'], 'all_transfer_verified': True}))
