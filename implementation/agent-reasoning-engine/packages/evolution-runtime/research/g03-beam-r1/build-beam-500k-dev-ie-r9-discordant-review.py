#!/usr/bin/env python3
"""Bind all non-tied r9 development answers to questions and rubric scores."""

import argparse
import hashlib
import json
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1')
INPUTS = {
    'score': ('DUAL-VIEW-R9-SCORE-AUDIT.json',
              'ccb1434e29275c49dd135a725777605bbbc334c2d9507651c12983cf111ae6b8'),
    'map': ('DUAL-VIEW-R9-JUDGE-MAP.json',
            '915835c97235f81432b1d1a22d0b149a539c4d22c561e89fd667d405c443e775'),
    'judge_wire': ('DUAL-VIEW-R9-JUDGE-WIRES.json',
                   'fad197b4c2eab80e6de3d2f4086b5c70fa7b411d005b61d7dd7a3b19b5a87ac8'),
    'answer_wire': ('DUAL-VIEW-R9-ANSWER-WIRES.json',
                    'c2f524089e546e21079b73c21186dd6de598756d2eb1d8a465ac600a550d8336'),
}


def need(value, code):
    if not value:
        raise ValueError('g03-beam-r9-discordant-review.' + code)


def load_bound(name):
    filename, expected = INPUTS[name]
    raw = (ROOT / filename).read_bytes()
    need(hashlib.sha256(raw).hexdigest() == expected, name + '-sha')
    return json.loads(raw)


def question_of(request):
    content = request['messages'][-1]['content']
    prefix = 'Current question:\n'
    separator = '\n\nArchived conversation evidence:\n'
    need(content.startswith(prefix) and separator in content, 'question-format')
    return content[len(prefix):].split(separator, 1)[0]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    need(not args.output.exists(), 'output-exists')
    score = load_bound('score')
    mapping = load_bound('map')
    judge = load_bound('judge_wire')
    answers = load_bound('answer_wire')
    need(score['summary']['questions'] == 60 and
         score['summary']['treatment_wins'] == 14 and
         score['summary']['control_wins'] == 5 and
         score['summary']['ties'] == 41, 'score-population')
    by_id = {row['blind_id']: row for row in judge['wires']}
    need(len(by_id) == len(judge['wires']) == 212, 'judge-identity')
    answer_by_pair = {(row['probe_id'], row['arm']): row
                      for row in answers['wires']}
    need(len(answer_by_pair) == 120, 'answer-identity')
    rubric_by_pair = {}
    for row in mapping['rows']:
        key = (row['probe_id'], row['arm'])
        rubric_by_pair.setdefault(key, {})[row['rubric_item_index']] = by_id[row['blind_id']]
    cases = []
    for pair in score['pairs']:
        if pair['paired_delta'] == 0:
            continue
        probe = pair['probe_id']
        arms = {}
        questions = set()
        for arm in ('control', 'treatment'):
            bound = answer_by_pair[(probe, arm)]
            questions.add(question_of(bound['request']))
            criteria = rubric_by_pair[(probe, arm)]
            need(set(criteria) == set(range(pair['rubric_items'])),
                 'rubric-indices')
            arms[arm] = {
                'score': pair[arm],
                'rubric_items': [criteria[index]['rubric_item']
                                 for index in sorted(criteria)],
                'final_answer': [criteria[index]['answer']
                                 for index in sorted(criteria)][0],
            }
            need(len({criteria[index]['answer'] for index in criteria}) == 1,
                 'answer-consistency')
        need(len(questions) == 1 and
             arms['control']['rubric_items'] == arms['treatment']['rubric_items'],
             'paired-binding')
        cases.append({'probe_id': probe, 'question': questions.pop(),
                      'paired_delta': pair['paired_delta'], 'arms': arms})
    need(len(cases) == 19, 'discordant-count')
    packet = {
        'schema_version': 'are.g03-beam-500k-ie-r9-discordant-review/v1',
        'status': 'private-review-packet-not-adjudicated',
        'input_sha256': {name: expected for name, (_, expected) in INPUTS.items()},
        'cases': cases,
        'review_rules': [
            'For each rubric item, distinguish direct answer from incidental mention.',
            'Check whether the question and source support a unique reference answer.',
            'Do not change the sealed r9 primary score or tune a held-out evaluator.'
        ],
        'claim_ceiling': 'Exposed development review only; no revised primary score or superiority claim',
        'open_questions': ['Which score differences survive source-and-answer adjudication?',
                           'Is the adapted rubric sufficiently faithful for an untouched population?'],
    }
    raw = (json.dumps(packet, sort_keys=True, indent=2) + '\n').encode()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as stream:
        stream.write(raw)
    print(json.dumps({'cases': len(cases),
                      'packet_sha256': hashlib.sha256(raw).hexdigest(),
                      'status': packet['status']}, sort_keys=True))


if __name__ == '__main__':
    main()
