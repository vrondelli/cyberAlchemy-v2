#!/usr/bin/env python3
"""Evaluator-only upper bound for three extra G02 r11 file reads.

This is a gold-aware oracle diagnostic, never a deployable selector.
"""

import hashlib
import json
import os
from pathlib import Path

import pyarrow.parquet as parquet


ROOT = Path('/home/vlad_/are-benchmark-archive')
UNION = ROOT / 'g02-r11-relation-union-exposed-r1-20261003/SOURCE-UNION.json'
DEPTH = ROOT / 'g02-r11-hybrid-depth-exposed-r2-20261004/SOURCE-SEAL.json'
PARQUET = ROOT / 'g01-r8-eight-task-evaluator-r1/full.parquet'
OUTPUT = ROOT / 'g02-r11-read-cap-oracle-exposed-r1-20261004/EVALUATOR-AUDIT.json'
PINS = {
    UNION: '7493a1865356df42e1bae584bc196619ee6159636be6250f1ce9895650234291',
    DEPTH: '7e2c65289f0dd8e45822dd313c037945d48ba6e45fe4825fef5cea19f7453a63',
    PARQUET: '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8',
}
DEPTHS = (0, 12, 24, 48, 96, 'union')


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def normalize(path):
    path = path.replace('\\', '/')
    if path.startswith('/testbed/'):
        path = path[len('/testbed/'):]
    elif path.startswith('/workspace/'):
        parts = path[len('/workspace/'):].split('/', 1)
        path = parts[1] if len(parts) == 2 else parts[0]
    return path.lstrip('/').removeprefix('./')


def f1(predicted, gold):
    return 2 * len(predicted & gold) / (len(predicted) + len(gold)) if predicted or gold else 1.0


def main():
    if OUTPUT.exists() or any(sha(path) != pin for path, pin in PINS.items()):
        raise SystemExit('output-exists-or-input-pin-drift')
    union = json.loads(UNION.read_text())['rows']
    depth = json.loads(DEPTH.read_text())['rows']
    labels = parquet.read_table(PARQUET, columns=['instance_id', 'base_commit', 'gold_context']).to_pylist()
    references = {row['instance_id']: row for row in labels}
    if len(references) != len(labels) or len(union) != 12 or len(depth) != 12:
        raise SystemExit('cohort-or-label-drift')
    rows = []
    for source, ranked in zip(union, depth):
        ordinal = source['ordinal']
        reference = references[source['instance_id']]
        if (ranked['ordinal'] != ordinal or reference['base_commit'] != source['base_commit']
                or ranked['instance_id'] != source['instance_id']):
            raise SystemExit(f'identity-drift:{ordinal}')
        raw = (ROOT / 'g02-product-replication-r11-20261002/pairs'
               / f'{ordinal:02d}-pr11-mixed-{ordinal:02d}' / 'raw')
        prediction_path = raw / 'policy-pruning/prediction.json'
        are_score_path = raw / 'policy-pruning/native-score.json'
        dsh_score_path = raw / 'dsh-export/native-score.json'
        prediction = json.loads(prediction_path.read_text())
        if prediction['instance_id'] != source['instance_id']:
            raise SystemExit(f'prediction-drift:{ordinal}')
        selected = {normalize(path) for path in prediction['traj_data']['pred_files']}
        gold = {normalize(item['file']) for item in json.loads(reference['gold_context'])}
        delivered = {normalize(path) for path in source['delivered_paths']}
        eligible = {item['path'] for item in source['candidates'] if item['bytes'] <= 262144}
        ordered = ranked['ranked_paths']
        if len(ordered) != len(set(ordered)) or not set(ordered).issubset(eligible):
            raise SystemExit(f'rank-drift:{ordinal}')
        are = json.loads(are_score_path.read_text())['native']['final']['file']
        dsh = json.loads(dsh_score_path.read_text())['native']['final']['file']
        baseline = f1(selected, gold)
        if (are['pred_size'] != len(selected) or are['gold_size'] != len(gold)
                or are['intersection'] != len(selected & gold)
                or abs(2 * are['intersection'] / (are['pred_size'] + are['gold_size']) - baseline) > 1e-12
                or dsh['gold_size'] != len(gold)):
            raise SystemExit(f'native-score-parity:{ordinal}')
        scores = {}
        hits = {}
        for amount in DEPTHS:
            pool = eligible if amount == 'union' else set(ordered[:amount])
            possible_gold = sorted((gold - selected) & pool - delivered)
            additions = set(possible_gold[:3])
            scores[str(amount)] = f1(selected | additions, gold)
            hits[str(amount)] = len(additions)
        rows.append({
            'ordinal': ordinal, 'repo': source['repo'],
            'missing_gold': len(gold - selected),
            'eligible_missing_gold': len((gold - selected) & eligible - delivered),
            'file_f1_by_pool': scores, 'added_gold_by_pool': hits,
            'dsh_file_f1': 2 * dsh['intersection'] / (dsh['pred_size'] + dsh['gold_size']),
            'prediction_sha256': sha(prediction_path),
            'are_score_sha256': sha(are_score_path),
            'dsh_score_sha256': sha(dsh_score_path),
        })
    mean = lambda values: sum(values) / len(values)
    summary = {
        'tasks': len(rows), 'read_cap': 3,
        'mean_file_f1_by_pool': {
            str(amount): mean([row['file_f1_by_pool'][str(amount)] for row in rows])
            for amount in DEPTHS},
        'added_gold_by_pool': {
            str(amount): sum(row['added_gold_by_pool'][str(amount)] for row in rows)
            for amount in DEPTHS},
        'dsh_mean_file_f1': mean([row['dsh_file_f1'] for row in rows]),
        'total_missing_gold': sum(row['missing_gold'] for row in rows),
        'total_eligible_missing_gold': sum(row['eligible_missing_gold'] for row in rows),
    }
    report = {
        'schema_version': 'g02.r11-read-cap-oracle-exposed-r1/v1',
        'posture': 'evaluator-only-gold-aware-upper-bound-not-a-runnable-selector',
        'input_sha256': {str(path): pin for path, pin in PINS.items()},
        'script_sha256': sha(Path(__file__)), 'summary': summary, 'rows': rows,
        'claim_ceiling': 'Exposed oracle ceiling only; no actual ARE reads, Span-F1, cost, independent quality or superiority.',
    }
    data = (json.dumps(report, sort_keys=True, indent=2) + '\n').encode()
    OUTPUT.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    print(json.dumps({'summary': summary, 'receipt_sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
