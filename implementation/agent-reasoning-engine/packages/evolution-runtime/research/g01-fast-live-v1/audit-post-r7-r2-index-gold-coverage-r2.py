#!/usr/bin/env python3
"""Evaluator-only gold-file coverage with optional manifest path decoding."""

from collections import Counter, defaultdict
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sys


BASE = Path('/opt/are/evolution-runtime')
PRIOR_SCRIPT = BASE / 'g01-post-r7-r2-gold-index-coverage-r1/audit-post-r7-r2-index-gold-coverage-r1.py'
OUTPUT = BASE / 'g01-post-r7-r2-gold-index-coverage-r2/GOLD-INDEX-COVERAGE.json'
EXPECTED_PRIOR_SCRIPT_SHA = '5d5917e9b23de9df75a8f95d233906e078668c48bd56203ffd11fb8d7010f6a3'


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def manifest_path(entry):
    path = entry.get('path')
    if isinstance(path, str):
        return path
    try:
        return bytes.fromhex(entry['path_hex']).decode('utf8')
    except (KeyError, TypeError, ValueError, UnicodeDecodeError):
        return None


def audit():
    if sha(PRIOR_SCRIPT) != EXPECTED_PRIOR_SCRIPT_SHA:
        raise ValueError('prior-script-drift')
    spec = importlib.util.spec_from_file_location('g01_coverage_r1', PRIOR_SCRIPT)
    source = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(source)
    for path, expected in ((source.CANDIDATE, source.EXPECTED_CANDIDATE_SHA),
                           (source.CACHES, source.EXPECTED_CACHES_SHA),
                           (source.PREFLIGHT, source.EXPECTED_PREFLIGHT_SHA),
                           (source.WORKER, source.EXPECTED_WORKER_SHA),
                           (source.SUPERVISOR, source.EXPECTED_SUPERVISOR_SHA),
                           (source.UPSTREAM / 'data/full.parquet', source.EXPECTED_GOLD_SHA)):
        if sha(path) != expected:
            raise ValueError('pinned-input-drift')
    candidate = json.loads(source.CANDIDATE.read_text())
    caches = json.loads(source.CACHES.read_text())
    preflight = json.loads(source.PREFLIGHT.read_text())
    if (candidate['status'] != 'preflight-only-not-frozen' or preflight['status'] != 'passed' or
            preflight['candidate_sha256'] != source.EXPECTED_CANDIDATE_SHA or
            preflight['caches_sha256'] != source.EXPECTED_CACHES_SHA or
            len(candidate['ordered_tasks']) != 24):
        raise ValueError('preflight-binding-drift')
    by_repo = {row['repo']: row for row in caches['repositories']}
    by_id = {row['instance_id']: row for row in preflight['source_index']['results']}
    if len(by_repo) != 15 or len(by_id) != 24:
        raise ValueError('cache-or-index-shape')
    worker = source.module(source.WORKER, 'g01_ranked_source_worker')
    sys.path.insert(0, str(source.UPSTREAM))
    from contextbench.parsers.gold import GoldLoader, _normalize_rel_path
    loader = GoldLoader(str(source.UPSTREAM / 'data/full.parquet'))
    rows = []
    for task in candidate['ordered_tasks']:
        identifier, repo = task['instance_id'], task['repo']
        cache, index = by_repo[repo], by_id[identifier]
        if (cache['origin'] != task['repo_url'] or task['base_commit'] not in cache['commits'] or
                index['status'] != 'passed' or index['base_commit'] != task['base_commit'] or
                index['repository_path'] != cache['repository_path']):
            raise ValueError('task-index-cache-binding')
        report = worker.run_index({'repository': cache['repository_path'],
                                   'base_commit': task['base_commit'], 'query': ''})
        if report['ok'] is not True or report['result'] is None:
            rows.append({'instance_id': identifier, 'repo': repo, 'language': task['language'],
                         'status': 'worker-unavailable', 'error': report['error']})
            continue
        value = report['result']
        if value['index_digest'] != index['index_digest'] or value['base_commit'] != task['base_commit']:
            raise ValueError('source-index-digest-drift')
        manifest = {}
        undecodable = 0
        for entry in value['manifest']['entries']:
            path = manifest_path(entry)
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
        rows.append({'instance_id': identifier, 'repo': repo, 'language': task['language'],
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
    return {'schema_version': 'are.g01-post-r7-r2-gold-index-coverage/v2',
            'posture': 'evaluator-only-no-model-no-scores',
            'candidate_sha256': source.EXPECTED_CANDIDATE_SHA,
            'caches_sha256': source.EXPECTED_CACHES_SHA,
            'preflight_sha256': source.EXPECTED_PREFLIGHT_SHA,
            'worker_sha256': source.EXPECTED_WORKER_SHA,
            'supervisor_sha256': source.EXPECTED_SUPERVISOR_SHA,
            'gold_parquet_sha256': source.EXPECTED_GOLD_SHA,
            'prior_script_sha256': EXPECTED_PRIOR_SCRIPT_SHA,
            'script_sha256': sha(Path(__file__)), 'rows': rows,
            'summary': {'tasks': len(rows), 'audited': len(audited),
                        'worker_unavailable': len(rows) - len(audited),
                        'gold_files': sum(row['gold_file_count'] for row in audited),
                        'admitted': sum(row['admitted_gold_files'] for row in audited),
                        'excluded': sum(row['excluded_gold_files'] for row in audited),
                        'absent': sum(row['absent_gold_files'] for row in audited),
                        'undecodable_manifest_paths': sum(row['undecodable_manifest_paths'] for row in audited),
                        'by_language': {key: dict(value) for key, value in sorted(by_language.items())}},
            'gold_paths_or_content_exported': False, 'model_calls': 0,
            'claim_ceiling': 'Evaluator-only gold-file/index coverage counts; not semantic correctness, model quality, cohort freeze, or superiority.',
            'open_questions': ['If any gold files are excluded, are the bounded index and comparison still construct-valid?',
                               'Should any prospective eligibility rule change before freeze, without using benchmark scores?']}


def main():
    if not OUTPUT.parent.is_dir() or OUTPUT.exists():
        raise ValueError('fresh-exact-output-required')
    result = audit()
    descriptor = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'wb') as stream:
        stream.write((json.dumps(result, indent=2, sort_keys=True) + '\n').encode())
    print(json.dumps({'summary': result['summary'], 'receipt_sha256': sha(OUTPUT)}, sort_keys=True))


if __name__ == '__main__':
    main()
