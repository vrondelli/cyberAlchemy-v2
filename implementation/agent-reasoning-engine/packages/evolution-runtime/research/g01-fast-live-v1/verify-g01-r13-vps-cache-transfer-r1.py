#!/usr/bin/env python3
"""Verify r13 WSL-to-VPS cache transfer against all exact commits and trees."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re

BASE = Path('/opt/are/evolution-runtime')
ROOT = Path('/tmp/are-g01-r13-source-caches-r1')
CANDIDATE = BASE / 'g01-r13-clean-cohort-candidate-r1/COHORT-CANDIDATE.json'
CACHES = ROOT / 'SOURCE-CACHES.json'
OUTPUT = BASE / 'g01-r13-cache-transfer-r1/VERIFY.json'
PRIOR = BASE / 'g01-r13-cache-transfer-r1/verify-g01-r12-vps-cache-transfer-r1.py'
PINS = {
    CANDIDATE: '86b3841d0169a2b339d483aad6f0e6e5e8993980c929f11128139f4ff1e04cc5',
    CACHES: '9630e86fc498bdf774d97acb4497f834a7bbcc2f45ecbd1008901de6e507648d',
    PRIOR: 'd6505938e7ed3247b5177c98dfe9c3cc7c94e56cfb00bf69a2cf7eb8d7db2b12',
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    if OUTPUT.exists() or not OUTPUT.parent.is_dir() or ROOT.is_symlink():
        raise ValueError('output-or-root-boundary')
    if any(sha(path) != digest for path, digest in PINS.items()):
        raise ValueError('pinned-input-drift')
    spec = importlib.util.spec_from_file_location('r13_prior_cache_verify', PRIOR)
    prior = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(prior)
    candidate = json.loads(CANDIDATE.read_text())
    cache = json.loads(CACHES.read_text())
    if (candidate.get('schema_version') != 'are.g01-r13-clean-source-only-candidate/v1' or
            candidate.get('status') != 'preflight-only-not-frozen' or
            candidate.get('model_calls') != 0 or candidate.get('gold_values_or_paths_used') is not False or
            cache.get('schema_version') != 'are.g01-r13-wsl-source-caches/v1' or
            cache.get('status') != 'passed' or cache.get('model_calls') != 0 or
            cache.get('gold_loaded') is not False or cache.get('candidate_sha256') != PINS[CANDIDATE] or
            len(candidate['ordered_tasks']) != 24 or len(cache['task_bindings']) != 24 or
            len(cache['origins']) != 19):
        raise ValueError('input-shape')
    by_origin = {row['origin']: row for row in cache['origins']}
    if len(by_origin) != 19:
        raise ValueError('origin-duplicate')
    verified = []
    for task in candidate['ordered_tasks']:
        origin = task['repo_url']
        row = by_origin.get(origin)
        if not row:
            raise ValueError('missing-origin')
        path = ROOT / Path(row['repository_path']).name
        if (path.is_symlink() or not path.is_dir() or not path.resolve().is_relative_to(ROOT.resolve()) or
                prior.git(path, 'remote', 'get-url', 'origin') != origin or
                prior.git(path, 'cat-file', '-e', task['base_commit'] + '^{commit}') is None):
            raise ValueError('git-identity-or-commit:' + task['instance_id'])
        tree = prior.git(path, 'rev-parse', task['base_commit'] + '^{tree}')
        if not tree or not re.fullmatch(r'[0-9a-f]{40}', tree) or tree != row['trees'][task['base_commit']]:
            raise ValueError('git-tree-drift:' + task['instance_id'])
        verified.append({'instance_id': task['instance_id'], 'origin': origin,
                         'base_commit': task['base_commit'], 'tree': tree,
                         'repository_path': str(path)})
    if len({row['instance_id'] for row in verified}) != 24:
        raise ValueError('duplicate-task-binding')
    stat = os.statvfs(ROOT)
    receipt = {'schema_version': 'are.g01-r13-vps-cache-transfer-verify/v1',
               'status': 'passed', 'candidate_sha256': PINS[CANDIDATE],
               'wsl_cache_receipt_sha256': PINS[CACHES],
               'script_sha256': sha(Path(__file__)),
               'vps_tmpfs_root': str(ROOT), 'verified_task_bindings': verified,
               'verified_tasks': len(verified), 'verified_origins': len(by_origin),
               'tmpfs_available_bytes_after_transfer': stat.f_bavail * stat.f_frsize,
               'model_calls': 0, 'gold_loaded': False,
               'claim_ceiling': 'VPS exact-commit tree identity only; no task-specific index, native-gold, model quality or superiority proof.',
               'open_questions': ['Can all 24 bounded source indexes and isolated checkouts pass?',
                                  'Does actual run scratch fit beside these caches?']}
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(receipt, sort_keys=True, indent=2) + '\n').encode())
    print(json.dumps({'status': 'passed', 'tasks': len(verified), 'origins': len(by_origin),
                      'tmpfs_available_bytes': receipt['tmpfs_available_bytes_after_transfer'],
                      'receipt_sha256': sha(OUTPUT)}, sort_keys=True))


if __name__ == '__main__':
    main()
