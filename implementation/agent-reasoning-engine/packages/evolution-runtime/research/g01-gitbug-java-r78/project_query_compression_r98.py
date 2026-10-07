"""Seal a deterministic failure-side query reduction on exposed Java cohorts.

This is inspired by query-reformulation research, not a reproduction of an
LLM-based method. It opens no source, label, score, patch, or confirmation row.
Open question: does shorter test-name syntax improve matched source ranking?
"""

import argparse
import hashlib
import json
import os
import re
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive')
INPUTS = {
    'gitbug': (ROOT / 'gitbug-java-metadata-preflight-20261005/dev-queries-r81/QUERIES.jsonl',
               '478fc0b4fca5936cca09fdffe0a95b9dc2af2bb42482a9aa910fddc48be23eaf'),
    'bears': (ROOT / 'bears-metadata-preflight-r73-20261005/query-only-r77/QUERIES.jsonl',
              'be63d0919095bdca86090e86510a15368ea7b14cab8872f7765d17e928300d71'),
}
MAX_BYTES = 1024
MAX_TESTS = 8
MAX_FAILURE_BYTES = 512


def sha(data):
    return hashlib.sha256(data).hexdigest()


def write_new(path, data):
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)


def utf8_prefix(value, limit):
    return value.encode('utf-8')[:limit].decode('utf-8', errors='ignore')


def compress(query):
    heading, marker, failure = query.partition('\nfailure:\n')
    if not marker or not heading.startswith('failing tests:\n'):
        raise ValueError('query-shape')
    tests = []
    seen = set()
    for line in heading.removeprefix('failing tests:\n').splitlines():
        if '#' not in line:
            continue
        qualified, method = line.split('#', 1)
        parts = qualified.split('.')
        # Retain the final package component to distinguish homonymous tests,
        # but remove repeated long package prefixes and parameterized suffixes.
        short_class = '.'.join(parts[-2:])
        short_method = re.split(r'[({]', method, maxsplit=1)[0].strip()
        key = (short_class, short_method)
        if short_class and short_method and key not in seen:
            seen.add(key)
            tests.append(f'{short_class}#{short_method}')
        if len(tests) >= MAX_TESTS:
            break
    if not tests:
        raise ValueError('no-test-reference')
    # The archived query already underwent sensitive-string redaction; never
    # use raw metadata or try to recover material removed by its 1 KiB cap.
    failure = re.sub(r'(?:(?:java|org|com)\.[A-Za-z0-9_$.]+(?:Exception|Error):\s*){2,}',
                     lambda match: match.group(0).split(':')[-2].strip() + ': ', failure)
    failure = utf8_prefix(failure.strip(), MAX_FAILURE_BYTES)
    result = 'failing tests:\n' + '\n'.join(tests) + '\nfailure:\n' + failure
    if len(result.encode('utf-8')) > MAX_BYTES:
        result = utf8_prefix(result, MAX_BYTES)
    if not result or len(result.encode('utf-8')) > MAX_BYTES:
        raise ValueError('bounded-query')
    return result, len(tests)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--cohort', choices=INPUTS, required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    source, expected = INPUTS[args.cohort]
    raw = source.read_bytes()
    if sha(raw) != expected or args.out.exists():
        raise SystemExit('input-drift-or-output-exists')
    prior = [json.loads(line) for line in raw.splitlines()]
    if len(prior) != (12 if args.cohort == 'gitbug' else 24):
        raise SystemExit('denominator-drift')
    rows = []
    for ordinal, item in enumerate(prior, 1):
        if item['ordinal'] != ordinal or item['query_sha256'] != sha(item['query'].encode()):
            raise SystemExit(f'query-binding:{ordinal}')
        reduced, retained = compress(item['query'])
        rows.append({'ordinal': ordinal, 'repo': item['repo'], 'base_commit': item['base_commit'],
                     'source_query_sha256': item['query_sha256'], 'query': reduced,
                     'query_sha256': sha(reduced.encode()), 'retained_tests': retained,
                     'source_query_bytes': len(item['query'].encode()),
                     'reduced_query_bytes': len(reduced.encode())})
    args.out.mkdir(parents=True, mode=0o700)
    encoded = ''.join(json.dumps(row, sort_keys=True, ensure_ascii=False) + '\n' for row in rows).encode()
    write_new(args.out / 'QUERIES.jsonl', encoded)
    seal = {'schema_version': 'g01.java-query-compression-r98/v1', 'cohort': args.cohort,
            'source_query_sha256': expected, 'script_sha256': sha(Path(__file__).read_bytes()),
            'query_output_sha256': sha(encoded), 'cases': len(rows), 'maximum_query_bytes': MAX_BYTES,
            'maximum_retained_tests': MAX_TESTS, 'maximum_failure_bytes': MAX_FAILURE_BYTES,
            'gold_values_used': False, 'source_opened': False, 'model_calls': 0,
            'claim_ceiling': 'Source-only query candidate; no ranking or superiority evidence.',
            'open_questions': ['Does reduction improve matched source retrieval in both exposed Java populations?']}
    write_new(args.out / 'QUERY-SEAL.json', (json.dumps(seal, sort_keys=True, indent=2) + '\n').encode())
    print(json.dumps({'cohort': args.cohort, 'cases': len(rows), 'queries_sha256': sha(encoded),
                      'mean_bytes': sum(row['reduced_query_bytes'] for row in rows) / len(rows)}, sort_keys=True))


if __name__ == '__main__':
    main()
