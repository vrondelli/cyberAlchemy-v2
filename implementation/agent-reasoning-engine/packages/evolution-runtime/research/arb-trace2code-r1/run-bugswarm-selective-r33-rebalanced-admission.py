#!/usr/bin/env python3
"""Admit the fixed 14-Python/10-Java G01 r33 successor population."""

from __future__ import annotations

import gzip
import hashlib
import importlib.util
import json
import os
from pathlib import Path


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
ROOT = BASE / 'selective-r28'
OUTPUT = ROOT / 'rebalanced-r33'
QUEUE = ROOT / 'repair-r32/QUEUE.json'
R29 = ROOT / 'preflight-r29/RESULT.json'
R31 = ROOT / 'alternate-client-r31/RESULT.json'
PROTOCOL = HERE.parents[1] / 'evidence/G01-BUGSWARM-SELECTIVE-R33-REBALANCED-ADMISSION-PROTOCOL-2026-10-04.md'
R29_HELPER = HERE / 'preflight-bugswarm-selective-r29.py'
R31_HELPER = HERE / 'repair-bugswarm-selective-r31-alternate-client.py'
IDENTITY_HELPER = HERE / 'preflight-bugswarm-fresh-r11.py'
PINS = {
    'queue': '42fa759dc368d5b0c88a3029474ca36ebce75c0e7a57352a7eaa1131485d225e',
    'r29': 'f3d63d9c43467d0e8ba13055e5207206269a6be17978cdd8da58018154460017',
    'r31': '6238f34ef6698dcce62874d19f1177e55e6b8c33f114b154893606fc45d1dbb0',
    'protocol': '2cf4d8b1b30553fa00669f26b03b972d1476e90f27ac35e08f94c4e8dd00405f',
    'r29_helper': 'cccc9b0f998b5d6b7e0354899e22172aa67b732604b2a7c3c1222ddf3dbc6787',
    'r31_helper': 'bc202982f7e37b3da2784f3768c11246692938aa5dce453215f52b0b6e630b9b',
    'identity_helper': '2c13af917a8cfdc7e5aa5ea8f8c29f246deaac77bc9ada0395b61e8394d177bc',
}
LIMIT = 8 * 1024 * 1024
TARGETS = [
    (5, 'Python'), (6, 'Python'), (7, 'Python'), (12, 'Python'),
    (15, 'Java'), (18, 'Java'), (19, 'Java'),
    (21, 'Python'), (22, 'Python'),
]


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


def import_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    need(spec is not None and spec.loader is not None, f'helper-unavailable:{name}')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def preserve(name: str, body: bytes) -> str:
    filename = name + '.gz'
    save(filename, gzip.compress(body, compresslevel=6, mtime=0))
    return filename


def attempt(slot: int, candidate: dict, r29: object, r31: object,
            identity: object) -> tuple[dict, int]:
    language = candidate['language']
    q = candidate['queue_index']
    prefix = f'S{slot:02d}-{language[0]}Q{q:02d}'
    repo = candidate['repo']
    commit = candidate['failure_commit']
    job = candidate['failure_job_id']
    source_url = f'https://codeload.github.com/{repo}/tar.gz/{commit}'
    page_url = f'https://www.bugswarm.org/artifact-logs/{job}/'
    raw_url = page_url + 'raw/'
    calls = 0

    source, source_body = r29.corrected_head(source_url)
    calls += 1
    source['body_file'] = preserve(prefix + '-SOURCE-HEAD', source_body)
    page, page_body = r29.fetch_page_prefix(page_url)
    calls += 1
    page['body_file'] = preserve(prefix + '-PAGE-HEADER', page_body)
    matched, provider = identity.page_identity(page_body, candidate)
    page['identity_match'] = matched
    page['provider'] = provider
    raw_head, header = r29.corrected_head(raw_url)
    calls += 1
    raw_head['body_file'] = preserve(prefix + '-RAW-HEAD', header)
    length = identity.content_length(header)
    raw_head['content_length'] = length

    source_ok = source['exit_code'] == 0 and source['http_code'] == 200
    page_ok = page['http_code'] == 200 and matched
    raw_head_ok = (raw_head['exit_code'] == 0 and raw_head['http_code'] == 200 and
                   isinstance(length, int) and 0 < length <= LIMIT)
    log = None
    body = b''
    if source_ok and page_ok and raw_head_ok:
        log, body = r31.fetch_once(raw_url, length)
        calls += 1
        log['body_file'] = preserve(prefix + '-HTTPS-LOG', body)
        header_length = log['headers'].get('content-length')
        try:
            log['parsed_content_length'] = int(header_length) if header_length else None
        except ValueError:
            log['parsed_content_length'] = None
        try:
            body.decode('utf-8', errors='strict')
            log['utf8'] = True
        except UnicodeDecodeError:
            log['utf8'] = False
        log['bytes'] = len(body)
        log['sha256'] = sha(body)
    log_ok = bool(log is not None and log['http_code'] == 200 and
                  log['final_url'] == raw_url and log['error'] is None and
                  log['parsed_content_length'] == length and
                  log['bytes'] == length and log['utf8'])
    admitted = bool(source_ok and page_ok and raw_head_ok and log_ok)
    row = {
        'schema_version': 'are.g01-selective-r33-admission-attempt/v1',
        'slot': slot,
        'queue_index': q,
        'language': language,
        'source_order_position': candidate['source_order_position'],
        'repo': repo,
        'image_tag': candidate['image_tag'],
        'failed_commit': commit,
        'job_id': job,
        'source': source,
        'page': page,
        'raw_head': raw_head,
        'log': log,
        'network_calls': calls,
        'admitted': admitted,
    }
    save_json(prefix + '-ATTEMPT.json', row)
    print(json.dumps({
        'slot': slot,
        'language': language,
        'queue_index': q,
        'repo': repo,
        'source_ok': source_ok,
        'page_ok': page_ok,
        'log_ok': log_ok,
        'admitted': admitted,
    }, sort_keys=True), flush=True)
    return row, calls


def main() -> None:
    need(not OUTPUT.exists(), 'output-exists')
    paths = {
        'queue': QUEUE,
        'r29': R29,
        'r31': R31,
        'protocol': PROTOCOL,
        'r29_helper': R29_HELPER,
        'r31_helper': R31_HELPER,
        'identity_helper': IDENTITY_HELPER,
    }
    for name, path in paths.items():
        need(sha(path.read_bytes()) == PINS[name], f'input-pin-drift:{name}')
    queue = json.loads(QUEUE.read_bytes())
    r29_result = json.loads(R29.read_bytes())
    r31_result = json.loads(R31.read_bytes())
    need(queue['status'] == 'terminal-metadata-shortage' and
         queue['failed_ordinals_by_language'] == {
             'Python': [5, 6, 7, 12],
             'Java': [15, 18, 19, 21, 22],
         } and len(queue['queues']['Python']) == 39 and
         len(queue['queues']['Java']) == 3 and
         queue['gold_opened'] is False and queue['model_calls'] == 0,
         'queue-shape-drift')
    admitted = {row['ordinal'] for row in r29_result['rows'] if row['admitted']}
    repaired = {row['ordinal'] for row in r31_result['rows'] if row['repaired']}
    retained = admitted | repaired
    need(len(retained) == 15 and repaired == {10}, 'retained-evidence-drift')

    r29 = import_module('g01_r33_r29', R29_HELPER)
    r31 = import_module('g01_r33_r31', R31_HELPER)
    identity = import_module('g01_r33_identity', IDENTITY_HELPER)
    OUTPUT.mkdir(parents=True, mode=0o700)
    save_json('RUN-FREEZE.json', {
        'schema_version': 'are.g01-selective-r33-admission-freeze/v1',
        'input_sha256': PINS,
        'runner_sha256': sha(Path(__file__).read_bytes()),
        'targets': [{'slot': slot, 'language': language}
                    for slot, language in TARGETS],
        'target_language_counts': {'Python': 14, 'Java': 10},
        'maximum_attempts': 42,
        'automatic_retries': 0,
        'maximum_log_bytes': LIMIT,
        'gold_opened': False,
        'model_calls': 0,
    })

    next_index = {'Python': 0, 'Java': 0}
    bindings: dict[int, dict | None] = {}
    attempt_records: list[dict] = []
    network_calls = 0
    for slot, language in TARGETS:
        candidates = queue['queues'][language]
        final = None
        while next_index[language] < len(candidates):
            candidate = candidates[next_index[language]]
            next_index[language] += 1
            need(candidate['language'] == language, f'queue-language:{slot}')
            record, calls = attempt(slot, candidate, r29, r31, identity)
            network_calls += calls
            attempt_records.append(record)
            if record['admitted']:
                final = record
                break
        bindings[slot] = final
        save_json(f'SLOT-{slot:02d}.json', {
            'slot': slot,
            'target_language': language,
            'filled': final is not None,
            'final': None if final is None else {
                'repo': final['repo'],
                'image_tag': final['image_tag'],
                'failed_commit': final['failed_commit'],
                'job_id': final['job_id'],
                'language': final['language'],
                'attempt_receipt': (
                    f'S{slot:02d}-{language[0]}Q{final["queue_index"]:02d}-ATTEMPT.json'
                ),
            },
        })

    final_rows = []
    for original in queue['original_24']:
        slot = original['ordinal']
        if slot in retained:
            source = r29_result['rows'][slot - 1]
            log_evidence = (f'preflight-r29/{source["log"]["body_file"]}'
                            if source['admitted'] else
                            'alternate-client-r31/LOG-10.gz')
            final_rows.append({
                'slot': slot,
                'retained': True,
                'repo': original['repo'],
                'image_tag': original['image_tag'],
                'failed_commit': original['failure_commit'],
                'job_id': original['failure_job_id'],
                'language': original['language'],
                'source_order_position': original['source_order_position'],
                'evidence': log_evidence,
            })
        else:
            replacement = bindings.get(slot)
            final_rows.append({
                'slot': slot,
                'retained': False,
                'repo': None if replacement is None else replacement['repo'],
                'image_tag': None if replacement is None else replacement['image_tag'],
                'failed_commit': None if replacement is None else replacement['failed_commit'],
                'job_id': None if replacement is None else replacement['job_id'],
                'language': dict(TARGETS).get(slot),
                'source_order_position': (None if replacement is None else
                                          replacement['source_order_position']),
                'evidence': (None if replacement is None else
                             f'S{slot:02d}-{replacement["language"][0]}Q{replacement["queue_index"]:02d}-ATTEMPT.json'),
            })

    filled = [row for row in final_rows if row['repo'] is not None]
    repos = [row['repo'].lower() for row in filled]
    language_counts = {
        language: sum(row['language'] == language for row in filled)
        for language in ('Python', 'Java')
    }
    all_filled = (len(filled) == len(repos) == len(set(repos)) == 24 and
                  language_counts == {'Python': 14, 'Java': 10})
    result = {
        'schema_version': 'are.g01-selective-r33-rebalanced-admission-result/v1',
        'status': 'source-log-admitted' if all_filled else 'terminal-unfilled',
        'input_sha256': PINS,
        'filled_slots': len(filled),
        'retained_slots': len(retained),
        'replacement_attempts': len(attempt_records),
        'queue_consumed': next_index,
        'language_counts': language_counts,
        'network_calls': network_calls,
        'automatic_retries': 0,
        'gold_opened': False,
        'passing_source_opened': False,
        'patches_opened': False,
        'model_calls': 0,
        'rows': final_rows,
        'claim_ceiling': (
            'Source/log admission for a rebalanced metadata population only; '
            'no ranking, score, efficiency, or superiority result.'
        ),
    }
    encoded = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    save('RESULT.json', encoded)
    print(json.dumps({
        'status': result['status'],
        'filled_slots': len(filled),
        'retained_slots': len(retained),
        'replacement_attempts': len(attempt_records),
        'queue_consumed': next_index,
        'language_counts': language_counts,
        'network_calls': network_calls,
        'result_sha256': sha(encoded),
    }, sort_keys=True))
    if not all_filled:
        raise SystemExit(2)


if __name__ == '__main__':
    main()
