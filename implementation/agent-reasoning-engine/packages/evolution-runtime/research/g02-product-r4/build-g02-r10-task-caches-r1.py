#!/usr/bin/env python3
"""Build guarded, isolated exact-tip G02 r10 caches without model or gold."""

import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess


BASE = Path('/opt/are/evolution-runtime')
CANDIDATE = BASE / 'g02-r10-dev-pool-r1/CANDIDATE.json'
OUTPUT = BASE / 'g02-r10-dev-pool-r1/TASK-CACHE-PREFLIGHT.json'
ROOT = Path('/tmp/are-g02-r10-task-caches-r1')
SYMPY_RECEIPT = Path('/tmp/are-g02-r10-sympy-cache-r1/SOURCE-CACHE.json')
CANDIDATE_SHA = '1139a5877bcd686a63468bc75ff490963d4416313d1968ea64cc7dd43bc621dd'
SYMPY_RECEIPT_SHA = 'ebf37e561d79a05f0152ae8e1fb7bdf524d3b3f2d381617cc898a8fdaaf00142'
PARENTS = {
    'ansible/ansible': Path('/opt/are-harness-benchmark/g02-fresh-pair-r4-preflight-20260929/cache/ansible'),
    'django/django': Path('/tmp/are-g02-r8-source-caches-r1/parents/django.git'),
    'sympy/sympy': Path('/tmp/are-g02-r10-sympy-cache-r1/sympy--sympy.git'),
    'sveltejs/svelte': Path('/tmp/are-g02-r8-source-caches-r1/parents/svelte.git'),
}
PREFIX = {'ansible/ansible': 'ansible', 'django/django': 'django',
          'sympy/sympy': 'sympy', 'sveltejs/svelte': 'svelte'}
ENV = {**os.environ, 'GIT_TERMINAL_PROMPT': '0', 'GIT_CONFIG_NOSYSTEM': '1',
       'GIT_CONFIG_GLOBAL': '/dev/null', 'GIT_PROTOCOL_FROM_USER': '0'}
MIN_TMP_FREE = 2 * 1024**3
MAX_TOTAL_CACHE_BYTES = 1024**3


def sha(path):
    digest = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def git(path, *args, timeout=180):
    return subprocess.run(['git', '--no-optional-locks', '-C', str(path), *args],
                          capture_output=True, text=True, timeout=timeout, env=ENV)


def git_out(path, *args):
    result = git(path, *args)
    return result.stdout.strip() if result.returncode == 0 else None


def need(value, reason):
    if not value:
        raise ValueError('g02-r10-task-caches.' + reason)


def main():
    need(not ROOT.exists() and not ROOT.is_symlink() and not OUTPUT.exists() and
         sha(CANDIDATE) == CANDIDATE_SHA and
         sha(SYMPY_RECEIPT) == SYMPY_RECEIPT_SHA and
         shutil.disk_usage('/tmp').free >= MIN_TMP_FREE,
         'input-output-or-storage-boundary')
    candidate = json.loads(CANDIDATE.read_text())
    tasks = candidate['ordered_tasks']
    need(candidate['status'] == 'eligibility-screened-candidate-not-qualified-frozen-or-dispatched' and
         len(tasks) == len({row['instance_id'] for row in tasks}) == 24 and
         set(row['repo'] for row in tasks) == set(PARENTS), 'candidate-shape')
    sympy = json.loads(SYMPY_RECEIPT.read_text())
    need(sympy['status'] == 'passed' and
         {row['base_commit'] for row in tasks if row['repo'] == 'sympy/sympy'} <=
         set(sympy['commits']), 'sympy-cache-binding')
    for repo, parent in PARENTS.items():
        rows = [row for row in tasks if row['repo'] == repo]
        need(len(rows) == 6 and parent.is_dir() and not parent.is_symlink() and
             git_out(parent, 'remote', 'get-url', 'origin') == rows[0]['repo_url'],
             'parent-origin:' + repo)
        for row in rows:
            need(re.fullmatch('[0-9a-f]{40}', row['base_commit']) and
                 git(parent, 'cat-file', '-e', row['base_commit'] + '^{commit}').returncode == 0,
                 'parent-exact-commit:' + repo)
    ROOT.mkdir(mode=0o700)
    cache = ROOT / 'cache'
    cache.mkdir(mode=0o755)
    results = []
    for row in tasks:
        ordinal, repo, commit = row['ordinal'], row['repo'], row['base_commit']
        need(ordinal == len(results) + 1 and
             shutil.disk_usage('/tmp').free >= MIN_TMP_FREE,
             'ordinal-or-storage:' + str(ordinal))
        parent = PARENTS[repo]
        leaf = PREFIX[repo] + '-' + commit[:12]
        target = cache / leaf
        need(not target.exists(), 'cache-leaf-collision:' + leaf)
        initialized = subprocess.run(['git', 'init', '--bare', '-q', str(target)],
                                     capture_output=True, timeout=30, env=ENV)
        need(initialized.returncode == 0, 'cache-init:' + str(ordinal))
        fetched = git(target, 'fetch', '-q', '--no-tags', '--depth=1',
                      'file://' + str(parent), commit, timeout=300)
        need(fetched.returncode == 0, 'local-shallow-fetch:' + str(ordinal) + ':' + fetched.stderr[-200:])
        need(git(target, 'remote', 'add', 'origin', row['repo_url']).returncode == 0,
             'cache-origin:' + str(ordinal))
        tree = git_out(parent, 'rev-parse', '--verify', commit + '^{tree}')
        need(git_out(target, 'rev-parse', '--verify', commit + '^{commit}') == commit and
             git_out(target, 'rev-parse', '--verify', commit + '^{tree}') == tree and
             git_out(target, 'rev-parse', '--is-shallow-repository') == 'true' and
             git_out(target, 'remote', 'get-url', 'origin') == row['repo_url'],
             'cache-identity:' + str(ordinal))
        size = int(subprocess.run(['du', '-sb', str(target)], capture_output=True,
                                  text=True, timeout=60, check=True).stdout.split()[0])
        results.append({'ordinal': ordinal, 'instance_id': row['instance_id'],
                        'repo': repo, 'origin': row['repo_url'],
                        'base_commit': commit, 'tree': tree, 'parent': str(parent),
                        'cache_leaf': leaf, 'cache_path': str(target),
                        'cache_bytes': size, 'shallow': True})
        need(sum(item['cache_bytes'] for item in results) <= MAX_TOTAL_CACHE_BYTES,
             'total-cache-size-guard')
        print(json.dumps({'ordinal': ordinal, 'repo': repo,
                          'exact_shallow_cache': 'passed'}), flush=True)
    receipt = {
        'schema_version': 'are.g02-r10-task-cache-preflight/v1',
        'status': 'passed', 'posture': 'source-only-no-model-no-gold',
        'candidate_sha256': CANDIDATE_SHA,
        'sympy_source_receipt_sha256': SYMPY_RECEIPT_SHA,
        'script_sha256': sha(__file__), 'cache_root': str(ROOT),
        'verified_count': len(results), 'total_cache_bytes': sum(row['cache_bytes'] for row in results),
        'results': results, 'model_calls': 0, 'gold_loaded': False,
        'claim_ceiling': 'Exact-tip shallow cache identity only; checkout, indexes, full driver, model, scores, and superiority unproven.',
        'open_questions': [
            'Do nonroot offline checkouts and bounded indexes pass for all 24 tasks?',
            'Can the r10 full driver path be qualified without model calls?',
        ],
    }
    with OUTPUT.open('x') as stream:
        json.dump(receipt, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': 'passed', 'sha256': sha(OUTPUT),
                      'verified_count': len(results),
                      'total_cache_bytes': receipt['total_cache_bytes']}, sort_keys=True))


if __name__ == '__main__':
    main()
