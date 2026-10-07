#!/usr/bin/env python3
"""Exposed no-model simulation: issue/path priority under unchanged index limits."""
from collections import Counter
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time

BASE = Path('/opt/are/evolution-runtime')
UPSTREAM = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
CANDIDATE = BASE / 'g01-r13-clean-cohort-candidate-r1/COHORT-CANDIDATE.json'
TRANSFER = BASE / 'g01-r13-cache-transfer-r1/VERIFY.json'
PRIORITY = BASE / 'g01-r13-index-priority-diagnosis-r1/DIAGNOSIS.json'
HINTS = BASE / 'g01-source-index-capacity-r3/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked_source_hints_r3.py'
OUTPUT = BASE / 'g01-r13-issue-priority-simulation-r1/SIMULATION.json'
PINS = {CANDIDATE: '86b3841d0169a2b339d483aad6f0e6e5e8993980c929f11128139f4ff1e04cc5',
        TRANSFER: '11d30a85aebb31b1bb6304fb8dbe6371d9b098f02188a8052ebecbb8ceec44f5',
        PRIORITY: '71e5d021306b7d13babcefbc7c94c55048706cd9350c53a429cc2bd154cff314',
        HINTS: '7f7e9d0299bd138fdde8f4a3c55869098cde5c57b0015481926e993510b4025a',
        UPSTREAM / 'data/full.parquet': '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'}
GIT_ENV = {**os.environ, 'GIT_CONFIG_NOSYSTEM': '1', 'GIT_CONFIG_GLOBAL': '/dev/null',
           'GIT_NO_LAZY_FETCH': '1', 'GIT_ALLOW_PROTOCOL': '', 'GIT_TERMINAL_PROMPT': '0'}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def module(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    value = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value


def git(repo, args, cap):
    cmd = ['git', '--no-optional-locks', '-c', f'safe.directory={repo}', '-C', str(repo), *args]
    value = subprocess.run(cmd, capture_output=True, timeout=20, env=GIT_ENV)
    if value.returncode or len(value.stdout) > cap or len(value.stderr) > 4096:
        raise ValueError('bounded-git-failed')
    return value.stdout


def inventory(repo, commit):
    raw = git(repo, ['ls-tree', '-rlz', commit], 8 * 1024**2)
    rows = []
    for item in raw.split(b'\0'):
        if not item:
            continue
        head, path = item.split(b'\t', 1)
        mode, kind, oid, size = head.split()
        if kind != b'blob' or not re.fullmatch(rb'[a-f0-9]{40}', oid):
            raise ValueError('inventory-shape')
        rows.append((path, mode.decode('ascii'), oid.decode('ascii'), int(size)))
    if not 10000 < len(rows) <= 50000:
        raise ValueError('large-inventory-shape')
    return rows


def simulate(task, cache, hints):
    repo, commit = Path(cache['repository_path']), task['base_commit']
    if (repo.is_symlink() or not repo.is_dir() or repo.resolve() != repo or
            git(repo, ['rev-parse', '--verify', commit + '^{commit}'], 128).decode().strip() != commit):
        raise ValueError('exact-cache-identity')
    rows = inventory(repo, commit)
    issue_terms = set(hints.terms(task['problem_statement']))
    ranked = []
    for path, mode, oid, size in rows:
        try:
            clean = hints.safe_path(path)
            overlap = len(issue_terms & set(hints.terms(clean)))
        except (UnicodeDecodeError, ValueError):
            clean, overlap = None, 0
        ranked.append((path, clean, mode, oid, size, overlap))
    ranked.sort(key=lambda row: (-row[5], row[0]))
    started = time.monotonic()
    admitted, reasons = set(), Counter()
    bytes_used = postings_used = processed = 0
    stop_reason = None
    for path, clean, mode, oid, size, overlap in ranked:
        processed += 1
        if mode not in ('100644', '100755'):
            reasons['mode'] += 1
            continue
        if clean is None:
            reasons['path'] += 1
            continue
        if size > 8 * 1024**2:
            reasons['file-size'] += 1
            continue
        if size > 2000000:
            reasons['native-file-size'] += 1
            continue
        data = git(repo, ['cat-file', 'blob', oid], size)
        if len(data) != size:
            raise ValueError('blob-byte-identity')
        try:
            content = data.decode('utf8', errors='strict')
            if '\x00' in content:
                raise ValueError('binary')
        except (UnicodeDecodeError, ValueError):
            reasons['encoding'] += 1
            continue
        lines = content.split('\n')
        if content.endswith('\n'):
            lines.pop()
        postings = len(set(hints.terms(clean))) + sum(len(set(hints.terms(line))) for line in lines)
        if bytes_used + size > 64 * 1024**2:
            stop_reason = 'admitted-byte-limit'
            break
        if postings_used + postings > 2000000:
            stop_reason = 'posting-limit'
            break
        admitted.add(clean)
        bytes_used += size
        postings_used += postings
    return {'admitted_paths': admitted,
            'source_only': {'inventory_entries': len(rows), 'ranked_entries_processed': processed,
                            'admitted_files': len(admitted), 'admitted_bytes': bytes_used,
                            'admitted_postings': postings_used,
                            'stop_reason': stop_reason,
                            'nonbudget_exclusion_counts': dict(sorted(reasons.items())),
                            'elapsed_ms': round((time.monotonic() - started) * 1000)}}


def main():
    if OUTPUT.exists() or not OUTPUT.parent.is_dir() or any(sha(path) != digest for path, digest in PINS.items()):
        raise ValueError('output-or-pinned-input-drift')
    candidate, transfer, priority = (json.loads(path.read_text()) for path in
                                     (CANDIDATE, TRANSFER, PRIORITY))
    if priority['status'] != 'evaluator-only-exposed-no-model' or len(priority['rows']) != 3:
        raise ValueError('priority-diagnosis-shape')
    targets = {row['instance_id'] for row in priority['rows']}
    by_cache = {row['instance_id']: row for row in transfer['verified_task_bindings']}
    hints = module(HINTS, 'r13_issue_priority_hints')
    # The source-only rankings and bounded admissions are complete before native gold is loaded.
    projections = {}
    for task in candidate['ordered_tasks']:
        identifier = task['instance_id']
        if identifier in targets:
            projections[identifier] = simulate(task, by_cache[identifier], hints)
            print(json.dumps({'instance_id': identifier,
                              'source_only': projections[identifier]['source_only']}), flush=True)
    if len(projections) != 3:
        raise ValueError('projection-count')
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader, _normalize_rel_path
    loader = GoldLoader(str(UPSTREAM / 'data/full.parquet'))
    rows = []
    for task in candidate['ordered_tasks']:
        identifier = task['instance_id']
        if identifier not in targets:
            continue
        gold = loader.get(identifier)
        if gold is None or gold.commit != task['base_commit']:
            raise ValueError('gold-source-identity')
        reference_paths = {_normalize_rel_path(item.get('file', '')) for item in gold.init + gold.add}
        projection = projections[identifier]
        rows.append({'instance_id': identifier, 'repo': task['repo'],
                     'source_only': projection['source_only'],
                     'gold_file_count': len(reference_paths),
                     'admitted_gold_files': len(reference_paths & projection['admitted_paths']),
                     'excluded_gold_files': len(reference_paths - projection['admitted_paths'])})
    result = {'schema_version': 'are.g01-r13-issue-priority-simulation/v1',
              'status': 'exposed-source-only-policy-simulation-evaluator-audited',
              'candidate_sha256': PINS[CANDIDATE], 'priority_diagnosis_sha256': PINS[PRIORITY],
              'script_sha256': sha(Path(__file__)), 'rows': rows,
              'gold_paths_or_content_exported': False, 'model_calls': 0,
              'claim_ceiling': 'Exposed three-task policy simulation only; not a full index, worker qualification, fresh-cohort result, or superiority.',
              'open_questions': ['Does issue/path priority improve native-reference coverage across all exposed tasks without regression?',
                                 'Can a versioned task-bound query-invariant runtime implement it within the same resource limits?']}
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(result, sort_keys=True, indent=2) + '\n').encode())
    print(json.dumps({'status': result['status'], 'rows': rows,
                      'receipt_sha256': sha(OUTPUT)}, sort_keys=True))


if __name__ == '__main__':
    main()
