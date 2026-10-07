#!/usr/bin/env python3
"""Evaluator-only rank diagnostic for query-invariant source-suffix ordering."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sys

BASE = Path('/opt/are/evolution-runtime')
UPSTREAM = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
SWEEP = BASE / 'g01-r13-language-priority-sweep-r1/GOLD-COVERAGE.json'
PRIOR = BASE / 'g01-r13-issue-priority-simulation-r1/simulate-g01-r13-issue-priority-r1.py'
OUTPUT = BASE / 'g01-r13-suffix-only-ranks-r1/RANKS.json'
PINS = {SWEEP: 'd1e6d607aead5def648e885ed23fe9baf65e1fd3582788c77abf901cab2381cf',
        PRIOR: 'fe19bdb4fcd7c6999304f8d439c7ae59f605082133fb6008492235da6d11e29f'}
SUFFIXES = {'java': ('.java',), 'typescript': ('.ts', '.tsx')}


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
    prior = module(PRIOR, 'r13_suffix_only_prior')
    if any(sha(path) != digest for path, digest in prior.PINS.items()):
        raise ValueError('prior-input-drift')
    sweep = json.loads(SWEEP.read_text())
    candidate, transfer = (json.loads(path.read_text()) for path in (prior.CANDIDATE, prior.TRANSFER))
    by_cache = {row['instance_id']: row for row in transfer['verified_task_bindings']}
    hints = module(prior.HINTS, 'r13_suffix_only_hints')
    targets = [task for task in candidate['ordered_tasks'] if task['language'] in SUFFIXES]
    if len(targets) != 3 or sweep['summary']['new_fully_admitted_tasks'] != 23:
        raise ValueError('target-or-sweep-shape')
    rank_maps = {}
    counts = {}
    for task in targets:
        identifier = task['instance_id']
        cache = by_cache[identifier]
        rows = prior.inventory(Path(cache['repository_path']), task['base_commit'])
        suffixes = SUFFIXES[task['language']]
        entries = []
        for raw, _, _, _ in rows:
            try:
                path = hints.safe_path(raw)
            except (UnicodeDecodeError, ValueError):
                continue
            entries.append((path, raw, path.endswith(suffixes)))
        entries.sort(key=lambda row: (-int(row[2]), row[1]))
        rank_maps[identifier] = {path: position for position, (path, _, _) in enumerate(entries, start=1)}
        counts[identifier] = {'inventory_entries': len(rows),
                              'source_suffix_paths': sum(row[2] for row in entries)}
    # Native gold access follows the complete source-only ranking projection.
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader, _normalize_rel_path
    loader = GoldLoader(str(UPSTREAM / 'data/full.parquet'))
    result_rows = []
    for task in targets:
        identifier = task['instance_id']
        gold = loader.get(identifier)
        if gold is None or gold.commit != task['base_commit']:
            raise ValueError('gold-identity')
        refs = {_normalize_rel_path(item.get('file', '')) for item in gold.init + gold.add}
        if not refs <= rank_maps[identifier].keys():
            raise ValueError('reference-path-absent')
        result_rows.append({'instance_id': identifier, 'language': task['language'],
                            **counts[identifier],
                            'reference_ranks_suffix_only': sorted(rank_maps[identifier][path] for path in refs)})
    result = {'schema_version': 'are.g01-r13-suffix-only-ranks/v1',
              'status': 'evaluator-only-exposed-rank-diagnostic',
              'sweep_sha256': PINS[SWEEP], 'script_sha256': sha(Path(__file__)),
              'rows': result_rows, 'gold_paths_or_content_exported': False,
              'model_calls': 0,
              'claim_ceiling': 'Exposed path-rank diagnostic only; no bounded index, fresh cohort, or superiority.',
              'open_questions': ['Are suffix-only ranks low enough to justify full bounded admission testing?',
                                 'Can any query-invariant source-only order preserve prior coverage?']}
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(result, sort_keys=True, indent=2) + '\n').encode())
    print(json.dumps({'rows': result_rows, 'receipt_sha256': sha(OUTPUT)}, sort_keys=True))


if __name__ == '__main__':
    main()
