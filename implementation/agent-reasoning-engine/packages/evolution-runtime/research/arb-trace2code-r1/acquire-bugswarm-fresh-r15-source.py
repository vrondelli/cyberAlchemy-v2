#!/usr/bin/env python3
"""Acquire source-only exact failed-commit archives for the fresh r14 cohort."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import os
from pathlib import Path
import tarfile
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
RUN = BASE / 'fresh-r11/repair-r14/run/RESULT.json'
AUDIT = BASE / 'fresh-r11/repair-r14/AUDIT.json'
PROTOCOL = HERE.parents[1] / 'evidence/G01-BUGSWARM-FRESH-R15-SOURCE-ARCHIVE-PROTOCOL-2026-10-04.md'
INSPECTOR = HERE / 'acquire-bugswarm-graph-confirm-r3-source-archives.py'
OUTPUT = BASE / 'fresh-r11/source-archives-r15'
PINS = {'run': '2f266bba198a1a72f2fdf55418c0ad284cb02a06f8e262f0dcd6d5a21e4ebcc1',
        'audit': '7ffa068558092b0be67c997f86266806a34199ea0710c5bae562609e32008696',
        'protocol': 'de8d319d98264ff86c5502229cd0dc43cda03c24cf719b6a50644d7dc8bba7c6',
        'inspector': '586f7898b3cd806fb93b414851ed2cd6c6de0ee3c44a584f76c0d19bf018fbed'}
MAX_ARCHIVE = 256 * 1024 * 1024


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def digest(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            hasher.update(chunk)
    return hasher.hexdigest()


def need(ok: bool, reason: str) -> None:
    if not ok:
        raise SystemExit(reason)


def save_json(name: str, value: object) -> str:
    data = (json.dumps(value, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT / name, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    return sha(data)


def acquire(slot: int, final: dict, inspector: object) -> dict:
    repo, commit, language = final['repo'], final['failed_commit'], final['language']
    need(repo.count('/') == 1 and len(commit) == 40 and language in ('Python', 'Java'),
         f'case-shape:{slot}')
    filename = f"{slot:02d}-{repo.replace('/', '-')}-{commit}.tar.gz"
    partial = OUTPUT / (filename + '.partial')
    target = OUTPUT / filename
    url = f'https://codeload.github.com/{repo}/legacy.tar.gz/{commit}'
    result = {'schema_version': 'are.g01-fresh-r15-source-case/v1',
              'slot': slot, 'repo': repo, 'image_tag': final['image_tag'],
              'failed_commit': commit, 'language': language, 'url': url,
              'archive': filename, 'archive_path': str(target),
              'http_status': None, 'transport_complete': False,
              'archive_bytes': 0, 'archive_sha256': None,
              'inspection': None, 'admissible': False}
    try:
        with urlopen(Request(url, headers={'User-Agent': 'ARE-G01-fresh-source/15'}),
                     timeout=90) as response:
            result['http_status'] = response.status
            result['final_url'] = response.geturl()
            need(result['final_url'].startswith('https://codeload.github.com/'),
                 f'non-codeload-redirect:{slot}')
            expected = response.headers.get('Content-Length')
            result['content_length'] = int(expected) if expected and expected.isdigit() else None
            if response.status != 200:
                return result
            total = 0
            hasher = hashlib.sha256()
            fd = os.open(partial, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            with os.fdopen(fd, 'wb') as stream:
                while True:
                    chunk = response.read(1024 * 1024)
                    if not chunk:
                        break
                    total += len(chunk)
                    hasher.update(chunk)
                    stream.write(chunk)
                    if total > MAX_ARCHIVE:
                        break
            result['archive_bytes'] = total
            result['archive_sha256'] = hasher.hexdigest()
            result['transport_complete'] = (0 < total <= MAX_ARCHIVE and
                                            (result['content_length'] is None or
                                             result['content_length'] == total))
    except (HTTPError, URLError, TimeoutError, OSError) as error:
        result['transport_error'] = type(error).__name__
        if isinstance(error, HTTPError):
            result['http_status'] = error.code
        if partial.exists():
            result['archive_bytes'] = partial.stat().st_size
            result['archive_sha256'] = digest(partial)
        return result
    with partial.open('rb') as stream:
        gzip_header = stream.read(2)
    if not result['transport_complete'] or gzip_header != b'\x1f\x8b':
        return result
    os.rename(partial, target)
    try:
        result['inspection'] = inspector.inspect(target, repo, commit, language)
        result['admissible'] = result['inspection']['admissible']
    except (tarfile.TarError, OSError, EOFError) as error:
        result['inspection_error'] = type(error).__name__
    return result


def main() -> None:
    need(not OUTPUT.exists(), 'output-exists')
    for name, path in (('run', RUN), ('audit', AUDIT),
                       ('protocol', PROTOCOL), ('inspector', INSPECTOR)):
        need(digest(path) == PINS[name], f'input-pin-drift:{name}')
    run, audit = json.loads(RUN.read_bytes()), json.loads(AUDIT.read_bytes())
    need(run['status'] == 'source-log-available' and run['filled_slots'] == 24 and
         len(run['slots']) == audit['slots'] == 24 and
         audit['all_evidence_byte_hashes_verified'] and
         run['gold_opened'] is False and run['model_calls'] == 0,
         'input-shape-drift')
    spec = importlib.util.spec_from_file_location('g01_r15_archive_inspector', INSPECTOR)
    need(spec is not None and spec.loader is not None, 'inspector-unavailable')
    inspector = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(inspector)
    OUTPUT.mkdir(parents=True, mode=0o700)
    save_json('FREEZE.json', {'schema_version': 'are.g01-fresh-r15-source-freeze/v1',
              'input_sha256': PINS, 'runner_sha256': sha(Path(__file__).read_bytes()),
              'cases': 24, 'max_archive_bytes': MAX_ARCHIVE,
              'max_file_bytes': inspector.MAX_FILE,
              'max_code_bytes': inspector.MAX_CODE,
              'max_regular_bytes': inspector.MAX_REGULAR,
              'max_members': inspector.MAX_MEMBERS,
              'automatic_retries': 0, 'gold_opened': False, 'model_calls': 0})
    rows = []
    for slot, item in enumerate(run['slots'], 1):
        need(item['slot'] == slot and item['final'] is not None, f'slot-order:{slot}')
        receipt = acquire(slot, item['final'], inspector)
        save_json(f'CASE-{slot:02d}.json', receipt)
        rows.append(receipt)
        print(json.dumps({'slot': slot, 'http_status': receipt['http_status'],
                          'archive_bytes': receipt['archive_bytes'],
                          'admissible': receipt['admissible']}), flush=True)
    result = {'schema_version': 'are.g01-fresh-r15-source-result/v1',
              'input_sha256': PINS, 'attempted': len(rows),
              'admitted': sum(row['admissible'] for row in rows),
              'all_24_admitted': len(rows) == 24 and all(row['admissible'] for row in rows),
              'gold_opened': False, 'model_calls': 0, 'results': rows}
    result_sha = save_json('RESULT.json', result)
    print(json.dumps({'attempted': result['attempted'], 'admitted': result['admitted'],
                      'all_24_admitted': result['all_24_admitted'],
                      'result_sha256': result_sha}))
    if not result['all_24_admitted']:
        raise SystemExit(2)


if __name__ == '__main__':
    main()
