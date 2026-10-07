#!/usr/bin/env python3
"""Numeric-only r13 answer cost audit; never opens answers or evaluator labels."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import statistics


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-100k-ie-r13')
RESULT = ROOT / 'ANSWER-RUN/RUN-RESULT.json'
AUDIT = ROOT / 'ANSWER-AUDIT.json'
OUTPUT = ROOT / 'ANSWER-COST-AUDIT.json'
PINS = {
    RESULT: '79a271dbfa27bca7ff855e477199fd46c9b11abe3dd0d47df004a557fb6f0716',
    AUDIT: 'e3cda154789426075cc39b36fe607721099fef9711443c9b0a166eb1ad7b33b8',
}


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    if OUTPUT.exists() or any(sha(path) != expected for path, expected in PINS.items()):
        raise SystemExit('output exists or input pin drift')
    result = json.loads(RESULT.read_text())
    audit = json.loads(AUDIT.read_text())
    if (result['status'] != 'completed-64-r13-reserved-answers' or
            audit['status'] != 'passed-raw-receipt-audit' or
            audit['result_sha256'] != PINS[RESULT] or
            result['attempted'] != 64 or result['valid'] != 64 or
            audit['attempted'] != 64 or audit['valid'] != 64 or
            audit['complete_matched_pairs'] != 32 or
            result['automatic_retries'] != 0 or audit['evaluator_fields_read'] is not False):
        raise SystemExit('receipt status drift')
    rows = result['rows']
    if len(rows) != 64 or {row['ordinal'] for row in rows} != set(range(1, 65)):
        raise SystemExit('attempt denominator drift')
    by_probe: dict[str, dict[str, dict]] = {}
    for row in rows:
        if row['arm'] not in ('control', 'treatment') or row['status'] != 200 or row['valid'] is not True:
            raise SystemExit('invalid answer row')
        for key in ('prompt_tokens', 'completion_tokens', 'reasoning_tokens', 'elapsed_ms'):
            if not isinstance(row[key], int) or row[key] < 0:
                raise SystemExit('invalid numeric field')
        if row['reasoning_tokens'] > row['completion_tokens']:
            raise SystemExit('reasoning usage drift')
        arms = by_probe.setdefault(row['probe_id'], {})
        if row['arm'] in arms:
            raise SystemExit('duplicate arm')
        arms[row['arm']] = row
    if len(by_probe) != 32 or any(set(arms) != {'control', 'treatment'} for arms in by_probe.values()):
        raise SystemExit('matched-pair drift')
    summaries = {}
    for arm in ('control', 'treatment'):
        selected = [arms[arm] for arms in by_probe.values()]
        summaries[arm] = {
            'calls': len(selected),
            'prompt_tokens': sum(row['prompt_tokens'] for row in selected),
            'completion_tokens': sum(row['completion_tokens'] for row in selected),
            'reasoning_tokens': sum(row['reasoning_tokens'] for row in selected),
            'known_total_tokens': sum(row['prompt_tokens'] + row['completion_tokens'] for row in selected),
            'summed_call_elapsed_ms': sum(row['elapsed_ms'] for row in selected),
            'median_call_elapsed_ms': statistics.median(row['elapsed_ms'] for row in selected),
        }
    if (sum(item['prompt_tokens'] for item in summaries.values()) != result['known_prompt_tokens'] or
            sum(item['completion_tokens'] for item in summaries.values()) != result['known_completion_tokens'] or
            sum(item['reasoning_tokens'] for item in summaries.values()) != result['known_reasoning_tokens'] or
            summaries['control']['prompt_tokens'] + summaries['treatment']['prompt_tokens'] !=
            audit['known_prompt_tokens'] or
            summaries['control']['completion_tokens'] + summaries['treatment']['completion_tokens'] !=
            audit['known_completion_tokens']):
        raise SystemExit('aggregate usage drift')
    controls = summaries['control']
    treatment = summaries['treatment']
    receipt = {
        'schema': 'are.g03-beam-100k-ie-r13-answer-cost-audit/v1',
        'posture': 'label-free descriptive audit; no answers, references, or scorer output opened',
        'input_sha256': {path.name: expected for path, expected in PINS.items()},
        'pairs': len(by_probe), 'arms': summaries,
        'treatment_over_control_known_total_token_ratio':
            treatment['known_total_tokens'] / controls['known_total_tokens'],
        'treatment_over_control_summed_call_time_ratio':
            treatment['summed_call_elapsed_ms'] / controls['summed_call_elapsed_ms'],
        'pairs_with_more_treatment_tokens': sum(
            arms['treatment']['prompt_tokens'] + arms['treatment']['completion_tokens'] >
            arms['control']['prompt_tokens'] + arms['control']['completion_tokens']
            for arms in by_probe.values()),
        'pairs_with_longer_treatment_call': sum(
            arms['treatment']['elapsed_ms'] > arms['control']['elapsed_ms']
            for arms in by_probe.values()),
        'claim_ceiling': 'Answer-stage usage and summed-call-time only; not campaign wall time, cost, accuracy, or superiority.',
    }
    body = (json.dumps(receipt, indent=2, sort_keys=True) + '\n').encode()
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(body)
    print(json.dumps({'pairs': receipt['pairs'], 'arms': summaries,
                      'total_token_ratio': receipt['treatment_over_control_known_total_token_ratio'],
                      'summed_call_time_ratio': receipt['treatment_over_control_summed_call_time_ratio'],
                      'pairs_with_more_treatment_tokens': receipt['pairs_with_more_treatment_tokens'],
                      'pairs_with_longer_treatment_call': receipt['pairs_with_longer_treatment_call'],
                      'receipt_sha256': hashlib.sha256(body).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
