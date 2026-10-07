#!/usr/bin/env python3
"""Gold-blind filter of sealed G02 r11 chooser proposals by issue/code identifiers."""

import argparse
import hashlib
import json
import os
import re
from pathlib import Path


PACKETS_SHA256 = 'f82d881f43a9080d8f8996ecbcafbf95edcc18410605336aef0a5bbf9fa4906a'
RESPONSES_SHA256 = '3fc7ff360f87f47aba3ef5b608b0774b140909c8a47adedc7fd3593a41c801c8'
IGNORE = frozenset({'module_utils', 'BooleanField', 'OutputField', 'Traceback',
                    'ValueError', 'Exception', 'False', 'True', 'None'})
IDENTIFIER = re.compile(r'\b[A-Za-z_][A-Za-z0-9_]{4,}\b')


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def issue_identifiers(issue):
    return {term for term in IDENTIFIER.findall(issue)
            if term not in IGNORE and ('_' in term or re.search(r'[a-z][A-Z]', term))}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    source = args.source.resolve(strict=True)
    packets_path, responses_path = source / 'PACKETS.json', source / 'SEALED-RESPONSES.json'
    if args.output.exists() or sha256(packets_path) != PACKETS_SHA256 or \
            sha256(responses_path) != RESPONSES_SHA256:
        raise SystemExit('output-exists-or-input-pin-drift')
    packets = json.loads(packets_path.read_text())['ordered_packets']
    responses = json.loads(responses_path.read_text())['rows']
    if len(packets) != 12 or len(responses) != 12 or \
            [row['ordinal'] for row in packets] != list(range(1, 13)) or \
            [row['ordinal'] for row in responses] != list(range(1, 13)):
        raise SystemExit('cohort-drift')
    rows = []
    for packet, response in zip(packets, responses):
        candidates = {item['path']: item for item in packet['candidates']}
        proposed = response['selected_paths']
        if len(proposed) != len(set(proposed)) or not set(proposed).issubset(candidates) or \
                len(proposed) > packet['maximum_new_reads']:
            raise SystemExit('proposal-drift')
        issue_terms = issue_identifiers(packet['issue'])
        kept = []
        support = {}
        for path in proposed:
            window_text = '\n'.join(window['text'] for window in candidates[path]['code_windows'])
            window_terms = set(IDENTIFIER.findall(window_text))
            matched = sorted(issue_terms & window_terms)
            if matched:
                kept.append(path)
                support[path] = matched
        rows.append({'ordinal': packet['ordinal'], 'repo': packet['repo'],
                     'instance_id': packet['instance_id'], 'original_status': response['status'],
                     'original_paths': proposed, 'selected_paths': kept,
                     'source_support': support})
    output = args.output.absolute()
    output.mkdir(mode=0o700, parents=True, exist_ok=False)
    report = {'schema_version': 'g02.r11-identifier-abstention-source-r4/v1',
              'posture': 'post-confirmation exposed development; source-only counterfactual',
              'rule': 'retain sealed chooser path only if a length>=5 issue identifier '
                      'containing underscore or lower-to-upper case transition, excluding '
                      'fixed generic identifiers, occurs exactly in its sampled code windows',
              'ignored_identifiers': sorted(IGNORE),
              'input_sha256': {'packets': PACKETS_SHA256, 'responses': RESPONSES_SHA256},
              'evaluation_gate': {'tasks': 12, 'minimum_new_gold_hits': 2,
                                  'minimum_repositories_with_hit': 2,
                                  'minimum_proposal_precision': 0.25,
                                  'minimum_mean_file_f1_delta': 0.0},
              'rows': rows, 'gold_opened': False, 'new_model_calls': 0,
              'actual_are_reads': 0}
    data = (json.dumps(report, indent=2, sort_keys=True) + '\n').encode()
    target = output / 'SOURCE-SEAL.json'
    fd = os.open(target, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'cases': len(rows), 'retained_proposals': sum(len(row['selected_paths']) for row in rows),
                      'changed_cases': sum(row['selected_paths'] != row['original_paths'] for row in rows),
                      'source_sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
