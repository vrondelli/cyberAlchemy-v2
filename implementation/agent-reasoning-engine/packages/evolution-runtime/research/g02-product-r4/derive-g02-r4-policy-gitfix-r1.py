#!/usr/bin/env python3
"""Version the G02 policy driver with exact Ansible/vuls Git trust entries."""

import hashlib
import json
import shutil
import sys
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-product-replication-tools-r4-policy-r1'
OUTPUT = BASE / 'g02-product-replication-tools-r4-policy-gitfix-r1'
CONFIG = 'product-replication-gitconfig'
CONFIG_SHA = '3edd5e0bacc42d4017ebd6be2f8f47a3621f3cb99373301c0287a34872f4f810'
DRIVER_SHA = 'bb5395a20834d97bab19b8571025b1fedcac91dc9d3d46249856a7b49423c50a'
APPEND = (' directory = /cache/ansible\n'
          ' directory = /cache/ansible/.git\n'
          ' directory = /cache/vuls\n'
          ' directory = /cache/vuls/.git\n')


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    if len(sys.argv) != 2 or sys.argv[1] not in ('check', 'build'):
        raise ValueError('usage: derive-g02-r4-policy-gitfix-r1.py check|build')
    if sha(SOURCE / CONFIG) != CONFIG_SHA or sha(SOURCE / 'run-and-score-pair.mjs') != DRIVER_SHA:
        raise ValueError('g02-r4-policy-gitfix.source-drift')
    content = (SOURCE / CONFIG).read_text()
    if content.count('[safe]') != 1 or '/cache/ansible' in content or not content.endswith('\n'):
        raise ValueError('g02-r4-policy-gitfix.config-shape')
    updated = content + APPEND
    if sys.argv[1] == 'check':
        print(json.dumps({'status': 'checked-no-write',
                          'config_sha256': hashlib.sha256(updated.encode()).hexdigest()}))
        return
    if OUTPUT.exists():
        raise ValueError('g02-r4-policy-gitfix.output-exists')
    shutil.copytree(SOURCE, OUTPUT)
    (OUTPUT / CONFIG).write_text(updated)
    payload = {'schema_version': 'are.g02-r4-policy-gitfix-source/v1',
               'posture': 'candidate-no-model-dispatch',
               'prior_config_sha256': CONFIG_SHA, 'driver_sha256': DRIVER_SHA,
               'builder_sha256': sha(__file__),
               'new_config_sha256': sha(OUTPUT / CONFIG),
               'added_safe_directories': ['/cache/ansible', '/cache/ansible/.git',
                                          '/cache/vuls', '/cache/vuls/.git'],
               'claim_ceiling': 'Exact Git trust repair for public source caches; no pair result or superiority claim.',
               'open_questions': ['Does container UID 65532 read Git origin and source for both repositories?',
                                  'Does one excluded smoke pair reach sealed native scoring?']}
    with (OUTPUT / 'GITFIX-SOURCE.json').open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': 'built-no-model',
                      'manifest_sha256': sha(OUTPUT / 'GITFIX-SOURCE.json'),
                      'new_config_sha256': payload['new_config_sha256']}))


if __name__ == '__main__':
    main()
