#!/usr/bin/env python3
"""Add only the versioned API-contract ranker builder for exposed ARE development."""

import hashlib
import json
import shutil
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-r8-mixed-source-tools-r1'
OUTPUT = BASE / 'g02-r8-api-contract-dev-tools-r1'
BUILDER = BASE / 'build-g02-api-contract-ranker-r1.mjs'
SOURCE_SHA = 'a0856e7115d66df83e7fd5ff4cb44d583a4bfdc531fe6470f726d18f7d5fc7fa'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    if OUTPUT.exists() or sha(SOURCE / 'MIXED-SOURCE-TOOLS.json') != SOURCE_SHA or \
            not BUILDER.is_file():
        raise ValueError('api-contract-dev.input-or-output-drift')
    shutil.copytree(SOURCE, OUTPUT)
    shutil.copyfile(BUILDER, OUTPUT / 'build-ranker.mjs')
    payload = {
        'schema_version': 'are.g02-r8-api-contract-dev-tools/v1',
        'posture': 'exposed-ARE-only-source-acquisition-diagnostic',
        'predecessor_manifest_sha256': SOURCE_SHA,
        'builder_sha256': sha(__file__),
        'ranker_builder_sha256': sha(OUTPUT / 'build-ranker.mjs'),
        'changed_setting': 'Generic issue-conditioned API-consumer verification instruction in source-ranker summary.',
        'unchanged': 'Ranker source hints, 64 MiB index, ARE tool APIs, model/transport/context and token caps, deletion-only policy, native scorer.',
        'claim_ceiling': 'One exposed ARE-only test; no r8 recovery, matched pair, or superiority.',
        'open_questions': ['Does ARE acquire and select missing relevant consumers?',
                           'Does native File-/Span-F1 improve at acceptable cost?'],
    }
    manifest = OUTPUT / 'API-CONTRACT-DEV-TOOLS.json'
    manifest.write_text(json.dumps(payload, sort_keys=True, indent=2) + '\n')
    print(json.dumps({'status': 'built-exposed-development',
                      'sha256': sha(manifest),
                      'ranker_builder_sha256': payload['ranker_builder_sha256']}))


if __name__ == '__main__':
    main()
