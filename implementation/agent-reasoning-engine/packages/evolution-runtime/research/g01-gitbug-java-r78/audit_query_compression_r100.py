"""Evaluator-only matched audit of the sealed exposed Java r99 rankings.

No source ranking is recomputed here; no confirmation case or model is used.
Open question: can any robust cross-population source rule qualify for a fresh
Java confirmation run against strong matched comparators?
"""

import argparse
import hashlib
import json
import os
import random
from pathlib import Path, PurePosixPath


ROOT = Path('/home/vlad_/are-benchmark-archive')
INPUTS = {
    'gitbug': {
        'rank': (ROOT / 'gitbug-java-metadata-preflight-20261005/query-compression-r99/RANKINGS.jsonl',
                 '8250a6c04ad4f72baff099b246f964d85c43365669789338fbb0b99994112213'),
        'freeze': (ROOT / 'gitbug-java-metadata-preflight-20261005/query-compression-r99/RANKING-FREEZE.json',
                   '780e012746ee229d625d53c9f012c83bc154de7d36f6167363b332534c3a6298'),
        'label': (ROOT / 'gitbug-java-metadata-preflight-20261005/evaluator-only-dev-r82/DEV-LABEL-RESULT.json',
                  '63ebd2880c6f12304052db8d83705afaf2dcab6e9136f4807c359a90cd51572f'),
        'count': 12,
    },
    'bears': {
        'rank': (ROOT / 'bears-metadata-preflight-r73-20261005/query-compression-r99/RANKINGS.jsonl',
                 '7a67b7fb2ff6f5dcbb668103d5ffc109182f359b94df20ff84ef46b9cb5998b4'),
        'freeze': (ROOT / 'bears-metadata-preflight-r73-20261005/query-compression-r99/RANKING-FREEZE.json',
                   '047a8fa596e4b4dbf9ba9b0232c67ab8ec8930a7ff7cb4c55d573b8611e8f470'),
        'label': (ROOT / 'bears-metadata-preflight-r73-20261005/evaluator-only-label-r76/LABEL-RESULT.json',
                  '1ec15024bda4e39528c6e9971d6911569e4e38431f94ed700d0319032ef11460'),
        'count': 24,
    },
}
ARMS = ('raw_original', 'raw_reduced', 'raw_mix', 'are_raw',
        'are_reduced_mix_safe', 'raw_symbol_reduced')


def sha(data):
    return hashlib.sha256(data).hexdigest()


def pinned(pair):
    path, expected = pair
    data = path.read_bytes()
    if sha(data) != expected:
        raise SystemExit(f'input-drift:{path}')
    return data


def production(path):
    return not {'test', 'tests'} & set(PurePosixPath(path).parts)


def rr8(rank, gold):
    filtered = [path for path in rank if production(path)]
    if not gold <= set(filtered):
        raise SystemExit('gold-excluded-by-production-filter')
    first = min(filtered.index(path) + 1 for path in gold)
    return {'first_rank': first, 'rr8': 1 / first if first <= 8 else 0,
            'hit3': int(first <= 3), 'recall20': len(gold & set(filtered[:20])) / len(gold)}


def bootstrap(values, seed):
    rng = random.Random(seed)
    means = []
    for _ in range(10000):
        means.append(sum(values[rng.randrange(len(values))] for _ in values) / len(values))
    means.sort()
    return [means[249], means[9749]]


def cohort(name):
    cfg = INPUTS[name]
    ranks = [json.loads(line) for line in pinned(cfg['rank']).splitlines()]
    freeze = json.loads(pinned(cfg['freeze']))
    labels = json.loads(pinned(cfg['label']))['results']
    if len(ranks) != cfg['count'] or len(labels) != cfg['count'] or freeze['cases'] != cfg['count']:
        raise SystemExit(f'denominator:{name}')
    rows = []
    for ordinal, (rank, label) in enumerate(zip(ranks, labels, strict=True), 1):
        if not (rank['ordinal'] == ordinal and
                (label['ordinal'] if name == 'gitbug' else label['selection_ordinal']) == ordinal and
                rank['repo'] == label['repo'] and label['admissible']):
            raise SystemExit(f'case-binding:{name}:{ordinal}')
        gold = set(label['gold_paths'])
        if not gold:
            raise SystemExit(f'empty-gold:{name}:{ordinal}')
        scores = {arm: rr8(rank[arm], gold) for arm in ARMS}
        rows.append({'ordinal': ordinal, 'repo': rank['repo'], 'scores': scores})
    means = {arm: {metric: sum(row['scores'][arm][metric] for row in rows) / len(rows)
                   for metric in ('rr8', 'hit3', 'recall20')} for arm in ARMS}
    treatment = 'are_reduced_mix_safe'
    comparator = 'raw_symbol_reduced'
    delta = [row['scores'][treatment]['rr8'] - row['scores'][comparator]['rr8'] for row in rows]
    base_delta = [row['scores'][treatment]['rr8'] - row['scores']['are_raw']['rr8'] for row in rows]
    wins = sum(value > 0 for value in delta)
    losses = sum(value < 0 for value in delta)
    gate = freeze['development_gate']
    passed = (means[treatment]['rr8'] - means[comparator]['rr8'] >= gate['minimum_mrr8_gain_over_strongest_matched_comparator_each_population']
              and wins >= gate['minimum_wins_' + name]
              and means[treatment]['rr8'] >= means['are_raw']['rr8'])
    return {'cases': len(rows), 'means': means, 'treatment_minus_comparator_mrr8': sum(delta) / len(delta),
            'treatment_minus_are_raw_mrr8': sum(base_delta) / len(base_delta),
            'paired_95_interval_vs_comparator': bootstrap(delta, 9800 + len(rows)),
            'wins_vs_comparator': wins, 'ties_vs_comparator': len(rows) - wins - losses,
            'losses_vs_comparator': losses, 'gate': gate, 'gate_pass': passed, 'rows': rows}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    if args.out.exists():
        raise SystemExit('output-exists')
    results = {name: cohort(name) for name in ('gitbug', 'bears')}
    report = {'schema_version': 'g01.java-query-compression-audit-r100/v1',
              'posture': 'evaluator-only-exposed-development-no-confirmation',
              'script_sha256': sha(Path(__file__).read_bytes()),
              'input_digests': {name: {key: value[1] for key, value in cfg.items() if isinstance(value, tuple)}
                                for name, cfg in INPUTS.items()},
              'all_population_gate_pass': all(result['gate_pass'] for result in results.values()),
              'cohorts': results, 'model_calls': 0, 'confirmation_cases_opened': 0,
              'claim_ceiling': 'Exposed Java development only; no fresh transfer, product superiority, or publication.',
              'open_questions': ['Can a different failure-side reformulation generalize while beating strong matched baselines?']}
    encoded = (json.dumps(report, sort_keys=True, indent=2) + '\n').encode()
    args.out.parent.mkdir(parents=True, exist_ok=True)
    fd = os.open(args.out, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(encoded)
    print(json.dumps({'sha256': sha(encoded), 'all_population_gate_pass': report['all_population_gate_pass'],
                      'summary': {name: {key: result[key] for key in ('cases', 'treatment_minus_comparator_mrr8',
                                                                        'wins_vs_comparator', 'gate_pass')}
                                  for name, result in results.items()}}, sort_keys=True))


if __name__ == '__main__':
    main()
