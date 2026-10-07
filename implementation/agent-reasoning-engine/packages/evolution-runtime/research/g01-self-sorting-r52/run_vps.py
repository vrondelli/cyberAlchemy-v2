#!/usr/bin/env python3
"""Run sealed r52 Self-Sorting selector calls on the private VPS."""

from __future__ import annotations

import hashlib
import json
import os
import re
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


ROOT = Path('/opt/are-benchmark-runs/g01-self-sorting-r52')
SECRET = Path('/opt/are-keld-presentation/secrets/model_api_key')
MODEL = 'glm-5.3-flash'
TOKENIZER_URL = 'https://api.z.ai/api/paas/v4/tokenizer'
GENERATION_URL = 'https://api.z.ai/api/paas/v4/chat/completions'
PACKETS = 71
MAX_RESPONSE_BYTES = 131_072
TOTAL_PROMPT_CAP = 150_000


def stable(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(',', ':')).encode()


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(ok: bool, why: str) -> None:
    if not ok:
        raise SystemExit('g01-r52.' + why)


def save(name: str, value: object) -> None:
    descriptor = os.open(ROOT / name, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'wb') as handle:
        handle.write((json.dumps(value, sort_keys=True, indent=2) + '\n').encode())


def post(url: str, body: bytes, key: str, timeout: int):
    request = Request(url, data=body, method='POST', headers={
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json', 'Accept': 'application/json',
        'User-Agent': 'ARE-G01-r52/1',
    })
    try:
        with urlopen(request, timeout=timeout) as response:
            data = response.read(MAX_RESPONSE_BYTES + 1)
            return response.status, data, None if len(data) <= MAX_RESPONSE_BYTES else 'response-too-large'
    except HTTPError as error:
        return error.code, error.read(min(MAX_RESPONSE_BYTES, 65_536)), 'http-error'
    except (URLError, TimeoutError, OSError) as error:
        return None, b'', type(error).__name__


def document(raw: bytes):
    try:
        value = json.loads(raw)
        return value if isinstance(value, dict) else None
    except (ValueError, UnicodeDecodeError):
        return None


def parse_selection(content: object) -> list[int]:
    need(isinstance(content, str), 'selection-content')
    body = content.strip()
    fence = re.fullmatch(r'```json\r?\n([\s\S]*?)\r?\n```', body)
    if fence:
        body = fence.group(1)
    value = json.loads(body)
    need(isinstance(value, dict) and set(value) == {'list_ids'}, 'selection-shape')
    values = value['list_ids']
    need(isinstance(values, list) and len(values) == 4, 'selection-denominator')
    ids = []
    for item in values:
        if isinstance(item, int) and not isinstance(item, bool):
            ids.append(item)
        elif isinstance(item, str) and re.fullmatch(r'[1-4]', item):
            ids.append(int(item))
        else:
            raise ValueError('selection-value')
    need(sorted(ids) == [1, 2, 3, 4], 'selection-permutation')
    return ids


def main() -> None:
    packet_path = ROOT / 'PACKETS.jsonl'
    freeze_path = ROOT / 'PACKET-FREEZE.json'
    protocol_path = ROOT / 'PROTOCOL.md'
    need(ROOT.is_dir() and not (ROOT / 'RUN-FREEZE.json').exists(), 'root-prior-state')
    freeze = json.loads(freeze_path.read_text())
    need(freeze['packets'] == PACKETS and freeze['packets_sha256'] == sha(packet_path.read_bytes()) and
         freeze['protocol_sha256'] == sha(protocol_path.read_bytes()), 'input-integrity')
    packets = [json.loads(line) for line in packet_path.read_text().splitlines() if line.strip()]
    need(len(packets) == PACKETS, 'packet-denominator')
    for packet in packets:
        need(packet['prompt_bytes'] == len(packet['prompt'].encode()) <= 24_000 and
             [row['display_id'] for row in packet['display_map']] == [1, 2, 3, 4] and
             packet['gold_opened'] is False, f"packet-{packet.get('sequence')}")
    key = SECRET.read_text().strip()
    need(8 <= len(key) <= 8192, 'secret')
    save('RUN-FREEZE.json', {
        'schema_version': 'are.g01-self-sorting-r52-run-freeze/v1',
        'packets_sha256': freeze['packets_sha256'],
        'packet_freeze_sha256': sha(freeze_path.read_bytes()),
        'protocol_sha256': freeze['protocol_sha256'],
        'runner_sha256': sha(Path(__file__).read_bytes()),
        'model': MODEL, 'maximum_tokenizer_calls': PACKETS, 'maximum_generation_calls': PACKETS,
        'maximum_output_tokens': 256, 'reasoning_effort': 'low',
        'prompt_plus_reserve_limit': 8192, 'total_prompt_cap': TOTAL_PROMPT_CAP,
        'automatic_retries': 0, 'failure_policy': 'stop-no-retry', 'gold_available': False,
    })
    tokens = []
    token_sum = 0
    for sequence, packet in enumerate(packets, 1):
        body = stable({'model': MODEL, 'messages': [{'role': 'user', 'content': packet['prompt']}]})
        started = time.monotonic()
        status, raw, failure = post(TOKENIZER_URL, body, key, 30)
        doc = document(raw)
        count = doc.get('usage', {}).get('prompt_tokens') if doc else None
        count = count if isinstance(count, int) and not isinstance(count, bool) else None
        if count is not None:
            token_sum += count
        admitted = status == 200 and failure is None and count is not None and count + 256 <= 8192 and token_sum <= TOTAL_PROMPT_CAP
        row = {'schema_version': 'are.g01-self-sorting-r52-tokenizer-case/v1', 'sequence': sequence,
               'cohort': packet['cohort'], 'ordinal': packet['ordinal'], 'id': packet['id'],
               'prompt_sha256': sha(packet['prompt'].encode()), 'request_sha256': sha(body),
               'response_sha256': sha(raw), 'http_status': status, 'failure_code': failure,
               'prompt_tokens': count, 'elapsed_ms': round((time.monotonic() - started) * 1000), 'admitted': admitted}
        save(f'TOKENIZER-{sequence:03d}.json', row)
        tokens.append(row)
        print(json.dumps({'phase': 'tokenizer', 'sequence': sequence, 'status': status, 'tokens': count, 'admitted': admitted}), flush=True)
        if not admitted:
            break
    admitted = len(tokens) == PACKETS and all(row['admitted'] for row in tokens)
    save('TOKENIZER-RESULT.json', {'schema_version': 'are.g01-self-sorting-r52-tokenizer-result/v1',
         'status': 'admitted' if admitted else 'not-admitted', 'attempts': len(tokens),
         'admitted': sum(row['admitted'] for row in tokens), 'summed_prompt_tokens': token_sum,
         'maximum_prompt_tokens': max((row['prompt_tokens'] or 0 for row in tokens), default=0),
         'packets_sha256': freeze['packets_sha256']})
    need(admitted, 'tokenizer-not-admitted')
    calls = valid = prompt_tokens = completion_tokens = elapsed_sum = 0
    stopped = False
    for sequence, packet in enumerate(packets, 1):
        body = stable({'model': MODEL, 'messages': [{'role': 'user', 'content': packet['prompt']}],
                       'stream': False, 'max_tokens': 256, 'reasoning_effort': 'low'})
        started = time.monotonic()
        status, raw, failure = post(GENERATION_URL, body, key, 120)
        doc = document(raw)
        elapsed = round((time.monotonic() - started) * 1000)
        choice = doc.get('choices', [{}])[0] if doc and doc.get('choices') else {}
        usage = doc.get('usage') if doc else None
        save(f'GENERATION-{sequence:03d}.json', {'schema_version': 'are.g01-self-sorting-r52-call/v1',
             'sequence': sequence, 'cohort': packet['cohort'], 'ordinal': packet['ordinal'], 'id': packet['id'],
             'prompt_sha256': sha(packet['prompt'].encode()), 'request_sha256': sha(body), 'response_sha256': sha(raw),
             'http_status': status, 'failure_code': failure, 'elapsed_ms': elapsed,
             'finish_reason': choice.get('finish_reason'), 'usage': usage, 'provider_payload': doc})
        calls += 1
        elapsed_sum += elapsed
        if isinstance(usage, dict):
            prompt_tokens += usage.get('prompt_tokens', 0) if isinstance(usage.get('prompt_tokens'), int) else 0
            completion_tokens += usage.get('completion_tokens', 0) if isinstance(usage.get('completion_tokens'), int) else 0
        stopped = status != 200 or failure is not None or prompt_tokens > TOTAL_PROMPT_CAP
        ids = None
        error = None
        if status == 200 and choice.get('finish_reason') == 'stop':
            try:
                ids = parse_selection(choice.get('message', {}).get('content'))
                valid += 1
            except (ValueError, TypeError, json.JSONDecodeError, SystemExit) as exception:
                error = str(exception)[:160]
        else:
            error = 'provider-status-finish-or-content'
        mapping = {row['display_id']: row['arm'] for row in packet['display_map']}
        save(f'DECISION-{sequence:03d}.json', {'schema_version': 'are.g01-self-sorting-r52-decision/v1',
             'sequence': sequence, 'cohort': packet['cohort'], 'ordinal': packet['ordinal'], 'id': packet['id'],
             'valid': ids is not None, 'error': error, 'ranked_display_ids': ids,
             'ranked_arms': [mapping[item] for item in ids] if ids else [], 'stopped_after_case': stopped})
        print(json.dumps({'phase': 'generation', 'sequence': sequence, 'status': status, 'valid': ids is not None, 'stopped': stopped}), flush=True)
        if stopped:
            break
    result = {'schema_version': 'are.g01-self-sorting-r52-run-result/v1',
              'status': 'complete' if calls == PACKETS and not stopped else 'terminal-failed',
              'attempts': calls, 'valid_responses': valid, 'known_prompt_tokens': prompt_tokens,
              'known_completion_tokens': completion_tokens, 'summed_elapsed_ms': elapsed_sum,
              'transport_stopped': stopped, 'packets_sha256': freeze['packets_sha256']}
    save('RUN-RESULT.json', result)
    print(json.dumps(result, sort_keys=True), flush=True)
    need(result['status'] == 'complete', 'generation-terminal-failed')


if __name__ == '__main__':
    main()
