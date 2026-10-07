#!/usr/bin/env python3
"""No-network repair of an exact-commit cache receipt with multi-origin labels."""

from collections import defaultdict
import hashlib
import json
import os
from pathlib import Path
import subprocess


BASE = Path('/opt/are/evolution-runtime')
CANDIDATE = BASE / 'g01-post-r8-clean-cohort-candidate-r3/COHORT-CANDIDATE.json'
PRIOR = BASE / 'g01-post-r7-source-caches-r2/SOURCE-CACHES.json'
FAILED = BASE / 'g01-post-r8-source-caches-r1/SOURCE-CACHES.json'
VOLATILE_ROOT = Path('/tmp/are-g01-post-r8-source-caches-r1')
OUTPUT = BASE / 'g01-post-r8-source-caches-r2/SOURCE-CACHES.json'
CANDIDATE_SHA = '9f7005a59071aa5c25bfcd8942874dd7c910e6315791d455bb3465a09dee8194'
PRIOR_SHA = '4715d97c477a3a091ae7bbd384f7c1545cc6d4944e90cf9e9f7234ae3a2f941e'
FAILED_SHA = '5fa73af6e11e96014b4d6754063dc39f79eba03c558117fd76958d797053140a'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def git(path, *args):
    run = subprocess.run(['git', '-C', str(path), *args], capture_output=True, text=True, timeout=30,
                         env={**os.environ, 'GIT_TERMINAL_PROMPT': '0'})
    return run.stdout.strip() if run.returncode == 0 else None


def main():
    if (sha(CANDIDATE) != CANDIDATE_SHA or sha(PRIOR) != PRIOR_SHA or sha(FAILED) != FAILED_SHA or
            OUTPUT.exists() or not OUTPUT.parent.is_dir()):
        raise ValueError('input-or-output-drift')
    candidate, prior, failed = (json.loads(path.read_text()) for path in (CANDIDATE, PRIOR, FAILED))
    tasks = candidate['ordered_tasks']
    if (len(tasks) != 24 or candidate['model_calls'] != 0 or
            candidate['gold_values_or_paths_used'] is not False or
            failed['status'] != 'failed' or len(failed['fetches']) != 20 or
            any(row['status'] != 'passed' for row in failed['fetches']) or
            failed['failed'] != [{'repo': 'fasterxml/jackson', 'reason': 'dataset-group-multiple-origins'}]):
        raise ValueError('failed-receipt-shape')
    grouped = defaultdict(list)
    for task in tasks:
        grouped[task['repo_url']].append(task)
    old_paths = defaultdict(list)
    for row in prior['repositories']:
        old_paths[row['origin']].append(Path(row['repository_path']))
    origins, by_origin = [], {}
    for url in sorted(grouped):
        commits = sorted({task['base_commit'] for task in grouped[url]})
        candidates = old_paths[url][:]
        slug = url.removeprefix('https://github.com/').removesuffix('.git').replace('/', '--')
        candidates.append(VOLATILE_ROOT / (slug + '.git'))
        eligible = []
        for path in candidates:
            if not path.is_dir() or path.resolve() != path or git(path, 'remote', 'get-url', 'origin') != url:
                continue
            trees = {commit: git(path, 'rev-parse', commit + '^{tree}') for commit in commits}
            if all(tree is not None and len(tree) == 40 for tree in trees.values()):
                eligible.append((path, trees))
        if not eligible:
            raise ValueError(f'missing-exact-origin-commits:{url}')
        path, trees = eligible[0]
        row = {'origin': url, 'repository_path': str(path), 'commits': commits, 'trees': trees,
               'cache_location': 'volatile-new' if path.is_relative_to(VOLATILE_ROOT) else 'existing-read-only'}
        origins.append(row)
        by_origin[url] = row
    rows = [{'instance_id': task['instance_id'], 'repo': task['repo'], 'origin': task['repo_url'],
             'base_commit': task['base_commit'], 'repository_path': by_origin[task['repo_url']]['repository_path'],
             'tree': by_origin[task['repo_url']]['trees'][task['base_commit']]}
            for task in tasks]
    if len(origins) != 17 or len(rows) != 24:
        raise ValueError('cache-binding-count')
    result = {'schema_version': 'are.g01-post-r8-source-caches/v2', 'status': 'passed',
              'candidate_sha256': CANDIDATE_SHA, 'failed_prior_receipt_sha256': FAILED_SHA,
              'prior_cache_receipt_sha256': PRIOR_SHA, 'script_sha256': sha(Path(__file__)),
              'volatile_root': str(VOLATILE_ROOT), 'origins': origins, 'task_bindings': rows,
              'model_calls': 0, 'gold_loaded': False,
              'claim_ceiling': 'Exact-commit source-cache identity only; no runner/index, gold-file, model-quality or superiority proof.',
              'open_questions': ['Will each isolated checkout and bounded source index pass?',
                                 'How will volatile caches be cold-copied and reverified before dispatch?']}
    descriptor = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'wb') as stream:
        stream.write((json.dumps(result, indent=2, sort_keys=True) + '\n').encode())
    print(json.dumps({'status': result['status'], 'origins': len(origins), 'tasks': len(rows),
                      'receipt_sha256': sha(OUTPUT)}, sort_keys=True))


if __name__ == '__main__':
    main()
