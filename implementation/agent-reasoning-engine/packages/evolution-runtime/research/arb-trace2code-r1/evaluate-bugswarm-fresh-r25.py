#!/usr/bin/env python3
"""Score fresh G01 r22 sealed predictions against r24 direct Git-tree labels."""

import hashlib
import json
import os
from pathlib import Path
import random

BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/fresh-r11')
OUTPUT = BASE / 'evaluator-only/EVALUATION-R25.json'
PINS = {
    'predictions': '5d4654f81e7266e915e857b52a27df06881af92981b707fa819257d85c05d49b',
    'prediction_seal': '314cbd80eebf3ea5ca4ab50652802927046a3efbedb918befd2fa0c11b09ed0c',
    'tree_labels': '5c44b28a6c5e4defa6afdaa605f694653cb7cd25b5ab8df3468445b0a25676d2',
    'packets': '9cf7490d6b21d34b58d0dbb75d1ab262caac061b773a75ab350b54a7291e149c',
    'are_seal': '6fc4500437744b71dd1ac16921b1bbc22df370e68f2b1b82b97a6e9518d57918',
    'graph_seal': '44322041d7fb68fec12557d8b1341d54935a5bf42046130963d407eedf4fa2c4',
    'generation_result': '2835fc19b8aa6fefa50dd5f49d2a998a9b1660328ccf6957f14342de0aac9d3a',
    'tokenizer_result': '94be6477fb5462e7c69cdd572eeb17afbca6e21ee86dc67828cd530a3ed95cfd',
}
DRAWS = 20_000


def sha(data):
    return hashlib.sha256(data).hexdigest()


def need(ok, reason):
    if not ok:
        raise SystemExit(reason)


def metric(ranking, gold):
    rank = next((n for n, path in enumerate(ranking[:8], 1) if path in gold), None)
    return {'rr8': 1 / rank if rank else 0.0,
            'hit3': int(bool(gold.intersection(ranking[:3]))),
            'reach30': int(bool(gold.intersection(ranking[:30]))),
            'rank1': int(ranking[0] in gold)}


def interval(values, seed):
    rng = random.Random(seed)
    draws = sorted(sum(values[rng.randrange(24)] for _ in range(24)) / 24
                   for _ in range(DRAWS))
    return [draws[int((DRAWS - 1) * 0.025)], draws[int((DRAWS - 1) * 0.975)]]


def main():
    files = {
        'predictions': BASE / 'predictions-r22/PREDICTIONS.jsonl',
        'prediction_seal': BASE / 'predictions-r22/PREDICTION-SEAL.json',
        'tree_labels': BASE / 'evaluator-only/github-tree-r24/TREE-RESULT.json',
        'packets': BASE / 'vps-r22/PACKETS.jsonl',
        'are_seal': BASE / 'rankings-r19/are/ARE-SEAL.json',
        'graph_seal': BASE / 'rankings-r19/graph/GRAPH-SEAL.json',
        'generation_result': BASE / 'vps-r22/RUN-RESULT.json',
        'tokenizer_result': BASE / 'vps-r22/TOKENIZER-RESULT.json',
    }
    need(not OUTPUT.exists() and
         all(sha(path.read_bytes()) == PINS[name] for name, path in files.items()),
         'output-or-input-pin-drift')
    predictions = [json.loads(line) for line in files['predictions'].read_text().splitlines()]
    packets = [json.loads(line) for line in files['packets'].read_text().splitlines()]
    labels = json.loads(files['tree_labels'].read_bytes())['results']
    pred_seal = json.loads(files['prediction_seal'].read_bytes())
    are_receipt = json.loads(files['are_seal'].read_bytes())
    graph_receipt = json.loads(files['graph_seal'].read_bytes())
    are_seals, graph_seals = are_receipt['rankings'], graph_receipt['rankings']
    generation = json.loads(files['generation_result'].read_bytes())
    tokenizer = json.loads(files['tokenizer_result'].read_bytes())
    need(all(len(rows) == 24 for rows in (predictions, packets, labels, are_seals, graph_seals)) and
         pred_seal['cases'] == pred_seal['valid'] == 24 and
         pred_seal['predictions_sha256'] == PINS['predictions'] and
         generation['status'] == 'complete' and generation['attempts'] == 24 and
         not generation['transport_stopped'] and
         tokenizer['attempts'] == tokenizer['admitted'] == 24,
         'denominator-or-run-drift')
    cases = []
    candidate_reach = 0
    deltas = {'raw_vs_are': [], 'raw_vs_graph': []}
    for ordinal, (pred, packet, label, are_seal, graph_seal) in enumerate(zip(
            predictions, packets, labels, are_seals, graph_seals), 1):
        a_path = BASE / f'rankings-r19/are/ARE-RANKING-{ordinal:02d}.json'
        g_path = BASE / f'rankings-r19/graph/GRAPH-RANKING-{ordinal:02d}.json'
        a_data, g_data = a_path.read_bytes(), g_path.read_bytes()
        a, g = json.loads(a_data), json.loads(g_data)
        need(all(row['ordinal'] == ordinal for row in (pred, packet, label, a, g,
              are_seal, graph_seal)) and
             pred['id'] == packet['id'] == label['id'] == a['id'] == g['id'] and
             pred['repo'] == packet['repo'] == label['repo'] == a['repo'] == g['repo'] and
             pred['base_commit'] == packet['base_commit'] == label['failed_sha'] ==
             a['base_commit'] == g['base_commit'] and
             sha(a_data) == are_seal['ranking_sha256'] and
             sha(g_data) == graph_seal['ranking_sha256'] == pred['graph_ranking_sha256'] and
             label['complete_tree'] and label['direct_changed_old_source_paths'] and
             not pred['gold_opened'], f'identity-or-label-{ordinal}')
        gold = set(label['direct_changed_old_source_paths'])
        full = a['ranked_files']
        need(len(full) == len(set(full)) == len(g['ranked_files']) ==
             len(pred['ranked_files']) and
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
    cost = {'tokenizer_prompt_tokens': tokenizer['summed_prompt_tokens'],
            'tokenizer_elapsed_ms_sum': pred_seal['summed_tokenizer_elapsed_ms'],
            'generation_prompt_tokens': generation['known_prompt_tokens'],
            'generation_completion_tokens': generation['known_completion_tokens'],
            'generation_elapsed_ms_sum': generation['summed_elapsed_ms'],
            'generation_calls': generation['attempts'],
            'are_ranker_elapsed_ms_sum': sum(row['ranker_elapsed_ms'] for row in are_seals),
            'graph_ranker_elapsed_ms_sum': sum(row['ranker_elapsed_ms'] for row in graph_seals)}
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
    result = {'schema_version': 'are.g01-fresh-r25-evaluation/v1',
              'pins': PINS, 'script_sha256': sha(Path(__file__).read_bytes()),
              'cohort': '24 score-blind availability-selected repository-disjoint BugSwarm cases',
              'gold_rule': 'exact failed-source Git blob versus complete authenticated passing Git tree; non-test old source paths',
              'compare_file_list_disagreements': sum(not r['exact_source_path_set_matched'] for r in labels),
              'candidate_reach': candidate_reach, 'aggregate': aggregate,
              'paired': paired, 'cost': cost, 'gate': gate, 'cases': cases,
              'claim_ceiling': 'Only a bounded BugSwarm 8K file-localization accuracy comparison if the gate passes and Vlad/Dave approve; no broad ARE superiority.'}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'candidate_reach': candidate_reach, 'aggregate': aggregate,
                      'paired': paired, 'cost': cost, 'gate': gate,
                      'evaluation_sha256': sha(data)}))


if __name__ == '__main__':
    main()
