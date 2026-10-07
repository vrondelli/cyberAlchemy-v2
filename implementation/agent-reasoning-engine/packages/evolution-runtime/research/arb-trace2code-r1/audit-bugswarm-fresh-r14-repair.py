#!/usr/bin/env python3
"""Independently replay r14 queue decisions and cold evidence byte identities."""

from __future__ import annotations

import gzip
import hashlib
import json
import os
from pathlib import Path


BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
ROOT = BASE / 'fresh-r11/repair-r14'
RUN = ROOT / 'run'
OUTPUT = ROOT / 'AUDIT.json'
PINS = {
    'queue': '1b89ccc6cbc1b82874909c684888af61e35b42e03802269e4343875612cb43bd',
    'r13': '8359293ecb0b33b1b9bc6a24c686c270eb591134afecd6f1db5e4400fd683569',
    'r12': 'da3767a0e46462db27e0891587ad3562ad4a5384b6ae6eeb688d8ed258a04585',
    'freeze': '7749497d013742ebc3e2e3dfa87817552d6004803ef76cf440a956dda321a08b',
    'result': '2f266bba198a1a72f2fdf55418c0ad284cb02a06f8e262f0dcd6d5a21e4ebcc1',
}
LIMIT = 8 * 1024 * 1024


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(ok: bool, reason: str) -> None:
    if not ok:
        raise SystemExit(reason)


def body(root: Path, receipt: dict, key: str) -> bytes:
    filename = receipt['body_file']
    need(isinstance(filename, str) and filename.endswith('.gz') and
         '/' not in filename, f'unsafe-evidence-name:{key}')
    blob = gzip.decompress((root / filename).read_bytes())
    need(len(blob) == receipt['bytes'] and sha(blob) == receipt['sha256'],
         f'evidence-byte-drift:{key}')
    return blob


def main() -> None:
    paths = {'queue': ROOT / 'QUEUE.json',
             'r13': BASE / 'fresh-r11/header-r13/RESULT.json',
             'r12': BASE / 'fresh-r11/preflight-r12/PREFLIGHT-RESULT.json',
             'freeze': RUN / 'RUN-FREEZE.json',
             'result': RUN / 'RESULT.json'}
    need(not OUTPUT.exists(), 'audit-exists')
    for name, path in paths.items():
        need(sha(path.read_bytes()) == PINS[name], f'input-pin-drift:{name}')
    queue = json.loads(paths['queue'].read_bytes())
    r13 = json.loads(paths['r13'].read_bytes())
    r12 = json.loads(paths['r12'].read_bytes())
    result = json.loads(paths['result'].read_bytes())
    need(result['status'] == 'source-log-available' and
         result['filled_slots'] == 24 and result['retained_slots'] == 11 and
         result['replacement_attempts'] == 22 and
         len(result['slots']) == len(queue['original_24']) ==
         len(r13['rows']) == len(r12['rows']) == 24 and
         result['gold_opened'] is False and result['model_calls'] == 0,
         'denominator-or-status-drift')
    next_index = {'Python': 0, 'Java': 0}
    retained = replacements = attempts = 0
    final_repos = []
    attempted_repos = set()
    for ordinal, (slot, original, r13_row, r12_row) in enumerate(zip(
            result['slots'], queue['original_24'], r13['rows'], r12['rows']), 1):
        need(slot['slot'] == original['ordinal'] == r13_row['ordinal'] ==
             r12_row['ordinal'] == ordinal and
             slot['original_repo'] == original['repo'] == r13_row['repo'] ==
             r12_row['repo'], f'slot-identity:{ordinal}')
        slot_data = (RUN / f'SLOT-{ordinal:02d}.json').read_bytes()
        need(json.loads(slot_data) == slot, f'slot-receipt-drift:{ordinal}')
        final = slot['final']
        need(final is not None and final['language'] == original['language'],
             f'final-shape:{ordinal}')
        final_repos.append(final['repo'].lower())
        if slot['retained']:
            retained += 1
            need(r13_row['admitted'] is True and not slot['attempts'] and
                 final['repo'] == original['repo'] and
                 final['failed_commit'] == original['failure_commit'] and
                 final['job_id'] == original['failure_job_id'] and
                 final['log_sha256'] == r13_row['log']['sha256'] and
                 final['log_bytes'] == r13_row['log']['bytes'],
                 f'retained-identity:{ordinal}')
            source = (BASE / ('fresh-r11/preflight-r12' if
                             r13_row['log_source'] == 'r12-reused' else
                             'fresh-r11/header-r13'))
            blob = body(source, r13_row['log'], f'retained-log:{ordinal}')
            need(len(blob) == r12_row['raw_head']['content_length'] and
                 r13_row['log']['http_code'] == 200 and
                 r13_row['log']['exit_code'] == 0 and
                 r13_row['log']['utf8'] is True,
                 f'retained-log-integrity:{ordinal}')
            continue
        replacements += 1
        need(r13_row['admitted'] is False and slot['attempts'],
             f'replacement-required:{ordinal}')
        candidate_receipts = []
        for selected in slot['attempts']:
            language = original['language']
            index = next_index[language]
            candidate = queue['queues'][language][index]
            next_index[language] += 1
            attempts += 1
            need(selected['queue_index'] == candidate['queue_index'] == index + 1 and
                 selected['repo'] == candidate['repo'] and
                 candidate['repo'].lower() not in attempted_repos,
                 f'queue-order:{ordinal}:{index}')
            attempted_repos.add(candidate['repo'].lower())
            receipt_path = RUN / selected['receipt']
            receipt = json.loads(receipt_path.read_bytes())
            need(receipt['slot'] == ordinal and
                 receipt['queue_index'] == candidate['queue_index'] and
                 receipt['repo'] == candidate['repo'] and
                 receipt['failed_commit'] == candidate['failure_commit'] and
                 receipt['job_id'] == candidate['failure_job_id'] and
                 receipt['admitted'] == selected['admitted'],
                 f'attempt-identity:{ordinal}:{index}')
            body(RUN, receipt['source'], f'source-head:{ordinal}:{index}')
            page_blob = body(RUN, receipt['page'], f'page:{ordinal}:{index}')
            body(RUN, receipt['raw_head'], f'raw-head:{ordinal}:{index}')
            need((receipt['page']['identity_match'] is False or
                  ('View raw log' in page_blob.decode('utf-8', errors='strict'))),
                 f'page-marker:{ordinal}:{index}')
            log = receipt['log']
            if log is not None:
                log_blob = body(RUN, log, f'log:{ordinal}:{index}')
                need(log['utf8'] == bool(log_blob.decode('utf-8', errors='strict') is not None),
                     f'log-utf8:{ordinal}:{index}')
            complete = bool(receipt['source']['exit_code'] == 0 and
                            receipt['source']['http_code'] == 200 and
                            receipt['page']['http_code'] == 200 and
                            receipt['page']['identity_match'] and
                            receipt['raw_head']['exit_code'] == 0 and
                            receipt['raw_head']['http_code'] == 200 and
                            isinstance(receipt['raw_head']['content_length'], int) and
                            0 < receipt['raw_head']['content_length'] <= LIMIT and
                            log is not None and log['exit_code'] == 0 and
                            log['http_code'] == 200 and
                            log['bytes'] == receipt['raw_head']['content_length'] and
                            not log['too_large'] and log['utf8'])
            need(complete == receipt['admitted'], f'admission-replay:{ordinal}:{index}')
            candidate_receipts.append(receipt)
        need(all(not item['admitted'] for item in candidate_receipts[:-1]) and
             candidate_receipts[-1]['admitted'] is True and
             final['repo'] == candidate_receipts[-1]['repo'] and
             final['failed_commit'] == candidate_receipts[-1]['failed_commit'] and
             final['job_id'] == candidate_receipts[-1]['job_id'] and
             final['log_sha256'] == candidate_receipts[-1]['log']['sha256'] and
             final['log_bytes'] == candidate_receipts[-1]['log']['bytes'],
             f'first-success-final:{ordinal}')
    need(retained == 11 and replacements == 13 and attempts == 22 and
         len(set(final_repos)) == 24 and
         next_index == result['queue_consumed'] == {'Python': 5, 'Java': 17},
         'aggregate-replay-drift')
    audit = {'schema_version': 'are.g01-fresh-r14-repair-audit/v1',
             'input_sha256': PINS, 'auditor_sha256': sha(Path(__file__).read_bytes()),
             'slots': 24, 'retained': retained, 'replacements': replacements,
             'attempts': attempts, 'queue_consumed': next_index,
             'unique_final_repositories': len(set(final_repos)),
             'all_evidence_byte_hashes_verified': True,
             'all_admission_decisions_replayed': True,
             'gold_opened': False, 'model_calls': 0,
             'claim_ceiling': 'Source/log availability only; no label or ranking score.'}
    encoded = (json.dumps(audit, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(encoded)
    print(json.dumps({'slots': 24, 'replacements': replacements,
                      'attempts': attempts, 'audit_sha256': sha(encoded)}))


if __name__ == '__main__':
    main()
