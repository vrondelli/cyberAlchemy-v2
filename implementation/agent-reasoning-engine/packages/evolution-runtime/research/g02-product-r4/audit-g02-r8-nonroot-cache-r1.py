#!/usr/bin/env python3
"""No-model exact cache read/trust audit using the ARE arm's non-root UID."""

import hashlib
import json
import os
import subprocess
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
ROOT = BASE / 'g02-r8-screening-pool-r1'
CANDIDATE = ROOT / 'CANDIDATE.json'
HYDRATION = ROOT / 'TASK-CACHE-HYDRATION.json'
TOOLS = BASE / 'g02-r8-mixed-source-tools-r1'
OUTPUT = ROOT / 'NONROOT-CACHE-PREFLIGHT.json'
CACHE = Path('/tmp/are-g02-r8-source-caches-r1/cache')
IMAGE = 'sha256:6406e582e89acd60a59294144bfb526aa9ee1687273a7e475b68906705426385'
CANDIDATE_SHA = 'da2c3e68c1f62da2198bfbf89c598029af898ea7cacc523f516009e9fa307196'
HYDRATION_SHA = '3c1aa620dbc84c75e3e17fb09b8456ca8c7c25e93cc47e4fe20af2c22f4ef893'
TOOLS_SHA = 'a0856e7115d66df83e7fd5ff4cb44d583a4bfdc531fe6470f726d18f7d5fc7fa'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g02-r8-nonroot-cache.' + reason)


def main():
    need(not OUTPUT.exists() and sha(CANDIDATE) == CANDIDATE_SHA and
         sha(HYDRATION) == HYDRATION_SHA and
         sha(TOOLS / 'MIXED-SOURCE-TOOLS.json') == TOOLS_SHA and
         CACHE.is_dir() and os.stat(CACHE).st_mode & 0o005 == 0o005,
         'input-or-mount-drift')
    tasks = json.loads(CANDIDATE.read_text())['ordered_tasks']
    caches = json.loads(HYDRATION.read_text())['results']
    manifest = json.loads((TOOLS / 'MIXED-SOURCE-TOOLS.json').read_text())
    need(len(tasks) == len(caches) == len(manifest['git_safe_directories']) == 24,
         'denominator')
    rows = []
    for task, cache in zip(tasks, caches):
        ordinal = task['ordinal']
        leaf = cache['cache_leaf']
        need(ordinal == cache['ordinal'] and
             task['base_commit'] == cache['base_commit'] and
             manifest['git_safe_directories'][ordinal-1] == '/cache/' + leaf,
             f'cache-binding:{ordinal}')
        result = subprocess.run([
            'docker', 'run', '--rm', '--network', 'none', '--memory', '1g',
            '--cpus', '1', '--user', '65532:65532',
            '-e', 'GIT_CONFIG_GLOBAL=/run/are-product-replication-gitconfig',
            '-v', str(CACHE) + ':/cache:ro',
            '-v', str(TOOLS / 'product-replication-gitconfig') +
                  ':/run/are-product-replication-gitconfig:ro',
            IMAGE, 'git', '-C', '/cache/' + leaf, 'cat-file', '-e',
            task['base_commit'] + '^{commit}'],
            capture_output=True, text=True, timeout=120)
        row = {'ordinal': ordinal, 'cache_leaf': leaf,
               'nonroot_exact_commit_read': result.returncode == 0}
        if result.returncode:
            row['error_tail'] = result.stderr[-350:]
        rows.append(row)
        print(json.dumps({'ordinal': ordinal, 'passed': row['nonroot_exact_commit_read']}),
              flush=True)
        if result.returncode:
            break
    payload = {'schema_version': 'are.g02-r8-nonroot-cache-preflight/v1',
               'status': 'passed' if len(rows) == 24 and
                   all(r['nonroot_exact_commit_read'] for r in rows) else 'failed',
               'posture': 'no-model-no-gold-path-no-score',
               'candidate_sha256': CANDIDATE_SHA,
               'hydration_sha256': HYDRATION_SHA,
               'tools_manifest_sha256': TOOLS_SHA,
               'gitconfig_sha256': sha(TOOLS / 'product-replication-gitconfig'),
               'script_sha256': sha(__file__), 'container_image': IMAGE,
               'user': '65532:65532', 'network': 'none',
               'attempted_count': len(rows),
               'passed_count': sum(r['nonroot_exact_commit_read'] for r in rows),
               'rows': rows,
               'claim_ceiling': 'Exact non-root cache mount and Git trust check only; not whole-arm reliability, model, native quality or superiority.',
               'open_questions': ['Will complete ARE and DSH arms settle and score?']}
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': payload['status'], 'sha256': sha(OUTPUT),
                      'passed': payload['passed_count']}))


if __name__ == '__main__':
    main()
