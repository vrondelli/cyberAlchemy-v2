#!/usr/bin/env python3
"""Evaluator-only File-F1 replay of the sealed exposed G02 abstention rule."""

import argparse
import hashlib
import json
import os
from collections import defaultdict
from pathlib import Path

import pyarrow.parquet as parquet


ROOT = Path('/home/vlad_/are-benchmark-archive')
SOURCE_SHA256 = '74e48cd65d590708860a64ce926ff8cfd4323d0f9725582dd6bdb1380b45b8ef'
PARQUET_SHA256 = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
UNION_SHA256 = '7493a1865356df42e1bae584bc196619ee6159636be6250f1ce9895650234291'
OLD_AUDIT_SHA256 = 'a58fc4a17c1a1f372b90bf753e356321b1e83bc20eb4f35fac2f88f4a2eddcff'


def sha256(path):
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
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    args = parser.parse_args()
    output_root = args.source.resolve(strict=True)
    seal_path = output_root / 'SOURCE-SEAL.json'
    old_root = ROOT / 'g02-r11-hybrid-24-choice-exposed-r3-20261004'
    old_audit_path = old_root / 'EVALUATOR-AUDIT.json'
    union_path = ROOT / 'g02-r11-relation-union-exposed-r1-20261003/SOURCE-UNION.json'
    parquet_path = ROOT / 'g01-r8-eight-task-evaluator-r1/full.parquet'
    output_path = output_root / 'EVALUATOR-AUDIT.json'
    if output_path.exists() or {seal_path: SOURCE_SHA256, old_audit_path: OLD_AUDIT_SHA256,
            union_path: UNION_SHA256, parquet_path: PARQUET_SHA256} != {
            path: sha256(path) for path in (seal_path, old_audit_path, union_path, parquet_path)}:
        raise SystemExit('output-exists-or-input-pin-drift')
    seal = json.loads(seal_path.read_text())
    if seal['gold_opened'] is not False or seal['new_model_calls'] != 0 or len(seal['rows']) != 12:
        raise SystemExit('source-seal-drift')
    old_audit = json.loads(old_audit_path.read_text())
    old_rows = {row['ordinal']: row for row in old_audit['rows']}
    union = {row['ordinal']: row for row in json.loads(union_path.read_text())['rows']}
    table = parquet.read_table(parquet_path, columns=['instance_id', 'base_commit', 'gold_context']).to_pylist()
    native = {row['instance_id']: row for row in table}
    if len(old_rows) != 12 or len(union) != 12 or len(native) != len(table):
        raise SystemExit('cohort-drift')
    rows = []
    hits_by_repo = defaultdict(int)
    for row in seal['rows']:
        ordinal = row['ordinal']
        if ordinal not in old_rows or ordinal not in union or \
                row['instance_id'] != union[ordinal]['instance_id'] or \
                row['repo'] != union[ordinal]['repo'] or \
                not set(row['selected_paths']).issubset(row['original_paths']):
            raise SystemExit(f'identity-drift:{ordinal}')
        reference = native[row['instance_id']]
        if reference['base_commit'] != union[ordinal]['base_commit']:
            raise SystemExit(f'base-commit-drift:{ordinal}')
        raw = ROOT / 'g02-product-replication-r11-20261002/pairs' / f'{ordinal:02d}-pr11-mixed-{ordinal:02d}' / 'raw'
        prediction_path = raw / 'policy-pruning/prediction.json'
        if sha256(prediction_path) != old_rows[ordinal]['prediction_sha256']:
            raise SystemExit(f'prediction-pin-drift:{ordinal}')
        prediction = json.loads(prediction_path.read_text())
        selected = {normalize(path) for path in prediction['traj_data']['pred_files']}
        proposed = {normalize(path) for path in row['selected_paths']}
        gold = {normalize(item['file']) for item in json.loads(reference['gold_context'])}
        if len(proposed) != len(row['selected_paths']) or proposed & selected or \
                abs(f1(selected, gold) - old_rows[ordinal]['baseline_file_f1']) > 1e-12:
            raise SystemExit(f'baseline-or-proposal-drift:{ordinal}')
        expanded = f1(selected | proposed, gold)
        hits = len(proposed & gold)
        hits_by_repo[row['repo']] += hits
        rows.append({'ordinal': ordinal, 'repo': row['repo'], 'proposals': len(proposed),
                     'new_gold_hits': hits, 'false_positive_files': len(proposed) - hits,
                     'baseline_file_f1': f1(selected, gold), 'expanded_file_f1': expanded,
                     'delta_vs_baseline': expanded - f1(selected, gold)})
    if [row['ordinal'] for row in rows] != list(range(1, 13)):
        raise SystemExit('row-order-drift')
    total = sum(row['proposals'] for row in rows)
    hits = sum(row['new_gold_hits'] for row in rows)
    mean = lambda key: sum(row[key] for row in rows) / len(rows)
    summary = {'tasks': 12, 'proposals': total, 'new_gold_hits': hits,
               'false_positive_files': total - hits,
               'proposal_precision': hits / total if total else 0,
               'repositories_with_hit': sum(value > 0 for value in hits_by_repo.values()),
               'baseline_mean_file_f1': mean('baseline_file_f1'),
               'expanded_mean_file_f1': mean('expanded_file_f1'),
               'dsh_mean_file_f1': old_audit['summary']['dsh_mean_file_f1'],
               'counterfactual_mean_delta': mean('delta_vs_baseline'),
               'improved_tasks': sum(row['delta_vs_baseline'] > 0 for row in rows),
               'regressed_tasks': sum(row['delta_vs_baseline'] < 0 for row in rows)}
    gate = seal['evaluation_gate']
    passed = (hits >= gate['minimum_new_gold_hits'] and
              summary['repositories_with_hit'] >= gate['minimum_repositories_with_hit'] and
              summary['proposal_precision'] >= gate['minimum_proposal_precision'] and
              summary['counterfactual_mean_delta'] > gate['minimum_mean_file_f1_delta'])
    report = {'schema_version': 'g02.r11-identifier-abstention-evaluator-r4/v1',
              'posture': 'evaluator-only exposed set-based File-F1 replay; no actual reads',
              'source_sha256': SOURCE_SHA256, 'old_audit_sha256': OLD_AUDIT_SHA256,
              'summary': summary, 'rows': rows, 'gate_pass': passed,
              'claim_ceiling': 'No actual ARE read, native Span-F1, fresh cohort, all-in cost or superiority.'}
    data = (json.dumps(report, indent=2, sort_keys=True) + '\n').encode()
    fd = os.open(output_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'summary': summary, 'gate_pass': passed,
                      'evaluator_sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
