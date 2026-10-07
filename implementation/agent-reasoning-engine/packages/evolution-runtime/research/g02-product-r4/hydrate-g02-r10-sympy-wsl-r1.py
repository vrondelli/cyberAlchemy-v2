#!/usr/bin/env python3
"""Stage only the six missing G02 r10 Sympy base commits in WSL."""

import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import time


CANDIDATE = Path('/home/vlad_/are-benchmark-archive/g02-r10-dev-pool-r1-20261002/CANDIDATE.json')
CANDIDATE_SHA = '1139a5877bcd686a63468bc75ff490963d4416313d1968ea64cc7dd43bc621dd'
ROOT = Path('/home/vlad_/are-benchmark-archive/g02-r10-sympy-cache-r1-20261002')
CACHE = ROOT / 'sympy--sympy.git'
RECEIPT = ROOT / 'SOURCE-CACHE.json'
URL = 'https://github.com/sympy/sympy.git'
MIN_FREE_BYTES = 100 * 1024**3
MAX_CACHE_BYTES = 2 * 1024**3
ENV = {**os.environ, 'GIT_TERMINAL_PROMPT': '0', 'GIT_CONFIG_NOSYSTEM': '1',
       'GIT_CONFIG_GLOBAL': '/dev/null', 'GIT_PROTOCOL_FROM_USER': '0'}


def sha(path):
    digest = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def git(*args, timeout=60):
    return subprocess.run(['git', '--no-optional-locks', '-C', str(CACHE), *args],
                          capture_output=True, text=True, timeout=timeout, env=ENV)


def need(value, reason):
    if not value:
        raise ValueError('g02-r10-sympy-cache.' + reason)


def main():
    need(not ROOT.exists() and not ROOT.is_symlink() and
         sha(CANDIDATE) == CANDIDATE_SHA and
         shutil.disk_usage(ROOT.parent).free >= MIN_FREE_BYTES,
         'input-output-or-space-boundary')
    candidate = json.loads(CANDIDATE.read_text())
    tasks = [row for row in candidate['ordered_tasks'] if row['repo'] == 'sympy/sympy']
    need(candidate['status'] == 'eligibility-screened-candidate-not-qualified-frozen-or-dispatched' and
         len(candidate['ordered_tasks']) == 24 and len(tasks) == 6 and
         len({row['base_commit'] for row in tasks}) == 6 and
         all(row['repo_url'] == URL and re.fullmatch('[0-9a-f]{40}', row['base_commit'])
             for row in tasks), 'candidate-shape')
    ROOT.mkdir(mode=0o700)
    initialized = subprocess.run(['git', 'init', '--bare', '-q', str(CACHE)],
                                 capture_output=True, timeout=30, env=ENV)
    need(initialized.returncode == 0 and git('remote', 'add', 'origin', URL).returncode == 0,
         'cache-init')
    fetched, failures, trees = [], [], {}
    for commit in sorted(row['base_commit'] for row in tasks):
        started = time.monotonic()
        try:
            result = git('fetch', '-q', '--no-tags', '--depth=1', 'origin', commit,
                         timeout=900)
            passed = result.returncode == 0
        except subprocess.TimeoutExpired:
            passed = False
        fetched.append({'commit': commit, 'status': 'passed' if passed else 'failed',
                        'elapsed_ms': round((time.monotonic() - started) * 1000)})
        print(json.dumps({'commit_prefix': commit[:12],
                          'fetch_status': fetched[-1]['status']}), flush=True)
        if not passed:
            failures.append({'commit': commit, 'reason': 'exact-fetch-failed'})
            break
        exact = git('rev-parse', '--verify', commit + '^{commit}')
        tree = git('rev-parse', '--verify', commit + '^{tree}')
        if (exact.returncode or exact.stdout.strip() != commit or tree.returncode or
                not re.fullmatch('[0-9a-f]{40}', tree.stdout.strip())):
            failures.append({'commit': commit, 'reason': 'commit-or-tree-mismatch'})
            break
        trees[commit] = tree.stdout.strip()
        if shutil.disk_usage(ROOT).free < MIN_FREE_BYTES:
            failures.append({'commit': commit, 'reason': 'wsl-free-space-guard'})
            break
    size = int(subprocess.run(['du', '-sb', str(CACHE)], capture_output=True, text=True,
                              timeout=60, check=True).stdout.split()[0])
    if size > MAX_CACHE_BYTES:
        failures.append({'reason': 'cache-size-guard'})
    status = 'passed' if not failures and len(trees) == 6 else 'failed'
    receipt = {
        'schema_version': 'are.g02-r10-sympy-wsl-source-cache/v1',
        'status': status, 'candidate_sha256': CANDIDATE_SHA,
        'script_sha256': sha(__file__), 'cache_path': str(CACHE),
        'origin': URL, 'commits': sorted(trees), 'trees': trees,
        'fetches': fetched, 'failures': failures, 'cache_bytes': size,
        'model_calls': 0, 'gold_loaded': False,
        'claim_ceiling': 'Exact public source cache only; VPS transfer, source indexes, arms, scores, and superiority unproven.',
        'open_questions': [
            'Can the exact cache be transferred and independently checked on VPS?',
            'Can all 24 task-specific source indexes and full r10 driver pass no-model preflight?',
        ],
    }
    fd = os.open(RECEIPT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'w') as stream:
        json.dump(receipt, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': status, 'commits': len(trees), 'cache_bytes': size,
                      'receipt_sha256': sha(RECEIPT)}, sort_keys=True), flush=True)
    if status != 'passed':
        raise SystemExit(2)


if __name__ == '__main__':
    main()
