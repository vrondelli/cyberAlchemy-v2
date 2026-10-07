#!/usr/bin/env python3
"""Evaluator-only gold overlap of sealed G01 r17 explicit-file candidates."""

import hashlib
import json
import os
from collections import defaultdict
from pathlib import Path

import pyarrow.parquet as parquet


ARCHIVE = Path('/home/vlad_/are-benchmark-archive')
SOURCE = ARCHIVE / 'g01-r17-explicit-file-exposed-r1-20261004/SOURCE-SEAL.json'
SOURCE_SHA = '2a3ccd5b7546b4f7d0f6f878a3f66e3dc2aaef0a98ecd4701f0d81191f2ea18e'
PARQUET = ARCHIVE / 'g01-r8-eight-task-evaluator-r1/full.parquet'
PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
OUTPUT = SOURCE.parent / 'EVALUATOR-AUDIT.json'


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024*1024), b''):
            h.update(block)
    return h.hexdigest()


def norm(path):
    path = path.replace('\\', '/')
    if path.startswith('/testbed/'):
        path = path[len('/testbed/'):]
    elif path.startswith('/workspace/'):
        parts = path[len('/workspace/'):].split('/', 1)
        path = parts[1] if len(parts) == 2 else parts[0]
    return path.lstrip('/').removeprefix('./')


def main():
    if OUTPUT.exists() or sha(SOURCE) != SOURCE_SHA or sha(PARQUET) != PARQUET_SHA:
        raise SystemExit('output-exists-or-input-drift')
    source = json.loads(SOURCE.read_text())
    references = parquet.read_table(PARQUET, columns=['instance_id', 'base_commit', 'gold_context']).to_pylist()
    by_id = {row['instance_id']: row for row in references}
    if len(by_id) != len(references) or len(source['rows']) != 24:
        raise SystemExit('population-shape')
    rows = []
    hits_by_repo = defaultdict(int)
    for row in source['rows']:
        reference = by_id[row['instance_id']]
        if reference['base_commit'] != row['base_commit']:
            raise SystemExit(f'base-commit-drift:{row["ordinal"]}')
        gold = {norm(item['file']) for item in json.loads(reference['gold_context'])}
        proposed = [norm(item['path']) for item in row['resolved_candidates']]
        if len(proposed) != len(set(proposed)):
            raise SystemExit(f'duplicate-proposal:{row["ordinal"]}')
        hits = len(set(proposed) & gold)
        hits_by_repo[row['repo']] += hits
        rows.append({'ordinal': row['ordinal'], 'repo': row['repo'],
                     'proposed_files': len(proposed), 'gold_hits': hits,
                     'false_positive_files': len(proposed)-hits,
                     'gold_files': len(gold)})
    proposed = sum(row['proposed_files'] for row in rows)
    hits = sum(row['gold_hits'] for row in rows)
    precision = hits/proposed if proposed else 0.0
    repositories = sum(value>0 for value in hits_by_repo.values())
    gate = source['policy']['advancement_gate']
    passed = (hits >= gate['minimum_gold_hits'] and
              precision >= gate['minimum_candidate_precision'] and
              repositories >= gate['minimum_repositories_with_hit'])
    report = {'schema_version': 'g01.r17-explicit-file-evaluator-r1/v1',
              'posture': 'evaluator-only-exposed-source-candidate-coverage-no-actual-read',
              'input_sha256': {'source': SOURCE_SHA, 'parquet': PARQUET_SHA},
              'script_sha256': sha(Path(__file__)), 'gate': gate, 'gate_pass': passed,
              'summary': {'tasks': len(rows), 'tasks_with_candidates': sum(row['proposed_files']>0 for row in rows),
                          'proposed_files': proposed, 'gold_hits': hits,
                          'false_positive_files': proposed-hits, 'candidate_precision': precision,
                          'repositories_with_hit': repositories},
              'rows': rows,
              'claim_ceiling': 'Exposed candidate overlap only; no actual ARE read, native F1, cost, independent transfer or superiority.'}
    data = (json.dumps(report, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'summary': report['summary'], 'gate_pass': passed,
                      'sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
