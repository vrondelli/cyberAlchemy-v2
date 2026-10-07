#!/usr/bin/env python3
"""Source-only rank of same-directory files defining identifiers used by delivered reads."""

import hashlib
import json
import math
import os
import re
import subprocess
from collections import Counter
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive')
POOL = ROOT / 'g02-r11-same-directory-pool-exposed-r1-20261003/SOURCE-SEAL.json'
OUTPUT = ROOT / 'g02-r11-same-directory-declaration-links-exposed-r1-20261003/SOURCE-SEAL.json'
POOL_SHA = '58977faf143e620d3f6695d79a58b37c01669a3d7ae239992833d97f37c38dc1'
MAX_BYTES = 262144
STOP = {'data', 'value', 'values', 'result', 'results', 'test', 'tests', 'main',
        'error', 'errors', 'config', 'module', 'object', 'string', 'types', 'type',
        'const', 'setup', 'check', 'parse', 'build', 'create', 'class', 'func'}
DECL = re.compile(
    r'(?m)^\s{0,4}(?:async\s+def|def|class|struct|enum(?:\s+class)?|using)\s+([A-Za-z_]\w*)\b'
    r'|^\s*#\s*define\s+([A-Za-z_]\w*)\b')


def sha(data):
    return hashlib.sha256(data).hexdigest()


def safe_source(base, rel):
    path = Path(rel)
    if path.is_absolute() or not path.parts or any(part in ('', '.', '..') for part in path.parts):
        raise ValueError('unsafe-source-path')
    file = base / path
    if not file.is_file() or file.is_symlink() or file.stat().st_size > MAX_BYTES:
        return None
    return file.read_bytes()


def declarations(source):
    return {name for match in DECL.finditer(source) for name in match.groups()
            if name and len(name) >= 5 and name.lower() not in STOP}


def main():
    if OUTPUT.exists() or sha(POOL.read_bytes()) != POOL_SHA:
        raise ValueError('output-exists-or-pool-drift')
    pool = json.loads(POOL.read_text())
    if [row['ordinal'] for row in pool['rows']] != list(range(1, 13)):
        raise ValueError('pool-shape')
    rows = []
    for row in pool['rows']:
        ordinal = row['ordinal']
        raw = ROOT / 'g02-product-replication-r11-20261002/pairs' / f'{ordinal:02d}-pr11-mixed-{ordinal:02d}/raw'
        base = raw / 'sources/session/base'
        task_files = [path for path in (raw / 'tasks').glob('*.json') if path.name != 'binding.json']
        if len(task_files) != 1:
            raise ValueError(f'task-count:{ordinal}')
        task = json.loads(task_files[0].read_text())
        commit = subprocess.check_output(
            ['git', '-c', f'safe.directory={base}', '-C', str(base), 'rev-parse', 'HEAD'], text=True
        ).strip()
        if (task['instance_id'] != row['instance_id'] or
                sha(task['problem_statement'].encode()) != row['issue_sha256'] or
                commit != row['base_commit']):
            raise ValueError(f'task-identity:{ordinal}')
        delivered_text = []
        for rel in row['delivered_paths']:
            data = safe_source(base, rel)
            if data is not None:
                delivered_text.append(data.decode('utf-8', errors='replace'))
        delivered_tokens = set(re.findall(r'\b[A-Za-z_]\w*\b', '\n'.join(delivered_text)))
        candidate_rows = []
        document_frequency = Counter()
        for candidate in row['candidates']:
            data = safe_source(base, candidate['path'])
            if data is None or sha(data) != candidate['source_sha256']:
                raise ValueError(f'candidate-source-drift:{ordinal}:{candidate["path"]}')
            names = declarations(data.decode('utf-8'))
            links = names & delivered_tokens
            candidate_rows.append((candidate, names, links))
            document_frequency.update(links)
        ranked = []
        for candidate, names, links in candidate_rows:
            if not links:
                continue
            score = sum(1 / document_frequency[name] for name in links) / math.sqrt(len(names))
            ranked.append({'path': candidate['path'], 'source_sha256': candidate['source_sha256'],
                           'score': round(score, 9), 'linked_declarations': sorted(links),
                           'declaration_count': len(names)})
        ranked.sort(key=lambda item: (-item['score'], item['path']))
        rows.append({'ordinal': ordinal, 'instance_id': row['instance_id'],
                     'base_commit': commit, 'issue_sha256': row['issue_sha256'],
                     'eligible_count': len(ranked), 'proposals': ranked[:3]})
    receipt = {'schema_version': 'g02.r11-same-directory-declaration-links-exposed-seal/v1',
               'posture': 'source-only-exposed-development-no-gold-dsh-or-score',
               'source_pool_sha256': POOL_SHA, 'script_sha256': sha(Path(__file__).read_bytes()),
               'rule': 'Candidate top-level declaration names >=5 characters, excluding generic stop names, must occur as whole identifiers in ARE-delivered source. Rank by inverse same-directory candidate-document frequency, normalized by square root of declaration count; lexicographic tie; max three per task; abstain on no links.',
               'rows': rows, 'claim_ceiling': 'Source-only file proposals; no actual ARE read, native score, model cost or superiority.'}
    data = (json.dumps(receipt, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    print(json.dumps({'status': 'sealed-source-only', 'sha256': sha(data),
                      'proposals': [len(row['proposals']) for row in rows]}, sort_keys=True))


if __name__ == '__main__':
    main()
