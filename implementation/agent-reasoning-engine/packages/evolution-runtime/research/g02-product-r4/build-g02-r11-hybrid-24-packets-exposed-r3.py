#!/usr/bin/env python3
"""Build source-only 24-candidate chooser packets from sealed exposed ranks."""

import hashlib
import importlib.util
import json
import os
import re
import subprocess
import sys
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive')
HERE = Path(__file__).parent
RANKS = ROOT / 'g02-r11-hybrid-depth-exposed-r2-20261004/SOURCE-SEAL.json'
RANKS_SHA = '7e2c65289f0dd8e45822dd313c037945d48ba6e45fe4825fef5cea19f7453a63'
UNION = ROOT / 'g02-r11-relation-union-exposed-r1-20261003/SOURCE-UNION.json'
UNION_SHA = '7493a1865356df42e1bae584bc196619ee6159636be6250f1ce9895650234291'
R1 = HERE / 'seal-g02-r11-hybrid-shortlist-exposed-r1.py'
R1_SHA = '9cb8fe75d068d122c5216ef58c9db818d07e3238401127bc7bf9e79f81457ef6'
OUTPUT = ROOT / 'g02-r11-hybrid-24-packets-exposed-r3-20261004/PACKETS.json'
ISSUE_LIMIT = 6000
PACKET_LIMIT = 65536


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def snippets(content, query_terms):
    lines = content.splitlines()
    candidates = []
    for i, line in enumerate(lines):
        if not line.strip() or len(line) > 800:
            continue
        terms = set(re.findall(r'[A-Za-z][A-Za-z0-9_]{2,}', line.casefold()))
        overlap = len(terms & query_terms)
        structural = bool(re.search(r'\b(def|class|function|struct|template|export|interface)\b|#\s*(include|define)', line))
        if overlap or structural:
            candidates.append((-(4 * overlap + int(structural)), i))
    picked = []
    for _, i in sorted(candidates):
        if any(abs(i - old) <= 2 for old in picked):
            continue
        picked.append(i)
        if len(picked) == 2:
            break
    if not picked:
        picked = next(([i] for i, line in enumerate(lines) if line.strip()), [])
    return [{'line': i + 1, 'text': '\n'.join(lines[max(0, i - 1):min(len(lines), i + 2)])[:350]}
            for i in picked]


def main():
    if OUTPUT.exists() or any(sha(path) != pin for path, pin in
                              ((RANKS, RANKS_SHA), (UNION, UNION_SHA), (R1, R1_SHA))):
        raise SystemExit('output-exists-or-input-pin-drift')
    sys.dont_write_bytecode = True
    spec = importlib.util.spec_from_file_location('frozen_g02_hybrid_r1', R1)
    if spec is None or spec.loader is None:
        raise SystemExit('r1-module-missing')
    r1 = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(r1)
    ranking = json.loads(RANKS.read_text())
    union = {row['ordinal']: row for row in json.loads(UNION.read_text())['rows']}
    packets = []
    for row in ranking['rows']:
        ordinal = row['ordinal']
        source = union[ordinal]
        raw = ROOT / 'g02-product-replication-r11-20261002/pairs' / f'{ordinal:02d}-pr11-mixed-{ordinal:02d}' / 'raw'
        base = raw / 'sources/session/base'
        tasks = [path for path in (raw / 'tasks').glob('*.json') if path.name != 'binding.json']
        if len(tasks) != 1:
            raise SystemExit(f'task-count:{ordinal}')
        task = json.loads(tasks[0].read_text())
        commit = subprocess.check_output(['git', '-c', f'safe.directory={base}', '-C', str(base),
                                          'rev-parse', 'HEAD'], text=True).strip()
        if (task['instance_id'] != row['instance_id'] or
                hashlib.sha256(task['problem_statement'].encode()).hexdigest() != row['issue_sha256'] or
                commit != row['base_commit']):
            raise SystemExit(f'identity-drift:{ordinal}')
        issue = r1.issue_text(task['problem_statement'])[:ISSUE_LIMIT]
        query_terms = set(r1.tokens(issue))
        pool = {item['path']: item for item in source['candidates'] if item['bytes'] <= r1.LIMIT}
        chosen = []
        for name in row['ranked_paths'][:24]:
            item = pool.get(name)
            if item is None:
                raise SystemExit(f'rank-outside-pool:{ordinal}')
            rel = Path(name)
            if rel.is_absolute() or '..' in rel.parts:
                raise SystemExit(f'unsafe-path:{ordinal}')
            path = base / rel
            if path.is_symlink() or not path.is_file() or path.stat().st_size != item['bytes']:
                raise SystemExit(f'source-drift:{ordinal}:{name}')
            chosen.append({'path': name, 'bytes': item['bytes'], 'channels': item['channels'],
                           'code_windows': snippets(path.read_bytes().decode('utf-8', 'replace'), query_terms)})
        packet = {'ordinal': ordinal, 'instance_id': row['instance_id'], 'repo': row['repo'],
                  'issue': issue, 'already_read_count': len(source['delivered_paths']),
                  'maximum_new_reads': 3, 'candidates': chosen}
        if len(chosen) != 24 or len(json.dumps(packet).encode()) > PACKET_LIMIT:
            raise SystemExit(f'packet-cap:{ordinal}')
        packets.append(packet)
    output = {'schema_version': 'g02.r11-hybrid-24-packets-exposed-r3/v1',
              'posture': 'source-only-exposed-development-no-gold-dsh-or-score',
              'input_sha256': {'ranks': RANKS_SHA, 'union': UNION_SHA, 'r1_ranker': R1_SHA},
              'script_sha256': sha(Path(__file__)),
              'policy': 'Unchanged hybrid top 24; issue prefix <=6000 chars; two <=350-character query/structure code windows per file; <=65536 packet bytes; chooser may select 0..3 paths.',
              'ordered_packets': packets,
              'claim_ceiling': 'Exposed read-choice development only; no actual ARE reads, native F1, independent quality or superiority.'}
    data = (json.dumps(output, sort_keys=True, indent=2) + '\n').encode()
    OUTPUT.parent.mkdir(mode=0o700, parents=True, exist_ok=False)
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    print(json.dumps({'packets': len(packets), 'candidate_count': sum(len(p['candidates']) for p in packets),
                      'maximum_packet_bytes': max(len(json.dumps(p).encode()) for p in packets),
                      'sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
