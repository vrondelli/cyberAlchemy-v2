#!/usr/bin/env python3
"""Offline checkout and fixed-index preflight over all 24 task-specific caches."""

import hashlib
import json
import shutil
import subprocess
import time
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
ROOT = BASE / 'g02-r6-mixed-source-candidate-r1'
CANDIDATE = ROOT / 'CANDIDATE.json'
MIXED = ROOT / 'TASK-CACHE-HYDRATION-R2.json'
PRO = ROOT / 'PRO-TASK-CACHE-HYDRATION-R2.json'
FAILED = ROOT / 'SOURCE-INDEX-PREFLIGHT.json'
OUTPUT = ROOT / 'SOURCE-INDEX-PREFLIGHT-R2.json'
SCRATCH = Path('/tmp/are-g02-r6-source-index-check-r2')
PROBE = BASE / 'g02-r4-cohort-code-r1/probe-g02-r6-index-capacity-r3.mjs'
CANDIDATE_SHA = '6c35ecec67bd0fd7b447c957c497a7465a317f690f4fab36afaad183594e28a3'
MIXED_SHA = 'c86f1e1acd337766719e26a36b8dd2d5a3152dcd8eae3f40a59fb1df16ad9f73'
PRO_SHA = '4595094905baa565b8605196d2e882b604330dc628f1d14864eb5f39e0ad130c'
FAILED_SHA = '346af195df9bcd805ed667ad6614b03966c4fab181eaf1d8b065497e677a1ced'
CACHE = Path('/tmp/are-g02-r6-mixed-source-caches-r1/cache')
IMAGE = 'sha256:6406e582e89acd60a59294144bfb526aa9ee1687273a7e475b68906705426385'
NODE = '/opt/cyberalchemy-are-tools/node-24.10.0/node'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def run(*args, timeout=300):
    return subprocess.run(args, capture_output=True, text=True, timeout=timeout)


def need(value, reason):
    if not value:
        raise ValueError('g02-r6-source-index-r2.' + reason)


def main():
    need(not OUTPUT.exists() and not SCRATCH.exists() and
         sha(CANDIDATE) == CANDIDATE_SHA and sha(MIXED) == MIXED_SHA and
         sha(PRO) == PRO_SHA and sha(FAILED) == FAILED_SHA and
         PROBE.is_file() and CACHE.is_dir(), 'input-or-output-drift')
    tasks = json.loads(CANDIDATE.read_text())['ordered_tasks']
    ready_rows = (json.loads(MIXED.read_text())['results'] +
                  json.loads(PRO.read_text())['results'])
    ready = {row['ordinal']: row for row in ready_rows}
    need(len(tasks) == len(ready) == 24, 'task-shape')
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
    payload = {'schema_version': 'are.g02-r6-source-index-preflight/v2',
               'status': status, 'posture': 'source-only-no-gold-no-model',
               'candidate_sha256': CANDIDATE_SHA,
               'mixed_cache_hydration_sha256': MIXED_SHA,
               'pro_cache_hydration_sha256': PRO_SHA,
               'failed_predecessor_sha256': FAILED_SHA,
               'probe_sha256': sha(PROBE), 'script_sha256': sha(__file__),
               'container_image': IMAGE, 'network_during_checkout': 'none',
               'container_memory_limit': '1g', 'node_heap_limit_mib': 768,
               'attempted_count': len(results), 'passed_count': sum(
                   row.get('index_exit') == 0 for row in results), 'results': results,
               'claim_ceiling': 'Source checkout/index preflight only; no native eligibility, model, score, or superiority.',
               'open_questions': ['Does evaluator-only native eligibility pass without changing source-only rules?',
                                  'Will whole-arm memory, comparator reliability, and all-in time pass?']}
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': status, 'sha256': sha(OUTPUT),
                      'attempted': len(results), 'passed': payload['passed_count']}))


if __name__ == '__main__':
    main()
