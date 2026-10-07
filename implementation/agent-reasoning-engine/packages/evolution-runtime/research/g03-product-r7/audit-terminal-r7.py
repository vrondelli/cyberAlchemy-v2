#!/usr/bin/env python3
"""Independently audit the immutable failed r7 generation without references."""
import hashlib
import json
from pathlib import Path
import sys

FREEZE_SHA = 'c4d4b762a9a541d11ae7d57aaf6ed6f601dad38b9d0165357a50455d38b97924'
CODE_REL = Path('development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/longmemeval/confirmation-v1/unexposed-live-v1')


def sha(path):
    digest = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def load(path):
    return json.loads(Path(path).read_text())


def main():
    if len(sys.argv) != 3:
        raise SystemExit('usage: audit-terminal-r7.py COLD_ROOT NEW_AUDIT_JSON')
    root, output = map(Path, sys.argv[1:])
    cohort = root / 'g03-product-replication-r7'
    tools = root / 'g03-product-replication-tools-r7'
    code = root / 'g03-product-replication-code-r9' / CODE_REL
    generation = root / 'longmemeval-product28-20261002-r7'
    freeze_path = cohort / 'FREEZE.json'
    assert sha(freeze_path) == FREEZE_SHA, 'freeze drift'
    freeze = load(freeze_path)
    files = {
        'protocol': tools / 'G03-R7-PROTOCOL.md',
        'selection': cohort / 'SELECTION.json',
        'source_manifest': cohort / 'source/manifest.json',
        'selector': tools / 'select-cohort-r7.py',
        'code_builder': tools / 'build-code-r7.mjs',
        'analyzer': tools / 'analyze-accuracy-r7.mjs',
        'independent_auditor': tools / 'audit-r7.py',
        'adapter': code / 'replication-cohort-adapter-v1.mjs',
        'runner': code / 'replication-cohort-paired-r7.mjs',
        'scorer': code / 'replication-cohort-score-r7.mjs',
        'reference_projector': code / 'replication-cohort-reference-project-r7.py',
    }
    assert set(files) == set(freeze['file_sha256'])
    for key, path in files.items():
        assert sha(path) == freeze['file_sha256'][key], f'frozen file drift: {key}'
    selection, source = load(files['selection']), load(files['source_manifest'])
    ids = [row['question_id'] for row in selection['ordered_questions']]
    assert len(ids) == 28 and len(set(ids)) == 28 and source['question_ids'] == ids
    assert source['selection_file_sha256'] == sha(files['selection'])
    assert selection['reference_fields_read'] is False and selection['provider_calls'] == 0
    for row in source['rows']:
        assert sha(cohort / 'source' / row['path']) == row['file_sha256']
    run, result = load(generation / 'RUN.json'), load(generation / 'RESULT.json')
    assert run['source_manifest_file_sha256'] == sha(files['source_manifest'])
    assert result['question_ids'] == ids and len(result['results']) == 28
    assert result['status'] == 'failed' and result['assignments'] == 4
    assert result['completed'] == 3 and result['terminal_count'] == 3
    assert result['provider_refused'] == 0 and result['failure_count'] == 1
    assert result['unknown_usage'] is True and result['model_calls'] == 137
    assert result['known_tokens'] == 500924
    statuses, calls, known = [], 0, 0
    for index, row in enumerate(result['results']):
        if index >= 4:
            assert row is None, f'non-attempted row unexpectedly populated: {index}'
            continue
        task = generation / f'task-{index:02d}-{ids[index]}'
        assert load(task / 'RESULT.json') == row
        statuses.append(row['status'])
        calls += row['model_calls']
        known += row['known_tokens']
    assert statuses == ['completed', 'completed', 'failed', 'completed']
    assert calls == result['model_calls'] and known == result['known_tokens']
    failed = result['results'][2]
    assert failed['question_id'] == ids[2] and failed['reason'] == 'provider-http-error'
    assert failed['unknown_usage'] is True
    failed_call = failed['calls'][-1]
    assert failed_call['status'] == 'failed' and failed_call['model_started'] is True
    assert failed_call['http_status'] == 500 and failed_call['provider_error_code'] == '1234'
    assert failed_call['usage'] is None and len(failed_call['response_sha256']) == 64
    task = generation / f'task-02-{ids[2]}'
    events = [load(path) for path in sorted(task.glob('event-*.json'))]
    matches = [event for event in events if event.get('channel') == 'model' and event.get('phase') == 'failed'
               and event.get('response_sha256') == failed_call['response_sha256']]
    assert len(matches) == 1 and matches[0]['status'] == 500
    assert matches[0]['provider_error_code'] == '1234' and matches[0]['usage'] is None
    assert matches[0]['dispatched'] is True
    audit = {'schema_version': 'are.g03-r7-terminal-failure-audit/v1', 'status': 'passed',
             'freeze_sha256': FREEZE_SHA, 'selection_sha256': sha(files['selection']),
             'source_manifest_sha256': sha(files['source_manifest']), 'generation_run_sha256': sha(generation / 'RUN.json'),
             'generation_result_sha256': sha(generation / 'RESULT.json'), 'planned': 28,
             'completed': 3, 'failed': 1, 'unattempted': 24, 'model_calls': 137, 'known_tokens': 500924,
             'failure': {'question_index': 2, 'http_status': 500, 'provider_error_code': '1234',
                         'response_sha256': failed_call['response_sha256'], 'usage_known': False},
             'native_scoring_admissible': False, 'accuracy_directional_gate_pass': False,
             'reference_fields_read': False, 'authority_effect': 'none',
             'claim_ceiling': 'Integrity of terminal failed generation only; no r7 score or superiority claim'}
    with output.open('x') as stream:
        json.dump(audit, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': 'passed', 'audit_sha256': sha(output), 'completed': 3,
                      'failed': 1, 'unattempted': 24}, sort_keys=True))


if __name__ == '__main__':
    main()
