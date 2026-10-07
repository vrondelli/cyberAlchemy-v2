"""Evaluator-only exposed top-ten reach audit of sealed r112 screens.

Open question: can any incremental reach survive a matched ranking and
fresh confirmation? This audit does not answer that question.
"""

import argparse
import hashlib
import json
import os
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive')
CONFIG = {
    'gitbug': {
        'new': (ROOT / 'gitbug-java-metadata-preflight-20261005/failure-source-anchors-r112/SOURCE-SEAL.json',
                '875bc3e1fb94e6819bc538a50c8f0d4431f2bb70db0eb8d8ef6eefc65340ae0d'),
        'old': (ROOT / 'gitbug-java-metadata-preflight-20261005/test-class-usage-r101/SOURCE-SEAL.json',
                '2b779761cf6c9843836577e148ddf7d55a593633fe58f112ea4531e0521a326f'),
        'labels': (ROOT / 'gitbug-java-metadata-preflight-20261005/evaluator-only-dev-r82/DEV-LABEL-RESULT.json',
                   '63ebd2880c6f12304052db8d83705afaf2dcab6e9136f4807c359a90cd51572f'),
        'count': 12, 'minimum': 1,
    },
    'bears': {
        'new': (ROOT / 'bears-metadata-preflight-r73-20261005/failure-source-anchors-r112/SOURCE-SEAL.json',
                'a2f21a1368844ae2abf5a0144c1239c7fa931ec227273ca5406ee773dab1e0a8'),
        'old': (ROOT / 'bears-metadata-preflight-r73-20261005/test-class-usage-r101/SOURCE-SEAL.json',
                '749262d2e8f013b4344a656f55e89490b5eddcaa446461b8d6a3c36c8eb488ed'),
        'labels': (ROOT / 'bears-metadata-preflight-r73-20261005/evaluator-only-label-r76/LABEL-RESULT.json',
                   '1ec15024bda4e39528c6e9971d6911569e4e38431f94ed700d0319032ef11460'),
        'count': 24, 'minimum': 2,
    },
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(pair):
    path, expected = pair
    if sha(path) != expected:
        raise SystemExit(f'input-drift:{path}')
    return json.loads(path.read_text())


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--population', choices=CONFIG, required=True)
    args = parser.parse_args()
    cfg = CONFIG[args.population]
    new = load(cfg['new'])['rows']
    old = load(cfg['old'])['rows']
    labels = load(cfg['labels'])['results']
    output = cfg['new'][0].parent / 'COVERAGE-AUDIT.json'
    if output.exists() or any(len(rows) != cfg['count'] for rows in (new, old, labels)):
        raise SystemExit('output-exists-or-denominator-drift')
    rows = []
    for ordinal, (fresh, prior, label) in enumerate(zip(new, old, labels, strict=True), 1):
        label_ordinal = label['ordinal'] if args.population == 'gitbug' else label['selection_ordinal']
        if not (fresh['ordinal'] == prior['ordinal'] == label_ordinal == ordinal
                and fresh['repo'] == prior['repo'] == label['repo'] and label['admissible']):
            raise SystemExit(f'case-binding:{ordinal}')
        gold = set(label['gold_paths'])
        candidate_paths = [item['path'] for item in fresh['candidates']]
        if not gold or len(candidate_paths) != len(set(candidate_paths)):
            raise SystemExit(f'candidate-or-gold:{ordinal}')
        new10 = set(candidate_paths[:10])
        old10 = {item['path'] for item in prior['ranked_usage_candidates'][:10]}
        rows.append({'ordinal': ordinal, 'repo': fresh['repo'],
                     'candidate_count': len(candidate_paths), 'new_top10_hit': int(bool(new10 & gold)),
                     'old_top10_hit': int(bool(old10 & gold)),
                     'incremental_top10_case': int(bool(new10 & gold) and not bool(old10 & gold)),
                     'new_gold_paths': sorted(new10 & gold)})
    summary = {key: sum(row[key] for row in rows) for key in
               ('new_top10_hit', 'old_top10_hit', 'incremental_top10_case')}
    passed = summary['incremental_top10_case'] >= cfg['minimum']
    report = {'schema_version': 'g01.java-failure-source-anchor-audit-r113/v1',
              'posture': 'evaluator-only-exposed-candidate-reach-no-model-or-confirmation',
              'population': args.population, 'cases': cfg['count'],
              'input_sha256': {name: cfg[name][1] for name in ('new', 'old', 'labels')},
              'script_sha256': sha(Path(__file__)), 'minimum_incremental_top10_cases': cfg['minimum'],
              'gate_pass': passed, 'summary': summary, 'rows': rows,
              'claim_ceiling': 'Candidate reach only; no ranking, matched quality, transfer, or superiority.',
              'open_questions': ['Can a source-anchor candidate policy preserve early-rank precision?']}
    encoded = (json.dumps(report, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(encoded)
    print(json.dumps({'population': args.population, 'gate_pass': passed,
                      'summary': summary, 'sha256': hashlib.sha256(encoded).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
