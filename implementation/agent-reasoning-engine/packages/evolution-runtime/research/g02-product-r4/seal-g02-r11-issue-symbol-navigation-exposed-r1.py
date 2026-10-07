#!/usr/bin/env python3
"""Seal issue-anchored, source-only Python definition proposals without gold."""

import ast
from collections import defaultdict
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess

ARCHIVE = Path('/home/vlad_/are-benchmark-archive')
PACKETS = ARCHIVE / 'g02-r11-search-packets-exposed-r1-20261004/PACKETS.json'
OUTPUT = ARCHIVE / 'g02-r11-issue-symbol-navigation-exposed-r1-20261004/SOURCE-PROPOSALS.json'
PACKET_SHA = '2c10c75d0e9ddf495210db994bc34b63c4cb3cec0cf46079ef4a630c5a6cfb6b'
MAX_BYTES = 262144
MAX_DEFINITIONS_PER_SYMBOL = 5
MAX_PROPOSALS_PER_TASK = 3
IDENT = re.compile(r'\b[A-Za-z_][A-Za-z0-9_]{2,}\b')
CALL = re.compile(r'\b([A-Za-z_][A-Za-z0-9_]{2,})\s*\(')
BACKTICK = re.compile(r'`([^`\n]{1,120})`')
IGNORE = {'self', 'cls', 'true', 'false', 'none', 'print', 'int', 'str', 'list',
          'dict', 'set', 'len', 'range', 'super', 'return', 'assert', 'raise',
          'with', 'from', 'import', 'class', 'def', 'and', 'for', 'not', 'max', 'min'}


def need(condition, why):
    if not condition:
        raise SystemExit(why)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def git(root, *args):
    return subprocess.run(['git', '-c', f'safe.directory={root}', '-C', str(root), *args],
                          check=True, capture_output=True).stdout


def issue_symbols(issue):
    names = {name for name in CALL.findall(issue)}
    for span in BACKTICK.findall(issue):
        names.update(IDENT.findall(span))
    return {name for name in names if name.lower() not in IGNORE}


def parse(path):
    try:
        return ast.parse(path.read_bytes().decode('utf-8-sig'))
    except (SyntaxError, UnicodeDecodeError, ValueError):
        return None


def main():
    need(not OUTPUT.exists() and sha(PACKETS) == PACKET_SHA, 'output-or-packet-drift')
    packets = json.loads(PACKETS.read_bytes())['ordered_packets']
    need(len(packets) == 12 and [row['ordinal'] for row in packets] == list(range(1, 13)),
         'packet-denominator')
    rows = []
    for packet in packets:
        ordinal = packet['ordinal']
        root = (ARCHIVE / 'g02-product-replication-r11-20261002/pairs'
                / f'{ordinal:02d}-pr11-mixed-{ordinal:02d}' / 'raw/sources/session/base').resolve(strict=True)
        head = git(root, 'rev-parse', 'HEAD').decode().strip()
        need(head == packet['base_commit'] and not git(root, 'status', '--porcelain=v1'),
             f'base-drift:{ordinal}')
        tree_oid = git(root, 'rev-parse', 'HEAD^{tree}').decode().strip()
        if ordinal in (4, 8, 12):
            rows.append({'ordinal': ordinal, 'instance_id': packet['instance_id'],
                         'repo': packet['repo'], 'base_commit': head, 'base_tree': tree_oid,
                         'language': 'non-python-skip', 'issue_symbol_count': 0,
                         'anchored_symbol_count': 0, 'eligible_python_files': 0,
                         'parsed_python_files': 0, 'proposals': []})
            continue
        paths = [rel.decode('utf-8', 'surrogateescape') for rel in
                 git(root, 'ls-files', '-z', '--', '*.py').split(b'\0') if rel]
        eligible = {rel: root / rel for rel in paths
                    if (root / rel).is_file() and not (root / rel).is_symlink()
                    and (root / rel).stat().st_size <= MAX_BYTES}
        delivered = set(packet['delivered_paths'])
        names = issue_symbols(packet['issue'])
        anchored = defaultdict(list)
        definitions = defaultdict(list)
        parsed = 0
        for rel, path in eligible.items():
            tree = parse(path)
            if tree is None:
                continue
            parsed += 1
            if rel in delivered:
                for node in ast.walk(tree):
                    if isinstance(node, ast.Call):
                        fn = node.func
                        name = fn.id if isinstance(fn, ast.Name) else (
                            fn.attr if isinstance(fn, ast.Attribute) else None)
                        if name in names:
                            anchored[name].append({'delivered_path': rel,
                                                   'line': node.lineno})
                    elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                        if node.name in names:
                            anchored[node.name].append({'delivered_path': rel,
                                                         'line': node.lineno})
            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)) and node.name in names:
                    definitions[node.name].append({'path': rel, 'line': node.lineno,
                                                   'kind': type(node).__name__})
        candidate = defaultdict(list)
        for name, anchors in anchored.items():
            targets = definitions[name]
            if not 1 <= len(targets) <= MAX_DEFINITIONS_PER_SYMBOL:
                continue
            for target in targets:
                if target['path'] in delivered:
                    continue
                candidate[target['path']].append({'symbol': name, 'target_line': target['line'],
                                                  'target_kind': target['kind'],
                                                  'anchors': anchors[:3],
                                                  'definition_ambiguity': len(targets)})
        ordered = sorted(candidate.items(), key=lambda item: (
            -len({hit['symbol'] for hit in item[1]}),
            min(hit['definition_ambiguity'] for hit in item[1]),
            item[0]))[:MAX_PROPOSALS_PER_TASK]
        proposals = [{'path': rel, 'evidence': sorted(hits, key=lambda hit: hit['symbol'])}
                     for rel, hits in ordered]
        rows.append({'ordinal': ordinal, 'instance_id': packet['instance_id'],
                     'repo': packet['repo'], 'base_commit': head, 'base_tree': tree_oid,
                     'language': 'Python', 'issue_symbol_count': len(names),
                     'anchored_symbol_count': len(anchored),
                     'eligible_python_files': len(eligible), 'parsed_python_files': parsed,
                     'proposals': proposals})
        print(json.dumps({'ordinal': ordinal, 'issue_symbols': len(names),
                          'anchored': len(anchored), 'proposals': len(proposals)}), flush=True)
    result = {'schema_version': 'g02.r11-issue-symbol-navigation-source-exposed-r1/v1',
              'posture': 'source-only proposed reads; not executed',
              'packet_sha256': PACKET_SHA, 'script_sha256': sha(Path(__file__)),
              'max_source_bytes': MAX_BYTES,
              'max_definitions_per_symbol': MAX_DEFINITIONS_PER_SYMBOL,
              'max_proposals_per_task': MAX_PROPOSALS_PER_TASK,
              'rows': rows, 'gold_opened': False, 'model_calls': 0}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    OUTPUT.parent.mkdir(mode=0o700)
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'cases': len(rows), 'source_sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
