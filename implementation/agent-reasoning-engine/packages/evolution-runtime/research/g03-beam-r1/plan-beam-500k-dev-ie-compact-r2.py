#!/usr/bin/env python3
"""Seal a compact, turn-neighborhood IE development treatment against BM25."""

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path


HERE = Path(__file__).resolve().parent
ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1')
SOURCE = ROOT / 'SOURCE-ONLY.jsonl'
OLD = ROOT / 'IE-PAIRED-SELECTIONS.json'
MOSAIC = HERE / 'plan-beam-dev-mosaic-r1.py'
PINS = {
    SOURCE: '0370dd91d1227f9e59632881354d79a0569ed7a7ec852acfd70588fd469cc5b0',
    OLD: 'fa82830ff3e6d3e9eb386404901c76a3d610768324aa326d7ac9ee4925c0e2f0',
    MOSAIC: '2300f749f97262f383c7286d5729db3a80dc73cbb040ab1123f1ac6375142cba',
}
MAX_CHARS = 5000
ANCHORS = 2
RADIUS = 2
ANCHOR_EXCERPT = 700
NEIGHBOR_EXCERPT = 320
FILL_EXCERPT = 380


def sha(data):
    return hashlib.sha256(data).hexdigest()


def sha_file(path):
    hashed = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            hashed.update(block)
    return hashed.hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-500k-ie-compact-r2.' + reason)


def project(question, turns, mosaic):
    ranking = mosaic.turn_ranking(question, turns)
    anchors = ranking[:ANCHORS]
    neighbor_ids = sorted({neighbor for anchor in anchors
        for neighbor in range(max(0, anchor - RADIUS),
            min(len(turns), anchor + RADIUS + 1))} - set(anchors),
        key=lambda turn_id: (min(abs(turn_id - anchor) for anchor in anchors),
            turn_id))
    priority = ([(turn_id, 'anchor') for turn_id in anchors] +
        [(turn_id, 'neighbor') for turn_id in neighbor_ids] +
        [(turn_id, 'ranked-fill') for turn_id in ranking
            if turn_id not in set(anchors) | set(neighbor_ids)])
    chosen = []
    query = set(mosaic.terms(question))
    for turn_id, kind in priority:
        turn = turns[turn_id]
        limit = {'anchor': ANCHOR_EXCERPT, 'neighbor': NEIGHBOR_EXCERPT,
            'ranked-fill': FILL_EXCERPT}[kind]
        excerpt, offset = mosaic.excerpt(turn['content'], query, limit)
        item = {'source_turn': turn_id, 'role': turn['role'],
            'content': excerpt, 'excerpt_offset': offset,
            'selection': kind}
        if mosaic.chars({'archived_evidence': chosen + [item]}) <= MAX_CHARS:
            chosen.append(item)
    chosen.sort(key=lambda item: item['source_turn'])
    projection = {'archived_evidence': chosen}
    need(chosen and mosaic.chars(projection) <= MAX_CHARS and
        len({item['source_turn'] for item in chosen}) == len(chosen),
        'projection-boundary')
    return projection


def run():
    need(all(sha_file(path) == expected for path, expected in PINS.items()),
        'pinned-input-drift')
    spec = importlib.util.spec_from_file_location('beam_mosaic_500k_dev', MOSAIC)
    mosaic = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mosaic)
    baseline = json.loads(OLD.read_text())
    by_id = {entry['probe_id']: entry for entry in baseline['selections']}
    need(len(by_id) == 60 and baseline['evaluator_fields_read'] is False,
        'control-binding')
    rows = [json.loads(line) for line in SOURCE.read_text().splitlines()]
    need(len(rows) == 30, 'population-count')
    selections = []
    for row in rows:
        probes = [probe for probe in row['probes'] if
            probe['ability'] == 'information_extraction']
        need(len(probes) == 2, 'ie-quota')
        for probe in probes:
            old = by_id[probe['id']]
            key_hash = sha(mosaic.canonical(row['conversation_key']))
            need(old['conversation_key_sha256'] == key_hash,
                'conversation-binding')
            projection = project(probe['question'], row['turns'], mosaic)
            units = projection['archived_evidence']
            selected = [[item['source_turn'], 0] for item in units]
            binding = {'probe_id': probe['id'],
                'conversation_key_sha256': key_hash,
                'selected_fragment_identities': selected,
                'projection_sha256': sha(mosaic.canonical(projection)),
                'projection_chars': mosaic.chars(projection)}
            selections.append({'probe_id': probe['id'],
                'conversation_key_sha256': key_hash,
                'treatment': binding, 'control': old['control']})
    need(len(selections) == 60 and
        len({entry['probe_id'] for entry in selections}) == 60,
        'selection-count')
    return {'schema_version': 'are.g03-beam-500k-dev-ie-compact-r2/v1',
        'status': 'sealed-source-only-before-citation-audit',
        'source_only_sha256': PINS[SOURCE],
        'unchanged_control_selections_sha256': PINS[OLD],
        'mosaic_library_sha256': PINS[MOSAIC],
        'policy': 'two-bm25-turn-anchors-radius-two-compact-neighbors-and-ranked-fill-r2',
        'parameters': {'max_utf16_chars': MAX_CHARS, 'anchors': ANCHORS,
            'radius': RADIUS, 'anchor_excerpt_chars': ANCHOR_EXCERPT,
            'neighbor_excerpt_chars': NEIGHBOR_EXCERPT,
            'fill_excerpt_chars': FILL_EXCERPT},
        'conversations': 30, 'information_extraction_questions': 60,
        'selections': sorted(selections, key=lambda entry: entry['probe_id']),
        'evaluator_fields_read': False, 'model_calls': 0,
        'claim_ceiling': 'Development source-only candidate against unchanged BM25; no gold reach, answer quality, 8K wire, holdout, or superiority',
        'open_questions': ['Does compact selection reach more cited turns?',
            'Do excerpts retain facts needed for correct answers?']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    need(not args.output.exists(), 'fresh-output-required')
    result = run()
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as stream:
        stream.write(data)
    print(json.dumps({'status': result['status'],
        'questions': result['information_extraction_questions'],
        'receipt_sha256': sha(data)}, sort_keys=True))


if __name__ == '__main__':
    main()
