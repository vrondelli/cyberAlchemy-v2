#!/usr/bin/env python3
"""Evaluator-only exact source-blob comparison with HTTPS passing Git trees."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


ARCHIVE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
BASE = ARCHIVE / 'graph-dev-b-r2'
OUTPUT = BASE / 'evaluator-only/github-projected-tree-provenance-r1'
PRIOR = BASE / 'evaluator-only/github-tree-provenance-r1'
INPUTS = {
    'metadata': (ARCHIVE / 'graph-dev-b-r1/METADATA-COHORT-B-R2.json', '53df9fa74a732090fa23c65373b0f656cf73b0b9a92a6e1c81ca534b97bb16b8'),
    'raw': (ARCHIVE / '1.3.1-bugswarm.json', 'c952d8f7080e798cc66d903906d645c6dfc21f88789b1977e0d3e2d0f7c2192d'),
    'projection': (BASE / 'code-only/SOURCE-PROJECTION-RECEIPT.json', 'ac0e840cad602ac5b5f80ba7579389ab95cc6efdb4ae682c1744103b29db5d92'),
    'gold': (BASE / 'evaluator-only/DEV-GOLD-AUDIT-B-R3.json', 'ac3ef81c36088dc305508c940df9a86d583c8601ba41874c1369197a14ec376e'),
    'five_tree_result': (PRIOR / 'AUDIT-RESULT.json', '4501c2f03acd5d22fcdada9fd9f7b4fa277f123eb0e3fadf2f8a2427c66f2c13'),
}
MAX_BYTES = 16 * 1024 * 1024


def sha(blob: bytes) -> str:
    return hashlib.sha256(blob).hexdigest()


def git_blob_sha(blob: bytes) -> str:
    return hashlib.sha1(f'blob {len(blob)}\0'.encode() + blob).hexdigest()


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


def tree_map(blob: bytes) -> dict[str, str]:
    doc = json.loads(blob)
    if doc.get('truncated') or not isinstance(doc.get('tree'), list):
        raise ValueError('truncated-or-missing-tree')
    return {item['path']: item['sha'] for item in doc['tree']
            if item.get('type') == 'blob' and isinstance(item.get('path'), str)
            and isinstance(item.get('sha'), str)}


def fetch(repo: str, commit: str) -> tuple[int, bytes]:
    url = (f"https://api.github.com/repos/{quote(repo, safe='/')}/git/trees/"
           f"{quote(commit, safe='')}?recursive=1")
    request = Request(url, headers={'Accept': 'application/vnd.github+json',
                                    'User-Agent': 'ARE-G01-projected-tree-provenance/1'})
    try:
        with urlopen(request, timeout=40) as response:
            return response.status, response.read(MAX_BYTES + 1)
    except HTTPError as error:
        return error.code, error.read(min(MAX_BYTES, 65536))
    except (URLError, TimeoutError):
        return 0, b''


def projected_blobs(root: Path, language: str) -> dict[str, str]:
    if not root.is_dir() or root.is_symlink():
        raise ValueError('source-root-invalid')
    blobs = {}
    for path in root.rglob('*'):
        if path.is_symlink():
            raise ValueError('source-symlink')
        if not path.is_file():
            continue
        rel = path.relative_to(root).as_posix()
        if safe_source(rel, language):
            blobs[rel] = git_blob_sha(path.read_bytes())
    return blobs


def main() -> None:
    if OUTPUT.exists():
        raise SystemExit('output-exists')
    blobs = {}
    for name, (path, pin) in INPUTS.items():
        data = path.read_bytes()
        if sha(data) != pin:
            raise SystemExit(f'input-pin-drift:{name}')
        blobs[name] = data
    cases = json.loads(blobs['metadata'])['development']
    raw = {row['image_tag']: row for row in json.loads(blobs['raw'])}
    records = json.loads(blobs['projection'])['records']
    labels = json.loads(blobs['gold'])['results']
    prior = json.loads(blobs['five_tree_result'])
    reused = {row['ordinal'] for row in prior['results']}
    if (not all(len(items) == 24 for items in (cases, records, labels)) or
            len(reused) != 5 or not prior['all_five_exact']):
        raise SystemExit('denominator-drift')
    OUTPUT.mkdir(mode=0o700)
    save(OUTPUT / 'AUDIT-FREEZE.json', encoded({
        'schema_version': 'are.g01-bugswarm-graph-dev-b-projected-tree-freeze-r1/v1',
        'pins': {name: pin for name, (_, pin) in INPUTS.items()},
        'script_sha256': sha(Path(__file__).read_bytes()),
        'rule': 'Compute Git blob SHA1 for every old non-test source file in exact failed-commit projection, compare to exact passing-commit HTTPS Git tree; reuse and cross-check five already fetched tree pairs',
        'maximum_new_requests': 19, 'automatic_retries': 0,
        'claim_ceiling': 'Evaluator-only label corroboration; no CI log authenticity or fresh confirmation'}))
    results = []
    for ordinal, (case, record, label) in enumerate(zip(cases, records, labels), 1):
        tag = case['image_tag']
        failed = case['failure_commit']
        passed = raw[tag]['passed_job']['trigger_sha']
        if (case['ordinal'] != ordinal or record['ordinal'] != ordinal or
                record['image_tag'] != tag or record['commit'] != failed or
                label['ordinal'] != ordinal or label['image_tag'] != tag or
                not label['gold_admissible']):
            raise SystemExit(f'identity-drift:{ordinal}')
        source = projected_blobs(Path(record['root']), case['language'])
        if not source:
            raise SystemExit(f'empty-projection:{ordinal}')
        failed_crosscheck = None
        if ordinal in reused:
            old_tree = tree_map((PRIOR / f'TREE-{ordinal:02d}-FAILED.json').read_bytes())
            failed_crosscheck = all(old_tree.get(path) == blob for path, blob in source.items())
            if not failed_crosscheck:
                raise SystemExit(f'projection-vs-github-failed-tree:{ordinal}')
            status = 200
            body = (PRIOR / f'TREE-{ordinal:02d}-PASSED.json').read_bytes()
            response_file = f'../github-tree-provenance-r1/TREE-{ordinal:02d}-PASSED.json'
        else:
            status, body = fetch(case['repo'], passed)
            response_file = f'PASS-TREE-{ordinal:02d}.json' if status == 200 and len(body) <= MAX_BYTES else None
            if response_file:
                save(OUTPUT / response_file, body)
        complete = False
        changed = []
        if status == 200 and len(body) <= MAX_BYTES:
            try:
                target = tree_map(body)
                changed = sorted(path for path, blob in source.items() if target.get(path) != blob)
                complete = True
            except (ValueError, KeyError, TypeError):
                pass
        expected = sorted(item['path'] for item in label['source_gold_paths'])
        row = {'ordinal': ordinal, 'id': tag, 'repo': case['repo'],
               'failed_sha': failed, 'passed_sha': passed,
               'source_file_count': len(source), 'failed_tree_crosscheck': failed_crosscheck,
               'https_status': status, 'pass_tree_file': response_file,
               'pass_tree_sha256': sha(body) if status == 200 else None,
               'complete_pass_tree': complete,
               'direct_changed_old_source_paths': changed,
               'provisional_http_gold_paths': expected,
               'exact_source_path_set_matched': complete and changed == expected,
               'source_side_exported_gold': False}
        save(OUTPUT / f'AUDIT-{ordinal:02d}.json', encoded(row))
        results.append(row)
        print(json.dumps({'ordinal': ordinal, 'complete': complete,
                          'exact_source_path_set_matched': row['exact_source_path_set_matched'],
                          'source_files': len(source), 'reused_tree': ordinal in reused}), flush=True)
        if not complete:
            break
    result = {'schema_version': 'are.g01-bugswarm-graph-dev-b-projected-tree-audit-r1/v1',
              'attempted': len(results),
              'complete_pass_trees': sum(r['complete_pass_tree'] for r in results),
              'exact_source_path_matches': sum(r['exact_source_path_set_matched'] for r in results),
              'all_24_exact': len(results) == 24 and all(r['exact_source_path_set_matched'] for r in results),
              'results': results, 'source_side_exported_gold': False,
              'reserved_confirmation_opened': False,
              'claim_ceiling': 'Direct HTTPS pass-tree/source-projection corroboration only; original CI logs and independent confirmation remain separate'}
    data = encoded(result)
    save(OUTPUT / 'AUDIT-RESULT.json', data)
    print(json.dumps({'attempted': result['attempted'],
                      'complete_pass_trees': result['complete_pass_trees'],
                      'exact_source_path_matches': result['exact_source_path_matches'],
                      'all_24_exact': result['all_24_exact'], 'result_sha256': sha(data)}), flush=True)


if __name__ == '__main__':
    main()
