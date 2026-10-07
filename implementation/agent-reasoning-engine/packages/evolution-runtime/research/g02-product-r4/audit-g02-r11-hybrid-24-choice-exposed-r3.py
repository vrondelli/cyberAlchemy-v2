#!/usr/bin/env python3
"""Evaluator-only counts and set-based File-F1 replay for sealed chooser choices."""

import hashlib
import json
import os
from collections import defaultdict
from pathlib import Path

import pyarrow.parquet as parquet


ROOT = Path('/home/vlad_/are-benchmark-archive')
CHOICE = ROOT / 'g02-r11-hybrid-24-choice-exposed-r3-20261004'
SEAL = CHOICE / 'SEALED-RESPONSES.json'
PACKETS = CHOICE / 'PACKETS.json'
UNION = ROOT / 'g02-r11-relation-union-exposed-r1-20261003/SOURCE-UNION.json'
PARQUET = ROOT / 'g01-r8-eight-task-evaluator-r1/full.parquet'
OUTPUT = CHOICE / 'EVALUATOR-AUDIT.json'
PINS = {SEAL: '3fc7ff360f87f47aba3ef5b608b0774b140909c8a47adedc7fd3593a41c801c8',
        PACKETS: 'f82d881f43a9080d8f8996ecbcafbf95edcc18410605336aef0a5bbf9fa4906a',
        UNION: '7493a1865356df42e1bae584bc196619ee6159636be6250f1ce9895650234291',
        PARQUET: '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'}


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
    seal = json.loads(SEAL.read_text())
    packets = json.loads(PACKETS.read_text())['ordered_packets']
    union = {row['ordinal']: row for row in json.loads(UNION.read_text())['rows']}
    table = parquet.read_table(PARQUET, columns=['instance_id', 'base_commit', 'gold_context']).to_pylist()
    native = {row['instance_id']: row for row in table}
    if len(native) != len(table) or [row['ordinal'] for row in seal['rows']] != list(range(1, 13)) or \
            [packet['ordinal'] for packet in packets] != list(range(1, 13)):
        raise SystemExit('cohort-drift')
    rows = []
    by_repo = defaultdict(int)
    for record, packet in zip(seal['rows'], packets):
        ordinal = record['ordinal']
        source = union[ordinal]
        reference = native[packet['instance_id']]
        if packet['instance_id'] != source['instance_id'] or \
                reference['base_commit'] != source['base_commit'] or \
                packet['repo'] != source['repo']:
            raise SystemExit(f'identity-drift:{ordinal}')
        raw = ROOT / 'g02-product-replication-r11-20261002/pairs' / f'{ordinal:02d}-pr11-mixed-{ordinal:02d}' / 'raw'
        prediction_path = raw / 'policy-pruning/prediction.json'
        are_score_path = raw / 'policy-pruning/native-score.json'
        dsh_score_path = raw / 'dsh-export/native-score.json'
        prediction = json.loads(prediction_path.read_text())
        if prediction['instance_id'] != packet['instance_id']:
            raise SystemExit(f'prediction-identity-drift:{ordinal}')
        selected = {normalize(path) for path in prediction['traj_data']['pred_files']}
        proposed = {normalize(path) for path in record['selected_paths']}
        delivered = {normalize(path) for path in source['delivered_paths']}
        eligible = {item['path'] for item in packet['candidates']}
        if len(proposed) != len(record['selected_paths']) or proposed & (selected | delivered) or \
                not proposed.issubset(eligible) or len(proposed) > 3:
            raise SystemExit(f'proposal-identity-drift:{ordinal}')
        gold = {normalize(item['file']) for item in json.loads(reference['gold_context'])}
        are = json.loads(are_score_path.read_text())['native']['final']['file']
        dsh = json.loads(dsh_score_path.read_text())['native']['final']['file']
        baseline = f1(selected, gold)
        if (are['pred_size'] != len(selected) or are['gold_size'] != len(gold) or
                are['intersection'] != len(selected & gold) or
                abs(2*are['intersection']/(are['pred_size']+are['gold_size'])-baseline)>1e-12 or
                dsh['gold_size'] != len(gold)):
            raise SystemExit(f'native-score-parity-failed:{ordinal}')
        expanded = f1(selected | proposed, gold)
        hits = len(proposed & gold)
        by_repo[packet['repo']] += hits
        rows.append({'ordinal': ordinal, 'repo': packet['repo'], 'response_status': record['status'],
                     'selected_paths': len(proposed), 'new_gold_hits': hits,
                     'false_positive_files': len(proposed-gold),
                     'baseline_file_f1': baseline, 'expanded_file_f1': expanded,
                     'dsh_file_f1': 2*dsh['intersection']/(dsh['pred_size']+dsh['gold_size']),
                     'delta_vs_baseline': expanded-baseline,
                     'prediction_sha256': sha(prediction_path), 'are_score_sha256': sha(are_score_path),
                     'dsh_score_sha256': sha(dsh_score_path)})
    total_proposals = sum(row['selected_paths'] for row in rows)
    total_hits = sum(row['new_gold_hits'] for row in rows)
    mean = lambda key: sum(row[key] for row in rows)/len(rows)
    summary = {'tasks': 12, 'valid_responses': seal['valid_responses'],
               'invalid_responses': seal['invalid_responses'],
               'proposals': total_proposals, 'new_gold_hits': total_hits,
               'false_positive_files': total_proposals-total_hits,
               'proposal_precision': total_hits/total_proposals if total_proposals else 0,
               'repositories_with_hit': sum(value>0 for value in by_repo.values()),
               'by_repository_hits': dict(sorted(by_repo.items())),
               'baseline_mean_file_f1': mean('baseline_file_f1'),
               'expanded_mean_file_f1': mean('expanded_file_f1'),
               'dsh_mean_file_f1': mean('dsh_file_f1'),
               'counterfactual_mean_delta': mean('delta_vs_baseline'),
               'improved_tasks': sum(row['delta_vs_baseline']>0 for row in rows),
               'regressed_tasks': sum(row['delta_vs_baseline']<0 for row in rows),
               'known_chooser_tokens': seal['known_chooser_tokens']}
    gate = json.loads((CHOICE / 'FREEZE.json').read_text())['advancement_gate']
    gate_pass = (summary['valid_responses']==12 and summary['new_gold_hits']>=gate['minimum_new_gold_hits']
                 and summary['repositories_with_hit']>=gate['minimum_repositories_with_hit']
                 and summary['proposal_precision']>=gate['minimum_proposal_precision']
                 and summary['counterfactual_mean_delta']>=0)
    report = {'schema_version': 'g02.r11-hybrid-24-choice-evaluator-r3/v1',
              'posture': 'evaluator-only-exposed-development-set-replay-no-actual-reads',
              'input_sha256': {str(path): pin for path, pin in PINS.items()},
              'script_sha256': sha(Path(__file__)), 'gate': gate, 'gate_pass': gate_pass,
              'summary': summary, 'rows': rows,
              'claim_ceiling': 'Exposed set-based File-F1 counterfactual only; no actual ARE reads, Span-F1, all-in cost, independent transfer or superiority.'}
    data = (json.dumps(report, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    print(json.dumps({'summary': summary, 'gate_pass': gate_pass,
                      'receipt_sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
