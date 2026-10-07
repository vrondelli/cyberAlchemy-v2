#!/usr/bin/env python3
"""Bind exact-commit caches for the score-blind post-r8 G01 cohort."""

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
CANDIDATE = BASE / 'g01-post-r8-clean-cohort-candidate-r3/COHORT-CANDIDATE.json'
PRIOR = BASE / 'g01-post-r7-source-caches-r2/SOURCE-CACHES.json'
OUTPUT_ROOT = BASE / 'g01-post-r8-source-caches-r1'
OUTPUT = OUTPUT_ROOT / 'SOURCE-CACHES.json'
VOLATILE_ROOT = Path('/tmp/are-g01-post-r8-source-caches-r1')
CANDIDATE_SHA = '9f7005a59071aa5c25bfcd8942874dd7c910e6315791d455bb3465a09dee8194'
PRIOR_SHA = '4715d97c477a3a091ae7bbd384f7c1545cc6d4944e90cf9e9f7234ae3a2f941e'
MIN_TMP_FREE = 1_000_000_000
MIN_DURABLE_FREE = 1_500_000_000


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def git(path, *args, timeout=60):
    env = {**os.environ, 'GIT_TERMINAL_PROMPT': '0'}
    return subprocess.run(['git', '-C', str(path), *args], capture_output=True,
                          text=True, timeout=timeout, env=env)


def has_commit(path, commit):
    return git(path, 'cat-file', '-e', commit + '^{commit}').returncode == 0


def cache_bytes(path):
    run = subprocess.run(['du', '-sb', str(path)], capture_output=True, text=True, timeout=30)
    return int(run.stdout.split()[0]) if run.returncode == 0 else None


def main():
    if (sha(CANDIDATE) != CANDIDATE_SHA or sha(PRIOR) != PRIOR_SHA or
            OUTPUT.exists() or not OUTPUT_ROOT.is_dir() or VOLATILE_ROOT.exists()):
        raise ValueError('input-or-output-boundary')
    candidate, prior = json.loads(CANDIDATE.read_text()), json.loads(PRIOR.read_text())
    tasks = candidate['ordered_tasks']
    if (candidate['schema_version'] != 'are.g01-post-r8-clean-source-only-candidate/v2' or
            candidate['status'] != 'preflight-only-not-frozen' or candidate['model_calls'] != 0 or
            candidate['gold_values_or_paths_used'] is not False or len(tasks) != 24 or
            prior['status'] != 'passed' or prior['gold_loaded'] is not False):
        raise ValueError('candidate-or-prior-cache-shape')
    grouped = defaultdict(list)
    for task in tasks:
        url, commit = task['repo_url'], task['base_commit']
        if (not re.fullmatch(r'https://github\.com/[A-Za-z0-9._-]+/[A-Za-z0-9._-]+\.git', url) or
                not re.fullmatch(r'[a-f0-9]{40}', commit)):
            raise ValueError('source-url-or-commit-shape')
        grouped[url].append(task)
    old_by_origin = defaultdict(list)
    for row in prior['repositories']:
        old_by_origin[row['origin']].append(Path(row['repository_path']))
    if (shutil.disk_usage('/tmp').free < MIN_TMP_FREE or
            shutil.disk_usage(BASE).free < MIN_DURABLE_FREE):
        raise ValueError('initial-disk-headroom')
    VOLATILE_ROOT.mkdir(mode=0o700)
    by_origin, fetches, failed = {}, [], []
    for url in sorted(grouped):
        commits = sorted({task['base_commit'] for task in grouped[url]})
        if (shutil.disk_usage('/tmp').free < MIN_TMP_FREE or
                shutil.disk_usage(BASE).free < MIN_DURABLE_FREE):
            failed.append({'origin': url, 'reason': 'disk-headroom-guard'})
            break
        existing = next((path for path in old_by_origin[url]
                         if path.is_dir() and git(path, 'remote', 'get-url', 'origin').stdout.strip() == url
                         and all(has_commit(path, commit) for commit in commits)), None)
        if existing:
            path, location = existing, 'existing-read-only'
        else:
            slug = url.removeprefix('https://github.com/').removesuffix('.git').replace('/', '--')
            path, location = VOLATILE_ROOT / (slug + '.git'), 'volatile-new'
            path.mkdir(mode=0o700)
            subprocess.run(['git', 'init', '--bare', '-q', str(path)], check=True, timeout=30)
            add = git(path, 'remote', 'add', 'origin', url)
            if add.returncode:
                failed.append({'origin': url, 'reason': 'remote-add-failed'})
                break
        origin = git(path, 'remote', 'get-url', 'origin')
        if origin.returncode or origin.stdout.strip() != url:
            failed.append({'origin': url, 'reason': 'origin-identity'})
            break
        trees = {}
        for commit in commits:
            if not has_commit(path, commit):
                if location != 'volatile-new' or shutil.disk_usage('/tmp').free < MIN_TMP_FREE:
                    failed.append({'origin': url, 'commit': commit, 'reason': 'commit-absent-or-headroom'})
                    break
                started = time.monotonic()
                run = git(path, 'fetch', '-q', '--depth=1', 'origin', commit, timeout=600)
                fetches.append({'origin': url, 'commit': commit,
                                'status': 'passed' if run.returncode == 0 else 'failed',
                                'elapsed_ms': round((time.monotonic() - started) * 1000)})
                print(json.dumps({'origin': url, 'commit': commit[:12],
                                  'fetch_status': fetches[-1]['status']}), flush=True)
                if run.returncode:
                    failed.append({'origin': url, 'commit': commit, 'reason': 'exact-commit-fetch-failed'})
                    break
            tree = git(path, 'rev-parse', commit + '^{tree}')
            if tree.returncode or not re.fullmatch(r'[a-f0-9]{40}', tree.stdout.strip()):
                failed.append({'origin': url, 'commit': commit, 'reason': 'tree-verification-failed'})
                break
            trees[commit] = tree.stdout.strip()
        if failed:
            break
        by_origin[url] = {'path': str(path), 'location': location, 'trees': trees,
                          'cache_bytes': cache_bytes(path)}
    repositories = []
    if not failed:
        for repo in sorted({task['repo'] for task in tasks}):
            group = [task for task in tasks if task['repo'] == repo]
            urls = {task['repo_url'] for task in group}
            if len(urls) != 1:
                failed.append({'repo': repo, 'reason': 'dataset-group-multiple-origins'})
                break
            url = next(iter(urls))
            info = by_origin[url]
            repositories.append({'repo': repo, 'repository_path': info['path'], 'origin': url,
                                 'commits': sorted({task['base_commit'] for task in group}),
                                 'trees': {task['base_commit']: info['trees'][task['base_commit']] for task in group},
                                 'task_count': len(group), 'cache_location': info['location'],
                                 'cache_bytes': info['cache_bytes']})
    result = {'schema_version': 'are.g01-post-r8-source-caches/v1',
              'status': 'passed' if not failed and len(by_origin) == 17 and len(repositories) == 17 else 'failed',
              'candidate_sha256': CANDIDATE_SHA, 'prior_cache_receipt_sha256': PRIOR_SHA,
              'script_sha256': sha(Path(__file__)), 'volatile_root': str(VOLATILE_ROOT),
              'repositories': repositories, 'origin_count': len(by_origin), 'fetches': fetches,
              'failed': failed, 'model_calls': 0, 'gold_loaded': False,
              'claim_ceiling': 'Exact Git origin/commit/tree cache binding only; volatile caches, no runner/index, model score or superiority proof.',
              'open_questions': ['Will all 24 isolated checkouts and bounded source indexes pass?',
                                 'How will volatile caches be cold-copied and reverified before dispatch?']}
    descriptor = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'wb') as stream:
        stream.write((json.dumps(result, indent=2, sort_keys=True) + '\n').encode())
    print(json.dumps({'status': result['status'], 'origins': len(by_origin),
                      'repositories': len(repositories), 'tasks': sum(row['task_count'] for row in repositories),
                      'fetches': len(fetches), 'failed': failed, 'receipt_sha256': sha(OUTPUT)}), flush=True)
    if result['status'] != 'passed':
        raise SystemExit(2)


if __name__ == '__main__':
    main()
