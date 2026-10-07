#!/usr/bin/env python3
"""Source-only checkout block census for the exact G01 r16 r2 cohort."""

import hashlib
import json
import os
from pathlib import Path
import subprocess


BASE = Path('/opt/are/evolution-runtime')
CANDIDATE = BASE / 'g01-r16-clean-cohort-candidate-r2/COHORT-CANDIDATE.json'
CACHES = BASE / 'g01-r16-r2-cache-transfer-r1/VERIFY.json'
AUDIT = BASE / 'g01-r16-r2-native-reference-audit-r1/NATIVE-REFERENCE-AUDIT.json'
ROOT = BASE / 'g01-r16-r2-storage-census-r1'
OUTPUT = ROOT / 'STORAGE-CENSUS.json'
PINS = {
    CANDIDATE: 'b9fbc9c5462419d5c1857379835a52425194560055dca8325c9b7d6e049ac112',
    CACHES: 'cb20eb1799b71ae48296085647037d56829743f7d4c2002aebb8bdc008138a41',
    AUDIT: '9a6281ebb60f07cffd92e49f0bc8541ecf30f444d73cb09d8c6a742ea2f78c57',
}
RESERVE = 3 * 1024**3
UNCERTAINTY = 256 * 1024**2


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def main():
    if ROOT.exists() or ROOT.is_symlink():
        raise ValueError('fresh-exact-output-required')
    if any(sha(path) != digest for path, digest in PINS.items()):
        raise ValueError('pinned-input-drift')
    candidate, caches, audit = (json.loads(path.read_text()) for path in PINS)
    if (candidate['status'] != 'preflight-only-not-frozen' or
            candidate['gold_values_or_paths_used'] is not False or candidate['model_calls'] != 0 or
            caches['status'] != 'passed' or caches['gold_loaded'] is not False or
            caches['candidate_sha256'] != PINS[CANDIDATE] or
            audit['status'] != 'passed' or audit['summary']['admitted'] != 52 or
            audit['summary']['excluded'] != 0 or audit['summary']['absent'] != 0 or
            audit['candidate_sha256'] != PINS[CANDIDATE]):
        raise ValueError('input-shape')
    bindings = {row['instance_id']: row for row in caches['verified_task_bindings']}
    if len(bindings) != 24 or len(candidate['ordered_tasks']) != 24:
        raise ValueError('task-binding-count')
    stat = os.statvfs('/dev/shm')
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
             'ls-tree', '-rlz', task['base_commit']],
            env=env, capture_output=True, timeout=30, check=True)
        if len(result.stdout) > 8 * 1024**2 or len(result.stderr) > 4096:
            raise ValueError('git-output-limit')
        regular = symlinks = allocated = raw = 0
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
        rows.append({'instance_id': identifier, 'repo': task['repo'],
                     'language': task['language'], 'regular_files': regular,
                     'symlinks': symlinks, 'regular_raw_bytes': raw,
                     'one_copy_regular_block_bytes': allocated,
                     'four_copy_regular_block_bytes': 4 * allocated})
    total = sum(row['one_copy_regular_block_bytes'] for row in rows)
    worst = max(rows, key=lambda row: row['four_copy_regular_block_bytes'])
    required = total + RESERVE + UNCERTAINTY
    receipt = {'schema_version': 'are.g01-r16-r2-storage-census/v1',
               'status': 'source-only-lower-bound', 'gold_loaded': False,
               'model_calls': 0, 'candidate_sha256': PINS[CANDIDATE],
               'caches_sha256': PINS[CACHES], 'native_audit_sha256': PINS[AUDIT],
               'filesystem_block_bytes': block, 'available_tmpfs_bytes_at_check': available,
               'one_copy_total_regular_block_bytes': total,
               'maximum_four_copy_regular_block_bytes': worst['four_copy_regular_block_bytes'],
               'worst_task_id': worst['instance_id'],
               'runtime_reserve_bytes': RESERVE, 'uncertainty_bytes': UNCERTAINTY,
               'provisional_one_copy_floor_bytes': required,
               'provisional_one_copy_floor_pass': available >= required,
               'rows': rows, 'script_sha256': sha(Path(__file__)),
               'claim_ceiling': 'Source-only lower bound for regular checkout blocks; omits Git metadata, directories, overlays, receipts, logs and model output',
               'open_questions': ['Will actual 24 one-copy checkouts fit with the runtime reserve?',
                                  'Can a separately versioned overlay layout preserve all r16 r2 source bindings?']}
    data = (json.dumps(receipt, sort_keys=True, indent=2) + '\n').encode()
    ROOT.mkdir(mode=0o700, exist_ok=False)
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'status': receipt['status'], 'tasks': len(rows),
                      'one_copy_regular_block_bytes': total,
                      'worst_four_copy_regular_block_bytes': worst['four_copy_regular_block_bytes'],
                      'available_tmpfs_bytes': available, 'floor_bytes': required,
                      'floor_pass': available >= required,
                      'receipt_sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
