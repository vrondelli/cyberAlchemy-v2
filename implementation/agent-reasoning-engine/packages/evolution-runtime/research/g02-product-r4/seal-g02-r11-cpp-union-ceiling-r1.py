#!/usr/bin/env python3
"""Seal the union of pre-existing, source-only r11 C++ acquisition pools."""

import hashlib
import json
import os
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive/g02-r11-retrieval-exposed-r1-20261002')
OUTPUT = Path('/home/vlad_/are-benchmark-archive/g02-r11-cpp-union-ceiling-r1-20261003/SOURCE-UNION.json')
INPUTS = {
    'code': (ROOT / 'SEAL.json', 'eb6295120ed72c227589db7c88920bb8654b170af19f9677c553824919782901'),
    'text': (ROOT / 'BOUNDED-TEXT-SEAL.json', '4f151b3f316c2cf6fe38ddddfb314dc2554961d6bd6723eb95742b486c10de02'),
    'include': (ROOT / 'INCLUDE-NEIGHBORS-SEAL.json', '031c44de02388b89261a921ef3def5a17eecae5c5faa8f308594e9b3a645c15d'),
}
ORDINALS = (4, 8, 12)
MAX_READ_BYTES = 262144


def sha(data):
    return hashlib.sha256(data).hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError('g02-cpp-union-ceiling.' + reason)


def paths(items):
    return {item['path'] for item in items}


def main():
    need(not OUTPUT.exists(), 'output-exists')
    source = {}
    for name, (path, expected) in INPUTS.items():
        data = path.read_bytes()
        need(sha(data) == expected, name + '-sha')
        source[name] = json.loads(data)
        need([row['ordinal'] for row in source[name]['rows'] if row['ordinal'] in ORDINALS] == list(ORDINALS),
             name + '-ordinal-order')
    by_name = {name: {row['ordinal']: row for row in item['rows']}
               for name, item in source.items()}
    rows = []
    for ordinal in ORDINALS:
        code, text, include = (by_name[name][ordinal] for name in ('code', 'text', 'include'))
        identity = (code['instance_id'], code['base_commit'], code['issue_sha256'])
        need(identity == (text['instance_id'], text['base_commit'], text['issue_sha256']) ==
             (include['instance_id'], include['base_commit'], include['issue_sha256']),
             f'{ordinal}-identity')
        delivered = set(code['delivered_paths'])
        need(delivered == set(text['delivered_paths']) == set(include['delivered_paths']),
             f'{ordinal}-delivered')
        channels = {
            'code_raw_top30': paths(code['raw_top30']) - delivered,
            'code_structured_top30': paths(code['structured_top30']) - delivered,
            'bounded_text_top30': paths(text['bounded_text_top30']) - delivered,
            'direct_include_eligible': {item['path'] for item in include['candidates']
                                        if item['bytes'] <= MAX_READ_BYTES} - delivered,
        }
        union = set().union(*channels.values())
        rows.append({'ordinal': ordinal, 'instance_id': identity[0],
                     'base_commit': identity[1], 'issue_sha256': identity[2],
                     'delivered_paths': sorted(delivered),
                     'channel_paths': {key: sorted(value) for key, value in channels.items()},
                     'union_paths': sorted(union)})
    result = {'schema_version': 'are.g02-r11-cpp-union-ceiling-source/v1',
              'posture': 'exposed-source-only-before-evaluator',
              'input_sha256': {name: expected for name, (_, expected) in INPUTS.items()},
              'rows': rows,
              'claim_ceiling': 'Unranked candidate coverage only; no read delivery, model result, native score, independent test, or superiority.',
              'open_questions': ['Does the union materially exceed direct-include gold coverage?',
                                 'Could any bounded three-read ranker select its gold without excessive false positives?']}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    OUTPUT.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    with os.fdopen(os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600), 'wb') as target:
        target.write(data)
    print(json.dumps({'candidate_counts': {row['ordinal']: len(row['union_paths']) for row in rows},
                      'receipt_sha256': sha(data)}, sort_keys=True))


if __name__ == '__main__':
    main()
