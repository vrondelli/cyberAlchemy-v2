#!/usr/bin/env python3
"""Verify 22 retained and two replacement G01 r16 r2 cache bindings offline."""

import hashlib
import json
import os
from pathlib import Path
import subprocess


BASE = Path('/opt/are/evolution-runtime')
CANDIDATE = BASE / 'g01-r16-clean-cohort-candidate-r2/COHORT-CANDIDATE.json'
R1 = BASE / 'g01-r16-cache-transfer-r1/VERIFY.json'
DELTA_ROOT = Path('/dev/shm/are-g01-r16-r2-delta-caches-r1')
DELTA = DELTA_ROOT / 'DELTA-CACHES.json'
OUT_ROOT = BASE / 'g01-r16-r2-cache-transfer-r1'
OUT = OUT_ROOT / 'VERIFY.json'
PINS = {
    CANDIDATE: 'b9fbc9c5462419d5c1857379835a52425194560055dca8325c9b7d6e049ac112',
    R1: '1429fa1923985054b25c6780026404e1e18d10cca0cbb9c748f91f2c3511c2d7',
    DELTA: '801e975154c65354fdf8dd0efa913406d3946d5c833a9d7ce9f18c2615f58045',
}


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def git(cache, *args):
    env = dict(os.environ, GIT_CONFIG_NOSYSTEM='1', GIT_CONFIG_GLOBAL='/dev/null',
               GIT_NO_LAZY_FETCH='1', GIT_TERMINAL_PROMPT='0', GIT_ALLOW_PROTOCOL='')
    result = subprocess.run(['git', f'--git-dir={cache}', *args], text=True,
                            capture_output=True, timeout=30, env=env, check=True)
    return result.stdout.strip()


def main():
    if OUT_ROOT.exists() or OUT_ROOT.is_symlink():
        raise ValueError('fresh-exact-output-required')
    for path, expected in PINS.items():
        if sha(path) != expected:
            raise ValueError('pinned-input-drift:' + str(path))
    candidate, r1, delta = (json.loads(path.read_text()) for path in PINS)
    tasks = candidate['ordered_tasks']
    replacements = set(candidate['replacement_ids'])
    old = {row['instance_id']: row for row in r1['verified_task_bindings']}
    new = {row['instance_id']: row for row in delta['task_bindings']}
    if (candidate['schema_version'] != 'are.g01-r16-development-cap-eight-candidate-r2/v1' or
            candidate['status'] != 'preflight-only-not-frozen' or len(tasks) != 24 or
            candidate['model_calls'] != 0 or candidate['gold_values_or_paths_used'] is not False or
            candidate['r1_candidate_sha256'] != r1['candidate_sha256'] or
            r1['status'] != 'passed' or len(old) != 24 or
            delta['status'] != 'passed' or delta['candidate_sha256'] != PINS[CANDIDATE] or
            delta['model_calls'] != 0 or delta['gold_loaded'] is not False or
            len(replacements) != 2 or set(new) != replacements):
        raise ValueError('source-binding-shape')
    verified = []
    for task in tasks:
        identifier = task['instance_id']
        row = new[identifier] if identifier in replacements else old[identifier]
        cache = (DELTA_ROOT / Path(row['repository_path']).name
                 if identifier in replacements else Path(row['repository_path']))
        if (cache.is_symlink() or not cache.is_dir() or
                (identifier in replacements and Path(row['repository_path']).parent !=
                 Path(delta['cache_root'])) or
                task['repo_url'] != row['origin'] or task['base_commit'] != row['base_commit'] or
                git(cache, 'remote', 'get-url', 'origin') != row['origin'] or
                git(cache, 'rev-parse', row['base_commit'] + '^{commit}') != row['base_commit'] or
                git(cache, 'rev-parse', row['base_commit'] + '^{tree}') != row['tree']):
            raise ValueError('cache-binding:' + identifier)
        verified.append({'instance_id': identifier, 'origin': row['origin'],
                         'base_commit': row['base_commit'], 'tree': row['tree'],
                         'repository_path': str(cache)})
    available = os.statvfs(DELTA_ROOT).f_bavail * os.statvfs(DELTA_ROOT).f_frsize
    if available < 3 * 1024**3 or len({row['origin'] for row in verified}) != 5:
        raise ValueError('tmpfs-or-origin-guard')
    receipt = {'schema_version': 'are.g01-r16-r2-vps-cache-transfer-verify/v1',
               'status': 'passed', 'candidate_sha256': PINS[CANDIDATE],
               'r1_transfer_sha256': PINS[R1], 'wsl_delta_receipt_sha256': PINS[DELTA],
               'script_sha256': sha(Path(__file__)),
               'verified_task_bindings': verified, 'verified_tasks': len(verified),
               'verified_origins': 5, 'tmpfs_available_bytes': available,
               'model_calls': 0, 'gold_loaded': False,
               'claim_ceiling': 'Exact r2 VPS cache identity only; no index, native-reference, score or superiority admission',
               'open_questions': ['Will the 24 pinned source indexes and native references admit?']}
    data = (json.dumps(receipt, sort_keys=True, indent=2) + '\n').encode()
    OUT_ROOT.mkdir(mode=0o700, exist_ok=False)
    fd = os.open(OUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'status': receipt['status'], 'tasks': len(verified),
                      'origins': 5, 'tmpfs_available_bytes': available,
                      'receipt_sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
