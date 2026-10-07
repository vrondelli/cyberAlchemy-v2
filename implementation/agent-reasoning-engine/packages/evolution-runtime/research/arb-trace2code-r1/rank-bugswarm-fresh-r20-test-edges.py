#!/usr/bin/env python3
"""Transfer the unchanged development test-edge rule to fresh G01."""

from __future__ import annotations

from collections import defaultdict
import json
import os
from pathlib import Path, PurePosixPath
import time

from bugswarm_fresh_r20_inputs import BASE, HERE, INPUTS, PINS, failed_log, load, need, rows, sha, verify


OUTPUT = BASE / 'rankings-r20/test-edges'


def write_new(path: Path, data: bytes) -> None:
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)


def main() -> None:
    need(not OUTPUT.exists(), 'output-exists')
    verify('source', 'queries', 'cohort', 'graph_seal', 'r2_rule', 'r3_rule', 'protocol')
    r2 = load(INPUTS['r2_rule'], 'g01_fresh_r2_rule')
    r3 = load(INPUTS['r3_rule'], 'g01_fresh_r3_rule')
    sources, queries, cohort, graph_seals = rows()
    out = []
    for ordinal, (src, query, slot, seal) in enumerate(zip(
            sources, queries, cohort, graph_seals), 1):
        graph_data = (BASE / f'rankings-r19/graph/GRAPH-RANKING-{ordinal:02d}.json').read_bytes()
        old = json.loads(graph_data)
        final = slot['final']
        need(src['slot'] == query['ordinal'] == slot['slot'] == seal['ordinal'] == ordinal and
             old['id'] == src['image_tag'] == query['id'] == final['image_tag'] and
             old['base_commit'] == src['failed_commit'] == query['base_commit'] and
             sha(graph_data) == seal['ranking_sha256'], f'case-identity-{ordinal}')
        log = failed_log(ordinal, slot, query)
        started = time.monotonic()
        paths = old['ranked_files']
        root = Path(src['root']).resolve(strict=True)
        need(root.parent == (BASE / 'code-only-r17').resolve(), f'root-boundary-{ordinal}')
        direct, _, symbols, tree_sha = r2.graph_for_case(root, paths, src['language'])
        need(tree_sha == src['projected_tree_sha256'], f'source-tree-{ordinal}')
        seeds = r3.test_seeds(paths, log.decode('utf-8', errors='replace'),
                              query['query'], r2.is_test)
        score: dict[str, float] = defaultdict(float)
        for seed in seeds:
            for candidate in direct[seed]:
                if not r2.is_test(candidate):
                    score[candidate] += 0.8
                    for next_path in direct[candidate]:
                        if not r2.is_test(next_path):
                            score[next_path] += 0.2
            stem = PurePosixPath(seed).stem
            names = [stem.removeprefix('Test'), stem.removesuffix('Test'),
                     stem.removesuffix('Tests')]
            for name in names:
                if name != stem and len(name) >= 3:
                    matches = symbols.get(name.lower(), [])
                    if 1 <= len(matches) <= 5:
                        for candidate in matches:
                            if not r2.is_test(candidate):
                                score[candidate] += 0.6 / len(matches)
        rank = {candidate: index for index, candidate in enumerate(paths)}
        edge_targets = sorted(score, key=lambda candidate:
                              (-score[candidate], rank[candidate], candidate))[:r3.MAX_EDGE_TARGETS]
        target_set = set(edge_targets)
        ranking = sorted(paths, key=lambda candidate: (
            -(1.0 / (rank[candidate] + 1) + min(score[candidate], 1.4)
              if candidate in target_set else 1.0 / (rank[candidate] + 1)),
            rank[candidate], candidate))
        need(len(ranking) == len(set(ranking)) == src['projected_files'] and
             set(ranking) == set(paths), f'ranking-coverage-{ordinal}')
        out.append({'schema_version': 'are.g01-fresh-test-edges-r20/v1',
                    'ordinal': ordinal, 'id': old['id'], 'repo': old['repo'],
                    'language': old['language'], 'base_commit': old['base_commit'],
                    'graph_ranking_sha256': seal['ranking_sha256'],
                    'source_tree_sha256': tree_sha, 'test_seed_count': len(seeds),
                    'edge_target_count': len(edge_targets),
                    'ranker_elapsed_ms': round((time.monotonic() - started) * 1000),
                    'ranked_files': ranking, 'candidate_count': len(ranking),
                    'gold_opened': False, 'model_calls': 0})
        print(json.dumps({'ordinal': ordinal, 'test_seeds': len(seeds),
                          'edge_targets': len(edge_targets)}), flush=True)
    OUTPUT.mkdir(parents=True, mode=0o700)
    data = ''.join(json.dumps(row, sort_keys=True) + '\n' for row in out).encode()
    write_new(OUTPUT / 'TEST-EDGE-RANKINGS.jsonl', data)
    seal = {'schema_version': 'are.g01-fresh-test-edge-seal-r20/v1',
            'input_sha256': {key: PINS[key] for key in
                             ('source', 'queries', 'cohort', 'graph_seal',
                              'r2_rule', 'r3_rule', 'protocol')},
            'script_sha256': sha(Path(__file__).read_bytes()),
            'helper_sha256': sha((HERE / 'bugswarm_fresh_r20_inputs.py').read_bytes()),
            'cases': 24, 'rankings_sha256': sha(data),
            'incremental_elapsed_ms_sum': sum(row['ranker_elapsed_ms'] for row in out),
            'gold_opened': False, 'model_calls': 0}
    encoded = (json.dumps(seal, sort_keys=True, indent=2) + '\n').encode()
    write_new(OUTPUT / 'TEST-EDGE-SEAL.json', encoded)
    print(json.dumps({'cases': 24, 'rankings_sha256': sha(data),
                      'seal_sha256': sha(encoded),
                      'incremental_elapsed_ms_sum': seal['incremental_elapsed_ms_sum']}))


if __name__ == '__main__':
    main()
