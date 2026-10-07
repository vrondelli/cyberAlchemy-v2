#!/usr/bin/env python3
"""Seal source-only reverse references from ARE-selected files on the VPS."""

import hashlib
import json
import os
import re
import subprocess
from collections import defaultdict
from pathlib import Path


PACKETS = Path('/opt/are/evolution-runtime/g02-r11-two-step-search-exposed-r1/PACKETS.json')
OUTPUT = Path('/opt/are/evolution-runtime/g02-r11-reverse-references-exposed-r1/SOURCE-SEAL.json')
PACKET_SHA = '2c10c75d0e9ddf495210db994bc34b63c4cb3cec0cf46079ef4a630c5a6cfb6b'
MAX_BYTES = 262144
TOP_SYMBOLS = 24
TOP_CANDIDATES = 20
MAX_MATCHED_FILES = 80
EXTENSIONS = ('.py', '.hpp', '.h', '.hh', '.hxx', '.cpp', '.cc', '.cxx')
SYMBOL = re.compile(r'\b[A-Za-z_][A-Za-z0-9_]{5,}\b')
DECL = re.compile(r'^\s*(?:async\s+def|def|class|struct|enum|using|#\s*define)\s+([A-Za-z_][A-Za-z0-9_]*)\b')
STOP = {'return', 'import', 'include', 'string', 'const', 'value', 'false', 'true',
        'class', 'self', 'assert', 'raise', 'except', 'module', 'object', 'number',
        'result', 'function', 'kwargs', 'none', 'basicjsontype', 'valueerror',
        'typeerror', 'importerror', 'typename', 'nullptr'}


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def git(cache, *args):
    return subprocess.run(['git', '-C', str(cache), *args], capture_output=True, check=True)


def readable_symbol(name):
    return (name.casefold() not in STOP and len(name) >= 6 and
            ('_' in name or any(char.isupper() for char in name[1:])))


def common_dir(left, right):
    parts_a, parts_b = Path(left).parts[:-1], Path(right).parts[:-1]
    result = 0
    for a, b in zip(parts_a, parts_b):
        if a != b:
            break
        result += 1
    return result


def tracked_sizes(cache, commit):
    sizes = {}
    tree = git(cache, 'ls-tree', '-r', '-l', '-z', commit).stdout
    for entry in tree.split(b'\0'):
        if not entry:
            continue
        metadata, path = entry.split(b'\t', 1)
        fields = metadata.split()
        if len(fields) != 4 or fields[1] != b'blob' or fields[3] == b'-':
            continue
        rel = path.decode('utf-8', 'surrogateescape')
        if rel.endswith(EXTENSIONS):
            sizes[rel] = int(fields[3])
    return sizes


def source_symbols(cache, packet, sizes):
    issue_words = {term.casefold() for term in SYMBOL.findall(packet['issue'])}
    symbols = defaultdict(set)
    source_sha = {}
    for rel in packet['selected_paths']:
        if rel.startswith('/') or '..' in Path(rel).parts:
            raise SystemExit(f'unsafe-selected-path:{packet["ordinal"]}')
        if rel not in sizes or sizes[rel] > MAX_BYTES:
            continue
        data = git(cache, 'show', f'{packet["base_commit"]}:{rel}').stdout
        source_sha[rel] = hashlib.sha256(data).hexdigest()
        for line in data.decode('utf-8', 'replace').splitlines():
            match = DECL.search(line)
            if match and readable_symbol(match.group(1)):
                symbols[match.group(1)].add(rel)
    ranked = sorted(symbols, key=lambda name:
                    (-(name.casefold() in issue_words), -len(symbols[name]),
                     -len(name), name))[:TOP_SYMBOLS]
    return ranked, symbols, issue_words, source_sha


def reverse_refs(cache, packet, sizes, ranked, sources, issue_words):
    candidates = defaultdict(set)
    selected = set(packet['selected_paths'])
    delivered = set(packet['delivered_paths'])
    for symbol in ranked:
        found = subprocess.run(['git', '-C', str(cache), 'grep', '-l', '-F', '-e', symbol,
                                packet['base_commit'], '--', '*.py', '*.hpp', '*.h',
                                '*.hh', '*.hxx', '*.cpp', '*.cc', '*.cxx'],
                               capture_output=True)
        if found.returncode not in (0, 1):
            raise SystemExit(f'git-grep-failed:{packet["ordinal"]}:{symbol}')
        paths = []
        prefix = (packet['base_commit'] + ':').encode()
        for line in found.stdout.splitlines():
            if line.startswith(prefix):
                paths.append(line[len(prefix):].decode('utf-8', 'surrogateescape'))
        if len(paths) > MAX_MATCHED_FILES:
            continue
        for path in paths:
            if (path not in selected and path not in delivered and
                    path in sizes and sizes[path] <= MAX_BYTES):
                candidates[path].add(symbol)
    scored = []
    for path, matched in candidates.items():
        issue_matched = {name for name in matched if name.casefold() in issue_words}
        if len(matched) < 2 and not issue_matched:
            continue
        proximity = max(common_dir(origin, path) for name in matched for origin in sources[name])
        score = len(matched) * 100 + len(issue_matched) * 200 + proximity * 5
        scored.append({'path': path, 'matched_symbols': sorted(matched),
                       'issue_matched_symbols': sorted(issue_matched),
                       'score_units': score, 'bytes': sizes[path]})
    scored.sort(key=lambda item: (-item['score_units'], item['bytes'], item['path']))
    return scored


def main():
    if OUTPUT.exists() or sha(PACKETS) != PACKET_SHA:
        raise SystemExit('output-exists-or-packet-drift')
    packets = json.loads(PACKETS.read_text())['ordered_packets']
    if [row['ordinal'] for row in packets] != list(range(1, 13)):
        raise SystemExit('cohort-drift')
    rows = []
    for packet in packets:
        cache = Path(packet['cache_base']) / 'cache' / packet['cache_name']
        commit = git(cache, 'rev-parse', packet['base_commit']).stdout.decode().strip()
        if commit != packet['base_commit']:
            raise SystemExit(f'commit-drift:{packet["ordinal"]}')
        sizes = tracked_sizes(cache, commit)
        ranked, sources, issue_words, source_sha = source_symbols(cache, packet, sizes)
        scored = reverse_refs(cache, packet, sizes, ranked, sources, issue_words)
        rows.append({'ordinal': packet['ordinal'], 'instance_id': packet['instance_id'],
                     'repo': packet['repo'], 'base_commit': commit,
                     'selected_source_sha256': source_sha, 'bridge_symbols': ranked,
                     'candidate_count': len(scored), 'shortlist': scored[:TOP_CANDIDATES]})
        print(json.dumps({'ordinal': packet['ordinal'], 'symbols': len(ranked),
                          'candidates': len(scored), 'shortlist': min(len(scored), TOP_CANDIDATES)}),
              flush=True)
    report = {'schema_version': 'g02.r11-reverse-references-source-exposed-r1/v1',
              'posture': 'source-only-exposed-development-no-gold-dsh-or-score',
              'packet_sha256': PACKET_SHA, 'script_sha256': sha(Path(__file__)),
              'policy': 'From ARE-selected <=256KiB code files, take up to 24 code-like declarations prioritizing issue mentions; reverse-search tracked <=256KiB code files, ignoring symbols in >80 files; require two matched symbols or one issue-matched symbol; rank by distinct matches, issue matches and source-directory proximity; top 20 per task.',
              'advancement_gate': {'minimum_top20_new_gold_hits': 7,
                                   'minimum_top20_hits_outside_relation_union': 2,
                                   'minimum_repositories_with_hit': 2},
              'rows': rows,
              'claim_ceiling': 'Source-only shortlist coverage, not actual reads, native score, independent quality or superiority.'}
    data = (json.dumps(report, sort_keys=True, indent=2) + '\n').encode()
    OUTPUT.parent.mkdir(mode=0o700, parents=True, exist_ok=False)
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    print(json.dumps({'tasks': len(rows), 'top20_total': sum(len(row['shortlist']) for row in rows),
                      'receipt_sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
