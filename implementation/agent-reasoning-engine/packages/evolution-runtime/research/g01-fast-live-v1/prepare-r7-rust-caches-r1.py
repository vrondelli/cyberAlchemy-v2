#!/usr/bin/env python3
"""Source-only, no-model cache preflight for the 12 untouched Rust rows."""

import hashlib
import json
import subprocess
from pathlib import Path

import pyarrow.parquet as pq


BASE = Path('/opt/are/evolution-runtime')
PARQUET = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream/data/full.parquet'
SUPPLY = BASE / 'g01-cross-branch-supply-r3/SOURCE-SUPPLY-AUDIT.json'
ELIGIBILITY = BASE / 'g01-cross-branch-gold-eligibility-r3/GOLD-ELIGIBILITY-AUDIT.json'
CACHE_ROOT = Path('/opt/are-harness-benchmark/g01-r7-label-preflight-rust')
EXPECTED_SUPPLY_SHA = '57d26dc84226850d66eeb934ae2c347b038df946b0e9a86e1823ba1e9323a321'
EXPECTED_ELIGIBILITY_SHA = '386888a50e1010a87e5cd4b7c091f8072746e98292f62207690cb07a31779239'
ALLOWED_REPOS = {'nushell/nushell', 'rayon-rs/rayon', 'tokio-rs/tokio', 'tokio-rs/tracing'}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def command(*args, timeout=180):
    return subprocess.check_output(args, text=True, timeout=timeout, stderr=subprocess.DEVNULL).strip()


def source_rows():
    if sha(SUPPLY) != EXPECTED_SUPPLY_SHA or sha(ELIGIBILITY) != EXPECTED_ELIGIBILITY_SHA:
        raise ValueError('source-or-eligibility-receipt-drift')
    supply = json.loads(SUPPLY.read_text())
    eligibility = json.loads(ELIGIBILITY.read_text())
    if supply['source_parquet_sha256'] != sha(PARQUET) or eligibility['source_supply_sha256'] != EXPECTED_SUPPLY_SHA:
        raise ValueError('source-parquet-or-binding-drift')
    selected_ids = {r['instance_id'] for r in eligibility['rows']
                    if r['language'] == 'rust' and r['native_gold_files_present'] and not r['loader_error']}
    if len(selected_ids) != 12:
        raise ValueError('rust-population-drift')
    fields = ['instance_id', 'repo', 'repo_url', 'base_commit', 'language', 'source']
    rows = [r for r in pq.read_table(PARQUET, columns=fields).to_pylist() if r['instance_id'] in selected_ids]
    if len(rows) != 12 or {r['instance_id'] for r in rows} != selected_ids:
        raise ValueError('source-join-drift')
    for row in rows:
        if (row['language'] != 'rust' or row['repo'] not in ALLOWED_REPOS or
                row['repo_url'] != f'https://github.com/{row["repo"]}.git' or
                len(row['base_commit']) != 40 or
                any(c not in '0123456789abcdef' for c in row['base_commit'])):
            raise ValueError('source-row-shape')
    return sorted(rows, key=lambda r: (r['repo'], r['instance_id']))


def main():
    rows = source_rows()
    if not CACHE_ROOT.is_dir() or (CACHE_ROOT / 'CACHE-RECEIPT.json').exists():
        raise ValueError('cache-root-not-prepared-or-receipt-exists')
    output = []
    for row in rows:
        cache = CACHE_ROOT / (row['repo'].replace('/', '--') + '.git')
        if not cache.exists():
            subprocess.run(['git', 'init', '--bare', '-q', str(cache)], check=True, timeout=30)
        if command('git', '-C', str(cache), 'rev-parse', '--is-bare-repository') != 'true':
            raise ValueError('cache-not-bare')
        commit = row['base_commit']
        found = subprocess.run(['git', '-C', str(cache), 'cat-file', '-e', commit + '^{commit}'],
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0
        if not found:
            subprocess.run(['git', '-C', str(cache), 'fetch', '-q', '--depth=1', row['repo_url'], commit],
                           check=True, timeout=180, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        tree = command('git', '-C', str(cache), 'rev-parse', commit + '^{tree}')
        output.append({'instance_id': row['instance_id'], 'repo': row['repo'],
                       'base_commit': commit, 'tree': tree, 'cache': str(cache)})
    result = {'schema_version': 'are.g01-r7-rust-source-cache-preflight/v1',
              'posture': 'source-only-no-model-no-gold', 'supply_sha256': EXPECTED_SUPPLY_SHA,
              'eligibility_sha256': EXPECTED_ELIGIBILITY_SHA, 'parquet_sha256': sha(PARQUET),
              'script_sha256': sha(Path(__file__)), 'tasks': output,
              'claim_ceiling': 'Source cache readiness only; no label, quality, or cohort result.'}
    path = CACHE_ROOT / 'CACHE-RECEIPT.json'
    with path.open('x') as stream:
        json.dump(result, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'tasks': len(output), 'repositories': len({r['repo'] for r in output}),
                      'receipt_sha256': sha(path)}, sort_keys=True))


if __name__ == '__main__':
    main()
