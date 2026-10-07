#!/usr/bin/env python3
"""Independently seal all exposed r10 predictions before evaluator access."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import re


BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-confirm-r4')
RUN = BASE / 'exposed-r10/vps-run'
OUTPUT = BASE / 'exposed-r10/predictions'
PINS = {
    'packets': '631e04900738119551324d94a6116685c0dc6cfce33d96c19b25243d7488be44',
    'packet_seal': '40fe610aea20940cb5c40e7ef96baacbe6ce88729e8987c4a9ba2eaeead12f65',
    'run_freeze': '248eaa820d32c44f7611a3dbe1bdf792ce56614f1824003c9c367606cfe7bbc7',
    'run_result': 'ab3afe11cd2afce97a305896a82ff11b44a9469b7cac276577c7fdf40a6ae8f2',
    'tokenizer_result': '6f9c53049008e7507adf2dee7a228e20c4109ffbccce2fd0db7f44672650fed8',
    'graph_seal': '0ae5f79b60d96eacc1c8cbb84c88c274416686566c2a48156dd19c61aa6ef320',
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(ok: bool, reason: str) -> None:
    if not ok:
        raise SystemExit(reason)


def write_new(path: Path, data: bytes) -> None:
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)


def parse(content: str, packet: dict) -> list[int]:
    body = content.strip()
    fence = re.fullmatch(r'```json\r?\n([\s\S]*?)\r?\n```', body)
    if fence:
        body = fence.group(1)
    obj = json.loads(body)
    need(isinstance(obj, dict) and set(obj) == {'candidate_ids'} and
         isinstance(obj['candidate_ids'], list) and len(obj['candidate_ids']) <= 8,
         'selection-shape')
    by_path = {entry['path']: entry['candidate_id'] for entry in packet['candidates']}
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
        need(1 <= value <= packet['candidate_count'], 'selection-id-range')
        ids.append(value)
    need(len(set(ids)) == len(ids), 'selection-duplicate')
    return ids


def main() -> None:
    paths = {'packets': RUN / 'PACKETS.jsonl',
             'packet_seal': RUN / 'PACKET-SEAL.json',
             'run_freeze': RUN / 'RUN-FREEZE.json',
             'run_result': RUN / 'RUN-RESULT.json',
             'tokenizer_result': RUN / 'TOKENIZER-RESULT.json',
             'graph_seal': BASE / 'rankings-r6/graph/GRAPH-SEAL.json'}
    need(not OUTPUT.exists(), 'output-exists')
    for name, path in paths.items():
        need(sha(path.read_bytes()) == PINS[name], f'input-pin-drift:{name}')
    packets = [json.loads(line) for line in paths['packets'].read_text().splitlines()]
    seals = json.loads(paths['graph_seal'].read_bytes())['rankings']
    result = json.loads(paths['run_result'].read_bytes())
    freeze = json.loads(paths['run_freeze'].read_bytes())
    token_result = json.loads(paths['tokenizer_result'].read_bytes())
    need(len(packets) == len(seals) == 24 and
         result['status'] == 'complete' and result['attempts'] == 24 and
         result['transport_stopped'] is False and
         token_result['status'] == 'admitted' and token_result['admitted'] == 24 and
         freeze['packets_sha256'] == PINS['packets'], 'run-or-denominator-drift')
    rows, invalid = [], []
    prompt_tokens = completion_tokens = elapsed_ms = 0
    token_prompt_sum = token_elapsed_sum = 0
    for ordinal, (packet, seal) in enumerate(zip(packets, seals), 1):
        num = f'{ordinal:02d}'
        token_data = (RUN / f'TOKENIZER-{num}.json').read_bytes()
        call_data = (RUN / f'GENERATION-{num}.json').read_bytes()
        decision_data = (RUN / f'DECISION-{num}.json').read_bytes()
        token, call, decision = (json.loads(token_data), json.loads(call_data),
                                 json.loads(decision_data))
        graph_data = (BASE / f'rankings-r6/graph/GRAPH-RANKING-{num}.json').read_bytes()
        graph = json.loads(graph_data)
        need(packet['ordinal'] == seal['ordinal'] == token['ordinal'] ==
             call['ordinal'] == decision['ordinal'] == graph['ordinal'] == ordinal and
             packet['id'] == seal['id'] == token['id'] == call['id'] ==
             decision['id'] == graph['id'] and
             packet['base_commit'] == graph['base_commit'] and
             packet['graph_ranking_sha256'] == seal['ranking_sha256'] == sha(graph_data) and
             token['prompt_sha256'] == call['prompt_sha256'] == sha(packet['prompt'].encode()) and
             token['admitted'] is True and token['http_status'] == 200 and
             token['prompt_tokens'] + 512 <= 8192 and
             call['http_status'] == 200 and call['finish_reason'] == 'stop',
             f'identity-or-status:{ordinal}')
        usage = call['usage']
        need(isinstance(usage.get('prompt_tokens'), int) and
             isinstance(usage.get('completion_tokens'), int) and
             usage['prompt_tokens'] == token['prompt_tokens'], f'usage:{ordinal}')
        token_prompt_sum += token['prompt_tokens']
        token_elapsed_sum += token['elapsed_ms']
        prompt_tokens += usage['prompt_tokens']
        completion_tokens += usage['completion_tokens']
        elapsed_ms += call['elapsed_ms']
        content = call['provider_payload']['choices'][0]['message']['content']
        ids = None
        try:
            ids = parse(content, packet)
        except (ValueError, KeyError, TypeError):
            pass
        need(decision['listwise_valid'] == (ids is not None) and
             decision['selected_ids'] == ids, f'decision-reparse:{ordinal}')
        selected = [] if ids is None else [packet['candidates'][value - 1]['path'] for value in ids]
        need(decision['selected_paths'] == selected, f'selected-paths:{ordinal}')
        if ids is None:
            invalid.append(ordinal)
        ranked = selected + [path for path in graph['ranked_files'] if path not in set(selected)]
        need(len(ranked) == len(set(ranked)) == graph['candidate_count'] and
             set(ranked) == set(graph['ranked_files']), f'full-ranking:{ordinal}')
        rows.append({'schema_version': 'are.g01-exposed-r10-prediction/v1',
                     'ordinal': ordinal, 'id': packet['id'], 'repo': packet['repo'],
                     'language': packet['language'], 'base_commit': packet['base_commit'],
                     'graph_ranking_sha256': seal['ranking_sha256'],
                     'tokenizer_sha256': sha(token_data), 'call_sha256': sha(call_data),
                     'decision_sha256': sha(decision_data),
                     'valid': ids is not None, 'selected_ids': ids,
                     'ranked_files': ranked, 'candidate_count': len(ranked),
                     'gold_opened': False})
    need(prompt_tokens == result['known_prompt_tokens'] and
         completion_tokens == result['known_completion_tokens'] and
         elapsed_ms == result['summed_elapsed_ms'] and
         token_prompt_sum == token_result['summed_prompt_tokens'] and
         token_elapsed_sum == token_result['summed_elapsed_ms'] and
         24 - len(invalid) == result['valid_responses'], 'accounting-drift')
    OUTPUT.mkdir(parents=True, mode=0o700)
    data = ''.join(json.dumps(row, sort_keys=True) + '\n' for row in rows).encode()
    write_new(OUTPUT / 'PREDICTIONS.jsonl', data)
    seal = {'schema_version': 'are.g01-exposed-r10-prediction-seal/v1',
            'input_sha256': PINS, 'script_sha256': sha(Path(__file__).read_bytes()),
            'cases': 24, 'valid': 24 - len(invalid), 'invalid_ordinals': invalid,
            'known_prompt_tokens': prompt_tokens,
            'known_completion_tokens': completion_tokens,
            'summed_tokenizer_elapsed_ms': token_elapsed_sum,
            'summed_generation_elapsed_ms': elapsed_ms,
            'predictions_sha256': sha(data), 'gold_opened': False}
    encoded = (json.dumps(seal, sort_keys=True, indent=2) + '\n').encode()
    write_new(OUTPUT / 'PREDICTION-SEAL.json', encoded)
    print(json.dumps({'cases': 24, 'valid': seal['valid'],
                      'invalid_ordinals': invalid,
                      'predictions_sha256': sha(data), 'seal_sha256': sha(encoded)}))


if __name__ == '__main__':
    main()
