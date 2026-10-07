#!/usr/bin/env python3
"""Check source-only r6 candidate cache origins and exact commits."""

import hashlib
import json
import subprocess
from collections import Counter
from pathlib import Path


ROOT = Path('/opt/are/evolution-runtime/g02-r6-mixed-source-candidate-r1')
CANDIDATE = ROOT / 'CANDIDATE.json'
OUTPUT = ROOT / 'CACHE-AUDIT.json'
CANDIDATE_SHA = '6c35ecec67bd0fd7b447c957c497a7465a317f690f4fab36afaad183594e28a3'
CACHES = {
    'ansible/ansible': '/opt/are-harness-benchmark/g02-fresh-pair-r4-preflight-20260929/cache/ansible',
    'internetarchive/openlibrary': '/opt/are-harness-benchmark/g02-fresh-pair-r3-20260926/cache/openlibrary',
    'django/django': '/tmp/are-g01-r10-source-caches-r1/django--django.git',
    'sveltejs/svelte': '/opt/are-harness-benchmark/g01-source-cache-preflight-20260929-r6/sveltejs--svelte',
}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def git(path, *args):
    return subprocess.run(['git', '-C', path, *args], capture_output=True, text=True)


def main():
    if OUTPUT.exists() or sha(CANDIDATE) != CANDIDATE_SHA:
        raise ValueError('g02-r6-cache-audit.input-drift')
    candidate = json.loads(CANDIDATE.read_text())
    rows = candidate['ordered_tasks']
    if len(rows) != 24 or {r['repo'] for r in rows} != set(CACHES):
        raise ValueError('g02-r6-cache-audit.candidate-shape')
    results = []
    for row in rows:
        cache = CACHES[row['repo']]
        origin = git(cache, 'remote', 'get-url', 'origin')
        available = git(cache, 'cat-file', '-e', row['base_commit'] + '^{commit}')
        results.append({'ordinal': row['ordinal'], 'instance_id': row['instance_id'],
                        'repo': row['repo'], 'base_commit': row['base_commit'],
                        'cache': cache, 'origin_match': origin.returncode == 0 and
                        origin.stdout.strip() == row['repo_url'],
                        'commit_available': available.returncode == 0})
    if not all(r['origin_match'] for r in results):
        raise ValueError('g02-r6-cache-audit.origin-mismatch')
    counts = {repo: {'available': sum(r['commit_available'] for r in results if r['repo'] == repo),
                     'total': sum(r['repo'] == repo for r in results)} for repo in CACHES}
    payload = {'schema_version': 'are.g02-r6-cache-availability/v1',
               'posture': 'read-only-source-and-cache-audit-no-gold-no-model',
               'candidate_sha256': CANDIDATE_SHA, 'script_sha256': sha(__file__),
               'cache_counts': counts, 'available_total': sum(r['commit_available'] for r in results),
               'results': results,
               'claim_ceiling': 'Cache availability only; missing commits require hydration before eligibility or campaign freeze.',
               'open_questions': ['Can missing exact commits be hydrated and cold-copied?',
                                  'Will source-index and native eligibility pass?']}
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': 'audited', 'sha256': sha(OUTPUT),
                      'available_total': payload['available_total'], 'counts': counts}, sort_keys=True))


if __name__ == '__main__':
    main()
