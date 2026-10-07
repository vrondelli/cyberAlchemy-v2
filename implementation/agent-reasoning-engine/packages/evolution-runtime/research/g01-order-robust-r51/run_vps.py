#!/usr/bin/env python3
"""Run the sealed r51 tokenizer and GLM calls on the private VPS."""

from __future__ import annotations

import hashlib
import json
import os
import re
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


ROOT = Path('/opt/are-benchmark-runs/g01-order-robust-r51')
SECRET = Path('/opt/are-keld-presentation/secrets/model_api_key')
MODEL = 'glm-5.3-flash'
TOKENIZER_URL = 'https://api.z.ai/api/paas/v4/tokenizer'
GENERATION_URL = 'https://api.z.ai/api/paas/v4/chat/completions'
MAX_RESPONSE_BYTES = 262_144
TOTAL_PROMPT_CAP = 500_000
PACKETS = 142


def stable(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(',', ':')).encode()


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(ok: bool, why: str) -> None:
    if not ok:
        raise SystemExit('g01-r51.' + why)


def save(name: str, value: object) -> None:
    data = (json.dumps(value, sort_keys=True, indent=2) + '\n').encode()
    descriptor = os.open(ROOT / name, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'wb') as handle:
        handle.write(data)


def post(url: str, body: bytes, key: str, timeout: int):
    request = Request(url, data=body, method='POST', headers={
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'ARE-G01-r51/1',
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


def document(raw: bytes):
    try:
        value = json.loads(raw)
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
    need(isinstance(value, dict) and set(value) == {'candidate_ids'}, 'selection-shape')
    values = value['candidate_ids']
    need(isinstance(values, list) and len(values) <= 8, 'selection-shape')
    ids = []
    for item in values:
        if isinstance(item, int) and not isinstance(item, bool):
            candidate_id = item
        elif isinstance(item, str) and re.fullmatch(r'[1-9][0-9]*', item):
            candidate_id = int(item)
        else:
            raise ValueError('selection-value')
        need(1 <= candidate_id <= packet['candidate_count'], 'selection-range')
        ids.append(candidate_id)
    need(len(ids) == len(set(ids)), 'selection-duplicate')
    return ids


def main() -> None:
    packet_path = ROOT / 'PACKETS.jsonl'
    freeze_path = ROOT / 'PACKET-FREEZE.json'
    protocol_path = ROOT / 'PROTOCOL.md'
    runner_path = Path(__file__).resolve()
    need(ROOT.is_dir() and not (ROOT / 'RUN-FREEZE.json').exists(), 'root-prior-state')
    freeze = json.loads(freeze_path.read_bytes())
    need(freeze['packets'] == PACKETS and freeze['packets_sha256'] == sha(packet_path.read_bytes()) and
         freeze['protocol_sha256'] == sha(protocol_path.read_bytes()), 'input-integrity')
    packets = [json.loads(line) for line in packet_path.read_text().splitlines()]
    need(len(packets) == PACKETS, 'packet-denominator')
    for packet in packets:
        need(packet['prompt_bytes'] == len(packet['prompt'].encode()) <= 24_000 and
             packet['candidate_count'] == len(packet['display_map']) <= 30 and
             [row['display_id'] for row in packet['display_map']] == list(range(1, packet['candidate_count'] + 1)) and
             packet['gold_opened'] is False, f"packet-{packet.get('cohort')}-{packet.get('ordinal')}")
    key = SECRET.read_text().strip()
    need(8 <= len(key) <= 8192, 'secret')
    save('RUN-FREEZE.json', {
        'schema_version': 'are.g01-order-robust-r51-run-freeze/v1',
        'packets_sha256': freeze['packets_sha256'],
        'packet_freeze_sha256': sha(freeze_path.read_bytes()),
        'protocol_sha256': freeze['protocol_sha256'],
        'runner_sha256': sha(runner_path.read_bytes()),
        'model': MODEL,
        'maximum_tokenizer_calls': PACKETS,
        'maximum_generation_calls': PACKETS,
        'maximum_output_tokens': 512,
        'reasoning_effort': 'low',
        'prompt_plus_reserve_limit': 8192,
        'total_prompt_cap': TOTAL_PROMPT_CAP,
        'automatic_retries': 0,
        'failure_policy': 'stop-no-retry',
        'gold_available': False,
    })
    token_rows = []
    token_sum = 0
    for sequence, packet in enumerate(packets, 1):
        body = stable({'model': MODEL, 'messages': [{'role': 'user', 'content': packet['prompt']}]})
        started = time.monotonic()
        status, raw, failure = post(TOKENIZER_URL, body, key, 30)
        doc = document(raw)
        elapsed = round((time.monotonic() - started) * 1000)
        tokens = doc.get('usage', {}).get('prompt_tokens') if doc else None
        if not isinstance(tokens, int) or isinstance(tokens, bool):
            tokens = None
        if tokens is not None:
            token_sum += tokens
        admitted = (status == 200 and failure is None and tokens is not None and
                    tokens + 512 <= 8192 and token_sum <= TOTAL_PROMPT_CAP)
        row = {
            'schema_version': 'are.g01-order-robust-r51-tokenizer-case/v1',
            'sequence': sequence,
            'cohort': packet['cohort'],
            'ordinal': packet['ordinal'],
            'id': packet['id'],
            'view': packet['view'],
            'prompt_sha256': sha(packet['prompt'].encode()),
            'request_sha256': sha(body),
            'response_sha256': sha(raw),
            'http_status': status,
            'failure_code': failure,
            'prompt_tokens': tokens,
            'elapsed_ms': elapsed,
            'admitted': admitted,
        }
        save(f'TOKENIZER-{sequence:03d}.json', row)
        token_rows.append(row)
        print(json.dumps({'phase': 'tokenizer', 'sequence': sequence, 'status': status,
                          'tokens': tokens, 'admitted': admitted}), flush=True)
        if not admitted:
            break
    admitted = len(token_rows) == PACKETS and all(row['admitted'] for row in token_rows)
    save('TOKENIZER-RESULT.json', {
        'schema_version': 'are.g01-order-robust-r51-tokenizer-result/v1',
        'status': 'admitted' if admitted else 'not-admitted',
        'attempts': len(token_rows),
        'admitted': sum(row['admitted'] for row in token_rows),
        'summed_prompt_tokens': token_sum,
        'maximum_prompt_tokens': max((row['prompt_tokens'] or 0 for row in token_rows), default=0),
        'summed_elapsed_ms': sum(row['elapsed_ms'] for row in token_rows),
        'packets_sha256': freeze['packets_sha256'],
    })
    need(admitted, 'tokenizer-not-admitted')

    calls = valid = known_prompt = known_completion = elapsed_sum = 0
    stopped = False
    for sequence, packet in enumerate(packets, 1):
        body = stable({
            'model': MODEL,
            'messages': [{'role': 'user', 'content': packet['prompt']}],
            'stream': False,
            'max_tokens': 512,
            'reasoning_effort': 'low',
        })
        started = time.monotonic()
        status, raw, failure = post(GENERATION_URL, body, key, 120)
        doc = document(raw)
        elapsed = round((time.monotonic() - started) * 1000)
        choice = doc.get('choices', [{}])[0] if doc and doc.get('choices') else {}
        usage = doc.get('usage') if doc else None
        save(f'GENERATION-{sequence:03d}.json', {
            'schema_version': 'are.g01-order-robust-r51-call/v1',
            'sequence': sequence,
            'cohort': packet['cohort'],
            'ordinal': packet['ordinal'],
            'id': packet['id'],
            'view': packet['view'],
            'prompt_sha256': sha(packet['prompt'].encode()),
            'request_sha256': sha(body),
            'response_sha256': sha(raw),
            'http_status': status,
            'failure_code': failure,
            'elapsed_ms': elapsed,
            'finish_reason': choice.get('finish_reason'),
            'usage': usage,
            'provider_payload': doc,
        })
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
        by_id = {row['display_id']: row for row in packet['display_map']}
        selected_paths = [by_id[item]['path'] for item in ids] if ids is not None else []
        selected_original_ids = [by_id[item]['original_candidate_id'] for item in ids] if ids is not None else []
        save(f'DECISION-{sequence:03d}.json', {
            'schema_version': 'are.g01-order-robust-r51-decision/v1',
            'sequence': sequence,
            'cohort': packet['cohort'],
            'ordinal': packet['ordinal'],
            'id': packet['id'],
            'view': packet['view'],
            'valid': ids is not None,
            'error': error,
            'selected_display_ids': ids,
            'selected_original_ids': selected_original_ids,
            'selected_paths': selected_paths,
            'stopped_after_case': stopped,
        })
        print(json.dumps({'phase': 'generation', 'sequence': sequence, 'status': status,
                          'valid': ids is not None,
                          'prompt_tokens': usage.get('prompt_tokens') if isinstance(usage, dict) else None,
                          'completion_tokens': usage.get('completion_tokens') if isinstance(usage, dict) else None,
                          'stopped': stopped}), flush=True)
        if stopped:
            break
    result = {
        'schema_version': 'are.g01-order-robust-r51-run-result/v1',
        'status': 'complete' if calls == PACKETS and not stopped else 'terminal-failed',
        'attempts': calls,
        'valid_responses': valid,
        'known_prompt_tokens': known_prompt,
        'known_completion_tokens': known_completion,
        'summed_elapsed_ms': elapsed_sum,
        'transport_stopped': stopped,
        'packets_sha256': freeze['packets_sha256'],
    }
    save('RUN-RESULT.json', result)
    print(json.dumps(result, sort_keys=True), flush=True)
    need(result['status'] == 'complete', 'generation-terminal-failed')


if __name__ == '__main__':
    main()

