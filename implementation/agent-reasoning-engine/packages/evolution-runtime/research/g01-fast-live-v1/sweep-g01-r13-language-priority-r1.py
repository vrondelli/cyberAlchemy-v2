#!/usr/bin/env python3
"""Exposed 24-task source-only priority simulation, sealed before evaluator join."""
from collections import Counter
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import sys
import time

BASE = Path('/opt/are/evolution-runtime')
UPSTREAM = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
PRIOR = BASE / 'g01-r13-language-priority-simulation-r1/simulate-g01-r13-language-priority-r1.py'
THREE = BASE / 'g01-r13-language-priority-simulation-r1/SIMULATION.json'
OLD_AUDIT = BASE / 'g01-r13-index-gold-coverage-r1/GOLD-INDEX-COVERAGE.json'
ROOT = BASE / 'g01-r13-language-priority-sweep-r1'
SOURCE_RECEIPT = ROOT / 'SOURCE-ONLY-PROJECTIONS.json'
GOLD_RECEIPT = ROOT / 'GOLD-COVERAGE.json'
PINS = {PRIOR: '6574f9db0096399ed0e1516dec2ec2788d352de23316afce67a424694e4596a1',
        THREE: '451121273c0a12ef2ea41003336e4dca7765c99b4a9f2441f39e5bf0e25386bf',
        OLD_AUDIT: 'a575a28b407000bde24243b0cbdbdaa01acb9ef99973bb4089be6aa52659d182'}
SOURCE_SUFFIXES = {
    'cpp': ('.c', '.cc', '.cpp', '.cxx', '.h', '.hh', '.hpp', '.hxx'),
    'java': ('.java',),
    'javascript': ('.js', '.jsx', '.mjs', '.cjs'),
    'python': ('.py',),
    'typescript': ('.ts', '.tsx'),
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def module(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    value = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value


def save_new(path, value):
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(value, sort_keys=True, indent=2) + '\n').encode())


def inventory(core, repo, commit):
    raw = core.git(repo, ['ls-tree', '-rlz', commit], 8 * 1024**2)
    rows = []
    for item in raw.split(b'\0'):
        if not item:
            continue
        head, path = item.split(b'\t', 1)
        mode, kind, oid, size = head.split()
        if not re.fullmatch(rb'[a-f0-9]{40}', oid):
            raise ValueError('inventory-shape')
        length = int(size) if kind == b'blob' else 0
        rows.append((path, mode.decode('ascii'), oid.decode('ascii'), length))
    if not 0 < len(rows) <= 50000:
        raise ValueError('inventory-entry-limit')
    return rows


def project(task, cache, core, hints):
    repo, commit = Path(cache['repository_path']), task['base_commit']
    if (repo.is_symlink() or not repo.is_dir() or repo.resolve() != repo or
            core.git(repo, ['rev-parse', '--verify', commit + '^{commit}'], 128).decode().strip() != commit):
        raise ValueError('exact-cache-identity')
    rows = inventory(core, repo, commit)
    if task['language'] not in SOURCE_SUFFIXES:
        raise ValueError('unsupported-language')
    suffixes = SOURCE_SUFFIXES[task['language']]
    issue_terms = set(hints.terms(task['problem_statement']))
    ranked = []
    for path, mode, oid, size in rows:
        try:
            clean = hints.safe_path(path)
            overlap = len(issue_terms & set(hints.terms(clean)))
            source_suffix = clean.endswith(suffixes)
        except (UnicodeDecodeError, ValueError):
            clean, overlap, source_suffix = None, 0, False
        ranked.append((path, clean, mode, oid, size, overlap, source_suffix))
    ranked.sort(key=lambda row: (-row[5], -int(row[6]), row[0]))
    max_postings, max_bytes = (2000000, 64 * 1024**2) if len(rows) > 10000 else (8000000, 96 * 1024**2)
    started = time.monotonic()
    admitted, reasons = set(), Counter()
    bytes_used = postings_used = processed = 0
    stop_reason = None
    for path, clean, mode, oid, size, overlap, source_suffix in ranked:
        processed += 1
        if mode not in ('100644', '100755'):
            reasons['mode'] += 1
            continue
        if clean is None:
            reasons['path'] += 1
            continue
        if size > 8 * 1024**2:
            reasons['file-size'] += 1
            continue
        if size > 2000000:
            reasons['native-file-size'] += 1
            continue
        data = core.git(repo, ['cat-file', 'blob', oid], size)
        if len(data) != size:
            raise ValueError('blob-byte-identity')
        try:
            content = data.decode('utf8', errors='strict')
            if '\x00' in content:
                raise ValueError('binary')
        except (UnicodeDecodeError, ValueError):
            reasons['encoding'] += 1
            continue
        lines = content.split('\n')
        if content.endswith('\n'):
            lines.pop()
        postings = len(set(hints.terms(clean))) + sum(len(set(hints.terms(line))) for line in lines)
        if bytes_used + size > max_bytes:
            stop_reason = 'admitted-byte-limit'
            break
        if postings_used + postings > max_postings:
            stop_reason = 'posting-limit'
            break
        admitted.add(clean)
        bytes_used += size
        postings_used += postings
    source = {'instance_id': task['instance_id'], 'repo': task['repo'],
              'language': task['language'], 'inventory_entries': len(rows),
              'ranked_entries_processed': processed,
              'admitted_files': len(admitted), 'admitted_bytes': bytes_used,
              'admitted_postings': postings_used, 'posting_limit': max_postings,
              'byte_limit': max_bytes, 'stop_reason': stop_reason,
              'nonbudget_exclusion_counts': dict(sorted(reasons.items())),
              'admitted_path_set_sha256': hashlib.sha256(('\n'.join(sorted(admitted)) + '\n').encode()).hexdigest(),
              'elapsed_ms': round((time.monotonic() - started) * 1000)}
    return admitted, source


def main():
    if (SOURCE_RECEIPT.exists() or GOLD_RECEIPT.exists() or not ROOT.is_dir() or
            any(sha(path) != digest for path, digest in PINS.items())):
        raise ValueError('output-or-pinned-input-drift')
    prior = module(PRIOR, 'g01_r13_sweep_prior')
    if any(sha(path) != digest for path, digest in prior.PINS.items()):
        raise ValueError('prior-input-drift')
    core = module(prior.PRIOR, 'g01_r13_sweep_core')
    if any(sha(path) != digest for path, digest in core.PINS.items()):
        raise ValueError('core-input-drift')
    candidate, transfer, three, old_audit = (json.loads(path.read_text()) for path in
                                             (core.CANDIDATE, core.TRANSFER, THREE, OLD_AUDIT))
    if (candidate['status'] != 'preflight-only-not-frozen' or len(candidate['ordered_tasks']) != 24 or
            old_audit['status'] != 'failed' or len(old_audit['rows']) != 24 or len(three['rows']) != 3):
        raise ValueError('cohort-or-diagnostic-shape')
    by_cache = {row['instance_id']: row for row in transfer['verified_task_bindings']}
    if len(by_cache) != 24:
        raise ValueError('cache-count')
    hints = module(core.HINTS, 'g01_r13_sweep_hints')
    projections, sources = {}, []
    for index, task in enumerate(candidate['ordered_tasks'], start=1):
        identifier = task['instance_id']
        projections[identifier], source = project(task, by_cache[identifier], core, hints)
        sources.append(source)
        print(json.dumps({'completed': index, 'tasks': 24, 'instance_id': identifier,
                          'admitted_files': source['admitted_files'],
                          'elapsed_ms': source['elapsed_ms']}), flush=True)
    source_receipt = {'schema_version': 'are.g01-r13-language-priority-source-sweep/v1',
                      'status': 'source-only-sealed-before-gold',
                      'candidate_sha256': core.PINS[core.CANDIDATE],
                      'transfer_sha256': core.PINS[core.TRANSFER],
                      'prior_three_task_simulation_sha256': PINS[THREE],
                      'script_sha256': sha(Path(__file__)),
                      'policy': 'issue-term path overlap descending, source suffix first on ties, raw path ascending',
                      'source_suffixes': SOURCE_SUFFIXES, 'rows': sources,
                      'gold_loaded': False, 'model_calls': 0,
                      'claim_ceiling': 'Source-only streaming policy projection; no full index, gold coverage, campaign, or superiority.',
                      'open_questions': ['Does evaluator-only gold coverage improve without regression?',
                                         'Can the full worker implement this task-bound policy within existing limits?']}
    save_new(SOURCE_RECEIPT, source_receipt)
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader, _normalize_rel_path
    loader = GoldLoader(str(UPSTREAM / 'data/full.parquet'))
    old_rows = {row['instance_id']: row for row in old_audit['rows']}
    results = []
    for task in candidate['ordered_tasks']:
        identifier = task['instance_id']
        gold = loader.get(identifier)
        if gold is None or gold.commit != task['base_commit'] or gold._data['language'] != task['language']:
            raise ValueError('gold-source-identity')
        refs = {_normalize_rel_path(item.get('file', '')) for item in gold.init + gold.add}
        if not refs:
            raise ValueError('empty-gold')
        old = old_rows[identifier]
        results.append({'instance_id': identifier, 'repo': task['repo'],
                        'language': task['language'], 'gold_file_count': len(refs),
                        'new_admitted_gold_files': len(refs & projections[identifier]),
                        'new_excluded_gold_files': len(refs - projections[identifier]),
                        'old_admitted_gold_files': old.get('admitted_gold_files'),
                        'old_excluded_gold_files': old.get('excluded_gold_files'),
                        'old_status': old['status']})
    summary = {'tasks': len(results), 'gold_files': sum(row['gold_file_count'] for row in results),
               'new_admitted_gold_files': sum(row['new_admitted_gold_files'] for row in results),
               'new_excluded_gold_files': sum(row['new_excluded_gold_files'] for row in results),
               'new_fully_admitted_tasks': sum(row['new_excluded_gold_files'] == 0 for row in results),
               'old_fully_admitted_audited_tasks': sum(row['old_status'] == 'audited' and
                                                       row['old_excluded_gold_files'] == 0 for row in results),
               'regressed_previously_fully_admitted_tasks':
                   sum(row['old_status'] == 'audited' and row['old_excluded_gold_files'] == 0 and
                       row['new_excluded_gold_files'] > 0 for row in results)}
    receipt = {'schema_version': 'are.g01-r13-language-priority-gold-sweep/v1',
               'status': 'evaluator-only-exposed-no-model',
               'source_receipt_sha256': sha(SOURCE_RECEIPT),
               'old_audit_sha256': PINS[OLD_AUDIT],
               'script_sha256': sha(Path(__file__)),
               'summary': summary, 'rows': results,
               'gold_paths_or_content_exported': False, 'model_calls': 0,
               'claim_ceiling': 'Exposed 24-task streaming simulation only; not a full index implementation, untouched successor, score, or superiority.',
               'open_questions': ['Can a full worker and runner implement this fixed rule and pass reliability/resource tests?',
                                  'Can a separate source-only successor replace the encoding-ineligible C++ task and pass independent native-reference admission?']}
    save_new(GOLD_RECEIPT, receipt)
    print(json.dumps({'status': receipt['status'], 'summary': summary,
                      'source_receipt_sha256': sha(SOURCE_RECEIPT),
                      'gold_receipt_sha256': sha(GOLD_RECEIPT)}, sort_keys=True))


if __name__ == '__main__':
    main()
