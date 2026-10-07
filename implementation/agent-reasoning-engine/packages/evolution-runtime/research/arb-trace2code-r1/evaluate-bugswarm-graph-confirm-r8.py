#!/usr/bin/env python3
"""Evaluator-only matched G01 confirmation score under the frozen r8 gate."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import random


BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-confirm-r4')
OUTPUT = BASE / 'evaluator-only/EVALUATION-R8.json'
PINS = {
    'predictions': 'de79a4336d8e8830d027e037b492e816caac452c7a38e0b0edca941cb1b4c674',
    'prediction_seal': '63142b1acdcd2b7eba3b1a32e5e618ad77656de987c5adfd75b75561a9a8c4a3',
    'tree_labels': 'ac7afb30a2cc62432551cbecfdcf4bbac0186cf2098975c435fda8f981cc8469',
    'packets': 'f311bb898823756015e5a0cc4ea2d1918ed29f0cbabafcc283e13623188cd5b5',
    'are_seal': '45d73843608fdc5f43ceec2328fdfef9c2b41220f86d1d45fb20abb01ce3d736',
    'graph_seal': '0ae5f79b60d96eacc1c8cbb84c88c274416686566c2a48156dd19c61aa6ef320',
    'test_edge_seal': 'f2b2e8bf0d871875bb555c486ae866e3fd32050ba5ef0fe5848e21b3b96ec641',
    'generation_result': '43e4e75b9b0db11855809bd01bfc7a4c124e88106b6b98320bc0ad335126e224',
    'tokenizer_result': '34c4df063d5783f5dd6b15a2b565da16dc2a5148e91796a4a5804ce35918e930',
}
DRAWS = 20_000


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(condition: bool, reason: str) -> None:
    if not condition:
        raise SystemExit(reason)


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
    files = {
        'predictions': BASE / 'predictions-r8/PREDICTIONS.jsonl',
        'prediction_seal': BASE / 'predictions-r8/PREDICTION-SEAL.json',
        'tree_labels': BASE / 'evaluator-only/github-tree-r8/TREE-RESULT.json',
        'packets': BASE / 'packets-r8/PACKETS.jsonl',
        'are_seal': BASE / 'rankings-r6/are/ARE-SEAL.json',
        'graph_seal': BASE / 'rankings-r6/graph/GRAPH-SEAL.json',
        'test_edge_seal': BASE / 'rankings-r7/test-edges/TEST-EDGE-SEAL.json',
        'generation_result': BASE / 'vps-r8-generation/GENERATION-RESULT.json',
        'tokenizer_result': BASE / 'vps-r8-generation/TOKENIZER-RESULT.json',
    }
    need(not OUTPUT.exists() and
         all(sha(path.read_bytes()) == PINS[name] for name, path in files.items()),
         'output-or-input-pin-drift')
    predictions = [json.loads(line) for line in files['predictions'].read_text().splitlines()]
    packets = [json.loads(line) for line in files['packets'].read_text().splitlines()]
    labels = json.loads(files['tree_labels'].read_bytes())['results']
    pred_seal = json.loads(files['prediction_seal'].read_bytes())
    are_seals = json.loads(files['are_seal'].read_bytes())['rankings']
    graph_seals = json.loads(files['graph_seal'].read_bytes())['rankings']
    are_receipt = json.loads(files['are_seal'].read_bytes())
    graph_receipt = json.loads(files['graph_seal'].read_bytes())
    edge_receipt = json.loads(files['test_edge_seal'].read_bytes())
    generation = json.loads(files['generation_result'].read_bytes())
    tokenizer = json.loads(files['tokenizer_result'].read_bytes())
    need(all(len(rows) == 24 for rows in (predictions, packets, labels, are_seals, graph_seals)) and
         pred_seal['cases'] == 24 and pred_seal['predictions_sha256'] == PINS['predictions'] and
         generation['attempts'] == 24 and not generation['transport_stopped'] and
         tokenizer['attempts'] == tokenizer['admitted'] == 24,
         'denominator-or-run-drift')
    cases = []
    candidate_reach = 0
    deltas = {'raw_vs_are': [], 'raw_vs_graph': []}
    for ordinal, (pred, packet, label, are_seal, graph_seal) in enumerate(zip(
            predictions, packets, labels, are_seals, graph_seals), 1):
        a_path = BASE / f'rankings-r6/are/ARE-RANKING-{ordinal:02d}.json'
        g_path = BASE / f'rankings-r6/graph/GRAPH-RANKING-{ordinal:02d}.json'
        a_data, g_data = a_path.read_bytes(), g_path.read_bytes()
        a, g = json.loads(a_data), json.loads(g_data)
        need(all(row['ordinal'] == ordinal for row in (pred, packet, label, a, g,
              are_seal, graph_seal)) and
             pred['id'] == packet['id'] == label['id'] == a['id'] == g['id'] and
             pred['repo'] == packet['repo'] == label['repo'] == a['repo'] == g['repo'] and
             pred['base_commit'] == packet['base_commit'] == label['failed_sha'] == a['base_commit'] == g['base_commit'] and
             sha(a_data) == are_seal['ranking_sha256'] and
             sha(g_data) == graph_seal['ranking_sha256'] == pred['graph_ranking_sha256'] and
             label['complete_tree'] and label['direct_changed_old_source_paths'] and
             not pred['gold_opened'], f'identity-or-label-{ordinal}')
        gold = set(label['direct_changed_old_source_paths'])
        full = a['ranked_files']
        need(len(full) == len(set(full)) == len(g['ranked_files']) == len(pred['ranked_files']) and
             set(full) == set(g['ranked_files']) == set(pred['ranked_files']) and
             gold.issubset(full), f'coverage-{ordinal}')
        reach = int(bool(gold.intersection(c['path'] for c in packet['candidates'])))
        candidate_reach += reach
        metrics = {'are': metric(full, gold),
                   'graph': metric(g['ranked_files'], gold),
                   'raw': metric(pred['ranked_files'], gold)}
        deltas['raw_vs_are'].append(metrics['raw']['rr8'] - metrics['are']['rr8'])
        deltas['raw_vs_graph'].append(metrics['raw']['rr8'] - metrics['graph']['rr8'])
        cases.append({'ordinal': ordinal, 'id': pred['id'], 'repo': pred['repo'],
                      'gold_paths': sorted(gold), 'listwise_valid': pred['valid'],
                      'candidate_reach': reach, **metrics})
    aggregate = {arm: {'mrr8': sum(c[arm]['rr8'] for c in cases) / 24,
                       'hit3': sum(c[arm]['hit3'] for c in cases),
                       'reach30': sum(c[arm]['reach30'] for c in cases),
                       'rank1': sum(c[arm]['rank1'] for c in cases)}
                 for arm in ('are', 'graph', 'raw')}
    paired = {name: {'delta_mrr8': sum(values) / 24,
                     'bootstrap_95_percentile': interval(values, int(PINS['predictions'][:8], 16)),
                     'wins': sum(value > 0 for value in values),
                     'ties': sum(value == 0 for value in values),
                     'losses': sum(value < 0 for value in values)}
              for name, values in deltas.items()}
    token_elapsed = sum(json.loads((BASE / f'vps-r8-generation/TOKENIZER-{i:02d}.json').read_bytes())['elapsed_ms']
                        for i in range(1, 25))
    cost = {'tokenizer_prompt_tokens': tokenizer['summed_prompt_tokens'],
            'tokenizer_elapsed_ms_sum': token_elapsed,
            'generation_prompt_tokens': generation['known_prompt_tokens'],
            'generation_completion_tokens': generation['known_completion_tokens'],
            'generation_elapsed_ms_sum': generation['summed_elapsed_ms'],
            'generation_calls': generation['attempts'],
            'are_ranker_elapsed_ms_sum': sum(row['ranker_elapsed_ms'] for row in are_receipt['rankings']),
            'graph_ranker_elapsed_ms_sum': sum(row['ranker_elapsed_ms'] for row in graph_receipt['rankings']),
            'test_edge_incremental_elapsed_ms_sum': edge_receipt['incremental_elapsed_ms_sum']}
    gate = {'tokenizer_valid_24': tokenizer['admitted'] == 24,
            'listwise_valid_24': pred_seal['valid'] == 24,
            'no_transport_failure': not generation['transport_stopped'] and generation['attempts'] == 24,
            'complete_authenticated_tree_labels': len(labels) == 24 and all(r['complete_tree'] for r in labels),
            'candidate_reach_at_least_20': candidate_reach >= 20,
            'raw_mrr_at_least_graph_plus_0_10': aggregate['raw']['mrr8'] >= aggregate['graph']['mrr8'] + 0.10,
            'raw_wins_at_least_16_vs_are': paired['raw_vs_are']['wins'] >= 16,
            'positive_paired_lower_vs_are': paired['raw_vs_are']['bootstrap_95_percentile'][0] > 0,
            'positive_paired_lower_vs_graph': paired['raw_vs_graph']['bootstrap_95_percentile'][0] > 0}
    gate['passed'] = all(gate.values())
    result = {'schema_version': 'are.g01-confirm-r8-evaluation/v1',
              'pins': PINS, 'script_sha256': sha(Path(__file__).read_bytes()),
              'cohort': '24 availability-selected, repaired, repository-disjoint BugSwarm cases',
              'gold_rule': 'exact failed-source Git blob versus complete authenticated passing Git tree; non-test old source paths',
              'candidate_reach': candidate_reach, 'aggregate': aggregate,
              'paired': paired, 'cost': cost, 'gate': gate, 'cases': cases,
              'claim_ceiling': 'A failed conjunctive gate forbids this confirmation claim; no ContextBench or broad ARE superiority.'}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'candidate_reach': candidate_reach, 'aggregate': aggregate,
                      'paired': paired, 'cost': cost, 'gate': gate,
                      'evaluation_sha256': sha(data)}))


if __name__ == '__main__':
    main()
