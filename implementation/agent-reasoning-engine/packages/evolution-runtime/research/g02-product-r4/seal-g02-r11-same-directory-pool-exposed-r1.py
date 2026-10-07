#!/usr/bin/env python3
"""Seal bounded tracked files sharing a directory with delivered G02 reads."""

import hashlib
import json
import os
import subprocess
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive')
PRIOR = ROOT / 'g02-r11-retrieval-exposed-r1-20261002/SEAL.json'
OUTPUT = ROOT / 'g02-r11-same-directory-pool-exposed-r1-20261003/SOURCE-SEAL.json'
PRIOR_SHA = 'eb6295120ed72c227589db7c88920bb8654b170af19f9677c553824919782901'
MAX_BYTES = 262144


def sha(data):
    return hashlib.sha256(data).hexdigest()


def main():
    if OUTPUT.exists() or sha(PRIOR.read_bytes()) != PRIOR_SHA:
        raise ValueError('output-exists-or-prior-drift')
    prior = json.loads(PRIOR.read_text())
    if [row['ordinal'] for row in prior['rows']] != list(range(1, 13)):
        raise ValueError('prior-row-shape')
    rows = []
    for row in prior['rows']:
        ordinal = row['ordinal']
        raw = Path(prior['archive']) / 'pairs' / f'{ordinal:02d}-pr11-mixed-{ordinal:02d}' / 'raw'
        base = raw / 'sources/session/base'
        task_files = [p for p in (raw / 'tasks').glob('*.json') if p.name != 'binding.json']
        if len(task_files) != 1:
            raise ValueError(f'task-count:{ordinal}')
        task = json.loads(task_files[0].read_text())
        commit = subprocess.check_output(
            ['git', '-c', f'safe.directory={base}', '-C', str(base), 'rev-parse', 'HEAD'], text=True
        ).strip()
        issue = task['problem_statement']
        if (task['instance_id'] != row['instance_id'] or commit != row['base_commit'] or
                sha(issue.encode()) != row['issue_sha256']):
            raise ValueError(f'task-identity:{ordinal}')
        delivered = set(row['delivered_paths'])
        parents = {str(Path(path).parent) for path in delivered}
        tracked = [x.decode('utf-8', 'surrogateescape') for x in subprocess.check_output(
            ['git', '-c', f'safe.directory={base}', '-C', str(base), 'ls-files', '-z']
        ).split(b'\0') if x]
        candidates = []
        for path in tracked:
            if path in delivered or str(Path(path).parent) not in parents:
                continue
            file = base / path
            if not file.is_file() or file.is_symlink() or file.stat().st_size > MAX_BYTES:
                continue
            data = file.read_bytes()
            if b'\0' in data:
                continue
            try:
                data.decode('utf-8')
            except UnicodeDecodeError:
                continue
            candidates.append({'path': path, 'bytes': len(data),
                               'shared_parent': str(Path(path).parent),
                               'source_sha256': sha(data)})
        rows.append({'ordinal': ordinal, 'instance_id': row['instance_id'],
                     'repo': row['repo'], 'base_commit': commit,
                     'issue_sha256': row['issue_sha256'],
                     'delivered_paths': sorted(delivered),
                     'tracked_files': len(tracked), 'candidates': candidates})
    output = {'schema_version': 'g02.r11-same-directory-pool-exposed-seal/v1',
              'posture': 'source-only-exposed-development-no-gold-dsh-or-score',
              'prior_seal_sha256': PRIOR_SHA,
              'script_sha256': sha(Path(__file__).read_bytes()),
              'rule': 'Tracked regular UTF-8 text file <=262144 bytes sharing the exact parent directory of any ARE-delivered source file; exclude delivered paths; no ranking or model calls.',
              'rows': rows,
              'claim_ceiling': 'Candidate coverage only; no selection, actual read, native score, cost or superiority.'}
    data = (json.dumps(output, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    print(json.dumps({'status': 'sealed-source-only', 'sha256': sha(data),
                      'candidate_counts': [len(row['candidates']) for row in rows]}))


if __name__ == '__main__':
    main()
