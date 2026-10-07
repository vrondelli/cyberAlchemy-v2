#!/usr/bin/env python3
"""Second score-blind origin tier after the first eligibility screen fell short."""

import argparse
from collections import Counter
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import sys


BASE = Path('/opt/are/evolution-runtime')
TIER1_SCRIPT = BASE / 'g01-r10-expansion-screen-r1/screen-g01-r10-new-origins-r1.py'
TIER1_MANIFEST = BASE / 'g01-r10-expansion-screen-r1/SOURCE-ONLY-MANIFEST.json'
TIER1_RECEIPT = BASE / 'g01-r10-expansion-screen-r1/GOLD-LINEAGE-ELIGIBILITY.json'
TIER1_SCRIPT_SHA = '09e400f8e67a2d2ef684bce4ceda67186a227d7b2289fa804e5c25d2db930046'
TIER1_MANIFEST_SHA = '0524fabe02cc52ccb0dcdbf3698739a684bdfa0d32fa71acdeef012d37fdc423'
TIER1_RECEIPT_SHA = 'ed765ba8269e7a48041d53c4303654de97a3adcaed0e8fbde6c0e62307d6da81'
SEED = 'are-g01-r10-new-origins-tier2-score-blind-20260930'
KNOWN_INCOMPLETE_SOURCE_ID = 'SWE-Bench-Pro__python__maintenance__bugfix__788af515'
TARGET_ORIGINS = (
    'https://github.com/huggingface/transformers.git',
    'https://github.com/ansible/ansible.git',
    'https://github.com/scikit-learn/scikit-learn.git',
    'https://github.com/keras-team/keras.git',
    'https://github.com/pydata/xarray.git',
    'https://github.com/astropy/astropy.git',
    'https://github.com/langchain-ai/langchain.git',
    'https://github.com/anuraghazra/github-readme-stats.git',
)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def core():
    if (sha(TIER1_SCRIPT) != TIER1_SCRIPT_SHA or
            sha(TIER1_MANIFEST) != TIER1_MANIFEST_SHA or
            sha(TIER1_RECEIPT) != TIER1_RECEIPT_SHA):
        raise ValueError('tier1-drift')
    prior = json.loads(TIER1_RECEIPT.read_text())
    if (prior.get('status') != 'evaluator-only-no-model-no-scores' or
            prior.get('summary', {}).get('clean') != 4 or
            prior.get('gold_paths_or_content_exported') is not False):
        raise ValueError('tier1-receipt-invalid')
    spec = importlib.util.spec_from_file_location('g01_r10_tier1', TIER1_SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.SEED = SEED
    module.TARGET_ORIGINS = TARGET_ORIGINS
    return module


def selected(module):
    seen = module.exposure()
    source = module.pq.read_table(module.PARQUET, columns=list(module.SOURCE_FIELDS)).to_pylist()
    if len({row['instance_id'] for row in source}) != len(source):
        raise ValueError('duplicate-source-id')
    by_origin = {origin: [] for origin in TARGET_ORIGINS}
    for row in source:
        if row['repo_url'] not in by_origin or row['instance_id'] in seen:
            continue
        if row['instance_id'] == KNOWN_INCOMPLETE_SOURCE_ID and not row['problem_statement']:
            continue
        expected_language = 'javascript' if row['repo_url'].endswith('/github-readme-stats.git') else 'python'
        if (row['language'] != expected_language or
                not all(isinstance(row[field], str) and row[field] for field in module.SOURCE_FIELDS) or
                not re.fullmatch(r'[0-9a-f]{40}', row['base_commit'])):
            raise ValueError('source-row-invalid')
        by_origin[row['repo_url']].append(row)
    rows = []
    for origin in TARGET_ORIGINS:
        candidates = sorted(by_origin[origin], key=lambda row:
                            (hashlib.sha256((SEED + '\0' + row['instance_id']).encode()).hexdigest(),
                             row['instance_id']))
        if len(candidates) < 3:
            raise ValueError('insufficient-origin-supply:' + origin)
        rows.extend(candidates[:3])
    if len({row['instance_id'] for row in rows}) != 24 or any(row['instance_id'] in seen for row in rows):
        raise ValueError('tier2-selection-invalid')
    return rows


def select(out):
    module = core()
    rows = selected(module)
    ids = {row['instance_id'] for row in rows}
    if ids & {row['instance_id'] for row in json.loads(TIER1_MANIFEST.read_text())['ordered_tasks']}:
        raise ValueError('tier-overlap')
    result = {'schema_version': 'are.g01-r10-new-origin-screen-manifest/v2',
              'status': 'source-only-frozen-for-evaluator-screen', 'seed': SEED,
              'target_origins': list(TARGET_ORIGINS), 'per_origin': 3,
              'source_fields': list(module.SOURCE_FIELDS),
              'source_parquet_sha256': module.PARQUET_SHA,
              'exposure_set_sha256': module.CURRENT_EXPOSURE_SHA,
              'r9_freeze_sha256': module.R9_FREEZE_SHA,
              'tier1_manifest_sha256': TIER1_MANIFEST_SHA,
              'tier1_eligibility_receipt_sha256': TIER1_RECEIPT_SHA,
              'excluded_incomplete_source_id': KNOWN_INCOMPLETE_SOURCE_ID,
              'ordered_tasks': rows, 'task_id_set_sha256': module.id_digest(ids),
              'selector_sha256': sha(Path(__file__)),
              'gold_values_or_paths_used': False, 'model_calls': 0,
              'claim_ceiling': 'Second score-blind evaluator-screen sample; no campaign freeze, score or superiority.',
              'open_questions': ['Which sampled tasks have mechanically clean exact-base labels?',
                                 'Can the combined clean supply meet 24 pairs with two per Git origin?']}
    module.save_new(out, result)
    print(json.dumps({'status': result['status'], 'tasks': len(ids),
                      'origins': len(TARGET_ORIGINS), 'manifest_sha256': sha(out),
                      'task_id_set_sha256': result['task_id_set_sha256']}))


def audit(manifest_path, out):
    module = core()
    manifest = json.loads(manifest_path.read_text())
    rows = selected(module)
    if (manifest.get('schema_version') != 'are.g01-r10-new-origin-screen-manifest/v2' or
            manifest.get('status') != 'source-only-frozen-for-evaluator-screen' or
            manifest.get('selector_sha256') != sha(Path(__file__)) or
            manifest.get('source_parquet_sha256') != module.PARQUET_SHA or
            manifest.get('exposure_set_sha256') != module.CURRENT_EXPOSURE_SHA or
            manifest.get('tier1_manifest_sha256') != TIER1_MANIFEST_SHA or
            manifest.get('tier1_eligibility_receipt_sha256') != TIER1_RECEIPT_SHA or
            manifest.get('excluded_incomplete_source_id') != KNOWN_INCOMPLETE_SOURCE_ID or
            manifest.get('ordered_tasks') != rows or
            manifest.get('task_id_set_sha256') != module.id_digest(row['instance_id'] for row in rows)):
        raise ValueError('tier2-manifest-drift')
    if sha(module.PRIOR_RULE) != module.PRIOR_RULE_SHA:
        raise ValueError('prior-rule-drift')
    rule = module.load_module(module.PRIOR_RULE, 'g01_r10_tier2_lineage_rule')
    sys.path.insert(0, str(module.UPSTREAM))
    from contextbench.parsers.gold import GoldLoader, _normalize_rel_path
    loader = GoldLoader(str(module.PARQUET))
    cache = {}
    stats = Counter()
    verdict_rows = []
    for row in rows:
        gold = loader.get(row['instance_id'])
        if gold is None or gold.commit != row['base_commit'] or gold._data['language'] != row['language']:
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
    result = {'schema_version': 'are.g01-r10-new-origin-gold-lineage-screen/v2',
              'status': 'evaluator-only-no-model-no-scores',
              'source_manifest_sha256': sha(manifest_path),
              'tier1_eligibility_receipt_sha256': TIER1_RECEIPT_SHA,
              'source_parquet_sha256': module.PARQUET_SHA,
              'exposure_set_sha256': module.CURRENT_EXPOSURE_SHA,
              'prior_rule_sha256': module.PRIOR_RULE_SHA,
              'script_sha256': sha(Path(__file__)),
              'source_fetch_counts': dict(sorted(stats.items())),
              'tasks': verdict_rows,
              'summary': {'tasks': len(verdict_rows),
                          'clean': sum(row['gold_lineage_clean'] for row in verdict_rows),
                          'clean_by_repo': dict(sorted(Counter(row['repo'] for row in verdict_rows if row['gold_lineage_clean']).items()))},
              'gold_paths_or_content_exported': False, 'model_calls': 0,
              'claim_ceiling': 'Mechanical exact-base label lineage only; not semantic correctness, runner eligibility, campaign freeze or quality.',
              'open_questions': ['Can combined clean supply support a diverse 24-task cohort and source-only preflight?']}
    module.save_new(out, result)
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
