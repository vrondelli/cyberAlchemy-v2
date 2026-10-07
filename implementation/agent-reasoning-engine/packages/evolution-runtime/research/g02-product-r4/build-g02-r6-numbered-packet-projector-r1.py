#!/usr/bin/env python3
"""Bind the unchanged r2-trained pruning policy to packet-development roots."""

import hashlib
import json
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-r6-api-transfer-baseline-tools-r2/project-g02-r4-selected-pruning-r1.py'
OTHER = BASE / 'g02-r6-numbered-packet-tools-r3/project-g02-r4-selected-pruning-r1.py'
OUTPUT = BASE / 'g02-r6-numbered-packet-projector-r1.py'
SOURCE_SHA = 'be731910ab5d001c8a7e193516f40065a3eaa498e4af8af1e00b866590279361'
BEFORE = "root.name.startswith('g02-cross-layer-pr6-mixed-')"
AFTER = "root.name.startswith('g02-cross-layer-pr6-packet-')"


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    if OUTPUT.exists() or sha(SOURCE) != SOURCE_SHA or sha(OTHER) != SOURCE_SHA:
        raise ValueError('packet-projector.source-drift')
    content = SOURCE.read_text()
    if content.count(BEFORE) != 1 or AFTER in content:
        raise ValueError('packet-projector.guard-shape')
    OUTPUT.write_text(content.replace(BEFORE, AFTER))
    print(json.dumps({'status': 'built-symmetric-path-guard', 'sha256': sha(OUTPUT),
                      'unchanged': 'Policy, source scores and projection semantics.'}))


if __name__ == '__main__':
    main()
