#!/usr/bin/env python3
"""Verify all raw strict-answer judgments and fixed r10 calibration sentinels."""

import argparse
from collections import defaultdict
import hashlib
import json
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1')
WIRE = ROOT / 'R10-STRICT-ANSWER-WIRES.json'
MAP = ROOT / 'R10-STRICT-ANSWER-MAP.json'
RUN = ROOT / 'R10-STRICT-ANSWER-JUDGE-RUN'
RESULT = RUN / 'RUN-RESULT.json'
WIRE_SHA = '6065d02a532a87accd82b5eaf4ae026c28880d2457a1f2747171e3838bafa28f'
MAP_SHA = 'c27b7c43cad511f9fa5924b0848f06115823cc50e63e32d755e2b7021223067d'
FALSE_CREDIT = {
    '2fd0d30178793a0cd56f2104',
    '3d7e15378c0d2f17cf3f0ce3',
    '8548b293d6ed7c817d251d6d',
    '9700f2daabea96e23a75d246',
    'b070f906084d70d3f914175c',
}
DIRECT_TRUE = {
    '2c413d7a66413f62ce72d4ec',
    '3f98850e488d30ac2d86a272',
    '45a307012453509de01f14ad',
    '4af4a8c9c3fec08d348ec5fd',
    '51b33f579d67cf70d1164e72',
    '79548ee87d2fe6778489a76f',
    'a30c6b37e1e9c266aece49e9',
    'bfed0d1ba97a0daf33b14e10',
    'd1fba1d9224f698e3017e52f',
}
CONTROL_TRUE = '6439bc12635f9601bd432cb7'


def sha_file(path):
    hashed = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            hashed.update(block)
    return hashed.hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-r10-strict-audit.' + reason)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--result-sha256', required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    need(len(args.result_sha256) == 64 and not args.output.exists() and
         sha_file(WIRE) == WIRE_SHA and sha_file(MAP) == MAP_SHA and
         sha_file(RESULT) == args.result_sha256,
         'input-drift')
    wire = json.loads(WIRE.read_text())
    mapping = json.loads(MAP.read_text())
    result = json.loads(RESULT.read_text())
    need(wire['blind_wires'] == 38 and wire['maximum_judge_calls'] == 76 and
         mapping['wire_sha256'] == WIRE_SHA and
         len(mapping['rows']) == 38 and
         result['schema_version'] ==
         'are.g03-beam-500k-r10-strict-answer-result/v1' and
         result['status'] == 'completed-19-pairs-two-pass' and
         result['wire_sha256'] == WIRE_SHA and
         result['attempted'] == result['valid'] == 76 and
         len(result['rows']) == 76, 'completed-run')
    by_blind = {row['blind_id']: row for row in mapping['rows']}
    need(len(by_blind) == 38 and set(by_blind) == {
        row['blind_id'] for row in wire['wires']}, 'blind-map')
    seen = defaultdict(dict)
    for row in result['rows']:
        path = RUN / f"ATTEMPT-{row['ordinal']:03}.json"
        need(sha_file(path) == row['raw_sha256'] and row['valid'] is True and
             row['repeat'] in (1, 2) and
             type(row['correct']) is bool and
             row['blind_id'] in by_blind, 'raw-attempt-binding')
        raw = json.loads(path.read_text())
        need(raw['ordinal'] == row['ordinal'] and
             raw['repeat'] == row['repeat'] and
             raw['blind_id'] == row['blind_id'] and
             row['repeat'] not in seen[row['blind_id']],
             'raw-attempt-identity')
        parsed = json.loads(raw['response']['payload']['choices'][0]['message']['content'])
        need(parsed['correct'] == row['correct'] and
             parsed['reason_code'] == row['reason_code'],
             'parsed-binding')
        seen[row['blind_id']][row['repeat']] = row['correct']
    need(len(seen) == 38 and
         all(set(repeats) == {1, 2} for repeats in seen.values()),
         'two-pass-completeness')
    by_pair = defaultdict(dict)
    for blind_id, bound in by_blind.items():
        by_pair[bound['probe_id']][bound['arm']] = seen[blind_id]
    need(len(by_pair) == 19 and
         all(set(arms) == {'control', 'treatment'} for arms in by_pair.values()),
         'paired-completeness')
    false_pass = {probe: by_pair[probe]['treatment'] == {1: False, 2: False}
                  for probe in FALSE_CREDIT}
    true_pass = {probe: by_pair[probe]['treatment'] == {1: True, 2: True}
                 for probe in DIRECT_TRUE}
    control_pass = by_pair[CONTROL_TRUE]['control'] == {1: True, 2: True}
    disagreements = sum(pair[1] != pair[2] for pair in seen.values())
    gate = (all(false_pass.values()) and sum(true_pass.values()) >= 8 and
            control_pass and disagreements <= 2)
    packet = {
        'schema_version': 'are.g03-beam-500k-r10-strict-answer-audit/v1',
        'status': 'audited-exposed-scorer-calibration',
        'wire_sha256': WIRE_SHA, 'map_sha256': MAP_SHA,
        'result_sha256': args.result_sha256,
        'summary': {
            'pairs': 19, 'blind_wires': 38, 'valid_judge_attempts': 76,
            'false_credit_sentinels_passed': sum(false_pass.values()),
            'false_credit_sentinels_required': 5,
            'direct_answer_sentinels_passed': sum(true_pass.values()),
            'direct_answer_sentinels_required': 8,
            'clear_control_answer_passed': control_pass,
            'repeat_disagreements': disagreements,
            'calibration_gate_passed': gate,
        },
        'sentinels': {'false_credit': false_pass, 'direct_answer': true_pass,
                      'clear_control_answer': control_pass},
        'pairs': [{'probe_id': probe, 'arms': arms}
                  for probe, arms in sorted(by_pair.items())],
        'claim_ceiling': 'Exposed scorer calibration only; no independent, native BEAM, or product superiority',
        'open_questions': ['Does the scorer transfer to an untouched cohort?',
                           'Can a source-label integrity rule be fixed prospectively?'],
    }
    raw = (json.dumps(packet, sort_keys=True, indent=2) + '\n').encode()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as stream:
        stream.write(raw)
    print(json.dumps({'summary': packet['summary'],
                      'audit_sha256': hashlib.sha256(raw).hexdigest()},
                     sort_keys=True))


if __name__ == '__main__':
    main()
