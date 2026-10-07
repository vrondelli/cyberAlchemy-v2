#!/usr/bin/env python3
"""Fetch exact untouched C/Go/JavaScript commits into isolated source-only caches."""

import argparse
import hashlib
import json
import shutil
import subprocess
from pathlib import Path

import pyarrow.parquet as pq


BASE = Path('/opt/are/evolution-runtime')
PARQUET = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream/data/full.parquet'
SUPPLY = BASE / 'g01-cross-branch-supply-r3/SOURCE-SUPPLY-AUDIT.json'
ELIGIBILITY = BASE / 'g01-cross-branch-gold-eligibility-r3/GOLD-ELIGIBILITY-AUDIT.json'
CACHE_ROOT = Path('/opt/are-harness-benchmark/g01-r7-label-preflight-cgojs')
EXPECTED_SUPPLY_SHA = '57d26dc84226850d66eeb934ae2c347b038df946b0e9a86e1823ba1e9323a321'
EXPECTED_ELIGIBILITY_SHA = '386888a50e1010a87e5cd4b7c091f8072746e98292f62207690cb07a31779239'
TARGETS = {
    'ponylang/ponyc': ('c', 31),
    'cli/cli': ('go', 21),
    'sveltejs/svelte': ('javascript', 43),
}
MIN_FREE_BYTES = 2_500_000_000


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def command(*args, timeout=180):
    return subprocess.check_output(args, text=True, timeout=timeout, stderr=subprocess.DEVNULL).strip()


def source_rows(repo):
    if sha(SUPPLY) != EXPECTED_SUPPLY_SHA or sha(ELIGIBILITY) != EXPECTED_ELIGIBILITY_SHA:
        raise ValueError('source-or-eligibility-receipt-drift')
    supply = json.loads(SUPPLY.read_text())
    eligibility = json.loads(ELIGIBILITY.read_text())
    if supply['source_parquet_sha256'] != sha(PARQUET) or eligibility['source_supply_sha256'] != EXPECTED_SUPPLY_SHA:
        raise ValueError('source-parquet-or-binding-drift')
    language, expected_count = TARGETS[repo]
    ids = {r['instance_id'] for r in eligibility['rows']
           if r['repo'] == repo and r['language'] == language and
           r['native_gold_files_present'] and not r['loader_error']}
    if len(ids) != expected_count:
        raise ValueError('target-population-drift')
    fields = ['instance_id', 'repo', 'repo_url', 'base_commit', 'language', 'source']
    rows = [r for r in pq.read_table(PARQUET, columns=fields).to_pylist() if r['instance_id'] in ids]
    if len(rows) != expected_count or {r['instance_id'] for r in rows} != ids:
        raise ValueError('source-join-drift')
    for row in rows:
        commit = row['base_commit']
        if (row['repo'] != repo or row['language'] != language or
                row['repo_url'] != f'https://github.com/{repo}.git' or
                len(commit) != 40 or any(c not in '0123456789abcdef' for c in commit)):
            raise ValueError('source-row-shape')
    return sorted(rows, key=lambda r: r['instance_id'])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--repo', required=True, choices=sorted(TARGETS))
    args = parser.parse_args()
    rows = source_rows(args.repo)
    if not CACHE_ROOT.is_dir():
        raise ValueError('exact cache root must exist')
    name = args.repo.replace('/', '--')
    cache = CACHE_ROOT / (name + '.git')
    output = CACHE_ROOT / (name + '-CACHE-RECEIPT.json')
    if output.exists():
        raise ValueError('receipt-exists')
    if not cache.exists():
        subprocess.run(['git', 'init', '--bare', '-q', str(cache)], check=True, timeout=30)
    if command('git', '-C', str(cache), 'rev-parse', '--is-bare-repository') != 'true':
        raise ValueError('cache-not-bare')
    tasks = []
    for row in rows:
        commit = row['base_commit']
        found = subprocess.run(['git', '-C', str(cache), 'cat-file', '-e', commit + '^{commit}'],
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0
        if not found:
            if shutil.disk_usage(CACHE_ROOT).free < MIN_FREE_BYTES:
                raise ValueError('disk-headroom-guard')
            subprocess.run(['git', '-C', str(cache), 'fetch', '-q', '--depth=1', row['repo_url'], commit],
                           check=True, timeout=180, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        tree = command('git', '-C', str(cache), 'rev-parse', commit + '^{tree}')
        tasks.append({'instance_id': row['instance_id'], 'repo': args.repo,
                      'base_commit': commit, 'tree': tree, 'cache': str(cache)})
    result = {'schema_version': 'are.g01-r7-cgojs-source-cache-preflight/v1',
              'posture': 'source-only-no-model-no-gold', 'supply_sha256': EXPECTED_SUPPLY_SHA,
              'eligibility_sha256': EXPECTED_ELIGIBILITY_SHA, 'parquet_sha256': sha(PARQUET),
              'script_sha256': sha(Path(__file__)), 'repo': args.repo, 'tasks': tasks,
              'claim_ceiling': 'Source cache readiness only; no label, quality, or cohort result.'}
    with output.open('x') as stream:
        json.dump(result, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'repo': args.repo, 'tasks': len(tasks), 'receipt_sha256': sha(output)}, sort_keys=True))


if __name__ == '__main__':
    main()
