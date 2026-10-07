#!/usr/bin/env python3
"""Evaluator-only scoring of sealed r51 predictions."""

from __future__ import annotations

import hashlib
import json
import random
import statistics
from collections import defaultdict
from pathlib import Path


ARCHIVE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
ROOT = ARCHIVE / 'order-robust-r51'
PREDICTIONS = ROOT / 'predictions/PREDICTIONS.jsonl'
SEAL = ROOT / 'predictions/PREDICTION-SEAL.json'
OUTPUT = ROOT / 'evaluation'
BOOTSTRAPS = 100_000
SEED = 51051
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
    return {
        'first_gold_rank': first,
        'rr_at_8': 1 / first if first is not None and first <= 8 else 0.0,
        'hit_at_1': first == 1,
        'hit_at_3': first is not None and first <= 3,
        'reach_at_30': first is not None and first <= 30,
    }


def aggregate(rows: list[dict], arm: str) -> dict:
    values = [row[arm] for row in rows if row[arm] is not None]
    return {
        'cases': len(values),
        'mrr_at_8': statistics.mean(value['rr_at_8'] for value in values) if values else None,
        'hit_at_1': sum(value['hit_at_1'] for value in values),
        'hit_at_3': sum(value['hit_at_3'] for value in values),
        'reach_at_30': sum(value['reach_at_30'] for value in values),
    }


def interval(differences: list[float]) -> list[float]:
    rng = random.Random(SEED)
    n = len(differences)
    draws = sorted(sum(differences[rng.randrange(n)] for _ in range(n)) / n for _ in range(BOOTSTRAPS))
    return [draws[int((BOOTSTRAPS - 1) * 0.025)], draws[int((BOOTSTRAPS - 1) * 0.975)]]


def comparison(rows: list[dict], left: str, right: str) -> dict:
    complete = [row for row in rows if row[left] is not None and row[right] is not None]
    differences = [row[left]['rr_at_8'] - row[right]['rr_at_8'] for row in complete]
    return {
        'cases': len(complete),
        'delta_mrr_at_8': statistics.mean(differences) if differences else None,
        'paired_bootstrap_95_interval': interval(differences) if differences else None,
        'wins_ties_losses': [sum(value > 0 for value in differences), sum(value == 0 for value in differences), sum(value < 0 for value in differences)],
    }


def main() -> None:
    seal = json.loads(SEAL.read_text())
    if seal['predictions_sha256'] != sha(PREDICTIONS.read_bytes()) or seal['gold_opened'] is not False:
        raise SystemExit('r51.prediction-seal')
    labels = {}
    label_hashes = {}
    for cohort, path in LABELS.items():
        doc = json.loads(path.read_text())
        label_hashes[cohort] = sha(path.read_bytes())
        for row in doc['rows']:
            labels[(cohort, row['ordinal'], row['id'])] = set(row['gold_paths'])
    scored = []
    for prediction in jsonl(PREDICTIONS):
        key = (prediction['cohort'], prediction['ordinal'], prediction['id'])
        gold = labels[key]
        scored.append({
            'cohort': prediction['cohort'], 'ordinal': prediction['ordinal'], 'id': prediction['id'],
            'repo': prediction['repo'], 'language': prediction['language'], 'gold_paths': sorted(gold),
            'strict_valid': prediction['strict_valid'], 'diagnostic_complete': prediction['diagnostic_complete'],
            'graph': score(prediction['graph_ranked_files'], gold),
            'historical_raw': score(prediction['historical_raw_ranked_files'], gold),
            'reverse': score(prediction['reverse_ranked_files'], gold) if prediction['reverse_ranked_files'] else None,
            'rotate_half': score(prediction['rotate_half_ranked_files'], gold) if prediction['rotate_half_ranked_files'] else None,
            'rrf': score(prediction['rrf_ranked_files'], gold) if prediction['rrf_ranked_files'] else None,
        })
    arms = ['graph', 'historical_raw', 'reverse', 'rotate_half', 'rrf']
    overall = {arm: aggregate(scored, arm) for arm in arms}
    cohorts = {cohort: {arm: aggregate([row for row in scored if row['cohort'] == cohort], arm) for arm in arms}
               for cohort in LABELS}
    versus_graph = comparison(scored, 'rrf', 'graph')
    versus_raw = comparison(scored, 'rrf', 'historical_raw')
    strict_generation = seal['strict_valid_responses'] == 142
    complete = overall['rrf']['cases'] == 71
    checks = {
        'all_142_generations_strict_valid': strict_generation,
        'all_71_cases_diagnostically_complete': complete,
        'rrf_mrr_at_least_graph_plus_0_03': complete and versus_graph['delta_mrr_at_8'] >= 0.03,
        'rrf_vs_graph_bootstrap_lower_above_zero': complete and versus_graph['paired_bootstrap_95_interval'][0] > 0,
        'rrf_hit3_at_least_graph': complete and overall['rrf']['hit_at_3'] >= overall['graph']['hit_at_3'],
        'rrf_mrr_at_least_historical_raw_plus_0_02': complete and versus_raw['delta_mrr_at_8'] >= 0.02,
        'rrf_hit3_at_least_historical_raw': complete and overall['rrf']['hit_at_3'] >= overall['historical_raw']['hit_at_3'],
        'rrf_beats_graph_mrr_in_at_least_two_cohorts': complete and sum(cohorts[c]['rrf']['mrr_at_8'] > cohorts[c]['graph']['mrr_at_8'] for c in cohorts) >= 2,
        'no_cohort_rrf_graph_mrr_loss_over_0_01': complete and all(cohorts[c]['rrf']['mrr_at_8'] >= cohorts[c]['graph']['mrr_at_8'] - 0.01 for c in cohorts),
    }
    result = {
        'schema_version': 'are.g01-order-robust-r51-evaluation/v1',
        'exposure': 'all-71-cases-previously-exposed',
        'interpretation': 'path-normalized rankings are diagnostic; the frozen strict validity gate remains failed if any response used paths instead of IDs',
        'cases': len(scored),
        'label_input_sha256': label_hashes,
        'prediction_seal_sha256': sha(SEAL.read_bytes()),
        'overall': overall,
        'by_cohort': cohorts,
        'paired': {'rrf_vs_graph': versus_graph, 'rrf_vs_historical_raw': versus_raw},
        'bootstrap': {'repetitions': BOOTSTRAPS, 'seed': SEED},
        'gate_checks': checks,
        'advancement_gate_passed': all(checks.values()),
        'superiority_claim_supported': False,
        'claim_ceiling': 'exposed diagnostic mechanism evidence only',
        'rows': scored,
    }
    OUTPUT.mkdir(mode=0o700, exist_ok=False)
    (OUTPUT / 'EVALUATION.json').write_text(json.dumps(result, sort_keys=True, indent=2) + '\n')
    print(json.dumps({
        'overall': overall,
        'paired': result['paired'],
        'gate_checks': checks,
        'advancement_gate_passed': result['advancement_gate_passed'],
    }, sort_keys=True))


if __name__ == '__main__':
    main()
