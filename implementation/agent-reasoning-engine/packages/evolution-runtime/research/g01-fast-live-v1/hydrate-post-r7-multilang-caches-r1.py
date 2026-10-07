#!/usr/bin/env python3
"""Source-only exact-commit cache hydration for the G01 24-task candidate.

New Git objects live in a bounded volatile tmpfs. The durable receipt binds
their identity but does not pretend those caches survive a reboot.
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


BASE = Path('/opt/are/evolution-runtime')
CANDIDATE = BASE / 'g01-post-r7-multilang-cohort-candidate-r1/COHORT-CANDIDATE.json'
OUTPUT_ROOT = BASE / 'g01-post-r7-source-caches-r1'
OUTPUT = OUTPUT_ROOT / 'SOURCE-CACHES.json'
VOLATILE_ROOT = Path('/tmp/are-g01-post-r7-source-caches-r1')
EXPECTED_CANDIDATE_SHA = '1e43240ce5246d55e04b2eae117fa14ef40d04598f6da27c967af090f6d7cb39'
MIN_TMP_FREE_BYTES = 1_000_000_000
MIN_DURABLE_FREE_BYTES = 1_500_000_000
KNOWN = {
    'https://github.com/sveltejs/svelte.git': Path('/opt/are-harness-benchmark/g01-r7-label-preflight-cgojs/sveltejs--svelte.git'),
    'https://github.com/prettier/prettier.git': Path('/opt/are-harness-benchmark/g01-r7-label-preflight-cgojs/prettier--prettier.git'),
    'https://github.com/serverless/serverless.git': Path('/opt/are-harness-benchmark/g01-r7-label-preflight-cgojs/serverless--serverless.git'),
    'https://github.com/internetarchive/openlibrary.git': Path('/opt/are-harness-benchmark/g02-fresh-pair-r3-20260926/cache/openlibrary'),
    'https://github.com/qutebrowser/qutebrowser.git': Path('/opt/are-harness-benchmark/g02-fresh-pair-r3-20260926/cache/qutebrowser'),
}


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def command(path, *args, timeout=600):
    run = subprocess.run(['git', '-C', str(path), *args], capture_output=True,
                         text=True, timeout=timeout)
    if run.returncode:
        raise RuntimeError(f'git-{args[0]}-failed')
    return run.stdout.strip()


def tree(path, commit):
    return command(path, 'rev-parse', commit + '^{tree}', timeout=60)


def cache_bytes(path):
    result = subprocess.run(['du', '-sb', str(path)], capture_output=True, text=True, timeout=30)
    return int(result.stdout.split()[0]) if result.returncode == 0 else None


def main():
    if sha(CANDIDATE) != EXPECTED_CANDIDATE_SHA:
        raise ValueError('candidate-drift')
    candidate = json.loads(CANDIDATE.read_text())
    tasks = candidate['ordered_tasks']
    if (candidate['status'] != 'preflight-only-not-frozen' or
            candidate['gold_values_or_paths_used'] is not False or
            len(tasks) != 24 or len({task['instance_id'] for task in tasks}) != 24 or
            OUTPUT.exists() or not OUTPUT_ROOT.is_dir() or VOLATILE_ROOT.exists()):
        raise ValueError('candidate-or-output-boundary')
    grouped = defaultdict(list)
    for task in tasks:
        url, commit = task['repo_url'], task['base_commit']
        if (not re.fullmatch(r'https://github\.com/[A-Za-z0-9._-]+/[A-Za-z0-9._-]+\.git', url) or
                not re.fullmatch(r'[a-f0-9]{40}', commit)):
            raise ValueError('source-url-or-commit-shape')
        grouped[url].append(task)
    VOLATILE_ROOT.mkdir(mode=0o700)
    by_url = {}
    fetches = []
    failed = []
    for url in sorted(grouped):
        if shutil.disk_usage('/tmp').free < MIN_TMP_FREE_BYTES or \
                shutil.disk_usage(BASE).free < MIN_DURABLE_FREE_BYTES:
            failed.append({'source': url, 'reason': 'disk-headroom-guard'})
            break
        if url in KNOWN:
            path, location = KNOWN[url], 'durable-existing'
        else:
            slug = url.removeprefix('https://github.com/').removesuffix('.git').replace('/', '--')
            path, location = VOLATILE_ROOT / (slug + '.git'), 'volatile-new'
            path.mkdir(mode=0o700)
            subprocess.run(['git', 'init', '--bare', '-q', str(path)], check=True, timeout=30)
            command(path, 'remote', 'add', 'origin', url, timeout=30)
        if command(path, 'remote', 'get-url', 'origin', timeout=30) != url:
            failed.append({'source': url, 'reason': 'origin-identity'})
            break
        commits = sorted({task['base_commit'] for task in grouped[url]})
        trees = {}
        for commit in commits:
            present = subprocess.run(['git', '-C', str(path), 'cat-file', '-e', commit + '^{commit}'],
                                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0
            if not present:
                if location != 'volatile-new':
                    failed.append({'source': url, 'reason': 'expected-commit-absent'})
                    break
                if shutil.disk_usage('/tmp').free < MIN_TMP_FREE_BYTES:
                    failed.append({'source': url, 'reason': 'tmp-headroom-guard'})
                    break
                started = time.monotonic()
                run = subprocess.run(['git', '-C', str(path), 'fetch', '-q', '--depth=1', 'origin', commit],
                                     capture_output=True, timeout=600)
                fetches.append({'source': url, 'commit': commit, 'status': 'passed' if run.returncode == 0 else 'failed',
                                'elapsed_ms': round((time.monotonic() - started) * 1000)})
                if run.returncode:
                    failed.append({'source': url, 'reason': 'exact-commit-fetch-failed'})
                    break
            try:
                trees[commit] = tree(path, commit)
            except RuntimeError:
                failed.append({'source': url, 'reason': 'tree-verification-failed'})
                break
        if failed:
            break
        by_url[url] = {'path': str(path), 'location': location, 'trees': trees,
                       'cache_bytes': cache_bytes(path)}
        print(json.dumps({'source': url.removeprefix('https://github.com/').removesuffix('.git'),
                          'location': location, 'commits': len(trees), 'cache_bytes': by_url[url]['cache_bytes']}),
              flush=True)
    repositories = []
    if not failed:
        for repo in sorted({task['repo'] for task in tasks}):
            group = [task for task in tasks if task['repo'] == repo]
            urls = {task['repo_url'] for task in group}
            if len(urls) != 1:
                failed.append({'source': repo, 'reason': 'dataset-group-multiple-origins'})
                break
            url = next(iter(urls))
            info = by_url[url]
            repositories.append({'repo': repo, 'repository_path': info['path'],
                                 'origin': url, 'commits': sorted({task['base_commit'] for task in group}),
                                 'trees': {task['base_commit']: info['trees'][task['base_commit']] for task in group},
                                 'task_count': len(group), 'cache_location': info['location'],
                                 'cache_bytes': info['cache_bytes']})
    result = {'schema_version': 'are.g01-post-r7-source-caches/v1',
              'status': 'passed' if not failed and len(repositories) == 15 else 'failed',
              'candidate_sha256': EXPECTED_CANDIDATE_SHA,
              'script_sha256': sha(Path(__file__)),
              'volatile_root': str(VOLATILE_ROOT),
              'repositories': repositories, 'fetches': fetches, 'failed': failed,
              'model_calls': 0, 'gold_loaded': False,
              'claim_ceiling': 'Exact Git-origin and commit/tree source-cache preflight; volatile caches are not durable, and runner checkout/index readiness, model quality, and superiority are unproven.',
              'open_questions': ['Will the full candidate pass isolated checkout and source-index preflight?',
                                 'How will volatile caches be rehydrated and reverified before any later campaign dispatch?']}
    descriptor = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'wb') as stream:
        stream.write((json.dumps(result, indent=2, sort_keys=True) + '\n').encode())
    print(json.dumps({'status': result['status'], 'repositories': len(repositories),
                      'tasks': sum(row['task_count'] for row in repositories),
                      'fetches': len(fetches), 'failed': failed, 'receipt_sha256': sha(OUTPUT)}), flush=True)
    if result['status'] != 'passed':
        raise SystemExit(2)


if __name__ == '__main__':
    main()
