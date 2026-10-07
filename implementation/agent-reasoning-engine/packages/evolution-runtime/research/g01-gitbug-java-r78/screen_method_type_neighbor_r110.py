"""Source-only rare-word method/type-neighbor screen on exposed Java cases.

This broadens r108's restrictive two-word method/type match. A method word
must be at least four characters; production-type stem rarity within that
repository prioritizes seeds. Labels, fix source, and holdout are not read.
Open question: does this add reachable gold on both exposed populations?
"""

import argparse
import hashlib
import importlib.util
import json
import math
import os
from collections import Counter, defaultdict
from pathlib import Path, PurePosixPath


HERE = Path(__file__).parent
R101 = HERE / 'screen_test_class_usage_r101.py'
R108 = HERE / 'screen_method_type_neighbor_r108.py'
PINS = {
    R101: 'a6365e865a80ee737b423fd25a01e6f350205a3f35dd8eac0ed4d525aea7daee',
    R108: '3d68fc97133b2d01ba4f9c70858d6221653b4553d71b1dd6c9c02f620c73e60b',
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_module(path, name):
    if sha(path) != PINS[path]:
        raise SystemExit(f'rule-drift:{path}')
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--population', choices=('gitbug', 'bears'), required=True)
    args = parser.parse_args()
    r101 = load_module(R101, 'r101_usage')
    r108 = load_module(R108, 'r108_method')
    cfg = r101.CONFIG[args.population]
    root_dir = cfg['root']
    paths = {name: root_dir / cfg[name][0] for name in ('source', 'queries', 'ranks')}
    if any(sha(paths[name]) != cfg[name][1] for name in paths):
        raise SystemExit('input-drift')
    output = root_dir / 'method-type-neighbor-r110/SOURCE-SEAL.json'
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
        method_names = r108.methods(query['query'])
        method_words = set().union(*(r108.words(name) for name in method_names)) if method_names else set()
        method_words = {word for word in method_words if len(word) >= 4}
        stem_words = {path: r108.words(PurePosixPath(path).stem) for path in production}
        word_df = Counter(word for item in stem_words.values() for word in item)
        stems = defaultdict(list)
        for path in production:
            stems[PurePosixPath(path).stem].append(path)
        seeds = []
        for path, class_words in stem_words.items():
            overlap = method_words & class_words
            if not overlap:
                continue
            rarity = sum(math.log1p(len(production) / word_df[word]) for word in overlap)
            score = rarity + len(overlap) / max(len(class_words), 1)
            seeds.append((score, path, sorted(overlap)))
        seeds.sort(key=lambda item: (-item[0], positions[item[1]], item[1]))
        ordered, seen = [], set()
        for seed_rank, (score, seed, overlap) in enumerate(seeds[:8], 1):
            if seed not in seen:
                ordered.append({'path': seed, 'kind': 'rare-method-type',
                                'seed_rank': seed_rank, 'matched_words': overlap})
                seen.add(seed)
            target = root.joinpath(*PurePosixPath(seed).parts).resolve(strict=True)
            if not target.is_relative_to(root) or not target.is_file():
                raise SystemExit(f'unsafe-source:{ordinal}')
            body = r101.IMPORT_LINE.sub('', r101.COMMENT.sub('', target.read_text(encoding='utf-8', errors='replace')))
            tokens = Counter(r108.TOKEN.findall(body))
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
                                'seed_path': seed, 'token': token,
                                'same_directory': bool(same_dir), 'frequency_cap3': frequency})
                seen.add(path)
                added += 1
                if added == 2:
                    break
        rows.append({'ordinal': ordinal, 'repo': query['repo'], 'query_sha256': query['query_sha256'],
                     'method_count': len(method_names), 'method_words': sorted(method_words),
                     'seed_count': len(seeds), 'candidates': ordered[:20]})
        print(json.dumps({'population': args.population, 'ordinal': ordinal,
                          'seed_count': len(seeds), 'candidate_count': min(len(ordered), 20)}), flush=True)
    report = {'schema_version': 'g01.java-method-type-neighbor-screen-r110/v1',
              'posture': 'source-only-post-hoc-exposed-development-no-label-model-or-confirmation',
              'population': args.population, 'cases': cfg['cases'],
              'input_sha256': {name: sha(path) for name, path in paths.items()},
              'rule_sha256': {path.name: expected for path, expected in PINS.items()},
              'script_sha256': sha(Path(__file__)),
              'policy': 'method words length >=4; production type stems ranked by within-repository rarity plus overlap fraction; top eight seeds, two one-hop referenced production types each, same-directory first; cap 20',
              'screen_gate': {'minimum_new_top10_gold_cases_gitbug': 1,
                              'minimum_new_top10_gold_cases_bears': 2},
              'rows': rows, 'claim_ceiling': 'Exposed candidate screen only; no ranked quality or superiority.',
              'open_questions': ['Does broader stem matching yield cross-population incremental reach?']}
    encoded = (json.dumps(report, sort_keys=True, indent=2) + '\n').encode()
    output.parent.mkdir(parents=True, mode=0o700, exist_ok=False)
    fd = os.open(output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(encoded)
    print(json.dumps({'population': args.population, 'sha256': hashlib.sha256(encoded).hexdigest()}))


if __name__ == '__main__':
    main()
