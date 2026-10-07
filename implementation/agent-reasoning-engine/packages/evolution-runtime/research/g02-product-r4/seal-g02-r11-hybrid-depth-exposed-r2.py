#!/usr/bin/env python3
"""Source-only depth curve for the frozen r11 hybrid ranker; no gold access."""

import hashlib
import importlib.util
import json
import os
import subprocess
import sys
from collections import Counter
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive')
HERE = Path(__file__).parent
R1 = HERE / 'seal-g02-r11-hybrid-shortlist-exposed-r1.py'
R1_SHA = '9cb8fe75d068d122c5216ef58c9db818d07e3238401127bc7bf9e79f81457ef6'
R1_SEAL = ROOT / 'g02-r11-hybrid-shortlist-exposed-r1-20261004/SOURCE-SEAL.json'
R1_SEAL_SHA = '1ebc6cf69ee9032415d754130054c6f3fe864a850d586a76538a23ed0dbd31e8'
UNION = ROOT / 'g02-r11-relation-union-exposed-r1-20261003/SOURCE-UNION.json'
UNION_SHA = '7493a1865356df42e1bae584bc196619ee6159636be6250f1ce9895650234291'
OUTPUT = ROOT / 'g02-r11-hybrid-depth-exposed-r2-20261004/SOURCE-SEAL.json'
DEPTHS = (12, 24, 48, 96)


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def main():
    if OUTPUT.exists() or any(sha(path) != pin for path, pin in
                              ((R1, R1_SHA), (R1_SEAL, R1_SEAL_SHA), (UNION, UNION_SHA))):
        raise SystemExit('output-exists-or-input-pin-drift')
    sys.dont_write_bytecode = True
    spec = importlib.util.spec_from_file_location('frozen_g02_hybrid_r1', R1)
    if spec is None or spec.loader is None:
        raise SystemExit('r1-module-missing')
    r1 = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(r1)
    old = {row['ordinal']: row for row in json.loads(R1_SEAL.read_text())['rows']}
    union = json.loads(UNION.read_text())
    if [row['ordinal'] for row in union['rows']] != list(range(1, 13)) or len(old) != 12:
        raise SystemExit('cohort-drift')
    rows = []
    for source in union['rows']:
        ordinal = source['ordinal']
        raw = ROOT / 'g02-product-replication-r11-20261002/pairs' / f'{ordinal:02d}-pr11-mixed-{ordinal:02d}' / 'raw'
        base = raw / 'sources/session/base'
        tasks = [path for path in (raw / 'tasks').glob('*.json') if path.name != 'binding.json']
        if len(tasks) != 1:
            raise SystemExit(f'task-count:{ordinal}')
        task = json.loads(tasks[0].read_text())
        commit = subprocess.check_output(['git', '-c', f'safe.directory={base}', '-C', str(base),
                                          'rev-parse', 'HEAD'], text=True).strip()
        if (task['instance_id'] != source['instance_id'] or
                hashlib.sha256(task['problem_statement'].encode()).hexdigest() != source['issue_sha256'] or
                commit != source['base_commit']):
            raise SystemExit(f'identity-drift:{ordinal}')
        query = set(r1.tokens(r1.issue_text(task['problem_statement'])))
        candidates = []
        for item in source['candidates']:
            if item['bytes'] > r1.LIMIT:
                continue
            rel = Path(item['path'])
            if rel.is_absolute() or '..' in rel.parts:
                raise SystemExit(f'unsafe-path:{ordinal}')
            path = base / rel
            if path.is_symlink() or not path.is_file() or path.stat().st_size != item['bytes']:
                raise SystemExit(f'source-drift:{ordinal}:{rel}')
            freq = Counter(r1.tokens(path.read_bytes().decode('utf-8', 'replace')))
            candidates.append({**item, 'freq': freq, 'token_count': max(1, sum(freq.values()))})
        n = len(candidates)
        df = Counter(term for item in candidates for term in item['freq'])
        avg_len = max(1, sum(item['token_count'] for item in candidates) / max(1, n))
        ranked = sorted(candidates, key=lambda item: (-r1.score(item, query, df, n, avg_len),
                                                     item['bytes'], item['path']))
        paths = [item['path'] for item in ranked[:max(DEPTHS)]]
        prior = [item['path'] for item in old[ordinal]['shortlist']]
        if paths[:12] != prior or old[ordinal]['eligible_candidates'] != n or len(paths) != min(n, 96):
            raise SystemExit(f'frozen-r1-parity-failed:{ordinal}')
        rows.append({key: source[key] for key in ('ordinal', 'instance_id', 'repo',
                                                 'base_commit', 'issue_sha256')} |
                    {'eligible_candidates': n, 'ranked_paths': paths})
    report = {'schema_version': 'g02.r11-hybrid-depth-exposed-r2/v1',
              'posture': 'source-only-exposed-development-no-gold-dsh-score-or-model',
              'input_sha256': {'r1_script': R1_SHA, 'r1_source_seal': R1_SEAL_SHA, 'union': UNION_SHA},
              'script_sha256': sha(Path(__file__)), 'depths': list(DEPTHS), 'rows': rows,
              'claim_ceiling': 'Rank-depth feasibility only; no ARE read, native score, independent quality or superiority.'}
    data = (json.dumps(report, sort_keys=True, indent=2) + '\n').encode()
    OUTPUT.parent.mkdir(mode=0o700, parents=True, exist_ok=False)
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    print(json.dumps({'tasks': len(rows), 'depths': DEPTHS, 'sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
