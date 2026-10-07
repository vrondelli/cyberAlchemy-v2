#!/usr/bin/env python3
"""Reconstruct complete r8 rankings from source-only VPS receipts, before gold."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path


BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-dev-b-r2')
RUN = BASE / 'code-only/g01-bugswarm-graph-dev-b-r8'
GRAPH = BASE / 'code-only/graph-r2/GRAPH-RANKINGS-B-R3.jsonl'
OUTPUT = BASE / 'code-only/glm-predictions-r8'
PINS = {
    'packets': (RUN / 'PACKETS-B-R8.jsonl', '26e3b47e375bf309e1df4c92279e137f9d68b5ae9dcd5a9f5f9d9d0196527a4f'),
    'packet_seal': (RUN / 'PACKET-SEAL-B-R8.json', 'da390e2ef19987f93a79f2e126498023bb1130bc1ebdf85591811da455439980'),
    'tokenizer': (RUN / 'TOKENIZER-RESULT.json', '699fa8136a9eebc54d75f68b549f9985f8f9d0ae1ec1fd0649d3a88b8051bae1'),
    'generation_freeze': (RUN / 'GENERATION-FREEZE.json', '36f7dfb1c7224edba3d0ba7fb9d1f85a3c5b557779c190613bcdfa6e14668640'),
    'generation_result': (RUN / 'GENERATION-RESULT.json', '79fb7334d1d3463e1363c1137bb89dc84aa3911b7acb8c0883e4895d568ff240'),
    'graph_r2': (GRAPH, '86b39c47e9ce166d4db66068d5894f3e9cbac1275b11d549df1e17ee121cb32d'),
}


def sha(blob: bytes) -> str:
    return hashlib.sha256(blob).hexdigest()


def read_pinned() -> dict[str, bytes]:
    blobs = {}
    for name, (path, expected) in PINS.items():
        blob = path.read_bytes()
        if sha(blob) != expected:
            raise SystemExit(f'input-pin-drift:{name}')
        blobs[name] = blob
    return blobs


def read_receipt(name: str) -> tuple[dict, str]:
    blob = (RUN / name).read_bytes()
    return json.loads(blob), sha(blob)


def parse_ids(content: str, packet: dict) -> list[int]:
    obj = json.loads(content)
    if not isinstance(obj, dict) or set(obj) != {'candidate_ids'} or not isinstance(obj['candidate_ids'], list) or len(obj['candidate_ids']) > 8:
        raise ValueError('selection-shape')
    by_path = {c['path']: c['candidate_id'] for c in packet['candidates']}
    ids = []
    for item in obj['candidate_ids']:
        if type(item) is int:
            number = item
        elif isinstance(item, str) and item.isascii() and item.isdecimal() and item[0:1] != '0':
            number = int(item)
        elif isinstance(item, str) and item in by_path:
            number = by_path[item]
        else:
            raise ValueError('selection-value')
        if number < 1 or number > packet['candidate_count'] or number in ids:
            raise ValueError('selection-id')
        ids.append(number)
    return ids


def parse_choice(content: str) -> str:
    obj = json.loads(content)
    if not isinstance(obj, dict) or set(obj) != {'choice'} or obj['choice'] not in ('A', 'B'):
        raise ValueError('choice-shape')
    return obj['choice']


def save_new(path: Path, blob: bytes) -> None:
    with os.fdopen(os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600), 'wb') as stream:
        stream.write(blob)


def main() -> None:
    if OUTPUT.exists():
        raise SystemExit('output-exists')
    blobs = read_pinned()
    packets = [json.loads(line) for line in blobs['packets'].splitlines()]
    graph = [json.loads(line) for line in blobs['graph_r2'].splitlines()]
    seal = json.loads(blobs['packet_seal'])
    token = json.loads(blobs['tokenizer'])
    freeze = json.loads(blobs['generation_freeze'])
    result = json.loads(blobs['generation_result'])
    if (len(packets) != 24 or len(graph) != 24 or seal['packets_sha256'] != PINS['packets'][1] or
            token['status'] != 'admitted' or token['admitted'] != 24 or
            result['status'] != 'completed-valid-listwise' or result['listwise_valid'] != 24 or
            result['calls'] > 72 or result['known_prompt_tokens'] > 220000 or
            freeze['packets_sha256'] != PINS['packets'][1] or
            freeze['protocol_sha256'] != seal['protocol_sha256'] or
            seal['gold_opened'] or seal['reserved_confirmation_opened']):
        raise SystemExit('denominator-or-seal-drift')
    rows, receipts = [], []
    calls = pairwise_calls = pairwise_valid = prompt_tokens = completion_tokens = elapsed_ms = 0
    for ordinal, (packet, old) in enumerate(zip(packets, graph), 1):
        num = f'{ordinal:02d}'
        if (packet['ordinal'] != ordinal or old['ordinal'] != ordinal or packet['id'] != old['id'] or
                packet['base_commit'] != old['base_commit'] or
                packet['r2_ranking_sha256'] != PINS['graph_r2'][1]):
            raise SystemExit(f'identity-drift:{ordinal}')
        full = old['ranked_files']
        if len(full) != len(set(full)) or not {c['path'] for c in packet['candidates']}.issubset(full):
            raise SystemExit(f'coverage-drift:{ordinal}')
        r2_top = full[0]
        candidate_by_id = {c['candidate_id']: c for c in packet['candidates']}
        call, call_sha = read_receipt(f'GENERATION-{num}.json')
        decision, decision_sha = read_receipt(f'DECISION-{num}.json')
        content = call.get('provider_payload', {}).get('choices', [{}])[0].get('message', {}).get('content')
        if (call['ordinal'] != ordinal or call['http_status'] != 200 or call['finish_reason'] != 'stop' or
                call['prompt_sha256'] != sha(packet['prompt'].encode()) or not isinstance(content, str)):
            raise SystemExit(f'listwise-call-drift:{ordinal}')
        ids = parse_ids(content, packet)
        selected = [candidate_by_id[i]['path'] for i in ids]
        raw = selected + [p for p in full if p not in set(selected)]
        proposed = raw[0]
        if (decision['ordinal'] != ordinal or decision['id'] != packet['id'] or
                decision['selected_ids'] != ids or decision['selected_paths'] != selected or
                decision['r2_top_path'] != r2_top or decision['listwise_top_path'] != proposed or
                not decision['listwise_valid'] or decision['stopped_after_case']):
            raise SystemExit(f'decision-drift:{ordinal}')
        case_receipts = [{'file': f'GENERATION-{num}.json', 'sha256': call_sha},
                         {'file': f'DECISION-{num}.json', 'sha256': decision_sha}]
        usage = call['usage']
        if not all(type(usage.get(k)) is int and usage[k] >= 0 for k in ('prompt_tokens', 'completion_tokens')) or usage['completion_tokens'] > 512:
            raise SystemExit(f'usage-drift:{ordinal}')
        calls += 1
        prompt_tokens += usage['prompt_tokens']
        completion_tokens += usage['completion_tokens']
        elapsed_ms += call['elapsed_ms']
        pair_choices = []
        if proposed != r2_top:
            if len(decision['pairwise']) != 2:
                raise SystemExit(f'pairwise-denominator:{ordinal}')
            for order, first_path, second_path in (('AB', proposed, r2_top), ('BA', r2_top, proposed)):
                name = f'PAIRWISE-{num}-{order}.json'
                response, response_sha = read_receipt(name)
                detail = decision['pairwise'][len(pair_choices)]
                pcontent = response.get('provider_payload', {}).get('choices', [{}])[0].get('message', {}).get('content')
                if (response['ordinal'] != ordinal or response['kind'] != f'pairwise-{order}' or
                        response['http_status'] != 200 or response['finish_reason'] != 'stop' or
                        detail['order'] != order or detail['call_file'] != name or not isinstance(pcontent, str)):
                    raise SystemExit(f'pairwise-call-drift:{ordinal}:{order}')
                chosen = first_path if parse_choice(pcontent) == 'A' else second_path
                if detail['selected_path'] != chosen or detail['validation_error'] is not None:
                    raise SystemExit(f'pairwise-decision-drift:{ordinal}:{order}')
                pair_choices.append(chosen)
                case_receipts.append({'file': name, 'sha256': response_sha})
                usage = response['usage']
                if not all(type(usage.get(k)) is int and usage[k] >= 0 for k in ('prompt_tokens', 'completion_tokens')) or usage['completion_tokens'] > 512:
                    raise SystemExit(f'pairwise-usage-drift:{ordinal}:{order}')
                calls += 1
                pairwise_calls += 1
                pairwise_valid += 1
                prompt_tokens += usage['prompt_tokens']
                completion_tokens += usage['completion_tokens']
                elapsed_ms += response['elapsed_ms']
        elif decision['pairwise']:
            raise SystemExit(f'unexpected-pairwise:{ordinal}')
        promote = len(pair_choices) == 2 and all(p == proposed for p in pair_choices)
        guarded = raw if promote or proposed == r2_top else [r2_top] + [p for p in raw if p != r2_top]
        if (decision['guard_promotes'] != promote or decision['guarded_top_path'] != guarded[0] or
                len(raw) != len(full) or len(guarded) != len(full) or set(guarded) != set(full)):
            raise SystemExit(f'guard-drift:{ordinal}')
        rows.append({'schema_version': 'are.g01-bugswarm-graph-dev-b-r8-prediction/v1',
                     'ordinal': ordinal, 'id': packet['id'], 'repo': packet['repo'],
                     'language': packet['language'], 'base_commit': packet['base_commit'],
                     'selected_ids': ids, 'r2_top_path': r2_top, 'raw_listwise_ranked_files': raw,
                     'guarded_ranked_files': guarded, 'guard_promotes': promote,
                     'pairwise_choices': pair_choices, 'gold_opened': False,
                     'reserved_confirmation_opened': False})
        receipts.append({'ordinal': ordinal, 'files': case_receipts})
    if (calls != result['calls'] or pairwise_calls != result['pairwise_calls'] or
            pairwise_valid != result['pairwise_valid'] or
            prompt_tokens != result['known_prompt_tokens'] or
            completion_tokens != result['known_completion_tokens'] or
            elapsed_ms != result['summed_model_call_elapsed_ms']):
        raise SystemExit('generation-total-drift')
    OUTPUT.mkdir(mode=0o700)
    data = (''.join(json.dumps(row, sort_keys=True) + '\n' for row in rows)).encode()
    save_new(OUTPUT / 'PREDICTIONS-B-R8.jsonl', data)
    prediction_seal = {'schema_version': 'are.g01-bugswarm-graph-dev-b-r8-prediction-seal/v1',
                       'pins': {name: expected for name, (_, expected) in PINS.items()},
                       'script_sha256': sha(Path(__file__).read_bytes()),
                       'cases': len(rows), 'listwise_valid': len(rows),
                       'calls': calls, 'pairwise_calls': pairwise_calls,
                       'pairwise_valid': pairwise_valid, 'prompt_tokens': prompt_tokens,
                       'completion_tokens': completion_tokens, 'elapsed_ms': elapsed_ms,
                       'response_receipts': receipts, 'predictions_sha256': sha(data),
                       'gold_opened': False, 'reserved_confirmation_opened': False}
    sealed = (json.dumps(prediction_seal, sort_keys=True, indent=2) + '\n').encode()
    save_new(OUTPUT / 'PREDICTION-SEAL-B-R8.json', sealed)
    print(json.dumps({'cases': len(rows), 'calls': calls, 'pairwise_calls': pairwise_calls,
                      'prompt_tokens': prompt_tokens, 'predictions_sha256': sha(data),
                      'seal_sha256': sha(sealed)}))


if __name__ == '__main__':
    main()
