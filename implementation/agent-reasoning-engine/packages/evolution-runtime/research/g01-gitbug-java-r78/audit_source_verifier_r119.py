"""Evaluator-only matched audit of sealed exposed r118 verifier rankings.

This cannot justify a fresh-confirmation or superiority claim by itself.
Open question: what distinct selector avoids invalid output and excess abstention?
"""

import hashlib
import importlib.util
import json
import os
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive')
SOURCE = ROOT / 'g01-java-source-verifier-r118/SOURCE-SEAL.json'
SOURCE_SHA = '4397354aaa4d7acf2f9f2c75c9b6c29f90be0e547cdc2f1895cbe96ce0a75fed'
OUTPUT = ROOT / 'g01-java-source-verifier-r119/EVALUATOR-AUDIT.json'
R104 = Path(__file__).with_name('audit_test_class_usage_r104.py')
R104_SHA = '9cf4d5040ca478d46fa925b84cd7c84f7a0a8712aa19dc984049fba0db2dc132'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    if OUTPUT.exists() or sha(SOURCE) != SOURCE_SHA or sha(R104) != R104_SHA:
        raise SystemExit('output-exists-or-source-drift')
    spec = importlib.util.spec_from_file_location('r104_audit', R104)
    r104 = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(r104)
    source = json.loads(SOURCE.read_text())
    all_results = {}
    for population in ('gitbug', 'bears'):
        cfg = r104.CONFIG[population]
        root = cfg['root']
        prior_path = r104.load(root, cfg['prior'])
        labels_path = r104.load(root, cfg['labels'])
        prior = [json.loads(line) for line in prior_path.read_text().splitlines()]
        labels = json.loads(labels_path.read_text())['results']
        rows = [row for row in source['rows'] if row['population'] == population]
        count = cfg['count']
        if any(len(part) != count for part in (rows, prior, labels)):
            raise SystemExit('denominator-drift')
        cases = []
        for ordinal, (new, old, label) in enumerate(zip(rows, prior, labels, strict=True), 1):
            label_ordinal = label['ordinal'] if population == 'gitbug' else label['selection_ordinal']
            if not (new['ordinal'] == old['ordinal'] == label_ordinal == ordinal
                    and new['repo'] == old['repo'] == label['repo'] and label['admissible']):
                raise SystemExit('case-binding')
            gold = set(label['gold_paths'])
            ranks = {'strong_prior': old['strong_raw_symbol_structure'],
                     'treatment_prior': old['treatment_safe'],
                     'strong_verifier': new['strong_verifier'],
                     'treatment_verifier': new['treatment_verifier']}
            if any(set(rank) != set(old['treatment_safe']) or len(rank) != len(old['treatment_safe'])
                   for rank in ranks.values()):
                raise SystemExit('rank-universe')
            cases.append({'ordinal': ordinal, 'repo': new['repo'], 'valid': new['valid'],
                          'scores': {arm: r104.score(rank, gold) for arm, rank in ranks.items()}})
        arms = tuple(cases[0]['scores'])
        means = {arm: {metric: sum(row['scores'][arm][metric] for row in cases) / count
                       for metric in ('mrr8', 'hit3', 'recall20')} for arm in arms}
        differences = {}
        for comparator in ('strong_verifier', 'treatment_prior'):
            delta = [row['scores']['treatment_verifier']['mrr8'] - row['scores'][comparator]['mrr8']
                     for row in cases]
            differences[comparator] = {'mean_mrr8': sum(delta) / count,
                                       'wins': sum(value > 0 for value in delta),
                                       'ties': sum(value == 0 for value in delta),
                                       'losses': sum(value < 0 for value in delta),
                                       'paired_95_interval': r104.interval(delta, 11900 + count)}
        gate = source['exploratory_gate']
        passed = (all(row['valid'] for row in cases)
                  and differences['strong_verifier']['mean_mrr8'] >= gate['treatment_minus_matched_strong_mrr8_min_each_population']
                  and differences['treatment_prior']['mean_mrr8'] >= gate['treatment_minus_prior_safe_mrr8_min_each_population']
                  and differences['strong_verifier']['wins'] >= gate['treatment_vs_strong_wins_min_' + population])
        all_results[population] = {'cases': count, 'valid_selections': sum(row['valid'] for row in cases),
                                   'gate_pass': passed, 'arms': means, 'differences': differences,
                                   'rows': cases}
    report = {'schema_version': 'g01.java-source-verifier-audit-r119/v1',
              'posture': 'evaluator-only-exposed-full-matched-ranking-no-fresh-confirmation',
              'source_sha256': SOURCE_SHA, 'r104_evaluator_sha256': R104_SHA,
              'script_sha256': sha(Path(__file__)), 'gate': source['exploratory_gate'],
              'populations': all_results,
              'claim_ceiling': 'Exposed development only; no independent superiority.',
              'open_questions': ['Can a different bounded verifier pass validity and early-rank gates?']}
    encoded = (json.dumps(report, sort_keys=True, indent=2) + '\n').encode()
    OUTPUT.parent.mkdir(parents=True, mode=0o700, exist_ok=False)
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(encoded)
    print(json.dumps({'sha256': hashlib.sha256(encoded).hexdigest(),
                      'populations': {name: {'gate_pass': part['gate_pass'],
                                             'valid': part['valid_selections'],
                                             'mrr8': {arm: score['mrr8'] for arm, score in part['arms'].items()},
                                             'differences': part['differences']}
                                      for name, part in all_results.items()}}, sort_keys=True))


if __name__ == '__main__':
    main()
