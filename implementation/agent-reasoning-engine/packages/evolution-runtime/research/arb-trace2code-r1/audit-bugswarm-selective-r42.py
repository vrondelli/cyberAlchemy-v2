#!/usr/bin/env python3
"""Independent, read-only recomputation of the r42 exposed diagnostic."""
from __future__ import annotations

import hashlib
import json
import math
import os
import random
from pathlib import Path

BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/selective-r28')
RESULT = BASE / 'exposed-diagnostic-r42/SCORE-RESULT.json'
CENSUS = BASE / 'evaluator-census-r41/CENSUS-RESULT.json'
MULTI = BASE / 'rankings-r39/MULTIVIEW-RANKINGS.jsonl'
EXPECTED = 'fcc670625a78d8056fbf8c95f944eafc2b1ff9b3bc5b08a837466f5d91db18c4'
AUDIT = BASE / 'exposed-diagnostic-r42/SCORE-AUDIT.json'
CHANNELS = ('are', 'graph', 'symbol', 'fused')


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rank(paths: list[str], gold: set[str]) -> int | None:
    return next((position for position, path in enumerate(paths, 1) if path in gold), None)


def metric(position: int | None) -> tuple[float, bool, bool, bool]:
    return (
        1 / position if position is not None and position <= 8 else 0.0,
        position == 1,
        position is not None and position <= 3,
        position is not None and position <= 30,
    )


def interval(values: list[float]) -> list[float]:
    rng = random.Random(400039)
    size = len(values)
    draws = sorted(sum(values[rng.randrange(size)] for _ in range(size)) / size for _ in range(200_000))
    return [draws[math.floor(.025 * len(draws))], draws[math.ceil(.975 * len(draws)) - 1]]


def close(left: float, right: float) -> bool:
    return abs(left - right) < 1e-15


def main() -> None:
    assert digest(RESULT) == EXPECTED
    observed = json.loads(RESULT.read_bytes())
    labels = json.loads(CENSUS.read_bytes())['combined_results']
    multi = [json.loads(line) for line in MULTI.read_text().splitlines()]
    rebuilt = []
    excluded = []
    for label, view in zip(labels, multi):
        ordinal = label['ordinal']
        assert ordinal == view['ordinal'] and label['id'] == view['id']
        if not label['gold_admissible']:
            excluded.append(ordinal)
            continue
        are = json.loads((BASE / f'rankings-r38/are/ARE-RANKING-{ordinal:02d}.json').read_bytes())['ranked_files']
        graph = json.loads((BASE / f'rankings-r38/graph/GRAPH-RANKING-{ordinal:02d}.json').read_bytes())['ranked_files']
        rankings = {'are': are, 'graph': graph, 'symbol': view['symbol_ranked_files'], 'fused': view['fused_ranked_files']}
        gold = set(label['source_gold_paths'])
        rebuilt.append({channel: metric(rank(paths, gold)) for channel, paths in rankings.items()})
    assert len(rebuilt) == 23 and excluded == [15]
    for channel in CHANNELS:
        expected = observed['overall'][channel]
        assert close(sum(row[channel][0] for row in rebuilt) / 23, expected['mrr_at_8'])
        assert sum(row[channel][1] for row in rebuilt) == expected['hit_at_1']
        assert sum(row[channel][2] for row in rebuilt) == expected['hit_at_3']
        assert sum(row[channel][3] for row in rebuilt) == expected['reach_at_30']
    for channel in ('are', 'graph', 'symbol'):
        values = [row['fused'][0] - row[channel][0] for row in rebuilt]
        expected = observed['fused_comparisons'][channel]
        assert close(sum(values) / 23, expected['fused_minus_channel_mean_rr_at_8'])
        rebuilt_interval = interval(values)
        assert all(close(left, right) for left, right in zip(rebuilt_interval, expected['paired_bootstrap_95_interval']))
        assert [sum(value > 0 for value in values), sum(value == 0 for value in values), sum(value < 0 for value in values)] == [expected['rr_at_8_wins'], expected['rr_at_8_ties'], expected['rr_at_8_losses']]
        assert sum(row['fused'][3] and not row[channel][3] for row in rebuilt) == expected['top30_gains']
        assert sum(not row['fused'][3] and row[channel][3] for row in rebuilt) == expected['top30_losses']
    audit = {
        'schema_version': 'are.g01-selective-r42-score-audit/v1',
        'audit_passed': True,
        'scored_cases': 23,
        'excluded_ordinals': excluded,
        'score_result_sha256': EXPECTED,
        'audit_script_sha256': digest(Path(__file__)),
        'independently_recomputed_metrics': ['MRR@8', 'Hit@1', 'Hit@3', 'top-30 reach', 'paired differences', 'bootstrap intervals', 'wins/ties/losses', 'top-30 gains/losses'],
        'network_calls': 0,
        'model_calls': 0,
    }
    data = (json.dumps(audit, sort_keys=True, indent=2) + '\n').encode()
    descriptor = os.open(AUDIT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'wb') as handle:
        handle.write(data)
    print(json.dumps({**audit, 'audit_receipt_sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
