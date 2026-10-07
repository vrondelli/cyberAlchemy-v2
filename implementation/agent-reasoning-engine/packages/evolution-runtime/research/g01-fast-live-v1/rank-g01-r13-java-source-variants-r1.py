#!/usr/bin/env python3
"""Evaluator-only rank comparison for fixed source-derived Java path cues."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import sys

BASE = Path('/opt/are/evolution-runtime')
UPSTREAM = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
PRIOR = BASE / 'g01-r13-issue-priority-simulation-r1/simulate-g01-r13-issue-priority-r1.py'
JAVA8 = BASE / 'g01-r13-java-8m-simulation-r1/SIMULATION.json'
OUTPUT = BASE / 'g01-r13-java-source-variant-ranks-r1/RANKS.json'
PINS = {PRIOR: 'fe19bdb4fcd7c6999304f8d439c7ae59f605082133fb6008492235da6d11e29f',
        JAVA8: 'e4827efc7e15bcbad44766e80a611663648aa49617bcbb5196907c9af95aa8ee'}


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
    prior = module(PRIOR, 'g01_r13_java_variant_prior')
    if any(sha(path) != digest for path, digest in prior.PINS.items()):
        raise ValueError('prior-input-drift')
    candidate, transfer, java8 = (json.loads(path.read_text()) for path in
                                  (prior.CANDIDATE, prior.TRANSFER, JAVA8))
    identifier = java8['instance_id']
    task = next(row for row in candidate['ordered_tasks'] if row['instance_id'] == identifier)
    cache = next(row for row in transfer['verified_task_bindings'] if row['instance_id'] == identifier)
    if task['language'] != 'java' or java8['admitted_gold_files'] != 0:
        raise ValueError('java-exposed-task-shape')
    hints = module(prior.HINTS, 'g01_r13_java_variant_hints')
    issue_terms = set(hints.terms(task['problem_statement']))
    identifiers = tuple(sorted({word.casefold() for word in
                                re.findall(r'\b[A-Z][a-z0-9]+[A-Z][A-Za-z0-9]*\b', task['problem_statement'])}))
    if not identifiers:
        raise ValueError('no-source-identifiers')
    inventory = prior.inventory(Path(cache['repository_path']), task['base_commit'])
    paths = []
    for raw, _, _, _ in inventory:
        try:
            path = hints.safe_path(raw)
        except (UnicodeDecodeError, ValueError):
            continue
        overlap = len(issue_terms & set(hints.terms(path)))
        exact = any(identifier in Path(path).name.casefold() for identifier in identifiers)
        java = path.endswith('.java')
        main_java = java and ('/src/main/' in '/' + path or path.startswith('src/main/'))
        paths.append((path, raw, overlap, exact, java, main_java))
    variants = {
        'issue_overlap': lambda row: (-row[2], row[1]),
        'exact_identifier_then_overlap': lambda row: (-int(row[3]), -row[2], row[1]),
        'java_then_overlap': lambda row: (-int(row[4]), -row[2], row[1]),
        'overlap_then_java': lambda row: (-row[2], -int(row[4]), row[1]),
        'main_java_then_overlap': lambda row: (-int(row[5]), -row[2], row[1]),
    }
    rank_maps = {name: {row[0]: i for i, row in enumerate(sorted(paths, key=key), start=1)}
                 for name, key in variants.items()}
    # Native reference paths are accessed only after the source-only rank maps exist.
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader, _normalize_rel_path
    gold = GoldLoader(str(UPSTREAM / 'data/full.parquet')).get(identifier)
    if gold is None or gold.commit != task['base_commit']:
        raise ValueError('gold-identity')
    refs = {_normalize_rel_path(item.get('file', '')) for item in gold.init + gold.add}
    if not refs or not refs <= rank_maps['issue_overlap'].keys():
        raise ValueError('gold-reference-path-shape')
    row_by_path = {row[0]: row for row in paths}
    result = {'schema_version': 'are.g01-r13-java-source-variant-ranks/v1',
              'status': 'evaluator-only-exposed-rank-diagnostic',
              'prior_java_8m_sha256': PINS[JAVA8], 'script_sha256': sha(Path(__file__)),
              'instance_id': identifier, 'inventory_entries': len(inventory),
              'rankable_paths': len(paths), 'source_derived_identifier_count': len(identifiers),
              'source_cue_counts': {'exact_identifier_basename': sum(row[3] for row in paths),
                                    'java_suffix': sum(row[4] for row in paths),
                                    'main_java': sum(row[5] for row in paths)},
              'gold_file_count': len(refs),
              'gold_reference_cues': {'exact_identifier_basename': sum(row_by_path[path][3] for path in refs),
                                      'java_suffix': sum(row_by_path[path][4] for path in refs),
                                      'main_java': sum(row_by_path[path][5] for path in refs)},
              'reference_ranks_by_variant':
                  {name: sorted(rank_map[path] for path in refs) for name, rank_map in rank_maps.items()},
              'gold_paths_or_content_exported': False, 'model_calls': 0,
              'claim_ceiling': 'Exposed rank diagnostic only; no bounded indexing, semantic quality or superiority.',
              'open_questions': ['Would any fixed source-derived cue admit the reference under measured posting, byte, time, and memory bounds?',
                                 'How does it affect independent tasks?']}
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(result, sort_keys=True, indent=2) + '\n').encode())
    print(json.dumps({'reference_ranks_by_variant': result['reference_ranks_by_variant'],
                      'gold_reference_cues': result['gold_reference_cues'],
                      'source_cue_counts': result['source_cue_counts'],
                      'receipt_sha256': sha(OUTPUT)}, sort_keys=True))


if __name__ == '__main__':
    main()
