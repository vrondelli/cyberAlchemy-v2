#!/usr/bin/env python3
"""Balanced, score-blind successor screen of previously sampled origins.

Selection uses source fields and exclusion IDs only. Native labels are opened
solely by audit(), after the manifest is sealed, and only lineage bits/counts
are emitted.
"""

import argparse
from collections import Counter, defaultdict
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import sys

import pyarrow.parquet as pq


BASE = Path('/opt/are/evolution-runtime')
LARGE_SCRIPT = BASE / 'g01-post-r10-new-origin-screen-r1/screen-g01-post-r10-origins-r1.py'
LARGE_MANIFEST = BASE / 'g01-post-r10-new-origin-screen-r1/SOURCE-ONLY-MANIFEST.json'
LARGE_RECEIPT = BASE / 'g01-post-r10-new-origin-screen-r1/GOLD-LINEAGE-ELIGIBILITY.json'
SMALL_SCRIPT = BASE / 'g01-post-r10-small-origin-screen-r1/screen-g01-post-r10-singletons-r1.py'
SMALL_MANIFEST = BASE / 'g01-post-r10-small-origin-screen-r1/SOURCE-ONLY-MANIFEST.json'
SMALL_RECEIPT = BASE / 'g01-post-r10-small-origin-screen-r1/GOLD-LINEAGE-ELIGIBILITY.json'
EXPECTED = {
    LARGE_SCRIPT: '8b34c331bc9b89fb50cda6d71fdcf1a59f155ace9e68391d9cb6139c24d805e6',
    LARGE_MANIFEST: '82111c24d205e34cd76196df008f6295ccaf71e88e7c9149d7ef834e11cfdcc8',
    LARGE_RECEIPT: '5f0c5a045c8a42f982a35972f1475ea4c46c3bc46acc94705dcd61e8dd2542f3',
    SMALL_SCRIPT: 'c3bb077272d0222aa76d23ccf15b848ce99353d0cbdc280b7e2f983a1ea31c9d',
    SMALL_MANIFEST: '51e5558adfd11b74bf9ae643934b3c946dcfb4db202a0d6affdc1346aae61712',
    SMALL_RECEIPT: 'a5335273bcad20b351cd3323e744806b5824bebf7b20aa8ae19eb88ed5f4e219',
}
SEED = 'are-g01-post-r10-prior-origin-balanced-eight-20261001'
PER_ORIGIN = 8


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


def source_selection():
    if any(sha(path) != digest for path, digest in EXPECTED.items()):
        raise ValueError('prior-screen-drift')
    large = module(LARGE_SCRIPT, 'g01_post_r10_large_screen')
    small = module(SMALL_SCRIPT, 'g01_post_r10_small_screen')
    large_rows, _, _, _, _ = large.source_selection()
    small_prior, small_rows, _, _ = small.source_selection()
    if small_prior.EXPECTED != large.EXPECTED:
        raise ValueError('source-binding-drift')
    large_manifest = json.loads(LARGE_MANIFEST.read_text())
    small_manifest = json.loads(SMALL_MANIFEST.read_text())
    if (large_rows != large_manifest['ordered_tasks'] or
            small_rows != small_manifest['ordered_tasks']):
        raise ValueError('prior-source-replay-drift')
    for path, expected_tasks in ((LARGE_RECEIPT, 49), (SMALL_RECEIPT, 13)):
        receipt = json.loads(path.read_text())
        if (receipt.get('status') != 'evaluator-only-no-model-no-scores' or
                receipt.get('summary', {}).get('tasks') != expected_tasks or
                receipt.get('gold_paths_or_content_exported') is not False or
                receipt.get('model_calls') != 0):
            raise ValueError('prior-eligibility-boundary')
    exposure = large.module(large.EXPOSURE_HELPER, 'g01_balanced_exposure')
    g01, g02 = exposure.manifest_paths(large.BASE, large.RUNS)
    probe = large.BASE / 'g01-post-r8-large-index-probe-r2/CONFIG.json'
    if probe not in g01 or json.loads(probe.read_text()).get('model_calls') != 0:
        raise ValueError('zero-task-probe-drift')
    g01.remove(probe)
    seen = set()
    for branch, paths in (('g01', g01), ('g02', g02)):
        for path in paths:
            seen.update(exposure.ids_from_manifest(path, branch))
    seen.update(row['instance_id'] for row in json.loads(large.R10_FREEZE.read_text())['ordered_tasks'])
    origins = set()
    for path in large.PRIOR_SCREENS:
        value = json.loads(path.read_text())
        origins.update(value['target_origins'])
        seen.update(row['instance_id'] for row in value['ordered_tasks'])
    for receipt in large.inputs():
        seen.update(row['instance_id'] for row in receipt['tasks'])
    seen.update(row['instance_id'] for row in large_rows + small_rows)
    rows = pq.read_table(large.PARQUET, columns=list(large.SOURCE_FIELDS)).to_pylist()
    if len({row['instance_id'] for row in rows}) != len(rows):
        raise ValueError('duplicate-source-id')
    eligible = defaultdict(list)
    for row in rows:
        if row['repo_url'] not in origins or row['instance_id'] in seen:
            continue
        if not all(isinstance(row[field], str) and row[field] for field in large.SOURCE_FIELDS):
            continue
        if not re.fullmatch(r'[0-9a-f]{40}', row['base_commit']):
            continue
        eligible[row['repo_url']].append(row)
    selected = []
    for origin in sorted(eligible):
        candidates = sorted(eligible[origin], key=lambda row:
                            (hashlib.sha256((SEED + '\0' + row['instance_id']).encode()).hexdigest(),
                             row['instance_id']))
        selected.extend(candidates[:PER_ORIGIN])
    selected_origins = Counter(row['repo_url'] for row in selected)
    if (len(origins) != 16 or len(eligible) != 15 or len(selected) != 103 or
            len(selected_origins) != 15 or max(selected_origins.values()) > PER_ORIGIN or
            len({row['instance_id'] for row in selected}) != len(selected)):
        raise ValueError('balanced-source-supply-drift')
    return large, selected, selected_origins, large.id_sha(seen), dict(sorted((k, len(v)) for k, v in eligible.items()))


def select(out):
    large, rows, origins, exposure_sha, supply = source_selection()
    result = {
        'schema_version': 'are.g01-post-r10-prior-origin-screen/v1',
        'status': 'source-only-frozen-for-evaluator-screen', 'seed': SEED,
        'source_fields': list(large.SOURCE_FIELDS),
        'source_parquet_sha256': large.EXPECTED[large.PARQUET],
        'prior_screen_sha256': {path.name + ':' + path.parent.name: digest
                                for path, digest in EXPECTED.items()},
        'exposure_set_sha256': exposure_sha, 'per_origin_max': PER_ORIGIN,
        'available_source_rows_by_origin': supply,
        'selected_by_origin': dict(sorted(origins.items())),
        'ordered_tasks': rows, 'task_id_set_sha256': large.id_sha(row['instance_id'] for row in rows),
        'selector_sha256': sha(Path(__file__)), 'gold_values_or_paths_used': False,
        'model_calls': 0,
        'claim_ceiling': 'Balanced score-blind eligibility screen only; no campaign freeze, quality, or superiority.',
        'open_questions': ['How many selected tasks have mechanically clean exact-base labels?',
                           'Does known clean supply support the full 24-task diversity cap?'],
    }
    large.save_new(out, result)
    print(json.dumps({'status': result['status'], 'tasks': len(rows), 'origins': len(origins),
                      'manifest_sha256': sha(out), 'task_id_set_sha256': result['task_id_set_sha256']}))


def audit(manifest_path, out):
    large, rows, origins, exposure_sha, supply = source_selection()
    manifest = json.loads(manifest_path.read_text())
    if (manifest.get('schema_version') != 'are.g01-post-r10-prior-origin-screen/v1' or
            manifest.get('status') != 'source-only-frozen-for-evaluator-screen' or
            manifest.get('seed') != SEED or manifest.get('ordered_tasks') != rows or
            manifest.get('selected_by_origin') != dict(sorted(origins.items())) or
            manifest.get('available_source_rows_by_origin') != supply or
            manifest.get('source_parquet_sha256') != large.EXPECTED[large.PARQUET] or
            manifest.get('exposure_set_sha256') != exposure_sha or
            manifest.get('per_origin_max') != PER_ORIGIN or
            manifest.get('task_id_set_sha256') != large.id_sha(row['instance_id'] for row in rows) or
            manifest.get('selector_sha256') != sha(Path(__file__))):
        raise ValueError('frozen-selection-drift')
    rule = large.module(large.LINEAGE_RULE, 'g01_balanced_lineage_rule')
    sys.path.insert(0, str(large.UPSTREAM))
    from contextbench.parsers.gold import GoldLoader, _normalize_rel_path
    loader = GoldLoader(str(large.PARQUET))
    cache, stats, results = {}, Counter(), []
    for row in rows:
        gold = loader.get(row['instance_id'])
        if gold is None or gold.commit != row['base_commit'] or gold._data['language'] != row['language']:
            raise ValueError('gold-source-identity-drift')
        repo = row['repo_url'][len('https://github.com/'):-len('.git')]
        verdicts = []
        for item in gold.init + gold.add:
            path = _normalize_rel_path(item.get('file', ''))
            if not path or path.startswith('/') or '..' in Path(path).parts or '\\' in path:
                verdicts.append('invalid-path')
                continue
            source = rule.fetch_source(repo, row['base_commit'], path, cache, stats)
            verdicts.append(rule.classify(item, source, _normalize_rel_path))
        results.append({'instance_id': row['instance_id'], 'repo': row['repo'],
                        'language': row['language'],
                        'gold_lineage_clean': bool(verdicts) and all(v.startswith('verified-') for v in verdicts),
                        'annotation_count': len(verdicts),
                        'classification_counts': dict(sorted(Counter(verdicts).items()))})
    receipt = {
        'schema_version': 'are.g01-post-r10-prior-origin-lineage/v1',
        'status': 'evaluator-only-no-model-no-scores',
        'source_manifest_sha256': sha(manifest_path),
        'source_parquet_sha256': large.EXPECTED[large.PARQUET],
        'exposure_set_sha256': exposure_sha,
        'prior_rule_sha256': large.EXPECTED[large.LINEAGE_RULE],
        'script_sha256': sha(Path(__file__)),
        'source_fetch_counts': dict(sorted(stats.items())), 'tasks': results,
        'summary': {'tasks': len(results),
                    'clean': sum(row['gold_lineage_clean'] for row in results),
                    'clean_by_repo': dict(sorted(Counter(row['repo'] for row in results
                                                        if row['gold_lineage_clean']).items()))},
        'gold_paths_or_content_exported': False, 'model_calls': 0,
        'claim_ceiling': 'Mechanical exact-base label lineage only; no runner admission, quality, or superiority.',
        'open_questions': ['Does combined clean supply meet the 24-task diversity and source-index gates?'],
    }
    large.save_new(out, receipt)
    print(json.dumps({'status': receipt['status'], 'summary': receipt['summary'],
                      'source_fetch_counts': receipt['source_fetch_counts'],
                      'receipt_sha256': sha(out)}, sort_keys=True))


def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest='mode', required=True)
    sub.add_parser('select').add_argument('--out', required=True, type=Path)
    audit_cmd = sub.add_parser('audit')
    audit_cmd.add_argument('--manifest', required=True, type=Path)
    audit_cmd.add_argument('--out', required=True, type=Path)
    args = parser.parse_args()
    if args.mode == 'select':
        select(args.out)
    else:
        audit(args.manifest, args.out)


if __name__ == '__main__':
    main()
