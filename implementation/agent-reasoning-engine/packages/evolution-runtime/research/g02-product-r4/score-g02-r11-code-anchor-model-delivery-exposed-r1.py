#!/usr/bin/env python3
"""Evaluator-only file-set diagnostic after sealing exposed model outputs."""

import hashlib
import json
import os
from pathlib import Path

import pyarrow.parquet as parquet


ARCHIVE = Path('/home/vlad_/are-benchmark-archive')
ROOT = ARCHIVE / 'g02-r11-code-anchor-model-delivery-exposed-r1-20261003'
COHORT = ARCHIVE / 'g02-product-replication-r11-20261002'
PARQUET = ARCHIVE / 'g02-r11-reference-private/full.parquet'
SEAL_SHA = 'dcd531ac0404f6208b37feb893350a3201e46cbdf68fdbcbdb135592f43f65b0'
PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as source:
        for block in iter(lambda: source.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def norm(path):
    path = path.replace('\\', '/')
    if path.startswith('/testbed/'):
        return path[len('/testbed/'):]
    if path.startswith('/workspace/'):
        parts = path[len('/workspace/'):].split('/', 1)
        return parts[1] if len(parts) == 2 else parts[0]
    return path.lstrip('/').removeprefix('./')


def f1(pred, gold):
    return 2 * len(pred & gold) / (len(pred) + len(gold)) if pred or gold else 1.0


def need(condition, reason):
    if not condition:
        raise ValueError('g02-model-delivery-score.' + reason)


def main():
    output = ROOT / 'EVALUATOR-AUDIT.json'
    need(not output.exists() and sha(ROOT / 'SEALED-RESPONSES.json') == SEAL_SHA and
         sha(PARQUET) == PARQUET_SHA, 'input-drift')
    sealed = json.loads((ROOT / 'SEALED-RESPONSES.json').read_text())
    packets = json.loads((ROOT / 'PACKETS.json').read_text())
    need([row['ordinal'] for row in sealed['rows']] == [4, 8] and
         [row['ordinal'] for row in packets['rows']] == [4, 8], 'ordinal')
    table = parquet.read_table(PARQUET, columns=['instance_id', 'gold_context']).to_pylist()
    need(len(table) == len({row['instance_id'] for row in table}), 'duplicate-reference')
    by_id = {row['instance_id']: row for row in table}
    rows = []
    for selected, packet in zip(sealed['rows'], packets['rows']):
        ordinal = selected['ordinal']
        need(ordinal == packet['ordinal'], 'identity')
        pair = COHORT / 'pairs' / f'{ordinal:02d}-pr11-mixed-{ordinal:02d}' / 'raw'
        prediction_path = pair / 'policy-pruning/prediction.json'
        score_path = pair / 'policy-pruning/native-score.json'
        dsh_path = pair / 'dsh-export/native-score.json'
        prediction = json.loads(prediction_path.read_text())
        are = json.loads(score_path.read_text())['native']['final']['file']
        dsh = json.loads(dsh_path.read_text())['native']['final']['file']
        need(prediction['instance_id'] == packet['instance_id'], 'prediction-identity')
        baseline = {norm(path) for path in prediction['traj_data']['pred_files']}
        extra = {norm(path) for path in selected['selected_extra_paths']}
        need(len(extra) == len(selected['selected_extra_paths']) and not (extra & baseline),
             'extra-prediction-overlap')
        gold = {norm(item['file']) for item in json.loads(by_id[packet['instance_id']]['gold_context'])}
        need(are['pred_size'] == len(baseline) and are['gold_size'] == len(gold) and
             are['intersection'] == len(baseline & gold) and dsh['gold_size'] == len(gold),
             'native-parity')
        before = f1(baseline, gold)
        after = f1(baseline | extra, gold)
        dsh_f1 = 2 * dsh['intersection'] / (dsh['pred_size'] + dsh['gold_size'])
        rows.append({'ordinal': ordinal, 'baseline_file_f1': before,
                     'additive_file_f1': after, 'dsh_file_f1': dsh_f1,
                     'delta_vs_baseline': after - before, 'added_extra_paths': len(extra),
                     'new_gold_hits': len(extra & gold), 'false_positive_files': len(extra - gold),
                     'known_model_tokens': selected['known_model_tokens'],
                     'prediction_sha256': sha(prediction_path),
                     'are_score_sha256': sha(score_path), 'dsh_score_sha256': sha(dsh_path)})
    result = {'schema_version': 'are.g02-r11-code-anchor-model-delivery-evaluator-audit/v1',
              'posture': 'evaluator-only-after-exposed-model-output-seal',
              'response_seal_sha256': SEAL_SHA, 'reference_sha256': PARQUET_SHA,
              'rows': rows,
              'summary': {'tasks': len(rows),
                          'added_extra_paths': sum(row['added_extra_paths'] for row in rows),
                          'new_gold_hits': sum(row['new_gold_hits'] for row in rows),
                          'false_positive_files': sum(row['false_positive_files'] for row in rows),
                          'mean_baseline_file_f1': sum(row['baseline_file_f1'] for row in rows)/len(rows),
                          'mean_additive_file_f1': sum(row['additive_file_f1'] for row in rows)/len(rows),
                          'mean_dsh_file_f1': sum(row['dsh_file_f1'] for row in rows)/len(rows),
                          'known_extra_model_tokens': sealed['known_model_tokens_total']},
              'claim_ceiling': 'Exposed two-task additive file-set diagnostic only. Model saw exact read excerpts, but no full ARE episode, native rescoring, all-in cost, independent cohort, or superiority.'}
    data = (json.dumps(result,sort_keys=True,indent=2)+'\n').encode()
    fd = os.open(output,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
    with os.fdopen(fd,'wb') as target:
        target.write(data)
    print(json.dumps({'summary':result['summary'],'receipt_sha256':hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
