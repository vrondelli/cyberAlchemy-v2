#!/usr/bin/env python3
"""Derive path-only pruning recovery for an already sealed exposed r5 pair."""

import hashlib
import json
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-r5-index64-development-tools-r2/project-g02-r4-selected-pruning-r1.py'
OUTPUT = BASE / 'g02-r5-index64-terminal-recovery-r1/project-g02-r5-selected-pruning-r1.py'
SOURCE_SHA = '4107f9f5e805ec8ce20b6b099fcd876cf5abed3bf045bb70e2b6798089a1ebe2'
BEFORE = "root.name.startswith('g02-cross-layer-pr4-') and"
AFTER = "root.name.startswith('g02-cross-layer-pr5-index64-') and"


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    if sha(SOURCE) != SOURCE_SHA or OUTPUT.exists():
        raise ValueError('g02-r5-terminal-projector.source-or-output-drift')
    original = SOURCE.read_text()
    if original.count(BEFORE) != 1:
        raise ValueError('g02-r5-terminal-projector.path-anchor-drift')
    derived = original.replace(BEFORE, AFTER)
    compile(derived, str(OUTPUT), 'exec')
    OUTPUT.parent.mkdir(parents=True, exist_ok=False)
    OUTPUT.write_text(derived)
    manifest = {'schema_version': 'are.g02-r5-terminal-projector-source/v1',
                'posture': 'sealed-prediction-recovery-no-model',
                'source_sha256': SOURCE_SHA, 'builder_sha256': sha(__file__),
                'derived_sha256': sha(OUTPUT),
                'only_change': 'accept exact pr5-index64 run-root prefix instead of pr4 prefix',
                'claim_ceiling': 'Pre-score projection recovery only; no native score or superiority.',
                'open_questions': ['Does prediction projection replay against the sealed raw prediction?']}
    path = OUTPUT.parent / 'PROJECTOR-SOURCE.json'
    path.write_text(json.dumps(manifest, sort_keys=True, indent=2) + '\n')
    print(json.dumps({'status': 'built-no-model', 'projector_sha256': sha(OUTPUT),
                      'manifest_sha256': sha(path)}))


if __name__ == '__main__':
    main()
