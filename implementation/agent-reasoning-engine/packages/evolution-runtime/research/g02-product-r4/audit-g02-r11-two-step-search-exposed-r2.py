#!/usr/bin/env python3
"""Evaluator-only audit of the sealed r2 exposed search selections."""

import hashlib
import json
import os
from collections import defaultdict
from pathlib import Path

import pyarrow.parquet as parquet


ROOT = Path('/home/vlad_/are-benchmark-archive')
RUN = ROOT / 'g02-r11-two-step-search-exposed-r2-20261004'
PACKETS = ROOT / 'g02-r11-search-packets-exposed-r1-20261004/PACKETS.json'
PARQUET = ROOT / 'g01-r8-eight-task-evaluator-r1/full.parquet'
OLD_AUDIT = ROOT / 'g02-r11-hybrid-24-choice-exposed-r3-20261004/EVALUATOR-AUDIT.json'
PINS = {
    RUN / 'FREEZE.json': '885f61301cff67557794390a1510d7311101055fce25c0c3fbefb99f9a84ce46',
    RUN / 'RUN-RESULT.json': 'b268059bf5bfff87ff09b71e5869cca6f6a98bc931d775941d8dc28a74c0b67a',
    PACKETS: '2c10c75d0e9ddf495210db994bc34b63c4cb3cec0cf46079ef4a630c5a6cfb6b',
    PARQUET: '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8',
    OLD_AUDIT: 'a58fc4a17c1a1f372b90bf753e356321b1e83bc20eb4f35fac2f88f4a2eddcff',
}


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def load(path):
    return json.loads(path.read_text())


def norm(path):
    path = path.replace('\\', '/')
    if path.startswith('/testbed/'):
        path = path[len('/testbed/'):]
    elif path.startswith('/workspace/'):
        parts = path[len('/workspace/'):].split('/', 1)
        path = parts[1] if len(parts) == 2 else parts[0]
    return path.lstrip('/').removeprefix('./')


def f1(predicted, gold):
    return 2 * len(predicted & gold) / (len(predicted) + len(gold)) if predicted or gold else 1.0


def main():
    output = RUN / 'EVALUATOR-AUDIT.json'
    if output.exists() or any(sha(path) != expected for path, expected in PINS.items()):
        raise SystemExit('output-exists-or-input-pin-drift')
    freeze, result = load(RUN / 'FREEZE.json'), load(RUN / 'RUN-RESULT.json')
    packets = load(PACKETS)['ordered_packets']
    if (freeze['schema_version'] != 'g02.r11-two-step-search-freeze-r2/v1' or
            freeze['maximum_generation_calls'] != 24 or
            freeze['automatic_retries'] != 0 or
            freeze['maximum_new_reads'] != 3 or
            result['attempted'] != 12 or result['completed'] != 11 or
            len(packets) != 12):
        raise SystemExit('run-or-freeze-drift')
    table = parquet.read_table(PARQUET, columns=['instance_id', 'base_commit', 'gold_context']).to_pylist()
    native = {row['instance_id']: row for row in table}
    old = load(OLD_AUDIT)
    old_rows = {row['ordinal']: row for row in old['rows']}
    if len(native) != len(table) or len(old_rows) != 12:
        raise SystemExit('reference-or-old-audit-drift')
    rows, hits_by_repo = [], defaultdict(int)
    total_calls = 0
    for packet in packets:
        ordinal = packet['ordinal']
        raw = ROOT / 'g02-product-replication-r11-20261002/pairs' / f'{ordinal:02d}-pr11-mixed-{ordinal:02d}' / 'raw'
        prediction_path = raw / 'policy-pruning/prediction.json'
        if (sha(prediction_path) != old_rows[ordinal]['prediction_sha256'] or
                native[packet['instance_id']]['base_commit'] != packet['base_commit']):
            raise SystemExit(f'identity-or-prediction-drift:{ordinal}')
        selected = {norm(path) for path in load(prediction_path)['traj_data']['pred_files']}
        gold = {norm(item['file']) for item in json.loads(native[packet['instance_id']]['gold_context'])}
        if abs(f1(selected, gold) - old_rows[ordinal]['baseline_file_f1']) > 1e-12:
            raise SystemExit(f'baseline-drift:{ordinal}')
        planner = load(RUN / f'RESPONSE-{ordinal}-planner.json')
        total_calls += 1
        if planner['status'] != 'valid':
            if ordinal != 5 or (RUN / f'SELECTION-{ordinal}.json').exists():
                raise SystemExit(f'unexpected-invalid:{ordinal}')
            proposed = set()
        else:
            search_path = RUN / f'SEARCH-{ordinal}.json'
            search = load(search_path)
            if search['planner_response_sha256'] != sha(RUN / f'RESPONSE-{ordinal}-planner.json'):
                raise SystemExit(f'search-drift:{ordinal}')
            candidates = search['candidates']
            chooser = load(RUN / f'RESPONSE-{ordinal}-chooser.json')
            total_calls += 1
            if chooser['status'] != 'valid':
                raise SystemExit(f'unexpected-chooser-invalid:{ordinal}')
            selection = load(RUN / f'SELECTION-{ordinal}.json')
            paths = [candidates[identifier - 1]['path'] for identifier in chooser['value']]
            if (selection['ids'] != chooser['value'] or selection['paths'] != paths or
                    len(paths) > 3 or len(paths) != len(set(paths)) or
                    any(path in packet['delivered_paths'] for path in paths)):
                raise SystemExit(f'selection-drift:{ordinal}')
            proposed = {norm(path) for path in paths}
        if proposed & selected:
            raise SystemExit(f'already-selected:{ordinal}')
        hits = len(proposed & gold)
        hits_by_repo[packet['repo']] += hits
        rows.append({'ordinal': ordinal, 'repo': packet['repo'], 'proposals': len(proposed),
                     'new_gold_hits': hits, 'false_positive_files': len(proposed) - hits,
                     'baseline_file_f1': f1(selected, gold),
                     'expanded_file_f1': f1(selected | proposed, gold)})
    if total_calls != 23 or [row['ordinal'] for row in rows] != list(range(1, 13)):
        raise SystemExit('call-or-row-count-drift')
    proposals = sum(row['proposals'] for row in rows)
    hits = sum(row['new_gold_hits'] for row in rows)
    mean = lambda field: sum(row[field] for row in rows) / 12
    summary = {'tasks_attempted': 12, 'valid_pairs': 11, 'generation_calls': total_calls,
               'proposals': proposals, 'new_gold_hits': hits, 'false_positive_files': proposals - hits,
               'proposal_precision': hits / proposals if proposals else 0,
               'repositories_with_hit': sum(value > 0 for value in hits_by_repo.values()),
               'baseline_mean_file_f1': mean('baseline_file_f1'),
               'expanded_mean_file_f1': mean('expanded_file_f1'),
               'dsh_mean_file_f1': old['summary']['dsh_mean_file_f1']}
    gate = freeze['advancement_gate']
    passed = (result['completed'] == 12 and hits >= gate['minimum_new_gold_hits'] and
              summary['repositories_with_hit'] >= gate['minimum_repositories_with_hit'] and
              summary['proposal_precision'] >= gate['minimum_proposal_precision'] and
              summary['expanded_mean_file_f1'] > summary['dsh_mean_file_f1'])
    report = {'schema_version': 'g02.r11-two-step-search-evaluator-r2/v1',
              'posture': 'evaluator-only exposed set-based File-F1 replay; no actual ARE reads',
              'input_sha256': {str(path): expected for path, expected in PINS.items()},
              'summary': summary, 'rows': rows, 'advancement_gate_pass': passed,
              'claim_ceiling': 'No actual ARE read, native Span-F1, independent cohort, or superiority.'}
    data = (json.dumps(report, indent=2, sort_keys=True) + '\n').encode()
    fd = os.open(output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'summary': summary, 'advancement_gate_pass': passed,
                      'audit_sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
