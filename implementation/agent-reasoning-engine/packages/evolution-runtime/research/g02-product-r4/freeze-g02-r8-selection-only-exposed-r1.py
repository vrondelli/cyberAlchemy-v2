#!/usr/bin/env python3
"""Freeze the exposed DSH source-selection-only protocol test."""

import hashlib
import json
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
ROOT = Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr8-mixed-selectonly-dev-01')
OUTPUT = BASE / 'g02-r8-selection-only-exposed-r1/FREEZE.json'
PREPARED_SHA = 'bf1d80a338a942dda460069de16d9a3524da2033f975b40477d2593e664d79f3'
BINDING_SHA = '9df1e1a6924eb0d1e3e64b43a989d2f6bd55bed04f51c646422eb1f6ed7bb9d5'
TOOLS = BASE / 'g02-r8-selection-only-dev-tools-r1'
TOOLS_SHA = 'e501ab831365dd4bc3e090462f5cb0f1c8a5aa9e1e4b336c81b4c8905af96c9f'
RUNNER_SHA = 'caf6b643fd62e477d3216fcd05ff65e3dd59b9673fa9aae873a6737e4fa5402d'
R8 = BASE / 'g02-product-replication-r8/DEFINITION.json'
R8_SHA = '20a60393c1125894965c759b3138c5997c55c9792fa752cc6506831aa602ae57'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    if OUTPUT.exists() or (ROOT / 'dsh-control').exists() or \
            sha(ROOT / 'FREEZE.json') != PREPARED_SHA or \
            sha(ROOT / 'tasks/binding.json') != BINDING_SHA or \
            sha(TOOLS / 'SELECTION-ONLY-DEV-TOOLS.json') != TOOLS_SHA or \
            sha(TOOLS / 'run_dsh_control.py') != RUNNER_SHA or \
            sha(R8) != R8_SHA:
        raise ValueError('selection-only-freeze.input-or-output-drift')
    old = json.loads(R8.read_text())['ordered_pairs'][0]
    binding = json.loads((ROOT / 'tasks/binding.json').read_text())
    prepared = json.loads((ROOT / 'FREEZE.json').read_text())
    if binding['instance_id'] != old['instance_id'] or \
            binding['base_commit'] != old['base_commit'] or \
            prepared['instance_id'] != old['instance_id'] or \
            prepared['source_hashes']['code/run_dsh_control.py'] != RUNNER_SHA:
        raise ValueError('selection-only-freeze.task-or-runner-drift')
    payload = {
        'schema_version': 'are.g02-r8-selection-only-exposed-freeze/v1',
        'status': 'frozen-before-model-dispatch',
        'posture': 'exposed-DSH-only-selection-protocol-not-r8-repair',
        'instance_id': old['instance_id'], 'repo': old['repo'],
        'base_commit': old['base_commit'], 'root': str(ROOT),
        'r8_definition_sha256': R8_SHA,
        'prepared_freeze_sha256': PREPARED_SHA,
        'task_binding_sha256': BINDING_SHA,
        'tools_manifest_sha256': TOOLS_SHA,
        'runner_sha256': RUNNER_SHA,
        'freeze_script_sha256': sha(__file__),
        'changed_setting': 'DSH prompt requests read/search-only source selection, no patch',
        'unchanged': '1M episode budget and context window, 16K output cap, task, source, model, transport, ARE policy, scorer.',
        'validity_rule': 'Any apply_edits tool call invalidates this selection-only diagnostic.',
        'one_attempt_no_retry': True,
        'claim_ceiling': 'Exposed DSH-only protocol feasibility; no paired score, r8 recovery, or superiority.',
        'open_questions': ['Will DSH obey the no-edit rule and finish under the original 1M cap?'],
    }
    OUTPUT.parent.mkdir(mode=0o700, exist_ok=False)
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': payload['status'], 'sha256': sha(OUTPUT)}))


if __name__ == '__main__':
    main()
