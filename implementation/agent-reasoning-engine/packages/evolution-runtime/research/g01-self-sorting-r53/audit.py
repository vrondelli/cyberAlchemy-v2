#!/usr/bin/env python3
"""Independent network-free reproduction of r53 Self-Sorting and metrics."""

from __future__ import annotations

import hashlib
import json
import math
import random
from pathlib import Path


ARCHIVE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
ROOT = ARCHIVE / 'self-sorting-r53'
DRAW_COUNT = 100_000
SEED = 53053


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rows(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()]


def rr8(ranking: list[str], gold: set[str]) -> float:
    found = [index for index, path in enumerate(ranking, 1) if path in gold]
    rank = min(found) if found else 0
    return 1 / rank if 1 <= rank <= 8 else 0.0


def interval(values: list[float]) -> list[float]:
    rng = random.Random(SEED)
    size = len(values)
    draws = []
    for _ in range(DRAW_COUNT):
        draws.append(sum(values[rng.randrange(size)] for _ in range(size)) / size)
    draws.sort()
    return [draws[int((DRAW_COUNT - 1) * 0.025)], draws[int((DRAW_COUNT - 1) * 0.975)]]


def close(left: float, right: float) -> bool:
    return abs(left - right) < 1e-12


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
    rrf_values = []
    ss_values = []
    hit1 = hit3 = 0
    predictions = rows(prediction_path)
    assert len(predictions) == 71
    for row in predictions:
        rrf = row['r51_rrf_ranked_files']
        graph = row['graph_ranked_files']
        score = {}
        for list_rank, arm in enumerate(row['ranked_arms'], 1):
            for position, path in enumerate(row['top8_by_arm'][arm], 1):
                score[path] = score.get(path, 0.0) + 1 / math.sqrt(list_rank * position)
        rrf_position = {path: index for index, path in enumerate(rrf)}
        graph_position = {path: index for index, path in enumerate(graph)}
        promoted = sorted(score, key=lambda path: (-score[path], rrf_position[path], graph_position[path], path))
        rebuilt = promoted + [path for path in rrf if path not in score]
        assert rebuilt == row['self_sorting_ranked_files']
        assert len(rebuilt) == len(graph) and set(rebuilt) == set(graph)
        gold = labels[(row['cohort'], row['ordinal'], row['id'])]
        rrf_value = rr8(rrf, gold)
        ss_value = rr8(rebuilt, gold)
        rrf_values.append(rrf_value)
        ss_values.append(ss_value)
        hit1 += ss_value == 1
        hit3 += ss_value >= 1 / 3
    differences = [left - right for left, right in zip(ss_values, rrf_values)]
    rebuilt_interval = interval(differences)
    reported = expected['paired']['self_sorting_vs_r51_rrf']
    assert close(sum(ss_values) / 71, expected['overall']['self_sorting']['mrr_at_8'])
    assert hit1 == expected['overall']['self_sorting']['hit_at_1']
    assert hit3 == expected['overall']['self_sorting']['hit_at_3']
    assert close(sum(differences) / 71, reported['delta_mrr_at_8'])
    assert all(close(left, right) for left, right in zip(rebuilt_interval, reported['paired_bootstrap_95_interval']))
    audit = {
        'schema_version': 'are.g01-self-sorting-r53-evaluation-audit/v1',
        'audit_passed': True, 'network_calls': 0, 'model_calls': 0, 'cases': 71,
        'strict_valid_responses': seal['strict_valid_responses'],
        'independently_rebuilt': ['Self-Sorting lambda=0.5 rankings', 'MRR@8', 'Hit@1', 'Hit@3', 'paired bootstrap interval'],
        'self_sorting_mrr_at_8': sum(ss_values) / 71,
        'r51_rrf_mrr_at_8': sum(rrf_values) / 71,
        'delta_mrr_at_8': sum(differences) / 71,
        'paired_bootstrap_95_interval': rebuilt_interval,
        'advancement_gate_passed': expected['advancement_gate_passed'],
        'failed_gate_checks': [name for name, passed in expected['gate_checks'].items() if not passed],
        'input_sha256': {'predictions': sha(prediction_path), 'prediction_seal': sha(seal_path), 'evaluation': sha(evaluation_path)},
    }
    (ROOT / 'evaluation/EVALUATION-AUDIT.json').write_text(json.dumps(audit, sort_keys=True, indent=2) + '\n')
    print(json.dumps(audit, sort_keys=True))


if __name__ == '__main__':
    main()
