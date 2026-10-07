#!/usr/bin/env python3
"""Evaluator-only matched ranking audit for exposed G01 import fusion."""

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath


ARCHIVE = Path('/home/vlad_/are-benchmark-archive')
CONFIG = {
    'gitbug': {
        'root': ARCHIVE / 'gitbug-java-metadata-preflight-20261005',
        'seal_sha': 'a2337124e021b4d9ea7a2d1dc586ec8a2da54fc26028c18ed26504b9bb525c55',
        'prior': 'dev-structure-r90/RANKINGS.jsonl',
        'prior_sha': '4f2c83cdef8897d053c9fc527ed1cb6fae235c16e2f64796fb2859bbc60276d1',
        'gold': 'evaluator-only-dev-r82/DEV-LABEL-RESULT.json',
        'gold_sha': '63ebd2880c6f12304052db8d83705afaf2dcab6e9136f4807c359a90cd51572f',
        'gold_key': 'results', 'count': 12,
    },
    'bears': {
        'root': ARCHIVE / 'bears-metadata-preflight-r73-20261005',
        'seal_sha': 'e5ee29449abf1b5f017cbba37b4a1cd918fe99d112a7a8edfd521a752ac94532',
        'prior': 'exposed-structure-r90/RANKINGS.jsonl',
        'prior_sha': '1ebeccb86a2fd489a9b1da9c4e1880fbf3a735d382c1950c701a4d41ba467578',
        'gold': 'evaluator-only-r77/EVALUATION-RESULT.json',
        'gold_sha': '44bfee25a52adce3df5dbd449f218eb404ff1a00cae3199bfe9628620070f642',
        'gold_key': 'rows', 'count': 24,
    },
}


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def score(rank, gold):
    first = min(rank.index(path) + 1 for path in gold)
    return {'first_rank': first, 'mrr8': 1 / first if first <= 8 else 0,
            'hit3': int(first <= 3),
            'recall20': sum(path in rank[:20] for path in gold) / len(gold)}


def production(rank):
    return [path for path in rank if 'test' not in PurePosixPath(path).parts
            and 'tests' not in PurePosixPath(path).parts]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--population', choices=sorted(CONFIG), required=True)
    args = parser.parse_args()
    cfg = CONFIG[args.population]
    seal_path = cfg['root'] / 'import-fusion-r94/SOURCE-SEAL.json'
    prior_path = cfg['root'] / cfg['prior']
    gold_path = cfg['root'] / cfg['gold']
    output = cfg['root'] / 'import-fusion-r94/EVALUATOR-AUDIT.json'
    pins = {seal_path: cfg['seal_sha'], prior_path: cfg['prior_sha'], gold_path: cfg['gold_sha']}
    if output.exists() or any(sha(path) != expected for path, expected in pins.items()):
        raise SystemExit('output-exists-or-input-drift')
    seal = json.loads(seal_path.read_text())
    prior = [json.loads(line) for line in prior_path.read_text().splitlines()]
    labels = json.loads(gold_path.read_text())[cfg['gold_key']]
    if any(len(rows) != cfg['count'] for rows in (seal['rows'], prior, labels)):
        raise SystemExit('cohort-shape')
    rows = []
    for new, old, label in zip(seal['rows'], prior, labels):
        ordinal = new['ordinal']
        if not (ordinal == old['ordinal'] == label['ordinal'] and
                new['repo'] == old['repo'] == label['repo']):
            raise SystemExit(f'identity-drift:{ordinal}')
        if args.population == 'gitbug' and not label['admissible']:
            raise SystemExit(f'inadmissible-label:{ordinal}')
        gold = set(label['gold_paths'])
        rankings = {
            'strong_prior': old['strong_raw_symbol_structure'],
            'treatment_prior': old['treatment_safe'],
            'strong_import': new['strong_import'],
            'treatment_import': new['treatment_import'],
        }
        if any(set(rank) != set(old['treatment_safe']) for rank in rankings.values()):
            raise SystemExit(f'universe-drift:{ordinal}')
        scored = {}
        for arm, rank in rankings.items():
            rank = production(rank)
            if not gold <= set(rank):
                raise SystemExit(f'production-gold-exclusion:{ordinal}')
            scored[arm] = score(rank, gold)
        rows.append({'ordinal': ordinal, 'repo': new['repo'], 'scores': scored})
    mean = lambda arm, metric: sum(row['scores'][arm][metric] for row in rows) / len(rows)
    arms = ('strong_prior', 'treatment_prior', 'strong_import', 'treatment_import')
    summary = {'cases': len(rows),
               'arms': {arm: {metric: mean(arm, metric) for metric in ('mrr8', 'hit3', 'recall20')}
                        for arm in arms}}
    differences = {}
    for comparator in ('strong_import', 'treatment_prior'):
        deltas = [row['scores']['treatment_import']['mrr8'] - row['scores'][comparator]['mrr8']
                  for row in rows]
        differences[comparator] = {'mean_mrr8': sum(deltas) / len(deltas),
                                   'wins': sum(delta > 0 for delta in deltas),
                                   'ties': sum(delta == 0 for delta in deltas),
                                   'losses': sum(delta < 0 for delta in deltas)}
    gate = seal['exploratory_gate']
    passed = (differences['strong_import']['mean_mrr8'] >= gate['treatment_minus_matched_strong_mrr8_min_each_population']
              and differences['treatment_prior']['mean_mrr8'] >= gate['treatment_minus_prior_safe_mrr8_min_each_population']
              and differences['strong_import']['wins'] >= gate[f'treatment_vs_strong_wins_min_{args.population}'])
    report = {'schema_version': 'are.g01-java-import-fusion-audit-r95/v1',
              'posture': 'evaluator-only-post-hoc-exposed-matched-rank',
              'population': args.population,
              'input_sha256': {str(path): digest for path, digest in pins.items()},
              'script_sha256': sha(Path(__file__)), 'gate': gate,
              'gate_pass': passed, 'summary': summary, 'differences': differences,
              'rows': rows,
              'claim_ceiling': 'Exposed post-hoc matched ranking only; no independent superiority.'}
    data = (json.dumps(report, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'population': args.population, 'summary': summary,
                      'differences': differences, 'gate_pass': passed,
                      'sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
