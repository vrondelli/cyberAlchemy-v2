#!/usr/bin/env python3
"""Independently seal fresh r22 predictions before evaluator gold access."""

import hashlib
import json
import os
from pathlib import Path
import re

BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/fresh-r11')
RUN = BASE / 'vps-r22'
GRAPH = BASE / 'rankings-r19/graph'
OUTPUT = BASE / 'predictions-r22'
PINS = {
    'packets': '9cf7490d6b21d34b58d0dbb75d1ab262caac061b773a75ab350b54a7291e149c',
    'packet_seal': 'f281f62b2073fa61932b4c1823a02445aac88e6edd748dd9d6eeac1e4d89d63f',
    'graph_seal': '44322041d7fb68fec12557d8b1341d54935a5bf42046130963d407eedf4fa2c4',
    'run_freeze': '7a6d7cb9c4de25af55d8c85ee1592e1f816b4f63c7cc1613e9e21a7631753188',
    'run_result': '2835fc19b8aa6fefa50dd5f49d2a998a9b1660328ccf6957f14342de0aac9d3a',
    'tokenizer_result': '94be6477fb5462e7c69cdd572eeb17afbca6e21ee86dc67828cd530a3ed95cfd',
}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def need(ok, reason):
    if not ok:
        raise SystemExit(reason)


def write_new(path, data):
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)


def parse(content, packet):
    body = content.strip()
    fence = re.fullmatch(r'```json\r?\n([\s\S]*?)\r?\n```', body)
    if fence:
        body = fence.group(1)
    obj = json.loads(body)
    need(isinstance(obj, dict) and set(obj) == {'candidate_ids'} and
         isinstance(obj['candidate_ids'], list) and len(obj['candidate_ids']) <= 8,
         'selection-shape')
    by_path = {c['path']: c['candidate_id'] for c in packet['candidates']}
    ids = []
    for item in obj['candidate_ids']:
        if isinstance(item, int) and not isinstance(item, bool):
            value = item
        elif isinstance(item, str) and re.fullmatch(r'[1-9][0-9]*', item):
            value = int(item)
        elif isinstance(item, str) and item in by_path:
            value = by_path[item]
        else:
            raise ValueError('selection-value')
        need(1 <= value <= packet['candidate_count'], 'selection-range')
        ids.append(value)
    need(len(set(ids)) == len(ids), 'selection-duplicate')
    return ids


def main():
    paths = {
        'packets': RUN / 'PACKETS.jsonl',
        'packet_seal': RUN / 'PACKET-SEAL.json',
        'graph_seal': GRAPH / 'GRAPH-SEAL.json',
        'run_freeze': RUN / 'RUN-FREEZE.json',
        'run_result': RUN / 'RUN-RESULT.json',
        'tokenizer_result': RUN / 'TOKENIZER-RESULT.json',
    }
    need(not OUTPUT.exists(), 'output-exists')
    for name, path in paths.items():
        need(sha(path.read_bytes()) == PINS[name], f'pin-drift:{name}')
    packets = [json.loads(line) for line in paths['packets'].read_text().splitlines()]
    seals = json.loads(paths['graph_seal'].read_bytes())['rankings']
    freeze = json.loads(paths['run_freeze'].read_bytes())
    result = json.loads(paths['run_result'].read_bytes())
    token_result = json.loads(paths['tokenizer_result'].read_bytes())
    need(len(packets) == len(seals) == 24 and
         freeze['packets_sha256'] == PINS['packets'] and
         result['status'] == 'complete' and result['attempts'] == 24 and
         not result['transport_stopped'] and
         token_result['status'] == 'admitted' and token_result['admitted'] == 24,
         'denominator-or-run-drift')
    rows = []
    prompt_total = completion_total = elapsed_total = token_elapsed_total = 0
    for ordinal, (packet, seal) in enumerate(zip(packets, seals), 1):
        num = f'{ordinal:02d}'
        token_data = (RUN / f'TOKENIZER-{num}.json').read_bytes()
        call_data = (RUN / f'GENERATION-{num}.json').read_bytes()
        decision_data = (RUN / f'DECISION-{num}.json').read_bytes()
        graph_data = (GRAPH / f'GRAPH-RANKING-{num}.json').read_bytes()
        token, call, decision, graph = map(json.loads,
                                            (token_data, call_data, decision_data, graph_data))
        need(packet['ordinal'] == seal['ordinal'] == token['ordinal'] ==
             call['ordinal'] == decision['ordinal'] == graph['ordinal'] == ordinal and
             packet['id'] == seal['id'] == token['id'] == call['id'] ==
             decision['id'] == graph['id'] and
             packet['repo'] == graph['repo'] and
             packet['base_commit'] == graph['base_commit'] and
             packet['graph_ranking_sha256'] == seal['ranking_sha256'] == sha(graph_data) and
             token['prompt_sha256'] == call['prompt_sha256'] ==
             sha(packet['prompt'].encode()) and
             token['admitted'] is True and token['http_status'] == 200 and
             token['prompt_tokens'] + 512 <= 8192 and
             call['http_status'] == 200 and call['finish_reason'] == 'stop',
             f'identity-or-status:{ordinal}')
        usage = call['usage']
        need(isinstance(usage.get('prompt_tokens'), int) and
             isinstance(usage.get('completion_tokens'), int) and
             usage['prompt_tokens'] == token['prompt_tokens'], f'usage:{ordinal}')
        content = call['provider_payload']['choices'][0]['message']['content']
        ids = parse(content, packet)
        selected = [packet['candidates'][value - 1]['path'] for value in ids]
        need(decision['listwise_valid'] is True and
             decision['selected_ids'] == ids and decision['selected_paths'] == selected,
             f'decision-reparse:{ordinal}')
        ranked = selected + [p for p in graph['ranked_files'] if p not in set(selected)]
        need(len(ranked) == len(set(ranked)) == graph['candidate_count'] and
             set(ranked) == set(graph['ranked_files']), f'full-ranking:{ordinal}')
        rows.append({'schema_version': 'are.g01-fresh-r22-prediction/v1',
                     'ordinal': ordinal, 'id': packet['id'], 'repo': packet['repo'],
                     'language': packet['language'], 'base_commit': packet['base_commit'],
                     'graph_ranking_sha256': sha(graph_data),
                     'tokenizer_sha256': sha(token_data), 'call_sha256': sha(call_data),
                     'decision_sha256': sha(decision_data), 'valid': True,
                     'selected_ids': ids, 'ranked_files': ranked,
                     'candidate_count': len(ranked), 'gold_opened': False})
        prompt_total += usage['prompt_tokens']
        completion_total += usage['completion_tokens']
        elapsed_total += call['elapsed_ms']
        token_elapsed_total += token['elapsed_ms']
    need(prompt_total == result['known_prompt_tokens'] == token_result['summed_prompt_tokens'] and
         completion_total == result['known_completion_tokens'] and
         elapsed_total == result['summed_elapsed_ms'] and
         token_elapsed_total == token_result['summed_elapsed_ms'] and
         result['valid_responses'] == 24, 'accounting-drift')
    data = ''.join(json.dumps(row, sort_keys=True) + '\n' for row in rows).encode()
    seal = {'schema_version': 'are.g01-fresh-r22-prediction-seal/v1',
            'input_sha256': PINS, 'script_sha256': sha(Path(__file__).read_bytes()),
            'cases': 24, 'valid': 24, 'known_prompt_tokens': prompt_total,
            'known_completion_tokens': completion_total,
            'summed_tokenizer_elapsed_ms': token_elapsed_total,
            'summed_generation_elapsed_ms': elapsed_total,
            'predictions_sha256': sha(data), 'gold_opened': False}
    encoded = (json.dumps(seal, sort_keys=True, indent=2) + '\n').encode()
    OUTPUT.mkdir(mode=0o700)
    write_new(OUTPUT / 'PREDICTIONS.jsonl', data)
    write_new(OUTPUT / 'PREDICTION-SEAL.json', encoded)
    print(json.dumps({'cases': 24, 'valid': 24,
                      'predictions_sha256': sha(data), 'seal_sha256': sha(encoded)}))


if __name__ == '__main__':
    main()
