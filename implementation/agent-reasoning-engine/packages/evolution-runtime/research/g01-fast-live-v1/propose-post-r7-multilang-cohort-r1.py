#!/usr/bin/env python3
"""Score-blind 24-task G01 successor candidate from pinned eligibility bits."""

from collections import Counter
import hashlib
import importlib.util
import json
import os
from pathlib import Path

import pyarrow.parquet as pq


BASE = Path('/opt/are/evolution-runtime')
PARQUET = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream/data/full.parquet'
SUPPLY = BASE / 'g01-cross-branch-supply-after-r7-r1/SOURCE-SUPPLY-AUDIT.json'
EXPOSURE_SCRIPT = BASE / 'g01-span-refinement-tools-r3/audit-cross-branch-supply-r1.py'
OUTPUT = BASE / 'g01-post-r7-multilang-cohort-candidate-r1/COHORT-CANDIDATE.json'
EXPECTED_SUPPLY_SHA = '8e25f74d198ab76489676c3bbdd5f00d8e1efd5ccb68738ab4b48ef72ef54f09'
EXPECTED_EXPOSURE_SCRIPT_SHA = 'f2f5bcced7e056542e8f92e3ac0c3ed9bd117ba8c110d99918d185c88e3e8b6a'
EXPECTED_EXPOSURE_SET_SHA = '6e6610069179c525f30a6a66cfd5e6a3324e32c929e07ac30b0dc0a5c9622d2b'
EXPECTED_PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
SEED = 'are-g01-post-r7-five-language-score-blind-24-20260929'
QUOTAS = {'cpp': 5, 'java': 5, 'javascript': 5, 'python': 4, 'typescript': 5}
MAX_PER_REPO = 2
SOURCE_FIELDS = ('instance_id', 'original_inst_id', 'repo', 'repo_url', 'language',
                 'base_commit', 'problem_statement', 'source')
RECEIPTS = {
    'cpp': (BASE / 'g01-cpp-gold-lineage-http-r1/GOLD-LINEAGE-ELIGIBILITY.json',
            'a34f63dcc2244882285d922170da5b0e9deabd00e7a3d4dbba3fbd623ee8a780'),
    'java-python-typescript': (BASE / 'g01-multilang-gold-lineage-http-r1/GOLD-LINEAGE-ELIGIBILITY.json',
                               '5800babd4ccb6757ca9f1128807d6990fbbc9eea46157d875a0477a8f5d1afdb'),
    'serverless/serverless': (BASE / 'g01-r7-cgojs-gold-lineage-r1/serverless--serverless-GOLD-LINEAGE-ELIGIBILITY.json',
                              '8fb2d5fb1b935fae26bb8cf061781e14f38f03f815c23252aebd87c463bb3ae1'),
    'sveltejs/svelte': (BASE / 'g01-r7-cgojs-gold-lineage-r1/sveltejs--svelte-GOLD-LINEAGE-ELIGIBILITY.json',
                        'efd767a6871b45c807a15ee1aab2baba77d2d2064d84429787ba673c53018854'),
    'iamkun/dayjs': (BASE / 'g01-r7-cgojs-gold-lineage-r1/iamkun--dayjs-GOLD-LINEAGE-ELIGIBILITY.json',
                     'fb496d3d455ea1218e4bbfadefaeef3171e8e25f6717f58843654da05daa0373'),
    'prettier/prettier': (BASE / 'g01-r7-cgojs-gold-lineage-r1/prettier--prettier-GOLD-LINEAGE-ELIGIBILITY.json',
                         '35c12edbe30fe51ccd1bd8ecb3d5c6288079c069f90173974cd3af9b87283b1a'),
}


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def selection_key(identifier):
    return hashlib.sha256((SEED + '\0' + identifier).encode()).hexdigest(), identifier


def main():
    if sha(SUPPLY) != EXPECTED_SUPPLY_SHA or sha(EXPOSURE_SCRIPT) != EXPECTED_EXPOSURE_SCRIPT_SHA:
        raise ValueError('supply-or-exposure-script-drift')
    supply = json.loads(SUPPLY.read_text())
    if sha(PARQUET) != EXPECTED_PARQUET_SHA or supply['source_parquet_sha256'] != EXPECTED_PARQUET_SHA:
        raise ValueError('source-parquet-drift')
    spec = importlib.util.spec_from_file_location('g01_supply', EXPOSURE_SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    exposure = module.exposure(BASE, Path('/opt/are-benchmark-runs'))
    if exposure['digests']['union'] != EXPECTED_EXPOSURE_SET_SHA or exposure['counts']['union'] != 276:
        raise ValueError('cross-branch-exposure-drift')
    clean = {}
    for name, (path, expected_sha) in RECEIPTS.items():
        if sha(path) != expected_sha:
            raise ValueError(f'eligibility-receipt-drift:{name}')
        receipt = json.loads(path.read_text())
        if (receipt['posture'] != 'evaluator-only-no-model-no-scores' or
                receipt['gold_paths_or_content_exported'] is not False):
            raise ValueError(f'eligibility-receipt-shape:{name}')
        for row in receipt['tasks']:
            identifier = row['instance_id']
            if identifier in clean:
                raise ValueError('duplicate-screened-id')
            if row['gold_lineage_clean'] and identifier not in exposure['union']:
                clean[identifier] = row['repo']
    if len(clean) != 101:
        raise ValueError('clean-supply-count-drift')
    all_rows = pq.read_table(PARQUET, columns=list(SOURCE_FIELDS)).to_pylist()
    source = {row['instance_id']: row for row in all_rows}
    if len(source) != len(all_rows) or any(identifier not in source for identifier in clean):
        raise ValueError('source-join-drift')
    for identifier, repo in clean.items():
        if source[identifier]['repo'] != repo or source[identifier]['language'] not in QUOTAS:
            raise ValueError('source-eligibility-mismatch')
    selected = []
    available = Counter(source[identifier]['language'] for identifier in clean)
    for language, quota in QUOTAS.items():
        candidates = sorted((source[identifier] for identifier in clean
                             if source[identifier]['language'] == language),
                            key=lambda row: selection_key(row['instance_id']))
        by_repo = Counter()
        language_selected = []
        for row in candidates:
            if by_repo[row['repo']] >= MAX_PER_REPO:
                continue
            language_selected.append(row)
            by_repo[row['repo']] += 1
            if len(language_selected) == quota:
                break
        if len(language_selected) != quota:
            raise ValueError(f'insufficient-diverse-supply:{language}')
        selected.extend(language_selected)
    if (len(selected) != 24 or len({row['instance_id'] for row in selected}) != 24 or
            Counter(row['language'] for row in selected) != QUOTAS or
            max(Counter(row['repo'] for row in selected).values()) > MAX_PER_REPO or
            any(set(row) != set(SOURCE_FIELDS) for row in selected)):
        raise ValueError('candidate-shape')
    result = {'schema_version': 'are.g01-post-r7-multilang-source-only-candidate/v1',
              'status': 'preflight-only-not-frozen', 'seed': SEED,
              'language_quota': QUOTAS, 'max_tasks_per_repo': MAX_PER_REPO,
              'available_clean_by_language': dict(sorted(available.items())),
              'source_parquet_sha256': EXPECTED_PARQUET_SHA,
              'source_supply_sha256': EXPECTED_SUPPLY_SHA,
              'exposure_set_sha256': EXPECTED_EXPOSURE_SET_SHA,
              'eligibility_receipt_sha256': {name: expected for name, (_, expected) in RECEIPTS.items()},
              'ordered_tasks': selected,
              'task_id_set_sha256': hashlib.sha256(('\n'.join(sorted(row['instance_id'] for row in selected)) + '\n').encode()).hexdigest(),
              'source_commit_join_verified': True, 'gold_values_or_paths_used': False,
              'model_calls': 0, 'selector_sha256': sha(Path(__file__)),
              'claim_ceiling': 'Score-blind source-only candidate; not cache/index proof, protocol freeze, score, or superiority.',
              'open_questions': ['Do all 24 exact commits pass runner cache, Git-origin, and source-index preflight?',
                                 'Can the VPS retain raw evidence without deleting existing archives?',
                                 'Will same-account tokenizer and tiny generation preflights pass?']}
    if not OUTPUT.parent.is_dir() or OUTPUT.exists():
        raise ValueError('fresh-exact-output-required')
    descriptor = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'wb') as stream:
        stream.write((json.dumps(result, indent=2, sort_keys=True) + '\n').encode())
    print(json.dumps({'candidate_sha256': sha(OUTPUT), 'task_id_set_sha256': result['task_id_set_sha256'],
                      'tasks': len(selected), 'repositories': len({row['repo'] for row in selected}),
                      'by_language': dict(Counter(row['language'] for row in selected)),
                      'available_clean_by_language': result['available_clean_by_language']}, sort_keys=True))


if __name__ == '__main__':
    main()
