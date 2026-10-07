#!/usr/bin/env python3
"""Evaluator-only reason counts for two pre-freeze index-ineligible tasks."""

from collections import Counter
import hashlib
import importlib.util
import json
from pathlib import Path
import sys


BASE = Path('/opt/are/evolution-runtime')
ROOT = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
CANDIDATE = BASE / 'g01-r10-clean-cohort-candidate-r1/COHORT-CANDIDATE.json'
CACHES = BASE / 'g01-r10-source-caches-r1/SOURCE-CACHES.json'
WORKER = BASE / 'g01-source-index-capacity-r3/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked_source_worker_r2.py'
AUDIT = BASE / 'g01-r10-index-gold-coverage-r1/GOLD-INDEX-COVERAGE.json'
PINS = {CANDIDATE: '56dfbd8fa8b6e0c3cbc8acc3e5b4e871e11a996dd56f3f9cf68588e4bb531cf7',
        CACHES: '98663f95ef6eb75f1c478d2a5acec350ebbee0b13566e2aaea470ecf65102637',
        WORKER: 'c682a449cfc336f93e58ed1a87221178af17bdb0ab6d1904f63125dfb5a2536b',
        AUDIT: 'b0752ad7d749d645f18c1fce9ac41222eedbf8faa8c194647cfb26134cda58f5',
        ROOT / 'data/full.parquet': '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    if any(sha(path) != digest for path, digest in PINS.items()):
        raise ValueError('pinned-input-drift')
    candidate = json.loads(CANDIDATE.read_text())
    caches = json.loads(CACHES.read_text())
    audit = json.loads(AUDIT.read_text())
    ids = {row['instance_id'] for row in audit['rows'] if row['excluded_gold_files']}
    if len(ids) != 2 or audit['summary']['excluded'] != 5:
        raise ValueError('audit-shape-drift')
    spec = importlib.util.spec_from_file_location('g01_r10_worker', WORKER)
    worker = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(worker)
    sys.path.insert(0, str(ROOT))
    from contextbench.parsers.gold import GoldLoader, _normalize_rel_path
    loader = GoldLoader(str(ROOT / 'data/full.parquet'))
    by_cache = {row['instance_id']: row for row in caches['task_bindings']}
    output = []
    for task in candidate['ordered_tasks']:
        identifier = task['instance_id']
        if identifier not in ids:
            continue
        binding = by_cache[identifier]
        report = worker.run_index({'repository': binding['repository_path'],
                                   'base_commit': task['base_commit'], 'query': ''})
        if not report['ok'] or report['result'] is None:
            raise ValueError('index-worker-failed')
        manifest = {entry.get('path', bytes.fromhex(entry['path_hex']).decode()): entry
                    for entry in report['result']['manifest']['entries']
                    if isinstance(entry.get('path'), str) or 'path_hex' in entry}
        gold = loader.get(identifier)
        paths = {_normalize_rel_path(row.get('file', '')) for row in gold.init + gold.add}
        reasons = Counter(manifest[path]['reason'] for path in paths
                          if path in manifest and manifest[path]['status'] == 'excluded')
        output.append({'instance_id': identifier, 'repo': task['repo'],
                       'excluded_reason_counts': dict(sorted(reasons.items())),
                       'index_admitted_bytes': report['result']['manifest']['admitted_bytes'],
                       'index_postings': report['result']['manifest']['postings']})
    print(json.dumps({'posture': 'evaluator-only-no-model-no-score-no-path-export',
                      'rows': output}, sort_keys=True))


if __name__ == '__main__':
    main()
