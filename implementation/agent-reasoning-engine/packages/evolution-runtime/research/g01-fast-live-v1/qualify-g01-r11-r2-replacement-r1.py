#!/usr/bin/env python3
"""No-model cache/index plus evaluator-only gold admission for r11 r2's replacement."""

from collections import Counter
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time


BASE = Path('/opt/are/evolution-runtime')
CANDIDATE = BASE / 'g01-r11-clean-cohort-candidate-r2/COHORT-CANDIDATE.json'
SELECTOR = BASE / 'g01-r11-clean-cohort-candidate-r2/propose-g01-r11-clean-cohort-r2.py'
R1_AUDIT = BASE / 'g01-r11-index-gold-coverage-r1/GOLD-INDEX-COVERAGE.json'
WORKER = BASE / 'g01-source-index-capacity-r3/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked_source_worker_r2.py'
HINTS = WORKER.with_name('ranked_source_hints_r3.py')
PARQUET = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream/data/full.parquet'
SOURCE_CACHE = Path('/tmp/are-g01-r11-source-caches-r1/mui--material-ui.git')
CACHE_ROOT = Path('/tmp/are-g01-r11-r2-mui-cache-r1')
CACHE = CACHE_ROOT / 'mui--material-ui.git'
OUTPUT = BASE / 'g01-r11-r2-replacement-qualification-r1/RESULT.json'
PINS = {
    CANDIDATE: '17b06e1428c79d55d5c78072d4ed41221bd3ee627a0b0614a2cc9078f9f7bdd0',
    SELECTOR: 'd42d9480d080779ac09ff2161c537f535719bcb8b29ca31e41b94bfca7c38cc3',
    R1_AUDIT: '9aeada6938354b98bd34941e68afb06cce91ce9e8e41b1236aa67eb34e29fac8',
    WORKER: 'c682a449cfc336f93e58ed1a87221178af17bdb0ab6d1904f63125dfb5a2536b',
    HINTS: '7f7e9d0299bd138fdde8f4a3c55869098cde5c57b0015481926e993510b4025a',
    PARQUET: '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8',
}
GIT_ENV = {**os.environ, 'GIT_TERMINAL_PROMPT': '0', 'GIT_CONFIG_NOSYSTEM': '1',
           'GIT_CONFIG_GLOBAL': '/dev/null'}


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def git(*args, timeout=30):
    value = subprocess.run(['git', '--no-optional-locks', '-c', f'safe.directory={CACHE}',
                            '-C', str(CACHE), *args], capture_output=True,
                           text=True, timeout=timeout, env=GIT_ENV)
    return value.returncode, value.stdout.strip()


def main():
    if OUTPUT.exists() or not OUTPUT.parent.is_dir() or CACHE_ROOT.exists():
        raise ValueError('fresh-cache-and-output-required')
    if any(sha(path) != digest for path, digest in PINS.items()):
        raise ValueError('pinned-input-drift')
    candidate = json.loads(CANDIDATE.read_text())
    r1 = json.loads(R1_AUDIT.read_text())
    if (candidate.get('status') != 'preflight-only-not-frozen' or
            candidate.get('gold_values_or_paths_used') is not False or candidate.get('model_calls') != 0 or
            candidate.get('prior_failed_index_audit_sha256') != PINS[R1_AUDIT] or
            candidate.get('replacement_source_rank') != 1 or
            len(candidate['ordered_tasks']) != 24 or
            r1.get('status') != 'failed' or r1.get('summary', {}).get('excluded') != 1):
        raise ValueError('candidate-or-r1-shape')
    task = next(row for row in candidate['ordered_tasks']
                if row['instance_id'] == candidate['replacement_id'])
    if task['repo_url'] != 'https://github.com/mui/material-ui.git' or task['language'] != 'typescript':
        raise ValueError('replacement-source-binding')
    if not SOURCE_CACHE.is_dir() or SOURCE_CACHE.is_symlink():
        raise ValueError('source-cache-identity')
    CACHE_ROOT.mkdir(mode=0o700)
    shutil.copytree(SOURCE_CACHE, CACHE, symlinks=False)
    if git('remote', 'get-url', 'origin') != (0, task['repo_url']):
        raise ValueError('copied-cache-origin')
    started = time.monotonic()
    if git('cat-file', '-e', task['base_commit'] + '^{commit}')[0] != 0:
        if git('fetch', '-q', '--no-tags', '--depth=1', 'origin', task['base_commit'], timeout=900)[0] != 0:
            raise ValueError('exact-commit-fetch-failed')
    fetch_ms = round((time.monotonic() - started) * 1000)
    commit_status, _ = git('cat-file', '-e', task['base_commit'] + '^{commit}')
    tree_status, tree = git('rev-parse', task['base_commit'] + '^{tree}')
    if commit_status != 0 or tree_status != 0 or len(tree) != 40:
        raise ValueError('exact-commit-tree-failed')
    spec = importlib.util.spec_from_file_location('g01_r11_r2_worker', WORKER)
    worker = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(worker)
    report = worker.run_index({'repository': str(CACHE), 'base_commit': task['base_commit'], 'query': ''})
    if not report['ok'] or report['result'] is None:
        raise ValueError('replacement-index-failed')
    index = report['result']
    sys.path.insert(0, str(PARQUET.parent.parent))
    from contextbench.parsers.gold import GoldLoader, _normalize_rel_path
    gold = GoldLoader(str(PARQUET)).get(task['instance_id'])
    if gold is None or gold.commit != task['base_commit'] or gold._data['language'] != task['language']:
        raise ValueError('replacement-gold-identity')
    manifest = {}
    for entry in index['manifest']['entries']:
        path = entry.get('path')
        if path is None:
            path = bytes.fromhex(entry['path_hex']).decode('utf8')
        if path in manifest:
            raise ValueError('duplicate-index-path')
        manifest[path] = entry
    paths = {_normalize_rel_path(item.get('file', '')) for item in gold.init + gold.add}
    if not paths or any(not path or path.startswith('/') or '..' in Path(path).parts for path in paths):
        raise ValueError('replacement-gold-path-shape')
    statuses = Counter(manifest.get(path, {'status': 'absent'})['status'] for path in paths)
    reasons = Counter(manifest[path]['reason'] for path in paths
                      if path in manifest and manifest[path]['status'] == 'excluded')
    status = 'passed' if statuses['admitted'] == len(paths) and not statuses['excluded'] and not statuses['absent'] else 'failed'
    result = {
        'schema_version': 'are.g01-r11-r2-replacement-qualification/v1', 'status': status,
        'candidate_sha256': PINS[CANDIDATE], 'r1_failed_audit_sha256': PINS[R1_AUDIT],
        'source_parquet_sha256': PINS[PARQUET], 'worker_sha256': PINS[WORKER],
        'hints_sha256': PINS[HINTS], 'script_sha256': sha(Path(__file__)),
        'replacement_instance_id': task['instance_id'], 'origin': task['repo_url'],
        'base_commit': task['base_commit'], 'tree': tree,
        'cache_path': str(CACHE), 'fetch_elapsed_ms': fetch_ms,
        'index_digest': index['index_digest'],
        'index_admitted_bytes': index['manifest']['admitted_bytes'],
        'index_postings': index['manifest']['postings'],
        'gold_file_count': len(paths), 'admitted_gold_files': statuses['admitted'],
        'excluded_gold_files': statuses['excluded'], 'absent_gold_files': statuses['absent'],
        'excluded_reason_counts': dict(sorted(reasons.items())),
        'gold_paths_or_content_exported': False, 'model_calls': 0,
        'claim_ceiling': 'One replacement task cache/index/native-reference admission only; no 24-task freeze, model quality, or superiority.',
        'open_questions': ['Will an independently bound r2 24-task source/index replay pass?',
                           'Can the exact run storage and reliability gates pass?'],
    }
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(result, sort_keys=True, indent=2) + '\n').encode())
    print(json.dumps({'status': status, 'replacement_id': task['instance_id'],
                      'gold_files': len(paths), 'admitted': statuses['admitted'],
                      'excluded': statuses['excluded'], 'absent': statuses['absent'],
                      'index_postings': index['manifest']['postings'],
                      'receipt_sha256': sha(OUTPUT)}, sort_keys=True))
    if status != 'passed':
        raise SystemExit(2)


if __name__ == '__main__':
    main()
