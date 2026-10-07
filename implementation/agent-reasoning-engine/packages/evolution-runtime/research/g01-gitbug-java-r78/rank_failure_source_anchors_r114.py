"""Source-only matched selective anchor promotion on exposed Java cases.

The same rule applies to strong and ARE arms. It preserves each arm's first
all-file and production-file ranks, makes at most one promotion per case,
and reads no gold or fresh confirmation data. Open question: does this
convert reach into early-rank quality without false promotions?
"""

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath


ROOT = Path('/home/vlad_/are-benchmark-archive')
CONFIG = {
    'gitbug': {
        'root': ROOT / 'gitbug-java-metadata-preflight-20261005',
        'ranks': ('dev-structure-r90/RANKINGS.jsonl', '4f2c83cdef8897d053c9fc527ed1cb6fae235c16e2f64796fb2859bbc60276d1'),
        'anchors': ('failure-source-anchors-r112/SOURCE-SEAL.json', '875bc3e1fb94e6819bc538a50c8f0d4431f2bb70db0eb8d8ef6eefc65340ae0d'),
        'count': 12,
    },
    'bears': {
        'root': ROOT / 'bears-metadata-preflight-r73-20261005',
        'ranks': ('exposed-structure-r90/RANKINGS.jsonl', '1ebeccb86a2fd489a9b1da9c4e1880fbf3a735d382c1950c701a4d41ba467578'),
        'anchors': ('failure-source-anchors-r112/SOURCE-SEAL.json', 'a2f21a1368844ae2abf5a0144c1239c7fa931ec227273ca5406ee773dab1e0a8'),
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


def production(path):
    return not {'test', 'tests'} & set(PurePosixPath(path).parts)


def promote(baseline, candidates):
    production_paths = [path for path in baseline if production(path)]
    if not production_paths:
        raise ValueError('no-production-files')
    eligible = set(production_paths[1:16])
    selected = None
    for item in candidates[:10]:
        if item['path'] not in eligible:
            continue
        if not (item['fqcn_hits'] >= 1 or item['literal_hits'] >= 1 or item['identifier_hits'] >= 2):
            continue
        selected = item['path']
        break
    if selected is None:
        return baseline.copy(), None
    result = baseline.copy()
    result.remove(selected)
    result.insert(result.index(production_paths[0]) + 1, selected)
    if result[0] != baseline[0] or [path for path in result if production(path)][:2] != [production_paths[0], selected]:
        raise ValueError('head-guard-failed')
    return result, selected


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--population', choices=CONFIG, required=True)
    args = parser.parse_args()
    cfg = CONFIG[args.population]
    rank_path = load(cfg['root'], cfg['ranks'])
    anchor_path = load(cfg['root'], cfg['anchors'])
    output = cfg['root'] / 'failure-anchor-selective-r114/SOURCE-SEAL.json'
    if output.exists():
        raise SystemExit('output-exists')
    ranks = [json.loads(line) for line in rank_path.read_text().splitlines()]
    anchors = json.loads(anchor_path.read_text())['rows']
    if len(ranks) != cfg['count'] or len(anchors) != cfg['count']:
        raise SystemExit('denominator-drift')
    rows = []
    changed = {'strong': 0, 'treatment': 0}
    for rank, edge in zip(ranks, anchors, strict=True):
        ordinal = rank['ordinal']
        if edge['ordinal'] != ordinal or edge['repo'] != rank['repo'] or edge['query_sha256'] != rank['query_sha256']:
            raise SystemExit(f'case-binding:{ordinal}')
        strong = rank['strong_raw_symbol_structure']
        treatment = rank['treatment_safe']
        if len(strong) != len(treatment) or set(strong) != set(treatment):
            raise SystemExit(f'universe:{ordinal}')
        candidates = edge['candidates']
        if any(item['path'] not in set(strong) for item in candidates):
            raise SystemExit(f'candidate-outside-universe:{ordinal}')
        strong_new, strong_selected = promote(strong, candidates)
        treatment_new, treatment_selected = promote(treatment, candidates)
        if set(strong_new) != set(strong) or set(treatment_new) != set(treatment):
            raise SystemExit(f'rank-universe:{ordinal}')
        changed['strong'] += int(strong_new != strong)
        changed['treatment'] += int(treatment_new != treatment)
        rows.append({'ordinal': ordinal, 'repo': rank['repo'], 'query_sha256': rank['query_sha256'],
                     'strong_selected': strong_selected, 'treatment_selected': treatment_selected,
                     'strong_anchor': strong_new, 'treatment_anchor': treatment_new})
    result = {'schema_version': 'g01.java-failure-anchor-selective-r114/v1',
              'posture': 'source-only-post-hoc-exposed-development-no-label-model-or-confirmation',
              'population': args.population, 'cases': cfg['count'],
              'input_sha256': {'ranks': cfg['ranks'][1], 'anchors': cfg['anchors'][1]},
              'script_sha256': sha(Path(__file__)),
              'policy': 'same matched rule per arm: first qualified anchor top10 within baseline production ranks 2..16, require exact FQCN or literal or >=2 identifier hits, move to second production rank; preserve all-file and production heads; at most one promotion',
              'exploratory_gate': {'treatment_minus_matched_strong_mrr8_min_each_population': 0.05,
                                   'treatment_minus_prior_safe_mrr8_min_each_population': 0.03,
                                   'treatment_vs_strong_wins_min_gitbug': 4,
                                   'treatment_vs_strong_wins_min_bears': 8},
              'changed': changed, 'rows': rows,
              'claim_ceiling': 'Exposed source-only matched ranking seal, no fresh quality or superiority.',
              'open_questions': ['Does selective promotion improve both exposed populations under matched comparison?']}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    output.parent.mkdir(parents=True, mode=0o700, exist_ok=False)
    fd = os.open(output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'population': args.population, 'changed': changed,
                      'sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
