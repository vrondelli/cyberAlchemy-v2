#!/usr/bin/env python3
"""Offline checkout and fixed 64 MiB index preflight for all r8 tasks."""

import hashlib
import json
import shutil
import subprocess
import time
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
ROOT = BASE / 'g02-r8-screening-pool-r1'
CANDIDATE = ROOT / 'CANDIDATE.json'
HYDRATION = ROOT / 'TASK-CACHE-HYDRATION.json'
OUTPUT = ROOT / 'SOURCE-INDEX-PREFLIGHT.json'
SCRATCH = Path('/tmp/are-g02-r8-source-index-check-r1')
PROBE = BASE / 'g02-r4-cohort-code-r1/probe-g02-r8-index-capacity-r1.mjs'
CANDIDATE_SHA = 'da2c3e68c1f62da2198bfbf89c598029af898ea7cacc523f516009e9fa307196'
HYDRATION_SHA = '3c1aa620dbc84c75e3e17fb09b8456ca8c7c25e93cc47e4fe20af2c22f4ef893'
CACHE = Path('/tmp/are-g02-r8-source-caches-r1/cache')
IMAGE = 'sha256:6406e582e89acd60a59294144bfb526aa9ee1687273a7e475b68906705426385'
NODE = '/opt/cyberalchemy-are-tools/node-24.10.0/node'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def run(*args, timeout=300):
    return subprocess.run(args, capture_output=True, text=True, timeout=timeout)


def need(value, reason):
    if not value:
        raise ValueError('g02-r8-source-index.' + reason)


def main():
    need(not OUTPUT.exists() and not SCRATCH.exists() and
         sha(CANDIDATE) == CANDIDATE_SHA and sha(HYDRATION) == HYDRATION_SHA and
         PROBE.is_file() and CACHE.is_dir(), 'input-or-output-drift')
    tasks = json.loads(CANDIDATE.read_text())['ordered_tasks']
    hydration = json.loads(HYDRATION.read_text())
    ready = {row['ordinal']: row for row in hydration['results']}
    need(len(tasks) == len(ready) == 24 and hydration['verified_count'] == 24,
         'task-shape')
    SCRATCH.mkdir(mode=0o700)
    results = []
    status = 'passed'
    for task in tasks:
        ordinal = task['ordinal']
        commit = task['base_commit']
        cache_row = ready[ordinal]
        leaf = cache_row['cache_leaf']
        need(cache_row['repo'] == task['repo'] and cache_row['base_commit'] == commit and
             cache_row['offline_container_checkout'] and
             cache_row['cache_path'] == str(CACHE / leaf),
             'cache-binding:' + str(ordinal))
        source = CACHE / leaf
        origin = run('git', '-C', str(source), 'remote', 'get-url', 'origin')
        exact = run('git', '-C', str(source), 'rev-parse', '--verify', commit + '^{commit}')
        need(origin.returncode == 0 and origin.stdout.strip() == task['repo_url'] and
             exact.returncode == 0 and exact.stdout.strip() == commit,
             'cache-drift:' + str(ordinal))
        need(shutil.disk_usage('/tmp').free >= 2 * 1024**3, 'scratch-reserve')
        work = SCRATCH / 'work'
        need(not work.exists(), 'work-collision')
        command = ('git clone --no-local --no-checkout /cache/' + leaf +
                   ' /out/work && git -C /out/work checkout --detach ' + commit)
        started = time.monotonic()
        clone = run('docker', 'run', '--rm', '--network', 'none', '--memory', '1g',
                    '--cpus', '1', '-v', str(CACHE) + ':/cache:ro',
                    '-v', str(SCRATCH) + ':/out', IMAGE, 'sh', '-c', command)
        entry = {'ordinal': ordinal, 'instance_id': task['instance_id'],
                 'repo': task['repo'], 'source': task['source'],
                 'base_commit': commit, 'cache_leaf': leaf,
                 'checkout_exit': clone.returncode,
                 'checkout_seconds': round(time.monotonic() - started, 3)}
        if clone.returncode:
            entry['error_tail'] = clone.stderr[-500:]
            results.append(entry)
            status = 'failed-source-checkout'
            print(json.dumps({'ordinal': ordinal, 'status': status,
                              'error_tail': entry['error_tail']}), flush=True)
            break
        head = run('git', '-C', str(work), 'rev-parse', 'HEAD')
        need(head.returncode == 0 and head.stdout.strip() == commit,
             'checkout-head:' + str(ordinal))
        indexed = run(NODE, '--max-old-space-size=768', str(PROBE), str(work), commit,
                      timeout=180)
        entry['index_exit'] = indexed.returncode
        if indexed.returncode:
            entry['error_tail'] = indexed.stderr[-500:]
            results.append(entry)
            status = 'failed-index'
            print(json.dumps({'ordinal': ordinal, 'status': status,
                              'error_tail': entry['error_tail']}), flush=True)
            break
        entry['index'] = json.loads(indexed.stdout)
        results.append(entry)
        shutil.rmtree(work)
        print(json.dumps({'ordinal': ordinal, 'status': 'passed',
                          'index_bytes': entry['index']['indexed_bytes'],
                          'rss_bytes': entry['index']['rss_bytes']}), flush=True)
    if status == 'passed':
        SCRATCH.rmdir()
    payload = {'schema_version': 'are.g02-r8-source-index-preflight/v1',
               'status': status, 'posture': 'source-only-no-gold-path-no-score-no-model',
               'candidate_sha256': CANDIDATE_SHA,
               'task_cache_hydration_sha256': HYDRATION_SHA,
               'probe_sha256': sha(PROBE), 'script_sha256': sha(__file__),
               'container_image': IMAGE, 'network_during_checkout': 'none',
               'container_memory_limit': '1g', 'node_heap_limit_mib': 768,
               'attempted_count': len(results), 'passed_count': sum(
                   row.get('index_exit') == 0 for row in results), 'results': results,
               'claim_ceiling': 'Source checkout/index preflight only; no native reference reachability, model, score or superiority.',
               'open_questions': ['Does fixed 64 MiB index admit enough native reference files?',
                                  'Will full arms fit 1 GiB and comparator complete all pairs?']}
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': status, 'sha256': sha(OUTPUT),
                      'attempted': len(results), 'passed': payload['passed_count']}))


if __name__ == '__main__':
    main()
