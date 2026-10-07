"""Source-only failed-method/type-neighbor candidate screen on exposed Java.

The failed method name can exist only in failure metadata while the old test
method is absent. Match its code-shaped words to production type stems, then
follow same-source type references for one hop. No gold or holdout is read.
Open question: does this recover causal production types across populations?
"""

import argparse
import hashlib
import importlib.util
import json
import os
import re
from collections import Counter, defaultdict
from pathlib import Path, PurePosixPath


R101 = Path(__file__).with_name('screen_test_class_usage_r101.py')
R101_SHA = 'a6365e865a80ee737b423fd25a01e6f350205a3f35dd8eac0ed4d525aea7daee'
STOP = {'test', 'tests', 'should', 'when', 'with', 'without', 'that', 'then', 'can',
        'the', 'and', 'not', 'for', 'using', 'use', 'from', 'valid', 'invalid', 'case'}
WORD = re.compile(r'[A-Z]+(?=[A-Z][a-z]|\b)|[A-Z]?[a-z]+|[0-9]+')
TOKEN = re.compile(r'\b[A-Z][A-Za-z0-9_]{3,}\b')


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def words(value):
    result = []
    for piece in re.split(r'[^A-Za-z0-9]+', value):
        result.extend(match.lower() for match in WORD.findall(piece))
    return {word for word in result if len(word) >= 3 and word not in STOP}


def methods(query):
    heading = query.split('\nfailure:\n', 1)[0].removeprefix('failing tests:\n')
    values = []
    for line in heading.splitlines():
        if '#' not in line:
            continue
        method = line.split('#', 1)[1]
        method = re.split(r'[({\[]', method, maxsplit=1)[0].strip()
        if method:
            values.append(method)
    return sorted(set(values))


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
    output = root_dir / 'method-type-neighbor-r108/SOURCE-SEAL.json'
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
        if not (src['ordinal'] == rank['ordinal'] == ordinal
                and src['repo'] == query['repo'] == rank['repo']
                and rank['query_sha256'] == query['query_sha256']):
            raise SystemExit(f'case-binding:{ordinal}')
        root = Path(src['root']).resolve(strict=True)
        if not root.is_relative_to(paths['source'].parent.resolve(strict=True)):
            raise SystemExit(f'source-root:{ordinal}')
        universe = rank['strong_raw_symbol_structure']
        if len(universe) != src['projected_files'] or len(set(universe)) != len(universe):
            raise SystemExit(f'universe:{ordinal}')
        production = [path for path in universe if r101.production(path)]
        positions = {path: position for position, path in enumerate(universe, 1)}
        method_names = methods(query['query'])
        method_words = set().union(*(words(name) for name in method_names)) if method_names else set()
        stems = defaultdict(list)
        for path in production:
            stems[PurePosixPath(path).stem].append(path)
        seeds = []
        for path in production:
            stem = PurePosixPath(path).stem
            class_words = words(stem)
            overlap = method_words & class_words
            if not overlap or not (len(overlap) >= 2 or
                                   (len(class_words) == 1 and len(next(iter(overlap))) >= 7)):
                continue
            score = len(overlap) / len(class_words) + 0.1 * len(overlap)
            seeds.append((score, path, sorted(overlap)))
        seeds.sort(key=lambda item: (-item[0], positions[item[1]], item[1]))
        top_seeds = seeds[:5]
        ordered = []
        seen = set()
        for seed_rank, (seed_score, seed, overlap) in enumerate(top_seeds, 1):
            if seed not in seen:
                ordered.append({'path': seed, 'kind': 'method-type',
                                'seed_rank': seed_rank, 'matched_words': overlap})
                seen.add(seed)
            target = root.joinpath(*PurePosixPath(seed).parts).resolve(strict=True)
            if not target.is_relative_to(root) or not target.is_file():
                raise SystemExit(f'unsafe-source:{ordinal}')
            content = r101.IMPORT_LINE.sub('', r101.COMMENT.sub('', target.read_text(encoding='utf-8', errors='replace')))
            tokens = Counter(TOKEN.findall(content))
            neighbors = []
            for token, frequency in tokens.items():
                if token not in stems or token == PurePosixPath(seed).stem:
                    continue
                for path in stems[token]:
                    if path == seed:
                        continue
                    same_dir = int(PurePosixPath(path).parent == PurePosixPath(seed).parent)
                    neighbors.append((same_dir, min(frequency, 3), path, token))
            neighbors.sort(key=lambda item: (-item[0], -item[1], positions[item[2]], item[2]))
            added = 0
            for same_dir, frequency, path, token in neighbors:
                if path in seen:
                    continue
                ordered.append({'path': path, 'kind': 'one-hop-type', 'seed_rank': seed_rank,
                                'seed_path': seed, 'token': token, 'same_directory': bool(same_dir),
                                'frequency_cap3': frequency})
                seen.add(path)
                added += 1
                if added == 3:
                    break
        rows.append({'ordinal': ordinal, 'repo': query['repo'], 'query_sha256': query['query_sha256'],
                     'method_count': len(method_names), 'method_words': sorted(method_words),
                     'seed_count': len(top_seeds), 'candidates': ordered[:20]})
        print(json.dumps({'population': args.population, 'ordinal': ordinal,
                          'seed_count': len(top_seeds), 'candidate_count': min(len(ordered), 20)}), flush=True)
    report = {'schema_version': 'g01.java-method-type-neighbor-screen-r108/v1',
              'posture': 'source-only-post-hoc-exposed-development-no-label-model-or-confirmation',
              'population': args.population, 'cases': cfg['cases'],
              'input_sha256': {name: sha(path) for name, path in paths.items()},
              'r101_script_sha256': R101_SHA, 'script_sha256': sha(Path(__file__)),
              'policy': 'failed method words -> top five production type stems -> at most three one-hop referenced production types per seed, same-directory first; cap 20',
              'screen_gate': {'minimum_new_top10_gold_cases_gitbug': 1,
                              'minimum_new_top10_gold_cases_bears': 2},
              'rows': rows, 'claim_ceiling': 'Exposed candidate screen only; no ranked quality or superiority.',
              'open_questions': ['Does one-hop closure add reach beyond r101 in both exposed populations?']}
    encoded = (json.dumps(report, sort_keys=True, indent=2) + '\n').encode()
    output.parent.mkdir(parents=True, mode=0o700, exist_ok=False)
    fd = os.open(output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(encoded)
    print(json.dumps({'population': args.population, 'sha256': hashlib.sha256(encoded).hexdigest()}))


if __name__ == '__main__':
    main()
