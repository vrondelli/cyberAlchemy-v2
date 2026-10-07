#!/usr/bin/env python3
"""Bind the r15 score-blind candidate to its exact VPS tmpfs caches."""

import hashlib
import json
import os
from pathlib import Path
import subprocess


BASE = Path('/opt/are/evolution-runtime')
CANDIDATE = BASE / 'g01-r15-clean-cohort-candidate-r1/COHORT-CANDIDATE.json'
CACHES = Path('/tmp/are-g01-r15-source-caches-r1')
SOURCE = CACHES / 'SOURCE-CACHES.json'
OUTPUT_ROOT = BASE / 'g01-r15-cache-transfer-r1'
OUTPUT = OUTPUT_ROOT / 'VERIFY.json'
CANDIDATE_SHA = 'a92236424aed884f6abf962fb4cb9670fd44be32cc4e6b477a1b6ffddae83551'
SOURCE_SHA = 'bffa83d8519579a84f53084a50c43ce4dae0156fe45469cbd6d5f37bfbb74d75'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def git(cache, *args):
    env = dict(os.environ, GIT_CONFIG_NOSYSTEM='1', GIT_CONFIG_GLOBAL='/dev/null',
               GIT_NO_LAZY_FETCH='1', GIT_TERMINAL_PROMPT='0', GIT_ALLOW_PROTOCOL='')
    result = subprocess.run(['git', f'--git-dir={cache}', *args], text=True,
                            capture_output=True, timeout=30, env=env, check=True)
    return result.stdout.strip()


def main():
    if OUTPUT_ROOT.exists() or OUTPUT.exists():
        raise ValueError('fresh-output-required')
    if sha(CANDIDATE) != CANDIDATE_SHA or sha(SOURCE) != SOURCE_SHA:
        raise ValueError('pinned-input-drift')
    candidate = json.loads(CANDIDATE.read_text())
    source = json.loads(SOURCE.read_text())
    tasks = candidate['ordered_tasks']
    if (candidate['status'] != 'preflight-only-not-frozen' or len(tasks) != 24 or
            candidate['model_calls'] != 0 or candidate['gold_values_or_paths_used'] is not False or
            source['status'] != 'passed' or source['candidate_sha256'] != CANDIDATE_SHA or
            source['model_calls'] != 0 or source['gold_loaded'] is not False or
            len(source['task_bindings']) != 24 or len(source['origins']) != 5):
        raise ValueError('input-shape')
    by_id = {row['instance_id']: row for row in source['task_bindings']}
    if len(by_id) != 24 or {row['instance_id'] for row in tasks} != set(by_id):
        raise ValueError('candidate-join')
    verified = []
    for task in tasks:
        row = by_id[task['instance_id']]
        cache = CACHES / Path(row['repository_path']).name
        if (cache.is_symlink() or not cache.is_dir() or
                task['repo_url'] != row['origin'] or task['base_commit'] != row['base_commit'] or
                git(cache, 'remote', 'get-url', 'origin') != row['origin'] or
                git(cache, 'rev-parse', row['base_commit'] + '^{commit}') != row['base_commit'] or
                git(cache, 'rev-parse', row['base_commit'] + '^{tree}') != row['tree']):
            raise ValueError('cache-binding:' + task['instance_id'])
        verified.append({'instance_id': task['instance_id'], 'origin': row['origin'],
                         'base_commit': row['base_commit'], 'tree': row['tree'],
                         'repository_path': str(cache)})
    available = os.statvfs(CACHES).f_bavail * os.statvfs(CACHES).f_frsize
    if available < 1250 * 1024**2:
        raise ValueError('tmpfs-reserve-failed')
    receipt = {'schema_version': 'are.g01-r15-vps-cache-transfer-verify/v1',
               'status': 'passed', 'candidate_sha256': CANDIDATE_SHA,
               'wsl_cache_receipt_sha256': SOURCE_SHA,
               'script_sha256': sha(Path(__file__)),
               'verified_task_bindings': verified,
               'verified_tasks': 24, 'verified_origins': 5,
               'tmpfs_available_bytes': available,
               'model_calls': 0, 'gold_loaded': False,
               'claim_ceiling': 'Exact VPS cache identity only; no index, native-reference, provider, score or superiority evidence',
               'open_questions': ['Will source indexes and native references admit all 24 tasks?',
                                  'Will the exact worst-case scratch fit while preserving reserve?']}
    data = (json.dumps(receipt, sort_keys=True, indent=2) + '\n').encode()
    OUTPUT_ROOT.mkdir(mode=0o700, exist_ok=False)
    with OUTPUT.open('xb') as stream:
        stream.write(data)
    print(json.dumps({'status': 'passed', 'tasks': 24, 'origins': 5,
                      'tmpfs_available_bytes': available,
                      'receipt_sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
