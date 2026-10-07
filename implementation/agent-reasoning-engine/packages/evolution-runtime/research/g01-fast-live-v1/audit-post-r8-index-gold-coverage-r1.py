#!/usr/bin/env python3
"""Evaluator-only native-gold file coverage for the post-r8 G01 cohort.

Only counts and identities leave this process; no gold path, content, or score
is included in the receipt. Open questions: G01-POST-R8-CLEAN-COHORT-CANDIDATE.md.
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
CANDIDATE = BASE / 'g01-post-r8-clean-cohort-candidate-r3/COHORT-CANDIDATE.json'
CACHES = BASE / 'g01-post-r8-source-caches-r2/SOURCE-CACHES.json'
PREFLIGHT = BASE / 'g01-post-r8-runner-index-preflight-r2/RUNNER-INDEX-PREFLIGHT.json'
WORKER = BASE / 'g01-source-index-capacity-r1/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked_source_worker_r2.py'
HINTS = WORKER.with_name('ranked_source_hints_r3.py')
OUTPUT = BASE / 'g01-post-r8-index-gold-coverage-r1/GOLD-INDEX-COVERAGE.json'
PINS = {CANDIDATE: '9f7005a59071aa5c25bfcd8942874dd7c910e6315791d455bb3465a09dee8194',
        CACHES: '5ae0ea5dc5b71a49e4ece613b25810dfb0ce48f407ee8e861cc7cd48a9e728a9',
        PREFLIGHT: '97e95a40fa120a56ced153fd9b4dfd432c1ec5e1421e242c5e17a43dd2e3899b',
        WORKER: '9b3af26e6a04d2a3aa14f6135d1540314c3d302948767203f9e058b5d6aa758b',
        HINTS: '07224e08930177254ea7cbecc3b656a7ec097e132b820cea02cb5b3f0c23585a',
        UPSTREAM / 'data/full.parquet': '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'}


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
    for path, expected in PINS.items():
        if sha(path) != expected:
            raise ValueError(f'pinned-input-drift:{path}')
    candidate = json.loads(CANDIDATE.read_text())
    caches = json.loads(CACHES.read_text())
    preflight = json.loads(PREFLIGHT.read_text())
    if (candidate['status'] != 'preflight-only-not-frozen' or
            candidate['gold_values_or_paths_used'] is not False or
            caches['status'] != 'passed' or caches['gold_loaded'] is not False or
            preflight['status'] != 'passed' or preflight['gold_loaded'] is not False or
            preflight['candidate_sha256'] != PINS[CANDIDATE] or
            preflight['caches_sha256'] != PINS[CACHES] or
            len(candidate['ordered_tasks']) != 24):
        raise ValueError('preflight-binding-drift')
    by_cache = {row['instance_id']: row for row in caches['task_bindings']}
    by_index = {row['instance_id']: row for row in preflight['source_index']['results']}
    if len(by_cache) != 24 or len(by_index) != 24 or len(caches['task_bindings']) != 24:
        raise ValueError('cache-or-index-shape')
    spec = importlib.util.spec_from_file_location('g01_post_r8_ranked_worker', WORKER)
    worker = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(worker)
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader, _normalize_rel_path
    loader = GoldLoader(str(UPSTREAM / 'data/full.parquet'))
    rows = []
    for task in candidate['ordered_tasks']:
        identifier = task['instance_id']
        cache, index = by_cache[identifier], by_index[identifier]
        if (cache['origin'] != task['repo_url'] or cache['repo'] != task['repo'] or
                cache['base_commit'] != task['base_commit'] or
                index['status'] != 'passed' or index['base_commit'] != task['base_commit'] or
                index['repository_path'] != cache['repository_path']):
            raise ValueError('task-index-cache-binding')
        report = worker.run_index({'repository': cache['repository_path'],
                                   'base_commit': task['base_commit'], 'query': ''})
        if report['ok'] is not True or report['result'] is None:
            rows.append({'instance_id': identifier, 'repo': task['repo'], 'language': task['language'],
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
    return {'schema_version': 'are.g01-post-r8-index-gold-coverage/v1',
            'posture': 'evaluator-only-no-model-no-scores',
            'candidate_sha256': PINS[CANDIDATE], 'caches_sha256': PINS[CACHES],
            'preflight_sha256': PINS[PREFLIGHT], 'worker_sha256': PINS[WORKER],
            'hints_sha256': PINS[HINTS], 'gold_parquet_sha256': PINS[UPSTREAM / 'data/full.parquet'],
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
                               'Does an independently frozen matched campaign pass quality, cost and reliability gates?']}


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
