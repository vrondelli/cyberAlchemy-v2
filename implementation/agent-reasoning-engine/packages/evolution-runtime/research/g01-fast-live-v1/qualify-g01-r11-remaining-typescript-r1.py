#!/usr/bin/env python3
"""Source-ordered, no-model MUI TypeScript index/native-reference qualification."""

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
SELECTOR = BASE / 'g01-r11-clean-cohort-candidate-r1/propose-g01-r11-clean-cohort-r1.py'
R1 = BASE / 'g01-r11-clean-cohort-candidate-r1/COHORT-CANDIDATE.json'
R2 = BASE / 'g01-r11-clean-cohort-candidate-r2/COHORT-CANDIDATE.json'
R2_FAILURE = BASE / 'g01-r11-r2-replacement-qualification-r1/RESULT.json'
WORKER = BASE / 'g01-source-index-capacity-r3/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked_source_worker_r2.py'
HINTS = WORKER.with_name('ranked_source_hints_r3.py')
PARQUET = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream/data/full.parquet'
SOURCE_CACHE = Path('/tmp/are-g01-r11-source-caches-r1/mui--material-ui.git')
CACHE_ROOT = Path('/tmp/are-g01-r11-remaining-typescript-cache-r1')
CACHE = CACHE_ROOT / 'mui--material-ui.git'
OUTPUT = BASE / 'g01-r11-remaining-typescript-qualification-r1/RESULT.json'
PINS = {
    SELECTOR: '7f8b4cf06e50a8b7d6ee43b5f137aaae7299d7837b3ba34112e206eb9ef57dc9',
    R1: 'dd8a659b36e5f9f6dd13fe7dfb452eb75793777a0348791fa65f302349ebb458',
    R2: '17b06e1428c79d55d5c78072d4ed41221bd3ee627a0b0614a2cc9078f9f7bdd0',
    R2_FAILURE: '51a12e885cbc60413a130d79fa469ebfba53b8e7d8468ce4dcc229126c070b07',
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


def main():
    if OUTPUT.exists() or not OUTPUT.parent.is_dir() or CACHE_ROOT.exists():
        raise ValueError('fresh-cache-and-output-required')
    if any(sha(path) != digest for path, digest in PINS.items()):
        raise ValueError('pinned-input-drift')
    spec = importlib.util.spec_from_file_location('g01_r11_selector', SELECTOR)
    selector = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(selector)
    source, clean, seen, _, exclusions = selector.source_pool()
    r1, r2, failed = (json.loads(path.read_text()) for path in (R1, R2, R2_FAILURE))
    retained = {row['instance_id'] for row in r1['ordered_tasks']
                if row['instance_id'] != r2['removed_pre_model_ineligible_id']}
    if (len(retained) != 23 or r2['retained_23_task_id_set_sha256'] != selector.id_sha(retained) or
            r2['prior_candidate_sha256'] != PINS[R1] or
            failed['status'] != 'failed' or failed['candidate_sha256'] != PINS[R2] or
            failed['replacement_instance_id'] != r2['replacement_id'] or
            failed['excluded_gold_files'] != 1 or failed['model_calls'] != 0):
        raise ValueError('prior-candidate-or-failure-drift')
    candidates = sorted((source[i] for i in clean if source[i]['language'] == 'typescript'
                         and i not in retained and i != r2['removed_pre_model_ineligible_id']
                         and i != r2['replacement_id'] and i not in seen and i not in exclusions),
                        key=lambda row: (hashlib.sha256((selector.SEED + '\0' + row['instance_id']).encode()).hexdigest(),
                                         row['instance_id']))
    if len(candidates) != 15 or any(row['repo_url'] != 'https://github.com/mui/material-ui.git'
                                   for row in candidates):
        raise ValueError('remaining-typescript-supply-drift')
    if not SOURCE_CACHE.is_dir() or SOURCE_CACHE.is_symlink():
        raise ValueError('source-cache-identity')
    CACHE_ROOT.mkdir(mode=0o700)
    shutil.copytree(SOURCE_CACHE, CACHE, symlinks=False)
    if git('remote', 'get-url', 'origin') != (0, 'https://github.com/mui/material-ui.git'):
        raise ValueError('copied-cache-origin')
    spec = importlib.util.spec_from_file_location('g01_r11_worker', WORKER)
    worker = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(worker)
    sys.path.insert(0, str(PARQUET.parent.parent))
    from contextbench.parsers.gold import GoldLoader, _normalize_rel_path
    loader = GoldLoader(str(PARQUET))
    rows = []
    selected = None
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
               'index_digest': index['index_digest'],
               'index_postings': index['manifest']['postings'],
               'index_admitted_bytes': index['manifest']['admitted_bytes'],
               'gold_file_count': len(paths), 'admitted_gold_files': statuses['admitted'],
               'excluded_gold_files': statuses['excluded'], 'absent_gold_files': statuses['absent'],
               'excluded_reason_counts': dict(sorted(reasons.items())),
               'elapsed_ms': round((time.monotonic() - started) * 1000)}
        rows.append(row)
        print(json.dumps({'rank': rank, 'id': row['instance_id'], 'admitted': row['admitted_gold_files'],
                          'excluded': row['excluded_gold_files'], 'absent': row['absent_gold_files'],
                          'postings': row['index_postings']}, sort_keys=True), flush=True)
        if statuses['admitted'] == len(paths) and not statuses['excluded'] and not statuses['absent']:
            selected = task['instance_id']
            break
    result = {'schema_version': 'are.g01-r11-remaining-typescript-qualification/v1',
              'status': 'passed' if selected else 'exhausted',
              'candidate_sha256': PINS[R2], 'prior_failure_sha256': PINS[R2_FAILURE],
              'selector_sha256': PINS[SELECTOR], 'worker_sha256': PINS[WORKER],
              'hints_sha256': PINS[HINTS], 'source_parquet_sha256': PINS[PARQUET],
              'script_sha256': sha(Path(__file__)), 'ordered_candidates': len(candidates),
              'attempted': len(rows), 'first_eligible_id': selected, 'rows': rows,
              'gold_paths_or_content_exported': False, 'model_calls': 0,
              'claim_ceiling': 'No-model candidate admission only; no cohort freeze, quality, or superiority.',
              'open_questions': ['Will the 24-task replay and storage gate pass?',
                                 'Can the paired campaign pass quality, reliability, and efficiency gates?']}
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(result, sort_keys=True, indent=2) + '\n').encode())
    print(json.dumps({'status': result['status'], 'attempted': len(rows),
                      'first_eligible_id': selected, 'receipt_sha256': sha(OUTPUT)}, sort_keys=True), flush=True)
    if not selected:
        raise SystemExit(2)


if __name__ == '__main__':
    main()
