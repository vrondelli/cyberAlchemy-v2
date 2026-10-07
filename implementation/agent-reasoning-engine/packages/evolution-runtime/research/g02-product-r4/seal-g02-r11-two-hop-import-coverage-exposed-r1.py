#!/usr/bin/env python3
"""Source-only two-hop Python import graph from delivered G02 r11 evidence."""

import ast
from collections import defaultdict
import hashlib
import json
import os
from pathlib import Path
import subprocess

ARCHIVE = Path('/home/vlad_/are-benchmark-archive')
PACKETS = ARCHIVE / 'g02-r11-search-packets-exposed-r1-20261004/PACKETS.json'
OUTPUT = ARCHIVE / 'g02-r11-two-hop-import-exposed-r1-20261004/SOURCE-GRAPH.json'
PACKET_SHA = '2c10c75d0e9ddf495210db994bc34b63c4cb3cec0cf46079ef4a630c5a6cfb6b'
MAX_BYTES = 262144


def sha(data):
    return hashlib.sha256(data).hexdigest()


def need(ok, reason):
    if not ok:
        raise SystemExit(reason)


def git(root, *args):
    return subprocess.run(['git', '-c', f'safe.directory={root}', '-C', str(root), *args],
                          capture_output=True, check=True).stdout


def module_names(path):
    parts = list(Path(path).with_suffix('').parts)
    if parts[-1] == '__init__':
        parts.pop()
    if not parts:
        return []
    variants = ['.'.join(parts)]
    if parts[0] in ('lib', 'src', 'python') and len(parts) > 1:
        variants.append('.'.join(parts[1:]))
    return variants


def imports(path, data):
    try:
        tree = ast.parse(data.decode('utf-8-sig'))
    except (SyntaxError, UnicodeDecodeError, ValueError):
        return None
    current = module_names(path)[-1].split('.')
    package = current if path.endswith('/__init__.py') else current[:-1]
    refs = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            refs.update(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom):
            if node.level:
                prefix = package[:max(0, len(package) - node.level + 1)]
                base = '.'.join(prefix + ([node.module] if node.module else []))
            else:
                base = node.module or ''
            if base:
                refs.add(base)
                refs.update(base + '.' + alias.name for alias in node.names
                            if alias.name != '*')
    return sorted(refs)


def main():
    need(not OUTPUT.exists() and sha(PACKETS.read_bytes()) == PACKET_SHA,
         'output-or-packet-drift')
    packets = json.loads(PACKETS.read_bytes())['ordered_packets']
    need(len(packets) == 12 and [row['ordinal'] for row in packets] == list(range(1, 13)),
         'packet-denominator')
    rows = []
    for packet in packets:
        ordinal = packet['ordinal']
        root = (ARCHIVE / 'g02-product-replication-r11-20261002/pairs'
                / f'{ordinal:02d}-pr11-mixed-{ordinal:02d}' / 'raw/sources/session/base')
        root = root.resolve(strict=True)
        head = git(root, 'rev-parse', 'HEAD').decode().strip()
        need(head == packet['base_commit'], f'base-commit-{ordinal}')
        need(not git(root, 'status', '--porcelain=v1'), f'dirty-base-{ordinal}')
        tree_oid = git(root, 'rev-parse', 'HEAD^{tree}').decode().strip()
        tracked = [path.decode('utf-8', 'surrogateescape')
                   for path in git(root, 'ls-files', '-z', '--', '*.py').split(b'\0') if path]
        eligible = {}
        for rel in tracked:
            path = root / rel
            if not path.is_file() or path.is_symlink() or path.stat().st_size > MAX_BYTES:
                continue
            eligible[rel] = path
        if ordinal in (4, 8, 12):
            rows.append({'ordinal': ordinal, 'instance_id': packet['instance_id'],
                         'repo': packet['repo'], 'base_commit': head,
                         'base_tree': tree_oid, 'language': 'non-python-skip',
                         'tracked_python_files': len(tracked), 'eligible_python_files': len(eligible),
                         'parsed_python_files': 0, 'resolved_edges': 0,
                         'one_hop': [], 'two_hop': [], 'gold_opened': False})
            continue
        aliases = defaultdict(set)
        for rel in eligible:
            for name in module_names(rel):
                aliases[name].add(rel)
        resolved = {name: next(iter(paths)) for name, paths in aliases.items()
                    if len(paths) == 1}
        adjacency = defaultdict(set)
        parsed = edges = 0
        for rel, path in eligible.items():
            targets = imports(rel, path.read_bytes())
            if targets is None:
                continue
            parsed += 1
            for target_name in targets:
                target = resolved.get(target_name)
                if target is None or target == rel:
                    continue
                adjacency[rel].add(target)
                adjacency[target].add(rel)
                edges += 1
        delivered = set(packet['delivered_paths'])
        seeds = delivered & set(eligible)
        one = set().union(*(adjacency.get(path, set()) for path in seeds)) if seeds else set()
        two = set().union(*(adjacency.get(path, set()) for path in one)) if one else set()
        one -= delivered
        two -= delivered | one
        rows.append({'ordinal': ordinal, 'instance_id': packet['instance_id'],
                     'repo': packet['repo'], 'base_commit': head, 'base_tree': tree_oid,
                     'language': 'Python', 'tracked_python_files': len(tracked),
                     'eligible_python_files': len(eligible),
                     'parsed_python_files': parsed, 'resolved_edges': edges,
                     'delivered_python_seeds': len(seeds),
                     'one_hop': sorted(one), 'two_hop': sorted(two),
                     'gold_opened': False})
        print(json.dumps({'ordinal': ordinal, 'parsed': parsed, 'edges': edges,
                          'one_hop': len(one), 'two_hop': len(two)}), flush=True)
    result = {'schema_version': 'g02.r11-two-hop-import-source-exposed-r1/v1',
              'posture': 'source-only coverage ceiling, not a read policy',
              'packet_sha256': PACKET_SHA,
              'script_sha256': sha(Path(__file__).read_bytes()),
              'max_read_bytes': MAX_BYTES, 'rows': rows,
              'gold_opened': False, 'model_calls': 0}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    OUTPUT.parent.mkdir(mode=0o700)
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'cases': len(rows), 'source_sha256': sha(data)}))


if __name__ == '__main__':
    main()
