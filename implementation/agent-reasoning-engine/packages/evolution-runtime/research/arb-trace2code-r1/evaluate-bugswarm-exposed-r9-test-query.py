#!/usr/bin/env python3
"""Evaluator-only reach screen of sealed r9 test-query candidate lists."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path


BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-confirm-r4')
OUTPUT = BASE / 'exposed-r9/EVALUATION.json'
PINS = {
    'old': (BASE / 'candidates-r7/CANDIDATES.jsonl',
            '91784df7b72cae7502bd742248ac7b1d499e33d27a62ed265a936e7b0caa5056'),
    'new': (BASE / 'exposed-r9/candidates/CANDIDATES.jsonl',
            '7cdd714d5aca367b7ed9a24681391ac3ebd0e8b3e125d0eae1d5d12ce22840f5'),
    'new_seal': (BASE / 'exposed-r9/candidates/CANDIDATE-SEAL.json',
                 '05204ebcab4b1157c524a474f22ea2ff04e7538d5644a73a604b49675e7cdac0'),
    'gold': (BASE / 'evaluator-only/github-tree-r8/TREE-RESULT.json',
             'ac7afb30a2cc62432551cbecfdcf4bbac0186cf2098975c435fda8f981cc8469'),
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(condition: bool, reason: str) -> None:
    if not condition:
        raise SystemExit(reason)


def main() -> None:
    need(not OUTPUT.exists() and
         all(sha(path.read_bytes()) == pin for path, pin in PINS.values()),
         'output-or-input-pin-drift')
    old = [json.loads(line) for line in PINS['old'][0].read_text().splitlines()]
    new = [json.loads(line) for line in PINS['new'][0].read_text().splitlines()]
    gold = json.loads(PINS['gold'][0].read_bytes())['results']
    seal = json.loads(PINS['new_seal'][0].read_bytes())
    need(len(old) == len(new) == len(gold) == seal['cases'] == 24 and
         seal['gold_opened'] is False and seal['candidate_sha256'] == PINS['new'][1],
         'denominator-or-seal-drift')
    rows = []
    for ordinal, (prior, current, label) in enumerate(zip(old, new, gold), 1):
        need(prior['ordinal'] == current['ordinal'] == label['ordinal'] == ordinal and
             prior['id'] == current['id'] == label['id'] and
             prior['repo'] == current['repo'] == label['repo'] and
             label['complete_tree'] and label['direct_changed_old_source_paths'] and
             prior['gold_opened'] is False and current['gold_opened'] is False and
             current['candidate_count'] == len(set(current['candidate_paths'])) <= 80,
             f'case-or-candidate-{ordinal}')
        paths = set(label['direct_changed_old_source_paths'])
        old_reach = bool(paths.intersection(prior['candidate_paths']))
        new_reach = bool(paths.intersection(current['candidate_paths']))
        rows.append({'ordinal': ordinal, 'id': current['id'], 'repo': current['repo'],
                     'old_reach': old_reach, 'new_reach': new_reach,
                     'old_candidates': prior['candidate_count'],
                     'new_candidates': current['candidate_count'],
                     'channel_added': len(current['channel_added'])})
    old_count = sum(row['old_reach'] for row in rows)
    new_count = sum(row['new_reach'] for row in rows)
    gains = [row['ordinal'] for row in rows if row['new_reach'] and not row['old_reach']]
    losses = [row['ordinal'] for row in rows if row['old_reach'] and not row['new_reach']]
    gate = {'complete_24': len(rows) == 24,
            'candidate_reach_at_least_20': new_count >= 20,
            'zero_reach_losses': not losses,
            'maximum_candidates_at_most_80': max(row['new_candidates'] for row in rows) <= 80,
            'no_label_leakage': seal['gold_opened'] is False}
    gate['passed'] = all(gate.values())
    result = {'schema_version': 'are.g01-exposed-r9-test-query-evaluation/v1',
              'pins': {name: pin for name, (_, pin) in PINS.items()},
              'script_sha256': sha(Path(__file__).read_bytes()),
              'old_candidate_reach': old_count, 'new_candidate_reach': new_count,
              'newly_reached_ordinals': gains, 'lost_ordinals': losses,
              'total_old_candidates': sum(row['old_candidates'] for row in rows),
              'total_new_candidates': sum(row['new_candidates'] for row in rows),
              'gate': gate, 'cases': rows,
              'claim_ceiling': 'Exposed development only; no model calls or fresh superiority evidence.'}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'old_reach': old_count, 'new_reach': new_count,
                      'gains': gains, 'losses': losses, 'gate': gate,
                      'evaluation_sha256': sha(data)}))


if __name__ == '__main__':
    main()
