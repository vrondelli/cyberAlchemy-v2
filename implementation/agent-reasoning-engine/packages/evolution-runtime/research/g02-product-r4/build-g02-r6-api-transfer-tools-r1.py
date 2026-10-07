#!/usr/bin/env python3
"""Version the r6 exposed-task adapter with only the generic API instruction."""

import hashlib
import json
import shutil
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-r6-mixed-source-tools-r4'
OUTPUT = BASE / 'g02-r6-api-transfer-tools-r1'
BUILDER = BASE / 'build-g02-api-contract-ranker-r1.mjs'
SOURCE_SHA = '7e7186b7273ece0ebf66b86718d17c4c6800dee7f2d3fb2bab4bd40ab9c32e3b'
BUILDER_SHA = '1f33f5b237cfb49a3ef6b59f31f63037b1dc732008c9b782fc8a45a900d0069a'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    if OUTPUT.exists() or sha(SOURCE / 'MIXED-SOURCE-TOOLS-R4.json') != SOURCE_SHA or \
            sha(BUILDER) != BUILDER_SHA:
        raise ValueError('g02-r6-api-transfer.input-or-output-drift')
    shutil.copytree(SOURCE, OUTPUT)
    shutil.copyfile(BUILDER, OUTPUT / 'build-ranker.mjs')
    payload = {
        'schema_version': 'are.g02-r6-api-transfer-tools/v1',
        'posture': 'exposed-ARE-only-transfer-diagnostic',
        'predecessor_manifest_sha256': SOURCE_SHA,
        'builder_sha256': sha(__file__),
        'ranker_builder_sha256': sha(OUTPUT / 'build-ranker.mjs'),
        'changed_setting': 'Generic issue-conditioned API-consumer verification instruction in source-ranker summary.',
        'unchanged': 'Task, exact commit/cache, source hints, 64 MiB index, ARE tool APIs, model/transport/context/token caps, deletion-only policy, and native scorer.',
        'claim_ceiling': 'One evaluator-exposed ARE-only transfer test; no matched pair or superiority.',
        'open_questions': ['Does the instruction transfer on a distinct exposed API-compatibility issue?',
                           'Does ARE read/select additional relevant source without losing efficiency?'],
    }
    manifest = OUTPUT / 'API-TRANSFER-TOOLS.json'
    manifest.write_text(json.dumps(payload, sort_keys=True, indent=2) + '\n')
    print(json.dumps({'status': 'built-exposed-transfer-tools',
                      'sha256': sha(manifest),
                      'ranker_builder_sha256': payload['ranker_builder_sha256']}))


if __name__ == '__main__':
    main()
