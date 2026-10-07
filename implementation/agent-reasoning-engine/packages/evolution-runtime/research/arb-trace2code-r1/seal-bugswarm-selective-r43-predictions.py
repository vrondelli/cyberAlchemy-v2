#!/usr/bin/env python3
"""Independently reparse and seal r43 predictions before evaluator scoring."""
from __future__ import annotations

import hashlib
import json
import os
import re
from pathlib import Path

BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/selective-r28')
RUN = BASE / 'entity-r43/vps-run'
GRAPH = BASE / 'rankings-r38/graph'
AUDIT = BASE / 'rankings-r38/R38-AUDIT.json'
OUTPUT = BASE / 'entity-r43/predictions'
PINS = {
    'packets': (RUN / 'PACKETS.jsonl', '878e4f058a7d79a9cdd1eb1360f2ae8b3a1abf721de619071fdfce89c3d56492'),
    'packet_seal': (RUN / 'PACKET-SEAL.json', '1ac5b372ea4fb33f4cb68805b09fc386845b8e2f9b1b6911a528a7467631c790'),
    'protocol': (RUN / 'TREATMENT-PROTOCOL.md', '927c69a06ed097afcd7868d65d6a4b7fb1df90dc26c85d8a65a7f25b68864e29'),
    'runner': (RUN / 'run-bugswarm-selective-r43-vps.py', 'c955ba2ffa2b2c5492ce825d8e09709df4f0b66c1ccba2108b40f328e51eb382'),
    'run_freeze': (RUN / 'RUN-FREEZE.json', '5345e58df81a33ae96e0a5dbaf7c260095f44d98b1cd5f078798154cb06ccd26'),
    'run_result': (RUN / 'RUN-RESULT.json', '1c18769b1ca08c77f7da05cb415e3b89974fa6e218c720a5d44558952144a61d'),
    'tokenizer_result': (RUN / 'TOKENIZER-RESULT.json', '959eaffdc194d05cf32c305685a5ac81a05ff6015cffe4102abfb923e57c7359'),
    'r38_audit': (AUDIT, 'ef02489f4b42a1363fee82af76a2c812a98ce595ae1ce621d0e8ea10c2dc68fe'),
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(condition: bool, reason: str) -> None:
    if not condition:
        raise SystemExit(reason)


def write_new(path: Path, data: bytes) -> None:
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'wb') as handle:
        handle.write(data)


def parse(content: object, packet: dict) -> list[int]:
    need(isinstance(content, str), 'content-type')
    body = content.strip()
    fence = re.fullmatch(r'```json\r?\n([\s\S]*?)\r?\n```', body)
    if fence:
        body = fence.group(1)
    value = json.loads(body)
    need(isinstance(value, dict) and set(value) == {'candidate_ids'} and
         isinstance(value['candidate_ids'], list) and len(value['candidate_ids']) <= 8,
         'selection-shape')
    by_path = {item['path']: item['candidate_id'] for item in packet['candidates']}
    ids = []
    for item in value['candidate_ids']:
        if isinstance(item, int) and not isinstance(item, bool):
            candidate_id = item
        elif isinstance(item, str) and re.fullmatch(r'[1-9][0-9]*', item):
            candidate_id = int(item)
        elif isinstance(item, str) and item in by_path:
            candidate_id = by_path[item]
        else:
            raise ValueError('selection-value')
        need(1 <= candidate_id <= packet['candidate_count'], 'selection-range')
        ids.append(candidate_id)
    need(len(ids) == len(set(ids)), 'selection-duplicate')
    return ids


def main() -> None:
    need(not OUTPUT.exists(), 'output-exists')
    need(all(sha(path.read_bytes()) == digest for path, digest in PINS.values()), 'input-drift')
    packets = [json.loads(line) for line in PINS['packets'][0].read_text().splitlines()]
    audit = json.loads(AUDIT.read_bytes())
    freeze = json.loads(PINS['run_freeze'][0].read_bytes())
    run_result = json.loads(PINS['run_result'][0].read_bytes())
    token_result = json.loads(PINS['tokenizer_result'][0].read_bytes())
    need(len(packets) == 23 and run_result['status'] == 'complete' and
         run_result['attempts'] == run_result['valid_responses'] == 23 and
         run_result['transport_stopped'] is False and
         token_result['status'] == 'admitted' and token_result['attempts'] == token_result['admitted'] == 23 and
         freeze['packets_sha256'] == PINS['packets'][1], 'run-denominator')

    rows = []
    prompt_total = completion_total = generation_ms = tokenizer_ms = 0
    for packet in packets:
        ordinal = packet['ordinal']
        prior = audit['rows'][ordinal - 1]
        graph_path = GRAPH / f'GRAPH-RANKING-{ordinal:02d}.json'
        token_path = RUN / f'TOKENIZER-{ordinal:02d}.json'
        call_path = RUN / f'GENERATION-{ordinal:02d}.json'
        decision_path = RUN / f'DECISION-{ordinal:02d}.json'
        graph_data, token_data, call_data, decision_data = (
            graph_path.read_bytes(), token_path.read_bytes(), call_path.read_bytes(), decision_path.read_bytes())
        graph, token, call, decision = map(json.loads, (graph_data, token_data, call_data, decision_data))
        need(packet['id'] == graph['id'] == token['id'] == call['id'] == decision['id'] == prior['id'] and
             packet['graph_ranking_sha256'] == sha(graph_data) == prior['graph_ranking_sha256'] and
             token['prompt_sha256'] == call['prompt_sha256'] == sha(packet['prompt'].encode()) and
             token['admitted'] is True and token['http_status'] == 200 and token['prompt_tokens'] + 512 <= 8192 and
             call['http_status'] == 200 and call['failure_code'] is None and call['finish_reason'] == 'stop',
             f'identity-status-{ordinal}')
        usage = call['usage']
        need(isinstance(usage, dict) and usage.get('prompt_tokens') == token['prompt_tokens'] and
             isinstance(usage.get('completion_tokens'), int), f'usage-{ordinal}')
        content = call['provider_payload']['choices'][0]['message']['content']
        ids = parse(content, packet)
        selected = [packet['candidates'][candidate_id - 1]['path'] for candidate_id in ids]
        need(decision['listwise_valid'] is True and decision['selected_ids'] == ids and
             decision['selected_paths'] == selected, f'decision-{ordinal}')
        selected_set = set(selected)
        ranked = selected + [path for path in graph['ranked_files'] if path not in selected_set]
        n = packet['candidate_count']
        need(len(ranked) == len(set(ranked)) == graph['candidate_count'] and
             set(ranked) == set(graph['ranked_files']) and
             set(ranked[:n]) == set(graph['ranked_files'][:n]), f'ranking-coverage-{ordinal}')
        rows.append({
            'schema_version': 'are.g01-selective-r43-prediction/v1',
            'ordinal': ordinal, 'id': packet['id'], 'repo': packet['repo'],
            'language': packet['language'], 'base_commit': packet['base_commit'],
            'graph_ranking_sha256': sha(graph_data),
            'tokenizer_sha256': sha(token_data), 'call_sha256': sha(call_data),
            'decision_sha256': sha(decision_data), 'valid': True,
            'selected_ids': ids, 'selected_paths': selected, 'ranked_files': ranked,
            'candidate_count': len(ranked), 'preserved_top_n': n,
            'top_n_set_preserved': True, 'gold_opened': False,
        })
        prompt_total += usage['prompt_tokens']
        completion_total += usage['completion_tokens']
        generation_ms += call['elapsed_ms']
        tokenizer_ms += token['elapsed_ms']
    need(prompt_total == run_result['known_prompt_tokens'] == token_result['summed_prompt_tokens'] and
         completion_total == run_result['known_completion_tokens'] and
         generation_ms == run_result['summed_elapsed_ms'] and
         tokenizer_ms == token_result['summed_elapsed_ms'], 'aggregate-accounting')
    output_data = ''.join(json.dumps(row, sort_keys=True) + '\n' for row in rows).encode()
    seal = {
        'schema_version': 'are.g01-selective-r43-prediction-seal/v1',
        'input_sha256': {name: digest for name, (_, digest) in PINS.items()},
        'script_sha256': sha(Path(__file__).read_bytes()),
        'cases': 23, 'valid': 23, 'top_n_set_preserved': 23,
        'known_prompt_tokens': prompt_total, 'known_completion_tokens': completion_total,
        'summed_tokenizer_elapsed_ms': tokenizer_ms,
        'summed_generation_elapsed_ms': generation_ms,
        'predictions_sha256': sha(output_data), 'gold_opened': False,
    }
    seal_data = (json.dumps(seal, sort_keys=True, indent=2) + '\n').encode()
    OUTPUT.mkdir(mode=0o700)
    write_new(OUTPUT / 'PREDICTIONS.jsonl', output_data)
    write_new(OUTPUT / 'PREDICTION-SEAL.json', seal_data)
    print(json.dumps({**seal, 'seal_sha256': sha(seal_data)}, sort_keys=True))


if __name__ == '__main__':
    main()
