#!/usr/bin/env python3
"""Seal a bounded, issue-to-filename rank over the existing G02 source pool."""

import hashlib
import json
import os
import re
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive')
SOURCE = ROOT / 'g02-r11-same-directory-pool-exposed-r1-20261003/SOURCE-SEAL.json'
OUTPUT = ROOT / 'g02-r11-same-directory-name-rank-exposed-r1-20261003/SOURCE-SEAL.json'
SOURCE_SHA = '58977faf143e620d3f6695d79a58b37c01669a3d7ae239992833d97f37c38dc1'
STOP = {'test', 'tests', 'src', 'source', 'utils', 'util', 'module', 'modules',
        'common', 'core', 'detail', 'file', 'files', 'json', 'python', 'include',
        'function', 'functions', 'class', 'classes', 'code', 'base', 'type', 'types'}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def tokens(value):
    spaced = re.sub(r'([a-z0-9])([A-Z])', r'\1 \2', value)
    return [term.lower() for term in re.findall(r'[A-Za-z][A-Za-z0-9]*', spaced)]


def rank(issue, path):
    issue_terms = set(tokens(issue))
    stem = Path(path).stem
    stem_terms = {term for term in tokens(stem) if len(term) >= 4 and term not in STOP}
    matched = sorted(stem_terms & issue_terms)
    exact_stem = (len(stem) >= 5 and stem.lower() not in STOP and
                  re.search(r'(?<![A-Za-z0-9_])' + re.escape(stem) + r'(?![A-Za-z0-9_])',
                            issue, re.IGNORECASE) is not None)
    score = (4 if exact_stem else 0) + 2 * len(matched)
    return score, matched, bool(exact_stem)


def main():
    if OUTPUT.exists() or sha(SOURCE.read_bytes()) != SOURCE_SHA:
        raise ValueError('output-exists-or-source-drift')
    source = json.loads(SOURCE.read_text())
    if [row['ordinal'] for row in source['rows']] != list(range(1, 13)):
        raise ValueError('source-rows')
    rows = []
    for row in source['rows']:
        ordinal = row['ordinal']
        raw = ROOT / 'g02-product-replication-r11-20261002/pairs' / f'{ordinal:02d}-pr11-mixed-{ordinal:02d}/raw'
        task_files = [path for path in (raw / 'tasks').glob('*.json') if path.name != 'binding.json']
        if len(task_files) != 1:
            raise ValueError(f'task-count:{ordinal}')
        task = json.loads(task_files[0].read_text())
        issue = task['problem_statement']
        if task['instance_id'] != row['instance_id'] or sha(issue.encode()) != row['issue_sha256']:
            raise ValueError(f'task-identity:{ordinal}')
        scored = []
        for candidate in row['candidates']:
            score, matched, exact_stem = rank(issue, candidate['path'])
            if score:
                scored.append({'path': candidate['path'], 'source_sha256': candidate['source_sha256'],
                               'score': score, 'matched_stem_terms': matched,
                               'exact_stem': exact_stem})
        scored.sort(key=lambda item: (-item['score'], item['path']))
        rows.append({'ordinal': ordinal, 'instance_id': row['instance_id'],
                     'base_commit': row['base_commit'], 'issue_sha256': row['issue_sha256'],
                     'eligible_count': len(scored), 'proposals': scored[:3]})
    receipt = {'schema_version': 'g02.r11-same-directory-name-rank-exposed-seal/v1',
               'posture': 'source-only-exposed-development-no-gold-dsh-or-score',
               'source_pool_sha256': SOURCE_SHA, 'script_sha256': sha(Path(__file__).read_bytes()),
               'rule': 'Rank same-directory candidates by whole issue mention of basename stem (+4) and non-generic basename components of length >=4 in issue (+2 each); lexicographic tie; only positive scores; max 3 reads per task.',
               'rows': rows,
               'claim_ceiling': 'Sealed candidate paths only; no actual ARE read, native score, cost or superiority.'}
    data = (json.dumps(receipt, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'status': 'sealed-source-only', 'sha256': sha(data),
                      'proposals': [len(row['proposals']) for row in rows]}, sort_keys=True))


if __name__ == '__main__':
    main()
