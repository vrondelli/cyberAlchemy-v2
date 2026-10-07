#!/usr/bin/env python3
"""Source-only task-8 issue footprint versus delivered and direct-include paths."""

import hashlib
import json
import os
import subprocess
from pathlib import Path


ARCHIVE = Path('/home/vlad_/are-benchmark-archive')
PACKETS = ARCHIVE / 'g02-r11-relational-choice-exposed-r5-20261003/PACKETS.json'
PACKETS_SHA = '8865de1df1268d3db7ffe65afbead0174a1e6d1ec4c386228b7bbe7e33752255'
BASE = ARCHIVE / 'g02-product-replication-r11-20261002/pairs/08-pr11-mixed-08/raw/sources/session/base'
TASK = ARCHIVE / 'g02-r11-task8-access-window-exposed-r2-20261003/PACKET.json'
TASK_SHA = 'cfe3e7f13830f0694dd48825c511166c5185a348fed2ece43edae1bb54d43fc3'
OUTPUT = ARCHIVE / 'g02-r11-task8-old-hack-coverage-r1-20261003/SOURCE-CENSUS.json'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError('g02-task8-old-hack-census.' + reason)


def hits(commit, term):
    result = subprocess.run(['git', '-C', str(BASE), 'grep', '-l', '-z', '-F', term,
                             commit, '--'], capture_output=True)
    need(result.returncode in (0, 1), 'git-grep')
    prefix = (commit + ':').encode()
    values = result.stdout.split(b'\0')
    return sorted(value[len(prefix):].decode() for value in values if value.startswith(prefix))


def main():
    need(sha(PACKETS) == PACKETS_SHA and sha(TASK) == TASK_SHA and
         not OUTPUT.exists(), 'input-or-output')
    task = json.loads(TASK.read_text())
    packet = next(row for row in json.loads(PACKETS.read_text())['ordered_packets']
                  if row['ordinal'] == 8)
    commit = task['base_commit']
    head = subprocess.check_output(['git', '-C', str(BASE), 'rev-parse', 'HEAD'],
                                   text=True).strip()
    need(head == commit and packet['instance_id'] == task['instance_id'] and
         '#define private public' in task['issue'] and
         'JSON_PRIVATE_UNLESS_TESTED' in task['issue'], 'task-binding')
    delivered = set(packet['already_read_paths'])
    candidates = {row['path'] for row in packet['candidates']}
    old = hits(commit, '#define private public')
    proposed = {term: hits(commit, term) for term in
                ('JSON_TESTS_PRIVATE', 'JSON_PRIVATE_UNLESS_TESTED')}
    main_header = BASE / 'include/nlohmann/json.hpp'
    private_lines = [index for index, line in enumerate(main_header.read_text().splitlines(), 1)
                     if line.strip() == 'private:']
    need(len(old) == 14 and len(set(old) & delivered) == 13 and
         len(set(old) & candidates) == 0 and not any(proposed.values()) and
         len(private_lines) == 4, 'source-shape-drift')
    result = {'schema_version': 'are.g02-r11-task8-old-hack-coverage/v1',
              'posture': 'exposed-source-only-no-gold-model-or-score',
              'source_sha256': {'packet': PACKETS_SHA, 'task': TASK_SHA},
              'instance_id': task['instance_id'], 'base_commit': commit,
              'old_hack_paths': old,
              'old_hack_delivered_paths': sorted(set(old) & delivered),
              'old_hack_direct_include_candidates': sorted(set(old) & candidates),
              'proposed_macro_occurrence_counts': {key: len(paths) for key, paths in proposed.items()},
              'primary_header': {'path': 'include/nlohmann/json.hpp',
                                 'private_access_lines': private_lines,
                                 'already_delivered': 'include/nlohmann/json.hpp' in delivered,
                                 'direct_include_candidate': 'include/nlohmann/json.hpp' in candidates},
              'macro_scope_already_delivered': 'include/nlohmann/detail/macro_scope.hpp' in delivered,
              'summary': {'old_hack_files': len(old),
                          'old_hack_files_already_delivered': len(set(old) & delivered),
                          'old_hack_files_in_direct_include_pool': len(set(old) & candidates),
                          'old_hack_unread_files': len(set(old) - delivered),
                          'direct_include_pool_size': len(candidates),
                          'already_read_path_count': len(delivered)},
              'claim_ceiling': 'Source-only issue footprint. Does not prove final evidence selection, gold relevance, native score, or superiority.',
              'open_questions': ['Can final selection retain issue-relevant already-delivered evidence?',
                                 'Does primary-header acquisition add needed evidence on other tasks?']}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    OUTPUT.parent.mkdir(mode=0o700)
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    print(json.dumps({'summary': result['summary'],
                      'receipt_sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
