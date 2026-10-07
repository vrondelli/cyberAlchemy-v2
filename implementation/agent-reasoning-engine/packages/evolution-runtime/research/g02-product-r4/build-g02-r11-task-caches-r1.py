#!/usr/bin/env python3
"""Build ref-backed exact-tip caches and rehearse both G02 arm clones."""

import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile


BASE = Path('/opt/are/evolution-runtime')
CANDIDATE = BASE / 'g02-r11-dev-pool-r1/CANDIDATE.json'
OUTPUT = BASE / 'g02-r11-dev-pool-r1/TASK-CACHE-CLONE-PREFLIGHT-R1.json'
ROOT = Path('/tmp/are-g02-r11-task-caches-r1')
CANDIDATE_SHA = '6150685f909ba7ee2d83154375e5599511620aae3a9c820e1178c29c1e7c8b42'
PREFIX = {'ansible/ansible': 'ansible', 'django/django': 'django',
          'sympy/sympy': 'sympy', 'nlohmann/json': 'nlohmann-json'}
FETCH_ENV = {**os.environ, 'GIT_TERMINAL_PROMPT': '0', 'GIT_CONFIG_NOSYSTEM': '1',
             'GIT_CONFIG_GLOBAL': '/dev/null', 'GIT_PROTOCOL_FROM_USER': '0',
             'GIT_ALLOW_PROTOCOL': 'https'}
LOCAL_ENV = {**os.environ, 'GIT_TERMINAL_PROMPT': '0', 'GIT_CONFIG_NOSYSTEM': '1',
             'GIT_CONFIG_GLOBAL': '/dev/null'}
MIN_TMP_FREE = 2 * 1024**3
MAX_TOTAL_CACHE_BYTES = 1536 * 1024**2


def sha(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def run(*args, timeout=180, env=LOCAL_ENV):
    return subprocess.run(args, capture_output=True, text=True, timeout=timeout, env=env)


def need(ok, reason):
    if not ok:
        raise ValueError('g02-r11-task-cache-clone.' + reason)


def git(path, *args, timeout=180, env=LOCAL_ENV):
    return run('git', '--no-optional-locks', '-C', str(path), *args,
               timeout=timeout, env=env)


def git_out(path, *args):
    result = git(path, *args)
    return result.stdout.strip() if result.returncode == 0 else None


def main():
    need(not ROOT.exists() and not ROOT.is_symlink() and not OUTPUT.exists() and
         sha(CANDIDATE) == CANDIDATE_SHA and
         shutil.disk_usage('/tmp').free >= 3 * 1024**3,
         'input-output-or-space')
    candidate = json.loads(CANDIDATE.read_text())
    tasks = candidate['ordered_tasks']
    need(candidate['status'] == 'eligibility-screened-candidate-not-qualified-frozen-or-dispatched' and
         len(tasks) == len({row['instance_id'] for row in tasks}) == 24 and
         {row['repo'] for row in tasks} == set(PREFIX), 'candidate-shape')
    ROOT.mkdir(mode=0o700)
    cache_root = ROOT / 'cache'
    cache_root.mkdir(mode=0o755)
    rows = []
    for task in tasks:
        ordinal, repo, commit = task['ordinal'], task['repo'], task['base_commit']
        need(ordinal == len(rows) + 1 and repo in PREFIX and
             re.fullmatch('[0-9a-f]{40}', commit) and
             shutil.disk_usage('/tmp').free >= MIN_TMP_FREE,
             'ordinal-source-or-space:' + str(ordinal))
        leaf = PREFIX[repo] + '-' + commit[:12]
        target = cache_root / leaf
        need(not target.exists(), 'cache-leaf-collision:' + leaf)
        initialized = run('git', 'init', '--bare', '-q', str(target), timeout=30,
                          env=FETCH_ENV)
        need(initialized.returncode == 0, 'cache-init:' + str(ordinal))
        need(git(target, 'remote', 'add', 'origin', task['repo_url'],
                 env=FETCH_ENV).returncode == 0, 'cache-origin:' + str(ordinal))
        fetched = git(target, 'fetch', '-q', '--no-tags', '--depth=1',
                      'origin', commit, timeout=900, env=FETCH_ENV)
        need(fetched.returncode == 0,
             'exact-origin-fetch:' + str(ordinal) + ':' + fetched.stderr[-200:])
        need(git_out(target, 'rev-parse', '--verify', commit + '^{commit}') == commit and
             git_out(target, 'rev-parse', '--is-shallow-repository') == 'true' and
             git_out(target, 'remote', 'get-url', 'origin') == task['repo_url'],
             'fetched-identity:' + str(ordinal))
        need(git(target, 'update-ref', 'refs/heads/benchmark-base', commit).returncode == 0 and
             git(target, 'symbolic-ref', 'HEAD',
                 'refs/heads/benchmark-base').returncode == 0,
             'ref-install:' + str(ordinal))
        tree = git_out(target, 'rev-parse', '--verify', commit + '^{tree}')
        need(tree is not None and re.fullmatch('[0-9a-f]{40}', tree) and
             git_out(target, 'rev-parse', '--verify', 'HEAD') == commit,
             'ref-tree:' + str(ordinal))
        clones = []
        for arm in ('are', 'dsh'):
            with tempfile.TemporaryDirectory(prefix=f'are-g02-r11-cache-{ordinal:02d}-{arm}-',
                                             dir='/tmp') as scratch:
                checkout = Path(scratch) / 'source'
                cloned = run('git', 'clone', '--no-local', '--no-checkout',
                             str(target), str(checkout), timeout=600)
                need(cloned.returncode == 0,
                     'clone:' + str(ordinal) + ':' + arm + ':' + cloned.stderr[-180:])
                checked = run('git', '-C', str(checkout), 'checkout', '--detach',
                              commit, timeout=600)
                need(checked.returncode == 0,
                     'checkout:' + str(ordinal) + ':' + arm + ':' + checked.stderr[-180:])
                checked_tree = git_out(checkout, 'rev-parse', '--verify', 'HEAD^{tree}')
                need(checked_tree == tree, 'clone-tree:' + str(ordinal) + ':' + arm)
                clones.append({'arm': arm, 'clone': 'passed', 'checkout': 'passed',
                               'tree': checked_tree})
        size = int(run('du', '-sb', str(target), timeout=60).stdout.split()[0])
        rows.append({'ordinal': ordinal, 'instance_id': task['instance_id'],
                     'repo': repo, 'origin': task['repo_url'], 'base_commit': commit,
                     'tree': tree, 'cache_leaf': leaf, 'cache_path': str(target),
                     'cache_bytes': size, 'shallow': True,
                     'ref': 'refs/heads/benchmark-base', 'clones': clones})
        need(sum(row['cache_bytes'] for row in rows) <= MAX_TOTAL_CACHE_BYTES,
             'total-cache-size-guard')
        print(json.dumps({'ordinal': ordinal, 'repo': repo,
                          'clones': len(clones), 'status': 'passed'}), flush=True)
    receipt = {
        'schema_version': 'are.g02-r11-task-cache-clone-preflight/v1',
        'status': 'passed', 'posture': 'source-only-no-model-no-gold',
        'candidate_sha256': CANDIDATE_SHA, 'script_sha256': sha(__file__),
        'cache_root': str(ROOT), 'verified_count': len(rows),
        'clone_count': sum(len(row['clones']) for row in rows),
        'total_cache_bytes': sum(row['cache_bytes'] for row in rows),
        'results': rows, 'model_calls': 0, 'gold_loaded': False,
        'claim_ceiling': 'Exact-tip shallow cache identity and both arm clone paths only; indexes, full driver, matched scores, and superiority unproven.',
        'open_questions': ['Do bounded source indexes and evaluator-only base-reference reachability pass?',
                           'Does the full no-model driver source binding pass before freeze?'],
    }
    with OUTPUT.open('x') as stream:
        json.dump(receipt, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': 'passed', 'sha256': sha(OUTPUT),
                      'verified_count': len(rows), 'clone_count': receipt['clone_count'],
                      'total_cache_bytes': receipt['total_cache_bytes']}))


if __name__ == '__main__':
    main()
