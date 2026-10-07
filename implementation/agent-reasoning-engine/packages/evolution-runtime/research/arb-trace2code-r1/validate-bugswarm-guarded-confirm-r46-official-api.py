#!/usr/bin/env python3
"""Cross-validate BugSwarm's official log API for the complete r45 census."""

from __future__ import annotations

import gzip
import hashlib
import json
import os
from pathlib import Path
import time
import urllib.error
import urllib.request


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
R45 = BASE / 'guarded-confirm-r45/supply-r1'
OUTPUT = BASE / 'guarded-confirm-r46/official-api-r1'
R45_RESULT = R45 / 'RESULT.json'
R45_FREEZE = R45 / 'RUN-FREEZE.json'
R45_DOC = HERE.parents[1] / 'evidence/G01-BUGSWARM-GUARDED-CONFIRM-R45-SUPPLY-RESULT-2026-10-04.md'
PROTOCOL = HERE.parents[1] / 'evidence/G01-BUGSWARM-GUARDED-CONFIRM-R46-OFFICIAL-API-PROTOCOL-2026-10-04.md'
PINS = {
    'r45_result': '26e9de47e18b74d5baf6737ef70fbc06f63b66c7a85940d76fca5c85e3798f09',
    'r45_freeze': '0a3f6d308e48366b510a48c3709a5f13e34f5c53a74f0b645ffb8b0f70113a42',
    'r45_doc': 'cae4666cce383dc904d9a7cadb0527b39ce46508070081894d341166b02652cb',
    'protocol': '84ea4e5a0013b758db55cb776d4e6b7a4037070cb264a4d0dd7fc46116199ab4',
}
MAXIMUM = 10 * 1024 * 1024
MINIMUM_INTERVAL = 3.1


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(ok: bool, reason: str) -> None:
    if not ok:
        raise SystemExit(reason)


def save_bytes(name: str, data: bytes) -> None:
    fd = os.open(OUTPUT / name, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)


def save_json(name: str, value: object) -> None:
    save_bytes(name, (json.dumps(value, sort_keys=True, indent=2) + '\n').encode())


def fetch(job_id: int) -> tuple[dict, bytes]:
    url = f'http://www.api.bugswarm.org/v1/logs/{job_id}'
    request = urllib.request.Request(
        url, headers={'User-Agent': 'ARE-G01-r46-official-api-validation'})
    started = time.monotonic()
    status = None
    final_url = None
    headers: dict[str, str] = {}
    body = b''
    error = None
    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            status = response.status
            final_url = response.geturl()
            headers = {key.lower(): value for key, value in response.headers.items()}
            body = response.read(MAXIMUM + 1)
    except urllib.error.HTTPError as exc:
        status = exc.code
        final_url = exc.geturl()
        headers = {key.lower(): value for key, value in exc.headers.items()}
        body = exc.read(MAXIMUM + 1)
        error = f'http-{exc.code}'
    except Exception as exc:
        error = type(exc).__name__
    return {
        'requested_url': url,
        'final_url': final_url,
        'http_code': status,
        'headers': headers,
        'response_bytes': len(body),
        'response_sha256': sha(body),
        'elapsed_ms': round((time.monotonic() - started) * 1000),
        'error': error,
    }, body


def main() -> None:
    need(not OUTPUT.exists(), 'output-exists')
    paths = {
        'r45_result': R45_RESULT,
        'r45_freeze': R45_FREEZE,
        'r45_doc': R45_DOC,
        'protocol': PROTOCOL,
    }
    for name, path in paths.items():
        need(sha(path.read_bytes()) == PINS[name], f'input-pin-drift:{name}')
    prior = json.loads(R45_RESULT.read_bytes())
    rows = prior['rows']
    need(prior['status'] == 'terminal-source-log-supply-deficit' and
         prior['attempted'] == 29 and prior['admitted'] == 23 and
         [row['queue_index'] for row in rows] == list(range(11, 40)) and
         prior['gold_opened'] is False and prior['model_calls'] == 0,
         'r45-shape-drift')

    OUTPUT.mkdir(parents=True, mode=0o700)
    save_json('RUN-FREEZE.json', {
        'schema_version': 'are.g01-guarded-confirm-r46-official-api-freeze/v1',
        'input_sha256': PINS,
        'runner_sha256': sha(Path(__file__).read_bytes()),
        'queue_indices': list(range(11, 40)),
        'attempts': 29,
        'required_source_and_log_passers': 24,
        'minimum_request_start_interval_seconds': MINIMUM_INTERVAL,
        'maximum_response_bytes': MAXIMUM,
        'automatic_retries': 0,
        'gold_opened': False,
        'passing_source_opened': False,
        'patches_opened': False,
        'model_calls': 0,
    })

    receipts = []
    last_start = None
    for row in rows:
        if last_start is not None:
            wait = MINIMUM_INTERVAL - (time.monotonic() - last_start)
            if wait > 0:
                time.sleep(wait)
        last_start = time.monotonic()
        api, body = fetch(row['job_id'])
        q = row['queue_index']
        response_file = f'API-RESPONSE-Q{q:02d}.json.gz'
        save_bytes(response_file, gzip.compress(body, compresslevel=6, mtime=0))

        decoded = None
        json_ok = False
        log_bytes = b''
        try:
            decoded = json.loads(body.decode('utf-8', errors='strict'))
            json_ok = (isinstance(decoded, dict) and
                       isinstance(decoded.get('build_log'), str))
            if json_ok:
                log_bytes = decoded['build_log'].encode('utf-8', errors='strict')
        except (UnicodeDecodeError, json.JSONDecodeError, UnicodeEncodeError):
            pass
        log_file = f'API-LOG-Q{q:02d}.txt.gz'
        save_bytes(log_file, gzip.compress(log_bytes, compresslevel=6, mtime=0))

        expected = row['raw_head']['content_length']
        content_type = api['headers'].get('content-type', '')
        transport_ok = (
            api['http_code'] == 200 and api['error'] is None and
            api['final_url'] == api['requested_url'] and
            content_type.lower().startswith('application/json') and
            0 < api['response_bytes'] <= MAXIMUM and json_ok and
            len(log_bytes) == expected
        )
        https_control = None
        if row['admitted']:
            prior_body = gzip.decompress((R45 / row['log']['body_file']).read_bytes())
            https_control = {
                'bytes': len(prior_body),
                'sha256': sha(prior_body),
                'exact_match': log_bytes == prior_body,
            }
        control_ok = bool(https_control is None or https_control['exact_match'])
        source_ok = (row['source']['exit_code'] == 0 and
                     row['source']['http_code'] == 200)
        admitted = bool(source_ok and transport_ok and control_ok)
        receipt = {
            'schema_version': 'are.g01-guarded-confirm-r46-official-api-case/v1',
            'queue_index': q,
            'repo': row['repo'],
            'job_id': row['job_id'],
            'source_ok': source_ok,
            'expected_log_bytes': expected,
            'api': api,
            'api_response_file': response_file,
            'api_log_file': log_file,
            'api_log_bytes': len(log_bytes),
            'api_log_sha256': sha(log_bytes),
            'json_ok': json_ok,
            'transport_ok': transport_ok,
            'https_control': https_control,
            'control_ok': control_ok,
            'admitted': admitted,
        }
        save_json(f'CASE-Q{q:02d}.json', receipt)
        receipts.append(receipt)
        print(json.dumps({
            'queue_index': q,
            'repo': row['repo'],
            'source_ok': source_ok,
            'exact_length': len(log_bytes) == expected,
            'control_match': None if https_control is None else
                             https_control['exact_match'],
            'admitted': admitted,
        }, sort_keys=True), flush=True)

    controls = [row for row in receipts if row['https_control'] is not None]
    global_control_ok = (len(controls) == 23 and
                         all(row['https_control']['exact_match'] for row in controls))
    passers = ([row for row in receipts if row['admitted']]
               if global_control_ok else [])
    selected = passers[:24]
    sufficient = len(passers) >= 24
    result = {
        'schema_version': 'are.g01-guarded-confirm-r46-official-api-result/v1',
        'status': ('cross-validated-log-supply-sufficient' if sufficient else
                   'terminal-official-api-validation-failed'),
        'input_sha256': PINS,
        'attempted': len(receipts),
        'https_controls': len(controls),
        'https_controls_exact': sum(
            row['https_control']['exact_match'] for row in controls),
        'global_control_ok': global_control_ok,
        'admitted': len(passers),
        'required': 24,
        'sufficient': sufficient,
        'selected_queue_indices': [row['queue_index'] for row in selected],
        'selected_repositories': [row['repo'] for row in selected],
        'requests': len(receipts),
        'automatic_retries': 0,
        'gold_opened': False,
        'passing_source_opened': False,
        'patches_opened': False,
        'model_calls': 0,
        'rows': receipts,
        'claim_ceiling': (
            'Cross-validated score-blind source/log availability only; no '
            'label, ranking, model, score, efficiency, or superiority result.'
        ),
    }
    encoded = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    save_bytes('RESULT.json', encoded)
    print(json.dumps({
        'status': result['status'],
        'attempted': result['attempted'],
        'https_controls_exact': result['https_controls_exact'],
        'admitted': result['admitted'],
        'required': result['required'],
        'result_sha256': sha(encoded),
    }, sort_keys=True))
    if not sufficient:
        raise SystemExit(2)


if __name__ == '__main__':
    main()
