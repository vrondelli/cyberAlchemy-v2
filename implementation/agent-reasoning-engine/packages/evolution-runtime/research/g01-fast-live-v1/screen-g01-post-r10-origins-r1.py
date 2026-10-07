#!/usr/bin/env python3
"""Freeze a score-blind post-r10 origin screen, then audit labels separately.

The selector reads only the eight declared source fields and exposure IDs. The
evaluator emits eligibility bits and classification counts, never gold paths,
content, scores, or fetched source.
"""

import argparse
from collections import Counter, defaultdict
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import sys

import pyarrow.parquet as pq


BASE = Path('/opt/are/evolution-runtime')
RUNS = Path('/opt/are-benchmark-runs')
UPSTREAM = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
PARQUET = UPSTREAM / 'data/full.parquet'
EXPOSURE_HELPER = BASE / 'g01-span-refinement-tools-r3/audit-cross-branch-supply-r1.py'
LINEAGE_RULE = BASE / 'g01-cpp-gold-lineage-http-r1/audit-cpp-gold-lineage-http-r1.py'
R10_FREEZE = BASE / 'g01-product-replication-r10/CAMPAIGN-FREEZE.json'
PRIOR_SCREENS = (
    BASE / 'g01-r10-expansion-screen-r1/SOURCE-ONLY-MANIFEST.json',
    BASE / 'g01-r10-expansion-screen-r2/SOURCE-ONLY-MANIFEST.json',
)
PRIOR_SELECTOR = BASE / 'g01-r10-clean-cohort-candidate-r1/propose-g01-r10-clean-cohort-r1.py'
EXPECTED = {
    PARQUET: '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8',
    EXPOSURE_HELPER: 'f2f5bcced7e056542e8f92e3ac0c3ed9bd117ba8c110d99918d185c88e3e8b6a',
    LINEAGE_RULE: '485a699e766f2c434ecf50109a0e7401facf700aee757e2443dacb856c7d584b',
    R10_FREEZE: '44a44757822043dfb5bbb440a37eeec5729796058db776459a764a913d94d37c',
    PRIOR_SCREENS[0]: '0524fabe02cc52ccb0dcdbf3698739a684bdfa0d32fa71acdeef012d37fdc423',
    PRIOR_SCREENS[1]: '8ab819e99b74d85a9465aef8afad3ac777b4eac95900632032985aa97f67cdcb',
}
SOURCE_FIELDS = ('instance_id', 'original_inst_id', 'repo', 'repo_url', 'language',
                 'base_commit', 'problem_statement', 'source')
SEED = 'are-g01-post-r10-score-blind-new-origin-screen-20261001'
ORIGIN_COUNT = 5
MIN_TASKS_PER_ORIGIN = 3


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def id_sha(ids):
    return hashlib.sha256(('\n'.join(sorted(ids)) + '\n').encode()).hexdigest()


def module(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    value = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value


def save_new(path, value):
    if not path.parent.is_dir() or path.exists():
        raise ValueError('fresh-existing-parent-output-required')
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(value, sort_keys=True, indent=2) + '\n').encode())


def inputs():
    for path, expected in EXPECTED.items():
        if sha(path) != expected:
            raise ValueError('pinned-input-drift:' + str(path))
    selector = module(PRIOR_SELECTOR, 'prior_g01_selector')
    if selector.PARQUET != PARQUET or selector.SOURCE_FIELDS != SOURCE_FIELDS:
        raise ValueError('source-projection-drift')
    prior_receipts = []
    for name, (path, expected) in selector.RECEIPTS.items():
        if sha(path) != expected:
            raise ValueError('prior-screen-drift:' + name)
        receipt = json.loads(path.read_text())
        if receipt.get('gold_paths_or_content_exported') is not False or receipt.get('model_calls', 0) != 0:
            raise ValueError('prior-screen-boundary:' + name)
        prior_receipts.append(receipt)
    return prior_receipts


def source_selection():
    receipts = inputs()
    exposure = module(EXPOSURE_HELPER, 'post_r10_exposure')
    g01, g02 = exposure.manifest_paths(BASE, RUNS)
    probe = BASE / 'g01-post-r8-large-index-probe-r2/CONFIG.json'
    if probe not in g01 or json.loads(probe.read_text()).get('model_calls') != 0:
        raise ValueError('zero-task-probe-drift')
    g01.remove(probe)
    seen = set()
    for branch, paths in (('g01', g01), ('g02', g02)):
        for path in paths:
            seen.update(exposure.ids_from_manifest(path, branch))
    r10 = json.loads(R10_FREEZE.read_text())
    if len(r10['ordered_tasks']) != 24:
        raise ValueError('r10-freeze-shape')
    seen.update(row['instance_id'] for row in r10['ordered_tasks'])
    earlier_origins = set()
    for path in PRIOR_SCREENS:
        value = json.loads(path.read_text())
        earlier_origins.update(value['target_origins'])
        seen.update(row['instance_id'] for row in value['ordered_tasks'])
    for receipt in receipts:
        seen.update(row['instance_id'] for row in receipt['tasks'])
    rows = pq.read_table(PARQUET, columns=list(SOURCE_FIELDS)).to_pylist()
    if len({row['instance_id'] for row in rows}) != len(rows):
        raise ValueError('duplicate-source-id')
    by_origin = defaultdict(list)
    for row in rows:
        if row['instance_id'] in seen or row['repo_url'] in earlier_origins:
            continue
        if not all(isinstance(row[field], str) and row[field] for field in SOURCE_FIELDS):
            continue
        if not re.fullmatch(r'[0-9a-f]{40}', row['base_commit']):
            continue
        if not re.fullmatch(r'https://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+\.git', row['repo_url']):
            continue
        by_origin[row['repo_url']].append(row)
    origins = sorted((origin for origin, candidates in by_origin.items()
                      if len(candidates) >= MIN_TASKS_PER_ORIGIN),
                     key=lambda origin: (-len(by_origin[origin]), origin))[:ORIGIN_COUNT]
    if len(origins) != ORIGIN_COUNT:
        raise ValueError('insufficient-new-origin-supply')
    chosen = []
    for origin in origins:
        candidates = sorted(by_origin[origin], key=lambda row:
                            (hashlib.sha256((SEED + '\0' + row['instance_id']).encode()).hexdigest(),
                             row['instance_id']))
        chosen.extend(candidates)
    if len(chosen) < ORIGIN_COUNT * MIN_TASKS_PER_ORIGIN or len({r['instance_id'] for r in chosen}) != len(chosen):
        raise ValueError('selection-shape')
    return chosen, origins, id_sha(seen), len(seen), len(g01) + len(g02)


def select(out):
    rows, origins, exposure_sha, exposure_count, manifest_count = source_selection()
    result = {
        'schema_version': 'are.g01-post-r10-new-origin-screen/v1',
        'status': 'source-only-frozen-for-evaluator-screen', 'seed': SEED,
        'source_fields': list(SOURCE_FIELDS), 'source_parquet_sha256': EXPECTED[PARQUET],
        'exposure_set_sha256': exposure_sha, 'exposure_count': exposure_count,
        'exposure_manifest_count': manifest_count, 'target_origins': origins,
        'per_origin': 'all-source-eligible', 'minimum_tasks_per_origin': MIN_TASKS_PER_ORIGIN,
        'ordered_tasks': rows,
        'task_id_set_sha256': id_sha(row['instance_id'] for row in rows),
        'selector_sha256': sha(Path(__file__)), 'gold_values_or_paths_used': False,
        'model_calls': 0,
        'claim_ceiling': 'Source-only evaluator-screen sample; no campaign freeze, score, or superiority.',
        'open_questions': ['Which sampled labels have mechanically clean exact-base lineage?',
                           'Can clean tasks pass source-index, native-gold coverage and storage admission?'],
    }
    save_new(out, result)
    print(json.dumps({'status': result['status'], 'tasks': len(rows), 'origins': len(origins),
                      'manifest_sha256': sha(out), 'task_id_set_sha256': result['task_id_set_sha256']}))


def audit(manifest_path, out):
    manifest = json.loads(manifest_path.read_text())
    rows, origins, exposure_sha, exposure_count, manifest_count = source_selection()
    if (manifest.get('schema_version') != 'are.g01-post-r10-new-origin-screen/v1' or
            manifest.get('status') != 'source-only-frozen-for-evaluator-screen' or
            manifest.get('selector_sha256') != sha(Path(__file__)) or
            manifest.get('source_parquet_sha256') != EXPECTED[PARQUET] or
            manifest.get('exposure_set_sha256') != exposure_sha or
            manifest.get('exposure_count') != exposure_count or
            manifest.get('exposure_manifest_count') != manifest_count or
            manifest.get('target_origins') != origins or manifest.get('per_origin') != 'all-source-eligible' or
            manifest.get('minimum_tasks_per_origin') != MIN_TASKS_PER_ORIGIN or
            manifest.get('seed') != SEED or manifest.get('ordered_tasks') != rows or
            manifest.get('task_id_set_sha256') != id_sha(row['instance_id'] for row in rows)):
        raise ValueError('frozen-source-selection-drift')
    rule = module(LINEAGE_RULE, 'post_r10_lineage_rule')
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader, _normalize_rel_path
    loader = GoldLoader(str(PARQUET))
    cache, stats, verdict_rows = {}, Counter(), []
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
        verdict_rows.append({'instance_id': row['instance_id'], 'repo': row['repo'],
                             'language': row['language'],
                             'gold_lineage_clean': bool(verdicts) and all(v.startswith('verified-') for v in verdicts),
                             'annotation_count': len(verdicts),
                             'classification_counts': dict(sorted(Counter(verdicts).items()))})
    result = {
        'schema_version': 'are.g01-post-r10-gold-lineage-screen/v1',
        'status': 'evaluator-only-no-model-no-scores',
        'source_manifest_sha256': sha(manifest_path),
        'source_parquet_sha256': EXPECTED[PARQUET], 'exposure_set_sha256': exposure_sha,
        'prior_rule_sha256': EXPECTED[LINEAGE_RULE], 'script_sha256': sha(Path(__file__)),
        'source_fetch_counts': dict(sorted(stats.items())), 'tasks': verdict_rows,
        'summary': {'tasks': len(verdict_rows),
                    'clean': sum(row['gold_lineage_clean'] for row in verdict_rows),
                    'clean_by_repo': dict(sorted(Counter(row['repo'] for row in verdict_rows
                                                        if row['gold_lineage_clean']).items()))},
        'gold_paths_or_content_exported': False, 'model_calls': 0,
        'claim_ceiling': 'Mechanical exact-base label lineage only; not semantic correctness, runner admission, campaign freeze, or superiority.',
        'open_questions': ['Can combined clean supply support a diverse 24-task cohort and source-only preflight?'],
    }
    save_new(out, result)
    print(json.dumps({'status': result['status'], 'summary': result['summary'],
                      'source_fetch_counts': result['source_fetch_counts'],
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
