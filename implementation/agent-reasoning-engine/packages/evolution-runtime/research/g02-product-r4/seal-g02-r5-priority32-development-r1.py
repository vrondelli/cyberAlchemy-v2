#!/usr/bin/env python3
"""Seal a gold-blind 32 MiB issue-path-prioritized index on exposed r5 tasks."""
from collections import Counter
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess

import pyarrow.parquet as pq

BASE = Path('/opt/are/evolution-runtime')
ROOT = BASE / 'g02-r5-priority32-development-r1'
CANDIDATE = BASE / 'g02-r5-fresh-cohort-candidate-r1/CANDIDATE.json'
PARQUET = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream/data/full.parquet'
OUTPUT = ROOT / 'SOURCE-SEAL.json'
CANDIDATE_SHA = 'a6bfe7c3ed6f4f87e70e6f30bf67790e3edfc26f7f9322c18aa129f3b61488c0'
PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
PER_FILE = 1024 * 1024
BUDGET = 32 * 1024 * 1024
PRIORITY_BUDGET = 8 * 1024 * 1024
STOP = {'about', 'after', 'before', 'class', 'code', 'config', 'error', 'errors',
        'file', 'files', 'function', 'issue', 'module', 'other', 'python', 'readme',
        'source', 'tests', 'these', 'this', 'using', 'utils', 'value', 'values',
        'when', 'where', 'which', 'while', 'with', 'without'}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(ok, reason):
    if not ok:
        raise ValueError('g02-r5-priority32.' + reason)


def terms(text):
    return {word for word in re.findall(r'[a-z][a-z0-9_]{4,}', text.lower())
            if word not in STOP}


def score(path, issue, issue_words):
    leaf = path.rsplit('/', 1)[-1].lower()
    stem = leaf.rsplit('.', 1)[0]
    overlap = terms(path) & issue_words
    exact = len(leaf) >= 8 and leaf in issue
    named = len(stem) >= 7 and stem not in STOP and stem in issue
    return int(exact) * 100 + int(named) * 40 + min(len(overlap), 4) * 4


def git_rows(cache, commit):
    listing = subprocess.run(['git', '-C', str(cache), 'ls-tree', '-r', '-l', '-z', commit],
                             capture_output=True, check=True).stdout
    rows = []
    for record in listing.split(b'\0'):
        if not record:
            continue
        meta, raw_path = record.split(b'\t', 1)
        mode, kind, oid, raw_size = meta.split()
        path = raw_path.decode('utf-8', 'surrogateescape')
        if kind == b'blob' and mode in (b'100644', b'100755') and int(raw_size) <= PER_FILE:
            rows.append((path, oid, int(raw_size)))
    need(rows == sorted(rows, key=lambda row: row[0]), 'git-tree-order')
    return rows


def index(cache, commit, issue):
    rows = git_rows(cache, commit)
    issue = issue.lower()
    issue_words = terms(issue)
    priority = sorted(((-score(path, issue, issue_words), path, oid, size)
                       for path, oid, size in rows if score(path, issue, issue_words) >= 8))
    selected = []
    seen = set()
    counts = Counter()
    total = priority_bytes = 0
    batch = subprocess.Popen(['git', '-C', str(cache), 'cat-file', '--batch'],
                             stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                             stderr=subprocess.PIPE)

    def add(path, oid, size, limit):
        nonlocal total
        if path in seen or total + size > BUDGET or (limit is not None and priority_bytes + size > limit):
            return False
        batch.stdin.write(oid + b'\n')
        batch.stdin.flush()
        header = batch.stdout.readline().split()
        need(len(header) == 3 and header[0] == oid and header[1] == b'blob'
             and int(header[2]) == size, 'blob-header')
        content = batch.stdout.read(size)
        need(len(content) == size and batch.stdout.read(1) == b'\n', 'blob-body')
        if b'\0' in content[:8192]:
            counts['binary_omitted'] += 1
            return False
        seen.add(path)
        selected.append(path)
        total += size
        return True

    try:
        for negative_score, path, oid, size in priority:
            if add(path, oid, size, PRIORITY_BUDGET):
                priority_bytes += size
                counts['priority_files'] += 1
        for path, oid, size in rows:
            if add(path, oid, size, None):
                counts['baseline_files'] += 1
        batch.stdin.close()
        need(batch.wait(timeout=60) == 0, 'batch-exit')
    finally:
        if batch.poll() is None:
            batch.kill()
            batch.wait()
    return selected, total, priority_bytes, dict(sorted(counts.items())), len(priority), len(rows)


def main():
    need(not ROOT.exists() and sha(CANDIDATE) == CANDIDATE_SHA and
         sha(PARQUET) == PARQUET_SHA, 'input-or-output-drift')
    candidate = json.loads(CANDIDATE.read_text())
    pairs = candidate['ordered_pairs']
    need(len(pairs) == 24, 'cohort-shape')
    source = {row['instance_id']: row for row in pq.read_table(
        PARQUET, columns=['instance_id', 'repo', 'base_commit', 'problem_statement']).to_pylist()}
    ROOT.mkdir(mode=0o700)
    results = []
    for pair in pairs:
        task = source[pair['instance_id']]
        need(task['repo'] == pair['repo'] and task['base_commit'] == pair['base_commit']
             and isinstance(task['problem_statement'], str), 'task-source-binding')
        cache = Path(pair['cache_base']) / 'cache' / pair['cache_name']
        need(cache.is_dir(), 'cache-missing')
        paths, size, priority_size, counts, candidates, tracked = index(
            cache, pair['base_commit'], task['problem_statement'])
        results.append({'ordinal': pair['ordinal'], 'instance_id': pair['instance_id'],
                        'repo': pair['repo'], 'base_commit': pair['base_commit'],
                        'cache_path': str(cache), 'indexed_paths': paths,
                        'indexed_path_set_sha256': hashlib.sha256(
                            ('\n'.join(sorted(paths)) + '\n').encode()).hexdigest(),
                        'indexed_bytes': size, 'priority_bytes': priority_size,
                        'priority_candidates': candidates, 'tracked_eligible': tracked,
                        'counts': counts})
        print(json.dumps({'ordinal': pair['ordinal'], 'indexed': len(paths),
                          'indexed_bytes': size, 'priority_bytes': priority_size}), flush=True)
    payload = {'schema_version': 'are.g02-r5-priority32-source-seal/v1',
               'status': 'source-only-sealed-before-evaluator', 'posture': 'exposed-development',
               'candidate_sha256': CANDIDATE_SHA, 'parquet_sha256': PARQUET_SHA,
               'script_sha256': sha(__file__), 'index_budget_bytes': BUDGET,
               'priority_budget_bytes': PRIORITY_BUDGET, 'per_file_bytes': PER_FILE,
               'ordering': 'issue path exact basename/stem and lexical overlap, then git tree order',
               'rows': results, 'model_calls': 0, 'gold_loaded': False,
               'claim_ceiling': 'Gold-blind source-index proposal only; no evaluator result, live behavior, or superiority',
               'open_questions': ['Does 32 MiB priority reach more reference files than the fixed 32 MiB baseline?',
                                  'Does live indexing reproduce this ordering safely and cheaply?']}
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': payload['status'], 'tasks': len(results),
                      'seal_sha256': sha(OUTPUT)}))


if __name__ == '__main__':
    main()
