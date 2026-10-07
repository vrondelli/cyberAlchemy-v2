#!/usr/bin/env python3
"""Bind mixed-source ID and fresh-root guards without changing policy logic."""

import hashlib
import json
import shutil
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-r6-mixed-source-tools-r1'
OUTPUT = BASE / 'g02-r6-mixed-source-tools-r2'
MANIFEST_SHA = '2557383a52a8d99cbefc7d2cbd3c2f2e2ebc18c74fcb67b20be43129d00d47f5'
DRIVER_SHA = '148ecc5773bef14bd5a8ca49a530569e9840d9b13889a2c258d2bc6fb8685a4a'
PROJECTOR_SHA = 'd56c252c7a1e6c07f1eedd0b6bc86c11008dac639d2fd45f8939a327f4bac749'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def once(source, before, after):
    if source.count(before) != 1:
        raise ValueError('g02-r6-mixed-tools-r2.replacement-shape')
    return source.replace(before, after)


def main():
    driver = 'run-and-score-pair.mjs'
    projector = 'project-g02-r4-selected-pruning-r1.py'
    if OUTPUT.exists() or sha(SOURCE / 'MIXED-SOURCE-TOOLS.json') != MANIFEST_SHA or \
            sha(SOURCE / driver) != DRIVER_SHA or sha(SOURCE / projector) != PROJECTOR_SHA:
        raise ValueError('g02-r6-mixed-tools-r2.input-or-output-drift')
    shutil.copytree(SOURCE, OUTPUT)
    changed_driver = once((SOURCE / driver).read_text(),
        '/^SWE-Bench-Pro__[A-Za-z0-9_-]+$/.test(instance??\'\')',
        '/^(?:SWE-Bench-Pro|SWE-Bench-Verified|Multi-SWE-Bench)__[A-Za-z0-9_-]+$/.test(instance??\'\')')
    changed_projector = once((SOURCE / projector).read_text(),
        "root.name.startswith('g02-cross-layer-pr5-index64-') and",
        "(root.name.startswith('g02-cross-layer-pr5-index64-') or\n"
        "              root.name.startswith('g02-cross-layer-pr6-mixed-')) and")
    (OUTPUT / driver).write_text(changed_driver)
    (OUTPUT / projector).write_text(changed_projector)
    payload = {'schema_version': 'are.g02-r6-mixed-source-tools/v2',
               'posture': 'source-only-adapter-not-campaign-freeze',
               'predecessor_manifest_sha256': MANIFEST_SHA,
               'builder_sha256': sha(__file__),
               'changed_files': {driver: {'old_sha256': DRIVER_SHA, 'new_sha256': sha(OUTPUT / driver),
                                         'semantic_delta': 'Accept exact Pro, Verified and Multi task ID prefixes.'},
                                 projector: {'old_sha256': PROJECTOR_SHA, 'new_sha256': sha(OUTPUT / projector),
                                             'semantic_delta': 'Accept exact pr6-mixed fresh-root prefix.'}},
               'unchanged_policy': 'No ranker, index setting, deletion classifier, model protocol or scoring change.',
               'claim_ceiling': 'No-model adapter guard repair; not a frozen/scored campaign.',
               'open_questions': ['Will full mixed-source dry-run source checkout and eligibility pass?']}
    path = OUTPUT / 'MIXED-SOURCE-TOOLS-R2.json'
    path.write_text(json.dumps(payload, sort_keys=True, indent=2) + '\n')
    print(json.dumps({'status': 'built-no-model', 'sha256': sha(path),
                      'changed_file_sha256': {name: value['new_sha256'] for name, value in payload['changed_files'].items()}}))


if __name__ == '__main__':
    main()
