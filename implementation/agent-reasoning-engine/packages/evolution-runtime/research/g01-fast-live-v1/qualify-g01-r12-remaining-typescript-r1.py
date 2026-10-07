#!/usr/bin/env python3
"""Ordered, evaluator-only MUI TypeScript admission for the failed r12 r1 draw.

The source-only order is fixed before native labels are read. The evaluator
exports only counts and stops at the first two fully index-admitted tasks.
"""

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
SELECTOR = BASE / 'g01-r12-cohort-selector-r1.py'
CANDIDATE = BASE / 'g01-r12-clean-cohort-candidate-r1/COHORT-CANDIDATE.json'
FAILURE = BASE / 'g01-r12-index-gold-coverage-r1/GOLD-INDEX-COVERAGE.json'
TRANSFER = BASE / 'g01-r12-cache-transfer-r1/VERIFY.json'
WORKER = BASE / 'g01-source-index-capacity-r3/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked_source_worker_r2.py'
HINTS = WORKER.with_name('ranked_source_hints_r3.py')
PARQUET = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream/data/full.parquet'
SOURCE_CACHE = Path('/tmp/are-g01-r12-source-caches-r1/mui--material-ui.git')
CACHE_ROOT = Path('/tmp/are-g01-r12-remaining-typescript-cache-r1')
CACHE = CACHE_ROOT / 'mui--material-ui.git'
OUTPUT = BASE / 'g01-r12-remaining-typescript-qualification-r1/RESULT.json'
PINS = {
    SELECTOR: '8722fec0d40476d8657778b7e29727b936330932953a207fa3b66f4fc97f52e7',
    CANDIDATE: '3b6ac88cc20c565817a023e58735b7d83624a31e80897b7b1acea54a3cdfa23f',
    FAILURE: 'd1d8bdf797463a31ea865ae381c17da410d0856083f99a84c00f39f2f4463ddd',
    TRANSFER: 'a7aa8be8c6ba9e31c01c41d0c9126e165e1faf038248a48190354aa258b46443',
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
                            '-C', str(CACHE), *args], capture_output=True, text=True,
                           timeout=timeout, env=GIT_ENV)
    return value.returncode, value.stdout.strip()


def module(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    value = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value


def main():
    if OUTPUT.exists() or not OUTPUT.parent.is_dir() or CACHE_ROOT.exists():
        raise ValueError('fresh-cache-and-output-required')
    if any(sha(path) != digest for path, digest in PINS.items()):
        raise ValueError('pinned-input-drift')
    selector = module(SELECTOR, 'g01_r12_selector')
    _, source, clean, seen, r11_ids = selector.source_pool()
    candidate, failed, transfer = (json.loads(path.read_text()) for path in
                                   (CANDIDATE, FAILURE, TRANSFER))
    selected = {row['instance_id'] for row in candidate['ordered_tasks']}
    failed_rows = [row for row in failed['rows'] if row.get('excluded_gold_files')]
    if (candidate.get('status') != 'preflight-only-not-frozen' or
            candidate.get('model_calls') != 0 or candidate.get('gold_values_or_paths_used') is not False or
            candidate.get('selector_sha256') != PINS[SELECTOR] or
            failed.get('status') != 'failed' or failed.get('candidate_sha256') != PINS[CANDIDATE] or
            failed.get('summary', {}).get('audited') != 24 or
            failed['summary'].get('excluded') != 2 or failed['summary'].get('absent') != 0 or
            len(failed_rows) != 2 or
            {row['instance_id'] for row in failed_rows} !=
            {row['instance_id'] for row in candidate['ordered_tasks'] if row['language'] == 'typescript'} or
            transfer.get('status') != 'passed' or transfer.get('candidate_sha256') != PINS[CANDIDATE] or
            transfer.get('verified_tasks') != 24 or transfer.get('model_calls') != 0):
        raise ValueError('failed-cohort-lineage-drift')
    candidates = sorted((source[i] for i in clean if source[i]['language'] == 'typescript' and
                         i not in selected | seen | r11_ids),
                        key=lambda row: (hashlib.sha256((selector.SEED + '\0' + row['instance_id']).encode()).hexdigest(),
                                         row['instance_id']))
    if len(candidates) != 14 or any(row['repo_url'] != 'https://github.com/mui/material-ui.git'
                                    for row in candidates):
        raise ValueError('remaining-typescript-supply-drift')
    if not SOURCE_CACHE.is_dir() or SOURCE_CACHE.is_symlink():
        raise ValueError('source-cache-identity')
    CACHE_ROOT.mkdir(mode=0o700)
    shutil.copytree(SOURCE_CACHE, CACHE, symlinks=False)
    if git('remote', 'get-url', 'origin') != (0, 'https://github.com/mui/material-ui.git'):
        raise ValueError('copied-cache-origin')
    worker = module(WORKER, 'g01_r12_ranked_worker')
    sys.path.insert(0, str(PARQUET.parent.parent))
    from contextbench.parsers.gold import GoldLoader, _normalize_rel_path
    loader = GoldLoader(str(PARQUET))
    rows, eligible = [], []
    for rank, task in enumerate(candidates, 1):
        started = time.monotonic()
        if git('cat-file', '-e', task['base_commit'] + '^{commit}')[0] != 0:
            if git('fetch', '-q', '--no-tags', '--depth=1', 'origin', task['base_commit'], timeout=900)[0] != 0:
                raise ValueError('exact-commit-fetch-failed:' + task['instance_id'])
        tree_status, tree = git('rev-parse', task['base_commit'] + '^{tree}')
        if git('cat-file', '-e', task['base_commit'] + '^{commit}')[0] != 0 or tree_status != 0 or len(tree) != 40:
            raise ValueError('exact-commit-tree-failed:' + task['instance_id'])
        report = worker.run_index({'repository': str(CACHE), 'base_commit': task['base_commit'], 'query': ''})
        if not report['ok'] or report['result'] is None:
            raise ValueError('index-failed:' + task['instance_id'])
        index = report['result']
        gold = loader.get(task['instance_id'])
        if gold is None or gold.commit != task['base_commit'] or gold._data['language'] != 'typescript':
            raise ValueError('gold-identity:' + task['instance_id'])
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
            raise ValueError('gold-path-shape')
        statuses = Counter(manifest.get(path, {'status': 'absent'})['status'] for path in paths)
        reasons = Counter(manifest[path]['reason'] for path in paths
                          if path in manifest and manifest[path]['status'] == 'excluded')
        row = {'source_order_rank': rank, 'instance_id': task['instance_id'],
               'base_commit': task['base_commit'], 'tree': tree,
               'index_digest': index['index_digest'], 'index_postings': index['manifest']['postings'],
               'index_admitted_bytes': index['manifest']['admitted_bytes'],
               'gold_file_count': len(paths), 'admitted_gold_files': statuses['admitted'],
               'excluded_gold_files': statuses['excluded'], 'absent_gold_files': statuses['absent'],
               'excluded_reason_counts': dict(sorted(reasons.items())),
               'elapsed_ms': round((time.monotonic() - started) * 1000)}
        rows.append(row)
        print(json.dumps({'rank': rank, 'id': row['instance_id'],
                          'admitted': row['admitted_gold_files'],
                          'excluded': row['excluded_gold_files'], 'absent': row['absent_gold_files'],
                          'postings': row['index_postings']}, sort_keys=True), flush=True)
        if statuses['admitted'] == len(paths) and not statuses['excluded'] and not statuses['absent']:
            eligible.append(task['instance_id'])
            if len(eligible) == 2:
                break
    result = {'schema_version': 'are.g01-r12-remaining-typescript-qualification/v1',
              'status': 'passed' if len(eligible) == 2 else 'exhausted',
              'candidate_sha256': PINS[CANDIDATE], 'prior_failure_sha256': PINS[FAILURE],
              'selector_sha256': PINS[SELECTOR], 'transfer_sha256': PINS[TRANSFER],
              'worker_sha256': PINS[WORKER], 'hints_sha256': PINS[HINTS],
              'source_parquet_sha256': PINS[PARQUET], 'script_sha256': sha(Path(__file__)),
              'ordered_candidates': len(candidates), 'attempted': len(rows),
              'first_two_eligible_ids': eligible, 'rows': rows,
              'gold_paths_or_content_exported': False, 'model_calls': 0,
              'claim_ceiling': 'No-model TypeScript admission only; no successor cohort freeze, quality, or superiority.',
              'open_questions': ['Will a 24-task successor replay exact caches and indexes?',
                                 'Can storage, provider, paired reliability, quality, and efficiency pass?']}
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(result, sort_keys=True, indent=2) + '\n').encode())
    print(json.dumps({'status': result['status'], 'attempted': len(rows),
                      'eligible': eligible, 'receipt_sha256': sha(OUTPUT)}, sort_keys=True), flush=True)
    if len(eligible) != 2:
        raise SystemExit(2)


if __name__ == '__main__':
    main()
