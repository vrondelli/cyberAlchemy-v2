#!/usr/bin/env python3
"""Seal a fresh, source-only G02 r11 development pool before evaluator access."""

from collections import Counter
import hashlib
import importlib.util
import json
from pathlib import Path

import pyarrow.parquet as pq


BASE = Path('/opt/are/evolution-runtime')
RUNS = Path('/opt/are-benchmark-runs')
PARQUET = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream/data/full.parquet'
EXPOSURE = BASE / 'g01-span-refinement-tools-r3/audit-cross-branch-supply-r1.py'
ACCEPTANCE = BASE / 'g01-r14-dev-cap-r1/acceptance.json'
PRIOR = {
    BASE / 'g01-r14-clean-cohort-candidate-r1/COHORT-CANDIDATE.json':
        ('014c2cb62ac545b91adb123aa5a7494fb197d0e826effdad06217c3a48fa7845', 'ordered_tasks'),
    BASE / 'g02-r9-source-successor-r1/CANDIDATE.json':
        ('87527bcef71cdd6d4b99fd008b67379a846f592798e8e658d1ec27cf13ef9c10', 'ordered_tasks'),
    BASE / 'g02-r7-screening-pool-r1/POOL.json':
        ('156689120479c17f96ae0052fc5247af6dcae0b8f5bda69c6a7d9df43beafa62', 'ordered_pool'),
    BASE / 'g02-r8-screening-pool-r1/POOL.json':
        ('ff0eb2511efb20c5d86b13a391984782a98d309a7f911216a440833f595dc389', 'ordered_pool'),
    BASE / 'g02-r10-dev-pool-r1/POOL.json':
        ('6e2f76c4ed258ff5e21f7dabf81bb8794d60b4b628d24aa0e29525f9c35662e5', 'ordered_pool'),
}
PINS = {
    PARQUET: '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8',
    EXPOSURE: 'f2f5bcced7e056542e8f92e3ac0c3ed9bd117ba8c110d99918d185c88e3e8b6a',
    ACCEPTANCE: 'fc305d5e220dc73dc3f98b06ae9c8aa71c10b1f3adf9e9a52c72ee4e302b8171',
}
STRATA = (
    ('Pro', 'ansible/ansible', 14),
    ('Verified', 'django/django', 69),
    ('Verified', 'sympy/sympy', 28),
    ('Multi', 'nlohmann/json', 13),
)
POOL_PER_STRATUM = 8
TARGET_PER_STRATUM = 6
SEED = b'are-g02-r11-development-json-pool-v1\0'
OUTPUT = BASE / 'g02-r11-dev-pool-r1/POOL.json'


def sha(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def id_sha(ids):
    return hashlib.sha256(('\n'.join(sorted(ids)) + '\n').encode()).hexdigest()


def need(ok, reason):
    if not ok:
        raise ValueError('g02-r11-dev-pool.' + reason)


def main():
    need(not OUTPUT.exists() and not OUTPUT.parent.exists(), 'output-exists')
    for path, digest in PINS.items():
        need(path.is_file() and sha(path) == digest, 'pinned-input-drift:' + path.name)
    for path, (digest, _) in PRIOR.items():
        need(path.is_file() and sha(path) == digest, 'prior-input-drift:' + path.name)
    acceptance = json.loads(ACCEPTANCE.read_text())
    development = set(acceptance['scope']['development_instances'])
    reserved = set(acceptance['scope']['reserved_confirmation_instances'])
    need(len(development) == 903 and len(reserved) == 233 and not development & reserved and
         acceptance['dataset_sha256'] == PINS[PARQUET], 'partition-drift')

    spec = importlib.util.spec_from_file_location('g02_r11_exposure', EXPOSURE)
    exposure = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(exposure)
    g01, g02 = exposure.manifest_paths(BASE, RUNS)
    seen = set()
    bindings = []
    for branch, paths in (('g01', g01), ('g02', g02)):
        for path in paths:
            if branch == 'g01' and path.name == 'CONFIG.json':
                data = json.loads(path.read_text())
                if not data.get('tasks'):
                    need(data.get('model_calls') == 0, 'unbound-config:' + str(path))
                    continue
            ids = exposure.ids_from_manifest(path, branch)
            seen.update(ids)
            bindings.append({'branch': branch, 'path': str(path),
                             'sha256': sha(path), 'id_count': len(ids)})
    for path, (_, key) in PRIOR.items():
        rows = json.loads(path.read_text())[key]
        ids = {row['instance_id'] for row in rows}
        need(len(ids) == len(rows), 'prior-duplicate-id:' + str(path))
        seen.update(ids)
        bindings.append({'branch': 'prior-selected-or-screened', 'path': str(path),
                         'sha256': sha(path), 'id_count': len(ids)})

    rows = pq.read_table(PARQUET, columns=list(exposure.FIELDS)).to_pylist()
    by_id = {row['instance_id']: row for row in rows}
    need(len(rows) == len(by_id) == 1136 and development | reserved == set(by_id),
         'source-identity-drift')
    pools = []
    supply = {}
    for source, repo, expected_supply in STRATA:
        eligible = [row for row in rows if row['source'] == source and row['repo'] == repo and
                    row['instance_id'] in development and row['instance_id'] not in seen and
                    all(isinstance(row[key], str) and row[key] for key in exposure.FIELDS) and
                    len(row['base_commit']) == 40 and
                    all(char in '0123456789abcdef' for char in row['base_commit'])]
        eligible.sort(key=lambda row: (hashlib.sha256(
            SEED + source.encode() + b'\0' + repo.encode() + b'\0' +
            row['instance_id'].encode()).hexdigest(), row['instance_id']))
        supply[source + ':' + repo] = len(eligible)
        need(len(eligible) == expected_supply and len(eligible) >= POOL_PER_STRATUM,
             'supply-drift:' + source + ':' + repo)
        pools.append(eligible[:POOL_PER_STRATUM])
    chosen = []
    for rank in range(POOL_PER_STRATUM):
        for pool in pools:
            row = pool[rank]
            chosen.append({key: row[key] for key in exposure.FIELDS})
    ids = {row['instance_id'] for row in chosen}
    need(len(chosen) == len(ids) == 32 and ids <= development and not ids & (seen | reserved) and
         set(Counter(row['repo'] for row in chosen).values()) == {8}, 'pool-boundary')
    payload = {
        'schema_version': 'are.g02-r11-development-json-source-pool/v1',
        'status': 'source-only-pool-not-screened-frozen-or-dispatched',
        'source_sha256': PINS[PARQUET], 'acceptance_sha256': PINS[ACCEPTANCE],
        'exposure_auditor_sha256': PINS[EXPOSURE], 'exposure_bindings': bindings,
        'excluded_id_count': len(seen), 'excluded_id_set_sha256': id_sha(seen),
        'reserved_confirmation_excluded': len(reserved),
        'development_partition_size': len(development),
        'eligible_source_supply': supply,
        'selection': {
            'seed_hex': SEED.hex(), 'rank': 'SHA-256(seed, source, repo, instance_id)',
            'strata': [{'source': source, 'repo': repo, 'pool_size': POOL_PER_STRATUM,
                        'target_size': TARGET_PER_STRATUM} for source, repo, _ in STRATA],
            'order': 'round-robin by rank across four strata',
            'eligibility': 'Evaluator-only native-gold-nonempty bit for all 32 rows; choose first six true per stratum or fail. No gold paths, native scores, or replacement by observed outcome.',
            'change_from_r10': 'Multi/nlohmann JSON replaces exhausted Multi/Svelte; all 233 reserved-confirmation IDs and the full r10 screened pool are excluded.',
            'gold_or_score_used_to_form_pool': False,
        },
        'ordered_pool': [{'ordinal': i + 1, **row} for i, row in enumerate(chosen)],
        'script_sha256': sha(__file__), 'model_calls': 0,
        'claim_ceiling': 'Development-only source pool; no native eligibility, clone readiness, model, matched score, or superiority.',
        'open_questions': ['Can all four strata supply six native-nonempty tasks?',
                           'Can a fresh cohort pass exact arm clone/checkout before GLM dispatch?',
                           'Will a future 24/24 run clear both quality and efficiency gates?'],
    }
    OUTPUT.parent.mkdir(mode=0o700)
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': payload['status'], 'sha256': sha(OUTPUT),
                      'selected': len(chosen), 'supply': supply,
                      'reserved_excluded': len(reserved)}, sort_keys=True))


if __name__ == '__main__':
    main()
