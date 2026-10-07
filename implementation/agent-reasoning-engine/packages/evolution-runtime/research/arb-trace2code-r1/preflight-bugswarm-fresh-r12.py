#!/usr/bin/env python3
"""Correct r11 HEAD handling and rerun all fresh-cohort availability slots."""

from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path
import re
import subprocess
import time


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
OUTPUT = BASE / 'fresh-r11/preflight-r12'
COHORT = BASE / 'fresh-r11/METADATA-COHORT.json'
R11_RESULT = BASE / 'fresh-r11/preflight/PREFLIGHT-RESULT.json'
PROTOCOL = HERE.parents[1] / 'evidence/G01-BUGSWARM-FRESH-R12-PREFLIGHT-PROTOCOL-2026-10-04.md'
R11_RUNNER = HERE / 'preflight-bugswarm-fresh-r11.py'
PINS = {'cohort': '67a8e940d6635ab332d1ec639cfe7d76dccb86582faf76857fe8bd1d09b390bd',
        'r11_result': '70f53d84c6c0c6a64524880a1fba6a2407c640246fcfafc571e2c989335b18b0',
        'protocol': 'b79ce4686627f7c8e20fda7af172fa0389857dee96f0715c1364f689294d420d',
        'r11_runner': '2c13af917a8cfdc7e5aa5ea8f8c29f246deaac77bc9ada0395b61e8394d177bc'}
LIMIT = 8 * 1024 * 1024


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(ok: bool, reason: str) -> None:
    if not ok:
        raise SystemExit(reason)


def head(url: str) -> tuple[dict, bytes]:
    args = ['/usr/bin/curl', '--silent', '--show-error', '--location',
            '--proto', '=https', '--proto-redir', '=https', '--tlsv1.2',
            '--connect-timeout', '10', '--max-time', '45', '--head',
            '--write-out', '\nARE_HTTP_STATUS:%{http_code}', url]
    started = time.monotonic()
    try:
        done = subprocess.run(args, capture_output=True, timeout=50, check=False)
        body = done.stdout
        match = re.search(rb'\nARE_HTTP_STATUS:(\d{3})\Z', body)
        code = int(match.group(1)) if match else None
        if match:
            body = body[:match.start()]
        result = {'exit_code': done.returncode, 'http_code': code,
                  'bytes': len(body), 'sha256': sha(body),
                  'elapsed_ms': round((time.monotonic() - started) * 1000)}
    except subprocess.TimeoutExpired as error:
        body = error.stdout or b''
        result = {'exit_code': None, 'http_code': None,
                  'bytes': len(body), 'sha256': sha(body),
                  'elapsed_ms': round((time.monotonic() - started) * 1000),
                  'timeout': True}
    return result, body


def main() -> None:
    need(not OUTPUT.exists(), 'output-exists')
    for name, path in (('cohort', COHORT), ('r11_result', R11_RESULT),
                       ('protocol', PROTOCOL), ('r11_runner', R11_RUNNER)):
        need(sha(path.read_bytes()) == PINS[name], f'input-pin-drift:{name}')
    spec = importlib.util.spec_from_file_location('g01_r11_read_helpers', R11_RUNNER)
    need(spec is not None and spec.loader is not None, 'helper-unavailable')
    helper = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(helper)
    cases = json.loads(COHORT.read_bytes())['selected']
    r11 = json.loads(R11_RESULT.read_bytes())
    need(len(cases) == r11['attempted'] == 24 and r11['admitted'] == 4,
         'denominator-or-r11-drift')
    OUTPUT.mkdir(parents=True, mode=0o700)
    helper.OUTPUT = OUTPUT
    helper.save_json('RUN-FREEZE.json', {
        'schema_version': 'are.g01-fresh-r12-preflight-freeze/v1',
        'input_sha256': PINS, 'runner_sha256': sha(Path(__file__).read_bytes()),
        'correction': 'No max-filesize on HEAD; 8 MiB capped GET unchanged',
        'attempts': 24, 'automatic_retries': 0,
        'gold_opened': False, 'model_calls': 0})
    rows = []
    for case in cases:
        ordinal = case['ordinal']
        num = f'{ordinal:02d}'
        need(ordinal == len(rows) + 1, f'case-order:{ordinal}')
        src_url = f"https://codeload.github.com/{case['repo']}/tar.gz/{case['failure_commit']}"
        page_url = f"https://www.bugswarm.org/artifact-logs/{case['failure_job_id']}/"
        raw_url = page_url + 'raw/'
        source, source_body = head(src_url)
        source['body_file'] = helper.preserve(f'SOURCE-HEAD-{num}', source_body)
        page, page_body = helper.curl(page_url, limit=1024 * 1024)
        page['body_file'] = helper.preserve(f'PAGE-{num}', page_body)
        matched, provider = helper.page_identity(page_body, case)
        page['identity_match'], page['provider'] = matched, provider
        raw_head, header = head(raw_url)
        raw_head['body_file'] = helper.preserve(f'RAW-HEAD-{num}', header)
        length = helper.content_length(header)
        raw_head['content_length'] = length
        allowed = (source['exit_code'] == 0 and source['http_code'] == 200 and
                   page['exit_code'] == 0 and page['http_code'] == 200 and
                   not page['too_large'] and matched and
                   raw_head['exit_code'] == 0 and raw_head['http_code'] == 200 and
                   isinstance(length, int) and 0 < length <= LIMIT)
        log = None
        if allowed:
            log, log_body = helper.curl(raw_url, limit=LIMIT)
            log['body_file'] = helper.preserve(f'HTTPS-LOG-{num}', log_body)
            try:
                log_body.decode('utf-8', errors='strict')
                log['utf8'] = True
            except UnicodeDecodeError:
                log['utf8'] = False
        admitted = bool(allowed and log is not None and log['exit_code'] == 0 and
                        log['http_code'] == 200 and log['bytes'] == length and
                        not log['too_large'] and log['utf8'])
        row = {'schema_version': 'are.g01-fresh-r12-preflight-case/v1',
               'ordinal': ordinal, 'image_tag': case['image_tag'],
               'repo': case['repo'], 'language': case['language'],
               'failed_commit': case['failure_commit'],
               'job_id': case['failure_job_id'], 'source': source,
               'page': page, 'raw_head': raw_head, 'log': log,
               'admitted': admitted}
        helper.save_json(f'CASE-{num}.json', row)
        rows.append(row)
        print(json.dumps({'ordinal': ordinal, 'source_http': source['http_code'],
                          'page_match': matched, 'log_length': length,
                          'admitted': admitted}), flush=True)
    result = {'schema_version': 'are.g01-fresh-r12-preflight-result/v1',
              'attempted': len(rows), 'admitted': sum(row['admitted'] for row in rows),
              'all_24_admitted': len(rows) == 24 and all(row['admitted'] for row in rows),
              'input_sha256': PINS, 'gold_opened': False, 'model_calls': 0,
              'rows': rows}
    helper.save_json('PREFLIGHT-RESULT.json', result)
    print(json.dumps({'attempted': result['attempted'], 'admitted': result['admitted'],
                      'all_24_admitted': result['all_24_admitted'],
                      'result_sha256': sha((json.dumps(result, sort_keys=True, indent=2) + '\n').encode())}))
    if not result['all_24_admitted']:
        raise SystemExit(2)


if __name__ == '__main__':
    main()
