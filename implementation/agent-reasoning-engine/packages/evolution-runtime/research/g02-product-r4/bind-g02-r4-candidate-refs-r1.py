#!/usr/bin/env python3
"""Make exact hydrated G02 commits reachable to the unchanged clone protocol."""

import hashlib
import json
import re
import subprocess
from pathlib import Path


ROOT = Path('/opt/are/evolution-runtime/g02-r4-fresh-cohort-candidate-r1')
CANDIDATE = ROOT / 'CANDIDATE.json'
HYDRATION = ROOT / 'HYDRATION.json'
OUTPUT = ROOT / 'REF-BINDING.json'
CANDIDATE_SHA = 'e4408a93c501bfe0ea57d8ef412155bb3db7f969aefb646392b1a6ff7bed5f08'
HYDRATION_SHA = '12c77ddbc23330b1ca7e68cdfc85f9f87871cfb592e79f7a1e9102e0cf1932eb'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError(f'g02-r4-ref-binding.{reason}')


def git(cache, *args):
    return subprocess.run(['git', '-C', str(cache), *args], capture_output=True, text=True)


def main():
    need(sha(CANDIDATE) == CANDIDATE_SHA and sha(HYDRATION) == HYDRATION_SHA and
         not OUTPUT.exists(), 'input-or-output-drift')
    tasks = [task for task in json.loads(CANDIDATE.read_text())['ordered_tasks']
             if task['repo'] in ('ansible/ansible', 'future-architect/vuls')]
    need(len(tasks) == 12, 'task-count')
    rows = []
    for task in tasks:
        commit = task['base_commit']
        need(re.fullmatch(r'[0-9a-f]{40}', commit), 'commit-shape')
        cache = Path(task['cache_base']) / 'cache' / task['cache_name']
        ref = 'refs/heads/are-g02-r4-' + commit
        need(git(cache, 'cat-file', '-e', commit + '^{commit}').returncode == 0,
             f'commit-missing:{task["instance_id"]}')
        current = git(cache, 'rev-parse', '--verify', ref)
        need(current.returncode != 0 or current.stdout.strip() == commit,
             f'existing-ref-conflict:{task["instance_id"]}')
        if current.returncode != 0:
            bound = git(cache, 'update-ref', ref, commit, '0' * 40)
            need(bound.returncode == 0, f'update-ref:{task["instance_id"]}')
        verify = git(cache, 'rev-parse', '--verify', ref)
        need(verify.returncode == 0 and verify.stdout.strip() == commit,
             f'ref-verification:{task["instance_id"]}')
        rows.append({'instance_id': task['instance_id'], 'repo': task['repo'],
                     'cache': str(cache), 'commit': commit, 'ref': ref,
                     'already_bound': current.returncode == 0})
    payload = {'schema_version': 'are.g02-r4-candidate-ref-binding/v1',
               'status': '12-of-12-commits-reachable-by-clone',
               'candidate_sha256': CANDIDATE_SHA, 'hydration_sha256': HYDRATION_SHA,
               'script_sha256': sha(__file__), 'rows': rows,
               'claim_ceiling': 'Source cloneability only; no model, quality score, or full-pair storage proof.',
               'open_questions': ['Does a fresh four-checkout no-model rehearsal pass?',
                                  'Can the full paired campaign fit and archive within scratch limits?']}
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': payload['status'], 'sha256': sha(OUTPUT)}))


if __name__ == '__main__':
    main()
