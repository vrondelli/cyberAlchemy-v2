#!/usr/bin/env python3
"""Gold-blind, exact-Git full-repository lexical candidate screen for r11."""

import hashlib
import json
import math
import os
import re
import subprocess
from collections import Counter
from pathlib import Path


ARCHIVE = Path('/home/vlad_/are-benchmark-archive')
PACKETS = ARCHIVE / 'g02-r11-search-packets-exposed-r1-20261004/PACKETS.json'
PACKETS_SHA = '2c10c75d0e9ddf495210db994bc34b63c4cb3cec0cf46079ef4a630c5a6cfb6b'
OUTPUT = ARCHIVE / 'g02-r11-fullrepo-lexical-exposed-r1-20261004/SOURCE-SEAL.json'
EXTENSIONS = {'.py', '.js', '.ts', '.tsx', '.go', '.rs', '.java', '.c', '.cc', '.cpp', '.h', '.hpp', '.rb'}
STOP = {'about', 'after', 'again', 'also', 'because', 'before', 'being', 'between', 'could',
        'does', 'from', 'have', 'into', 'just', 'more', 'other', 'should', 'some', 'that',
        'their', 'there', 'these', 'this', 'those', 'through', 'using', 'when', 'where',
        'which', 'while', 'with', 'would', 'your', 'error', 'test', 'tests', 'file', 'files',
        'line', 'code', 'function', 'class', 'return', 'value', 'type', 'name', 'data',
        'path', 'case', 'issue', 'expected', 'actual', 'result', 'output', 'input'}
LIMIT = 262144
TOP = 96


def sha(data):
    return hashlib.sha256(data).hexdigest()


def terms(text):
    text = re.sub(r'([a-z0-9])([A-Z])', r'\1 \2', text)
    return [t for t in re.findall(r'[a-z][a-z0-9]{3,}', text.lower()) if t not in STOP]


def git(base, *args):
    return subprocess.check_output(['git', '-C', str(base), *args])


def main():
    if OUTPUT.exists() or sha(PACKETS.read_bytes()) != PACKETS_SHA:
        raise SystemExit('output-exists-or-packet-drift')
    packets = json.loads(PACKETS.read_text())['ordered_packets']
    if len(packets) != 12:
        raise SystemExit('packet-count')
    rows = []
    for packet in packets:
        ordinal = packet['ordinal']
        base = ARCHIVE / 'g02-product-replication-r11-20261002/pairs' / f'{ordinal:02d}-pr11-mixed-{ordinal:02d}' / 'raw/sources/session/base'
        if git(base, 'rev-parse', 'HEAD').decode().strip() != packet['base_commit'] or \
                subprocess.run(['git', '-C', str(base), 'diff', '--quiet', 'HEAD'], check=False).returncode != 0:
            raise SystemExit(f'source-commit-or-worktree-drift:{ordinal}')
        issue = packet['issue']
        query = set(terms(issue))
        if not query:
            raise SystemExit(f'empty-query:{ordinal}')
        raw_names = git(base, 'ls-tree', '-r', '-z', '--name-only', packet['base_commit']).split(b'\0')
        candidates = []
        df = Counter()
        delivered = set(packet['delivered_paths'])
        for raw_name in raw_names:
            if not raw_name:
                continue
            try:
                name = raw_name.decode('utf-8')
            except UnicodeDecodeError:
                continue
            rel = Path(name)
            if rel.suffix.lower() not in EXTENSIONS or rel.is_absolute() or '..' in rel.parts:
                continue
            path = base / rel
            if path.is_symlink() or not path.is_file() or path.stat().st_size > LIMIT:
                continue
            body = path.read_bytes().decode('utf-8', 'replace')
            body_terms = terms(body)
            tf = Counter(t for t in body_terms if t in query)
            path_terms = set(terms(name.replace('/', ' '))) & query
            for term in set(tf) | path_terms:
                df[term] += 1
            candidates.append((name, len(body_terms), tf, path_terms))
        n = len(candidates)
        if n == 0:
            raise SystemExit(f'no-candidates:{ordinal}')
        avgdl = sum(length for _, length, _, _ in candidates) / n
        idf = {t: math.log1p((n-df[t]+0.5)/(df[t]+0.5)) for t in query}
        ranked = []
        for name, length, tf, path_terms in candidates:
            if name in delivered:
                continue
            norm = 1.2 * (0.25 + 0.75 * length/avgdl)
            body_score = sum(idf[t] * count*2.2/(count+norm) for t,count in tf.items())
            path_score = 3.0 * sum(idf[t] for t in path_terms)
            exact_path_bonus = 20.0 if name in issue else 0.0
            score = body_score + path_score + exact_path_bonus
            if score > 0:
                ranked.append((score, name, len(tf), len(path_terms)))
        ranked.sort(key=lambda row: (-row[0], row[1]))
        rows.append({'ordinal': ordinal, 'instance_id': packet['instance_id'],
                     'repo': packet['repo'], 'base_commit': packet['base_commit'],
                     'tracked_entries': len(raw_names)-1, 'eligible_source_files': n,
                     'query_terms': len(query), 'scored_undelivered_files': len(ranked),
                     'ranked': [{'path': name, 'score': round(score, 8),
                                 'body_term_types': body_n, 'path_term_types': path_n}
                                for score, name, body_n, path_n in ranked[:TOP]]})
        print(json.dumps({'ordinal': ordinal, 'eligible': n, 'scored': len(ranked),
                          'top': len(rows[-1]['ranked'])}), flush=True)
    result = {'schema_version': 'g02.r11-fullrepo-lexical-exposed-r1/v1',
              'posture': 'source-only-exposed-development-no-gold-dsh-or-score',
              'input_sha256': {'packets': PACKETS_SHA},
              'script_sha256': sha(Path(__file__).read_bytes()),
              'policy': {'source_max_bytes': LIMIT, 'top_paths_per_task': TOP,
                         'query': 'issue normalized terms >=4 characters, fixed stoplist',
                         'score': 'BM25(k1=1.2,b=0.75) + 3x path IDF + 20 exact-path bonus; delivered excluded',
                         'advancement_gate': {'top24_new_gold_hits_min': 8,
                                              'top24_outside_relation_union_gold_min': 2,
                                              'repositories_with_hit_min': 2}},
              'rows': rows,
              'claim_ceiling': 'Exposed candidate-generation coverage only; no GLM choice, actual ARE reads, native F1, independent test or superiority.'}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    OUTPUT.parent.mkdir(mode=0o700, parents=True, exist_ok=False)
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'tasks': len(rows), 'bytes': len(data), 'sha256': sha(data)}))


if __name__ == '__main__':
    main()
