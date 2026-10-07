#!/usr/bin/env python3
"""HTTPS source/log availability for the sealed fresh G01 r11 metadata cohort."""

from __future__ import annotations

import gzip
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import time


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
OUTPUT = BASE / 'fresh-r11/preflight'
COHORT = BASE / 'fresh-r11/METADATA-COHORT.json'
PROTOCOL = HERE.parents[1] / 'evidence/G01-BUGSWARM-FRESH-R11-PREFLIGHT-PROTOCOL-2026-10-04.md'
PINS = {'cohort': '67a8e940d6635ab332d1ec639cfe7d76dccb86582faf76857fe8bd1d09b390bd',
        'protocol': '54688362cb4e75bfc773595c76e03146fa0c39bc5ac8458d0e1c9668a148b228'}
LIMIT = 8 * 1024 * 1024
MARKER = b'\nARE_HTTP_STATUS:'


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


def curl(url: str, *, head: bool = False, limit: int = LIMIT) -> tuple[dict, bytes]:
    args = ['/usr/bin/curl', '--silent', '--show-error', '--location',
            '--proto', '=https', '--proto-redir', '=https', '--tlsv1.2',
            '--connect-timeout', '10', '--max-time', '45',
            '--max-filesize', str(limit), '--write-out', '\nARE_HTTP_STATUS:%{http_code}']
    if head:
        args.append('--head')
    args.append(url)
    start = time.monotonic()
    try:
        done = subprocess.run(args, capture_output=True, timeout=50, check=False)
        body = done.stdout
        match = re.search(rb'\nARE_HTTP_STATUS:(\d{3})\Z', body)
        code = int(match.group(1)) if match else None
        if match:
            body = body[:match.start()]
        result = {'exit_code': done.returncode, 'http_code': code,
                  'bytes': len(body), 'sha256': sha(body),
                  'elapsed_ms': round((time.monotonic() - start) * 1000),
                  'too_large': len(body) > limit}
    except subprocess.TimeoutExpired as error:
        body = error.stdout or b''
        result = {'exit_code': None, 'http_code': None,
                  'bytes': len(body), 'sha256': sha(body),
                  'elapsed_ms': round((time.monotonic() - start) * 1000),
                  'too_large': len(body) > limit, 'timeout': True}
    return result, body


def content_length(header: bytes) -> int | None:
    values = re.findall(rb'(?im)^content-length:\s*(\d+)\s*$', header)
    return int(values[-1]) if values else None


def page_identity(body: bytes, row: dict) -> tuple[bool, str | None]:
    try:
        text = body.decode('utf-8', errors='strict')
    except UnicodeDecodeError:
        return False, None
    header = text.split('View raw log', 1)[0]
    job, repo = row['failure_job_id'], re.escape(row['repo'])
    github = bool(re.search(rf'<li>\s*GitHub Actions job {job}\s*</li>', header)
                  and re.search(rf'https://github\.com/{repo}/actions/runs/[^\s\'\"]+/job/{job}', header))
    travis = bool(re.search(rf'<li>\s*Travis-CI job {job}\s*</li>', header)
                  and re.search(rf'https://(?:app\.travis-ci\.com|travis-ci\.org)/{repo}/jobs/{job}', header))
    return github or travis, ('github-actions' if github else 'travis-ci' if travis else None)


def preserve(name: str, body: bytes) -> str:
    filename = name + '.gz'
    save(filename, gzip.compress(body, compresslevel=6, mtime=0))
    return filename


def main() -> None:
    need(not OUTPUT.exists() and sha(COHORT.read_bytes()) == PINS['cohort'] and
         sha(PROTOCOL.read_bytes()) == PINS['protocol'], 'output-or-input-pin-drift')
    cohort = json.loads(COHORT.read_bytes())
    cases = cohort['selected']
    need(len(cases) == 24 and cohort['selected_repositories'] == 24 and
         cohort['gold_opened'] is False and cohort['logs_opened'] is False and
         cohort['model_calls'] == 0, 'cohort-shape')
    OUTPUT.mkdir(parents=True, mode=0o700)
    save_json('RUN-FREEZE.json', {
        'schema_version': 'are.g01-fresh-r11-preflight-freeze/v1',
        'cohort_sha256': PINS['cohort'], 'protocol_sha256': PINS['protocol'],
        'runner_sha256': sha(Path(__file__).read_bytes()),
        'attempts': 24, 'automatic_retries': 0, 'max_log_bytes': LIMIT,
        'tls_validation': True, 'gold_opened': False, 'model_calls': 0})
    rows = []
    for case in cases:
        ordinal = case['ordinal']
        num = f'{ordinal:02d}'
        need(ordinal == len(rows) + 1 and re.fullmatch(r'[\w.-]+/[\w.-]+', case['repo']) and
             re.fullmatch(r'[0-9a-f]{40}', case['failure_commit']) and
             isinstance(case['failure_job_id'], int), f'case-shape:{ordinal}')
        src_url = f"https://codeload.github.com/{case['repo']}/tar.gz/{case['failure_commit']}"
        page_url = f"https://www.bugswarm.org/artifact-logs/{case['failure_job_id']}/"
        raw_url = page_url + 'raw/'
        source, source_body = curl(src_url, head=True, limit=65536)
        source['body_file'] = preserve(f'SOURCE-HEAD-{num}', source_body)
        page, page_body = curl(page_url, limit=1024 * 1024)
        page['body_file'] = preserve(f'PAGE-{num}', page_body)
        matched, provider = page_identity(page_body, case)
        page['identity_match'], page['provider'] = matched, provider
        raw_head, header = curl(raw_url, head=True, limit=65536)
        raw_head['body_file'] = preserve(f'RAW-HEAD-{num}', header)
        length = content_length(header)
        raw_head['content_length'] = length
        allowed = (source['exit_code'] == 0 and source['http_code'] == 200 and
                   page['exit_code'] == 0 and page['http_code'] == 200 and
                   not page['too_large'] and matched and
                   raw_head['exit_code'] == 0 and raw_head['http_code'] == 200 and
                   isinstance(length, int) and 0 < length <= LIMIT)
        log = None
        if allowed:
            log, log_body = curl(raw_url, limit=LIMIT)
            log['body_file'] = preserve(f'HTTPS-LOG-{num}', log_body)
            try:
                log_body.decode('utf-8', errors='strict')
                log['utf8'] = True
            except UnicodeDecodeError:
                log['utf8'] = False
        admitted = bool(allowed and log is not None and log['exit_code'] == 0 and
                        log['http_code'] == 200 and log['bytes'] == length and
                        not log['too_large'] and log['utf8'])
        row = {'schema_version': 'are.g01-fresh-r11-preflight-case/v1',
               'ordinal': ordinal, 'image_tag': case['image_tag'],
               'repo': case['repo'], 'language': case['language'],
               'failed_commit': case['failure_commit'],
               'job_id': case['failure_job_id'], 'source': source,
               'page': page, 'raw_head': raw_head, 'log': log,
               'admitted': admitted}
        save_json(f'CASE-{num}.json', row)
        rows.append(row)
        print(json.dumps({'ordinal': ordinal, 'source_http': source['http_code'],
                          'page_match': matched, 'log_length': length,
                          'admitted': admitted}), flush=True)
    result = {'schema_version': 'are.g01-fresh-r11-preflight-result/v1',
              'attempted': len(rows), 'admitted': sum(row['admitted'] for row in rows),
              'all_24_admitted': len(rows) == 24 and all(row['admitted'] for row in rows),
              'cohort_sha256': PINS['cohort'], 'protocol_sha256': PINS['protocol'],
              'gold_opened': False, 'model_calls': 0, 'rows': rows}
    save_json('PREFLIGHT-RESULT.json', result)
    print(json.dumps({'attempted': result['attempted'], 'admitted': result['admitted'],
                      'all_24_admitted': result['all_24_admitted'],
                      'result_sha256': sha((json.dumps(result, sort_keys=True, indent=2) + '\n').encode())}))
    if not result['all_24_admitted']:
        raise SystemExit(2)


if __name__ == '__main__':
    main()
