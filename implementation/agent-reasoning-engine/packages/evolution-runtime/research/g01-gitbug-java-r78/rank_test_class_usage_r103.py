"""Source-only matched fusion of r101 Java test-class usage candidates.

The same bounded usage vote is given to the strong raw/symbol/structure arm
and safeguarded ARE arm. This is post-hoc exposed development, not a holdout.
Open question: does better candidate reach survive a full early-rank test?
"""

import argparse
import hashlib
import json
import os
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive')
CONFIG = {
    'gitbug': {
        'root': ROOT / 'gitbug-java-metadata-preflight-20261005',
        'ranks': ('dev-structure-r90/RANKINGS.jsonl', '4f2c83cdef8897d053c9fc527ed1cb6fae235c16e2f64796fb2859bbc60276d1'),
        'usage': ('test-class-usage-r101/SOURCE-SEAL.json', '2b779761cf6c9843836577e148ddf7d55a593633fe58f112ea4531e0521a326f'),
        'count': 12,
    },
    'bears': {
        'root': ROOT / 'bears-metadata-preflight-r73-20261005',
        'ranks': ('exposed-structure-r90/RANKINGS.jsonl', '1ebeccb86a2fd489a9b1da9c4e1880fbf3a735d382c1950c701a4d41ba467578'),
        'usage': ('test-class-usage-r101/SOURCE-SEAL.json', '749262d2e8f013b4344a656f55e89490b5eddcaa446461b8d6a3c36c8eb488ed'),
        'count': 24,
    },
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(root, pair):
    path = root / pair[0]
    if sha(path) != pair[1]:
        raise SystemExit(f'input-drift:{path}')
    return path


def fuse(baseline, usage):
    """Exact r94 two-baseline/one-new-channel RRF with rank one protected."""
    base_position = {path: position for position, path in enumerate(baseline, 1)}
    usage_position = {path: position for position, path in enumerate(usage, 1)}
    if len(base_position) != len(baseline) or len(usage_position) != len(usage):
        raise ValueError('duplicate-path')
    if not set(usage) <= set(baseline):
        raise ValueError('usage-outside-universe')
    remainder = sorted(baseline[1:], key=lambda path: (
        -(2 / (60 + base_position[path])
          + (1 / (60 + usage_position[path]) if path in usage_position else 0)),
        base_position[path], path))
    return baseline[:1] + remainder


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--population', choices=CONFIG, required=True)
    args = parser.parse_args()
    cfg = CONFIG[args.population]
    ranks_path = load(cfg['root'], cfg['ranks'])
    usage_path = load(cfg['root'], cfg['usage'])
    output = cfg['root'] / 'test-class-usage-fusion-r103/SOURCE-SEAL.json'
    if output.exists():
        raise SystemExit('output-exists')
    ranks = [json.loads(line) for line in ranks_path.read_text().splitlines()]
    usage = json.loads(usage_path.read_text())['rows']
    if len(ranks) != cfg['count'] or len(usage) != cfg['count']:
        raise SystemExit('denominator-drift')
    rows = []
    for rank, edge in zip(ranks, usage, strict=True):
        ordinal = rank['ordinal']
        if edge['ordinal'] != ordinal or edge['repo'] != rank['repo'] or edge['query_sha256'] != rank['query_sha256']:
            raise SystemExit(f'case-binding:{ordinal}')
        strong = rank['strong_raw_symbol_structure']
        treatment = rank['treatment_safe']
        if len(strong) != len(treatment) or set(strong) != set(treatment):
            raise SystemExit(f'universe:{ordinal}')
        candidates = [item['path'] for item in edge['ranked_usage_candidates']]
        rows.append({'ordinal': ordinal, 'repo': rank['repo'], 'query_sha256': rank['query_sha256'],
                     'usage_candidates': len(candidates), 'strong_usage': fuse(strong, candidates),
                     'treatment_usage': fuse(treatment, candidates)})
    result = {'schema_version': 'g01.java-test-class-usage-fusion-r103/v1',
              'posture': 'source-only-post-hoc-exposed-development-no-label-or-model',
              'population': args.population, 'cases': cfg['count'],
              'input_sha256': {'ranks': cfg['ranks'][1], 'usage': cfg['usage'][1]},
              'script_sha256': sha(Path(__file__)),
              'policy': 'RRF k=60: two baseline votes plus one usage vote; protect baseline rank one; same vote to strong and ARE treatment arms',
              'exploratory_gate': {'treatment_minus_matched_strong_mrr8_min_each_population': 0.05,
                                   'treatment_minus_prior_safe_mrr8_min_each_population': 0.03,
                                   'treatment_vs_strong_wins_min_gitbug': 4,
                                   'treatment_vs_strong_wins_min_bears': 8},
              'rows': rows,
              'claim_ceiling': 'Exposed full-rank source seal only; no independent quality or superiority.',
              'open_questions': ['Does the r101 coverage gain improve both population MRR and case wins?']}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    output.parent.mkdir(mode=0o700, parents=True, exist_ok=False)
    fd = os.open(output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'population': args.population, 'cases': len(rows),
                      'sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
