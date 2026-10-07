#!/usr/bin/env python3
"""Seal fresh G01 source-only packets with the fixed exposed-r10 template."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/fresh-r11')
OUTPUT = BASE / 'packets-r21'
PROTOCOL = HERE.parents[1] / 'evidence/G01-BUGSWARM-FRESH-R21-PACKET-PROTOCOL-2026-10-04.md'
PINS = {
    'candidates': '051a87aceb886259964e8f8fbddb186b63b560f2cb33f6a72efe6e72c4a39aac',
    'candidate_seal': '694f4139b079ad0fd74a35ecc96de3ff7d2bca1ae8dde4586777fd8caf5c0a48',
    'old_candidates': '24df57a9913190a1567e92fd0b6b601605ce795ca1780dbe71161d1f1d2f7205',
    'test_edges': 'f3951e2911b479ceb3f31d1c9edcbcad8543629be400bf3f2ae6c2de651b9243',
    'graph_seal': '44322041d7fb68fec12557d8b1341d54935a5bf42046130963d407eedf4fa2c4',
    'queries': '7943e67c8ce84ba43cde47e726ed89b681151a621754e61741871a6ad0e94470',
    'source': '6f76dafa33ed79a1ddfba5a3278e95ccb39161513ff35bc23dc927ce13dd1992',
    'excerpt_rule': '17b209eb80674fff7354ebfb14937af3255f8eb84cdb20dfff4f349894b4608d',
    'protocol': '3a8c9568ad4dd2591988c0993e74bb3370692fce5bb714ca7d3c47d6fab4b52d',
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
        'candidates': BASE / 'candidates-r20/final/CANDIDATES.jsonl',
        'candidate_seal': BASE / 'candidates-r20/final/CANDIDATE-SEAL.json',
        'old_candidates': BASE / 'candidates-r20/stratified/CANDIDATES.jsonl',
        'test_edges': BASE / 'rankings-r20/test-edges/TEST-EDGE-RANKINGS.jsonl',
        'graph_seal': BASE / 'rankings-r19/graph/GRAPH-SEAL.json',
        'queries': BASE / 'query-only-r18/QUERIES.jsonl',
        'source': BASE / 'code-only-r17/RESULT.json',
        'excerpt_rule': HERE / 'build-bugswarm-graph-dev-r4-union-packets.py',
        'protocol': PROTOCOL,
    }
    need(not OUTPUT.exists(), 'output-exists')
    for name, path in inputs.items():
        need(sha(path.read_bytes()) == PINS[name], f'input-pin-drift:{name}')
    spec = importlib.util.spec_from_file_location('g01_fresh_excerpt', inputs['excerpt_rule'])
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
         candidate_seal['total_candidates'] == 1381,
         'denominator-or-candidate-seal-drift')
    packets, stats = [], []
    for ordinal, (selection, prior, edge, query, source, graph_seal) in enumerate(zip(
            rows['candidates'], rows['old_candidates'], rows['test_edges'],
            rows['queries'], sources, graph_seals), 1):
        graph_data = (BASE / f'rankings-r19/graph/GRAPH-RANKING-{ordinal:02d}.json').read_bytes()
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
        need(root.parent == (BASE / 'code-only-r17').resolve(), f'root-boundary:{ordinal}')
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
        packets.append({'schema_version': 'are.g01-fresh-r21-packet/v1',
                        'ordinal': ordinal, 'id': query['id'], 'repo': query['repo'],
                        'language': query['language'], 'base_commit': query['base_commit'],
                        'source_tree_sha256': source['projected_tree_sha256'],
                        'graph_ranking_sha256': graph_seal['ranking_sha256'],
                        'candidate_sha256': PINS['candidates'],
                        'query': query['query'], 'candidate_count': len(entries),
                        'candidates': entries, 'prompt': prompt,
                        'gold_opened': False, 'model_calls': 0,
                        'fresh_confirmation': True})
        stats.append({'ordinal': ordinal, 'candidate_count': len(entries),
                      'prompt_bytes': prompt_bytes})
        print(json.dumps(stats[-1]), flush=True)
    OUTPUT.mkdir(parents=True, mode=0o700)
    data = ''.join(json.dumps(row, ensure_ascii=False) + '\n' for row in packets).encode()
    write_new(OUTPUT / 'PACKETS.jsonl', data)
    seal = {'schema_version': 'are.g01-fresh-r21-packet-seal/v1',
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
