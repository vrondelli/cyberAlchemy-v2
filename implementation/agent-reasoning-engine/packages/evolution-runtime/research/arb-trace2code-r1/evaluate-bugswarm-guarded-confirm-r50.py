#!/usr/bin/env python3
"""Evaluator-only scoring for sealed untouched r50 predictions."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import os
from pathlib import Path


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
PREDICTIONS = BASE / 'guarded-confirm-r50/predictions/PREDICTIONS.jsonl'
PREDICTION_SEAL = BASE / 'guarded-confirm-r50/predictions/PREDICTION-SEAL.json'
LABELS = BASE / 'guarded-confirm-r49/target-census-r1/RESULT.json'
GRAPH_RANKINGS = BASE / 'guarded-confirm-r50/packets/GRAPH-RANKINGS.jsonl'
PROTOCOL = HERE.parents[1] / 'evidence/G01-BUGSWARM-GUARDED-CONFIRM-R50-TREATMENT-CONSTRUCTION-PROTOCOL-2026-10-04.md'
HELPER = HERE / 'evaluate-bugswarm-graph-dev-b-r44.py'
OUTPUT = BASE / 'guarded-confirm-r50/evaluation'
PINS = {
    'predictions': 'a17818c4b78456a64811fe3ee908244404937b590dd79fd7d96c1bd4a0c10098',
    'prediction_seal': '9406bbf8f6c7fccb1c51f8042d1f39ec7fbfa01816efad1e393b9ecfbfe0b178',
    'labels': 'a575284941995a7191c1eb922b33272eafdb9aca2529dafa82bd1d823705ee8b',
    'graph_rankings': '8d4dc7cd94472c27080cdf404410a58145b4789fd1339bbd391ea1ad8ed8e353',
    'protocol': 'c584551195ce9c7614675bcdfb4b5d454480c760808c715e7b7a19a8e350d052',
    'helper': '8b3f0d92df8c9ed7540145e91f2f933b9a1f2121383cdedd8e100d44b83bf2ba',
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(ok: bool, reason: str) -> None:
    if not ok:
        raise SystemExit(reason)


def main() -> None:
    need(not OUTPUT.exists(), 'output-exists')
    paths = {'predictions': PREDICTIONS, 'prediction_seal': PREDICTION_SEAL,
             'labels': LABELS, 'graph_rankings': GRAPH_RANKINGS,
             'protocol': PROTOCOL, 'helper': HELPER}
    for name, path in paths.items():
        need(sha(path.read_bytes()) == PINS[name], f'input-pin-drift:{name}')
    spec = importlib.util.spec_from_file_location('g01_r50_eval_math', HELPER)
    need(spec is not None and spec.loader is not None, 'helper-unavailable')
    math_rule = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(math_rule)
    predictions = [json.loads(line) for line in PREDICTIONS.read_text().splitlines()]
    labels_document = json.loads(LABELS.read_bytes())
    labels = {row['slot']: row for row in labels_document['results']}
    graphs = [json.loads(line) for line in GRAPH_RANKINGS.read_text().splitlines()]
    seal = json.loads(PREDICTION_SEAL.read_bytes())
    need(len(predictions) == len(labels) == len(graphs) == seal['cases'] ==
         seal['valid'] == 24 and labels_document['all_24_admissible'] is True and
         labels_document['gold_export_to_vps'] is False and
         seal['raw_top_n_set_preserved'] == seal['guarded_top_n_set_preserved'] == 24 and
         seal['gold_opened'] is False, 'denominator')

    rows = []
    for prediction, graph in zip(predictions, graphs):
        ordinal = prediction['ordinal']
        label = labels[ordinal]
        need(prediction['valid'] is True and label['gold_admissible'] is True and
             prediction['id'] == label['id'] == graph['id'] and
             prediction['repo'] == label['repo'] == graph['repo'] and
             prediction['language'] == graph['language'] == 'Python' and
             prediction['raw_top_n_set_preserved'] is True and
             prediction['guarded_top_n_set_preserved'] is True,
             f'identity:{ordinal}')
        gold = set(label['source_gold_paths'])
        need(bool(gold), f'gold-empty:{ordinal}')
        graph_metric = math_rule.metric(graph['ranked_files'], gold)
        raw_metric = math_rule.metric(prediction['raw_ranked_files'], gold)
        guarded_metric = math_rule.metric(prediction['guarded_ranked_files'], gold)
        rows.append({
            'ordinal': ordinal, 'id': prediction['id'], 'repo': prediction['repo'],
            'language': 'Python', 'gold_paths': sorted(gold),
            'graph': graph_metric, 'raw': raw_metric, 'guarded': guarded_metric,
            'raw_minus_graph_rr_at_8': raw_metric['rr_at_8'] - graph_metric['rr_at_8'],
            'guarded_minus_graph_rr_at_8': guarded_metric['rr_at_8'] - graph_metric['rr_at_8'],
            'raw_top_n_set_preserved': True, 'guarded_top_n_set_preserved': True,
        })
    need([row['ordinal'] for row in rows] == list(range(1, 25)), 'ordinal-accounting')
    overall = {arm: math_rule.aggregate(rows, arm) for arm in ('graph', 'raw', 'guarded')}
    paired = {arm + '_minus_graph': math_rule.comparison(rows, arm)
              for arm in ('raw', 'guarded')}
    guarded_pair = paired['guarded_minus_graph']
    checks = {
        'valid_24_of_24': seal['valid'] == 24,
        'guarded_top_n_sets_preserved_24_of_24': seal['guarded_top_n_set_preserved'] == 24,
        'guarded_mrr_exceeds_graph': overall['guarded']['mrr_at_8'] > overall['graph']['mrr_at_8'],
        'guarded_bootstrap_lower_above_zero': guarded_pair['paired_bootstrap_95_interval'][0] > 0,
        'guarded_hit3_at_least_graph': overall['guarded']['hit_at_3'] >= overall['graph']['hit_at_3'],
    }
    result = {
        'schema_version': 'are.g01-guarded-confirm-r50-evaluation/v1',
        'claim_ceiling': 'untouched-python-confirmation-pending-independent-audit',
        'input_sha256': PINS, 'cases': 24,
        'label_provenance': 'private r49 complete GitHub comparisons over exact failed-source indices',
        'overall': overall, 'paired': paired,
        'by_language': {'Python': overall},
        'gate_checks_before_independent_audit': checks,
        'quantitative_gate_passed_before_audit': all(checks.values()),
        'known_prompt_tokens': seal['known_prompt_tokens'],
        'known_completion_tokens': seal['known_completion_tokens'],
        'summed_generation_elapsed_ms': seal['summed_generation_elapsed_ms'],
        'rows': rows, 'model_calls': 24, 'fresh_confirmation': True,
        'superiority_claim_supported': False,
    }
    OUTPUT.mkdir(parents=True, mode=0o700)
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT / 'EVALUATION.json', os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'overall': overall, 'paired': paired,
                      'quantitative_gate_passed_before_audit': all(checks.values()),
                      'evaluation_sha256': sha(data)}, sort_keys=True, indent=2))


if __name__ == '__main__':
    main()
