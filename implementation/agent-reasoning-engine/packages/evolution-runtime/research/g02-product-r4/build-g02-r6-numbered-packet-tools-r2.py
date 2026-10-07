#!/usr/bin/env python3
"""Add the missing candidate module mount before any model dispatch."""

import hashlib
import json
import shutil
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-r6-numbered-packet-tools-r1'
OUTPUT = BASE / 'g02-r6-numbered-packet-tools-r2'
SOURCE_MANIFEST_SHA = 'f7931f786166eb2272d7020cc68efe46ad9607676d467b6839804cae3510f091'
RUNNER_SHA = '43da8a6f1043b9be545f526cad87f9b0d3e880f0f3f6af7382868b135fdd3dc5'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    if OUTPUT.exists() or sha(SOURCE / 'NUMBERED-PACKET-TOOLS.json') != SOURCE_MANIFEST_SHA or \
            sha(SOURCE / 'run-prospective-are.mjs') != RUNNER_SHA:
        raise ValueError('numbered-packet-r2.input-or-output-drift')
    shutil.copytree(SOURCE, OUTPUT)
    runner = (SOURCE / 'run-prospective-are.mjs').read_text()
    before = "args.splice(image,0,'-v',`${root}/code/orchestrate-recovery-v2.mjs:/repo/${c}/discovery-v1/orchestrate-recovery-v2.mjs:ro`);"
    after = before + "\nargs.splice(image,0,'-v',`${root}/code/numbered-requirement-packet-r1.mjs:/repo/${c}/discovery-v1/numbered-requirement-packet-r1.mjs:ro`);"
    if runner.count(before) != 1:
        raise ValueError('numbered-packet-r2.runner-anchor')
    (OUTPUT / 'run-prospective-are.mjs').write_text(runner.replace(before, after))
    manifest = {
        'schema_version': 'are.g02-r6-numbered-packet-tools/v2',
        'posture': 'zero-model-container-module-mount-repair',
        'predecessor_manifest_sha256': SOURCE_MANIFEST_SHA,
        'predecessor_runner_sha256': RUNNER_SHA,
        'runner_sha256': sha(OUTPUT / 'run-prospective-are.mjs'),
        'builder_sha256': sha(Path(__file__)),
        'changed_setting': 'Mount the already frozen numbered packet module beside episode-recovery-v2.mjs inside the ARE container.',
        'unchanged': 'Task, model, ranker, episode/module bytes, index, caps, pruning, scorer.',
        'claim_ceiling': 'Zero-model harness repair, exposed ARE-only development.',
    }
    path = OUTPUT / 'NUMBERED-PACKET-TOOLS-R2.json'
    path.write_text(json.dumps(manifest, indent=2, sort_keys=True) + '\n')
    print(json.dumps({'status': 'built-zero-model-repair', 'manifest_sha256': sha(path),
                      'runner_sha256': manifest['runner_sha256']}))


if __name__ == '__main__':
    main()
