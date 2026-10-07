#!/usr/bin/env python3
"""Derive an isolated r10 mixed-source pair driver from pinned r9 tools."""

import hashlib
import json
import shutil
from pathlib import Path


REPO = Path(__file__).resolve().parents[6]
SOURCE = Path('/home/vlad_/are-benchmark-archive/g02-r9-qualified-source-20261001/tools')
OUTPUT = Path('/home/vlad_/are-benchmark-archive/g02-r10-mixed-driver-candidate-r1-20261002')
DRIVER = 'run-and-score-pair.mjs'
OLD_PROJECTOR = 'project-g02-r4-selected-pruning-r1.py'
NEW_PROJECTOR = 'project-g02-r10-mixed-pruning-r1.py'
PACKET = 'receipt-packet-mixed-source-r1.py'
RESEARCH = REPO / 'implementation/agent-reasoning-engine/packages/evolution-runtime/research/g02-product-r4'
EXPECTED = {
    DRIVER: '4fbe0c046453d761d0991284513da0463b357dfd8829eb8a15ceb9a468bf0b61',
    OLD_PROJECTOR: '3777721d9a1b4404ff1f79d919b072e02470e6b254d4e93d8efb9a1d7d1be2d6',
    NEW_PROJECTOR: '846dde045ec4c7bf533207d0a03f23f823eb1db39edaba0392d88d80c0030e5a',
    PACKET: '08a3417a8dfaa3e28a0360bb361019cd67fbd72fceffa2a61eb95b6e988ccb5b',
}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError('g02-r10-mixed-driver.' + reason)


def main():
    need(SOURCE.is_dir() and not OUTPUT.exists(), 'source-or-output-drift')
    for name, digest in EXPECTED.items():
        path = SOURCE / name if name in (DRIVER, OLD_PROJECTOR) else RESEARCH / name
        need(path.is_file() and sha(path) == digest, 'pinned-source-drift:' + name)
    original = (SOURCE / DRIVER).read_bytes()
    old = OLD_PROJECTOR.encode()
    need(original.count(old) == 1, 'driver-projector-binding-count')
    derived = original.replace(old, NEW_PROJECTOR.encode())
    need(derived.replace(NEW_PROJECTOR.encode(), old) == original,
         'driver-unexpected-delta')
    shutil.copytree(SOURCE, OUTPUT, ignore=shutil.ignore_patterns('__pycache__'))
    (OUTPUT / DRIVER).write_bytes(derived)
    shutil.copy2(RESEARCH / NEW_PROJECTOR, OUTPUT / NEW_PROJECTOR)
    shutil.copy2(RESEARCH / PACKET, OUTPUT / PACKET)
    manifest = {
        'schema_version': 'are.g02-r10-mixed-driver-source/v1',
        'status': 'source-candidate-no-model-no-campaign',
        'source_tools_root': str(SOURCE),
        'source_driver_sha256': EXPECTED[DRIVER],
        'source_projector_sha256': EXPECTED[OLD_PROJECTOR],
        'driver_sha256': sha(OUTPUT / DRIVER),
        'projector_sha256': sha(OUTPUT / NEW_PROJECTOR),
        'packet_sha256': sha(OUTPUT / PACKET),
        'driver_change': 'One exact projector filename binding; all other driver bytes unchanged.',
        'projector_dependency': 'Pinned r9 parent projector and separately staged r10 packet module at the absolute paths declared in the r10 projector.',
        'claim_ceiling': 'Source-only future driver candidate; no full three-prefix driver/scorer qualification, frozen campaign, model result, or superiority.',
        'open_questions': [
            'Does the complete no-model projection and scorer path pass for Pro, Verified, and Multi fixtures?',
            'Can an independently selected clean r10 cohort be frozen before dispatch?',
        ],
    }
    (OUTPUT / 'R10-MIXED-DRIVER-SOURCE.json').write_text(
        json.dumps(manifest, sort_keys=True, indent=2) + '\n')
    print(json.dumps({'status': manifest['status'],
                      'manifest_sha256': sha(OUTPUT / 'R10-MIXED-DRIVER-SOURCE.json'),
                      'driver_sha256': manifest['driver_sha256']}))


if __name__ == '__main__':
    main()
