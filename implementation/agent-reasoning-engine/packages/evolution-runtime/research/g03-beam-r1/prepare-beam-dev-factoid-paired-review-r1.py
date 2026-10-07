#!/usr/bin/env python3
"""Seal treatment/BM25 final answers for four exposed BEAM dev factoids."""

import argparse
import hashlib
import json
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002')
RUN = Path('/home/vlad_/are-benchmark-archive/g03-beam-dev-factoid-bm25-run-r1-20261002')
TREATMENT_PACKET = ROOT / 'DEV-FACTOID-REVIEW-r1.json'
CONTROL_WIRE = ROOT / 'DEV-FACTOID-BM25-WIRES-r1.json'
CONTROL_FREEZE = RUN / 'FREEZE.json'
CONTROL_RESULT = RUN / 'RUN-RESULT.json'
SOURCE = ROOT / 'SOURCE-ONLY.jsonl'
PINS = {
    TREATMENT_PACKET: '9972cf51d01ee30cf94ba80f061d23041a4369c3de9b85f505aff714be85f771',
    CONTROL_WIRE: 'fc106339fc29a6085150f22de8b0e00d517f9cb5d4ff8f7995eb79ab604da452',
    CONTROL_FREEZE: '22a7e04c7cfd09e597f9a09f4408ca18cd5a8fa711ff84f9df7a3bbb287a4364',
    CONTROL_RESULT: '1d1ae0d89c2539ba612b597aa287c7dfb4402f8bb2dce67a5e7e7050135e6aa3',
    SOURCE: 'bfae354f876ccb0d5b95aebad51cfa734ce82e7c4c8102beeb5a9bd0476bc26d',
}
SPRINT_PROBE = '5aa2fe813e77b93bcf3c8b9f'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError('g03-beam-dev-factoid-paired-review.' + reason)


def run():
    need(all(sha(path.read_bytes()) == expected for path, expected in PINS.items()),
         'input-drift')
    treatment = json.loads(TREATMENT_PACKET.read_text())
    wire = json.loads(CONTROL_WIRE.read_text())
    freeze = json.loads(CONTROL_FREEZE.read_text())
    result = json.loads(CONTROL_RESULT.read_text())
    need(treatment['reasoning_content_exported'] is False and
         treatment['heldout_evaluator_values_accessed_in_code'] is False and
         wire['arm'] == 'bm25-control' and wire['evaluator_fields_read'] is False and
         freeze['evaluator_fields_read'] is False and
         result['evaluator_fields_read'] is False and
         result['status'] == 'completed-four-development-answers' and
         result['attempted'] == result['valid'] == 4 and
         result['freeze_sha256'] == PINS[CONTROL_FREEZE] and
         result['wire_sha256'] == PINS[CONTROL_WIRE] and
         freeze['ordered_probe_ids'] == [row['probe_id'] for row in wire['wires']],
         'run-boundary')
    control_answers = {}
    for index, row in enumerate(result['rows'], 1):
        path = RUN / f'ATTEMPT-{index:02d}.json'
        raw_data = path.read_bytes()
        raw = json.loads(raw_data)
        answer = raw['response']['payload']['choices'][0]['message']['content']
        need(row['valid'] and row['raw_sha256'] == sha(raw_data) and
             row['answer_sha256'] == sha(answer.encode()) and
             raw['probe_id'] == row['probe_id'] and
             raw['response']['status'] == 200 and
             isinstance(answer, str) and answer.strip(), 'raw-binding')
        control_answers[row['probe_id']] = answer
    need(len(control_answers) == 4, 'control-count')
    cases = []
    for case in treatment['cases']:
        probe_id = case['probe_id']
        need(probe_id in control_answers, 'pair-binding')
        cases.append({'probe_id': probe_id, 'question': case['question'],
                      'reference_answer': case['reference_answer'],
                      'treatment_answer': case['model_answer'],
                      'bm25_control_answer': control_answers[probe_id],
                      'reference_source_chat_ids': case['source_chat_ids']})
    need(len(cases) == 4 and len({case['probe_id'] for case in cases}) == 4,
         'case-count')
    source = next((row for line in SOURCE.read_text().splitlines()
                   if (row := json.loads(line))['conversation_key'] == 'Coding:1'),
                  None)
    need(source is not None and SPRINT_PROBE in control_answers,
         'sprint-source')
    conflict = [{'source_turn': turn_id,
                 'source_content_sha256':
                     sha(source['turns'][turn_id]['content'].encode()),
                 'source_excerpt': source['turns'][turn_id]['content'][:500]}
                for turn_id in (28, 52, 86)]
    need('March 29' in conflict[0]['source_excerpt'] and
         'March 31' in conflict[1]['source_excerpt'] and
         'March 29' in conflict[2]['source_excerpt'],
         'sprint-conflict-binding')
    return {'schema_version': 'are.g03-beam-dev-factoid-paired-review-r1/v1',
            'status': 'four-exposed-development-pairs-not-native-scored',
            'treatment_review_sha256': PINS[TREATMENT_PACKET],
            'bm25_control_wire_sha256': PINS[CONTROL_WIRE],
            'bm25_control_result_sha256': PINS[CONTROL_RESULT],
            'source_only_sha256': PINS[SOURCE],
            'cases': sorted(cases, key=lambda case: case['probe_id']),
            'sprint_conflicting_source_turns': conflict,
            'reasoning_content_exported': False,
            'heldout_evaluator_values_accessed_in_code': False,
            'claim_ceiling': 'Four exposed paired development answers only; one reference-sensitive ambiguity, no native BEAM score, holdout, or superiority',
            'open_questions': ['Should March 29 and March 31 both be acceptable under a predeclared ambiguity policy?',
                               'Can a fresh source population sustain an unambiguous superiority result?']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    packet = run()
    data = json.dumps(packet, sort_keys=True, indent=2).encode() + b'\n'
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as handle:
        handle.write(data)
    print(json.dumps({'cases': len(packet['cases']),
                      'packet_sha256': sha(data), 'output': str(args.output)},
                     sort_keys=True))


if __name__ == '__main__':
    main()
