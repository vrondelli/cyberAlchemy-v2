#!/usr/bin/env python3
"""Evaluator-only audit for sealed, selective G02 r11 cross-encoder r2."""

import hashlib
import json
import os
from collections import defaultdict
from pathlib import Path

import pyarrow.parquet as parquet


ARCHIVE = Path('/home/vlad_/are-benchmark-archive')
SEAL = ARCHIVE / 'g02-r11-cross-rerank-exposed-r2-20261005/SOURCE-SEAL.json'
PACKETS = ARCHIVE / 'g02-r11-search-packets-exposed-r1-20261004/PACKETS.json'
PARQUET = ARCHIVE / 'g01-r8-eight-task-evaluator-r1/full.parquet'
OUTPUT = SEAL.parent / 'EVALUATOR-AUDIT.json'
PINS = {PACKETS: '2c10c75d0e9ddf495210db994bc34b63c4cb3cec0cf46079ef4a630c5a6cfb6b',
        PARQUET: '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'}


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


def f1(predicted, gold):
    return 2 * len(predicted & gold) / (len(predicted) + len(gold)) if predicted or gold else 1.0


def main():
    if OUTPUT.exists() or any(sha(path) != value for path, value in PINS.items()):
        raise SystemExit('output-exists-or-input-drift')
    seal_sha = sha(SEAL)
    seal = json.loads(SEAL.read_text())
    packets = json.loads(PACKETS.read_text())['ordered_packets']
    refs = parquet.read_table(PARQUET, columns=['instance_id', 'base_commit', 'gold_context']).to_pylist()
    by_id = {row['instance_id']: row for row in refs}
    if (seal['schema_version'] != 'g02.r11-cross-rerank-exposed-r2/v1'
            or len(seal['rows']) != 12 or len(packets) != 12 or len(by_id) != len(refs)):
        raise SystemExit('cohort-shape')
    rows = []
    repo_hits = defaultdict(int)
    for record, packet in zip(seal['rows'], packets):
        ordinal = packet['ordinal']
        ref = by_id[packet['instance_id']]
        if (record['ordinal'] != ordinal or record['instance_id'] != packet['instance_id']
                or ref['base_commit'] != packet['base_commit']):
            raise SystemExit(f'identity-drift:{ordinal}')
        raw = (ARCHIVE / 'g02-product-replication-r11-20261002/pairs' /
               f'{ordinal:02d}-pr11-mixed-{ordinal:02d}/raw')
        prediction_path = raw / 'policy-pruning/prediction.json'
        are_score_path = raw / 'policy-pruning/native-score.json'
        dsh_score_path = raw / 'dsh-export/native-score.json'
        prediction = json.loads(prediction_path.read_text())
        if prediction['instance_id'] != packet['instance_id']:
            raise SystemExit(f'prediction-identity:{ordinal}')
        selected = {normalize(path) for path in prediction['traj_data']['pred_files']}
        proposed = {normalize(path) for path in record['selected_paths']}
        pool = {normalize(path) for path in record['pool_paths']}
        if (len(proposed) > 1 or not proposed <= pool or proposed & selected
                or proposed & set(packet['delivered_paths'])):
            raise SystemExit(f'proposal-invalid:{ordinal}')
        gold = {normalize(item['file']) for item in json.loads(ref['gold_context'])}
        are = json.loads(are_score_path.read_text())['native']['final']['file']
        dsh = json.loads(dsh_score_path.read_text())['native']['final']['file']
        baseline = f1(selected, gold)
        if (are['pred_size'] != len(selected) or are['gold_size'] != len(gold)
                or are['intersection'] != len(selected & gold)
                or dsh['gold_size'] != len(gold)):
            raise SystemExit(f'score-parity:{ordinal}')
        expanded = f1(selected | proposed, gold)
        hits = len(proposed & gold)
        repo_hits[packet['repo']] += hits
        rows.append({'ordinal': ordinal, 'repo': packet['repo'],
                     'proposals': len(proposed), 'new_gold_hits': hits,
                     'false_positive_files': len(proposed) - hits,
                     'baseline_file_f1': baseline, 'expanded_file_f1': expanded,
                     'dsh_file_f1': 2 * dsh['intersection'] / (dsh['pred_size'] + dsh['gold_size']),
                     'delta_file_f1': expanded - baseline,
                     'prediction_sha256': sha(prediction_path),
                     'are_score_sha256': sha(are_score_path),
                     'dsh_score_sha256': sha(dsh_score_path)})
    mean = lambda key: sum(row[key] for row in rows) / len(rows)
    proposals = sum(row['proposals'] for row in rows)
    hits = sum(row['new_gold_hits'] for row in rows)
    summary = {'tasks': len(rows), 'proposals': proposals, 'abstentions': 12 - proposals,
               'new_gold_hits': hits, 'false_positive_files': proposals - hits,
               'precision': hits / proposals if proposals else 0.0,
               'repositories_with_hit': sum(value > 0 for value in repo_hits.values()),
               'by_repository_hits': dict(sorted(repo_hits.items())),
               'baseline_mean_file_f1': mean('baseline_file_f1'),
               'expanded_mean_file_f1': mean('expanded_file_f1'),
               'dsh_mean_file_f1': mean('dsh_file_f1'),
               'mean_file_f1_delta': mean('delta_file_f1'),
               'improved_tasks': sum(row['delta_file_f1'] > 0 for row in rows),
               'regressed_tasks': sum(row['delta_file_f1'] < 0 for row in rows)}
    gate = seal['policy']['advancement_gate']
    passed = (hits >= gate['new_gold_hits_min']
              and summary['repositories_with_hit'] >= gate['repositories_with_hit_min']
              and summary['precision'] >= gate['precision_min']
              and summary['mean_file_f1_delta'] >= gate['mean_file_f1_delta_min'])
    result = {'schema_version': 'g02.r11-cross-rerank-evaluator-r2/v1',
              'posture': 'evaluator-only-exposed-counterfactual-no-actual-reads',
              'input_sha256': {**{str(path): value for path, value in PINS.items()}, str(SEAL): seal_sha},
              'script_sha256': sha(Path(__file__)), 'gate': gate, 'gate_pass': passed,
              'summary': summary, 'rows': rows,
              'claim_ceiling': 'Exposed set-based File-F1 only; no actual reads, independent transfer, or superiority.'}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'summary': summary, 'gate_pass': passed,
                      'sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
