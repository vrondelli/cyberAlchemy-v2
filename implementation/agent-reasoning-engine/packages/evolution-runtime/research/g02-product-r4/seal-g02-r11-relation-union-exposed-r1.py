#!/usr/bin/env python3
"""Seal a source-only union of three already exposed G02 r11 relation pools."""

import hashlib
import json
import os
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive')
OUTPUT = ROOT / 'g02-r11-relation-union-exposed-r1-20261003/SOURCE-UNION.json'
INPUTS = {
    'same_directory': (ROOT / 'g02-r11-same-directory-pool-exposed-r1-20261003/SOURCE-SEAL.json',
                       '58977faf143e620d3f6695d79a58b37c01669a3d7ae239992833d97f37c38dc1'),
    'python_import': (ROOT / 'g02-r11-python-import-neighbors-exposed-r1-20261002/SOURCE-SEAL.json',
                      '777f9d69cc65be69d472ed3a7633f75483e01134c5298527b99fd22f5c490384'),
    'cpp_include': (ROOT / 'g02-r11-retrieval-exposed-r1-20261002/INCLUDE-NEIGHBORS-SEAL.json',
                    '031c44de02388b89261a921ef3def5a17eecae5c5faa8f308594e9b3a645c15d'),
}


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def normalize(path):
    path = path.replace('\\', '/')
    if path.startswith('/testbed/'):
        path = path[len('/testbed/'):]
    elif path.startswith('/workspace/'):
        parts = path[len('/workspace/'):].split('/', 1)
        path = parts[1] if len(parts) == 2 else parts[0]
    return path.lstrip('/').removeprefix('./')


def main():
    if OUTPUT.exists():
        raise SystemExit('output already exists')
    seals = {}
    for channel, (path, pin) in INPUTS.items():
        if sha(path) != pin:
            raise SystemExit(f'input drift: {channel}')
        seals[channel] = json.loads(path.read_text())
    expected = {'same_directory': list(range(1, 13)),
                'python_import': [1, 2, 3, 5, 6, 7, 9, 10, 11],
                'cpp_include': [4, 8, 12]}
    for channel, ordinals in expected.items():
        if [row['ordinal'] for row in seals[channel]['rows']] != ordinals:
            raise SystemExit(f'ordinal drift: {channel}')
    by_channel = {channel: {row['ordinal']: row for row in seal['rows']}
                  for channel, seal in seals.items()}
    rows = []
    for ordinal in range(1, 13):
        base = by_channel['same_directory'][ordinal]
        identity = {key: base[key] for key in
                    ('ordinal', 'instance_id', 'repo', 'base_commit', 'issue_sha256')}
        delivered = {normalize(path) for path in base['delivered_paths']}
        candidates = {}
        for channel in INPUTS:
            row = by_channel[channel].get(ordinal)
            if row is None:
                continue
            if any(row[key] != value for key, value in identity.items()):
                raise SystemExit(f'identity drift: {ordinal}:{channel}')
            if {normalize(path) for path in row['delivered_paths']} != delivered:
                raise SystemExit(f'delivered drift: {ordinal}:{channel}')
            seen = set()
            for item in row['candidates']:
                path = normalize(item['path'])
                if path in seen or path in delivered or path.startswith('../'):
                    raise SystemExit(f'invalid candidate: {ordinal}:{channel}:{path}')
                seen.add(path)
                size = item['bytes']
                if not isinstance(size, int) or size < 0:
                    raise SystemExit(f'invalid size: {ordinal}:{channel}:{path}')
                entry = candidates.setdefault(path, {'path': path, 'bytes': size, 'channels': []})
                if entry['bytes'] != size:
                    raise SystemExit(f'size drift: {ordinal}:{path}')
                entry['channels'].append(channel)
        rows.append({**identity, 'delivered_paths': sorted(delivered),
                     'candidates': sorted(candidates.values(), key=lambda item: item['path'])})
    output = {
        'schema_version': 'g02.r11-relation-union-exposed-source/v1',
        'posture': 'source-only-exposed-development-no-gold-dsh-score-or-model',
        'input_sha256': {key: pin for key, (_, pin) in INPUTS.items()},
        'script_sha256': sha(Path(__file__)),
        'max_read_bytes': 262144,
        'rows': rows,
        'claim_ceiling': 'Candidate coverage only; no selected read, native F1, cost, independent transfer, or superiority.'
    }
    data = (json.dumps(output, sort_keys=True, indent=2) + '\n').encode()
    OUTPUT.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    print(json.dumps({'rows': len(rows),
                      'candidates': sum(len(row['candidates']) for row in rows),
                      'sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
