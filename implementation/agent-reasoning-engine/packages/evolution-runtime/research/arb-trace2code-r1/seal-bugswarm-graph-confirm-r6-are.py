#!/usr/bin/env python3
"""Independently seal the 24 source-only confirmation ARE rankings."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path


BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-confirm-r4')
SOURCE = BASE / 'code-only/RESULT.json'
QUERIES = BASE / 'query-only/QUERIES.jsonl'
RANKINGS = BASE / 'rankings-r6/are'
OUTPUT = RANKINGS / 'ARE-SEAL.json'
SOURCE_SHA = '3eea3878d6769be39a88c98473cfc7eb0c019e4e33f82b665b7b18271dda4e4a'
QUERY_SHA = 'd570e3ab4a9e0f5c9945544bbb2681949c96ffdfcf106abd9d9007634254a2aa'


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(condition: bool, reason: str) -> None:
    if not condition:
        raise SystemExit(reason)


def main() -> None:
    need(not OUTPUT.exists() and sha(SOURCE.read_bytes()) == SOURCE_SHA and
         sha(QUERIES.read_bytes()) == QUERY_SHA, 'input-pin-or-output-drift')
    sources = json.loads(SOURCE.read_bytes())['records']
    queries = [json.loads(line) for line in QUERIES.read_text().splitlines()]
    need(len(sources) == len(queries) == 24, 'denominator-drift')
    freeze = json.loads((RANKINGS / 'FREEZE.json').read_bytes())
    need(freeze['source_sha256'] == SOURCE_SHA and freeze['query_sha256'] == QUERY_SHA and
         freeze['cases'] == 24 and freeze['gold_opened'] is False and
         freeze['model_calls'] == 0, 'freeze-drift')
    rows = []
    for ordinal, (src, query) in enumerate(zip(sources, queries), 1):
        data = (RANKINGS / f'ARE-RANKING-{ordinal:02d}.json').read_bytes()
        row = json.loads(data)
        paths = row['ranked_files']
        need(row['ordinal'] == src['slot'] == query['ordinal'] == ordinal and
             row['id'] == src['image_tag'] == query['id'] and
             row['repo'] == src['repo'] == query['repo'] and
             row['base_commit'] == src['failed_commit'] == query['base_commit'] and
             row['query_sha256'] == query['query_sha256'] and
             row['candidate_count'] == len(paths) and
             len(paths) == len(set(paths)) == src['projected_files'] and
             row['indexed_bytes'] == src['projected_bytes'] and
             row['gold_opened'] is False and row['model_calls'] == 0,
             f'ranking-identity-or-coverage-{ordinal}')
        rows.append({'ordinal': ordinal, 'id': row['id'], 'ranking_sha256': sha(data),
                     'candidate_count': len(paths),
                     'ranker_elapsed_ms': row['ranker_elapsed_ms']})
    receipt = {'schema_version': 'are.g01-confirm-are-seal-r6/v1',
               'source_sha256': SOURCE_SHA, 'queries_sha256': QUERY_SHA,
               'freeze_sha256': sha((RANKINGS / 'FREEZE.json').read_bytes()),
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
