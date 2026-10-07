#!/usr/bin/env python3
"""No-model four-checkout scratch rehearsal for one exact G02 r4 source."""

import hashlib
import json
import shutil
import subprocess
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
CANDIDATE = BASE / 'g02-r4-fresh-cohort-candidate-r1/CANDIDATE.json'
HYDRATION = BASE / 'g02-r4-fresh-cohort-candidate-r1/HYDRATION.json'
REF_BINDING = BASE / 'g02-r4-fresh-cohort-candidate-r1/REF-BINDING.json'
ROOT = Path('/tmp/are-g02-r4-storage-probe-r2')
CANDIDATE_SHA = 'e4408a93c501bfe0ea57d8ef412155bb3db7f969aefb646392b1a6ff7bed5f08'
HYDRATION_SHA = '12c77ddbc23330b1ca7e68cdfc85f9f87871cfb592e79f7a1e9102e0cf1932eb'
REF_BINDING_SHA = 'aa2c25d1d44f67c6f6b2dcaebcde5818bf58a4cacde1ab5fac1407a8a4098761'
FLOOR = 3 * 1024**3


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError(f'g02-r4-storage-probe.{reason}')


def run(*args, timeout=120):
    return subprocess.run(args, capture_output=True, text=True, timeout=timeout)


def size(path):
    result = run('du', '-sb', str(path))
    need(result.returncode == 0, 'size-failed')
    return int(result.stdout.split()[0])


def main():
    need(sha(CANDIDATE) == CANDIDATE_SHA and sha(HYDRATION) == HYDRATION_SHA and
         sha(REF_BINDING) == REF_BINDING_SHA and
         not ROOT.exists() and shutil.disk_usage('/tmp').free >= FLOOR + 1024**3,
         'input-or-tmpfs-drift')
    cohort = json.loads(CANDIDATE.read_text())
    task = next(x for x in cohort['ordered_tasks'] if x['repo'] == 'ansible/ansible')
    source = Path(task['cache_base']) / 'cache' / task['cache_name']
    commit = task['base_commit']
    need(run('git', '-C', str(source), 'cat-file', '-e', commit + '^{commit}').returncode == 0,
         'source-commit-missing')
    ROOT.mkdir(mode=0o700)
    rows = []
    for name in ('are-base', 'are-work', 'dsh-base', 'dsh-work'):
        target = ROOT / name
        before = shutil.disk_usage('/tmp').free
        need(before >= FLOOR + 256 * 1024**2, f'floor-before:{name}')
        clone = run('git', 'clone', '--no-local', '--no-checkout', str(source), str(target))
        need(clone.returncode == 0, f'clone:{name}')
        checkout = run('git', '-C', str(target), 'checkout', '--detach', commit)
        need(checkout.returncode == 0, f'checkout:{name}')
        head = run('git', '-C', str(target), 'rev-parse', 'HEAD')
        status = run('git', '-C', str(target), 'status', '--porcelain')
        need(head.returncode == status.returncode == 0 and head.stdout.strip() == commit and
             status.stdout.strip() == '' and not (target / '.git/objects/info/alternates').exists(),
             f'checkout-integrity:{name}')
        after = shutil.disk_usage('/tmp').free
        need(after >= FLOOR, f'floor-after:{name}')
        rows.append({'name': name, 'commit': commit, 'bytes': size(target),
                     'tmpfs_free_before': before, 'tmpfs_free_after': after})
    payload = {'schema_version': 'are.g02-r4-tmpfs-checkout-probe/v1',
               'status': 'four-source-checkouts-passed-no-model',
               'candidate_sha256': CANDIDATE_SHA, 'hydration_sha256': HYDRATION_SHA,
               'ref_binding_sha256': REF_BINDING_SHA,
               'script_sha256': sha(__file__), 'instance_id': task['instance_id'],
               'repository': task['repo'], 'base_commit': commit,
               'scratch_root': str(ROOT), 'floor_bytes': FLOOR,
               'rows': rows, 'tmpfs_free_after': shutil.disk_usage('/tmp').free,
               'claim_ceiling': 'No-model source storage rehearsal; provider artifacts and full-pair peak remain untested.',
               'open_questions': ['Will model/DSH trajectories and Docker overhead fit beside these checkouts?',
                                  'Can each completed pair be cold-archived and scratch-reclaimed before the next?']}
    with (ROOT / 'RESULT.json').open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': payload['status'], 'sha256': sha(ROOT / 'RESULT.json'),
                      'total_checkout_bytes': sum(row['bytes'] for row in rows),
                      'tmpfs_free_after': payload['tmpfs_free_after']}))


if __name__ == '__main__':
    main()
