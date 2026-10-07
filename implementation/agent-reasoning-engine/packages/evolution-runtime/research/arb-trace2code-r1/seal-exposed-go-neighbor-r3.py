#!/usr/bin/env python3
"""Gold-blind Go-only ablation of the sealed matched-edge neighbor rule."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


R2_SHA256 = '60c8bfc9cbca8c71f52b93b4b114f488c3306e244a917d4d9360ee8e6d5fa4a0'


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--r2-rankings', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    source = args.r2_rankings.resolve(strict=True)
    if args.output.exists() or sha256(source) != R2_SHA256:
        raise SystemExit('output exists or r2 pin drift')
    source_seal = json.loads((source.parent / 'SOURCE-SEAL.json').read_text())
    if source_seal.get('prediction_sha256') != R2_SHA256 or source_seal.get('gold_opened') is not False:
        raise SystemExit('r2 source seal drift')
    rows = [json.loads(line) for line in source.read_text().splitlines()]
    if len(rows) != 101 or len({row['id'] for row in rows}) != 101:
        raise SystemExit('cohort drift')
    output_rows = []
    changed = 0
    for row in rows:
        base = row['are_edge_trace_text']
        previous = row['matched_edge_source_neighbor']
        selected = [path for path in row['promoted_sources'] if path.lower().endswith('.go')]
        if len(base) != row['candidate_count'] or set(base) != set(previous) or \
                len(set(base)) != len(base) or len(selected) != len(set(selected)) or \
                not set(selected).issubset(base):
            raise SystemExit('candidate universe drift')
        ranking = selected + [path for path in base if path not in selected]
        changed += ranking != base
        output_rows.append({
            'id': row['id'], 'repo': row['repo'], 'base_commit': row['base_commit'],
            'query_sha256': row['query_sha256'], 'candidate_count': row['candidate_count'],
            'arb_edge_bm25': row['arb_edge_bm25'], 'are_edge_trace_text': base,
            'matched_edge_source_neighbor': previous, 'go_only_neighbor': ranking,
            'go_promoted_sources': selected,
        })
    args.output.mkdir(mode=0o700, parents=True, exist_ok=False)
    prediction = args.output / 'DEVELOPMENT-RANKINGS.jsonl'
    prediction.write_text(''.join(json.dumps(row, sort_keys=True) + '\n'
                                  for row in sorted(output_rows, key=lambda item: item['id'])))
    seal = {
        'schema': 'are.arb-exposed-go-only-neighbor-source-r3/v1',
        'posture': 'post-confirmation exposed ablation; no independent or live claim',
        'mechanism': 'promote only the r2 test-name counterparts ending .go; abstain on Python counterparts',
        'hypothesis': 'Go test-to-source name mapping is a stronger source relation than Python test-name mapping',
        'evaluation_gate': '101/101 valid; MRR@8 no lower than r2 overall and non-Gin; no Click MRR regression; report BCY@8K',
        'r2_prediction_sha256': R2_SHA256, 'prediction_sha256': sha256(prediction),
        'cases': len(output_rows), 'changed_rankings': changed,
        'gold_opened': False, 'model_calls': 0,
    }
    (args.output / 'SOURCE-SEAL.json').write_text(json.dumps(seal, indent=2, sort_keys=True) + '\n')
    print(json.dumps(seal, sort_keys=True))


if __name__ == '__main__':
    main()
