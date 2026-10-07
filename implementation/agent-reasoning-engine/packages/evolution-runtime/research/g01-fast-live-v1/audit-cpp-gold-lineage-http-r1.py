#!/usr/bin/env python3
"""Evaluator-only C++ gold/base screen using immutable GitHub source URLs.

This projects source fields before opening native gold. Only eligibility bits and
classification counts leave this process; gold paths/content and fetched source
are never written into the receipt. It makes no model or scoring calls.
"""

import argparse
from collections import Counter, defaultdict
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

import pyarrow.parquet as pq


BASE = Path('/opt/are/evolution-runtime')
UPSTREAM = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
SUPPLY = BASE / 'g01-cross-branch-supply-after-r7-r1/SOURCE-SUPPLY-AUDIT.json'
EXPOSURE_SCRIPT = BASE / 'g01-span-refinement-tools-r3/audit-cross-branch-supply-r1.py'
OUTPUT_ROOT = BASE / 'g01-cpp-gold-lineage-http-r1'
EXPECTED_SUPPLY_SHA = '8e25f74d198ab76489676c3bbdd5f00d8e1efd5ccb68738ab4b48ef72ef54f09'
EXPECTED_EXPOSURE_SCRIPT_SHA = 'f2f5bcced7e056542e8f92e3ac0c3ed9bd117ba8c110d99918d185c88e3e8b6a'
EXPECTED_EXPOSURE_SET_SHA = '6e6610069179c525f30a6a66cfd5e6a3324e32c929e07ac30b0dc0a5c9622d2b'
EXPECTED_PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
TARGET_REPOS = ('catchorg/Catch2', 'fmtlib/fmt', 'nlohmann/json', 'simdjson/simdjson')
EXPECTED_COUNTS = (4, 18, 26, 12)
MAX_SOURCE_BYTES = 5_000_000


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def content_lines(content):
    if not isinstance(content, str) or not content:
        return None, None
    raw = content.splitlines()
    parsed = [re.match(r'^(\d+)(?:\t(.*))?$', line) for line in raw]
    if raw and all(parsed):
        return [match.group(2) or '' for match in parsed], [int(match.group(1)) for match in parsed]
    return raw, None


def classify(item, source, normalize):
    path = normalize(item.get('file', ''))
    if not path or path.startswith('/') or '..' in Path(path).parts or '\\' in path:
        return 'invalid-path'
    if source is None:
        return 'source-unavailable'
    lines = source.decode('utf8', errors='replace').splitlines()
    start, end = item.get('start_line'), item.get('end_line')
    if (type(start) is not int or type(end) is not int or
            not 1 <= start <= end or start > len(lines) or end > len(lines) + 1):
        return 'range-beyond-base'
    observed, numbers = content_lines(item.get('content'))
    if not observed:
        return 'content-absent'
    if numbers is not None and numbers != list(range(start, start + len(observed))):
        return 'content-numbering-mismatch'
    expected = lines[start - 1:min(end, len(lines))]
    if observed == expected:
        return 'verified-exact'
    if len(observed) == len(expected) and all(a.strip() == b.strip() for a, b in zip(observed, expected)):
        return 'verified-whitespace-only'
    if end == len(lines) + 1 and observed[-1] == '' and observed[:-1] == expected:
        return 'verified-eof-empty-sentinel'
    if len(observed) == len(expected) - 1 and expected[-1].strip() == '' and observed == expected[:-1]:
        return 'verified-omitted-terminal-blank'
    return 'content-source-mismatch'


def source_rows():
    if sha(SUPPLY) != EXPECTED_SUPPLY_SHA or sha(EXPOSURE_SCRIPT) != EXPECTED_EXPOSURE_SCRIPT_SHA:
        raise ValueError('supply-or-exposure-script-drift')
    supply = json.loads(SUPPLY.read_text())
    parquet = Path(supply['source_parquet'])
    if sha(parquet) != EXPECTED_PARQUET_SHA or supply['source_parquet_sha256'] != EXPECTED_PARQUET_SHA:
        raise ValueError('source-parquet-drift')
    spec = importlib.util.spec_from_file_location('g01_supply', EXPOSURE_SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    exposure = module.exposure(BASE, Path('/opt/are-benchmark-runs'))
    if exposure['digests']['union'] != EXPECTED_EXPOSURE_SET_SHA or exposure['counts']['union'] != 276:
        raise ValueError('cross-branch-exposure-drift')
    fields = ('instance_id', 'repo', 'repo_url', 'base_commit', 'language')
    rows = [row for row in pq.read_table(parquet, columns=list(fields)).to_pylist()
            if row['repo'] in TARGET_REPOS and row['instance_id'] not in exposure['union']]
    counts = Counter(row['repo'] for row in rows)
    if tuple(counts[repo] for repo in TARGET_REPOS) != EXPECTED_COUNTS:
        raise ValueError('cpp-target-population-drift')
    for row in rows:
        commit = row['base_commit']
        if (row['language'] != 'cpp' or row['repo_url'] != f'https://github.com/{row["repo"]}.git' or
                not isinstance(commit, str) or not re.fullmatch(r'[0-9a-f]{40}', commit)):
            raise ValueError('source-row-shape')
    return sorted(rows, key=lambda row: row['instance_id'])


def fetch_source(repo, commit, path, cache, stats):
    key = (repo, commit, path)
    if key in cache:
        return cache[key]
    url = f'https://raw.githubusercontent.com/{repo}/{commit}/{urllib.parse.quote(path, safe="/")}'
    request = urllib.request.Request(url, headers={'User-Agent': 'ARE-private-gold-lineage-screen/1'})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            if response.status != 200:
                stats[f'http-{response.status}'] += 1
                cache[key] = None
            else:
                source = response.read(MAX_SOURCE_BYTES + 1)
                if len(source) > MAX_SOURCE_BYTES:
                    stats['source-over-cap'] += 1
                    cache[key] = None
                else:
                    stats['source-ok'] += 1
                    cache[key] = source
    except urllib.error.HTTPError as error:
        stats[f'http-{error.code}'] += 1
        cache[key] = None
    except (urllib.error.URLError, TimeoutError):
        stats['transport-error'] += 1
        cache[key] = None
    return cache[key]


def audit():
    rows = source_rows()
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader, _normalize_rel_path
    loader = GoldLoader(str(UPSTREAM / 'data/full.parquet'))
    cache = {}
    stats = Counter()
    results = []
    for row in rows:
        gold = loader.get(row['instance_id'])
        if gold is None or gold.commit != row['base_commit'] or gold._data['language'] != 'cpp':
            raise ValueError('gold-source-identity-drift')
        items = gold.init + gold.add
        verdicts = []
        for item in items:
            path = _normalize_rel_path(item.get('file', ''))
            if not path or path.startswith('/') or '..' in Path(path).parts or '\\' in path:
                verdicts.append('invalid-path')
                continue
            source = fetch_source(row['repo'], row['base_commit'], path, cache, stats)
            verdicts.append(classify(item, source, _normalize_rel_path))
        results.append({'instance_id': row['instance_id'], 'repo': row['repo'],
                        'gold_lineage_clean': bool(verdicts) and all(v.startswith('verified-') for v in verdicts),
                        'annotation_count': len(verdicts),
                        'classification_counts': dict(sorted(Counter(verdicts).items()))})
    by_repo = defaultdict(lambda: {'total': 0, 'clean': 0})
    for result in results:
        by_repo[result['repo']]['total'] += 1
        by_repo[result['repo']]['clean'] += int(result['gold_lineage_clean'])
    return {'schema_version': 'are.g01-cpp-gold-lineage-http/v1',
            'posture': 'evaluator-only-no-model-no-scores',
            'supply_sha256': EXPECTED_SUPPLY_SHA,
            'exposure_set_sha256': EXPECTED_EXPOSURE_SET_SHA,
            'source_parquet_sha256': EXPECTED_PARQUET_SHA,
            'script_sha256': sha(Path(__file__)),
            'source_method': 'raw.githubusercontent.com exact base-commit file, 5MB cap, one attempt',
            'source_fetch_counts': dict(sorted(stats.items())),
            'tasks': results,
            'summary': {'tasks': len(results), 'clean': sum(row['gold_lineage_clean'] for row in results),
                        'by_repo': dict(sorted(by_repo.items()))},
            'gold_paths_or_content_exported': False,
            'claim_ceiling': 'Evaluator-only mechanical lineage screen; source-cache readiness, semantic label certification, freeze, and performance remain unproven.',
            'open_questions': ['Which clean C++ tasks have source-index cache readiness?',
                               'Would a separately frozen C++-inclusive population test the intended product claim?']}


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
