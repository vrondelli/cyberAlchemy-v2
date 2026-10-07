#!/usr/bin/env python3
"""Bind the path-only projector repair into the next G02 development tools."""

import hashlib
import json
import shutil
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-r5-index64-development-tools-r2'
PROJECTOR = BASE / 'g02-r5-index64-terminal-recovery-r1/project-g02-r5-selected-pruning-r1.py'
OUTPUT = BASE / 'g02-r5-index64-development-tools-r3'
SOURCE_MANIFEST_SHA = '52324ded43509fed03e5b29578dff6b426c88697086dcacdce385bb82d5ff5ad'
ORIGINAL_PROJECTOR_SHA = '4107f9f5e805ec8ce20b6b099fcd876cf5abed3bf045bb70e2b6798089a1ebe2'
PROJECTOR_SHA = 'd56c252c7a1e6c07f1eedd0b6bc86c11008dac639d2fd45f8939a327f4bac749'
NAME = 'project-g02-r4-selected-pruning-r1.py'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    if OUTPUT.exists() or sha(SOURCE / 'INDEX64-DEV-SOURCE-R2.json') != SOURCE_MANIFEST_SHA or \
            sha(SOURCE / NAME) != ORIGINAL_PROJECTOR_SHA or sha(PROJECTOR) != PROJECTOR_SHA:
        raise ValueError('g02-index64-dev-r3.source-or-output-drift')
    original = (SOURCE / NAME).read_text()
    derived = PROJECTOR.read_text()
    before = "root.name.startswith('g02-cross-layer-pr4-') and"
    after = "root.name.startswith('g02-cross-layer-pr5-index64-') and"
    if original.count(before) != 1 or original.replace(before, after) != derived:
        raise ValueError('g02-index64-dev-r3.not-path-only')
    shutil.copytree(SOURCE, OUTPUT)
    (OUTPUT / NAME).write_text(derived)
    manifest = {'schema_version': 'are.g02-index64-development-source/v3',
                'posture': 'evaluator-exposed-development-not-superiority-campaign',
                'predecessor_manifest_sha256': SOURCE_MANIFEST_SHA,
                'builder_sha256': sha(__file__), 'changed_file': NAME,
                'only_change': 'Accept exact pr5-index64 run-root prefix for policy projection',
                'projector_sha256': sha(OUTPUT / NAME),
                'claim_ceiling': 'No-model source repair; not a matched result or superiority.',
                'open_questions': ['Will the next development pair finish without terminal recovery?']}
    path = OUTPUT / 'INDEX64-DEV-SOURCE-R3.json'
    path.write_text(json.dumps(manifest, sort_keys=True, indent=2) + '\n')
    print(json.dumps({'status': 'built-no-model', 'sha256': sha(path),
                      'projector_sha256': manifest['projector_sha256']}))


if __name__ == '__main__':
    main()
