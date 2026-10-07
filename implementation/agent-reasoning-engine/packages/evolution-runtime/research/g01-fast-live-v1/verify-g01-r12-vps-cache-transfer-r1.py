#!/usr/bin/env python3
"""Bind the r12 WSL-to-VPS cache transfer to exact Git commits and trees."""

import hashlib
import json
import os
from pathlib import Path
import re
import subprocess


BASE = Path('/opt/are/evolution-runtime')
ROOT = Path('/tmp/are-g01-r12-source-caches-r1')
CANDIDATE = BASE / 'g01-r12-clean-cohort-candidate-r1/COHORT-CANDIDATE.json'
CACHES = ROOT / 'SOURCE-CACHES.json'
OUTPUT = BASE / 'g01-r12-cache-transfer-r1/VERIFY.json'
PINS = {
    CANDIDATE: '3b6ac88cc20c565817a023e58735b7d83624a31e80897b7b1acea54a3cdfa23f',
    CACHES: 'c5f5b3ae4478a63e012853ebbc0b86f840576e1c7fba22cc2e4f8176d9d0e443',
}
GIT_ENV = {**os.environ, 'GIT_NO_LAZY_FETCH': '1', 'GIT_ALLOW_PROTOCOL': '',
           'GIT_TERMINAL_PROMPT': '0', 'GIT_CONFIG_NOSYSTEM': '1',
           'GIT_CONFIG_GLOBAL': '/dev/null'}


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def git(path, *args):
    value = subprocess.run(['git', '--no-optional-locks', '-c', f'safe.directory={path}',
                            '-C', str(path), *args],
                           capture_output=True, text=True, timeout=30, env=GIT_ENV)
    return value.stdout.strip() if value.returncode == 0 else None


def main():
    if OUTPUT.exists() or not OUTPUT.parent.is_dir() or ROOT.is_symlink():
        raise ValueError('output-or-root-boundary')
    if any(sha(path) != digest for path, digest in PINS.items()):
        raise ValueError('pinned-input-drift')
    candidate = json.loads(CANDIDATE.read_text())
    cache = json.loads(CACHES.read_text())
    if (candidate.get('schema_version') != 'are.g01-r12-clean-source-only-candidate/v1' or
            candidate.get('status') != 'preflight-only-not-frozen' or
            candidate.get('model_calls') != 0 or candidate.get('gold_values_or_paths_used') is not False or
            cache.get('schema_version') != 'are.g01-r12-wsl-source-caches/v1' or
            cache.get('status') != 'passed' or cache.get('model_calls') != 0 or
            cache.get('gold_loaded') is not False or cache.get('candidate_sha256') != PINS[CANDIDATE] or
            len(candidate['ordered_tasks']) != 24 or len(cache['task_bindings']) != 24 or
            len(cache['origins']) != 16):
        raise ValueError('input-shape')
    by_origin = {row['origin']: row for row in cache['origins']}
    if len(by_origin) != 16:
        raise ValueError('origin-duplicate')
    verified = []
    for task in candidate['ordered_tasks']:
        origin = task['repo_url']
        row = by_origin.get(origin)
        if not row:
            raise ValueError('missing-origin')
        path = ROOT / Path(row['repository_path']).name
        if (path.is_symlink() or not path.is_dir() or not path.resolve().is_relative_to(ROOT.resolve()) or
                git(path, 'remote', 'get-url', 'origin') != origin or
                git(path, 'cat-file', '-e', task['base_commit'] + '^{commit}') is None):
            raise ValueError('git-identity-or-commit:' + task['instance_id'])
        tree = git(path, 'rev-parse', task['base_commit'] + '^{tree}')
        if not tree or not re.fullmatch(r'[0-9a-f]{40}', tree) or tree != row['trees'][task['base_commit']]:
            raise ValueError('git-tree-drift:' + task['instance_id'])
        verified.append({'instance_id': task['instance_id'], 'origin': origin,
                         'base_commit': task['base_commit'], 'tree': tree,
                         'repository_path': str(path)})
    if len({row['instance_id'] for row in verified}) != 24:
        raise ValueError('duplicate-task-binding')
    stat = os.statvfs(ROOT)
    receipt = {
        'schema_version': 'are.g01-r12-vps-cache-transfer-verify/v1',
        'status': 'passed', 'candidate_sha256': PINS[CANDIDATE],
        'wsl_cache_receipt_sha256': PINS[CACHES],
        'script_sha256': sha(Path(__file__)),
        'vps_tmpfs_root': str(ROOT), 'verified_task_bindings': verified,
        'verified_tasks': len(verified), 'verified_origins': len(by_origin),
        'tmpfs_available_bytes_after_transfer': stat.f_bavail * stat.f_frsize,
        'model_calls': 0, 'gold_loaded': False,
        'claim_ceiling': 'VPS exact-commit tree identity only; no task-specific index, native-gold, model quality or superiority proof.',
        'open_questions': ['Can all 24 bounded source indexes and isolated checkouts pass?',
                           'Does actual run scratch fit beside these caches?'],
    }
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(receipt, sort_keys=True, indent=2) + '\n').encode())
    print(json.dumps({'status': 'passed', 'tasks': len(verified), 'origins': len(by_origin),
                      'tmpfs_available_bytes': receipt['tmpfs_available_bytes_after_transfer'],
                      'receipt_sha256': sha(OUTPUT)}, sort_keys=True))


if __name__ == '__main__':
    main()
