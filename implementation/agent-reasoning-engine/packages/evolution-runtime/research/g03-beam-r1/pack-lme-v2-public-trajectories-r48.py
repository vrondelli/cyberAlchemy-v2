#!/usr/bin/env python3
"""Package pinned public V2 AXTree/action data for bounded private VPS lookup.

No questions, answers, evaluator fields, model thoughts, outcome labels,
screenshots, credentials, tool outputs, or environment dumps are emitted.
"""

import gzip
from hashlib import sha256
import json
import os
from pathlib import Path
import sys

ROOT = Path('/home/vlad_/are-benchmark-archive/g03-lme-v2-feasibility-20261005')
SOURCE = ROOT / 'trajectories.jsonl'
HAYSTACK = ROOT / 'lme_v2_small.json'
SOURCE_SHA = '363cec9a8e87aa8d9101ce4e600aadbf7031d674056ebe4f969e8424abc5f3c6'
HAYSTACK_SHA = '9b5301defb23a088a5f06e45ff8d5f35e569d78305a66d492046a9fff9b46593'
STATE_FIELDS = ('state_index', 'url', 'action', 'accessibility_tree', 'screenshot')


def digest(path):
    h = sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(4 * 1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def main():
    assert len(sys.argv) == 2, 'output-directory-required'
    output = Path(sys.argv[1])
    assert not output.exists(), 'output-exists'
    assert digest(SOURCE) == SOURCE_SHA and digest(HAYSTACK) == HAYSTACK_SHA
    haystacks = json.loads(HAYSTACK.read_text())
    needed = {tid for ids in haystacks.values() for tid in ids}
    assert len(needed) == 200
    os.mkdir(output, 0o700)
    os.mkdir(output / 'trajectories', 0o700)
    entries, total_compressed, total_plain = [], 0, 0
    with SOURCE.open() as stream:
        for source_line in stream:
            raw = json.loads(source_line)
            tid = raw['id']
            if tid not in needed:
                continue
            assert len(tid) == 8 and all(char in '0123456789abcdef' for char in tid)
            selected = {'id': tid, 'domain': raw['domain'],
                        'environment': raw['environment'], 'goal': raw['goal'],
                        'states': [{key: state[key] for key in STATE_FIELDS if key in state}
                                   for state in raw['states']]}
            plain = (json.dumps(selected, ensure_ascii=False, separators=(',', ':')) + '\n').encode()
            compressed = gzip.compress(plain, compresslevel=1, mtime=0)
            target = output / 'trajectories' / f'{tid}.json.gz'
            fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            with os.fdopen(fd, 'wb') as out:
                out.write(compressed)
            entries.append({'id': tid, 'states': len(selected['states']),
                            'plain_bytes': len(plain), 'plain_sha256': sha256(plain).hexdigest(),
                            'compressed_bytes': len(compressed),
                            'compressed_sha256': sha256(compressed).hexdigest()})
            total_compressed += len(compressed)
            total_plain += len(plain)
    assert {item['id'] for item in entries} == needed
    manifest = {'schema_version': 'are.g03-lme-v2-public-trajectory-pack-r48/v1',
                'status': 'source-only-public-trajectory-ax-action-slice',
                'source_sha256': SOURCE_SHA, 'haystack_sha256': HAYSTACK_SHA,
                'builder_sha256': digest(Path(__file__)),
                'trajectory_count': len(entries), 'total_plain_bytes': total_plain,
                'total_compressed_bytes': total_compressed,
                'included_fields': ['id', 'domain', 'environment', 'goal',
                                    *[f'states.{key}' for key in STATE_FIELDS]],
                'excluded_fields': ['questions', 'answers', 'gold', 'evaluator',
                                    'thought', 'outcome', 'screenshots_binary',
                                    'credentials', 'tool_outputs', 'environment_dumps'],
                'entries': sorted(entries, key=lambda item: item['id']),
                'claim_ceiling': 'Public source supply only; no retrieval quality, score, or superiority'}
    encoded = (json.dumps(manifest, ensure_ascii=False, indent=2) + '\n').encode()
    fd = os.open(output / 'MANIFEST.json', os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as out:
        out.write(encoded)
    print(json.dumps({'trajectories': len(entries), 'plain_bytes': total_plain,
                      'compressed_bytes': total_compressed,
                      'manifest_sha256': sha256(encoded).hexdigest()}))


if __name__ == '__main__':
    main()
