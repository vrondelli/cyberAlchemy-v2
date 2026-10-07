#!/usr/bin/env python3
"""Independent read-only recomputation of the G01 r2 source/log admission."""

from __future__ import annotations

import gzip
import hashlib
import json
from pathlib import Path


BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
R1 = BASE / 'graph-confirm-r1/source-only/g01-bugswarm-graph-confirm-r1-preflight'
R2 = BASE / 'graph-confirm-r1/source-only/g01-bugswarm-graph-confirm-r2-repair'
SEED = b'are-g01-bugswarm-graph-dev-partition-r1\0'


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load(path: Path, expected: str | None = None) -> dict:
    data = path.read_bytes()
    if expected and sha(data) != expected:
        raise SystemExit(f'pin-drift:{path.name}')
    return json.loads(data)


def need(condition: bool, reason: str) -> None:
    if not condition:
        raise SystemExit(reason)


def unpack(filename: str | None, expected_sha: str, expected_bytes: int) -> bytes:
    need(isinstance(filename, str) and filename.endswith('.gz'), 'missing-compressed-body')
    data = gzip.decompress((R2 / filename).read_bytes())
    need(len(data) == expected_bytes and sha(data) == expected_sha, 'compressed-body-drift')
    return data


def main() -> None:
    manifest = load(R2 / 'REPAIR-MANIFEST-R2.json',
                    '1d02d5f561de98088e448a2abc6b7b2ce4df4f8cd6b1fe9e97266ed7383e945e')
    result = load(R2 / 'REPAIR-RESULT.json',
                  'a55087a01c1b157ea7fcd6dfa4327037a3e4cb13c72df5e0c31b44d80513c22c')
    split = load(BASE / 'graph-dev-r1/METADATA-COHORTS-R1.json',
                 manifest['input_sha256']['split'])
    prior = load(BASE / 'METADATA-CANDIDATE-24-R1.json',
                 manifest['input_sha256']['prior'])
    dev = load(BASE / 'graph-dev-r2/DEV-METADATA-R2.json',
               manifest['input_sha256']['dev_r2'])
    b1 = load(BASE / 'graph-dev-b-r1/METADATA-COHORT-B-R1.json',
              manifest['input_sha256']['b_r1'])
    b2 = load(BASE / 'graph-dev-b-r1/METADATA-COHORT-B-R2.json',
              manifest['input_sha256']['b_r2'])
    r1 = load(R1 / 'PREFLIGHT-RESULT.json', manifest['input_sha256']['r1'])
    need(result['attempted_slots'] == result['filled_slots'] == 24
         and result['all_24_filled'] and result['gold_opened'] is False
         and result['model_calls'] == 0 and len(result['rows']) == 24,
         'result-shape-drift')
    excluded = [*prior['selected'],
                *split['cohorts']['development']['Python'],
                *split['cohorts']['development']['Java'],
                *dev['development'], *b1['selected'], *b2['development']]
    excluded_repos = {row['repo'].lower() for row in excluded}
    original = [*split['cohorts']['reserved_confirmation']['Python'],
                *split['cohorts']['reserved_confirmation']['Java']]
    need(len(original) == 24 and len(manifest['slots']) == 24, 'original-shape-drift')
    seen = set()
    retained = replacements = requests = 0
    for index, (slot, row, original_row) in enumerate(
            zip(manifest['slots'], result['rows'], original), 1):
        need(slot['ordinal'] == row['slot'] == index and
             slot['repo'] == original_row['repo'] and
             slot['job_id'] == original_row['failure_job_id'] and
             slot['failed_commit'] == original_row['failure_commit'],
             f'slot-identity-{index}')
        final = row['final']
        repo = final['repo'].lower()
        need(repo not in seen and repo not in excluded_repos and
             final['language'] == slot['language'], f'final-disjoint-{index}')
        seen.add(repo)
        if row['retained']:
            retained += 1
            need(final['repo'] == slot['repo'] and
                 row['raw_head']['exit_code'] == 0 and
                 row['raw_head']['http_code'] == 200 and
                 row['raw_head']['content_length'] == slot['r1_log_bytes'],
                 f'retained-head-{index}')
            name = f'HTTPS-LOG-{index:02d}.txt'
            data = (R1 / name).read_bytes()
            need(len(data) == final['log_bytes'] == slot['r1_log_bytes'] and
                 sha(data) == final['log_sha256'] == slot['r1_log_sha256'],
                 f'retained-log-{index}')
            if slot['kind'] == 'page_repair_then_head':
                page = row['page']
                unpack(page['body_file'], page['sha256'], page['bytes'])
                need(page['exit_code'] == 0 and page['http_code'] == 200 and
                     page['identity_match'] and page['provider'] in
                     ('github-actions', 'travis-ci'), f'page-repair-{index}')
        else:
            replacements += 1
            attempts = row['attempts']
            requests += len(attempts)
            need(attempts and attempts[-1]['admitted'] and
                 all(not item['admitted'] for item in attempts[:-1]),
                 f'attempt-order-{index}')
            accepted = attempts[-1]
            queue = manifest['queues'][slot['language']]
            queued = queue[accepted['queue_index'] - 1]
            need(final['repo'] == accepted['repo'] == queued['repo'] and
                 final['job_id'] == accepted['job_id'] == queued['job_id'] and
                 final['failed_commit'] == accepted['failed_commit'] == queued['failed_commit'] and
                 int(sha(SEED + repo.encode()), 16) % 2 == 1,
                 f'replacement-source-{index}')
            for attempt in attempts:
                page = attempt['page']
                log = attempt['log']
                if page['body_file']:
                    unpack(page['body_file'], page['sha256'], page['bytes'])
                if log['body_file']:
                    unpack(log['body_file'], log['sha256'], log['bytes'])
            need(accepted['source']['exit_code'] == 0 and
                 accepted['source']['http_code'] == 200 and
                 accepted['raw_head']['exit_code'] == 0 and
                 accepted['raw_head']['http_code'] == 200 and
                 accepted['page']['exit_code'] == 0 and
                 accepted['page']['http_code'] == 200 and
                 accepted['page']['identity_match'] and
                 accepted['log']['exit_code'] == 0 and
                 accepted['log']['http_code'] == 200 and
                 accepted['log']['utf8'] and
                 accepted['raw_head']['content_length'] ==
                 accepted['log']['bytes'] == final['log_bytes'] and
                 accepted['log']['sha256'] == final['log_sha256'],
                 f'replacement-evidence-{index}')
    need(retained == 14 and replacements == 10 and requests == 35 and len(seen) == 24,
         'aggregate-drift')
    print(json.dumps({'status': 'passed', 'slots': 24, 'retained': retained,
                      'replacements': replacements, 'candidate_attempts': requests,
                      'unique_repositories': len(seen),
                      'source_log_admission_only': True,
                      'labels_opened': False, 'model_calls': 0}, sort_keys=True))


if __name__ == '__main__':
    main()
