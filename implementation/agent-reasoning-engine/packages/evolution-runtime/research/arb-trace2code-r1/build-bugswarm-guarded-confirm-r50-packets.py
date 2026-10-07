#!/usr/bin/env python3
"""Apply unchanged graph/entity rules and seal r50 live-run packets."""

from __future__ import annotations

import gzip
import hashlib
import importlib.util
import json
import os
from pathlib import Path


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
SOURCE = BASE / 'guarded-confirm-r48/code-projection-r1/RESULT.json'
QUERIES = BASE / 'guarded-confirm-r50/queries/QUERIES.jsonl'
BM25_DIR = BASE / 'guarded-confirm-r50/bm25'
BM25_SEAL = BM25_DIR / 'SEAL.json'
GRAPH_RULE = HERE / 'rank-bugswarm-graph-dev-r2-graph.py'
ENTITY_RULE = HERE / 'build-bugswarm-selective-r43-entity-packets.py'
PROTOCOL = HERE.parents[1] / 'evidence/G01-BUGSWARM-GUARDED-CONFIRM-R50-TREATMENT-CONSTRUCTION-PROTOCOL-2026-10-04.md'
OUTPUT = BASE / 'guarded-confirm-r50/packets'
PINS = {
    'source': 'bcc866fdae18d163850bbaa530a410e071e0e6948ff62710da3d22b6b915413b',
    'queries': '7de33ff4eb40f085a0b1a5df7ce6467a382736fc6c30b96a24b9a08cc511bc87',
    'bm25_seal': '54ecba38854f04bcd5eab220fe6e3c062ae78b5dcbdf353f39bac56971e1d6ae',
    'graph_rule': 'e0664909091562e38a547f04c7901e88ae2723bfe9d4bd2f0cdef2c561a770d0',
    'entity_rule': 'f6781792d07cb4ea25e083732e192529d5cb7ac3c07300ca44642e567e34025b',
    'protocol': 'c584551195ce9c7614675bcdfb4b5d454480c760808c715e7b7a19a8e350d052',
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(ok: bool, reason: str) -> None:
    if not ok:
        raise SystemExit(reason)


def load_rule(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    need(spec is not None and spec.loader is not None, f'rule-unavailable:{name}')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def write_new(path: Path, data: bytes) -> None:
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)


def main() -> None:
    need(not OUTPUT.exists(), 'output-exists')
    paths = {'source': SOURCE, 'queries': QUERIES, 'bm25_seal': BM25_SEAL,
             'graph_rule': GRAPH_RULE, 'entity_rule': ENTITY_RULE,
             'protocol': PROTOCOL}
    for name, path in paths.items():
        need(sha(path.read_bytes()) == PINS[name], f'input-pin-drift:{name}')
    graph_rule = load_rule('g01_r50_graph', GRAPH_RULE)
    entity_rule = load_rule('g01_r50_entity', ENTITY_RULE)
    sources = json.loads(SOURCE.read_bytes())['records']
    queries = [json.loads(line) for line in QUERIES.read_text().splitlines()]
    seal = json.loads(BM25_SEAL.read_bytes())
    need(len(sources) == len(queries) == len(seal['rankings']) == 24 and
         seal['gold_opened'] is False and seal['model_calls'] == 0,
         'denominator')
    OUTPUT.mkdir(parents=True, mode=0o700)
    freeze = {
        'schema_version': 'are.g01-guarded-confirm-r50-packet-freeze/v1',
        'input_sha256': PINS, 'builder_sha256': sha(Path(__file__).read_bytes()),
        'graph_rule': 'byte-pinned graph-r2',
        'entity_card_rule': 'byte-pinned r43 words() and card()',
        'fixed_graph_prefix': 4, 'cases': 24,
        'gold_opened': False, 'model_calls': 0, 'network_calls': 0,
    }
    write_new(OUTPUT / 'PACKET-FREEZE.json',
              (json.dumps(freeze, sort_keys=True, indent=2) + '\n').encode())

    graph_rows = []
    packets = []
    roots = (BASE / 'guarded-confirm-r48/code-projection-r1/roots').resolve()
    for ordinal, (source, query, item) in enumerate(
            zip(sources, queries, seal['rankings']), 1):
        need(source['slot'] == query['ordinal'] == item['ordinal'] == ordinal and
             source['image_tag'] == query['id'] == item['id'] and
             source['repo'] == query['repo'] and
             source['failed_commit'] == query['base_commit'],
             f'identity:{ordinal}')
        ranking_path = BM25_DIR / item['file']
        ranking_data = ranking_path.read_bytes()
        need(sha(ranking_data) == item['ranking_sha256'], f'bm25-drift:{ordinal}')
        bm25 = json.loads(ranking_data)
        provenance = query['log_provenance']
        log_path = (BASE / provenance['compressed_log']).resolve(strict=True)
        need(log_path.is_relative_to(BASE) and
             sha(log_path.read_bytes()) == provenance['compressed_log_sha256'],
             f'log-provenance:{ordinal}')
        log = gzip.decompress(log_path.read_bytes())
        need(len(log) == provenance['log_bytes'] and
             sha(log) == provenance['log_sha256'], f'log-body:{ordinal}')
        root = Path(source['root']).resolve(strict=True)
        need(root.parent == roots, f'root-boundary:{ordinal}')
        ranked, diag = graph_rule.rank_case(
            root, bm25['ranked_files'], log.decode('utf-8', errors='replace'),
            query['query'], source['language'])
        need(diag['source_tree_sha256'] == source['projected_tree_sha256'] and
             len(ranked) == len(set(ranked)) == source['projected_files'] and
             set(ranked) == set(bm25['ranked_files']), f'graph-coverage:{ordinal}')
        graph = {
            'schema_version': 'are.g01-guarded-confirm-r50-graph-ranking/v1',
            'ordinal': ordinal, 'id': query['id'], 'repo': query['repo'],
            'language': query['language'], 'base_commit': query['base_commit'],
            'query_sha256': query['query_sha256'],
            'source_tree_sha256': source['projected_tree_sha256'],
            'bm25_ranking_sha256': item['ranking_sha256'],
            'ranked_files': ranked, 'candidate_count': len(ranked), **diag,
            'gold_opened': False, 'model_calls': 0,
        }
        graph_rows.append(graph)
        selected = ranked[:min(30, len(ranked))]
        query_words = entity_rule.words(query['query'])
        entries, lines = [], []
        for candidate_id, relative in enumerate(selected, 1):
            rendered, diagnostic = entity_rule.card(
                root, relative, candidate_id, query_words, source['language'])
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
        need(prompt_bytes <= 24_000, f'prompt-cap:{ordinal}:{prompt_bytes}')
        packets.append({
            'schema_version': 'are.g01-guarded-confirm-r50-entity-packet/v1',
            'ordinal': ordinal, 'id': query['id'], 'repo': query['repo'],
            'language': query['language'], 'base_commit': query['base_commit'],
            'query_sha256': query['query_sha256'],
            'source_tree_sha256': source['projected_tree_sha256'],
            'graph_rankings_sha256': None,
            'candidate_count': len(entries), 'candidates': entries,
            'prompt': prompt, 'prompt_bytes': prompt_bytes,
            'fixed_graph_prefix': 4, 'gold_opened': False, 'model_calls': 0,
        })
        print(json.dumps({'ordinal': ordinal, 'graph_candidates': len(ranked),
                          'prompt_candidates': len(entries),
                          'prompt_bytes': prompt_bytes}), flush=True)

    graph_data = ''.join(json.dumps(row, sort_keys=True) + '\n'
                         for row in graph_rows).encode()
    graph_sha = sha(graph_data)
    write_new(OUTPUT / 'GRAPH-RANKINGS.jsonl', graph_data)
    for packet in packets:
        packet['graph_rankings_sha256'] = graph_sha
    packet_data = ''.join(json.dumps(row, sort_keys=True) + '\n'
                          for row in packets).encode()
    write_new(OUTPUT / 'PACKETS.jsonl', packet_data)
    seal_value = {
        'schema_version': 'are.g01-guarded-confirm-r50-packet-seal/v1',
        'packet_freeze_sha256': sha((OUTPUT / 'PACKET-FREEZE.json').read_bytes()),
        'cases': 24, 'graph_rankings_sha256': graph_sha,
        'total_candidates': sum(row['candidate_count'] for row in packets),
        'minimum_candidates': min(row['candidate_count'] for row in packets),
        'maximum_candidates': max(row['candidate_count'] for row in packets),
        'maximum_prompt_bytes': max(row['prompt_bytes'] for row in packets),
        'packets_sha256': sha(packet_data), 'fixed_graph_prefix': 4,
        'gold_opened': False, 'model_calls': 0, 'network_calls': 0,
    }
    seal_data = (json.dumps(seal_value, sort_keys=True, indent=2) + '\n').encode()
    write_new(OUTPUT / 'PACKET-SEAL.json', seal_data)
    print(json.dumps({**seal_value, 'seal_sha256': sha(seal_data)}, sort_keys=True))


if __name__ == '__main__':
    main()
