#!/usr/bin/env python3
"""Evaluator-only target-existence census for G01 guarded confirmation."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import subprocess
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
RAW = BASE / '1.3.1-bugswarm.json'
R45 = BASE / 'guarded-confirm-r45/supply-r1/RESULT.json'
R46 = BASE / 'guarded-confirm-r46/official-api-r1/RESULT.json'
R48 = BASE / 'guarded-confirm-r48/code-projection-r1/RESULT.json'
R48_DOC = HERE.parents[1] / 'evidence/G01-BUGSWARM-GUARDED-CONFIRM-R48-PROJECTION-RESULT-2026-10-04.md'
PROTOCOL = HERE.parents[1] / 'evidence/G01-BUGSWARM-GUARDED-CONFIRM-R49-TARGET-CENSUS-PROTOCOL-2026-10-04.md'
OUTPUT = BASE / 'guarded-confirm-r49/target-census-r1'
PINS = {
    'raw': 'c952d8f7080e798cc66d903906d645c6dfc21f88789b1977e0d3e2d0f7c2192d',
    'r45': '26e9de47e18b74d5baf6737ef70fbc06f63b66c7a85940d76fca5c85e3798f09',
    'r46': '9fc37dd17929e486e9d2ba347ef66ca9fa37aef80a29b8ee84b384ea1bb9e451',
    'r48': 'bcc866fdae18d163850bbaa530a410e071e0e6948ff62710da3d22b6b915413b',
    'r48_doc': 'ab9e7fb5379f0fb5e12abb3491fc953e1f65e4a77697991d49c9202e5b6cfc6a',
    'protocol': '4a1a7bd42185aaedf8a7ae607253e7901c45e0a17343a6b3772a35597f9d439a',
}
MAXIMUM = 8 * 1024 * 1024


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


def fetch(url: str) -> tuple[int, bytes, dict[str, str]]:
    request = Request(url, headers={
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'ARE-G01-guarded-confirm-r49-target-census',
    })
    try:
        with urlopen(request, timeout=35) as response:
            return response.status, response.read(MAXIMUM + 1), dict(response.headers)
    except HTTPError as exc:
        return exc.code, exc.read(min(MAXIMUM, 65536)), dict(exc.headers)
    except (URLError, TimeoutError):
        return 0, b'', {}


def safe_python(path: object) -> bool:
    if not isinstance(path, str) or not path or '\\' in path:
        return False
    parsed = PurePosixPath(path)
    return (not parsed.is_absolute() and '..' not in parsed.parts and
            '.git' not in parsed.parts and path.endswith('.py'))


def main() -> None:
    need(not OUTPUT.exists(), 'output-exists')
    paths = {'raw': RAW, 'r45': R45, 'r46': R46, 'r48': R48,
             'r48_doc': R48_DOC, 'protocol': PROTOCOL}
    for name, path in paths.items():
        need(sha(path.read_bytes()) == PINS[name], f'input-pin-drift:{name}')
    raw = {row['image_tag']: row for row in json.loads(RAW.read_bytes())}
    r45 = {row['queue_index']: row for row in json.loads(R45.read_bytes())['rows']}
    r46 = json.loads(R46.read_bytes())
    records = json.loads(R48.read_bytes())['records']
    indices = r46['selected_queue_indices']
    need(len(raw) == 4388 and indices == list(range(11, 35)) and
         len(records) == 24 and r46['gold_opened'] is False and
         r46['model_calls'] == 0, 'input-shape-drift')

    OUTPUT.mkdir(parents=True, mode=0o700)
    save_json('FREEZE.json', {
        'schema_version': 'are.g01-guarded-confirm-r49-target-freeze/v1',
        'input_sha256': PINS,
        'runner_sha256': sha(Path(__file__).read_bytes()),
        'queue_indices': indices,
        'requests': 24,
        'automatic_retries': 0,
        'maximum_response_bytes': MAXIMUM,
        'passing_source_opened': False,
        'scores_computed': False,
        'model_calls': 0,
        'gold_export_to_vps': False,
    })

    results = []
    for slot, (index, source) in enumerate(zip(indices, records), 1):
        cohort = r45[index]
        metadata = raw[source['image_tag']]
        failed = source['failed_commit']
        passed = metadata['passed_job']['trigger_sha']
        need(source['slot'] == slot and source['repo'] == cohort['repo'] == metadata['repo'] and
             source['image_tag'] == cohort['image_tag'] and
             failed == cohort['failed_commit'] == metadata['failed_job']['trigger_sha'],
             f'identity:{slot}')
        tracked = set(subprocess.check_output(
            ['git', 'ls-files', '-z'], cwd=source['root'], timeout=30
        ).decode().split('\0'))
        tracked.discard('')
        url = (f"https://api.github.com/repos/{quote(source['repo'], safe='/')}/compare/"
               f"{failed}...{passed}")
        status, body, headers = fetch(url)
        response_file = None
        identity = complete = False
        changed = []
        changed_count = None
        if status == 200 and len(body) <= MAXIMUM:
            response_file = f'COMPARE-{slot:02d}.json'
            save(response_file, body)
            try:
                document = json.loads(body)
                files = document.get('files')
                commits = document.get('commits')
                changed_count = len(files) if isinstance(files, list) else None
                identity = (document.get('base_commit', {}).get('sha') == failed and
                            isinstance(commits, list) and bool(commits) and
                            commits[-1].get('sha') == passed)
                complete = (identity and isinstance(files, list) and len(files) < 300 and
                            not headers.get('Link'))
                if complete:
                    changed = sorted({
                        item.get('previous_filename', item.get('filename'))
                        for item in files
                        if safe_python(item.get('previous_filename', item.get('filename')))
                        and item.get('previous_filename', item.get('filename')) in tracked
                    })
            except (ValueError, TypeError, AttributeError, IndexError):
                pass
        reason = None
        if status != 200:
            reason = f'http-{status}'
        elif len(body) > MAXIMUM:
            reason = 'response-too-large'
        elif not identity:
            reason = 'comparison-identity-mismatch'
        elif not complete:
            reason = 'incomplete-file-list'
        elif not changed:
            reason = 'no-changed-python-path-present-in-failed-source'
        row = {
            'slot': slot, 'queue_index': index, 'id': source['image_tag'],
            'repo': source['repo'], 'failed_sha': failed, 'passed_sha': passed,
            'http_status': status, 'response_sha256': sha(body),
            'response_file': response_file, 'identity_matched': identity,
            'complete_file_list': complete, 'changed_file_count': changed_count,
            'source_gold_paths': changed if complete else None,
            'gold_admissible': reason is None, 'inadmissible_reason': reason,
            'rate_remaining': headers.get('X-RateLimit-Remaining'),
            'passing_source_opened': False, 'model_calls': 0,
            'gold_export_to_vps': False,
        }
        save_json(f'CASE-{slot:02d}.json', row)
        results.append(row)
        print(json.dumps({'slot': slot, 'queue_index': index, 'repo': source['repo'],
                          'status': status, 'targets': len(changed),
                          'admissible': row['gold_admissible'], 'reason': reason,
                          'rate_remaining': row['rate_remaining']}, sort_keys=True), flush=True)

    admitted = sum(row['gold_admissible'] for row in results)
    result = {
        'schema_version': 'are.g01-guarded-confirm-r49-target-result/v1',
        'input_sha256': PINS, 'accounted': len(results), 'admissible': admitted,
        'inadmissible': len(results) - admitted,
        'all_24_admissible': len(results) == admitted == 24,
        'automatic_retries': 0, 'passing_source_opened': False,
        'scores_computed': False, 'model_calls': 0, 'gold_export_to_vps': False,
        'results': results,
        'claim_ceiling': 'Target-existence eligibility only; no benchmark result.',
    }
    encoded = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    save('RESULT.json', encoded)
    print(json.dumps({'accounted': len(results), 'admitted': admitted,
                      'all_24_admissible': result['all_24_admissible'],
                      'result_sha256': sha(encoded)}, sort_keys=True))
    if not result['all_24_admissible']:
        raise SystemExit(2)


if __name__ == '__main__':
    main()
