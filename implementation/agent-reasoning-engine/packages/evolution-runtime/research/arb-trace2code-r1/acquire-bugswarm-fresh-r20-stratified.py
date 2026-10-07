#!/usr/bin/env python3
"""Transfer the fixed source-only r7 stratified selector to fresh G01."""

from __future__ import annotations

from collections import Counter, defaultdict
import json
import os
from pathlib import Path, PurePosixPath

from bugswarm_fresh_r20_inputs import BASE, HERE, INPUTS, PINS, failed_log, load, need, rows, sha, verify


OUTPUT = BASE / 'candidates-r20/stratified'
EDGE = BASE / 'rankings-r20/test-edges/TEST-EDGE-RANKINGS.jsonl'
EDGE_SEAL = BASE / 'rankings-r20/test-edges/TEST-EDGE-SEAL.json'
EDGE_SHA = 'f3951e2911b479ceb3f31d1c9edcbcad8543629be400bf3f2ae6c2de651b9243'
EDGE_SEAL_SHA = '851e9554c3c78cfc8f7e3060dc0c745184b581a0977a6eb95bd5fcb75d662ae6'


def write_new(path: Path, data: bytes) -> None:
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)


def main() -> None:
    need(not OUTPUT.exists(), 'output-exists')
    verify('source', 'queries', 'cohort', 'graph_seal', 'dev_rule', 'r2_rule', 'protocol')
    need(sha(EDGE.read_bytes()) == EDGE_SHA and sha(EDGE_SEAL.read_bytes()) == EDGE_SEAL_SHA,
         'test-edge-pin-drift')
    dev = load(INPUTS['dev_rule'], 'g01_fresh_dev_strata')
    graph = load(INPUTS['r2_rule'], 'g01_fresh_graph_is_test')
    sources, queries, cohort, graph_seals = rows()
    edge_rows = [json.loads(line) for line in EDGE.read_text().splitlines()]
    need(len(edge_rows) == 24, 'test-edge-denominator')
    out = []
    for ordinal, (src, query, slot, graph_seal, edge) in enumerate(zip(
            sources, queries, cohort, graph_seals, edge_rows), 1):
        final = slot['final']
        graph_data = (BASE / f'rankings-r19/graph/GRAPH-RANKING-{ordinal:02d}.json').read_bytes()
        ranking = json.loads(graph_data)
        need(src['slot'] == query['ordinal'] == slot['slot'] == graph_seal['ordinal'] == edge['ordinal'] == ordinal and
             src['image_tag'] == query['id'] == final['image_tag'] == ranking['id'] == edge['id'] and
             src['failed_commit'] == query['base_commit'] == final['failed_commit'] == edge['base_commit'] and
             sha(graph_data) == graph_seal['ranking_sha256'] and
             edge['graph_ranking_sha256'] == graph_seal['ranking_sha256'] and
             src['projected_tree_sha256'] == edge['source_tree_sha256'],
             f'identity-{ordinal}')
        log = failed_log(ordinal, slot, query)
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
        out.append({'schema_version': 'are.g01-fresh-stratified-candidates-r20/v1',
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
    OUTPUT.mkdir(parents=True, mode=0o700)
    data = ''.join(json.dumps(row, sort_keys=True) + '\n' for row in out).encode()
    write_new(OUTPUT / 'CANDIDATES.jsonl', data)
    seal = {'schema_version': 'are.g01-fresh-stratified-candidate-seal-r20/v1',
            'input_sha256': {key: PINS[key] for key in
                             ('source', 'queries', 'cohort', 'graph_seal',
                              'dev_rule', 'r2_rule', 'protocol')},
            'test_edge_sha256': EDGE_SHA, 'test_edge_seal_sha256': EDGE_SEAL_SHA,
            'script_sha256': sha(Path(__file__).read_bytes()),
            'helper_sha256': sha((HERE / 'bugswarm_fresh_r20_inputs.py').read_bytes()),
            'cases': 24, 'maximum_candidates': max(row['candidate_count'] for row in out),
            'candidate_sha256': sha(data), 'gold_opened': False, 'model_calls': 0}
    encoded = (json.dumps(seal, sort_keys=True, indent=2) + '\n').encode()
    write_new(OUTPUT / 'CANDIDATE-SEAL.json', encoded)
    print(json.dumps({'cases': 24, 'maximum_candidates': seal['maximum_candidates'],
                      'candidate_sha256': sha(data), 'seal_sha256': sha(encoded)}))


if __name__ == '__main__':
    main()
