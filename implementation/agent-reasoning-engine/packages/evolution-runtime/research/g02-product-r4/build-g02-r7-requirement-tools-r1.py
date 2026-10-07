#!/usr/bin/env python3
"""Bind a generic requirement-preserving ranker to the exposed r7 adapter."""

import hashlib
import json
import shutil
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-r7-cache-access-dev-tools-r1'
OUTPUT = BASE / 'g02-r7-requirement-tools-r1'
BUILDER = BASE / 'build-g02-requirement-preserving-ranker-r1.mjs'
SOURCE_SHA = '200ab60f18f3e8ec831b987fbbd9ff59ee5112003ca2501c30a81b88d73a8fc1'
CONFIG_SHA = '5e9bfd36a946ce4fe03b9d9d9a13e37667f6aa0208560d0e32da0c007ced4dbf'
BUILDER_SHA = '4f021ae1c50a2c94264d325b45699c01d5bd63498f91ab7ca8d3ac3c90bd1cee'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    if OUTPUT.exists() or sha(SOURCE / 'CACHE-ACCESS-DEV-TOOLS.json') != SOURCE_SHA or \
            sha(SOURCE / 'product-replication-gitconfig') != CONFIG_SHA or \
            sha(BUILDER) != BUILDER_SHA:
        raise ValueError('g02-r7-requirement-tools.input-or-output-drift')
    shutil.copytree(SOURCE, OUTPUT)
    shutil.copyfile(BUILDER, OUTPUT / 'build-ranker.mjs')
    payload = {
        'schema_version': 'are.g02-r7-requirement-tools/v1',
        'posture': 'exposed-ARE-only-source-instruction-development',
        'predecessor_manifest_sha256': SOURCE_SHA,
        'gitconfig_sha256': CONFIG_SHA,
        'ranker_builder_sha256': BUILDER_SHA,
        'builder_sha256': sha(__file__),
        'changed_setting': 'Generic API-consumer, distinct requirement preservation, and narrow span instruction.',
        'unchanged': 'Task, cache, source hints, 64 MiB index, model/transport/context/token caps, deletion-only policy, scorer.',
        'claim_ceiling': 'Exposed ARE-only task, no matched DSH or superiority.',
        'open_questions': ['Does the instruction improve both native quality measures on another issue?',
                           'Does all-in model cost remain favorable?'],
    }
    manifest = OUTPUT / 'REQUIREMENT-TOOLS.json'
    manifest.write_text(json.dumps(payload, sort_keys=True, indent=2) + '\n')
    print(json.dumps({'status': 'built-exposed-requirement-tools',
                      'sha256': sha(manifest),
                      'ranker_builder_sha256': BUILDER_SHA}))


if __name__ == '__main__':
    main()
