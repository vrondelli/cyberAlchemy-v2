#!/usr/bin/env python3
"""Adjudicate complete authenticated page headers, with full raw-log proof."""

from __future__ import annotations

import gzip
import hashlib
import http.client
import importlib.util
import json
import os
from pathlib import Path
import urllib.error
import urllib.request


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
R12 = BASE / 'fresh-r11/preflight-r12'
OUTPUT = BASE / 'fresh-r11/header-r13'
COHORT = BASE / 'fresh-r11/METADATA-COHORT.json'
PROTOCOL = HERE.parents[1] / 'evidence/G01-BUGSWARM-FRESH-R13-HEADER-ADMISSION-PROTOCOL-2026-10-04.md'
HELPER = HERE / 'preflight-bugswarm-fresh-r11.py'
PINS = {'cohort': '67a8e940d6635ab332d1ec639cfe7d76dccb86582faf76857fe8bd1d09b390bd',
        'r12': 'da3767a0e46462db27e0891587ad3562ad4a5384b6ae6eeb688d8ed258a04585',
        'protocol': '434286ead078f895c4a0fdc20b806bda0f9135fb41d2434a34ceb899e711c137',
        'helper': '2c13af917a8cfdc7e5aa5ea8f8c29f246deaac77bc9ada0395b61e8394d177bc'}
LIMIT = 8 * 1024 * 1024
PAGE_PREFIX_CAP = 65536


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(ok: bool, reason: str) -> None:
    if not ok:
        raise SystemExit(reason)


def save(name: str, data: bytes) -> None:
    fd = os.open(OUTPUT / name, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)


def save_json(name: str, value: object) -> None:
    save(name, (json.dumps(value, sort_keys=True, indent=2) + '\n').encode())


def fetch_prefix(url: str) -> tuple[dict, bytes]:
    status = None
    final_url = None
    body = b''
    error = None
    try:
        request = urllib.request.Request(url, headers={'User-Agent': 'ARE-G01-r13-source-preflight'})
        with urllib.request.urlopen(request, timeout=45) as response:
            status = response.status
            final_url = response.geturl()
            need(final_url.startswith('https://www.bugswarm.org/artifact-logs/'),
                 'page-redirect-outside-https-bugswarm')
            try:
                body = response.read(PAGE_PREFIX_CAP)
            except http.client.IncompleteRead as exc:
                body = exc.partial[:PAGE_PREFIX_CAP]
                error = 'incomplete-read'
    except urllib.error.HTTPError as exc:
        status = exc.code
        error = f'http-{exc.code}'
    except Exception as exc:
        error = type(exc).__name__
    return {'http_code': status, 'final_url': final_url,
            'bytes': len(body), 'sha256': sha(body),
            'bounded_prefix': True, 'error': error}, body


def complete_identity(body: bytes, case: dict, helper: object) -> tuple[bool, str | None]:
    try:
        text = body.decode('utf-8', errors='strict')
    except UnicodeDecodeError:
        return False, None
    if 'View raw log' not in text:
        return False, None
    return helper.page_identity(body, case)


def main() -> None:
    need(not OUTPUT.exists(), 'output-exists')
    paths = {'cohort': COHORT, 'r12': R12 / 'PREFLIGHT-RESULT.json',
             'protocol': PROTOCOL, 'helper': HELPER}
    for name, path in paths.items():
        need(sha(path.read_bytes()) == PINS[name], f'input-pin-drift:{name}')
    spec = importlib.util.spec_from_file_location('g01_r13_source_helpers', HELPER)
    need(spec is not None and spec.loader is not None, 'helper-unavailable')
    helper = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(helper)
    cases = json.loads(COHORT.read_bytes())['selected']
    r12 = json.loads(paths['r12'].read_bytes())['rows']
    need(len(cases) == len(r12) == 24, 'denominator-drift')
    OUTPUT.mkdir(parents=True, mode=0o700)
    save_json('RUN-FREEZE.json', {'schema_version': 'are.g01-fresh-r13-header-freeze/v1',
              'input_sha256': PINS, 'runner_sha256': sha(Path(__file__).read_bytes()),
              'maximum_page_prefix_bytes': PAGE_PREFIX_CAP,
              'maximum_log_bytes': LIMIT, 'automatic_retries': 0,
              'gold_opened': False, 'model_calls': 0})
    rows = []
    for case, prior in zip(cases, r12):
        ordinal = case['ordinal']
        num = f'{ordinal:02d}'
        need(ordinal == len(rows) + 1 == prior['ordinal'] and
             case['repo'] == prior['repo'] and
             case['failure_commit'] == prior['failed_commit'] and
             case['failure_job_id'] == prior['job_id'], f'identity:{ordinal}')
        prior_page_gz = (R12 / prior['page']['body_file']).read_bytes()
        prior_page = gzip.decompress(prior_page_gz)
        need(sha(prior_page) == prior['page']['sha256'] and
             len(prior_page) == prior['page']['bytes'], f'prior-page-hash:{ordinal}')
        page_source = 'r12-reused'
        page_receipt = {'http_code': prior['page']['http_code'],
                        'exit_code': prior['page']['exit_code'],
                        'bytes': len(prior_page), 'sha256': sha(prior_page)}
        page_body = prior_page
        if not page_body:
            page_source = 'r13-new-bounded-get'
            page_receipt, page_body = fetch_prefix(
                f"https://www.bugswarm.org/artifact-logs/{case['failure_job_id']}/")
        page_receipt['body_file'] = f'PAGE-HEADER-{num}.gz'
        save(page_receipt['body_file'], gzip.compress(page_body, compresslevel=6, mtime=0))
        matched, provider = complete_identity(page_body, case, helper)
        page_ok = page_receipt['http_code'] == 200 and matched
        source_ok = prior['source']['exit_code'] == 0 and prior['source']['http_code'] == 200
        raw = prior['raw_head']
        length = raw['content_length']
        raw_head_ok = (raw['exit_code'] == 0 and raw['http_code'] == 200 and
                       isinstance(length, int) and 0 < length <= LIMIT)
        log = prior['log']
        log_source = 'r12-reused' if log is not None else None
        if source_ok and page_ok and raw_head_ok and log is None:
            log_source = 'r13-new-capped-get'
            log, body = helper.curl(
                f"https://www.bugswarm.org/artifact-logs/{case['failure_job_id']}/raw/",
                limit=LIMIT)
            filename = f'HTTPS-LOG-{num}.gz'
            save(filename, gzip.compress(body, compresslevel=6, mtime=0))
            log['body_file'] = filename
            try:
                body.decode('utf-8', errors='strict')
                log['utf8'] = True
            except UnicodeDecodeError:
                log['utf8'] = False
        elif log is not None:
            old_blob = gzip.decompress((R12 / log['body_file']).read_bytes())
            need(sha(old_blob) == log['sha256'] and len(old_blob) == log['bytes'],
                 f'prior-log-hash:{ordinal}')
        log_ok = bool(log is not None and log['exit_code'] == 0 and
                      log['http_code'] == 200 and log['bytes'] == length and
                      not log['too_large'] and log['utf8'])
        admitted = bool(source_ok and page_ok and raw_head_ok and log_ok)
        row = {'schema_version': 'are.g01-fresh-r13-header-case/v1',
               'ordinal': ordinal, 'id': case['image_tag'], 'repo': case['repo'],
               'failed_commit': case['failure_commit'], 'job_id': case['failure_job_id'],
               'source_ok': source_ok, 'page_source': page_source,
               'page': {**page_receipt, 'identity_match': matched, 'provider': provider},
               'raw_head_ok': raw_head_ok, 'log_source': log_source,
               'log': log, 'admitted': admitted}
        save_json(f'CASE-{num}.json', row)
        rows.append(row)
        print(json.dumps({'ordinal': ordinal, 'source_ok': source_ok,
                          'page_ok': page_ok, 'log_ok': log_ok,
                          'admitted': admitted}), flush=True)
    result = {'schema_version': 'are.g01-fresh-r13-header-result/v1',
              'attempted': len(rows), 'admitted': sum(row['admitted'] for row in rows),
              'all_24_admitted': len(rows) == 24 and all(row['admitted'] for row in rows),
              'input_sha256': PINS, 'gold_opened': False, 'model_calls': 0,
              'rows': rows}
    save_json('RESULT.json', result)
    print(json.dumps({'attempted': result['attempted'], 'admitted': result['admitted'],
                      'all_24_admitted': result['all_24_admitted'],
                      'result_sha256': sha((json.dumps(result, sort_keys=True, indent=2) + '\n').encode())}))
    if not result['all_24_admitted']:
        raise SystemExit(2)


if __name__ == '__main__':
    main()
