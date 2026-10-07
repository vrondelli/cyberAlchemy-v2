#!/usr/bin/env python3
"""Independent recomputation of r50 confirmation metrics."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import os
from pathlib import Path


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
EVALUATION = BASE / 'guarded-confirm-r50/evaluation/EVALUATION.json'
PREDICTIONS = BASE / 'guarded-confirm-r50/predictions/PREDICTIONS.jsonl'
SEAL = BASE / 'guarded-confirm-r50/predictions/PREDICTION-SEAL.json'
LABELS = BASE / 'guarded-confirm-r49/target-census-r1/RESULT.json'
GRAPHS = BASE / 'guarded-confirm-r50/packets/GRAPH-RANKINGS.jsonl'
HELPER = HERE / 'audit-bugswarm-graph-dev-b-r44.py'
AUDIT = BASE / 'guarded-confirm-r50/evaluation/EVALUATION-AUDIT.json'
PINS = {
    'evaluation': '6c6c054d94cfe5a5691adcddb811f2da4dea19dc223059da482dd843f0eebb7b',
    'predictions': 'a17818c4b78456a64811fe3ee908244404937b590dd79fd7d96c1bd4a0c10098',
    'prediction_seal': '9406bbf8f6c7fccb1c51f8042d1f39ec7fbfa01816efad1e393b9ecfbfe0b178',
    'labels': 'a575284941995a7191c1eb922b33272eafdb9aca2529dafa82bd1d823705ee8b',
    'graphs': '8d4dc7cd94472c27080cdf404410a58145b4789fd1339bbd391ea1ad8ed8e353',
    'helper': '2a701a470c8163aed93fe47931e1a77d9009bb2a39a5f024efba0158c723928c',
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def close(left: float, right: float) -> bool:
    return abs(left - right) < 1e-15


def need(ok: bool, reason: str) -> None:
    if not ok:
        raise SystemExit(reason)


def main() -> None:
    need(not AUDIT.exists(), 'output-exists')
    paths = {'evaluation': EVALUATION, 'predictions': PREDICTIONS,
             'prediction_seal': SEAL, 'labels': LABELS, 'graphs': GRAPHS,
             'helper': HELPER}
    for name, path in paths.items():
        need(sha(path.read_bytes()) == PINS[name], f'input-pin-drift:{name}')
    spec = importlib.util.spec_from_file_location('g01_r50_audit_math', HELPER)
    need(spec is not None and spec.loader is not None, 'helper-unavailable')
    rule = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(rule)
    expected = json.loads(EVALUATION.read_bytes())
    predictions = [json.loads(line) for line in PREDICTIONS.read_text().splitlines()]
    graphs = [json.loads(line) for line in GRAPHS.read_text().splitlines()]
    labels = {row['slot']: row for row in json.loads(LABELS.read_bytes())['results']}
    seal = json.loads(SEAL.read_bytes())
    need(len(predictions) == len(graphs) == len(labels) == seal['valid'] == 24,
         'denominator')
    values = {arm: [] for arm in ('graph', 'raw', 'guarded')}
    hit1 = {arm: 0 for arm in values}
    hit3 = {arm: 0 for arm in values}
    reach = {arm: 0 for arm in values}
    for prediction, graph in zip(predictions, graphs):
        ordinal = prediction['ordinal']
        label = labels[ordinal]
        need(ordinal == graph['ordinal'] and
             prediction['id'] == graph['id'] == label['id'],
             f'identity:{ordinal}')
        gold = set(label['source_gold_paths'])
        rankings = {'graph': graph['ranked_files'],
                    'raw': prediction['raw_ranked_files'],
                    'guarded': prediction['guarded_ranked_files']}
        n = prediction['preserved_top_n']
        need(set(rankings['raw'][:n]) == set(rankings['guarded'][:n]) ==
             set(rankings['graph'][:n]), f'coverage:{ordinal}')
        for arm, ranking in rankings.items():
            rank = rule.first(ranking, gold)
            values[arm].append(rule.rr8(rank))
            hit1[arm] += rank == 1
            hit3[arm] += rank is not None and rank <= 3
            reach[arm] += rank is not None and rank <= 30

    rebuilt = {}
    for arm in values:
        rebuilt[arm] = {
            'mrr_at_8': sum(values[arm]) / 24,
            'hit_at_1': hit1[arm], 'hit_at_3': hit3[arm],
            'reach_at_30': reach[arm],
        }
        reference = expected['overall'][arm]
        need(close(rebuilt[arm]['mrr_at_8'], reference['mrr_at_8']) and
             hit1[arm] == reference['hit_at_1'] and
             hit3[arm] == reference['hit_at_3'] and
             reach[arm] == reference['reach_at_30'], f'aggregate:{arm}')
    comparisons = {}
    for arm in ('raw', 'guarded'):
        differences = [left - right for left, right in zip(values[arm], values['graph'])]
        result = {
            'mean_rr_at_8_difference': sum(differences) / 24,
            'paired_bootstrap_95_interval': rule.interval(differences),
            'wins': sum(value > 0 for value in differences),
            'ties': sum(value == 0 for value in differences),
            'losses': sum(value < 0 for value in differences),
        }
        reference = expected['paired'][arm + '_minus_graph']
        need(close(result['mean_rr_at_8_difference'], reference['mean_rr_at_8_difference']) and
             all(close(a, b) for a, b in zip(result['paired_bootstrap_95_interval'],
                                             reference['paired_bootstrap_95_interval'])) and
             [result['wins'], result['ties'], result['losses']] ==
             [reference['wins'], reference['ties'], reference['losses']],
             f'comparison:{arm}')
        comparisons[arm + '_minus_graph'] = result
    guarded = comparisons['guarded_minus_graph']
    checks = {
        'valid_24_of_24': seal['valid'] == 24,
        'guarded_top_n_sets_preserved_24_of_24': seal['guarded_top_n_set_preserved'] == 24,
        'guarded_mrr_exceeds_graph': rebuilt['guarded']['mrr_at_8'] > rebuilt['graph']['mrr_at_8'],
        'guarded_bootstrap_lower_above_zero': guarded['paired_bootstrap_95_interval'][0] > 0,
        'guarded_hit3_at_least_graph': rebuilt['guarded']['hit_at_3'] >= rebuilt['graph']['hit_at_3'],
    }
    audit = {
        'schema_version': 'are.g01-guarded-confirm-r50-evaluation-audit/v1',
        'audit_passed': True, 'input_sha256': PINS,
        'script_sha256': sha(Path(__file__).read_bytes()),
        'rebuilt': rebuilt, 'comparisons': comparisons, 'gate_checks': checks,
        'quantitative_gate_passed': all(checks.values()),
        'superiority_claim_supported': False,
        'claim_ceiling': 'untouched-python-confirmation; superiority not supported',
        'model_calls': 0, 'network_calls': 0,
    }
    data = (json.dumps(audit, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(AUDIT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({**audit, 'audit_sha256': sha(data)}, sort_keys=True))


if __name__ == '__main__':
    main()
