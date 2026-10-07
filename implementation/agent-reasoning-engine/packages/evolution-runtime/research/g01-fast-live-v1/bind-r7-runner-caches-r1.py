#!/usr/bin/env python3
"""Bind fresh r7 bare caches to the runner's exact Git-origin contract."""

import hashlib
import json
import re
import subprocess
from collections import defaultdict
from pathlib import Path


CANDIDATE = Path('/opt/are-harness-benchmark/g01-r7-cohort-candidate-r1/COHORT-CANDIDATE.json')
OUTPUT = Path('/opt/are-harness-benchmark/g01-r7-runner-caches-r1/SOURCE-CACHES.json')
CGOJS = Path('/opt/are-harness-benchmark/g01-r7-label-preflight-cgojs')
RUST = Path('/opt/are-harness-benchmark/g01-r7-label-preflight-rust/CACHE-RECEIPT.json')
EXPECTED_CANDIDATE_SHA = '3a347d0e32c5b9705ac48408b703eb09eb1be23db6100f8f816bcf6d11b90a35'
EXPECTED_RUST_SHA = 'f7a807d094cf5291ee8bf63fa3a40903ac6c5c7b7f30dbaaa5e50fa1464b1625'
EXPECTED_CACHE_RECEIPTS = {
    'ponylang/ponyc': '52c6fac2a82b34ae7a405a4b77327ee36e5150b6215d8097a05a7df5317102db',
    'cli/cli': '6f971400ba89d0b53db25ccf0e73e9abf68196ca8f86c3a0897f036f36e57ff3',
    'sveltejs/svelte': '0fd68c41ad8739e69b3633ae0c662eab18f496d427e459b930d8dba3df93f00a',
    'serverless/serverless': '13f6569150ecbfdb709ecdde4fe85504b063cc5972ea43e49f3b48808137b1ac',
    'iamkun/dayjs': 'af1c4571d7b7db650c9d7046df1708ff5e67d6e530a27bdcd35ba689410692f8',
    'prettier/prettier': '7ac9c2b53e7bf5c3b88ff22e00536ed001bd4055fe2a5477050a8754af30a04a',
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def git(path, *args, allow_failure=False):
    run = subprocess.run(['git', '-C', str(path), *args], capture_output=True, text=True, timeout=15)
    if run.returncode and not allow_failure:
        raise RuntimeError(f'git-command-failed:{args[0]}')
    return run.stdout.strip() if run.returncode == 0 else None


def main():
    if sha(CANDIDATE) != EXPECTED_CANDIDATE_SHA or sha(RUST) != EXPECTED_RUST_SHA:
        raise ValueError('candidate-or-rust-cache-drift')
    candidate = json.loads(CANDIDATE.read_text())
    if candidate['status'] != 'preflight-only-not-frozen' or len(candidate['ordered_tasks']) != 24:
        raise ValueError('candidate-shape')
    source_receipts = {}
    for repo, expected_sha in EXPECTED_CACHE_RECEIPTS.items():
        path = CGOJS / (repo.replace('/', '--') + '-CACHE-RECEIPT.json')
        if sha(path) != expected_sha:
            raise ValueError(f'cache-receipt-drift:{repo}')
        source_receipts[repo] = json.loads(path.read_text())
    source_receipts['rust'] = json.loads(RUST.read_text())
    by_id = {}
    for repo, receipt in source_receipts.items():
        for row in receipt['tasks']:
            if row['instance_id'] in by_id or (repo != 'rust' and row['repo'] != repo):
                raise ValueError('duplicate-or-mismatched-cache-task')
            by_id[row['instance_id']] = row
    groups = defaultdict(list)
    for task in candidate['ordered_tasks']:
        cached = by_id.get(task['instance_id'])
        if (cached is None or cached['repo'] != task['repo'] or
                cached['base_commit'] != task['base_commit'] or
                not re.fullmatch(r'https://github\.com/[A-Za-z0-9._-]+/[A-Za-z0-9._-]+\.git', task['repo_url'])):
            raise ValueError('selected-task-cache-binding')
        groups[task['repo']].append((task, cached))
    if len(groups) != 8 or not OUTPUT.parent.is_dir() or OUTPUT.exists():
        raise ValueError('runner-cache-root-or-repository-count')
    rows = []
    for repo, group in groups.items():
        paths = {row['cache'] for _, row in group}
        urls = {task['repo_url'] for task, _ in group}
        if len(paths) != 1 or len(urls) != 1:
            raise ValueError('cache-path-or-url-inconsistent')
        path, url = Path(next(iter(paths))), next(iter(urls))
        if git(path, 'rev-parse', '--is-bare-repository') != 'true':
            raise ValueError('cache-not-bare')
        origin = git(path, 'remote', 'get-url', 'origin', allow_failure=True)
        if origin is None:
            git(path, 'remote', 'add', 'origin', url)
            origin = git(path, 'remote', 'get-url', 'origin')
        if origin != url:
            raise ValueError('origin-identity')
        commits = []
        for task, cached in group:
            commit = task['base_commit']
            if (git(path, 'cat-file', '-t', commit + '^{commit}') != 'commit' or
                    git(path, 'rev-parse', commit + '^{tree}') != cached['tree']):
                raise ValueError('commit-or-tree-drift')
            commits.append(commit)
        rows.append({'repo': repo, 'repository_path': str(path), 'origin': url,
                     'commits': list(dict.fromkeys(commits)), 'task_count': len(group)})
    result = {'schema_version': 'are.g01-r7-source-caches/v1', 'status': 'passed',
              'candidate_sha256': EXPECTED_CANDIDATE_SHA, 'model_calls': 0, 'gold_loaded': False,
              'cache_receipt_sha256': {**EXPECTED_CACHE_RECEIPTS, 'rust': EXPECTED_RUST_SHA},
              'script_sha256': sha(Path(__file__)), 'repositories': rows,
              'claim_ceiling': 'Runner cache identity only; not checkout/index, score, or superiority evidence.'}
    with OUTPUT.open('x') as stream:
        json.dump(result, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': 'passed', 'repositories': len(rows),
                      'tasks': sum(row['task_count'] for row in rows), 'receipt_sha256': sha(OUTPUT)}, sort_keys=True))


if __name__ == '__main__':
    main()
