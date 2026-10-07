#!/usr/bin/env python3
"""Fetch only exact source commits in the G02 r4 source-only candidate."""

import hashlib
import json
import re
import shutil
import subprocess
from pathlib import Path


ROOT = Path('/opt/are/evolution-runtime/g02-r4-fresh-cohort-candidate-r1')
CANDIDATE = ROOT / 'CANDIDATE.json'
OUTPUT = ROOT / 'HYDRATION.json'
CANDIDATE_SHA = 'e4408a93c501bfe0ea57d8ef412155bb3db7f969aefb646392b1a6ff7bed5f08'
FLOOR = 350 * 1024 * 1024
REPOSITORIES = {
    'ansible/ansible': ('ansible', 'https://github.com/ansible/ansible.git'),
    'future-architect/vuls': ('vuls', 'https://github.com/future-architect/vuls.git'),
}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError(f'g02-r4-cache-hydration.{reason}')


def git(cache, *args, timeout=30):
    return subprocess.run(['git', '-C', str(cache), *args], capture_output=True,
                          text=True, timeout=timeout)


def main():
    need(sha(CANDIDATE) == CANDIDATE_SHA and not OUTPUT.exists(), 'candidate-or-output-drift')
    candidate = json.loads(CANDIDATE.read_text())
    need(candidate['status'] == 'source-only-candidate-not-frozen' and
         len(candidate['ordered_tasks']) == 24, 'candidate-shape')
    targets = []
    for task in candidate['ordered_tasks']:
        repo = task['repo']
        if repo not in REPOSITORIES:
            continue
        name, url = REPOSITORIES[repo]
        cache = Path(task['cache_base']) / 'cache' / name
        status = git(cache, 'status', '--porcelain') if cache.is_dir() else None
        need(task['cache_name'] == name and cache.is_dir() and
             re.fullmatch(r'[0-9a-f]{40}', task['base_commit']) is not None and
             status.returncode == 0 and status.stdout.strip() == '' and
             not (cache / '.git/objects/info/alternates').exists(),
             f'cache-binding:{repo}')
        targets.append((task, cache, url))
    need(len(targets) == 12, 'target-count')
    rows = []
    for task, cache, url in targets:
        commit = task['base_commit']
        already = git(cache, 'cat-file', '-e', commit + '^{commit}').returncode == 0
        before = shutil.disk_usage('/').free
        need(before >= FLOOR + 120 * 1024 * 1024, 'disk-floor-before-fetch')
        if not already:
            result = git(cache, '-c', 'protocol.version=2', 'fetch', '--depth=1',
                         '--no-tags', url, commit, timeout=150)
            need(result.returncode == 0, f'fetch-failed:{task["instance_id"]}')
        need(git(cache, 'cat-file', '-e', commit + '^{commit}').returncode == 0,
             f'commit-missing:{task["instance_id"]}')
        tree = git(cache, 'rev-parse', commit + '^{tree}')
        status = git(cache, 'status', '--porcelain')
        need(tree.returncode == 0 and re.fullmatch(r'[0-9a-f]{40}', tree.stdout.strip()) and
             status.returncode == 0 and status.stdout.strip() == '',
             f'cache-invalid:{task["instance_id"]}')
        after = shutil.disk_usage('/').free
        need(after >= FLOOR, 'disk-floor-after-fetch')
        rows.append({'instance_id': task['instance_id'], 'repo': task['repo'],
                     'commit': commit, 'tree': tree.stdout.strip(),
                     'already_present': already, 'root_free_before': before,
                     'root_free_after': after})
    payload = {'schema_version': 'are.g02-r4-candidate-cache-hydration/v1',
               'status': '12-of-12-exact-commits-available',
               'candidate_sha256': CANDIDATE_SHA,
               'script_sha256': sha(__file__), 'minimum_root_free_bytes': FLOOR,
               'rows': rows, 'claim_ceiling': 'Source cache readiness only; not pair storage, native score, or superiority evidence.',
               'open_questions': ['Can each pair run and archive within bounded scratch?',
                                  'Will the frozen selection policy improve untouched matched quality and all-in efficiency?']}
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': payload['status'], 'sha256': sha(OUTPUT),
                      'root_free_bytes': shutil.disk_usage('/').free}))


if __name__ == '__main__':
    main()
