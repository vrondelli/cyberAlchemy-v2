#!/usr/bin/env python3
"""Freeze the two prepared r6 exposed ARE arms before either GLM request."""

import hashlib
import json
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
ROOTS = {
    'baseline': Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr6-api-transfer-base-02'),
    'api_contract': Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr6-api-transfer-candidate-01'),
}
OUTPUT = BASE / 'g02-r6-api-transfer-exposed-r1/FREEZE.json'
EXPECTED = {
    ROOTS['baseline'] / 'FREEZE.json': '6dbc2e6c83da00d860acf4bd96ed782a61745e18ba01923d6e29b825660b205a',
    ROOTS['baseline'] / 'tasks/binding.json': '900bb2ccbbf60b8b4b9fae7531c582cc6a61edd3981cc9548442a19c09aa5958',
    ROOTS['api_contract'] / 'FREEZE.json': '39177f7f0b612cc0a90781f7704d0360b159b78a97d7376ab42371fa832ed667',
    ROOTS['api_contract'] / 'tasks/binding.json': '9e39c475a6fda0d0dba1c076cfd4a5d9acc2337db7ecbf72238fc1f0f9b9852a',
    BASE / 'g02-r6-api-transfer-tools-r1/API-TRANSFER-TOOLS.json': '410195055f17592f4ed1070d6724d6628ee705ed35578bf5e9a1e9868d66483e',
}
TASK_ID = 'SWE-Bench-Pro__python__maintenance__bugfix__18d7bbbc'
COMMIT = 'e094d48b1bdd93cbc189f416543e810c19b2e561'
TASK_SHA = '4cf8b98745e0b7d2f092a478ac3a29849bc0ea68b409ca2d8b1dabc843f88173'
RANKERS = {
    'baseline': '70ce7350ff6029bac290fe5f542ab6a2fef9a37a999f858451441f3a6139a9ce',
    'api_contract': 'c5ed4b1ddbf29fff95a80db129da11727d711a2306ac42d1602a6190e3c5a582',
}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    if OUTPUT.exists() or any(sha(path) != digest for path, digest in EXPECTED.items()):
        raise ValueError('g02-r6-api-transfer.freeze-input-drift')
    for arm, root in ROOTS.items():
        if (root / 'evidence').exists() or (root / 'ARE-STARTED.json').exists():
            raise ValueError('g02-r6-api-transfer.pre-dispatch-order')
        prepared = json.loads((root / 'FREEZE.json').read_text())
        binding = json.loads((root / 'tasks/binding.json').read_text())
        if prepared['instance_id'] != TASK_ID or binding['instance_id'] != TASK_ID or \
                binding['base_commit'] != COMMIT or binding['task_sha256'] != TASK_SHA or \
                prepared['source_hashes']['code/ranked-source-acquisition.mjs'] != RANKERS[arm]:
            raise ValueError('g02-r6-api-transfer.arm-binding-drift')
    payload = {
        'schema_version': 'are.g02-r6-api-transfer-exposed-freeze/v1',
        'status': 'frozen-before-model-dispatch',
        'posture': 'evaluator-exposed-development-only',
        'instance_id': TASK_ID, 'base_commit': COMMIT, 'task_sha256': TASK_SHA,
        'arm_roots': {name: str(root) for name, root in ROOTS.items()},
        'input_sha256': {str(path): digest for path, digest in EXPECTED.items()},
        'ranker_sha256': RANKERS,
        'freeze_script_sha256': sha(__file__),
        'changed_setting': 'Generic API-contract search/read/verification instruction only.',
        'one_attempt_per_arm_no_retry': True,
        'primary_quality': ['native File-F1', 'native Span-F1'],
        'efficiency': ['known model tokens', 'arm duration'],
        'claim_ceiling': 'One evaluator-exposed task, not independent transfer or superiority.',
        'open_questions': ['Does the instruction improve acquisition, selection and cost on this task?',
                           'Will any gain transfer prospectively?'],
    }
    OUTPUT.parent.mkdir(mode=0o700, exist_ok=False)
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': payload['status'], 'sha256': sha(OUTPUT)}))


if __name__ == '__main__':
    main()
