#!/usr/bin/env python3
"""Classify r11 index-missed references without exporting gold paths."""

from collections import Counter
import hashlib
import json
from pathlib import Path
import subprocess
import sys


BASE = Path('/opt/are/evolution-runtime')
ROOT = BASE / 'g02-r11-dev-pool-r1'
CANDIDATE = ROOT / 'CANDIDATE.json'
CACHES = ROOT / 'TASK-CACHE-CLONE-PREFLIGHT-R1.json'
REACHABILITY = ROOT / 'WORKTREE-INDEX-REACHABILITY-R1.json'
OUTPUT = ROOT / 'BASE-REFERENCE-CLASSIFICATION-R1.json'
UPSTREAM = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
PARQUET = UPSTREAM / 'data/full.parquet'
PINS = {
    CANDIDATE: '6150685f909ba7ee2d83154375e5599511620aae3a9c820e1178c29c1e7c8b42',
    CACHES: '42c3388b27fb22f59ff1acfa41d4d2fb6b0df6ab41a536e16d10b82f1fb85620',
    REACHABILITY: 'cc844396e78ed89eb7d0642a72268c84319a34ceae8612f5e3c2a4eef96bd94b',
    PARQUET: '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8',
}


def sha(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def need(ok, reason):
    if not ok:
        raise ValueError('g02-r11-base-reference.' + reason)


def main():
    need(not OUTPUT.exists() and all(path.is_file() and sha(path) == digest
         for path, digest in PINS.items()), 'input-output-drift')
    tasks = json.loads(CANDIDATE.read_text())['ordered_tasks']
    caches = json.loads(CACHES.read_text())['results']
    reach = json.loads(REACHABILITY.read_text())
    reports = reach['rows']
    need(len(tasks) == len(caches) == len(reports) == 24 and
         reach['totals']['gold_not_indexed'] == 3 and
         reach['reachability_valid'] is True, 'denominator-or-reachability')
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader
    loader = GoldLoader(str(PARQUET))
    rows = []
    reasons = Counter()
    for task, cache, report in zip(tasks, caches, reports):
        if report['gold_not_indexed'] == 0:
            continue
        ordinal = task['ordinal']
        need(ordinal == cache['ordinal'] == report['ordinal'] and
             task['instance_id'] == cache['instance_id'] and
             task['base_commit'] == cache['base_commit'] and
             cache['cache_path'] == '/tmp/are-g02-r11-task-caches-r1/cache/' +
             cache['cache_leaf'], 'target-binding:' + str(ordinal))
        listing = subprocess.run(['git', '-C', cache['cache_path'], 'ls-tree',
                                  '-r', '--name-only', '-z', task['base_commit']],
                                 capture_output=True, timeout=90)
        need(listing.returncode == 0, 'exact-base-tree:' + str(ordinal))
        tracked = {part.decode('utf-8', 'surrogateescape')
                   for part in listing.stdout.split(b'\0') if part}
        gold = set(loader.get(task['instance_id']).files())
        absent = len(gold - tracked)
        residual = report['gold_not_indexed'] - absent
        need(len(gold) == report['gold_files'] and
             0 <= absent <= report['gold_not_indexed'] and residual >= 0,
             'count-binding:' + str(ordinal))
        row = {'ordinal': ordinal, 'repo': task['repo'],
               'gold_files': len(gold), 'gold_not_indexed': report['gold_not_indexed'],
               'not_in_exact_base': absent,
               'base_present_but_not_indexed': residual}
        rows.append(row)
        reasons['not-in-base'] += absent
        reasons['base-present-not-indexed'] += residual
        print(json.dumps(row, sort_keys=True), flush=True)
    need(len(rows) == 2 and sum(reasons.values()) == 3,
         'classified-target-count')
    payload = {
        'schema_version': 'are.g02-r11-base-reference-classification/v1',
        'status': 'classified-three-index-missed-references',
        'posture': 'evaluator-only-counts-no-reference-path-export-no-model-no-score',
        'source_sha256': {str(path): digest for path, digest in PINS.items()},
        'script_sha256': sha(__file__), 'target_count': len(rows),
        'missing_reference_count': sum(reasons.values()),
        'reasons': dict(sorted(reasons.items())), 'rows': rows,
        'model_calls': 0,
        'claim_ceiling': 'Development-only base-presence classification; not agent acquisition, a scored result, or superiority.',
        'open_questions': ['Will the live agent select available relevant files?',
                           'Does the future matched campaign clear all quality and efficiency gates?'],
    }
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': payload['status'], 'sha256': sha(OUTPUT),
                      'reasons': payload['reasons']}, sort_keys=True))


if __name__ == '__main__':
    main()
