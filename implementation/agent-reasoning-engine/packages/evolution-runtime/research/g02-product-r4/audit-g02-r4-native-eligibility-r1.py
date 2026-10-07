#!/usr/bin/env python3
"""Evaluator-only file-presence admission for the selected G02 r4 candidate."""

import hashlib
import json
import sys
from collections import Counter
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
ROOT = BASE / 'g02-r4-fresh-cohort-candidate-r1'
CANDIDATE = ROOT / 'CANDIDATE.json'
OUTPUT = ROOT / 'NATIVE-ELIGIBILITY.json'
UPSTREAM = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
PARQUET = UPSTREAM / 'data/full.parquet'
CANDIDATE_SHA = 'e4408a93c501bfe0ea57d8ef412155bb3db7f969aefb646392b1a6ff7bed5f08'
PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError(f'g02-r4-native-eligibility.{reason}')


def main():
    need(sha(CANDIDATE) == CANDIDATE_SHA and sha(PARQUET) == PARQUET_SHA and
         not OUTPUT.exists(), 'input-or-output-drift')
    candidate = json.loads(CANDIDATE.read_text())
    tasks = candidate['ordered_tasks']
    need(len(tasks) == 24 and len({task['instance_id'] for task in tasks}) == 24,
         'candidate-shape')
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader
    loader = GoldLoader(str(PARQUET))
    by_repo = Counter()
    for task in tasks:
        # Never serialize, print, or transfer native gold paths or spans.
        eligible = bool(loader.get(task['instance_id']).files())
        need(eligible, f'missing-native-file-presence:{task["instance_id"]}')
        by_repo[task['repo']] += 1
    payload = {'schema_version': 'are.g02-r4-native-eligibility/v1',
               'posture': 'evaluator-only-file-presence-bit-no-gold-path-export',
               'candidate_sha256': CANDIDATE_SHA, 'parquet_sha256': PARQUET_SHA,
               'script_sha256': sha(__file__), 'eligible_count': sum(by_repo.values()),
               'repository_eligible_counts': dict(sorted(by_repo.items())),
               'claim_ceiling': 'Native gold file-presence only; does not establish scoring validity, quality, or superiority.',
               'open_questions': ['Will all 24 predictions be valid and independently scored?',
                                  'Does the fresh paired cohort satisfy frozen quality and cost intervals?']}
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'eligible': payload['eligible_count'], 'sha256': sha(OUTPUT),
                      'repository_counts': payload['repository_eligible_counts']}))


if __name__ == '__main__':
    main()
