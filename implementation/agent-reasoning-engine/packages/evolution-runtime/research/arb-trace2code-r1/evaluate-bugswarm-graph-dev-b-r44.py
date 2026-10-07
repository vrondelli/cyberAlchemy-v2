#!/usr/bin/env python3
"""Evaluator-only scoring for sealed cohort-B r44 entity predictions."""
from __future__ import annotations

import hashlib
import json
import math
import os
import random
from pathlib import Path

BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-dev-b-r2')
PREDICTIONS = BASE / 'code-only/entity-r44/predictions/PREDICTIONS.jsonl'
PREDICTION_SEAL = BASE / 'code-only/entity-r44/predictions/PREDICTION-SEAL.json'
LABELS = BASE / 'evaluator-only/DEV-GOLD-AUDIT-B-R3.json'
GRAPH_EVALUATION = BASE / 'evaluator-only/GRAPH-EVALUATION-B-R3.json'
GRAPH_RANKINGS = BASE / 'code-only/graph-r2/GRAPH-RANKINGS-B-R3.jsonl'
OUTPUT = BASE / 'code-only/entity-r44/evaluation'
PROTOCOL = Path(__file__).resolve().parents[2] / 'evidence/G01-BUGSWARM-GRAPH-DEV-B-R44-GUARDED-ENTITY-TRANSFER-PROTOCOL-2026-10-04.md'
PINS = {
    'predictions': (PREDICTIONS, 'c677e16548ad197272bbdb52284e1b3887b994b11d2091e56de96a5bf057b782'),
    'prediction_seal': (PREDICTION_SEAL, 'ef424c31901ed8c316cb59225bdbd5fee85fefb22b26036abb844821b692cd2e'),
    'labels': (LABELS, 'ac3ef81c36088dc305508c940df9a86d583c8601ba41874c1369197a14ec376e'),
    'graph_evaluation': (GRAPH_EVALUATION, '82b8ce048c7d77d09ea1bfc04bab11e3c68e7d7f12e84cfd2e199c4c43b86fd8'),
    'graph_rankings': (GRAPH_RANKINGS, '86b39c47e9ce166d4db66068d5894f3e9cbac1275b11d549df1e17ee121cb32d'),
    'protocol': (PROTOCOL, '8009f24043f2e8190ad9af707c0b17a81237b15d6e0e962509f1a63d1372c958'),
}
SAMPLES = 200_000
SEED = 440044


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(condition: bool, reason: str) -> None:
    if not condition:
        raise SystemExit(reason)


def write_new(path: Path, data: bytes) -> None:
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'wb') as handle:
        handle.write(data)


def metric(ranking: list[str], gold: set[str]) -> dict:
    rank = next((index for index, path in enumerate(ranking, 1) if path in gold), None)
    return {
        'first_gold_rank': rank,
        'rr_at_8': 1 / rank if rank is not None and rank <= 8 else 0.0,
        'hit_at_1': rank == 1,
        'hit_at_3': rank is not None and rank <= 3,
        'reach_at_30': rank is not None and rank <= 30,
    }


def aggregate(rows: list[dict], arm: str) -> dict:
    values = [row[arm] for row in rows]
    return {
        'cases': len(values),
        'mrr_at_8': sum(value['rr_at_8'] for value in values) / len(values),
        'hit_at_1': sum(value['hit_at_1'] for value in values),
        'hit_at_3': sum(value['hit_at_3'] for value in values),
        'reach_at_30': sum(value['reach_at_30'] for value in values),
    }


def interval(values: list[float]) -> list[float]:
    generator = random.Random(SEED)
    count = len(values)
    draws = sorted(
        sum(values[generator.randrange(count)] for _ in range(count)) / count
        for _ in range(SAMPLES)
    )
    return [draws[math.floor(.025 * SAMPLES)], draws[math.ceil(.975 * SAMPLES) - 1]]


def comparison(rows: list[dict], treatment: str) -> dict:
    differences = [row[treatment]['rr_at_8'] - row['graph']['rr_at_8'] for row in rows]
    return {
        'mean_rr_at_8_difference': sum(differences) / len(differences),
        'paired_bootstrap_95_interval': interval(differences),
        'wins': sum(value > 0 for value in differences),
        'ties': sum(value == 0 for value in differences),
        'losses': sum(value < 0 for value in differences),
    }


def main() -> None:
    need(not OUTPUT.exists(), 'output-exists')
    need(all(sha(path.read_bytes()) == digest for path, digest in PINS.values()), 'input-drift')
    predictions = [json.loads(line) for line in PREDICTIONS.read_text().splitlines()]
    labels_document = json.loads(LABELS.read_bytes())
    labels = {item['ordinal']: item for item in labels_document['results']}
    baseline = json.loads(GRAPH_EVALUATION.read_bytes())
    graph_records = [json.loads(line) for line in GRAPH_RANKINGS.read_text().splitlines()]
    seal = json.loads(PREDICTION_SEAL.read_bytes())
    need(
        len(predictions) == len(labels) == seal['cases'] == seal['valid'] == 24
        and seal['raw_top_n_set_preserved'] == seal['guarded_top_n_set_preserved'] == 24
        and labels_document['reserved_confirmation_opened'] is False,
        'denominator',
    )
    rows = []
    for prediction in predictions:
        ordinal = prediction['ordinal']
        label = labels[ordinal]
        need(
            prediction['valid'] is True
            and label['gold_admissible'] is True
            and prediction['id'] == label['image_tag']
            and prediction['repo'] == label['repo']
            and prediction['language'] == label['language']
            and prediction['raw_top_n_set_preserved'] is True
            and prediction['guarded_top_n_set_preserved'] is True,
            f'identity-{ordinal}',
        )
        gold = {item['path'] for item in label['source_gold_paths']}
        graph_record = graph_records[ordinal - 1]
        need(graph_record['id'] == prediction['id'], f'graph-identity-{ordinal}')
        graph = metric(graph_record['ranked_files'], gold)
        raw = metric(prediction['raw_ranked_files'], gold)
        guarded = metric(prediction['guarded_ranked_files'], gold)
        rows.append({
            'ordinal': ordinal,
            'id': prediction['id'],
            'repo': prediction['repo'],
            'language': prediction['language'],
            'gold_paths': sorted(gold),
            'graph': graph,
            'raw': raw,
            'guarded': guarded,
            'raw_minus_graph_rr_at_8': raw['rr_at_8'] - graph['rr_at_8'],
            'guarded_minus_graph_rr_at_8': guarded['rr_at_8'] - graph['rr_at_8'],
            'raw_top_n_set_preserved': True,
            'guarded_top_n_set_preserved': True,
        })
    need([row['ordinal'] for row in rows] == list(range(1, 25)), 'ordinal-accounting')
    overall = {arm: aggregate(rows, arm) for arm in ('graph', 'raw', 'guarded')}
    expected_graph = baseline['aggregate']['graph']
    need(
        abs(overall['graph']['mrr_at_8'] - expected_graph['mrr8']) < 1e-15
        and overall['graph']['hit_at_3'] == expected_graph['hit3']
        and overall['graph']['reach_at_30'] == expected_graph['reach30'],
        'graph-baseline-drift',
    )
    paired = {arm + '_minus_graph': comparison(rows, arm) for arm in ('raw', 'guarded')}
    by_language = {
        language: {
            arm: aggregate([row for row in rows if row['language'] == language], arm)
            for arm in ('graph', 'raw', 'guarded')
        }
        for language in ('Python', 'Java')
    }
    guarded_pair = paired['guarded_minus_graph']
    gate_checks = {
        'valid_24_of_24': seal['valid'] == 24,
        'guarded_top_n_sets_preserved_24_of_24': seal['guarded_top_n_set_preserved'] == 24,
        'guarded_mrr_exceeds_graph': overall['guarded']['mrr_at_8'] > overall['graph']['mrr_at_8'],
        'guarded_bootstrap_lower_above_zero': guarded_pair['paired_bootstrap_95_interval'][0] > 0,
        'guarded_hit3_at_least_graph': overall['guarded']['hit_at_3'] >= overall['graph']['hit_at_3'],
        'independent_score_audit_pending': False,
    }
    result = {
        'schema_version': 'are.g01-graph-dev-b-r44-evaluation/v1',
        'claim_ceiling': 'cross-development-transfer-only',
        'cases': 24,
        'label_provenance': labels_document['gold_provenance'],
        'overall': overall,
        'paired': paired,
        'by_language': by_language,
        'gate_checks_before_independent_audit': gate_checks,
        'quantitative_gate_passed_before_audit': all(
            value for key, value in gate_checks.items()
            if key != 'independent_score_audit_pending'
        ),
        'known_prompt_tokens': seal['known_prompt_tokens'],
        'known_completion_tokens': seal['known_completion_tokens'],
        'summed_generation_elapsed_ms': seal['summed_generation_elapsed_ms'],
        'rows': rows,
        'model_calls': 24,
        'fresh_confirmation': False,
        'superiority_claim_supported': False,
    }
    OUTPUT.mkdir(mode=0o700)
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    write_new(OUTPUT / 'EVALUATION.json', data)
    print(json.dumps({
        'overall': overall,
        'paired': paired,
        'by_language': by_language,
        'quantitative_gate_passed_before_audit': result['quantitative_gate_passed_before_audit'],
        'evaluation_sha256': sha(data),
    }, sort_keys=True, indent=2))


if __name__ == '__main__':
    main()
