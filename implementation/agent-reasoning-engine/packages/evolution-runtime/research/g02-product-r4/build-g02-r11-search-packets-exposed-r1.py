#!/usr/bin/env python3
"""Seal gold-blind issue and ARE-read context for exposed r11 search research."""

import hashlib
import json
import os
import subprocess
from pathlib import Path


ARCHIVE = Path('/home/vlad_/are-benchmark-archive')
UNION = ARCHIVE / 'g02-r11-relation-union-exposed-r1-20261003/SOURCE-UNION.json'
UNION_SHA = '7493a1865356df42e1bae584bc196619ee6159636be6250f1ce9895650234291'
DEFINITION = ARCHIVE / 'g02-product-replication-r11-20261002/definition/DEFINITION.json'
OUTPUT = ARCHIVE / 'g02-r11-search-packets-exposed-r1-20261004/PACKETS.json'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def read_json(path):
    return json.loads(path.read_text())


def issue_text(raw):
    if raw.startswith('"') and raw.endswith('"'):
        try:
            decoded = json.loads(raw)
            if isinstance(decoded, str):
                return decoded
        except json.JSONDecodeError:
            pass
    return raw


def main():
    if OUTPUT.exists() or sha(UNION.read_bytes()) != UNION_SHA:
        raise SystemExit('output-exists-or-union-drift')
    union = {row['ordinal']: row for row in read_json(UNION)['rows']}
    definition = read_json(DEFINITION)
    rows = []
    for item in definition['ordered_pairs'][:12]:
        ordinal = item['ordinal']
        source = union[ordinal]
        raw = ARCHIVE / 'g02-product-replication-r11-20261002/pairs' / f'{ordinal:02d}-pr11-mixed-{ordinal:02d}' / 'raw'
        task_files = [p for p in (raw / 'tasks').glob('*.json') if p.name != 'binding.json']
        if len(task_files) != 1:
            raise SystemExit(f'task-count:{ordinal}')
        task = read_json(task_files[0])
        prediction = read_json(raw / 'policy-pruning/prediction.json')
        base = raw / 'sources/session/base'
        commit = subprocess.check_output(['git', '-C', str(base), 'rev-parse', 'HEAD'], text=True).strip()
        if (task['instance_id'] != item['instance_id'] or prediction['instance_id'] != item['instance_id']
                or commit != item['base_commit'] or source['base_commit'] != commit
                or sha(task['problem_statement'].encode()) != source['issue_sha256']):
            raise SystemExit(f'identity-drift:{ordinal}')
        selected = prediction['traj_data']['pred_files']
        if not isinstance(selected, list) or not all(isinstance(p, str) for p in selected):
            raise SystemExit(f'prediction-shape:{ordinal}')
        if not all(p in source['delivered_paths'] for p in selected):
            raise SystemExit(f'selected-not-delivered:{ordinal}')
        issue = issue_text(task['problem_statement'])[:7000]
        rows.append({'ordinal': ordinal, 'instance_id': item['instance_id'], 'repo': item['repo'],
                     'base_commit': commit, 'cache_base': item['cache_base'], 'cache_name': item['cache_name'],
                     'issue': issue, 'selected_paths': selected,
                     'delivered_paths': source['delivered_paths'], 'maximum_new_reads': 3})
    if len(rows) != 12 or [r['ordinal'] for r in rows] != list(range(1, 13)):
        raise SystemExit('task-order')
    packet = {'schema_version': 'g02.r11-search-packets-exposed-r1/v1',
              'posture': 'source-only-exposed-development-no-gold-dsh-or-score',
              'input_sha256': {'union': UNION_SHA, 'definition': sha(DEFINITION.read_bytes())},
              'policy': 'First 12 exact r11 tasks; issue prefix <=7000 characters; selected and delivered paths only; three new reads maximum.',
              'ordered_packets': rows,
              'claim_ceiling': 'Exposed acquisition research only; no actual ARE reads, native F1, independent quality or superiority.'}
    data = (json.dumps(packet, sort_keys=True, indent=2) + '\n').encode()
    OUTPUT.parent.mkdir(mode=0o700, parents=True, exist_ok=False)
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'rows': len(rows), 'bytes': len(data), 'sha256': sha(data)}))


if __name__ == '__main__':
    main()
