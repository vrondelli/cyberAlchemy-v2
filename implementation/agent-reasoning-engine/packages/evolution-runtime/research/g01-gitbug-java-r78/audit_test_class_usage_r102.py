"""Evaluator-only reach audit after r101 source rankings were sealed.

This is exposed development. It cannot justify opening the GitBug holdout by
itself, and it does not execute a full matched rank or call a model.
Open question: can a qualifying candidate edge preserve early-rank precision?
"""

import argparse
import hashlib
import json
import os
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive')
CONFIG = {
    'gitbug': {
        'screen': (ROOT / 'gitbug-java-metadata-preflight-20261005/test-class-usage-r101/SOURCE-SEAL.json',
                   '2b779761cf6c9843836577e148ddf7d55a593633fe58f112ea4531e0521a326f'),
        'labels': (ROOT / 'gitbug-java-metadata-preflight-20261005/evaluator-only-dev-r82/DEV-LABEL-RESULT.json',
                   '63ebd2880c6f12304052db8d83705afaf2dcab6e9136f4807c359a90cd51572f'),
        'count': 12,
    },
    'bears': {
        'screen': (ROOT / 'bears-metadata-preflight-r73-20261005/test-class-usage-r101/SOURCE-SEAL.json',
                   '749262d2e8f013b4344a656f55e89490b5eddcaa446461b8d6a3c36c8eb488ed'),
        'labels': (ROOT / 'bears-metadata-preflight-r73-20261005/evaluator-only-label-r76/LABEL-RESULT.json',
                   '1ec15024bda4e39528c6e9971d6911569e4e38431f94ed700d0319032ef11460'),
        'count': 24,
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
    screen = load(cfg['screen'])
    labels = load(cfg['labels'])['results']
    output = cfg['screen'][0].parent / 'COVERAGE-AUDIT.json'
    if output.exists() or len(screen['rows']) != cfg['count'] or len(labels) != cfg['count']:
        raise SystemExit('output-exists-or-denominator-drift')
    rows = []
    for ordinal, (row, label) in enumerate(zip(screen['rows'], labels, strict=True), 1):
        label_ordinal = label['ordinal'] if args.population == 'gitbug' else label['selection_ordinal']
        if not (row['ordinal'] == label_ordinal == ordinal and row['repo'] == label['repo'] and label['admissible']):
            raise SystemExit(f'case-binding:{ordinal}')
        gold = set(label['gold_paths'])
        candidates = [item['path'] for item in row['ranked_usage_candidates']]
        if not gold or len(candidates) != len(set(candidates)):
            raise SystemExit(f'candidate-or-gold:{ordinal}')
        top3, top10 = set(candidates[:3]), set(candidates[:10])
        prior3, prior10 = set(row['prior_import_top10'][:3]), set(row['prior_import_top10'])
        rows.append({'ordinal': ordinal, 'repo': row['repo'], 'candidate_count': len(candidates),
                     'top3_hit': int(bool(top3 & gold)), 'top10_hit': int(bool(top10 & gold)),
                     'prior_import_top3_hit': int(bool(prior3 & gold)),
                     'prior_import_top10_hit': int(bool(prior10 & gold)),
                     'novel_top3_hit': int(bool((top3 - prior3) & gold)),
                     'novel_top10_hit': int(bool((top10 - prior10) & gold)),
                     'top10_gold_paths': sorted(top10 & gold)})
    summary = {key: sum(row[key] for row in rows) for key in ('top3_hit', 'top10_hit',
               'prior_import_top3_hit', 'prior_import_top10_hit', 'novel_top3_hit', 'novel_top10_hit')}
    gate = screen['coverage_gate']
    passed = (summary['top10_hit'] >= gate[args.population + '_top10_minimum']
              and summary['novel_top3_hit'] >= gate['novel_top3_outside_prior_import_top3_each_minimum'])
    report = {'schema_version': 'g01.java-test-class-usage-audit-r102/v1',
              'posture': 'evaluator-only-exposed-candidate-reach-no-model-or-confirmation',
              'population': args.population, 'cases': cfg['count'],
              'screen_sha256': cfg['screen'][1], 'labels_sha256': cfg['labels'][1],
              'script_sha256': sha(Path(__file__)), 'coverage_gate': gate,
              'gate_pass': passed, 'summary': summary, 'rows': rows,
              'claim_ceiling': 'Candidate reach only; no full ranking, paired quality, cost, transfer, or superiority.',
              'open_questions': ['Could a separately frozen fusion retain early precision on both exposed populations?']}
    encoded = (json.dumps(report, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(encoded)
    print(json.dumps({'population': args.population, 'gate_pass': passed,
                      'summary': summary, 'sha256': hashlib.sha256(encoded).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
