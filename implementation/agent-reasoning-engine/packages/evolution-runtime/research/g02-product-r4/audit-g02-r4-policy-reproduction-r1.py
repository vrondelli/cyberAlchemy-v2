#!/usr/bin/env python3
"""Read-only reproduction of all 32 presealed exposed pruning predictions."""

import hashlib
import importlib.util
import json
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-r4-cohort-code-r1/project-g02-r4-selected-pruning-r1.py'
PRIOR = BASE / 'g02-r2-trained-selected-pruning-r1/SEAL.json'
OUTPUT = BASE / 'g02-r4-policy-reproduction-r1/RESULT.json'
PRIOR_SHA = '4fd240425fdba4f216a378e6ca6c27d48627484e07261095cbaffe348f267ddc'
SOURCE_SHA = '4107f9f5e805ec8ce20b6b099fcd876cf5abed3bf045bb70e2b6798089a1ebe2'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError(f'g02-r4-policy-reproduction.{reason}')


def main():
    need(sha(SOURCE) == SOURCE_SHA and sha(PRIOR) == PRIOR_SHA and not OUTPUT.exists(),
         'source-or-output-drift')
    spec = importlib.util.spec_from_file_location('g02_r4_pruning', SOURCE)
    projection = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(projection)
    prior = json.loads(PRIOR.read_text())
    rows = []
    for item in prior['rows']:
        original = Path(item['source_prediction'])
        expected = Path(item['prediction'])
        need(sha(original) == item['source_prediction_sha256'] and
             sha(expected) == item['prediction_sha256'], 'prior-binding')
        root = original.parents[2]
        source_path, packet, features, scores, candidate = projection.project(root)
        need(source_path == original and projection.encoded(candidate) == expected.read_bytes(),
             f'prediction-mismatch:{item["pair"]}')
        rows.append({'cohort': item['cohort'], 'pair': item['pair'],
                     'prediction_sha256': item['prediction_sha256'],
                     'original_files': len(packet['current_selected_files']),
                     'retained_files': len(candidate['traj_data']['pred_files']),
                     'delivered_files': len(features), 'scored_selected_files': len(scores)})
    need(len(rows) == 32 and sum(x['cohort'] == 'r2' for x in rows) == 23 and
         sum(x['cohort'] == 'r3' for x in rows) == 9 and
         sum(x['retained_files'] < x['original_files'] for x in rows) == 12,
         'denominator-or-change-count')
    payload = {'schema_version': 'are.g02-r4-policy-reproduction/v1',
               'status': '32-of-32-exposed-predictions-reproduced',
               'source_sha256': SOURCE_SHA, 'prior_seal_sha256': PRIOR_SHA,
               'script_sha256': sha(__file__), 'rows': rows,
               'claim_ceiling': 'Policy implementation parity on exposed predictions only; no fresh task, native result, or superiority claim.',
               'open_questions': ['Can this projection run after fresh arms settle but before any native score?',
                                  'Will it improve untouched paired quality and all-in efficiency?']}
    OUTPUT.parent.mkdir(mode=0o700)
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': payload['status'], 'sha256': sha(OUTPUT),
                      'changed': sum(x['retained_files'] < x['original_files'] for x in rows)}))


if __name__ == '__main__':
    main()
