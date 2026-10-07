#!/usr/bin/env python3
"""Evaluator-only reference reachability of the sealed issue-priority index."""
from collections import Counter
import hashlib
import json
from pathlib import Path
import sys

BASE = Path('/opt/are/evolution-runtime')
ROOT = BASE / 'g02-r5-priority32-development-r1'
SEAL = ROOT / 'SOURCE-SEAL.json'
BASELINE = BASE / 'g02-r5-fresh-cohort-candidate-r1/INDEX-BUDGET-AUDIT.json'
PARQUET = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream/data/full.parquet'
UPSTREAM = PARQUET.parent.parent
OUTPUT = ROOT / 'EVALUATOR-RESULT.json'
SEAL_SHA = '5956ac21e23ea6187789f7e2867620b2eaa57508634cb8f490789e8f0d7f687d'
BASELINE_SHA = '137df8750a6e6f6e7f6a97b9442a0d8a29bca5aacf8c66a5bc99097f5d7ba78a'
PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(ok, reason):
    if not ok:
        raise ValueError('g02-r5-priority32-audit.' + reason)


def main():
    need(not OUTPUT.exists() and sha(SEAL) == SEAL_SHA and sha(BASELINE) == BASELINE_SHA
         and sha(PARQUET) == PARQUET_SHA, 'input-or-output-drift')
    sealed = json.loads(SEAL.read_text())
    baseline = json.loads(BASELINE.read_text())
    need(sealed['status'] == 'source-only-sealed-before-evaluator' and
         sealed['model_calls'] == 0 and sealed['gold_loaded'] is False and
         len(sealed['rows']) == len(baseline['rows']) == 24 and
         baseline['totals'] == {'gold_files': 172, 'gold_indexed': 162}, 'input-shape')
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader
    loader = GoldLoader(str(PARQUET))
    totals = Counter()
    rows = []
    for proposed, prior in zip(sealed['rows'], baseline['rows']):
        need(proposed['ordinal'] == prior['ordinal'] and proposed['repo'] == prior['repo']
             and proposed['indexed_bytes'] <= 32 * 1024 * 1024, 'row-binding')
        paths = proposed['indexed_paths']
        selected = set(paths)
        need(len(selected) == len(paths) and hashlib.sha256(
             ('\n'.join(sorted(selected)) + '\n').encode()).hexdigest() ==
             proposed['indexed_path_set_sha256'], 'path-seal')
        gold = set(loader.get(proposed['instance_id']).files())
        covered = len(gold & selected)
        need(len(gold) == prior['gold_files'], 'gold-denominator-drift')
        totals['gold_files'] += len(gold)
        totals['priority32_indexed'] += covered
        totals['baseline32_indexed'] += prior['gold_indexed']
        rows.append({'ordinal': proposed['ordinal'], 'repo': proposed['repo'],
                     'gold_files': len(gold), 'baseline32_indexed': prior['gold_indexed'],
                     'priority32_indexed': covered, 'delta': covered-prior['gold_indexed'],
                     'indexed_bytes': proposed['indexed_bytes'],
                     'priority_bytes': proposed['priority_bytes']})
    need(totals['gold_files'] == 172 and totals['baseline32_indexed'] == 162,
         'baseline-total-drift')
    result = {'schema_version': 'are.g02-r5-priority32-evaluator-result/v1',
              'status': 'evaluator-only-exposed-development',
              'source_seal_sha256': SEAL_SHA, 'baseline_audit_sha256': BASELINE_SHA,
              'parquet_sha256': PARQUET_SHA, 'script_sha256': sha(__file__),
              'totals': dict(totals), 'rows': rows,
              'model_calls': 0, 'gold_paths_or_content_exported': False,
              'claim_ceiling': 'Exposed source-index reachability only; no live agent acquisition, native score, cost, holdout or superiority',
              'open_questions': ['Does the change improve reference reachability without per-task regressions?',
                                 'Can an actual bounded index implement the ordering with safe memory and all-in cost?']}
    with OUTPUT.open('x') as stream:
        json.dump(result, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': result['status'], 'totals': dict(totals),
                      'delta': totals['priority32_indexed']-totals['baseline32_indexed'],
                      'improved_tasks': sum(row['delta'] > 0 for row in rows),
                      'regressed_tasks': sum(row['delta'] < 0 for row in rows),
                      'receipt_sha256': sha(OUTPUT)}, sort_keys=True))


if __name__ == '__main__':
    main()
