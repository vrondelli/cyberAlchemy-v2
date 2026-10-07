#!/usr/bin/env python3
"""Verify raw r12 scorer receipts and the prospectively fixed calibration gate."""

import argparse
from collections import defaultdict
import hashlib
import json
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1')
WIRE = ROOT / 'R11-SOURCE-GROUNDED-WIRES.json'
MAP = ROOT / 'R11-SOURCE-GROUNDED-MAP.json'
RUN = ROOT / 'R12-SOURCE-GROUNDED-JUDGE-RUN'
WIRE_SHA = '52cc77871a879261a3fd5631da00b1b846a520088c77cdcadd0227b4387e448e'
MAP_SHA = '9a8942d94fee2f5c78946a8206f817fa44088ed0e0fca6dcd66be752ddb8010c'
FALSE_CREDIT = {
    '2fd0d30178793a0cd56f2104', '3d7e15378c0d2f17cf3f0ce3',
    '8548b293d6ed7c817d251d6d', '9700f2daabea96e23a75d246',
    'b070f906084d70d3f914175c',
}
DIRECT_TRUE = {
    '2c413d7a66413f62ce72d4ec', '3f98850e488d30ac2d86a272',
    '45a307012453509de01f14ad', '4af4a8c9c3fec08d348ec5fd',
    '51b33f579d67cf70d1164e72', '79548ee87d2fe6778489a76f',
    'a30c6b37e1e9c266aece49e9', 'bfed0d1ba97a0daf33b14e10',
    'd1fba1d9224f698e3017e52f',
}
CONTROL_TRUE = '6439bc12635f9601bd432cb7'


def sha_file(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError('g03-beam-r12-source-audit.' + reason)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--result-sha256', required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    result_path = RUN / 'RUN-RESULT.json'
    need(not args.output.exists() and sha_file(WIRE) == WIRE_SHA and
         sha_file(MAP) == MAP_SHA and
         sha_file(result_path) == args.result_sha256, 'input-drift')
    wire = json.loads(WIRE.read_text())
    mapping = json.loads(MAP.read_text())
    result = json.loads(result_path.read_text())
    need(wire['blind_wires'] == 38 and wire['maximum_judge_calls'] == 76 and
         wire['cited_turns_truncated'] is False and
         mapping['wire_sha256'] == WIRE_SHA and
         result['schema_version'] ==
         'are.g03-beam-500k-r12-source-judge-result/v1' and
         result['status'] in ('completed-19-pairs-two-pass',
                              'terminal-incomplete') and
         result['wire_sha256'] == WIRE_SHA and
         result['attempted'] == len(result['rows']) <= 76 and
         result['valid'] == sum(r['valid'] for r in result['rows']) and
         result['automatic_retries'] == 0, 'terminal-run')
    by_blind = {row['blind_id']: row for row in mapping['rows']}
    need(len(by_blind) == 38 and set(by_blind) == {
        row['blind_id'] for row in wire['wires']}, 'blind-map')
    seen = defaultdict(dict)
    invalid = 0
    for row in result['rows']:
        path = RUN / f"ATTEMPT-{row['ordinal']:03}.json"
        need(sha_file(path) == row['raw_sha256'] and
             row['repeat'] in (1, 2) and
             row['blind_id'] in by_blind, 'raw-attempt-binding')
        raw = json.loads(path.read_text())
        need(raw['ordinal'] == row['ordinal'] and
             raw['repeat'] == row['repeat'] and
             raw['blind_id'] == row['blind_id'] and
             row['repeat'] not in seen[row['blind_id']], 'raw-identity')
        if not row['valid']:
            invalid += 1
            need(row is result['rows'][-1] and
                 row['correct'] is None and row['reason_code'] is None,
                 'invalid-terminal')
            continue
        need(type(row['correct']) is bool, 'valid-correct-type')
        parsed = json.loads(raw['response']['payload']['choices'][0]
                            ['message']['content'])
        need(parsed['correct'] == row['correct'] and
             parsed['reason_code'] == row['reason_code'], 'parsed-binding')
        seen[row['blind_id']][row['repeat']] = row['correct']
    need((result['status'] == 'terminal-incomplete' and invalid == 1 or
          result['status'] == 'completed-19-pairs-two-pass' and invalid == 0
          and result['attempted'] == 76) and
         sum(len(v) for v in seen.values()) == result['valid'],
         'terminal-completeness')
    by_pair = defaultdict(dict)
    for blind_id, bound in by_blind.items():
        by_pair[bound['probe_id']][bound['arm']] = seen[blind_id]
    need(set(by_pair) <= {row['probe_id'] for row in mapping['rows']},
         'paired-identity')
    false_pass = {p: by_pair.get(p, {}).get('treatment') ==
                  {1: False, 2: False}
                  for p in FALSE_CREDIT}
    true_pass = {p: by_pair.get(p, {}).get('treatment') ==
                 {1: True, 2: True}
                 for p in DIRECT_TRUE}
    control_pass = by_pair.get(CONTROL_TRUE, {}).get('control') == \
        {1: True, 2: True}
    disagreements = sum(v[1] != v[2] for v in seen.values() if len(v) == 2)
    gate = (result['status'] == 'completed-19-pairs-two-pass' and
            all(false_pass.values()) and sum(true_pass.values()) >= 8 and
            control_pass and disagreements <= 2)
    packet = {
        'schema_version': 'are.g03-beam-500k-r12-source-judge-audit/v1',
        'status': 'audited-exposed-scorer-calibration',
        'wire_sha256': WIRE_SHA, 'map_sha256': MAP_SHA,
        'result_sha256': args.result_sha256,
        'summary': {
            'pairs': 19, 'blind_wires': 38,
            'attempted_judge_calls': result['attempted'],
            'valid_judge_attempts': result['valid'],
            'terminal_invalid_calls': invalid,
            'false_credit_sentinels_passed': sum(false_pass.values()),
            'false_credit_sentinels_required': 5,
            'direct_answer_sentinels_passed': sum(true_pass.values()),
            'direct_answer_sentinels_required': 8,
            'clear_control_answer_passed': control_pass,
            'repeat_disagreements': disagreements,
            'calibration_gate_passed': gate,
        },
        'sentinels': {'false_credit': false_pass,
                      'direct_answer': true_pass,
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
