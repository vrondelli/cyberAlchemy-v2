#!/usr/bin/env python3
"""Project only failed-commit source code for the fresh G01 cohort."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import subprocess
import tarfile


BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
R14 = BASE / 'fresh-r11/repair-r14/run/RESULT.json'
R14_SHA = '2f266bba198a1a72f2fdf55418c0ad284cb02a06f8e262f0dcd6d5a21e4ebcc1'
R16 = BASE / 'fresh-r11/source-archives-r16/RESULT.json'
R16_SHA = 'aca7cb5b46e166612c851dc536a962fa648a2a1ad2f3f59419cf2650a09db654'
PROTOCOL = Path(__file__).resolve().parents[2] / 'evidence/G01-BUGSWARM-FRESH-R17-CODE-PROJECTION-PROTOCOL-2026-10-04.md'
PROTOCOL_SHA = 'd42fef8a8ee2a55d9b40b10f811f4c52b997f367eee154a129b31d390473a403'
ARCHIVES = BASE / 'fresh-r11/source-archives-r15'
OUTPUT = BASE / 'fresh-r11/code-only-r17'
MAX_FILE = 1024 * 1024
MAX_TOTAL = 64 * 1024 * 1024
TAG = re.compile(r'[A-Za-z0-9._-]+\Z')


def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def save(name: str, value: object) -> str:
    data = (json.dumps(value, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT / name, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    return sha(data)


def main() -> None:
    need(not OUTPUT.exists(), 'output-already-exists')
    need(digest(R14) == R14_SHA and digest(R16) == R16_SHA
         and digest(PROTOCOL) == PROTOCOL_SHA, 'input-pin-drift')
    r14, r16 = json.loads(R14.read_bytes()), json.loads(R16.read_bytes())
    need(r14['status'] == 'source-log-available' and r14['filled_slots'] == 24
         and r16['all_24_admitted'] and len(r14['slots']) == len(r16['results']) == 24
         and r14['gold_opened'] is False and r16['gold_opened'] is False
         and r14['model_calls'] == r16['model_calls'] == 0, 'input-shape-drift')

    OUTPUT.mkdir(mode=0o700)
    save('FREEZE.json', {
        'schema_version': 'are.g01-fresh-code-projection-freeze-r17/v1',
        'r14_sha256': R14_SHA, 'r16_sha256': R16_SHA,
        'protocol_sha256': PROTOCOL_SHA, 'script_sha256': digest(Path(__file__)),
        'max_file_bytes': MAX_FILE, 'max_code_bytes': MAX_TOTAL,
        'slots': 24, 'gold_opened': False, 'model_calls': 0,
    })
    records = []
    for slot, (case, source) in enumerate(zip(r14['slots'], r16['results']), 1):
        final = case['final']
        need(case['slot'] == source['slot'] == slot and source['admissible']
             and all(final[key] == source[key] for key in
                     ('repo', 'language', 'failed_commit', 'image_tag')),
             f'slot-{slot}-identity-drift')
        archive = Path(source['archive_path'])
        need(archive.is_file() and archive.resolve().parent == ARCHIVES
             and digest(archive) == source['archive_sha256']
             and archive.stat().st_size == source['archive_bytes'],
             f'archive-{slot}-drift')
        tag = final['image_tag']
        need(TAG.fullmatch(tag) is not None, f'tag-{slot}-invalid')
        root = OUTPUT / f'{slot:02d}-{tag}'
        root.mkdir(mode=0o700)
        expected_root = source['inspection']['root']
        extension = '.py' if final['language'] == 'Python' else '.java'
        need(final['language'] in ('Python', 'Java'), f'language-{slot}-invalid')
        seen: set[str] = set()
        bytes_total = 0
        with tarfile.open(archive, 'r:gz') as stream:
            for member in stream:
                parts = PurePosixPath(member.name).parts
                need(parts and parts[0] == expected_root and '..' not in parts
                     and '\\' not in member.name and not member.name.startswith('/'),
                     f'unsafe-tar-{slot}')
                if (not member.isfile() or len(parts) < 2
                        or not member.name.endswith(extension) or member.size > MAX_FILE):
                    continue
                rel = PurePosixPath(*parts[1:]).as_posix()
                need(rel not in seen and '.git' not in parts[1:],
                     f'unsafe-code-path-{slot}')
                seen.add(rel)
                content_stream = stream.extractfile(member)
                need(content_stream is not None, f'missing-member-{slot}')
                content = content_stream.read(MAX_FILE + 1)
                need(len(content) == member.size, f'member-size-{slot}')
                destination = root.joinpath(*PurePosixPath(rel).parts)
                destination.parent.mkdir(parents=True, exist_ok=True)
                fd = os.open(destination, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
                with os.fdopen(fd, 'wb') as output:
                    output.write(content)
                bytes_total += len(content)
                need(bytes_total <= MAX_TOTAL, f'code-size-cap-{slot}')
        need(len(seen) == source['inspection']['code_files']
             and bytes_total == source['inspection']['code_member_bytes'],
             f'projection-count-{slot}')
        subprocess.run(['git', 'init', '-q', str(root)], check=True, timeout=30)
        subprocess.run(['git', 'add', '-f', '--all'], cwd=root, check=True, timeout=240)
        tracked = subprocess.run(['git', 'ls-files', '-z'], cwd=root, check=True,
                                 capture_output=True, timeout=30).stdout.split(b'\0')
        paths = sorted(item.decode('utf-8') for item in tracked if item)
        need(len(paths) == len(seen) and set(paths) == seen, f'git-index-{slot}-drift')
        tree = hashlib.sha256()
        for path in paths:
            tree.update(path.encode() + b'\0' + hashlib.sha256((root / path).read_bytes()).digest())
        record = {
            'slot': slot, 'repo': final['repo'], 'language': final['language'],
            'image_tag': tag, 'failed_commit': final['failed_commit'],
            'root': str(root), 'archive_sha256': source['archive_sha256'],
            'projected_files': len(paths), 'projected_bytes': bytes_total,
            'projected_tree_sha256': tree.hexdigest(),
        }
        save(f'CASE-{slot:02d}.json', record)
        records.append(record)
        print(json.dumps({'slot': slot, 'projected_files': len(paths),
                          'projected_bytes': bytes_total}), flush=True)
    result = {
        'schema_version': 'are.g01-fresh-code-projection-result-r17/v1',
        'r14_sha256': R14_SHA, 'r16_sha256': R16_SHA, 'cases': len(records),
        'total_files': sum(row['projected_files'] for row in records),
        'total_bytes': sum(row['projected_bytes'] for row in records),
        'gold_opened': False, 'model_calls': 0, 'records': records,
    }
    result_sha = save('RESULT.json', result)
    print(json.dumps({'cases': result['cases'], 'total_files': result['total_files'],
                      'total_bytes': result['total_bytes'], 'result_sha256': result_sha}), flush=True)


if __name__ == '__main__':
    main()
