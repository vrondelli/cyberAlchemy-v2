#!/usr/bin/env python3
"""Score sealed official RepoMap against sealed ARE/GLM on exposed ARB IDs."""
from collections import Counter, defaultdict
from hashlib import sha256
import itertools
import json
import math
import os
from pathlib import Path
import statistics
import tarfile
import sys

ROOT = Path('/home/vlad_/are-benchmark-archive/arb-v2-trace2code-20261004')
OFFICIAL = ROOT / 'exposed-official-repomap-r1'
PILOT = ROOT / 'exposed-rerank-pilot-r1'
REMAINING = ROOT / 'exposed-rerank-remaining-r2'
ARCHIVE = ROOT / 'agent_retrieval_bench_v2_trace2code.tar.zst'
EXPECTED = {
    OFFICIAL / 'SOURCE-SEAL.json': 'c948ef1bf712f532ad8f2fd166df880b0413a2b6cf9d8274ff058ad10986b841',
    PILOT / 'RANKING-SEAL.json': '85c459126c630cff300ac642cea537ea4afb9a780e53fdf409299eeff6e80354',
    REMAINING / 'RANKING-SEAL.json': '8e738835074fb54b7387e0537bbc18da23136f5e86e24dcef1dfa8d1bf1772d2',
    ARCHIVE: '19b252e8cfff42107fedc74005dbb6972f2970af33651ce0c1571546819e41c4',
}


def digest(path):
    h = sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def rows(path):
    with path.open() as stream:
        return [json.loads(line) for line in stream]


def metrics(paths, gold):
    assert len(paths) == len(set(paths)) and gold.issubset(set(paths))
    rank = min(paths.index(path) + 1 for path in gold)
    return {'mrr_at_8': 1 / rank if rank <= 8 else 0.0,
            'hit_at_3': int(rank <= 3),
            'recall_at_20': len(gold.intersection(paths[:20])) / len(gold)}


def signflip(values):
    nonzero = [value for value in values if abs(value) > 1e-12]
    if not nonzero:
        return 1.0
    observed = abs(sum(nonzero))
    extremes = sum(abs(sum(sign * value for sign, value in zip(signs, nonzero))) >= observed - 1e-12
                   for signs in itertools.product((-1, 1), repeat=len(nonzero)))
    return extremes / (2 ** len(nonzero))


def main(output_path):
    assert not output_path.exists()
    for path, expected in EXPECTED.items():
        assert digest(path) == expected, f'input-drift:{path.name}'
    official_seal = json.loads((OFFICIAL / 'SOURCE-SEAL.json').read_text())
    assert official_seal['cases'] == 101 and official_seal['gold_opened'] is False
    official_path = OFFICIAL / 'OFFICIAL-REPOMAP-EDGE-RANKINGS.jsonl'
    assert digest(official_path) == official_seal['prediction_sha256']
    official = {row['id']: row for row in rows(official_path)}
    assert len(official) == 101
    glm = {}
    for root, count in ((PILOT, 12), (REMAINING, 89)):
        seal = json.loads((root / 'RANKING-SEAL.json').read_text())
        assert seal['cases'] == count and seal['gold_opened'] is False
        path = root / 'SEALED-RANKINGS.jsonl'
        assert digest(path) == seal['prediction_sha256']
        for row in rows(path):
            assert row['id'] not in glm
            glm[row['id']] = row
    assert len(glm) == 101 and set(glm) == set(official)
    results = []
    with tarfile.open(ARCHIVE, 'r:zst') as tar:
        stream = tar.extractfile('./benchmark/v2_trace2code/samples.jsonl')
        assert stream is not None
        for line in stream:
            sample = json.loads(line)
            id_ = sample['id']
            if id_ not in official:
                continue
            one, two = official[id_], glm[id_]
            assert sample['repo'] == one['repo'] == two['repo']
            assert sample['base_commit'] == one['base_commit'] == two['base_commit']
            assert set(one['official_repomap_edge']) == set(one['are_edge_trace_text'])
            assert set(two['proposal_ranked_files']) == set(one['official_repomap_edge'])
            assert one['are_edge_trace_text'] == two['are_ranked_files']
            gold = set(sample['gold']['root_cause_files'])
            assert gold and gold.issubset(set(one['official_repomap_edge']))
            results.append({'id': id_, 'repo': sample['repo'],
                            'official_repomap': metrics(one['official_repomap_edge'], gold),
                            'glm_rerank': metrics(two['proposal_ranked_files'], gold),
                            'are': metrics(two['are_ranked_files'], gold),
                            'arb_chunk_bm25': metrics(two['arb_ranked_files'], gold)})
    assert len(results) == 101 and len({row['id'] for row in results}) == 101
    arms = ('official_repomap', 'glm_rerank', 'are', 'arb_chunk_bm25')
    measures = ('mrr_at_8', 'hit_at_3', 'recall_at_20')
    aggregate = {arm: {metric: statistics.mean(row[arm][metric] for row in results)
                       for metric in measures} for arm in arms}
    repos = sorted({row['repo'] for row in results})
    by_repo = {repo: {arm: statistics.mean(row[arm]['mrr_at_8'] for row in results
                                          if row['repo'] == repo) for arm in arms}
               for repo in repos}
    cells = Counter('glm_win' if row['glm_rerank']['mrr_at_8'] > row['official_repomap']['mrr_at_8']
                    else 'repomap_win' if row['glm_rerank']['mrr_at_8'] < row['official_repomap']['mrr_at_8']
                    else 'tie' for row in results)
    repo_deltas = [by_repo[repo]['glm_rerank'] - by_repo[repo]['official_repomap']
                   for repo in repos]
    output = {'schema': 'are.arb-exposed-official-repomap-comparison-r1/v1',
              'posture': 'same exposed 101 cases and edge query; after source seals; not independent or live ARE',
              'input_sha256': {str(path): value for path, value in EXPECTED.items()},
              'official_prediction_sha256': digest(official_path),
              'glm_prediction_sha256': {'pilot': digest(PILOT / 'SEALED-RANKINGS.jsonl'),
                                        'remaining': digest(REMAINING / 'SEALED-RANKINGS.jsonl')},
              'scorer_sha256': digest(Path(__file__)),
              'cases': 101, 'repositories': len(repos),
              'aggregate': aggregate, 'per_repo': by_repo,
              'glm_vs_repomap_cases': dict(cells),
              'glm_minus_repomap_mean_mrr': aggregate['glm_rerank']['mrr_at_8'] -
                                            aggregate['official_repomap']['mrr_at_8'],
              'equal_repo_signflip_p_exploratory': signflip(repo_deltas),
              'per_case_numeric_only': sorted(results, key=lambda row: row['id']),
              'claim_ceiling': 'Exposed source-projected quality comparison only; no independent, live ARE, ContextBench, cost, or product superiority'}
    data = (json.dumps(output, indent=2, sort_keys=True) + '\n').encode()
    fd = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'cases': output['cases'], 'repositories': output['repositories'],
                      'aggregate': aggregate, 'glm_vs_repomap_cases': dict(cells),
                      'glm_minus_repomap_mean_mrr': output['glm_minus_repomap_mean_mrr'],
                      'equal_repo_signflip_p_exploratory': output['equal_repo_signflip_p_exploratory'],
                      'audit_sha256': sha256(data).hexdigest()}))


if __name__ == '__main__':
    assert len(sys.argv) == 2
    main(Path(sys.argv[1]))
