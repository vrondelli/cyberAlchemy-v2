#!/usr/bin/env python3
"""Complete the source-valid post-r10 new-origin screen for small origins."""

import argparse
from collections import Counter
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import sys

import pyarrow.parquet as pq


BASE = Path('/opt/are/evolution-runtime')
PRIOR_SCRIPT = BASE / 'g01-post-r10-new-origin-screen-r1/screen-g01-post-r10-origins-r1.py'
PRIOR_MANIFEST = BASE / 'g01-post-r10-new-origin-screen-r1/SOURCE-ONLY-MANIFEST.json'
PRIOR_RECEIPT = BASE / 'g01-post-r10-new-origin-screen-r1/GOLD-LINEAGE-ELIGIBILITY.json'
EXPECTED = {
    PRIOR_SCRIPT: '8b34c331bc9b89fb50cda6d71fdcf1a59f155ace9e68391d9cb6139c24d805e6',
    PRIOR_MANIFEST: '82111c24d205e34cd76196df008f6295ccaf71e88e7c9149d7ef834e11cfdcc8',
    PRIOR_RECEIPT: '5f0c5a045c8a42f982a35972f1475ea4c46c3bc46acc94705dcd61e8dd2542f3',
}
SEED = 'are-g01-post-r10-small-origins-all-source-valid-20261001'


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def load_prior():
    if any(sha(path) != expected for path, expected in EXPECTED.items()):
        raise ValueError('prior-tier-drift')
    receipt = json.loads(PRIOR_RECEIPT.read_text())
    if (receipt.get('status') != 'evaluator-only-no-model-no-scores' or
            receipt.get('source_manifest_sha256') != EXPECTED[PRIOR_MANIFEST] or
            receipt.get('summary', {}).get('tasks') != 49 or
            receipt.get('summary', {}).get('clean') != 0 or
            receipt.get('gold_paths_or_content_exported') is not False or
            receipt.get('model_calls') != 0):
        raise ValueError('prior-tier-receipt-shape')
    spec = importlib.util.spec_from_file_location('g01_prior_origin_screen', PRIOR_SCRIPT)
    prior = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(prior)
    rows, origins, exposure_sha, _, _ = prior.source_selection()
    manifest = json.loads(PRIOR_MANIFEST.read_text())
    if (rows != manifest['ordered_tasks'] or origins != manifest['target_origins'] or
            exposure_sha != manifest['exposure_set_sha256']):
        raise ValueError('prior-tier-source-replay')
    return prior, manifest


def source_selection():
    prior, manifest = load_prior()
    exposure = prior.module(prior.EXPOSURE_HELPER, 'small_origin_exposure')
    g01, g02 = exposure.manifest_paths(prior.BASE, prior.RUNS)
    probe = prior.BASE / 'g01-post-r8-large-index-probe-r2/CONFIG.json'
    if probe not in g01 or json.loads(probe.read_text()).get('model_calls') != 0:
        raise ValueError('zero-task-probe-drift')
    g01.remove(probe)
    seen = set()
    for branch, paths in (('g01', g01), ('g02', g02)):
        for path in paths:
            seen.update(exposure.ids_from_manifest(path, branch))
    seen.update(row['instance_id'] for row in json.loads(prior.R10_FREEZE.read_text())['ordered_tasks'])
    earlier_origins = set(manifest['target_origins'])
    for path in prior.PRIOR_SCREENS:
        value = json.loads(path.read_text())
        earlier_origins.update(value['target_origins'])
        seen.update(row['instance_id'] for row in value['ordered_tasks'])
    for receipt in prior.inputs():
        seen.update(row['instance_id'] for row in receipt['tasks'])
    seen.update(row['instance_id'] for row in manifest['ordered_tasks'])
    rows = pq.read_table(prior.PARQUET, columns=list(prior.SOURCE_FIELDS)).to_pylist()
    selected = [row for row in rows if row['instance_id'] not in seen and
                row['repo_url'] not in earlier_origins and
                all(isinstance(row[field], str) and row[field] for field in prior.SOURCE_FIELDS) and
                re.fullmatch(r'[0-9a-f]{40}', row['base_commit']) and
                re.fullmatch(r'https://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+\.git', row['repo_url'])]
    selected.sort(key=lambda row: (row['repo_url'],
                                   hashlib.sha256((SEED + '\0' + row['instance_id']).encode()).hexdigest(),
                                   row['instance_id']))
    origins = Counter(row['repo_url'] for row in selected)
    if len(selected) != 13 or len(origins) != 11 or max(origins.values()) > 2:
        raise ValueError('small-origin-source-supply-drift')
    return prior, selected, origins, prior.id_sha(seen)


def select(out):
    prior, rows, origins, exposed_sha = source_selection()
    result = {
        'schema_version': 'are.g01-post-r10-small-origin-screen/v1',
        'status': 'source-only-frozen-for-evaluator-screen', 'seed': SEED,
        'source_fields': list(prior.SOURCE_FIELDS), 'source_parquet_sha256': prior.EXPECTED[prior.PARQUET],
        'prior_manifest_sha256': EXPECTED[PRIOR_MANIFEST],
        'prior_eligibility_sha256': EXPECTED[PRIOR_RECEIPT],
        'exposure_set_sha256': exposed_sha, 'ordered_tasks': rows,
        'origin_counts': dict(sorted(origins.items())),
        'task_id_set_sha256': prior.id_sha(row['instance_id'] for row in rows),
        'selector_sha256': sha(Path(__file__)), 'gold_values_or_paths_used': False,
        'model_calls': 0,
        'claim_ceiling': 'Complete small-new-origin source screen only; no campaign freeze, score, or superiority.',
        'open_questions': ['Which tasks have mechanically clean exact-base labels?'],
    }
    prior.save_new(out, result)
    print(json.dumps({'status': result['status'], 'tasks': len(rows), 'origins': len(origins),
                      'manifest_sha256': sha(out)}))


def audit(manifest_path, out):
    prior, rows, origins, exposed_sha = source_selection()
    manifest = json.loads(manifest_path.read_text())
    if (manifest.get('schema_version') != 'are.g01-post-r10-small-origin-screen/v1' or
            manifest.get('status') != 'source-only-frozen-for-evaluator-screen' or
            manifest.get('seed') != SEED or manifest.get('ordered_tasks') != rows or
            manifest.get('origin_counts') != dict(sorted(origins.items())) or
            manifest.get('source_parquet_sha256') != prior.EXPECTED[prior.PARQUET] or
            manifest.get('prior_manifest_sha256') != EXPECTED[PRIOR_MANIFEST] or
            manifest.get('prior_eligibility_sha256') != EXPECTED[PRIOR_RECEIPT] or
            manifest.get('exposure_set_sha256') != exposed_sha or
            manifest.get('task_id_set_sha256') != prior.id_sha(row['instance_id'] for row in rows) or
            manifest.get('selector_sha256') != sha(Path(__file__))):
        raise ValueError('frozen-source-selection-drift')
    rule = prior.module(prior.LINEAGE_RULE, 'small_origin_lineage_rule')
    sys.path.insert(0, str(prior.UPSTREAM))
    from contextbench.parsers.gold import GoldLoader, _normalize_rel_path
    loader = GoldLoader(str(prior.PARQUET))
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
        'schema_version': 'are.g01-post-r10-small-origin-lineage/v1',
        'status': 'evaluator-only-no-model-no-scores',
        'source_manifest_sha256': sha(manifest_path),
        'source_parquet_sha256': prior.EXPECTED[prior.PARQUET],
        'exposure_set_sha256': exposed_sha,
        'prior_rule_sha256': prior.EXPECTED[prior.LINEAGE_RULE],
        'script_sha256': sha(Path(__file__)),
        'source_fetch_counts': dict(sorted(stats.items())), 'tasks': verdict_rows,
        'summary': {'tasks': len(verdict_rows),
                    'clean': sum(row['gold_lineage_clean'] for row in verdict_rows),
                    'clean_by_repo': dict(sorted(Counter(row['repo'] for row in verdict_rows
                                                        if row['gold_lineage_clean']).items()))},
        'gold_paths_or_content_exported': False, 'model_calls': 0,
        'claim_ceiling': 'Mechanical exact-base label lineage only; not semantic correctness, runner admission, campaign freeze, or superiority.',
        'open_questions': ['Does combined known-clean supply meet a valid diverse cohort cap?'],
    }
    prior.save_new(out, result)
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
