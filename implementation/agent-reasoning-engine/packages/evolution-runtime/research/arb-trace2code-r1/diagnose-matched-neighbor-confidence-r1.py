#!/usr/bin/env python3
"""Counts-only diagnosis of sealed, exposed neighbor predictions; no gold paths."""

from __future__ import annotations

import collections
import hashlib
import importlib.util
import json
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive/arb-v2-trace2code-20261004')
HERE = Path(__file__).resolve().parent
INPUTS = {
    'predictions': (ROOT / 'exposed-trace-source-neighbor-edge-r2/DEVELOPMENT-RANKINGS.jsonl',
                    '60c8bfc9cbca8c71f52b93b4b114f488c3306e244a917d4d9360ee8e6d5fa4a0'),
    'audit': (ROOT / 'exposed-trace-source-neighbor-edge-r2-evaluator/EVALUATOR-AUDIT.json',
              'f9efff41392700755b93dd5a786467d60f73037024d6c6a9de9f3ff84eccd5ea'),
    'gin_queries': (ROOT / 'query-only-dev-r1/DEV-QUERIES.jsonl',
                    '19f3aed723705229433bc13423f30ea45c6d84a23d1a481c3924371232e6253a'),
    'nongin_queries': (ROOT / 'nongin-confirmation-queries-r1/CONFIRMATION-QUERIES.jsonl',
                       'fd40d61077846f49374ee61a87e561699d85de9016ac590790be5228fa67b08c'),
    'r1_mechanism': (HERE / 'probe-trace-source-neighbor-r1.py',
                     'dd2fc32df6621afd054d5ede52a9894a08f7bf3b0ecbd09a60d95f27c58a6db5'),
    'r2_mechanism': (HERE / 'probe-trace-source-neighbor-r2.py',
                     'ab8ee3958f924f67606999cec5ae672f419284002a7a79987ded95c69f3e59db'),
}


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise SystemExit('mechanism import failure')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def load_jsonl(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text().splitlines()]


def main() -> None:
    for path, expected in INPUTS.values():
        if hashlib.sha256(path.read_bytes()).hexdigest() != expected:
            raise SystemExit(f'input pin drift: {path.name}')
    r1 = load_module('neighbor_r1', INPUTS['r1_mechanism'][0])
    r2 = load_module('neighbor_r2', INPUTS['r2_mechanism'][0])
    predictions = {row['id']: row for row in load_jsonl(INPUTS['predictions'][0])}
    queries = {row['id']: row for key in ('gin_queries', 'nongin_queries')
               for row in load_jsonl(INPUTS[key][0])}
    scored = json.loads(INPUTS['audit'][0].read_text())['per_case_numeric_only']
    if len(predictions) != 101 or len(queries) != 101 or len(scored) != 101:
        raise SystemExit('cohort size drift')
    if {row['id'] for row in scored} != set(predictions) or set(predictions) != set(queries):
        raise SystemExit('cohort identity drift')
    groups: dict[tuple[str, str], collections.Counter] = collections.defaultdict(collections.Counter)
    for score in scored:
        row = predictions[score['id']]
        query = queries[score['id']]
        if (row['repo'], row['base_commit']) != (query['repo'], query['base_commit']):
            raise SystemExit('case identity drift')
        trace = r2.edge_window(query['query']['failure_excerpt']).lower()
        ranking = row['are_edge_trace_text']
        names = collections.Counter(path.rsplit('/', 1)[-1].lower() for path in ranking)
        tests = [path for path in ranking if r1.TEST_NAME.search(path) and
                 (path.lower() in trace or
                  (names[path.rsplit('/', 1)[-1].lower()] == 1 and
                   path.rsplit('/', 1)[-1].lower() in trace))]
        pairs = [(test, source) for source in row['promoted_sources'] for test in tests
                 if r1.source_name(test.rsplit('/', 1)[-1].lower()) ==
                 source.rsplit('/', 1)[-1].lower()]
        if row['promoted_sources'] and not pairs:
            raise SystemExit('promotion provenance drift')
        relation = 'no_promotion' if not pairs else (
            'same_directory' if any(test.rsplit('/', 1)[0] == source.rsplit('/', 1)[0]
                                    for test, source in pairs) else 'cross_directory')
        mention = 'no_promotion' if not pairs else (
            'full_path' if any(test.lower() in trace for test, _ in pairs) else 'basename_only')
        metrics = score['metrics']
        delta = (metrics['matched_edge_source_neighbor']['mrr_at_8'] -
                 metrics['are_edge_trace_text']['mrr_at_8'])
        for dimension, value in (('relation', relation), ('mention', mention)):
            record = groups[(dimension, row['repo'] + ':' + value)]
            record['cases'] += 1
            record['gains'] += delta > 0
            record['losses'] += delta < 0
            record['delta_sum'] += delta
    result = {'schema': 'are.arb-exposed-neighbor-confidence-diagnosis-r1/v1',
              'posture': 'exposed numeric-only diagnosis; not independent or live',
              'input_sha256': {key: value[1] for key, value in INPUTS.items()},
              'cases': len(scored),
              'groups': {dimension: {key: {**counts,
                                            'mean_mrr_delta': counts['delta_sum'] / counts['cases']}
                                     for (dim, key), counts in sorted(groups.items()) if dim == dimension}
                         for dimension in ('relation', 'mention')}}
    print(json.dumps(result, sort_keys=True))


if __name__ == '__main__':
    main()
