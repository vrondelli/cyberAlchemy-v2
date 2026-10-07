#!/usr/bin/env python3
"""Evaluator-only native-reference coverage for the G01 r13 source indexes."""
from collections import Counter, defaultdict
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
PREFLIGHT = BASE / 'g01-r13-runner-index-preflight-r1/RUNNER-INDEX-PREFLIGHT.json'
WORKER = BASE / 'g01-source-index-capacity-r3/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked_source_worker_r2.py'
HINTS = WORKER.with_name('ranked_source_hints_r3.py')
PRIOR_AUDITOR = BASE / 'g01-post-r8-index-gold-coverage-r2/audit-post-r8-index-gold-coverage-r2.py'
OUTPUT = BASE / 'g01-r13-index-gold-coverage-r1/GOLD-INDEX-COVERAGE.json'
PINS = {
    CANDIDATE: '86b3841d0169a2b339d483aad6f0e6e5e8993980c929f11128139f4ff1e04cc5',
    TRANSFER: '11d30a85aebb31b1bb6304fb8dbe6371d9b098f02188a8052ebecbb8ceec44f5',
    PREFLIGHT: '64bce39720e3acaa1daed56ebddea1591041f24de4b473ba342919bdf7756891',
    WORKER: 'c682a449cfc336f93e58ed1a87221178af17bdb0ab6d1904f63125dfb5a2536b',
    HINTS: '7f7e9d0299bd138fdde8f4a3c55869098cde5c57b0015481926e993510b4025a',
    PRIOR_AUDITOR: '6a67e3c43738fd1b97ab283c161a8aa5751a3de6b04c2b50b4fe3bae8afab602',
    UPSTREAM / 'data/full.parquet': '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8',
}


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def module(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    value = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value


def main():
    if OUTPUT.exists() or not OUTPUT.parent.is_dir():
        raise ValueError('fresh-exact-output-required')
    if any(sha(path) != digest for path, digest in PINS.items()):
        raise ValueError('pinned-input-drift')
    candidate, transfer, preflight = (json.loads(path.read_text()) for path in
                                      (CANDIDATE, TRANSFER, PREFLIGHT))
    if (candidate.get('schema_version') != 'are.g01-r13-clean-source-only-candidate/v1' or
            candidate.get('status') != 'preflight-only-not-frozen' or
            candidate.get('gold_values_or_paths_used') is not False or
            candidate.get('model_calls') != 0 or
            transfer.get('status') != 'passed' or transfer.get('gold_loaded') is not False or
            transfer.get('model_calls') != 0 or transfer.get('candidate_sha256') != PINS[CANDIDATE] or
            preflight.get('status') != 'passed' or preflight.get('gold_loaded') is not False or
            preflight.get('model_calls') != 0 or preflight.get('candidate_sha256') != PINS[CANDIDATE] or
            preflight.get('transfer_sha256') != PINS[TRANSFER] or
            len(candidate['ordered_tasks']) != 24):
        raise ValueError('preflight-binding-drift')
    by_cache = {row['instance_id']: row for row in transfer['verified_task_bindings']}
    by_index = {row['instance_id']: row for row in preflight['source_index']['results']}
    if (len(by_cache) != 24 or len(by_index) != 24 or
            len(transfer['verified_task_bindings']) != 24 or
            len(preflight['source_index']['results']) != 24):
        raise ValueError('task-binding-count')
    worker = module(WORKER, 'g01_r13_ranked_worker')
    prior = module(PRIOR_AUDITOR, 'g01_r13_prior_coverage_helpers')
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader, _normalize_rel_path
    loader = GoldLoader(str(UPSTREAM / 'data/full.parquet'))
    rows = []
    for task in candidate['ordered_tasks']:
        identifier = task['instance_id']
        cache, index = by_cache[identifier], by_index[identifier]
        if (cache['origin'] != task['repo_url'] or
                cache['base_commit'] != task['base_commit'] or
                index['status'] != 'passed' or index['base_commit'] != task['base_commit'] or
                index['repository_path'] != cache['repository_path']):
            raise ValueError('task-index-cache-binding')
        report = worker.run_index({'repository': cache['repository_path'],
                                   'base_commit': task['base_commit'], 'query': ''})
        if report['ok'] is not True or report['result'] is None:
            rows.append({'instance_id': identifier, 'repo': task['repo'],
                         'language': task['language'], 'status': 'worker-unavailable',
                         'error_code': 'ranked-worker-unavailable'})
            continue
        value = report['result']
        if value['index_digest'] != index['index_digest'] or value['base_commit'] != task['base_commit']:
            raise ValueError('source-index-digest-drift')
        manifest = {}
        undecodable = 0
        for entry in value['manifest']['entries']:
            path = prior.manifest_path(entry)
            if path is None:
                undecodable += 1
                continue
            if path in manifest:
                raise ValueError('duplicate-manifest-path')
            manifest[path] = entry['status']
        gold = loader.get(identifier)
        if gold is None or gold.commit != task['base_commit'] or gold._data['language'] != task['language']:
            raise ValueError('gold-identity-drift')
        paths = {_normalize_rel_path(item.get('file', '')) for item in gold.init + gold.add}
        if not paths or any(not path or path.startswith('/') or '..' in Path(path).parts for path in paths):
            raise ValueError('invalid-gold-path')
        counts = Counter(manifest.get(path, 'absent') for path in paths)
        if set(counts) - {'admitted', 'excluded', 'absent'}:
            raise ValueError('manifest-status-shape')
        rows.append({'instance_id': identifier, 'repo': task['repo'], 'language': task['language'],
                     'status': 'audited', 'gold_file_count': len(paths),
                     'admitted_gold_files': counts['admitted'],
                     'excluded_gold_files': counts['excluded'],
                     'absent_gold_files': counts['absent'],
                     'index_digest_matches': True, 'index_partial': value['manifest']['partial'],
                     'undecodable_manifest_paths': undecodable})
    audited = [row for row in rows if row['status'] == 'audited']
    by_language = defaultdict(Counter)
    for row in audited:
        bucket = by_language[row['language']]
        bucket['tasks'] += 1
        bucket['gold_files'] += row['gold_file_count']
        bucket['admitted'] += row['admitted_gold_files']
        bucket['excluded'] += row['excluded_gold_files']
        bucket['absent'] += row['absent_gold_files']
    summary = {'tasks': len(rows), 'audited': len(audited),
               'worker_unavailable': len(rows) - len(audited),
               'gold_files': sum(row['gold_file_count'] for row in audited),
               'admitted': sum(row['admitted_gold_files'] for row in audited),
               'excluded': sum(row['excluded_gold_files'] for row in audited),
               'absent': sum(row['absent_gold_files'] for row in audited),
               'undecodable_manifest_paths': sum(row['undecodable_manifest_paths'] for row in audited),
               'by_language': {key: dict(value) for key, value in sorted(by_language.items())}}
    status = ('passed' if summary['audited'] == 24 and
              summary['admitted'] == summary['gold_files'] and
              summary['excluded'] == 0 and summary['absent'] == 0 else 'failed')
    result = {'schema_version': 'are.g01-r13-index-gold-coverage/v1', 'status': status,
              'posture': 'evaluator-only-no-model-no-scores',
              'candidate_sha256': PINS[CANDIDATE], 'transfer_sha256': PINS[TRANSFER],
              'preflight_sha256': PINS[PREFLIGHT], 'worker_sha256': PINS[WORKER],
              'hints_sha256': PINS[HINTS],
              'gold_parquet_sha256': PINS[UPSTREAM / 'data/full.parquet'],
              'prior_auditor_sha256': PINS[PRIOR_AUDITOR], 'script_sha256': sha(Path(__file__)),
              'rows': rows, 'summary': summary,
              'gold_paths_or_content_exported': False, 'model_calls': 0,
              'claim_ceiling': 'Evaluator-only native-reference/index coverage counts; no semantic correctness, campaign freeze, model quality, or superiority.',
              'open_questions': ['Can a storage-admitted, separately frozen matched campaign complete all 24 pairs?',
                                 'Will the frozen quality and efficiency intervals pass without label-integrity issues?']}
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(result, sort_keys=True, indent=2) + '\n').encode())
    print(json.dumps({'status': status, 'summary': summary,
                      'receipt_sha256': sha(OUTPUT)}, sort_keys=True))
    if status != 'passed':
        raise SystemExit(2)


if __name__ == '__main__':
    main()
