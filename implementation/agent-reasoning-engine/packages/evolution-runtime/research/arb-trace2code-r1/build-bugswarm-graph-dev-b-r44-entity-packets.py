#!/usr/bin/env python3
"""Transfer the byte-pinned r43 entity-card rule to cohort B."""
from __future__ import annotations

import hashlib
import importlib.util
import json
import os
from pathlib import Path

HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-dev-b-r2')
SOURCE = BASE / 'code-only/SOURCE-PROJECTION-RECEIPT.json'
QUERIES = BASE / 'code-only/QUERIES-B-R3.jsonl'
RANKINGS = BASE / 'code-only/graph-r2/GRAPH-RANKINGS-B-R3.jsonl'
GRAPH_SEAL = BASE / 'code-only/graph-r2/GRAPH-RANKING-SEAL-B-R3.json'
RULE = HERE / 'build-bugswarm-selective-r43-entity-packets.py'
PROTOCOL = HERE.parents[1] / 'evidence/G01-BUGSWARM-GRAPH-DEV-B-R44-GUARDED-ENTITY-TRANSFER-PROTOCOL-2026-10-04.md'
OUTPUT = BASE / 'code-only/entity-r44/packets'
PINS = {
    'source': (SOURCE, 'ac0e840cad602ac5b5f80ba7579389ab95cc6efdb4ae682c1744103b29db5d92'),
    'queries': (QUERIES, '696c742d96c69f7260f94a70d5159620c3bef8bb82e0d34b44beaddc31cdfe8b'),
    'rankings': (RANKINGS, '86b39c47e9ce166d4db66068d5894f3e9cbac1275b11d549df1e17ee121cb32d'),
    'graph_seal': (GRAPH_SEAL, 'bef3ad37a6c4f87d08e3254df47a7ae1c52e641b58a672859511a47737639813'),
    'entity_rule': (RULE, 'f6781792d07cb4ea25e083732e192529d5cb7ac3c07300ca44642e567e34025b'),
    'protocol': (PROTOCOL, '8009f24043f2e8190ad9af707c0b17a81237b15d6e0e962509f1a63d1372c958'),
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(condition: bool, reason: str) -> None:
    if not condition:
        raise SystemExit(reason)


def write_new(path: Path, data: bytes) -> None:
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'wb') as handle:
        handle.write(data)


def main() -> None:
    need(not OUTPUT.exists(), 'output-exists')
    need(all(sha(path.read_bytes()) == digest for path, digest in PINS.values()), 'input-drift')
    spec = importlib.util.spec_from_file_location('r43_entity_rule', RULE)
    need(spec is not None and spec.loader is not None, 'rule-unavailable')
    rule = importlib.util.module_from_spec(spec); spec.loader.exec_module(rule)
    sources = json.loads(SOURCE.read_bytes())['records']
    queries = [json.loads(line) for line in QUERIES.read_text().splitlines()]
    rankings = [json.loads(line) for line in RANKINGS.read_text().splitlines()]
    graph_seal = json.loads(GRAPH_SEAL.read_bytes())
    need(len(sources) == len(queries) == len(rankings) == graph_seal['cases'] == 24 and
         graph_seal['rankings_sha256'] == PINS['rankings'][1], 'denominator')
    OUTPUT.mkdir(parents=True, mode=0o700)
    freeze = {
        'schema_version': 'are.g01-graph-dev-b-r44-packet-freeze/v1',
        'input_sha256': {name: digest for name, (_, digest) in PINS.items()},
        'builder_sha256': sha(Path(__file__).read_bytes()),
        'entity_card_rule': 'byte-pinned r43 words() and card()',
        'fixed_graph_prefix': 4,
        'cases': 24,
        'gold_opened': False, 'model_calls': 0, 'network_calls': 0,
    }
    write_new(OUTPUT / 'PACKET-FREEZE.json', (json.dumps(freeze, sort_keys=True, indent=2) + '\n').encode())
    packets = []
    for ordinal, (source, query, graph) in enumerate(zip(sources, queries, rankings), 1):
        need(source['ordinal'] == graph['ordinal'] == ordinal and query['id'] == source['image_tag'] == graph['id'] and
             query['base_commit'] == source['commit'] == graph['base_commit'] and
             query['language'] == source['language'] == graph['language'] and
             source['projected_tree_sha256'] == graph['source_tree_sha256'], f'identity-{ordinal}')
        root = Path(source['root']).resolve(strict=True)
        need(root.parent == (BASE / 'code-only').resolve(), f'root-{ordinal}')
        selected = graph['ranked_files'][:min(30, graph['candidate_count'])]
        query_words = rule.words(query['query'])
        entries, lines = [], []
        for candidate_id, relative in enumerate(selected, 1):
            rendered, diagnostic = rule.card(root, relative, candidate_id, query_words, source['language'])
            entries.append({'candidate_id': candidate_id, 'path': relative,
                            'graph_rank': candidate_id, **diagnostic})
            lines.append(rendered)
        prompt = (
            'Locate the implementation file responsible for the failure. '
            'Candidates are source files from the exact failed commit and are ordered by a strong graph prior. '
            'Entity cards contain bounded declarations, imports, and query-matching source lines. '
            'Move a lower-ranked file ahead only when its source evidence directly explains the failed test. '
            'Return only JSON {"candidate_ids":[...]} with at most 8 distinct candidate IDs, best first. No prose.\n'
            'Failure:\n' + query['query'] + '\nEntity cards:\n' + '\n'.join(lines)
        )
        prompt_bytes = len(prompt.encode())
        need(prompt_bytes <= 24_000, f'prompt-cap-{ordinal}:{prompt_bytes}')
        packets.append({
            'schema_version': 'are.g01-graph-dev-b-r44-entity-packet/v1',
            'ordinal': ordinal, 'id': query['id'], 'repo': query['repo'],
            'language': query['language'], 'base_commit': query['base_commit'],
            'query_sha256': query['query_sha256'],
            'source_tree_sha256': source['projected_tree_sha256'],
            'graph_rankings_sha256': PINS['rankings'][1],
            'candidate_count': len(entries), 'candidates': entries,
            'prompt': prompt, 'prompt_bytes': prompt_bytes,
            'fixed_graph_prefix': 4, 'gold_opened': False, 'model_calls': 0,
        })
        print(json.dumps({'ordinal': ordinal, 'candidates': len(entries), 'prompt_bytes': prompt_bytes}), flush=True)
    packet_data = ''.join(json.dumps(packet, sort_keys=True) + '\n' for packet in packets).encode()
    write_new(OUTPUT / 'PACKETS.jsonl', packet_data)
    seal = {
        'schema_version': 'are.g01-graph-dev-b-r44-packet-seal/v1',
        'packet_freeze_sha256': sha((OUTPUT / 'PACKET-FREEZE.json').read_bytes()),
        'cases': 24, 'total_candidates': sum(packet['candidate_count'] for packet in packets),
        'minimum_candidates': min(packet['candidate_count'] for packet in packets),
        'maximum_candidates': max(packet['candidate_count'] for packet in packets),
        'maximum_prompt_bytes': max(packet['prompt_bytes'] for packet in packets),
        'packets_sha256': sha(packet_data), 'fixed_graph_prefix': 4,
        'gold_opened': False, 'model_calls': 0, 'network_calls': 0,
    }
    seal_data = (json.dumps(seal, sort_keys=True, indent=2) + '\n').encode()
    write_new(OUTPUT / 'PACKET-SEAL.json', seal_data)
    print(json.dumps({**seal, 'seal_sha256': sha(seal_data)}, sort_keys=True))


if __name__ == '__main__':
    main()
