#!/usr/bin/env python3
"""Evaluator-only recall audit of the sealed G02 r11 symbol-hop shortlist."""

import hashlib
import json
import os
from collections import Counter
from pathlib import Path

import pyarrow.parquet as parquet


ROOT = Path('/home/vlad_/are-benchmark-archive')
SEAL = ROOT / 'g02-r11-symbol-hop-source-exposed-r1-20261004/SOURCE-SEAL.json'
UNION = ROOT / 'g02-r11-relation-union-exposed-r1-20261003/SOURCE-UNION.json'
PARQUET = ROOT / 'g01-r8-eight-task-evaluator-r1/full.parquet'
OUTPUT = ROOT / 'g02-r11-symbol-hop-source-exposed-r1-20261004/EVALUATOR-AUDIT.json'
PINS = {
    SEAL: '23cd6c2ad92b7b8cc0262387a92d31fd0fbc1c3e727413c1936be919572a6d9c',
    UNION: '7493a1865356df42e1bae584bc196619ee6159636be6250f1ce9895650234291',
    PARQUET: '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8',
}
GATE = {'minimum_top20_undelivered_gold': 7,
        'minimum_top20_gold_outside_old_union': 2,
        'minimum_repositories_with_top20_hit': 2,
        'maximum_top20_candidates': 240}


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def normalize(path):
    path = path.replace('\\', '/')
    if path.startswith('/testbed/'):
        path = path[len('/testbed/'):]
    elif path.startswith('/workspace/'):
        parts = path[len('/workspace/'):].split('/', 1)
        path = parts[1] if len(parts) == 2 else parts[0]
    return path.lstrip('/').removeprefix('./')


def main():
    if OUTPUT.exists() or any(sha(path) != pin for path, pin in PINS.items()):
        raise SystemExit('output-exists-or-input-pin-drift')
    seal = json.loads(SEAL.read_text())['rows']
    union = json.loads(UNION.read_text())['rows']
    labels = parquet.read_table(PARQUET, columns=['instance_id', 'base_commit', 'gold_context']).to_pylist()
    references = {row['instance_id']: row for row in labels}
    if len(seal) != 12 or len(union) != 12 or len(references) != len(labels):
        raise SystemExit('denominator-drift')
    rows = []
    by_repo = Counter()
    for source, old in zip(seal, union):
        ordinal = source['ordinal']
        reference = references[source['instance_id']]
        if (old['ordinal'] != ordinal or old['instance_id'] != source['instance_id']
                or reference['base_commit'] != source['base_commit']):
            raise SystemExit(f'identity-drift:{ordinal}')
        raw = (ROOT / 'g02-product-replication-r11-20261002/pairs'
               / f'{ordinal:02d}-pr11-mixed-{ordinal:02d}' / 'raw')
        pred_path = raw / 'policy-pruning/prediction.json'
        if sha(pred_path) != source['prediction_sha256']:
            raise SystemExit(f'prediction-pin-drift:{ordinal}')
        selected = {normalize(path) for path in json.loads(pred_path.read_text())['traj_data']['pred_files']}
        delivered = {normalize(path) for path in old['delivered_paths']}
        gold = {normalize(item['file']) for item in json.loads(reference['gold_context'])}
        missing = gold - delivered
        old_union = {item['path'] for item in old['candidates'] if item['bytes'] <= 262144}
        shortlist = [item['path'] for item in source['shortlist']]
        if (len(shortlist) != len(set(shortlist)) or len(shortlist) > 20
                or set(shortlist) & (selected | delivered)):
            raise SystemExit(f'shortlist-drift:{ordinal}')
        hits = {str(depth): len(missing & set(shortlist[:depth])) for depth in (3, 10, 20)}
        outside = len((missing - old_union) & set(shortlist))
        by_repo[source['repo']] += hits['20']
        rows.append({'ordinal': ordinal, 'repo': source['repo'],
                     'shortlist_count': len(shortlist),
                     'undelivered_gold': len(missing),
                     'hits_by_depth': hits,
                     'top20_hits_outside_old_union': outside,
                     'old_union_eligible_undelivered_gold': len(missing & old_union)})
    summary = {'tasks': len(rows),
               'shortlist_candidates': sum(row['shortlist_count'] for row in rows),
               'undelivered_gold': sum(row['undelivered_gold'] for row in rows),
               'hits_by_depth': {str(depth): sum(row['hits_by_depth'][str(depth)] for row in rows)
                                 for depth in (3, 10, 20)},
               'top20_hits_outside_old_union': sum(row['top20_hits_outside_old_union'] for row in rows),
               'repositories_with_top20_hit': sum(value > 0 for value in by_repo.values()),
               'by_repository_hits': dict(sorted(by_repo.items()))}
    gate_pass = (summary['hits_by_depth']['20'] >= GATE['minimum_top20_undelivered_gold']
                 and summary['top20_hits_outside_old_union'] >= GATE['minimum_top20_gold_outside_old_union']
                 and summary['repositories_with_top20_hit'] >= GATE['minimum_repositories_with_top20_hit']
                 and summary['shortlist_candidates'] <= GATE['maximum_top20_candidates'])
    report = {'schema_version': 'g02.r11-symbol-hop-source-evaluator-r1/v1',
              'posture': 'evaluator-only-exposed-shortlist-coverage-no-model-or-ARE-read',
              'input_sha256': {str(path): pin for path, pin in PINS.items()},
              'script_sha256': sha(Path(__file__)), 'gate': GATE,
              'gate_pass': gate_pass, 'summary': summary, 'rows': rows,
              'claim_ceiling': 'Recall feasibility on exposed tasks only; no actual read, native F1, cost, independent quality or superiority.'}
    data = (json.dumps(report, sort_keys=True, indent=2) + '\n').encode()
    OUTPUT.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    print(json.dumps({'summary': summary, 'gate_pass': gate_pass,
                      'receipt_sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
