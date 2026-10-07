#!/usr/bin/env python3
"""Exposed no-model simulation of fixed issue-overlap, then source-suffix priority."""
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
ISSUE_ONLY = BASE / 'g01-r13-issue-priority-simulation-r1/SIMULATION.json'
JAVA_RANKS = BASE / 'g01-r13-java-source-variant-ranks-r1/RANKS.json'
OUTPUT = BASE / 'g01-r13-language-priority-simulation-r1/SIMULATION.json'
PINS = {PRIOR: 'fe19bdb4fcd7c6999304f8d439c7ae59f605082133fb6008492235da6d11e29f',
        ISSUE_ONLY: '356cd15ebd44c488a2cbe7cdcc4800001bade6602f719164143a2834f5ce084a',
        JAVA_RANKS: '0bff89db1514aa0afbec4b95cff8e5ba73b82f040ee4492114b68b1f02c72f89'}
SOURCE_SUFFIXES = {'java': ('.java',), 'typescript': ('.ts', '.tsx')}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def module(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    value = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value


def project(task, cache, prior, hints):
    repo, commit = Path(cache['repository_path']), task['base_commit']
    if (repo.is_symlink() or not repo.is_dir() or repo.resolve() != repo or
            prior.git(repo, ['rev-parse', '--verify', commit + '^{commit}'], 128).decode().strip() != commit):
        raise ValueError('exact-cache-identity')
    inventory = prior.inventory(repo, commit)
    issue_terms = set(hints.terms(task['problem_statement']))
    suffixes = SOURCE_SUFFIXES[task['language']]
    ranked = []
    for path, mode, oid, size in inventory:
        try:
            clean = hints.safe_path(path)
            overlap = len(issue_terms & set(hints.terms(clean)))
            source_suffix = clean.endswith(suffixes)
        except (UnicodeDecodeError, ValueError):
            clean, overlap, source_suffix = None, 0, False
        ranked.append((path, clean, mode, oid, size, overlap, source_suffix))
    ranked.sort(key=lambda row: (-row[5], -int(row[6]), row[0]))
    started = time.monotonic()
    admitted, reasons = set(), Counter()
    bytes_used = postings_used = processed = 0
    stop_reason = None
    for path, clean, mode, oid, size, overlap, source_suffix in ranked:
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
        if bytes_used + size > 64 * 1024**2:
            stop_reason = 'admitted-byte-limit'
            break
        if postings_used + postings > 2000000:
            stop_reason = 'posting-limit'
            break
        admitted.add(clean)
        bytes_used += size
        postings_used += postings
    return admitted, {'inventory_entries': len(inventory), 'ranked_entries_processed': processed,
                      'admitted_files': len(admitted), 'admitted_bytes': bytes_used,
                      'admitted_postings': postings_used, 'stop_reason': stop_reason,
                      'nonbudget_exclusion_counts': dict(sorted(reasons.items())),
                      'elapsed_ms': round((time.monotonic() - started) * 1000)}


def main():
    if OUTPUT.exists() or not OUTPUT.parent.is_dir() or any(sha(path) != digest for path, digest in PINS.items()):
        raise ValueError('output-or-pinned-input-drift')
    prior = module(PRIOR, 'g01_r13_language_priority_prior')
    if any(sha(path) != digest for path, digest in prior.PINS.items()):
        raise ValueError('prior-input-drift')
    candidate, transfer, issue_only, java_ranks = (json.loads(path.read_text()) for path in
                                                   (prior.CANDIDATE, prior.TRANSFER, ISSUE_ONLY, JAVA_RANKS))
    targets = {row['instance_id'] for row in issue_only['rows']}
    if len(targets) != 3 or java_ranks['instance_id'] not in targets:
        raise ValueError('target-shape')
    by_cache = {row['instance_id']: row for row in transfer['verified_task_bindings']}
    hints = module(prior.HINTS, 'g01_r13_language_priority_hints')
    projections = {}
    for task in candidate['ordered_tasks']:
        identifier = task['instance_id']
        if identifier in targets:
            projections[identifier] = project(task, by_cache[identifier], prior, hints)
            print(json.dumps({'instance_id': identifier,
                              'source_only': projections[identifier][1]}), flush=True)
    if len(projections) != 3:
        raise ValueError('source-projection-count')
    # Native gold is loaded only after all three source-only projections are complete.
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
            raise ValueError('gold-identity')
        references = {_normalize_rel_path(item.get('file', '')) for item in gold.init + gold.add}
        admitted, source_only = projections[identifier]
        rows.append({'instance_id': identifier, 'repo': task['repo'],
                     'source_only': source_only, 'gold_file_count': len(references),
                     'admitted_gold_files': len(references & admitted),
                     'excluded_gold_files': len(references - admitted)})
    receipt = {'schema_version': 'are.g01-r13-language-priority-simulation/v1',
               'status': 'exposed-source-only-policy-simulation-evaluator-audited',
               'issue_only_simulation_sha256': PINS[ISSUE_ONLY],
               'java_variant_ranks_sha256': PINS[JAVA_RANKS],
               'script_sha256': sha(Path(__file__)), 'rows': rows,
               'source_suffixes': SOURCE_SUFFIXES,
               'gold_paths_or_content_exported': False, 'model_calls': 0,
               'claim_ceiling': 'Three exposed tasks only; no full index implementation, all-task transfer, fresh cohort, or superiority.',
               'open_questions': ['Does this fixed policy preserve coverage across all exposed tasks?',
                                  'Can it be implemented in a task-bound query-invariant worker within the unchanged resource envelope?']}
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(receipt, sort_keys=True, indent=2) + '\n').encode())
    print(json.dumps({'status': receipt['status'], 'rows': rows,
                      'receipt_sha256': sha(OUTPUT)}, sort_keys=True))


if __name__ == '__main__':
    main()
