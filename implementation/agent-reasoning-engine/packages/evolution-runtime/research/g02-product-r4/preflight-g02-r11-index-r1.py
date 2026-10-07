#!/usr/bin/env python3
"""Offline nonroot checkout and bounded-index preflight for G02 r11."""

import hashlib
import json
import math
import os
from pathlib import Path
import shutil
import subprocess


BASE = Path('/opt/are/evolution-runtime')
CANDIDATE = BASE / 'g02-r11-dev-pool-r1/CANDIDATE.json'
CACHES = BASE / 'g02-r11-dev-pool-r1/TASK-CACHE-CLONE-PREFLIGHT-R1.json'
OUTPUT = BASE / 'g02-r11-dev-pool-r1/SOURCE-INDEX-PREFLIGHT-R1.json'
PROBE = BASE / 'g02-r10-dev-pool-code-r1/probe-g02-r10-index-capacity-r1.mjs'
OVERLAY = Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr4-own-expansions-preflight-r1/code/base-overlay.mjs')
SCRATCH = Path('/tmp/are-g02-r11-source-index-check-r1')
CACHE_ROOT = Path('/tmp/are-g02-r11-task-caches-r1/cache')
IMAGE = 'sha256:6406e582e89acd60a59294144bfb526aa9ee1687273a7e475b68906705426385'
NODE = '/opt/cyberalchemy-are-tools/node-24.10.0/node'
PINS = {
    CANDIDATE: '6150685f909ba7ee2d83154375e5599511620aae3a9c820e1178c29c1e7c8b42',
    CACHES: '42c3388b27fb22f59ff1acfa41d4d2fb6b0df6ab41a536e16d10b82f1fb85620',
    OVERLAY: '1389c7a3fbdc096463787614778c4b9087104ef252c54659d542c68874e91c89',
}
MIN_TMP_FREE = 2 * 1024**3


def sha(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def run(*args, timeout=180):
    return subprocess.run(args, capture_output=True, text=True, timeout=timeout)


def need(ok, reason):
    if not ok:
        raise ValueError('g02-r11-index-preflight.' + reason)


def main():
    need(not OUTPUT.exists() and not SCRATCH.exists() and
         all(path.is_file() and sha(path) == digest for path, digest in PINS.items()) and
         PROBE.is_file() and Path(NODE).is_file() and CACHE_ROOT.is_dir() and
         shutil.disk_usage('/tmp').free >= MIN_TMP_FREE,
         'input-output-or-storage-boundary')
    candidate = json.loads(CANDIDATE.read_text())['ordered_tasks']
    caches = json.loads(CACHES.read_text())
    cache_rows = caches['results']
    need(len(candidate) == len(cache_rows) == caches['verified_count'] == 24 and
         caches['clone_count'] == 48, 'denominator')
    probe_sha = sha(PROBE)
    SCRATCH.mkdir(mode=0o700)
    journal = SCRATCH / 'JOURNAL.jsonl'
    rows = []
    for task, cache in zip(candidate, cache_rows):
        ordinal = task['ordinal']
        need(ordinal == cache['ordinal'] == len(rows) + 1 and
             task['instance_id'] == cache['instance_id'] and
             task['base_commit'] == cache['base_commit'] and
             task['repo_url'] == cache['origin'] and
             cache['cache_path'] == str(CACHE_ROOT / cache['cache_leaf']) and
             cache['ref'] == 'refs/heads/benchmark-base' and
             len(cache['clones']) == 2 and
             shutil.disk_usage('/tmp').free >= MIN_TMP_FREE,
             'cache-binding-or-storage:' + str(ordinal))
        nonroot = run('docker', 'run', '--rm', '--network', 'none',
                      '--memory', '1g', '--cpus', '1', '--user', '65532:65532',
                      '-v', str(CACHE_ROOT) + ':/cache:ro', IMAGE,
                      'git', '-c', 'safe.directory=/cache/' + cache['cache_leaf'],
                      '-C', '/cache/' + cache['cache_leaf'], 'cat-file', '-e',
                      task['base_commit'] + '^{commit}', timeout=120)
        need(nonroot.returncode == 0, 'nonroot-exact-commit:' + str(ordinal) +
             ':' + nonroot.stderr[-200:])
        work = SCRATCH / 'work'
        need(not work.exists(), 'scratch-collision:' + str(ordinal))
        script = ('git init -q /out/work && git -C /out/work fetch -q /cache/' +
                  cache['cache_leaf'] + ' ' + task['base_commit'] +
                  ' && git -C /out/work checkout -q --detach ' + task['base_commit'])
        checkout = run('docker', 'run', '--rm', '--network', 'none',
                       '--memory', '1g', '--cpus', '1',
                       '-v', str(CACHE_ROOT) + ':/cache:ro',
                       '-v', str(SCRATCH) + ':/out', IMAGE, 'sh', '-c', script,
                       timeout=300)
        need(checkout.returncode == 0, 'offline-checkout:' + str(ordinal) +
             ':' + checkout.stderr[-250:])
        head = run('git', '-C', str(work), 'rev-parse', 'HEAD')
        tree = run('git', '-C', str(work), 'rev-parse', 'HEAD^{tree}')
        status = run('git', '-C', str(work), 'status', '--porcelain')
        need(head.returncode == tree.returncode == status.returncode == 0 and
             head.stdout.strip() == task['base_commit'] and
             tree.stdout.strip() == cache['tree'] and not status.stdout.strip(),
             'checkout-identity:' + str(ordinal))
        checkout_bytes = int(run('du', '-sb', str(work)).stdout.split()[0])
        index_run = run(NODE, '--max-old-space-size=768', str(PROBE),
                        str(work), task['base_commit'], timeout=240)
        need(index_run.returncode == 0, 'bounded-index:' + str(ordinal) +
             ':' + index_run.stderr[-300:])
        index = json.loads(index_run.stdout)
        need(index['budget_mib'] == 64 and
             index['index_source_sha256'] == PINS[OVERLAY] and
             isinstance(index['indexed_files'], int) and index['indexed_files'] > 0 and
             isinstance(index['indexed_bytes'], int) and
             0 < index['indexed_bytes'] <= 64 * 1024**2 and
             math.isfinite(index['elapsed_ms']),
             'index-result:' + str(ordinal))
        row = {'ordinal': ordinal, 'instance_id': task['instance_id'],
               'repo': task['repo'], 'base_commit': task['base_commit'],
               'tree': cache['tree'], 'cache_leaf': cache['cache_leaf'],
               'nonroot_exact_commit': True, 'offline_checkout': True,
               'checkout_bytes': checkout_bytes, 'index': index}
        with journal.open('a') as stream:
            stream.write(json.dumps(row, sort_keys=True) + '\n')
            stream.flush()
            os.fsync(stream.fileno())
        rows.append(row)
        print(json.dumps({'ordinal': ordinal, 'repo': task['repo'],
                          'nonroot_checkout_index': 'passed',
                          'indexed_files': index['indexed_files']}), flush=True)
        shutil.rmtree(work)
    receipt = {
        'schema_version': 'are.g02-r11-source-index-preflight/v1',
        'status': 'passed', 'posture': 'source-only-no-model-no-gold',
        'candidate_sha256': PINS[CANDIDATE],
        'task_cache_receipt_sha256': PINS[CACHES],
        'probe_sha256': probe_sha, 'overlay_sha256': PINS[OVERLAY],
        'script_sha256': sha(__file__), 'journal_sha256': sha(journal),
        'tested_count': len(rows), 'nonroot_passed': len(rows),
        'checkout_passed': len(rows), 'index_passed': len(rows),
        'max_checkout_bytes': max(row['checkout_bytes'] for row in rows),
        'rows': rows, 'model_calls': 0, 'gold_loaded': False,
        'claim_ceiling': 'No-model source and index preflight only; native-reference admission, full driver, paired scores, and superiority unproven.',
        'open_questions': ['Do evaluator-only native reference files fit the bounded indexes?',
                           'Can the complete mixed-source driver run safely on all three prefixes?'],
    }
    with OUTPUT.open('x') as stream:
        json.dump(receipt, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': 'passed', 'sha256': sha(OUTPUT),
                      'tested_count': len(rows),
                      'max_checkout_bytes': receipt['max_checkout_bytes']},
                     sort_keys=True))


if __name__ == '__main__':
    main()
