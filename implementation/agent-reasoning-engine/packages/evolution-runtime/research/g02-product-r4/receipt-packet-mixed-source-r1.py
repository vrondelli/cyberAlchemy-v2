#!/usr/bin/env python3
"""Build a receipt-bound G02 packet for Pro, Verified, or Multi tasks."""

import hashlib
import json
import subprocess
from pathlib import Path


PREFIXES = ('SWE-Bench-Pro__', 'SWE-Bench-Verified__', 'Multi-SWE-Bench__')
MAX_PACKET_BYTES = 262144


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def task_file(root):
    tasks = sorted(path for path in (root / 'tasks').glob('*.json')
                   if path.name.startswith(PREFIXES))
    if len(tasks) != 1:
        raise ValueError(f'g02-mixed-packet.exactly-one-task-required:{len(tasks)}')
    return tasks[0]


def packet(root):
    root = Path(root)
    prediction_path = root / 'evidence/run/prediction.json'
    task_path = task_file(root)
    prediction = json.loads(prediction_path.read_text())
    task = json.loads(task_path.read_text())
    if prediction['instance_id'] != task.get('instance_id', task_path.stem):
        raise ValueError('g02-mixed-packet.instance-id-mismatch')
    issue = task['problem_statement']
    trajectory = prediction['traj_data']
    checkout = root / 'sources/session/base'
    git = ['git', '-c', f'safe.directory={checkout}', '-C', str(checkout)]
    commit = subprocess.check_output(git + ['rev-parse', 'HEAD'], text=True).strip()
    if commit != prediction['commit']:
        raise ValueError('g02-mixed-packet.base-commit-mismatch')
    if subprocess.check_output(git + ['status', '--porcelain', '--untracked-files=no'],
                               text=True).strip():
        raise ValueError('g02-mixed-packet.modified-base-checkout')
    source_lines = {}
    handles = []
    for index, step in enumerate(trajectory['pred_steps']):
        if len(step['files']) != 1:
            raise ValueError('g02-mixed-packet.multiple-files-in-step')
        path = step['files'][0]
        source_path = checkout / path
        if path not in source_lines:
            if not source_path.is_file():
                raise ValueError('g02-mixed-packet.missing-source:' + path)
            source_lines[path] = source_path.read_text(errors='replace').splitlines()
        lines = source_lines[path]
        for span in step['spans'][path]:
            start, end = span['start'], span['end']
            if not (1 <= start <= end <= len(lines)):
                raise ValueError('g02-mixed-packet.invalid-read-range')
            snippet = '\n'.join(f'{line}: {lines[line - 1]}'
                                for line in range(start, end + 1))
            handles.append({'index': index, 'path': path, 'start': start, 'end': end,
                            'source_sha256': sha(source_path), 'snippet': snippet})
    for path, spans in trajectory['pred_spans'].items():
        if path not in source_lines:
            raise ValueError('g02-mixed-packet.selected-file-not-delivered')
        for span in spans:
            if not any(handle['path'] == path and handle['start'] == span['start']
                       and handle['end'] == span['end'] for handle in handles):
                raise ValueError('g02-mixed-packet.selected-span-not-delivered')
    value = {'instance_id': prediction['instance_id'], 'issue': issue,
             'current_selected_files': trajectory['pred_files'],
             'delivered_reads': handles, 'prediction_sha256': sha(prediction_path),
             'task_sha256': sha(task_path)}
    encoded = json.dumps(value, sort_keys=True, ensure_ascii=False).encode()
    if len(encoded) > MAX_PACKET_BYTES:
        raise ValueError('g02-mixed-packet.packet-too-large')
    return value, len(encoded), len(handles), len(source_lines)
