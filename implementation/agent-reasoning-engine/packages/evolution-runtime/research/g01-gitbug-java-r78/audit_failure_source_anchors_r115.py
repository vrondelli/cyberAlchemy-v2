"""Evaluator-only matched exposed ranking audit of sealed r114 arms.

Open question: whether any passing exposed policy transfers on untouched
repositories. This audit cannot establish independent superiority.
"""

import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive')
R104 = Path(__file__).with_name('audit_test_class_usage_r104.py')
R104_SHA = '9cf4d5040ca478d46fa925b84cd7c84f7a0a8712aa19dc984049fba0db2dc132'
SEALS = {
    'gitbug': ('4182cd900045ade0771e98ae69c4598f3b77d483f3d52aa52ce6afea6325b02b', 12),
    'bears': ('ca7efa8854eea5cbd4e5a4e629b73ee632ddddb36b9938d56327efa431ef0b89', 24),
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--population', choices=SEALS, required=True)
    args = parser.parse_args()
    if sha(R104) != R104_SHA:
        raise SystemExit('r104-evaluator-drift')
    spec = importlib.util.spec_from_file_location('r104_audit', R104)
    r104 = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(r104)
    cfg = r104.CONFIG[args.population]
    root = cfg['root']
    expected, count = SEALS[args.population]
    source_path = root / 'failure-anchor-selective-r114/SOURCE-SEAL.json'
    output = root / 'failure-anchor-selective-r114/EVALUATOR-AUDIT.json'
    if output.exists() or sha(source_path) != expected:
        raise SystemExit('output-exists-or-source-drift')
    prior_path = r104.load(root, cfg['prior'])
    label_path = r104.load(root, cfg['labels'])
    source = json.loads(source_path.read_text())
    prior = [json.loads(line) for line in prior_path.read_text().splitlines()]
    labels = json.loads(label_path.read_text())['results']
    if any(len(rows) != count for rows in (source['rows'], prior, labels)):
        raise SystemExit('denominator-drift')
    rows = []
    for ordinal, (new, old, label) in enumerate(zip(source['rows'], prior, labels, strict=True), 1):
        label_ordinal = label['ordinal'] if args.population == 'gitbug' else label['selection_ordinal']
        if not (new['ordinal'] == old['ordinal'] == label_ordinal == ordinal
                and new['repo'] == old['repo'] == label['repo'] and label['admissible']):
            raise SystemExit(f'case-binding:{ordinal}')
        gold = set(label['gold_paths'])
        ranks = {'strong_prior': old['strong_raw_symbol_structure'],
                 'treatment_prior': old['treatment_safe'],
                 'strong_anchor': new['strong_anchor'],
                 'treatment_anchor': new['treatment_anchor']}
        if any(len(rank) != len(old['treatment_safe']) or set(rank) != set(old['treatment_safe'])
               for rank in ranks.values()):
            raise SystemExit(f'rank-universe:{ordinal}')
        rows.append({'ordinal': ordinal, 'repo': new['repo'],
                     'scores': {arm: r104.score(rank, gold) for arm, rank in ranks.items()}})
    arms = tuple(rows[0]['scores'])
    means = {arm: {metric: sum(row['scores'][arm][metric] for row in rows) / count
                   for metric in ('mrr8', 'hit3', 'recall20')} for arm in arms}
    differences = {}
    for comparator in ('strong_anchor', 'treatment_prior'):
        delta = [row['scores']['treatment_anchor']['mrr8'] - row['scores'][comparator]['mrr8'] for row in rows]
        differences[comparator] = {'mean_mrr8': sum(delta) / count,
                                   'wins': sum(value > 0 for value in delta),
                                   'ties': sum(value == 0 for value in delta),
                                   'losses': sum(value < 0 for value in delta),
                                   'paired_95_interval': r104.interval(delta, 11500 + count)}
    gate = source['exploratory_gate']
    passed = (differences['strong_anchor']['mean_mrr8'] >= gate['treatment_minus_matched_strong_mrr8_min_each_population']
              and differences['treatment_prior']['mean_mrr8'] >= gate['treatment_minus_prior_safe_mrr8_min_each_population']
              and differences['strong_anchor']['wins'] >= gate['treatment_vs_strong_wins_min_' + args.population])
    report = {'schema_version': 'g01.java-failure-anchor-audit-r115/v1',
              'posture': 'evaluator-only-post-hoc-exposed-full-matched-ranking',
              'population': args.population, 'cases': count,
              'source_sha256': expected, 'r104_evaluator_sha256': R104_SHA,
              'script_sha256': sha(Path(__file__)), 'gate': gate, 'gate_pass': passed,
              'arms': means, 'differences': differences, 'rows': rows,
              'claim_ceiling': 'Exposed development only; no fresh transfer or superiority.',
              'open_questions': ['Can a separately fixed rule qualify on fresh Java repositories?']}
    encoded = (json.dumps(report, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(encoded)
    print(json.dumps({'population': args.population, 'gate_pass': passed,
                      'arms': means, 'differences': differences,
                      'sha256': hashlib.sha256(encoded).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
