#!/usr/bin/env python3
"""Reinspect three byte-pinned archives with a bounded renamed-owner root rule."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import tarfile


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
R15 = BASE / 'fresh-r11/source-archives-r15/RESULT.json'
OUTPUT = BASE / 'fresh-r11/source-archives-r16'
PROTOCOL = HERE.parents[1] / 'evidence/G01-BUGSWARM-FRESH-R16-RENAMED-ROOT-PROTOCOL-2026-10-04.md'
PINS = {'r15': 'f89074fa0239d68423ab0d2f2824ba9e21f534222aa8f90409b8bc02f58e0eae',
        'protocol': '6a8c0b99043c565890029b909c85f2237f70dcf7884434f904c3983d1d643d64',
        'slot_1': '58aa1cea82dd6fe89f257efe0ac7d26546869069efd9e07840b1f6165f8ae240',
        'slot_6': '5ba1efb9fdd35a45fbffbb0c7566a078092fa55e14b8d571459a8331035157eb',
        'slot_20': '667a1f8f182a49eccf667fe447e55299c118dbe1657e2cdcd0b3d05c3adfbc5f'}
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


def inspect(path: Path, repo: str, commit: str, language: str) -> dict:
    basename = repo.split('/', 1)[1]
    suffix = f'-{basename}-{commit[:7]}'
    extension = '.py' if language == 'Python' else '.java'
    roots: set[str] = set()
    projected: set[str] = set()
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
                    or '..' in parts):
                unsafe = True
                break
            roots.add(parts[0])
            if len(roots) > 1:
                unsafe = True
                break
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
            if relative in projected:
                unsafe = True
                break
            projected.add(relative)
            code_files += 1
            code_bytes += member.size
            if code_bytes > MAX_CODE:
                unsafe = True
                break
    root = next(iter(roots)) if len(roots) == 1 else None
    owner = root[:-len(suffix)] if root and root.endswith(suffix) else None
    root_ok = bool(owner and re.fullmatch(r'[A-Za-z0-9._-]+', owner))
    admitted = bool(not unsafe and root_ok and members > 1 and code_files > 0)
    return {'root': root, 'renamed_owner_prefix': owner, 'root_ok': root_ok,
            'members': members, 'regular_member_bytes': regular_bytes,
            'code_files': code_files, 'code_member_bytes': code_bytes,
            'skipped_large_code_files': skipped_large, 'unsafe_or_cap': unsafe,
            'admissible': admitted}


def main() -> None:
    need(not OUTPUT.exists() and digest(R15) == PINS['r15'] and
         digest(PROTOCOL) == PINS['protocol'], 'output-or-input-pin-drift')
    r15 = json.loads(R15.read_bytes())
    need(r15['attempted'] == 24 and r15['admitted'] == 21 and
         len(r15['results']) == 24 and not r15['gold_opened'] and
         r15['model_calls'] == 0, 'r15-shape-drift')
    failed = [row['slot'] for row in r15['results'] if not row['admissible']]
    need(failed == [1, 6, 20], 'failed-slot-drift')
    OUTPUT.mkdir(parents=True, mode=0o700)
    save_json('FREEZE.json', {'schema_version': 'are.g01-fresh-r16-root-freeze/v1',
              'input_sha256': PINS, 'runner_sha256': sha(Path(__file__).read_bytes()),
              'reinspected_slots': failed, 'gold_opened': False, 'model_calls': 0})
    rows = []
    for prior in r15['results']:
        slot = prior['slot']
        path = Path(prior['archive_path'])
        need(path.is_file() and path.parent == R15.parent and
             path.stat().st_size == prior['archive_bytes'] and
             digest(path) == prior['archive_sha256'] and
             prior['transport_complete'] and prior['http_status'] == 200 and
             prior['url'] == f"https://codeload.github.com/{prior['repo']}/legacy.tar.gz/{prior['failed_commit']}",
             f'archive-identity:{slot}')
        record = dict(prior)
        if slot in failed:
            need(prior['archive_sha256'] == PINS[f'slot_{slot}'],
                 f'failed-archive-pin:{slot}')
            record['inspection'] = inspect(path, prior['repo'],
                                           prior['failed_commit'], prior['language'])
            record['admissible'] = record['inspection']['admissible']
            record['r16_renamed_root_reinspection'] = True
        else:
            need(prior['admissible'], f'prior-admission:{slot}')
            record['r16_renamed_root_reinspection'] = False
        rows.append(record)
        save_json(f'CASE-{slot:02d}.json', record)
        print(json.dumps({'slot': slot, 'root': record['inspection']['root'],
                          'admissible': record['admissible']}), flush=True)
    result = {'schema_version': 'are.g01-fresh-r16-source-result/v1',
              'input_sha256': PINS, 'attempted': 24,
              'admitted': sum(row['admissible'] for row in rows),
              'all_24_admitted': all(row['admissible'] for row in rows),
              'renamed_root_reinspected': failed,
              'gold_opened': False, 'model_calls': 0, 'results': rows}
    result_sha = save_json('RESULT.json', result)
    print(json.dumps({'admitted': result['admitted'],
                      'all_24_admitted': result['all_24_admitted'],
                      'result_sha256': result_sha}))
    if not result['all_24_admitted']:
        raise SystemExit(2)


if __name__ == '__main__':
    main()
