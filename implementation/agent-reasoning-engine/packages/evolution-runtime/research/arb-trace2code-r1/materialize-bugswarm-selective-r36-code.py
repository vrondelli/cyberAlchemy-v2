#!/usr/bin/env python3
"""Materialize hash-bound code-only roots for the sealed G01 r34 population."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import subprocess
import tarfile


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
R35_DIR = BASE / 'selective-r28/source-archives-r35'
R35_RESULT = R35_DIR / 'RESULT.json'
R35_SHA = '5ef1dfeeb71d4df32d166ffab322aabdd9fda32e592ab4e9a7c8b93a27b3e1ff'
PROTOCOL = HERE.parents[1] / 'evidence/G01-BUGSWARM-SELECTIVE-R36-CODE-PROJECTION-PROTOCOL-2026-10-04.md'
OUTPUT = BASE / 'selective-r28/code-projection-r36'
ROOTS = OUTPUT / 'roots'
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


def need(ok: bool, reason: str) -> None:
    if not ok:
        raise SystemExit(reason)


def save_bytes(path: Path, data: bytes) -> str:
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    return sha(data)


def save_json(name: str, value: object) -> str:
    data = (json.dumps(value, sort_keys=True, indent=2) + '\n').encode()
    return save_bytes(OUTPUT / name, data)


def main() -> None:
    need(not OUTPUT.exists() and digest(R35_RESULT) == R35_SHA,
         'output-or-input-pin-drift')
    source = json.loads(R35_RESULT.read_bytes())
    need(source['attempted'] == source['admitted'] == 24
         and source['all_24_admitted'] and len(source['results']) == 24
         and source['gold_opened'] is False
         and source['passing_source_opened'] is False
         and source['patches_opened'] is False and source['model_calls'] == 0,
         'input-shape-drift')

    OUTPUT.mkdir(mode=0o700)
    ROOTS.mkdir(mode=0o700)
    save_json('FREEZE.json', {
        'schema_version': 'are.g01-selective-r36-code-freeze/v1',
        'r35_result_sha256': R35_SHA,
        'protocol_sha256': digest(PROTOCOL),
        'runner_sha256': digest(Path(__file__)),
        'max_file_bytes': MAX_FILE,
        'max_code_bytes_per_slot': MAX_TOTAL,
        'slots': 24,
        'network_calls': 0,
        'gold_opened': False,
        'passing_source_opened': False,
        'patches_opened': False,
        'model_calls': 0,
    })

    records = []
    for slot, archive_record in enumerate(source['results'], 1):
        need(archive_record['slot'] == slot and archive_record['admissible'],
             f'slot-identity:{slot}')
        archive = Path(archive_record['archive_path'])
        need(archive.is_file() and archive.resolve().parent == R35_DIR
             and archive.stat().st_size == archive_record['archive_bytes']
             and digest(archive) == archive_record['archive_sha256'],
             f'archive-drift:{slot}')
        language = archive_record['language']
        extension = '.py' if language == 'Python' else '.java'
        need(language in ('Python', 'Java'), f'language:{slot}')
        tag = archive_record['image_tag']
        need(TAG.fullmatch(tag) is not None, f'image-tag:{slot}')
        root = ROOTS / f'{slot:02d}-{tag}'
        root.mkdir(mode=0o700)
        expected_root = archive_record['inspection']['root']
        seen: set[str] = set()
        files: list[dict] = []
        bytes_total = 0
        with tarfile.open(archive, 'r:gz') as stream:
            for member in stream:
                parts = PurePosixPath(member.name).parts
                need(parts and parts[0] == expected_root and '..' not in parts
                     and '\\' not in member.name and not member.name.startswith('/'),
                     f'unsafe-tar:{slot}')
                if (not member.isfile() or len(parts) < 2
                        or not member.name.endswith(extension) or member.size > MAX_FILE):
                    continue
                relative_parts = parts[1:]
                need('.git' not in relative_parts, f'git-metadata-path:{slot}')
                relative = PurePosixPath(*relative_parts).as_posix()
                need(relative not in seen, f'duplicate-code-path:{slot}')
                seen.add(relative)
                member_stream = stream.extractfile(member)
                need(member_stream is not None, f'missing-member:{slot}')
                content = member_stream.read(MAX_FILE + 1)
                need(len(content) == member.size, f'member-size:{slot}')
                destination = root.joinpath(*relative_parts)
                destination.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
                save_bytes(destination, content)
                file_sha = sha(content)
                files.append({'path': relative, 'bytes': len(content), 'sha256': file_sha})
                bytes_total += len(content)
                need(bytes_total <= MAX_TOTAL, f'code-size-cap:{slot}')

        files.sort(key=lambda item: item['path'])
        need(len(files) == archive_record['inspection']['code_files']
             and bytes_total == archive_record['inspection']['code_member_bytes'],
             f'projection-count:{slot}')
        manifest_data = b''.join(
            (json.dumps(item, sort_keys=True, separators=(',', ':')) + '\n').encode()
            for item in files
        )
        manifest_name = f'MANIFEST-{slot:02d}.jsonl'
        manifest_sha = save_bytes(OUTPUT / manifest_name, manifest_data)

        subprocess.run(['git', 'init', '-q', str(root)], check=True, timeout=30)
        subprocess.run(['git', 'add', '-f', '--all'], cwd=root, check=True,
                       timeout=240, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        tracked_raw = subprocess.run(
            ['git', 'ls-files', '-z'], cwd=root, check=True,
            capture_output=True, timeout=30,
        ).stdout.split(b'\0')
        tracked = sorted(item.decode('utf-8') for item in tracked_raw if item)
        paths = [item['path'] for item in files]
        need(tracked == paths, f'git-index-drift:{slot}')

        tree = hashlib.sha256()
        for item in files:
            tree.update(item['path'].encode() + b'\0' + bytes.fromhex(item['sha256']))
        record = {
            'schema_version': 'are.g01-selective-r36-code-case/v1',
            'slot': slot,
            'repo': archive_record['repo'],
            'language': language,
            'image_tag': tag,
            'failed_commit': archive_record['failed_commit'],
            'root': str(root),
            'archive_sha256': archive_record['archive_sha256'],
            'manifest': manifest_name,
            'manifest_sha256': manifest_sha,
            'projected_files': len(files),
            'projected_bytes': bytes_total,
            'projected_tree_sha256': tree.hexdigest(),
        }
        record['receipt_sha256'] = save_json(f'CASE-{slot:02d}.json', record)
        records.append(record)
        print(json.dumps({'slot': slot, 'projected_files': len(files),
                          'projected_bytes': bytes_total}), flush=True)

    result = {
        'schema_version': 'are.g01-selective-r36-code-result/v1',
        'r35_result_sha256': R35_SHA,
        'cases': len(records),
        'total_files': sum(row['projected_files'] for row in records),
        'total_bytes': sum(row['projected_bytes'] for row in records),
        'language_counts': source['language_counts'],
        'network_calls': 0,
        'gold_opened': False,
        'passing_source_opened': False,
        'patches_opened': False,
        'model_calls': 0,
        'records': records,
    }
    result_sha = save_json('RESULT.json', result)
    print(json.dumps({'cases': result['cases'], 'total_files': result['total_files'],
                      'total_bytes': result['total_bytes'],
                      'result_sha256': result_sha}), flush=True)


if __name__ == '__main__':
    main()
