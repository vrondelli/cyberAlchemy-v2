#!/usr/bin/env python3
"""Evaluator-only untouched Java/TypeScript and cached-repo Python screen.

Repository coverage is fixed from source-only supply and cache availability,
not benchmark outcomes. The pinned C++ predecessor supplies the exact HTTP and
positional-verdict implementation; no gold paths, text, or scores are exported.
"""

import argparse
from collections import Counter, defaultdict
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import sys

import pyarrow.parquet as pq


BASE = Path('/opt/are/evolution-runtime')
UPSTREAM = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
SUPPLY = BASE / 'g01-cross-branch-supply-after-r7-r1/SOURCE-SUPPLY-AUDIT.json'
EXPOSURE_SCRIPT = BASE / 'g01-span-refinement-tools-r3/audit-cross-branch-supply-r1.py'
PRIOR_SCRIPT = BASE / 'g01-cpp-gold-lineage-http-r1/audit-cpp-gold-lineage-http-r1.py'
OUTPUT_ROOT = BASE / 'g01-multilang-gold-lineage-http-r1'
EXPECTED_PRIOR_SHA = '485a699e766f2c434ecf50109a0e7401facf700aee757e2443dacb856c7d584b'
EXPECTED_SUPPLY_SHA = '8e25f74d198ab76489676c3bbdd5f00d8e1efd5ccb68738ab4b48ef72ef54f09'
EXPECTED_EXPOSURE_SCRIPT_SHA = 'f2f5bcced7e056542e8f92e3ac0c3ed9bd117ba8c110d99918d185c88e3e8b6a'
EXPECTED_EXPOSURE_SET_SHA = '6e6610069179c525f30a6a66cfd5e6a3324e32c929e07ac30b0dc0a5c9622d2b'
EXPECTED_PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
TARGETS = {
    'alibaba/fastjson2': ('java', 3),
    'elastic/logstash': ('java', 16),
    'fasterxml/jackson': ('java', 31),
    'google/gson': ('java', 2),
    'googlecontainertools/jib': ('java', 2),
    'mockito/mockito': ('java', 3),
    'angular/angular': ('typescript', 1),
    'coder/code-server': ('typescript', 2),
    'darkreader/darkreader': ('typescript', 2),
    'microsoft/vscode': ('typescript', 14),
    'mui/material': ('typescript', 47),
    'mui/material-ui': ('typescript', 37),
    'tailwindlabs/tailwindcss': ('typescript', 1),
    'vuejs/core': ('typescript', 15),
    # Source-only existing exact-commit cache availability motivated this
    # Python repository subset; all untouched tasks in each are included.
    'internetarchive/openlibrary': ('python', 17),
    'qutebrowser/qutebrowser': ('python', 9),
}


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def load_module(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def source_rows():
    if (sha(SUPPLY) != EXPECTED_SUPPLY_SHA or sha(EXPOSURE_SCRIPT) != EXPECTED_EXPOSURE_SCRIPT_SHA or
            sha(PRIOR_SCRIPT) != EXPECTED_PRIOR_SHA):
        raise ValueError('pinned-input-drift')
    supply = json.loads(SUPPLY.read_text())
    parquet = Path(supply['source_parquet'])
    if sha(parquet) != EXPECTED_PARQUET_SHA or supply['source_parquet_sha256'] != EXPECTED_PARQUET_SHA:
        raise ValueError('source-parquet-drift')
    exposure = load_module(EXPOSURE_SCRIPT, 'g01_supply').exposure(BASE, Path('/opt/are-benchmark-runs'))
    if exposure['digests']['union'] != EXPECTED_EXPOSURE_SET_SHA or exposure['counts']['union'] != 276:
        raise ValueError('cross-branch-exposure-drift')
    fields = ('instance_id', 'repo', 'repo_url', 'base_commit', 'language')
    rows = [row for row in pq.read_table(parquet, columns=list(fields)).to_pylist()
            if row['repo'] in TARGETS and row['instance_id'] not in exposure['union']]
    counts = Counter(row['repo'] for row in rows)
    if {repo: counts[repo] for repo in TARGETS} != {repo: count for repo, (_, count) in TARGETS.items()}:
        raise ValueError('target-population-drift')
    for row in rows:
        commit = row['base_commit']
        if (row['language'] != TARGETS[row['repo']][0] or
                not isinstance(row['repo_url'], str) or
                not re.fullmatch(r'https://github\.com/[^/]+/[^/]+\.git', row['repo_url']) or
                not isinstance(commit, str) or not re.fullmatch(r'[0-9a-f]{40}', commit)):
            raise ValueError('source-row-shape')
    return sorted(rows, key=lambda row: (row['repo'], row['instance_id']))


def audit():
    rows = source_rows()
    core = load_module(PRIOR_SCRIPT, 'g01_cpp_http_rule')
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader, _normalize_rel_path
    loader = GoldLoader(str(UPSTREAM / 'data/full.parquet'))
    cache = {}
    previous_repo = None
    stats = Counter()
    results = []
    for row in rows:
        if row['repo'] != previous_repo:
            cache.clear()
            previous_repo = row['repo']
        gold = loader.get(row['instance_id'])
        if (gold is None or gold.commit != row['base_commit'] or
                gold._data['language'] != row['language']):
            raise ValueError('gold-source-identity-drift')
        verdicts = []
        for item in gold.init + gold.add:
            path = _normalize_rel_path(item.get('file', ''))
            if not path or path.startswith('/') or '..' in Path(path).parts or '\\' in path:
                verdicts.append('invalid-path')
                continue
            # The dataset grouping key is not always the GitHub source repo:
            # For example, the jackson group spans multiple repositories.
            source_repo = row['repo_url'][len('https://github.com/'):-len('.git')]
            source = core.fetch_source(source_repo, row['base_commit'], path, cache, stats)
            verdicts.append(core.classify(item, source, _normalize_rel_path))
        results.append({'instance_id': row['instance_id'], 'repo': row['repo'],
                        'language': row['language'],
                        'gold_lineage_clean': bool(verdicts) and all(v.startswith('verified-') for v in verdicts),
                        'annotation_count': len(verdicts),
                        'classification_counts': dict(sorted(Counter(verdicts).items()))})
    by_repo = defaultdict(lambda: {'total': 0, 'clean': 0})
    by_language = defaultdict(lambda: {'total': 0, 'clean': 0})
    for result in results:
        for bucket in (by_repo[result['repo']], by_language[result['language']]):
            bucket['total'] += 1
            bucket['clean'] += int(result['gold_lineage_clean'])
    return {'schema_version': 'are.g01-multilang-gold-lineage-http/v1',
            'posture': 'evaluator-only-no-model-no-scores',
            'supply_sha256': EXPECTED_SUPPLY_SHA,
            'exposure_set_sha256': EXPECTED_EXPOSURE_SET_SHA,
            'source_parquet_sha256': EXPECTED_PARQUET_SHA,
            'prior_rule_sha256': EXPECTED_PRIOR_SHA,
            'script_sha256': sha(Path(__file__)),
            'source_method': 'raw.githubusercontent.com exact base-commit file, 5MB cap, one attempt',
            'source_fetch_counts': dict(sorted(stats.items())),
            'tasks': results,
            'summary': {'tasks': len(results), 'clean': sum(row['gold_lineage_clean'] for row in results),
                        'by_language': dict(sorted(by_language.items())),
                        'by_repo': dict(sorted(by_repo.items()))},
            'gold_paths_or_content_exported': False,
            'claim_ceiling': 'Evaluator-only mechanical lineage screen; subset Python coverage, cache readiness, semantic certification, freeze, and performance remain unproven.',
            'open_questions': ['How many clean rows can be indexed under VPS storage constraints?',
                               'How should the separate multi-language G01 population be prospectively frozen?']}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    if not args.out.parent.is_dir() or args.out.exists() or args.out.parent != OUTPUT_ROOT:
        raise ValueError('fresh output file under exact output root required')
    result = audit()
    with args.out.open('x') as stream:
        json.dump(result, stream, indent=2, sort_keys=True)
        stream.write('\n')
    args.out.chmod(0o600)
    print(json.dumps({'summary': result['summary'], 'source_fetch_counts': result['source_fetch_counts'],
                      'receipt_sha256': sha(args.out)}, sort_keys=True))


if __name__ == '__main__':
    main()
