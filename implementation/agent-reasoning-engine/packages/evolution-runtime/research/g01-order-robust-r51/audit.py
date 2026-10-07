#!/usr/bin/env python3
"""Independent, network-free reproduction of the r51 fusion and score report."""

from __future__ import annotations

import hashlib
import json
import random
from pathlib import Path


ARCHIVE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
ROOT = ARCHIVE / 'order-robust-r51'
DRAW_COUNT = 100_000
SEED = 51051


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_lines(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()]


def close(left: float, right: float) -> bool:
    return abs(left - right) < 1e-12


def reciprocal(ranking: list[str], gold: set[str]) -> float:
    positions = [index for index, path in enumerate(ranking, 1) if path in gold]
    rank = min(positions) if positions else 0
    return 1 / rank if 1 <= rank <= 8 else 0.0


def bootstrap(values: list[float]) -> list[float]:
    generator = random.Random(SEED)
    size = len(values)
    samples = []
    for _ in range(DRAW_COUNT):
        total = 0.0
        for _ in range(size):
            total += values[generator.randrange(size)]
        samples.append(total / size)
    samples.sort()
    return [samples[int((DRAW_COUNT - 1) * 0.025)], samples[int((DRAW_COUNT - 1) * 0.975)]]


def main() -> None:
    prediction_path = ROOT / 'predictions/PREDICTIONS.jsonl'
    seal_path = ROOT / 'predictions/PREDICTION-SEAL.json'
    evaluation_path = ROOT / 'evaluation/EVALUATION.json'
    seal = json.loads(seal_path.read_text())
    expected = json.loads(evaluation_path.read_text())
    assert seal['predictions_sha256'] == sha(prediction_path)
    labels = {}
    for cohort, path in {
        'r43': ARCHIVE / 'selective-r28/entity-r43/evaluation/EVALUATION.json',
        'r44': ARCHIVE / 'graph-dev-b-r2/code-only/entity-r44/evaluation/EVALUATION.json',
        'r50': ARCHIVE / 'guarded-confirm-r50/evaluation/EVALUATION.json',
    }.items():
        for row in json.loads(path.read_text())['rows']:
            labels[(cohort, row['ordinal'], row['id'])] = set(row['gold_paths'])
    rows = load_lines(prediction_path)
    assert len(rows) == 71
    strict_responses = normalized = 0
    rr = {arm: [] for arm in ('graph', 'historical_raw', 'rrf')}
    hit1 = {arm: 0 for arm in rr}
    hit3 = {arm: 0 for arm in rr}
    cohort_rr = {}
    for row in rows:
        graph = row['graph_ranked_files']
        rankings = [graph, row['historical_raw_ranked_files'], row['reverse_ranked_files'], row['rotate_half_ranked_files']]
        assert all(len(ranking) == len(graph) and set(ranking) == set(graph) for ranking in rankings)
        strict_responses += sum(view['strict_valid'] for view in row['views'].values())
        normalized += sum(view['diagnostic_path_normalized'] for view in row['views'].values())
        positions = [{path: index + 1 for index, path in enumerate(ranking)} for ranking in rankings]
        graph_position = {path: index for index, path in enumerate(graph)}
        rebuilt = sorted(graph, key=lambda path: (
            -sum(1 / (60 + position[path]) for position in positions), graph_position[path], path))
        assert rebuilt == row['rrf_ranked_files']
        gold = labels[(row['cohort'], row['ordinal'], row['id'])]
        case_values = {
            'graph': reciprocal(graph, gold),
            'historical_raw': reciprocal(row['historical_raw_ranked_files'], gold),
            'rrf': reciprocal(rebuilt, gold),
        }
        cohort_rr.setdefault(row['cohort'], {arm: [] for arm in rr})
        for arm, value in case_values.items():
            rr[arm].append(value)
            cohort_rr[row['cohort']][arm].append(value)
            hit1[arm] += value == 1
            hit3[arm] += value >= 1 / 3
    assert strict_responses == 135 and normalized == 7
    rebuilt_overall = {}
    for arm in rr:
        rebuilt_overall[arm] = {
            'mrr_at_8': sum(rr[arm]) / len(rr[arm]),
            'hit_at_1': hit1[arm],
            'hit_at_3': hit3[arm],
        }
        for metric, value in rebuilt_overall[arm].items():
            reported = expected['overall'][arm][metric]
            assert value == reported if isinstance(value, int) else close(value, reported)
    differences_graph = [left - right for left, right in zip(rr['rrf'], rr['graph'])]
    differences_raw = [left - right for left, right in zip(rr['rrf'], rr['historical_raw'])]
    graph_interval = bootstrap(differences_graph)
    raw_interval = bootstrap(differences_raw)
    assert all(close(x, y) for x, y in zip(graph_interval, expected['paired']['rrf_vs_graph']['paired_bootstrap_95_interval']))
    assert all(close(x, y) for x, y in zip(raw_interval, expected['paired']['rrf_vs_historical_raw']['paired_bootstrap_95_interval']))
    audit = {
        'schema_version': 'are.g01-order-robust-r51-evaluation-audit/v1',
        'audit_passed': True,
        'network_calls': 0,
        'model_calls': 0,
        'cases': len(rows),
        'strict_valid_responses': strict_responses,
        'diagnostically_normalized_responses': normalized,
        'independently_rebuilt': ['RRF(k=60) rankings', 'MRR@8', 'Hit@1', 'Hit@3', 'paired bootstrap intervals'],
        'bootstrap': {'repetitions': DRAW_COUNT, 'seed': SEED},
        'rebuilt_overall': rebuilt_overall,
        'rrf_vs_graph_interval': graph_interval,
        'rrf_vs_historical_raw_interval': raw_interval,
        'advancement_gate_passed': expected['advancement_gate_passed'],
        'failed_gate_checks': [name for name, passed in expected['gate_checks'].items() if not passed],
        'input_sha256': {
            'predictions': sha(prediction_path),
            'prediction_seal': sha(seal_path),
            'evaluation': sha(evaluation_path),
        },
    }
    output = ROOT / 'evaluation/EVALUATION-AUDIT.json'
    output.write_text(json.dumps(audit, sort_keys=True, indent=2) + '\n')
    print(json.dumps(audit, sort_keys=True))


if __name__ == '__main__':
    main()
