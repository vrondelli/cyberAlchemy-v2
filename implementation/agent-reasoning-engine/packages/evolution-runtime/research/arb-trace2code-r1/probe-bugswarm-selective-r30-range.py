#!/usr/bin/env python3
"""Probe exact HTTPS byte-range support for one fixed r29 failed log."""

from __future__ import annotations

import gzip
import hashlib
import json
import os
from pathlib import Path
import re
import urllib.error
import urllib.request


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
R29 = BASE / 'selective-r28/preflight-r29/RESULT.json'
OUTPUT = BASE / 'selective-r28/range-probe-r30'
PROTOCOL = HERE.parents[1] / 'evidence/G01-BUGSWARM-SELECTIVE-R30-RANGE-PROBE-PROTOCOL-2026-10-04.md'
PINS = {
    'r29': 'f3d63d9c43467d0e8ba13055e5207206269a6be17978cdd8da58018154460017',
    'protocol': 'd8315486d62be20fa476ce296085cdf4afd1670b662e4dbe313de96ca781ce9c',
}
ORDINAL = 10
START = 0
END = 16383
TOTAL = 192878


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(ok: bool, reason: str) -> None:
    if not ok:
        raise SystemExit(reason)


def save(name: str, data: bytes) -> None:
    fd = os.open(OUTPUT / name, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)


def main() -> None:
    need(not OUTPUT.exists(), 'output-exists')
    need(sha(R29.read_bytes()) == PINS['r29'], 'input-pin-drift:r29')
    need(sha(PROTOCOL.read_bytes()) == PINS['protocol'], 'input-pin-drift:protocol')
    r29 = json.loads(R29.read_bytes())
    row = r29['rows'][ORDINAL - 1]
    need(row['ordinal'] == ORDINAL and row['repo'] == 'google/python-fire' and
         row['raw_head']['content_length'] == TOTAL and
         row['source']['http_code'] == 200 and
         row['page']['identity_match'] is True and row['admitted'] is False and
         row['log']['exit_code'] == 56 and row['log']['bytes'] == 32572 and
         r29['gold_opened'] is False and r29['model_calls'] == 0,
         'fixed-probe-row-drift')
    OUTPUT.mkdir(parents=True, mode=0o700)
    url = f"https://www.bugswarm.org/artifact-logs/{row['job_id']}/raw/"
    status = None
    final_url = None
    headers: dict[str, str] = {}
    body = b''
    error = None
    try:
        request = urllib.request.Request(url, headers={
            'User-Agent': 'ARE-G01-r30-range-probe',
            'Range': f'bytes={START}-{END}',
        })
        with urllib.request.urlopen(request, timeout=45) as response:
            status = response.status
            final_url = response.geturl()
            headers = {key.lower(): value for key, value in response.headers.items()}
            body = response.read(END - START + 2)
    except urllib.error.HTTPError as exc:
        status = exc.code
        final_url = exc.geturl()
        headers = {key.lower(): value for key, value in exc.headers.items()}
        body = exc.read(END - START + 2)
        error = f'http-{exc.code}'
    except Exception as exc:
        error = type(exc).__name__
    save('BODY.gz', gzip.compress(body, compresslevel=6, mtime=0))
    content_range = headers.get('content-range')
    expected_range = f'bytes {START}-{END}/{TOTAL}'
    final_url_ok = bool(final_url and re.fullmatch(
        rf'https://www\.bugswarm\.org/artifact-logs/{row["job_id"]}/raw/?',
        final_url))
    passed = (status == 206 and final_url_ok and
              content_range == expected_range and len(body) == END - START + 1)
    result = {
        'schema_version': 'are.g01-selective-r30-range-probe-result/v1',
        'status': 'range-supported' if passed else 'range-unsupported-or-unverified',
        'input_sha256': PINS,
        'runner_sha256': sha(Path(__file__).read_bytes()),
        'ordinal': ORDINAL,
        'repo': row['repo'],
        'job_id': row['job_id'],
        'requested_range': f'bytes={START}-{END}',
        'expected_total_bytes': TOTAL,
        'http_code': status,
        'final_url': final_url,
        'final_url_ok': final_url_ok,
        'content_range': content_range,
        'headers': headers,
        'body_bytes': len(body),
        'body_sha256': sha(body),
        'body_file': 'BODY.gz',
        'error': error,
        'requests': 1,
        'automatic_retries': 0,
        'passed': passed,
        'gold_opened': False,
        'passing_source_opened': False,
        'patches_opened': False,
        'model_calls': 0,
        'claim_ceiling': 'One transport-capability probe only; no benchmark or superiority result.',
    }
    encoded = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    save('RESULT.json', encoded)
    print(json.dumps({
        'status': result['status'],
        'http_code': status,
        'content_range': content_range,
        'body_bytes': len(body),
        'passed': passed,
        'result_sha256': sha(encoded),
    }, sort_keys=True))
    if not passed:
        raise SystemExit(2)


if __name__ == '__main__':
    main()
