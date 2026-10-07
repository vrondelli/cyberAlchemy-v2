#!/usr/bin/env python3
"""Materialize code-only failed-source roots for G01 confirmation."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import subprocess
import tarfile


BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
R2 = BASE / 'graph-confirm-r1/source-only/g01-bugswarm-graph-confirm-r2-repair/REPAIR-RESULT.json'
R2_SHA = 'a55087a01c1b157ea7fcd6dfa4327037a3e4cb13c72df5e0c31b44d80513c22c'
R4 = BASE / 'graph-confirm-r4/source-archives/RESULT.json'
R4_SHA = 'b23312e777f22ce98191463df25af5d9f1fcef65c863384cc00e521209d98326'
PROTOCOL = Path(__file__).resolve().parents[2] / 'evidence/G01-BUGSWARM-GRAPH-CONFIRM-R5-CODE-PROJECTION-PROTOCOL-2026-10-04.md'
OUTPUT = BASE / 'graph-confirm-r4/code-only'
ALLOWED = {BASE / 'graph-confirm-r3/source-archives',
           BASE / 'graph-confirm-r4/source-archives'}
MAX_FILE = 1024 * 1024
MAX_TOTAL = 64 * 1024 * 1024
TAG = re.compile(r'[A-Za-z0-9._-]+\Z')


def digest(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            hasher.update(chunk)
    return hasher.hexdigest()


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
    need(not OUTPUT.exists() and digest(R2) == R2_SHA and digest(R4) == R4_SHA,
         'output-or-input-pin-drift')
    r2, r4 = json.loads(R2.read_bytes()), json.loads(R4.read_bytes())
    need(r2['all_24_filled'] and r4['all_24_admitted'] and
         len(r2['rows']) == len(r4['results']) == 24 and
         r4['gold_opened'] is False and r4['model_calls'] == 0,
         'input-shape-drift')
    OUTPUT.mkdir(mode=0o700)
    freeze = {'schema_version': 'are.g01-confirm-code-projection-freeze-r5/v1',
              'r2_sha256': R2_SHA, 'r4_sha256': R4_SHA,
              'protocol_sha256': digest(PROTOCOL),
              'script_sha256': digest(Path(__file__)),
              'max_file_bytes': MAX_FILE, 'max_code_bytes': MAX_TOTAL,
              'slots': 24, 'gold_opened': False, 'model_calls': 0}
    save('FREEZE.json', freeze)
    records = []
    for slot, (case, source) in enumerate(zip(r2['rows'], r4['results']), 1):
        final = case['final']
        need(case['slot'] == source['slot'] == slot and source['admissible']
             and final['failed_commit'] == source['failed_commit']
             and final['repo'] == source['repo'] and final['language'] == source['language'],
             f'slot-{slot}-identity-drift')
        archive = Path(source['archive_path'])
        need(archive.is_file() and archive.resolve().parent in ALLOWED
             and digest(archive) == source['archive_sha256']
             and archive.stat().st_size == source['archive_bytes'],
             f'archive-{slot}-drift')
        tag = final['image_tag']
        need(TAG.fullmatch(tag) is not None, f'tag-{slot}-invalid')
        root = OUTPUT / f'{slot:02d}-{tag}'
        root.mkdir(mode=0o700)
        expected_root = source['inspection']['root']
        extension = '.py' if final['language'] == 'Python' else '.java'
        seen = set()
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
                need(rel not in seen, f'duplicate-code-path-{slot}')
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
        need(len(seen) == source['inspection']['code_files'] and
             bytes_total == source['inspection']['code_member_bytes'],
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
        record = {'slot': slot, 'repo': final['repo'], 'language': final['language'],
                  'image_tag': tag, 'failed_commit': final['failed_commit'],
                  'root': str(root), 'archive_sha256': source['archive_sha256'],
                  'projected_files': len(paths), 'projected_bytes': bytes_total,
                  'projected_tree_sha256': tree.hexdigest()}
        save(f'CASE-{slot:02d}.json', record)
        records.append(record)
        print(json.dumps({'slot': slot, 'projected_files': len(paths),
                          'projected_bytes': bytes_total}), flush=True)
    result = {'schema_version': 'are.g01-confirm-code-projection-result-r5/v1',
              'r2_sha256': R2_SHA, 'r4_sha256': R4_SHA, 'cases': len(records),
              'total_files': sum(row['projected_files'] for row in records),
              'total_bytes': sum(row['projected_bytes'] for row in records),
              'gold_opened': False, 'model_calls': 0, 'records': records}
    result_sha = save('RESULT.json', result)
    print(json.dumps({'cases': result['cases'], 'total_files': result['total_files'],
                      'total_bytes': result['total_bytes'], 'result_sha256': result_sha}), flush=True)


if __name__ == '__main__':
    main()
