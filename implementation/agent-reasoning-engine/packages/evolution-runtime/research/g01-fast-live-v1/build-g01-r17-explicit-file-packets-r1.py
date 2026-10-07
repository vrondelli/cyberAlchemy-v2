#!/usr/bin/env python3
"""Build compact gold-blind issue/source packets from sealed r17 candidates."""

import hashlib
import json
import os
import re
import subprocess
from pathlib import Path


ARCHIVE = Path('/home/vlad_/are-benchmark-archive')
SOURCE = ARCHIVE / 'g01-r17-explicit-file-exposed-r1-20261004/SOURCE-SEAL.json'
SOURCE_SHA = '2a3ccd5b7546b4f7d0f6f878a3f66e3dc2aaef0a98ecd4701f0d81191f2ea18e'
INPUT = ARCHIVE / 'g01-product-replication-input-r16-r2'
OUTPUT = ARCHIVE / 'g01-r17-explicit-file-packets-r1-20261004/PACKETS.json'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def cache(path):
    name = Path(path).name
    if path.startswith('/dev/shm/are-g01-r16-source-caches-r1/'):
        return ARCHIVE / 'g01-r16-source-caches-r1-20261002' / name
    if path.startswith('/dev/shm/are-g01-r16-r2-delta-caches-r1/'):
        return ARCHIVE / 'g01-r16-r2-delta-caches-r1-20261003' / name
    raise SystemExit('unknown-cache')


def excerpt(content, issue):
    words = set(re.findall(r'[a-z][a-z0-9_]{3,}', issue.lower()))
    lines = content.splitlines()
    ranked = []
    for i, line in enumerate(lines):
        if len(line) > 800 or not line.strip():
            continue
        found = set(re.findall(r'[a-z][a-z0-9_]{3,}', line.lower())) & words
        if found:
            ranked.append((-len(found), i))
    chosen = []
    for _, i in sorted(ranked):
        if any(abs(i-old) <= 2 for old in chosen):
            continue
        chosen.append(i)
        if len(chosen) == 2:
            break
    if not chosen and lines:
        chosen = [0]
    return [{'line': i+1, 'text': '\n'.join(lines[max(0,i-1):min(len(lines),i+2)])[:420]}
            for i in chosen]


def main():
    if OUTPUT.exists() or sha(SOURCE.read_bytes()) != SOURCE_SHA:
        raise SystemExit('output-exists-or-source-drift')
    ranked = json.loads(SOURCE.read_text())['rows']
    definition = json.loads((INPUT/'DEFINITION.json').read_text())['ordered_tasks']
    packets = []
    for row in ranked:
        if not row['resolved_candidates']:
            continue
        ordinal = row['ordinal']
        task = definition[ordinal-1]
        if task['instance_id'] != row['instance_id'] or task['base_commit'] != row['base_commit']:
            raise SystemExit(f'identity:{ordinal}')
        source = INPUT / 'tasks' / (row['instance_id']+'.json')
        task_json = json.loads(source.read_text())
        issue = task_json['problem_statement']
        if sha(source.read_bytes()) != row['task_sha256']:
            raise SystemExit(f'task-drift:{ordinal}')
        if issue.startswith('"') and issue.endswith('"'):
            try:
                value = json.loads(issue)
                if isinstance(value, str): issue = value
            except json.JSONDecodeError:
                pass
        source_cache = cache(task['repository_cache'])
        candidates = []
        for number, item in enumerate(row['resolved_candidates'], 1):
            path = item['path']
            if path.startswith('/') or '..' in Path(path).parts:
                raise SystemExit(f'unsafe-path:{ordinal}')
            blob = subprocess.check_output(['git','-C',str(source_cache),'show',f'{row["base_commit"]}:{path}'])
            if len(blob) > 262144:
                raise SystemExit(f'oversize-file:{ordinal}')
            candidates.append({'id': number, 'path': path, 'resolution': item['method'],
                               'bytes': len(blob), 'code_windows': excerpt(blob.decode('utf-8','replace'), issue)})
        packet = {'ordinal': ordinal, 'instance_id': row['instance_id'], 'repo': row['repo'],
                  'issue': issue[:6000], 'maximum_new_reads': 2, 'candidates': candidates}
        if len(json.dumps(packet).encode()) > 32768:
            raise SystemExit(f'packet-size:{ordinal}')
        packets.append(packet)
    if [p['ordinal'] for p in packets] != [19,20,21,22]:
        raise SystemExit('cohort-drift')
    result = {'schema_version': 'g01.r17-explicit-file-packets-r1/v1',
              'posture': 'source-only-exposed-development-no-gold-score-or-model',
              'input_sha256': {'source': SOURCE_SHA},
              'script_sha256': sha(Path(__file__).read_bytes()),
              'policy': 'Issue prefix <=6000 chars; <=2 code windows per file; 2 new reads maximum; four exposed r17 tasks.',
              'ordered_packets': packets,
              'claim_ceiling': 'Exposed chooser development only; no actual ARE read, native F1, independent test or superiority.'}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    OUTPUT.parent.mkdir(mode=0o700, parents=True, exist_ok=False)
    fd = os.open(OUTPUT, os.O_CREAT|os.O_EXCL|os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream: stream.write(data)
    print(json.dumps({'packets':len(packets),'candidates':sum(len(p['candidates']) for p in packets),
                      'sha256':sha(data)}))


if __name__=='__main__': main()
