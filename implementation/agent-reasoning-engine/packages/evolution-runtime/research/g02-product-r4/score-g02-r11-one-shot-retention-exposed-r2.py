#!/usr/bin/env python3
"""Evaluator-only direct file-set score of previously sealed exposed selections."""

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
        raise ValueError('g02-one-shot-retention.' + reason)


def main():
    output = ROOT / 'SELECTION-EVAL.json'
    need(not output.exists() and sha(ROOT / 'SEALED-RESPONSES.json') == SEAL_SHA and
         sha(PARQUET) == PARQUET_SHA, 'input-or-output')
    sealed = json.loads((ROOT / 'SEALED-RESPONSES.json').read_text())
    packets = json.loads((ROOT / 'PACKETS.json').read_text())
    need([row['ordinal'] for row in sealed['rows']] == [4, 8] and
         [row['ordinal'] for row in packets['rows']] == [4, 8], 'ordinals')
    table = parquet.read_table(PARQUET, columns=['instance_id', 'gold_context']).to_pylist()
    need(len(table) == len({row['instance_id'] for row in table}), 'duplicate-reference')
    by_id = {row['instance_id']: row for row in table}
    rows = []
    for selected, packet in zip(sealed['rows'], packets['rows']):
        ordinal = selected['ordinal']
        need(ordinal == packet['ordinal'], 'identity')
        pair = COHORT / 'pairs' / f'{ordinal:02d}-pr11-mixed-{ordinal:02d}' / 'raw'
        prediction_path = pair / 'policy-pruning/prediction.json'
        are_score_path = pair / 'policy-pruning/native-score.json'
        dsh_score_path = pair / 'dsh-export/native-score.json'
        prediction = json.loads(prediction_path.read_text())
        are = json.loads(are_score_path.read_text())['native']['final']['file']
        dsh = json.loads(dsh_score_path.read_text())['native']['final']['file']
        need(prediction['instance_id'] == packet['instance_id'], 'prediction-id')
        baseline = {norm(path) for path in prediction['traj_data']['pred_files']}
        observed = {norm(read['path']) for read in packet['reads']}
        one_shot = {norm(path) for path in selected['selected_paths']}
        need(len(one_shot) == len(selected['selected_paths']) and one_shot <= observed,
             'selection-not-observed')
        gold = {norm(item['file']) for item in json.loads(by_id[packet['instance_id']]['gold_context'])}
        need(are['pred_size'] == len(baseline) and are['gold_size'] == len(gold) and
             are['intersection'] == len(baseline & gold) and dsh['gold_size'] == len(gold),
             'native-parity')
        rows.append({'ordinal': ordinal,
                     'baseline_file_f1': f1(baseline, gold),
                     'one_shot_selected_file_f1': f1(one_shot, gold),
                     'dsh_file_f1': 2 * dsh['intersection'] / (dsh['pred_size'] + dsh['gold_size']),
                     'selected_files': len(one_shot), 'selected_gold_hits': len(one_shot & gold),
                     'selected_false_positives': len(one_shot - gold),
                     'known_model_tokens': selected['known_model_tokens'],
                     'prediction_sha256': sha(prediction_path),
                     'are_score_sha256': sha(are_score_path),
                     'dsh_score_sha256': sha(dsh_score_path)})
    result = {'schema_version': 'are.g02-r11-one-shot-retention-exposed/v2',
              'posture': 'evaluator-only-after-model-output-seal',
              'response_seal_sha256': SEAL_SHA, 'reference_sha256': PARQUET_SHA,
              'rows': rows,
              'summary': {'tasks': len(rows),
                          'selected_gold_hits': sum(row['selected_gold_hits'] for row in rows),
                          'selected_false_positives': sum(row['selected_false_positives'] for row in rows),
                          'mean_baseline_file_f1': sum(row['baseline_file_f1'] for row in rows)/len(rows),
                          'mean_one_shot_file_f1': sum(row['one_shot_selected_file_f1'] for row in rows)/len(rows),
                          'mean_dsh_file_f1': sum(row['dsh_file_f1'] for row in rows)/len(rows),
                          'known_extra_model_tokens': sealed['known_model_tokens_total']},
              'claim_ceiling': 'Direct file-set score of a one-shot exposed selector, not native full-episode projection, Span-F1, all-in cost, independent validation, or superiority.'}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    print(json.dumps({'summary': result['summary'],
                      'receipt_sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
