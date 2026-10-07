#!/usr/bin/env python3
"""Raise only the DSH episode budget for one exposed reliability diagnostic."""

import hashlib
import json
import shutil
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-r8-mixed-source-tools-r1'
OUTPUT = BASE / 'g02-r8-dsh2m-dev-tools-r1'
SOURCE_SHA = 'a0856e7115d66df83e7fd5ff4cb44d583a4bfdc531fe6470f726d18f7d5fc7fa'
RUNNER_SHA = '9289a7c1df22f934eaded83cf8d24246ed83cbf23f315ec7d918b6c09314292b'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    name = 'run_dsh_control.py'
    if OUTPUT.exists() or sha(SOURCE / 'MIXED-SOURCE-TOOLS.json') != SOURCE_SHA or \
            sha(SOURCE / name) != RUNNER_SHA:
        raise ValueError('g02-r8-dsh2m-dev.input-or-output-drift')
    original = (SOURCE / name).read_text()
    old = "'-e', 'TOKEN_BUDGET=1000000'"
    new = "'-e', 'TOKEN_BUDGET=2000000'"
    if original.count(old) != 1:
        raise ValueError('g02-r8-dsh2m-dev.replacement-shape')
    shutil.copytree(SOURCE, OUTPUT)
    (OUTPUT / name).write_text(original.replace(old, new))
    payload = {'schema_version': 'are.g02-r8-dsh2m-dev-tools/v1',
               'posture': 'exposed-comparator-reliability-diagnostic',
               'predecessor_manifest_sha256': SOURCE_SHA,
               'runner_old_sha256': RUNNER_SHA,
               'runner_new_sha256': sha(OUTPUT / name),
               'builder_sha256': sha(__file__),
               'changed_setting': {'dsh_total_episode_token_budget': [1000000, 2000000]},
               'unchanged_settings': ['DSH 1M per-request context window',
                                      'DSH 16K output cap',
                                      'model and transport implementation',
                                      'ARE source/index/policy', 'native scorer'],
               'claim_ceiling': 'One exposed DSH-only budget feasibility test; no paired quality or superiority.',
               'open_questions': ['Will DSH finish with complete known usage under 2M?',
                                  'Does this transfer across untouched tasks?']}
    manifest = OUTPUT / 'DSH2M-DEV-TOOLS.json'
    manifest.write_text(json.dumps(payload, sort_keys=True, indent=2) + '\n')
    print(json.dumps({'status': 'built-exposed-development',
                      'sha256': sha(manifest), 'runner_sha256': sha(OUTPUT / name)}))


if __name__ == '__main__':
    main()
