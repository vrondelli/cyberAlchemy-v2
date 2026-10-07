#!/usr/bin/env python3
"""Bounded WSL exact-commit staging for the source-only G01 r11 candidate.

This does not freeze or run the campaign. It leaves every partial cache intact
on failure and emits no credentials, labels, scores, or fetched source content.
"""

from collections import defaultdict
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import time


CANDIDATE = Path('/home/vlad_/are-benchmark-archive/g01-r11-clean-cohort-candidate-r1-20261001/COHORT-CANDIDATE.json')
CANDIDATE_SHA = 'dd8a659b36e5f9f6dd13fe7dfb452eb75793777a0348791fa65f302349ebb458'
ROOT = Path('/home/vlad_/are-benchmark-archive/g01-r11-source-caches-r1-20261001')
RECEIPT = ROOT / 'SOURCE-CACHES.json'
MAX_CACHE_BYTES = 12 * 1024**3
MIN_WSL_FREE_BYTES = 100 * 1024**3
GIT_ENV = {**os.environ, 'GIT_TERMINAL_PROMPT': '0', 'GIT_CONFIG_NOSYSTEM': '1',
           'GIT_CONFIG_GLOBAL': '/dev/null', 'GIT_PROTOCOL_FROM_USER': '0'}


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def git(path, *args, timeout=60):
    return subprocess.run(['git', '--no-optional-locks', '-C', str(path), *args],
                          capture_output=True, text=True, timeout=timeout,
                          env=GIT_ENV)


def git_output(path, *args):
    result = git(path, *args)
    return result.stdout.strip() if result.returncode == 0 else None


def allocated_bytes(path):
    result = subprocess.run(['du', '-sb', str(path)], capture_output=True,
                            text=True, timeout=60, check=True)
    return int(result.stdout.split()[0])


def save_new(path, value):
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(value, sort_keys=True, indent=2) + '\n').encode())


def main():
    if sha(CANDIDATE) != CANDIDATE_SHA or RECEIPT.exists() or ROOT.is_symlink():
        raise ValueError('candidate-or-output-boundary')
    candidate = json.loads(CANDIDATE.read_text())
    tasks = candidate['ordered_tasks']
    if (candidate.get('schema_version') != 'are.g01-r11-clean-source-only-candidate/v1' or
            candidate.get('status') != 'preflight-only-not-frozen' or
            candidate.get('gold_values_or_paths_used') is not False or
            candidate.get('model_calls') != 0 or len(tasks) != 24 or
            candidate.get('selected_git_origins') != 15):
        raise ValueError('candidate-shape')
    if shutil.disk_usage(ROOT.parent).free < MIN_WSL_FREE_BYTES:
        raise ValueError('wsl-free-space-guard')
    ROOT.mkdir(mode=0o700, exist_ok=True)
    grouped = defaultdict(set)
    for task in tasks:
        url, commit = task['repo_url'], task['base_commit']
        if (not re.fullmatch(r'https://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+\.git', url) or
                not re.fullmatch(r'[0-9a-f]{40}', commit)):
            raise ValueError('source-url-or-commit-shape')
        grouped[url].add(commit)
    if len(grouped) != 15:
        raise ValueError('origin-count')
    origins, fetches, failures = [], [], []
    for url in sorted(grouped):
        slug = url.removeprefix('https://github.com/').removesuffix('.git').replace('/', '--')
        path = ROOT / (slug + '.git')
        if path.is_symlink():
            raise ValueError('cache-symlink')
        if not path.exists():
            path.mkdir(mode=0o700)
            init = subprocess.run(['git', 'init', '--bare', '-q', str(path)],
                                  capture_output=True, timeout=30, env=GIT_ENV)
            if init.returncode or git(path, 'remote', 'add', 'origin', url).returncode:
                failures.append({'origin': url, 'reason': 'cache-init-failed'})
                break
        if not path.is_dir() or git_output(path, 'remote', 'get-url', 'origin') != url:
            failures.append({'origin': url, 'reason': 'origin-identity'})
            break
        trees = {}
        for commit in sorted(grouped[url]):
            if git(path, 'cat-file', '-e', commit + '^{commit}').returncode:
                started = time.monotonic()
                try:
                    fetched = git(path, 'fetch', '-q', '--no-tags', '--depth=1', 'origin', commit,
                                  timeout=900)
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
            tree = git_output(path, 'rev-parse', commit + '^{tree}')
            if not tree or not re.fullmatch(r'[0-9a-f]{40}', tree):
                failures.append({'origin': url, 'commit': commit,
                                 'reason': 'tree-verification-failed'})
                break
            trees[commit] = tree
        if failures:
            break
        origins.append({'origin': url, 'repository_path': str(path),
                        'commits': sorted(grouped[url]), 'trees': trees,
                        'cache_bytes': allocated_bytes(path)})
        total = sum(row['cache_bytes'] for row in origins)
        if total > MAX_CACHE_BYTES or shutil.disk_usage(ROOT).free < MIN_WSL_FREE_BYTES:
            failures.append({'origin': url, 'reason': 'bounded-storage-guard'})
            break
    by_origin = {row['origin']: row for row in origins}
    bindings = [] if failures else [
        {'instance_id': task['instance_id'], 'repo': task['repo'],
         'origin': task['repo_url'], 'base_commit': task['base_commit'],
         'repository_path': by_origin[task['repo_url']]['repository_path'],
         'tree': by_origin[task['repo_url']]['trees'][task['base_commit']]}
        for task in tasks]
    status = 'passed' if not failures and len(origins) == 15 and len(bindings) == 24 else 'failed'
    result = {
        'schema_version': 'are.g01-r11-wsl-source-caches/v1', 'status': status,
        'candidate_sha256': CANDIDATE_SHA, 'script_sha256': sha(Path(__file__)),
        'cache_root': str(ROOT), 'origins': origins, 'task_bindings': bindings,
        'fetches': fetches, 'failed': failures,
        'total_cache_bytes': sum(row['cache_bytes'] for row in origins),
        'model_calls': 0, 'gold_loaded': False,
        'claim_ceiling': 'WSL exact-commit source-cache staging only; VPS cache/index, native-gold, paired quality, and superiority unproven.',
        'open_questions': ['Can bounded transfer and identical Git trees be admitted on the VPS?',
                           'Do task-specific source indexes admit all native reference files?',
                           'Can exact run scratch fit without deleting retained evidence?'],
    }
    save_new(RECEIPT, result)
    print(json.dumps({'status': status, 'origins': len(origins), 'tasks': len(bindings),
                      'fetches': len(fetches), 'total_cache_bytes': result['total_cache_bytes'],
                      'failed': failures, 'receipt_sha256': sha(RECEIPT)}, sort_keys=True), flush=True)
    if status != 'passed':
        raise SystemExit(2)


if __name__ == '__main__':
    main()
