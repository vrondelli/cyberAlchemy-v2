#!/usr/bin/env python3
"""Bounded, read-only inspector for the pinned R48 public trajectory pack."""

import argparse
import gzip
from hashlib import sha256
import json
from pathlib import Path
import re
import sys

ID = re.compile(r'^[0-9a-f]{8}$')
TOKEN = re.compile(r'[a-z0-9]{3,}')
TITLE = re.compile(r"RootWebArea '([^']+)'", re.I)
STOP = {'the', 'and', 'for', 'with', 'from', 'this', 'that', 'what', 'which',
        'when', 'where', 'after', 'before', 'using', 'into', 'have', 'does',
        'our', 'are', 'you', 'your', 'page', 'site', 'system'}
ALLOWED_FIELDS = {'id', 'domain', 'environment', 'goal', 'states'}
ALLOWED_STATE_FIELDS = {'state_index', 'url', 'action', 'accessibility_tree', 'screenshot'}


def sha(bytes_):
    return sha256(bytes_).hexdigest()


def manifest(root):
    data = json.loads((root / 'MANIFEST.json').read_text())
    assert data['schema_version'] == 'are.g03-lme-v2-public-trajectory-pack-r48/v1'
    assert data['trajectory_count'] == len(data['entries']) == 200
    return data


def item(root, tid, entry=None):
    assert ID.fullmatch(tid), 'invalid-trajectory-id'
    path = root / 'trajectories' / f'{tid}.json.gz'
    compressed = path.read_bytes()
    if entry is not None:
        assert len(compressed) == entry['compressed_bytes']
        assert sha(compressed) == entry['compressed_sha256']
    plain = gzip.decompress(compressed)
    if entry is not None:
        assert len(plain) == entry['plain_bytes']
        assert sha(plain) == entry['plain_sha256']
    raw = json.loads(plain)
    assert raw['id'] == tid and set(raw) <= ALLOWED_FIELDS
    assert all(set(state) <= ALLOWED_STATE_FIELDS for state in raw['states'])
    return raw


def tokens(text):
    return set(TOKEN.findall(text.casefold())) - STOP


def title(tree):
    match = TITLE.search(tree[:1000])
    return match.group(1) if match else ''


def verify(root, data):
    expected = {entry['id'] for entry in data['entries']}
    present = {path.name.removesuffix('.json.gz') for path in (root / 'trajectories').glob('*.json.gz')}
    assert expected == present and len(expected) == 200
    for entry in data['entries']:
        raw = item(root, entry['id'], entry)
        assert len(raw['states']) == entry['states']
    return {'ok': True, 'trajectory_count': len(expected),
            'manifest_sha256': sha((root / 'MANIFEST.json').read_bytes()),
            'compressed_bytes': sum(entry['compressed_bytes'] for entry in data['entries'])}


def search(root, data, query, site, limit):
    query_terms = tokens(query)
    assert query_terms, 'empty-query-terms'
    ranked = []
    for entry in data['entries']:
        raw = item(root, entry['id'])
        if site != 'all' and raw['domain'] != site:
            continue
        goal_hits = len(tokens(raw['goal']) & query_terms)
        for state in raw['states']:
            tree = str(state.get('accessibility_tree') or '')
            page = title(tree)
            page_hits = len(tokens(page) & query_terms)
            action_hits = len(tokens(str(state.get('action') or '')) & query_terms)
            tree_hits = len(tokens(tree) & query_terms)
            score = 6 * page_hits + 3 * action_hits + 0.75 * goal_hits + 0.15 * min(tree_hits, 18)
            if score <= 0:
                continue
            matching_lines = [line.strip()[:180] for line in tree.splitlines()
                              if len(tokens(line) & query_terms) >= 2]
            ranked.append({'trajectory_id': raw['id'], 'state_index': state['state_index'],
                           'domain': raw['domain'], 'page': page[:130],
                           'action': str(state.get('action') or '')[:130],
                           'score': round(score, 2), 'goal': raw['goal'][:180],
                           'matching_lines': matching_lines[:4]})
    ranked.sort(key=lambda row: (-row['score'], row['trajectory_id'], row['state_index']))
    output, seen = [], set()
    for row in ranked:
        if row['trajectory_id'] in seen:
            continue
        seen.add(row['trajectory_id'])
        output.append(row)
        if len(output) == limit:
            break
    return {'query': query, 'site': site, 'candidate_states': len(ranked), 'results': output}


def read(root, data, tid, center, radius, max_chars):
    entries = {entry['id']: entry for entry in data['entries']}
    assert tid in entries
    raw = item(root, tid, entries[tid])
    states = raw['states']
    assert 0 <= center < len(states)
    first, last = max(0, center - radius), min(len(states), center + radius + 1)
    selected = []
    for state in states[first:last]:
        tree = str(state.get('accessibility_tree') or '')
        selected.append({'state_index': state['state_index'], 'url': state.get('url'),
                         'action': state.get('action'), 'page': title(tree),
                         'accessibility_tree': tree[:max_chars]})
    return {'trajectory_id': tid, 'domain': raw['domain'], 'goal': raw['goal'],
            'range': [first, last], 'states': selected}


def find(root, data, tid, query, limit):
    entries = {entry['id']: entry for entry in data['entries']}
    assert tid in entries
    raw = item(root, tid, entries[tid])
    terms = tokens(query)
    assert terms, 'empty-query-terms'
    matches = []
    for state in raw['states']:
        tree = str(state.get('accessibility_tree') or '')
        for index, source_line in enumerate(tree.splitlines()):
            hits = len(tokens(source_line) & terms)
            if not hits:
                continue
            matches.append({'state_index': state['state_index'], 'line_index': index,
                            'page': title(tree)[:120], 'score': hits,
                            'line': source_line.strip()[:220],
                            'action': str(state.get('action') or '')[:120]})
    matches.sort(key=lambda row: (-row['score'], row['state_index'], row['line_index']))
    return {'trajectory_id': tid, 'query': query, 'matches': matches[:limit],
            'total_matches': len(matches)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('root', type=Path)
    commands = parser.add_subparsers(dest='command', required=True)
    commands.add_parser('verify')
    search_parser = commands.add_parser('search')
    search_parser.add_argument('query')
    search_parser.add_argument('--site', choices=('all', 'web', 'enterprise'), default='all')
    search_parser.add_argument('--limit', type=int, choices=range(1, 21), default=8)
    show = commands.add_parser('read')
    show.add_argument('trajectory_id')
    show.add_argument('state_index', type=int)
    show.add_argument('--radius', type=int, choices=range(0, 4), default=1)
    show.add_argument('--max-chars', type=int, choices=range(1000, 16001), default=5000)
    locate = commands.add_parser('find')
    locate.add_argument('trajectory_id')
    locate.add_argument('query')
    locate.add_argument('--limit', type=int, choices=range(1, 21), default=8)
    args = parser.parse_args()
    data = manifest(args.root)
    if args.command == 'verify':
        result = verify(args.root, data)
    elif args.command == 'search':
        result = search(args.root, data, args.query, args.site, args.limit)
    elif args.command == 'read':
        result = read(args.root, data, args.trajectory_id, args.state_index,
                      args.radius, args.max_chars)
    else:
        result = find(args.root, data, args.trajectory_id, args.query, args.limit)
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(json.dumps({'ok': False, 'error': str(error)[:160]}), file=sys.stderr)
        raise
