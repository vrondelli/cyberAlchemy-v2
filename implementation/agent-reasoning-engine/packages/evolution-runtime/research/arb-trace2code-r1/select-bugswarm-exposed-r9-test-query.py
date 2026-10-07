#!/usr/bin/env python3
"""Select bounded r9 exposed candidates without opening evaluator labels."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import os
from pathlib import Path


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-confirm-r4')
OUTPUT = BASE / 'exposed-r9/candidates'
PROTOCOL = HERE.parents[1] / 'evidence/G01-BUGSWARM-EXPOSED-R9-TEST-QUERY-PROTOCOL-2026-10-04.md'
PINS = {
    'source': '3eea3878d6769be39a88c98473cfc7eb0c019e4e33f82b665b7b18271dda4e4a',
    'queries': 'd570e3ab4a9e0f5c9945544bbb2681949c96ffdfcf106abd9d9007634254a2aa',
    'old_candidates': '91784df7b72cae7502bd742248ac7b1d499e33d27a62ed265a936e7b0caa5056',
    'graph_seal': '0ae5f79b60d96eacc1c8cbb84c88c274416686566c2a48156dd19c61aa6ef320',
    'test_edges': 'e59b008fbde1ed1934d057e1c46fc7174dd1570ef98c797eb44f29161dd984d0',
    'protocol': 'a19fe29254f0f9a69fb35f05b62e80ce465382e8c2c9c7cc81aff1320ddf86da',
    'graph_rule': 'e0664909091562e38a547f04c7901e88ae2723bfe9d4bd2f0cdef2c561a770d0',
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(condition: bool, reason: str) -> None:
    if not condition:
        raise SystemExit(reason)


def write_new(path: Path, data: bytes) -> None:
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)


def main() -> None:
    inputs = {
        'source': BASE / 'code-only/RESULT.json',
        'queries': BASE / 'query-only/QUERIES.jsonl',
        'old_candidates': BASE / 'candidates-r7/CANDIDATES.jsonl',
        'graph_seal': BASE / 'rankings-r6/graph/GRAPH-SEAL.json',
        'test_edges': BASE / 'rankings-r7/test-edges/TEST-EDGE-RANKINGS.jsonl',
        'protocol': PROTOCOL,
        'graph_rule': HERE / 'rank-bugswarm-graph-dev-r2-graph.py',
    }
    need(not OUTPUT.exists() and
         all(sha(path.read_bytes()) == PINS[name] for name, path in inputs.items()),
         'output-or-input-pin-drift')
    spec = importlib.util.spec_from_file_location('g01_r9_graph_test', inputs['graph_rule'])
    need(spec is not None and spec.loader is not None, 'test-rule-unavailable')
    rule = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(rule)
    sources = json.loads(inputs['source'].read_bytes())['records']
    queries = [json.loads(line) for line in inputs['queries'].read_text().splitlines()]
    old = [json.loads(line) for line in inputs['old_candidates'].read_text().splitlines()]
    edges = [json.loads(line) for line in inputs['test_edges'].read_text().splitlines()]
    graph_seals = json.loads(inputs['graph_seal'].read_bytes())['rankings']
    need(len(sources) == len(queries) == len(old) == len(edges) == len(graph_seals) == 24,
         'denominator-drift')
    freeze = json.loads((BASE / 'exposed-r9/test-query-rankings/FREEZE.json').read_bytes())
    need(freeze['cases'] == 24 and freeze['gold_opened'] is False and
         freeze['pins']['protocol'] == PINS['protocol'], 'channel-freeze-drift')
    rows = []
    rank_hashes = []
    for ordinal, (src, query, prior, edge, graph_seal) in enumerate(zip(
            sources, queries, old, edges, graph_seals), 1):
        rank_path = BASE / f'exposed-r9/test-query-rankings/TEST-QUERY-RANKING-{ordinal:02d}.json'
        graph_path = BASE / f'rankings-r6/graph/GRAPH-RANKING-{ordinal:02d}.json'
        rank_data, graph_data = rank_path.read_bytes(), graph_path.read_bytes()
        channel, graph = json.loads(rank_data), json.loads(graph_data)
        need(src['slot'] == query['ordinal'] == prior['ordinal'] == edge['ordinal'] ==
             graph_seal['ordinal'] == channel['ordinal'] == graph['ordinal'] == ordinal and
             src['image_tag'] == query['id'] == prior['id'] == edge['id'] ==
             channel['id'] == graph['id'] and
             src['failed_commit'] == query['base_commit'] == prior['base_commit'] ==
             edge['base_commit'] == channel['base_commit'] == graph['base_commit'] and
             sha(graph_data) == graph_seal['ranking_sha256'] and
             channel['query_sha256'] == query['query_sha256'] and
             channel['gold_opened'] is False and channel['model_calls'] == 0,
             f'case-identity-{ordinal}')
        r2, r3 = graph['ranked_files'], edge['ranked_files']
        need(len(r2) == len(r3) == src['projected_files'] and set(r2) == set(r3),
             f'baseline-set-{ordinal}')
        union = list(dict.fromkeys(r2[:30] + r3[:30]))
        need(union == prior['union_paths'], f'prior-union-{ordinal}')
        if channel['skipped']:
            need(not channel['ranked_files'] and channel['test_query_bytes'] == 0,
                 f'skipped-channel-{ordinal}')
        else:
            need(len(channel['ranked_files']) == len(set(channel['ranked_files'])) ==
                 src['projected_files'] and set(channel['ranked_files']) == set(r2) and
                 channel['indexed_bytes'] == src['projected_bytes'],
                 f'channel-coverage-{ordinal}')
        selected, seen, added = list(union), set(union), []
        for path in channel['ranked_files']:
            if len(added) >= 20 or len(selected) >= 80:
                break
            if path in seen or rule.is_test(path):
                continue
            selected.append(path)
            seen.add(path)
            added.append(path)
        for item in prior['added']:
            path = item['path']
            if len(selected) >= 80:
                break
            if path not in seen:
                selected.append(path)
                seen.add(path)
        need(len(selected) == len(set(selected)) <= 80 and
             set(union).issubset(selected) and set(selected).issubset(r2),
             f'selection-coverage-{ordinal}')
        rows.append({'schema_version': 'are.g01-exposed-r9-test-query-candidates/v1',
                     'ordinal': ordinal, 'id': query['id'], 'repo': query['repo'],
                     'base_commit': query['base_commit'],
                     'channel_ranking_sha256': sha(rank_data),
                     'old_candidate_count': prior['candidate_count'],
                     'union_paths': union, 'channel_added': added,
                     'candidate_paths': selected, 'candidate_count': len(selected),
                     'gold_opened': False, 'model_calls': 0})
        rank_hashes.append(sha(rank_data))
        print(json.dumps({'ordinal': ordinal, 'old': prior['candidate_count'],
                          'new': len(selected), 'channel_added': len(added)}), flush=True)
    OUTPUT.mkdir(parents=True, mode=0o700)
    data = ''.join(json.dumps(row, sort_keys=True) + '\n' for row in rows).encode()
    write_new(OUTPUT / 'CANDIDATES.jsonl', data)
    seal = {'schema_version': 'are.g01-exposed-r9-test-query-candidate-seal/v1',
            'input_sha256': PINS, 'channel_ranking_sha256': rank_hashes,
            'script_sha256': sha(Path(__file__).read_bytes()),
            'cases': 24, 'maximum_candidates': max(row['candidate_count'] for row in rows),
            'total_candidates': sum(row['candidate_count'] for row in rows),
            'candidate_sha256': sha(data), 'gold_opened': False, 'model_calls': 0}
    encoded = (json.dumps(seal, sort_keys=True, indent=2) + '\n').encode()
    write_new(OUTPUT / 'CANDIDATE-SEAL.json', encoded)
    print(json.dumps({'cases': 24, 'candidate_sha256': sha(data),
                      'seal_sha256': sha(encoded),
                      'maximum_candidates': seal['maximum_candidates']}))


if __name__ == '__main__':
    main()
