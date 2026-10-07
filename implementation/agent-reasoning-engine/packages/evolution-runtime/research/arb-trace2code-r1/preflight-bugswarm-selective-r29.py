#!/usr/bin/env python3
"""Authenticate failed-source and failed-log availability for G01 r28."""

from __future__ import annotations

import hashlib
import http.client
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess
import time
import urllib.error
import urllib.request


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
ROOT = BASE / 'selective-r28'
OUTPUT = ROOT / 'preflight-r29'
COHORT = ROOT / 'METADATA-CENSUS.json'
PROTOCOL = HERE.parents[1] / 'evidence/G01-BUGSWARM-SELECTIVE-R29-SOURCE-LOG-PROTOCOL-2026-10-04.md'
HELPER = HERE / 'preflight-bugswarm-fresh-r11.py'
R12 = HERE / 'preflight-bugswarm-fresh-r12.py'
R13 = HERE / 'admit-bugswarm-fresh-r13-header.py'
PINS = {
    'cohort': 'f4aead7a1201f114fe89d6da36226c4aeab5f4712f6114d1165632f9b2f2258a',
    'protocol': 'e18ea6c1c786be99f27002ee99e9c1261b0e3d5f110e8f956db2eb272a2aea7e',
    'helper': '2c13af917a8cfdc7e5aa5ea8f8c29f246deaac77bc9ada0395b61e8394d177bc',
    'corrected_head_precedent': 'ef623bbd62a105e1b4b1f88e7d7685615aa45fc20527a7a911df95678f7a3510',
    'bounded_header_precedent': '20eb10ec2831d302234f051f2e35dc6f1f59a0138aba641a4257e10ca4a5fa18',
}
LIMIT = 8 * 1024 * 1024
PAGE_PREFIX_CAP = 65536


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(ok: bool, reason: str) -> None:
    if not ok:
        raise SystemExit(reason)


def corrected_head(url: str) -> tuple[dict, bytes]:
    args = [
        '/usr/bin/curl', '--silent', '--show-error', '--location',
        '--proto', '=https', '--proto-redir', '=https', '--tlsv1.2',
        '--connect-timeout', '10', '--max-time', '45', '--head',
        '--write-out', '\nARE_HTTP_STATUS:%{http_code}', url,
    ]
    started = time.monotonic()
    try:
        done = subprocess.run(args, capture_output=True, timeout=50, check=False)
        body = done.stdout
        match = re.search(rb'\nARE_HTTP_STATUS:(\d{3})\Z', body)
        code = int(match.group(1)) if match else None
        if match:
            body = body[:match.start()]
        result = {
            'exit_code': done.returncode,
            'http_code': code,
            'bytes': len(body),
            'sha256': sha(body),
            'elapsed_ms': round((time.monotonic() - started) * 1000),
        }
    except subprocess.TimeoutExpired as error:
        body = error.stdout or b''
        result = {
            'exit_code': None,
            'http_code': None,
            'bytes': len(body),
            'sha256': sha(body),
            'elapsed_ms': round((time.monotonic() - started) * 1000),
            'timeout': True,
        }
    return result, body


def fetch_page_prefix(url: str) -> tuple[dict, bytes]:
    status = None
    final_url = None
    body = b''
    error = None
    try:
        request = urllib.request.Request(
            url, headers={'User-Agent': 'ARE-G01-r29-source-preflight'})
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
    return {
        'http_code': status,
        'final_url': final_url,
        'bytes': len(body),
        'sha256': sha(body),
        'bounded_prefix': True,
        'error': error,
    }, body


def main() -> None:
    need(not OUTPUT.exists(), 'output-exists')
    paths = {
        'cohort': COHORT,
        'protocol': PROTOCOL,
        'helper': HELPER,
        'corrected_head_precedent': R12,
        'bounded_header_precedent': R13,
    }
    for name, path in paths.items():
        need(sha(path.read_bytes()) == PINS[name], f'input-pin-drift:{name}')
    spec = importlib.util.spec_from_file_location('g01_r29_helpers', HELPER)
    need(spec is not None and spec.loader is not None, 'helper-unavailable')
    helper = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(helper)
    cohort = json.loads(COHORT.read_bytes())
    cases = cohort['selected']
    need(len(cases) == cohort['selected_repositories'] == 24 and
         cohort['gold_opened'] is False and cohort['logs_opened'] is False and
         cohort['network_calls'] == 0 and cohort['model_calls'] == 0,
         'cohort-shape-drift')
    OUTPUT.mkdir(parents=True, mode=0o700)
    helper.OUTPUT = OUTPUT
    helper.save_json('RUN-FREEZE.json', {
        'schema_version': 'are.g01-selective-r29-source-log-freeze/v1',
        'input_sha256': PINS,
        'runner_sha256': sha(Path(__file__).read_bytes()),
        'attempts': 24,
        'automatic_retries': 0,
        'maximum_page_prefix_bytes': PAGE_PREFIX_CAP,
        'maximum_log_bytes': LIMIT,
        'tls_validation': True,
        'gold_opened': False,
        'model_calls': 0,
    })
    rows = []
    network_calls = 0
    for case in cases:
        ordinal = case['ordinal']
        num = f'{ordinal:02d}'
        need(ordinal == len(rows) + 1 and
             re.fullmatch(r'[\w.-]+/[\w.-]+', case['repo']) and
             re.fullmatch(r'[0-9a-f]{40}', case['failure_commit']) and
             isinstance(case['failure_job_id'], int),
             f'case-shape:{ordinal}')
        src_url = f"https://codeload.github.com/{case['repo']}/tar.gz/{case['failure_commit']}"
        page_url = f"https://www.bugswarm.org/artifact-logs/{case['failure_job_id']}/"
        raw_url = page_url + 'raw/'

        source, source_body = corrected_head(src_url)
        network_calls += 1
        source['body_file'] = helper.preserve(f'SOURCE-HEAD-{num}', source_body)
        page, page_body = fetch_page_prefix(page_url)
        network_calls += 1
        page['body_file'] = helper.preserve(f'PAGE-HEADER-{num}', page_body)
        matched, provider = helper.page_identity(page_body, case)
        page['identity_match'] = matched
        page['provider'] = provider
        raw_head, header = corrected_head(raw_url)
        network_calls += 1
        raw_head['body_file'] = helper.preserve(f'RAW-HEAD-{num}', header)
        length = helper.content_length(header)
        raw_head['content_length'] = length

        source_ok = source['exit_code'] == 0 and source['http_code'] == 200
        page_ok = page['http_code'] == 200 and matched
        raw_head_ok = (raw_head['exit_code'] == 0 and
                       raw_head['http_code'] == 200 and
                       isinstance(length, int) and 0 < length <= LIMIT)
        log = None
        if source_ok and page_ok and raw_head_ok:
            log, log_body = helper.curl(raw_url, limit=LIMIT)
            network_calls += 1
            log['body_file'] = helper.preserve(f'HTTPS-LOG-{num}', log_body)
            try:
                log_body.decode('utf-8', errors='strict')
                log['utf8'] = True
            except UnicodeDecodeError:
                log['utf8'] = False
        log_ok = bool(log is not None and log['exit_code'] == 0 and
                      log['http_code'] == 200 and log['bytes'] == length and
                      not log['too_large'] and log['utf8'])
        admitted = bool(source_ok and page_ok and raw_head_ok and log_ok)
        row = {
            'schema_version': 'are.g01-selective-r29-source-log-case/v1',
            'ordinal': ordinal,
            'image_tag': case['image_tag'],
            'repo': case['repo'],
            'language': case['language'],
            'failed_commit': case['failure_commit'],
            'job_id': case['failure_job_id'],
            'source': source,
            'page': page,
            'raw_head': raw_head,
            'log': log,
            'admitted': admitted,
        }
        helper.save_json(f'CASE-{num}.json', row)
        rows.append(row)
        print(json.dumps({
            'ordinal': ordinal,
            'source_http': source['http_code'],
            'page_match': matched,
            'log_length': length,
            'admitted': admitted,
        }, sort_keys=True), flush=True)

    admitted = sum(row['admitted'] for row in rows)
    result = {
        'schema_version': 'are.g01-selective-r29-source-log-result/v1',
        'status': 'source-log-admitted' if admitted == 24 else 'terminal-requires-score-blind-repair',
        'attempted': len(rows),
        'admitted': admitted,
        'all_24_admitted': len(rows) == admitted == 24,
        'network_calls': network_calls,
        'automatic_retries': 0,
        'input_sha256': PINS,
        'gold_opened': False,
        'passing_source_opened': False,
        'patches_opened': False,
        'model_calls': 0,
        'rows': rows,
        'claim_ceiling': (
            'Source/log availability only; no label, ranking, model, score, '
            'accuracy, efficiency, or superiority result.'
        ),
    }
    helper.save_json('RESULT.json', result)
    encoded = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    print(json.dumps({
        'status': result['status'],
        'attempted': result['attempted'],
        'admitted': result['admitted'],
        'network_calls': result['network_calls'],
        'result_sha256': sha(encoded),
    }, sort_keys=True))
    if not result['all_24_admitted']:
        raise SystemExit(2)


if __name__ == '__main__':
    main()
