#!/usr/bin/env python3
"""Acquire and validate exact buggy-commit source archives for r54; never read gold."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import tarfile
import time
from pathlib import Path, PurePosixPath
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


FREEZE_SHA256 = '85226a48b5c5cbbbfb7edd725038e576ac7e5e0e9541f002fc5d3ac89a29ca9d'
MAX_ARCHIVE_BYTES = 100_000_000
REPOSITORIES = {
    'ansible': 'ansible/ansible',
    'black': 'psf/black',
    'cookiecutter': 'cookiecutter/cookiecutter',
    'fastapi': 'fastapi/fastapi',
    'keras': 'keras-team/keras',
    'luigi': 'spotify/luigi',
    'matplotlib': 'matplotlib/matplotlib',
    'scrapy': 'scrapy/scrapy',
    'thefuck': 'nvbn/thefuck',
    'tornado': 'tornadoweb/tornado',
    'tqdm': 'tqdm/tqdm',
    'youtube-dl': 'ytdl-org/youtube-dl',
}


def sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open('rb') as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def validate(path: Path, commit: str, case: str) -> dict:
    roots = set()
    members = links = regular_bytes = 0
    with tarfile.open(path, 'r:gz') as archive:
        for member in archive:
            members += 1
            name = PurePosixPath(member.name)
            if name.is_absolute() or '..' in name.parts or '\\' in member.name or not name.parts:
                raise SystemExit(f'r54.unsafe-archive:{case}')
            roots.add(name.parts[0])
            if member.isfile():
                regular_bytes += member.size
            elif member.issym() or member.islnk():
                links += 1
            elif not member.isdir():
                raise SystemExit(f'r54.special-member:{case}')
            if members > 200_000 or regular_bytes > 1_000_000_000:
                raise SystemExit(f'r54.expansion-cap:{case}')
    if len(roots) != 1 or not next(iter(roots)).endswith(commit):
        raise SystemExit(f'r54.root-commit-binding:{case}:{sorted(roots)}')
    return {'archive_sha256': sha(path), 'compressed_bytes': path.stat().st_size,
            'members': members, 'regular_bytes': regular_bytes, 'links_not_extracted': links,
            'root': next(iter(roots))}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--freeze', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    if sha(args.freeze) != FREEZE_SHA256 or args.output.exists():
        raise SystemExit('r54.freeze-drift-or-output-exists')
    cases = json.loads(args.freeze.read_text())['selected']
    if len(cases) != 24 or set(row['repo'] for row in cases) != set(REPOSITORIES):
        raise SystemExit('r54.cohort-shape')
    args.output.mkdir(mode=0o700, parents=True)
    records = []
    for sequence, row in enumerate(cases, 1):
        repo, bugid, commit = row['repo'], row['bugid'], row['buggy_commit_id']
        case = f'{repo}/{bugid}'
        url = f'https://codeload.github.com/{REPOSITORIES[repo]}/tar.gz/{commit}'
        destination = args.output / f'{repo}-{commit}.tar.gz'
        partial = args.output / f'.{repo}-{commit}.part'
        descriptor = os.open(partial, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        started = time.monotonic()
        status = final_url = None
        try:
            request = Request(url, headers={'Accept': 'application/octet-stream', 'User-Agent': 'ARE-G01-r54/1'})
            with urlopen(request, timeout=120) as response, os.fdopen(descriptor, 'wb') as handle:
                status = response.status
                final_url = response.geturl()
                total = 0
                while True:
                    block = response.read(1024 * 1024)
                    if not block:
                        break
                    total += len(block)
                    if total > MAX_ARCHIVE_BYTES:
                        raise SystemExit(f'r54.archive-cap:{case}')
                    handle.write(block)
        except (HTTPError, URLError, TimeoutError, OSError) as error:
            try:
                os.close(descriptor)
            except OSError:
                pass
            raise SystemExit(f'r54.download:{case}:{type(error).__name__}') from error
        if status != 200 or not str(final_url).startswith('https://codeload.github.com/'):
            raise SystemExit(f'r54.response:{case}:{status}:{final_url}')
        partial.rename(destination)
        audit = validate(destination, commit, case)
        record = {'sequence': sequence, 'case': case, 'repo': repo, 'bugid': bugid,
                  'commit': commit, 'github_repository': REPOSITORIES[repo], 'url': url,
                  'http_status': status, 'final_url': final_url,
                  'elapsed_ms': round((time.monotonic() - started) * 1000), **audit}
        records.append(record)
        print(json.dumps({'sequence': sequence, 'case': case, 'bytes': audit['compressed_bytes'],
                          'members': audit['members'], 'status': 'validated'}), flush=True)
    receipt = {'schema_version': 'are.g01-bugsinpy-rrf-confirm-r54-source-acquisition/v1',
               'cohort_freeze_sha256': FREEZE_SHA256, 'archives': len(records),
               'total_compressed_bytes': sum(row['compressed_bytes'] for row in records),
               'records': records, 'gold_opened': False, 'fixed_output_opened': False}
    (args.output / 'SOURCE-ACQUISITION-RECEIPT.json').write_text(json.dumps(receipt, sort_keys=True, indent=2) + '\n')
    print(json.dumps({'archives': len(records), 'total_compressed_bytes': receipt['total_compressed_bytes'],
                      'receipt_sha256': sha(args.output / 'SOURCE-ACQUISITION-RECEIPT.json')}, sort_keys=True))


if __name__ == '__main__':
    main()
