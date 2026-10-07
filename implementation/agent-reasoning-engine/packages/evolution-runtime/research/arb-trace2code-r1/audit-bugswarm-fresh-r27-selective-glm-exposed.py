#!/usr/bin/env python3
"""Post-hoc exposed simulation of a source-only top-1 consensus GLM gate."""

import hashlib
import json
import os
from pathlib import Path
import random

BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/fresh-r11')
OUTPUT = BASE / 'evaluator-only/SELECTIVE-GLM-AUDIT-R27.json'
EVALUATION = BASE / 'evaluator-only/EVALUATION-R25.json'
ARE_SEAL = BASE / 'rankings-r19/are/ARE-SEAL.json'
GRAPH_SEAL = BASE / 'rankings-r19/graph/GRAPH-SEAL.json'
RUN_RESULT = BASE / 'vps-r22/RUN-RESULT.json'
TOKENIZER_RESULT = BASE / 'vps-r22/TOKENIZER-RESULT.json'
PINS = {
    EVALUATION: '5961a29f400a2924f79791a9e833c0886e9d12b96fd85d1bcf0fcb431d1ac9f3',
    ARE_SEAL: '6fc4500437744b71dd1ac16921b1bbc22df370e68f2b1b82b97a6e9518d57918',
    GRAPH_SEAL: '44322041d7fb68fec12557d8b1341d54935a5bf42046130963d407eedf4fa2c4',
    RUN_RESULT: '2835fc19b8aa6fefa50dd5f49d2a998a9b1660328ccf6957f14342de0aac9d3a',
    TOKENIZER_RESULT: '94be6477fb5462e7c69cdd572eeb17afbca6e21ee86dc67828cd530a3ed95cfd',
}
DRAWS = 20_000
SEED = int('5d4654f8', 16)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def need(condition, why):
    if not condition:
        raise SystemExit(why)


def interval(values):
    rng = random.Random(SEED)
    draws = sorted(sum(values[rng.randrange(24)] for _ in range(24)) / 24
                   for _ in range(DRAWS))
    return [draws[int((DRAWS - 1) * 0.025)],
            draws[int((DRAWS - 1) * 0.975)]]


def paired(values):
    return {'delta_mrr8': sum(values) / 24,
            'bootstrap_95_percentile': interval(values),
            'wins': sum(value > 0 for value in values),
            'ties': sum(value == 0 for value in values),
            'losses': sum(value < 0 for value in values)}


def main():
    need(not OUTPUT.exists() and all(sha(path) == pin for path, pin in PINS.items()),
         'output-or-input-pin-drift')
    evaluation = json.loads(EVALUATION.read_bytes())
    are_seal = json.loads(ARE_SEAL.read_bytes())['rankings']
    graph_seal = json.loads(GRAPH_SEAL.read_bytes())['rankings']
    run = json.loads(RUN_RESULT.read_bytes())
    tokenizer = json.loads(TOKENIZER_RESULT.read_bytes())
    need(len(evaluation['cases']) == len(are_seal) == len(graph_seal) == 24 and
         run['attempts'] == run['valid_responses'] == 24 and
         tokenizer['attempts'] == tokenizer['admitted'] == 24,
         'denominator-drift')
    rows = []
    all_generation = {'prompt': 0, 'completion': 0, 'elapsed_ms': 0}
    all_tokenizer = {'prompt': 0, 'elapsed_ms': 0}
    for ordinal, (case, a_seal, g_seal) in enumerate(zip(
            evaluation['cases'], are_seal, graph_seal), 1):
        are_path = BASE / f'rankings-r19/are/ARE-RANKING-{ordinal:02d}.json'
        graph_path = BASE / f'rankings-r19/graph/GRAPH-RANKING-{ordinal:02d}.json'
        generation_path = BASE / f'vps-r22/GENERATION-{ordinal:02d}.json'
        tokenizer_path = BASE / f'vps-r22/TOKENIZER-{ordinal:02d}.json'
        need(sha(are_path) == a_seal['ranking_sha256'] and
             sha(graph_path) == g_seal['ranking_sha256'], f'ranking-pin:{ordinal}')
        are = json.loads(are_path.read_bytes())
        graph = json.loads(graph_path.read_bytes())
        generation = json.loads(generation_path.read_bytes())
        token = json.loads(tokenizer_path.read_bytes())
        need(all(row['ordinal'] == ordinal for row in
                 (case, are, graph, generation, token, a_seal, g_seal)) and
             case['id'] == are['id'] == graph['id'] == generation['id'] == token['id'],
             f'identity:{ordinal}')
        usage = generation['usage']
        all_generation['prompt'] += usage['prompt_tokens']
        all_generation['completion'] += usage['completion_tokens']
        all_generation['elapsed_ms'] += generation['elapsed_ms']
        all_tokenizer['prompt'] += token['prompt_tokens']
        all_tokenizer['elapsed_ms'] += token['elapsed_ms']
        skip = are['ranked_files'][0] == graph['ranked_files'][0]
        selected_rr = case['graph']['rr8'] if skip else case['raw']['rr8']
        rows.append({'ordinal': ordinal, 'id': case['id'], 'repo': case['repo'],
                     'top1_consensus': skip,
                     'action': 'use-graph-without-glm' if skip else 'use-glm',
                     'are_rr8': case['are']['rr8'], 'graph_rr8': case['graph']['rr8'],
                     'always_glm_rr8': case['raw']['rr8'], 'selective_rr8': selected_rr,
                     'generation_prompt_tokens_avoided': usage['prompt_tokens'] if skip else 0,
                     'generation_completion_tokens_avoided': usage['completion_tokens'] if skip else 0,
                     'generation_elapsed_ms_avoided': generation['elapsed_ms'] if skip else 0,
                     'tokenizer_prompt_tokens_avoided': token['prompt_tokens'] if skip else 0,
                     'tokenizer_elapsed_ms_avoided': token['elapsed_ms'] if skip else 0})
    need(all_generation == {'prompt': run['known_prompt_tokens'],
                            'completion': run['known_completion_tokens'],
                            'elapsed_ms': run['summed_elapsed_ms']} and
         all_tokenizer == {'prompt': tokenizer['summed_prompt_tokens'],
                           'elapsed_ms': tokenizer['summed_elapsed_ms']},
         'cost-reconciliation')
    selective = [row['selective_rr8'] for row in rows]
    always = [row['always_glm_rr8'] for row in rows]
    graph = [row['graph_rr8'] for row in rows]
    are = [row['are_rr8'] for row in rows]
    avoided = {key: sum(row[key] for row in rows) for key in (
        'generation_prompt_tokens_avoided', 'generation_completion_tokens_avoided',
        'generation_elapsed_ms_avoided', 'tokenizer_prompt_tokens_avoided',
        'tokenizer_elapsed_ms_avoided')}
    calls = sum(not row['top1_consensus'] for row in rows)
    result = {
        'schema_version': 'are.g01-fresh-r27-selective-glm-exposed-audit/v1',
        'posture': 'post-hoc exposed simulation; hypothesis generation only',
        'policy': 'Call GLM iff unchanged ARE and graph-r2 top-1 paths differ; otherwise use graph-r2 ranking.',
        'input_sha256': {str(path): pin for path, pin in PINS.items()},
        'script_sha256': sha(Path(__file__)), 'cases': 24,
        'glm_calls': calls, 'glm_calls_avoided': 24 - calls,
        'aggregate': {'are_mrr8': sum(are) / 24, 'graph_mrr8': sum(graph) / 24,
                      'always_glm_mrr8': sum(always) / 24,
                      'selective_mrr8': sum(selective) / 24,
                      'selective_minus_always_glm': (sum(selective) - sum(always)) / 24},
        'paired': {'selective_vs_are': paired([x - y for x, y in zip(selective, are)]),
                   'selective_vs_graph': paired([x - y for x, y in zip(selective, graph)]),
                   'selective_vs_always_glm': paired([x - y for x, y in zip(selective, always)])},
        'observed_avoided_cost': avoided, 'rows': rows,
        'claim_ceiling': 'Exposed post-hoc efficiency hypothesis only; not a fresh accuracy, cost, or superiority result.'}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'glm_calls': calls, 'aggregate': result['aggregate'],
                      'paired': result['paired'], 'avoided': avoided,
                      'receipt_sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
