#!/usr/bin/env python3
"""Rehearse the largest r11 task's four concurrent source checkouts."""

import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess


BASE = Path('/opt/are/evolution-runtime')
INDEX = BASE / 'g02-r11-dev-pool-r1/SOURCE-INDEX-PREFLIGHT-R2.json'
CACHES = BASE / 'g02-r11-dev-pool-r1/TASK-CACHE-CLONE-PREFLIGHT-R1.json'
OUTPUT = BASE / 'g02-r11-dev-pool-r1/STORAGE-REHEARSAL-R1.json'
ROOT = Path('/tmp/are-g02-r11-four-checkout-rehearsal-r1')
INDEX_SHA = '53ab7d90825df5c0f9e41b316b1d14787e6315e5ca88c66def742aa57ecfab70'
CACHES_SHA = '42c3388b27fb22f59ff1acfa41d4d2fb6b0df6ab41a536e16d10b82f1fb85620'
MIN_BEFORE = 3 * 1024**3
MIN_AFTER = 1536 * 1024**2
ENV = {**os.environ, 'GIT_TERMINAL_PROMPT': '0', 'GIT_CONFIG_NOSYSTEM': '1',
       'GIT_CONFIG_GLOBAL': '/dev/null'}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def run(*args, timeout=600):
    return subprocess.run(args, capture_output=True, text=True, timeout=timeout, env=ENV)


def need(ok, reason):
    if not ok:
        raise ValueError('g02-r11-four-checkout-rehearsal.' + reason)


def main():
    free_before = shutil.disk_usage('/tmp').free
    need(not ROOT.exists() and not ROOT.is_symlink() and not OUTPUT.exists() and
         sha(INDEX) == INDEX_SHA and sha(CACHES) == CACHES_SHA and
         os.path.ismount('/tmp') and free_before >= MIN_BEFORE,
         'input-output-or-storage-boundary')
    indexed = json.loads(INDEX.read_text())['rows']
    cache_rows = json.loads(CACHES.read_text())['results']
    need(len(indexed) == len(cache_rows) == 24, 'denominator')
    worst = max(indexed, key=lambda row: (row['checkout_bytes'], -row['ordinal']))
    cache = cache_rows[worst['ordinal'] - 1]
    need(cache['ordinal'] == worst['ordinal'] and
         cache['instance_id'] == worst['instance_id'] and
         cache['base_commit'] == worst['base_commit'] and
         cache['tree'] == worst['tree'] and
         cache['ref'] == 'refs/heads/benchmark-base', 'worst-task-binding')
    ROOT.mkdir(mode=0o700)
    rows = []
    for arm in ('are-base', 'are-work', 'dsh-base', 'dsh-work'):
        target = ROOT / arm
        clone = run('git', 'clone', '--no-local', '--no-checkout',
                    cache['cache_path'], str(target))
        need(clone.returncode == 0, 'clone:' + arm + ':' + clone.stderr[-200:])
        checkout = run('git', '-C', str(target), 'checkout', '--detach',
                       cache['base_commit'])
        need(checkout.returncode == 0,
             'checkout:' + arm + ':' + checkout.stderr[-200:])
        tree = run('git', '-C', str(target), 'rev-parse', '--verify', 'HEAD^{tree}')
        need(tree.returncode == 0 and tree.stdout.strip() == cache['tree'],
             'tree:' + arm)
        bytes_used = int(run('du', '-sb', str(target), timeout=90).stdout.split()[0])
        rows.append({'arm': arm, 'checkout': 'passed', 'tree': tree.stdout.strip(),
                     'bytes': bytes_used})
        print(json.dumps({'arm': arm, 'bytes': bytes_used, 'status': 'passed'}), flush=True)
    free_after = shutil.disk_usage('/tmp').free
    scratch_bytes = int(run('du', '-sb', str(ROOT), timeout=90).stdout.split()[0])
    need(free_after >= MIN_AFTER, 'post-rehearsal-reserve')
    payload = {
        'schema_version': 'are.g02-r11-four-checkout-rehearsal/v1',
        'status': 'passed', 'posture': 'source-only-no-model-no-gold',
        'index_receipt_sha256': INDEX_SHA,
        'cache_receipt_sha256': CACHES_SHA,
        'script_sha256': sha(__file__),
        'worst_ordinal': worst['ordinal'],
        'worst_instance_id': worst['instance_id'],
        'worst_checkout_bytes': worst['checkout_bytes'],
        'rehearsal_root': str(ROOT), 'scratch_bytes': scratch_bytes,
        'tmp_free_before': free_before, 'tmp_free_after': free_after,
        'minimum_after_bytes': MIN_AFTER, 'rows': rows,
        'model_calls': 0, 'gold_loaded': False,
        'claim_ceiling': 'Exact largest-task four-checkout storage rehearsal only; live arm runtime, model reliability, scores, and superiority unproven.',
        'open_questions': ['Will live pair outputs and logs fit the remaining scratch reserve?',
                           'Will all matched pairs settle under fixed limits?'],
    }
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': 'passed', 'sha256': sha(OUTPUT),
                      'scratch_bytes': scratch_bytes, 'tmp_free_after': free_after}))


if __name__ == '__main__':
    main()
