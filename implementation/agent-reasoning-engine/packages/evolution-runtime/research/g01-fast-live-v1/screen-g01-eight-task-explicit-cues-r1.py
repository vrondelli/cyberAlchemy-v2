#!/usr/bin/env python3
"""Score-blind explicit-filename transfer census on eight admitted development tasks."""

import hashlib
import json
import os
import re
import subprocess
from collections import defaultdict
from pathlib import Path


REPO = Path(__file__).resolve().parents[4]
ROOT = Path('/home/vlad_/are-benchmark-archive')
CANDIDATE = Path(__file__).with_name('g01-r8-eight-task-transfer-r1') / 'CANDIDATE.json'
EXPECTED_CANDIDATE = 'a134c8f7df6f4165c4053576365ccfb03d2c8b2c2d57d7dcf1a21848ec3bc0a2'
TASKS = REPO / 'benchmarks/contextbench-v1/development-tasks'
CACHES = ROOT / 'g01-r8-eight-task-caches-r1'
OUT = ROOT / 'g01-eight-task-explicit-cue-screen-r1-20261004/SOURCE-SEAL.json'
MENTION = re.compile(r'(?<![\w])(?:[\w.-]+/)*[\w.-]+\.(?:py|go|js|jsx|ts|tsx|java|rs|c|cc|cpp|h|hpp)(?![\w])', re.I)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def git(cache, *args):
    return subprocess.check_output(['git', '-C', str(cache), *args])


def main():
    if OUT.exists() or sha(CANDIDATE.read_bytes()) != EXPECTED_CANDIDATE:
        raise SystemExit('candidate-drift-or-output-exists')
    candidate = json.loads(CANDIDATE.read_text())
    if candidate['selected_count'] != 8 or len(candidate['selected']) != 8:
        raise SystemExit('cohort-drift')
    rows = []
    for ordinal, task in enumerate(candidate['selected'], 1):
        cache = CACHES / (task['repo'].replace('/', '--') + '.git')
        if git(cache, 'cat-file', '-t', task['base_commit']).decode().strip() != 'commit':
            raise SystemExit('commit-missing')
        task_path = TASKS / (task['instance_id'] + '.json')
        body = json.loads(task_path.read_text())
        if any(body[k] != task[k] for k in ('instance_id', 'repo', 'repo_url', 'base_commit')):
            raise SystemExit('task-identity-drift')
        issue = body['problem_statement']
        if issue.startswith('"') and issue.endswith('"'):
            try:
                decoded = json.loads(issue)
                if isinstance(decoded, str):
                    issue = decoded
            except json.JSONDecodeError:
                pass
        paths = [x.decode('utf-8') for x in git(cache, 'ls-tree', '-r', '-z', '--name-only',
                                                 task['base_commit']).split(b'\0') if x]
        tracked = set(paths)
        by_name = defaultdict(list)
        for path in paths:
            by_name[path.rsplit('/', 1)[-1].lower()].append(path)
        mentions = list(dict.fromkeys(MENTION.findall(issue)))
        resolved = []
        ambiguous = unresolved = 0
        for raw in mentions:
            mention = raw.removeprefix('./')
            if mention in tracked:
                path, method = mention, 'exact'
            else:
                matches = by_name.get(mention.rsplit('/', 1)[-1].lower(), [])
                if len(matches) != 1:
                    ambiguous += len(matches) > 1
                    unresolved += len(matches) == 0
                    continue
                path, method = matches[0], 'unique-basename'
            if path not in [x['path'] for x in resolved]:
                resolved.append({'path': path, 'method': method})
        rows.append({'ordinal': ordinal, 'instance_id': task['instance_id'],
                     'repo': task['repo'], 'base_commit': task['base_commit'],
                     'task_sha256': sha(task_path.read_bytes()),
                     'source_like_mentions': len(mentions), 'ambiguous_mentions': ambiguous,
                     'unresolved_mentions': unresolved,
                     'resolved_candidates': resolved[:8],
                     'omitted_resolved_candidates': max(0, len(resolved) - 8)})
    result = {'schema_version': 'g01.eight-task-explicit-cue-screen-r1/v1',
              'posture': 'source-only-development-transfer-before-model-or-gold',
              'candidate_sha256': EXPECTED_CANDIDATE,
              'script_sha256': sha(Path(__file__).read_bytes()),
              'policy': {'resolution': 'exact tracked path else unique basename at pinned commit',
                         'maximum_candidates_per_task': 8},
              'rows': rows,
              'claim_ceiling': 'Source-only cue opportunity census; no retrieval quality, native score, live episode, independent confirmation or superiority.'}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    OUT.parent.mkdir(mode=0o700, parents=True, exist_ok=False)
    fd = os.open(OUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as file:
        file.write(data)
    print(json.dumps({'tasks': len(rows), 'with_candidates': sum(bool(r['resolved_candidates']) for r in rows),
                      'candidates': sum(len(r['resolved_candidates']) for r in rows),
                      'sha256': sha(data)}))


if __name__ == '__main__':
    main()
