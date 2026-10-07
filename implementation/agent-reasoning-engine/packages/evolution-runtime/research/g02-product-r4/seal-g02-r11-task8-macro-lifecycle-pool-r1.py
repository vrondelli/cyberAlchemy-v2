#!/usr/bin/env python3
"""Source-only counterpart path from delivered macro_scope to macro_unscope."""

import hashlib
import json
import os
import subprocess
from pathlib import Path


ARCHIVE = Path('/home/vlad_/are-benchmark-archive')
PACKETS = ARCHIVE / 'g02-r11-relational-choice-exposed-r5-20261003/PACKETS.json'
BASE = ARCHIVE / 'g02-product-replication-r11-20261002/pairs/08-pr11-mixed-08/raw/sources/session/base'
OUTPUT = ARCHIVE / 'g02-r11-task8-macro-lifecycle-pool-r1-20261003/MACRO-POOL.json'
PACKETS_SHA = '8865de1df1268d3db7ffe65afbead0174a1e6d1ec4c386228b7bbe7e33752255'
SCOPE = 'include/nlohmann/detail/macro_scope.hpp'
UNSCOPE = 'include/nlohmann/detail/macro_unscope.hpp'
MAIN = 'include/nlohmann/json.hpp'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def need(ok, reason):
    if not ok:
        raise ValueError('g02-macro-lifecycle.' + reason)


def main():
    need(sha(PACKETS) == PACKETS_SHA and not OUTPUT.exists(), 'input-or-output')
    packet = next(row for row in json.loads(PACKETS.read_text())['ordered_packets']
                  if row['ordinal'] == 8)
    delivered = set(packet['already_read_paths'])
    candidates = {row['path'] for row in packet['candidates']}
    scope_text = (BASE / SCOPE).read_text()
    main_text = (BASE / MAIN).read_text()
    unscope = BASE / UNSCOPE
    tracked = subprocess.check_output(['git', '-C', str(BASE), 'ls-files', '--', UNSCOPE],
                                      text=True).strip()
    need(SCOPE in delivered and UNSCOPE not in delivered | candidates and
         'include macro_unscope.hpp at the end of json.hpp' in scope_text and
         '#include <nlohmann/detail/macro_scope.hpp>' in main_text and
         '#include <nlohmann/detail/macro_unscope.hpp>' in main_text and
         tracked == UNSCOPE and unscope.stat().st_size < 2_000_000 and
         '#undef JSON_' in unscope.read_text(), 'counterpart-binding')
    result = {'schema_version': 'are.g02-r11-task8-macro-lifecycle-pool/v1',
              'posture': 'exposed-source-only-before-evaluator',
              'source_packet_sha256': PACKETS_SHA, 'instance_id': packet['instance_id'],
              'rule': 'For an issue adding JSON access macros, traverse the explicit macro_scope.hpp comment and json.hpp include to its macro_unscope.hpp counterpart.',
              'original_candidate_paths': sorted(candidates),
              'added_candidate': {'path': UNSCOPE, 'source_sha256': sha(unscope),
                                  'file_bytes': unscope.stat().st_size},
              'expanded_candidate_paths': sorted(candidates | {UNSCOPE}),
              'already_delivered_paths': sorted(delivered),
              'claim_ceiling': 'Source-only candidate path, not actual model read, score, independent test, or superiority.',
              'open_questions': ['Is the counterpart native-gold context on this exposed task?',
                                 'Does a macro-lifecycle graph generalize to other issues?']}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    OUTPUT.parent.mkdir(mode=0o700)
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    print(json.dumps({'added_candidate': UNSCOPE,
                      'receipt_sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
