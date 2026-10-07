#!/usr/bin/env python3
"""Evaluator-only native reference reachability under fixed r7 64 MiB index."""

import hashlib
import importlib.util
import json
import sys
from collections import Counter
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
ROOT = BASE / 'g02-r7-screening-pool-r1'
CANDIDATE = ROOT / 'CANDIDATE.json'
HYDRATION = ROOT / 'TASK-CACHE-HYDRATION.json'
SOURCE_PREFLIGHT = ROOT / 'SOURCE-INDEX-PREFLIGHT.json'
TOOLS = BASE / 'g02-r7-mixed-source-tools-r1/MIXED-SOURCE-TOOLS.json'
OUTPUT = ROOT / 'INDEX-REACHABILITY.json'
UPSTREAM = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
PARQUET = UPSTREAM / 'data/full.parquet'
SIMULATOR = BASE / 'g02-r5-cohort-code-r1/audit-g02-r5-index-budget-r1.py'
INDEX = Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr4-own-expansions-preflight-r1/code/base-overlay.mjs')
CANDIDATE_SHA = '6ddfcd55f1a05f87ea4bcbe44ac3b0a7246ade41689b9195d33be2f6e8c8708d'
HYDRATION_SHA = '8c3c351d131c266b758d72d44010fa3a66da5d7b6e86c261c54af194387e8f2e'
SOURCE_SHA = 'fc9b73cad1c55dd14d15f59ccbda6fe3abb8e5d6fa3a3047d5606151f6856399'
TOOLS_SHA = 'ebd522264e431e8b68016ca22607c059dc9e7d188d06ca043c0f52963b2d5973'
PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
SIMULATOR_SHA = '53f92351cd4d6c819ab419df90b87d48808eba5a6fdf900dd7244bbcec92df4b'
INDEX_SHA = '1389c7a3fbdc096463787614778c4b9087104ef252c54659d542c68874e91c89'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g02-r7-index-reachability.' + reason)


def main():
    need(not OUTPUT.exists() and sha(CANDIDATE) == CANDIDATE_SHA and
         sha(HYDRATION) == HYDRATION_SHA and sha(SOURCE_PREFLIGHT) == SOURCE_SHA and
         sha(TOOLS) == TOOLS_SHA and sha(PARQUET) == PARQUET_SHA and
         sha(SIMULATOR) == SIMULATOR_SHA and sha(INDEX) == INDEX_SHA,
         'source-or-output-drift')
    tasks = json.loads(CANDIDATE.read_text())['ordered_tasks']
    cache_rows = {row['ordinal']: row for row in json.loads(HYDRATION.read_text())['results']}
    source_rows = {row['ordinal']: row for row in json.loads(SOURCE_PREFLIGHT.read_text())['results']}
    need(len(tasks) == 24 and len(cache_rows) == 24 and len(source_rows) == 24,
         'denominator')
    spec = importlib.util.spec_from_file_location('g02_index_simulator', SIMULATOR)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.BUDGET = 64 * 1024 * 1024
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader
    loader = GoldLoader(str(PARQUET))
    totals = Counter()
    rows = []
    for task in tasks:
        ordinal = task['ordinal']
        cache = Path(cache_rows[ordinal]['cache_path'])
        commit = task['base_commit']
        need(cache_rows[ordinal]['base_commit'] == commit and
             source_rows[ordinal]['index_exit'] == 0,
             'source-binding:' + str(ordinal))
        indexed, bytes_used, tracked_count, omitted = module.indexed_paths(cache, commit)
        actual = source_rows[ordinal]['index']
        agreement = bytes_used == actual['indexed_bytes'] and \
            len(indexed) == actual['indexed_files']
        gold = set(loader.get(task['instance_id']).files())
        need(bool(gold), 'empty-gold:' + str(ordinal))
        present = len(indexed & gold)
        totals['gold_files'] += len(gold)
        totals['gold_indexed'] += present
        totals['gold_not_indexed'] += len(gold) - present
        totals['simulation_agreements'] += agreement
        rows.append({'ordinal': ordinal, 'repo': task['repo'],
                     'source': task['source'], 'gold_files': len(gold),
                     'gold_indexed': present,
                     'gold_not_indexed': len(gold) - present,
                     'tracked_count': tracked_count,
                     'indexed_count_simulated': len(indexed),
                     'indexed_bytes_simulated': bytes_used,
                     'actual_index_count': actual['indexed_files'],
                     'actual_index_bytes': actual['indexed_bytes'],
                     'simulation_agreement': agreement,
                     'other_omissions': dict(sorted(omitted.items()))})
    payload = {'schema_version': 'are.g02-r7-index-reachability/v1',
               'posture': 'evaluator-only-aggregate-no-gold-path-export',
               'candidate_sha256': CANDIDATE_SHA,
               'task_cache_hydration_sha256': HYDRATION_SHA,
               'source_index_preflight_sha256': SOURCE_SHA,
               'tools_manifest_sha256': TOOLS_SHA,
               'parquet_sha256': PARQUET_SHA,
               'simulator_sha256': SIMULATOR_SHA,
               'index_source_sha256': INDEX_SHA,
               'index_budget_mib': 64, 'script_sha256': sha(__file__),
               'task_count': len(rows), 'totals': dict(totals), 'rows': rows,
               'simulation_note': 'Sorted tracked regular files, 1 MiB/file, 64 MiB ordered budget and first-8192-byte NUL skip; Git symlink worktree resolution not simulated.',
               'fixed-candidate-rule': 'Do not alter the r7 source-index/policy or replace tasks based on these opened labels and retain a fresh-holdout claim.',
               'claim_ceiling': 'Evaluator-only reachability, not actual agent acquisition, native score, model result or superiority.',
               'open_questions': ['Will the live agent acquire reachable reference files?',
                                  'Will complete paired native quality and all-in cost intervals clear the frozen gate?']}
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'tasks': len(rows), 'totals': payload['totals'],
                      'sha256': sha(OUTPUT)}))


if __name__ == '__main__':
    main()
