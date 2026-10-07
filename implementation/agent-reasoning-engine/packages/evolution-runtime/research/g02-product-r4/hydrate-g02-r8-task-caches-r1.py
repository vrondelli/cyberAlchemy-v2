#!/usr/bin/env python3
"""Build 24 exact-tip caches and verify offline container source checkout."""

import hashlib
import json
import shutil
import subprocess
import time
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
ROOT = BASE / 'g02-r8-screening-pool-r1'
CANDIDATE = ROOT / 'CANDIDATE.json'
PARENT_RECEIPT = ROOT / 'PARENT-CACHE-HYDRATION.json'
OUTPUT = ROOT / 'TASK-CACHE-HYDRATION.json'
CANDIDATE_SHA = 'da2c3e68c1f62da2198bfbf89c598029af898ea7cacc523f516009e9fa307196'
PARENT_SHA = 'c63ce053319d3f5fe7d77fe5c13d2fbe68d93aa0de653147700ac6d951ce7f42'
CACHE_ROOT = Path('/tmp/are-g02-r8-source-caches-r1/cache')
SMOKE_ROOT = Path('/tmp/are-g02-r8-task-cache-smoke-r1')
MATERIALIZE_ROOT = Path('/tmp/are-g02-r8-tip-materialize-r1')
IMAGE = 'sha256:6406e582e89acd60a59294144bfb526aa9ee1687273a7e475b68906705426385'
PREFIX = {'ansible/ansible': 'ansible', 'django/django': 'django',
          'astropy/astropy': 'astropy', 'sveltejs/svelte': 'svelte'}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def run(*args, timeout=300):
    return subprocess.run(args, capture_output=True, text=True, timeout=timeout)


def need(value, reason):
    if not value:
        raise ValueError('g02-r8-task-cache.' + reason)


def main():
    need(not OUTPUT.exists() and not SMOKE_ROOT.exists() and
         not MATERIALIZE_ROOT.exists() and CACHE_ROOT.is_dir() and
         sha(CANDIDATE) == CANDIDATE_SHA and sha(PARENT_RECEIPT) == PARENT_SHA,
         'input-or-scratch-drift')
    tasks = json.loads(CANDIDATE.read_text())['ordered_tasks']
    parent_rows = json.loads(PARENT_RECEIPT.read_text())['results']
    parents = {row['ordinal']: row for row in parent_rows}
    need(len(tasks) == len(parents) == 24, 'denominator')
    leaves = [PREFIX[row['repo']] + '-' + row['base_commit'][:8] for row in tasks]
    need(len(leaves) == len(set(leaves)), 'short-sha-collision')
    SMOKE_ROOT.mkdir(mode=0o700)
    MATERIALIZE_ROOT.mkdir(mode=0o700)
    results = []
    for task, leaf in zip(tasks, leaves):
        ordinal = task['ordinal']
        parent = Path(parents[ordinal]['parent_cache'])
        commit = task['base_commit']
        need(parents[ordinal]['repo'] == task['repo'] and
             parents[ordinal]['base_commit'] == commit and
             parents[ordinal]['exact_commit_available'],
             'parent-binding:' + str(ordinal))
        need(shutil.disk_usage('/tmp').free >= 2 * 1024**3,
             'scratch-reserve:' + str(ordinal))
        origin = run('git', '-C', str(parent), 'remote', 'get-url', 'origin')
        need(origin.returncode == 0 and origin.stdout.strip() == task['repo_url'],
             'parent-origin:' + str(ordinal))
        materialized = MATERIALIZE_ROOT / leaf
        target = CACHE_ROOT / leaf
        need(not materialized.exists() and not target.exists(),
             'target-collision:' + str(ordinal))
        checked = run('git', '-C', str(parent), 'worktree', 'add', '--detach',
                      str(materialized), commit)
        need(checked.returncode == 0, 'materialize:' + str(ordinal) +
             ':' + checked.stderr[-300:])
        removed = run('git', '-C', str(parent), 'worktree', 'remove', str(materialized))
        need(removed.returncode == 0 and not materialized.exists(),
             'materialize-cleanup:' + str(ordinal))
        ref = 'are-g02-r8-' + commit[:8]
        cloned = run('git', 'clone', '--bare', '--no-local', '--depth', '1',
                     '--single-branch', '--branch', ref, str(parent), str(target))
        need(cloned.returncode == 0, 'shallow-clone:' + str(ordinal) +
             ':' + cloned.stderr[-300:])
        changed = run('git', '-C', str(target), 'remote', 'set-url', 'origin', task['repo_url'])
        exact = run('git', '-C', str(target), 'rev-parse', '--verify', commit + '^{commit}')
        shallow = run('git', '-C', str(target), 'rev-parse', '--is-shallow-repository')
        need(changed.returncode == 0 and exact.returncode == 0 and
             exact.stdout.strip() == commit and shallow.returncode == 0 and
             shallow.stdout.strip() == 'true', 'cache-shape:' + str(ordinal))
        checkout = SMOKE_ROOT / leaf
        command = ('git clone --no-local --no-checkout /cache/' + leaf +
                   ' /out/' + leaf + ' && git -C /out/' + leaf +
                   ' checkout --detach ' + commit)
        started = time.monotonic()
        smoked = run('docker', 'run', '--rm', '--network', 'none', '--memory', '1g',
                     '--cpus', '1', '-v', str(CACHE_ROOT) + ':/cache:ro',
                     '-v', str(SMOKE_ROOT) + ':/out', IMAGE, 'sh', '-c', command)
        need(smoked.returncode == 0, 'offline-checkout:' + str(ordinal) +
             ':' + smoked.stderr[-300:])
        head = run('git', '-C', str(checkout), 'rev-parse', 'HEAD')
        need(head.returncode == 0 and head.stdout.strip() == commit,
             'offline-head:' + str(ordinal))
        seconds = round(time.monotonic() - started, 3)
        shutil.rmtree(checkout)
        results.append({'ordinal': ordinal, 'instance_id': task['instance_id'],
                        'repo': task['repo'], 'base_commit': commit,
                        'cache_leaf': leaf, 'cache_path': str(target),
                        'origin_match': True, 'shallow': True,
                        'offline_container_checkout': True,
                        'offline_checkout_seconds': seconds})
        print(json.dumps({'ordinal': ordinal, 'cache_leaf': leaf,
                          'offline_checkout': 'passed'}), flush=True)
    SMOKE_ROOT.rmdir()
    MATERIALIZE_ROOT.rmdir()
    payload = {'schema_version': 'are.g02-r8-task-cache-hydration/v1',
               'posture': 'source-only-no-gold-path-no-score-no-model',
               'candidate_sha256': CANDIDATE_SHA,
               'parent_hydration_sha256': PARENT_SHA, 'script_sha256': sha(__file__),
               'container_image': IMAGE, 'network_during_smoke': 'none',
               'memory_limit': '1g', 'verified_count': len(results), 'results': results,
               'claim_ceiling': 'Offline exact-commit cache qualification only; no model, score or superiority.',
               'open_questions': ['Do all 24 fixed 64 MiB source indexes build?',
                                  'Will whole-arm memory and matched reliability pass?']}
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': '24-offline-task-caches-verified',
                      'sha256': sha(OUTPUT)}))


if __name__ == '__main__':
    main()
