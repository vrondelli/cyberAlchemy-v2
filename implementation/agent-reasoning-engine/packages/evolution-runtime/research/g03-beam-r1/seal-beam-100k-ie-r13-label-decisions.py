#!/usr/bin/env python3
"""Validate independent answer-blind reviewer forms and seal 32 labels."""

import argparse
from collections import Counter
import hashlib
import json
import os
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-100k-ie-r13')
INPUT = ROOT / 'LABEL-REVIEW-INPUT.json'
HISTORIES = ROOT / 'LABEL-REVIEW-HISTORIES.json'
INPUT_SHA = '74a51190fcf675ca5ad7f1e54121da98a576b05b85333d8dcdd8698b10b45970'
HISTORIES_SHA = '2bbf93c78e0b26662e306aae692030166d89b3652f64d4ae9559832eca53cb99'
DISPOSITIONS = {'supported-current', 'conflicted', 'ambiguous'}


def sha_file(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError('g03-beam-r13-label-decision.' + reason)


def read_form(path, reviewer, cases, valid_turns):
    data = json.loads(path.read_text())
    need(data['schema_version'] ==
         'are.g03-beam-100k-ie-r13-review-form/v1' and
         data['reviewer'] == reviewer and
         data['review_input_sha256'] == INPUT_SHA and
         data['full_histories_sha256'] == HISTORIES_SHA and
         data['arm_answers_seen'] is False and
         data['scorer_outputs_seen'] is False and
         len(data['decisions']) == 32, reviewer + '-form-boundary')
    by_id = {row['probe_id']: row for row in data['decisions']}
    need(len(by_id) == 32 and set(by_id) == set(cases),
         reviewer + '-probe-set')
    for probe_id, row in by_id.items():
        need(row['disposition'] in DISPOSITIONS and
             isinstance(row['reason'], str) and
             5 <= len(row['reason'].strip()) <= 2000 and
             isinstance(row['evidence_turn_ids'], list) and
             row['evidence_turn_ids'] and
             all(type(turn_id) is int and turn_id in
                 valid_turns[cases[probe_id]['conversation_key']]
                 for turn_id in row['evidence_turn_ids']) and
             len(set(row['evidence_turn_ids'])) ==
             len(row['evidence_turn_ids']),
             reviewer + '-decision-' + probe_id)
    return by_id


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--vlad', type=Path, required=True)
    parser.add_argument('--dave', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    need(not args.output.exists() and sha_file(INPUT) == INPUT_SHA and
         sha_file(HISTORIES) == HISTORIES_SHA and
         args.vlad != args.dave and args.vlad != INPUT and
         args.dave != INPUT, 'input-boundary')
    review = json.loads(INPUT.read_text())
    histories = json.loads(HISTORIES.read_text())
    cases = {case['probe_id']: case for case in review['cases']}
    valid_turns = {history['conversation_key']: {
        turn['id'] for turn in history['turns']}
        for history in histories['histories']}
    need(len(cases) == 32 and len(valid_turns) == 16,
         'review-population')
    vlad = read_form(args.vlad, 'Vlad', cases, valid_turns)
    dave = read_form(args.dave, 'Dave', cases, valid_turns)
    rows = []
    for probe_id in sorted(cases):
        a, b = vlad[probe_id], dave[probe_id]
        agreed = a['disposition'] == b['disposition']
        disposition = a['disposition'] if agreed else 'ambiguous'
        rows.append({'probe_id': probe_id, 'disposition': disposition,
            'reviewers_agree': agreed,
            'reviewer_dispositions': {'Vlad': a['disposition'],
                                      'Dave': b['disposition']},
            'reviewer_evidence_turn_ids': {
                'Vlad': a['evidence_turn_ids'],
                'Dave': b['evidence_turn_ids']}})
    counts = dict(sorted(Counter(row['disposition'] for row in rows).items()))
    passed = counts.get('supported-current', 0) >= 28
    packet = {
        'schema_version': 'are.g03-beam-100k-ie-r13-label-decisions/v1',
        'status': 'answer-blind-two-reviewer-labels-sealed',
        'review_input_sha256': INPUT_SHA,
        'histories_sha256': HISTORIES_SHA,
        'vlad_form_sha256': sha_file(args.vlad),
        'dave_form_sha256': sha_file(args.dave),
        'total_selected_questions': 32,
        'disposition_counts': counts,
        'minimum_supported_current': 28,
        'label_integrity_gate_passed': passed,
        'rows': rows,
        'arm_answers_read': False, 'scorer_outputs_read': False,
        'claim_ceiling': 'Answer-blind reference-integrity dispositions only; no answer score or superiority',
        'open_questions': ['Does the frozen direct-answer scorer transfer to all 32 matched pairs?',
                           'Does a cluster-level paired interval support a bounded claim?'],
    }
    raw = (json.dumps(packet, sort_keys=True, indent=2) + '\n').encode()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with os.fdopen(os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_EXCL,
                           0o600), 'wb') as stream:
        stream.write(raw)
    print(json.dumps({'status': packet['status'], 'counts': counts,
        'label_integrity_gate_passed': passed,
        'receipt_sha256': hashlib.sha256(raw).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
