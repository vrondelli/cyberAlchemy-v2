#!/usr/bin/env python3
"""Export r5 final answers with only the two previously exposed dev references."""

import argparse
import hashlib
import json
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002')
RUN = Path('/home/vlad_/are-benchmark-archive/g03-beam-dev-synthesis-run-r5-20261002')
INPUTS = {
    ROOT / 'DEV-ANSWER-REVIEW-r4.json': 'cacda6377089f60a2d8faec04e6486ea10579d72962d408b62ee5e15262d9db2',
    ROOT / 'DEV-EVENT-SYNTHESIS-WIRES-r5.json': '2073573b00f4202ab678c4651d148080b76565052daa3ed16a3bf8ed45ed8960',
    RUN / 'FREEZE.json': 'e8f58f3a13f14f981bda0e104a24200b8a65d147d585eaabe8006c91d6d0f07a',
    RUN / 'RUN-RESULT.json': '716f9238bedbc9f3f7e2dd90ce332e6e58a085c001c32bcec8f7bc94a02b7a38',
}
PROBES = ('77b0cfedb7a55082886435b5', 'cf1af0869c4aa1def972601b')


def sha(data):
    return hashlib.sha256(data).hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-r5-review.' + reason)


def run():
    need(all(sha(path.read_bytes()) == expected for path, expected in INPUTS.items()),
         'input-drift')
    old = json.loads((ROOT / 'DEV-ANSWER-REVIEW-r4.json').read_text())
    result = json.loads((RUN / 'RUN-RESULT.json').read_text())
    need(old['heldout_evaluator_values_accessed_in_code'] is False and
         old['reasoning_content_exported'] is False and
         result['status'] == 'completed-two-development-answers' and
         result['attempted'] == result['valid'] == 2 and
         result['freeze_sha256'] == INPUTS[RUN / 'FREEZE.json'] and
         result['wire_sha256'] == INPUTS[ROOT / 'DEV-EVENT-SYNTHESIS-WIRES-r5.json'],
         'input-boundary')
    references = {case['probe_id']: case for case in old['cases']
                  if case['probe_id'] in PROBES}
    need(len(references) == 2, 'reference-boundary')
    cases = []
    for ordinal, row in enumerate(result['rows'], 1):
        path = RUN / f'ATTEMPT-{ordinal:02d}.json'
        raw_data = path.read_bytes()
        raw = json.loads(raw_data)
        answer = raw['response']['payload']['choices'][0]['message']['content']
        need(row['probe_id'] == PROBES[ordinal - 1] and row['valid'] and
             row['raw_sha256'] == sha(raw_data) and
             row['answer_sha256'] == sha(answer.encode()) and
             raw['probe_id'] == row['probe_id'] and
             raw['response']['status'] == 200 and
             isinstance(answer, str) and answer.strip(), 'raw-binding')
        reference = references[row['probe_id']]
        cases.append({key: reference[key] for key in ('probe_id', 'question',
            'reference_answer', 'reference_ordered_items', 'requested_items')})
        cases[-1]['model_answer'] = answer
    return {'schema_version': 'are.g03-beam-dev-answer-review-r5/v1',
            'status': 'two-exposed-development-answers-not-native-scored',
            'source_review_sha256': INPUTS[ROOT / 'DEV-ANSWER-REVIEW-r4.json'],
            'synthesis_wire_sha256': INPUTS[ROOT / 'DEV-EVENT-SYNTHESIS-WIRES-r5.json'],
            'synthesis_result_sha256': INPUTS[RUN / 'RUN-RESULT.json'],
            'cases': cases, 'reasoning_content_exported': False,
            'heldout_evaluator_values_accessed_in_code': False,
            'claim_ceiling': 'Two previously exposed development questions only; no native BEAM score, holdout, or superiority',
            'open_questions': ['Can stage selection reject later distractors?',
                               'Can extraction cost fall enough for matched-arm evaluation?']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    packet = run()
    data = json.dumps(packet, sort_keys=True, indent=2).encode() + b'\n'
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as handle:
        handle.write(data)
    print(json.dumps({'cases': len(packet['cases']), 'packet_sha256': sha(data),
                      'output': str(args.output)}, sort_keys=True))


if __name__ == '__main__':
    main()
