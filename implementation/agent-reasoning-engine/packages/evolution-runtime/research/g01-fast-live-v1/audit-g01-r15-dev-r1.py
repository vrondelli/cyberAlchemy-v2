#!/usr/bin/env python3
"""Evaluator-only exact-base label lineage audit for sealed G01 r15 screen."""

from collections import Counter
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sys

import pyarrow.parquet as pq


BASE = Path('/opt/are/evolution-runtime')
UPSTREAM = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
PARQUET = UPSTREAM / 'data/full.parquet'
MANIFEST = BASE / 'g01-r15-dev-screen-r1/SOURCE-ONLY-MANIFEST.json'
RESULT = BASE / 'g01-r15-dev-screen-r1/GOLD-LINEAGE-ELIGIBILITY.json'
ACCEPTANCE = BASE / 'g01-r14-dev-cap-r1/acceptance.json'
RULE = BASE / 'g01-cpp-gold-lineage-http-r1/audit-cpp-gold-lineage-http-r1.py'
PINS = {
    PARQUET: '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8',
    MANIFEST: '5901c25e4ad341689df104260a24974035a61c217db8aca7d081adcf792ce60a',
    ACCEPTANCE: 'fc305d5e220dc73dc3f98b06ae9c8aa71c10b1f3adf9e9a52c72ee4e302b8171',
    RULE: '485a699e766f2c434ecf50109a0e7401facf700aee757e2443dacb856c7d584b',
}
SOURCE_FIELDS = ('instance_id', 'original_inst_id', 'repo', 'repo_url',
                 'language', 'base_commit', 'problem_statement', 'source')


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def main():
    if RESULT.exists():
        raise ValueError('fresh-exact-output-required')
    for path, expected in PINS.items():
        if sha(path) != expected:
            raise ValueError('pinned-input-drift:' + str(path))
    manifest = json.loads(MANIFEST.read_text())
    acceptance = json.loads(ACCEPTANCE.read_text())
    dev = set(acceptance['scope']['development_instances'])
    reserve = set(acceptance['scope']['reserved_confirmation_instances'])
    rows = manifest['ordered_tasks']
    ids = [row['instance_id'] for row in rows]
    if (manifest['schema_version'] != 'are.g01-r15-dev-source-screen-manifest/v1' or
            manifest['status'] != 'source-only-frozen-for-evaluator-screen' or
            manifest['gold_values_or_paths_used'] is not False or
            manifest['model_calls'] != 0 or len(rows) != 32 or
            len(set(ids)) != 32 or not set(ids) <= dev or set(ids) & reserve or
            len(dev) != 903 or len(reserve) != 233 or dev & reserve):
        raise ValueError('manifest-or-partition-drift')
    origin_counts = Counter(row['repo_url'] for row in rows)
    if origin_counts != {origin: quota for origin, quota in manifest['target_origins_and_quotas']}:
        raise ValueError('origin-quota-drift')
    source = {row['instance_id']: row for row in
              pq.read_table(PARQUET, columns=list(SOURCE_FIELDS)).to_pylist()}
    if any(source.get(row['instance_id']) != row for row in rows):
        raise ValueError('source-row-drift')

    spec = importlib.util.spec_from_file_location('g01_r15_lineage_rule', RULE)
    rule = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(rule)
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
            content = rule.fetch_source(source_repo, row['base_commit'], path, cache, stats)
            verdicts.append(rule.classify(item, content, _normalize_rel_path))
        verdict_rows.append({
            'instance_id': row['instance_id'], 'repo': row['repo'],
            'language': row['language'],
            'gold_lineage_clean': bool(verdicts) and all(v.startswith('verified-') for v in verdicts),
            'annotation_count': len(verdicts),
            'classification_counts': dict(sorted(Counter(verdicts).items())),
        })
    summary = {'tasks': len(verdict_rows),
               'clean': sum(row['gold_lineage_clean'] for row in verdict_rows),
               'clean_by_repo': dict(sorted(Counter(row['repo'] for row in verdict_rows
                                                    if row['gold_lineage_clean']).items()))}
    result = {
        'schema_version': 'are.g01-r15-dev-source-gold-lineage-screen/v1',
        'status': 'evaluator-only-no-model-no-scores',
        'source_manifest_sha256': PINS[MANIFEST],
        'source_parquet_sha256': PINS[PARQUET],
        'acceptance_sha256': PINS[ACCEPTANCE],
        'prior_rule_sha256': PINS[RULE],
        'script_sha256': sha(Path(__file__)),
        'source_fetch_counts': dict(sorted(stats.items())),
        'tasks': verdict_rows, 'summary': summary,
        'gold_paths_or_content_exported': False, 'model_calls': 0,
        'claim_ceiling': 'Mechanical exact-base lineage in changed-cap development pool only; no native score or superiority',
        'open_questions': [
            'Does the clean post-r14 development pool reach 24 slots under the declared cap eight?',
            'Can a score-blind fresh cohort pass cache, index, native-reference and storage admission?'],
    }
    fd = os.open(RESULT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(result, sort_keys=True, indent=2) + '\n').encode())
    print(json.dumps({'status': result['status'], 'summary': summary,
                      'source_fetch_counts': result['source_fetch_counts'],
                      'receipt_sha256': sha(RESULT)}, sort_keys=True))


if __name__ == '__main__':
    main()
