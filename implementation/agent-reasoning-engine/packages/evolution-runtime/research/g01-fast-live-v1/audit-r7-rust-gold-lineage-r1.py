#!/usr/bin/env python3
"""Evaluator-only gold-to-base eligibility for the 12 untouched Rust tasks."""

import hashlib
import json
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
UPSTREAM = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
CACHE_RECEIPT = Path('/opt/are-harness-benchmark/g01-r7-label-preflight-rust/CACHE-RECEIPT.json')
ROOT = BASE / 'g01-r7-rust-gold-lineage-r1'
EXPECTED_CACHE_SHA = 'f7a807d094cf5291ee8bf63fa3a40903ac6c5c7b7f30dbaaa5e50fa1464b1625'
EXPECTED_GOLD_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def content_lines(content):
    if not isinstance(content, str) or not content:
        return None, None
    raw = content.splitlines()
    numbered = [re.match(r'^(\d+)\t(.*)$', line) for line in raw]
    if all(numbered):
        return [match.group(2) for match in numbered], [int(match.group(1)) for match in numbered]
    return raw, None


def classify(item, cache, commit, normalize):
    path = normalize(item.get('file', ''))
    if not path or path.startswith('/') or '..' in Path(path).parts or '\\' in path:
        return 'invalid-path'
    try:
        source = subprocess.check_output(['git', '-C', str(cache), 'show', f'{commit}:{path}'],
                                         timeout=30, stderr=subprocess.DEVNULL)
    except subprocess.CalledProcessError:
        return 'file-absent-from-base'
    lines = source.decode('utf8', errors='replace').splitlines()
    start, end = item.get('start_line'), item.get('end_line')
    if (type(start) is not int or type(end) is not int or
            not 1 <= start <= end or start > len(lines) or end > len(lines) + 1):
        return 'range-beyond-base'
    observed, numbers = content_lines(item.get('content'))
    if observed is None:
        return 'content-absent'
    expected = lines[start - 1:min(end, len(lines))]
    if end == len(lines) + 1 and observed and observed[-1] == '':
        observed = observed[:-1]
        if numbers is not None:
            numbers = numbers[:-1]
    if numbers is not None and numbers != list(range(start, start + len(observed))):
        return 'content-numbering-mismatch'
    if observed != expected:
        return 'content-source-mismatch'
    return 'verified-eof-sentinel' if end == len(lines) + 1 else 'verified'


def audit():
    if sha(CACHE_RECEIPT) != EXPECTED_CACHE_SHA or sha(UPSTREAM / 'data/full.parquet') != EXPECTED_GOLD_SHA:
        raise ValueError('cache-or-gold-drift')
    receipt = json.loads(CACHE_RECEIPT.read_text())
    if len(receipt['tasks']) != 12 or receipt['posture'] != 'source-only-no-model-no-gold':
        raise ValueError('cache-receipt-shape')
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader, _normalize_rel_path
    loader = GoldLoader(str(UPSTREAM / 'data/full.parquet'))
    rows = []
    for task in receipt['tasks']:
        cache = Path(task['cache'])
        commit = task['base_commit']
        tree = subprocess.check_output(['git', '-C', str(cache), 'rev-parse', commit + '^{tree}'],
                                       text=True, timeout=15).strip()
        if tree != task['tree']:
            raise ValueError('cache-tree-drift')
        gold = loader.get(task['instance_id'])
        if gold is None or gold.commit != commit or not gold.files():
            raise ValueError('gold-identity-or-empty-drift')
        verdicts = [classify(item, cache, commit, _normalize_rel_path) for item in gold.init + gold.add]
        counts = dict(Counter(verdicts))
        clean = bool(verdicts) and all(v.startswith('verified') for v in verdicts)
        rows.append({'instance_id': task['instance_id'], 'repo': task['repo'],
                     'gold_lineage_clean': clean, 'annotation_count': len(verdicts),
                     'classification_counts': counts})
    return {'schema_version': 'are.g01-r7-rust-gold-lineage-eligibility/v1',
            'posture': 'evaluator-only-no-model-no-scores', 'cache_receipt_sha256': EXPECTED_CACHE_SHA,
            'gold_parquet_sha256': EXPECTED_GOLD_SHA, 'script_sha256': sha(Path(__file__)),
            'tasks': rows, 'summary': {'tasks': len(rows), 'clean': sum(x['gold_lineage_clean'] for x in rows),
                                      'by_repo': {repo: {'total': sum(x['repo'] == repo for x in rows),
                                                        'clean': sum(x['repo'] == repo and x['gold_lineage_clean'] for x in rows)}
                                                  for repo in sorted({x['repo'] for x in rows})}},
            'gold_paths_or_content_exported': False,
            'claim_ceiling': 'Evaluator-only mechanical eligibility; not semantic label certification, cohort freeze, or performance evidence.'}


if __name__ == '__main__':
    if len(sys.argv) != 2 or sys.argv[1] != 'audit':
        raise SystemExit('usage: audit-r7-rust-gold-lineage-r1.py audit')
    result = audit()
    if not ROOT.is_dir():
        raise ValueError('exact output root must exist')
    output = ROOT / 'GOLD-LINEAGE-ELIGIBILITY.json'
    with output.open('x') as stream:
        json.dump(result, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'summary': result['summary'], 'receipt_sha256': sha(output)}, sort_keys=True))
