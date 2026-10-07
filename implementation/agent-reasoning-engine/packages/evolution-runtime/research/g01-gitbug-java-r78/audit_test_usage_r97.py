#!/usr/bin/env python3
"""Evaluator-only coverage audit for sealed failing-test usage candidates."""

import argparse
import hashlib
import json
import os
from pathlib import Path


ARCHIVE = Path('/home/vlad_/are-benchmark-archive')
CONFIG = {
    'gitbug': {
        'root': ARCHIVE / 'gitbug-java-metadata-preflight-20261005',
        'seal_sha': 'b1a923cfbe4bcba578e301a6f209f95e86c1203d845e8e4a6e4092887771195a',
        'gold': 'evaluator-only-dev-r82/DEV-LABEL-RESULT.json',
        'gold_sha': '63ebd2880c6f12304052db8d83705afaf2dcab6e9136f4807c359a90cd51572f',
        'key': 'results', 'cases': 12,
    },
    'bears': {
        'root': ARCHIVE / 'bears-metadata-preflight-r73-20261005',
        'seal_sha': '84943b0660996702c2b89c7c0cf7aa860636d6529fe6a547a918c770e94dce6b',
        'gold': 'evaluator-only-r77/EVALUATION-RESULT.json',
        'gold_sha': '44bfee25a52adce3df5dbd449f218eb404ff1a00cae3199bfe9628620070f642',
        'key': 'rows', 'cases': 24,
    },
}


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
    seal_path = cfg['root'] / 'test-usage-screen-r96/SOURCE-SEAL.json'
    gold_path = cfg['root'] / cfg['gold']
    output = cfg['root'] / 'test-usage-screen-r96/EVALUATOR-AUDIT.json'
    if output.exists() or sha(seal_path) != cfg['seal_sha'] or sha(gold_path) != cfg['gold_sha']:
        raise SystemExit('output-exists-or-input-drift')
    source = json.loads(seal_path.read_text())
    labels = json.loads(gold_path.read_text())[cfg['key']]
    if len(source['rows']) != cfg['cases'] or len(labels) != cfg['cases']:
        raise SystemExit('cohort-shape')
    rows = []
    for candidate, label in zip(source['rows'], labels):
        ordinal = candidate['ordinal']
        if candidate['repo'] != label['repo'] or ordinal != label['ordinal']:
            raise SystemExit(f'identity-drift:{ordinal}')
        if args.population == 'gitbug' and not label['admissible']:
            raise SystemExit(f'inadmissible-label:{ordinal}')
        paths = [item['path'] for item in candidate['ranked_usage_candidates']]
        gold = set(label['gold_paths'])
        rows.append({'ordinal': ordinal, 'repo': candidate['repo'],
                     'failing_method_refs': candidate['failing_method_refs'],
                     'resolved_method_refs': candidate['resolved_method_refs'],
                     'candidates': len(paths),
                     'top3_gold': bool(gold & set(paths[:3])),
                     'top10_gold': bool(gold & set(paths[:10])),
                     'any_gold': bool(gold & set(paths))})
    summary = {'cases': len(rows),
               'resolved_cases': sum(row['resolved_method_refs'] > 0 for row in rows),
               'candidate_cases': sum(row['candidates'] > 0 for row in rows),
               'top3_gold_cases': sum(row['top3_gold'] for row in rows),
               'top10_gold_cases': sum(row['top10_gold'] for row in rows),
               'any_gold_cases': sum(row['any_gold'] for row in rows)}
    gate = source['screen_gate']
    passed = (summary['top3_gold_cases'] >= gate['top3_gold_cases_min']
              and summary['top10_gold_cases'] >= gate['top10_gold_cases_min'])
    result = {'schema_version': 'are.g01-java-test-usage-audit-r97/v1',
              'posture': 'evaluator-only-exposed-candidate-coverage',
              'population': args.population,
              'input_sha256': {str(seal_path): cfg['seal_sha'], str(gold_path): cfg['gold_sha']},
              'script_sha256': sha(Path(__file__)), 'gate': gate,
              'gate_pass': passed, 'summary': summary, 'rows': rows,
              'claim_ceiling': 'Exposed source candidate coverage only; no full rank, independent transfer, or superiority.'}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'population': args.population, 'summary': summary,
                      'gate_pass': passed, 'sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
