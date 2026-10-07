#!/usr/bin/env python3
"""Complete the r40 failed-source label-admission census for slots 16--24."""
from __future__ import annotations

import hashlib
import json
import os
import subprocess
from pathlib import Path, PurePosixPath
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

ROOT = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
BASE = ROOT / 'selective-r28'
OUTPUT = BASE / 'evaluator-census-r41'
PATHS = {
    'raw': ROOT / '1.3.1-bugswarm.json',
    'cohort': BASE / 'final-r34/RESULT.json',
    'source': BASE / 'code-projection-r36/RESULT.json',
    'r39_rankings': BASE / 'rankings-r39/MULTIVIEW-RANKINGS.jsonl',
    'r40_result': BASE / 'evaluator-only-r40/LABEL-RESULT.json',
    'protocol': Path(__file__).resolve().parents[2] / 'evidence/G01-BUGSWARM-SELECTIVE-R41-LABEL-CENSUS-PROTOCOL-2026-10-04.md',
}
PINS = {
    'raw': 'c952d8f7080e798cc66d903906d645c6dfc21f88789b1977e0d3e2d0f7c2192d',
    'cohort': 'fee3ffa2e39fee3aadfbe09612439542942ffcfcadb13e45dc7f77ffda9e012c',
    'source': '14766f233d6b369551b94fc7d3372b85d3cb88f0936b337024d7bb7247188395',
    'r39_rankings': '9466de334f4d0a2ccd38a4db05b38a1bc8c55beb638542c755c509fb5b319cb9',
    'r40_result': '8140eba19fffce0b5613987582faef09d6774281a9d95269ad587666d7c40963',
    'protocol': '35a0c63a7725e5c49ecdcbaa5a2e1c2faeba6420c58510a12dc733e5011e0ac6',
}
MAX_BYTES = 8 * 1024 * 1024


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(condition: bool, why: str) -> None:
    if not condition:
        raise SystemExit(why)


def encoded(value: object) -> bytes:
    return (json.dumps(value, sort_keys=True, indent=2) + '\n').encode()


def save(path: Path, data: bytes) -> None:
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as handle:
        handle.write(data)


def safe_path(path: object, language: str) -> bool:
    if not isinstance(path, str) or not path or '\\' in path:
        return False
    parsed = PurePosixPath(path)
    suffix = '.py' if language == 'Python' else '.java'
    return (
        not parsed.is_absolute()
        and '..' not in parsed.parts
        and '.git' not in parsed.parts
        and path.endswith(suffix)
    )


def fetch(url: str) -> tuple[int, bytes, dict[str, str]]:
    request = Request(
        url,
        headers={
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'ARE-G01-selective-r41-census/1',
        },
    )
    try:
        with urlopen(request, timeout=35) as response:
            return response.status, response.read(MAX_BYTES + 1), dict(response.headers)
    except HTTPError as error:
        return error.code, error.read(min(MAX_BYTES, 65536)), dict(error.headers)
    except (URLError, TimeoutError):
        return 0, b'', {}


def reason_for(status: int, response_size: int, identity: bool, complete: bool, changed: list[str]) -> str | None:
    if status != 200:
        return f'http-{status}'
    if response_size > MAX_BYTES:
        return 'response-too-large'
    if not identity:
        return 'comparison-identity-mismatch'
    if not complete:
        return 'incomplete-file-list'
    if not changed:
        return 'no-changed-language-path-present-in-failed-source'
    return None


def main() -> None:
    need(not OUTPUT.exists(), 'output-exists')
    need(all(sha(PATHS[name].read_bytes()) == digest for name, digest in PINS.items()), 'input-drift')

    raw = {item['image_tag']: item for item in json.loads(PATHS['raw'].read_bytes())}
    cohort = json.loads(PATHS['cohort'].read_bytes())['rows']
    sources = json.loads(PATHS['source'].read_bytes())['records']
    r39 = [json.loads(line) for line in PATHS['r39_rankings'].read_text().splitlines()]
    r40 = json.loads(PATHS['r40_result'].read_bytes())
    need(len(raw) == 4388 and len(cohort) == len(sources) == len(r39) == 24, 'denominator')
    need(r40['attempted'] == 15 and len(r40['results']) == 15, 'r40-denominator')

    OUTPUT.mkdir(parents=True, mode=0o700)
    freeze = {
        'schema_version': 'are.g01-selective-r41-label-census-freeze/v1',
        'input_sha256': PINS,
        'script_sha256': sha(Path(__file__).read_bytes()),
        'endpoint': 'https://api.github.com/repos/{repo}/compare/{failed}...{passed}',
        'ordinals': list(range(16, 25)),
        'maximum_requests': 9,
        'automatic_retries': 0,
        'maximum_response_bytes': MAX_BYTES,
        'rule': 'complete exact comparison; all changed old-side language paths present in failed Git index',
        'continue_through_inadmissible': True,
        'passing_source_opened': False,
        'scores_computed': False,
        'model_calls': 0,
        'gold_export_to_vps': False,
    }
    save(OUTPUT / 'CENSUS-FREEZE.json', encoded(freeze))

    new_rows = []
    for ordinal in range(16, 25):
        slot, source, rank = cohort[ordinal - 1], sources[ordinal - 1], r39[ordinal - 1]
        tag = source['image_tag']
        metadata = raw[tag]
        failed = source['failed_commit']
        passed = metadata['passed_job']['trigger_sha']
        need(
            slot['slot'] == source['slot'] == rank['ordinal'] == ordinal
            and slot['image_tag'] == tag == rank['id']
            and slot['repo'] == source['repo'] == rank['repo'] == metadata['repo']
            and slot['failed_commit'] == failed == metadata['failed_job']['trigger_sha']
            and isinstance(passed, str)
            and len(passed) == 40,
            f'identity-{ordinal}',
        )
        tracked = set(
            subprocess.check_output(
                ['git', 'ls-files', '-z'], cwd=source['root'], timeout=30
            ).decode().split('\0')
        )
        tracked.discard('')
        url = (
            f"https://api.github.com/repos/{quote(source['repo'], safe='/')}/compare/"
            f"{quote(failed, safe='')}...{quote(passed, safe='')}"
        )
        status, body, headers = fetch(url)
        body_name = f'COMPARE-{ordinal:02d}.json'
        if status == 200 and len(body) <= MAX_BYTES:
            save(OUTPUT / body_name, body)

        identity = False
        complete = False
        changed: list[str] = []
        changed_count = None
        if status == 200 and len(body) <= MAX_BYTES:
            try:
                document = json.loads(body)
                files = document.get('files')
                commits = document.get('commits')
                changed_count = len(files) if isinstance(files, list) else None
                identity = (
                    document.get('base_commit', {}).get('sha') == failed
                    and isinstance(commits, list)
                    and bool(commits)
                    and commits[-1].get('sha') == passed
                )
                complete = (
                    identity
                    and isinstance(files, list)
                    and len(files) < 300
                    and not headers.get('Link')
                )
                if complete:
                    changed = sorted(
                        {
                            item.get('previous_filename', item.get('filename'))
                            for item in files
                            if safe_path(
                                item.get('previous_filename', item.get('filename')),
                                source['language'],
                            )
                            and item.get('previous_filename', item.get('filename')) in tracked
                        }
                    )
            except (ValueError, AttributeError, IndexError, TypeError):
                pass

        reason = reason_for(status, len(body), identity, complete, changed)
        row = {
            'ordinal': ordinal,
            'id': tag,
            'repo': source['repo'],
            'language': source['language'],
            'failed_sha': failed,
            'passed_sha': passed,
            'http_status': status,
            'response_sha256': sha(body),
            'response_file': body_name if status == 200 and len(body) <= MAX_BYTES else None,
            'identity_matched': identity,
            'complete_file_list': complete,
            'changed_file_count': changed_count,
            'source_gold_paths': changed if complete else None,
            'gold_admissible': reason is None,
            'inadmissible_reason': reason,
            'rate_remaining': headers.get('X-RateLimit-Remaining'),
            'passing_source_opened': False,
            'model_calls': 0,
            'gold_export_to_vps': False,
        }
        save(OUTPUT / f'CENSUS-{ordinal:02d}.json', encoded(row))
        new_rows.append(row)
        print(
            json.dumps(
                {
                    'ordinal': ordinal,
                    'http_status': status,
                    'complete': complete,
                    'gold_count': len(changed),
                    'admissible': row['gold_admissible'],
                    'reason': reason,
                    'rate_remaining': row['rate_remaining'],
                }
            ),
            flush=True,
        )

    old_rows = r40['results']
    combined = old_rows + new_rows
    need([item['ordinal'] for item in combined] == list(range(1, 25)), 'combined-denominator')
    for item in combined:
        if not item['gold_admissible'] and 'inadmissible_reason' not in item:
            item['inadmissible_reason'] = 'no-changed-language-path-present-in-failed-source'
    inadmissible = [
        {'ordinal': item['ordinal'], 'id': item['id'], 'reason': item.get('inadmissible_reason')}
        for item in combined
        if not item['gold_admissible']
    ]
    result = {
        'schema_version': 'are.g01-selective-r41-label-census-result/v1',
        'accounted_slots': len(combined),
        'admissible': sum(item['gold_admissible'] for item in combined),
        'inadmissible': len(inadmissible),
        'inadmissible_cases': inadmissible,
        'all_24_admissible': all(item['gold_admissible'] for item in combined),
        'r40_terminal_result_sha256': PINS['r40_result'],
        'r41_receipts': new_rows,
        'combined_results': combined,
        'freeze_sha256': sha((OUTPUT / 'CENSUS-FREEZE.json').read_bytes()),
        'passing_source_opened': False,
        'scores_computed': False,
        'model_calls': 0,
        'gold_export_to_vps': False,
    }
    data = encoded(result)
    save(OUTPUT / 'CENSUS-RESULT.json', data)
    print(
        json.dumps(
            {
                'accounted_slots': result['accounted_slots'],
                'admissible': result['admissible'],
                'inadmissible': result['inadmissible'],
                'result_sha256': sha(data),
            }
        )
    )


if __name__ == '__main__':
    main()
