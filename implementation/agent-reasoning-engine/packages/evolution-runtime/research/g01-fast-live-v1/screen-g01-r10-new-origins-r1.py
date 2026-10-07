#!/usr/bin/env python3
"""Two-stage, score-blind G01 r10 supply expansion; never exports gold paths."""

import argparse
from collections import Counter
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import sys

import pyarrow.parquet as pq


BASE = Path('/opt/are/evolution-runtime')
UPSTREAM = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
PARQUET = UPSTREAM / 'data/full.parquet'
EXPOSURE_SCRIPT = BASE / 'g01-span-refinement-tools-r3/audit-cross-branch-supply-r1.py'
R9_FREEZE = BASE / 'g01-product-replication-r9/CAMPAIGN-FREEZE.json'
PROBE_CONFIG = BASE / 'g01-post-r8-large-index-probe-r2/CONFIG.json'
PRIOR_RULE = BASE / 'g01-cpp-gold-lineage-http-r1/audit-cpp-gold-lineage-http-r1.py'
PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
EXPOSURE_SCRIPT_SHA = 'f2f5bcced7e056542e8f92e3ac0c3ed9bd117ba8c110d99918d185c88e3e8b6a'
PRIOR_EXPOSURE_SHA = '9e77d358fc924541e8963528be6f4d7c8cc5f54af35176207faf3541035710cf'
CURRENT_EXPOSURE_SHA = 'daf046ec707d74ef73bb04b50152f6777ef99c0c459ac22b94673a4be502a3f7'
R9_FREEZE_SHA = '4851c65ab0c129b50d080cf416574c35eeba4a0b074f89497cee96a798c65c47'
PRIOR_RULE_SHA = '485a699e766f2c434ecf50109a0e7401facf700aee757e2443dacb856c7d584b'
SEED = 'are-g01-r10-new-origins-score-blind-20260930'
TARGET_ORIGINS = (
    'https://github.com/django/django.git',
    'https://github.com/sympy/sympy.git',
    'https://github.com/matplotlib/matplotlib.git',
    'https://github.com/sphinx-doc/sphinx.git',
    'https://github.com/pytest-dev/pytest.git',
    'https://github.com/psf/requests.git',
    'https://github.com/pylint-dev/pylint.git',
    'https://github.com/yt-dlp/yt-dlp.git',
)
SOURCE_FIELDS = ('instance_id', 'original_inst_id', 'repo', 'repo_url',
                 'language', 'base_commit', 'problem_statement', 'source')


def sha(path):
    with path.open('rb') as stream:
        digest = hashlib.sha256()
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
        return digest.hexdigest()


def id_digest(ids):
    return hashlib.sha256(('\n'.join(sorted(ids)) + '\n').encode()).hexdigest()


def load_module(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def exposure():
    if (sha(EXPOSURE_SCRIPT) != EXPOSURE_SCRIPT_SHA or
            sha(R9_FREEZE) != R9_FREEZE_SHA or
            sha(PARQUET) != PARQUET_SHA):
        raise ValueError('pinned-input-drift')
    source = load_module(EXPOSURE_SCRIPT, 'g01_r10_exposure')
    g01, g02 = source.manifest_paths(BASE, Path('/opt/are-benchmark-runs'))
    # One known zero-task index probe matches the old glob, but is not a
    # campaign. Every other matching manifest must parse; no broad fallback.
    if PROBE_CONFIG not in g01:
        raise ValueError('probe-config-not-found')
    probe = json.loads(PROBE_CONFIG.read_text())
    if probe.get('model_calls') != 0 or 'tasks' in probe:
        raise ValueError('probe-config-changed')
    g01.remove(PROBE_CONFIG)
    union = set()
    for branch, paths in (('g01', g01), ('g02', g02)):
        for path in paths:
            union.update(source.ids_from_manifest(path, branch))
    r9_ids = {row['instance_id'] for row in json.loads(R9_FREEZE.read_text())['ordered_tasks']}
    if (len(r9_ids) != 24 or not r9_ids <= union or
            id_digest(union - r9_ids) != PRIOR_EXPOSURE_SHA or
            id_digest(union) != CURRENT_EXPOSURE_SHA):
        raise ValueError('exposure-lineage-drift')
    return union


def save_new(path, value):
    if not path.parent.is_dir() or path.exists():
        raise ValueError('fresh-output-required')
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'wb') as stream:
        stream.write((json.dumps(value, indent=2, sort_keys=True) + '\n').encode())


def selected_source_rows(seen):
    source = pq.read_table(PARQUET, columns=list(SOURCE_FIELDS)).to_pylist()
    if len({row['instance_id'] for row in source}) != len(source):
        raise ValueError('duplicate-source-id')
    by_origin = {origin: [] for origin in TARGET_ORIGINS}
    for row in source:
        if row['repo_url'] not in by_origin or row['instance_id'] in seen:
            continue
        if (row['language'] != 'python' or
                not all(isinstance(row[field], str) and row[field] for field in SOURCE_FIELDS) or
                not re.fullmatch(r'[0-9a-f]{40}', row['base_commit'])):
            raise ValueError('source-row-invalid')
        by_origin[row['repo_url']].append(row)
    selected = []
    for origin in TARGET_ORIGINS:
        candidates = sorted(by_origin[origin], key=lambda row:
                            (hashlib.sha256((SEED + '\0' + row['instance_id']).encode()).hexdigest(),
                             row['instance_id']))
        if len(candidates) < 3:
            raise ValueError('insufficient-origin-supply:' + origin)
        selected.extend(candidates[:3])
    ids = {row['instance_id'] for row in selected}
    if len(ids) != 24 or ids & seen:
        raise ValueError('selection-shape')
    return selected


def select(out):
    seen = exposure()
    selected = selected_source_rows(seen)
    ids = {row['instance_id'] for row in selected}
    result = {'schema_version': 'are.g01-r10-new-origin-screen-manifest/v1',
              'status': 'source-only-frozen-for-evaluator-screen', 'seed': SEED,
              'target_origins': list(TARGET_ORIGINS), 'per_origin': 3,
              'source_fields': list(SOURCE_FIELDS), 'source_parquet_sha256': PARQUET_SHA,
              'exposure_set_sha256': CURRENT_EXPOSURE_SHA,
              'r9_freeze_sha256': R9_FREEZE_SHA, 'ordered_tasks': selected,
              'task_id_set_sha256': id_digest(ids), 'selector_sha256': sha(Path(__file__)),
              'gold_values_or_paths_used': False, 'model_calls': 0,
              'claim_ceiling': 'Score-blind evaluator-screen sample only; no eligibility, campaign freeze, score or superiority.',
              'open_questions': ['Which sampled tasks have mechanically clean exact-base labels?',
                                 'Can clean tasks pass cache, index, coverage and storage preflight?']}
    save_new(out, result)
    print(json.dumps({'status': result['status'], 'tasks': len(ids),
                      'origins': len(TARGET_ORIGINS), 'manifest_sha256': sha(out),
                      'task_id_set_sha256': result['task_id_set_sha256']}))


def audit(manifest_path, out):
    seen = exposure()
    if sha(PRIOR_RULE) != PRIOR_RULE_SHA:
        raise ValueError('prior-rule-drift')
    manifest = json.loads(manifest_path.read_text())
    tasks = manifest.get('ordered_tasks')
    if (manifest.get('schema_version') != 'are.g01-r10-new-origin-screen-manifest/v1' or
            manifest.get('status') != 'source-only-frozen-for-evaluator-screen' or
            manifest.get('selector_sha256') != sha(Path(__file__)) or
            manifest.get('exposure_set_sha256') != CURRENT_EXPOSURE_SHA or
            manifest.get('source_parquet_sha256') != PARQUET_SHA or
            manifest.get('r9_freeze_sha256') != R9_FREEZE_SHA or
            manifest.get('seed') != SEED or
            manifest.get('target_origins') != list(TARGET_ORIGINS) or
            manifest.get('per_origin') != 3 or
            not isinstance(tasks, list) or tasks != selected_source_rows(seen) or
            id_digest(row['instance_id'] for row in tasks) != manifest.get('task_id_set_sha256')):
        raise ValueError('screen-manifest-drift')
    core = load_module(PRIOR_RULE, 'g01_r10_lineage_rule')
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader, _normalize_rel_path
    loader = GoldLoader(str(PARQUET))
    cache = {}
    stats = Counter()
    rows = []
    for row in tasks:
        gold = loader.get(row['instance_id'])
        if gold is None or gold.commit != row['base_commit'] or gold._data['language'] != 'python':
            raise ValueError('gold-source-identity-drift')
        source_repo = row['repo_url'][len('https://github.com/'):-len('.git')]
        verdicts = []
        for item in gold.init + gold.add:
            path = _normalize_rel_path(item.get('file', ''))
            if not path or path.startswith('/') or '..' in Path(path).parts or '\\' in path:
                verdicts.append('invalid-path')
                continue
            source = core.fetch_source(source_repo, row['base_commit'], path, cache, stats)
            verdicts.append(core.classify(item, source, _normalize_rel_path))
        rows.append({'instance_id': row['instance_id'], 'repo': row['repo'],
                     'gold_lineage_clean': bool(verdicts) and all(v.startswith('verified-') for v in verdicts),
                     'annotation_count': len(verdicts),
                     'classification_counts': dict(sorted(Counter(verdicts).items()))})
    result = {'schema_version': 'are.g01-r10-new-origin-gold-lineage-screen/v1',
              'status': 'evaluator-only-no-model-no-scores',
              'source_manifest_sha256': sha(manifest_path), 'source_parquet_sha256': PARQUET_SHA,
              'exposure_set_sha256': CURRENT_EXPOSURE_SHA, 'prior_rule_sha256': PRIOR_RULE_SHA,
              'script_sha256': sha(Path(__file__)), 'source_fetch_counts': dict(sorted(stats.items())),
              'tasks': rows, 'summary': {'tasks': len(rows),
                                        'clean': sum(row['gold_lineage_clean'] for row in rows),
                                        'clean_by_repo': dict(sorted(Counter(row['repo'] for row in rows if row['gold_lineage_clean']).items()))},
              'gold_paths_or_content_exported': False, 'model_calls': 0,
              'claim_ceiling': 'Mechanical exact-base label lineage only; not semantic correctness, runner eligibility, campaign freeze or quality.',
              'open_questions': ['Which clean sampled tasks support a diverse 24-task source-only cohort?']}
    save_new(out, result)
    print(json.dumps({'status': result['status'], 'summary': result['summary'],
                      'source_fetch_counts': result['source_fetch_counts'],
                      'receipt_sha256': sha(out)}, sort_keys=True))


def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest='mode', required=True)
    first = sub.add_parser('select')
    first.add_argument('--out', required=True, type=Path)
    second = sub.add_parser('audit')
    second.add_argument('--manifest', required=True, type=Path)
    second.add_argument('--out', required=True, type=Path)
    args = parser.parse_args()
    if args.mode == 'select':
        select(args.out)
    else:
        audit(args.manifest, args.out)


if __name__ == '__main__':
    main()
