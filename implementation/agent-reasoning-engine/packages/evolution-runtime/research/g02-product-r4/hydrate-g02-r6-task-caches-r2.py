#!/usr/bin/env python3
"""Hydrate each tip tree before building offline-cloneable shallow task caches."""

import hashlib
import json
import shutil
import subprocess
import time
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime/g02-r6-mixed-source-candidate-r1')
CANDIDATE = BASE / 'CANDIDATE.json'
OUTPUT = BASE / 'TASK-CACHE-HYDRATION-R2.json'
CANDIDATE_SHA = '6c35ecec67bd0fd7b447c957c497a7465a317f690f4fab36afaad183594e28a3'
CACHE_ROOT = Path('/tmp/are-g02-r6-mixed-source-caches-r1/cache')
SMOKE_ROOT = Path('/tmp/are-g02-r6-shallow-cache-smoke-r2')
MATERIALIZE_ROOT = Path('/tmp/are-g02-r6-tip-materialize-r2')
IMAGE = 'sha256:6406e582e89acd60a59294144bfb526aa9ee1687273a7e475b68906705426385'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def run(*args, timeout=300):
    return subprocess.run(args, capture_output=True, text=True, timeout=timeout)


def need(condition, reason):
    if not condition:
        raise ValueError('g02-r6-task-cache-r2.' + reason)


def main():
    need(not OUTPUT.exists() and sha(CANDIDATE) == CANDIDATE_SHA and
         CACHE_ROOT.is_dir() and not SMOKE_ROOT.exists() and
         not MATERIALIZE_ROOT.exists(), 'input-or-scratch-drift')
    rows = [row for row in json.loads(CANDIDATE.read_text())['ordered_tasks']
            if row['repo'] in ('django/django', 'sveltejs/svelte')]
    need(len(rows) == 12, 'task-count')
    names = [(('django' if row['repo'] == 'django/django' else 'svelte') +
              '-' + row['base_commit'][:8]) for row in rows]
    need(len(names) == len(set(names)), 'short-sha-collision')
    SMOKE_ROOT.mkdir(mode=0o700)
    MATERIALIZE_ROOT.mkdir(mode=0o700)
    results = []
    for row, leaf in zip(rows, names):
        name = 'django' if row['repo'] == 'django/django' else 'svelte'
        parent = CACHE_ROOT / name
        target = CACHE_ROOT / leaf
        commit = row['base_commit']
        ref = 'are-g02-r6-' + commit[:8]
        origin = run('git', '-C', str(parent), 'remote', 'get-url', 'origin')
        need(origin.returncode == 0 and origin.stdout.strip() == row['repo_url'],
             'origin:' + str(row['ordinal']))
        updated = run('git', '-C', str(parent), 'update-ref', 'refs/heads/' + ref, commit)
        need(updated.returncode == 0, 'ref:' + str(row['ordinal']))
        materialized = MATERIALIZE_ROOT / leaf
        need(not materialized.exists(), 'materialize-collision:' + leaf)
        checked = run('git', '--git-dir=' + str(parent), 'worktree', 'add', '--detach',
                      str(materialized), commit)
        need(checked.returncode == 0, 'materialize:' + str(row['ordinal']) +
             ':' + checked.stderr[-300:])
        removed = run('git', '--git-dir=' + str(parent), 'worktree', 'remove',
                      str(materialized))
        need(removed.returncode == 0 and not materialized.exists(),
             'materialize-cleanup:' + str(row['ordinal']))
        if not target.exists():
            cloned = run('git', 'clone', '--bare', '--no-local', '--depth', '1',
                         '--single-branch', '--branch', ref, str(parent), str(target))
            need(cloned.returncode == 0, 'shallow-clone:' + str(row['ordinal']) +
                 ':' + cloned.stderr[-300:])
        changed = run('git', '-C', str(target), 'remote', 'set-url', 'origin', row['repo_url'])
        exact = run('git', '-C', str(target), 'rev-parse', '--verify', commit + '^{commit}')
        shallow = run('git', '-C', str(target), 'rev-parse', '--is-shallow-repository')
        need(changed.returncode == 0 and exact.returncode == 0 and
             exact.stdout.strip() == commit and shallow.returncode == 0 and
             shallow.stdout.strip() == 'true', 'cache-shape:' + str(row['ordinal']))
        checkout = SMOKE_ROOT / leaf
        need(not checkout.exists(), 'smoke-collision:' + leaf)
        command = ('git clone --no-local --no-checkout /cache/' + leaf +
                   ' /out/' + leaf + ' && git -C /out/' + leaf +
                   ' checkout --detach ' + commit)
        started = time.monotonic()
        smoked = run('docker', 'run', '--rm', '--network', 'none', '--memory', '1g',
                     '--cpus', '1', '-v', str(CACHE_ROOT) + ':/cache:ro',
                     '-v', str(SMOKE_ROOT) + ':/out', IMAGE, 'sh', '-c', command)
        need(smoked.returncode == 0, 'offline-checkout:' + str(row['ordinal']) +
             ':' + smoked.stderr[-300:])
        head = run('git', '-C', str(checkout), 'rev-parse', 'HEAD')
        need(head.returncode == 0 and head.stdout.strip() == commit,
             'offline-head:' + str(row['ordinal']))
        seconds = round(time.monotonic() - started, 3)
        shutil.rmtree(checkout)
        results.append({'ordinal': row['ordinal'], 'instance_id': row['instance_id'],
                        'repo': row['repo'], 'base_commit': commit,
                        'cache_leaf': leaf, 'cache_path': str(target),
                        'origin_match': True, 'shallow': True,
                        'offline_container_checkout': True,
                        'offline_checkout_seconds': seconds})
        print(json.dumps({'ordinal': row['ordinal'], 'cache_leaf': leaf,
                          'offline_checkout': 'passed'}), flush=True)
    SMOKE_ROOT.rmdir()
    MATERIALIZE_ROOT.rmdir()
    payload = {'schema_version': 'are.g02-r6-task-cache-hydration/v2',
               'posture': 'source-only-no-gold-no-model',
               'candidate_sha256': CANDIDATE_SHA, 'script_sha256': sha(__file__),
               'failed_predecessor': 'hydrate-g02-r6-task-caches-r1.py stopped at ordinal 7 before receipt; first two offline tests passed',
               'container_image': IMAGE, 'network_during_smoke': 'none',
               'memory_limit': '1g', 'verified_count': len(results), 'results': results,
               'claim_ceiling': 'Exact-commit offline cache check only; no benchmark or native eligibility result.',
               'open_questions': ['Will complete 24-task native eligibility and full arm resource preflight pass?']}
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': '12-offline-task-caches-verified', 'sha256': sha(OUTPUT)}))


if __name__ == '__main__':
    main()
