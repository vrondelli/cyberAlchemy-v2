"""Evaluator-only matched ranking audit of sealed r103 exposed Java fusion.

No ranking is changed after gold access. The untouched GitBug confirmation
block remains closed regardless of this exposed-development result.
Open question: can a qualified rule reproduce on a fresh Java cohort?
"""

import argparse
import hashlib
import json
import os
import random
from pathlib import Path, PurePosixPath


ROOT = Path('/home/vlad_/are-benchmark-archive')
CONFIG = {
    'gitbug': {
        'root': ROOT / 'gitbug-java-metadata-preflight-20261005',
        'seal': ('test-class-usage-fusion-r103/SOURCE-SEAL.json', '6995af3942febf9f0e53827f2f17cfd34fd4afd742d9d9668defb28ba855f8d3'),
        'prior': ('dev-structure-r90/RANKINGS.jsonl', '4f2c83cdef8897d053c9fc527ed1cb6fae235c16e2f64796fb2859bbc60276d1'),
        'labels': ('evaluator-only-dev-r82/DEV-LABEL-RESULT.json', '63ebd2880c6f12304052db8d83705afaf2dcab6e9136f4807c359a90cd51572f'),
        'count': 12,
    },
    'bears': {
        'root': ROOT / 'bears-metadata-preflight-r73-20261005',
        'seal': ('test-class-usage-fusion-r103/SOURCE-SEAL.json', '2d4892cfca921fdef8fa6c3310760ec703abeffcb937a3ef2bcfdb2c42b71c35'),
        'prior': ('exposed-structure-r90/RANKINGS.jsonl', '1ebeccb86a2fd489a9b1da9c4e1880fbf3a735d382c1950c701a4d41ba467578'),
        'labels': ('evaluator-only-label-r76/LABEL-RESULT.json', '1ec15024bda4e39528c6e9971d6911569e4e38431f94ed700d0319032ef11460'),
        'count': 24,
    },
}
ARMS = ('strong_prior', 'treatment_prior', 'strong_usage', 'treatment_usage')


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(root, pair):
    path = root / pair[0]
    if sha(path) != pair[1]:
        raise SystemExit(f'input-drift:{path}')
    return path


def score(rank, gold):
    filtered = [path for path in rank if not {'test', 'tests'} & set(PurePosixPath(path).parts)]
    if not gold <= set(filtered):
        raise SystemExit('gold-excluded-by-production-filter')
    first = min(filtered.index(path) + 1 for path in gold)
    return {'first_rank': first, 'mrr8': 1 / first if first <= 8 else 0,
            'hit3': int(first <= 3), 'recall20': len(gold & set(filtered[:20])) / len(gold)}


def interval(values, seed):
    rng = random.Random(seed)
    means = sorted(sum(values[rng.randrange(len(values))] for _ in values) / len(values)
                   for _ in range(10000))
    return [means[249], means[9749]]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--population', choices=CONFIG, required=True)
    args = parser.parse_args()
    cfg = CONFIG[args.population]
    paths = {name: load(cfg['root'], cfg[name]) for name in ('seal', 'prior', 'labels')}
    output = cfg['root'] / 'test-class-usage-fusion-r103/EVALUATOR-AUDIT.json'
    if output.exists():
        raise SystemExit('output-exists')
    sealed = json.loads(paths['seal'].read_text())
    prior = [json.loads(line) for line in paths['prior'].read_text().splitlines()]
    labels = json.loads(paths['labels'].read_text())['results']
    if any(len(rows) != cfg['count'] for rows in (sealed['rows'], prior, labels)):
        raise SystemExit('denominator-drift')
    rows = []
    for ordinal, (new, old, label) in enumerate(zip(sealed['rows'], prior, labels, strict=True), 1):
        label_ordinal = label['ordinal'] if args.population == 'gitbug' else label['selection_ordinal']
        if not (new['ordinal'] == old['ordinal'] == label_ordinal == ordinal
                and new['repo'] == old['repo'] == label['repo'] and label['admissible']):
            raise SystemExit(f'case-binding:{ordinal}')
        gold = set(label['gold_paths'])
        ranks = {'strong_prior': old['strong_raw_symbol_structure'],
                 'treatment_prior': old['treatment_safe'],
                 'strong_usage': new['strong_usage'],
                 'treatment_usage': new['treatment_usage']}
        if any(set(rank) != set(old['treatment_safe']) or len(rank) != len(old['treatment_safe'])
               for rank in ranks.values()):
            raise SystemExit(f'rank-universe:{ordinal}')
        rows.append({'ordinal': ordinal, 'repo': new['repo'],
                     'scores': {arm: score(rank, gold) for arm, rank in ranks.items()}})
    mean = lambda arm, metric: sum(row['scores'][arm][metric] for row in rows) / len(rows)
    arms = {arm: {metric: mean(arm, metric) for metric in ('mrr8', 'hit3', 'recall20')}
            for arm in ARMS}
    differences = {}
    for comparator in ('strong_usage', 'treatment_prior'):
        delta = [row['scores']['treatment_usage']['mrr8'] - row['scores'][comparator]['mrr8']
                 for row in rows]
        differences[comparator] = {'mean_mrr8': sum(delta) / len(delta),
                                   'wins': sum(value > 0 for value in delta),
                                   'ties': sum(value == 0 for value in delta),
                                   'losses': sum(value < 0 for value in delta),
                                   'paired_95_interval': interval(delta, 10400 + len(rows))}
    gate = sealed['exploratory_gate']
    passed = (differences['strong_usage']['mean_mrr8'] >= gate['treatment_minus_matched_strong_mrr8_min_each_population']
              and differences['treatment_prior']['mean_mrr8'] >= gate['treatment_minus_prior_safe_mrr8_min_each_population']
              and differences['strong_usage']['wins'] >= gate['treatment_vs_strong_wins_min_' + args.population])
    report = {'schema_version': 'g01.java-test-class-usage-audit-r104/v1',
              'posture': 'evaluator-only-post-hoc-exposed-full-matched-ranking',
              'population': args.population, 'cases': cfg['count'],
              'input_sha256': {name: cfg[name][1] for name in paths},
              'script_sha256': sha(Path(__file__)), 'gate': gate, 'gate_pass': passed,
              'arms': arms, 'differences': differences, 'rows': rows,
              'claim_ceiling': 'Exposed development result, not independent superiority or fresh transfer.',
              'open_questions': ['Would a separately fixed rule pass a fresh, source-admitted Java confirmation?']}
    encoded = (json.dumps(report, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(encoded)
    print(json.dumps({'population': args.population, 'gate_pass': passed,
                      'arms': arms, 'differences': differences,
                      'sha256': hashlib.sha256(encoded).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
