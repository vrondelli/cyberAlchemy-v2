#!/usr/bin/env python3
"""Acquire bounded exact failed-source archives for the sealed G01 r34 cohort."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import tarfile
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
INPUT = BASE / 'selective-r28/final-r34/RESULT.json'
INPUT_SHA = 'fee3ffa2e39fee3aadfbe09612439542942ffcfcadb13e45dc7f77ffda9e012c'
PROTOCOL = HERE.parents[1] / 'evidence/G01-BUGSWARM-SELECTIVE-R35-SOURCE-ARCHIVE-PROTOCOL-2026-10-04.md'
OUTPUT = BASE / 'selective-r28/source-archives-r35'
MAX_ARCHIVE = 256 * 1024 * 1024
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


def need(ok: bool, reason: str) -> None:
    if not ok:
        raise SystemExit(reason)


def save_json(name: str, value: object) -> str:
    data = (json.dumps(value, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT / name, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    return sha(data)


def inspect_archive(path: Path, repo: str, commit: str, language: str) -> dict:
    basename = repo.split('/', 1)[1]
    suffix = f'-{basename}-{commit[:7]}'
    extension = '.py' if language == 'Python' else '.java'
    roots: set[str] = set()
    projected: set[str] = set()
    members = regular_bytes = code_files = code_bytes = skipped_large = 0
    unsafe_or_cap = False
    with tarfile.open(path, 'r:gz') as archive:
        for member in archive:
            members += 1
            if members > MAX_MEMBERS:
                unsafe_or_cap = True
                break
            parts = PurePosixPath(member.name).parts
            if (not parts or member.name.startswith('/') or '\\' in member.name
                    or '..' in parts):
                unsafe_or_cap = True
                break
            roots.add(parts[0])
            if len(roots) > 1:
                unsafe_or_cap = True
                break
            if not member.isfile():
                continue
            regular_bytes += member.size
            if regular_bytes > MAX_REGULAR:
                unsafe_or_cap = True
                break
            if len(parts) < 2 or not member.name.endswith(extension):
                continue
            if member.size > MAX_FILE:
                skipped_large += 1
                continue
            relative = PurePosixPath(*parts[1:]).as_posix()
            if relative in projected:
                unsafe_or_cap = True
                break
            projected.add(relative)
            code_files += 1
            code_bytes += member.size
            if code_bytes > MAX_CODE:
                unsafe_or_cap = True
                break
    root = next(iter(roots)) if len(roots) == 1 else None
    owner_prefix = root[:-len(suffix)] if root and root.endswith(suffix) else None
    root_ok = bool(owner_prefix and re.fullmatch(r'[A-Za-z0-9._-]+', owner_prefix))
    admissible = bool(not unsafe_or_cap and root_ok and members > 1 and code_files > 0)
    return {
        'root': root,
        'owner_prefix': owner_prefix,
        'declared_owner': repo.split('/', 1)[0],
        'owner_renamed': bool(owner_prefix and owner_prefix != repo.split('/', 1)[0]),
        'root_ok': root_ok,
        'members': members,
        'regular_member_bytes': regular_bytes,
        'code_files': code_files,
        'code_member_bytes': code_bytes,
        'skipped_large_code_files': skipped_large,
        'unsafe_or_cap': unsafe_or_cap,
        'admissible': admissible,
    }


def acquire(slot: int, row: dict) -> dict:
    repo, commit, language = row['repo'], row['failed_commit'], row['language']
    need(repo.count('/') == 1 and re.fullmatch(r'[0-9a-f]{40}', commit) is not None
         and language in ('Python', 'Java'), f'case-shape:{slot}')
    filename = f"{slot:02d}-{repo.replace('/', '-')}-{commit}.tar.gz"
    partial = OUTPUT / (filename + '.partial')
    target = OUTPUT / filename
    url = f'https://codeload.github.com/{repo}/legacy.tar.gz/{commit}'
    result = {
        'schema_version': 'are.g01-selective-r35-source-case/v1',
        'slot': slot,
        'repo': repo,
        'image_tag': row['image_tag'],
        'failed_commit': commit,
        'language': language,
        'url': url,
        'archive': filename,
        'archive_path': str(target),
        'http_status': None,
        'transport_complete': False,
        'archive_bytes': 0,
        'archive_sha256': None,
        'inspection': None,
        'admissible': False,
    }
    try:
        request = Request(url, headers={'User-Agent': 'ARE-G01-selective-source/35'})
        with urlopen(request, timeout=120) as response:
            result['http_status'] = response.status
            result['final_url'] = response.geturl()
            if (response.status != 200
                    or not result['final_url'].startswith('https://codeload.github.com/')):
                return result
            declared = response.headers.get('Content-Length')
            result['content_length'] = int(declared) if declared and declared.isdigit() else None
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
            result['transport_complete'] = (
                0 < total <= MAX_ARCHIVE
                and (result['content_length'] is None or result['content_length'] == total)
            )
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
        result['inspection'] = inspect_archive(target, repo, commit, language)
        result['admissible'] = result['inspection']['admissible']
    except (tarfile.TarError, OSError, EOFError) as error:
        result['inspection_error'] = type(error).__name__
    return result


def main() -> None:
    need(not OUTPUT.exists(), 'output-exists')
    need(digest(INPUT) == INPUT_SHA, 'input-pin-drift')
    source = json.loads(INPUT.read_bytes())
    need(source['status'] == 'source-log-admitted' and source['filled_slots'] == 24
         and len(source['rows']) == 24 and source['language_counts'] == {'Java': 7, 'Python': 17}
         and source['gold_opened'] is False and source['passing_source_opened'] is False
         and source['patches_opened'] is False and source['model_calls'] == 0,
         'input-shape-drift')
    repos = [row['repo'].lower() for row in source['rows']]
    need(len(set(repos)) == 24, 'duplicate-repository')
    OUTPUT.mkdir(parents=True, mode=0o700)
    freeze = {
        'schema_version': 'are.g01-selective-r35-source-freeze/v1',
        'input_sha256': INPUT_SHA,
        'protocol_sha256': digest(PROTOCOL),
        'runner_sha256': digest(Path(__file__)),
        'cases': 24,
        'max_archive_bytes': MAX_ARCHIVE,
        'max_file_bytes': MAX_FILE,
        'max_code_bytes': MAX_CODE,
        'max_regular_bytes': MAX_REGULAR,
        'max_members': MAX_MEMBERS,
        'root_rule': 'single safe root ending -{declared_basename}-{commit7}; safe owner prefix',
        'automatic_retries': 0,
        'gold_opened': False,
        'passing_source_opened': False,
        'patches_opened': False,
        'model_calls': 0,
    }
    save_json('FREEZE.json', freeze)
    rows = []
    for slot, row in enumerate(source['rows'], 1):
        need(row['slot'] == slot, f'slot-order:{slot}')
        receipt = acquire(slot, row)
        receipt['receipt_sha256'] = save_json(f'CASE-{slot:02d}.json', receipt)
        rows.append(receipt)
        print(json.dumps({'slot': slot, 'http_status': receipt['http_status'],
                          'archive_bytes': receipt['archive_bytes'],
                          'admissible': receipt['admissible']}), flush=True)
    result = {
        'schema_version': 'are.g01-selective-r35-source-result/v1',
        'input_sha256': INPUT_SHA,
        'attempted': len(rows),
        'admitted': sum(row['admissible'] for row in rows),
        'all_24_admitted': len(rows) == 24 and all(row['admissible'] for row in rows),
        'language_counts': source['language_counts'],
        'owner_renames': [row['slot'] for row in rows if row['inspection']
                          and row['inspection']['owner_renamed']],
        'gold_opened': False,
        'passing_source_opened': False,
        'patches_opened': False,
        'model_calls': 0,
        'results': rows,
    }
    result_sha = save_json('RESULT.json', result)
    print(json.dumps({'attempted': result['attempted'], 'admitted': result['admitted'],
                      'all_24_admitted': result['all_24_admitted'],
                      'owner_renames': result['owner_renames'],
                      'result_sha256': result_sha}), flush=True)
    if not result['all_24_admitted']:
        raise SystemExit(2)


if __name__ == '__main__':
    main()
