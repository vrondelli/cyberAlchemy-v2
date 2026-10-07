#!/usr/bin/env python3
"""Evaluator-only positional gold-lineage screen for exact C/Go/JS caches."""

import argparse
import hashlib
import importlib.util
import json
import subprocess
import sys
from collections import Counter
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
UPSTREAM = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
CACHE_ROOT = Path('/opt/are-harness-benchmark/g01-r7-label-preflight-cgojs')
OUTPUT_ROOT = BASE / 'g01-r7-cgojs-gold-lineage-r1'
RULE_SCRIPT = BASE / 'g01-r7-label-preflight-tools-r1/audit-r7-rust-gold-lineage-r3.py'
EXPECTED_RULE_SHA = '0e5e46d69073674e15702265e53b97c03404c2f7da5a4ffe77284032fca8a177'
EXPECTED_CACHE_SCRIPT_SHA = 'c5f2f25c2729f0ff0f924a321f472b52cb6a76931034451193d1606d1ed6e1a4'
EXPECTED_GOLD_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
TARGETS = {'ponylang/ponyc': ('c', 31), 'cli/cli': ('go', 21), 'sveltejs/svelte': ('javascript', 43)}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def audit(repo):
    if sha(RULE_SCRIPT) != EXPECTED_RULE_SHA or sha(UPSTREAM / 'data/full.parquet') != EXPECTED_GOLD_SHA:
        raise ValueError('rule-or-gold-drift')
    spec = importlib.util.spec_from_file_location('g01_r7_positional_rule', RULE_SCRIPT)
    rule = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(rule)
    name = repo.replace('/', '--')
    receipt_path = CACHE_ROOT / (name + '-CACHE-RECEIPT.json')
    receipt = json.loads(receipt_path.read_text())
    language, count = TARGETS[repo]
    if (receipt['script_sha256'] != EXPECTED_CACHE_SCRIPT_SHA or
            receipt['repo'] != repo or len(receipt['tasks']) != count or
            receipt['posture'] != 'source-only-no-model-no-gold'):
        raise ValueError('source-cache-receipt-drift')
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader, _normalize_rel_path

    loader = GoldLoader(str(UPSTREAM / 'data/full.parquet'))
    rows = []
    for task in receipt['tasks']:
        cache = Path(task['cache'])
        commit = task['base_commit']
        tree = subprocess.check_output(['git', '-C', str(cache), 'rev-parse', commit + '^{tree}'],
                                       text=True, timeout=15).strip()
        if tree != task['tree'] or task['repo'] != repo:
            raise ValueError('cache-tree-drift')
        gold = loader.get(task['instance_id'])
        if gold is None or gold.commit != commit or not gold.files() or gold._data['language'] != language:
            raise ValueError('gold-identity-or-empty-drift')
        verdicts = [rule.classify(item, cache, commit, _normalize_rel_path) for item in gold.init + gold.add]
        rows.append({'instance_id': task['instance_id'], 'repo': repo,
                     'gold_lineage_clean': bool(verdicts) and all(v.startswith('verified-') for v in verdicts),
                     'annotation_count': len(verdicts), 'classification_counts': dict(Counter(verdicts))})
    return {'schema_version': 'are.g01-r7-cgojs-gold-lineage-eligibility/v1',
            'posture': 'evaluator-only-no-model-no-scores', 'repo': repo,
            'cache_receipt_sha256': sha(receipt_path), 'gold_parquet_sha256': EXPECTED_GOLD_SHA,
            'rule_script_sha256': EXPECTED_RULE_SHA, 'script_sha256': sha(Path(__file__)),
            'tasks': rows, 'summary': {'tasks': len(rows),
                                      'clean': sum(row['gold_lineage_clean'] for row in rows),
                                      'by_repo': {repo: {'total': len(rows),
                                                        'clean': sum(row['gold_lineage_clean'] for row in rows)}}},
            'gold_paths_or_content_exported': False,
            'claim_ceiling': 'Evaluator-only mechanical eligibility; not semantic certification, cohort freeze, or performance evidence.'}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--repo', required=True, choices=sorted(TARGETS))
    args = parser.parse_args()
    if not OUTPUT_ROOT.is_dir():
        raise ValueError('exact output root must exist')
    result = audit(args.repo)
    output = OUTPUT_ROOT / (args.repo.replace('/', '--') + '-GOLD-LINEAGE-ELIGIBILITY.json')
    with output.open('x') as stream:
        json.dump(result, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'summary': result['summary'], 'receipt_sha256': sha(output)}, sort_keys=True))


if __name__ == '__main__':
    main()
