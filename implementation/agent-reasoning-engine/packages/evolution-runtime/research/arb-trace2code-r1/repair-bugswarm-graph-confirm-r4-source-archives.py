#!/usr/bin/env python3
"""Repair only five r3 source-archive failures without labels or model calls."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import os
from pathlib import Path
import tarfile
from urllib.error import HTTPError, URLError
from urllib.request import HTTPRedirectHandler, Request, build_opener, urlopen


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
R2 = BASE / 'graph-confirm-r1/source-only/g01-bugswarm-graph-confirm-r2-repair/REPAIR-RESULT.json'
R2_SHA = 'a55087a01c1b157ea7fcd6dfa4327037a3e4cb13c72df5e0c31b44d80513c22c'
R3 = BASE / 'graph-confirm-r3/source-archives'
R3_RESULT_SHA = 'fa6220e629a4e88a6e7cdeb6d3d8ec812ebf6d832d886f95fcb2e4377483f608'
PROTOCOL = HERE.parents[1] / 'evidence/G01-BUGSWARM-GRAPH-CONFIRM-R4-SOURCE-REPAIR-PROTOCOL-2026-10-04.md'
OUTPUT = BASE / 'graph-confirm-r4/source-archives'
ALIAS = {6: 'cookiecutter/cookiecutter-django',
         9: 'fastapi/sqlmodel', 23: 'besu-eth/besu'}
LARGE = {1, 16}
MAX_ARCHIVE = 512 * 1024 * 1024


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


class RedirectRecorder(HTTPRedirectHandler):
    def __init__(self) -> None:
        super().__init__()
        self.hops: list[dict] = []

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        self.hops.append({'status': code, 'url': newurl})
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def inspect_alias(slot: int, old: str, commit: str) -> dict:
    canonical = ALIAS[slot]
    url = f'https://github.com/{old}/commit/{commit}'
    expected = f'https://github.com/{canonical}/commit/{commit}'
    recorder = RedirectRecorder()
    result = {'requested_url': url, 'canonical_repo': canonical,
              'expected_final_url': expected, 'hops': [], 'final_url': None,
              'final_status': None, 'admissible': False}
    try:
        with build_opener(recorder).open(Request(url, method='HEAD'), timeout=30) as response:
            result['final_url'] = response.geturl()
            result['final_status'] = response.status
    except (HTTPError, URLError, TimeoutError, OSError) as error:
        result['error'] = type(error).__name__
    result['hops'] = recorder.hops
    result['admissible'] = (len(recorder.hops) == 1 and recorder.hops[0] ==
                            {'status': 301, 'url': expected} and
                            result['final_url'] == expected and result['final_status'] == 200)
    return result


def fetch_large(slot: int, row: dict) -> dict:
    repo, commit = row['repo'], row['failed_commit']
    name = f"{slot:02d}-{repo.replace('/', '-')}-{commit}.tar.gz"
    partial = OUTPUT / (name + '.partial')
    archive = OUTPUT / name
    url = f'https://codeload.github.com/{repo}/legacy.tar.gz/{commit}'
    record = {'url': url, 'archive': name, 'http_status': None,
              'content_length': None, 'bytes': 0, 'sha256': None,
              'transport_complete': False}
    try:
        with urlopen(Request(url, headers={'User-Agent': 'ARE-G01-confirm-source/4'}),
                     timeout=180) as response:
            record['http_status'] = response.status
            declared = response.headers.get('Content-Length')
            record['content_length'] = int(declared) if declared and declared.isdigit() else None
            if response.status != 200:
                return record
            fd = os.open(partial, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            hasher = hashlib.sha256()
            total = 0
            with os.fdopen(fd, 'wb') as stream:
                while True:
                    chunk = response.read(1024 * 1024)
                    if not chunk:
                        break
                    stream.write(chunk)
                    total += len(chunk)
                    hasher.update(chunk)
                    if total > MAX_ARCHIVE:
                        break
            record['bytes'] = total
            record['sha256'] = hasher.hexdigest()
            record['transport_complete'] = (0 < total <= MAX_ARCHIVE and
                                            (record['content_length'] is None or
                                             record['content_length'] == total))
    except (HTTPError, URLError, TimeoutError, OSError) as error:
        record['error'] = type(error).__name__
        if partial.exists():
            record['bytes'] = partial.stat().st_size
            record['sha256'] = digest(partial)
        return record
    if not record['transport_complete']:
        return record
    with partial.open('rb') as stream:
        if stream.read(2) != b'\x1f\x8b':
            record['transport_complete'] = False
            return record
    os.rename(partial, archive)
    return record


def main() -> None:
    need(not OUTPUT.exists() and digest(R2) == R2_SHA and
         digest(R3 / 'RESULT.json') == R3_RESULT_SHA, 'output-or-input-pin-drift')
    spec = importlib.util.spec_from_file_location('g01_r3_source',
                                                   HERE / 'acquire-bugswarm-graph-confirm-r3-source-archives.py')
    need(spec is not None and spec.loader is not None, 'r3-validator-unavailable')
    r3module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(r3module)
    r2 = json.loads(R2.read_bytes())
    r3 = json.loads((R3 / 'RESULT.json').read_bytes())
    need(r2['all_24_filled'] and len(r2['rows']) == len(r3['results']) == 24 and
         r3['admitted'] == 19 and not r3['all_24_admitted'] and
         [row['slot'] for row in r3['results'] if not row['admissible']] == [1, 6, 9, 16, 23],
         'r3-outcome-shape-drift')
    OUTPUT.parent.mkdir(mode=0o700, exist_ok=True)
    need(OUTPUT.parent.is_dir() and not (OUTPUT.parent.stat().st_mode & 0o077),
         'private-parent-permissions')
    OUTPUT.mkdir(mode=0o700)
    freeze = {'schema_version': 'are.g01-confirm-source-repair-freeze-r4/v1',
              'r2_sha256': R2_SHA, 'r3_result_sha256': R3_RESULT_SHA,
              'protocol_sha256': digest(PROTOCOL),
              'r3_validator_sha256': digest(HERE / 'acquire-bugswarm-graph-confirm-r3-source-archives.py'),
              'script_sha256': digest(Path(__file__)), 'alias_slots': ALIAS,
              'large_slots': sorted(LARGE), 'max_archive_bytes': MAX_ARCHIVE,
              'gold_opened': False, 'model_calls': 0}
    save_json('FREEZE.json', freeze)
    occupied = {row['final']['repo'].lower() for row in r2['rows']}
    need(len(occupied) == 24 and not ({name.lower() for name in ALIAS.values()} & occupied),
         'alias-overlaps-cohort')
    results = []
    for slot, (admitted, case) in enumerate(zip(r3['results'], r2['rows']), 1):
        final = case['final']
        need(admitted['slot'] == case['slot'] == slot and admitted['repo'] == final['repo'] and
             admitted['failed_commit'] == final['failed_commit'], f'slot-{slot}-drift')
        item = {'slot': slot, 'repo': final['repo'], 'failed_commit': final['failed_commit'],
                'language': final['language'], 'branch': None, 'admissible': False}
        if slot in LARGE:
            item['branch'] = 'large_exact_refetch'
            item['transfer'] = fetch_large(slot, final)
            if item['transfer']['transport_complete']:
                source = OUTPUT / item['transfer']['archive']
            else:
                source = None
        else:
            item['branch'] = 'alias_redirect' if slot in ALIAS else 'r3_revalidate'
            source = R3 / admitted['archive']
            need(source.is_file() and digest(source) == admitted['archive_sha256'] and
                 source.stat().st_size == admitted['archive_bytes'],
                 f'r3-archive-drift:{slot}')
            if slot in ALIAS:
                item['alias'] = inspect_alias(slot, final['repo'], final['failed_commit'])
        if source is not None and (slot not in ALIAS or item['alias']['admissible']):
            repo_for_root = ALIAS.get(slot, final['repo'])
            try:
                item['inspection'] = r3module.inspect(source, repo_for_root,
                                                       final['failed_commit'], final['language'])
                item['archive_sha256'] = digest(source)
                item['archive_bytes'] = source.stat().st_size
                item['archive_path'] = str(source)
                item['admissible'] = item['inspection']['admissible']
            except (tarfile.TarError, OSError, EOFError) as error:
                item['inspection_error'] = type(error).__name__
        save_json(f'CASE-{slot:02d}.json', item)
        results.append(item)
        print(json.dumps({'slot': slot, 'branch': item['branch'],
                          'admissible': item['admissible'],
                          'archive_bytes': item.get('archive_bytes')}), flush=True)
    outcome = {'schema_version': 'are.g01-confirm-source-repair-result-r4/v1',
               'r2_sha256': R2_SHA, 'r3_result_sha256': R3_RESULT_SHA,
               'attempted': len(results), 'admitted': sum(row['admissible'] for row in results),
               'all_24_admitted': len(results) == 24 and all(row['admissible'] for row in results),
               'gold_opened': False, 'model_calls': 0, 'results': results}
    result_sha = save_json('RESULT.json', outcome)
    print(json.dumps({'attempted': outcome['attempted'], 'admitted': outcome['admitted'],
                      'all_24_admitted': outcome['all_24_admitted'],
                      'result_sha256': result_sha}), flush=True)
    if not outcome['all_24_admitted']:
        raise SystemExit(2)


if __name__ == '__main__':
    main()
