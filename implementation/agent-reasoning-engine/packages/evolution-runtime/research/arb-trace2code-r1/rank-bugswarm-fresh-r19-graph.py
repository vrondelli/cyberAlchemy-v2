#!/usr/bin/env python3
"""Transfer the unchanged graph-r2 rule to one fresh G01 case."""

from __future__ import annotations

import gzip
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sys


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/fresh-r11')
R14_DIR = BASE / 'repair-r14/run'
R13_DIR = BASE / 'header-r13'
R12_DIR = BASE / 'preflight-r12'
OUTPUT = BASE / 'rankings-r19/graph'
PINS = {
    'source': '6f76dafa33ed79a1ddfba5a3278e95ccb39161513ff35bc23dc927ce13dd1992',
    'queries': '7943e67c8ce84ba43cde47e726ed89b681151a621754e61741871a6ad0e94470',
    'cohort': '2f266bba198a1a72f2fdf55418c0ad284cb02a06f8e262f0dcd6d5a21e4ebcc1',
    'are_seal': '6fc4500437744b71dd1ac16921b1bbc22df370e68f2b1b82b97a6e9518d57918',
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
        'source': BASE / 'code-only-r17/RESULT.json',
        'queries': BASE / 'query-only-r18/QUERIES.jsonl',
        'cohort': R14_DIR / 'RESULT.json',
        'are_seal': BASE / 'rankings-r19/are/ARE-SEAL.json',
        'graph_rule': HERE / 'rank-bugswarm-graph-dev-r2-graph.py',
    }
    need(all(sha(paths[name].read_bytes()) == pin for name, pin in PINS.items()),
         'input-pin-drift')
    sources = json.loads(paths['source'].read_bytes())['records']
    queries = [json.loads(line) for line in paths['queries'].read_text().splitlines()]
    cohort = json.loads(paths['cohort'].read_bytes())['slots']
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
    are_path = BASE / f'rankings-r19/are/ARE-RANKING-{ordinal:02d}.json'
    are_data = are_path.read_bytes()
    need(sha(are_data) == seal['ranking_sha256'], 'are-ranking-drift')
    are = json.loads(are_data)
    need(are['candidate_count'] == len(are['ranked_files']) == src['projected_files'],
         'are-coverage-drift')
    if slot['retained']:
        receipt = json.loads((R13_DIR / 'RESULT.json').read_bytes())['rows'][ordinal - 1]
        need(receipt['ordinal'] == ordinal and receipt['admitted'] and
             receipt['id'] == query['id'] and receipt['job_id'] == final['job_id'],
             'retained-log-receipt')
        source_dir = {'r12-reused': R12_DIR,
                      'r13-new-capped-get': R13_DIR}.get(receipt['log_source'])
        need(source_dir is not None, 'retained-log-source')
        log = gzip.decompress((source_dir / receipt['log']['body_file']).read_bytes())
    else:
        receipt_path = R14_DIR / final['evidence']
        need(receipt_path.parent == R14_DIR and receipt_path.is_file(),
             'replacement-log-receipt-path')
        receipt = json.loads(receipt_path.read_bytes())
        need(receipt['slot'] == ordinal and receipt['admitted'] and
             receipt['image_tag'] == query['id'] and receipt['job_id'] == final['job_id'],
             'replacement-log-receipt')
        log = gzip.decompress((R14_DIR / receipt['log']['body_file']).read_bytes())
    need(sha(log) == query['log_sha256'] == receipt['log']['sha256'] and
         len(log) == final['log_bytes'] == receipt['log']['bytes'],
         'log-body-drift')
    spec = importlib.util.spec_from_file_location('g01_graph_rule', paths['graph_rule'])
    need(spec is not None and spec.loader is not None, 'graph-rule-unavailable')
    rule = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(rule)
    root = Path(src['root']).resolve(strict=True)
    need(root.parent == (BASE / 'code-only-r17').resolve(), 'root-boundary')
    ranking, diagnostic = rule.rank_case(root, are['ranked_files'],
                                         log.decode('utf-8', errors='replace'),
                                         query['query'], src['language'])
    need(diagnostic['source_tree_sha256'] == src['projected_tree_sha256'] and
         len(ranking) == len(set(ranking)) == src['projected_files'] and
         set(ranking) == set(are['ranked_files']), 'graph-tree-or-coverage-drift')
    OUTPUT.mkdir(parents=True, exist_ok=True, mode=0o700)
    if ordinal == 1:
        freeze = {'schema_version': 'are.g01-fresh-graph-freeze-r19/v1',
                  'input_sha256': PINS, 'script_sha256': sha(Path(__file__).read_bytes()),
                  'cases': 24, 'gold_opened': False, 'model_calls': 0}
        save(OUTPUT / 'FREEZE.json', (json.dumps(freeze, sort_keys=True, indent=2) + '\n').encode())
    else:
        need((OUTPUT / 'FREEZE.json').exists(), 'missing-freeze')
    row = {'schema_version': 'are.g01-fresh-graph-ranking-r19/v1',
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
