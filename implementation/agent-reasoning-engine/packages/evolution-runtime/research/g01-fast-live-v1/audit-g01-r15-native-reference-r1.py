#!/usr/bin/env python3
"""Evaluator-only r15 native-reference coverage; export counts, not gold paths."""

from collections import Counter, defaultdict
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sys


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g01-r14-r46-source-qualification-r1'
WORKER = SOURCE / ('development/agent-reasoning-engine/planning/'
                   'representation-preferences/dual-benchmark-8k-v2/contextbench/'
                   'ranked_source_worker_r2.py')
CANDIDATE = BASE / 'g01-r15-clean-cohort-candidate-r1/COHORT-CANDIDATE.json'
TRANSFER = BASE / 'g01-r15-cache-transfer-r1/VERIFY.json'
PREFLIGHT = BASE / 'g01-r15-runner-index-preflight-r1/RUNNER-INDEX-PREFLIGHT.json'
UPSTREAM = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
PARQUET = UPSTREAM / 'data/full.parquet'
OUTPUT_ROOT = BASE / 'g01-r15-native-reference-audit-r1'
OUTPUT = OUTPUT_ROOT / 'NATIVE-REFERENCE-AUDIT.json'
PINS = {
    CANDIDATE: 'a92236424aed884f6abf962fb4cb9670fd44be32cc4e6b477a1b6ffddae83551',
    TRANSFER: '4baa90de38c849085a86da6817885ef1b8d21d88c9dd9c79a8fab145a73626b0',
    PREFLIGHT: 'a6c20ccd28241aceea8b514df0027f0f7b85c77dce323d37c662338069d632af',
    PARQUET: '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8',
}
SOURCE_SHA = 'b97b3718c55c9ffb19cd6c8d140d8147580f8c6db1d6d2c98476a99e38aa54df'


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def priority_context(statement):
    value = statement.encode('utf-8')[:1024].decode('utf-8', 'replace')
    if value.endswith('\ufffd'):
        value = value[:-1]
    return value.strip()


def main():
    if OUTPUT_ROOT.exists():
        raise ValueError('fresh-exact-output-required')
    if any(sha(path) != digest for path, digest in PINS.items()):
        raise ValueError('pinned-input-drift')
    candidate, transfer, preflight = (json.loads(path.read_text()) for path in
                                      (CANDIDATE, TRANSFER, PREFLIGHT))
    tasks = candidate['ordered_tasks']
    if (candidate['schema_version'] != 'are.g01-r15-development-cap-eight-candidate/v1' or
            candidate['status'] != 'preflight-only-not-frozen' or
            candidate['source_partition'] != 'original ContextBench development 903 IDs only' or
            candidate['model_calls'] != 0 or candidate['gold_values_or_paths_used'] is not False or
            len(tasks) != 24 or transfer['status'] != 'passed' or
            transfer['candidate_sha256'] != PINS[CANDIDATE] or
            preflight['status'] != 'passed' or
            preflight['candidate_sha256'] != PINS[CANDIDATE] or
            preflight['transfer_sha256'] != PINS[TRANSFER] or
            preflight['source_tree_sha256'] != SOURCE_SHA or
            preflight['model_calls'] != 0 or preflight['gold_loaded'] is not False or
            len(preflight['source_index']['results']) != 24):
        raise ValueError('source-preflight-binding')
    by_cache = {row['instance_id']: row for row in transfer['verified_task_bindings']}
    by_index = {row['instance_id']: row for row in preflight['source_index']['results']}
    if len(by_cache) != 24 or len(by_index) != 24:
        raise ValueError('task-binding-count')
    spec = importlib.util.spec_from_file_location('g01_r15_r46_worker', WORKER)
    worker = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(worker)
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader, _normalize_rel_path
    loader = GoldLoader(str(PARQUET))
    rows = []
    for task in tasks:
        identifier = task['instance_id']
        cache, index = by_cache[identifier], by_index[identifier]
        if (cache['origin'] != task['repo_url'] or cache['base_commit'] != task['base_commit'] or
                index['status'] != 'passed' or index['base_commit'] != task['base_commit'] or
                index['repository_path'] != cache['repository_path']):
            raise ValueError('task-index-cache-binding')
        report = worker.run_index({'repository': cache['repository_path'],
                                   'base_commit': task['base_commit'], 'query': '',
                                   'index_context': priority_context(task['problem_statement']),
                                   'source_language': task['language']})
        if report['ok'] is not True or report['result'] is None:
            rows.append({'instance_id': identifier, 'repo': task['repo'],
                         'language': task['language'], 'status': 'worker-unavailable',
                         'error_code': report['error'] or 'ranked-worker-unavailable',
                         'elapsed_seconds': report['elapsed_seconds']})
            continue
        value = report['result']
        if (value['index_digest'] != index['index_digest'] or
                value['base_commit'] != task['base_commit'] or
                value['manifest']['priority']['version'] != 'issue-overlap-source-suffix-r1'):
            raise ValueError('source-index-digest-drift')
        manifest = {}
        for entry in value['manifest']['entries']:
            try:
                path = bytes.fromhex(entry['path_hex']).decode('utf-8')
            except (ValueError, UnicodeDecodeError):
                continue
            if path in manifest:
                raise ValueError('duplicate-manifest-path')
            manifest[path] = (entry['status'], entry['reason'])
        gold = loader.get(identifier)
        if gold is None or gold.commit != task['base_commit'] or gold._data['language'] != task['language']:
            raise ValueError('gold-identity-drift')
        paths = {_normalize_rel_path(item.get('file', '')) for item in gold.init + gold.add}
        if not paths or any(not path or path.startswith('/') or '..' in Path(path).parts for path in paths):
            raise ValueError('invalid-gold-path')
        statuses = Counter(manifest.get(path, ('absent', None))[0] for path in paths)
        reasons = Counter(manifest.get(path, ('absent', 'absent'))[1]
                          for path in paths if manifest.get(path, ('absent', None))[0] != 'admitted')
        if set(statuses) - {'admitted', 'excluded', 'absent'}:
            raise ValueError('manifest-status-shape')
        rows.append({'instance_id': identifier, 'repo': task['repo'], 'language': task['language'],
                     'status': 'audited', 'gold_file_count': len(paths),
                     'admitted_gold_files': statuses['admitted'],
                     'excluded_gold_files': statuses['excluded'],
                     'absent_gold_files': statuses['absent'],
                     'exclusion_reasons': dict(reasons), 'index_digest_matches': True})
    audited = [row for row in rows if row['status'] == 'audited']
    by_language = defaultdict(Counter)
    for row in audited:
        group = by_language[row['language']]
        group['tasks'] += 1
        group['gold_files'] += row['gold_file_count']
        group['admitted'] += row['admitted_gold_files']
        group['excluded'] += row['excluded_gold_files']
        group['absent'] += row['absent_gold_files']
    summary = {'tasks': len(rows), 'audited': len(audited),
               'worker_unavailable': len(rows) - len(audited),
               'gold_files': sum(row['gold_file_count'] for row in audited),
               'admitted': sum(row['admitted_gold_files'] for row in audited),
               'excluded': sum(row['excluded_gold_files'] for row in audited),
               'absent': sum(row['absent_gold_files'] for row in audited),
               'by_language': {key: dict(value) for key, value in sorted(by_language.items())}}
    status = ('passed' if summary['audited'] == 24 and
              summary['admitted'] == summary['gold_files'] and
              summary['excluded'] == summary['absent'] == 0 else 'failed')
    receipt = {'schema_version': 'are.g01-r15-native-reference-audit/v1', 'status': status,
               'posture': 'evaluator-only-no-model-no-scores', 'candidate_sha256': PINS[CANDIDATE],
               'transfer_sha256': PINS[TRANSFER], 'preflight_sha256': PINS[PREFLIGHT],
               'source_tree_sha256': SOURCE_SHA, 'worker_sha256': sha(WORKER),
               'hints_sha256': sha(WORKER.with_name('ranked_source_hints_r3.py')),
               'gold_parquet_sha256': PINS[PARQUET], 'script_sha256': sha(Path(__file__)),
               'rows': rows, 'summary': summary, 'gold_paths_or_content_exported': False,
               'model_calls': 0,
               'claim_ceiling': 'Evaluator-only r15 native-reference/index coverage; no freeze, model score or superiority',
               'open_questions': ['Can r15 pass storage rehearsal, fresh provider readiness, and a separately bound freeze?']}
    data = (json.dumps(receipt, sort_keys=True, indent=2) + '\n').encode()
    OUTPUT_ROOT.mkdir(mode=0o700, exist_ok=False)
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'status': status, 'summary': summary,
                      'receipt_sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))
    if status != 'passed':
        raise SystemExit(2)


if __name__ == '__main__':
    main()
