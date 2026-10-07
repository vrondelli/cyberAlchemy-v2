"""Evaluator-only coverage ceiling for the sealed exposed G02 anchor screen.

Reads evaluator labels only after the source-only SCREEN.json was sealed. It
does not create a model packet, choose an additional file, or open fresh cases.
Open question: can a bounded policy preserve this ceiling at useful precision?
"""

import hashlib
import json
import os
from collections import defaultdict
from pathlib import Path

import pyarrow.parquet as parquet


ROOT = Path('/home/vlad_/are-benchmark-archive')
SCREEN = ROOT / 'g02-r11-active-verification-source-screen-r1-20261005/SCREEN.json'
SCREEN_SHA = '0edf95c4a9a72e28dc2ff7f4609cdaa771b8c9158b2f9bab74096f097087588e'
PACKETS = ROOT / 'g02-r11-baseline-delta-packets-exposed-r1-20261005/PACKETS.json'
PACKETS_SHA = '050acc7b183a8f6db8cdc4f7bab8561b1c381e9a3ce59c01d1928930947357a7'
PARQUET = ROOT / 'g01-r8-eight-task-evaluator-r1/full.parquet'
PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
OUTPUT = SCREEN.parent / 'COVERAGE-AUDIT.json'


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def normalize(path):
    path = path.replace('\\', '/')
    if path.startswith('/testbed/'):
        path = path[len('/testbed/'):]
    elif path.startswith('/workspace/'):
        parts = path[len('/workspace/'):].split('/', 1)
        path = parts[1] if len(parts) == 2 else parts[0]
    return path.lstrip('/').removeprefix('./')


def main():
    if OUTPUT.exists() or sha(SCREEN) != SCREEN_SHA or sha(PACKETS) != PACKETS_SHA or sha(PARQUET) != PARQUET_SHA:
        raise SystemExit('output-exists-or-input-drift')
    screen = json.loads(SCREEN.read_text())
    packets = json.loads(PACKETS.read_text())['ordered_packets']
    if len(screen['rows']) != 12 or len(packets) != 12:
        raise SystemExit('denominator-drift')
    references = parquet.read_table(PARQUET, columns=['instance_id', 'base_commit', 'gold_context']).to_pylist()
    native = {row['instance_id']: row for row in references}
    if len(native) != len(references):
        raise SystemExit('reference-identity-drift')
    rows = []
    repository_hits = defaultdict(int)
    for ordinal, (source_row, packet) in enumerate(zip(screen['rows'], packets), 1):
        if source_row['ordinal'] != ordinal or packet['ordinal'] != ordinal or source_row['repo'] != packet['repo']:
            raise SystemExit(f'packet-identity:{ordinal}')
        reference = native[packet['instance_id']]
        binding = json.loads((ROOT / f'g02-product-replication-r11-20261002/pairs/{ordinal:02d}-pr11-mixed-{ordinal:02d}/raw/tasks/binding.json').read_text())
        if reference['base_commit'] != binding['base_commit'] or packet['instance_id'] != binding['instance_id']:
            raise SystemExit(f'base-identity:{ordinal}')
        gold = {normalize(item['file']) for item in json.loads(reference['gold_context'])}
        baseline = {normalize(item['path']) for item in packet['baseline_selected']}
        hidden = {normalize(item['path']) for item in source_row['hidden_anchor_candidates']}
        if hidden & baseline or len(hidden) != source_row['hidden_anchor_count']:
            raise SystemExit(f'candidate-identity:{ordinal}')
        hits = hidden & (gold - baseline)
        repository_hits[packet['repo']] += len(hits)
        rows.append({'ordinal': ordinal, 'repo': packet['repo'], 'hidden_candidates': len(hidden),
                     'gold_outside_baseline': len(gold - baseline), 'new_gold_hits': len(hits),
                     'new_gold_paths': sorted(hits)})
    summary = {'tasks': len(rows), 'hidden_candidate_placements': sum(row['hidden_candidates'] for row in rows),
               'new_gold_hits': sum(row['new_gold_hits'] for row in rows),
               'repositories_with_hit': sum(count > 0 for count in repository_hits.values()),
               'by_repository_hits': dict(sorted(repository_hits.items()))}
    gate = {'minimum_new_gold_hits': 3, 'minimum_repositories_with_hit': 2}
    passed = summary['new_gold_hits'] >= 3 and summary['repositories_with_hit'] >= 2
    report = {'schema_version': 'g02.r11-active-verification-coverage-audit-r1/v1',
              'posture': 'evaluator-only-exposed-ceiling-no-model-no-fresh-cases',
              'screen_sha256': SCREEN_SHA, 'packets_sha256': PACKETS_SHA,
              'parquet_sha256': PARQUET_SHA, 'script_sha256': sha(Path(__file__)),
              'gate': gate, 'gate_pass': passed, 'summary': summary, 'rows': rows,
              'claim_ceiling': 'Set-reach ceiling only, not precision, actual ARE reads, native score, matched cost, or superiority.',
              'open_questions': ['Can a bounded second-observation policy select these paths without false additions?']}
    encoded = (json.dumps(report, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(encoded)
    print(json.dumps({'summary': summary, 'gate_pass': passed,
                      'sha256': hashlib.sha256(encoded).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
