#!/usr/bin/env python3
"""Source-only BEAM event timeline with topical anchors and nearby user turns."""

import argparse
from collections import Counter
import hashlib
import importlib.util
import json
import math
from pathlib import Path


HERE = Path(__file__).resolve().parent
ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002')
R2_CODE = HERE / 'plan-beam-event-projection-r2.py'
R2_SHA = '2cad2660d5c38f22997b8c55dccdc45abbcb2a0542d3e8483d61f9ed905c4297'
SOURCE = ROOT / 'SOURCE-ONLY.jsonl'
SOURCE_SHA = 'bfae354f876ccb0d5b95aebad51cfa734ce82e7c4c8102beeb5a9bd0476bc26d'
SPLIT = ROOT / 'DEV-SPLIT.json'
SPLIT_SHA = '3761dc9b64bdf453a55efa040e0b52d2096d68356d174ee3d141d764259f716e'
CEILING = 14000
EXCERPT_CHARS = 600
NEIGHBOR_CHARS = 360
ANCHOR_COUNT = 24
NEIGHBOR_DISTANCE = 5
TIMELINE_BINS = 8


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False,
        separators=(',', ':')).encode()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-event-r3.' + reason)


def load_r2():
    need(sha(R2_CODE.read_bytes()) == R2_SHA, 'r2-code-drift')
    spec = importlib.util.spec_from_file_location('beam_event_r2', R2_CODE)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def choose_event(r2, ranker, probe, turns):
    # Selection sees only source text and question, never citations or answers.
    user_ids = [index for index, turn in enumerate(turns)
        if turn['role'] == 'user']
    need(user_ids, 'no-user-turns')
    query = r2.event_terms(probe['question'])
    tokens = {index: ranker.terms(turns[index]['content']) for index in user_ids}
    counts = Counter(term for found in tokens.values() for term in found)
    idf = {term: 1.0 + math.log((len(user_ids) + 1) / (count + 1))
        for term, count in counts.items()}
    scored = []
    for index in user_ids:
        overlap = query.intersection(tokens[index])
        if overlap:
            score = sum(idf[term] for term in overlap) / math.sqrt(1 + len(tokens[index]))
            score += 0.35 * len(overlap)
            scored.append((-score, -len(overlap), index, overlap))
    need(scored, 'no-topic-anchors')
    scored.sort(key=lambda row: row[:3])
    bins = {index: [] for index in range(TIMELINE_BINS)}
    for row in scored:
        bins[min(TIMELINE_BINS - 1,
            row[2] * TIMELINE_BINS // len(turns))].append(row)
    anchors = [rows[0] for rows in bins.values() if rows]
    seen = {row[2] for row in anchors}
    anchors.extend(row for row in scored if row[2] not in seen)
    anchors = anchors[:ANCHOR_COUNT]
    # First spread strong topical anchors, then add nearby user turns to
    # preserve transitions. Chronological ordering is applied only at output.
    priority = []
    for row in anchors:
        if row[2] not in priority:
            priority.append(row[2])
    for distance in range(1, NEIGHBOR_DISTANCE + 1):
        for row in anchors:
            for neighbor in (row[2] - distance, row[2] + distance):
                if neighbor in tokens and neighbor not in priority:
                    priority.append(neighbor)
    selected = []
    for turn_id in priority:
        turn = turns[turn_id]
        overlap = query.intersection(tokens[turn_id])
        if overlap:
            old = r2.EXCERPT_CHARS
            r2.EXCERPT_CHARS = EXCERPT_CHARS
            try:
                item = r2.excerpt(turn, turn_id, overlap, idf)
            finally:
                r2.EXCERPT_CHARS = old
        else:
            end = min(len(turn['content']), NEIGHBOR_CHARS)
            item = {'source_turn': turn_id, 'role': 'user',
                'time_anchor': turn['time_anchor'], 'excerpt_start': 0,
                'excerpt_end': end, 'content': turn['content'][:end]}
        if ranker.chars({'archived_evidence': selected + [item]}) <= CEILING:
            selected.append(item)
    need(selected, 'empty-projection')
    selected.sort(key=lambda item: item['source_turn'])
    projection = {'archived_evidence': selected}
    identities = [(item['source_turn'], item['excerpt_start'],
        item['excerpt_end']) for item in selected]
    return {'projection_sha256': ranker.sha(projection),
        'projection_chars': ranker.chars(projection),
        'selected_source_identity_sha256': ranker.sha(identities)}, identities


def run():
    need(sha(SOURCE.read_bytes()) == SOURCE_SHA and
        sha(SPLIT.read_bytes()) == SPLIT_SHA, 'input-drift')
    r2 = load_r2()
    ranker = r2.load_r1()
    split = json.loads(SPLIT.read_text())
    dev = set(split['development_conversation_keys'])
    need(len(dev) == 4 and len(split['heldout_conversation_keys']) == 16
        and not dev.intersection(split['heldout_conversation_keys']), 'split-boundary')
    rows = [json.loads(line) for line in SOURCE.read_text().splitlines()]
    need(len(rows) == 20, 'source-rows')
    bindings, selections, abilities = [], [], Counter()
    for row in rows:
        units = [unit for turn_id, turn in enumerate(row['turns'])
            for unit in ranker.split_turn(turn, turn_id)]
        token_sets = [ranker.terms(unit['content']) for unit in units]
        counts = Counter(term for found in token_sets for term in found)
        idf = {term: 1.0 + math.log((len(units) + 1) / (count + 1))
            for term, count in counts.items()}
        for probe in row['probes']:
            if probe['ability'] == 'event_ordering':
                result, identities = choose_event(r2, ranker, probe,
                    row['turns'])
            else:
                result, identities = r2.r1_selection(ranker, probe, units,
                    token_sets, idf)
            need(result['projection_chars'] <= CEILING, 'projection-limit')
            abilities[probe['ability']] += 1
            bindings.append([probe['id'], probe['ability'],
                result['projection_sha256'], result['projection_chars'],
                result['selected_source_identity_sha256']])
            if row['conversation_key'] in dev:
                selections.append({'conversation_key': row['conversation_key'],
                    'probe_id': probe['id'], 'ability': probe['ability'],
                    'selected_source_identities': identities,
                    'selected_turn_ids': sorted({item[0] for item in identities}),
                    'projection_sha256': result['projection_sha256'],
                    'projection_chars': result['projection_chars']})
    need(len(bindings) == 400 and len(selections) == 80 and
        len({row[0] for row in bindings}) == 400 and
        all(count == 40 for count in abilities.values()), 'probe-counts')
    return {'schema_version': 'are.g03-beam-event-projection-r3/v1',
        'status': 'sealed-source-only-before-r3-development-audit',
        'source_only_sha256': SOURCE_SHA, 'split_sha256': SPLIT_SHA,
        'r2_candidate_code_sha256': R2_SHA,
        'policy': 'topical-user-anchors-eight-bins-neighbor-timeline-r3',
        'event_excerpt_codepoint_ceiling': EXCERPT_CHARS,
        'neighbor_excerpt_codepoint_ceiling': NEIGHBOR_CHARS,
        'neighbor_source_turn_distance': NEIGHBOR_DISTANCE,
        'event_anchor_count_ceiling': ANCHOR_COUNT,
        'projection_utf16_character_ceiling': CEILING,
        'conversations': 20, 'probes': 400,
        'event_ordering_probes': abilities['event_ordering'],
        'other_ability_probes_unchanged': 360,
        'maximum_projection_utf16_characters': max(row[3] for row in bindings),
        'projection_bindings_sha256': sha(canonical(sorted(bindings))),
        'development_conversations': 4, 'development_probes': 80,
        'heldout_conversations_not_emitted': 16,
        'selections': sorted(selections, key=lambda row: row['probe_id']),
        'evaluator_fields_read': False, 'model_calls': 0,
        'native_scores': 0,
        'claim_ceiling': 'Source-only event timeline candidate; no development relevance or answer quality, 8K wire, holdout or superiority',
        'open_questions': ['Does the timeline improve development cited-turn reach?',
            'Does an actual GLM 8K tokenizer check pass with output reserve?',
            'Does answer quality improve on the exposed development questions?']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    receipt = run()
    data = json.dumps(receipt, sort_keys=True, indent=2).encode() + b'\n'
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as handle:
        handle.write(data)
    print(json.dumps({'status': receipt['status'],
        'probes': receipt['probes'],
        'max_projection_chars': receipt['maximum_projection_utf16_characters'],
        'receipt_sha256': sha(data), 'output': str(args.output)},
        sort_keys=True))


if __name__ == '__main__':
    main()
