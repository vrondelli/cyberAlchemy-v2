#!/usr/bin/env python3
"""Evaluator-only native-reference audit of sealed API-consumer proposals."""

import hashlib
import json
import sys
from collections import Counter
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
ROOT = BASE / 'g02-api-consumer-exposed-r1'
SOURCE = ROOT / 'SOURCE-SEAL.json'
OUTPUT = ROOT / 'RESULT.json'
UPSTREAM = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
PARQUET = UPSTREAM / 'data/full.parquet'
SOURCE_SHA = '339787220e7d6e723b2f4e5be60f163a760f441d2dba421106cf7f84b00e7ae4'
PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(ok, why):
    if not ok:
        raise ValueError('api-consumer-audit.' + why)


def main():
    need(not OUTPUT.exists() and sha(SOURCE) == SOURCE_SHA and
         sha(PARQUET) == PARQUET_SHA, 'input-or-output-drift')
    source = json.loads(SOURCE.read_text())
    rows = source['rows']
    need(source['task_count'] == len(rows) == 25 and
         len({row['instance_id'] for row in rows}) == 25, 'task-shape')
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader
    loader = GoldLoader(str(PARQUET))
    results = []
    totals = {}
    for row in rows:
        cohort = row['cohort']
        need(cohort in ('r7-exposed-source-population', 'r8-exposed-failed-pair') and
             len(row['proposed_new_reads']) <= 2, 'cohort-or-limit')
        selected = [proposal['path'] for proposal in row['proposed_new_reads']]
        need(len(set(selected)) == len(selected) and
             not (set(selected) & set(row['excluded_delivered_or_selected_paths'])),
             'proposal-shape')
        gold = set(loader.get(row['instance_id']).files())
        need(bool(gold), 'empty-native-gold')
        hit = len(gold & set(selected))
        result = {'cohort': cohort, 'ordinal': row['ordinal'],
                  'instance_id': row['instance_id'],
                  'proposals': len(selected), 'gold_hits': hit,
                  'false_proposals': len(selected) - hit,
                  'native_gold_files': len(gold)}
        results.append(result)
        subtotal = totals.setdefault(cohort, Counter())
        subtotal['tasks'] += 1
        subtotal['tasks_firing'] += bool(selected)
        subtotal['proposals'] += len(selected)
        subtotal['gold_hits'] += hit
        subtotal['false_proposals'] += len(selected) - hit
    payload = {'schema_version': 'are.g02-api-consumer-closure-exposed-audit/v1',
               'posture': 'evaluator-only-exposed-label-check-no-model-no-prediction-change',
               'source_seal_sha256': SOURCE_SHA, 'parquet_sha256': PARQUET_SHA,
               'script_sha256': sha(__file__), 'task_count': len(results),
               'cohort_totals': {key: dict(value) for key, value in sorted(totals.items())},
               'rows': results,
               'claim_ceiling': 'Proposed source-read hit rate only; no delivered receipt, final selection, native F1, cost, or superiority.',
               'open_questions': ['Can a live receipt-backed read and final selection improve native quality?',
                                  'Does this gold-blind rule transfer beyond the exposed tasks?']}
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': 'audited', 'sha256': sha(OUTPUT),
                      'cohort_totals': payload['cohort_totals']}))


if __name__ == '__main__':
    main()
