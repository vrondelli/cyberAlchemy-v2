#!/usr/bin/env python3
"""Source-ID-only audit of the preregistered ContextBench confirmation split."""
from collections import Counter
import hashlib
import importlib.util
import json
import os
from pathlib import Path

BASE = Path('/opt/are/evolution-runtime')
RUNS = Path('/opt/are-benchmark-runs')
ACCEPTANCE = BASE / 'g01-partition-exposure-r1/acceptance.json'
EXPOSURE = BASE / 'g01-span-refinement-tools-r3/audit-cross-branch-supply-r1.py'
R12_LABEL = BASE / 'g01-product-replication-r12/LABEL-LINEAGE-AUDIT.json'
R13_SCREEN = BASE / 'g01-r13-fresh-supply-screen-r1/GOLD-LINEAGE-ELIGIBILITY.json'
R13_R1 = BASE / 'g01-r13-clean-cohort-candidate-r1/COHORT-CANDIDATE.json'
R13_R2 = BASE / 'g01-r13-clean-cohort-candidate-r2/COHORT-CANDIDATE.json'
OUTPUT = BASE / 'g01-partition-exposure-r1/AUDIT.json'
PINS = {
    EXPOSURE: 'f2f5bcced7e056542e8f92e3ac0c3ed9bd117ba8c110d99918d185c88e3e8b6a',
    R12_LABEL: '8567b38dd0b661c44f6a5e91eb8a65c29a65cfbe3f87ee41ca9739f349801b0f',
    R13_SCREEN: '67adff14486363ab1216720a03c3a692fa6b93c4e381d7ddc90a8bec3da9e9bc',
    R13_R1: '86b3841d0169a2b339d483aad6f0e6e5e8993980c929f11128139f4ff1e04cc5',
    R13_R2: 'e2a7a96ab1da7de1e0e7dba26a19a82ae8661ae481cefad1f504209cadadfe1d',
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def id_sha(ids):
    return hashlib.sha256(('\n'.join(sorted(ids)) + '\n').encode()).hexdigest()


def main():
    if OUTPUT.exists() or any(sha(path) != digest for path, digest in PINS.items()):
        raise ValueError('output-exists-or-pinned-drift')
    acceptance = json.loads(ACCEPTANCE.read_text())
    if acceptance['benchmark_revision'] != '1436c28a8eb95496da4ea69ad458b9f8a8eb7d61':
        raise ValueError('benchmark-revision')
    development = set(acceptance['scope']['development_instances'])
    reserved = set(acceptance['scope']['reserved_confirmation_instances'])
    if len(development) != 903 or len(reserved) != 233 or development & reserved:
        raise ValueError('partition-shape')
    spec = importlib.util.spec_from_file_location('g01_exposure', EXPOSURE)
    exposure = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(exposure)
    g01_paths, g02_paths = exposure.manifest_paths(BASE, RUNS)
    probe = BASE / 'g01-post-r8-large-index-probe-r2/CONFIG.json'
    if probe not in g01_paths or json.loads(probe.read_text()).get('model_calls') != 0:
        raise ValueError('zero-task-probe-drift')
    g01_paths.remove(probe)
    g01 = set().union(*(exposure.ids_from_manifest(path, 'g01') for path in g01_paths))
    g02 = set().union(*(exposure.ids_from_manifest(path, 'g02') for path in g02_paths))
    r13 = set().union(*(set(row['instance_id'] for row in json.loads(path.read_text())['ordered_tasks'])
                        for path in (R13_R1, R13_R2)))
    screened = set()
    for receipt in json.loads(R12_LABEL.read_text())['screened_receipts']:
        path = Path(receipt['path'])
        if sha(path) != receipt['sha256']:
            raise ValueError('screen-receipt-drift')
        screened.update(row['instance_id'] for row in json.loads(path.read_text())['tasks'])
    screened.update(row['instance_id'] for row in json.loads(R13_SCREEN.read_text())['tasks'])
    exposed = g01 | g02 | r13
    by_partition = {}
    for name, ids in (('development', development), ('reserved_confirmation', reserved)):
        visible = ids & exposed
        screen_only = ids & screened - exposed
        by_partition[name] = {
            'total': len(ids), 'manifested_or_selected': len(visible),
            'g01_manifested': len(ids & g01), 'g02_manifested': len(ids & g02),
            'r13_selected': len(ids & r13), 'label_screened_not_selected': len(screen_only),
            'unexposed_and_unscreened': len(ids - exposed - screened),
            'exposed_id_set_sha256': id_sha(visible),
        }
    result = {
        'schema_version': 'are.g01-partition-exposure-audit/v1',
        'status': 'source-id-only-audit-no-model-no-gold',
        'acceptance_sha256': sha(ACCEPTANCE),
        'input_sha256': {str(path): digest for path, digest in PINS.items()},
        'partitions': by_partition, 'model_calls': 0, 'gold_loaded': False,
        'script_sha256': sha(Path(__file__)),
        'claim_ceiling': 'Exposure accounting only; previously exposed reserved rows are not untouched confirmation evidence',
        'open_questions': ['Does a separate future holdout with sufficient unexposed source population exist?',
                           'Which earlier uses of reserved rows were source-only versus model-scored?'],
    }
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(result, sort_keys=True, indent=2) + '\n').encode())
    print(json.dumps({'status': result['status'], 'partitions': by_partition,
                      'receipt_sha256': sha(OUTPUT)}, sort_keys=True))


if __name__ == '__main__':
    main()
