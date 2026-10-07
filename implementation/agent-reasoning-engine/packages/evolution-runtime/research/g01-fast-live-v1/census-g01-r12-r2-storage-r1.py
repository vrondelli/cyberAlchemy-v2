#!/usr/bin/env python3
"""Source-only four-checkout block lower bound for the G01 r12 r2 cohort."""

import hashlib
import json
import os
from pathlib import Path
import subprocess


BASE = Path('/opt/are/evolution-runtime')
CANDIDATE = BASE / 'g01-r12-clean-cohort-candidate-r2/COHORT-CANDIDATE.json'
CACHES = BASE / 'g01-r12-r2-cache-binding-r1/VERIFY.json'
OUTPUT = BASE / 'g01-r12-r2-storage-census-r1/STORAGE-CENSUS.json'
PINS = {CANDIDATE: '427a3dbdc746f9260ad705a9599041f69572cdb9d79e5efb19fa63190c91cbbd',
        CACHES: '924154f3dcee88baa9393decb7e8408e37c06b67298632c76689189c98afbd2c'}
RESERVE = 1024 * 1024**2
UNCERTAINTY = 256 * 1024**2


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    if not OUTPUT.parent.is_dir() or OUTPUT.exists():
        raise ValueError('fresh-output-required')
    if any(sha(path) != digest for path, digest in PINS.items()):
        raise ValueError('input-drift')
    candidate = json.loads(CANDIDATE.read_text())
    caches = json.loads(CACHES.read_text())
    if (candidate['gold_values_or_paths_used'] is not False or caches['gold_loaded'] is not False or
            candidate['status'] != 'preflight-only-not-frozen' or caches['status'] != 'passed'):
        raise ValueError('gold-boundary')
    bindings = {row['instance_id']: row for row in caches['verified_task_bindings']}
    if len(bindings) != 24 or len(candidate['ordered_tasks']) != 24:
        raise ValueError('task-binding-count')
    stat = os.statvfs('/tmp')
    block = stat.f_frsize
    available = stat.f_bavail * block
    env = {**os.environ, 'GIT_CONFIG_NOSYSTEM': '1', 'GIT_CONFIG_GLOBAL': '/dev/null',
           'GIT_NO_LAZY_FETCH': '1', 'GIT_ALLOW_PROTOCOL': '', 'GIT_TERMINAL_PROMPT': '0'}
    rows = []
    for task in candidate['ordered_tasks']:
        identifier = task['instance_id']
        binding = bindings[identifier]
        if binding['base_commit'] != task['base_commit'] or binding['origin'] != task['repo_url']:
            raise ValueError('source-binding')
        result = subprocess.run(
            ['git', '--no-optional-locks', '-c', 'core.hooksPath=/dev/null',
             '-c', f'safe.directory={binding["repository_path"]}', '-C', binding['repository_path'],
             'ls-tree', '-rlz', task['base_commit']], env=env, capture_output=True, timeout=20, check=True)
        if len(result.stdout) > 8 * 1024**2 or len(result.stderr) > 4096:
            raise ValueError('git-output-limit')
        regular, symlinks, allocated, raw = 0, 0, 0, 0
        for entry in result.stdout.split(b'\0'):
            if not entry:
                continue
            head, _ = entry.split(b'\t', 1)
            mode, kind, _, size = head.split()
            if kind != b'blob':
                continue
            length = int(size)
            if mode in (b'100644', b'100755'):
                regular += 1
                raw += length
                allocated += ((length + block - 1) // block) * block
            elif mode == b'120000':
                symlinks += 1
        rows.append({'instance_id': identifier, 'repo': task['repo'], 'language': task['language'],
                     'regular_files': regular, 'symlinks': symlinks,
                     'regular_raw_bytes': raw, 'one_copy_regular_block_bytes': allocated,
                     'four_copy_regular_block_bytes': 4 * allocated})
    maximum = max(row['four_copy_regular_block_bytes'] for row in rows)
    floor = maximum + RESERVE + UNCERTAINTY
    receipt = {'schema_version': 'are.g01-r12-r2-storage-census/v1',
               'source_only': True, 'gold_loaded': False, 'model_calls': 0,
               'candidate_sha256': PINS[CANDIDATE], 'caches_sha256': PINS[CACHES],
               'filesystem_block_bytes': block, 'available_tmpfs_bytes_at_check': available,
               'maximum_four_copy_regular_block_bytes': maximum,
               'reserve_bytes': RESERVE, 'uncertainty_bytes': UNCERTAINTY,
               'provisional_tmpfs_floor_bytes': floor,
               'tmpfs_floor_pass': available >= floor,
               'rows': rows, 'script_sha256': sha(Path(__file__)),
               'claim_ceiling': 'Source-only lower bound for regular checkout blocks; omits Git metadata, directories, receipts, logs, archives and model output',
               'open_questions': ['Will actual largest-pair checkout and run fit the guarded tmpfs floor?',
                                  'Which exact fresh scratch may be reclaimed only after verified WSL archival?']}
    descriptor = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'wb') as stream:
        stream.write((json.dumps(receipt, indent=2, sort_keys=True) + '\n').encode())
    worst = max(rows, key=lambda row: row['four_copy_regular_block_bytes'])
    print(json.dumps({'receipt_sha256': sha(OUTPUT), 'worst_task_id': worst['instance_id'],
                      'maximum_four_copy_regular_block_bytes': maximum,
                      'available_tmpfs_bytes': available, 'floor_bytes': floor,
                      'tmpfs_floor_pass': available >= floor}, sort_keys=True))


if __name__ == '__main__':
    main()
