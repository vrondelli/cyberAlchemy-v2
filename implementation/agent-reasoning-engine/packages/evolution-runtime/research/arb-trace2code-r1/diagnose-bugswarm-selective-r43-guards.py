#!/usr/bin/env python3
"""Explicitly post-hoc fixed-prefix guard diagnosis for failed r43."""
from __future__ import annotations

import hashlib
import json
import math
import os
import random
from pathlib import Path

BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/selective-r28')
PREDICTIONS = BASE / 'entity-r43/predictions/PREDICTIONS.jsonl'
CENSUS = BASE / 'evaluator-census-r41/CENSUS-RESULT.json'
EVALUATION = BASE / 'entity-r43/evaluation/EVALUATION.json'
AUDIT = BASE / 'entity-r43/evaluation/EVALUATION-AUDIT.json'
GRAPH = BASE / 'rankings-r38/graph'
OUTPUT = BASE / 'entity-r43/diagnosis'
PINS = {
    'predictions': (PREDICTIONS, '2b4a482362f471964ea63ee56de7f1162c7dc804fcff092bfa3a0577f7bff93b'),
    'census': (CENSUS, '88f011f1c532609e633e0f6a023c23c8894068babd4655436c64e38c200bf78e'),
    'evaluation': (EVALUATION, '17789eddcbff33636bc3e751898fbf0198c44d066a25e2027b5ef2d09e82cd49'),
    'audit': (AUDIT, 'f59a66633597dd8c6635afc1b6a4ea05dd857d7fcecdd8d4a13532103695b2bb'),
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


def main() -> None:
    if OUTPUT.exists() or any(sha(path.read_bytes()) != digest for path, digest in PINS.values()):
        raise SystemExit('output-or-input-drift')
    predictions = [json.loads(line) for line in PREDICTIONS.read_text().splitlines()]
    labels = {item['ordinal']: item for item in json.loads(CENSUS.read_bytes())['combined_results']}
    variants = []
    for prefix_count in range(9):
        differences = []
        treatment_rr = []
        hit1 = hit3 = 0
        for prediction in predictions:
            ordinal = prediction['ordinal']
            graph = json.loads((GRAPH / f'GRAPH-RANKING-{ordinal:02d}.json').read_bytes())['ranked_files']
            gold = set(labels[ordinal]['source_gold_paths'])
            prefix = graph[:prefix_count]
            seen = set(prefix)
            selected = []
            for path in prediction['selected_paths']:
                if path not in seen:
                    selected.append(path); seen.add(path)
            ranked = prefix + selected + [path for path in graph if path not in seen]
            graph_rank = first(graph, gold); treatment_rank = first(ranked, gold)
            difference = rr(treatment_rank) - rr(graph_rank)
            differences.append(difference); treatment_rr.append(rr(treatment_rank))
            hit1 += treatment_rank == 1
            hit3 += treatment_rank is not None and treatment_rank <= 3
        variants.append({
            'fixed_graph_prefix': prefix_count,
            'treatment_mrr_at_8': sum(treatment_rr) / 23,
            'mean_difference': sum(differences) / 23,
            'paired_bootstrap_95_interval': interval(differences),
            'hit_at_1': hit1, 'hit_at_3': hit3,
            'wins': sum(value > 0 for value in differences),
            'ties': sum(value == 0 for value in differences),
            'losses': sum(value < 0 for value in differences),
        })
    result = {
        'schema_version': 'are.g01-selective-r43-posthoc-guard-diagnosis/v1',
        'posture': 'outcome-exposed exploratory sweep; no advancement, confirmation, or claim effect',
        'input_sha256': {name: digest for name, (_, digest) in PINS.items()},
        'script_sha256': sha(Path(__file__).read_bytes()),
        'variants': variants,
        'first_zero_loss_variant': 4,
        'candidate_for_distinct_development_transfer': {
            'rule': 'keep graph ranks 1-4 fixed; append GLM-selected top-N paths excluding that prefix; then unchanged graph remainder',
            'selection_basis': 'post-hoc first tested prefix with zero RR@8 losses and empirical lower bound above zero',
            'not_prospectively_qualified': True,
        },
        'model_calls': 0, 'network_calls': 0,
    }
    OUTPUT.mkdir(mode=0o700)
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    descriptor = os.open(OUTPUT / 'GUARD-DIAGNOSIS.json', os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'wb') as handle:
        handle.write(data)
    print(json.dumps({'variants': variants, 'result_sha256': sha(data)}, sort_keys=True))


if __name__ == '__main__':
    main()
