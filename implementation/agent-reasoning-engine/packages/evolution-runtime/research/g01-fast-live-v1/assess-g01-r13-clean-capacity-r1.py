#!/usr/bin/env python3
"""Read-only, score-blind union of pre-r13 and fresh exact-base clean screens."""
from collections import Counter, defaultdict
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path

import pyarrow.parquet as pq

BASE = Path('/opt/are/evolution-runtime')
SCREEN = BASE / 'g01-r13-fresh-supply-screen-r1/screen-g01-r13-fresh-supply-r1.py'
MANIFEST = BASE / 'g01-r13-fresh-supply-screen-r1/SOURCE-ONLY-MANIFEST.json'
RESULT = BASE / 'g01-r13-fresh-supply-screen-r1/GOLD-LINEAGE-ELIGIBILITY.json'
INDEX_R12 = BASE / 'g01-r12-index-gold-coverage-r1/GOLD-INDEX-COVERAGE.json'
R42 = BASE / 'g01-r13-r42-source-qualification-r1/SOURCE-QUALIFICATION.json'
OUTPUT = BASE / 'g01-r13-clean-cohort-candidate-r1/COHORT-CANDIDATE.json'
SEED = 'are-g01-r13-five-language-origin-balanced-20261002'
QUOTAS = {'cpp': 2, 'java': 1, 'javascript': 1, 'typescript': 2, 'python': 18}
PINS = {SCREEN: 'f92d8bd039a7565e6bcd6007aeeac01fcf2b56cf12bce01e2e0d4b7360c55e6f',
        MANIFEST: '9a6ac987ad8d100584d782b33a3a240ecf5c479d8c402ce3aa550d46c57a20e6',
        RESULT: '67adff14486363ab1216720a03c3a692fa6b93c4e381d7ddc90a8bec3da9e9bc',
        INDEX_R12: 'd1d8bdf797463a31ea865ae381c17da410d0856083f99a84c00f39f2f4463ddd',
        R42: 'f781977e48e7f62d243b0c1c7b5dc2dbbc076d15eb2256108388c9b92bf68d96'}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--select', action='store_true')
    args = parser.parse_args()
    if any(sha(path) != digest for path, digest in PINS.items()):
        raise ValueError('fresh-screen-drift')
    spec = importlib.util.spec_from_file_location('r13_screen', SCREEN)
    screen = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(screen)
    selected, exposure_sha, screened_sha, invalid = screen.source_basis()
    manifest = json.loads(MANIFEST.read_text())
    result = json.loads(RESULT.read_text())
    ids = {row['instance_id'] for row in selected}
    if (manifest['ordered_tasks'] != selected or manifest['selector_sha256'] != PINS[SCREEN] or
            manifest['excluded_invalid_source_rows'] != invalid or
            manifest['exposure_set_sha256'] != exposure_sha or
            manifest['prior_screened_id_set_sha256'] != screened_sha or
            result['source_manifest_sha256'] != PINS[MANIFEST] or
            result['script_sha256'] != PINS[SCREEN] or result['model_calls'] != 0 or
            result['gold_paths_or_content_exported'] is not False or
            {row['instance_id'] for row in result['tasks']} != ids or len(result['tasks']) != len(ids)):
        raise ValueError('fresh-screen-shape')
    prior = json.loads(screen.LABEL.read_text())
    clean = set()
    for receipt in prior['screened_receipts']:
        path = Path(receipt['path'])
        if sha(path) != receipt['sha256']:
            raise ValueError('prior-screen-drift')
        clean.update(row['instance_id'] for row in json.loads(path.read_text())['tasks']
                     if row['gold_lineage_clean'] is True)
    fresh = {row['instance_id'] for row in result['tasks'] if row['gold_lineage_clean'] is True}
    if len(fresh) != result['summary']['clean'] or fresh & clean:
        raise ValueError('fresh-clean-count-or-overlap')
    exposure = screen.module(screen.EXPOSURE, 'r13_exposure_capacity')
    g01, g02 = exposure.manifest_paths(screen.BASE, screen.RUNS)
    probe = screen.BASE / 'g01-post-r8-large-index-probe-r2/CONFIG.json'
    if probe not in g01 or json.loads(probe.read_text()).get('model_calls') != 0:
        raise ValueError('zero-call-probe-drift')
    g01.remove(probe)
    seen = set().union(*(exposure.ids_from_manifest(path, 'g01') for path in g01),
                       *(exposure.ids_from_manifest(path, 'g02') for path in g02))
    if screen.id_sha(seen) != exposure_sha or fresh & seen:
        raise ValueError('exposure-drift')
    index = json.loads(INDEX_R12.read_text())
    excluded = {row['instance_id'] for row in index['rows']
                if row['excluded_gold_files'] or row['absent_gold_files']}
    if len(excluded) != 2:
        raise ValueError('r12-index-exclusion-drift')
    old_clean = clean - seen - excluded
    if len(old_clean) != 32 or screen.id_sha(old_clean) != json.loads(screen.CENSUS.read_text())['clean_unmanifested_id_set_sha256']:
        raise ValueError('prior-clean-census-drift')
    clean = old_clean | fresh
    source_rows = pq.read_table(screen.PARQUET, columns=list(screen.SOURCE_FIELDS)).to_pylist()
    source = {row['instance_id']: row for row in source_rows}
    if len(source) != len(source_rows) or not clean <= source.keys():
        raise ValueError('source-join-drift')
    by_origin = defaultdict(list)
    for identifier in clean:
        row = source[identifier]
        if not all(isinstance(row[field], str) and row[field] for field in screen.SOURCE_FIELDS):
            raise ValueError('clean-source-invalid')
        by_origin[row['repo_url']].append(row)
    capacity = {'status': 'read-only-clean-capacity', 'prior_clean': len(old_clean),
                      'fresh_clean': len(fresh), 'clean_total': len(clean),
                      'git_origins': len(by_origin),
                      'two_per_origin_capacity': sum(min(2, len(rows)) for rows in by_origin.values()),
                      'by_language': dict(sorted(Counter(row['language'] for row in source.values()
                                                         if row['instance_id'] in clean).items())),
                      'by_origin': [{'origin': origin, 'language': rows[0]['language'],
                                     'clean': len(rows), 'slots': min(2, len(rows))}
                                    for origin, rows in sorted(by_origin.items())],
                      'model_calls': 0, 'gold_paths_or_content_exported': False}
    if not args.select:
        print(json.dumps(capacity, sort_keys=True))
        return
    if OUTPUT.exists() or OUTPUT.parent.exists():
        raise ValueError('fresh-output-root-required')
    chosen = []
    origin_counts, repo_counts = Counter(), Counter()
    for language, quota in QUOTAS.items():
        origins = sorted((origin for origin, rows in by_origin.items()
                          if rows[0]['language'] == language),
                         key=lambda origin: (hashlib.sha256((SEED + '\0origin\0' + origin).encode()).hexdigest(), origin))
        ranked = {origin: sorted(by_origin[origin],
                                 key=lambda row: (hashlib.sha256((SEED + '\0task\0' + row['instance_id']).encode()).hexdigest(),
                                                  row['instance_id'])) for origin in origins}
        picked = 0
        for tier in (0, 1):
            for origin in origins:
                if tier >= len(ranked[origin]) or picked >= quota:
                    continue
                row = ranked[origin][tier]
                if origin_counts[origin] >= 2 or repo_counts[row['repo']] >= 2:
                    continue
                chosen.append(row)
                origin_counts[origin] += 1
                repo_counts[row['repo']] += 1
                picked += 1
        if picked != quota:
            raise ValueError('language-quota-capacity:' + language)
    chosen_ids = {row['instance_id'] for row in chosen}
    if (len(chosen) != 24 or len(chosen_ids) != 24 or chosen_ids & seen or
            max(origin_counts.values()) > 2 or max(repo_counts.values()) > 2):
        raise ValueError('candidate-shape')
    candidate = {'schema_version': 'are.g01-r13-clean-source-only-candidate/v1',
                 'status': 'preflight-only-not-frozen', 'seed': SEED,
                 'changed_population_from_r12': True, 'language_quota': QUOTAS,
                 'max_tasks_per_git_origin': 2, 'max_tasks_per_repository': 2,
                 'source_parquet_sha256': screen.PINS[screen.PARQUET],
                 'exposure_set_sha256': exposure_sha,
                 'r12_freeze_sha256': screen.PINS[screen.FREEZE],
                 'r42_source_qualification_sha256': PINS[R42],
                 'fresh_screen_manifest_sha256': PINS[MANIFEST],
                 'fresh_screen_receipt_sha256': PINS[RESULT],
                 'prior_screen_receipt_sha256':
                     {receipt['name']: receipt['sha256'] for receipt in prior['screened_receipts']},
                 'prior_index_exclusion_receipt_sha256': PINS[INDEX_R12],
                 'known_clean_unused_after_exclusions': len(clean),
                 'known_two_per_origin_capacity': capacity['two_per_origin_capacity'],
                 'ordered_tasks': chosen, 'task_id_set_sha256': screen.id_sha(chosen_ids),
                 'selected_git_origins': len(origin_counts),
                 'selected_repositories': len(repo_counts),
                 'selector_sha256': sha(Path(__file__)),
                 'gold_values_or_paths_used': False, 'model_calls': 0,
                 'claim_ceiling': 'Source-only five-language changed-population candidate; exact cache, index, native gold, storage, live score and superiority are unproven.',
                 'open_questions': ['Do all 24 exact caches, checkouts, and indexes pass?',
                                    'Does independent evaluator-only native-reference admission pass 24/24?',
                                    'Can a separate freeze, provider readiness, and matched run meet the strict claim gate?']}
    OUTPUT.parent.mkdir(mode=0o700)
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(candidate, sort_keys=True, indent=2) + '\n').encode())
    print(json.dumps({'status': candidate['status'], 'tasks': len(chosen),
                      'by_language': dict(Counter(row['language'] for row in chosen)),
                      'git_origins': candidate['selected_git_origins'],
                      'candidate_sha256': sha(OUTPUT),
                      'task_id_set_sha256': candidate['task_id_set_sha256'],
                      'model_calls': 0}, sort_keys=True))


if __name__ == '__main__':
    main()
