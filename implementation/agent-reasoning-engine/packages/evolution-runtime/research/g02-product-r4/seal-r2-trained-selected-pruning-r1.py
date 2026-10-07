#!/usr/bin/env python3
"""Fixed 0.5 r2-trained pruning of only originally selected G02 files."""

import copy
import hashlib
import json
from pathlib import Path

import numpy as np


BASE = Path('/opt/are/evolution-runtime')
FEATURE = BASE / 'g02-delivered-file-features-r1/FEATURE-SEAL.json'
TRANSFER = BASE / 'g02-delivered-file-transfer-r1/RESULT.json'
OUTPUT = BASE / 'g02-r2-trained-selected-pruning-r1'
FEATURE_SHA = 'e631965d3b42b34d37f06317716bbf360f8ab2584d3c7bdec39c32884e35da5e'
TRANSFER_SHA = 'cafa966fa81eeba126a99a9234a85b2206ac3f90f8736b7bad736e5b2d60d4c2'
PLANS = {'r2': BASE / 'g02-product-replication-execution-r2.json',
         'r3': BASE / 'g02-product-replication-r3/EXECUTION-PLAN.json'}
PLAN_SHA = {'r2': 'bfc92b5a331fc462834d5dd2bb1d93643a5dfaa5dc0817558c0a2c80bf8db808',
            'r3': '0ccc9f027000682bbe950e8d8561ff150714aeb9610608149b0c26e4d41da53a'}
THRESHOLD = 0.5


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def write_once(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('x') as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write('\n')


def need(ok, reason):
    if not ok:
        raise ValueError(f'g02-r2-trained-selected-pruning-r1.{reason}')


def probability(row, names, model):
    vector = np.asarray([row['features'][name] for name in names], dtype=float)
    mean = np.asarray(model['standardization_train_mean'], dtype=float)
    std = np.asarray(model['standardization_train_std'], dtype=float)
    weights = np.asarray(model['intercept_and_weights'], dtype=float)
    need(len(vector) == len(mean) == len(std) == len(weights) - 1 and
         np.isfinite(vector).all() and np.isfinite(weights).all() and
         (std > 0).all(), 'model-shape')
    z = weights @ np.concatenate(([1.0], np.clip((vector - mean) / std, -10, 10)))
    return float(1 / (1 + np.exp(-np.clip(z, -40, 40))))


def main():
    need(sha(FEATURE) == FEATURE_SHA and sha(TRANSFER) == TRANSFER_SHA and
         all(sha(path) == PLAN_SHA[key] for key, path in PLANS.items()),
         'frozen-input-drift')
    need(not OUTPUT.exists(), 'output-exists')
    feature = read(FEATURE)
    transfer = read(TRANSFER)
    names, model = feature['feature_names'], transfer['model']
    need(names == transfer['feature_names'] and model['train_cohort'] == 'r2' and
         model['test_cohort'] == 'r3' and model['iterations'] == 2000 and
         model['learning_rate'] == 0.05 and model['l2'] == 0.10,
         'model-binding')
    plans = {cohort: {p['suffix']: p for p in read(path)['ordered_pairs']}
             for cohort, path in PLANS.items()}
    packet_seal = read(BASE / 'g02-r4-reviewer-packets-r1/SEAL.json')
    need(sha(BASE / 'g02-r4-reviewer-packets-r1/SEAL.json') ==
         feature['packet_seal_sha256'], 'packet-seal-drift')
    packets = {(entry['cohort'], entry['pair']): entry for entry in packet_seal['packets']}
    need(len(packets) == 32, 'packet-count')
    rows = []
    for pair in feature['pairs']:
        cohort, suffix = pair['cohort'], pair['pair']
        need(cohort in plans and suffix in plans[cohort], 'pair-identity')
        root = Path(plans[cohort][suffix]['root'])
        source_path = root / 'evidence/run/prediction.json'
        are_score = root / 'evidence/run/native-score.json'
        dsh_score = root / 'dsh-export/native-score.json'
        need(all(path.is_file() for path in (source_path, are_score, dsh_score)),
             'source-missing')
        source = read(source_path)
        need(source['instance_id'] == pair['instance_id'], 'instance-identity')
        # The feature seal binds the packet, not the prediction; recheck that
        # binding directly before producing a candidate prediction.
        packet_entry = packets[(cohort, suffix)]
        need(sha(packet_entry['path']) == pair['packet_sha256'] and
             sha(source_path) == read(packet_entry['path'])['prediction_sha256'],
             'packet-prediction-binding')
        selected = source['traj_data']['pred_files']
        need(selected and len(selected) == len(set(selected)) and
             set(selected) == set(source['traj_data']['pred_spans']), 'selected-shape')
        feature_by_path = {row['path']: row for row in pair['rows']}
        need(set(selected) <= set(feature_by_path), 'selected-feature-coverage')
        score = {path: probability(feature_by_path[path], names, model) for path in selected}
        retained = [path for path in selected if score[path] >= THRESHOLD]
        if not retained:
            retained = [max(selected, key=lambda path: (score[path], -selected.index(path)))]
        candidate = copy.deepcopy(source)
        candidate['traj_data']['pred_files'] = retained
        candidate['traj_data']['pred_spans'] = {path: source['traj_data']['pred_spans'][path]
                                                for path in retained}
        prediction = OUTPUT / f'{cohort}-{suffix}' / 'prediction.json'
        write_once(prediction, candidate)
        rows.append({'cohort': cohort, 'pair': suffix, 'repo': plans[cohort][suffix]['repo'],
                     'source_prediction': str(source_path),
                     'source_prediction_sha256': sha(source_path),
                     'are_score': str(are_score), 'dsh_score': str(dsh_score),
                     'packet': packet_entry['path'], 'packet_sha256': pair['packet_sha256'],
                     'prediction': str(prediction), 'prediction_sha256': sha(prediction),
                     'original_files': len(selected), 'retained_files': len(retained),
                     'dropped_files': len(selected) - len(retained)})
    need(len(rows) == 32 and sum(r['cohort'] == 'r2' for r in rows) == 23 and
         sum(r['cohort'] == 'r3' for r in rows) == 9, 'denominators')
    seal = {'schema_version': 'are.g02-r2-trained-selected-pruning-seal/v1',
            'posture': 'exposed-development-source-transform-no-gold-or-score-read',
            'feature_seal_sha256': FEATURE_SHA, 'trained_transfer_sha256': TRANSFER_SHA,
            'packet_seal_sha256': feature['packet_seal_sha256'],
            'plan_sha256': PLAN_SHA, 'script_sha256': sha(__file__),
            'policy': {'drop_selected_below_probability': THRESHOLD,
                       'minimum_original_selected_files_retained': 1,
                       'new_file_additions': 0, 'spans': 'unchanged-for-retained-files'},
            'rows': rows,
            'claim_ceiling': 'Already-exposed r2-trained development candidate; not a fresh holdout or superiority result.',
            'open_questions': ['Does deletion-only selection improve both exposed cohorts without Span-F1 regression?',
                               'Does it transfer to a fresh matched G02 cohort?']}
    write_once(OUTPUT / 'SEAL.json', seal)
    print(json.dumps({'status': 'sealed', 'sha256': sha(OUTPUT / 'SEAL.json'),
                      'pairs': 32, 'changed': sum(r['dropped_files'] > 0 for r in rows),
                      'dropped_files': sum(r['dropped_files'] for r in rows)}))


if __name__ == '__main__':
    main()
