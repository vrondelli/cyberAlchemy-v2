#!/usr/bin/env python3
"""Evaluator-only reason census for the four r13 r1 native-index failures."""
from collections import Counter
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sys

BASE = Path('/opt/are/evolution-runtime')
UPSTREAM = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
CANDIDATE = BASE / 'g01-r13-clean-cohort-candidate-r1/COHORT-CANDIDATE.json'
TRANSFER = BASE / 'g01-r13-cache-transfer-r1/VERIFY.json'
AUDIT = BASE / 'g01-r13-index-gold-coverage-r1/GOLD-INDEX-COVERAGE.json'
WORKER = BASE / 'g01-source-index-capacity-r3/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked_source_worker_r2.py'
PRIOR_AUDITOR = BASE / 'g01-post-r8-index-gold-coverage-r2/audit-post-r8-index-gold-coverage-r2.py'
OUTPUT = BASE / 'g01-r13-index-failure-diagnosis-r1/DIAGNOSIS.json'
PINS = {CANDIDATE: '86b3841d0169a2b339d483aad6f0e6e5e8993980c929f11128139f4ff1e04cc5',
        TRANSFER: '11d30a85aebb31b1bb6304fb8dbe6371d9b098f02188a8052ebecbb8ceec44f5',
        AUDIT: 'a575a28b407000bde24243b0cbdbdaa01acb9ef99973bb4089be6aa52659d182',
        WORKER: 'c682a449cfc336f93e58ed1a87221178af17bdb0ab6d1904f63125dfb5a2536b',
        PRIOR_AUDITOR: '6a67e3c43738fd1b97ab283c161a8aa5751a3de6b04c2b50b4fe3bae8afab602',
        UPSTREAM / 'data/full.parquet': '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def module(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    value = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value


def main():
    if OUTPUT.exists() or not OUTPUT.parent.is_dir() or any(sha(path) != digest for path, digest in PINS.items()):
        raise ValueError('output-or-pinned-input-drift')
    candidate, transfer, audit = (json.loads(path.read_text()) for path in (CANDIDATE, TRANSFER, AUDIT))
    if (audit['status'] != 'failed' or audit['candidate_sha256'] != PINS[CANDIDATE] or
            audit['summary']['audited'] != 23 or audit['summary']['excluded'] != 5 or
            audit['summary']['worker_unavailable'] != 1 or audit['model_calls'] != 0):
        raise ValueError('failed-audit-shape')
    failed = [row for row in audit['rows'] if row['status'] != 'audited' or
              row['excluded_gold_files'] or row['absent_gold_files']]
    if len(failed) != 4:
        raise ValueError('failed-task-count')
    by_task = {row['instance_id']: row for row in candidate['ordered_tasks']}
    by_cache = {row['instance_id']: row for row in transfer['verified_task_bindings']}
    worker = module(WORKER, 'g01_r13_failure_worker')
    prior = module(PRIOR_AUDITOR, 'g01_r13_failure_manifest_helper')
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader, _normalize_rel_path
    loader = GoldLoader(str(UPSTREAM / 'data/full.parquet'))
    rows = []
    for prior_row in failed:
        identifier = prior_row['instance_id']
        task, cache = by_task[identifier], by_cache[identifier]
        report = worker.run_index({'repository': cache['repository_path'],
                                   'base_commit': task['base_commit'], 'query': ''})
        if report['ok'] is not True or report['result'] is None:
            rows.append({'instance_id': identifier, 'repo': task['repo'],
                         'status': 'worker-unavailable-on-replay'})
            continue
        value = report['result']
        gold = loader.get(identifier)
        if gold is None or gold.commit != task['base_commit']:
            raise ValueError('gold-identity-drift')
        reference_paths = {_normalize_rel_path(item.get('file', '')) for item in gold.init + gold.add}
        manifest = {}
        for entry in value['manifest']['entries']:
            path = prior.manifest_path(entry)
            if path is None or path in manifest:
                raise ValueError('manifest-path-invalid')
            manifest[path] = entry
        counts = Counter()
        for path in reference_paths:
            entry = manifest.get(path)
            if entry is None:
                counts['absent'] += 1
            elif entry['status'] == 'admitted':
                counts['admitted'] += 1
            else:
                counts['excluded:' + str(entry.get('reason', 'unknown'))] += 1
        rows.append({'instance_id': identifier, 'repo': task['repo'],
                     'status': 'audited-on-replay', 'gold_file_count': len(reference_paths),
                     'reference_status_counts': dict(sorted(counts.items())),
                     'index_partial': value['manifest']['partial'],
                     'manifest_status_counts': dict(sorted(Counter(entry['status'] for entry in manifest.values()).items()))})
    result = {'schema_version': 'are.g01-r13-index-failure-diagnosis/v1',
              'status': 'evaluator-only-exposed-diagnostic',
              'candidate_sha256': PINS[CANDIDATE], 'failed_audit_sha256': PINS[AUDIT],
              'script_sha256': sha(Path(__file__)), 'rows': rows,
              'gold_paths_or_content_exported': False, 'model_calls': 0,
              'claim_ceiling': 'Exposed index-reason diagnosis only; no campaign repair, score, or superiority.',
              'open_questions': ['Which bounded index mechanism can admit the failed native references without degrading other tasks?',
                                 'Does the unavailable TypeScript task replay consistently?']}
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(result, sort_keys=True, indent=2) + '\n').encode())
    print(json.dumps({'status': result['status'], 'rows': rows,
                      'receipt_sha256': sha(OUTPUT)}, sort_keys=True))


if __name__ == '__main__':
    main()
