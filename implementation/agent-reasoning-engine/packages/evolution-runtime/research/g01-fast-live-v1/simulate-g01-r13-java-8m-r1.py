#!/usr/bin/env python3
"""Exposed Java-only, issue-priority 8M-posting streaming admission simulation."""
from collections import Counter
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sys
import time

BASE = Path('/opt/are/evolution-runtime')
UPSTREAM = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
PRIOR = BASE / 'g01-r13-issue-priority-simulation-r1/simulate-g01-r13-issue-priority-r1.py'
SOURCE = BASE / 'g01-r13-issue-priority-simulation-r1/SIMULATION.json'
OUTPUT = BASE / 'g01-r13-java-8m-simulation-r1/SIMULATION.json'
PINS = {PRIOR: 'fe19bdb4fcd7c6999304f8d439c7ae59f605082133fb6008492235da6d11e29f',
        SOURCE: '356cd15ebd44c488a2cbe7cdcc4800001bade6602f719164143a2834f5ce084a'}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def module(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    value = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value


def main():
    if OUTPUT.exists() or not OUTPUT.parent.is_dir() or any(sha(path) != digest for path, digest in PINS.items()):
        raise ValueError('output-or-pinned-input-drift')
    prior = module(PRIOR, 'g01_r13_prior_priority_simulation')
    if any(sha(path) != digest for path, digest in prior.PINS.items()):
        raise ValueError('prior-source-drift')
    candidate, transfer, source = (json.loads(path.read_text()) for path in
                                   (prior.CANDIDATE, prior.TRANSFER, SOURCE))
    identifier = 'Multi-SWE-Bench__java__maintenance__bugfix__2bd87230'
    task = next(row for row in candidate['ordered_tasks'] if row['instance_id'] == identifier)
    cache = next(row for row in transfer['verified_task_bindings'] if row['instance_id'] == identifier)
    if (source['status'] != 'exposed-source-only-policy-simulation-evaluator-audited' or
            next(row for row in source['rows'] if row['instance_id'] == identifier)['admitted_gold_files'] != 0):
        raise ValueError('prior-result-shape')
    hints = module(prior.HINTS, 'g01_r13_java_8m_hints')
    repo, commit = Path(cache['repository_path']), task['base_commit']
    if (repo.is_symlink() or not repo.is_dir() or repo.resolve() != repo or
            prior.git(repo, ['rev-parse', '--verify', commit + '^{commit}'], 128).decode().strip() != commit):
        raise ValueError('exact-cache-identity')
    rows = prior.inventory(repo, commit)
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
        data = prior.git(repo, ['cat-file', 'blob', oid], size)
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
        if bytes_used + size > 96 * 1024**2:
            stop_reason = 'admitted-byte-limit'
            break
        if postings_used + postings > 8000000:
            stop_reason = 'posting-limit'
            break
        admitted.add(clean)
        bytes_used += size
        postings_used += postings
    source_only = {'inventory_entries': len(rows), 'ranked_entries_processed': processed,
                   'admitted_files': len(admitted), 'admitted_bytes': bytes_used,
                   'admitted_postings': postings_used, 'stop_reason': stop_reason,
                   'nonbudget_exclusion_counts': dict(sorted(reasons.items())),
                   'elapsed_ms': round((time.monotonic() - started) * 1000)}
    # Native gold is opened only after the source-only projection is sealed in memory.
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader, _normalize_rel_path
    gold = GoldLoader(str(UPSTREAM / 'data/full.parquet')).get(identifier)
    if gold is None or gold.commit != commit:
        raise ValueError('gold-identity')
    references = {_normalize_rel_path(item.get('file', '')) for item in gold.init + gold.add}
    result = {'schema_version': 'are.g01-r13-java-8m-simulation/v1',
              'status': 'exposed-source-only-policy-simulation-evaluator-audited',
              'prior_simulation_sha256': PINS[SOURCE], 'script_sha256': sha(Path(__file__)),
              'instance_id': identifier, 'source_only': source_only,
              'gold_file_count': len(references),
              'admitted_gold_files': len(references & admitted),
              'excluded_gold_files': len(references - admitted),
              'gold_paths_or_content_exported': False, 'model_calls': 0,
              'claim_ceiling': 'Exposed streaming simulation; no full index memory/time qualification, fresh cohort, or superiority.',
              'open_questions': ['Can a versioned full worker build this task-bound index within a measured resource envelope?',
                                 'Does the same policy preserve coverage across exposed tasks?']}
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(result, sort_keys=True, indent=2) + '\n').encode())
    print(json.dumps({'source_only': source_only, 'gold_file_count': len(references),
                      'admitted_gold_files': result['admitted_gold_files'],
                      'receipt_sha256': sha(OUTPUT)}, sort_keys=True))


if __name__ == '__main__':
    main()
