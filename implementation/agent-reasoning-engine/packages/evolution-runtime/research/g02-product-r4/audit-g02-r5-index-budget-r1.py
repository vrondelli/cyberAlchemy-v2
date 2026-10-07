#!/usr/bin/env python3
"""Evaluator-only full 32 MiB index-budget simulation for G02 r5 tasks."""

import hashlib
import json
import subprocess
import sys
from collections import Counter
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
ROOT = BASE / 'g02-r5-fresh-cohort-candidate-r1'
CANDIDATE = ROOT / 'CANDIDATE.json'
PREBUDGET = ROOT / 'NATIVE-ELIGIBILITY-R2.json'
OUTPUT = ROOT / 'INDEX-BUDGET-AUDIT.json'
UPSTREAM = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
PARQUET = UPSTREAM / 'data/full.parquet'
INDEX = Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr4-own-expansions-preflight-r1/code/base-overlay.mjs')
CANDIDATE_SHA = 'a6bfe7c3ed6f4f87e70e6f30bf67790e3edfc26f7f9322c18aa129f3b61488c0'
PREBUDGET_SHA = 'f6c3f32224d89324e11ab9cc72ab77a6526568d30a9293705c89522292df2466'
PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
INDEX_SHA = '1389c7a3fbdc096463787614778c4b9087104ef252c54659d542c68874e91c89'
PER_FILE = 1024 * 1024
BUDGET = 32 * 1024 * 1024


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError(f'g02-r5-index-budget.{reason}')


def indexed_paths(cache, commit):
    listing = subprocess.run(['git', '-C', str(cache), 'ls-tree', '-r', '-l', '-z', commit],
                             capture_output=True, check=True).stdout
    rows = []
    for record in listing.split(b'\0'):
        if not record:
            continue
        meta, raw_path = record.split(b'\t', 1)
        mode, kind, oid, raw_size = meta.split()
        path = raw_path.decode('utf-8', 'surrogateescape')
        rows.append((path, mode, kind, oid, raw_size))
    need(rows == sorted(rows, key=lambda row: row[0]), 'tree-order')
    selected = set()
    counts = Counter()
    indexed_bytes = 0
    batch = subprocess.Popen(['git', '-C', str(cache), 'cat-file', '--batch'],
                             stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                             stderr=subprocess.PIPE)
    try:
        for path, mode, kind, oid, raw_size in rows:
            if kind != b'blob' or mode not in (b'100644', b'100755'):
                counts['non_regular'] += 1
                continue
            size = int(raw_size)
            if size > PER_FILE or indexed_bytes + size > BUDGET:
                counts['size_or_budget_omitted'] += 1
                continue
            batch.stdin.write(oid + b'\n')
            batch.stdin.flush()
            header = batch.stdout.readline().split()
            need(len(header) == 3 and header[0] == oid and header[1] == b'blob'
                 and int(header[2]) == size, 'blob-header')
            content = batch.stdout.read(size)
            need(len(content) == size and batch.stdout.read(1) == b'\n', 'blob-body')
            if b'\0' in content[:8192]:
                counts['binary_omitted'] += 1
                continue
            indexed_bytes += size
            selected.add(path)
        batch.stdin.close()
        need(batch.wait(timeout=30) == 0, 'batch-exit')
    finally:
        if batch.poll() is None:
            batch.kill()
            batch.wait()
    return selected, indexed_bytes, len(rows), counts


def main():
    need(sha(CANDIDATE) == CANDIDATE_SHA and sha(PREBUDGET) == PREBUDGET_SHA
         and sha(PARQUET) == PARQUET_SHA and sha(INDEX) == INDEX_SHA
         and not OUTPUT.exists(), 'source-drift')
    candidate = json.loads(CANDIDATE.read_text())
    pairs = candidate['ordered_pairs']
    need(len(pairs) == 24, 'denominator')
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader
    loader = GoldLoader(str(PARQUET))
    totals = Counter()
    rows = []
    for pair in pairs:
        cache = Path(pair['cache_base']) / 'cache' / pair['cache_name']
        indexed, bytes_used, tracked_count, omitted = indexed_paths(cache, pair['base_commit'])
        gold = set(loader.get(pair['instance_id']).files())
        present = len(indexed & gold)
        totals['gold_files'] += len(gold)
        totals['gold_indexed'] += present
        rows.append({'ordinal': pair['ordinal'], 'repo': pair['repo'],
                     'gold_files': len(gold), 'gold_indexed': present,
                     'gold_not_indexed': len(gold) - present,
                     'tracked_count': tracked_count, 'indexed_count': len(indexed),
                     'indexed_bytes': bytes_used,
                     'other_omissions': dict(sorted(omitted.items()))})
    payload = {'schema_version': 'are.g02-r5-index-budget-audit/v1',
               'posture': 'evaluator-only-source-index-simulation-no-gold-path-export',
               'candidate_sha256': CANDIDATE_SHA, 'prebudget_sha256': PREBUDGET_SHA,
               'parquet_sha256': PARQUET_SHA, 'index_source_sha256': INDEX_SHA,
               'script_sha256': sha(__file__), 'pair_count': len(rows),
               'totals': dict(totals), 'rows': rows,
               'simulation_note': 'Matches sorted tracked regular files, 1 MiB per-file cap, 32 MiB ordered budget, and first-8192-byte NUL test. Git symlink worktree resolution is not simulated.',
               'claim_ceiling': 'Evaluator-only index-reachability diagnostic, not actual acquisition/read, model run, native quality, or superiority.',
               'open_questions': ['Will the live agent acquire and select reachable reference files?',
                                  'Will matched quality and all-in cost clear the frozen gate?']}
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'pairs': len(rows), 'totals': payload['totals'],
                      'sha256': sha(OUTPUT)}))


if __name__ == '__main__':
    main()
