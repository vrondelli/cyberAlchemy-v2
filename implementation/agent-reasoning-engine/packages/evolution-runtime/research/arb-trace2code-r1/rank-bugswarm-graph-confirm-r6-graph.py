#!/usr/bin/env python3
"""Apply the unchanged development graph rule to one G01 confirmation case."""

from __future__ import annotations

import gzip
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sys


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
R4 = BASE / 'graph-confirm-r4'
R1 = BASE / 'graph-confirm-r1/source-only/g01-bugswarm-graph-confirm-r1-preflight'
R2 = BASE / 'graph-confirm-r1/source-only/g01-bugswarm-graph-confirm-r2-repair'
OUTPUT = R4 / 'rankings-r6/graph'
PINS = {
    'source': '3eea3878d6769be39a88c98473cfc7eb0c019e4e33f82b665b7b18271dda4e4a',
    'queries': 'd570e3ab4a9e0f5c9945544bbb2681949c96ffdfcf106abd9d9007634254a2aa',
    'cohort': 'a55087a01c1b157ea7fcd6dfa4327037a3e4cb13c72df5e0c31b44d80513c22c',
    'are_seal': '45d73843608fdc5f43ceec2328fdfef9c2b41220f86d1d45fb20abb01ce3d736',
    'graph_rule': 'e0664909091562e38a547f04c7901e88ae2723bfe9d4bd2f0cdef2c561a770d0',
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(condition: bool, reason: str) -> None:
    if not condition:
        raise SystemExit(reason)


def save(path: Path, data: bytes) -> None:
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)


def main() -> None:
    need(len(sys.argv) == 2 and sys.argv[1].isdigit(), 'ordinal-argument')
    ordinal = int(sys.argv[1])
    need(1 <= ordinal <= 24, 'ordinal-range')
    paths = {
        'source': R4 / 'code-only/RESULT.json',
        'queries': R4 / 'query-only/QUERIES.jsonl',
        'cohort': R2 / 'REPAIR-RESULT.json',
        'are_seal': R4 / 'rankings-r6/are/ARE-SEAL.json',
        'graph_rule': HERE / 'rank-bugswarm-graph-dev-r2-graph.py',
    }
    need(all(sha(paths[name].read_bytes()) == pin for name, pin in PINS.items()),
         'input-pin-drift')
    sources = json.loads(paths['source'].read_bytes())['records']
    queries = [json.loads(line) for line in paths['queries'].read_text().splitlines()]
    cohort = json.loads(paths['cohort'].read_bytes())['rows']
    seals = json.loads(paths['are_seal'].read_bytes())['rankings']
    need(len(sources) == len(queries) == len(cohort) == len(seals) == 24,
         'denominator-drift')
    src, query, slot, seal = (rows[ordinal - 1] for rows in
                              (sources, queries, cohort, seals))
    final = slot['final']
    need(src['slot'] == query['ordinal'] == slot['slot'] == seal['ordinal'] == ordinal and
         src['image_tag'] == query['id'] == final['image_tag'] == seal['id'] and
         src['repo'] == query['repo'] == final['repo'] and
         src['failed_commit'] == query['base_commit'] == final['failed_commit'] and
         src['language'] == query['language'] == final['language'] and
         query['log_sha256'] == final['log_sha256'],
         'case-identity-drift')
    are_path = R4 / f'rankings-r6/are/ARE-RANKING-{ordinal:02d}.json'
    are_data = are_path.read_bytes()
    need(sha(are_data) == seal['ranking_sha256'], 'are-ranking-drift')
    are = json.loads(are_data)
    need(are['candidate_count'] == len(are['ranked_files']) == src['projected_files'],
         'are-coverage-drift')
    if slot['retained']:
        log = (R1 / f'HTTPS-LOG-{ordinal:02d}.txt').read_bytes()
    else:
        attempt = slot['attempts'][-1]
        need(attempt['admitted'], 'replacement-log-not-admitted')
        log = gzip.decompress((R2 / attempt['log']['body_file']).read_bytes())
    need(sha(log) == query['log_sha256'] and len(log) == final['log_bytes'],
         'log-body-drift')
    spec = importlib.util.spec_from_file_location('g01_graph_rule', paths['graph_rule'])
    need(spec is not None and spec.loader is not None, 'graph-rule-unavailable')
    rule = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(rule)
    root = Path(src['root']).resolve(strict=True)
    ranking, diagnostic = rule.rank_case(root, are['ranked_files'],
                                         log.decode('utf-8', errors='replace'),
                                         query['query'], src['language'])
    need(diagnostic['source_tree_sha256'] == src['projected_tree_sha256'] and
         len(ranking) == len(set(ranking)) == src['projected_files'] and
         set(ranking) == set(are['ranked_files']), 'graph-tree-or-coverage-drift')
    OUTPUT.mkdir(parents=True, exist_ok=True, mode=0o700)
    if ordinal == 1:
        freeze = {'schema_version': 'are.g01-confirm-graph-freeze-r6/v1',
                  'input_sha256': PINS, 'script_sha256': sha(Path(__file__).read_bytes()),
                  'cases': 24, 'gold_opened': False, 'model_calls': 0}
        save(OUTPUT / 'FREEZE.json', (json.dumps(freeze, sort_keys=True, indent=2) + '\n').encode())
    else:
        need((OUTPUT / 'FREEZE.json').exists(), 'missing-freeze')
    row = {'schema_version': 'are.g01-confirm-graph-ranking-r6/v1',
           'ordinal': ordinal, 'id': query['id'], 'repo': query['repo'],
           'language': query['language'], 'base_commit': query['base_commit'],
           'query_sha256': query['query_sha256'], 'log_sha256': query['log_sha256'],
           'are_ranking_sha256': seal['ranking_sha256'], 'ranked_files': ranking,
           'candidate_count': len(ranking), **diagnostic,
           'gold_opened': False, 'model_calls': 0}
    encoded = (json.dumps(row, sort_keys=True) + '\n').encode()
    save(OUTPUT / f'GRAPH-RANKING-{ordinal:02d}.json', encoded)
    print(json.dumps({'ordinal': ordinal, 'candidate_count': len(ranking),
                      'ranking_sha256': sha(encoded),
                      'ranker_elapsed_ms': diagnostic['ranker_elapsed_ms']}))


if __name__ == '__main__':
    main()
