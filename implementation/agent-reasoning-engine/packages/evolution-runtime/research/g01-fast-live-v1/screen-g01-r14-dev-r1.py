#!/usr/bin/env python3
"""Fixed development-only source draw, then separate evaluator-only label screen."""
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
RUNS = Path('/opt/are-benchmark-runs')
UPSTREAM = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
PARQUET = UPSTREAM / 'data/full.parquet'
EXPOSURE = BASE / 'g01-span-refinement-tools-r3/audit-cross-branch-supply-r1.py'
RULE = BASE / 'g01-cpp-gold-lineage-http-r1/audit-cpp-gold-lineage-http-r1.py'
R12_LABEL = BASE / 'g01-product-replication-r12/LABEL-LINEAGE-AUDIT.json'
R13_SCREEN = BASE / 'g01-r13-fresh-supply-screen-r1/GOLD-LINEAGE-ELIGIBILITY.json'
R13_R1 = BASE / 'g01-r13-clean-cohort-candidate-r1/COHORT-CANDIDATE.json'
R13_R2 = BASE / 'g01-r13-clean-cohort-candidate-r2/COHORT-CANDIDATE.json'
CAP = BASE / 'g01-r14-dev-cap-r1/RESULT.json'
ACCEPTANCE = BASE / 'g01-r14-dev-cap-r1/acceptance.json'
ROOT = BASE / 'g01-r14-dev-screen-r1'
MANIFEST = ROOT / 'SOURCE-ONLY-MANIFEST.json'
RESULT = ROOT / 'GOLD-LINEAGE-ELIGIBILITY.json'
PINS = {
    PARQUET: '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8',
    EXPOSURE: 'f2f5bcced7e056542e8f92e3ac0c3ed9bd117ba8c110d99918d185c88e3e8b6a',
    RULE: '485a699e766f2c434ecf50109a0e7401facf700aee757e2443dacb856c7d584b',
    R12_LABEL: '8567b38dd0b661c44f6a5e91eb8a65c29a65cfbe3f87ee41ca9739f349801b0f',
    R13_SCREEN: '67adff14486363ab1216720a03c3a692fa6b93c4e381d7ddc90a8bec3da9e9bc',
    R13_R1: '86b3841d0169a2b339d483aad6f0e6e5e8993980c929f11128139f4ff1e04cc5',
    R13_R2: 'e2a7a96ab1da7de1e0e7dba26a19a82ae8661ae481cefad1f504209cadadfe1d',
    CAP: 'e1316479dee8ff9e7843875f8793518007f2f1c836cd0a7d299d39ec5d29065d',
    ACCEPTANCE: 'fc305d5e220dc73dc3f98b06ae9c8aa71c10b1f3adf9e9a52c72ee4e302b8171',
}
SEED = b'are-g01-r14-development-only-label-screen-r1\0'
SOURCE_FIELDS = ('instance_id', 'original_inst_id', 'repo', 'repo_url',
                 'language', 'base_commit', 'problem_statement', 'source')
TARGETS = (
    ('https://github.com/django/django.git', 16),
    ('https://github.com/huggingface/transformers.git', 16),
    ('https://github.com/sympy/sympy.git', 14),
    ('https://github.com/matplotlib/matplotlib.git', 8),
    ('https://github.com/sphinx-doc/sphinx.git', 9),
    ('https://github.com/scikit-learn/scikit-learn.git', 3),
    ('https://github.com/langchain-ai/langchain.git', 1),
)


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def id_sha(ids):
    return hashlib.sha256(('\n'.join(sorted(ids)) + '\n').encode()).hexdigest()


def module(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    value = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value


def save_new(path, value):
    if path.exists() or not path.parent.is_dir():
        raise ValueError('fresh-exact-output-required')
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(value, sort_keys=True, indent=2) + '\n').encode())


def source_basis():
    if any(sha(path) != digest for path, digest in PINS.items()):
        raise ValueError('pinned-input-drift')
    acceptance, cap = json.loads(ACCEPTANCE.read_text()), json.loads(CAP.read_text())
    dev = set(acceptance['scope']['development_instances'])
    reserve = set(acceptance['scope']['reserved_confirmation_instances'])
    if len(dev) != 903 or len(reserve) != 233 or dev & reserve or cap['unscreened_source_valid_dev'] != 198:
        raise ValueError('development-partition-drift')
    exposure = module(EXPOSURE, 'g01_r14_dev_exposure')
    g01, g02 = exposure.manifest_paths(BASE, RUNS)
    probe = BASE / 'g01-post-r8-large-index-probe-r2/CONFIG.json'
    if probe not in g01 or json.loads(probe.read_text()).get('model_calls') != 0:
        raise ValueError('zero-call-probe-drift')
    g01.remove(probe)
    seen = set().union(*(exposure.ids_from_manifest(path, 'g01') for path in g01),
                       *(exposure.ids_from_manifest(path, 'g02') for path in g02))
    seen.update(row['instance_id'] for path in (R13_R1, R13_R2)
                for row in json.loads(path.read_text())['ordered_tasks'])
    screened = set()
    for receipt in json.loads(R12_LABEL.read_text())['screened_receipts']:
        path = Path(receipt['path'])
        if sha(path) != receipt['sha256']:
            raise ValueError('prior-screen-drift')
        screened.update(row['instance_id'] for row in json.loads(path.read_text())['tasks'])
    screened.update(row['instance_id'] for row in json.loads(R13_SCREEN.read_text())['tasks'])
    source = pq.read_table(PARQUET, columns=list(SOURCE_FIELDS)).to_pylist()
    if len({row['instance_id'] for row in source}) != len(source):
        raise ValueError('duplicate-source-id')
    by_origin = {origin: [] for origin, _ in TARGETS}
    for row in source:
        qid = row['instance_id']
        if row['repo_url'] not in by_origin or qid not in dev or qid in seen or qid in screened:
            continue
        if (row['language'] != 'python' or
                not all(isinstance(row[field], str) and row[field] for field in SOURCE_FIELDS) or
                not re.fullmatch(r'[0-9a-f]{40}', row['base_commit'])):
            continue
        by_origin[row['repo_url']].append(row)
    cap_by_origin = {row['origin']: row['unscreened_source_valid_dev'] for row in cap['by_origin']}
    for origin, values in by_origin.items():
        if len(values) != cap_by_origin[origin]:
            raise ValueError('source-cap-count-drift:' + origin)
    selected = []
    for origin, quota in TARGETS:
        values = sorted(by_origin[origin], key=lambda row:
                        (hashlib.sha256(SEED + row['instance_id'].encode()).hexdigest(), row['instance_id']))
        if len(values) < quota:
            raise ValueError('insufficient-origin-supply:' + origin)
        selected.extend(values[:quota])
    ids = {row['instance_id'] for row in selected}
    if len(ids) != 67 or ids & (seen | screened | reserve) or not ids <= dev:
        raise ValueError('selected-source-invalid')
    return selected, id_sha(seen), id_sha(screened), id_sha(reserve)


def select():
    rows, exposure_sha, screened_sha, reserve_sha = source_basis()
    result = {'schema_version': 'are.g01-r14-dev-source-screen-manifest/v1',
              'status': 'source-only-frozen-for-evaluator-screen', 'seed_hex': SEED.hex(),
              'target_origins_and_quotas': TARGETS, 'source_fields': SOURCE_FIELDS,
              'source_parquet_sha256': PINS[PARQUET], 'acceptance_sha256': PINS[ACCEPTANCE],
              'dev_cap_receipt_sha256': PINS[CAP], 'exposure_set_sha256': exposure_sha,
              'prior_screened_id_set_sha256': screened_sha, 'reserved_partition_id_set_sha256': reserve_sha,
              'ordered_tasks': rows, 'task_id_set_sha256': id_sha(row['instance_id'] for row in rows),
              'selector_sha256': sha(Path(__file__)), 'gold_values_or_paths_used': False,
              'model_calls': 0, 'authority_effect': 'none',
              'claim_ceiling': 'Development-only score-blind evaluator-screen sample; no campaign or superiority',
              'open_questions': ['Which selected rows have mechanically clean exact-base labels?',
                                 'Will cap-three diversity and native-reference admission support 24 tasks?']}
    save_new(MANIFEST, result)
    print(json.dumps({'status': result['status'], 'tasks': len(rows), 'origins': len(TARGETS),
                      'manifest_sha256': sha(MANIFEST), 'task_id_set_sha256': result['task_id_set_sha256']}))


def audit():
    rows, exposure_sha, screened_sha, reserve_sha = source_basis()
    manifest = json.loads(MANIFEST.read_text())
    if (manifest.get('schema_version') != 'are.g01-r14-dev-source-screen-manifest/v1' or
            manifest.get('status') != 'source-only-frozen-for-evaluator-screen' or
            manifest.get('selector_sha256') != sha(Path(__file__)) or
            manifest.get('ordered_tasks') != rows or
            manifest.get('exposure_set_sha256') != exposure_sha or
            manifest.get('prior_screened_id_set_sha256') != screened_sha or
            manifest.get('reserved_partition_id_set_sha256') != reserve_sha):
        raise ValueError('frozen-source-manifest-drift')
    rule = module(RULE, 'g01_r14_lineage_rule')
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader, _normalize_rel_path
    loader = GoldLoader(str(PARQUET))
    cache, stats, verdict_rows = {}, Counter(), []
    for row in rows:
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
            source = rule.fetch_source(source_repo, row['base_commit'], path, cache, stats)
            verdicts.append(rule.classify(item, source, _normalize_rel_path))
        verdict_rows.append({'instance_id': row['instance_id'], 'repo': row['repo'],
                             'language': row['language'],
                             'gold_lineage_clean': bool(verdicts) and all(v.startswith('verified-') for v in verdicts),
                             'annotation_count': len(verdicts),
                             'classification_counts': dict(sorted(Counter(verdicts).items()))})
    result = {'schema_version': 'are.g01-r14-dev-source-gold-lineage-screen/v1',
              'status': 'evaluator-only-no-model-no-scores',
              'source_manifest_sha256': sha(MANIFEST), 'source_parquet_sha256': PINS[PARQUET],
              'acceptance_sha256': PINS[ACCEPTANCE], 'exposure_set_sha256': exposure_sha,
              'prior_screened_id_set_sha256': screened_sha, 'reserved_partition_id_set_sha256': reserve_sha,
              'prior_rule_sha256': PINS[RULE], 'script_sha256': sha(Path(__file__)),
              'source_fetch_counts': dict(sorted(stats.items())), 'tasks': verdict_rows,
              'summary': {'tasks': len(verdict_rows),
                          'clean': sum(row['gold_lineage_clean'] for row in verdict_rows),
                          'clean_by_repo': dict(sorted(Counter(row['repo'] for row in verdict_rows
                                                               if row['gold_lineage_clean']).items()))},
              'gold_paths_or_content_exported': False, 'model_calls': 0,
              'claim_ceiling': 'Mechanical exact-base label lineage only; no native-index, score or superiority claim',
              'open_questions': ['Does combined development-only clean supply reach 24 under cap three?',
                                 'Can all selected tasks pass exact cache, index, and native-reference admission?']}
    save_new(RESULT, result)
    print(json.dumps({'status': result['status'], 'summary': result['summary'],
                      'source_fetch_counts': result['source_fetch_counts'],
                      'receipt_sha256': sha(RESULT)}, sort_keys=True))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('mode', choices=('select', 'audit'))
    args = parser.parse_args()
    if args.mode == 'select':
        select()
    else:
        audit()


if __name__ == '__main__':
    main()
