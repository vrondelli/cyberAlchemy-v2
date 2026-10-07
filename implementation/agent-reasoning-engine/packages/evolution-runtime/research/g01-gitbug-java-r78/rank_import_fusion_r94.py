#!/usr/bin/env python3
"""Source-only import-channel RRF on two exposed Java development sets."""

import argparse
import hashlib
import json
import os
from pathlib import Path


ARCHIVE = Path('/home/vlad_/are-benchmark-archive')
CONFIG = {
    'gitbug': {
        'root': ARCHIVE / 'gitbug-java-metadata-preflight-20261005',
        'ranks': 'dev-structure-r90/RANKINGS.jsonl',
        'ranks_sha': '4f2c83cdef8897d053c9fc527ed1cb6fae235c16e2f64796fb2859bbc60276d1',
        'imports_sha': 'fa10b3858d19c3c6e000a71588b5d125d266c1a6a765f06915ed5537f781edd8',
        'cases': 12,
    },
    'bears': {
        'root': ARCHIVE / 'bears-metadata-preflight-r73-20261005',
        'ranks': 'exposed-structure-r90/RANKINGS.jsonl',
        'ranks_sha': '1ebeccb86a2fd489a9b1da9c4e1880fbf3a735d382c1950c701a4d41ba467578',
        'imports_sha': 'c17cc538a92e5bb61ca5128913abb109612a6fece74a5d27d04a16f7379b3118',
        'cases': 24,
    },
}


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def fuse(baseline, imports):
    """Two baseline votes, one import vote, with baseline rank one protected."""
    base_position = {path: position for position, path in enumerate(baseline, 1)}
    import_position = {path: position for position, path in enumerate(imports, 1)}
    if len(base_position) != len(baseline) or len(import_position) != len(imports):
        raise ValueError('duplicate-path')
    if not set(imports) <= set(baseline):
        raise ValueError('import-outside-universe')
    remainder = sorted(baseline[1:], key=lambda path: (
        -(2 / (60 + base_position[path])
          + (1 / (60 + import_position[path]) if path in import_position else 0)),
        base_position[path], path))
    return baseline[:1] + remainder


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--population', choices=sorted(CONFIG), required=True)
    args = parser.parse_args()
    cfg = CONFIG[args.population]
    ranks_path = cfg['root'] / cfg['ranks']
    imports_path = cfg['root'] / 'test-import-screen-r92/SOURCE-SEAL.json'
    output = cfg['root'] / 'import-fusion-r94/SOURCE-SEAL.json'
    if (output.exists() or sha(ranks_path) != cfg['ranks_sha']
            or sha(imports_path) != cfg['imports_sha']):
        raise SystemExit('output-exists-or-input-drift')
    ranks = [json.loads(line) for line in ranks_path.read_text().splitlines()]
    imports = json.loads(imports_path.read_text())['rows']
    if len(ranks) != cfg['cases'] or len(imports) != cfg['cases']:
        raise SystemExit('cohort-shape')
    rows = []
    for rank, edge in zip(ranks, imports):
        ordinal = rank['ordinal']
        if (edge['ordinal'] != ordinal or edge['repo'] != rank['repo']
                or edge['query_sha256'] != rank['query_sha256']):
            raise SystemExit(f'identity-drift:{ordinal}')
        imported = [item['path'] for item in edge['ranked_import_candidates']]
        strong = rank['strong_raw_symbol_structure']
        treatment = rank['treatment_safe']
        if set(strong) != set(treatment) or len(strong) != len(treatment):
            raise SystemExit(f'universe-drift:{ordinal}')
        rows.append({'ordinal': ordinal, 'repo': rank['repo'],
                     'query_sha256': rank['query_sha256'],
                     'import_candidates': len(imported),
                     'strong_import': fuse(strong, imported),
                     'treatment_import': fuse(treatment, imported)})
        print(json.dumps({'ordinal': ordinal, 'imports': len(imported)}), flush=True)
    result = {'schema_version': 'are.g01-java-import-fusion-r94/v1',
              'posture': 'source-only-post-hoc-exposed-development-no-label-or-model',
              'population': args.population,
              'input_sha256': {str(ranks_path): cfg['ranks_sha'],
                               str(imports_path): cfg['imports_sha']},
              'script_sha256': sha(Path(__file__)),
              'policy': 'RRF k=60: two baseline votes plus one import vote; preserve baseline rank one; same import vote to strong and treatment arms',
              'exploratory_gate': {'treatment_minus_matched_strong_mrr8_min_each_population': 0.05,
                                   'treatment_minus_prior_safe_mrr8_min_each_population': 0.03,
                                   'treatment_vs_strong_wins_min_gitbug': 4,
                                   'treatment_vs_strong_wins_min_bears': 8},
              'rows': rows,
              'claim_ceiling': 'Post-hoc exposed matched-rank diagnostic only; no independent superiority.'}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    output.parent.mkdir(mode=0o700, parents=True, exist_ok=False)
    fd = os.open(output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'population': args.population, 'sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
