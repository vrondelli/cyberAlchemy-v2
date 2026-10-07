#!/usr/bin/env python3
"""Evaluator-only r10 native-reference reachability in exact checked-out trees."""

from collections import Counter
import hashlib
import json
import os
from pathlib import Path
import shutil
import stat
import subprocess
import sys


BASE = Path('/opt/are/evolution-runtime')
CANDIDATE = BASE / 'g02-r10-dev-pool-r1/CANDIDATE.json'
CACHES = BASE / 'g02-r10-dev-pool-r1/TASK-CACHE-PREFLIGHT-R3.json'
SOURCE = BASE / 'g02-r10-dev-pool-r1/SOURCE-INDEX-PREFLIGHT.json'
OUTPUT = BASE / 'g02-r10-dev-pool-r1/WORKTREE-INDEX-REACHABILITY.json'
SCRATCH = Path('/tmp/are-g02-r10-evaluator-worktree-r1')
CACHE_ROOT = Path('/tmp/are-g02-r10-task-caches-r3/cache')
UPSTREAM = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
PARQUET = UPSTREAM / 'data/full.parquet'
INDEX = Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr4-own-expansions-preflight-r1/code/base-overlay.mjs')
IMAGE = 'sha256:6406e582e89acd60a59294144bfb526aa9ee1687273a7e475b68906705426385'
PINS = {
    CANDIDATE: '1139a5877bcd686a63468bc75ff490963d4416313d1968ea64cc7dd43bc621dd',
    CACHES: '6b45df00666864ecd32bda22eb3312ef3ff64514fc0bafe1bcc766cb0cba04ad',
    SOURCE: '5bab09f2e8637ed010dc53e2a0ce2d25d60b88b83beffdea32c35c90131f3a41',
    PARQUET: '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8',
    INDEX: '1389c7a3fbdc096463787614778c4b9087104ef252c54659d542c68874e91c89',
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
        raise ValueError('g02-r10-reference-reachability.' + reason)


def run(*args, timeout=300):
    return subprocess.run(args, capture_output=True, text=True, timeout=timeout)


def indexed_paths(work):
    listing = subprocess.run(['git', '-C', str(work), 'ls-files', '-z'],
                             capture_output=True, timeout=60)
    need(listing.returncode == 0, 'git-ls-files')
    paths = [part.decode('utf-8', 'surrogateescape')
             for part in listing.stdout.split(b'\0') if part]
    paths.sort()
    selected = set()
    indexed_bytes = 0
    omitted = Counter()
    for name in paths:
        path = work / name
        try:
            info = path.stat()
            if not stat.S_ISREG(info.st_mode):
                omitted['non_file'] += 1
                continue
        except OSError:
            omitted['stat_failed'] += 1
            continue
        if info.st_size > PER_FILE or indexed_bytes + info.st_size > BUDGET:
            omitted['size_or_budget'] += 1
            continue
        data = path.read_bytes()
        if b'\0' in data[:8192]:
            omitted['binary'] += 1
            continue
        indexed_bytes += len(data)
        selected.add(name)
    return selected, indexed_bytes, len(paths), omitted


def main():
    need(not OUTPUT.exists() and not SCRATCH.exists() and
         all(path.is_file() and sha(path) == digest for path, digest in PINS.items()) and
         CACHE_ROOT.is_dir() and shutil.disk_usage('/tmp').free >= 2 * 1024**3,
         'input-output-or-storage-boundary')
    tasks = json.loads(CANDIDATE.read_text())['ordered_tasks']
    cache_rows = json.loads(CACHES.read_text())['results']
    source = json.loads(SOURCE.read_text())['rows']
    need(len(tasks) == len(cache_rows) == len(source) == 24, 'denominator')
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader
    loader = GoldLoader(str(PARQUET))
    SCRATCH.mkdir(mode=0o700)
    journal = SCRATCH / 'JOURNAL.jsonl'
    rows = []
    totals = Counter()
    for task, cache, actual in zip(tasks, cache_rows, source):
        ordinal, commit = task['ordinal'], task['base_commit']
        leaf = cache['cache_leaf']
        need(ordinal == cache['ordinal'] == actual['ordinal'] == len(rows) + 1 and
             task['instance_id'] == cache['instance_id'] == actual['instance_id'] and
             cache['base_commit'] == actual['base_commit'] == commit and
             cache['cache_path'] == str(CACHE_ROOT / leaf) and
             shutil.disk_usage('/tmp').free >= 2 * 1024**3,
             'cache-or-storage-binding:' + str(ordinal))
        work = SCRATCH / 'work'
        need(not work.exists(), 'scratch-collision:' + str(ordinal))
        script = ('git init -q /out/work && git -C /out/work fetch -q /cache/' +
                  leaf + ' ' + commit + ' && git -C /out/work checkout -q --detach ' + commit)
        checkout = run('docker', 'run', '--rm', '--network', 'none', '--memory', '1g',
                       '--cpus', '1', '-v', str(CACHE_ROOT) + ':/cache:ro',
                       '-v', str(SCRATCH) + ':/out', IMAGE, 'sh', '-c', script)
        need(checkout.returncode == 0, 'offline-checkout:' + str(ordinal) +
             ':' + checkout.stderr[-250:])
        head = run('git', '-C', str(work), 'rev-parse', 'HEAD')
        need(head.returncode == 0 and head.stdout.strip() == commit,
             'checkout-head:' + str(ordinal))
        indexed, used, tracked, omitted = indexed_paths(work)
        agreement = (len(indexed) == actual['index']['indexed_files'] and
                     used == actual['index']['indexed_bytes'])
        gold = set(loader.get(task['instance_id']).files())
        need(bool(gold), 'empty-native-gold:' + str(ordinal))
        present = len(indexed & gold)
        totals['gold_files'] += len(gold)
        totals['gold_indexed'] += present
        totals['gold_not_indexed'] += len(gold) - present
        totals['index_total_agreements'] += agreement
        row = {'ordinal': ordinal, 'repo': task['repo'], 'source': task['source'],
               'gold_files': len(gold), 'gold_indexed': present,
               'gold_not_indexed': len(gold) - present,
               'tracked_count': tracked, 'indexed_count': len(indexed),
               'indexed_bytes': used,
               'actual_index_count': actual['index']['indexed_files'],
               'actual_index_bytes': actual['index']['indexed_bytes'],
               'index_total_agreement': agreement,
               'other_omissions': dict(sorted(omitted.items()))}
        with journal.open('a') as stream:
            stream.write(json.dumps(row, sort_keys=True) + '\n')
            stream.flush()
            os.fsync(stream.fileno())
        rows.append(row)
        print(json.dumps({'ordinal': ordinal, 'agreement': agreement,
                          'gold_indexed': present, 'gold_files': len(gold)}),
              flush=True)
        shutil.rmtree(work)
    payload = {
        'schema_version': 'are.g02-r10-worktree-index-reachability/v1',
        'status': 'audited',
        'posture': 'evaluator-only-no-gold-path-export-no-model-no-score',
        'candidate_sha256': PINS[CANDIDATE],
        'task_cache_receipt_sha256': PINS[CACHES],
        'source_preflight_sha256': PINS[SOURCE],
        'parquet_sha256': PINS[PARQUET], 'index_source_sha256': PINS[INDEX],
        'script_sha256': sha(__file__), 'journal_sha256': sha(journal),
        'task_count': len(rows), 'totals': dict(totals), 'rows': rows,
        'reachability_valid': totals['index_total_agreements'] == 24,
        'model_calls': 0,
        'claim_ceiling': 'Evaluator-only reference reachability, not agent acquisition, native score, paired result, or superiority.',
        'open_questions': [
            'Will the live agent acquire and select reachable references?',
            'Can the complete mixed-source driver pass no-model preflight?',
        ],
    }
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': 'audited', 'sha256': sha(OUTPUT),
                      'totals': payload['totals'],
                      'reachability_valid': payload['reachability_valid']},
                     sort_keys=True))


if __name__ == '__main__':
    main()
