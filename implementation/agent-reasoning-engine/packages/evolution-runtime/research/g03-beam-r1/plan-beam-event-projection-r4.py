#!/usr/bin/env python3
"""Source-only BEAM user-turn chronology plus focused topical excerpts."""

import argparse
from collections import Counter
import hashlib
import importlib.util
import json
import math
from pathlib import Path


HERE = Path(__file__).resolve().parent
ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002')
SOURCE = ROOT / 'SOURCE-ONLY.jsonl'
SOURCE_SHA = 'bfae354f876ccb0d5b95aebad51cfa734ce82e7c4c8102beeb5a9bd0476bc26d'
SPLIT = ROOT / 'DEV-SPLIT.json'
SPLIT_SHA = '3761dc9b64bdf453a55efa040e0b52d2096d68356d174ee3d141d764259f716e'
R3_CODE = HERE / 'plan-beam-event-projection-r3.py'
R3_CODE_SHA = '60e3b66bfe6438b31e2c7d8c191fd9bc137107ac37029c962380389340f534e2'
PROJECTION_CEILING = 24000
TIMELINE_CEILING = 19500
PREFIX_CEILING = 120
FOCUS_CHARS = 400
FOCUS_COUNT = 18
TIMELINE_BINS = 8


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False,
        separators=(',', ':')).encode()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-event-r4.' + reason)


def load_r3():
    need(sha(R3_CODE.read_bytes()) == R3_CODE_SHA, 'r3-code-drift')
    spec = importlib.util.spec_from_file_location('beam_event_r3', R3_CODE)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def encode_row(turn_id, content):
    # JSON string quoting preserves exact source substring and line boundaries.
    return f'T{turn_id}: {json.dumps(content, ensure_ascii=False)}'


def render(turns, identities):
    timeline = []
    focus = []
    for kind, turn_id, start, end in identities:
        need(kind in ('timeline', 'focus') and type(turn_id) is int and
            0 <= turn_id < len(turns) and turns[turn_id]['role'] == 'user' and
            type(start) is int and type(end) is int and
            0 <= start < end <= len(turns[turn_id]['content']),
            'identity-bounds')
        line = encode_row(turn_id, turns[turn_id]['content'][start:end])
        (timeline if kind == 'timeline' else focus).append(line)
    return {'user_turn_timeline': '\n'.join(timeline),
        'topical_details': '\n'.join(focus)}


def event_selection(r3, ranker, probe, turns):
    user_ids = [turn_id for turn_id, turn in enumerate(turns)
        if turn['role'] == 'user']
    need(user_ids, 'no-user-turns')
    low, high, best = 1, PREFIX_CEILING, 0
    while low <= high:
        mid = (low + high) // 2
        identities = [('timeline', turn_id, 0,
            min(len(turns[turn_id]['content']), mid)) for turn_id in user_ids]
        projected = render(turns, identities)
        if ranker.chars(projected) <= TIMELINE_CEILING:
            best = mid
            low = mid + 1
        else:
            high = mid - 1
    need(best >= 1, 'timeline-cannot-fit')
    identities = [('timeline', turn_id, 0,
        min(len(turns[turn_id]['content']), best)) for turn_id in user_ids]
    r2 = r3.load_r2()
    query = r2.event_terms(probe['question'])
    tokens = {turn_id: ranker.terms(turns[turn_id]['content'])
        for turn_id in user_ids}
    counts = Counter(term for found in tokens.values() for term in found)
    idf = {term: 1.0 + math.log((len(user_ids) + 1) / (count + 1))
        for term, count in counts.items()}
    scored = []
    for turn_id in user_ids:
        overlap = query.intersection(tokens[turn_id])
        if overlap:
            score = (sum(idf[term] for term in overlap) /
                math.sqrt(1 + len(tokens[turn_id])))
            score += 0.35 * len(overlap)
            scored.append((-score, -len(overlap), turn_id, overlap))
    scored.sort(key=lambda row: row[:3])
    bins = {index: [] for index in range(TIMELINE_BINS)}
    for row in scored:
        bins[min(TIMELINE_BINS - 1,
            row[2] * TIMELINE_BINS // len(turns))].append(row)
    priority = [rows[0] for rows in bins.values() if rows]
    seen = {row[2] for row in priority}
    priority.extend(row for row in scored if row[2] not in seen)
    for row in priority[:FOCUS_COUNT]:
        turn_id = row[2]
        old = r2.EXCERPT_CHARS
        r2.EXCERPT_CHARS = FOCUS_CHARS
        try:
            excerpt = r2.excerpt(turns[turn_id], turn_id, row[3], idf)
        finally:
            r2.EXCERPT_CHARS = old
        candidate = identities + [('focus', turn_id,
            excerpt['excerpt_start'], excerpt['excerpt_end'])]
        if ranker.chars(render(turns, candidate)) <= PROJECTION_CEILING:
            identities = candidate
    projection = render(turns, identities)
    need(ranker.chars(projection) <= PROJECTION_CEILING, 'projection-ceiling')
    return {'projection_sha256': ranker.sha(projection),
        'projection_chars': ranker.chars(projection),
        'selected_source_identity_sha256': ranker.sha(identities),
        'timeline_prefix_chars': best,
        'timeline_user_turns': len(user_ids),
        'focused_excerpts': len(identities) - len(user_ids)}, identities


def run():
    need(sha(SOURCE.read_bytes()) == SOURCE_SHA and
        sha(SPLIT.read_bytes()) == SPLIT_SHA, 'input-drift')
    r3 = load_r3()
    r2 = r3.load_r2()
    ranker = r2.load_r1()
    split = json.loads(SPLIT.read_text())
    dev = set(split['development_conversation_keys'])
    need(len(dev) == 4 and len(split['heldout_conversation_keys']) == 16
        and not dev.intersection(split['heldout_conversation_keys']),
        'split-boundary')
    rows = [json.loads(line) for line in SOURCE.read_text().splitlines()]
    need(len(rows) == 20, 'source-row-count')
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
                result, identities = event_selection(r3, ranker, probe,
                    row['turns'])
            else:
                result, identities = r2.r1_selection(ranker, probe, units,
                    token_sets, idf)
            need(result['projection_chars'] <= PROJECTION_CEILING,
                'projection-over-limit')
            abilities[probe['ability']] += 1
            bindings.append([probe['id'], probe['ability'],
                result['projection_sha256'], result['projection_chars'],
                result['selected_source_identity_sha256']])
            if row['conversation_key'] in dev:
                selections.append({'conversation_key': row['conversation_key'],
                    'probe_id': probe['id'], 'ability': probe['ability'],
                    'selected_source_identities': identities,
                    'projection_sha256': result['projection_sha256'],
                    'projection_chars': result['projection_chars'],
                    'timeline_prefix_chars': result.get('timeline_prefix_chars'),
                    'timeline_user_turns': result.get('timeline_user_turns'),
                    'focused_excerpts': result.get('focused_excerpts')})
    need(len(bindings) == 400 and len(selections) == 80 and
        len({row[0] for row in bindings}) == 400 and
        all(count == 40 for count in abilities.values()), 'probe-counts')
    return {'schema_version': 'are.g03-beam-event-projection-r4/v1',
        'status': 'sealed-source-only-before-r4-development-audit',
        'source_only_sha256': SOURCE_SHA, 'split_sha256': SPLIT_SHA,
        'r3_candidate_code_sha256': R3_CODE_SHA,
        'policy': 'all-user-prefix-chronology-plus-temporally-spread-topical-details-r4',
        'projection_utf16_character_ceiling': PROJECTION_CEILING,
        'timeline_utf16_character_ceiling': TIMELINE_CEILING,
        'prefix_codepoint_ceiling': PREFIX_CEILING,
        'focus_excerpt_codepoint_ceiling': FOCUS_CHARS,
        'focus_excerpt_count_ceiling': FOCUS_COUNT,
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
        'claim_ceiling': 'Source-only candidate; no actual 8K admission, answer quality, independent holdout, or superiority',
        'open_questions': ['Do full chronology and details fit the actual GLM 8K tokenizer?',
            'Are required development events represented with enough detail?',
            'Will a separately frozen paired campaign improve native quality and cost?']}


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
