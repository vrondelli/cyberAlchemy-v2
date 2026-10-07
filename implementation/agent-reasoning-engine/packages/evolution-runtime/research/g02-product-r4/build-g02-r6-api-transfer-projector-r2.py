#!/usr/bin/env python3
"""Bind unchanged r2-trained G02 pruning to the two exposed transfer roots."""

import hashlib
import json
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-r6-api-transfer-baseline-tools-r2/project-g02-r4-selected-pruning-r1.py'
OTHER = BASE / 'g02-r6-api-transfer-candidate-tools-r2/project-g02-r4-selected-pruning-r1.py'
OUTPUT = BASE / 'g02-r6-api-transfer-projector-r2.py'
SOURCE_SHA = 'be731910ab5d001c8a7e193516f40065a3eaa498e4af8af1e00b866590279361'
BEFORE = "root.name.startswith('g02-cross-layer-pr6-mixed-')"
AFTER = "root.name.startswith('g02-cross-layer-pr6-api-transfer-')"


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    if OUTPUT.exists() or sha(SOURCE) != SOURCE_SHA or sha(OTHER) != SOURCE_SHA:
        raise ValueError('g02-r6-api-transfer-projector.input-or-output-drift')
    content = SOURCE.read_text()
    if content.count(BEFORE) != 1 or AFTER in content:
        raise ValueError('g02-r6-api-transfer-projector.guard-shape')
    OUTPUT.write_text(content.replace(BEFORE, AFTER))
    print(json.dumps({'status': 'built-symmetric-path-guard',
                      'predecessor_sha256': SOURCE_SHA,
                      'output_sha256': sha(OUTPUT),
                      'changed': 'Only exact accepted root prefix; fixed policy/model/scorer unchanged.'}))


if __name__ == '__main__':
    main()
