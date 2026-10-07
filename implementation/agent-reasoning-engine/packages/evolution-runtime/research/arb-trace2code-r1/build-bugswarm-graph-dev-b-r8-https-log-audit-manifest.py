#!/usr/bin/env python3
"""Seal source-only HTTP log hashes for independent BugSwarm HTTPS replay."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path


BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
CANDIDATE = BASE / 'graph-dev-b-r1/METADATA-COHORT-B-R2.json'
PREFLIGHT = BASE / 'graph-dev-b-r1/DEV-PREFLIGHT-B-R1.json'
OUTPUT = BASE / 'graph-dev-b-r2/code-only/HTTPS-LOG-AUDIT-MANIFEST-B-R1.json'
PINS = {
    'candidate': '53df9fa74a732090fa23c65373b0f656cf73b0b9a92a6e1c81ca534b97bb16b8',
    'preflight': 'cc8adb5e427659794cfc6334797b759fd7dc9884346968bb74ac2dfea21f98dd',
}


def sha(blob: bytes) -> str:
    return hashlib.sha256(blob).hexdigest()


def main() -> None:
    if (OUTPUT.exists() or sha(CANDIDATE.read_bytes()) != PINS['candidate'] or
            sha(PREFLIGHT.read_bytes()) != PINS['preflight']):
        raise SystemExit('output-exists-or-input-pin-drift')
    cases = json.loads(CANDIDATE.read_bytes())['development']
    preflight = json.loads(PREFLIGHT.read_bytes())['results']
    if len(cases) != 24 or len(preflight) != 24:
        raise SystemExit('denominator-drift')
    rows = []
    for ordinal, (case, pf) in enumerate(zip(cases, preflight), 1):
        job = case['failure_job_id']
        if case['ordinal'] != ordinal:
            raise SystemExit(f'case-identity:{ordinal}')
        if ordinal == 12:
            path = BASE / f'graph-dev-b-r1/HTTP-PROVISIONAL-REPLACEMENT-LOG-12-{job}.txt'
            expected = case['log_sha256']
        else:
            if (pf['ordinal'] != ordinal or pf['image_tag'] != case['image_tag'] or
                    pf['failure_job_id'] != job or not pf['log_job_id_matched']):
                raise SystemExit(f'preflight-identity:{ordinal}')
            path = BASE / f'graph-dev-b-r1/HTTP-PROVISIONAL-FAILURE-LOG-{ordinal:02d}-{job}.txt'
            expected = pf['log_sha256']
        blob = path.read_bytes()
        if sha(blob) != expected or len(blob) > 8 * 1024 * 1024:
            raise SystemExit(f'log-pin-or-size:{ordinal}')
        rows.append({'ordinal': ordinal, 'id': case['image_tag'],
                     'job_id': job, 'expected_sha256': expected,
                     'expected_bytes': len(blob)})
    result = {'schema_version': 'are.g01-bugswarm-graph-dev-b-https-log-audit-manifest-r1/v1',
              'cohort': 'B-r2 exposed development', 'cases': 24,
              'candidate_sha256': PINS['candidate'],
              'preflight_sha256': PINS['preflight'],
              'script_sha256': sha(Path(__file__).read_bytes()),
              'endpoint_template': 'https://www.bugswarm.org/artifact-logs/{job_id}/raw/',
              'maximum_requests': 24, 'automatic_retries': 0,
              'total_expected_bytes': sum(row['expected_bytes'] for row in rows),
              'logs': rows, 'gold_opened': False,
              'reserved_confirmation_opened': False}
    encoded = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    with os.fdopen(os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600), 'wb') as stream:
        stream.write(encoded)
    print(json.dumps({'cases': 24, 'total_expected_bytes': result['total_expected_bytes'],
                      'manifest_sha256': sha(encoded)}))


if __name__ == '__main__':
    main()
