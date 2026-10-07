#!/usr/bin/env python3
"""Independent recomputation of cohort-B r44 scores and frozen gate."""
from __future__ import annotations

import hashlib
import json
import math
import os
import random
from pathlib import Path

BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-dev-b-r2')
EVALUATION = BASE / 'code-only/entity-r44/evaluation/EVALUATION.json'
PREDICTIONS = BASE / 'code-only/entity-r44/predictions/PREDICTIONS.jsonl'
SEAL = BASE / 'code-only/entity-r44/predictions/PREDICTION-SEAL.json'
LABELS = BASE / 'evaluator-only/DEV-GOLD-AUDIT-B-R3.json'
GRAPH_RANKINGS = BASE / 'code-only/graph-r2/GRAPH-RANKINGS-B-R3.jsonl'
AUDIT = BASE / 'code-only/entity-r44/evaluation/EVALUATION-AUDIT.json'
PINS = {
    'evaluation': (EVALUATION, '04f7af64488a0c9c69c2dfa75df7de0016657124d0d18b74edf1a510d174838a'),
    'predictions': (PREDICTIONS, 'c677e16548ad197272bbdb52284e1b3887b994b11d2091e56de96a5bf057b782'),
    'prediction_seal': (SEAL, 'ef424c31901ed8c316cb59225bdbd5fee85fefb22b26036abb844821b692cd2e'),
    'labels': (LABELS, 'ac3ef81c36088dc305508c940df9a86d583c8601ba41874c1369197a14ec376e'),
    'graph_rankings': (GRAPH_RANKINGS, '86b39c47e9ce166d4db66068d5894f3e9cbac1275b11d549df1e17ee121cb32d'),
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def first(paths: list[str], gold: set[str]) -> int | None:
    return next((index for index, path in enumerate(paths, 1) if path in gold), None)


def rr8(rank: int | None) -> float:
    return 1 / rank if rank is not None and rank <= 8 else 0.0


def interval(values: list[float]) -> list[float]:
    rng = random.Random(440044)
    count = len(values)
    draws = sorted(
        sum(values[rng.randrange(count)] for _ in range(count)) / count
        for _ in range(200_000)
    )
    return [draws[math.floor(.025 * 200_000)], draws[math.ceil(.975 * 200_000) - 1]]


def close(left: float, right: float) -> bool:
    return abs(left - right) < 1e-15


def main() -> None:
    assert not AUDIT.exists()
    assert all(sha(path.read_bytes()) == digest for path, digest in PINS.values())
    expected = json.loads(EVALUATION.read_bytes())
    predictions = [json.loads(line) for line in PREDICTIONS.read_text().splitlines()]
    graphs = [json.loads(line) for line in GRAPH_RANKINGS.read_text().splitlines()]
    labels = {item['ordinal']: item for item in json.loads(LABELS.read_bytes())['results']}
    seal = json.loads(SEAL.read_bytes())
    assert len(predictions) == len(graphs) == len(labels) == seal['valid'] == 24
    values = {arm: [] for arm in ('graph', 'raw', 'guarded')}
    hit1 = {arm: 0 for arm in values}
    hit3 = {arm: 0 for arm in values}
    reach = {arm: 0 for arm in values}
    for prediction, graph in zip(predictions, graphs):
        ordinal = prediction['ordinal']
        assert ordinal == graph['ordinal'] and prediction['id'] == graph['id'] == labels[ordinal]['image_tag']
        gold = {item['path'] for item in labels[ordinal]['source_gold_paths']}
        rankings = {
            'graph': graph['ranked_files'],
            'raw': prediction['raw_ranked_files'],
            'guarded': prediction['guarded_ranked_files'],
        }
        n = prediction['preserved_top_n']
        assert set(rankings['raw'][:n]) == set(rankings['guarded'][:n]) == set(rankings['graph'][:n])
        for arm, ranking in rankings.items():
            rank = first(ranking, gold)
            values[arm].append(rr8(rank))
            hit1[arm] += rank == 1
            hit3[arm] += rank is not None and rank <= 3
            reach[arm] += rank is not None and rank <= 30
    rebuilt = {}
    for arm in values:
        rebuilt[arm] = {
            'mrr_at_8': sum(values[arm]) / 24,
            'hit_at_1': hit1[arm],
            'hit_at_3': hit3[arm],
            'reach_at_30': reach[arm],
        }
        assert close(rebuilt[arm]['mrr_at_8'], expected['overall'][arm]['mrr_at_8'])
        assert hit1[arm] == expected['overall'][arm]['hit_at_1']
        assert hit3[arm] == expected['overall'][arm]['hit_at_3']
        assert reach[arm] == expected['overall'][arm]['reach_at_30']
    comparisons = {}
    for arm in ('raw', 'guarded'):
        differences = [left - right for left, right in zip(values[arm], values['graph'])]
        result = {
            'mean_rr_at_8_difference': sum(differences) / 24,
            'paired_bootstrap_95_interval': interval(differences),
            'wins': sum(value > 0 for value in differences),
            'ties': sum(value == 0 for value in differences),
            'losses': sum(value < 0 for value in differences),
        }
        reference = expected['paired'][arm + '_minus_graph']
        assert close(result['mean_rr_at_8_difference'], reference['mean_rr_at_8_difference'])
        assert all(close(left, right) for left, right in zip(result['paired_bootstrap_95_interval'], reference['paired_bootstrap_95_interval']))
        assert [result['wins'], result['ties'], result['losses']] == [reference['wins'], reference['ties'], reference['losses']]
        comparisons[arm + '_minus_graph'] = result
    guarded = comparisons['guarded_minus_graph']
    gate_checks = {
        'valid_24_of_24': seal['valid'] == 24,
        'guarded_top_n_sets_preserved_24_of_24': seal['guarded_top_n_set_preserved'] == 24,
        'guarded_mrr_exceeds_graph': rebuilt['guarded']['mrr_at_8'] > rebuilt['graph']['mrr_at_8'],
        'guarded_bootstrap_lower_above_zero': guarded['paired_bootstrap_95_interval'][0] > 0,
        'guarded_hit3_at_least_graph': rebuilt['guarded']['hit_at_3'] >= rebuilt['graph']['hit_at_3'],
    }
    assert all(gate_checks.values())
    audit = {
        'schema_version': 'are.g01-graph-dev-b-r44-evaluation-audit/v1',
        'audit_passed': True,
        'input_sha256': {name: digest for name, (_, digest) in PINS.items()},
        'script_sha256': sha(Path(__file__).read_bytes()),
        'rebuilt': rebuilt,
        'comparisons': comparisons,
        'gate_checks': gate_checks,
        'r44_advancement_gate_passed': True,
        'claim_ceiling': 'cross-development-transfer-only',
        'model_calls': 0,
        'network_calls': 0,
    }
    data = (json.dumps(audit, sort_keys=True, indent=2) + '\n').encode()
    descriptor = os.open(AUDIT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'wb') as handle:
        handle.write(data)
    print(json.dumps({**audit, 'audit_sha256': sha(data)}, sort_keys=True))


if __name__ == '__main__':
    main()
