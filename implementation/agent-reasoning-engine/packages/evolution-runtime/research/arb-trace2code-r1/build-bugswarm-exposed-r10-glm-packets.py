#!/usr/bin/env python3
"""Seal source-only exposed r10 packets from the fixed r9 candidate list."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-confirm-r4')
OUTPUT = BASE / 'exposed-r10/packets'
PROTOCOL = HERE.parents[1] / 'evidence/G01-BUGSWARM-EXPOSED-R10-GLM-PROTOCOL-2026-10-04.md'
PINS = {
    'candidates': '7cdd714d5aca367b7ed9a24681391ac3ebd0e8b3e125d0eae1d5d12ce22840f5',
    'candidate_seal': '05204ebcab4b1157c524a474f22ea2ff04e7538d5644a73a604b49675e7cdac0',
    'old_candidates': '91784df7b72cae7502bd742248ac7b1d499e33d27a62ed265a936e7b0caa5056',
    'test_edges': 'e59b008fbde1ed1934d057e1c46fc7174dd1570ef98c797eb44f29161dd984d0',
    'graph_seal': '0ae5f79b60d96eacc1c8cbb84c88c274416686566c2a48156dd19c61aa6ef320',
    'queries': 'd570e3ab4a9e0f5c9945544bbb2681949c96ffdfcf106abd9d9007634254a2aa',
    'source': '3eea3878d6769be39a88c98473cfc7eb0c019e4e33f82b665b7b18271dda4e4a',
    'excerpt_rule': '17b209eb80674fff7354ebfb14937af3255f8eb84cdb20dfff4f349894b4608d',
    'protocol': '7decada8b70a7b4a038196c9494499b495977304448f26f6ad38c0b363bb822a',
}
WORDS = re.compile(r'[A-Za-z][A-Za-z0-9_]{2,}')


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(ok: bool, reason: str) -> None:
    if not ok:
        raise SystemExit(reason)


def write_new(path: Path, data: bytes) -> None:
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)


def main() -> None:
    inputs = {
        'candidates': BASE / 'exposed-r9/candidates/CANDIDATES.jsonl',
        'candidate_seal': BASE / 'exposed-r9/candidates/CANDIDATE-SEAL.json',
        'old_candidates': BASE / 'candidates-r7/CANDIDATES.jsonl',
        'test_edges': BASE / 'rankings-r7/test-edges/TEST-EDGE-RANKINGS.jsonl',
        'graph_seal': BASE / 'rankings-r6/graph/GRAPH-SEAL.json',
        'queries': BASE / 'query-only/QUERIES.jsonl',
        'source': BASE / 'code-only/RESULT.json',
        'excerpt_rule': HERE / 'build-bugswarm-graph-dev-r4-union-packets.py',
        'protocol': PROTOCOL,
    }
    need(not OUTPUT.exists(), 'output-exists')
    for name, path in inputs.items():
        need(sha(path.read_bytes()) == PINS[name], f'input-pin-drift:{name}')
    spec = importlib.util.spec_from_file_location('g01_r10_excerpt', inputs['excerpt_rule'])
    need(spec is not None and spec.loader is not None, 'excerpt-rule-unavailable')
    rule = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(rule)
    rows = {name: [json.loads(line) for line in inputs[name].read_text().splitlines()]
            for name in ('candidates', 'old_candidates', 'test_edges', 'queries')}
    sources = json.loads(inputs['source'].read_bytes())['records']
    graph_seals = json.loads(inputs['graph_seal'].read_bytes())['rankings']
    candidate_seal = json.loads(inputs['candidate_seal'].read_bytes())
    need(all(len(value) == 24 for value in rows.values()) and
         len(sources) == len(graph_seals) == 24 and
         candidate_seal['candidate_sha256'] == PINS['candidates'] and
         candidate_seal['total_candidates'] == 1382, 'denominator-or-candidate-seal-drift')
    packets, stats = [], []
    for ordinal, (selection, prior, edge, query, source, graph_seal) in enumerate(zip(
            rows['candidates'], rows['old_candidates'], rows['test_edges'],
            rows['queries'], sources, graph_seals), 1):
        graph_path = BASE / f'rankings-r6/graph/GRAPH-RANKING-{ordinal:02d}.json'
        graph_data = graph_path.read_bytes()
        graph = json.loads(graph_data)
        need(selection['ordinal'] == prior['ordinal'] == edge['ordinal'] ==
             query['ordinal'] == source['slot'] == graph_seal['ordinal'] == ordinal and
             selection['id'] == prior['id'] == edge['id'] == query['id'] ==
             source['image_tag'] == graph['id'] and
             selection['base_commit'] == edge['base_commit'] == query['base_commit'] ==
             source['failed_commit'] and
             source['projected_tree_sha256'] == edge['source_tree_sha256'] ==
             graph['source_tree_sha256'] and sha(graph_data) == graph_seal['ranking_sha256'] and
             selection['gold_opened'] is False and selection['model_calls'] == 0,
             f'identity:{ordinal}')
        r2, r3 = graph['ranked_files'], edge['ranked_files']
        selected = selection['candidate_paths']
        need(len(selected) == len(set(selected)) == selection['candidate_count'] <= 80 and
             set(selected).issubset(r2) and set(r2) == set(r3) and
             selection['union_paths'] == list(dict.fromkeys(r2[:30] + r3[:30])),
             f'candidate-coverage:{ordinal}')
        r2_rank = {path: i + 1 for i, path in enumerate(r2)}
        r3_rank = {path: i + 1 for i, path in enumerate(r3)}
        old_origin = {item['path']: item['source'] for item in prior['added']}
        channel = set(selection['channel_added'])
        root = Path(source['root']).resolve(strict=True)
        words = {word.lower() for word in WORDS.findall(query['query'])}
        entries, lines = [], []
        for candidate_id, path in enumerate(selected, 1):
            evidence, line = rule.excerpt(root, path, words)
            origin = ('failed-test-query' if path in channel else
                      old_origin.get(path, 'r2-r3-union'))
            item = {'candidate_id': candidate_id, 'path': path,
                    'r2_rank': r2_rank[path], 'r3_rank': r3_rank[path],
                    'origin': origin, 'excerpt': evidence, 'excerpt_start_line': line}
            entries.append(item)
            lines.append(f"[{candidate_id}] {path} | r2={item['r2_rank']} r3={item['r3_rank']} origin={origin} | {evidence}")
        prompt = ('Locate the implementation file responsible for the failure. '
                  'Candidates are source files at the exact failing commit. '
                  'The r2 rank is a prior, not proof; failure-context and test-name additions '
                  'may expose a better cause. Use the failure and code evidence. '
                  'Return only JSON {"candidate_ids":[...]} with at most 8 distinct '
                  'candidate IDs, best first. No prose.\nFailure:\n' + query['query'] +
                  '\nCandidates:\n' + '\n'.join(lines))
        prompt_bytes = len(prompt.encode())
        need(prompt_bytes <= 24_000, f'packet-byte-cap:{ordinal}:{prompt_bytes}')
        packets.append({'schema_version': 'are.g01-exposed-r10-packet/v1',
                        'ordinal': ordinal, 'id': query['id'], 'repo': query['repo'],
                        'language': query['language'], 'base_commit': query['base_commit'],
                        'source_tree_sha256': source['projected_tree_sha256'],
                        'graph_ranking_sha256': graph_seal['ranking_sha256'],
                        'candidate_sha256': PINS['candidates'],
                        'query': query['query'], 'candidate_count': len(entries),
                        'candidates': entries, 'prompt': prompt,
                        'gold_opened': False, 'model_calls': 0,
                        'exposed_development': True})
        stats.append({'ordinal': ordinal, 'candidate_count': len(entries),
                      'prompt_bytes': prompt_bytes})
        print(json.dumps(stats[-1]), flush=True)
    OUTPUT.mkdir(parents=True, mode=0o700)
    data = ''.join(json.dumps(row, ensure_ascii=False) + '\n' for row in packets).encode()
    write_new(OUTPUT / 'PACKETS.jsonl', data)
    seal = {'schema_version': 'are.g01-exposed-r10-packet-seal/v1',
            'input_sha256': PINS, 'builder_sha256': sha(Path(__file__).read_bytes()),
            'cases': 24, 'total_candidates': sum(row['candidate_count'] for row in stats),
            'maximum_candidates': max(row['candidate_count'] for row in stats),
            'maximum_prompt_bytes': max(row['prompt_bytes'] for row in stats),
            'case_stats': stats, 'packets_sha256': sha(data),
            'gold_opened': False, 'model_calls': 0}
    encoded = (json.dumps(seal, sort_keys=True, indent=2) + '\n').encode()
    write_new(OUTPUT / 'PACKET-SEAL.json', encoded)
    print(json.dumps({'cases': 24, 'maximum_prompt_bytes': seal['maximum_prompt_bytes'],
                      'packets_sha256': sha(data), 'seal_sha256': sha(encoded)}))


if __name__ == '__main__':
    main()
