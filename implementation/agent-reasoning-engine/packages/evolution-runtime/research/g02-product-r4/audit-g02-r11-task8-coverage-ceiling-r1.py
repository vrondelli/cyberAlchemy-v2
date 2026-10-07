#!/usr/bin/env python3
"""Evaluator-only counts for already-delivered versus candidate coverage."""

import hashlib
import json
import os
from pathlib import Path

import pyarrow.parquet as parquet


ARCHIVE = Path('/home/vlad_/are-benchmark-archive')
ROOT = ARCHIVE / 'g02-r11-task8-old-hack-coverage-r1-20261003'
SOURCE = ROOT / 'SOURCE-CENSUS.json'
PARQUET = ARCHIVE / 'g02-r11-reference-private/full.parquet'
PREDICTION = ARCHIVE / 'g02-product-replication-r11-20261002/pairs/08-pr11-mixed-08/raw/policy-pruning/prediction.json'
NATIVE = ARCHIVE / 'g02-product-replication-r11-20261002/pairs/08-pr11-mixed-08/raw/policy-pruning/native-score.json'
PACKETS = ARCHIVE / 'g02-r11-relational-choice-exposed-r5-20261003/PACKETS.json'
SOURCE_SHA = '43616198bac41b110d7934b6f891243aee40db9cda62e66ba3c2c8e41a8c2e95'
PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
PACKETS_SHA = '8865de1df1268d3db7ffe65afbead0174a1e6d1ec4c386228b7bbe7e33752255'


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


def need(ok, reason):
    if not ok:
        raise ValueError('g02-task8-coverage-ceiling.' + reason)


def main():
    output = ROOT / 'EVALUATOR-COVERAGE.json'
    need(not output.exists() and sha(SOURCE) == SOURCE_SHA and
         sha(PARQUET) == PARQUET_SHA and sha(PACKETS) == PACKETS_SHA,
         'input-or-output')
    source = json.loads(SOURCE.read_text())
    packet = next(row for row in json.loads(PACKETS.read_text())['ordered_packets']
                  if row['ordinal'] == 8)
    need(source['instance_id'] == packet['instance_id'], 'identity')
    delivered = {norm(path) for path in packet['already_read_paths']}
    candidates = {norm(row['path']) for row in packet['candidates']}
    old_hack = {norm(path) for path in source['old_hack_paths']}
    table = parquet.read_table(PARQUET, columns=['instance_id', 'gold_context']).to_pylist()
    need(len(table) == len({row['instance_id'] for row in table}), 'duplicate-reference')
    by_id = {row['instance_id']: row for row in table}
    gold = {norm(item['file']) for item in
            json.loads(by_id[source['instance_id']]['gold_context'])}
    pred = json.loads(PREDICTION.read_text())
    native = json.loads(NATIVE.read_text())['native']['final']['file']
    selected = {norm(path) for path in pred['traj_data']['pred_files']}
    need(pred['instance_id'] == source['instance_id'] and
         native['pred_size'] == len(selected) and native['gold_size'] == len(gold) and
         native['intersection'] == len(selected & gold), 'native-parity')
    counts = {'gold_files': len(gold), 'gold_already_delivered': len(gold & delivered),
              'gold_in_direct_include_pool': len(gold & candidates),
              'gold_in_old_hack_callsites': len(gold & old_hack),
              'gold_outside_delivered_and_pool': len(gold - delivered - candidates),
              'gold_in_both_delivered_and_pool': len(gold & delivered & candidates),
              'baseline_selected_gold': len(gold & selected)}
    need(counts['gold_files'] == native['gold_size'], 'count-parity')
    result = {'schema_version': 'are.g02-r11-task8-coverage-ceiling/v1',
              'posture': 'evaluator-only-after-source-census-seal',
              'source_census_sha256': SOURCE_SHA, 'reference_sha256': PARQUET_SHA,
              'prediction_sha256': sha(PREDICTION), 'native_score_sha256': sha(NATIVE),
              'counts': counts,
              'claim_ceiling': 'One exposed task, aggregate coverage counts only; no new model output, full episode improvement, independent validation, or superiority.'}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    print(json.dumps({'counts': counts,
                      'receipt_sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
