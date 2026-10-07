#!/usr/bin/env python3
"""Evaluator-only matched exposed r10 score under its prospective gate."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import random


BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-confirm-r4')
OUTPUT = BASE / 'exposed-r10/EVALUATION.json'
PINS = {
    'predictions': '730830e2eb4b8a431529b932b858026bcbf7715bb3dbd7e45e50640dbe1f16c6',
    'prediction_seal': '885d3cbbc080850046ec43a42c9494cbb8f9d5980c0e404652b1c11e40416fdc',
    'packets': '631e04900738119551324d94a6116685c0dc6cfce33d96c19b25243d7488be44',
    'old_predictions': 'de79a4336d8e8830d027e037b492e816caac452c7a38e0b0edca941cb1b4c674',
    'tree_labels': 'ac7afb30a2cc62432551cbecfdcf4bbac0186cf2098975c435fda8f981cc8469',
    'are_seal': '45d73843608fdc5f43ceec2328fdfef9c2b41220f86d1d45fb20abb01ce3d736',
    'graph_seal': '0ae5f79b60d96eacc1c8cbb84c88c274416686566c2a48156dd19c61aa6ef320',
    'run_result': 'ab3afe11cd2afce97a305896a82ff11b44a9469b7cac276577c7fdf40a6ae8f2',
    'tokenizer_result': '6f9c53049008e7507adf2dee7a228e20c4109ffbccce2fd0db7f44672650fed8',
}
DRAWS = 20_000


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(ok: bool, reason: str) -> None:
    if not ok:
        raise SystemExit(reason)


def metric(ranking: list[str], gold: set[str]) -> dict:
    rank = next((n for n, path in enumerate(ranking[:8], 1) if path in gold), None)
    return {'rr8': 1 / rank if rank else 0.0,
            'hit3': int(bool(gold.intersection(ranking[:3]))),
            'rank1': int(ranking[0] in gold)}


def interval(values: list[float], seed: int) -> list[float]:
    rng = random.Random(seed)
    draws = sorted(sum(values[rng.randrange(24)] for _ in range(24)) / 24
                   for _ in range(DRAWS))
    return [draws[int((DRAWS - 1) * 0.025)], draws[int((DRAWS - 1) * 0.975)]]


def main() -> None:
    files = {
        'predictions': BASE / 'exposed-r10/predictions/PREDICTIONS.jsonl',
        'prediction_seal': BASE / 'exposed-r10/predictions/PREDICTION-SEAL.json',
        'packets': BASE / 'exposed-r10/packets/PACKETS.jsonl',
        'old_predictions': BASE / 'predictions-r8/PREDICTIONS.jsonl',
        'tree_labels': BASE / 'evaluator-only/github-tree-r8/TREE-RESULT.json',
        'are_seal': BASE / 'rankings-r6/are/ARE-SEAL.json',
        'graph_seal': BASE / 'rankings-r6/graph/GRAPH-SEAL.json',
        'run_result': BASE / 'exposed-r10/vps-run/RUN-RESULT.json',
        'tokenizer_result': BASE / 'exposed-r10/vps-run/TOKENIZER-RESULT.json',
    }
    need(not OUTPUT.exists(), 'output-exists')
    for name, path in files.items():
        need(sha(path.read_bytes()) == PINS[name], f'input-pin-drift:{name}')
    rows = {name: [json.loads(line) for line in files[name].read_text().splitlines()]
            for name in ('predictions', 'packets', 'old_predictions')}
    labels = json.loads(files['tree_labels'].read_bytes())['results']
    are_seals = json.loads(files['are_seal'].read_bytes())['rankings']
    graph_seals = json.loads(files['graph_seal'].read_bytes())['rankings']
    pred_seal = json.loads(files['prediction_seal'].read_bytes())
    generation = json.loads(files['run_result'].read_bytes())
    tokenizer = json.loads(files['tokenizer_result'].read_bytes())
    need(all(len(value) == 24 for value in (*rows.values(), labels, are_seals, graph_seals)) and
         pred_seal['cases'] == 24 and pred_seal['predictions_sha256'] == PINS['predictions'] and
         generation['attempts'] == 24 and not generation['transport_stopped'] and
         tokenizer['attempts'] == tokenizer['admitted'] == 24, 'denominator-or-run-drift')
    cases = []
    deltas = {'r10_vs_are': [], 'r10_vs_graph': [], 'r10_vs_r8': []}
    candidate_reach = 0
    for ordinal, (pred, packet, old, label, are_seal, graph_seal) in enumerate(zip(
            rows['predictions'], rows['packets'], rows['old_predictions'], labels,
            are_seals, graph_seals), 1):
        a_data = (BASE / f'rankings-r6/are/ARE-RANKING-{ordinal:02d}.json').read_bytes()
        g_data = (BASE / f'rankings-r6/graph/GRAPH-RANKING-{ordinal:02d}.json').read_bytes()
        a, g = json.loads(a_data), json.loads(g_data)
        need(all(item['ordinal'] == ordinal for item in
                 (pred, packet, old, label, a, g, are_seal, graph_seal)) and
             pred['id'] == packet['id'] == old['id'] == label['id'] == a['id'] == g['id'] and
             pred['repo'] == packet['repo'] == old['repo'] == label['repo'] == a['repo'] == g['repo'] and
             pred['base_commit'] == packet['base_commit'] == old['base_commit'] ==
             label['failed_sha'] == a['base_commit'] == g['base_commit'] and
             sha(a_data) == are_seal['ranking_sha256'] and
             sha(g_data) == graph_seal['ranking_sha256'] == pred['graph_ranking_sha256'] and
             label['complete_tree'] and label['direct_changed_old_source_paths'] and
             pred['gold_opened'] is False, f'identity-or-label:{ordinal}')
        gold = set(label['direct_changed_old_source_paths'])
        full = a['ranked_files']
        need(len(full) == len(set(full)) == len(g['ranked_files']) ==
             len(pred['ranked_files']) == len(old['ranked_files']) and
             set(full) == set(g['ranked_files']) == set(pred['ranked_files']) ==
             set(old['ranked_files']) and gold.issubset(full), f'coverage:{ordinal}')
        reach = int(bool(gold.intersection(item['path'] for item in packet['candidates'])))
        candidate_reach += reach
        scores = {'are': metric(full, gold),
                  'graph': metric(g['ranked_files'], gold),
                  'r8': metric(old['ranked_files'], gold),
                  'r10': metric(pred['ranked_files'], gold)}
        for arm in ('are', 'graph', 'r8'):
            deltas[f'r10_vs_{arm}'].append(scores['r10']['rr8'] - scores[arm]['rr8'])
        cases.append({'ordinal': ordinal, 'id': pred['id'], 'repo': pred['repo'],
                      'gold_paths': sorted(gold), 'candidate_reach': reach,
                      'normalized_valid': pred['valid'], **scores})
    aggregate = {arm: {'mrr8': sum(case[arm]['rr8'] for case in cases) / 24,
                       'hit3': sum(case[arm]['hit3'] for case in cases),
                       'rank1': sum(case[arm]['rank1'] for case in cases)}
                 for arm in ('are', 'graph', 'r8', 'r10')}
    paired = {name: {'delta_mrr8': sum(values) / 24,
                     'bootstrap_95_percentile': interval(values, int(PINS['predictions'][:8], 16)),
                     'wins': sum(value > 0 for value in values),
                     'ties': sum(value == 0 for value in values),
                     'losses': sum(value < 0 for value in values)}
              for name, values in deltas.items()}
    new_cases = {str(n): {'r8_rr8': cases[n-1]['r8']['rr8'],
                           'r10_rr8': cases[n-1]['r10']['rr8'],
                           'r10_candidate_reach': cases[n-1]['candidate_reach']}
                 for n in (10, 15, 23)}
    gate = {'tokenizer_valid_24': tokenizer['admitted'] == 24,
            'normalized_valid_24': pred_seal['valid'] == 24,
            'no_transport_failure': generation['attempts'] == 24 and not generation['transport_stopped'],
            'candidate_reach_at_least_21': candidate_reach >= 21,
            'r10_mrr_at_least_r8_0_52951': aggregate['r10']['mrr8'] >= 0.52951,
            'r10_wins_at_least_16_vs_are': paired['r10_vs_are']['wins'] >= 16,
            'positive_paired_lower_vs_are': paired['r10_vs_are']['bootstrap_95_percentile'][0] > 0,
            'positive_paired_lower_vs_graph': paired['r10_vs_graph']['bootstrap_95_percentile'][0] > 0}
    gate['passed'] = all(gate.values())
    cost = {'tokenizer_prompt_tokens': tokenizer['summed_prompt_tokens'],
            'tokenizer_elapsed_ms_sum': tokenizer['summed_elapsed_ms'],
            'generation_prompt_tokens': generation['known_prompt_tokens'],
            'generation_completion_tokens': generation['known_completion_tokens'],
            'generation_elapsed_ms_sum': generation['summed_elapsed_ms'],
            'generation_calls': generation['attempts']}
    result = {'schema_version': 'are.g01-exposed-r10-evaluation/v1',
              'pins': PINS, 'script_sha256': sha(Path(__file__).read_bytes()),
              'cohort': 'same 24 already-exposed r8 BugSwarm repositories',
              'candidate_reach': candidate_reach, 'aggregate': aggregate,
              'paired': paired, 'newly_reached_cases': new_cases,
              'cost': cost, 'gate': gate, 'cases': cases,
              'claim_ceiling': 'Exposed development only; no fresh or product superiority claim.'}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'candidate_reach': candidate_reach, 'aggregate': aggregate,
                      'paired': paired, 'newly_reached_cases': new_cases,
                      'cost': cost, 'gate': gate, 'evaluation_sha256': sha(data)}))


if __name__ == '__main__':
    main()
