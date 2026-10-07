#!/usr/bin/env python3
"""Evaluator-only reference reachability using actual checked-out worktree bytes."""

import hashlib
import json
import os
import shutil
import stat
import subprocess
import sys
from collections import Counter
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
ROOT = BASE / 'g02-r7-screening-pool-r1'
CANDIDATE = ROOT / 'CANDIDATE.json'
HYDRATION = ROOT / 'TASK-CACHE-HYDRATION.json'
SOURCE_PREFLIGHT = ROOT / 'SOURCE-INDEX-PREFLIGHT.json'
FAILED_SIMULATION = ROOT / 'INDEX-REACHABILITY.json'
OUTPUT = ROOT / 'WORKTREE-INDEX-REACHABILITY-R2.json'
SCRATCH = Path('/tmp/are-g02-r7-evaluator-worktree-r2')
CACHE = Path('/tmp/are-g02-r7-source-caches-r1/cache')
UPSTREAM = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
PARQUET = UPSTREAM / 'data/full.parquet'
INDEX = Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr4-own-expansions-preflight-r1/code/base-overlay.mjs')
CANDIDATE_SHA = '6ddfcd55f1a05f87ea4bcbe44ac3b0a7246ade41689b9195d33be2f6e8c8708d'
HYDRATION_SHA = '8c3c351d131c266b758d72d44010fa3a66da5d7b6e86c261c54af194387e8f2e'
SOURCE_SHA = 'fc9b73cad1c55dd14d15f59ccbda6fe3abb8e5d6fa3a3047d5606151f6856399'
FAILED_SIMULATION_SHA = '03a4bec7196445c55c3b3d48208332fe7678b194598608552344fa5119dc528c'
PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
INDEX_SHA = '1389c7a3fbdc096463787614778c4b9087104ef252c54659d542c68874e91c89'
IMAGE = 'sha256:6406e582e89acd60a59294144bfb526aa9ee1687273a7e475b68906705426385'
PER_FILE = 1024 * 1024
BUDGET = 64 * 1024 * 1024


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def run(*args, timeout=300):
    return subprocess.run(args, capture_output=True, text=True, timeout=timeout)


def need(value, reason):
    if not value:
        raise ValueError('g02-r7-worktree-reachability-r2.' + reason)


def indexed_paths(work):
    listing = subprocess.run(['git', '-C', str(work), 'ls-files', '-z'],
                             capture_output=True)
    need(listing.returncode == 0, 'git-ls-files')
    paths = [part.decode('utf-8', 'surrogateescape')
             for part in listing.stdout.split(b'\0') if part]
    # Python's Unicode order agrees with JavaScript Array.sort for the selected
    # paths only if count/byte totals also match the executed Node preflight.
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
         sha(CANDIDATE) == CANDIDATE_SHA and sha(HYDRATION) == HYDRATION_SHA and
         sha(SOURCE_PREFLIGHT) == SOURCE_SHA and
         sha(FAILED_SIMULATION) == FAILED_SIMULATION_SHA and
         sha(PARQUET) == PARQUET_SHA and sha(INDEX) == INDEX_SHA,
         'input-or-output-drift')
    tasks = json.loads(CANDIDATE.read_text())['ordered_tasks']
    ready = {r['ordinal']: r for r in json.loads(HYDRATION.read_text())['results']}
    actual = {r['ordinal']: r['index'] for r in
              json.loads(SOURCE_PREFLIGHT.read_text())['results']}
    need(len(tasks) == len(ready) == len(actual) == 24, 'denominator')
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader
    loader = GoldLoader(str(PARQUET))
    SCRATCH.mkdir(mode=0o700)
    rows = []
    totals = Counter()
    for task in tasks:
        ordinal = task['ordinal']
        leaf = ready[ordinal]['cache_leaf']
        commit = task['base_commit']
        need(ready[ordinal]['base_commit'] == commit and
             ready[ordinal]['cache_path'] == str(CACHE / leaf),
             'cache-binding:' + str(ordinal))
        need(shutil.disk_usage('/tmp').free >= 2 * 1024**3,
             'scratch-reserve:' + str(ordinal))
        work = SCRATCH / 'work'
        need(not work.exists(), 'work-collision')
        command = ('git clone --no-local --no-checkout /cache/' + leaf +
                   ' /out/work && git -C /out/work checkout --detach ' + commit)
        cloned = run('docker', 'run', '--rm', '--network', 'none', '--memory', '1g',
                     '--cpus', '1', '-v', str(CACHE) + ':/cache:ro',
                     '-v', str(SCRATCH) + ':/out', IMAGE, 'sh', '-c', command)
        need(cloned.returncode == 0, 'offline-checkout:' + str(ordinal) +
             ':' + cloned.stderr[-300:])
        indexed, used, tracked, omitted = indexed_paths(work)
        agreement = len(indexed) == actual[ordinal]['indexed_files'] and \
            used == actual[ordinal]['indexed_bytes']
        gold = set(loader.get(task['instance_id']).files())
        need(bool(gold), 'empty-gold:' + str(ordinal))
        present = len(indexed & gold)
        totals['gold_files'] += len(gold)
        totals['gold_indexed'] += present
        totals['gold_not_indexed'] += len(gold) - present
        totals['index_total_agreements'] += agreement
        rows.append({'ordinal': ordinal, 'repo': task['repo'],
                     'source': task['source'], 'gold_files': len(gold),
                     'gold_indexed': present, 'gold_not_indexed': len(gold)-present,
                     'tracked_count': tracked, 'indexed_count': len(indexed),
                     'indexed_bytes': used, 'actual_index_count': actual[ordinal]['indexed_files'],
                     'actual_index_bytes': actual[ordinal]['indexed_bytes'],
                     'index_total_agreement': agreement,
                     'other_omissions': dict(sorted(omitted.items()))})
        shutil.rmtree(work)
        print(json.dumps({'ordinal': ordinal, 'index_total_agreement': agreement,
                          'gold_indexed': present, 'gold_files': len(gold)}), flush=True)
    SCRATCH.rmdir()
    payload = {'schema_version': 'are.g02-r7-worktree-index-reachability/v2',
               'posture': 'evaluator-only-no-gold-path-export-no-model-no-score',
               'candidate_sha256': CANDIDATE_SHA,
               'task_cache_hydration_sha256': HYDRATION_SHA,
               'source_preflight_sha256': SOURCE_SHA,
               'failed_git-blob-simulation_sha256': FAILED_SIMULATION_SHA,
               'parquet_sha256': PARQUET_SHA, 'index_source_sha256': INDEX_SHA,
               'script_sha256': sha(__file__), 'task_count': len(rows),
               'totals': dict(totals), 'rows': rows,
               'reachability_valid': totals['index_total_agreements'] == 24,
               'claim_ceiling': 'Evaluator-only actual-worktree reachability; not agent acquisition, score, paired result or superiority.',
               'open_questions': ['Will the live agent acquire and select these reachable references?',
                                  'Will full arms fit limits and clear both quality and cost intervals?']}
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': 'audited', 'sha256': sha(OUTPUT),
                      'totals': payload['totals'],
                      'reachability_valid': payload['reachability_valid']}))


if __name__ == '__main__':
    main()
