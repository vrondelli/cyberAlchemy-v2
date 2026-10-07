#!/usr/bin/env python3
"""Source-only primary-header expansion of the exposed task-8 candidate pool."""

import hashlib
import json
import os
import subprocess
from pathlib import Path


ARCHIVE = Path('/home/vlad_/are-benchmark-archive')
CENSUS = ARCHIVE / 'g02-r11-task8-old-hack-coverage-r1-20261003/SOURCE-CENSUS.json'
PACKETS = ARCHIVE / 'g02-r11-relational-choice-exposed-r5-20261003/PACKETS.json'
BASE = ARCHIVE / 'g02-product-replication-r11-20261002/pairs/08-pr11-mixed-08/raw/sources/session/base'
OUTPUT = ARCHIVE / 'g02-r11-task8-primary-header-pool-r1-20261003/PRIMARY-POOL.json'
CENSUS_SHA = '43616198bac41b110d7934b6f891243aee40db9cda62e66ba3c2c8e41a8c2e95'
PACKETS_SHA = '8865de1df1268d3db7ffe65afbead0174a1e6d1ec4c386228b7bbe7e33752255'
ADDED = ('include/nlohmann/json.hpp', 'single_include/nlohmann/json.hpp')


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def need(ok, reason):
    if not ok:
        raise ValueError('g02-primary-pool.' + reason)


def main():
    need(sha(CENSUS) == CENSUS_SHA and sha(PACKETS) == PACKETS_SHA and
         not OUTPUT.exists(), 'input-or-output')
    census = json.loads(CENSUS.read_text())
    packet = next(row for row in json.loads(PACKETS.read_text())['ordered_packets']
                  if row['ordinal'] == 8)
    commit = census['base_commit']
    head = subprocess.check_output(['git', '-C', str(BASE), 'rev-parse', 'HEAD'],
                                   text=True).strip()
    need(head == commit and census['instance_id'] == packet['instance_id'] and
         census['primary_header']['private_access_lines'] and
         '#define private public' in packet['issue'], 'source-scope')
    original = {row['path'] for row in packet['candidates']}
    delivered = set(packet['already_read_paths'])
    need(len(original) == 23 and not (set(ADDED) & (original | delivered)),
         'candidate-overlap')
    added = []
    for path in ADDED:
        tracked = subprocess.check_output(['git', '-C', str(BASE), 'ls-files', '--', path],
                                          text=True).strip()
        full = BASE / path
        need(tracked == path and full.is_file() and full.stat().st_size <= 2_000_000,
             'path-not-read-eligible')
        added.append({'path': path, 'file_bytes': full.stat().st_size,
                      'source_sha256': sha(full)})
    result = {'schema_version': 'are.g02-r11-task8-primary-header-pool/v1',
              'posture': 'exposed-source-only-before-evaluator',
              'source_sha256': {'census': CENSUS_SHA, 'packets': PACKETS_SHA},
              'instance_id': census['instance_id'], 'base_commit': commit,
              'rule': 'For an issue changing private/public access in nlohmann/json, add the tracked primary include header and its tracked single-include mirror; keep the prior direct-include pool unchanged.',
              'original_candidate_paths': sorted(original),
              'added_candidates': added,
              'expanded_candidate_paths': sorted(original | set(ADDED)),
              'already_delivered_paths': sorted(delivered),
              'summary': {'original_candidates': len(original),
                          'added_candidates': len(added),
                          'expanded_candidates': len(original) + len(added)},
              'claim_ceiling': 'Source-only path coverage proposal. File-size eligibility is not delivered read content, model selection, native score, or superiority.',
              'open_questions': ['Are these additional paths actually missing native context?',
                                 'Can bounded relevant read windows be produced for the large mirror?']}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    OUTPUT.parent.mkdir(mode=0o700)
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    print(json.dumps({'summary': result['summary'],
                      'receipt_sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
