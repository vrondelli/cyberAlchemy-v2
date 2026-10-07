#!/usr/bin/env python3
"""Verify exact-commit G02 r6 source caches after filtered hydration."""

import hashlib
import json
import subprocess
from pathlib import Path


ROOT = Path('/opt/are/evolution-runtime/g02-r6-mixed-source-candidate-r1')
CANDIDATE = ROOT / 'CANDIDATE.json'
EARLIER = ROOT / 'CACHE-AUDIT.json'
OUTPUT = ROOT / 'CACHES-READY.json'
CANDIDATE_SHA = '6c35ecec67bd0fd7b447c957c497a7465a317f690f4fab36afaad183594e28a3'
EARLIER_SHA = 'edcb8a3f439b273e8558e571113eb017e07ccffc76ab0adbb1825ee94697323d'
CACHES = {
    'ansible/ansible': '/opt/are-harness-benchmark/g02-fresh-pair-r4-preflight-20260929/cache/ansible',
    'internetarchive/openlibrary': '/opt/are-harness-benchmark/g02-fresh-pair-r3-20260926/cache/openlibrary',
    'django/django': '/tmp/are-g02-r6-mixed-source-caches-r1/django.git',
    'sveltejs/svelte': '/tmp/are-g02-r6-mixed-source-caches-r1/svelte.git',
}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def git(cache, *args):
    return subprocess.run(['git', '-C', cache, *args], capture_output=True, text=True)


def main():
    if OUTPUT.exists() or sha(CANDIDATE) != CANDIDATE_SHA or sha(EARLIER) != EARLIER_SHA:
        raise ValueError('g02-r6-caches-ready.input-drift')
    rows = json.loads(CANDIDATE.read_text())['ordered_tasks']
    if len(rows) != 24 or {r['repo'] for r in rows} != set(CACHES):
        raise ValueError('g02-r6-caches-ready.shape')
    verified = []
    for row in rows:
        cache = CACHES[row['repo']]
        origin = git(cache, 'remote', 'get-url', 'origin')
        commit = git(cache, 'rev-parse', '--verify', row['base_commit'] + '^{commit}')
        if origin.returncode or origin.stdout.strip() != row['repo_url'] or \
                commit.returncode or commit.stdout.strip() != row['base_commit']:
            raise ValueError('g02-r6-caches-ready.origin-or-commit:' + str(row['ordinal']))
        verified.append({'ordinal': row['ordinal'], 'instance_id': row['instance_id'],
                         'cache': cache, 'base_commit': row['base_commit']})
    payload = {'schema_version': 'are.g02-r6-mixed-cache-ready/v1',
               'posture': 'source-only-exact-commit-and-origin-check-no-gold-no-model',
               'candidate_sha256': CANDIDATE_SHA, 'earlier_audit_sha256': EARLIER_SHA,
               'script_sha256': sha(__file__), 'verified_count': len(verified),
               'cache_paths': CACHES, 'verified': verified,
               'claim_ceiling': 'Commit and origin availability only; no checkout/index, eligibility, model, or score result.',
               'open_questions': ['Do all source checkouts and index budgets pass without exceeding 1 GiB arm memory?',
                                  'Can the mixed-source adapter be sealed without gold exposure?']}
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': '24-source-commits-verified', 'sha256': sha(OUTPUT),
                      'verified_count': len(verified)}, sort_keys=True))


if __name__ == '__main__':
    main()
