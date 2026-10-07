#!/usr/bin/env python3
"""Evaluator-only HTTPS GitHub compare labels after G01 prediction seal."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import subprocess
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
R4 = BASE / 'graph-confirm-r4'
OUTPUT = R4 / 'evaluator-only/github-compare-r8'
PINS = {
    'predictions': 'de79a4336d8e8830d027e037b492e816caac452c7a38e0b0edca941cb1b4c674',
    'prediction_seal': '63142b1acdcd2b7eba3b1a32e5e618ad77656de987c5adfd75b75561a9a8c4a3',
    'source': '3eea3878d6769be39a88c98473cfc7eb0c019e4e33f82b665b7b18271dda4e4a',
    'cohort': 'a55087a01c1b157ea7fcd6dfa4327037a3e4cb13c72df5e0c31b44d80513c22c',
    'raw': 'c952d8f7080e798cc66d903906d645c6dfc21f88789b1977e0d3e2d0f7c2192d',
}
MAX_BYTES = 8 * 1024 * 1024


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(condition: bool, reason: str) -> None:
    if not condition:
        raise SystemExit(reason)


def save(path: Path, data: bytes) -> None:
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)


def encoded(value: object) -> bytes:
    return (json.dumps(value, sort_keys=True, indent=2) + '\n').encode()


def safe_source(path: object, language: str) -> bool:
    if not isinstance(path, str) or not path or path.startswith('/') or '\\' in path:
        return False
    parts = path.split('/')
    if any(part in ('', '.', '..') for part in parts):
        return False
    if not path.endswith('.py' if language == 'Python' else '.java'):
        return False
    lower = [part.lower() for part in parts]
    base = lower[-1]
    return not (any(part in ('test', 'tests', 'testing', 'testdata', 'fixtures',
                            'examples', 'docs') for part in lower[:-1]) or
                base.startswith('test_') or base.endswith('_test.py') or
                base.endswith('test.java') or base.endswith('tests.java'))


def fetch(url: str) -> tuple[int, bytes, dict[str, str]]:
    request = Request(url, headers={'Accept': 'application/vnd.github+json',
                                    'User-Agent': 'ARE-G01-confirm-evaluator/1'})
    try:
        with urlopen(request, timeout=35) as response:
            return response.status, response.read(MAX_BYTES + 1), dict(response.headers)
    except HTTPError as error:
        return error.code, error.read(min(MAX_BYTES, 65536)), dict(error.headers)
    except (URLError, TimeoutError):
        return 0, b'', {}


def main() -> None:
    inputs = {
        'predictions': R4 / 'predictions-r8/PREDICTIONS.jsonl',
        'prediction_seal': R4 / 'predictions-r8/PREDICTION-SEAL.json',
        'source': R4 / 'code-only/RESULT.json',
        'cohort': BASE / 'graph-confirm-r1/source-only/g01-bugswarm-graph-confirm-r2-repair/REPAIR-RESULT.json',
        'raw': BASE / '1.3.1-bugswarm.json',
    }
    need(not OUTPUT.exists() and
         all(sha(path.read_bytes()) == PINS[name] for name, path in inputs.items()),
         'output-exists-or-input-pin-drift')
    predictions = [json.loads(line) for line in inputs['predictions'].read_text().splitlines()]
    seal = json.loads(inputs['prediction_seal'].read_bytes())
    sources = json.loads(inputs['source'].read_bytes())['records']
    cohort = json.loads(inputs['cohort'].read_bytes())['rows']
    raw = {row['image_tag']: row for row in json.loads(inputs['raw'].read_bytes())}
    need(len(predictions) == len(sources) == len(cohort) == 24 and
         seal['cases'] == 24 and seal['predictions_sha256'] == PINS['predictions'] and
         seal['gold_opened'] is False and len(raw) == 4388,
         'denominator-or-prediction-seal-drift')
    OUTPUT.mkdir(parents=True, mode=0o700)
    save(OUTPUT / 'LABEL-FREEZE.json', encoded({
        'schema_version': 'are.g01-confirm-https-label-freeze-r8/v1',
        'input_sha256': PINS, 'script_sha256': sha(Path(__file__).read_bytes()),
        'endpoint': 'https://api.github.com/repos/{repo}/compare/{failed}...{passed}',
        'maximum_requests': 24, 'automatic_retries': 0,
        'rule': 'exact identity, complete nonpaginated comparison, safe changed old source path present in failed code root; source-only ranking already sealed',
        'gold_export_to_vps': False}))
    rows = []
    for ordinal, (prediction, src, slot) in enumerate(zip(predictions, sources, cohort), 1):
        final = slot['final']
        tag = final['image_tag']
        meta = raw[tag]
        failed = final['failed_commit']
        passed = meta['passed_job']['trigger_sha']
        need(prediction['ordinal'] == src['slot'] == slot['slot'] == ordinal and
             prediction['id'] == src['image_tag'] == tag and
             prediction['repo'] == src['repo'] == final['repo'] == meta['repo'] and
             prediction['base_commit'] == src['failed_commit'] == failed ==
             meta['failed_job']['trigger_sha'] and
             isinstance(passed, str) and len(passed) == 40,
             f'case-identity-{ordinal}')
        tracked = set(subprocess.check_output(['git', 'ls-files', '-z'], cwd=src['root'],
                                              timeout=30).decode().split('\0'))
        tracked.discard('')
        url = (f"https://api.github.com/repos/{quote(src['repo'], safe='/')}/compare/"
               f"{quote(failed, safe='')}...{quote(passed, safe='')}")
        status, body, headers = fetch(url)
        body_name = f'COMPARE-{ordinal:02d}.json'
        if status == 200 and len(body) <= MAX_BYTES:
            save(OUTPUT / body_name, body)
        complete = identity = False
        changed_file_count = None
        changed = []
        if status == 200 and len(body) <= MAX_BYTES:
            try:
                doc = json.loads(body)
                files = doc.get('files')
                changed_file_count = len(files) if isinstance(files, list) else None
                commits = doc.get('commits')
                identity = (doc.get('base_commit', {}).get('sha') == failed and
                            isinstance(commits, list) and bool(commits) and
                            commits[-1].get('sha') == passed)
                complete = (identity and isinstance(files, list) and len(files) < 300 and
                            not headers.get('Link'))
                if complete:
                    changed = sorted({item.get('previous_filename', item.get('filename'))
                                      for item in files
                                      if safe_source(item.get('previous_filename', item.get('filename')),
                                                     src['language']) and
                                      item.get('previous_filename', item.get('filename')) in tracked})
            except (ValueError, AttributeError, IndexError, TypeError):
                pass
        row = {'ordinal': ordinal, 'id': tag, 'repo': src['repo'],
               'language': src['language'], 'failed_sha': failed, 'passed_sha': passed,
               'http_status': status, 'response_sha256': sha(body),
               'response_file': body_name if status == 200 and len(body) <= MAX_BYTES else None,
               'identity_matched': identity, 'complete_file_list': complete,
               'changed_file_count': changed_file_count,
               'source_gold_paths': changed if complete else None,
               'gold_admissible': complete and bool(changed),
               'rate_remaining': headers.get('X-RateLimit-Remaining'),
               'gold_export_to_vps': False}
        save(OUTPUT / f'LABEL-{ordinal:02d}.json', encoded(row))
        rows.append(row)
        print(json.dumps({'ordinal': ordinal, 'http_status': status,
                          'complete': complete, 'gold_count': len(changed),
                          'admissible': row['gold_admissible'],
                          'rate_remaining': row['rate_remaining']}), flush=True)
        if not row['gold_admissible']:
            break
    result = {'schema_version': 'are.g01-confirm-https-label-result-r8/v1',
              'attempted': len(rows), 'admissible': sum(row['gold_admissible'] for row in rows),
              'all_24_admissible': len(rows) == 24 and all(row['gold_admissible'] for row in rows),
              'results': rows, 'gold_export_to_vps': False,
              'prediction_seal_sha256': PINS['prediction_seal']}
    data = encoded(result)
    save(OUTPUT / 'LABEL-RESULT.json', data)
    print(json.dumps({'attempted': result['attempted'], 'admissible': result['admissible'],
                      'all_24_admissible': result['all_24_admissible'],
                      'result_sha256': sha(data)}))


if __name__ == '__main__':
    main()
