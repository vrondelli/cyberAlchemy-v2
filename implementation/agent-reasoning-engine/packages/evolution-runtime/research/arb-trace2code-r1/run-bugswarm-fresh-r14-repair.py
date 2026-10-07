#!/usr/bin/env python3
"""Run the sealed r14 score-blind source/log replacement queue."""

from __future__ import annotations

import gzip
import hashlib
import importlib.util
import json
import os
from pathlib import Path


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
ROOT = BASE / 'fresh-r11/repair-r14'
OUTPUT = ROOT / 'run'
QUEUE = ROOT / 'QUEUE.json'
R13 = BASE / 'fresh-r11/header-r13/RESULT.json'
PROTOCOL = HERE.parents[1] / 'evidence/G01-BUGSWARM-FRESH-R14-SCORE-BLIND-REPAIR-PROTOCOL-2026-10-04.md'
HELPERS = {'r11': HERE / 'preflight-bugswarm-fresh-r11.py',
           'r12': HERE / 'preflight-bugswarm-fresh-r12.py',
           'r13': HERE / 'admit-bugswarm-fresh-r13-header.py'}
PINS = {'queue': '1b89ccc6cbc1b82874909c684888af61e35b42e03802269e4343875612cb43bd',
        'r13': '8359293ecb0b33b1b9bc6a24c686c270eb591134afecd6f1db5e4400fd683569',
        'protocol': '9cb5c8f811fe0c6d2d649317f444846c38fdb7cdf081a42707366d7314b09110',
        'r11': '2c13af917a8cfdc7e5aa5ea8f8c29f246deaac77bc9ada0395b61e8394d177bc',
        'r12': 'ef623bbd62a105e1b4b1f88e7d7685615aa45fc20527a7a911df95678f7a3510',
        'r13_helper': '20eb10ec2831d302234f051f2e35dc6f1f59a0138aba641a4257e10ca4a5fa18'}
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


def save_json(name: str, value: object) -> None:
    save(name, (json.dumps(value, sort_keys=True, indent=2) + '\n').encode())


def import_helper(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    need(spec is not None and spec.loader is not None, f'helper-unavailable:{name}')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def preserve(name: str, body: bytes) -> str:
    filename = name + '.gz'
    save(filename, gzip.compress(body, compresslevel=6, mtime=0))
    return filename


def attempt(slot: int, candidate: dict, r11: object, r12: object, r13: object) -> dict:
    q = candidate['queue_index']
    prefix = f'S{slot:02d}-Q{q:02d}'
    repo, commit, job = (candidate['repo'], candidate['failure_commit'],
                         candidate['failure_job_id'])
    source, source_body = r12.head(f'https://codeload.github.com/{repo}/tar.gz/{commit}')
    source['body_file'] = preserve(prefix + '-SOURCE-HEAD', source_body)
    page, page_body = r13.fetch_prefix(f'https://www.bugswarm.org/artifact-logs/{job}/')
    page['body_file'] = preserve(prefix + '-PAGE-HEADER', page_body)
    matched, provider = r13.complete_identity(page_body, candidate, r11)
    page['identity_match'], page['provider'] = matched, provider
    raw_head, header = r12.head(f'https://www.bugswarm.org/artifact-logs/{job}/raw/')
    raw_head['body_file'] = preserve(prefix + '-RAW-HEAD', header)
    length = r11.content_length(header)
    raw_head['content_length'] = length
    source_ok = source['exit_code'] == 0 and source['http_code'] == 200
    page_ok = page['http_code'] == 200 and matched
    head_ok = (raw_head['exit_code'] == 0 and raw_head['http_code'] == 200 and
               isinstance(length, int) and 0 < length <= LIMIT)
    log = None
    if source_ok and page_ok and head_ok:
        log, body = r11.curl(f'https://www.bugswarm.org/artifact-logs/{job}/raw/',
                            limit=LIMIT)
        log['body_file'] = preserve(prefix + '-HTTPS-LOG', body)
        try:
            body.decode('utf-8', errors='strict')
            log['utf8'] = True
        except UnicodeDecodeError:
            log['utf8'] = False
    log_ok = bool(log is not None and log['exit_code'] == 0 and
                  log['http_code'] == 200 and log['bytes'] == length and
                  not log['too_large'] and log['utf8'])
    admitted = bool(source_ok and page_ok and head_ok and log_ok)
    row = {'schema_version': 'are.g01-fresh-r14-repair-attempt/v1',
           'slot': slot, 'queue_index': q, 'language': candidate['language'],
           'source_order_position': candidate['source_order_position'],
           'repo': repo, 'image_tag': candidate['image_tag'],
           'failed_commit': commit, 'job_id': job,
           'source': source, 'page': page, 'raw_head': raw_head,
           'log': log, 'admitted': admitted}
    save_json(prefix + '-ATTEMPT.json', row)
    print(json.dumps({'slot': slot, 'language': candidate['language'],
                      'queue_index': q, 'repo': repo,
                      'source_ok': source_ok, 'page_ok': page_ok,
                      'log_ok': log_ok, 'admitted': admitted}), flush=True)
    return row


def main() -> None:
    need(not OUTPUT.exists(), 'output-exists')
    for name, path in (('queue', QUEUE), ('r13', R13), ('protocol', PROTOCOL),
                       ('r11', HELPERS['r11']), ('r12', HELPERS['r12']),
                       ('r13_helper', HELPERS['r13'])):
        need(sha(path.read_bytes()) == PINS[name], f'input-pin-drift:{name}')
    queue = json.loads(QUEUE.read_bytes())
    prior = json.loads(R13.read_bytes())
    need(len(queue['original_24']) == len(prior['rows']) == 24 and
         len(queue['queues']['Python']) == 56 and
         len(queue['queues']['Java']) == 32 and
         queue['failed_ordinals_by_language'] == {
             'Python': [1, 6, 8, 11, 12],
             'Java': [15, 17, 18, 20, 21, 22, 23, 24]} and
         queue['gold_opened'] is False and queue['model_calls'] == 0,
         'queue-shape-drift')
    r11 = import_helper('g01_r14_r11', HELPERS['r11'])
    r12 = import_helper('g01_r14_r12', HELPERS['r12'])
    r13 = import_helper('g01_r14_r13', HELPERS['r13'])
    OUTPUT.mkdir(parents=True, mode=0o700)
    save_json('RUN-FREEZE.json', {'schema_version': 'are.g01-fresh-r14-repair-freeze/v1',
              'input_sha256': PINS, 'runner_sha256': sha(Path(__file__).read_bytes()),
              'maximum_attempts': 88, 'automatic_retries': 0,
              'max_log_bytes': LIMIT, 'gold_opened': False, 'model_calls': 0})
    queue_next = {'Python': 0, 'Java': 0}
    slots, attempts = [], []
    for case, old in zip(queue['original_24'], prior['rows']):
        slot, language = case['ordinal'], case['language']
        need(slot == len(slots) + 1 == old['ordinal'] and
             case['repo'] == old['repo'], f'original-slot:{slot}')
        if old['admitted']:
            final = {'repo': case['repo'], 'image_tag': case['image_tag'],
                     'failed_commit': case['failure_commit'],
                     'job_id': case['failure_job_id'], 'language': language,
                     'log_sha256': old['log']['sha256'],
                     'log_bytes': old['log']['bytes'],
                     'evidence': 'fresh-r11/header-r13/RESULT.json'}
            record = {'slot': slot, 'retained': True,
                      'original_repo': case['repo'], 'attempts': [], 'final': final}
        else:
            used = []
            final = None
            candidates = queue['queues'][language]
            while queue_next[language] < len(candidates):
                candidate = candidates[queue_next[language]]
                queue_next[language] += 1
                row = attempt(slot, candidate, r11, r12, r13)
                attempts.append(row)
                used.append({'queue_index': candidate['queue_index'],
                             'repo': candidate['repo'], 'admitted': row['admitted'],
                             'receipt': f'S{slot:02d}-Q{candidate["queue_index"]:02d}-ATTEMPT.json'})
                if row['admitted']:
                    final = {'repo': candidate['repo'], 'image_tag': candidate['image_tag'],
                             'failed_commit': candidate['failure_commit'],
                             'job_id': candidate['failure_job_id'], 'language': language,
                             'log_sha256': row['log']['sha256'],
                             'log_bytes': row['log']['bytes'],
                             'evidence': used[-1]['receipt']}
                    break
            record = {'slot': slot, 'retained': False,
                      'original_repo': case['repo'], 'attempts': used, 'final': final}
        save_json(f'SLOT-{slot:02d}.json', record)
        slots.append(record)
        print(json.dumps({'slot': slot, 'retained': record['retained'],
                          'filled': final is not None,
                          'attempts': len(record['attempts'])}), flush=True)
        if final is None:
            break
    repos = [row['final']['repo'].lower() for row in slots if row['final'] is not None]
    all_filled = len(slots) == 24 and len(repos) == len(set(repos)) == 24
    result = {'schema_version': 'are.g01-fresh-r14-repair-result/v1',
              'status': 'source-log-available' if all_filled else 'terminal-unfilled',
              'slots_attempted': len(slots), 'filled_slots': len(repos),
              'retained_slots': sum(row['retained'] for row in slots),
              'replacement_attempts': len(attempts), 'queue_consumed': queue_next,
              'input_sha256': PINS, 'gold_opened': False, 'model_calls': 0,
              'slots': slots}
    save_json('RESULT.json', result)
    print(json.dumps({'status': result['status'], 'filled_slots': len(repos),
                      'retained_slots': result['retained_slots'],
                      'replacement_attempts': len(attempts),
                      'queue_consumed': queue_next,
                      'result_sha256': sha((json.dumps(result, sort_keys=True, indent=2) + '\n').encode())}))
    if not all_filled:
        raise SystemExit(2)


if __name__ == '__main__':
    main()
