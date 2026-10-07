#!/usr/bin/env python3
"""One-shot, source-only 12-file shortlist over the exposed r11 relation union."""

import hashlib
import json
import math
import os
import re
import subprocess
from collections import Counter
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive')
UNION = ROOT / 'g02-r11-relation-union-exposed-r1-20261003/SOURCE-UNION.json'
OUTPUT = ROOT / 'g02-r11-hybrid-shortlist-exposed-r1-20261004/SOURCE-SEAL.json'
UNION_SHA = '7493a1865356df42e1bae584bc196619ee6159636be6250f1ce9895650234291'
LIMIT = 262144
SHORTLIST = 12
STOP = {'about', 'after', 'also', 'another', 'before', 'been', 'build', 'class',
        'code', 'could', 'does', 'file', 'files', 'from', 'have', 'into', 'issue',
        'other', 'result', 'should', 'some', 'that', 'their', 'there', 'these',
        'this', 'using', 'when', 'which', 'with', 'would'}
TOKEN = re.compile(r'[A-Za-z][A-Za-z0-9_]{2,}')


def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def tokens(value):
    result = []
    for match in TOKEN.finditer(value):
        word = match.group().casefold()
        if word not in STOP:
            result.append(word)
        for part in word.split('_'):
            if len(part) >= 3 and part not in STOP and part != word:
                result.append(part)
    return result


def issue_text(raw):
    if raw.startswith('"') and raw.endswith('"'):
        try:
            decoded = json.loads(raw)
            if isinstance(decoded, str):
                return decoded
        except json.JSONDecodeError:
            pass
    return raw


def score(item, query, df, n, avg_len):
    freq = item['freq']
    length = item['token_count']
    value = 0.0
    for term in query:
        tf = freq.get(term, 0)
        if tf:
            idf = math.log1p((n - df[term] + 0.5) / (df[term] + 0.5))
            value += idf * tf * 2.2 / (tf + 1.2 * (0.25 + 0.75 * length / avg_len))
    # Filename and direct graph edges are source-only priors, not label-based rules.
    path_words = set(tokens(item['path'].replace('/', ' ')))
    value += sum(1.5 * math.log1p((n - df[term] + 0.5) / (df[term] + 0.5))
                 for term in query if term in path_words)
    if 'python_import' in item['channels'] or 'cpp_include' in item['channels']:
        value += 0.5
    if len(item['channels']) > 1:
        value += 0.5
    return value


def main():
    if OUTPUT.exists() or digest(UNION) != UNION_SHA:
        raise ValueError('output-exists-or-union-drift')
    union = json.loads(UNION.read_text())
    if [row['ordinal'] for row in union['rows']] != list(range(1, 13)):
        raise ValueError('ordinal-drift')
    rows = []
    for row in union['rows']:
        ordinal = row['ordinal']
        raw = ROOT / 'g02-product-replication-r11-20261002/pairs' / f'{ordinal:02d}-pr11-mixed-{ordinal:02d}' / 'raw'
        base = raw / 'sources/session/base'
        tasks = [path for path in (raw / 'tasks').glob('*.json') if path.name != 'binding.json']
        if len(tasks) != 1:
            raise ValueError(f'task-count:{ordinal}')
        task = json.loads(tasks[0].read_text())
        commit = subprocess.check_output(['git', '-c', f'safe.directory={base}', '-C', str(base),
                                          'rev-parse', 'HEAD'], text=True).strip()
        if (task['instance_id'] != row['instance_id'] or
                hashlib.sha256(task['problem_statement'].encode()).hexdigest() != row['issue_sha256'] or
                commit != row['base_commit']):
            raise ValueError(f'identity-drift:{ordinal}')
        query = set(tokens(issue_text(task['problem_statement'])))
        candidates = []
        for item in row['candidates']:
            if item['bytes'] > LIMIT:
                continue
            rel = Path(item['path'])
            if rel.is_absolute() or '..' in rel.parts:
                raise ValueError(f'unsafe-path:{ordinal}')
            path = base / rel
            if path.is_symlink() or not path.is_file() or path.stat().st_size != item['bytes']:
                raise ValueError(f'source-drift:{ordinal}:{rel}')
            content = path.read_bytes().decode('utf-8', 'replace')
            freq = Counter(tokens(content))
            candidates.append({**item, 'freq': freq, 'token_count': max(1, sum(freq.values()))})
        n = len(candidates)
        df = Counter(term for item in candidates for term in item['freq'])
        avg_len = max(1, sum(item['token_count'] for item in candidates) / max(1, n))
        ranked = sorted(candidates, key=lambda item: (-score(item, query, df, n, avg_len),
                                                     item['bytes'], item['path']))
        chosen = [{'path': item['path'], 'bytes': item['bytes'], 'channels': item['channels']}
                  for item in ranked[:SHORTLIST]]
        rows.append({key: row[key] for key in ('ordinal', 'instance_id', 'repo',
                                              'base_commit', 'issue_sha256') } |
                    {'eligible_candidates': n, 'shortlist': chosen})
    output = {'schema_version': 'g02.r11-hybrid-shortlist-exposed-r1/v1',
              'posture': 'source-only-exposed-development-no-gold-dsh-score-or-model',
              'union_sha256': UNION_SHA, 'script_sha256': digest(Path(__file__)),
              'policy': 'Per-task BM25 issue-to-code terms over <=256KiB relation-union files; filename-IDF and fixed direct-relation priors; top 12, no gold-aware tuning.',
              'rows': rows,
              'claim_ceiling': 'Shortlist feasibility only; no ARE read, native score, independent quality, or superiority.'}
    data = (json.dumps(output, sort_keys=True, indent=2) + '\n').encode()
    OUTPUT.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    print(json.dumps({'rows': len(rows), 'shortlist': sum(len(row['shortlist']) for row in rows),
                      'sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
