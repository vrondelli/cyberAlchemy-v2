#!/usr/bin/env python3
"""Gold-blind exact/unique filename resolution on exposed r17 issues."""

import hashlib
import json
import os
import re
import subprocess
from collections import defaultdict
from pathlib import Path


ARCHIVE = Path('/home/vlad_/are-benchmark-archive')
INPUT = ARCHIVE / 'g01-product-replication-input-r16-r2'
DEFINITION = INPUT / 'DEFINITION.json'
DEFINITION_SHA = '2f18ee18104c4826d06a5aeaa89a29e9e04b4204e0dbdb5908d514fc492f212e'
OUTPUT = ARCHIVE / 'g01-r17-explicit-file-exposed-r1-20261004/SOURCE-SEAL.json'
MENTION = re.compile(r'(?<![\w])(?:[\w.-]+/)*[\w.-]+\.(?:py|go|js|jsx|ts|tsx|java|rs|c|cc|cpp|h|hpp)(?![\w])', re.I)
MAX_CANDIDATES = 8


def sha(data):
    return hashlib.sha256(data).hexdigest()


def git(cache, *args):
    return subprocess.check_output(['git', '-C', str(cache), *args])


def local_cache(path):
    parts = Path(path).parts
    if path.startswith('/dev/shm/are-g01-r16-source-caches-r1/'):
        return ARCHIVE / 'g01-r16-source-caches-r1-20261002' / parts[-1]
    if path.startswith('/dev/shm/are-g01-r16-r2-delta-caches-r1/'):
        return ARCHIVE / 'g01-r16-r2-delta-caches-r1-20261003' / parts[-1]
    raise SystemExit(f'unknown-cache-generation:{path}')


def main():
    if OUTPUT.exists() or sha(DEFINITION.read_bytes()) != DEFINITION_SHA:
        raise SystemExit('output-exists-or-definition-drift')
    tasks = json.loads(DEFINITION.read_text())['ordered_tasks']
    if len(tasks) != 24:
        raise SystemExit('task-count')
    rows = []
    for number, task in enumerate(tasks, 1):
        cache = local_cache(task['repository_cache'])
        if git(cache, 'cat-file', '-t', task['base_commit']).decode().strip() != 'commit':
            raise SystemExit(f'commit-missing:{number}')
        source = INPUT / 'tasks' / (task['instance_id'] + '.json')
        body = json.loads(source.read_text())
        if body['instance_id'] != task['instance_id']:
            raise SystemExit(f'task-drift:{number}')
        issue = body['problem_statement']
        if not isinstance(issue, str):
            raise SystemExit(f'issue-shape:{number}')
        if issue.startswith('"') and issue.endswith('"'):
            try:
                decoded = json.loads(issue)
                if isinstance(decoded, str):
                    issue = decoded
            except json.JSONDecodeError:
                pass
        paths = [x.decode('utf-8') for x in git(cache, 'ls-tree', '-r', '-z', '--name-only', task['base_commit']).split(b'\0') if x]
        pathset = set(paths)
        by_basename = defaultdict(list)
        for path in paths:
            by_basename[path.rsplit('/', 1)[-1].lower()].append(path)
        mentions = list(dict.fromkeys(MENTION.findall(issue)))
        chosen = []
        ambiguous = unresolved = 0
        for raw in mentions:
            mention = raw.removeprefix('./')
            if mention in pathset:
                match = mention
                method = 'exact'
            else:
                equivalents = by_basename.get(mention.rsplit('/', 1)[-1].lower(), [])
                if len(equivalents) == 1:
                    match = equivalents[0]
                    method = 'unique-basename'
                else:
                    ambiguous += len(equivalents) > 1
                    unresolved += len(equivalents) == 0
                    continue
            if match not in [item['path'] for item in chosen]:
                chosen.append({'path': match, 'method': method})
        rows.append({'ordinal': number, 'instance_id': task['instance_id'], 'repo': task['repo'],
                     'base_commit': task['base_commit'], 'task_sha256': sha(source.read_bytes()),
                     'mentioned_source_like_filenames': len(mentions), 'ambiguous_mentions': ambiguous,
                     'unresolved_mentions': unresolved, 'resolved_candidates': chosen[:MAX_CANDIDATES],
                     'omitted_resolved_candidates': max(0, len(chosen)-MAX_CANDIDATES)})
    result = {'schema_version': 'g01.r17-explicit-file-exposed-r1/v1',
              'posture': 'source-only-exposed-development-no-gold-score-or-model',
              'input_sha256': {'definition': DEFINITION_SHA},
              'script_sha256': sha(Path(__file__).read_bytes()),
              'policy': {'resolution': 'exact tracked path else unique basename at pinned Git commit',
                         'maximum_candidates_per_task': MAX_CANDIDATES,
                         'advancement_gate': {'minimum_gold_hits': 4,
                                              'minimum_candidate_precision': 0.5,
                                              'minimum_repositories_with_hit': 2}},
              'rows': rows,
              'claim_ceiling': 'Exposed input-file coverage only; no actual read, native F1, independent result or superiority.'}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    OUTPUT.parent.mkdir(mode=0o700, parents=True, exist_ok=False)
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'tasks': len(rows), 'with_candidates': sum(bool(r['resolved_candidates']) for r in rows),
                      'candidates': sum(len(r['resolved_candidates']) for r in rows), 'sha256': sha(data)}))


if __name__ == '__main__':
    main()
