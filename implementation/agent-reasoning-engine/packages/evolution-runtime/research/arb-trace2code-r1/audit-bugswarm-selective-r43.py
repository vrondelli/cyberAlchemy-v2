#!/usr/bin/env python3
"""Independent recomputation of the r43 evaluator result and gate."""
from __future__ import annotations

import hashlib
import json
import math
import os
import random
from pathlib import Path

BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/selective-r28')
EVALUATION = BASE / 'entity-r43/evaluation/EVALUATION.json'
PREDICTIONS = BASE / 'entity-r43/predictions/PREDICTIONS.jsonl'
SEAL = BASE / 'entity-r43/predictions/PREDICTION-SEAL.json'
CENSUS = BASE / 'evaluator-census-r41/CENSUS-RESULT.json'
GRAPH = BASE / 'rankings-r38/graph'
AUDIT = BASE / 'entity-r43/evaluation/EVALUATION-AUDIT.json'
PINS = {
    'evaluation': (EVALUATION, '17789eddcbff33636bc3e751898fbf0198c44d066a25e2027b5ef2d09e82cd49'),
    'predictions': (PREDICTIONS, '2b4a482362f471964ea63ee56de7f1162c7dc804fcff092bfa3a0577f7bff93b'),
    'prediction_seal': (SEAL, '12311365b7ad247e27d855d4701b8aedb0880219a607564a1ffafafabfe5d448'),
    'census': (CENSUS, '88f011f1c532609e633e0f6a023c23c8894068babd4655436c64e38c200bf78e'),
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def first(paths: list[str], gold: set[str]) -> int | None:
    return next((index for index, path in enumerate(paths, 1) if path in gold), None)


def rr(rank: int | None) -> float:
    return 1 / rank if rank is not None and rank <= 8 else 0.0


def interval(values: list[float]) -> list[float]:
    rng = random.Random(430043)
    count = len(values)
    draws = sorted(sum(values[rng.randrange(count)] for _ in range(count)) / count
                   for _ in range(200_000))
    return [draws[math.floor(.025 * 200_000)], draws[math.ceil(.975 * 200_000) - 1]]


def close(left: float, right: float) -> bool:
    return abs(left - right) < 1e-15


def main() -> None:
    assert not AUDIT.exists()
    assert all(sha(path.read_bytes()) == digest for path, digest in PINS.values())
    expected = json.loads(EVALUATION.read_bytes())
    predictions = [json.loads(line) for line in PREDICTIONS.read_text().splitlines()]
    labels = {item['ordinal']: item for item in json.loads(CENSUS.read_bytes())['combined_results']}
    seal = json.loads(SEAL.read_bytes())
    assert len(predictions) == seal['valid'] == seal['top_n_set_preserved'] == 23
    differences = []
    graph_rr = []
    treatment_rr = []
    graph_hit1 = graph_hit3 = treatment_hit1 = treatment_hit3 = 0
    reach_graph = reach_treatment = 0
    for prediction in predictions:
        ordinal = prediction['ordinal']
        graph = json.loads((GRAPH / f'GRAPH-RANKING-{ordinal:02d}.json').read_bytes())
        gold = set(labels[ordinal]['source_gold_paths'])
        graph_rank = first(graph['ranked_files'], gold)
        treatment_rank = first(prediction['ranked_files'], gold)
        graph_rr.append(rr(graph_rank)); treatment_rr.append(rr(treatment_rank))
        differences.append(rr(treatment_rank) - rr(graph_rank))
        graph_hit1 += graph_rank == 1; treatment_hit1 += treatment_rank == 1
        graph_hit3 += graph_rank is not None and graph_rank <= 3
        treatment_hit3 += treatment_rank is not None and treatment_rank <= 3
        reach_graph += graph_rank is not None and graph_rank <= 30
        reach_treatment += treatment_rank is not None and treatment_rank <= 30
        n = prediction['preserved_top_n']
        assert set(prediction['ranked_files'][:n]) == set(graph['ranked_files'][:n])
    rebuilt = {
        'graph_mrr_at_8': sum(graph_rr) / 23,
        'treatment_mrr_at_8': sum(treatment_rr) / 23,
        'mean_difference': sum(differences) / 23,
        'interval': interval(differences),
        'wins': sum(value > 0 for value in differences),
        'ties': sum(value == 0 for value in differences),
        'losses': sum(value < 0 for value in differences),
        'graph_hit1': graph_hit1, 'treatment_hit1': treatment_hit1,
        'graph_hit3': graph_hit3, 'treatment_hit3': treatment_hit3,
        'graph_reach_at_30': reach_graph, 'treatment_reach_at_30': reach_treatment,
    }
    assert close(rebuilt['graph_mrr_at_8'], expected['overall']['graph']['mrr_at_8'])
    assert close(rebuilt['treatment_mrr_at_8'], expected['overall']['treatment']['mrr_at_8'])
    assert close(rebuilt['mean_difference'], expected['paired']['mean_rr_at_8_difference'])
    assert all(close(left, right) for left, right in zip(rebuilt['interval'], expected['paired']['paired_bootstrap_95_interval']))
    assert [rebuilt['wins'], rebuilt['ties'], rebuilt['losses']] == [expected['paired']['wins'], expected['paired']['ties'], expected['paired']['losses']]
    assert [graph_hit1, treatment_hit1, graph_hit3, treatment_hit3, reach_graph, reach_treatment] == [
        expected['overall']['graph']['hit_at_1'], expected['overall']['treatment']['hit_at_1'],
        expected['overall']['graph']['hit_at_3'], expected['overall']['treatment']['hit_at_3'],
        expected['overall']['graph']['reach_at_30'], expected['overall']['treatment']['reach_at_30']]
    audit = {
        'schema_version': 'are.g01-selective-r43-evaluation-audit/v1',
        'audit_passed': True,
        'input_sha256': {name: digest for name, (_, digest) in PINS.items()},
        'script_sha256': sha(Path(__file__).read_bytes()),
        'rebuilt': rebuilt,
        'r43_advancement_gate_passed': False,
        'failed_gate_checks': ['paired-bootstrap-lower-bound-above-zero'],
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
