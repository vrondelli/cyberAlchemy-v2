#!/usr/bin/env python3
"""VPS-only source/log repair; never reads passing source, labels, or scores."""

from __future__ import annotations

import gzip
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time


ROOT = Path('/opt/are-benchmark-runs/g01-bugswarm-graph-confirm-r2-repair')
R1 = Path('/opt/are-benchmark-runs/g01-bugswarm-graph-confirm-r1-preflight')
MANIFEST = 'REPAIR-MANIFEST-R2.json'
MANIFEST_SHA = '1d02d5f561de98088e448a2abc6b7b2ce4df4f8cd6b1fe9e97266ed7383e945e'
LIMIT = 8 * 1024 * 1024
MARKER = b'\nARE_HTTP_STATUS:'


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(condition: bool, reason: str) -> None:
    if not condition:
        raise SystemExit(reason)


def save(name: str, data: bytes) -> None:
    fd = os.open(ROOT / name, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)


def save_json(name: str, value: object) -> None:
    save(name, (json.dumps(value, sort_keys=True, indent=2) + '\n').encode())


def curl(url: str, *, head: bool = False, limit: int = LIMIT) -> tuple[dict, bytes]:
    args = ['/usr/bin/curl', '--silent', '--show-error', '--location',
            '--proto', '=https', '--tlsv1.2', '--connect-timeout', '10',
            '--max-time', '45', '--write-out', '\nARE_HTTP_STATUS:%{http_code}']
    if head:
        args += ['--head']
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
    job, repo = row['job_id'], re.escape(row['repo'])
    github = bool(re.search(rf'<li>\s*GitHub Actions job {job}\s*</li>', header)
                  and re.search(rf'https://github\.com/{repo}/actions/runs/[^\s\'\"]+/job/{job}', header))
    travis = bool(re.search(rf'<li>\s*Travis-CI job {job}\s*</li>', header)
                  and re.search(rf'https://(?:app\.travis-ci\.com|travis-ci\.org)/{repo}/jobs/{job}', header))
    return github or travis, ('github-actions' if github else 'travis-ci' if travis else None)


def preserve(name: str, body: bytes) -> str | None:
    if not body:
        return None
    filename = name + '.gz'
    save(filename, gzip.compress(body, compresslevel=6, mtime=0))
    return filename


def main() -> None:
    need(len(sys.argv) == 1 and not (ROOT / 'RUN-FREEZE.json').exists(), 'prior-run-or-arguments')
    manifest_bytes = (ROOT / MANIFEST).read_bytes()
    need(sha(manifest_bytes) == MANIFEST_SHA, 'manifest-pin-drift')
    manifest = json.loads(manifest_bytes)
    need(len(manifest['slots']) == 24 and manifest['queue_cap_per_language'] == 60
         and len(manifest['queues']['Python']) == 46 and len(manifest['queues']['Java']) == 46
         and not manifest['gold_opened'] and manifest['model_calls'] == 0,
         'manifest-shape-drift')
    save_json('RUN-FREEZE.json', {'schema_version': 'are.g01-confirm-repair-freeze-r2/v1',
              'manifest_sha256': MANIFEST_SHA, 'runner_sha256': sha(Path(__file__).read_bytes()),
              'max_log_bytes': LIMIT, 'automatic_retries': 0,
              'tls_validation': True, 'gold_opened': False, 'model_calls': 0})
    rows = []
    replacements = []
    queue_index = {'Python': 0, 'Java': 0}
    occupied = set()
    for slot in manifest['slots']:
        num = slot['ordinal']
        need(num == len(rows) + 1, 'slot-order-drift')
        record = {'slot': num, 'language': slot['language'], 'original_repo': slot['repo'],
                  'original_kind': slot['kind'], 'retained': False, 'attempts': []}
        if slot['kind'] != 'replacement_required':
            source = R1 / f"HTTPS-LOG-{num:02d}.txt"
            blob = source.read_bytes()
            need(len(blob) == slot['r1_log_bytes'] and sha(blob) == slot['r1_log_sha256'],
                 f'r1-cold-source-drift:{num}')
            head, header = curl(f"https://www.bugswarm.org/artifact-logs/{slot['job_id']}/raw/",
                                head=True, limit=65536)
            length = content_length(header)
            record['raw_head'] = {**head, 'content_length': length}
            page_ok = slot['kind'] == 'r1_admitted_verify_head'
            if slot['kind'] == 'page_repair_then_head':
                page, body = curl(f"https://www.bugswarm.org/artifact-logs/{slot['job_id']}/",
                                  limit=LIMIT)
                matched, provider = page_identity(body, slot)
                record['page'] = {**page, 'identity_match': matched, 'provider': provider,
                                  'body_file': preserve(f'ORIGINAL-PAGE-{num:02d}', body)}
                page_ok = page['exit_code'] == 0 and page['http_code'] == 200 and not page['too_large'] and matched
            record['retained'] = (head['exit_code'] == 0 and head['http_code'] == 200
                                  and length == slot['r1_log_bytes'] and page_ok)
        if record['retained']:
            record['final'] = {key: slot[key] for key in
                               ('language', 'repo', 'image_tag', 'failed_commit', 'job_id')}
            record['final']['log_sha256'] = slot['r1_log_sha256']
            record['final']['log_bytes'] = slot['r1_log_bytes']
            occupied.add(slot['repo'].lower())
        else:
            language = slot['language']
            queue = manifest['queues'][language]
            while queue_index[language] < len(queue):
                candidate = queue[queue_index[language]]
                queue_index[language] += 1
                need(candidate['repo'].lower() not in occupied and candidate['language'] == language,
                     'queue-overlap-or-language-drift')
                tag = f"S{num:02d}-A{queue_index[language]:02d}-{language[0]}"
                source, source_head = curl(
                    f"https://codeload.github.com/{candidate['repo']}/tar.gz/{candidate['failed_commit']}",
                    head=True, limit=65536)
                raw_head, header = curl(
                    f"https://www.bugswarm.org/artifact-logs/{candidate['job_id']}/raw/",
                    head=True, limit=65536)
                expected = content_length(header)
                page, page_body = curl(
                    f"https://www.bugswarm.org/artifact-logs/{candidate['job_id']}/",limit=LIMIT)
                matched, provider = page_identity(page_body, candidate)
                log, log_body = curl(
                    f"https://www.bugswarm.org/artifact-logs/{candidate['job_id']}/raw/",limit=LIMIT)
                try:
                    log_body.decode('utf-8', errors='strict')
                    utf8 = True
                except UnicodeDecodeError:
                    utf8 = False
                attempt = {'queue_index': queue_index[language],
                           'source_order_position': candidate['source_order_position'],
                           'repo': candidate['repo'], 'image_tag': candidate['image_tag'],
                           'failed_commit': candidate['failed_commit'], 'job_id': candidate['job_id'],
                           'source': source, 'source_header_file': preserve(f'{tag}-SOURCE-HEAD', source_head),
                           'raw_head': {**raw_head, 'content_length': expected},
                           'raw_header_file': preserve(f'{tag}-RAW-HEAD', header),
                           'page': {**page, 'identity_match': matched, 'provider': provider,
                                    'body_file': preserve(f'{tag}-PAGE', page_body)},
                           'log': {**log, 'utf8': utf8,
                                   'body_file': preserve(f'{tag}-LOG', log_body)}}
                attempt['admitted'] = (source['exit_code'] == 0 and source['http_code'] == 200
                    and raw_head['exit_code'] == 0 and raw_head['http_code'] == 200
                    and expected is not None and 0 < expected <= LIMIT
                    and page['exit_code'] == 0 and page['http_code'] == 200 and not page['too_large']
                    and matched and log['exit_code'] == 0 and log['http_code'] == 200
                    and not log['too_large'] and len(log_body) == expected and utf8)
                record['attempts'].append(attempt)
                save_json(f'ATTEMPT-{tag}.json', attempt)
                print(json.dumps({'slot': num, 'candidate': candidate['repo'],
                                  'source_http': source['http_code'], 'log_bytes': log['bytes'],
                                  'log_exit': log['exit_code'], 'admitted': attempt['admitted']}), flush=True)
                if attempt['admitted']:
                    record['final'] = {key: candidate[key] for key in
                                       ('language', 'repo', 'image_tag', 'failed_commit', 'job_id',
                                        'source_order_position')}
                    record['final']['log_sha256'] = log['sha256']
                    record['final']['log_bytes'] = log['bytes']
                    occupied.add(candidate['repo'].lower())
                    replacements.append({'slot': num, 'repo': candidate['repo']})
                    break
        save_json(f'SLOT-{num:02d}.json', record)
        rows.append(record)
        print(json.dumps({'slot': num, 'retained': record['retained'],
                          'filled': 'final' in record, 'attempts': len(record['attempts'])}), flush=True)
    final = [record.get('final') for record in rows]
    all_filled = len(final) == 24 and all(final)
    unique = all_filled and len({row['repo'].lower() for row in final}) == 24
    result = {'schema_version': 'are.g01-confirm-repair-result-r2/v1',
              'attempted_slots': len(rows), 'filled_slots': sum(bool(row) for row in final),
              'all_24_filled': bool(all_filled and unique), 'manifest_sha256': MANIFEST_SHA,
              'queue_consumed': queue_index, 'replacements': replacements,
              'gold_opened': False, 'model_calls': 0, 'rows': rows}
    save_json('REPAIR-RESULT.json', result)
    print(json.dumps({'attempted_slots': result['attempted_slots'],
                      'filled_slots': result['filled_slots'],
                      'all_24_filled': result['all_24_filled'],
                      'queue_consumed': queue_index,
                      'result_sha256': sha((ROOT / 'REPAIR-RESULT.json').read_bytes())}),flush=True)
    if not result['all_24_filled']:
        sys.exit(2)


if __name__ == '__main__':
    main()
