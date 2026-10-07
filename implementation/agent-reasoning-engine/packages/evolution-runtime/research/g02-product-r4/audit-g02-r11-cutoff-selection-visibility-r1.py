#!/usr/bin/env python3
"""Evaluator-only visibility bound for archived final selections at call ten."""

import hashlib
import importlib.util
import json
import os
from pathlib import Path


HERE = Path(__file__).resolve().parent
PRIOR = HERE / 'audit-g02-r11-call-cutoff-coverage-exposed-r1.py'
PRIOR_SHA = '6264b8313415704116de2733194815454b26008410550349420d03695959323a'
SOURCE = Path('/home/vlad_/are-benchmark-archive/g02-r11-retrieval-exposed-r1-20261002/SEAL.json')
SOURCE_SHA = 'eb6295120ed72c227589db7c88920bb8654b170af19f9677c553824919782901'
ROOT = Path('/home/vlad_/are-benchmark-archive/g02-product-replication-r11-20261002')
OUTPUT = Path('/home/vlad_/are-benchmark-archive/g02-r11-cutoff-selection-visibility-r1-20261005/AUDIT.json')
CUTOFF = 10
GATE = {'all_final_selected_known_cases_min': 10, 'missing_selected_paths_total_max': 2}


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def main():
    if OUTPUT.exists() or sha(PRIOR) != PRIOR_SHA or sha(SOURCE) != SOURCE_SHA:
        raise SystemExit('output-exists-or-input-drift')
    spec = importlib.util.spec_from_file_location('g02_cutoff_prior', PRIOR)
    prior = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(prior)
    source = json.loads(SOURCE.read_text())
    if source['schema_version'] != 'g02.r11-retrieval-exposed-seal/v1' or len(source['rows']) != 12:
        raise SystemExit('cohort-shape')
    rows = []
    for item in source['rows']:
        ordinal = item['ordinal']
        raw = ROOT / 'pairs' / f'{ordinal:02d}-pr11-mixed-{ordinal:02d}' / 'raw'
        decision_path = raw / 'PAIR-DECISION.json'
        prediction_path = raw / 'policy-pruning/prediction.json'
        ledger_path = raw / 'evidence/run/state/glm-transport-ledger.json'
        events_path = raw / 'evidence/run/events.jsonl'
        decision = json.loads(decision_path.read_text())
        prediction = json.loads(prediction_path.read_text())
        ledger = json.loads(ledger_path.read_text())
        events = [json.loads(line) for line in events_path.read_text().splitlines()]
        if (decision['instance_id'] != item['instance_id']
                or prediction['instance_id'] != item['instance_id']
                or ledger['model_calls'] != len([event for event in events
                                                 if event['kind'] == 'model-response'])):
            raise SystemExit(f'identity-or-call-drift:{ordinal}')
        initial = [event for event in events if event['kind'] == 'initial-source-packet']
        if len(initial) != 1:
            raise SystemExit(f'initial-count:{ordinal}')
        all_known = prior.read_paths(initial[0])
        known10 = set(all_known)
        for event in events:
            if event['kind'] != 'tool-result':
                continue
            paths = prior.read_paths(event)
            all_known.update(paths)
            if event['step'] < CUTOFF:
                known10.update(paths)
        if all_known != {prior.normalize(path) for path in item['delivered_paths']}:
            raise SystemExit(f'known-path-parity:{ordinal}')
        selected = {prior.normalize(path) for path in prediction['traj_data']['pred_files']}
        if not selected or any(not path or '..' in Path(path).parts for path in selected):
            raise SystemExit(f'selection-invalid:{ordinal}')
        missing = selected - known10
        rows.append({'ordinal': ordinal, 'repo': item['repo'],
                     'model_calls': ledger['model_calls'],
                     'known_by_ten': len(known10),
                     'final_selected': len(selected),
                     'final_selected_known_by_ten': len(selected & known10),
                     'final_selected_unknown_by_ten': len(missing),
                     'final_selected_never_observed': len(selected - all_known),
                     'prediction_sha256': sha(prediction_path),
                     'ledger_sha256': sha(ledger_path),
                     'events_sha256': sha(events_path),
                     'decision_sha256': sha(decision_path)})
    summary = {'tasks': len(rows),
               'tasks_more_than_ten_calls': sum(row['model_calls'] > CUTOFF for row in rows),
               'all_final_selected_known_cases': sum(row['final_selected_unknown_by_ten'] == 0
                                                     for row in rows),
               'missing_selected_paths_total': sum(row['final_selected_unknown_by_ten'] for row in rows),
               'never_observed_selected_paths_total': sum(row['final_selected_never_observed'] for row in rows),
               'total_final_selected_paths': sum(row['final_selected'] for row in rows)}
    passed = (summary['all_final_selected_known_cases'] >= GATE['all_final_selected_known_cases_min']
              and summary['missing_selected_paths_total'] <= GATE['missing_selected_paths_total_max'])
    packet = {'schema_version': 'g02.r11-cutoff-selection-visibility-r1/v1',
              'posture': 'evaluator-only-exposed-final-selection-visibility-not-a-stopped-run',
              'input_sha256': {str(PRIOR): PRIOR_SHA, str(SOURCE): SOURCE_SHA},
              'script_sha256': sha(Path(__file__)),
              'cutoff_model_calls': CUTOFF, 'gate': GATE, 'gate_pass': passed,
              'rows': rows, 'summary': summary,
              'claim_ceiling': 'Path visibility bound only; no finalization, native score, matched cost, or superiority.',
              'open_questions': ['Could a valid bounded finalizer reproduce quality from the visible evidence?',
                                 'What additional token/time cost would finalization require?']}
    data = (json.dumps(packet, sort_keys=True, indent=2) + '\n').encode()
    OUTPUT.parent.mkdir(mode=0o700, parents=True, exist_ok=False)
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'summary': summary, 'gate_pass': passed,
                      'sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
