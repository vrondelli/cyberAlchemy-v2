#!/usr/bin/env python3
"""Source-only budget census for two large TypeScript Git trees; no gold paths."""

from collections import Counter
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sys


BASE = Path('/opt/are/evolution-runtime')
CANDIDATE = BASE / 'g01-post-r8-clean-cohort-candidate-r3/COHORT-CANDIDATE.json'
CACHES = BASE / 'g01-post-r8-source-caches-r2/SOURCE-CACHES.json'
WORKER = BASE / 'g01-source-index-capacity-r1/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked_source_worker_r2.py'
OUTPUT = BASE / 'g01-post-r8-index-budget-r1/BUDGET.json'
PINS = {CANDIDATE: '9f7005a59071aa5c25bfcd8942874dd7c910e6315791d455bb3465a09dee8194',
        CACHES: '5ae0ea5dc5b71a49e4ece613b25810dfb0ce48f407ee8e861cc7cd48a9e728a9',
        WORKER: '9b3af26e6a04d2a3aa14f6135d1540314c3d302948767203f9e058b5d6aa758b'}
TARGETS = {'SWE-PolyBench__typescript__maintenance__bugfix__2f2954b5',
           'SWE-PolyBench__typescript__maintenance__bugfix__574eba0a'}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    if not OUTPUT.parent.is_dir() or OUTPUT.exists():
        raise ValueError('fresh-output-required')
    if any(sha(path) != digest for path, digest in PINS.items()):
        raise ValueError('input-drift')
    candidate = json.loads(CANDIDATE.read_text())
    caches = json.loads(CACHES.read_text())
    if candidate['gold_values_or_paths_used'] is not False or caches['gold_loaded'] is not False:
        raise ValueError('gold-boundary')
    tasks = {row['instance_id']: row for row in candidate['ordered_tasks']}
    bindings = {row['instance_id']: row for row in caches['task_bindings']}
    spec = importlib.util.spec_from_file_location('g01_index_budget_worker', WORKER)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    rows = []
    for identifier in sorted(TARGETS):
        task, binding = tasks[identifier], bindings[identifier]
        if task['base_commit'] != binding['base_commit'] or task['repo_url'] != binding['origin']:
            raise ValueError('binding')
        report = module.run_index({'repository': binding['repository_path'],
                                   'base_commit': task['base_commit'], 'query': ''})
        if not report['ok']:
            rows.append({'instance_id': identifier, 'status': 'failed', 'error': report['error']})
            continue
        value = report['result']
        manifest = value['manifest']
        counts = Counter(row['reason'] or 'admitted' for row in manifest['entries'])
        rows.append({'instance_id': identifier, 'status': 'passed',
                     'index_digest': value['index_digest'],
                     'entries': len(manifest['entries']),
                     'admitted_files': manifest['admitted_files'],
                     'admitted_bytes': manifest['admitted_bytes'],
                     'postings': manifest['postings'],
                     'manifest_bytes': len(json.dumps(manifest, sort_keys=True, separators=(',', ':')).encode()),
                     'remaining_after_budget_stop': manifest['remaining_after_budget_stop'],
                     'reason_counts': dict(sorted(counts.items())),
                     'max_rss_kib': value['max_rss_kib'],
                     'elapsed_seconds': report['elapsed_seconds']})
    result = {'schema_version': 'are.g01-post-r8-source-index-budget/v1',
              'source_only': True, 'gold_loaded': False, 'model_calls': 0,
              'pins': {path.name: digest for path, digest in PINS.items()},
              'rows': rows, 'script_sha256': sha(Path(__file__)),
              'claim_ceiling': 'Source-only bounded index budget census; no gold coverage, model quality, or superiority',
              'open_questions': ['Can a bounded index admit more relevant source without violating memory/time limits?',
                                 'Will evaluator-only coverage pass before cohort freeze?']}
    descriptor = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'wb') as stream:
        stream.write((json.dumps(result, indent=2, sort_keys=True) + '\n').encode())
    print(json.dumps({'receipt_sha256': sha(OUTPUT), 'rows': rows}, sort_keys=True))


if __name__ == '__main__':
    main()
