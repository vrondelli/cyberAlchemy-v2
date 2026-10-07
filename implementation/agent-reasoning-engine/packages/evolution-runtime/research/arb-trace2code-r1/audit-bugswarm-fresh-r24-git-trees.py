#!/usr/bin/env python3
"""Verify fresh r23 compare labels against complete passing Git trees."""

import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/fresh-r11')
COMPARE = BASE / 'evaluator-only/github-compare-r23/LABEL-RESULT.json'
SOURCE = BASE / 'code-only-r17/RESULT.json'
OUTPUT = BASE / 'evaluator-only/github-tree-r24'
COMPARE_SHA = '133021b31e5ad504e24b98dc28f3d6d4279e38bae9fac639dde71564473f136c'
SOURCE_SHA = '6f76dafa33ed79a1ddfba5a3278e95ccb39161513ff35bc23dc927ce13dd1992'
RULE_SHA = '5862ca38e6adf8afbb1978738acd57c15e384d94c700839f361c6a5997885631'
MAX_BYTES = 16 * 1024 * 1024


def sha(data):
    return hashlib.sha256(data).hexdigest()


def need(ok, why):
    if not ok:
        raise SystemExit(why)


def encoded(value):
    return (json.dumps(value, sort_keys=True, indent=2) + '\n').encode()


def save(path, data):
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)


def fetch(url):
    request = Request(url, headers={'Accept': 'application/vnd.github+json',
                                    'User-Agent': 'ARE-G01-fresh-tree-audit/1'})
    try:
        with urlopen(request, timeout=45) as response:
            return response.status, response.read(MAX_BYTES + 1), dict(response.headers)
    except HTTPError as error:
        return error.code, error.read(min(MAX_BYTES, 65536)), dict(error.headers)
    except (URLError, TimeoutError):
        return 0, b'', {}


def tracked_blobs(root):
    output = subprocess.run(['git', 'ls-files', '-s', '-z'], cwd=root,
                            timeout=35, capture_output=True, check=True).stdout
    need(len(output) <= 20 * 1024 * 1024, 'git-index-size')
    result = {}
    for raw in output.split(b'\0'):
        if not raw:
            continue
        header, path = raw.split(b'\t', 1)
        mode, oid, stage = header.decode().split()
        need(stage == '0' and mode in ('100644', '100755'), 'git-index-shape')
        result[path.decode()] = oid
    return result


def main():
    rule_path = HERE / 'acquire-bugswarm-fresh-r23-https-labels.py'
    need(not OUTPUT.exists() and sha(COMPARE.read_bytes()) == COMPARE_SHA and
         sha(SOURCE.read_bytes()) == SOURCE_SHA and
         sha(rule_path.read_bytes()) == RULE_SHA, 'output-or-input-pin-drift')
    spec = importlib.util.spec_from_file_location('g01_fresh_safe_source', rule_path)
    need(spec is not None and spec.loader is not None, 'source-rule-unavailable')
    rule = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(rule)
    compares = json.loads(COMPARE.read_bytes())['results']
    sources = json.loads(SOURCE.read_bytes())['records']
    need(len(compares) == len(sources) == 24 and all(c['gold_admissible'] for c in compares),
         'compare-denominator-drift')
    OUTPUT.mkdir(mode=0o700)
    save(OUTPUT / 'TREE-FREEZE.json', encoded({
        'schema_version': 'are.g01-fresh-tree-freeze-r24/v1',
        'compare_sha256': COMPARE_SHA, 'source_sha256': SOURCE_SHA,
        'safe_source_rule_sha256': RULE_SHA,
        'script_sha256': sha(Path(__file__).read_bytes()),
        'endpoint': 'https://api.github.com/repos/{repo}/git/trees/{passed}?recursive=1',
        'maximum_requests': 24, 'automatic_retries': 0,
        'rule': 'compare exact passing-tree blob OIDs against pinned failed-source Git index; require complete tree and exact set equality to HTTPS compare paths',
        'gold_export_to_vps': False}))
    rows = []
    for ordinal, (compare, src) in enumerate(zip(compares, sources), 1):
        need(compare['ordinal'] == src['slot'] == ordinal and
             compare['id'] == src['image_tag'] and compare['repo'] == src['repo'] and
             compare['failed_sha'] == src['failed_commit'], f'identity-{ordinal}')
        failed = tracked_blobs(Path(src['root']).resolve(strict=True))
        need(len(failed) == src['projected_files'], f'failed-index-{ordinal}')
        url = (f"https://api.github.com/repos/{quote(src['repo'], safe='/')}/git/trees/"
               f"{quote(compare['passed_sha'], safe='')}?recursive=1")
        status, body, headers = fetch(url)
        response_name = f'TREE-{ordinal:02d}.json'
        if status == 200 and len(body) <= MAX_BYTES:
            save(OUTPUT / response_name, body)
        complete = False
        changed = []
        remote_blob_count = None
        if status == 200 and len(body) <= MAX_BYTES:
            try:
                doc = json.loads(body)
                entries = doc.get('tree')
                complete = doc.get('truncated') is False and isinstance(entries, list)
                if complete:
                    passed = {item['path']: item['sha'] for item in entries
                              if item.get('type') == 'blob' and
                              isinstance(item.get('path'), str) and
                              isinstance(item.get('sha'), str)}
                    remote_blob_count = len(passed)
                    changed = sorted(path for path, oid in failed.items()
                                     if rule.safe_source(path, src['language']) and
                                     passed.get(path) != oid)
            except (ValueError, AttributeError, KeyError, TypeError):
                complete = False
        row = {'ordinal': ordinal, 'id': src['image_tag'], 'repo': src['repo'],
               'failed_sha': compare['failed_sha'], 'passed_sha': compare['passed_sha'],
               'http_status': status, 'response_sha256': sha(body),
               'response_file': response_name if status == 200 and len(body) <= MAX_BYTES else None,
               'complete_tree': complete, 'failed_blob_count': len(failed),
               'passed_blob_count': remote_blob_count,
               'direct_changed_old_source_paths': changed if complete else None,
               'compare_gold_paths': compare['source_gold_paths'],
               'exact_source_path_set_matched': complete and changed == compare['source_gold_paths'],
               'rate_remaining': headers.get('X-RateLimit-Remaining'),
               'gold_export_to_vps': False}
        save(OUTPUT / f'AUDIT-{ordinal:02d}.json', encoded(row))
        rows.append(row)
        print(json.dumps({'ordinal': ordinal, 'status': status, 'complete': complete,
                          'matched': row['exact_source_path_set_matched'],
                          'rate_remaining': row['rate_remaining']}), flush=True)
        if not complete:
            break
    result = {'schema_version': 'are.g01-fresh-tree-result-r24/v1',
              'attempted': len(rows),
              'complete_trees': sum(row['complete_tree'] for row in rows),
              'matched': sum(row['exact_source_path_set_matched'] for row in rows),
              'all_24_matched': len(rows) == 24 and all(row['exact_source_path_set_matched'] for row in rows),
              'results': rows, 'gold_export_to_vps': False}
    data = encoded(result)
    save(OUTPUT / 'TREE-RESULT.json', data)
    print(json.dumps({'attempted': result['attempted'],
                      'complete_trees': result['complete_trees'],
                      'matched': result['matched'],
                      'all_24_matched': result['all_24_matched'],
                      'result_sha256': sha(data)}))


if __name__ == '__main__':
    main()
