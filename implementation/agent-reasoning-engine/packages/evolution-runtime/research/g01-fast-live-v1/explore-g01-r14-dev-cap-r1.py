#!/usr/bin/env python3
"""Read-only development-partition G01 clean-cap feasibility after r13."""
from collections import Counter, defaultdict
import hashlib
import importlib.util
import json
from pathlib import Path

import pyarrow.parquet as pq

BASE = Path('/opt/are/evolution-runtime')
RUNS = Path('/opt/are-benchmark-runs')
PARQUET = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream/data/full.parquet'
EXPOSURE = BASE / 'g01-span-refinement-tools-r3/audit-cross-branch-supply-r1.py'
R12_LABEL = BASE / 'g01-product-replication-r12/LABEL-LINEAGE-AUDIT.json'
R13_SCREEN = BASE / 'g01-r13-fresh-supply-screen-r1/GOLD-LINEAGE-ELIGIBILITY.json'
R13_R1 = BASE / 'g01-r13-clean-cohort-candidate-r1/COHORT-CANDIDATE.json'
R13_R2 = BASE / 'g01-r13-clean-cohort-candidate-r2/COHORT-CANDIDATE.json'
CENSUS = BASE / 'g01-post-r13-clean-supply-census-r1/CENSUS.json'
ACCEPTANCE = BASE / 'g01-r14-dev-cap-r1/acceptance.json'
OUTPUT = BASE / 'g01-r14-dev-cap-r1/RESULT.json'
PINS = {
    PARQUET: '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8',
    EXPOSURE: 'f2f5bcced7e056542e8f92e3ac0c3ed9bd117ba8c110d99918d185c88e3e8b6a',
    R12_LABEL: '8567b38dd0b661c44f6a5e91eb8a65c29a65cfbe3f87ee41ca9739f349801b0f',
    R13_SCREEN: '67adff14486363ab1216720a03c3a692fa6b93c4e381d7ddc90a8bec3da9e9bc',
    R13_R1: '86b3841d0169a2b339d483aad6f0e6e5e8993980c929f11128139f4ff1e04cc5',
    R13_R2: 'e2a7a96ab1da7de1e0e7dba26a19a82ae8661ae481cefad1f504209cadadfe1d',
    CENSUS: 'd74a2e95232bbb4d68d61f49e4600f9465d09400bf856ed82ec91446a63be320',
    ACCEPTANCE: 'fc305d5e220dc73dc3f98b06ae9c8aa71c10b1f3adf9e9a52c72ee4e302b8171',
}
FIELDS = ('instance_id', 'original_inst_id', 'repo', 'repo_url', 'language',
          'base_commit', 'problem_statement', 'source')


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def id_sha(ids):
    return hashlib.sha256(('\n'.join(sorted(ids)) + '\n').encode()).hexdigest()


def main():
    if any(sha(path) != digest for path, digest in PINS.items()):
        raise ValueError('pinned-input-drift')
    census = json.loads(CENSUS.read_text())
    acceptance = json.loads(ACCEPTANCE.read_text())
    dev = set(acceptance['scope']['development_instances'])
    reserve = set(acceptance['scope']['reserved_confirmation_instances'])
    if len(dev) != 903 or len(reserve) != 233 or dev & reserve or acceptance['dataset_sha256'] != PINS[PARQUET]:
        raise ValueError('partition-drift')
    spec = importlib.util.spec_from_file_location('g01_r14_exposure', EXPOSURE)
    exposure = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(exposure)
    g01, g02 = exposure.manifest_paths(BASE, RUNS)
    probe = BASE / 'g01-post-r8-large-index-probe-r2/CONFIG.json'
    if probe not in g01 or json.loads(probe.read_text()).get('model_calls') != 0:
        raise ValueError('zero-call-probe-drift')
    g01.remove(probe)
    seen = set().union(*(exposure.ids_from_manifest(path, 'g01') for path in g01),
                       *(exposure.ids_from_manifest(path, 'g02') for path in g02))
    seen.update(row['instance_id'] for path in (R13_R1, R13_R2)
                for row in json.loads(path.read_text())['ordered_tasks'])
    screened = {}
    for receipt in json.loads(R12_LABEL.read_text())['screened_receipts']:
        path = Path(receipt['path'])
        if sha(path) != receipt['sha256']:
            raise ValueError('prior-screen-drift')
        for row in json.loads(path.read_text())['tasks']:
            if row['instance_id'] in screened:
                raise ValueError('duplicate-screened-id')
            screened[row['instance_id']] = row['gold_lineage_clean'] is True
    for row in json.loads(R13_SCREEN.read_text())['tasks']:
        if row['instance_id'] in screened:
            raise ValueError('duplicate-r13-screen-id')
        screened[row['instance_id']] = row['gold_lineage_clean'] is True
    if len(screened) != census['screened_ids']:
        raise ValueError('screened-count-drift')
    rows = pq.read_table(PARQUET, columns=list(FIELDS)).to_pylist()
    by_id = {row['instance_id']: row for row in rows}
    if len(by_id) != len(rows) or not dev | reserve <= set(by_id):
        raise ValueError('source-id-drift')
    clean_ids = {qid for qid, clean in screened.items() if clean} - seen
    if (len(clean_ids) != census['clean_unexposed_ids'] or clean_ids & seen or
            id_sha(clean_ids) != census['clean_unexposed_id_set_sha256']):
        raise ValueError('clean-census-drift')
    clean, unscreened = defaultdict(list), defaultdict(list)
    for qid in clean_ids & dev:
        row = by_id[qid]
        clean[row['repo_url']].append(qid)
    for row in rows:
        qid = row['instance_id']
        if (qid not in dev or qid in seen or qid in screened or
                not all(isinstance(row[field], str) and row[field] for field in FIELDS) or
                len(row['base_commit']) != 40):
            continue
        unscreened[row['repo_url']].append(qid)
    origins = sorted(set(clean) | set(unscreened))
    by_origin = [{'origin': origin, 'known_clean_dev': len(clean[origin]),
                  'unscreened_source_valid_dev': len(unscreened[origin]),
                  'languages': dict(sorted(Counter(by_id[qid]['language'] for qid in clean[origin] + unscreened[origin]).items()))}
                 for origin in origins]
    capacities = {str(cap): {'known_clean_slots': sum(min(cap, len(clean[origin])) for origin in origins),
                             'all_unscreened_clean_upper_bound': sum(min(cap, len(clean[origin]) + len(unscreened[origin])) for origin in origins)}
                  for cap in range(2, 9)}
    result = {'schema_version': 'are.g01-r14-dev-partition-cap-census/v1',
              'status': 'read-only-source-only-development-partition-cap-census',
              'acceptance_sha256': PINS[ACCEPTANCE], 'source_sha256': PINS[PARQUET],
              'prior_census_sha256': PINS[CENSUS], 'script_sha256': sha(Path(__file__)),
              'excluded_reserved_ids': len(reserve), 'clean_dev': sum(map(len, clean.values())),
              'unscreened_source_valid_dev': sum(map(len, unscreened.values())),
              'by_origin': by_origin, 'capacities': capacities,
              'gold_loaded': False, 'model_calls': 0,
              'claim_ceiling': 'Feasibility bound only; no label, index, score, or superiority result',
              'open_questions': ['Can development-only unscreened rows supply ten additional clean cap-three slots?',
                                 'Which changed-population protocol can support both native F1 and efficiency qualification?']}
    with OUTPUT.open('x') as stream:
        json.dump(result, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': result['status'], 'clean_dev': result['clean_dev'],
                      'unscreened_source_valid_dev': result['unscreened_source_valid_dev'],
                      'capacities': capacities, 'receipt_sha256': sha(OUTPUT)}, sort_keys=True))


if __name__ == '__main__':
    main()
