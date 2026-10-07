#!/usr/bin/env python3
"""Try one alternate-client GET for seven fixed r29 log failures."""

from __future__ import annotations

import gzip
import hashlib
import http.client
import json
import os
from pathlib import Path
import urllib.error
import urllib.request


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
R29 = BASE / 'selective-r28/preflight-r29/RESULT.json'
R30 = BASE / 'selective-r28/range-probe-r30/RESULT.json'
OUTPUT = BASE / 'selective-r28/alternate-client-r31'
PROTOCOL = HERE.parents[1] / 'evidence/G01-BUGSWARM-SELECTIVE-R31-ALTERNATE-CLIENT-PROTOCOL-2026-10-04.md'
PINS = {
    'r29': 'f3d63d9c43467d0e8ba13055e5207206269a6be17978cdd8da58018154460017',
    'r30': 'cf2dd60d247d86dfc6938f0f8dc7c2fa1c0a1dcac3e06a49768e9fb849135e40',
    'protocol': 'a2c7ac38fb8bc4478300e4f5f23a46e57d7a3699f5de304449909805a8f4d221',
}
ORDINALS = [7, 10, 12, 15, 18, 19, 21]
LIMIT = 8 * 1024 * 1024


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(ok: bool, reason: str) -> None:
    if not ok:
        raise SystemExit(reason)


def save(name: str, data: bytes) -> None:
    fd = os.open(OUTPUT / name, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def fetch_once(url: str, maximum: int) -> tuple[dict, bytes]:
    opener = urllib.request.build_opener(NoRedirect)
    status = None
    final_url = None
    headers: dict[str, str] = {}
    body = b''
    error = None
    try:
        request = urllib.request.Request(
            url, headers={'User-Agent': 'ARE-G01-r31-alternate-client'})
        with opener.open(request, timeout=50) as response:
            status = response.status
            final_url = response.geturl()
            headers = {key.lower(): value for key, value in response.headers.items()}
            try:
                body = response.read(maximum + 1)
            except http.client.IncompleteRead as exc:
                body = exc.partial[:maximum + 1]
                error = 'incomplete-read'
    except urllib.error.HTTPError as exc:
        status = exc.code
        final_url = exc.geturl()
        headers = {key.lower(): value for key, value in exc.headers.items()}
        body = exc.read(maximum + 1)
        error = f'http-{exc.code}'
    except Exception as exc:
        error = type(exc).__name__
    return {
        'http_code': status,
        'final_url': final_url,
        'headers': headers,
        'error': error,
    }, body


def main() -> None:
    need(not OUTPUT.exists(), 'output-exists')
    for name, path in (('r29', R29), ('r30', R30), ('protocol', PROTOCOL)):
        need(sha(path.read_bytes()) == PINS[name], f'input-pin-drift:{name}')
    r29 = json.loads(R29.read_bytes())
    r30 = json.loads(R30.read_bytes())
    need(r30['passed'] is False and r30['requests'] == 1 and
         r29['gold_opened'] is False and r29['model_calls'] == 0,
         'predecessor-drift')
    rows = [r29['rows'][ordinal - 1] for ordinal in ORDINALS]
    need([row['ordinal'] for row in rows] == ORDINALS and
         all(not row['admitted'] and row['source']['http_code'] == 200 and
             row['page']['identity_match'] is True and
             row['raw_head']['http_code'] == 200 and
             isinstance(row['raw_head']['content_length'], int) and
             0 < row['raw_head']['content_length'] <= LIMIT and
             row['log']['exit_code'] == 56
             for row in rows),
         'transport-only-row-drift')
    OUTPUT.mkdir(parents=True, mode=0o700)
    save('RUN-FREEZE.json', (json.dumps({
        'schema_version': 'are.g01-selective-r31-alternate-client-freeze/v1',
        'input_sha256': PINS,
        'runner_sha256': sha(Path(__file__).read_bytes()),
        'ordinals': ORDINALS,
        'requests': 7,
        'automatic_retries': 0,
        'maximum_log_bytes': LIMIT,
        'gold_opened': False,
        'model_calls': 0,
    }, sort_keys=True, indent=2) + '\n').encode())

    results = []
    for row in rows:
        ordinal = row['ordinal']
        expected = row['raw_head']['content_length']
        url = f"https://www.bugswarm.org/artifact-logs/{row['job_id']}/raw/"
        receipt, body = fetch_once(url, expected)
        filename = f'LOG-{ordinal:02d}.gz'
        save(filename, gzip.compress(body, compresslevel=6, mtime=0))
        header_length = receipt['headers'].get('content-length')
        try:
            parsed_length = int(header_length) if header_length is not None else None
        except ValueError:
            parsed_length = None
        utf8 = True
        try:
            body.decode('utf-8', errors='strict')
        except UnicodeDecodeError:
            utf8 = False
        complete = (receipt['http_code'] == 200 and receipt['final_url'] == url and
                    parsed_length == expected and len(body) == expected and utf8 and
                    receipt['error'] is None)
        result = {
            'schema_version': 'are.g01-selective-r31-alternate-client-case/v1',
            'ordinal': ordinal,
            'repo': row['repo'],
            'language': row['language'],
            'job_id': row['job_id'],
            'expected_bytes': expected,
            **receipt,
            'body_bytes': len(body),
            'body_sha256': sha(body),
            'body_file': filename,
            'utf8': utf8,
            'repaired': complete,
        }
        encoded = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
        save(f'CASE-{ordinal:02d}.json', encoded)
        results.append(result)
        print(json.dumps({
            'ordinal': ordinal,
            'repo': row['repo'],
            'expected_bytes': expected,
            'body_bytes': len(body),
            'error': receipt['error'],
            'repaired': complete,
        }, sort_keys=True), flush=True)

    repaired = sum(row['repaired'] for row in results)
    result = {
        'schema_version': 'are.g01-selective-r31-alternate-client-result/v1',
        'status': 'all-seven-repaired' if repaired == 7 else 'terminal-partial-repair',
        'input_sha256': PINS,
        'attempted': 7,
        'repaired': repaired,
        'unresolved': 7 - repaired,
        'requests': 7,
        'automatic_retries': 0,
        'gold_opened': False,
        'passing_source_opened': False,
        'patches_opened': False,
        'model_calls': 0,
        'rows': results,
        'claim_ceiling': 'Transport repair only; no benchmark or superiority result.',
    }
    encoded = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    save('RESULT.json', encoded)
    print(json.dumps({
        'status': result['status'],
        'attempted': 7,
        'repaired': repaired,
        'unresolved': 7 - repaired,
        'result_sha256': sha(encoded),
    }, sort_keys=True))
    if repaired != 7:
        raise SystemExit(2)


if __name__ == '__main__':
    main()
