#!/usr/bin/env python3
"""Evaluator-only upper bound for a perfect filter of sealed G02 chooser proposals."""

import hashlib
import json
import os
from pathlib import Path

import pyarrow.parquet as parquet


ROOT = Path('/home/vlad_/are-benchmark-archive')
CHOICE = ROOT / 'g02-r11-hybrid-24-choice-exposed-r3-20261004'
SEAL = CHOICE / 'SEALED-RESPONSES.json'
UNION = ROOT / 'g02-r11-relation-union-exposed-r1-20261003/SOURCE-UNION.json'
PARQUET = ROOT / 'g01-r8-eight-task-evaluator-r1/full.parquet'
OUTPUT = ROOT / 'g02-r11-chooser-proposal-oracle-exposed-r1-20261004/EVALUATOR-AUDIT.json'
PINS = {
    SEAL: '3fc7ff360f87f47aba3ef5b608b0774b140909c8a47adedc7fd3593a41c801c8',
    UNION: '7493a1865356df42e1bae584bc196619ee6159636be6250f1ce9895650234291',
    PARQUET: '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8',
}


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
    if OUTPUT.exists() or any(sha(path) != pin for path, pin in PINS.items()):
        raise SystemExit('output-exists-or-input-pin-drift')
    chosen = json.loads(SEAL.read_text())['rows']
    union = json.loads(UNION.read_text())['rows']
    labels = parquet.read_table(PARQUET, columns=['instance_id', 'base_commit', 'gold_context']).to_pylist()
    references = {row['instance_id']: row for row in labels}
    if len(chosen) != 12 or len(union) != 12 or len(references) != len(labels):
        raise SystemExit('cohort-drift')
    rows = []
    for proposal, source in zip(chosen, union):
        ordinal = source['ordinal']
        reference = references[source['instance_id']]
        if proposal['ordinal'] != ordinal or reference['base_commit'] != source['base_commit']:
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
        proposed = {normalize(path) for path in proposal['selected_paths']}
        eligible = {item['path'] for item in source['candidates'] if item['bytes'] <= 262144}
        delivered = {normalize(path) for path in source['delivered_paths']}
        if (len(proposed) != len(proposal['selected_paths']) or len(proposed) > 3
                or proposed & (selected | delivered) or not proposed.issubset(eligible)):
            raise SystemExit(f'proposal-drift:{ordinal}')
        are = json.loads(are_score_path.read_text())['native']['final']['file']
        dsh = json.loads(dsh_score_path.read_text())['native']['final']['file']
        baseline = f1(selected, gold)
        if (are['pred_size'] != len(selected) or are['gold_size'] != len(gold)
                or are['intersection'] != len(selected & gold)
                or abs(2 * are['intersection'] / (are['pred_size'] + are['gold_size']) - baseline) > 1e-12
                or dsh['gold_size'] != len(gold)):
            raise SystemExit(f'native-parity:{ordinal}')
        oracle_add = proposed & gold
        rows.append({
            'ordinal': ordinal, 'repo': source['repo'],
            'proposed_count': len(proposed), 'oracle_accepted_gold_count': len(oracle_add),
            'oracle_rejected_false_positive_count': len(proposed - gold),
            'baseline_file_f1': baseline,
            'oracle_filtered_file_f1': f1(selected | oracle_add, gold),
            'dsh_file_f1': 2 * dsh['intersection'] / (dsh['pred_size'] + dsh['gold_size']),
            'prediction_sha256': sha(prediction_path),
            'are_score_sha256': sha(are_score_path),
            'dsh_score_sha256': sha(dsh_score_path),
        })
    mean = lambda name: sum(row[name] for row in rows) / len(rows)
    summary = {
        'tasks': 12, 'sealed_proposals': sum(row['proposed_count'] for row in rows),
        'oracle_accepted_gold': sum(row['oracle_accepted_gold_count'] for row in rows),
        'oracle_rejected_false_positives': sum(row['oracle_rejected_false_positive_count'] for row in rows),
        'baseline_mean_file_f1': mean('baseline_file_f1'),
        'oracle_filtered_mean_file_f1': mean('oracle_filtered_file_f1'),
        'dsh_mean_file_f1': mean('dsh_file_f1'),
    }
    report = {
        'schema_version': 'g02.r11-chooser-proposal-oracle-exposed-r1/v1',
        'posture': 'evaluator-only-gold-aware-upper-bound-no-verifier-model-call',
        'input_sha256': {str(path): pin for path, pin in PINS.items()},
        'script_sha256': sha(Path(__file__)), 'summary': summary, 'rows': rows,
        'claim_ceiling': 'Perfect-filter upper bound on exposed proposals only; no actual ARE read, Span-F1, cost, independent result or superiority.',
    }
    data = (json.dumps(report, sort_keys=True, indent=2) + '\n').encode()
    OUTPUT.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    print(json.dumps({'summary': summary, 'receipt_sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
