#!/usr/bin/env python3
"""Bind public Git origin URLs for the two transferred G02 source caches."""

import hashlib
import json
import subprocess
from pathlib import Path


ROOT = Path('/opt/are/evolution-runtime/g02-r4-fresh-cohort-candidate-r1')
CANDIDATE = ROOT / 'CANDIDATE.json'
REFS = ROOT / 'REF-BINDING.json'
OUTPUT = ROOT / 'CACHE-ORIGINS.json'
CANDIDATE_SHA = 'e4408a93c501bfe0ea57d8ef412155bb3db7f969aefb646392b1a6ff7bed5f08'
REFS_SHA = 'aa2c25d1d44f67c6f6b2dcaebcde5818bf58a4cacde1ab5fac1407a8a4098761'
REPOSITORIES = {'ansible/ansible': ('ansible', 'https://github.com/ansible/ansible.git'),
                'future-architect/vuls': ('vuls', 'https://github.com/future-architect/vuls.git')}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError(f'g02-r4-cache-origins.{reason}')


def git(cache, *args):
    return subprocess.run(['git', '-C', str(cache), *args], capture_output=True, text=True)


def main():
    need(sha(CANDIDATE) == CANDIDATE_SHA and sha(REFS) == REFS_SHA and
         not OUTPUT.exists(), 'input-or-output-drift')
    tasks = json.loads(CANDIDATE.read_text())['ordered_tasks']
    rows = []
    for repo, (name, url) in REPOSITORIES.items():
        repo_tasks = [task for task in tasks if task['repo'] == repo]
        need(repo_tasks and all(task['repo_url'] == url and task['cache_name'] == name and
                                task['cache_base'] == repo_tasks[0]['cache_base']
                                for task in repo_tasks), f'candidate-binding:{repo}')
        cache = Path(repo_tasks[0]['cache_base']) / 'cache' / name
        current = git(cache, 'remote', 'get-url', 'origin')
        need(current.returncode != 0 or current.stdout.strip() == url,
             f'origin-conflict:{repo}')
        if current.returncode != 0:
            created = git(cache, 'remote', 'add', 'origin', url)
            need(created.returncode == 0, f'origin-add:{repo}')
        verify = git(cache, 'remote', 'get-url', 'origin')
        need(verify.returncode == 0 and verify.stdout.strip() == url,
             f'origin-verify:{repo}')
        rows.append({'repo': repo, 'cache': str(cache), 'origin': url,
                     'already_bound': current.returncode == 0})
    payload = {'schema_version': 'are.g02-r4-cache-origin-binding/v1',
               'status': 'two-public-origins-bound',
               'candidate_sha256': CANDIDATE_SHA, 'ref_binding_sha256': REFS_SHA,
               'script_sha256': sha(__file__), 'rows': rows,
               'claim_ceiling': 'Public source origin binding only; no provider request or benchmark quality.',
               'open_questions': ['Do isolated container Git trust and source access now pass?',
                                  'Does a separate exposed pair complete both arms and policy scoring?']}
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': payload['status'], 'sha256': sha(OUTPUT)}))


if __name__ == '__main__':
    main()
