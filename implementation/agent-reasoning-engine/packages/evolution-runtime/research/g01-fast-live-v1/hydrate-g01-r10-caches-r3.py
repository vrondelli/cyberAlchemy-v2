#!/usr/bin/env python3
"""Guarded exact-commit Git cache hydration for a score-blind G01 r10 r3 candidate."""

from collections import defaultdict
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import time


BASE = Path('/opt/are/evolution-runtime')
CANDIDATE = BASE / 'g01-r10-clean-cohort-candidate-r3/COHORT-CANDIDATE.json'
PRIOR = (
    (BASE / 'g01-r10-source-caches-r1/SOURCE-CACHES.json',
     '98663f95ef6eb75f1c478d2a5acec350ebbee0b13566e2aaea470ecf65102637'),
    (BASE / 'g01-post-r8-source-caches-r2/SOURCE-CACHES.json',
     '5ae0ea5dc5b71a49e4ece613b25810dfb0ce48f407ee8e861cc7cd48a9e728a9'),
    (BASE / 'g01-post-r7-source-caches-r2/SOURCE-CACHES.json',
     '4715d97c477a3a091ae7bbd384f7c1545cc6d4944e90cf9e9f7234ae3a2f941e'),
)
OUTPUT = BASE / 'g01-r10-source-caches-r3/SOURCE-CACHES.json'
VOLATILE_ROOT = Path('/tmp/are-g01-r10-source-caches-r3')
CANDIDATE_SHA = 'b8dd31574b9d38d34d86009cd601c7ae304e47532f43df29bbf3b1db5d787c7b'
MIN_TMP_FREE = 3_200_000_000
MIN_DURABLE_FREE = 1_500_000_000


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def git(path, *args, timeout=60):
    return subprocess.run(['git', '-C', str(path), *args], capture_output=True,
                          text=True, timeout=timeout,
                          env={**os.environ, 'GIT_TERMINAL_PROMPT': '0',
                               'GIT_CONFIG_NOSYSTEM': '1'})


def git_value(path, *args):
    result = git(path, *args)
    return result.stdout.strip() if result.returncode == 0 else None


def cache_bytes(path):
    result = subprocess.run(['du', '-sb', str(path)], capture_output=True,
                            text=True, timeout=30)
    return int(result.stdout.split()[0]) if result.returncode == 0 else None


def free_guard():
    return (shutil.disk_usage('/tmp').free >= MIN_TMP_FREE and
            shutil.disk_usage(BASE).free >= MIN_DURABLE_FREE)


def main():
    if (sha(CANDIDATE) != CANDIDATE_SHA or OUTPUT.exists() or
            not OUTPUT.parent.is_dir() or VOLATILE_ROOT.exists()):
        raise ValueError('input-or-output-boundary')
    candidate = json.loads(CANDIDATE.read_text())
    tasks = candidate['ordered_tasks']
    if (candidate.get('schema_version') != 'are.g01-r10-clean-source-only-candidate/v1' or
            candidate.get('status') != 'preflight-only-not-frozen' or
            candidate.get('model_calls') != 0 or
            candidate.get('gold_values_or_paths_used') is not False or
            len(tasks) != 24):
        raise ValueError('candidate-shape')
    known = defaultdict(list)
    for path, digest in PRIOR:
        if sha(path) != digest:
            raise ValueError('prior-cache-receipt-drift')
        receipt = json.loads(path.read_text())
        if receipt.get('status') != 'passed' or receipt.get('gold_loaded') is not False:
            raise ValueError('prior-cache-receipt-invalid')
        for row in receipt.get('origins', receipt.get('repositories', [])):
            known[row['origin']].append(Path(row['repository_path']))
    grouped = defaultdict(set)
    for task in tasks:
        url, commit = task['repo_url'], task['base_commit']
        if (not re.fullmatch(r'https://github\.com/[A-Za-z0-9._-]+/[A-Za-z0-9._-]+\.git', url) or
                not re.fullmatch(r'[a-f0-9]{40}', commit)):
            raise ValueError('source-url-or-commit-shape')
        grouped[url].add(commit)
    if len(grouped) != 18 or not free_guard():
        raise ValueError('origin-count-or-initial-headroom')
    VOLATILE_ROOT.mkdir(mode=0o700)
    origins, fetches, failed = [], [], []
    for url in sorted(grouped):
        commits = sorted(grouped[url])
        if not free_guard():
            failed.append({'origin': url, 'reason': 'disk-headroom-guard'})
            break
        existing = next((path for path in known[url]
                         if path.is_dir() and git_value(path, 'remote', 'get-url', 'origin') == url and
                         all(git(path, 'cat-file', '-e', commit + '^{commit}').returncode == 0
                             for commit in commits)), None)
        if existing:
            path, location = existing, 'existing-read-only'
        else:
            slug = url.removeprefix('https://github.com/').removesuffix('.git').replace('/', '--')
            path, location = VOLATILE_ROOT / (slug + '.git'), 'volatile-new'
            path.mkdir(mode=0o700)
            subprocess.run(['git', 'init', '--bare', '-q', str(path)], check=True, timeout=30)
            if git(path, 'remote', 'add', 'origin', url).returncode:
                failed.append({'origin': url, 'reason': 'remote-add-failed'})
                break
        if git_value(path, 'remote', 'get-url', 'origin') != url:
            failed.append({'origin': url, 'reason': 'origin-identity'})
            break
        trees = {}
        for commit in commits:
            if git(path, 'cat-file', '-e', commit + '^{commit}').returncode:
                if location != 'volatile-new' or not free_guard():
                    failed.append({'origin': url, 'commit': commit, 'reason': 'commit-absent-or-headroom'})
                    break
                start = time.monotonic()
                result = git(path, 'fetch', '-q', '--depth=1', 'origin', commit, timeout=600)
                fetches.append({'origin': url, 'commit': commit,
                                'status': 'passed' if result.returncode == 0 else 'failed',
                                'elapsed_ms': round((time.monotonic() - start) * 1000)})
                print(json.dumps({'origin': url, 'commit': commit[:12],
                                  'fetch_status': fetches[-1]['status']}), flush=True)
                if result.returncode:
                    failed.append({'origin': url, 'commit': commit, 'reason': 'exact-commit-fetch-failed'})
                    break
            tree = git_value(path, 'rev-parse', commit + '^{tree}')
            if not isinstance(tree, str) or not re.fullmatch(r'[a-f0-9]{40}', tree):
                failed.append({'origin': url, 'commit': commit, 'reason': 'tree-verification-failed'})
                break
            trees[commit] = tree
        if failed:
            break
        origins.append({'origin': url, 'repository_path': str(path),
                        'commits': commits, 'trees': trees,
                        'cache_location': location, 'cache_bytes': cache_bytes(path)})
    by_origin = {row['origin']: row for row in origins}
    bindings = [] if failed else [
        {'instance_id': task['instance_id'], 'repo': task['repo'],
         'origin': task['repo_url'], 'base_commit': task['base_commit'],
         'repository_path': by_origin[task['repo_url']]['repository_path'],
         'tree': by_origin[task['repo_url']]['trees'][task['base_commit']]}
        for task in tasks]
    status = 'passed' if not failed and len(origins) == 18 and len(bindings) == 24 else 'failed'
    result = {'schema_version': 'are.g01-r10-source-caches/v1', 'status': status,
              'candidate_sha256': CANDIDATE_SHA,
              'prior_cache_receipt_sha256': [digest for _, digest in PRIOR],
              'script_sha256': sha(Path(__file__)), 'volatile_root': str(VOLATILE_ROOT),
              'origins': origins, 'task_bindings': bindings,
              'fetches': fetches, 'failed': failed,
              'model_calls': 0, 'gold_loaded': False,
              'claim_ceiling': 'Exact-commit source-cache identity only; not checkout/index, gold-file, model-quality or superiority proof.',
              'open_questions': ['Will isolated checkout and bounded source index pass for every task?',
                                 'Can volatile caches be cold-copied and restored before dispatch?']}
    descriptor = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'wb') as stream:
        stream.write((json.dumps(result, indent=2, sort_keys=True) + '\n').encode())
    print(json.dumps({'status': status, 'origins': len(origins),
                      'tasks': len(bindings), 'fetches': len(fetches), 'failed': failed,
                      'receipt_sha256': sha(OUTPUT)}, sort_keys=True), flush=True)
    if status != 'passed':
        raise SystemExit(2)


if __name__ == '__main__':
    main()
