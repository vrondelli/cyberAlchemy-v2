#!/usr/bin/env python3
"""Join r2 final answers to the already exposed, archived BM25 review packet."""

import argparse
import hashlib
import json
from pathlib import Path


SOURCE_ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002')
RUN_ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-dev-multispan-run-r2-20261002')
WIRES = SOURCE_ROOT / 'DEV-MULTISPAN-WIRES-r2.json'
RESULT = RUN_ROOT / 'RUN-RESULT.json'
PREVIOUS = SOURCE_ROOT / 'DEV-MOSAIC-PAIRED-REVIEW-r1.json'
PINS = {
    WIRES: 'da5c94b5123bfd204180feeffadb8f97ba9aeabe9da85cc356553cbcfa61a127',
    RESULT: '5db3064fdc16d470c70909840cb590cb1e7383b6139654add9d518f9f384fe31',
    PREVIOUS: '75315432d3c217e6141f2ea79135b4856aa3d685d0060cc29f5e22e6f3a2911d',
}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError('g03-beam-dev-multispan-review-r2.' + reason)


def run():
    need(all(sha(path.read_bytes()) == expected for path, expected in PINS.items()),
         'input-drift')
    wires = json.loads(WIRES.read_text())
    result = json.loads(RESULT.read_text())
    previous = json.loads(PREVIOUS.read_text())
    need(wires['evaluator_fields_read'] is False and
         result['status'] == 'completed-four-development-answers' and
         result['wire_sha256'] == PINS[WIRES] and
         result['attempted'] == result['valid'] == 4 and
         result['automatic_retries'] == 0 and
         previous['heldout_evaluator_values_accessed_in_code'] is False and
         len(previous['cases']) == 4, 'run-boundary')
    answers = {}
    for index, (wire, receipt) in enumerate(zip(wires['wires'], result['rows']), 1):
        path = RUN_ROOT / f'ATTEMPT-{index:02d}.json'
        raw_bytes = path.read_bytes()
        raw = json.loads(raw_bytes)
        answer = raw['response']['payload']['choices'][0]['message']['content']
        need(receipt['valid'] and receipt['raw_sha256'] == sha(raw_bytes) and
             receipt['answer_sha256'] == sha(answer.encode()) and
             receipt['probe_id'] == wire['probe_id'] == raw['probe_id'] and
             raw['response']['status'] == 200 and
             isinstance(answer, str) and answer.strip(), 'raw-attempt-binding')
        need(wire['probe_id'] not in answers, 'duplicate-answer')
        answers[wire['probe_id']] = answer
    need(len(answers) == 4, 'answer-count')
    cases = []
    for old in previous['cases']:
        probe_id = old['probe_id']
        need(probe_id in answers and
             isinstance(old['reference_answer'], str) and
             isinstance(old['bm25_answer'], str), 'case-binding')
        cases.append({'probe_id': probe_id,
                      'conversation_key': old['conversation_key'],
                      'question': old['question'],
                      'reference_answer': old['reference_answer'],
                      'multispan_answer': answers[probe_id],
                      'bm25_answer': old['bm25_answer'],
                      'prior_mosaic_answer': old['mosaic_answer']})
    return {
        'schema_version': 'are.g03-beam-dev-multispan-review-r2/v1',
        'status': 'exposed-development-final-answers-not-native-scored',
        'wire_sha256': PINS[WIRES], 'run_result_sha256': PINS[RESULT],
        'archived_bm25_review_sha256': PINS[PREVIOUS],
        'comparison_contemporaneous': False,
        'cases': sorted(cases, key=lambda case: case['probe_id']),
        'reasoning_content_exported': False,
        'heldout_evaluator_values_accessed_in_code': False,
        'claim_ceiling': 'Four exposed development treatment answers against prior BM25 answers; unblinded and not a native score, holdout, or superiority',
        'open_questions': ['Did multi-span selection restore full reference-required steps?',
                           'Would a new contemporaneous matched run confirm any advantage?'],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    need(not args.output.exists(), 'output-exists')
    packet = run()
    data = json.dumps(packet, sort_keys=True, indent=2).encode() + b'\n'
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as handle:
        handle.write(data)
    print(json.dumps({'cases': len(packet['cases']),
                      'packet_sha256': sha(data)}, sort_keys=True))


if __name__ == '__main__':
    main()
