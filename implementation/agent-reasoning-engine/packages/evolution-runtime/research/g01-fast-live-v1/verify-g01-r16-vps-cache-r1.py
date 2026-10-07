#!/usr/bin/env python3
"""Verify exact G01 r16 candidate commits in copied VPS tmpfs caches."""

import hashlib
import json
import os
from pathlib import Path
import subprocess


BASE = Path('/opt/are/evolution-runtime')
CANDIDATE = BASE / 'g01-r16-clean-cohort-candidate-r1/COHORT-CANDIDATE.json'
CACHE_ROOT = Path('/dev/shm/are-g01-r16-source-caches-r1')
SOURCE = CACHE_ROOT / 'SOURCE-CACHES.json'
OUT_ROOT = BASE / 'g01-r16-cache-transfer-r1'
OUT = OUT_ROOT / 'VERIFY.json'
PINS = {
    CANDIDATE: '13debf87a53346d0aa667c7b49b1fd0b3291d922d09a5a2a2533e4000365405e',
    SOURCE: 'd7e221bbd4f421bc5f36326a3aeabfc21784f66eec850161c6e142a89162cdb0',
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
    if OUT_ROOT.exists():
        raise ValueError('fresh-exact-output-required')
    for path, expected in PINS.items():
        if sha(path) != expected:
            raise ValueError('pinned-input-drift:' + str(path))
    candidate, source = (json.loads(path.read_text()) for path in PINS)
    tasks = candidate['ordered_tasks']
    bindings = {row['instance_id']: row for row in source['task_bindings']}
    if (candidate['schema_version'] != 'are.g01-r16-development-cap-eight-candidate-r1/v1' or
            candidate['status'] != 'preflight-only-not-frozen' or len(tasks) != 24 or
            source['status'] != 'passed' or source['candidate_sha256'] != PINS[CANDIDATE] or
            source['model_calls'] != 0 or source['gold_loaded'] is not False or
            len(bindings) != 24 or len(source['origins']) != 5):
        raise ValueError('input-shape')
    verified = []
    for task in tasks:
        row = bindings.get(task['instance_id'])
        if row is None:
            raise ValueError('missing-task-binding')
        original = Path(row['repository_path'])
        cache = CACHE_ROOT / original.name
        if (cache.is_symlink() or not cache.is_dir() or
                original.parent != Path(source['cache_root']) or
                task['repo_url'] != row['origin'] or task['base_commit'] != row['base_commit'] or
                git(cache, 'remote', 'get-url', 'origin') != row['origin'] or
                git(cache, 'rev-parse', row['base_commit'] + '^{commit}') != row['base_commit'] or
                git(cache, 'rev-parse', row['base_commit'] + '^{tree}') != row['tree']):
            raise ValueError('cache-binding:' + task['instance_id'])
        verified.append({'instance_id': task['instance_id'], 'origin': row['origin'],
                         'base_commit': row['base_commit'], 'tree': row['tree'],
                         'repository_path': str(cache)})
    available = os.statvfs(CACHE_ROOT).f_bavail * os.statvfs(CACHE_ROOT).f_frsize
    if available < 3 * 1024**3:
        raise ValueError('tmpfs-reserve-failed')
    receipt = {'schema_version': 'are.g01-r16-vps-cache-transfer-verify/v1',
               'status': 'passed', 'candidate_sha256': PINS[CANDIDATE],
               'wsl_cache_receipt_sha256': PINS[SOURCE],
               'script_sha256': sha(Path(__file__)),
               'verified_task_bindings': verified, 'verified_tasks': len(verified),
               'verified_origins': 5, 'tmpfs_available_bytes': available,
               'model_calls': 0, 'gold_loaded': False,
               'claim_ceiling': 'Exact VPS cache identity only; no source-index, native-reference, score, or superiority admission',
               'open_questions': ['Will all 24 pinned source indexes admit under the same limits?',
                                  'Will all native-reference files be admitted by those indexes?']}
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
