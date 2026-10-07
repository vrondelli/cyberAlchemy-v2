#!/usr/bin/env python3
"""Reuse 23 immutable r8 task caches by hardlink; package one new Ansible tip."""

import hashlib
import json
import os
import shutil
import subprocess
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
R8 = BASE / 'g02-r8-screening-pool-r1'
ROOT = BASE / 'g02-r9-source-successor-r1'
CANDIDATE = ROOT / 'CANDIDATE.json'
OUTPUT = ROOT / 'TASK-CACHE-HYDRATION.json'
CACHE = Path('/tmp/are-g02-r9-source-caches-r1/cache')
OLD_CACHE = Path('/tmp/are-g02-r8-source-caches-r1/cache')
PARENT = Path('/opt/are-harness-benchmark/g02-fresh-pair-r4-preflight-20260929/cache/ansible')
MATERIALIZE = Path('/tmp/are-g02-r9-tip-materialize-r1')
SMOKE = Path('/tmp/are-g02-r9-task-smoke-r1')
IMAGE = 'sha256:6406e582e89acd60a59294144bfb526aa9ee1687273a7e475b68906705426385'
CANDIDATE_SHA = '87527bcef71cdd6d4b99fd008b67379a846f592798e8e658d1ec27cf13ef9c10'
R8_HYDRATION_SHA = '3c1aa620dbc84c75e3e17fb09b8456ca8c7c25e93cc47e4fe20af2c22f4ef893'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def run(*args, timeout=300):
    return subprocess.run(args, capture_output=True, text=True, timeout=timeout)


def need(value, reason):
    if not value:
        raise ValueError('g02-r9-task-caches.' + reason)


def main():
    need(not OUTPUT.exists() and not CACHE.parent.exists() and
         not MATERIALIZE.exists() and not SMOKE.exists() and
         sha(CANDIDATE) == CANDIDATE_SHA and
         sha(R8 / 'TASK-CACHE-HYDRATION.json') == R8_HYDRATION_SHA and
         shutil.disk_usage('/tmp').free >= 2 * 1024**3,
         'input-or-space-drift')
    tasks = json.loads(CANDIDATE.read_text())['ordered_tasks']
    previous = {row['instance_id']: row for row in
                json.loads((R8 / 'TASK-CACHE-HYDRATION.json').read_text())['results']}
    need(len(tasks) == 24 and len(previous) == 24 and
         tasks[0]['repo'] == 'ansible/ansible' and
         tasks[0]['instance_id'] not in previous,
         'candidate-shape')
    CACHE.mkdir(parents=True, mode=0o755)
    MATERIALIZE.mkdir(mode=0o700)
    SMOKE.mkdir(mode=0o700)
    rows = []
    for task in tasks:
        ordinal = task['ordinal']
        commit = task['base_commit']
        if ordinal == 1:
            leaf = 'ansible-' + commit[:8]
            target = CACHE / leaf
            need(not target.exists() and
                 run('git', '-C', str(PARENT), 'cat-file', '-e',
                     commit + '^{commit}').returncode == 0,
                 'replacement-parent')
            work = MATERIALIZE / leaf
            materialized = run('git', '-C', str(PARENT), 'worktree', 'add',
                               '--detach', str(work), commit, timeout=600)
            need(materialized.returncode == 0,
                 'replacement-materialize:' + materialized.stderr[-300:])
            removed = run('git', '-C', str(PARENT), 'worktree', 'remove', str(work))
            need(removed.returncode == 0 and not work.exists(),
                 'replacement-worktree-cleanup')
            ref = 'are-g02-r9-' + commit[:8]
            need(run('git', '-C', str(PARENT), 'update-ref',
                     'refs/heads/' + ref, commit).returncode == 0,
                 'replacement-ref')
            cloned = run('git', 'clone', '--bare', '--no-local', '--depth', '1',
                         '--single-branch', '--branch', ref,
                         str(PARENT), str(target), timeout=600)
            need(cloned.returncode == 0,
                 'replacement-clone:' + cloned.stderr[-300:])
            need(run('git', '-C', str(target), 'remote', 'set-url', 'origin',
                     task['repo_url']).returncode == 0,
                 'replacement-origin')
            disposition = 'new-exact-tip-shallow-cache'
        else:
            prior = previous[task['instance_id']]
            leaf = prior['cache_leaf']
            target = CACHE / leaf
            need(prior['repo'] == task['repo'] and
                 prior['base_commit'] == commit and
                 prior['offline_container_checkout'] is True and
                 not target.exists(), 'reuse-binding:' + str(ordinal))
            shutil.copytree(OLD_CACHE / leaf, target,
                            copy_function=os.link, symlinks=True)
            disposition = 'hardlinked-immutable-r8-cache'
        origin = run('git', '-C', str(target), 'remote', 'get-url', 'origin')
        exact = run('git', '-C', str(target), 'rev-parse', '--verify',
                    commit + '^{commit}')
        shallow = run('git', '-C', str(target), 'rev-parse', '--is-shallow-repository')
        need(origin.returncode == 0 and origin.stdout.strip() == task['repo_url'] and
             exact.returncode == 0 and exact.stdout.strip() == commit and
             shallow.returncode == 0 and shallow.stdout.strip() == 'true',
             'exact-cache:' + str(ordinal))
        if ordinal == 1:
            command = ('git clone --no-local --no-checkout /cache/' + leaf +
                       ' /out/work && git -C /out/work checkout --detach ' + commit)
            smoke = run('docker', 'run', '--rm', '--network', 'none',
                        '--memory', '1g', '--cpus', '1',
                        '-v', str(CACHE) + ':/cache:ro',
                        '-v', str(SMOKE) + ':/out', IMAGE, 'sh', '-c', command,
                        timeout=300)
            need(smoke.returncode == 0,
                 'replacement-offline-smoke:' + smoke.stderr[-300:])
            head = run('git', '-C', str(SMOKE / 'work'), 'rev-parse', 'HEAD')
            need(head.returncode == 0 and head.stdout.strip() == commit,
                 'replacement-offline-head')
            shutil.rmtree(SMOKE / 'work')
        rows.append({'ordinal': ordinal, 'instance_id': task['instance_id'],
                     'repo': task['repo'], 'base_commit': commit,
                     'cache_leaf': leaf, 'cache_path': str(target),
                     'origin_match': True, 'shallow': True,
                     'offline_container_checkout': True,
                     'disposition': disposition})
        print(json.dumps({'ordinal': ordinal, 'disposition': disposition}),
              flush=True)
    MATERIALIZE.rmdir()
    SMOKE.rmdir()
    payload = {'schema_version': 'are.g02-r9-task-cache-hydration/v1',
               'posture': 'source-only-no-model-no-gold-path-no-score',
               'candidate_sha256': CANDIDATE_SHA,
               'r8_hydration_sha256': R8_HYDRATION_SHA,
               'script_sha256': sha(__file__),
               'cache_root': str(CACHE.parent),
               'hardlink_reused_count': 23,
               'new_exact_cache_count': 1,
               'verified_count': len(rows), 'results': rows,
               'claim_ceiling': 'Exact offline source cache continuity only; no r9 freeze, model, native score or superiority.',
               'open_questions': ['Will exact non-root trust and fixed index pass the replacement?',
                                  'Will a qualified DSH budget transfer?']}
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': '24-exact-caches-verified',
                      'sha256': sha(OUTPUT), 'hardlinked': 23, 'new': 1}))


if __name__ == '__main__':
    main()
