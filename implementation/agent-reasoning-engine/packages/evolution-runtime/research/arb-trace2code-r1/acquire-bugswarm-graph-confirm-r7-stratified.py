#!/usr/bin/env python3
"""Transfer the fixed source-only cohort-B stratified selector to confirmation."""

from __future__ import annotations

from collections import Counter, defaultdict
import gzip
import hashlib
import importlib.util
import json
import os
from pathlib import Path, PurePosixPath


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
R4 = BASE / 'graph-confirm-r4'
R1 = BASE / 'graph-confirm-r1/source-only/g01-bugswarm-graph-confirm-r1-preflight'
R2 = BASE / 'graph-confirm-r1/source-only/g01-bugswarm-graph-confirm-r2-repair'
OUTPUT = R4 / 'candidates-r7'
PROTOCOL = HERE.parents[1] / 'evidence/G01-BUGSWARM-GRAPH-CONFIRM-R7-CANDIDATE-PROTOCOL-2026-10-04.md'
PINS = {
    'source': '3eea3878d6769be39a88c98473cfc7eb0c019e4e33f82b665b7b18271dda4e4a',
    'queries': 'd570e3ab4a9e0f5c9945544bbb2681949c96ffdfcf106abd9d9007634254a2aa',
    'cohort': 'a55087a01c1b157ea7fcd6dfa4327037a3e4cb13c72df5e0c31b44d80513c22c',
    'graph_seal': '0ae5f79b60d96eacc1c8cbb84c88c274416686566c2a48156dd19c61aa6ef320',
    'test_edges': 'e59b008fbde1ed1934d057e1c46fc7174dd1570ef98c797eb44f29161dd984d0',
    'test_edge_seal': 'f2b2e8bf0d871875bb555c486ae866e3fd32050ba5ef0fe5848e21b3b96ec641',
    'dev_rule': '72ddfd871b41cfb2cb56daf4d92ee76b526630ffab5097f11328aaefd567aeb1',
    'graph_rule': 'e0664909091562e38a547f04c7901e88ae2723bfe9d4bd2f0cdef2c561a770d0',
    'protocol': '008a0f5a4289815cafeaf53808d61629fef4def5ad9e88b6f8bc3bffd3bf7b64',
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
        'test_edges': R4 / 'rankings-r7/test-edges/TEST-EDGE-RANKINGS.jsonl',
        'test_edge_seal': R4 / 'rankings-r7/test-edges/TEST-EDGE-SEAL.json',
        'dev_rule': HERE / 'acquire-bugswarm-graph-dev-b-r7-stratified.py',
        'graph_rule': HERE / 'rank-bugswarm-graph-dev-r2-graph.py',
        'protocol': PROTOCOL,
    }
    need(not OUTPUT.exists() and
         all(sha(path.read_bytes()) == PINS[name] for name, path in inputs.items()),
         'output-exists-or-input-pin-drift')
    dev = load(inputs['dev_rule'], 'g01_confirm_dev_strata')
    graph = load(inputs['graph_rule'], 'g01_confirm_graph_is_test')
    sources = json.loads(inputs['source'].read_bytes())['records']
    queries = [json.loads(line) for line in inputs['queries'].read_text().splitlines()]
    cohort = json.loads(inputs['cohort'].read_bytes())['rows']
    graph_seals = json.loads(inputs['graph_seal'].read_bytes())['rankings']
    edge_rows = [json.loads(line) for line in inputs['test_edges'].read_text().splitlines()]
    need(len(sources) == len(queries) == len(cohort) == len(graph_seals) == len(edge_rows) == 24,
         'denominator-drift')
    OUTPUT.mkdir(mode=0o700)
    rows = []
    for ordinal, (src, query, slot, graph_seal, edge) in enumerate(zip(
            sources, queries, cohort, graph_seals, edge_rows), 1):
        final = slot['final']
        graph_path = R4 / f'rankings-r6/graph/GRAPH-RANKING-{ordinal:02d}.json'
        graph_data = graph_path.read_bytes()
        ranking = json.loads(graph_data)
        need(src['slot'] == query['ordinal'] == slot['slot'] == graph_seal['ordinal'] == edge['ordinal'] == ordinal and
             src['image_tag'] == query['id'] == final['image_tag'] == ranking['id'] == edge['id'] and
             src['failed_commit'] == query['base_commit'] == final['failed_commit'] == edge['base_commit'] and
             sha(graph_data) == graph_seal['ranking_sha256'] and
             edge['graph_ranking_sha256'] == graph_seal['ranking_sha256'] and
             src['projected_tree_sha256'] == edge['source_tree_sha256'],
             f'identity-{ordinal}')
        if slot['retained']:
            log = (R1 / f'HTTPS-LOG-{ordinal:02d}.txt').read_bytes()
        else:
            attempt = slot['attempts'][-1]
            need(attempt['admitted'], f'log-admission-{ordinal}')
            log = gzip.decompress((R2 / attempt['log']['body_file']).read_bytes())
        need(sha(log) == query['log_sha256'] == final['log_sha256'],
             f'log-hash-{ordinal}')
        r2_paths, r3_paths = ranking['ranked_files'], edge['ranked_files']
        need(len(r2_paths) == len(r3_paths) == src['projected_files'] and
             set(r2_paths) == set(r3_paths), f'ranking-coverage-{ordinal}')
        union = list(dict.fromkeys(r2_paths[:30] + r3_paths[:30]))
        need(len(union) <= 60, f'union-cap-{ordinal}')
        all_words: Counter[str] = Counter()
        failure_lines: Counter[str] = Counter()
        for line in log.decode('utf-8', errors='replace').splitlines():
            words = [word.lower() for word in dev.TOKEN.findall(line)]
            all_words.update(words)
            if dev.FAILURE_LINE.search(line):
                failure_lines.update(set(words))
        rank = {path: i for i, path in enumerate(r2_paths)}
        by_stem: dict[str, list[str]] = defaultdict(list)
        for path in r2_paths:
            if graph.is_test(path):
                continue
            stem = PurePosixPath(path).stem
            if dev.STEM.fullmatch(stem):
                by_stem[stem.lower()].append(path)
        unique = {stem: paths[0] for stem, paths in by_stem.items() if len(paths) == 1}
        selected, seen, added = list(union), set(union), []
        allowance = min(31, 80 - len(union))

        def take(entries: list[tuple[str, int]], limit: int, source: str) -> None:
            count = 0
            for path, support in entries:
                if path in seen:
                    continue
                if len(added) >= allowance or count >= limit:
                    break
                seen.add(path)
                selected.append(path)
                added.append({'path': path, 'source': source,
                              'support': support, 'r2_rank': rank[path] + 1})
                count += 1

        failures = [(path, failure_lines[stem]) for stem, path in unique.items()
                    if failure_lines[stem] > 0]
        failures.sort(key=lambda item: (-item[1], -len(PurePosixPath(item[0]).stem),
                                        rank[item[0]], item[0]))
        take(failures, 12, 'failure-line')
        aliases = []
        for stem, path in unique.items():
            count = sum(all_words[alias] for alias in (
                'test' + stem, stem + 'test', stem + 'tests', stem + 'it',
                stem + 'integrationtest'))
            if count:
                aliases.append((path, count))
        aliases.sort(key=lambda item: (-item[1], -len(PurePosixPath(item[0]).stem),
                                       rank[item[0]], item[0]))
        take(aliases, 10, 'test-alias')
        rare = [(path, all_words[stem]) for stem, path in unique.items()
                if 1 <= all_words[stem] <= 8]
        rare.sort(key=lambda item: (-len(PurePosixPath(item[0]).stem), item[1],
                                    rank[item[0]], item[0]))
        take(rare, allowance, 'rare-stem')
        need(len(selected) == len(set(selected)) <= 80 and
             all(path in seen for path in union) and
             set(selected).issubset(rank), f'candidate-coverage-{ordinal}')
        rows.append({'schema_version': 'are.g01-confirm-stratified-candidates-r7/v1',
                     'ordinal': ordinal, 'id': query['id'], 'repo': query['repo'],
                     'language': query['language'], 'base_commit': query['base_commit'],
                     'log_sha256': query['log_sha256'],
                     'graph_ranking_sha256': graph_seal['ranking_sha256'],
                     'test_edge_ranking_sha256': sha((json.dumps(edge, sort_keys=True) + '\n').encode()),
                     'union_paths': union, 'added': added, 'candidate_paths': selected,
                     'candidate_count': len(selected), 'gold_opened': False,
                     'model_calls': 0})
        print(json.dumps({'ordinal': ordinal, 'union': len(union),
                          'added': len(added), 'total': len(selected)}), flush=True)
    data = ''.join(json.dumps(row, sort_keys=True) + '\n' for row in rows).encode()
    write_new(OUTPUT / 'CANDIDATES.jsonl', data)
    seal = {'schema_version': 'are.g01-confirm-candidate-seal-r7/v1',
            'input_sha256': PINS, 'script_sha256': sha(Path(__file__).read_bytes()),
            'cases': 24, 'maximum_candidates': max(row['candidate_count'] for row in rows),
            'candidate_sha256': sha(data), 'gold_opened': False, 'model_calls': 0}
    encoded = (json.dumps(seal, sort_keys=True, indent=2) + '\n').encode()
    write_new(OUTPUT / 'CANDIDATE-SEAL.json', encoded)
    print(json.dumps({'cases': 24, 'maximum_candidates': seal['maximum_candidates'],
                      'candidate_sha256': sha(data), 'seal_sha256': sha(encoded)}))


if __name__ == '__main__':
    main()
