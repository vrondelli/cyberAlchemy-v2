#!/usr/bin/env python3
"""Select bounded fresh G01 candidates with the unchanged r9 priority."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import os
from pathlib import Path


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/fresh-r11')
OUTPUT = BASE / 'candidates-r20/final'
PINS = {
    'source': '6f76dafa33ed79a1ddfba5a3278e95ccb39161513ff35bc23dc927ce13dd1992',
    'queries': '7943e67c8ce84ba43cde47e726ed89b681151a621754e61741871a6ad0e94470',
    'old_candidates': '24df57a9913190a1567e92fd0b6b601605ce795ca1780dbe71161d1f1d2f7205',
    'graph_seal': '44322041d7fb68fec12557d8b1341d54935a5bf42046130963d407eedf4fa2c4',
    'test_edges': 'f3951e2911b479ceb3f31d1c9edcbcad8543629be400bf3f2ae6c2de651b9243',
    'protocol': 'a5af538a3e1de67b330534b3701a9869d889b0abde56de22fbe18066c0d5073b',
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
        'source': BASE / 'code-only-r17/RESULT.json',
        'queries': BASE / 'query-only-r18/QUERIES.jsonl',
        'old_candidates': BASE / 'candidates-r20/stratified/CANDIDATES.jsonl',
        'graph_seal': BASE / 'rankings-r19/graph/GRAPH-SEAL.json',
        'test_edges': BASE / 'rankings-r20/test-edges/TEST-EDGE-RANKINGS.jsonl',
        'protocol': HERE.parents[1] / 'evidence/G01-BUGSWARM-FRESH-R20-ACQUISITION-PROTOCOL-2026-10-04.md',
        'graph_rule': HERE / 'rank-bugswarm-graph-dev-r2-graph.py',
    }
    need(not OUTPUT.exists() and
         all(sha(path.read_bytes()) == PINS[name] for name, path in inputs.items()),
         'output-or-input-pin-drift')
    spec = importlib.util.spec_from_file_location('g01_r20_graph_test', inputs['graph_rule'])
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
    freeze = json.loads((BASE / 'rankings-r20/test-query/FREEZE.json').read_bytes())
    need(freeze['cases'] == 24 and freeze['gold_opened'] is False and
         freeze['pins']['protocol'] == PINS['protocol'], 'channel-freeze-drift')
    rows = []
    rank_hashes = []
    for ordinal, (src, query, prior, edge, graph_seal) in enumerate(zip(
            sources, queries, old, edges, graph_seals), 1):
        rank_data = (BASE / f'rankings-r20/test-query/TEST-QUERY-RANKING-{ordinal:02d}.json').read_bytes()
        graph_data = (BASE / f'rankings-r19/graph/GRAPH-RANKING-{ordinal:02d}.json').read_bytes()
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
        rows.append({'schema_version': 'are.g01-fresh-r20-test-query-candidates/v1',
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
    seal = {'schema_version': 'are.g01-fresh-r20-test-query-candidate-seal/v1',
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
