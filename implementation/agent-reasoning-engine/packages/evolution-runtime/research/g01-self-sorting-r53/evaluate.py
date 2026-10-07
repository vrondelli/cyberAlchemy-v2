#!/usr/bin/env python3
"""Evaluator-only scoring for sealed r53 Self-Sorting predictions."""

from __future__ import annotations

import hashlib
import json
import random
import statistics
from pathlib import Path


ARCHIVE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
ROOT = ARCHIVE / 'self-sorting-r53'
PREDICTIONS = ROOT / 'predictions/PREDICTIONS.jsonl'
SEAL = ROOT / 'predictions/PREDICTION-SEAL.json'
OUTPUT = ROOT / 'evaluation'
BOOTSTRAPS = 100_000
SEED = 53053
LABELS = {
    'r43': ARCHIVE / 'selective-r28/entity-r43/evaluation/EVALUATION.json',
    'r44': ARCHIVE / 'graph-dev-b-r2/code-only/entity-r44/evaluation/EVALUATION.json',
    'r50': ARCHIVE / 'guarded-confirm-r50/evaluation/EVALUATION.json',
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def jsonl(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()]


def score(ranking: list[str], gold: set[str]) -> dict:
    ranks = [index for index, path in enumerate(ranking, 1) if path in gold]
    first = min(ranks) if ranks else None
    return {'first_gold_rank': first,
            'rr_at_8': 1 / first if first is not None and first <= 8 else 0.0,
            'hit_at_1': first == 1,
            'hit_at_3': first is not None and first <= 3,
            'reach_at_30': first is not None and first <= 30}


def aggregate(rows: list[dict], arm: str) -> dict:
    values = [row[arm] for row in rows]
    return {'cases': len(values), 'mrr_at_8': statistics.mean(v['rr_at_8'] for v in values),
            'hit_at_1': sum(v['hit_at_1'] for v in values),
            'hit_at_3': sum(v['hit_at_3'] for v in values),
            'reach_at_30': sum(v['reach_at_30'] for v in values)}


def interval(values: list[float]) -> list[float]:
    rng = random.Random(SEED)
    size = len(values)
    draws = sorted(sum(values[rng.randrange(size)] for _ in range(size)) / size for _ in range(BOOTSTRAPS))
    return [draws[int((BOOTSTRAPS - 1) * 0.025)], draws[int((BOOTSTRAPS - 1) * 0.975)]]


def main() -> None:
    seal = json.loads(SEAL.read_text())
    if seal['predictions_sha256'] != sha(PREDICTIONS.read_bytes()) or seal['gold_opened'] is not False:
        raise SystemExit('r53.prediction-seal')
    labels = {}
    label_hashes = {}
    for cohort, path in LABELS.items():
        label_hashes[cohort] = sha(path.read_bytes())
        for row in json.loads(path.read_text())['rows']:
            labels[(cohort, row['ordinal'], row['id'])] = set(row['gold_paths'])
    rows = []
    for prediction in jsonl(PREDICTIONS):
        gold = labels[(prediction['cohort'], prediction['ordinal'], prediction['id'])]
        rows.append({'cohort': prediction['cohort'], 'ordinal': prediction['ordinal'], 'id': prediction['id'],
                     'repo': prediction['repo'], 'language': prediction['language'], 'gold_paths': sorted(gold),
                     'graph': score(prediction['graph_ranked_files'], gold),
                     'historical_raw': score(prediction['historical_raw_ranked_files'], gold),
                     'r51_rrf': score(prediction['r51_rrf_ranked_files'], gold),
                     'self_sorting': score(prediction['self_sorting_ranked_files'], gold)})
    arms = ['graph', 'historical_raw', 'r51_rrf', 'self_sorting']
    overall = {arm: aggregate(rows, arm) for arm in arms}
    by_cohort = {cohort: {arm: aggregate([row for row in rows if row['cohort'] == cohort], arm) for arm in arms}
                 for cohort in LABELS}
    differences = [row['self_sorting']['rr_at_8'] - row['r51_rrf']['rr_at_8'] for row in rows]
    paired = {'delta_mrr_at_8': statistics.mean(differences),
              'paired_bootstrap_95_interval': interval(differences),
              'wins_ties_losses': [sum(x > 0 for x in differences), sum(x == 0 for x in differences), sum(x < 0 for x in differences)]}
    checks = {
        'all_71_generations_strict_valid': seal['strict_valid_responses'] == 71,
        'all_71_universes_preserved': all(True for _ in rows) and len(rows) == 71,
        'self_sorting_mrr_at_least_rrf_plus_0_01': paired['delta_mrr_at_8'] >= 0.01,
        'self_sorting_vs_rrf_bootstrap_lower_above_zero': paired['paired_bootstrap_95_interval'][0] > 0,
        'self_sorting_hit3_at_least_rrf': overall['self_sorting']['hit_at_3'] >= overall['r51_rrf']['hit_at_3'],
        'self_sorting_beats_rrf_mrr_in_at_least_two_cohorts': sum(by_cohort[c]['self_sorting']['mrr_at_8'] > by_cohort[c]['r51_rrf']['mrr_at_8'] for c in by_cohort) >= 2,
        'no_cohort_self_sorting_rrf_mrr_loss_over_0_01': all(by_cohort[c]['self_sorting']['mrr_at_8'] >= by_cohort[c]['r51_rrf']['mrr_at_8'] - 0.01 for c in by_cohort),
    }
    result = {'schema_version': 'are.g01-self-sorting-r53-evaluation/v1',
              'exposure': 'all-71-cases-previously-exposed', 'cases': len(rows),
              'label_input_sha256': label_hashes, 'prediction_seal_sha256': sha(SEAL.read_bytes()),
              'overall': overall, 'by_cohort': by_cohort, 'paired': {'self_sorting_vs_r51_rrf': paired},
              'bootstrap': {'repetitions': BOOTSTRAPS, 'seed': SEED}, 'gate_checks': checks,
              'advancement_gate_passed': all(checks.values()), 'superiority_claim_supported': False,
              'claim_ceiling': 'exposed development evidence only', 'rows': rows}
    OUTPUT.mkdir(mode=0o700, exist_ok=False)
    (OUTPUT / 'EVALUATION.json').write_text(json.dumps(result, sort_keys=True, indent=2) + '\n')
    print(json.dumps({'overall': overall, 'paired': result['paired'], 'gate_checks': checks,
                      'advancement_gate_passed': result['advancement_gate_passed']}, sort_keys=True))


if __name__ == '__main__':
    main()
