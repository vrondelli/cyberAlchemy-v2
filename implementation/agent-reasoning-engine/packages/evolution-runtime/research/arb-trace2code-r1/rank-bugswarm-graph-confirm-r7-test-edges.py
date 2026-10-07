#!/usr/bin/env python3
"""Transfer the unchanged development r3 test-edge rule to G01 confirmation."""

from __future__ import annotations

from collections import defaultdict
import gzip
import hashlib
import importlib.util
import json
import os
from pathlib import Path, PurePosixPath
import time


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
R4 = BASE / 'graph-confirm-r4'
R1 = BASE / 'graph-confirm-r1/source-only/g01-bugswarm-graph-confirm-r1-preflight'
R2 = BASE / 'graph-confirm-r1/source-only/g01-bugswarm-graph-confirm-r2-repair'
OUTPUT = R4 / 'rankings-r7/test-edges'
PINS = {
    'source': '3eea3878d6769be39a88c98473cfc7eb0c019e4e33f82b665b7b18271dda4e4a',
    'queries': 'd570e3ab4a9e0f5c9945544bbb2681949c96ffdfcf106abd9d9007634254a2aa',
    'cohort': 'a55087a01c1b157ea7fcd6dfa4327037a3e4cb13c72df5e0c31b44d80513c22c',
    'graph_seal': '0ae5f79b60d96eacc1c8cbb84c88c274416686566c2a48156dd19c61aa6ef320',
    'r2_rule': 'e0664909091562e38a547f04c7901e88ae2723bfe9d4bd2f0cdef2c561a770d0',
    'r3_rule': 'ae5af4bfc07bb61c0a86eedf9f0e670a078f77e5eb1417ed3227bfecdedbf32e',
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(condition: bool, reason: str) -> None:
    if not condition:
        raise SystemExit(reason)


def load(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    need(spec is not None and spec.loader is not None, 'rule-unavailable')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def write_new(path: Path, data: bytes) -> None:
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)


def main() -> None:
    inputs = {
        'source': R4 / 'code-only/RESULT.json',
        'queries': R4 / 'query-only/QUERIES.jsonl',
        'cohort': R2 / 'REPAIR-RESULT.json',
        'graph_seal': R4 / 'rankings-r6/graph/GRAPH-SEAL.json',
        'r2_rule': HERE / 'rank-bugswarm-graph-dev-r2-graph.py',
        'r3_rule': HERE / 'rank-bugswarm-graph-dev-r3-test-edges.py',
    }
    need(not OUTPUT.exists() and
         all(sha(path.read_bytes()) == PINS[name] for name, path in inputs.items()),
         'output-exists-or-input-pin-drift')
    r2 = load(inputs['r2_rule'], 'g01_confirm_r2_rule')
    r3 = load(inputs['r3_rule'], 'g01_confirm_r3_rule')
    sources = json.loads(inputs['source'].read_bytes())['records']
    queries = [json.loads(line) for line in inputs['queries'].read_text().splitlines()]
    cohort = json.loads(inputs['cohort'].read_bytes())['rows']
    graph_seals = json.loads(inputs['graph_seal'].read_bytes())['rankings']
    need(len(sources) == len(queries) == len(cohort) == len(graph_seals) == 24,
         'denominator-drift')
    OUTPUT.mkdir(parents=True, mode=0o700)
    rows = []
    for ordinal, (src, query, slot, seal) in enumerate(zip(
            sources, queries, cohort, graph_seals), 1):
        final = slot['final']
        path = R4 / f'rankings-r6/graph/GRAPH-RANKING-{ordinal:02d}.json'
        graph_data = path.read_bytes()
        old = json.loads(graph_data)
        need(src['slot'] == query['ordinal'] == slot['slot'] == seal['ordinal'] == ordinal and
             old['id'] == src['image_tag'] == query['id'] == final['image_tag'] and
             old['base_commit'] == src['failed_commit'] == query['base_commit'] and
             sha(graph_data) == seal['ranking_sha256'],
             f'case-identity-{ordinal}')
        if slot['retained']:
            log = (R1 / f'HTTPS-LOG-{ordinal:02d}.txt').read_bytes()
        else:
            attempt = slot['attempts'][-1]
            need(attempt['admitted'], f'log-admission-{ordinal}')
            log = gzip.decompress((R2 / attempt['log']['body_file']).read_bytes())
        need(sha(log) == query['log_sha256'] == final['log_sha256'],
             f'log-hash-{ordinal}')
        started = time.monotonic()
        paths = old['ranked_files']
        root = Path(src['root']).resolve(strict=True)
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
        row = {'schema_version': 'are.g01-confirm-test-edges-r7/v1',
               'ordinal': ordinal, 'id': old['id'], 'repo': old['repo'],
               'language': old['language'], 'base_commit': old['base_commit'],
               'graph_ranking_sha256': seal['ranking_sha256'],
               'source_tree_sha256': tree_sha, 'test_seed_count': len(seeds),
               'edge_target_count': len(edge_targets),
               'ranker_elapsed_ms': round((time.monotonic() - started) * 1000),
               'ranked_files': ranking, 'candidate_count': len(ranking),
               'gold_opened': False, 'model_calls': 0}
        rows.append(row)
        print(json.dumps({'ordinal': ordinal, 'test_seeds': len(seeds),
                          'edge_targets': len(edge_targets)}), flush=True)
    data = ''.join(json.dumps(row, sort_keys=True) + '\n' for row in rows).encode()
    write_new(OUTPUT / 'TEST-EDGE-RANKINGS.jsonl', data)
    seal = {'schema_version': 'are.g01-confirm-test-edge-seal-r7/v1',
            'input_sha256': PINS, 'script_sha256': sha(Path(__file__).read_bytes()),
            'cases': 24, 'rankings_sha256': sha(data),
            'incremental_elapsed_ms_sum': sum(row['ranker_elapsed_ms'] for row in rows),
            'gold_opened': False, 'model_calls': 0}
    encoded = (json.dumps(seal, sort_keys=True, indent=2) + '\n').encode()
    write_new(OUTPUT / 'TEST-EDGE-SEAL.json', encoded)
    print(json.dumps({'cases': 24, 'rankings_sha256': sha(data),
                      'seal_sha256': sha(encoded),
                      'incremental_elapsed_ms_sum': seal['incremental_elapsed_ms_sum']}))


if __name__ == '__main__':
    main()
