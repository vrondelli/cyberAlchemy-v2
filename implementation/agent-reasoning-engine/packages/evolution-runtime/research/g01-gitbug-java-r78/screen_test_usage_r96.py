#!/usr/bin/env python3
"""Gold-blind failing-test-method usage filter on exposed Java import edges."""

import argparse
import hashlib
import importlib.util
import json
import os
import re
from collections import Counter
from pathlib import Path, PurePosixPath


HERE = Path(__file__).resolve().parent
PRIOR = HERE / 'screen_test_imports_r92.py'
PRIOR_SHA = '8467fa88125501db491f326a264ce2022a1c78b2e2fd31673473cbaa9100312f'
R92_SEALS = {
    'gitbug': 'fa10b3858d19c3c6e000a71588b5d125d266c1a6a765f06915ed5537f781edd8',
    'bears': 'c17cc538a92e5bb61ca5128913abb109612a6fece74a5d27d04a16f7379b3118',
}
METHOD_REF = re.compile(r'\b([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*Test(?:s|Case)?)#([A-Za-z_$][\w$]*)')
STATIC_IMPORT = re.compile(r'(?m)^\s*import\s+static\s+([A-Za-z_$][\w$.]*)\s*;')


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def method_body(content, name):
    pattern = re.compile(r'\b' + re.escape(name) + r'\s*\([^;{}]*\)[^;{}]*\{', re.S)
    matches = list(pattern.finditer(content))
    if len(matches) != 1:
        return None
    start = matches[0].end()
    depth = 1
    for index in range(start, len(content)):
        if content[index] == '{':
            depth += 1
        elif content[index] == '}':
            depth -= 1
            if depth == 0:
                return content[start:index]
    return None


def mentions(body, content, class_name, static_members):
    if re.search(r'\b' + re.escape(class_name) + r'\b', body):
        return True
    for member in static_members:
        if re.search(r'\b' + re.escape(member) + r'\b', body):
            return True
    # A test may use a field typed with the imported class rather than naming
    # the type inside the test method itself.
    fields = re.findall(r'\b' + re.escape(class_name) + r'\s+([A-Za-z_$][\w$]*)\s*(?:[;=,])', content)
    return any(re.search(r'\b' + re.escape(field) + r'\b', body) for field in fields)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--population', choices=sorted(R92_SEALS), required=True)
    args = parser.parse_args()
    if sha(PRIOR) != PRIOR_SHA:
        raise SystemExit('prior-script-drift')
    spec = importlib.util.spec_from_file_location('g01_test_import_r92', PRIOR)
    prior = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(prior)
    cfg = prior.CONFIG[args.population]
    source_path = cfg['root'] / cfg['source']
    query_path = cfg['root'] / cfg['queries']
    rank_path = cfg['root'] / cfg['ranks']
    r92_path = cfg['root'] / 'test-import-screen-r92/SOURCE-SEAL.json'
    output = cfg['root'] / 'test-usage-screen-r96/SOURCE-SEAL.json'
    pins = {source_path: cfg['pins'][0], query_path: cfg['pins'][1],
            rank_path: cfg['pins'][2], r92_path: R92_SEALS[args.population], PRIOR: PRIOR_SHA}
    if output.exists() or any(sha(path) != value for path, value in pins.items()):
        raise SystemExit('output-exists-or-input-drift')
    sources = json.loads(source_path.read_text())['records']
    queries = [json.loads(line) for line in query_path.read_text().splitlines()]
    ranks = [json.loads(line) for line in rank_path.read_text().splitlines()]
    r92 = json.loads(r92_path.read_text())['rows']
    if any(len(rows) != cfg['cases'] for rows in (sources, queries, ranks, r92)):
        raise SystemExit('cohort-shape')
    rows = []
    for src, query, rank, old in zip(sources, queries, ranks, r92):
        ordinal = query['ordinal']
        if (not (ordinal == src['ordinal'] == rank['ordinal'] == old['ordinal'])
                or not (query['repo'] == src['repo'] == rank['repo'] == old['repo'])):
            raise SystemExit(f'identity-drift:{ordinal}')
        root = Path(src['root']).resolve(strict=True)
        if not root.is_relative_to(source_path.parent.resolve(strict=True)):
            raise SystemExit(f'root-escape:{ordinal}')
        universe = set(rank['treatment_safe'])
        old_paths = {entry['path'] for entry in old['ranked_import_candidates']}
        if len(universe) != src['projected_files'] or not old_paths <= universe:
            raise SystemExit(f'universe-drift:{ordinal}')
        refs = sorted(set(METHOD_REF.findall(query['query'])))
        support = Counter()
        resolved = 0
        for fqcn, method in refs:
            test_name = fqcn.rsplit('.', 1)[-1] + '.java'
            matches = sorted((path for path in universe if path.endswith('/' + test_name)
                              or path == test_name), key=lambda path: (len(path), path))
            if not matches:
                continue
            test_path = matches[0]
            target = root.joinpath(*PurePosixPath(test_path).parts).resolve(strict=True)
            if not target.is_relative_to(root):
                raise SystemExit(f'test-escape:{ordinal}')
            content = target.read_text(encoding='utf-8', errors='replace')
            body = method_body(content, method)
            if body is None:
                continue
            resolved += 1
            static = STATIC_IMPORT.findall(content)
            for candidate in old_paths:
                name = PurePosixPath(candidate).stem
                static_members = [item.rsplit('.', 1)[-1] for item in static
                                  if len(item.split('.')) >= 2 and item.split('.')[-2] == name]
                if mentions(body, content, name, static_members):
                    support[candidate] += 1
        old_support = {entry['path']: entry['support'] for entry in old['ranked_import_candidates']}
        selected = sorted(support, key=lambda path: (-support[path], -old_support[path], path))
        rows.append({'ordinal': ordinal, 'repo': query['repo'],
                     'query_sha256': query['query_sha256'],
                     'failing_method_refs': len(refs), 'resolved_method_refs': resolved,
                     'ranked_usage_candidates': [{'path': path, 'method_support': support[path]}
                                                 for path in selected]})
        print(json.dumps({'ordinal': ordinal, 'resolved': resolved,
                          'candidates': len(selected)}), flush=True)
    result = {'schema_version': 'are.g01-java-test-usage-screen-r96/v1',
              'posture': 'source-only-post-hoc-exposed-development-no-label-or-model',
              'population': args.population,
              'input_sha256': {str(path): value for path, value in pins.items()},
              'script_sha256': sha(Path(__file__)),
              'policy': 'R92 project-import candidate retained iff failing test method body mentions its class, an imported static member, or a field typed by that class',
              'screen_gate': {'top3_gold_cases_min': 2 if args.population == 'gitbug' else 3,
                              'top10_gold_cases_min': 2 if args.population == 'gitbug' else 5},
              'rows': rows,
              'claim_ceiling': 'Exposed candidate coverage only; no full ranking, independent transfer, or superiority.'}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    output.parent.mkdir(mode=0o700, parents=True, exist_ok=False)
    fd = os.open(output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'population': args.population, 'sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
