#!/usr/bin/env python3
"""Freeze a third BugsInPy cohort disjoint from r1 and r2b bugs and commits."""

from __future__ import annotations

import argparse
import collections
import hashlib
import json
from pathlib import Path


SOURCE_SHA256 = '5cf0241fa5d50118007f55e937ef0e74c7e7ea427c807f6819266378e7256523'
R1_SHA256 = '888952ed833231141fe3c9f86efd357a7f84bcbeeafdcdb790a775f6e9f7df33'
R2_SHA256 = '77774d6aeffe6d32dd5d12ad512086ef613384909fa853c169b49baf11e5743c'
SEED = b'are-g01-bugsinpy-rrf-confirm-r54\0'


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def order(value: str) -> str:
    return sha(SEED + value.encode())


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--r1-freeze', type=Path, required=True)
    parser.add_argument('--r2-freeze', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise SystemExit('r54.output-exists')
    pins = [(args.source, SOURCE_SHA256), (args.r1_freeze, R1_SHA256), (args.r2_freeze, R2_SHA256)]
    if any(sha(path.read_bytes()) != expected for path, expected in pins):
        raise SystemExit('r54.input-drift')
    source = [json.loads(line) for line in args.source.read_text().splitlines() if line.strip()]
    r1 = json.loads(args.r1_freeze.read_text())['selected']
    r2 = json.loads(args.r2_freeze.read_text())['selected']
    if len(source) != 312 or len(r1) != 24 or len(r2) != 24:
        raise SystemExit('r54.denominator-drift')
    prior = r1 + r2
    old_cases = {(row['repo'], row['bugid']) for row in prior}
    old_commits = {(row['repo'], row['buggy_commit_id']) for row in prior}
    by_repo: dict[str, list[dict]] = collections.defaultdict(list)
    for row in source:
        if (row['repo'], row['bugid']) not in old_cases and (row['repo'], row['buggy_commit_id']) not in old_commits:
            by_repo[row['repo']].append(row)
    eligible_repos = [repo for repo, cases in by_repo.items()
                      if len({row['buggy_commit_id'] for row in cases}) >= 2]
    repos = sorted(eligible_repos, key=order)[:12]
    if len(repos) != 12:
        raise SystemExit('r54.repository-denominator')
    selected = []
    for repo in repos:
        commits = set()
        for row in sorted(by_repo[repo], key=lambda item: order(repo + '/' + item['bugid'])):
            if row['buggy_commit_id'] in commits:
                continue
            selected.append(row)
            commits.add(row['buggy_commit_id'])
            if len(commits) == 2:
                break
        if len(commits) != 2:
            raise SystemExit('r54.commit-denominator')
    selected_cases = {(row['repo'], row['bugid']) for row in selected}
    selected_commits = {(row['repo'], row['buggy_commit_id']) for row in selected}
    if (len(selected) != 24 or selected_cases & old_cases or selected_commits & old_commits or
            len(selected_cases) != 24 or len(selected_commits) != 24):
        raise SystemExit('r54.disjointness')
    result = {
        'schema_version': 'are.g01-bugsinpy-rrf-confirm-r54-cohort-freeze/v1',
        'status': 'source-only-frozen-before-source-acquisition-packets-provider-or-gold',
        'population_cases': 312, 'cases': 24, 'repositories': 12,
        'selection_seed_sha256': sha(SEED),
        'selection_rule': 'exclude r1+r2b bugs and repo-commits; SHA256 seed order; 12 repositories; 2 distinct commits each',
        'input_sha256': {'population': SOURCE_SHA256, 'r1_freeze': R1_SHA256, 'r2_freeze': R2_SHA256},
        'excluded_prior_cases': 48,
        'selected': selected,
        'gold_patch_opened': False, 'fixed_output_opened': False, 'model_calls': 0,
        'claim_ceiling': 'Source-only cohort freeze; no ranking, score, superiority, or publication claim.',
    }
    args.output.parent.mkdir(parents=True, exist_ok=False)
    args.output.write_text(json.dumps(result, sort_keys=True, indent=2) + '\n')
    print(json.dumps({'cases': [f"{row['repo']}/{row['bugid']}" for row in selected],
                      'repositories': repos, 'freeze_sha256': sha(args.output.read_bytes())}, sort_keys=True))


if __name__ == '__main__':
    main()
