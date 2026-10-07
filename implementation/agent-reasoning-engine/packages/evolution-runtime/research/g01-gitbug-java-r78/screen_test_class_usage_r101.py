"""Source-only test-class usage links on exposed Java bug-localization cases.

Unlike r96, the named failing *method* need not exist at the buggy commit.
Unlike r92, an imported class must appear in test executable text or a class
name expression. No fix, gold path, score, provider response, or holdout is read.
Open question: does class-level usage improve cross-population gold reach?
"""

import argparse
import hashlib
import json
import os
import re
from collections import Counter, defaultdict
from pathlib import Path, PurePosixPath


ARCHIVE = Path('/home/vlad_/are-benchmark-archive')
CONFIG = {
    'gitbug': {
        'root': ARCHIVE / 'gitbug-java-metadata-preflight-20261005',
        'source': ('dev-projection-r83/SOURCE-PROJECTION.json', 'aaff284494a0726d5517a2f492a36186d6c34a35b4166819dc3a83f77211eb46'),
        'queries': ('dev-queries-r81/QUERIES.jsonl', '478fc0b4fca5936cca09fdffe0a95b9dc2af2bb42482a9aa910fddc48be23eaf'),
        'ranks': ('dev-structure-r90/RANKINGS.jsonl', '4f2c83cdef8897d053c9fc527ed1cb6fae235c16e2f64796fb2859bbc60276d1'),
        'imports': ('test-import-screen-r92/SOURCE-SEAL.json', 'fa10b3858d19c3c6e000a71588b5d125d266c1a6a765f06915ed5537f781edd8'),
        'cases': 12,
    },
    'bears': {
        'root': ARCHIVE / 'bears-metadata-preflight-r73-20261005',
        'source': ('source-projection-r77/SOURCE-PROJECTION.json', '33dc47d6db3804943b76a2dea11dcca3da35ab80451ddb6a9040a7d7dc944cf6'),
        'queries': ('query-only-r77/QUERIES.jsonl', 'be63d0919095bdca86090e86510a15368ea7b14cab8872f7765d17e928300d71'),
        'ranks': ('exposed-structure-r90/RANKINGS.jsonl', '1ebeccb86a2fd489a9b1da9c4e1880fbf3a735d382c1950c701a4d41ba467578'),
        'imports': ('test-import-screen-r92/SOURCE-SEAL.json', 'c17cc538a92e5bb61ca5128913abb109612a6fece74a5d27d04a16f7379b3118'),
        'cases': 24,
    },
}
PACKAGE = re.compile(r'(?m)^\s*package\s+([A-Za-z_$][\w$.]*)\s*;')
IMPORT_LINE = re.compile(r'(?m)^\s*import\s+(?:static\s+)?[A-Za-z_$][\w$.*]*\s*;\s*$')
COMMENT = re.compile(r'/\*[\s\S]*?\*/|(?m://[^\n]*)')
TYPE_TOKEN = re.compile(r'\b[A-Z][A-Za-z0-9_]{4,}\b')
EXCLUDED = {'String', 'Object', 'Integer', 'Boolean', 'Double', 'Float', 'System',
            'Exception', 'RuntimeException', 'Override', 'SuppressWarnings',
            'Before', 'After', 'BeforeEach', 'AfterEach', 'TestCase'}


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def load(root, entry):
    path = root / entry[0]
    if sha(path) != entry[1]:
        raise SystemExit(f'input-drift:{path}')
    return path


def production(path):
    parts = PurePosixPath(path).parts
    return path.endswith('.java') and not {'test', 'tests', 'testing', 'testsrc'} & {part.lower() for part in parts} and not PurePosixPath(path).stem.endswith(('Test', 'Tests', 'TestCase'))


def test_classes(query):
    heading = query.split('\nfailure:\n', 1)[0].removeprefix('failing tests:\n')
    names = set()
    for line in heading.splitlines():
        if '#' not in line:
            continue
        fqcn = line.split('#', 1)[0].strip()
        if re.fullmatch(r'[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)+', fqcn):
            names.add(fqcn)
    return sorted(names)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--population', choices=CONFIG, required=True)
    args = parser.parse_args()
    cfg = CONFIG[args.population]
    root_dir = cfg['root']
    paths = {name: load(root_dir, cfg[name]) for name in ('source', 'queries', 'ranks', 'imports')}
    output = root_dir / 'test-class-usage-r101/SOURCE-SEAL.json'
    if output.exists():
        raise SystemExit('output-exists')
    source = json.loads(paths['source'].read_text())['records']
    queries = [json.loads(line) for line in paths['queries'].read_text().splitlines()]
    ranks = [json.loads(line) for line in paths['ranks'].read_text().splitlines()]
    imports = json.loads(paths['imports'].read_text())['rows']
    if any(len(rows) != cfg['cases'] for rows in (source, queries, ranks, imports)):
        raise SystemExit('cohort-shape')
    rows = []
    for src, query, rank, old in zip(source, queries, ranks, imports, strict=True):
        ordinal = query['ordinal']
        if not (src['ordinal'] == rank['ordinal'] == old['ordinal'] == ordinal
                and src['repo'] == query['repo'] == rank['repo'] == old['repo']
                and rank['query_sha256'] == query['query_sha256']):
            raise SystemExit(f'case-binding:{ordinal}')
        source_root = Path(src['root']).resolve(strict=True)
        if not source_root.is_relative_to(paths['source'].parent.resolve(strict=True)):
            raise SystemExit(f'source-root:{ordinal}')
        prior = rank['strong_raw_symbol_structure']
        if len(prior) != src['projected_files'] or len(set(prior)) != len(prior):
            raise SystemExit(f'universe:{ordinal}')
        universe = set(prior)
        stem_map = defaultdict(list)
        for path in prior:
            if production(path):
                stem_map[PurePosixPath(path).stem].append(path)
        scores = Counter()
        support = defaultdict(list)
        found = 0
        names = test_classes(query['query'])
        for fqcn in names:
            stem = fqcn.rsplit('.', 1)[-1]
            matches = sorted(path for path in universe if PurePosixPath(path).name == stem + '.java')
            matches.sort(key=lambda path: (not path.replace('/', '.').endswith(fqcn + '.java'), len(path), path))
            if not matches:
                continue
            test_path = matches[0]
            target = source_root.joinpath(*PurePosixPath(test_path).parts).resolve(strict=True)
            if not target.is_relative_to(source_root) or not target.is_file():
                raise SystemExit(f'unsafe-source:{ordinal}')
            content = target.read_text(encoding='utf-8', errors='replace')
            package = PACKAGE.search(content)
            if package and not fqcn.startswith(package.group(1) + '.'):
                continue
            found += 1
            body = IMPORT_LINE.sub('', COMMENT.sub('', content))
            tokens = Counter(TYPE_TOKEN.findall(body))
            package_path = package.group(1).replace('.', '/') if package else ''
            for token, frequency in tokens.items():
                if token in EXCLUDED or token not in stem_map:
                    continue
                usage = min(frequency, 3)
                if re.search(r'\bnew\s+' + re.escape(token) + r'\b', body):
                    usage += 2
                if re.search(r'\b' + re.escape(token) + r'\s*\.', body):
                    usage += 1
                for path in stem_map[token]:
                    if path == test_path:
                        continue
                    score = usage + int(bool(package_path and package_path in path))
                    scores[path] += score
                    support[path].append({'test': test_path, 'token': token, 'usage_score': score})
        ordered = sorted(scores, key=lambda path: (-scores[path], prior.index(path), path))
        rows.append({'ordinal': ordinal, 'repo': query['repo'], 'query_sha256': query['query_sha256'],
                     'failing_test_classes': len(names), 'matched_test_classes': found,
                     'ranked_usage_candidates': [{'path': path, 'score': scores[path], 'support': support[path][:3]}
                                                 for path in ordered],
                     'prior_import_top10': [item['path'] for item in old['ranked_import_candidates'][:10]]})
        print(json.dumps({'population': args.population, 'ordinal': ordinal,
                          'matched_test_classes': found, 'candidate_count': len(ordered)}), flush=True)
    result = {'schema_version': 'g01.java-test-class-usage-screen-r101/v1',
              'posture': 'source-only-exposed-development-no-label-model-or-confirmation',
              'population': args.population, 'cases': cfg['cases'],
              'input_sha256': {name: cfg[name][1] for name in paths},
              'script_sha256': sha(Path(__file__)),
              'policy': 'failing test class -> exact buggy-source test class -> non-import executable-text production type-name usage; rank by capped usage score then fixed strong prior rank',
              'coverage_gate': {'gitbug_top10_minimum': 4, 'bears_top10_minimum': 7,
                                'novel_top3_outside_prior_import_top3_each_minimum': 2},
              'rows': rows, 'claim_ceiling': 'Candidate coverage only, not a full matched ranking or superiority.',
              'open_questions': ['Does class-level usage increase cross-population gold reach beyond imports?']}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    output.parent.mkdir(mode=0o700, parents=True, exist_ok=False)
    fd = os.open(output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'population': args.population, 'sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
