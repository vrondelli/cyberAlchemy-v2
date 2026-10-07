"""Failure-text anchors to production source, on exposed Java bug cases.

Exact failing-side literals, identifiers, and Java qualified type names are
matched against the exact buggy source projection. No gold, fix, model, or
confirmation data are read. Open question: can failure text recover files
that test-class usage does not reach in both exposed populations?
"""

import argparse
import hashlib
import importlib.util
import json
import math
import os
import re
from collections import Counter
from pathlib import Path, PurePosixPath


R101 = Path(__file__).with_name('screen_test_class_usage_r101.py')
R101_SHA = 'a6365e865a80ee737b423fd25a01e6f350205a3f35dd8eac0ed4d525aea7daee'
IDENT = re.compile(r'\b[A-Za-z_$][A-Za-z0-9_$]{5,39}\b')
QUALIFIED = re.compile(r'\b(?:[a-z_$][A-Za-z0-9_$]*\.){2,}[A-Z][A-Za-z0-9_$]*\b')
LITERAL = re.compile(r'''(?P<quote>['"])(?P<value>[^'"\n]{4,80})(?P=quote)''')
STOP = {'expected', 'actual', 'failure', 'assertion', 'exception', 'error',
        'nullpointerexception', 'assertionerror', 'assertionfailederror',
        'assertionfailederror', 'illegalargumentexception', 'runtimeexception',
        'java', 'junit', 'org', 'test', 'tests', 'should', 'could', 'would',
        'cannot', 'failed', 'value', 'values', 'result', 'return', 'returned',
        'class', 'object', 'string', 'false', 'true', 'there', 'nothing'}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def source_anchors(query):
    failure = query.split('\nfailure:\n', 1)[1] if '\nfailure:\n' in query else ''
    failure = failure[:3000]
    literals = {match.group('value') for match in LITERAL.finditer(failure)
                if not match.group('value').isspace() and not match.group('value').startswith(('{', '['))}
    qualified = {match.group(0) for match in QUALIFIED.finditer(failure)}
    identifiers = {match.group(0) for match in IDENT.finditer(failure)
                   if match.group(0).lower() not in STOP}
    return failure, sorted(literals), sorted(qualified), sorted(identifiers)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--population', choices=('gitbug', 'bears'), required=True)
    args = parser.parse_args()
    if sha(R101) != R101_SHA:
        raise SystemExit('r101-rule-drift')
    spec = importlib.util.spec_from_file_location('r101_usage', R101)
    r101 = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(r101)
    cfg = r101.CONFIG[args.population]
    root_dir = cfg['root']
    paths = {name: root_dir / cfg[name][0] for name in ('source', 'queries', 'ranks')}
    if any(sha(paths[name]) != cfg[name][1] for name in paths):
        raise SystemExit('input-drift')
    output = root_dir / 'failure-source-anchors-r112/SOURCE-SEAL.json'
    if output.exists():
        raise SystemExit('output-exists')
    source = json.loads(paths['source'].read_text())['records']
    queries = [json.loads(line) for line in paths['queries'].read_text().splitlines()]
    ranks = [json.loads(line) for line in paths['ranks'].read_text().splitlines()]
    if any(len(rows) != cfg['cases'] for rows in (source, queries, ranks)):
        raise SystemExit('denominator-drift')
    rows = []
    for src, query, rank in zip(source, queries, ranks, strict=True):
        ordinal = query['ordinal']
        if not (src['ordinal'] == rank['ordinal'] == ordinal and
                src['repo'] == query['repo'] == rank['repo'] and
                rank['query_sha256'] == query['query_sha256']):
            raise SystemExit(f'case-binding:{ordinal}')
        root = Path(src['root']).resolve(strict=True)
        if not root.is_relative_to(paths['source'].parent.resolve(strict=True)):
            raise SystemExit(f'source-root:{ordinal}')
        universe = rank['strong_raw_symbol_structure']
        if len(universe) != src['projected_files'] or len(set(universe)) != len(universe):
            raise SystemExit(f'universe:{ordinal}')
        production = [path for path in universe if r101.production(path)]
        positions = {path: position for position, path in enumerate(universe, 1)}
        failure, literals, qualified, identifiers = source_anchors(query['query'])
        body_by_path, tokens_by_path = {}, {}
        for path in production:
            target = root.joinpath(*PurePosixPath(path).parts).resolve(strict=True)
            if not target.is_relative_to(root) or not target.is_file():
                raise SystemExit(f'unsafe-source:{ordinal}')
            body = r101.COMMENT.sub('', target.read_text(encoding='utf-8', errors='replace'))
            body_by_path[path] = body
            tokens_by_path[path] = set(IDENT.findall(body))
        df = Counter(token for tokens in tokens_by_path.values() for token in tokens if token in identifiers)
        eligible = {token for token in identifiers if 0 < df[token] <= max(3, len(production) // 4)}
        ranked = []
        for path in production:
            body = body_by_path[path]
            matched_literals = [value for value in literals if value in body]
            matched_fqcn = [name for name in qualified if path.endswith(name.replace('.', '/') + '.java')]
            matched_tokens = tokens_by_path[path] & eligible
            if not (matched_literals or matched_fqcn or matched_tokens):
                continue
            token_score = sum(math.log1p(len(production) / df[token]) for token in matched_tokens)
            score = 4 * len(matched_fqcn) + 2 * len(matched_literals) + token_score
            ranked.append((score, path, len(matched_fqcn), len(matched_literals), len(matched_tokens)))
        ranked.sort(key=lambda row: (-row[0], positions[row[1]], row[1]))
        candidates = [{'path': path, 'score': round(score, 6), 'fqcn_hits': fqcn,
                       'literal_hits': literal, 'identifier_hits': identifier}
                      for score, path, fqcn, literal, identifier in ranked[:20]]
        rows.append({'ordinal': ordinal, 'repo': query['repo'], 'query_sha256': query['query_sha256'],
                     'failure_sha256': hashlib.sha256(failure.encode()).hexdigest(),
                     'anchor_counts': {'literals': len(literals), 'qualified': len(qualified),
                                       'identifiers': len(identifiers), 'eligible_identifiers': len(eligible)},
                     'scored_count': len(ranked), 'candidates': candidates})
        print(json.dumps({'population': args.population, 'ordinal': ordinal,
                          'scored_count': len(ranked), 'candidate_count': len(candidates)}), flush=True)
    report = {'schema_version': 'g01.java-failure-source-anchor-screen-r112/v1',
              'posture': 'source-only-post-hoc-exposed-development-no-label-model-or-confirmation',
              'population': args.population, 'cases': cfg['cases'],
              'input_sha256': {name: sha(path) for name, path in paths.items()},
              'r101_script_sha256': R101_SHA, 'script_sha256': sha(Path(__file__)),
              'policy': 'failure first 3000 chars; exact quoted literals, Java FQCN source paths, and identifier tokens with source document frequency <= max(3,N//4); score 4/FQCN + 2/literal + sum log1p(N/df); strong prior tie-break; cap20',
              'screen_gate': {'minimum_new_top10_gold_cases_gitbug': 1,
                              'minimum_new_top10_gold_cases_bears': 2},
              'rows': rows, 'claim_ceiling': 'Exposed candidate screen only; no ranked quality or superiority.',
              'open_questions': ['Does failure text add reachable production files beyond test-class usage in both exposed populations?']}
    encoded = (json.dumps(report, sort_keys=True, indent=2) + '\n').encode()
    output.parent.mkdir(parents=True, mode=0o700, exist_ok=False)
    fd = os.open(output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(encoded)
    print(json.dumps({'population': args.population, 'sha256': hashlib.sha256(encoded).hexdigest()}))


if __name__ == '__main__':
    main()
