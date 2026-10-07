#!/usr/bin/env python3
"""Evaluator-only gold-file coverage against pinned bounded source indexes.

Gold paths and content stay in-process. The private output contains counts and
identity digests only, never paths, text, predictions, or scores.
"""

from collections import Counter, defaultdict
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sys


BASE = Path('/opt/are/evolution-runtime')
UPSTREAM = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
CANDIDATE = BASE / 'g01-post-r7-multilang-cohort-candidate-r2/COHORT-CANDIDATE.json'
CACHES = BASE / 'g01-post-r7-source-caches-r2/SOURCE-CACHES.json'
PREFLIGHT = BASE / 'g01-post-r7-runner-index-preflight-r2/RUNNER-INDEX-PREFLIGHT.json'
WORKER = BASE / 'g01-shared-reliability-source-r4-shallow-r1/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked_source_worker_r2.py'
SUPERVISOR = WORKER.with_name('ranked_source_supervisor_r1.py')
OUTPUT = BASE / 'g01-post-r7-r2-gold-index-coverage-r1/GOLD-INDEX-COVERAGE.json'
EXPECTED_CANDIDATE_SHA = '9364dcb5978c89b16c5b84c0f964e93bac4a332f562f2b73365fecb745b498c6'
EXPECTED_CACHES_SHA = '4715d97c477a3a091ae7bbd384f7c1545cc6d4944e90cf9e9f7234ae3a2f941e'
EXPECTED_PREFLIGHT_SHA = '562f4b65ca68be26affcf1125fc7ff87a3be14f5778054b0409bfc6d7ff39764'
EXPECTED_WORKER_SHA = '18e46e2f003536b04caeedefb099e79ea291efd8a16bb1a3040014cdc02976ec'
EXPECTED_SUPERVISOR_SHA = 'a7eb31094e17211eb3edf9c2329b471f7c6373d36cb4c895a64301c3c948751c'
EXPECTED_GOLD_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def module(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


def audit():
    for path, expected in ((CANDIDATE, EXPECTED_CANDIDATE_SHA), (CACHES, EXPECTED_CACHES_SHA),
                           (PREFLIGHT, EXPECTED_PREFLIGHT_SHA), (WORKER, EXPECTED_WORKER_SHA),
                           (SUPERVISOR, EXPECTED_SUPERVISOR_SHA),
                           (UPSTREAM / 'data/full.parquet', EXPECTED_GOLD_SHA)):
        if sha(path) != expected:
            raise ValueError('pinned-input-drift')
    candidate = json.loads(CANDIDATE.read_text())
    caches = json.loads(CACHES.read_text())
    preflight = json.loads(PREFLIGHT.read_text())
    if (candidate['status'] != 'preflight-only-not-frozen' or preflight['status'] != 'passed' or
            preflight['candidate_sha256'] != EXPECTED_CANDIDATE_SHA or
            preflight['caches_sha256'] != EXPECTED_CACHES_SHA or len(candidate['ordered_tasks']) != 24):
        raise ValueError('preflight-binding-drift')
    by_repo = {row['repo']: row for row in caches['repositories']}
    by_id = {row['instance_id']: row for row in preflight['source_index']['results']}
    if len(by_repo) != 15 or len(by_id) != 24:
        raise ValueError('cache-or-index-shape')
    worker = module(WORKER, 'g01_ranked_source_worker')
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader, _normalize_rel_path
    loader = GoldLoader(str(UPSTREAM / 'data/full.parquet'))
    rows = []
    for task in candidate['ordered_tasks']:
        identifier, repo = task['instance_id'], task['repo']
        cache = by_repo[repo]
        index = by_id[identifier]
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
        manifest = {entry['path']: entry['status'] for entry in value['manifest']['entries']}
        if len(manifest) != len(value['manifest']['entries']):
            raise ValueError('duplicate-manifest-path')
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
                     'index_digest_matches': True,
                     'index_partial': value['manifest']['partial']})
    audited = [row for row in rows if row['status'] == 'audited']
    by_language = defaultdict(lambda: Counter())
    for row in audited:
        bucket = by_language[row['language']]
        bucket['tasks'] += 1
        bucket['gold_files'] += row['gold_file_count']
        bucket['admitted'] += row['admitted_gold_files']
        bucket['excluded'] += row['excluded_gold_files']
        bucket['absent'] += row['absent_gold_files']
    return {'schema_version': 'are.g01-post-r7-r2-gold-index-coverage/v1',
            'posture': 'evaluator-only-no-model-no-scores',
            'candidate_sha256': EXPECTED_CANDIDATE_SHA,
            'caches_sha256': EXPECTED_CACHES_SHA,
            'preflight_sha256': EXPECTED_PREFLIGHT_SHA,
            'worker_sha256': EXPECTED_WORKER_SHA,
            'supervisor_sha256': EXPECTED_SUPERVISOR_SHA,
            'gold_parquet_sha256': EXPECTED_GOLD_SHA,
            'script_sha256': sha(Path(__file__)),
            'rows': rows,
            'summary': {'tasks': len(rows), 'audited': len(audited),
                        'worker_unavailable': len(rows) - len(audited),
                        'gold_files': sum(row['gold_file_count'] for row in audited),
                        'admitted': sum(row['admitted_gold_files'] for row in audited),
                        'excluded': sum(row['excluded_gold_files'] for row in audited),
                        'absent': sum(row['absent_gold_files'] for row in audited),
                        'by_language': {key: dict(value) for key, value in sorted(by_language.items())}},
            'gold_paths_or_content_exported': False,
            'model_calls': 0,
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
