#!/usr/bin/env python3
"""Gold-blind project-import candidate screen on exposed G01 Java populations."""

import argparse
import hashlib
import json
import os
import re
from collections import Counter
from pathlib import Path, PurePosixPath


ARCHIVE = Path('/home/vlad_/are-benchmark-archive')
CONFIG = {
    'gitbug': {
        'root': ARCHIVE / 'gitbug-java-metadata-preflight-20261005',
        'source': 'dev-projection-r83/SOURCE-PROJECTION.json',
        'queries': 'dev-queries-r81/QUERIES.jsonl',
        'ranks': 'dev-structure-r90/RANKINGS.jsonl',
        'pins': ('aaff284494a0726d5517a2f492a36186d6c34a35b4166819dc3a83f77211eb46',
                 '478fc0b4fca5936cca09fdffe0a95b9dc2af2bb42482a9aa910fddc48be23eaf',
                 '4f2c83cdef8897d053c9fc527ed1cb6fae235c16e2f64796fb2859bbc60276d1'),
        'cases': 12,
    },
    'bears': {
        'root': ARCHIVE / 'bears-metadata-preflight-r73-20261005',
        'source': 'source-projection-r77/SOURCE-PROJECTION.json',
        'queries': 'query-only-r77/QUERIES.jsonl',
        'ranks': 'exposed-structure-r90/RANKINGS.jsonl',
        'pins': ('33dc47d6db3804943b76a2dea11dcca3da35ab80451ddb6a9040a7d7dc944cf6',
                 'be63d0919095bdca86090e86510a15368ea7b14cab8872f7765d17e928300d71',
                 '1ebeccb86a2fd489a9b1da9c4e1880fbf3a735d382c1950c701a4d41ba467578'),
        'cases': 24,
    },
}
TEST = re.compile(r'\b([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*Test(?:s|Case)?)#')
IMPORT = re.compile(r'(?m)^\s*import\s+(?:static\s+)?([A-Za-z_$][\w$.]*)\s*;')
PACKAGE = re.compile(r'(?m)^\s*package\s+([A-Za-z_$][\w$.]*)\s*;')


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def production(path):
    parts = PurePosixPath(path).parts
    return (path.endswith('.java') and not any(part.lower() in {'test', 'tests',
            'testing', 'src/test', 'testsrc'} for part in parts)
            and not PurePosixPath(path).stem.endswith(('Test', 'Tests', 'TestCase')))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--population', choices=sorted(CONFIG), required=True)
    args = parser.parse_args()
    cfg = CONFIG[args.population]
    paths = [cfg['root'] / cfg[name] for name in ('source', 'queries', 'ranks')]
    output = cfg['root'] / 'test-import-screen-r92/SOURCE-SEAL.json'
    if output.exists() or any(sha(path) != pin for path, pin in zip(paths, cfg['pins'])):
        raise SystemExit('output-exists-or-input-drift')
    source = json.loads(paths[0].read_text())['records']
    queries = [json.loads(line) for line in paths[1].read_text().splitlines()]
    ranks = [json.loads(line) for line in paths[2].read_text().splitlines()]
    if any(len(rows) != cfg['cases'] for rows in (source, queries, ranks)):
        raise SystemExit('cohort-shape')
    output_rows = []
    for src, query, rank in zip(source, queries, ranks):
        ordinal = query['ordinal']
        if (src['ordinal'] != ordinal or rank['ordinal'] != ordinal
                or src['repo'] != query['repo'] or rank['repo'] != query['repo']
                or rank['query_sha256'] != query['query_sha256']):
            raise SystemExit(f'identity-drift:{ordinal}')
        root = Path(src['root']).resolve(strict=True)
        if not root.is_relative_to(paths[0].parent.resolve(strict=True)):
            raise SystemExit(f'root-escape:{ordinal}')
        universe = set(rank['treatment_safe'])
        if len(universe) != src['projected_files']:
            raise SystemExit(f'universe-drift:{ordinal}')
        tests = sorted(set(TEST.findall(query['query'])))
        candidates = Counter()
        test_matches = 0
        import_count = 0
        for fqcn in tests:
            test_name = fqcn.rsplit('.', 1)[-1] + '.java'
            matching = [path for path in universe if path.endswith('/' + test_name)
                        or path == test_name]
            matching.sort(key=lambda path: (not path.replace('/', '.').endswith(fqcn + '.java'),
                                            len(path), path))
            if not matching:
                continue
            test_path = matching[0]
            target = root.joinpath(*PurePosixPath(test_path).parts).resolve(strict=True)
            if not target.is_relative_to(root):
                raise SystemExit(f'test-path-escape:{ordinal}')
            content = target.read_text(encoding='utf-8', errors='replace')
            package = PACKAGE.search(content)
            if package and not fqcn.startswith(package.group(1) + '.'):
                continue
            test_matches += 1
            imports = set(IMPORT.findall(content))
            import_count += len(imports)
            for imported in imports:
                pieces = imported.split('.')
                for stop in (0, 1):  # exact type, then static member owner
                    class_name = pieces[-1 - stop] if len(pieces) > stop else ''
                    if not class_name or not class_name[0].isupper():
                        continue
                    suffix = '/' + class_name + '.java'
                    matches = [path for path in universe if production(path)
                               and path.endswith(suffix)]
                    for path in matches:
                        if path != test_path:
                            candidates[path] += 1
                    if matches:
                        break
        ordered = sorted(candidates, key=lambda path: (-candidates[path], path))
        output_rows.append({'ordinal': ordinal, 'repo': query['repo'],
                            'query_sha256': query['query_sha256'],
                            'failing_test_classes': len(tests), 'matched_test_classes': test_matches,
                            'project_imports': import_count,
                            'ranked_import_candidates': [{'path': path, 'support': candidates[path]}
                                                         for path in ordered]})
        print(json.dumps({'ordinal': ordinal, 'test_matches': test_matches,
                          'candidate_count': len(ordered)}), flush=True)
    result = {'schema_version': 'are.g01-java-test-import-screen-r92/v1',
              'posture': 'source-only-exposed-development-no-label-or-model',
              'population': args.population,
              'input_sha256': {str(path): pin for path, pin in zip(paths, cfg['pins'])},
              'script_sha256': sha(Path(__file__)),
              'policy': 'failing test FQCN -> exact source test class -> project import or static-import owner -> production Java class; rank by import support then path',
              'rows': output_rows,
              'claim_ceiling': 'Candidate coverage only; no gold, full ranker, holdout, or superiority.'}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    output.parent.mkdir(mode=0o700, parents=True, exist_ok=False)
    fd = os.open(output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'population': args.population, 'sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
