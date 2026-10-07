#!/usr/bin/env python3
"""Evaluator-only direct blob-tree comparison for five GitHub compare mismatches."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-dev-b-r2/evaluator-only')
INPUT = BASE / 'github-https-provenance-r1/AUDIT-RESULT.json'
OUTPUT = BASE / 'github-tree-provenance-r1'
PIN = 'c9ccdb93652c42047e53f28fc8cfbdef33118ec17018d5e440a3c8b714dd6cb3'
MAX_BYTES = 16 * 1024 * 1024


def sha(blob: bytes) -> str:
    return hashlib.sha256(blob).hexdigest()


def save(path: Path, blob: bytes) -> None:
    with os.fdopen(os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600), 'wb') as stream:
        stream.write(blob)


def encoded(value: object) -> bytes:
    return (json.dumps(value, sort_keys=True, indent=2) + '\n').encode()


def safe_source(path: str, language: str) -> bool:
    if not path or path.startswith('/') or '\\' in path:
        return False
    parts = path.split('/')
    if any(p in ('', '.', '..') for p in parts):
        return False
    if not path.endswith('.py' if language == 'Python' else '.java'):
        return False
    lower = [p.lower() for p in parts]
    base = lower[-1]
    return not (any(p in ('test', 'tests', 'testing', 'testdata', 'fixtures',
                          'examples', 'docs') for p in lower[:-1]) or
                base.startswith('test_') or base.endswith('_test.py') or
                base.endswith('test.java') or base.endswith('tests.java'))


def fetch(repo: str, commit: str) -> tuple[int, bytes]:
    url = (f"https://api.github.com/repos/{quote(repo, safe='/')}/git/trees/"
           f"{quote(commit, safe='')}?recursive=1")
    request = Request(url, headers={'Accept': 'application/vnd.github+json',
                                    'User-Agent': 'ARE-G01-GitHub-tree-provenance/1'})
    try:
        with urlopen(request, timeout=40) as response:
            return response.status, response.read(MAX_BYTES + 1)
    except HTTPError as error:
        return error.code, error.read(min(MAX_BYTES, 65536))
    except (URLError, TimeoutError):
        return 0, b''


def main() -> None:
    if OUTPUT.exists() or sha(INPUT.read_bytes()) != PIN:
        raise SystemExit('output-exists-or-input-pin-drift')
    prior = json.loads(INPUT.read_bytes())
    selected = [row for row in prior['results'] if not row['source_path_set_matched']]
    if (prior['attempted'] != 24 or len(selected) != 5 or
            any(not row['complete_file_list'] for row in selected)):
        raise SystemExit('cohort-or-mismatch-drift')
    OUTPUT.mkdir(mode=0o700)
    save(OUTPUT / 'AUDIT-FREEZE.json', encoded({
        'schema_version': 'are.g01-bugswarm-graph-dev-b-github-tree-freeze-r1/v1',
        'prior_sha256': PIN, 'script_sha256': sha(Path(__file__).read_bytes()),
        'ordinals': [r['ordinal'] for r in selected], 'maximum_requests': 10,
        'automatic_retries': 0,
        'rule': 'Compare all failed-tree source blob SHA values to the exact passing tree; retain only paths present in the failed tree',
        'claim_ceiling': 'HTTPS tree corroboration is not an original CI-log authenticity or fix-causality proof'}))
    results = []
    for row in selected:
        ordinal = row['ordinal']
        trees = {}
        statuses = {}
        for side, commit in (('failed', row['failed_sha']), ('passed', row['passed_sha'])):
            status, blob = fetch(row['repo'], commit)
            statuses[side] = status
            if status == 200 and len(blob) <= MAX_BYTES:
                save(OUTPUT / f'TREE-{ordinal:02d}-{side.upper()}.json', blob)
                doc = json.loads(blob)
                if not doc.get('truncated') and isinstance(doc.get('tree'), list):
                    trees[side] = {item['path']: item['sha'] for item in doc['tree']
                                   if item.get('type') == 'blob' and
                                   isinstance(item.get('path'), str) and
                                   isinstance(item.get('sha'), str)}
            print(json.dumps({'ordinal': ordinal, 'side': side, 'http_status': status,
                              'complete_tree': side in trees}), flush=True)
            if side not in trees:
                break
        complete = len(trees) == 2
        language = 'Python' if ordinal <= 12 else 'Java'
        changed = sorted(path for path, blob_sha in trees.get('failed', {}).items()
                         if safe_source(path, language) and
                         trees.get('passed', {}).get(path) != blob_sha) if complete else []
        expected = sorted(row['http_gold_paths'])
        receipt = {'ordinal': ordinal, 'repo': row['repo'],
                   'failed_sha': row['failed_sha'], 'passed_sha': row['passed_sha'],
                   'http_status': statuses, 'complete_trees': complete,
                   'failed_blob_count': len(trees.get('failed', {})),
                   'passed_blob_count': len(trees.get('passed', {})),
                   'direct_changed_old_source_paths': changed,
                   'provisional_http_gold_paths': expected,
                   'exact_source_path_set_matched': complete and changed == expected,
                   'gold_not_exported_to_ranker': True}
        save(OUTPUT / f'AUDIT-{ordinal:02d}.json', encoded(receipt))
        results.append(receipt)
        print(json.dumps({'ordinal': ordinal, 'complete': complete,
                          'exact_source_path_set_matched': receipt['exact_source_path_set_matched'],
                          'direct_changed_count': len(changed)}), flush=True)
        if not complete:
            break
    result = {'schema_version': 'are.g01-bugswarm-graph-dev-b-github-tree-audit-r1/v1',
              'attempted': len(results),
              'exact_source_path_matches': sum(r['exact_source_path_set_matched'] for r in results),
              'all_five_exact': len(results) == 5 and all(r['exact_source_path_set_matched'] for r in results),
              'results': results, 'source_side_exported_gold': False,
              'reserved_confirmation_opened': False,
              'claim_ceiling': 'Direct HTTPS tree corroboration of five compare discrepancies only; CI log authenticity and fresh confirmation remain open'}
    blob = encoded(result)
    save(OUTPUT / 'AUDIT-RESULT.json', blob)
    print(json.dumps({'attempted': result['attempted'],
                      'exact_source_path_matches': result['exact_source_path_matches'],
                      'all_five_exact': result['all_five_exact'],
                      'result_sha256': sha(blob)}), flush=True)


if __name__ == '__main__':
    main()
