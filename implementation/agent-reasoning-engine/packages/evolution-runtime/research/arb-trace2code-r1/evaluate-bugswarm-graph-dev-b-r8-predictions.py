#!/usr/bin/env python3
"""Evaluator-only 24-case G01 cohort-B r8 score and frozen development gate."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import random


BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-dev-b-r2')
SOURCE = BASE / 'code-only'
EVAL = BASE / 'evaluator-only'
PINS = {
    'predictions': (SOURCE / 'glm-predictions-r8/PREDICTIONS-B-R8.jsonl', 'd8582ac65fd1fb08efc6baf82f85b01057dbcf764a245061459c0d066be5b0df'),
    'prediction_seal': (SOURCE / 'glm-predictions-r8/PREDICTION-SEAL-B-R8.json', '198094643e918e298c704aef9e0d5dc8b9ec4d3a8bf77a688809fed0d61cd1e2'),
    'packets': (SOURCE / 'g01-bugswarm-graph-dev-b-r8/PACKETS-B-R8.jsonl', '26e3b47e375bf309e1df4c92279e137f9d68b5ae9dcd5a9f5f9d9d0196527a4f'),
    'graph_r2': (SOURCE / 'graph-r2/GRAPH-RANKINGS-B-R3.jsonl', '86b39c47e9ce166d4db66068d5894f3e9cbac1275b11d549df1e17ee121cb32d'),
    'graph_evaluation': (EVAL / 'GRAPH-EVALUATION-B-R3.json', '82b8ce048c7d77d09ea1bfc04bab11e3c68e7d7f12e84cfd2e199c4c43b86fd8'),
    'gold': (EVAL / 'DEV-GOLD-AUDIT-B-R3.json', 'ac3ef81c36088dc305508c940df9a86d583c8601ba41874c1369197a14ec376e'),
    'projection': (EVAL / 'PROJECTION-GOLD-AUDIT-B-R3.json', '0a72eb4e9c44f2776bceb72ec602b59c897f41dea227cf122ad00a9ce3f9af7d'),
    'generation_result': (SOURCE / 'g01-bugswarm-graph-dev-b-r8/GENERATION-RESULT.json', '79fb7334d1d3463e1363c1137bb89dc84aa3911b7acb8c0883e4895d568ff240'),
    'tokenizer_result': (SOURCE / 'g01-bugswarm-graph-dev-b-r8/TOKENIZER-RESULT.json', '699fa8136a9eebc54d75f68b549f9985f8f9d0ae1ec1fd0649d3a88b8051bae1'),
}
OUTPUT = EVAL / 'GLM-R8-EVALUATION-B.json'
DRAWS = 20_000


def sha(blob: bytes) -> str:
    return hashlib.sha256(blob).hexdigest()


def metric(ranking: list[str], gold: set[str]) -> dict:
    rank = next((n for n, path in enumerate(ranking[:8], 1) if path in gold), None)
    return {'rr8': 1 / rank if rank else 0.0,
            'hit3': int(bool(gold.intersection(ranking[:3]))),
            'reach30': int(bool(gold.intersection(ranking[:30]))),
            'rank1': int(ranking[0] in gold)}


def interval(values: list[float], seed: int) -> list[float]:
    rng = random.Random(seed)
    draws = sorted(sum(values[rng.randrange(24)] for _ in range(24)) / 24
                   for _ in range(DRAWS))
    return [draws[int((DRAWS - 1) * 0.025)], draws[int((DRAWS - 1) * 0.975)]]


def main() -> None:
    if OUTPUT.exists():
        raise SystemExit('output-exists')
    blobs = {}
    for name, (path, pin) in PINS.items():
        blob = path.read_bytes()
        if sha(blob) != pin:
            raise SystemExit(f'input-pin-drift:{name}')
        blobs[name] = blob
    rows = {name: [json.loads(line) for line in blobs[name].splitlines()]
            for name in ('predictions', 'packets', 'graph_r2')}
    prior = json.loads(blobs['graph_evaluation'])
    labels = json.loads(blobs['gold'])['results']
    projection = json.loads(blobs['projection'])['results']
    seal = json.loads(blobs['prediction_seal'])
    generation = json.loads(blobs['generation_result'])
    tokenizer = json.loads(blobs['tokenizer_result'])
    if (any(len(items) != 24 for items in (*rows.values(), prior['cases'], labels, projection)) or
            seal['predictions_sha256'] != PINS['predictions'][1] or
            seal['cases'] != 24 or seal['listwise_valid'] != 24 or
            seal['gold_opened'] or seal['reserved_confirmation_opened'] or
            generation['status'] != 'completed-valid-listwise' or
            generation['listwise_valid'] != 24 or generation['calls'] != seal['calls'] or
            tokenizer['status'] != 'admitted' or tokenizer['admitted'] != 24):
        raise SystemExit('denominator-or-seal-drift')
    cases = []
    deltas = {'guard_vs_are': [], 'guard_vs_r2': [], 'raw_vs_r2': []}
    raw_demotions, guard_demotions, raw_rescues, guard_rescues = [], [], [], []
    candidate_reach = 0
    for i, (new, packet, old, baseline, gold, project) in enumerate(zip(
            rows['predictions'], rows['packets'], rows['graph_r2'], prior['cases'], labels, projection), 1):
        if (not all(item['ordinal'] == i for item in (new, packet, old, baseline, gold, project)) or
                not all(item['id'] == new['id'] for item in (packet, old, baseline)) or
                gold['image_tag'] != new['id'] or project['image_tag'] != new['id'] or
                not gold['gold_admissible'] or not project['all_projected'] or
                new['gold_opened'] or new['reserved_confirmation_opened']):
            raise SystemExit(f'case-identity-or-admission:{i}')
        gold_paths = {item['path'] for item in gold['source_gold_paths']}
        if (not gold_paths or gold_paths != {item['path'] for item in project['source_gold_paths']} or
                gold_paths != set(baseline['gold_paths'])):
            raise SystemExit(f'gold-projection:{i}')
        full = old['ranked_files']
        raw = new['raw_listwise_ranked_files']
        guard = new['guarded_ranked_files']
        if (len(raw) != len(full) or len(guard) != len(full) or
                set(raw) != set(full) or set(guard) != set(full)):
            raise SystemExit(f'ranking-coverage:{i}')
        a = baseline['are']
        b = metric(full, gold_paths)
        r = metric(raw, gold_paths)
        g = metric(guard, gold_paths)
        if (a['rr8'] != baseline['are']['rr8'] or b['rr8'] != baseline['graph']['rr8'] or
                b['hit3'] != baseline['graph']['hit3'] or
                b['reach30'] != int(baseline['graph']['reach30'])):
            raise SystemExit(f'baseline-score-drift:{i}')
        reach = int(bool(gold_paths.intersection(c['path'] for c in packet['candidates'])))
        candidate_reach += reach
        deltas['guard_vs_are'].append(g['rr8'] - a['rr8'])
        deltas['guard_vs_r2'].append(g['rr8'] - b['rr8'])
        deltas['raw_vs_r2'].append(r['rr8'] - b['rr8'])
        if b['rank1'] and not r['rank1']:
            raw_demotions.append(i)
        if b['rank1'] and not g['rank1']:
            guard_demotions.append(i)
        if not b['rank1'] and r['rank1']:
            raw_rescues.append(i)
        if not b['rank1'] and g['rank1']:
            guard_rescues.append(i)
        cases.append({'ordinal': i, 'id': new['id'], 'repo': new['repo'],
                      'language': new['language'], 'gold_paths': sorted(gold_paths),
                      'candidate_reach': reach, 'are': a, 'graph_r2': b,
                      'raw_listwise': r, 'guarded': g,
                      'guard_promotes': new['guard_promotes']})
    mean = lambda xs: sum(xs) / len(xs)
    aggregate = {arm: {'mrr8': mean([c[arm]['rr8'] for c in cases]),
                       'hit3': sum(c[arm]['hit3'] for c in cases),
                       'reach30': sum(int(c[arm]['reach30']) for c in cases),
                       'rank1': sum(c[arm].get('rank1', 0) for c in cases)}
                 for arm in ('are', 'graph_r2', 'raw_listwise', 'guarded')}
    paired = {name: {'delta_mrr8': mean(values),
                     'bootstrap_95_percentile': interval(values, int(PINS['predictions'][1][:8], 16)),
                     'wins': sum(v > 0 for v in values),
                     'ties': sum(v == 0 for v in values),
                     'losses': sum(v < 0 for v in values)}
              for name, values in deltas.items()}
    gate = {'listwise_valid_24': seal['listwise_valid'] == 24,
            'no_transport_failure': generation['status'] == 'completed-valid-listwise',
            'candidate_reach_at_least_22': candidate_reach >= 22,
            'guarded_mrr8_at_least_0_41667': aggregate['guarded']['mrr8'] >= 0.41667,
            'guarded_wins_at_least_16_vs_are': paired['guard_vs_are']['wins'] >= 16,
            'positive_paired_lower_vs_are': paired['guard_vs_are']['bootstrap_95_percentile'][0] > 0,
            'label_source_integrity_resolved': False}
    gate['passed'] = all(gate.values())
    result = {'schema_version': 'are.g01-bugswarm-graph-dev-b-r8-evaluation/v1',
              'pins': {name: pin for name, (_, pin) in PINS.items()},
              'script_sha256': sha(Path(__file__).read_bytes()),
              'candidate_reach': candidate_reach,
              'aggregate': aggregate, 'paired': paired,
              'rank1': {'raw_demotions': raw_demotions, 'guard_demotions': guard_demotions,
                        'raw_rescues': raw_rescues, 'guard_rescues': guard_rescues},
              'cost': {'tokenizer_prompt_tokens': tokenizer['summed_prompt_tokens'],
                       'generation_prompt_tokens': seal['prompt_tokens'],
                       'generation_completion_tokens': seal['completion_tokens'],
                       'generation_elapsed_ms_sum': seal['elapsed_ms'],
                       'generation_calls': seal['calls'], 'pairwise_calls': seal['pairwise_calls']},
              'gate': gate, 'cases': cases,
              'claim_ceiling': 'Private score-exposed development only; original HTTP labels/logs provisional; no independent confirmation, ContextBench, live ARE, or product superiority.'}
    encoded = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    with os.fdopen(os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600), 'wb') as stream:
        stream.write(encoded)
    print(json.dumps({'candidate_reach': candidate_reach, 'aggregate': aggregate,
                      'paired': paired, 'rank1': result['rank1'], 'cost': result['cost'],
                      'gate': gate, 'evaluation_sha256': sha(encoded)}))


if __name__ == '__main__':
    main()
