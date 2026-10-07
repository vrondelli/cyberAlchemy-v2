#!/usr/bin/env python3
"""Evaluator-only HTTPS GitHub tree-comparison audit of provisional B labels."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
CANDIDATE = BASE / 'graph-dev-b-r1/METADATA-COHORT-B-R2.json'
RAW = BASE / '1.3.1-bugswarm.json'
GOLD = BASE / 'graph-dev-b-r2/evaluator-only/DEV-GOLD-AUDIT-B-R3.json'
OUTPUT = BASE / 'graph-dev-b-r2/evaluator-only/github-https-provenance-r1'
PINS = {
    'candidate': (CANDIDATE, '53df9fa74a732090fa23c65373b0f656cf73b0b9a92a6e1c81ca534b97bb16b8'),
    'raw': (RAW, 'c952d8f7080e798cc66d903906d645c6dfc21f88789b1977e0d3e2d0f7c2192d'),
    'gold': (GOLD, 'ac3ef81c36088dc305508c940df9a86d583c8601ba41874c1369197a14ec376e'),
}
MAX_BYTES = 8 * 1024 * 1024


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def save_new(path: Path, data: bytes) -> None:
    with os.fdopen(os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600), 'wb') as stream:
        stream.write(data)


def json_bytes(value: object) -> bytes:
    return (json.dumps(value, sort_keys=True, indent=2) + '\n').encode()


def safe_source_path(path: object, language: str) -> bool:
    if not isinstance(path, str) or not path or path.startswith('/') or '\\' in path:
        return False
    parts = path.split('/')
    if any(part in ('', '.', '..') for part in parts):
        return False
    if not path.endswith('.py' if language == 'Python' else '.java'):
        return False
    lower = [part.lower() for part in parts]
    base = lower[-1]
    return not (any(p in ('test', 'tests', 'testing', 'testdata', 'fixtures',
                          'examples', 'docs') for p in lower[:-1]) or
                base.startswith('test_') or base.endswith('_test.py') or
                base.endswith('test.java') or base.endswith('tests.java'))


def fetch(url: str) -> tuple[int, bytes, dict[str, str]]:
    request = Request(url, headers={'Accept': 'application/vnd.github+json',
                                    'User-Agent': 'ARE-G01-GitHub-label-provenance/1'})
    try:
        with urlopen(request, timeout=30) as response:
            return response.status, response.read(MAX_BYTES + 1), dict(response.headers)
    except HTTPError as error:
        return error.code, error.read(min(MAX_BYTES, 65536)), dict(error.headers)
    except (URLError, TimeoutError):
        return 0, b'', {}


def main() -> None:
    if OUTPUT.exists():
        raise SystemExit('output-exists')
    blobs = {}
    for name, (path, expected) in PINS.items():
        blob = path.read_bytes()
        if sha(blob) != expected:
            raise SystemExit(f'input-pin-drift:{name}')
        blobs[name] = blob
    cases = json.loads(blobs['candidate'])['development']
    raw = {row['image_tag']: row for row in json.loads(blobs['raw'])}
    labels = json.loads(blobs['gold'])['results']
    if len(cases) != 24 or len(labels) != 24:
        raise SystemExit('denominator-drift')
    OUTPUT.mkdir(mode=0o700)
    save_new(OUTPUT / 'AUDIT-FREEZE.json', json_bytes({
        'schema_version': 'are.g01-bugswarm-graph-dev-b-github-label-freeze-r1/v1',
        'pins': {name: pin for name, (_, pin) in PINS.items()},
        'script_sha256': sha(Path(__file__).read_bytes()),
        'purpose': 'evaluator-only independent HTTPS corroboration of HTTP diff labels',
        'endpoint': 'https://api.github.com/repos/{repo}/compare/{failed}...{passed}',
        'maximum_requests': 24, 'automatic_retries': 0,
        'rule': 'Compare exact failing and passing commit identities and safe old-file source paths; no source-side feedback',
        'claim_ceiling': 'Comparison is corroboration, not proof of CI log integrity or fresh confirmation'}))
    results = []
    for ordinal, (case, label) in enumerate(zip(cases, labels), 1):
        tag = case['image_tag']
        meta = raw[tag]
        failed = case['failure_commit']
        passed = meta['passed_job']['trigger_sha']
        if (case['ordinal'] != ordinal or label['ordinal'] != ordinal or
                label['image_tag'] != tag or label['repo'] != case['repo'] or
                meta['repo'] != case['repo'] or meta['failed_job']['trigger_sha'] != failed or
                not label['gold_admissible']):
            raise SystemExit(f'identity-drift:{ordinal}')
        url = (f"https://api.github.com/repos/{quote(case['repo'], safe='/')}/compare/"
               f"{quote(failed, safe='')}...{quote(passed, safe='')}")
        status, body, headers = fetch(url)
        response_sha = sha(body)
        body_name = f'GITHUB-COMPARE-{ordinal:02d}.json'
        if status == 200 and len(body) <= MAX_BYTES:
            save_new(OUTPUT / body_name, body)
        complete = False
        identity = False
        github_paths: set[str] = set()
        compare_status = None
        changed_file_count = None
        if status == 200 and len(body) <= MAX_BYTES:
            try:
                doc = json.loads(body)
                compare_status = doc.get('status')
                files = doc.get('files')
                changed_file_count = len(files) if isinstance(files, list) else None
                identity = (doc.get('base_commit', {}).get('sha') == failed and
                            doc.get('commits', [{}])[-1].get('sha') == passed)
                complete = (isinstance(files, list) and len(files) < 300 and
                            not headers.get('Link') and identity)
                if isinstance(files, list):
                    for item in files:
                        old = item.get('previous_filename', item.get('filename'))
                        if safe_source_path(old, case['language']):
                            github_paths.add(old)
            except (ValueError, AttributeError, KeyError, IndexError):
                pass
        expected = {item['path'] for item in label['source_gold_paths']}
        matched = complete and github_paths == expected
        row = {'ordinal': ordinal, 'id': tag, 'repo': case['repo'],
               'failed_sha': failed, 'passed_sha': passed, 'http_status': status,
               'response_sha256': response_sha, 'response_file': body_name if status == 200 else None,
               'compare_status': compare_status, 'changed_file_count': changed_file_count,
               'identity_matched': identity, 'complete_file_list': complete,
               'http_gold_paths': sorted(expected), 'github_source_paths': sorted(github_paths),
               'source_path_set_matched': matched, 'github_rate_remaining': headers.get('X-RateLimit-Remaining'),
               'gold_not_exported_to_ranker': True}
        save_new(OUTPUT / f'AUDIT-{ordinal:02d}.json', json_bytes(row))
        results.append(row)
        print(json.dumps({'ordinal': ordinal, 'status': status,
                          'complete': complete, 'source_path_set_matched': matched,
                          'rate_remaining': row['github_rate_remaining']}), flush=True)
        if status != 200 or not complete:
            break
    receipt = {'schema_version': 'are.g01-bugswarm-graph-dev-b-github-label-audit-r1/v1',
               'attempted': len(results), 'complete_comparisons': sum(r['complete_file_list'] for r in results),
               'exact_source_path_matches': sum(r['source_path_set_matched'] for r in results),
               'all_24_exact': len(results) == 24 and all(r['source_path_set_matched'] for r in results),
               'results': results, 'source_side_exported_gold': False,
               'reserved_confirmation_opened': False,
               'claim_ceiling': 'HTTPS GitHub compare corroborates patch paths only; original failure logs and exact fix causality require separate evidence'}
    encoded = json_bytes(receipt)
    save_new(OUTPUT / 'AUDIT-RESULT.json', encoded)
    print(json.dumps({'attempted': receipt['attempted'],
                      'complete_comparisons': receipt['complete_comparisons'],
                      'exact_source_path_matches': receipt['exact_source_path_matches'],
                      'all_24_exact': receipt['all_24_exact'],
                      'result_sha256': sha(encoded)}), flush=True)


if __name__ == '__main__':
    main()
