#!/usr/bin/env python3
"""Incremental source-cache binding for the score-blind G01 candidate r2."""

from collections import defaultdict
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import time


BASE = Path('/opt/are/evolution-runtime')
PRIOR_SCRIPT = BASE / 'g01-post-r7-source-caches-r1/hydrate-post-r7-multilang-caches-r1.py'
PRIOR = BASE / 'g01-post-r7-source-caches-r1/SOURCE-CACHES.json'
CANDIDATE = BASE / 'g01-post-r7-multilang-cohort-candidate-r2/COHORT-CANDIDATE.json'
OUTPUT = BASE / 'g01-post-r7-source-caches-r2/SOURCE-CACHES.json'
VOLATILE_ROOT = Path('/tmp/are-g01-post-r7-source-caches-r2')
EXPECTED_PRIOR_SCRIPT_SHA = '0e4d20ace46c6ae4fef7775247a25c35e902bf59c63bde1e01345d67c86a329e'
EXPECTED_PRIOR_SHA = '998d53a850e7e38f858797847070b77094e4f2b569b20a87bfb7f4808d42b2e4'
EXPECTED_CANDIDATE_SHA = '9364dcb5978c89b16c5b84c0f964e93bac4a332f562f2b73365fecb745b498c6'
NEW_REPO = 'darkreader/darkreader'


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def main():
    if (sha(PRIOR_SCRIPT) != EXPECTED_PRIOR_SCRIPT_SHA or sha(PRIOR) != EXPECTED_PRIOR_SHA or
            sha(CANDIDATE) != EXPECTED_CANDIDATE_SHA or OUTPUT.exists() or
            not OUTPUT.parent.is_dir() or VOLATILE_ROOT.exists()):
        raise ValueError('input-or-output-boundary')
    spec = importlib.util.spec_from_file_location('g01_cache_r1', PRIOR_SCRIPT)
    helper = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(helper)
    old = json.loads(PRIOR.read_text())
    candidate = json.loads(CANDIDATE.read_text())
    if (old['status'] != 'passed' or old['model_calls'] != 0 or old['gold_loaded'] is not False or
            candidate['status'] != 'preflight-only-not-frozen' or len(candidate['ordered_tasks']) != 24 or
            candidate['model_calls'] != 0 or candidate['gold_values_or_paths_used'] is not False):
        raise ValueError('input-shape')
    grouped = defaultdict(list)
    for task in candidate['ordered_tasks']:
        grouped[task['repo']].append(task)
    old_by_repo = {row['repo']: row for row in old['repositories']}
    if set(grouped) - set(old_by_repo) != {NEW_REPO} or set(old_by_repo) - set(grouped) != {'mui/material'}:
        raise ValueError('repository-delta-drift')
    new_tasks = grouped[NEW_REPO]
    if len(new_tasks) != 1 or not re.fullmatch(r'https://github\.com/[A-Za-z0-9._-]+/[A-Za-z0-9._-]+\.git', new_tasks[0]['repo_url']):
        raise ValueError('new-repository-shape')
    if shutil.disk_usage('/tmp').free < helper.MIN_TMP_FREE_BYTES or \
            shutil.disk_usage(BASE).free < helper.MIN_DURABLE_FREE_BYTES:
        raise ValueError('disk-headroom-guard')
    VOLATILE_ROOT.mkdir(mode=0o700)
    path = VOLATILE_ROOT / 'darkreader--darkreader.git'
    path.mkdir(mode=0o700)
    subprocess.run(['git', 'init', '--bare', '-q', str(path)], check=True, timeout=30)
    task = new_tasks[0]
    helper.command(path, 'remote', 'add', 'origin', task['repo_url'], timeout=30)
    started = time.monotonic()
    run = subprocess.run(['git', '-C', str(path), 'fetch', '-q', '--depth=1', 'origin', task['base_commit']],
                         capture_output=True, timeout=600)
    if run.returncode:
        raise ValueError('new-exact-commit-fetch-failed')
    fetch_elapsed_ms = round((time.monotonic() - started) * 1000)
    repositories = []
    for repo in sorted(grouped):
        group = grouped[repo]
        if repo == NEW_REPO:
            row = {'repo': repo, 'repository_path': str(path), 'origin': task['repo_url'],
                   'commits': [task['base_commit']], 'trees': {task['base_commit']: helper.tree(path, task['base_commit'])},
                   'task_count': 1, 'cache_location': 'volatile-new', 'cache_bytes': helper.cache_bytes(path)}
        else:
            row = old_by_repo[repo]
        if (len({item['repo_url'] for item in group}) != 1 or row['origin'] != group[0]['repo_url'] or
                helper.command(Path(row['repository_path']), 'remote', 'get-url', 'origin', timeout=30) != row['origin'] or
                set(row['commits']) != {item['base_commit'] for item in group} or row['task_count'] != len(group)):
            raise ValueError(f'cache-binding-drift:{repo}')
        for item in group:
            if helper.tree(Path(row['repository_path']), item['base_commit']) != row['trees'][item['base_commit']]:
                raise ValueError(f'cache-tree-drift:{repo}')
        repositories.append(row)
    result = {'schema_version': 'are.g01-post-r7-source-caches/v2', 'status': 'passed',
              'candidate_sha256': EXPECTED_CANDIDATE_SHA,
              'prior_receipt_sha256': EXPECTED_PRIOR_SHA,
              'prior_script_sha256': EXPECTED_PRIOR_SCRIPT_SHA,
              'script_sha256': sha(Path(__file__)),
              'volatile_roots': [old['volatile_root'], str(VOLATILE_ROOT)],
              'repositories': repositories,
              'new_fetch': {'repo': NEW_REPO, 'commit': task['base_commit'], 'elapsed_ms': fetch_elapsed_ms},
              'model_calls': 0, 'gold_loaded': False,
              'claim_ceiling': 'Exact source cache binding for candidate r2 only; volatile caches and no runner/index/model proof.',
              'open_questions': ['Will all 24 r2 tasks pass isolated checkout and source indexing?',
                                 'How will volatile caches be rehydrated before dispatch?']}
    if len(repositories) != 15 or sum(row['task_count'] for row in repositories) != 24:
        raise ValueError('cache-receipt-shape')
    descriptor = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'wb') as stream:
        stream.write((json.dumps(result, indent=2, sort_keys=True) + '\n').encode())
    print(json.dumps({'status': result['status'], 'repositories': len(repositories),
                      'tasks': 24, 'new_fetches': 1, 'receipt_sha256': sha(OUTPUT)}, sort_keys=True))


if __name__ == '__main__':
    main()
