#!/usr/bin/env python3
"""Evaluator-only audit of sealed G02 r11 code-element proposals."""

import hashlib
import json
import os
from collections import defaultdict
from pathlib import Path

import pyarrow.parquet as parquet


ROOT = Path('/home/vlad_/are-benchmark-archive')
SEAL = ROOT / 'g02-r11-code-element-gate-exposed-r1-20261003/SOURCE-SEAL.json'
UNION = ROOT / 'g02-r11-relation-union-exposed-r1-20261003/SOURCE-UNION.json'
PRIOR = ROOT / 'g02-r11-retrieval-exposed-r1-20261002/SEAL.json'
PARQUET = ROOT / 'g01-r8-eight-task-evaluator-r1/full.parquet'
OUTPUT = SEAL.parent / 'EVALUATOR-AUDIT.json'
PINS = {
    SEAL: '6c0a410127571c16cf991f14cab2ba1037cf02a14b8d9d4c7db97a8c7e98219d',
    UNION: '7493a1865356df42e1bae584bc196619ee6159636be6250f1ce9895650234291',
    PRIOR: 'eb6295120ed72c227589db7c88920bb8654b170af19f9677c553824919782901',
    PARQUET: '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8',
}
GATE = {'minimum_gold_hits': 6, 'minimum_precision': 0.5,
        'minimum_mean_file_f1_gain': 0.03, 'minimum_repo_mean_delta': 0.0}


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


def f1(selected, gold):
    return 2 * len(selected & gold) / (len(selected) + len(gold)) if selected or gold else 1.0


def main():
    if OUTPUT.exists() or any(sha(path) != pin for path, pin in PINS.items()):
        raise ValueError('output-exists-or-input-drift')
    seal = json.loads(SEAL.read_text())
    pooled = {row['ordinal']: row for row in json.loads(UNION.read_text())['rows']}
    prior_obj = json.loads(PRIOR.read_text())
    prior = {row['ordinal']: row for row in prior_obj['rows']}
    table = parquet.read_table(PARQUET, columns=['instance_id', 'base_commit', 'gold_context']).to_pylist()
    native = {row['instance_id']: row for row in table}
    if len(native) != len(table) or [row['ordinal'] for row in seal['rows']] != list(range(1, 13)):
        raise ValueError('row-shape-drift')
    rows = []
    by_repo = defaultdict(list)
    for row in seal['rows']:
        ordinal = row['ordinal']
        old = prior[ordinal]
        union = pooled[ordinal]
        reference = native[row['instance_id']]
        if (row['instance_id'] != old['instance_id'] or
                row['instance_id'] != union['instance_id'] or
                row['base_commit'] != old['base_commit'] or
                row['base_commit'] != union['base_commit'] or
                row['base_commit'] != reference['base_commit'] or
                row['issue_sha256'] != old['issue_sha256'] or
                row['issue_sha256'] != union['issue_sha256']):
            raise ValueError(f'identity-drift:{ordinal}')
        pool = {item['path'] for item in union['candidates'] if item['bytes'] <= 262144}
        proposed = {normalize(item['path']) for item in row['proposals']}
        delivered = {normalize(path) for path in old['delivered_paths']}
        if (len(proposed) != len(row['proposals']) or len(proposed) > 3 or
                proposed - pool or proposed & delivered):
            raise ValueError(f'proposal-drift:{ordinal}')
        raw = Path(prior_obj['archive']) / 'pairs' / f'{ordinal:02d}-pr11-mixed-{ordinal:02d}' / 'raw'
        prediction = json.loads((raw / 'policy-pruning/prediction.json').read_text())
        native_score = json.loads((raw / 'policy-pruning/native-score.json').read_text())['native']['final']['file']
        selected = {normalize(path) for path in prediction['traj_data']['pred_files']}
        gold = {normalize(item['file']) for item in json.loads(reference['gold_context'])}
        if (prediction['instance_id'] != row['instance_id'] or proposed & selected or
                native_score['pred_size'] != len(selected) or
                native_score['gold_size'] != len(gold) or
                native_score['intersection'] != len(selected & gold)):
            raise ValueError(f'native-parity-drift:{ordinal}')
        result = {'ordinal': ordinal, 'repo': union['repo'],
                  'issue_was_json_string': row['issue_was_json_string'],
                  'proposals': len(proposed),
                  'new_gold_hits': len(proposed & (gold - delivered)),
                  'false_positives': len(proposed - gold),
                  'baseline_file_f1': f1(selected, gold),
                  'expanded_file_f1': f1(selected | proposed, gold)}
        result['file_f1_delta'] = result['expanded_file_f1'] - result['baseline_file_f1']
        rows.append(result)
        by_repo[result['repo']].append(result)
    summary = {'tasks': len(rows), 'proposals': sum(row['proposals'] for row in rows),
               'new_gold_hits': sum(row['new_gold_hits'] for row in rows),
               'false_positives': sum(row['false_positives'] for row in rows),
               'baseline_mean_file_f1': sum(row['baseline_file_f1'] for row in rows) / len(rows),
               'expanded_mean_file_f1': sum(row['expanded_file_f1'] for row in rows) / len(rows),
               'improved_tasks': sum(row['file_f1_delta'] > 1e-12 for row in rows),
               'regressed_tasks': sum(row['file_f1_delta'] < -1e-12 for row in rows),
               'repo_mean_deltas': {repo: sum(item['file_f1_delta'] for item in group) / len(group)
                                    for repo, group in sorted(by_repo.items())}}
    precision = summary['new_gold_hits'] / summary['proposals'] if summary['proposals'] else 0
    gate_pass = (summary['new_gold_hits'] >= GATE['minimum_gold_hits'] and
                 precision >= GATE['minimum_precision'] and
                 summary['expanded_mean_file_f1'] - summary['baseline_mean_file_f1'] >=
                 GATE['minimum_mean_file_f1_gain'] and
                 all(value >= GATE['minimum_repo_mean_delta'] - 1e-12
                     for value in summary['repo_mean_deltas'].values()))
    output = {'schema_version': 'g02.r11-code-element-gate-exposed-audit/v1',
              'posture': 'evaluator-only-exposed-development-no-model-no-actual-read',
              'input_sha256': {str(path): pin for path, pin in PINS.items()},
              'script_sha256': sha(Path(__file__)), 'gate': GATE, 'gate_pass': gate_pass,
              'rows': rows, 'summary': summary,
              'claim_ceiling': 'Set-based File-F1 counterfactual only; no actual read, Span-F1, all-in cost, independent cohort, or superiority.'}
    data = (json.dumps(output, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    print(json.dumps({'summary': summary, 'precision': precision,
                      'gate_pass': gate_pass, 'receipt_sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
