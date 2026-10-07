#!/usr/bin/env python3
"""Evaluator-only bounds and source-only issue-path rank diagnostic."""
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
DIAGNOSIS = BASE / 'g01-r13-index-failure-diagnosis-r1/DIAGNOSIS.json'
WORKER = BASE / 'g01-source-index-capacity-r3/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked_source_worker_r2.py'
HINTS = WORKER.with_name('ranked_source_hints_r3.py')
PRIOR_AUDITOR = BASE / 'g01-post-r8-index-gold-coverage-r2/audit-post-r8-index-gold-coverage-r2.py'
OUTPUT = BASE / 'g01-r13-index-priority-diagnosis-r1/DIAGNOSIS.json'
PINS = {CANDIDATE: '86b3841d0169a2b339d483aad6f0e6e5e8993980c929f11128139f4ff1e04cc5',
        TRANSFER: '11d30a85aebb31b1bb6304fb8dbe6371d9b098f02188a8052ebecbb8ceec44f5',
        DIAGNOSIS: 'a15e67153393f83dcd6e699100f50f6ddee6b6390eaf49896784beac8ccadf4f',
        WORKER: 'c682a449cfc336f93e58ed1a87221178af17bdb0ab6d1904f63125dfb5a2536b',
        HINTS: '7f7e9d0299bd138fdde8f4a3c55869098cde5c57b0015481926e993510b4025a',
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
    candidate, transfer, diagnosis = (json.loads(path.read_text()) for path in
                                      (CANDIDATE, TRANSFER, DIAGNOSIS))
    targets = {row['instance_id'] for row in diagnosis['rows']
               if row['status'] == 'audited-on-replay' and
               any(key.startswith('excluded:admission-stopped') for key in row['reference_status_counts'])}
    if len(targets) != 3:
        raise ValueError('target-count')
    by_cache = {row['instance_id']: row for row in transfer['verified_task_bindings']}
    worker = module(WORKER, 'r13_priority_worker')
    hints = module(HINTS, 'r13_priority_hints')
    prior = module(PRIOR_AUDITOR, 'r13_priority_path')
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader, _normalize_rel_path
    loader = GoldLoader(str(UPSTREAM / 'data/full.parquet'))
    rows = []
    for task in candidate['ordered_tasks']:
        identifier = task['instance_id']
        if identifier not in targets:
            continue
        cache = by_cache[identifier]
        report = worker.run_index({'repository': cache['repository_path'],
                                   'base_commit': task['base_commit'], 'query': ''})
        if report['ok'] is not True or report['result'] is None:
            rows.append({'instance_id': identifier, 'status': 'worker-unavailable'})
            continue
        manifest = report['result']['manifest']
        entries = manifest['entries']
        stop = [(position, entry['reason']) for position, entry in enumerate(entries)
                if entry['reason'] in ('posting-limit', 'admitted-byte-limit')]
        if len(stop) != 1:
            raise ValueError('stop-count')
        issue_terms = set(hints.terms(task['problem_statement']))
        ranked = []
        paths = {}
        for position, entry in enumerate(entries):
            path = prior.manifest_path(entry)
            if path is None:
                continue
            overlap = len(issue_terms & set(hints.terms(path)))
            paths[path] = (position + 1, overlap)
            ranked.append((path, position + 1, overlap))
        ranked.sort(key=lambda row: (-row[2], row[0].encode()))
        ranks = {path: rank for rank, (path, _, _) in enumerate(ranked, start=1)}
        gold = loader.get(identifier)
        if gold is None or gold.commit != task['base_commit']:
            raise ValueError('gold-identity')
        references = {_normalize_rel_path(item.get('file', '')) for item in gold.init + gold.add}
        if not references <= paths.keys():
            raise ValueError('reference-path-absent')
        rows.append({'instance_id': identifier, 'repo': task['repo'],
                     'status': 'source-only-priority-diagnostic',
                     'first_stop_position': stop[0][0] + 1,
                     'first_stop_reason': stop[0][1],
                     'manifest_entries': len(entries),
                     'admitted_files': manifest['admitted_files'],
                     'admitted_bytes': manifest['admitted_bytes'],
                     'admitted_postings': manifest['postings'],
                     'reference_positions_in_path_order': sorted(paths[path][0] for path in references),
                     'reference_ranks_issue_path_overlap': sorted(ranks[path] for path in references),
                     'reference_overlap_counts': sorted(paths[path][1] for path in references),
                     'issue_term_count': len(issue_terms),
                     'path_overlap_distribution': dict(sorted(Counter(overlap for _, _, overlap in ranked).items()))})
    if len(rows) != 3:
        raise ValueError('completed-target-count')
    receipt = {'schema_version': 'are.g01-r13-index-priority-diagnosis/v1',
               'status': 'evaluator-only-exposed-no-model',
               'candidate_sha256': PINS[CANDIDATE], 'failed_diagnosis_sha256': PINS[DIAGNOSIS],
               'script_sha256': sha(Path(__file__)), 'rows': rows,
               'gold_paths_or_content_exported': False, 'model_calls': 0,
               'claim_ceiling': 'Issue-path rank diagnosis on exposed failed tasks; no policy qualification, campaign, or superiority.',
               'open_questions': ['Would a separately versioned source-only priority policy admit these and other exposed reference files under the same bounds?',
                                  'Would it preserve an immutable query-invariant task index and full worker settlement?']}
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(receipt, sort_keys=True, indent=2) + '\n').encode())
    print(json.dumps({'status': receipt['status'], 'rows': rows,
                      'receipt_sha256': sha(OUTPUT)}, sort_keys=True))


if __name__ == '__main__':
    main()
