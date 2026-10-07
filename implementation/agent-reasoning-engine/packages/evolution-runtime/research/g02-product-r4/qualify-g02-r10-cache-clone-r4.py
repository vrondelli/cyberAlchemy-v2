#!/usr/bin/env python3
"""Mechanically repair exposed r10 caches and test the exact arm clone path."""

import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile


BASE = Path('/opt/are/evolution-runtime')
CANDIDATE = BASE / 'g02-r10-dev-pool-r1/CANDIDATE.json'
SOURCE_RECEIPT = BASE / 'g02-r10-dev-pool-r1/TASK-CACHE-PREFLIGHT-R3.json'
SOURCE_ROOT = Path('/tmp/are-g02-r10-task-caches-r3')
OUTPUT_ROOT = Path('/tmp/are-g02-r10-task-caches-r4-clone-qualified')
RECEIPT = BASE / 'g02-r10-dev-pool-r1/CACHE-CLONE-QUALIFICATION-R4.json'
CANDIDATE_SHA = '1139a5877bcd686a63468bc75ff490963d4416313d1968ea64cc7dd43bc621dd'
SOURCE_RECEIPT_SHA = '6b45df00666864ecd32bda22eb3312ef3ff64514fc0bafe1bcc766cb0cba04ad'
ENV = {**os.environ, 'GIT_TERMINAL_PROMPT': '0', 'GIT_CONFIG_NOSYSTEM': '1',
       'GIT_CONFIG_GLOBAL': '/dev/null'}


def sha(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def run(*args, timeout=240):
    return subprocess.run(args, capture_output=True, text=True, env=ENV, timeout=timeout)


def need(ok, reason):
    if not ok:
        raise ValueError('g02-r10-cache-clone-qualification.' + reason)


def main():
    need(not OUTPUT_ROOT.exists() and not OUTPUT_ROOT.is_symlink() and
         not RECEIPT.exists() and sha(CANDIDATE) == CANDIDATE_SHA and
         sha(SOURCE_RECEIPT) == SOURCE_RECEIPT_SHA and
         shutil.disk_usage('/tmp').free >= 3 * 1024**3, 'input-output-or-space')
    candidate = json.loads(CANDIDATE.read_text())
    source = json.loads(SOURCE_RECEIPT.read_text())
    need(len(candidate['ordered_tasks']) == len(source['results']) == 24 and
         source['verified_count'] == 24 and source['cache_root'] == str(SOURCE_ROOT),
         'source-shape')
    OUTPUT_ROOT.mkdir(mode=0o700)
    (OUTPUT_ROOT / 'cache').mkdir(mode=0o755)
    rows = []
    for task, bound in zip(candidate['ordered_tasks'], source['results']):
        ordinal, commit = task['ordinal'], task['base_commit']
        need(ordinal == bound['ordinal'] == len(rows) + 1 and
             task['instance_id'] == bound['instance_id'] and
             commit == bound['base_commit'] and task['repo'] == bound['repo'] and
             bound['cache_path'] == str(SOURCE_ROOT / 'cache' / bound['cache_leaf']) and
             shutil.disk_usage('/tmp').free >= 2 * 1024**3,
             f'row-or-space:{ordinal}')
        source_cache = Path(bound['cache_path'])
        target_cache = OUTPUT_ROOT / 'cache' / bound['cache_leaf']
        need(source_cache.is_dir() and not source_cache.is_symlink() and
             not target_cache.exists(), f'cache-path:{ordinal}')
        shutil.copytree(source_cache, target_cache, symlinks=False)
        need(run('git', '-C', str(target_cache), 'update-ref',
                 'refs/heads/benchmark-base', commit).returncode == 0 and
             run('git', '-C', str(target_cache), 'symbolic-ref', 'HEAD',
                 'refs/heads/benchmark-base').returncode == 0,
             f'ref-install:{ordinal}')
        tree = run('git', '-C', str(target_cache), 'rev-parse', '--verify',
                   commit + '^{tree}')
        head = run('git', '-C', str(target_cache), 'rev-parse', '--verify', 'HEAD')
        origin = run('git', '-C', str(target_cache), 'remote', 'get-url', 'origin')
        need(tree.returncode == head.returncode == origin.returncode == 0 and
             tree.stdout.strip() == bound['tree'] and head.stdout.strip() == commit and
             origin.stdout.strip() == task['repo_url'], f'cache-identity:{ordinal}')
        clone_rows = []
        for arm in ('are', 'dsh'):
            with tempfile.TemporaryDirectory(prefix=f'are-g02-r10-r4-{ordinal:02d}-{arm}-',
                                             dir='/tmp') as scratch:
                checkout = Path(scratch) / 'source'
                cloned = run('git', 'clone', '--no-local', '--no-checkout',
                             str(target_cache), str(checkout), timeout=600)
                need(cloned.returncode == 0, f'clone:{ordinal}:{arm}:{cloned.stderr[-180:]}')
                checked = run('git', '-C', str(checkout), 'checkout', '--detach', commit,
                              timeout=600)
                need(checked.returncode == 0,
                     f'checkout:{ordinal}:{arm}:{checked.stderr[-180:]}')
                checked_tree = run('git', '-C', str(checkout), 'rev-parse',
                                   '--verify', 'HEAD^{tree}')
                need(checked_tree.returncode == 0 and
                     checked_tree.stdout.strip() == bound['tree'],
                     f'checkout-tree:{ordinal}:{arm}')
                clone_rows.append({'arm': arm, 'clone': 'passed', 'checkout': 'passed',
                                   'tree': checked_tree.stdout.strip()})
        rows.append({'ordinal': ordinal, 'instance_id': task['instance_id'],
                     'repo': task['repo'], 'commit': commit, 'tree': bound['tree'],
                     'cache_leaf': bound['cache_leaf'], 'ref': 'refs/heads/benchmark-base',
                     'clones': clone_rows})
        print(json.dumps({'ordinal': ordinal, 'clones': 2, 'status': 'passed'}), flush=True)
    receipt = {
        'schema_version': 'are.g02-r10-cache-clone-qualification/v4',
        'status': 'passed', 'posture': 'exposed-cohort-mechanism-only-no-model-no-gold',
        'candidate_sha256': CANDIDATE_SHA,
        'source_cache_receipt_sha256': SOURCE_RECEIPT_SHA,
        'source_root': str(SOURCE_ROOT), 'cache_root': str(OUTPUT_ROOT),
        'script_sha256': sha(__file__), 'task_count': len(rows),
        'clone_count': sum(len(row['clones']) for row in rows),
        'rows': rows, 'model_calls': 0, 'gold_loaded': False,
        'claim_ceiling': 'Exact no-local clone and checkout mechanism on the exposed r10 cohort only; no new-campaign admission, score, or superiority.',
        'open_questions': ['Does a separately selected fresh cohort pass this same clone path?',
                           'Will the full future arm driver settle validly?'],
    }
    with RECEIPT.open('x') as stream:
        json.dump(receipt, stream, sort_keys=True, indent=2)
        stream.write('\n')
    RECEIPT.chmod(0o600)
    print(json.dumps({'status': 'passed', 'task_count': len(rows),
                      'clone_count': receipt['clone_count'], 'sha256': sha(RECEIPT)}))


if __name__ == '__main__':
    main()
