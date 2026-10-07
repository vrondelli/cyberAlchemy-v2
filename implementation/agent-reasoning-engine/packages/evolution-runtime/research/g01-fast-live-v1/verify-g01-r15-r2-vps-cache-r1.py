#!/usr/bin/env python3
"""Verify mixed r1-retained and r2-delta VPS cache bindings for 24 tasks."""

import hashlib
import json
import os
from pathlib import Path
import subprocess


BASE = Path('/opt/are/evolution-runtime')
CANDIDATE = BASE / 'g01-r15-clean-cohort-candidate-r2/COHORT-CANDIDATE.json'
R1_VERIFY = BASE / 'g01-r15-cache-transfer-r1/VERIFY.json'
DELTA_ROOT = Path('/tmp/are-g01-r15-r2-delta-caches-r1')
DELTA = DELTA_ROOT / 'DELTA-CACHES.json'
R1_ROOT = Path('/tmp/are-g01-r15-source-caches-r1')
OUTPUT_ROOT = BASE / 'g01-r15-r2-cache-transfer-r1'
OUTPUT = OUTPUT_ROOT / 'VERIFY.json'
PINS = {
    CANDIDATE: '0d713aefd06e38043c48073af7226e6aab55ed0cff16efd7d77f55bb1c7da496',
    R1_VERIFY: '4baa90de38c849085a86da6817885ef1b8d21d88c9dd9c79a8fab145a73626b0',
    DELTA: '7587737eefdf22bf8cbbc50488e81826a3607e8c0d2fced17314eda46c2bef21',
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def git(cache, *args):
    env = dict(os.environ, GIT_CONFIG_NOSYSTEM='1', GIT_CONFIG_GLOBAL='/dev/null',
               GIT_NO_LAZY_FETCH='1', GIT_TERMINAL_PROMPT='0', GIT_ALLOW_PROTOCOL='')
    result = subprocess.run(['git', f'--git-dir={cache}', *args], text=True,
                            capture_output=True, timeout=30, env=env, check=True)
    return result.stdout.strip()


def main():
    if OUTPUT_ROOT.exists():
        raise ValueError('fresh-exact-output-required')
    if any(sha(path) != digest for path, digest in PINS.items()):
        raise ValueError('pinned-input-drift')
    candidate, r1, delta = (json.loads(path.read_text()) for path in PINS)
    tasks = candidate['ordered_tasks']
    replacement = set(candidate['replacement_ids'])
    prior = {row['instance_id']: row for row in r1['verified_task_bindings']}
    new = {row['instance_id']: row for row in delta['task_bindings']}
    if (candidate['schema_version'] != 'are.g01-r15-development-cap-eight-candidate-r2/v1' or
            candidate['status'] != 'preflight-only-not-frozen' or len(tasks) != 24 or
            candidate['model_calls'] != 0 or candidate['gold_values_or_paths_used'] is not False or
            len(replacement) != 3 or set(new) != replacement or len(prior) != 24 or
            r1['status'] != 'passed' or r1['verified_tasks'] != 24 or
            r1['candidate_sha256'] != candidate['r1_candidate_sha256'] or
            delta['status'] != 'passed' or delta['candidate_sha256'] != PINS[CANDIDATE] or
            delta['model_calls'] != 0 or delta['gold_loaded'] is not False):
        raise ValueError('input-shape')
    verified = []
    for task in tasks:
        identifier = task['instance_id']
        is_delta = identifier in replacement
        row = new.get(identifier) if is_delta else prior.get(identifier)
        if row is None:
            raise ValueError('missing-task-binding:' + identifier)
        root = DELTA_ROOT if is_delta else R1_ROOT
        cache = root / Path(row['repository_path']).name
        if (cache.is_symlink() or not cache.is_dir() or
                task['repo_url'] != row['origin'] or task['base_commit'] != row['base_commit'] or
                git(cache, 'remote', 'get-url', 'origin') != row['origin'] or
                git(cache, 'rev-parse', row['base_commit'] + '^{commit}') != row['base_commit'] or
                git(cache, 'rev-parse', row['base_commit'] + '^{tree}') != row['tree']):
            raise ValueError('cache-binding:' + identifier)
        verified.append({'instance_id': identifier, 'origin': row['origin'],
                         'base_commit': row['base_commit'], 'tree': row['tree'],
                         'repository_path': str(cache),
                         'cache_source': 'r2-delta' if is_delta else 'r1-retained'})
    available = os.statvfs(DELTA_ROOT).f_bavail * os.statvfs(DELTA_ROOT).f_frsize
    if available < 1250 * 1024**2:
        raise ValueError('tmpfs-reserve-failed')
    receipt = {'schema_version': 'are.g01-r15-r2-vps-cache-transfer-verify/v1',
               'status': 'passed', 'candidate_sha256': PINS[CANDIDATE],
               'r1_cache_verify_sha256': PINS[R1_VERIFY],
               'wsl_delta_cache_receipt_sha256': PINS[DELTA],
               'script_sha256': sha(Path(__file__)),
               'verified_task_bindings': verified,
               'verified_tasks': 24, 'retained_cache_tasks': 21,
               'delta_cache_tasks': 3, 'verified_origins': 5,
               'tmpfs_available_bytes': available,
               'model_calls': 0, 'gold_loaded': False,
               'claim_ceiling': 'Exact mixed-root r2 VPS cache identity only; no index, reference, score or superiority',
               'open_questions': ['Will all r2 indexes and native references admit under the unchanged limits?',
                                  'Will the exact largest scratch fit while preserving reserve?']}
    data = (json.dumps(receipt, sort_keys=True, indent=2) + '\n').encode()
    OUTPUT_ROOT.mkdir(mode=0o700, exist_ok=False)
    with OUTPUT.open('xb') as stream:
        stream.write(data)
    print(json.dumps({'status': 'passed', 'tasks': 24, 'retained': 21, 'delta': 3,
                      'tmpfs_available_bytes': available,
                      'receipt_sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
