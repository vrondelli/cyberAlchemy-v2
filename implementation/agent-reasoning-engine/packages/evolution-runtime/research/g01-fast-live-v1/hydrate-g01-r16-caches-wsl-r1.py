#!/usr/bin/env python3
"""Fetch only the 24 pinned r16 source commits into a new bounded WSL cache."""

from collections import defaultdict
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import shutil
import subprocess
import time


CANDIDATE = Path('/home/vlad_/are-benchmark-archive/g01-r16-clean-cohort-candidate-r1/COHORT-CANDIDATE.json')
CANDIDATE_SHA = '13debf87a53346d0aa667c7b49b1fd0b3291d922d09a5a2a2533e4000365405e'
PRIOR = Path('/home/vlad_/projects/cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/hydrate-g01-r12-caches-wsl-r1.py')
ROOT = Path('/home/vlad_/are-benchmark-archive/g01-r16-source-caches-r1-20261002')
RECEIPT = ROOT / 'SOURCE-CACHES.json'
MAX_BYTES = 1536 * 1024**2
MIN_FREE = 100 * 1024**3


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def id_sha(ids):
    return hashlib.sha256(('\n'.join(sorted(ids)) + '\n').encode()).hexdigest()


def main():
    if sha(CANDIDATE) != CANDIDATE_SHA or ROOT.exists() or ROOT.is_symlink():
        raise ValueError('candidate-or-output-boundary')
    candidate = json.loads(CANDIDATE.read_text())
    tasks = candidate['ordered_tasks']
    if (candidate['schema_version'] != 'are.g01-r16-development-cap-eight-candidate-r1/v1' or
            candidate['status'] != 'preflight-only-not-frozen' or
            candidate['model_calls'] != 0 or candidate['gold_values_or_paths_used'] is not False or
            len(tasks) != 24 or candidate['selected_git_origins'] != 5 or
            candidate['task_id_set_sha256'] != id_sha(row['instance_id'] for row in tasks)):
        raise ValueError('candidate-shape')
    if shutil.disk_usage(ROOT.parent).free < MIN_FREE:
        raise ValueError('wsl-free-space-guard')
    spec = importlib.util.spec_from_file_location('g01_r16_prior_hydrator', PRIOR)
    prior = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(prior)
    grouped = defaultdict(set)
    for task in tasks:
        url, commit = task['repo_url'], task['base_commit']
        if (not re.fullmatch(r'https://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+\.git', url) or
                not re.fullmatch(r'[0-9a-f]{40}', commit)):
            raise ValueError('source-url-or-commit-shape')
        grouped[url].add(commit)
    if len(grouped) != 5:
        raise ValueError('origin-count')
    ROOT.mkdir(mode=0o700)
    origins, fetches, failures = [], [], []
    for url in sorted(grouped):
        slug = url.removeprefix('https://github.com/').removesuffix('.git').replace('/', '--')
        path = ROOT / (slug + '.git')
        if path.is_symlink() or path.exists():
            raise ValueError('cache-target-exists')
        path.mkdir(mode=0o700)
        init = subprocess.run(['git', 'init', '--bare', '-q', str(path)],
                              capture_output=True, timeout=30, env=prior.GIT_ENV)
        if init.returncode or prior.git(path, 'remote', 'add', 'origin', url).returncode:
            failures.append({'origin': url, 'reason': 'cache-init-failed'})
            break
        if prior.git_output(path, 'remote', 'get-url', 'origin') != url:
            failures.append({'origin': url, 'reason': 'origin-identity'})
            break
        trees = {}
        for commit in sorted(grouped[url]):
            started = time.monotonic()
            try:
                fetched = prior.git(path, 'fetch', '-q', '--no-tags', '--depth=1',
                                    'origin', commit, timeout=900)
                ok = fetched.returncode == 0
            except subprocess.TimeoutExpired:
                ok = False
            fetches.append({'origin': url, 'commit': commit,
                            'status': 'passed' if ok else 'failed',
                            'elapsed_ms': round((time.monotonic() - started) * 1000)})
            print(json.dumps({'origin': url, 'commit_prefix': commit[:12],
                              'fetch_status': fetches[-1]['status']}), flush=True)
            if not ok:
                failures.append({'origin': url, 'commit': commit,
                                 'reason': 'exact-commit-fetch-failed'})
                break
            tree = prior.git_output(path, 'rev-parse', commit + '^{tree}')
            if not tree or not re.fullmatch(r'[0-9a-f]{40}', tree):
                failures.append({'origin': url, 'commit': commit,
                                 'reason': 'tree-verification-failed'})
                break
            trees[commit] = tree
        if failures:
            break
        origins.append({'origin': url, 'repository_path': str(path),
                        'commits': sorted(grouped[url]), 'trees': trees,
                        'cache_bytes': prior.allocated_bytes(path)})
        if (sum(row['cache_bytes'] for row in origins) > MAX_BYTES or
                shutil.disk_usage(ROOT).free < MIN_FREE):
            failures.append({'origin': url, 'reason': 'bounded-storage-guard'})
            break
    by_origin = {row['origin']: row for row in origins}
    bindings = [] if failures else [
        {'instance_id': task['instance_id'], 'repo': task['repo'],
         'origin': task['repo_url'], 'base_commit': task['base_commit'],
         'repository_path': by_origin[task['repo_url']]['repository_path'],
         'tree': by_origin[task['repo_url']]['trees'][task['base_commit']]}
        for task in tasks]
    status = 'passed' if not failures and len(origins) == 5 and len(bindings) == 24 else 'failed'
    result = {'schema_version': 'are.g01-r16-wsl-source-caches/v1', 'status': status,
              'candidate_sha256': CANDIDATE_SHA, 'script_sha256': sha(Path(__file__)),
              'cache_root': str(ROOT), 'origins': origins, 'task_bindings': bindings,
              'fetches': fetches, 'failed': failures,
              'total_cache_bytes': sum(row['cache_bytes'] for row in origins),
              'model_calls': 0, 'gold_loaded': False,
              'claim_ceiling': 'Exact WSL source cache staging only; no VPS/index/native-reference or benchmark result',
              'open_questions': ['Can these exact trees be copied and verified on VPS tmpfs?',
                                 'Will all 24 source indexes and native references admit?']}
    prior.save_new(RECEIPT, result)
    print(json.dumps({'status': status, 'origins': len(origins), 'tasks': len(bindings),
                      'fetches': len(fetches), 'total_cache_bytes': result['total_cache_bytes'],
                      'failed': failures, 'receipt_sha256': sha(RECEIPT)}, sort_keys=True), flush=True)
    if status != 'passed':
        raise SystemExit(2)


if __name__ == '__main__':
    main()
