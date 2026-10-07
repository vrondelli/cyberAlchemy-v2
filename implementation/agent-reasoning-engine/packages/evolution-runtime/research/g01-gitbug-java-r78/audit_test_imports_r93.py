#!/usr/bin/env python3
"""Evaluator-only coverage audit of sealed G01 Java test-import candidates."""

import argparse
import hashlib
import json
import os
from pathlib import Path


ARCHIVE = Path('/home/vlad_/are-benchmark-archive')
CONFIG = {
    'gitbug': {
        'root': ARCHIVE / 'gitbug-java-metadata-preflight-20261005',
        'seal_sha': 'fa10b3858d19c3c6e000a71588b5d125d266c1a6a765f06915ed5537f781edd8',
        'gold': 'evaluator-only-dev-r82/DEV-LABEL-RESULT.json',
        'gold_sha': '63ebd2880c6f12304052db8d83705afaf2dcab6e9136f4807c359a90cd51572f',
        'gold_key': 'results', 'count': 12,
    },
    'bears': {
        'root': ARCHIVE / 'bears-metadata-preflight-r73-20261005',
        'seal_sha': 'c17cc538a92e5bb61ca5128913abb109612a6fece74a5d27d04a16f7379b3118',
        'gold': 'evaluator-only-r77/EVALUATION-RESULT.json',
        'gold_sha': '44bfee25a52adce3df5dbd449f218eb404ff1a00cae3199bfe9628620070f642',
        'gold_key': 'rows', 'count': 24,
    },
}
GATE = {'gitbug': {'top3_gold_cases_min': 2, 'top10_gold_cases_min': 3},
        'bears': {'top3_gold_cases_min': 3, 'top10_gold_cases_min': 5}}


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--population', choices=sorted(CONFIG), required=True)
    args = parser.parse_args()
    cfg = CONFIG[args.population]
    seal_path = cfg['root'] / 'test-import-screen-r92/SOURCE-SEAL.json'
    gold_path = cfg['root'] / cfg['gold']
    # R93B is a write-once provenance repair: the initial GitBug audit used
    # this script before the Bears gold path was corrected. Preserve it.
    output = cfg['root'] / 'test-import-screen-r92/EVALUATOR-AUDIT-R93B.json'
    if (output.exists() or sha(seal_path) != cfg['seal_sha']
            or sha(gold_path) != cfg['gold_sha']):
        raise SystemExit('output-exists-or-input-drift')
    seal = json.loads(seal_path.read_text())
    gold = json.loads(gold_path.read_text())[cfg['gold_key']]
    if len(seal['rows']) != cfg['count'] or len(gold) != cfg['count']:
        raise SystemExit('cohort-shape')
    rows = []
    for item, label in zip(seal['rows'], gold):
        ordinal = item['ordinal']
        if label['ordinal'] != ordinal or label['repo'] != item['repo']:
            raise SystemExit(f'identity-drift:{ordinal}')
        if args.population == 'gitbug' and not label['admissible']:
            raise SystemExit(f'inadmissible-label:{ordinal}')
        expected = set(label['gold_paths'])
        paths = [entry['path'] for entry in item['ranked_import_candidates']]
        hits3 = expected.intersection(paths[:3])
        hits10 = expected.intersection(paths[:10])
        rows.append({'ordinal': ordinal, 'repo': item['repo'],
                     'candidates': len(paths), 'test_matches': item['matched_test_classes'],
                     'gold_size': len(expected), 'top3_hits': len(hits3),
                     'top10_hits': len(hits10), 'all_candidate_hits': len(expected & set(paths))})
    summary = {'cases': len(rows),
               'matched_test_cases': sum(row['test_matches'] > 0 for row in rows),
               'nonempty_candidate_cases': sum(row['candidates'] > 0 for row in rows),
               'top3_gold_cases': sum(row['top3_hits'] > 0 for row in rows),
               'top10_gold_cases': sum(row['top10_hits'] > 0 for row in rows),
               'all_candidate_gold_cases': sum(row['all_candidate_hits'] > 0 for row in rows)}
    gate = GATE[args.population]
    # Source-only screen admission is a coverage condition, not rank quality.
    passed = (summary['top3_gold_cases'] >= gate['top3_gold_cases_min']
              and summary['top10_gold_cases'] >= gate['top10_gold_cases_min'])
    result = {'schema_version': 'are.g01-java-test-import-audit-r93/v1',
              'posture': 'evaluator-only-exposed-candidate-coverage',
              'population': args.population,
              'input_sha256': {str(seal_path): cfg['seal_sha'], str(gold_path): cfg['gold_sha']},
              'script_sha256': sha(Path(__file__)),
              'gate': gate, 'gate_pass': passed,
              'summary': summary, 'rows': rows,
              'claim_ceiling': 'Exposed candidate coverage only; no matched ranking, independent transfer, or superiority.'}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'population': args.population, 'summary': summary,
                      'gate_pass': passed, 'sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
