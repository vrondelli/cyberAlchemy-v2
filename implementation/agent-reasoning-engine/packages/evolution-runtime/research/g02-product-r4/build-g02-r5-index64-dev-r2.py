#!/usr/bin/env python3
"""Bind the exposed diagnostic's accurate task-posture text without changing arms."""

import hashlib
import json
import shutil
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-r5-index64-development-tools-r1'
OUTPUT = BASE / 'g02-r5-index64-development-tools-r2'
PREPARE_SHA = '64918588929a991ccf52481fc13920e40a14157658fcdb8efc2b25f9212249d9'
SOURCE_MANIFEST_SHA = '6f0ce7c9bea4cb6b1c2d5aa6cdddf78b4c965e4ff70bec68da1348461292c63a'
BEFORE = 'Exposed task; ARE-only mechanism diagnostic after its matched pair was scored. No prospective claim.'
AFTER = 'Evaluator-exposed task; native reference reachability was inspected before this source-index development pair. No prospective claim.'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    if sha(SOURCE / 'prepare-prospective.mjs') != PREPARE_SHA or \
            sha(SOURCE / 'INDEX64-DEV-SOURCE.json') != SOURCE_MANIFEST_SHA:
        raise ValueError('g02-index64-dev-r2.source-drift')
    original = (SOURCE / 'prepare-prospective.mjs').read_text()
    if original.count(BEFORE) != 1 or OUTPUT.exists():
        raise ValueError('g02-index64-dev-r2.anchor-or-output')
    shutil.copytree(SOURCE, OUTPUT)
    (OUTPUT / 'prepare-prospective.mjs').write_text(original.replace(BEFORE, AFTER))
    payload = {'schema_version': 'are.g02-index64-development-source/v2',
               'posture': 'evaluator-exposed-development-not-superiority-campaign',
               'predecessor_manifest_sha256': SOURCE_MANIFEST_SHA,
               'predecessor_prepare_sha256': PREPARE_SHA,
               'builder_sha256': sha(__file__),
               'changed_file': 'prepare-prospective.mjs',
               'change': 'Correct exposed-task provenance sentence only',
               'prepare_sha256': sha(OUTPUT / 'prepare-prospective.mjs'),
               'claim_ceiling': 'No-model source correction; not a paired result or superiority claim.',
               'open_questions': ['Will the exposed diagnostic settle within resource limits?']}
    (OUTPUT / 'INDEX64-DEV-SOURCE-R2.json').write_text(
        json.dumps(payload, sort_keys=True, indent=2) + '\n')
    print(json.dumps({'status': 'built-no-model', 'sha256': sha(OUTPUT / 'INDEX64-DEV-SOURCE-R2.json'),
                      'prepare_sha256': payload['prepare_sha256']}))


if __name__ == '__main__':
    main()
