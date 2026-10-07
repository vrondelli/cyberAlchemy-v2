#!/usr/bin/env python3
"""Freeze symmetric cache-access-repaired exposed ARE arms before dispatch."""

import hashlib
import json
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
ROOTS = {
    'baseline': Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr6-api-transfer-base-03'),
    'api_contract': Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr6-api-transfer-candidate-02'),
}
OUTPUT = BASE / 'g02-r6-api-transfer-exposed-r2/FREEZE.json'
EXPECTED = {
    ROOTS['baseline'] / 'FREEZE.json': 'e7a2ac4cee7980b0bf8aeeadc259771a3a9f9fe7f33b7da3f92d61088d5633c2',
    ROOTS['baseline'] / 'tasks/binding.json': '415e382c181226ca4d2924e50ee457c5c82213a4f2c17633578f9ced8c75d18c',
    ROOTS['api_contract'] / 'FREEZE.json': 'df4416333dbc9584285293fe60946adc5d30949962baed9b1c9cdeef855ceb8b',
    ROOTS['api_contract'] / 'tasks/binding.json': '9aebcadd84c4a2ab4186e9413a7421b30715b801a7df00d099d652b0ceaae0c2',
    BASE / 'g02-r6-api-transfer-baseline-tools-r2/TRANSFER-TOOLS-R2.json': '7d39eb67387a4fc80b7b847f2ebfae3b882f61bc7dfe1986e3ddf5f97bd8f4a5',
    BASE / 'g02-r6-api-transfer-candidate-tools-r2/TRANSFER-TOOLS-R2.json': '2c98b337ea0c63d9680b8409b9b73b129962182320e456fb31f1d4ba654e2c40',
}
RANKERS = {'baseline': '70ce7350ff6029bac290fe5f542ab6a2fef9a37a999f858451441f3a6139a9ce',
           'api_contract': 'c5ed4b1ddbf29fff95a80db129da11727d711a2306ac42d1602a6190e3c5a582'}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    if OUTPUT.exists() or any(sha(path) != digest for path, digest in EXPECTED.items()):
        raise ValueError('g02-r6-api-transfer-r2.freeze-input-drift')
    for arm, root in ROOTS.items():
        if (root / 'evidence').exists() or (root / 'ARE-STARTED.json').exists():
            raise ValueError('g02-r6-api-transfer-r2.pre-dispatch-order')
        prepared = json.loads((root / 'FREEZE.json').read_text())
        binding = json.loads((root / 'tasks/binding.json').read_text())
        if prepared['instance_id'] != 'SWE-Bench-Pro__python__maintenance__bugfix__18d7bbbc' or \
                binding['instance_id'] != prepared['instance_id'] or \
                binding['base_commit'] != 'e094d48b1bdd93cbc189f416543e810c19b2e561' or \
                binding['task_sha256'] != '4cf8b98745e0b7d2f092a478ac3a29849bc0ea68b409ca2d8b1dabc843f88173' or \
                prepared['source_hashes']['code/ranked-source-acquisition.mjs'] != RANKERS[arm]:
            raise ValueError('g02-r6-api-transfer-r2.arm-binding-drift')
    payload = {
        'schema_version': 'are.g02-r6-api-transfer-exposed-freeze/v2',
        'status': 'frozen-before-model-dispatch',
        'posture': 'evaluator-exposed-development-only',
        'arm_roots': {arm: str(root) for arm, root in ROOTS.items()},
        'input_sha256': {str(path): digest for path, digest in EXPECTED.items()},
        'ranker_sha256': RANKERS,
        'freeze_script_sha256': sha(__file__),
        'prior_zero-call_failure': '/tmp/are-g02-r4-runs/g02-cross-layer-pr6-api-transfer-base-02',
        'symmetric_harness_repair': 'Exact cache directory traversal and Git safe.directory for both arms.',
        'changed_setting_between_arms': 'Generic API-contract search/read/verification instruction only.',
        'one_attempt_per_arm_no_retry': True,
        'quality': ['native File-F1', 'native Span-F1'],
        'efficiency': ['known model tokens', 'arm duration'],
        'claim_ceiling': 'One evaluator-exposed task; no independent transfer or superiority.',
        'open_questions': ['Will both arms finish and what do native scores show?',
                           'Would any gain transfer to a distinct prospective task?'],
    }
    OUTPUT.parent.mkdir(mode=0o700, exist_ok=False)
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': payload['status'], 'sha256': sha(OUTPUT)}))


if __name__ == '__main__':
    main()
