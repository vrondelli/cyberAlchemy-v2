#!/usr/bin/env python3
"""Bind unchanged pruning policy to the exposed r7 requirement roots."""

import hashlib
import json
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-r7-cache-access-dev-tools-r1/project-g02-r4-selected-pruning-r1.py'
OTHER = BASE / 'g02-r7-requirement-tools-r1/project-g02-r4-selected-pruning-r1.py'
OUTPUT = BASE / 'g02-r7-requirement-projector-r1.py'
SOURCE_SHA = '52efd5e04f70a9905257af3b5fb4d9afd9a79e1c111edd7137d3b1b303cf56a7'
BEFORE = "root.name.startswith('g02-cross-layer-pr7-mixed-')"
AFTER = "root.name.startswith('g02-cross-layer-pr7-req-')"


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    if OUTPUT.exists() or sha(SOURCE) != SOURCE_SHA or sha(OTHER) != SOURCE_SHA:
        raise ValueError('g02-r7-requirement-projector.input-or-output-drift')
    content = SOURCE.read_text()
    if content.count(BEFORE) != 1 or AFTER in content:
        raise ValueError('g02-r7-requirement-projector.guard-shape')
    OUTPUT.write_text(content.replace(BEFORE, AFTER))
    print(json.dumps({'status': 'built-symmetric-path-guard',
                      'predecessor_sha256': SOURCE_SHA,
                      'output_sha256': sha(OUTPUT),
                      'changed': 'Only accepted root prefix; fixed policy/model/scorer unchanged.'}))


if __name__ == '__main__':
    main()
