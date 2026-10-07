#!/usr/bin/env python3
"""No-model four-checkout tmpfs and 1 GiB container index rehearsal."""

import hashlib
import json
import os
import shutil
import subprocess
import time
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
ROOT = BASE / 'g02-r7-screening-pool-r1'
CANDIDATE = ROOT / 'CANDIDATE.json'
HYDRATION = ROOT / 'TASK-CACHE-HYDRATION.json'
SOURCE_PREFLIGHT = ROOT / 'SOURCE-INDEX-PREFLIGHT.json'
OUTPUT = ROOT / 'FOUR-CHECKOUT-CAPACITY.json'
SCRATCH = Path('/tmp/are-g02-r7-four-checkout-capacity-r1')
CACHE = Path('/tmp/are-g02-r7-source-caches-r1/cache')
PROBE = BASE / 'g02-r4-cohort-code-r1/probe-g02-r7-container-index-r1.mjs'
INDEX = Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr4-own-expansions-preflight-r1/code/base-overlay.mjs')
CANDIDATE_SHA = '6ddfcd55f1a05f87ea4bcbe44ac3b0a7246ade41689b9195d33be2f6e8c8708d'
HYDRATION_SHA = '8c3c351d131c266b758d72d44010fa3a66da5d7b6e86c261c54af194387e8f2e'
SOURCE_SHA = 'fc9b73cad1c55dd14d15f59ccbda6fe3abb8e5d6fa3a3047d5606151f6856399'
INDEX_SHA = '1389c7a3fbdc096463787614778c4b9087104ef252c54659d542c68874e91c89'
IMAGE = 'sha256:6406e582e89acd60a59294144bfb526aa9ee1687273a7e475b68906705426385'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def run(*args, timeout=300, env=None):
    return subprocess.run(args, capture_output=True, text=True, timeout=timeout, env=env)


def need(value, reason):
    if not value:
        raise ValueError('g02-r7-four-checkout.' + reason)


def main():
    need(not OUTPUT.exists() and not SCRATCH.exists() and
         sha(CANDIDATE) == CANDIDATE_SHA and sha(HYDRATION) == HYDRATION_SHA and
         sha(SOURCE_PREFLIGHT) == SOURCE_SHA and sha(INDEX) == INDEX_SHA and
         PROBE.is_file(), 'input-or-output-drift')
    candidate = json.loads(CANDIDATE.read_text())
    task = candidate['ordered_tasks'][8]
    need(task['ordinal'] == 9 and task['repo'] == 'ansible/ansible',
         'chosen-task-shape')
    hydration = {r['ordinal']: r for r in json.loads(HYDRATION.read_text())['results']}
    cache_row = hydration[9]
    need(cache_row['base_commit'] == task['base_commit'] and
         cache_row['cache_path'] == str(CACHE / cache_row['cache_leaf']),
         'cache-binding')
    source = {r['ordinal']: r for r in json.loads(SOURCE_PREFLIGHT.read_text())['results']}[9]
    need(source['index_exit'] == 0 and source['index']['indexed_bytes'] == 64 * 1024 * 1024,
         'source-index-binding')
    before = shutil.disk_usage('/tmp').free
    root_before = shutil.disk_usage('/').free
    need(before >= 3 * 1024**3 and root_before >= 500 * 1024**2,
         'resource-floor')
    SCRATCH.mkdir(mode=0o700)
    env = {**os.environ, 'GIT_NO_LAZY_FETCH': '1'}
    steps = []
    for name in ('base', 'work', 'tools'):
        started = time.monotonic()
        clone = run('git', 'clone', '--no-local', '--no-checkout',
                    str(CACHE / cache_row['cache_leaf']), str(SCRATCH / name), env=env)
        need(clone.returncode == 0, 'host-clone:' + name + ':' + clone.stderr[-250:])
        checkout = run('git', '-C', str(SCRATCH / name), 'checkout', '--detach',
                       task['base_commit'], env=env)
        need(checkout.returncode == 0, 'host-checkout:' + name +
             ':' + checkout.stderr[-250:])
        steps.append({'checkout': name, 'seconds': round(time.monotonic()-started, 3)})
    command = ('git clone --no-local --no-checkout /cache/' + cache_row['cache_leaf'] +
               ' /out/are && git -C /out/are checkout --detach ' + task['base_commit'] +
               ' && node --max-old-space-size=768 /probe/container-index.mjs /out/are ' +
               task['base_commit'])
    started = time.monotonic()
    container = run('docker', 'run', '--rm', '--network', 'none', '--memory', '1g',
                    '--cpus', '1', '-v', str(CACHE) + ':/cache:ro',
                    '-v', str(SCRATCH) + ':/out',
                    '-v', str(PROBE) + ':/probe/container-index.mjs:ro',
                    '-v', str(INDEX) + ':/probe/base-overlay.mjs:ro',
                    IMAGE, 'sh', '-c', command, timeout=300)
    need(container.returncode == 0, 'container-clone-index:' + container.stderr[-500:])
    indexed = json.loads(container.stdout.splitlines()[-1])
    need(indexed['indexed_bytes'] == source['index']['indexed_bytes'] and
         indexed['indexed_files'] == source['index']['indexed_files'],
         'index-disagreement')
    steps.append({'checkout': 'are-container',
                  'seconds': round(time.monotonic()-started, 3)})
    peak = before - shutil.disk_usage('/tmp').free
    sizes = {}
    for name in ('base', 'work', 'tools', 'are'):
        result = run('du', '-sk', str(SCRATCH / name))
        need(result.returncode == 0, 'du:' + name)
        sizes[name] = int(result.stdout.split()[0]) * 1024
    payload = {'schema_version': 'are.g02-r7-four-checkout-capacity/v1',
               'status': 'passed-no-model',
               'candidate_sha256': CANDIDATE_SHA,
               'task_cache_hydration_sha256': HYDRATION_SHA,
               'source_index_preflight_sha256': SOURCE_SHA,
               'container_index_probe_sha256': sha(PROBE),
               'base_index_source_sha256': INDEX_SHA,
               'script_sha256': sha(__file__),
               'task_ordinal': 9, 'repo': task['repo'],
               'container_image': IMAGE, 'network_during_container_probe': 'none',
               'container_memory_limit': '1g', 'node_heap_limit_mib': 768,
               'tmpfs_free_before_bytes': before,
               'tmpfs_free_with_four_checkouts_bytes': shutil.disk_usage('/tmp').free,
               'tmpfs_peak_delta_bytes': peak,
               'root_free_before_bytes': root_before,
               'checkout_allocated_bytes': sizes,
               'steps': steps, 'container_index': indexed,
               'claim_ceiling': 'Four-checkout/no-model source-capacity rehearsal only; not whole ARE/DSH arm memory, model reliability, quality or superiority.',
               'open_questions': ['Will complete ARE and DSH arms fit 1 GiB limits and settle?',
                                  'Will the 24-pair quality and all-in efficiency intervals pass?']}
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    shutil.rmtree(SCRATCH)
    print(json.dumps({'status': payload['status'], 'sha256': sha(OUTPUT),
                      'tmpfs_peak_delta_bytes': peak,
                      'container_rss_bytes': indexed['rss_bytes']}))


if __name__ == '__main__':
    main()
