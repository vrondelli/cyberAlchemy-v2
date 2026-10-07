#!/usr/bin/env python3
"""Freeze one exposed ARE-only API-consumer-instruction diagnostic."""

import hashlib
import json
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
ROOT = Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr8-mixed-api-contract-dev-01')
OUTPUT = BASE / 'g02-r8-api-contract-exposed-r1/FREEZE.json'
TOOLS = BASE / 'g02-r8-api-contract-dev-tools-r1'
R8 = BASE / 'g02-product-replication-r8/DEFINITION.json'
EXPECTED = {
    ROOT / 'FREEZE.json': '18964aaa9067ca376f40368cae6254dc2c3442fbb90b7f4895be502736aebecd',
    ROOT / 'tasks/binding.json': '9d666bacb30ffed2b3b4bc7d09e299f179e6cf9b85233b631ad4127a1932bbd6',
    TOOLS / 'API-CONTRACT-DEV-TOOLS.json': '3b177136eae025aadd78a13d4867c5a565af6bc998fe275218eb370a069c8431',
    R8: '20a60393c1125894965c759b3138c5997c55c9792fa752cc6506831aa602ae57',
}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    if OUTPUT.exists() or (ROOT / 'evidence').exists() or \
            any(sha(path) != digest for path, digest in EXPECTED.items()):
        raise ValueError('api-contract-freeze.input-or-output-drift')
    binding = json.loads((ROOT / 'tasks/binding.json').read_text())
    prepared = json.loads((ROOT / 'FREEZE.json').read_text())
    first = json.loads(R8.read_text())['ordered_pairs'][0]
    if binding['instance_id'] != first['instance_id'] or \
            binding['base_commit'] != first['base_commit'] or \
            prepared['instance_id'] != first['instance_id'] or \
            prepared['source_hashes']['code/ranked-source-acquisition.mjs'] != \
            'c5ed4b1ddbf29fff95a80db129da11727d711a2306ac42d1602a6190e3c5a582':
        raise ValueError('api-contract-freeze.identity-or-ranker-drift')
    payload = {
        'schema_version': 'are.g02-r8-api-contract-exposed-freeze/v1',
        'status': 'frozen-before-model-dispatch',
        'posture': 'exposed-ARE-only-development-not-r8-campaign-repair',
        'instance_id': first['instance_id'], 'base_commit': first['base_commit'],
        'root': str(ROOT), 'input_sha256': {str(p): d for p, d in EXPECTED.items()},
        'ranker_sha256': prepared['source_hashes']['code/ranked-source-acquisition.mjs'],
        'freeze_script_sha256': sha(__file__),
        'changed_setting': 'Generic issue-conditioned API-consumer search/read/verification instruction.',
        'unchanged': 'Source hints, 64 MiB index, ARE model/transport/context/token caps, deletion-only policy, native scorer.',
        'one_attempt_no_retry': True,
        'claim_ceiling': 'Exposed ARE-only mechanism test; no matched result, r8 repair or superiority.',
        'open_questions': ['Does ARE acquire missing relevant callers?',
                           'Does post-projection native quality improve at acceptable cost?'],
    }
    OUTPUT.parent.mkdir(mode=0o700, exist_ok=False)
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': payload['status'], 'sha256': sha(OUTPUT)}))


if __name__ == '__main__':
    main()
