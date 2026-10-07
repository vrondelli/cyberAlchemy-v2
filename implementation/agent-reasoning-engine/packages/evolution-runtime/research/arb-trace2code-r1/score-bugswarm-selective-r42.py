#!/usr/bin/env python3
"""Score the frozen r38/r39 rankings on the exposed r41-admissible subset."""
from __future__ import annotations

import hashlib
import json
import math
import os
import random
from pathlib import Path

ROOT = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/selective-r28')
R38 = ROOT / 'rankings-r38'
R39 = ROOT / 'rankings-r39'
R41 = ROOT / 'evaluator-census-r41'
OUTPUT = ROOT / 'exposed-diagnostic-r42'
PROTOCOL = Path(__file__).resolve().parents[2] / 'evidence/G01-BUGSWARM-SELECTIVE-R42-EXPOSED-DIAGNOSTIC-PROTOCOL-2026-10-04.md'
PINS = {
    'r38_audit': (R38 / 'R38-AUDIT.json', 'ef02489f4b42a1363fee82af76a2c812a98ce595ae1ce621d0e8ea10c2dc68fe'),
    'r39_rankings': (R39 / 'MULTIVIEW-RANKINGS.jsonl', '9466de334f4d0a2ccd38a4db05b38a1bc8c55beb638542c755c509fb5b319cb9'),
    'r39_seal': (R39 / 'MULTIVIEW-SEAL.json', 'cf2fda51657801c3795d51bdf854593134915622a3b487551be9ed1dff5afd20'),
    'r39_audit': (R39 / 'MULTIVIEW-AUDIT.json', '9781bf39483ee5dc05db9ab68b69d7dea06d7164e27c9bc191d48972023e5158'),
    'r41_census': (R41 / 'CENSUS-RESULT.json', '88f011f1c532609e633e0f6a023c23c8894068babd4655436c64e38c200bf78e'),
    'protocol': (PROTOCOL, 'c485809b1e4a896539d111a828c670762f02e65883a672f016042e518a4ff649'),
}
CHANNELS = ('are', 'graph', 'symbol', 'fused')
BOOTSTRAPS = 200_000
SEED = 400039


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def encoded(value: object) -> bytes:
    return (json.dumps(value, sort_keys=True, indent=2) + '\n').encode()


def save(path: Path, data: bytes) -> None:
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as handle:
        handle.write(data)


def need(condition: bool, reason: str) -> None:
    if not condition:
        raise SystemExit(reason)


def first_rank(ranking: list[str], gold: set[str]) -> int | None:
    for rank, path in enumerate(ranking, 1):
        if path in gold:
            return rank
    return None


def score(rank: int | None) -> dict[str, float | int | bool | None]:
    return {
        'first_gold_rank': rank,
        'rr_at_8': 1.0 / rank if rank is not None and rank <= 8 else 0.0,
        'hit_at_1': rank == 1,
        'hit_at_3': rank is not None and rank <= 3,
        'reach_at_30': rank is not None and rank <= 30,
    }


def aggregate(rows: list[dict], channel: str) -> dict[str, float | int]:
    values = [row['scores'][channel] for row in rows]
    count = len(values)
    return {
        'cases': count,
        'mrr_at_8': sum(item['rr_at_8'] for item in values) / count,
        'hit_at_1': sum(item['hit_at_1'] for item in values),
        'hit_at_3': sum(item['hit_at_3'] for item in values),
        'reach_at_30': sum(item['reach_at_30'] for item in values),
    }


def bootstrap_interval(differences: list[float]) -> list[float]:
    generator = random.Random(SEED)
    count = len(differences)
    samples = [
        sum(differences[generator.randrange(count)] for _ in range(count)) / count
        for _ in range(BOOTSTRAPS)
    ]
    samples.sort()
    lower = samples[math.floor(0.025 * BOOTSTRAPS)]
    upper = samples[math.ceil(0.975 * BOOTSTRAPS) - 1]
    return [lower, upper]


def main() -> None:
    need(not OUTPUT.exists(), 'output-exists')
    need(all(sha(path.read_bytes()) == digest for path, digest in PINS.values()), 'input-drift')
    census = json.loads((R41 / 'CENSUS-RESULT.json').read_bytes())
    r39_rows = [json.loads(line) for line in (R39 / 'MULTIVIEW-RANKINGS.jsonl').read_text().splitlines()]
    need(census['accounted_slots'] == 24 and census['admissible'] == 23, 'census-denominator')
    need(len(r39_rows) == 24, 'ranking-denominator')

    OUTPUT.mkdir(parents=True, mode=0o700)
    freeze = {
        'schema_version': 'are.g01-selective-r42-score-freeze/v1',
        'input_sha256': {name: digest for name, (_, digest) in PINS.items()},
        'script_sha256': sha(Path(__file__).read_bytes()),
        'channels': list(CHANNELS),
        'bootstrap_samples': BOOTSTRAPS,
        'bootstrap_seed': SEED,
        'admissible_cases': 23,
        'excluded_ordinal': 15,
        'network_calls': 0,
        'model_calls': 0,
    }
    save(OUTPUT / 'SCORE-FREEZE.json', encoded(freeze))

    rows = []
    exclusions = []
    for label, multi in zip(census['combined_results'], r39_rows):
        ordinal = label['ordinal']
        need(ordinal == multi['ordinal'] and label['id'] == multi['id'], f'identity-{ordinal}')
        if not label['gold_admissible']:
            exclusions.append({'ordinal': ordinal, 'id': label['id'], 'reason': label.get('inadmissible_reason')})
            continue
        are_path = R38 / 'are' / f'ARE-RANKING-{ordinal:02d}.json'
        graph_path = R38 / 'graph' / f'GRAPH-RANKING-{ordinal:02d}.json'
        are = json.loads(are_path.read_bytes())
        graph = json.loads(graph_path.read_bytes())
        need(
            sha(are_path.read_bytes()) == multi['r38_are_sha256']
            and sha(graph_path.read_bytes()) == multi['r38_graph_sha256']
            and are['id'] == graph['id'] == multi['id'],
            f'ranking-integrity-{ordinal}',
        )
        rankings = {
            'are': are['ranked_files'],
            'graph': graph['ranked_files'],
            'symbol': multi['symbol_ranked_files'],
            'fused': multi['fused_ranked_files'],
        }
        gold = set(label['source_gold_paths'])
        rows.append({
            'ordinal': ordinal,
            'id': multi['id'],
            'repo': multi['repo'],
            'stratum': multi['top1_relation'],
            'gold_paths': sorted(gold),
            'scores': {channel: score(first_rank(rankings[channel], gold)) for channel in CHANNELS},
        })
    need(len(rows) == 23 and exclusions == [{'ordinal': 15, 'id': 'OpenNMT-OpenNMT-py-19529228404', 'reason': 'no-changed-language-path-present-in-failed-source'}], 'admission-accounting')

    overall = {channel: aggregate(rows, channel) for channel in CHANNELS}
    strata = {
        stratum: {channel: aggregate([row for row in rows if row['stratum'] == stratum], channel) for channel in CHANNELS}
        for stratum in ('all-three-agree', 'two-agree', 'all-different')
    }
    comparisons = {}
    for channel in ('are', 'graph', 'symbol'):
        differences = [row['scores']['fused']['rr_at_8'] - row['scores'][channel]['rr_at_8'] for row in rows]
        comparisons[channel] = {
            'fused_minus_channel_mean_rr_at_8': sum(differences) / len(differences),
            'paired_bootstrap_95_interval': bootstrap_interval(differences),
            'rr_at_8_wins': sum(value > 0 for value in differences),
            'rr_at_8_ties': sum(value == 0 for value in differences),
            'rr_at_8_losses': sum(value < 0 for value in differences),
            'top30_gains': sum(row['scores']['fused']['reach_at_30'] and not row['scores'][channel]['reach_at_30'] for row in rows),
            'top30_losses': sum(not row['scores']['fused']['reach_at_30'] and row['scores'][channel]['reach_at_30'] for row in rows),
        }
    non_different = [row for row in rows if row['stratum'] != 'all-different']
    all_different = [row for row in rows if row['stratum'] == 'all-different']
    selector = {
        'non_all_different_cases': len(non_different),
        'non_all_different_fused_top30_misses': sum(not row['scores']['fused']['reach_at_30'] for row in non_different),
        'all_different_cases': len(all_different),
        'all_different_fused_top30_misses': sum(not row['scores']['fused']['reach_at_30'] for row in all_different),
    }
    selector['r40_selector_screen_passed'] = (
        selector['non_all_different_fused_top30_misses'] == 0
        and selector['all_different_fused_top30_misses'] >= 1
    )
    numeric_fusion_conditions = {
        'mrr_exceeds_all_channels': all(overall['fused']['mrr_at_8'] > overall[channel]['mrr_at_8'] for channel in ('are', 'graph', 'symbol')),
        'bootstrap_lower_above_zero_all_channels': all(comparisons[channel]['paired_bootstrap_95_interval'][0] > 0 for channel in ('are', 'graph', 'symbol')),
        'top30_at_least_max_channel': overall['fused']['reach_at_30'] >= max(overall[channel]['reach_at_30'] for channel in ('are', 'graph', 'symbol')),
        'zero_top30_losses_all_channels': all(comparisons[channel]['top30_losses'] == 0 for channel in ('are', 'graph', 'symbol')),
    }
    result = {
        'schema_version': 'are.g01-selective-r42-exposed-diagnostic-result/v1',
        'claim_ceiling': 'exposed-mechanism-diagnostic-only',
        'original_population': 24,
        'scored_cases': len(rows),
        'excluded_cases': exclusions,
        'overall': overall,
        'strata': strata,
        'fused_comparisons': comparisons,
        'selector_screen': selector,
        'numeric_fusion_conditions_on_exposed_23': numeric_fusion_conditions,
        'r40_gate_passed': False,
        'rows': rows,
        'score_freeze_sha256': sha((OUTPUT / 'SCORE-FREEZE.json').read_bytes()),
        'network_calls': 0,
        'model_calls': 0,
    }
    data = encoded(result)
    save(OUTPUT / 'SCORE-RESULT.json', data)
    print(json.dumps({
        'scored_cases': len(rows),
        'overall': overall,
        'comparisons': comparisons,
        'selector_screen': selector,
        'numeric_fusion_conditions': numeric_fusion_conditions,
        'result_sha256': sha(data),
    }, sort_keys=True, indent=2))


if __name__ == '__main__':
    main()
