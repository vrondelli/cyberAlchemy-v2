#!/usr/bin/env python3
"""Evaluator-only scoring for the sealed r43 entity-card predictions."""
from __future__ import annotations

import hashlib
import json
import math
import os
import random
from pathlib import Path

BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/selective-r28')
PREDICTIONS = BASE / 'entity-r43/predictions/PREDICTIONS.jsonl'
PREDICTION_SEAL = BASE / 'entity-r43/predictions/PREDICTION-SEAL.json'
CENSUS = BASE / 'evaluator-census-r41/CENSUS-RESULT.json'
R42 = BASE / 'exposed-diagnostic-r42/SCORE-RESULT.json'
R42_AUDIT = BASE / 'exposed-diagnostic-r42/SCORE-AUDIT.json'
GRAPH = BASE / 'rankings-r38/graph'
OUTPUT = BASE / 'entity-r43/evaluation'
PROTOCOL = Path(__file__).resolve().parents[2] / 'evidence/G01-BUGSWARM-SELECTIVE-R43-ENTITY-RERANK-PROTOCOL-2026-10-04.md'
PINS = {
    'predictions': (PREDICTIONS, '2b4a482362f471964ea63ee56de7f1162c7dc804fcff092bfa3a0577f7bff93b'),
    'prediction_seal': (PREDICTION_SEAL, '12311365b7ad247e27d855d4701b8aedb0880219a607564a1ffafafabfe5d448'),
    'census': (CENSUS, '88f011f1c532609e633e0f6a023c23c8894068babd4655436c64e38c200bf78e'),
    'r42': (R42, 'fcc670625a78d8056fbf8c95f944eafc2b1ff9b3bc5b08a837466f5d91db18c4'),
    'r42_audit': (R42_AUDIT, 'ba83e2b7b64a0cffbb83ed6c67b7a682d44618a5a16d80ba738bd4d309963f1d'),
    'protocol': (PROTOCOL, '927c69a06ed097afcd7868d65d6a4b7fb1df90dc26c85d8a65a7f25b68864e29'),
}
SAMPLES = 200_000
SEED = 430043


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(condition: bool, reason: str) -> None:
    if not condition:
        raise SystemExit(reason)


def write_new(path: Path, data: bytes) -> None:
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'wb') as handle:
        handle.write(data)


def first_rank(ranking: list[str], gold: set[str]) -> int | None:
    return next((index for index, path in enumerate(ranking, 1) if path in gold), None)


def metric(rank: int | None) -> dict:
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
    draws = sorted(sum(values[generator.randrange(count)] for _ in range(count)) / count
                   for _ in range(SAMPLES))
    return [draws[math.floor(.025 * SAMPLES)], draws[math.ceil(.975 * SAMPLES) - 1]]


def main() -> None:
    need(not OUTPUT.exists(), 'output-exists')
    need(all(sha(path.read_bytes()) == digest for path, digest in PINS.values()), 'input-drift')
    predictions = [json.loads(line) for line in PREDICTIONS.read_text().splitlines()]
    labels = {item['ordinal']: item for item in json.loads(CENSUS.read_bytes())['combined_results']}
    r42 = json.loads(R42.read_bytes())
    seal = json.loads(PREDICTION_SEAL.read_bytes())
    need(len(predictions) == seal['cases'] == seal['valid'] == seal['top_n_set_preserved'] == 23 and
         r42['scored_cases'] == 23, 'denominator')
    rows = []
    for prediction in predictions:
        ordinal = prediction['ordinal']
        label = labels[ordinal]
        graph_data = (GRAPH / f'GRAPH-RANKING-{ordinal:02d}.json').read_bytes()
        graph = json.loads(graph_data)
        need(label['gold_admissible'] is True and prediction['valid'] is True and
             prediction['id'] == graph['id'] == label['id'] and
             prediction['graph_ranking_sha256'] == sha(graph_data) and
             prediction['top_n_set_preserved'] is True, f'identity-{ordinal}')
        gold = set(label['source_gold_paths'])
        graph_metric = metric(first_rank(graph['ranked_files'], gold))
        treatment_metric = metric(first_rank(prediction['ranked_files'], gold))
        rows.append({
            'ordinal': ordinal, 'id': prediction['id'], 'repo': prediction['repo'],
            'language': prediction['language'], 'gold_paths': sorted(gold),
            'graph': graph_metric, 'treatment': treatment_metric,
            'rr_at_8_difference': treatment_metric['rr_at_8'] - graph_metric['rr_at_8'],
            'top_n_set_preserved': True,
        })
    need([row['ordinal'] for row in rows] == list(range(1, 15)) + list(range(16, 25)), 'ordinal-accounting')
    overall = {arm: aggregate(rows, arm) for arm in ('graph', 'treatment')}
    need(abs(overall['graph']['mrr_at_8'] - r42['overall']['graph']['mrr_at_8']) < 1e-15 and
         overall['graph']['hit_at_3'] == r42['overall']['graph']['hit_at_3'] and
         overall['graph']['reach_at_30'] == r42['overall']['graph']['reach_at_30'], 'r42-baseline-drift')
    differences = [row['rr_at_8_difference'] for row in rows]
    paired = {
        'mean_rr_at_8_difference': sum(differences) / len(differences),
        'paired_bootstrap_95_interval': interval(differences),
        'wins': sum(value > 0 for value in differences),
        'ties': sum(value == 0 for value in differences),
        'losses': sum(value < 0 for value in differences),
    }
    by_language = {
        language: {arm: aggregate([row for row in rows if row['language'] == language], arm)
                   for arm in ('graph', 'treatment')}
        for language in ('Python', 'Java')
    }
    gate_checks = {
        'valid_23_of_23': seal['valid'] == 23,
        'top_n_sets_preserved_23_of_23': seal['top_n_set_preserved'] == 23,
        'treatment_mrr_exceeds_graph': overall['treatment']['mrr_at_8'] > overall['graph']['mrr_at_8'],
        'bootstrap_lower_above_zero': paired['paired_bootstrap_95_interval'][0] > 0,
        'treatment_hit3_at_least_graph': overall['treatment']['hit_at_3'] >= overall['graph']['hit_at_3'],
        'independent_score_audit_pending': False,
    }
    result = {
        'schema_version': 'are.g01-selective-r43-evaluation/v1',
        'claim_ceiling': 'exposed-mechanism-development-only',
        'cases': 23, 'excluded_ordinal': 15,
        'overall': overall, 'paired': paired, 'by_language': by_language,
        'gate_checks_before_independent_audit': gate_checks,
        'quantitative_gate_passed_before_audit': all(value for key, value in gate_checks.items()
                                                       if key != 'independent_score_audit_pending'),
        'known_prompt_tokens': seal['known_prompt_tokens'],
        'known_completion_tokens': seal['known_completion_tokens'],
        'summed_generation_elapsed_ms': seal['summed_generation_elapsed_ms'],
        'rows': rows,
        'model_calls': 23,
        'fresh_confirmation': False,
        'superiority_claim_supported': False,
    }
    OUTPUT.mkdir(mode=0o700)
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    write_new(OUTPUT / 'EVALUATION.json', data)
    print(json.dumps({
        'overall': overall, 'paired': paired, 'by_language': by_language,
        'quantitative_gate_passed_before_audit': result['quantitative_gate_passed_before_audit'],
        'evaluation_sha256': sha(data),
    }, sort_keys=True, indent=2))


if __name__ == '__main__':
    main()
