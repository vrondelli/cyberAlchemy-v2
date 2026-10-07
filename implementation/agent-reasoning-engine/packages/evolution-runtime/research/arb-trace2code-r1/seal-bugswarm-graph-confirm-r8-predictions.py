#!/usr/bin/env python3
"""Independently seal 24 complete G01 rankings before evaluator labels."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import re


BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-confirm-r4')
VPS = BASE / 'vps-r8-generation'
OUTPUT = BASE / 'predictions-r8'
PINS = {
    'packets': 'f311bb898823756015e5a0cc4ea2d1918ed29f0cbabafcc283e13623188cd5b5',
    'packet_seal': '20b43fcb0d3d5de2ed17222848eb58f0d4298a5222a3eaff0c5ce48e07d9e682',
    'generation_result': '43e4e75b9b0db11855809bd01bfc7a4c124e88106b6b98320bc0ad335126e224',
    'generation_freeze': '283c877671c985e1f4a2e4ff4d3181027b180fb56b6a3eb10e8b0bb824d3678f',
    'graph_seal': '0ae5f79b60d96eacc1c8cbb84c88c274416686566c2a48156dd19c61aa6ef320',
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(condition: bool, reason: str) -> None:
    if not condition:
        raise SystemExit(reason)


def write_new(path: Path, data: bytes) -> None:
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)


def parse(content: str, packet: dict) -> list[int]:
    obj = json.loads(content)
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
    paths = {'packets': VPS / 'PACKETS.jsonl',
             'packet_seal': VPS / 'PACKET-SEAL.json',
             'generation_result': VPS / 'GENERATION-RESULT.json',
             'generation_freeze': VPS / 'GENERATION-FREEZE.json',
             'graph_seal': BASE / 'rankings-r6/graph/GRAPH-SEAL.json'}
    need(not OUTPUT.exists() and
         all(sha(path.read_bytes()) == PINS[name] for name, path in paths.items()),
         'output-exists-or-input-pin-drift')
    packets = [json.loads(line) for line in paths['packets'].read_text().splitlines()]
    seals = json.loads(paths['graph_seal'].read_bytes())['rankings']
    result = json.loads(paths['generation_result'].read_bytes())
    freeze = json.loads(paths['generation_freeze'].read_bytes())
    need(len(packets) == len(seals) == 24 and result['attempts'] == 24 and
         result['status'] == 'complete' and result['transport_stopped'] is False and
         freeze['packets_sha256'] == PINS['packets'], 'denominator-or-run-drift')
    rows = []
    invalid = []
    prompt_tokens = completion_tokens = elapsed_ms = 0
    for ordinal, (packet, seal) in enumerate(zip(packets, seals), 1):
        call_data = (VPS / f'GENERATION-{ordinal:02d}.json').read_bytes()
        decision_data = (VPS / f'DECISION-{ordinal:02d}.json').read_bytes()
        call, decision = json.loads(call_data), json.loads(decision_data)
        graph_data = (BASE / f'rankings-r6/graph/GRAPH-RANKING-{ordinal:02d}.json').read_bytes()
        graph = json.loads(graph_data)
        need(packet['ordinal'] == seal['ordinal'] == call['ordinal'] == decision['ordinal'] ==
             graph['ordinal'] == ordinal and
             packet['id'] == seal['id'] == call['id'] == decision['id'] == graph['id'] and
             packet['base_commit'] == graph['base_commit'] and
             packet['graph_ranking_sha256'] == seal['ranking_sha256'] == sha(graph_data) and
             call['prompt_sha256'] == sha(packet['prompt'].encode()) and
             call['http_status'] == 200 and call['finish_reason'] == 'stop',
             f'identity-or-provider-status-{ordinal}')
        usage = call['usage']
        need(isinstance(usage.get('prompt_tokens'), int) and
             isinstance(usage.get('completion_tokens'), int),
             f'usage-{ordinal}')
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
             decision['selected_ids'] == ids, f'decision-reparse-{ordinal}')
        selected = [] if ids is None else [packet['candidates'][value - 1]['path'] for value in ids]
        need(decision['selected_paths'] == selected, f'selected-paths-{ordinal}')
        if ids is None:
            invalid.append(ordinal)
        ranked = selected + [path for path in graph['ranked_files'] if path not in set(selected)]
        need(len(ranked) == len(set(ranked)) == graph['candidate_count'] and
             set(ranked) == set(graph['ranked_files']), f'full-ranking-{ordinal}')
        rows.append({'schema_version': 'are.g01-confirm-r8-prediction/v1',
                     'ordinal': ordinal, 'id': packet['id'], 'repo': packet['repo'],
                     'language': packet['language'], 'base_commit': packet['base_commit'],
                     'graph_ranking_sha256': seal['ranking_sha256'],
                     'call_sha256': sha(call_data), 'decision_sha256': sha(decision_data),
                     'valid': ids is not None, 'selected_ids': ids,
                     'ranked_files': ranked, 'candidate_count': len(ranked),
                     'gold_opened': False})
    need(prompt_tokens == result['known_prompt_tokens'] and
         completion_tokens == result['known_completion_tokens'] and
         elapsed_ms == result['summed_elapsed_ms'] and
         24 - len(invalid) == result['valid_responses'], 'run-accounting-drift')
    OUTPUT.mkdir(mode=0o700)
    data = ''.join(json.dumps(row, sort_keys=True) + '\n' for row in rows).encode()
    write_new(OUTPUT / 'PREDICTIONS.jsonl', data)
    seal = {'schema_version': 'are.g01-confirm-r8-prediction-seal/v1',
            'input_sha256': PINS, 'script_sha256': sha(Path(__file__).read_bytes()),
            'cases': 24, 'valid': 24 - len(invalid), 'invalid_ordinals': invalid,
            'known_prompt_tokens': prompt_tokens,
            'known_completion_tokens': completion_tokens,
            'summed_generation_elapsed_ms': elapsed_ms,
            'predictions_sha256': sha(data), 'gold_opened': False}
    encoded = (json.dumps(seal, sort_keys=True, indent=2) + '\n').encode()
    write_new(OUTPUT / 'PREDICTION-SEAL.json', encoded)
    print(json.dumps({'cases': 24, 'valid': seal['valid'],
                      'invalid_ordinals': invalid,
                      'predictions_sha256': sha(data), 'seal_sha256': sha(encoded)}))


if __name__ == '__main__':
    main()
