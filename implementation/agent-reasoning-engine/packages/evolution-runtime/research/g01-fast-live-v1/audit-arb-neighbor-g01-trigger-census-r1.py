#!/usr/bin/env python3
"""Gold-blind upper-bound census of ARB test/source trigger on G01 tasks."""

import hashlib
import importlib.util
import json
import os
import re
import sys
from collections import defaultdict
from pathlib import Path

import pyarrow.parquet as parquet


ARCHIVE = Path('/home/vlad_/are-benchmark-archive')
TASKS = ARCHIVE / 'g01-r8-eight-task-evaluator-r1/full.parquet'
TASKS_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
MECHANISM = Path(__file__).parent.parent / 'arb-trace2code-r1/probe-trace-source-neighbor-r1.py'
MECHANISM_SHA = 'dd2fc32df6621afd054d5ede52a9894a08f7bf3b0ecbd09a60d95f27c58a6db5'
OUTPUT = ARCHIVE / 'g01-arb-neighbor-transfer-census-r1-20261004/CENSUS.json'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def main():
    if OUTPUT.exists() or sha(TASKS.read_bytes()) != TASKS_SHA or sha(MECHANISM.read_bytes()) != MECHANISM_SHA:
        raise SystemExit('output-exists-or-input-drift')
    sys.dont_write_bytecode = True
    spec = importlib.util.spec_from_file_location('arb_neighbor_r1', MECHANISM)
    if spec is None or spec.loader is None:
        raise SystemExit('mechanism-import')
    mechanism = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mechanism)
    rows = parquet.read_table(TASKS, columns=['instance_id', 'language', 'repo', 'problem_statement']).to_pylist()
    if len(rows) != 1136 or len({row['instance_id'] for row in rows}) != len(rows):
        raise SystemExit('population-drift')
    by_language = defaultdict(lambda: {'tasks': 0, 'test_filename_mentions': 0})
    qualifying_ids = []
    name_count = 0
    missing_issue_count = 0
    for row in rows:
        issue = row['problem_statement']
        if issue is None:
            missing_issue_count += 1
            issue = ''
        if not isinstance(issue, str):
            raise SystemExit('issue-shape')
        names = {name.lower() for name in re.findall(r'[A-Za-z0-9_./-]+', issue)
                 if mechanism.TEST_NAME.search(name)}
        group = by_language[row['language']]
        group['tasks'] += 1
        group['test_filename_mentions'] += bool(names)
        name_count += len(names)
        if names:
            qualifying_ids.append(row['instance_id'])
    result = {'schema_version': 'g01.arb-neighbor-trigger-census-r1/v1',
              'posture': 'source-only-gold-blind-transfer-upper-bound',
              'input_sha256': {'contextbench_parquet': TASKS_SHA, 'arb_mechanism': MECHANISM_SHA},
              'projected_columns': ['instance_id', 'language', 'repo', 'problem_statement'],
              'script_sha256': sha(Path(__file__).read_bytes()),
              'population_tasks': len(rows), 'issue_test_filename_mention_tasks': len(qualifying_ids),
              'missing_issue_count': missing_issue_count,
              'distinct_test_name_mentions_across_issues': name_count,
              'qualifying_id_set_sha256': sha('\n'.join(sorted(qualifying_ids)).encode()),
              'by_language': dict(sorted(by_language.items())),
              'interpretation': 'At most these tasks can trigger the exact ARB test-to-source rule from full issue text; ranking membership, source counterpart, and 1024-byte edge-window constraints can only reduce actual triggers.',
              'claim_ceiling': 'Input-trigger prevalence only; no runtime integration, model calls, labels, scores or superiority.'}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    OUTPUT.parent.mkdir(mode=0o700, parents=True, exist_ok=False)
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'population_tasks': len(rows),
                      'issue_test_filename_mention_tasks': len(qualifying_ids),
                      'by_language': result['by_language'], 'sha256': sha(data)}))


if __name__ == '__main__':
    main()
