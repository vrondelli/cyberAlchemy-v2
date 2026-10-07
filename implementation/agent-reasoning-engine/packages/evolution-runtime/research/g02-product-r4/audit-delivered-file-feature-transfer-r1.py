#!/usr/bin/env python3
"""Fixed evaluator-only r2->r3 transfer of gold-blind G02 file features."""

import hashlib
import json
import math
import os
import sys
from pathlib import Path

import numpy as np


BASE = Path('/opt/are/evolution-runtime')
FEATURE = BASE / 'g02-delivered-file-features-r1/FEATURE-SEAL.json'
OUTPUT = BASE / 'g02-delivered-file-transfer-r1/RESULT.json'
UPSTREAM = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
FEATURE_SHA = 'e631965d3b42b34d37f06317716bbf360f8ab2584d3c7bdec39c32884e35da5e'
PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
PACKET_SEAL_SHA = '11cc658044a9429d4a8a77682460336c578eb65c39db6a5cdc0192a38685682d'
ITERATIONS = 2000
LEARNING_RATE = 0.05
L2 = 0.10


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def need(ok, reason):
    if not ok:
        raise ValueError(f'g02-delivered-file-transfer-r1.{reason}')


def auc(scores, labels):
    positive = [(s, y) for s, y in zip(scores, labels) if y == 1]
    negative = [(s, y) for s, y in zip(scores, labels) if y == 0]
    if not positive or not negative:
        return None
    total = 0.0
    for pos, _ in positive:
        for neg, _ in negative:
            total += 1 if pos > neg else 0.5 if pos == neg else 0
    return total / (len(positive) * len(negative))


def metrics(pairs, score_by_path):
    files = [(entry['path'], entry['label'], entry['selected'], score_by_path[(pair['pair'], entry['path'])])
             for pair in pairs for entry in pair['rows']]
    selected = [x for x in files if x[2]]
    unselected = [x for x in files if not x[2]]
    top_hits = 0
    top_slots = 0
    top_any = 0
    for pair in pairs:
        candidates = [entry for entry in pair['rows'] if not entry['selected']]
        candidates.sort(key=lambda entry: (-score_by_path[(pair['pair'], entry['path'])], entry['path']))
        picked = candidates[:3]
        top_hits += sum(item['label'] for item in picked)
        top_slots += len(picked)
        top_any += bool(sum(item['label'] for item in picked))
    return {'files': len(files), 'gold_files': sum(x[1] for x in files),
            'roc_auc_all_delivered': auc([x[3] for x in files], [x[1] for x in files]),
            'selected_files': len(selected), 'selected_gold': sum(x[1] for x in selected),
            'roc_auc_selected_only': auc([x[3] for x in selected], [x[1] for x in selected]),
            'unselected_files': len(unselected), 'unselected_gold': sum(x[1] for x in unselected),
            'roc_auc_unselected_only': auc([x[3] for x in unselected], [x[1] for x in unselected]),
            'unselected_top3_gold_hits': top_hits, 'unselected_top3_slots': top_slots,
            'pairs_with_unselected_top3_gold': top_any}


def sigmoid(value):
    return 1 / (1 + np.exp(-np.clip(value, -40, 40)))


def train(x, y):
    mean = x.mean(axis=0)
    std = x.std(axis=0)
    std = np.where(std > 1e-8, std, 1.0)
    scaled = np.clip((x - mean) / std, -10, 10)
    design = np.column_stack((np.ones(len(scaled)), scaled))
    positives = int(y.sum())
    negatives = len(y) - positives
    need(positives > 0 and negatives > 0, 'train-classes')
    sample_weight = np.where(y == 1, len(y) / (2 * positives), len(y) / (2 * negatives))
    weights = np.zeros(design.shape[1], dtype=float)
    for _ in range(ITERATIONS):
        probability = sigmoid(design @ weights)
        gradient = design.T @ ((probability - y) * sample_weight) / len(y)
        gradient[1:] += L2 * weights[1:]
        weights -= LEARNING_RATE * gradient
    need(np.isfinite(weights).all(), 'weights-nonfinite')
    return mean, std, weights


def main():
    need(sha(FEATURE) == FEATURE_SHA and sha(UPSTREAM / 'data/full.parquet') == PARQUET_SHA,
         'frozen-input-drift')
    feature = read(FEATURE)
    need(feature['packet_seal_sha256'] == PACKET_SEAL_SHA and len(feature['pairs']) == 32,
         'feature-seal')
    names = feature['feature_names']
    need(len(names) == 19 and len(set(names)) == 19, 'feature-names')
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader
    loader = GoldLoader(str(UPSTREAM / 'data/full.parquet'))
    cohorts = {'r2': [], 'r3': []}
    for pair in feature['pairs']:
        gold = set(loader.get(pair['instance_id']).files())
        rows = []
        for row in pair['rows']:
            need(set(row['features']) == set(names) and
                 all(math.isfinite(row['features'][name]) for name in names), 'feature-shape')
            rows.append({'path': row['path'], 'features': row['features'],
                         'label': int(row['path'] in gold),
                         'selected': bool(row['features']['original_selected'])})
        need(len(rows) == len({row['path'] for row in rows}), 'duplicate-path')
        cohorts[pair['cohort']].append({'pair': pair['pair'], 'rows': rows})
    need(len(cohorts['r2']) == 23 and len(cohorts['r3']) == 9, 'cohort-denominators')
    training = [r for pair in cohorts['r2'] for r in pair['rows']]
    x = np.asarray([[r['features'][name] for name in names] for r in training], dtype=float)
    y = np.asarray([r['label'] for r in training], dtype=float)
    mean, std, weights = train(x, y)
    results = {}
    for cohort, pairs in cohorts.items():
        score_by_path = {}
        lexical_by_path = {}
        for pair in pairs:
            for row in pair['rows']:
                vector = np.asarray([row['features'][name] for name in names], dtype=float)
                scaled = np.clip((vector - mean) / std, -10, 10)
                score_by_path[(pair['pair'], row['path'])] = float(sigmoid(
                    weights @ np.concatenate(([1.0], scaled))))
                lexical_by_path[(pair['pair'], row['path'])] = row['features']['issue_snippet_overlap_max']
        results[cohort] = {'fitted_model': metrics(pairs, score_by_path),
                           'lexical_baseline': metrics(pairs, lexical_by_path)}
    payload = {'schema_version': 'are.g02-delivered-file-transfer/v1',
               'posture': 'evaluator-only-r2-trained-r3-transfer-no-prediction-mutation',
               'feature_seal_sha256': FEATURE_SHA, 'gold_parquet_sha256': PARQUET_SHA,
               'script_sha256': sha(__file__), 'feature_names': names,
               'model': {'family': 'class-balanced-L2-logistic-full-batch-gradient',
                         'train_cohort': 'r2', 'test_cohort': 'r3',
                         'iterations': ITERATIONS, 'learning_rate': LEARNING_RATE, 'l2': L2,
                         'standardization_train_mean': mean.tolist(),
                         'standardization_train_std': std.tolist(),
                         'intercept_and_weights': weights.tolist()},
               'results': results,
               'claim_ceiling': 'Already-exposed transfer diagnostic; no predictions, native scores, fresh holdout or superiority claim.',
               'open_questions': ['Does the model have enough transfer signal to justify a separate source-only selection policy?',
                                  'Would any such policy improve native File-/Span-F1 under paired accounting?']}
    OUTPUT.parent.mkdir(parents=True, exist_ok=False)
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': 'evaluated', 'sha256': sha(OUTPUT), 'results': results}))


if __name__ == '__main__':
    main()
