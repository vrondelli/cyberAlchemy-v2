#!/usr/bin/env python3
"""Freeze the exposed DSH-only 2M episode-budget feasibility test."""

import hashlib
import json
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
ROOT = Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr8-mixed-dsh2m-dev-01')
OUTPUT = BASE / 'g02-r8-dsh2m-exposed-r1/FREEZE.json'
SOURCE_FREEZE_SHA = 'bd088ee4123a4d58dbd0c41b094203dfb77e4ad1d43b20a7b1a2864e08f9a724'
BINDING_SHA = '28103f2c520e2c3e28e990a684caf79f0845214bec56339cdeddd09c64014173'
TOOLS = BASE / 'g02-r8-dsh2m-dev-tools-r1'
TOOLS_SHA = '472d5ac9579e708aadff2e3fdc883a40d706e7645b82227d2769e60e5b59bb83'
R8_DEFINITION = BASE / 'g02-product-replication-r8/DEFINITION.json'
R8_SHA = '20a60393c1125894965c759b3138c5997c55c9792fa752cc6506831aa602ae57'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    if OUTPUT.exists() or (ROOT / 'dsh-control').exists() or \
            sha(ROOT / 'FREEZE.json') != SOURCE_FREEZE_SHA or \
            sha(ROOT / 'tasks/binding.json') != BINDING_SHA or \
            sha(TOOLS / 'DSH2M-DEV-TOOLS.json') != TOOLS_SHA or \
            sha(R8_DEFINITION) != R8_SHA:
        raise ValueError('g02-r8-dsh2m-freeze.input-or-output-drift')
    binding = json.loads((ROOT / 'tasks/binding.json').read_text())
    source = json.loads((ROOT / 'FREEZE.json').read_text())
    old = json.loads(R8_DEFINITION.read_text())['ordered_pairs'][0]
    if binding['instance_id'] != old['instance_id'] or \
            binding['base_commit'] != old['base_commit'] or \
            source['instance_id'] != old['instance_id'] or \
            source['source_hashes']['code/run_dsh_control.py'] != \
            sha(TOOLS / 'run_dsh_control.py'):
        raise ValueError('g02-r8-dsh2m-freeze.task-or-runner-drift')
    payload = {'schema_version': 'are.g02-r8-dsh2m-exposed-freeze/v1',
               'status': 'frozen-before-model-dispatch',
               'posture': 'exposed-DSH-only-feasibility-not-r8-campaign-repair',
               'instance_id': old['instance_id'], 'repo': old['repo'],
               'base_commit': old['base_commit'], 'root': str(ROOT),
               'r8_definition_sha256': R8_SHA,
               'prepared_freeze_sha256': SOURCE_FREEZE_SHA,
               'task_binding_sha256': BINDING_SHA,
               'tools_manifest_sha256': TOOLS_SHA,
               'runner_sha256': sha(TOOLS / 'run_dsh_control.py'),
               'freeze_script_sha256': sha(__file__),
               'changed_setting': {'dsh_total_episode_token_budget': [1000000, 2000000]},
               'unchanged': '1M request context, 16K output cap, task, source, model, transport, ARE policy and scorer.',
               'one_attempt_no_retry': True,
               'claim_ceiling': 'Exposed DSH-only budget feasibility; no paired score, r8 recovery, or superiority.',
               'open_questions': ['Will DSH finish with complete known usage under 2M?']}
    OUTPUT.parent.mkdir(mode=0o700, exist_ok=False)
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': payload['status'], 'sha256': sha(OUTPUT)}))


if __name__ == '__main__':
    main()
