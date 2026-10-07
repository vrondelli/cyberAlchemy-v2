#!/usr/bin/env python3
"""Run 36 frozen exposed Java verifier packets on the private GLM VPS.

No evaluator label or GitBug confirmation file is available here.
Open question: can valid model selections improve matched Java rankings?
"""

import hashlib
import importlib.util
import json
import os
import re
import time
from pathlib import Path


ROOT = Path('/opt/are-benchmark-runs/g01-java-source-verifier-r117')
SECRET = Path('/opt/are-keld-presentation/secrets/model_api_key')
HELPER = Path('/opt/are-benchmark-runs/g01-gitbug-dev-r86/run_vps_r72.py')
MODEL = 'glm-5.3-flash'
CASES = 36


def sha(data):
    return hashlib.sha256(data).hexdigest()


def save(name, value):
    fd = os.open(ROOT / name, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'w') as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write('\n')


def parse_choice(content, packet):
    if not isinstance(content, str) or len(content) > 1200 or '```' in content:
        return None
    try:
        value = json.loads(content.strip())
    except (ValueError, TypeError):
        return None
    if not isinstance(value, dict) or set(value) != {'A', 'B', 'reasonA', 'reasonB'}:
        return None
    candidate_ids = set(packet['candidate_ids'].values())
    for arm in ('A', 'B'):
        if value[arm] != 'ABSTAIN' and value[arm] not in candidate_ids:
            return None
    for field in ('reasonA', 'reasonB'):
        if not isinstance(value[field], str) or len(value[field]) > 160:
            return None
    return value


def main():
    packets_path = ROOT / 'PACKETS.jsonl'
    freeze_path = ROOT / 'PACKET-FREEZE.json'
    if (ROOT / 'RUN-FREEZE.json').exists():
        raise SystemExit('run-already-started')
    freeze = json.loads(freeze_path.read_text())
    packets = [json.loads(line) for line in packets_path.read_text().splitlines()]
    if (freeze['status'] != 'sealed-before-provider' or freeze['packets'] != CASES
            or freeze['packets_sha256'] != sha(packets_path.read_bytes())
            or len(packets) != CASES or freeze['maximum_tokenizer_calls'] != CASES
            or freeze['maximum_generation_calls'] != CASES):
        raise SystemExit('packet-drift')
    if any((row['population'], row['ordinal']) != (('gitbug', i) if i <= 12 else ('bears', i - 12))
           or row['gold_opened'] or row['prompt_sha256'] != sha(row['prompt'].encode())
           or row['head_A'] not in row['candidate_ids'].values()
           or row['head_B'] not in row['candidate_ids'].values()
           for i, row in enumerate(packets, 1)):
        raise SystemExit('packet-integrity')
    if not HELPER.is_file():
        raise SystemExit('transport-helper-missing')
    spec = importlib.util.spec_from_file_location('r72_transport', HELPER)
    common = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(common)
    key = SECRET.read_text().strip()
    if not 8 <= len(key) <= 8192:
        raise SystemExit('missing-secret')
    save('RUN-FREEZE.json', {'schema_version': 'g01.java-source-verifier-provider-freeze-r117/v1',
                            'status': 'started', 'model': MODEL,
                            'packets_sha256': freeze['packets_sha256'],
                            'packet_freeze_sha256': sha(freeze_path.read_bytes()),
                            'runner_sha256': sha(Path(__file__).read_bytes()),
                            'transport_helper_sha256': sha(HELPER.read_bytes()),
                            'max_tokenizer_calls': CASES, 'max_generation_calls': CASES,
                            'max_output_tokens': 192, 'context_cap': 8192,
                            'aggregate_prompt_cap': 180000, 'automatic_retries': 0,
                            'gold_available': False})
    prompt_sum = 0
    for i, packet in enumerate(packets, 1):
        body = common.stable({'model': MODEL, 'messages': [{'role': 'user', 'content': packet['prompt']}]})
        started = time.monotonic()
        status, raw, failure = common.post(common.TOKENIZER, body, key, 30)
        reply = common.parsed(raw)
        usage = reply.get('usage') if reply else None
        tokens = usage.get('prompt_tokens') if isinstance(usage, dict) else None
        if not isinstance(tokens, int) or isinstance(tokens, bool):
            tokens = None
        if tokens is not None:
            prompt_sum += tokens
        admitted = (status == 200 and failure is None and tokens is not None
                    and tokens + 192 <= 8192 and prompt_sum <= 180000)
        save(f'TOKENIZER-{i:03d}.json', {'population': packet['population'],
             'ordinal': packet['ordinal'], 'status': status, 'failure': failure,
             'request_sha256': sha(body), 'response_sha256': sha(raw),
             'prompt_tokens': tokens, 'elapsed_ms': round((time.monotonic()-started)*1000),
             'admitted': admitted})
        print(json.dumps({'phase': 'tokenizer', 'sequence': i, 'admitted': admitted}), flush=True)
        if not admitted:
            raise SystemExit('tokenizer-admission-failed')
    save('TOKENIZER-RESULT.json', {'admitted': CASES, 'prompt_tokens': prompt_sum})
    valid = 0
    usage_sum = {'prompt_tokens': 0, 'completion_tokens': 0}
    for i, packet in enumerate(packets, 1):
        body = common.stable({'model': MODEL, 'messages': [{'role': 'user', 'content': packet['prompt']}],
                              'stream': False, 'max_tokens': 192, 'reasoning_effort': 'low'})
        started = time.monotonic()
        status, raw, failure = common.post(common.CHAT, body, key, 120)
        reply = common.parsed(raw)
        choice = reply.get('choices', [{}])[0] if reply and reply.get('choices') else {}
        usage = reply.get('usage', {}) if reply else {}
        for name in usage_sum:
            if isinstance(usage, dict) and isinstance(usage.get(name), int):
                usage_sum[name] += usage[name]
        message = choice.get('message', {})
        selected = (parse_choice(message.get('content'), packet)
                    if status == 200 and failure is None and choice.get('finish_reason') == 'stop' else None)
        valid += selected is not None
        save(f'GENERATION-{i:03d}.json', {'population': packet['population'],
             'ordinal': packet['ordinal'], 'status': status, 'failure': failure,
             'request_sha256': sha(body), 'response_sha256': sha(raw),
             'elapsed_ms': round((time.monotonic()-started)*1000),
             'usage': usage, 'provider_payload': reply})
        save(f'SELECTION-{i:03d}.json', {'schema_version': 'g01.java-source-verifier-selection-r117/v1',
             'population': packet['population'], 'ordinal': packet['ordinal'],
             'repo': packet['repo'], 'query_sha256': packet['query_sha256'],
             'valid': selected is not None, 'selection': selected,
             'fallback': 'abstain-both' if selected is None else None})
        print(json.dumps({'phase': 'generation', 'sequence': i, 'valid': selected is not None}), flush=True)
    result = {'schema_version': 'g01.java-source-verifier-provider-result-r117/v1',
              'status': 'complete', 'attempts': CASES, 'valid_selections': valid,
              'fallbacks': CASES - valid, 'usage': usage_sum,
              'packets_sha256': freeze['packets_sha256']}
    save('RUN-RESULT.json', result)
    print(json.dumps(result, sort_keys=True), flush=True)


if __name__ == '__main__':
    main()
