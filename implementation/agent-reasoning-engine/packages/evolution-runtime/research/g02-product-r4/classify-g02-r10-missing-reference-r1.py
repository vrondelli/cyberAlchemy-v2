#!/usr/bin/env python3
"""Classify r10 index-missed reference files without exporting their paths."""

from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path
import shutil
import stat
import subprocess
import sys


BASE = Path('/opt/are/evolution-runtime')
ROOT = BASE / 'g02-r10-dev-pool-r1'
CANDIDATE = ROOT / 'CANDIDATE.json'
CACHES = ROOT / 'TASK-CACHE-PREFLIGHT-R3.json'
REACHABILITY = ROOT / 'WORKTREE-INDEX-REACHABILITY.json'
OUTPUT = ROOT / 'MISSING-REFERENCE-CLASSIFICATION.json'
SCRATCH = Path('/tmp/are-g02-r10-missing-reference-r1')
CACHE_ROOT = Path('/tmp/are-g02-r10-task-caches-r3/cache')
UPSTREAM = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
PARQUET = UPSTREAM / 'data/full.parquet'
IMAGE = 'sha256:6406e582e89acd60a59294144bfb526aa9ee1687273a7e475b68906705426385'
PINS = {
    CANDIDATE: '1139a5877bcd686a63468bc75ff490963d4416313d1968ea64cc7dd43bc621dd',
    CACHES: '6b45df00666864ecd32bda22eb3312ef3ff64514fc0bafe1bcc766cb0cba04ad',
    REACHABILITY: '5dd0be24c5e7c2ba3a0b8af67126d2998755b77ed935fdbb419ac69768af196d',
    PARQUET: '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8',
}
PER_FILE = 1024**2
BUDGET = 64 * 1024**2


def sha(path):
    digest = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g02-r10-missing-reference.' + reason)


def run(*args):
    return subprocess.run(args, capture_output=True, text=True, timeout=300)


def classify_index(work):
    listing = subprocess.run(['git', '-C', str(work), 'ls-files', '-z'],
                             capture_output=True, timeout=60)
    need(listing.returncode == 0, 'git-ls-files')
    tracked = [part.decode('utf-8', 'surrogateescape')
               for part in listing.stdout.split(b'\0') if part]
    tracked.sort()
    selected, omissions = set(), {}
    used = 0
    for name in tracked:
        path = work / name
        try:
            info = path.stat()
            if not stat.S_ISREG(info.st_mode):
                omissions[name] = 'nonregular'
                continue
        except OSError:
            omissions[name] = 'stat-failed'
            continue
        if info.st_size > PER_FILE:
            omissions[name] = 'per-file-size-cap'
            continue
        if used + info.st_size > BUDGET:
            omissions[name] = 'aggregate-budget'
            continue
        data = path.read_bytes()
        if b'\0' in data[:8192]:
            omissions[name] = 'binary'
            continue
        used += len(data)
        selected.add(name)
    return selected, set(tracked), omissions, used


def main():
    need(not OUTPUT.exists() and not SCRATCH.exists() and
         all(path.is_file() and sha(path) == digest for path, digest in PINS.items()) and
         CACHE_ROOT.is_dir() and shutil.disk_usage('/tmp').free >= 2 * 1024**3,
         'input-output-or-storage-boundary')
    tasks = json.loads(CANDIDATE.read_text())['ordered_tasks']
    caches = json.loads(CACHES.read_text())['results']
    reached = json.loads(REACHABILITY.read_text())['rows']
    need(len(tasks) == len(caches) == len(reached) == 24, 'denominator')
    targets = [(task, cache, report) for task, cache, report in zip(tasks, caches, reached)
               if report['gold_not_indexed'] > 0]
    need(len(targets) == 4 and sum(report['gold_not_indexed'] for _, _, report in targets) == 4,
         'four-missing-reference-boundary')
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader
    loader = GoldLoader(str(PARQUET))
    SCRATCH.mkdir(mode=0o700)
    rows = []
    for task, cache, report in targets:
        ordinal, commit, leaf = task['ordinal'], task['base_commit'], cache['cache_leaf']
        need(cache['ordinal'] == report['ordinal'] == ordinal and
             cache['base_commit'] == commit and
             cache['cache_path'] == str(CACHE_ROOT / leaf) and
             shutil.disk_usage('/tmp').free >= 2 * 1024**3,
             'target-binding:' + str(ordinal))
        work = SCRATCH / 'work'
        need(not work.exists(), 'scratch-collision')
        script = ('git init -q /out/work && git -C /out/work fetch -q /cache/' +
                  leaf + ' ' + commit + ' && git -C /out/work checkout -q --detach ' + commit)
        checkout = run('docker', 'run', '--rm', '--network', 'none', '--memory', '1g',
                       '--cpus', '1', '-v', str(CACHE_ROOT) + ':/cache:ro',
                       '-v', str(SCRATCH) + ':/out', IMAGE, 'sh', '-c', script)
        need(checkout.returncode == 0, 'offline-checkout:' + str(ordinal) +
             ':' + checkout.stderr[-200:])
        selected, tracked, omissions, used = classify_index(work)
        need(len(selected) == report['indexed_count'] and used == report['indexed_bytes'],
             'index-reconstruction:' + str(ordinal))
        gold = set(loader.get(task['instance_id']).files())
        missing = gold - selected
        need(len(gold) == report['gold_files'] and len(missing) == report['gold_not_indexed'],
             'gold-count-binding:' + str(ordinal))
        reasons = Counter()
        for name in missing:
            reasons[omissions.get(name, 'not-in-base' if name not in tracked else
                                   'unclassified')] += 1
        need(sum(reasons.values()) == len(missing) and 'unclassified' not in reasons,
             'classification-incomplete:' + str(ordinal))
        row = {'ordinal': ordinal, 'repo': task['repo'],
               'gold_files': len(gold), 'gold_not_indexed': len(missing),
               'reasons': dict(sorted(reasons.items()))}
        rows.append(row)
        print(json.dumps(row, sort_keys=True), flush=True)
        shutil.rmtree(work)
    totals = Counter()
    for row in rows:
        totals.update(row['reasons'])
    payload = {
        'schema_version': 'are.g02-r10-missing-reference-classification/v1',
        'status': 'classified-four-index-missed-references',
        'posture': 'evaluator-only-counts-no-reference-path-export-no-model-no-score',
        'source_sha256': {str(path): digest for path, digest in PINS.items()},
        'script_sha256': sha(__file__), 'target_count': len(rows),
        'missing_reference_count': sum(totals.values()),
        'reasons': dict(sorted(totals.items())), 'rows': rows, 'model_calls': 0,
        'claim_ceiling': 'Development-only omission mechanism; not a performance fix, scored result, or superiority.',
        'open_questions': [
            'Can a source-only index policy improve reachable relevant evidence within the unchanged budget?',
            'Does a prospectively frozen full mixed-source campaign improve both native F1 metrics and efficiency?',
        ],
    }
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': payload['status'], 'sha256': sha(OUTPUT),
                      'reasons': payload['reasons']}, sort_keys=True))


if __name__ == '__main__':
    main()
