#!/usr/bin/env python3
"""Evaluator-only exact-base lineage check for sealed G01 r16 source draw."""

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
MANIFEST = BASE / 'g01-r16-dev-screen-r1/SOURCE-ONLY-MANIFEST.json'
OUT = BASE / 'g01-r16-dev-screen-r1/GOLD-LINEAGE-ELIGIBILITY.json'
ACCEPTANCE = BASE / 'g01-r14-dev-cap-r1/acceptance.json'
RULE = BASE / 'g01-cpp-gold-lineage-http-r1/audit-cpp-gold-lineage-http-r1.py'
PINS = {
    PARQUET: '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8',
    MANIFEST: '6f969430e052295d9bf495078589a39379518bb7747a6c8ac9beee00556e446d',
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
    if OUT.exists():
        raise ValueError('fresh-exact-output-required')
    for path, expected in PINS.items():
        if sha(path) != expected:
            raise ValueError('pinned-input-drift:' + str(path))
    manifest = json.loads(MANIFEST.read_text())
    acceptance = json.loads(ACCEPTANCE.read_text())
    development = set(acceptance['scope']['development_instances'])
    reserved = set(acceptance['scope']['reserved_confirmation_instances'])
    rows = manifest['ordered_tasks']
    ids = [row['instance_id'] for row in rows]
    if (manifest['schema_version'] != 'are.g01-r16-source-screen-manifest/v1' or
            manifest['status'] != 'source-only-frozen-for-evaluator-screen' or
            manifest['gold_values_or_paths_used'] is not False or
            manifest['model_calls'] != 0 or len(rows) != 99 or len(set(ids)) != 99 or
            not set(ids) <= development or set(ids) & reserved or
            len(development) != 903 or len(reserved) != 233 or development & reserved):
        raise ValueError('manifest-or-partition-drift')
    source = {row['instance_id']: row for row in
              pq.read_table(PARQUET, columns=list(SOURCE_FIELDS)).to_pylist()}
    if any(source.get(row['instance_id']) != row or row['language'] != 'python' for row in rows):
        raise ValueError('source-row-drift')
    spec = importlib.util.spec_from_file_location('g01_r16_lineage_rule', RULE)
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
        'schema_version': 'are.g01-r16-source-gold-lineage-screen/v1',
        'status': 'evaluator-only-no-model-no-scores',
        'source_manifest_sha256': PINS[MANIFEST],
        'source_parquet_sha256': PINS[PARQUET],
        'acceptance_sha256': PINS[ACCEPTANCE],
        'prior_rule_sha256': PINS[RULE],
        'script_sha256': sha(Path(__file__)),
        'source_fetch_counts': dict(sorted(stats.items())),
        'tasks': verdict_rows, 'summary': summary,
        'gold_paths_or_content_exported': False, 'model_calls': 0,
        'claim_ceiling': 'Mechanical exact-base lineage only; no native score, complete cohort admission or superiority',
        'open_questions': [
            'Can a separate score-blind candidate reach 24 tasks under a declared origin cap?',
            'Will exact caches, indexes, native references, and matched live pairs pass on that candidate?'],
    }
    fd = os.open(OUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(result, sort_keys=True, indent=2) + '\n').encode())
    print(json.dumps({'status': result['status'], 'summary': summary,
                      'source_fetch_counts': result['source_fetch_counts'],
                      'receipt_sha256': sha(OUT)}, sort_keys=True))


if __name__ == '__main__':
    main()
