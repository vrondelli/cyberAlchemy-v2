#!/usr/bin/env python3
"""Independently seal all G01 confirmation graph rankings."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path


BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-confirm-r4')
SOURCE = BASE / 'code-only/RESULT.json'
QUERIES = BASE / 'query-only/QUERIES.jsonl'
ARE = BASE / 'rankings-r6/are/ARE-SEAL.json'
GRAPH = BASE / 'rankings-r6/graph'
OUTPUT = GRAPH / 'GRAPH-SEAL.json'
PINS = {
    'source': '3eea3878d6769be39a88c98473cfc7eb0c019e4e33f82b665b7b18271dda4e4a',
    'queries': 'd570e3ab4a9e0f5c9945544bbb2681949c96ffdfcf106abd9d9007634254a2aa',
    'are': '45d73843608fdc5f43ceec2328fdfef9c2b41220f86d1d45fb20abb01ce3d736',
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(condition: bool, reason: str) -> None:
    if not condition:
        raise SystemExit(reason)


def main() -> None:
    need(not OUTPUT.exists() and sha(SOURCE.read_bytes()) == PINS['source'] and
         sha(QUERIES.read_bytes()) == PINS['queries'] and
         sha(ARE.read_bytes()) == PINS['are'], 'input-pin-or-output-drift')
    sources = json.loads(SOURCE.read_bytes())['records']
    queries = [json.loads(line) for line in QUERIES.read_text().splitlines()]
    are_seals = json.loads(ARE.read_bytes())['rankings']
    freeze_data = (GRAPH / 'FREEZE.json').read_bytes()
    freeze = json.loads(freeze_data)
    need(len(sources) == len(queries) == len(are_seals) == 24 and
         freeze['cases'] == 24 and freeze['input_sha256']['source'] == PINS['source'] and
         freeze['input_sha256']['queries'] == PINS['queries'] and
         freeze['input_sha256']['are_seal'] == PINS['are'] and
         freeze['gold_opened'] is False and freeze['model_calls'] == 0,
         'denominator-or-freeze-drift')
    rows = []
    for ordinal, (src, query, are_seal) in enumerate(zip(sources, queries, are_seals), 1):
        data = (GRAPH / f'GRAPH-RANKING-{ordinal:02d}.json').read_bytes()
        row = json.loads(data)
        paths = row['ranked_files']
        need(row['ordinal'] == src['slot'] == query['ordinal'] == are_seal['ordinal'] == ordinal and
             row['id'] == src['image_tag'] == query['id'] == are_seal['id'] and
             row['repo'] == src['repo'] == query['repo'] and
             row['base_commit'] == src['failed_commit'] == query['base_commit'] and
             row['language'] == src['language'] == query['language'] and
             row['query_sha256'] == query['query_sha256'] and
             row['log_sha256'] == query['log_sha256'] and
             row['are_ranking_sha256'] == are_seal['ranking_sha256'] and
             row['source_tree_sha256'] == src['projected_tree_sha256'] and
             row['candidate_count'] == len(paths) == len(set(paths)) == src['projected_files'] and
             row['gold_opened'] is False and row['model_calls'] == 0,
             f'graph-identity-or-coverage-{ordinal}')
        baseline = json.loads((BASE / f'rankings-r6/are/ARE-RANKING-{ordinal:02d}.json').read_bytes())
        need(set(paths) == set(baseline['ranked_files']), f'comparator-set-{ordinal}')
        rows.append({'ordinal': ordinal, 'id': row['id'], 'ranking_sha256': sha(data),
                     'candidate_count': len(paths), 'ranker_elapsed_ms': row['ranker_elapsed_ms']})
    receipt = {'schema_version': 'are.g01-confirm-graph-seal-r6/v1',
               'input_sha256': PINS, 'freeze_sha256': sha(freeze_data),
               'script_sha256': sha(Path(__file__).read_bytes()),
               'gold_opened': False, 'model_calls': 0, 'rankings': rows}
    encoded = (json.dumps(receipt, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(encoded)
    print(json.dumps({'rankings': len(rows), 'seal_sha256': sha(encoded),
                      'total_ranker_elapsed_ms': sum(row['ranker_elapsed_ms'] for row in rows)}))


if __name__ == '__main__':
    main()
