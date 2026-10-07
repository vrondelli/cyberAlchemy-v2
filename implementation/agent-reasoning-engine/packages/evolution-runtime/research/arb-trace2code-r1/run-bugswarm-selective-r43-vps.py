#!/usr/bin/env python3
"""VPS-only one-shot tokenizer and GLM generation for sealed r43 packets."""
from __future__ import annotations

import hashlib
import json
import os
import re
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path('/opt/are-benchmark-runs/g01-selective-entity-r43')
SECRET = Path('/opt/are-keld-presentation/secrets/model_api_key')
PINS = {
    'packets': '878e4f058a7d79a9cdd1eb1360f2ae8b3a1abf721de619071fdfce89c3d56492',
    'packet_seal': '1ac5b372ea4fb33f4cb68805b09fc386845b8e2f9b1b6911a528a7467631c790',
    'protocol': '927c69a06ed097afcd7868d65d6a4b7fb1df90dc26c85d8a65a7f25b68864e29',
}
MODEL = 'glm-5.3-flash'
TOKENIZER_URL = 'https://api.z.ai/api/paas/v4/tokenizer'
GENERATION_URL = 'https://api.z.ai/api/paas/v4/chat/completions'
MAX_RESPONSE_BYTES = 262_144
MAX_OUTPUT_TOKENS = 512
TOTAL_PROMPT_CAP = 220_000


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(condition: bool, reason: str) -> None:
    if not condition:
        raise SystemExit('g01-selective-r43.' + reason)


def encoded(value: object) -> bytes:
    return (json.dumps(value, sort_keys=True, indent=2) + '\n').encode()


def stable(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(',', ':')).encode()


def save(name: str, value: object) -> bytes:
    data = encoded(value)
    descriptor = os.open(ROOT / name, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'wb') as handle:
        handle.write(data)
    return data


def post(url: str, body: bytes, key: str, timeout: int) -> tuple[int | None, bytes, str | None]:
    request = Request(url, data=body, method='POST', headers={
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'ARE-G01-selective-r43/1',
    })
    try:
        with urlopen(request, timeout=timeout) as response:
            data = response.read(MAX_RESPONSE_BYTES + 1)
            if len(data) > MAX_RESPONSE_BYTES:
                return response.status, b'', 'response-too-large'
            return response.status, data, None
    except HTTPError as error:
        return error.code, error.read(min(MAX_RESPONSE_BYTES, 65_536)), 'http-error'
    except (URLError, TimeoutError, OSError) as error:
        return None, b'', type(error).__name__


def payload(data: bytes) -> dict | None:
    try:
        value = json.loads(data)
        return value if isinstance(value, dict) else None
    except (ValueError, UnicodeDecodeError):
        return None


def selection(content: object, packet: dict) -> list[int]:
    need(isinstance(content, str), 'selection-content')
    body = content.strip()
    fence = re.fullmatch(r'```json\r?\n([\s\S]*?)\r?\n```', body)
    if fence:
        body = fence.group(1)
    value = json.loads(body)
    need(isinstance(value, dict) and set(value) == {'candidate_ids'} and
         isinstance(value['candidate_ids'], list) and len(value['candidate_ids']) <= 8,
         'selection-shape')
    ids = []
    by_path = {item['path']: item['candidate_id'] for item in packet['candidates']}
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
    paths = {
        'packets': ROOT / 'PACKETS.jsonl',
        'packet_seal': ROOT / 'PACKET-SEAL.json',
        'protocol': ROOT / 'TREATMENT-PROTOCOL.md',
    }
    need(ROOT.is_dir() and not (ROOT / 'RUN-FREEZE.json').exists(), 'root-or-prior-run')
    need(all(sha(paths[name].read_bytes()) == digest for name, digest in PINS.items()), 'input-drift')
    packets = [json.loads(line) for line in paths['packets'].read_text().splitlines()]
    seal = json.loads(paths['packet_seal'].read_bytes())
    need(len(packets) == seal['packets'] == 23 and seal['packets_sha256'] == PINS['packets'], 'packet-denominator')
    for packet in packets:
        need(packet['candidate_count'] == len(packet['candidates']) <= 30 and
             packet['prompt_bytes'] == len(packet['prompt'].encode()) <= 24_000 and
             packet['gold_paths_read'] is False and packet['model_calls'] == 0 and
             [item['candidate_id'] for item in packet['candidates']] == list(range(1, packet['candidate_count'] + 1)),
             f"packet-shape-{packet.get('ordinal')}")
    key = SECRET.read_text().strip()
    need(8 <= len(key) <= 8192, 'secret-shape')
    save('RUN-FREEZE.json', {
        'schema_version': 'are.g01-selective-r43-run-freeze/v1',
        'packets_sha256': PINS['packets'],
        'packet_seal_sha256': PINS['packet_seal'],
        'protocol_sha256': PINS['protocol'],
        'runner_sha256': sha(Path(__file__).read_bytes()),
        'model': MODEL,
        'maximum_tokenizer_calls': 23,
        'maximum_generation_calls': 23,
        'maximum_output_tokens': MAX_OUTPUT_TOKENS,
        'reasoning_effort': 'low',
        'prompt_plus_reserve_limit': 8192,
        'total_prompt_cap': TOTAL_PROMPT_CAP,
        'automatic_retries': 0,
        'failure_policy': 'stop-no-retry',
        'gold_available': False,
    })

    token_rows = []
    token_sum = 0
    for packet in packets:
        body = stable({'model': MODEL, 'messages': [{'role': 'user', 'content': packet['prompt']}]})
        started = time.monotonic()
        status, raw, failure = post(TOKENIZER_URL, body, key, 30)
        document = payload(raw)
        elapsed = round((time.monotonic() - started) * 1000)
        tokens = document.get('usage', {}).get('prompt_tokens') if document else None
        if isinstance(tokens, int) and not isinstance(tokens, bool):
            token_sum += tokens
        else:
            tokens = None
        admitted = status == 200 and failure is None and tokens is not None and tokens + 512 <= 8192 and token_sum <= TOTAL_PROMPT_CAP
        row = {
            'schema_version': 'are.g01-selective-r43-tokenizer-case/v1',
            'ordinal': packet['ordinal'], 'id': packet['id'],
            'prompt_sha256': sha(packet['prompt'].encode()), 'request_sha256': sha(body),
            'response_sha256': sha(raw), 'http_status': status, 'failure_code': failure,
            'prompt_tokens': tokens, 'elapsed_ms': elapsed, 'admitted': admitted,
        }
        save(f"TOKENIZER-{packet['ordinal']:02d}.json", row)
        token_rows.append(row)
        print(json.dumps({'phase': 'tokenizer', 'ordinal': packet['ordinal'], 'status': status,
                          'tokens': tokens, 'admitted': admitted}), flush=True)
        if not admitted:
            break
    token_admitted = len(token_rows) == 23 and all(row['admitted'] for row in token_rows)
    save('TOKENIZER-RESULT.json', {
        'schema_version': 'are.g01-selective-r43-tokenizer-result/v1',
        'status': 'admitted' if token_admitted else 'not-admitted',
        'attempts': len(token_rows), 'admitted': sum(row['admitted'] for row in token_rows),
        'summed_prompt_tokens': token_sum,
        'maximum_prompt_tokens': max((row['prompt_tokens'] or 0 for row in token_rows), default=0),
        'summed_elapsed_ms': sum(row['elapsed_ms'] for row in token_rows),
        'packets_sha256': PINS['packets'],
    })
    if not token_admitted:
        raise SystemExit('g01-selective-r43.tokenizer-not-admitted')

    calls = valid = known_prompt = known_completion = elapsed_sum = 0
    stopped = False
    for packet in packets:
        body = stable({'model': MODEL, 'messages': [{'role': 'user', 'content': packet['prompt']}],
                       'stream': False, 'max_tokens': 512, 'reasoning_effort': 'low'})
        started = time.monotonic()
        status, raw, failure = post(GENERATION_URL, body, key, 120)
        document = payload(raw)
        elapsed = round((time.monotonic() - started) * 1000)
        choice = document.get('choices', [{}])[0] if document and document.get('choices') else {}
        usage = document.get('usage') if document else None
        call = {
            'schema_version': 'are.g01-selective-r43-call/v1',
            'ordinal': packet['ordinal'], 'id': packet['id'],
            'prompt_sha256': sha(packet['prompt'].encode()), 'request_sha256': sha(body),
            'response_sha256': sha(raw), 'http_status': status, 'failure_code': failure,
            'elapsed_ms': elapsed, 'finish_reason': choice.get('finish_reason'),
            'usage': usage, 'provider_payload': document,
        }
        save(f"GENERATION-{packet['ordinal']:02d}.json", call)
        calls += 1
        elapsed_sum += elapsed
        if isinstance(usage, dict) and isinstance(usage.get('prompt_tokens'), int):
            known_prompt += usage['prompt_tokens']
        if isinstance(usage, dict) and isinstance(usage.get('completion_tokens'), int):
            known_completion += usage['completion_tokens']
        if status != 200 or failure is not None or known_prompt > TOTAL_PROMPT_CAP:
            stopped = True
        ids = None
        error = None
        if status == 200 and choice.get('finish_reason') == 'stop':
            try:
                ids = selection(choice.get('message', {}).get('content'), packet)
                valid += 1
            except (ValueError, TypeError, json.JSONDecodeError, SystemExit) as exception:
                error = str(exception)[:160]
        else:
            error = 'provider-status-finish-or-content'
        selected_paths = [packet['candidates'][item - 1]['path'] for item in ids] if ids is not None else []
        save(f"DECISION-{packet['ordinal']:02d}.json", {
            'schema_version': 'are.g01-selective-r43-decision/v1',
            'ordinal': packet['ordinal'], 'id': packet['id'],
            'listwise_valid': ids is not None, 'listwise_error': error,
            'selected_ids': ids, 'selected_paths': selected_paths,
            'stopped_after_case': stopped,
        })
        print(json.dumps({'phase': 'generation', 'ordinal': packet['ordinal'], 'status': status,
                          'valid': ids is not None, 'prompt_tokens': usage.get('prompt_tokens') if isinstance(usage, dict) else None,
                          'completion_tokens': usage.get('completion_tokens') if isinstance(usage, dict) else None,
                          'stopped': stopped}), flush=True)
        if stopped:
            break
    result = {
        'schema_version': 'are.g01-selective-r43-run-result/v1',
        'status': 'complete' if calls == 23 and not stopped else 'terminal-failed',
        'attempts': calls, 'valid_responses': valid,
        'known_prompt_tokens': known_prompt, 'known_completion_tokens': known_completion,
        'summed_elapsed_ms': elapsed_sum, 'transport_stopped': stopped,
        'packets_sha256': PINS['packets'],
    }
    save('RUN-RESULT.json', result)
    print(json.dumps(result, sort_keys=True), flush=True)
    if result['status'] != 'complete':
        raise SystemExit('g01-selective-r43.generation-terminal-failed')


if __name__ == '__main__':
    main()
