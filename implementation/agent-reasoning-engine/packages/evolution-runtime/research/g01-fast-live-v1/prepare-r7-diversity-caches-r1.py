#!/usr/bin/env python3
"""Source-only exact-commit cache preflight for additional G01 repositories."""

import argparse
import hashlib
import importlib.util
import json
import shutil
import subprocess
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
PRIOR_SCRIPT = Path(__file__).with_name('prepare-r7-cgojs-caches-r1.py')
EXPECTED_PRIOR_SCRIPT_SHA = 'c5f2f25c2729f0ff0f924a321f472b52cb6a76931034451193d1606d1ed6e1a4'
TARGETS = {
    'serverless/serverless': ('javascript', 12),
    'future-architect/vuls': ('go', 4),
    'iamkun/dayjs': ('javascript', 9),
    'prettier/prettier': ('javascript', 11),
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--repo', required=True, choices=sorted(TARGETS))
    args = parser.parse_args()
    if sha(PRIOR_SCRIPT) != EXPECTED_PRIOR_SCRIPT_SHA:
        raise ValueError('source-preflight-script-drift')
    spec = importlib.util.spec_from_file_location('g01_r7_source_preflight', PRIOR_SCRIPT)
    prior = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(prior)
    prior.TARGETS = TARGETS
    rows = prior.source_rows(args.repo)
    if not prior.CACHE_ROOT.is_dir():
        raise ValueError('exact cache root must exist')
    name = args.repo.replace('/', '--')
    cache = prior.CACHE_ROOT / (name + '.git')
    output = prior.CACHE_ROOT / (name + '-CACHE-RECEIPT.json')
    if output.exists():
        raise ValueError('receipt-exists')
    if not cache.exists():
        subprocess.run(['git', 'init', '--bare', '-q', str(cache)], check=True, timeout=30)
    if prior.command('git', '-C', str(cache), 'rev-parse', '--is-bare-repository') != 'true':
        raise ValueError('cache-not-bare')
    tasks = []
    for row in rows:
        commit = row['base_commit']
        found = subprocess.run(['git', '-C', str(cache), 'cat-file', '-e', commit + '^{commit}'],
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0
        if not found:
            if shutil.disk_usage(prior.CACHE_ROOT).free < prior.MIN_FREE_BYTES:
                raise ValueError('disk-headroom-guard')
            subprocess.run(['git', '-C', str(cache), 'fetch', '-q', '--depth=1', row['repo_url'], commit],
                           check=True, timeout=180, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        tree = prior.command('git', '-C', str(cache), 'rev-parse', commit + '^{tree}')
        tasks.append({'instance_id': row['instance_id'], 'repo': args.repo,
                      'base_commit': commit, 'tree': tree, 'cache': str(cache)})
    result = {'schema_version': 'are.g01-r7-diversity-source-cache-preflight/v1',
              'posture': 'source-only-no-model-no-gold', 'supply_sha256': prior.EXPECTED_SUPPLY_SHA,
              'eligibility_sha256': prior.EXPECTED_ELIGIBILITY_SHA, 'parquet_sha256': sha(prior.PARQUET),
              'prior_script_sha256': EXPECTED_PRIOR_SCRIPT_SHA, 'script_sha256': sha(Path(__file__)),
              'repo': args.repo, 'tasks': tasks,
              'claim_ceiling': 'Source cache readiness only; no label, quality, or cohort result.'}
    with output.open('x') as stream:
        json.dump(result, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'repo': args.repo, 'tasks': len(tasks), 'receipt_sha256': sha(output)}, sort_keys=True))


if __name__ == '__main__':
    main()
