#!/usr/bin/env python3
"""Verify every sealed r13 answer attempt without reading evaluator data."""

import argparse
import hashlib
import json
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-100k-ie-r13')
WIRE = ROOT / 'ANSWER-WIRES.json'
RUN = ROOT / 'ANSWER-RUN'
WIRE_SHA = '5182fb6cd39441a2fd1867d848d11bcf9ae976ef0a09bb07b1b5b1de58942058'


def sha_file(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def sha_text(value):
    return hashlib.sha256(value.encode()).hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError('g03-beam-100k-ie-r13-answer-audit.' + reason)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--result-sha256', required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    result_path = RUN / 'RUN-RESULT.json'
    need(not args.output.exists() and sha_file(WIRE) == WIRE_SHA and
         sha_file(result_path) == args.result_sha256, 'input-drift')
    wire = json.loads(WIRE.read_text())
    result = json.loads(result_path.read_text())
    need(wire['schema_version'] == 'are.g03-beam-100k-ie-r13-answer-wires/v1'
         and len(wire['wires']) == 64 and
         result['schema_version'] == 'are.g03-beam-100k-ie-r13-result/v1'
         and result['wire_sha256'] == WIRE_SHA and
         result['status'] in ('completed-64-r13-reserved-answers',
                              'terminal-incomplete') and
         result['attempted'] == len(result['rows']) <= 64 and
         result['valid'] == sum(row['valid'] for row in result['rows']) and
         result['automatic_retries'] == 0 and
         result['evaluator_fields_read'] is False, 'result-boundary')
    invalid = 0
    pairs = {}
    for index, row in enumerate(result['rows']):
        expected = wire['wires'][index]
        path = RUN / f'ATTEMPT-{index + 1:03}.json'
        need(row['ordinal'] == index + 1 and
             row['probe_id'] == expected['probe_id'] and
             row['arm'] == expected['arm'] and
             sha_file(path) == row['raw_sha256'], 'attempt-binding')
        raw = json.loads(path.read_text())
        need(raw['schema_version'] ==
             'are.g03-beam-100k-ie-r13-attempt/v1' and
             raw['ordinal'] == row['ordinal'] and
             raw['probe_id'] == row['probe_id'] and
             raw['arm'] == row['arm'] and
             raw['request_sha256'] == expected['request_sha256'],
             'raw-identity')
        if row['valid']:
            response = raw['response']
            answer = response['payload']['choices'][0]['message']['content']
            usage = response['payload']['usage']
            need(response['status'] == 200 and isinstance(answer, str) and
                 answer.strip() and sha_text(answer) == row['answer_sha256']
                 and usage['prompt_tokens'] == row['prompt_tokens'] and
                 usage['completion_tokens'] == row['completion_tokens'] and
                 row['completion_tokens'] <= 512 and
                 row['prompt_tokens'] + row['completion_tokens'] <= 8192,
                 'valid-answer-binding')
            pairs.setdefault(row['probe_id'], set()).add(row['arm'])
        else:
            invalid += 1
            need(index == len(result['rows']) - 1 and
                 row['answer_sha256'] is None, 'terminal-invalid')
    need((result['status'] == 'completed-64-r13-reserved-answers' and
          result['attempted'] == 64 and invalid == 0 and len(pairs) == 32 and
          all(arms == {'control', 'treatment'} for arms in pairs.values())) or
         (result['status'] == 'terminal-incomplete' and invalid == 1),
         'terminal-completeness')
    packet = {
        'schema_version': 'are.g03-beam-100k-ie-r13-answer-audit/v1',
        'status': 'passed-raw-receipt-audit',
        'wire_sha256': WIRE_SHA, 'result_sha256': args.result_sha256,
        'attempted': result['attempted'], 'valid': result['valid'],
        'terminal_invalid': invalid,
        'complete_matched_pairs': sum(arms == {'control', 'treatment'}
                                      for arms in pairs.values()),
        'known_prompt_tokens': result['known_prompt_tokens'],
        'known_completion_tokens': result['known_completion_tokens'],
        'evaluator_fields_read': False,
        'claim_ceiling': 'Answer receipt integrity only; no label integrity, scorer, or superiority',
        'open_questions': ['Can blinded source/reference review certify the 32 native labels?',
                           'Will the calibrated scorer transfer to these answers?'],
    }
    data = (json.dumps(packet, sort_keys=True, indent=2) + '\n').encode()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as stream:
        stream.write(data)
    print(json.dumps({'status': packet['status'],
        'attempted': packet['attempted'], 'valid': packet['valid'],
        'complete_matched_pairs': packet['complete_matched_pairs'],
        'audit_sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
