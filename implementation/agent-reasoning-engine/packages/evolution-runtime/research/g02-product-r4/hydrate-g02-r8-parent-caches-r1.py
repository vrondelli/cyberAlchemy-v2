#!/usr/bin/env python3
"""Fetch exact r8 commits into three G02-owned partial parent caches."""

import hashlib
import json
import subprocess
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
CANDIDATE = BASE / 'g02-r8-screening-pool-r1/CANDIDATE.json'
OUTPUT = BASE / 'g02-r8-screening-pool-r1/PARENT-CACHE-HYDRATION.json'
ROOT = Path('/tmp/are-g02-r8-source-caches-r1')
CANDIDATE_SHA = 'da2c3e68c1f62da2198bfbf89c598029af898ea7cacc523f516009e9fa307196'
NEW = {'django/django': 'django.git',
       'astropy/astropy': 'astropy.git',
       'sveltejs/svelte': 'svelte.git'}
ANSIBLE = Path('/opt/are-harness-benchmark/g02-fresh-pair-r4-preflight-20260929/cache/ansible')


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def run(*args, timeout=300):
    return subprocess.run(args, capture_output=True, text=True, timeout=timeout)


def need(value, reason):
    if not value:
        raise ValueError('g02-r8-parent-cache.' + reason)


def main():
    need(not ROOT.exists() and not OUTPUT.exists() and
         sha(CANDIDATE) == CANDIDATE_SHA, 'input-or-output-drift')
    rows = json.loads(CANDIDATE.read_text())['ordered_tasks']
    need(len(rows) == 24, 'candidate-shape')
    (ROOT / 'parents').mkdir(parents=True, mode=0o700)
    (ROOT / 'cache').mkdir(mode=0o755)
    results = []
    for repo in ('ansible/ansible', 'django/django', 'astropy/astropy', 'sveltejs/svelte'):
        tasks = [r for r in rows if r['repo'] == repo]
        need(len(tasks) == 6 and len({r['repo_url'] for r in tasks}) == 1,
             'repo-shape:' + repo)
        path = ANSIBLE if repo == 'ansible/ansible' else ROOT / 'parents' / NEW[repo]
        if repo != 'ansible/ansible':
            initialized = run('git', 'init', '--bare', str(path))
            need(initialized.returncode == 0, 'init:' + repo + ':' + initialized.stderr[-200:])
            remote = run('git', '-C', str(path), 'remote', 'add', 'origin', tasks[0]['repo_url'])
            need(remote.returncode == 0, 'remote-add:' + repo)
        origin = run('git', '-C', str(path), 'remote', 'get-url', 'origin')
        need(origin.returncode == 0 and origin.stdout.strip() == tasks[0]['repo_url'],
             'origin:' + repo)
        for row in tasks:
            commit = row['base_commit']
            ref = 'refs/heads/are-g02-r8-' + commit[:8]
            present = run('git', '-C', str(path), 'cat-file', '-e', commit + '^{commit}')
            fetched = False
            if present.returncode:
                need(repo != 'ansible/ansible', 'ansible-commit-missing')
                result = run('git', '-C', str(path), 'fetch', '--filter=blob:none',
                             '--no-tags', 'origin', commit + ':' + ref, timeout=600)
                need(result.returncode == 0, 'fetch:' + repo + ':' + result.stderr[-300:])
                fetched = True
            pinned = run('git', '-C', str(path), 'update-ref', ref, commit)
            exact = run('git', '-C', str(path), 'rev-parse', '--verify', commit + '^{commit}')
            need(pinned.returncode == 0 and exact.returncode == 0 and
                 exact.stdout.strip() == commit, 'exact-commit:' + str(row['ordinal']))
            results.append({'ordinal': row['ordinal'], 'repo': repo,
                            'base_commit': commit, 'parent_cache': str(path),
                            'fetched_exact_commit': fetched, 'origin_match': True,
                            'exact_commit_available': True})
            print(json.dumps({'ordinal': row['ordinal'], 'repo': repo,
                              'fetched': fetched}), flush=True)
    payload = {'schema_version': 'are.g02-r8-parent-cache-hydration/v1',
               'posture': 'source-only-no-gold-path-no-score-no-model',
               'candidate_sha256': CANDIDATE_SHA, 'script_sha256': sha(__file__),
               'verified_count': len(results), 'results': results,
               'claim_ceiling': 'Exact-commit parent caches only; not offline checkout/index, native score, or superiority.',
               'open_questions': ['Can every selected tip be packaged in an offline task cache?',
                                  'Will fixed 64 MiB index and whole arm fit resource limits?']}
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': '24-parent-commits-verified', 'sha256': sha(OUTPUT)}))


if __name__ == '__main__':
    main()
