#!/usr/bin/env python3
"""Evaluator-only audit of the sealed G02 same-directory filename rank."""

import hashlib
import json
import os
from collections import defaultdict
from pathlib import Path

import pyarrow.parquet as parquet


ROOT = Path('/home/vlad_/are-benchmark-archive')
SEAL = ROOT / 'g02-r11-same-directory-name-rank-exposed-r1-20261003/SOURCE-SEAL.json'
POOL = ROOT / 'g02-r11-same-directory-pool-exposed-r1-20261003/SOURCE-SEAL.json'
PRIOR = ROOT / 'g02-r11-retrieval-exposed-r1-20261002/SEAL.json'
PARQUET = ROOT / 'g01-r8-eight-task-evaluator-r1/full.parquet'
OUTPUT = SEAL.parent / 'AUDIT.json'
PINS = {SEAL: '8f01c6e8bec918f49e0a2a0a9ee727c23175e5d14db1cadcff81aeae1cf62baa',
        POOL: '58977faf143e620d3f6695d79a58b37c01669a3d7ae239992833d97f37c38dc1',
        PRIOR: 'eb6295120ed72c227589db7c88920bb8654b170af19f9677c553824919782901',
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
        return path[len('/testbed/'):]
    if path.startswith('/workspace/'):
        rest = path[len('/workspace/'):].split('/', 1)
        return rest[1] if len(rest) == 2 else rest[0]
    return path.lstrip('/').removeprefix('./')


def f1(prediction, gold):
    return 2 * len(prediction & gold) / (len(prediction) + len(gold)) if prediction or gold else 1.0


def main():
    if OUTPUT.exists() or any(sha(path) != pin for path, pin in PINS.items()):
        raise ValueError('output-exists-or-pinned-input-drift')
    seal = json.loads(SEAL.read_text())
    pool = json.loads(POOL.read_text())
    prior = json.loads(PRIOR.read_text())
    if (seal['schema_version'] != 'g02.r11-same-directory-name-rank-exposed-seal/v1' or
            [row['ordinal'] for row in seal['rows']] != list(range(1, 13))):
        raise ValueError('seal-shape')
    pool_rows = {row['ordinal']: row for row in pool['rows']}
    prior_rows = {row['ordinal']: row for row in prior['rows']}
    table = parquet.read_table(PARQUET, columns=['instance_id', 'base_commit', 'gold_context']).to_pylist()
    natives = {row['instance_id']: row for row in table}
    if len(natives) != len(table):
        raise ValueError('duplicate-native-id')
    rows = []
    by_repo = defaultdict(list)
    for row in seal['rows']:
        ordinal = row['ordinal']
        pooled = pool_rows[ordinal]
        old = prior_rows[ordinal]
        native = natives[row['instance_id']]
        if (row['instance_id'] != pooled['instance_id'] or row['instance_id'] != old['instance_id'] or
                row['base_commit'] != pooled['base_commit'] or row['base_commit'] != native['base_commit'] or
                row['issue_sha256'] != pooled['issue_sha256'] or row['issue_sha256'] != old['issue_sha256']):
            raise ValueError(f'identity:{ordinal}')
        allowed = {normalize(item['path']): item['source_sha256'] for item in pooled['candidates']}
        proposed = {normalize(item['path']) for item in row['proposals']}
        delivered = {normalize(item) for item in old['delivered_paths']}
        if (len(proposed) != len(row['proposals']) or len(proposed) > 3 or proposed & delivered or
                any(allowed.get(normalize(item['path'])) != item['source_sha256']
                    for item in row['proposals'])):
            raise ValueError(f'proposal:{ordinal}')
        raw = Path(prior['archive']) / 'pairs' / f'{ordinal:02d}-pr11-mixed-{ordinal:02d}' / 'raw'
        prediction_path = raw / 'policy-pruning/prediction.json'
        score_path = raw / 'policy-pruning/native-score.json'
        prediction = json.loads(prediction_path.read_text())
        native_score = json.loads(score_path.read_text())['native']['final']['file']
        selected = {normalize(item) for item in prediction['traj_data']['pred_files']}
        gold = {normalize(item['file']) for item in json.loads(native['gold_context'])}
        if (prediction['instance_id'] != row['instance_id'] or proposed & selected or
                native_score['pred_size'] != len(selected) or native_score['gold_size'] != len(gold) or
                native_score['intersection'] != len(selected & gold)):
            raise ValueError(f'native-parity:{ordinal}')
        record = {'ordinal': ordinal, 'repo': pooled['repo'], 'proposals': len(proposed),
                  'new_gold_hits': len(proposed & (gold - delivered)),
                  'false_positives': len(proposed - gold),
                  'baseline_file_f1': f1(selected, gold),
                  'expanded_file_f1': f1(selected | proposed, gold)}
        record['file_f1_delta'] = record['expanded_file_f1'] - record['baseline_file_f1']
        rows.append(record)
        by_repo[pooled['repo']].append(record)
    summary = {'tasks': len(rows), 'proposals': sum(row['proposals'] for row in rows),
               'new_gold_hits': sum(row['new_gold_hits'] for row in rows),
               'false_positives': sum(row['false_positives'] for row in rows),
               'baseline_mean_file_f1': sum(row['baseline_file_f1'] for row in rows) / len(rows),
               'expanded_mean_file_f1': sum(row['expanded_file_f1'] for row in rows) / len(rows),
               'improved_tasks': sum(row['file_f1_delta'] > 0 for row in rows),
               'regressed_tasks': sum(row['file_f1_delta'] < 0 for row in rows),
               'tied_tasks': sum(row['file_f1_delta'] == 0 for row in rows),
               'repo_mean_deltas': {repo: sum(item['file_f1_delta'] for item in group) / len(group)
                                    for repo, group in sorted(by_repo.items())}}
    receipt = {'schema_version': 'g02.r11-same-directory-name-rank-exposed-audit/v1',
               'posture': 'evaluator-only-exposed-development-no-model-no-actual-read',
               'source_seal_sha256': PINS[SEAL], 'source_pool_sha256': PINS[POOL],
               'prior_seal_sha256': PINS[PRIOR], 'native_gold_parquet_sha256': PINS[PARQUET],
               'script_sha256': sha(Path(__file__)), 'rows': rows, 'summary': summary,
               'claim_ceiling': 'Set-based File-F1 development counterfactual only; no actual read, Span-F1, token/time cost, independent cohort, or superiority.'}
    data = (json.dumps(receipt, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'summary': summary, 'sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
