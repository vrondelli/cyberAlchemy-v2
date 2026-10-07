#!/usr/bin/env python3
"""Create independent empty Vlad/Dave label-disposition forms."""

import hashlib
import json
import os
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-100k-ie-r13')
INPUT = ROOT / 'LABEL-REVIEW-INPUT.json'
INPUT_SHA = '74a51190fcf675ca5ad7f1e54121da98a576b05b85333d8dcdd8698b10b45970'
HISTORIES = ROOT / 'LABEL-REVIEW-HISTORIES.json'
HISTORIES_SHA = '2bbf93c78e0b26662e306aae692030166d89b3652f64d4ae9559832eca53cb99'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError('g03-beam-r13-review-form.' + reason)


def main():
    need(sha(INPUT) == INPUT_SHA and sha(HISTORIES) == HISTORIES_SHA,
         'input-drift')
    source = json.loads(INPUT.read_text())
    ids = [case['probe_id'] for case in source['cases']]
    need(len(ids) == len(set(ids)) == 32, 'probe-count')
    outputs = {}
    for reviewer in ('Vlad', 'Dave'):
        path = ROOT / f'LABEL-REVIEW-{reviewer.upper()}-TEMPLATE.json'
        need(not path.exists(), 'output-exists')
        packet = {
            'schema_version': 'are.g03-beam-100k-ie-r13-review-form/v1',
            'status': 'blank-answer-blind-review-form',
            'reviewer': reviewer,
            'review_input_sha256': INPUT_SHA,
            'full_histories_sha256': HISTORIES_SHA,
            'allowed_dispositions': ['supported-current', 'conflicted',
                                     'ambiguous'],
            'decisions': [{'probe_id': probe_id, 'disposition': None,
                           'evidence_turn_ids': [], 'reason': None}
                          for probe_id in ids],
            'arm_answers_seen': False, 'scorer_outputs_seen': False,
            'open_questions': ['Review all 32 cases independently before any arm answer or scorer output is opened.'],
        }
        raw = (json.dumps(packet, sort_keys=True, indent=2) + '\n').encode()
        with os.fdopen(os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL,
                               0o600), 'wb') as stream:
            stream.write(raw)
        outputs[reviewer] = {'path': str(path),
                             'template_sha256': hashlib.sha256(raw).hexdigest()}
    print(json.dumps({'status': 'blank-independent-forms-created',
                      'cases_per_reviewer': len(ids),
                      'outputs': outputs}, sort_keys=True))


if __name__ == '__main__':
    main()
