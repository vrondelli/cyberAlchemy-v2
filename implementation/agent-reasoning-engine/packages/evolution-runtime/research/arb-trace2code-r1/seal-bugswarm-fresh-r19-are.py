#!/usr/bin/env python3
"""Independently seal the 24 fresh source-only ARE rankings."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path


BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/fresh-r11')
SOURCE = BASE / 'code-only-r17/RESULT.json'
QUERIES = BASE / 'query-only-r18/QUERIES.jsonl'
RANKINGS = BASE / 'rankings-r19/are'
OUTPUT = RANKINGS / 'ARE-SEAL.json'
SOURCE_SHA = '6f76dafa33ed79a1ddfba5a3278e95ccb39161513ff35bc23dc927ce13dd1992'
QUERY_SHA = '7943e67c8ce84ba43cde47e726ed89b681151a621754e61741871a6ad0e94470'


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
    freeze_data = (RANKINGS / 'FREEZE.json').read_bytes()
    freeze = json.loads(freeze_data)
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
             row['language'] == src['language'] == query['language'] and
             row['query_sha256'] == query['query_sha256'] and
             row['candidate_count'] == len(paths) and
             len(paths) == len(set(paths)) == src['projected_files'] and
             row['indexed_bytes'] == src['projected_bytes'] and
             row['gold_opened'] is False and row['model_calls'] == 0,
             f'ranking-identity-or-coverage-{ordinal}')
        rows.append({'ordinal': ordinal, 'id': row['id'], 'ranking_sha256': sha(data),
                     'candidate_count': len(paths),
                     'ranker_elapsed_ms': row['ranker_elapsed_ms']})
    receipt = {'schema_version': 'are.g01-fresh-are-seal-r19/v1',
               'source_sha256': SOURCE_SHA, 'queries_sha256': QUERY_SHA,
               'freeze_sha256': sha(freeze_data),
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
