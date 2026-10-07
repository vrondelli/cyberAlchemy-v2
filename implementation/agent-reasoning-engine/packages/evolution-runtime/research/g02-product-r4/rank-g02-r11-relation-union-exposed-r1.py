#!/usr/bin/env python3
"""Source-only, issue-anchor rank over the already exposed r11 relation union."""

import hashlib
import json
import math
import os
import re
import subprocess
from collections import Counter
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive')
SOURCE = ROOT / 'g02-r11-relation-union-exposed-r1-20261003/SOURCE-UNION.json'
OUTPUT = ROOT / 'g02-r11-relation-anchor-rank-exposed-r1-20261003/SOURCE-RANK.json'
SOURCE_SHA = '7493a1865356df42e1bae584bc196619ee6159636be6250f1ce9895650234291'
WORD = re.compile(r'[A-Za-z][A-Za-z0-9_]{3,}')
BACKTICK = re.compile(r'`([^`\n]{3,100})`')
STOP = {'about', 'after', 'also', 'another', 'available', 'before', 'behavior',
        'change', 'changes', 'code', 'could', 'current', 'does', 'file', 'files',
        'from', 'have', 'into', 'issue', 'make', 'module', 'more', 'only', 'other',
        'should', 'source', 'support', 'system', 'test', 'tests', 'that', 'their',
        'there', 'these', 'this', 'type', 'types', 'using', 'when', 'where', 'which',
        'with', 'work', 'would', 'json', 'python', 'include', 'error', 'result'}


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as source:
        for block in iter(lambda: source.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def words(value):
    return {word.lower() for word in WORD.findall(value) if word.lower() not in STOP}


def anchors(issue):
    # Strip common PR checklist boilerplate before extracting anchors.
    lines = [line for line in issue.splitlines()
             if not re.match(r'^\s*-\s*\[[ xX]\]', line)]
    issue = '\n'.join(lines)
    code = set()
    for fragment in BACKTICK.findall(issue):
        code.update(words(fragment))
    for token in WORD.findall(issue):
        if '_' in token or any(char.isdigit() for char in token):
            code.add(token.lower())
    title = next((line for line in lines if line.strip() and not line.startswith('# ')), '')
    title = title.removeprefix('Issue title: ').removeprefix('### Issue title: ')
    title_words = words(title)
    return code, title_words


def main():
    if OUTPUT.exists() or sha(SOURCE) != SOURCE_SHA:
        raise SystemExit('output exists or source seal drift')
    source = json.loads(SOURCE.read_text())
    if [row['ordinal'] for row in source['rows']] != list(range(1, 13)):
        raise SystemExit('source row drift')
    rows = []
    for row in source['rows']:
        ordinal = row['ordinal']
        raw = ROOT / 'g02-product-replication-r11-20261002/pairs' / f'{ordinal:02d}-pr11-mixed-{ordinal:02d}/raw'
        base = raw / 'sources/session/base'
        tasks = [path for path in (raw / 'tasks').glob('*.json') if path.name != 'binding.json']
        if len(tasks) != 1:
            raise SystemExit(f'task count: {ordinal}')
        task = json.loads(tasks[0].read_text())
        commit = subprocess.check_output(['git', '-c', f'safe.directory={base}',
                                          '-C', str(base), 'rev-parse', 'HEAD'],
                                         text=True).strip()
        if (task['instance_id'] != row['instance_id'] or
                hashlib.sha256(task['problem_statement'].encode()).hexdigest() != row['issue_sha256'] or
                commit != row['base_commit']):
            raise SystemExit(f'task identity drift: {ordinal}')
        code, title = anchors(task['problem_statement'])
        candidates = []
        document_frequency = Counter()
        for item in row['candidates']:
            if item['bytes'] > source['max_read_bytes']:
                continue
            rel = Path(item['path'])
            if rel.is_absolute() or any(part in ('', '.', '..') for part in rel.parts):
                raise SystemExit(f'unsafe path: {ordinal}')
            path = base / rel
            if not path.is_file() or path.is_symlink() or path.stat().st_size != item['bytes']:
                raise SystemExit(f'source drift: {ordinal}:{rel}')
            data = path.read_bytes()
            if len(data) > source['max_read_bytes']:
                raise SystemExit(f'read cap: {ordinal}:{rel}')
            content = words(data.decode('utf-8', errors='replace'))
            matched = content & (code | title)
            document_frequency.update(matched)
            candidates.append((item, matched, words(item['path'])))
        ranked = []
        count = len(candidates)
        for item, matched, path_words in candidates:
            code_hits = matched & code
            title_hits = matched & title
            name_hits = path_words & (code | title)
            if not code_hits and len(title_hits) < 2 and not name_hits:
                continue
            weighted = sum((2.0 if token in code else 1.0) *
                           math.log((count + 1) / (document_frequency[token] + 1))
                           for token in matched)
            relation = 1.0 if ('cpp_include' in item['channels'] or
                               'python_import' in item['channels']) else 0.0
            score = weighted / math.sqrt(max(1.0, item['bytes'] / 4096))
            score += 2.0 * len(name_hits) + relation
            if score < 3.0:
                continue
            ranked.append({'path': item['path'], 'score': round(score, 6),
                           'channels': item['channels'], 'code_hits': sorted(code_hits),
                           'title_hits': sorted(title_hits), 'path_hits': sorted(name_hits),
                           'bytes': item['bytes']})
        ranked.sort(key=lambda item: (-item['score'], item['path']))
        rows.append({'ordinal': ordinal, 'instance_id': row['instance_id'],
                     'base_commit': commit, 'issue_sha256': row['issue_sha256'],
                     'issue_code_anchor_count': len(code),
                     'issue_title_anchor_count': len(title),
                     'eligible_candidates': count, 'ranked_candidates': len(ranked),
                     'proposals': ranked[:3]})
    output = {'schema_version': 'g02.r11-relation-anchor-rank-exposed-source/v1',
              'posture': 'source-only-exposed-development-no-gold-dsh-score-or-model',
              'source_union_sha256': SOURCE_SHA, 'script_sha256': sha(Path(__file__)),
              'policy': 'Remove checklist lines. Extract backticked/underscore/digit code anchors plus first nonheading title tokens; candidate code-word overlap weighted by within-pool IDF, code weight 2, title weight 1, 4KiB square-root size normalization, +2 per path-token overlap, +1 direct import/include relation. Require code hit or two title hits or path hit; score >=3; top three, else abstain.',
              'rows': rows,
              'claim_ceiling': 'Sealed source-only proposals; no actual ARE read, native score, all-in cost, independent transfer, or superiority.'}
    data = (json.dumps(output, sort_keys=True, indent=2) + '\n').encode()
    OUTPUT.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    print(json.dumps({'proposals': [len(row['proposals']) for row in rows],
                      'sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
