#!/usr/bin/env python3
"""Acquire and validate exact failed-source archives for G01 confirmation."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import tarfile
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
INPUT = BASE / 'graph-confirm-r1/source-only/g01-bugswarm-graph-confirm-r2-repair/REPAIR-RESULT.json'
INPUT_SHA = 'a55087a01c1b157ea7fcd6dfa4327037a3e4cb13c72df5e0c31b44d80513c22c'
PROTOCOL = Path(__file__).resolve().parents[2] / 'evidence/G01-BUGSWARM-GRAPH-CONFIRM-R3-SOURCE-ARCHIVES-PROTOCOL-2026-10-04.md'
OUTPUT = BASE / 'graph-confirm-r3/source-archives'
MAX_ARCHIVE = 100 * 1024 * 1024
MAX_FILE = 1024 * 1024
MAX_CODE = 64 * 1024 * 1024
MAX_REGULAR = 4 * 1024 * 1024 * 1024
MAX_MEMBERS = 250_000


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def digest(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            hasher.update(chunk)
    return hasher.hexdigest()


def need(condition: bool, reason: str) -> None:
    if not condition:
        raise SystemExit(reason)


def save_json(name: str, value: object) -> str:
    data = (json.dumps(value, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT / name, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    return sha(data)


def inspect(path: Path, repo: str, commit: str, language: str) -> dict:
    expected_root = f"{repo.replace('/', '-')}-{commit[:7]}"
    extension = '.py' if language == 'Python' else '.java'
    roots: set[str] = set()
    paths: set[str] = set()
    members = regular_bytes = code_files = code_bytes = skipped_large = 0
    unsafe = False
    with tarfile.open(path, 'r:gz') as archive:
        for member in archive:
            members += 1
            if members > MAX_MEMBERS:
                unsafe = True
                break
            parts = PurePosixPath(member.name).parts
            if (not parts or member.name.startswith('/') or '\\' in member.name
                    or '..' in parts or parts[0] != expected_root):
                unsafe = True
                break
            roots.add(parts[0])
            if not member.isfile():
                continue
            regular_bytes += member.size
            if regular_bytes > MAX_REGULAR:
                unsafe = True
                break
            if len(parts) < 2 or not member.name.endswith(extension):
                continue
            if member.size > MAX_FILE:
                skipped_large += 1
                continue
            relative = PurePosixPath(*parts[1:]).as_posix()
            if relative in paths:
                unsafe = True
                break
            paths.add(relative)
            code_files += 1
            code_bytes += member.size
            if code_bytes > MAX_CODE:
                unsafe = True
                break
    admissible = not unsafe and roots == {expected_root} and members > 1 and code_files > 0
    return {'root': expected_root, 'root_ok': roots == {expected_root},
            'members': members, 'regular_member_bytes': regular_bytes,
            'code_files': code_files, 'code_member_bytes': code_bytes,
            'skipped_large_code_files': skipped_large, 'unsafe_or_cap': unsafe,
            'admissible': admissible}


def acquire(slot: int, row: dict) -> dict:
    repo, commit, language = row['repo'], row['failed_commit'], row['language']
    need(repo.count('/') == 1 and len(commit) == 40 and language in ('Python', 'Java'),
         f'input-case-{slot}-shape')
    filename = f"{slot:02d}-{repo.replace('/', '-')}-{commit}.tar.gz"
    partial = OUTPUT / (filename + '.partial')
    target = OUTPUT / filename
    url = f'https://codeload.github.com/{repo}/legacy.tar.gz/{commit}'
    result = {'slot': slot, 'repo': repo, 'failed_commit': commit,
              'language': language, 'url': url, 'archive': filename,
              'http_status': None, 'transport_complete': False,
              'archive_bytes': 0, 'archive_sha256': None,
              'inspection': None, 'admissible': False}
    try:
        with urlopen(Request(url, headers={'User-Agent': 'ARE-G01-confirm-source/3'}),
                     timeout=90) as response:
            result['http_status'] = response.status
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
                                            (result['content_length'] is None
                                             or result['content_length'] == total))
    except (HTTPError, URLError, TimeoutError, OSError) as error:
        result['transport_error'] = type(error).__name__
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
        result['inspection'] = inspect(target, repo, commit, language)
        result['admissible'] = result['inspection']['admissible']
    except (tarfile.TarError, OSError, EOFError) as error:
        result['inspection_error'] = type(error).__name__
    return result


def main() -> None:
    need(not OUTPUT.exists() and digest(INPUT) == INPUT_SHA, 'output-or-input-drift')
    source = json.loads(INPUT.read_bytes())
    need(source['all_24_filled'] and len(source['rows']) == 24 and
         source['gold_opened'] is False and source['model_calls'] == 0,
         'admission-input-shape')
    if not OUTPUT.parent.exists():
        OUTPUT.parent.mkdir(mode=0o700)
    need(OUTPUT.parent.is_dir() and not (OUTPUT.parent.stat().st_mode & 0o077),
         'parent-permissions')
    OUTPUT.mkdir(mode=0o700)
    freeze = {'schema_version': 'are.g01-confirm-source-archive-freeze-r3/v1',
              'input_sha256': INPUT_SHA, 'protocol_sha256': digest(PROTOCOL),
              'script_sha256': digest(Path(__file__)), 'cases': 24,
              'max_archive_bytes': MAX_ARCHIVE, 'max_file_bytes': MAX_FILE,
              'max_code_bytes': MAX_CODE, 'max_regular_bytes': MAX_REGULAR,
              'max_members': MAX_MEMBERS, 'automatic_retries': 0,
              'gold_opened': False, 'model_calls': 0}
    save_json('FREEZE.json', freeze)
    results = []
    for index, item in enumerate(source['rows'], 1):
        need(item['slot'] == index and item.get('final'), 'slot-order-drift')
        result = acquire(index, item['final'])
        result['receipt_sha256'] = save_json(f'CASE-{index:02d}.json', result)
        results.append(result)
        print(json.dumps({'slot': index, 'archive_bytes': result['archive_bytes'],
                          'admissible': result['admissible'],
                          'status': result['http_status']}), flush=True)
    final = {'schema_version': 'are.g01-confirm-source-archive-result-r3/v1',
             'input_sha256': INPUT_SHA, 'attempted': len(results),
             'admitted': sum(row['admissible'] for row in results),
             'all_24_admitted': len(results) == 24 and all(row['admissible'] for row in results),
             'gold_opened': False, 'model_calls': 0, 'results': results}
    result_sha = save_json('RESULT.json', final)
    print(json.dumps({'attempted': final['attempted'], 'admitted': final['admitted'],
                      'all_24_admitted': final['all_24_admitted'],
                      'result_sha256': result_sha}), flush=True)
    if not final['all_24_admitted']:
        raise SystemExit(2)


if __name__ == '__main__':
    main()
