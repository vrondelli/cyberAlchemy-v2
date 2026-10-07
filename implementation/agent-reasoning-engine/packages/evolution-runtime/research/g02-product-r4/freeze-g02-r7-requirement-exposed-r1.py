#!/usr/bin/env python3
"""Freeze two ARE-only r7 development arms selected from issue text alone."""

import hashlib
import json
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
ROOTS = {
    'baseline': Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr7-req-base-01'),
    'requirement': Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr7-req-candidate-01'),
}
OUTPUT = BASE / 'g02-r7-requirement-exposed-r1/FREEZE.json'
EXPECTED = {
    ROOTS['baseline'] / 'FREEZE.json': 'f748b1b040c0eda04719008b361afea83b4d4efd60dd6e9d89b41e9b9670041d',
    ROOTS['baseline'] / 'tasks/binding.json': '16ab4d4a9afef54c7897de6a933719d6febd168944945da8b9f43d5dd49b3a12',
    ROOTS['requirement'] / 'FREEZE.json': 'c9df5eb40925d6d1720a4ebf4be2b142d621e7c0d26fc6c6f113d97886a6ce8b',
    ROOTS['requirement'] / 'tasks/binding.json': 'fcd7fe8d316dc32619becbfe74226a5138990be5f1a5d49402f4e0c356d55f79',
    BASE / 'g02-r7-cache-access-dev-tools-r1/CACHE-ACCESS-DEV-TOOLS.json': '200ab60f18f3e8ec831b987fbbd9ff59ee5112003ca2501c30a81b88d73a8fc1',
    BASE / 'g02-r7-requirement-tools-r1/REQUIREMENT-TOOLS.json': '2d7c3d89bdefc6b09b8af50ffd4df49a1cc29aa8700662dadf96a88911d80b09',
    BASE / 'g02-r7-screening-pool-r1/CANDIDATE.json': '6ddfcd55f1a05f87ea4bcbe44ac3b0a7246ade41689b9195d33be2f6e8c8708d',
}
TASK_ID = 'SWE-Bench-Pro__python__maintenance__bugfix__d131db7a'
COMMIT = '59ca05b70994b07a9507f61a0871146a4991b262'
TASK_SHA = '8bcc7cb877b092c4aeb091d7a3ff8fb371cb12855a7d08336f8043e497e0578b'
RANKERS = {
    'baseline': '70ce7350ff6029bac290fe5f542ab6a2fef9a37a999f858451441f3a6139a9ce',
    'requirement': '0fe0296cb566c08b72855a37b99f7d9d54a8c73fe97aab5870c9c251ce513dce',
}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    if OUTPUT.exists() or any(sha(path) != digest for path, digest in EXPECTED.items()):
        raise ValueError('g02-r7-requirement.freeze-input-drift')
    candidate = json.loads((BASE / 'g02-r7-screening-pool-r1/CANDIDATE.json').read_text())
    selected = next(row for row in candidate['ordered_tasks'] if row['ordinal'] == 17)
    if selected['instance_id'] != TASK_ID or selected['base_commit'] != COMMIT:
        raise ValueError('g02-r7-requirement.cohort-binding-drift')
    for arm, root in ROOTS.items():
        if (root / 'evidence').exists() or (root / 'ARE-STARTED.json').exists():
            raise ValueError('g02-r7-requirement.pre-dispatch-order')
        prepared = json.loads((root / 'FREEZE.json').read_text())
        binding = json.loads((root / 'tasks/binding.json').read_text())
        if prepared['instance_id'] != TASK_ID or binding['instance_id'] != TASK_ID or \
                binding['base_commit'] != COMMIT or binding['task_sha256'] != TASK_SHA or \
                prepared['source_hashes']['code/ranked-source-acquisition.mjs'] != RANKERS[arm]:
            raise ValueError('g02-r7-requirement.arm-binding-drift')
    payload = {
        'schema_version': 'are.g02-r7-requirement-exposed-freeze/v1',
        'status': 'frozen-before-model-dispatch',
        'posture': 'r7-evaluator-exposed-but-performance-unseen-development-task',
        'source_selection': 'r7 Ansible ordinal 17: issue text names safe_eval, AnsibleModule.safe_eval, check_type_dict, deprecation and preserved dictionary inputs; no gold path or model score used for task selection.',
        'instance_id': TASK_ID, 'base_commit': COMMIT, 'task_sha256': TASK_SHA,
        'arm_roots': {arm: str(root) for arm, root in ROOTS.items()},
        'input_sha256': {str(path): digest for path, digest in EXPECTED.items()},
        'ranker_sha256': RANKERS,
        'freeze_script_sha256': sha(__file__),
        'changed_setting': 'Generic API-consumer, distinct requirement preservation, and narrow span instruction.',
        'one_attempt_per_arm_no_retry': True,
        'quality': ['native File-F1', 'native Span-F1'],
        'efficiency': ['known model tokens', 'arm duration'],
        'claim_ceiling': 'One development task; no prospective cohort, matched DSH or superiority.',
        'open_questions': ['Will both ARE arms finish with valid selections?',
                           'Does the instruction improve both quality metrics without erasing efficiency?'],
    }
    OUTPUT.parent.mkdir(mode=0o700, exist_ok=False)
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': payload['status'], 'sha256': sha(OUTPUT)}))


if __name__ == '__main__':
    main()
