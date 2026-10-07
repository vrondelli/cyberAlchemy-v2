#!/usr/bin/env python3
"""Source-only BEAM event excerpts; seal development IDs before evaluator use."""

import argparse
from collections import Counter
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import re


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002')
SOURCE = ROOT / 'SOURCE-ONLY.jsonl'
SOURCE_SHA = 'bfae354f876ccb0d5b95aebad51cfa734ce82e7c4c8102beeb5a9bd0476bc26d'
SPLIT = ROOT / 'DEV-SPLIT.json'
SPLIT_SHA = '3761dc9b64bdf453a55efa040e0b52d2096d68356d174ee3d141d764259f716e'
R1_CODE = Path(__file__).with_name('plan-beam-treatment-projection-r1.py')
R1_CODE_SHA = '221774a91d1533b2183814b5e98df38358b08c14986ca5ad5d5a07990fe07087'
R1_RECEIPT = ROOT / 'TREATMENT-PROJECTION-r1.json'
R1_RECEIPT_SHA = '061452525015aa9a274fa70ef87da957b7e2088cf1183b342353ad726528476c'
EXCERPT_CHARS = 420
TIMELINE_BINS = 8
EVENT_STOP = {'can', 'you', 'list', 'order', 'which', 'brought', 'different',
    'aspects', 'throughout', 'conversations', 'conversation', 'mention', 'only',
    'three', 'five', 'six', 'items', 'item', 'walk', 'through', 'across', 'our',
    'this', 'that', 'those', 'about', 'into', 'stages', 'related', 'process',
    'developing', 'development', 'discussions'}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False,
        separators=(',', ':')).encode()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-event-r2.' + reason)


def load_r1():
    need(sha(R1_CODE.read_bytes()) == R1_CODE_SHA, 'ranker-code-drift')
    spec = importlib.util.spec_from_file_location('beam_ranker_r1', R1_CODE)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def r1_selection(ranker, probe, units, token_sets, idf):
    query = ranker.terms(probe['question'])
    scored = []
    for index, unit in enumerate(units):
        overlap = query.intersection(token_sets[index])
        relevance = sum(idf[term] for term in overlap)
        scored.append((-relevance, unit['role'] != 'user', -unit['source_turn'],
            -unit['part_index'], index))
    scored.sort()
    chosen = []
    for item in scored:
        unit = units[item[4]]
        if ranker.chars({'archived_evidence': chosen + [unit]}) <= 5000:
            chosen.append(unit)
    need(chosen, 'r1-empty')
    chosen.sort(key=lambda unit: (unit['source_turn'], unit['part_index']))
    result = ranker.project(probe, units, token_sets, idf)
    need(ranker.sha({'archived_evidence': chosen}) == result['projection_sha256'],
        'r1-equivalence')
    return result, [(unit['source_turn'], unit['part_index']) for unit in chosen]


def event_terms(question):
    return {term for term in re.findall(r'[a-z0-9]+', question.lower())
        if len(term) > 2 and term not in EVENT_STOP}


def excerpt(turn, turn_id, overlap, idf):
    content = turn['content']
    # Prefer the rarest query term, taking its first occurrence. The excerpt is
    # exact source text; offsets are Python string/code-point offsets.
    ranked = sorted(overlap, key=lambda term: (-idf[term], term))
    positions = [(content.lower().find(term), term) for term in ranked]
    found = [(position, term) for position, term in positions if position >= 0]
    need(found, 'term-position')
    position, _ = min(found, key=lambda item: (-idf[item[1]], item[0]))
    start = max(0, position - EXCERPT_CHARS // 3)
    end = min(len(content), start + EXCERPT_CHARS)
    start = max(0, end - EXCERPT_CHARS)
    return {'source_turn': turn_id, 'role': turn['role'],
        'time_anchor': turn['time_anchor'], 'excerpt_start': start,
        'excerpt_end': end, 'content': content[start:end]}


def event_selection(ranker, probe, turns):
    query = event_terms(probe['question'])
    token_sets = [ranker.terms(turn['content']) for turn in turns]
    counts = Counter(term for found in token_sets for term in found)
    idf = {term: 1.0 + math.log((len(turns) + 1) / (count + 1))
        for term, count in counts.items()}
    candidates = []
    for turn_id, turn in enumerate(turns):
        overlap = query.intersection(token_sets[turn_id])
        if not overlap:
            continue
        item = excerpt(turn, turn_id, overlap, idf)
        score = sum(idf[term] for term in overlap) / math.sqrt(1 + len(token_sets[turn_id]))
        score += 0.35 * len(overlap) + (0.75 if turn['role'] == 'user' else 0)
        candidates.append((-score, -len(overlap), turn['role'] != 'user',
            turn_id, item))
    need(candidates, 'no-event-candidates')
    candidates.sort(key=lambda item: item[:4])
    bins = {index: [] for index in range(TIMELINE_BINS)}
    for item in candidates:
        bin_id = min(TIMELINE_BINS - 1,
            item[3] * TIMELINE_BINS // len(turns))
        bins[bin_id].append(item)
    # One strong anchor per occupied temporal bin, then fill with remaining
    # ranked anchors. No citation or reference field influences this schedule.
    priority = [rows[0] for rows in bins.values() if rows]
    seen = {item[3] for item in priority}
    priority.extend(item for item in candidates if item[3] not in seen)
    chosen = []
    for item in priority:
        candidate = chosen + [item[4]]
        if ranker.chars({'archived_evidence': candidate}) <= 5000:
            chosen = candidate
    need(chosen, 'empty-event-projection')
    chosen.sort(key=lambda item: item['source_turn'])
    projection = {'archived_evidence': chosen}
    need(ranker.chars(projection) <= 5000, 'event-projection-over-limit')
    identities = [(item['source_turn'], item['excerpt_start'],
        item['excerpt_end']) for item in chosen]
    return {'projection_sha256': ranker.sha(projection),
        'projection_chars': ranker.chars(projection),
        'selected_units': len(chosen),
        'selected_source_identity_sha256': ranker.sha(identities)}, identities


def run():
    need(sha(SOURCE.read_bytes()) == SOURCE_SHA and
        sha(SPLIT.read_bytes()) == SPLIT_SHA and
        sha(R1_RECEIPT.read_bytes()) == R1_RECEIPT_SHA, 'input-drift')
    ranker = load_r1()
    split = json.loads(SPLIT.read_text())
    r1_receipt = json.loads(R1_RECEIPT.read_text())
    development = set(split['development_conversation_keys'])
    need(len(development) == 4 and len(split['heldout_conversation_keys']) == 16
        and not development.intersection(split['heldout_conversation_keys']),
        'split-boundary')
    rows = [json.loads(line) for line in SOURCE.read_text().splitlines()]
    need(len(rows) == 20, 'source-row-count')
    binding_rows = []
    dev_selections = []
    ability_counts = Counter()
    for row in rows:
        units = [unit for turn_id, turn in enumerate(row['turns'])
            for unit in ranker.split_turn(turn, turn_id)]
        token_sets = [ranker.terms(unit['content']) for unit in units]
        counts = Counter(term for found in token_sets for term in found)
        idf = {term: 1.0 + math.log((len(units) + 1) / (count + 1))
            for term, count in counts.items()}
        for probe in row['probes']:
            ability = probe['ability']
            if ability == 'event_ordering':
                result, identities = event_selection(ranker, probe, row['turns'])
            else:
                result, identities = r1_selection(ranker, probe, units,
                    token_sets, idf)
            need(result['projection_chars'] <= 5000, 'projection-ceiling')
            ability_counts[ability] += 1
            binding_rows.append([probe['id'], ability,
                result['projection_sha256'], result['projection_chars'],
                result['selected_source_identity_sha256']])
            if row['conversation_key'] in development:
                dev_selections.append({'conversation_key': row['conversation_key'],
                    'probe_id': probe['id'], 'ability': ability,
                    'selected_source_identities': identities,
                    'selected_turn_ids': sorted({item[0] for item in identities}),
                    'projection_sha256': result['projection_sha256'],
                    'projection_chars': result['projection_chars']})
    need(len(binding_rows) == 400 and len(dev_selections) == 80 and
        len({row[0] for row in binding_rows}) == 400 and
        all(count == 40 for count in ability_counts.values()), 'probe-counts')
    # Recheck the unchanged nine abilities against the earlier source-only
    # projection root by preserving per-probe equivalence in r1_selection.
    need(r1_receipt['probes'] == 400, 'r1-binding')
    return {'schema_version': 'are.g03-beam-event-projection-r2/v1',
        'status': 'sealed-source-only-before-r2-development-audit',
        'source_only_sha256': SOURCE_SHA, 'split_sha256': SPLIT_SHA,
        'r1_candidate_code_sha256': R1_CODE_SHA,
        'r1_treatment_receipt_sha256': R1_RECEIPT_SHA,
        'policy': 'event-topic-excerpts-eight-timeline-bins-then-ranked-fill-r2',
        'event_excerpt_codepoint_ceiling': EXCERPT_CHARS,
        'projection_utf16_character_ceiling': 5000,
        'conversations': 20, 'probes': 400,
        'event_ordering_probes': ability_counts['event_ordering'],
        'other_ability_probes_unchanged': 360,
        'maximum_projection_utf16_characters': max(row[3]
            for row in binding_rows),
        'projection_bindings_sha256': sha(canonical(sorted(binding_rows))),
        'development_conversations': 4, 'development_probes': 80,
        'heldout_conversations_not_emitted': 16,
        'selections': sorted(dev_selections, key=lambda row: row['probe_id']),
        'evaluator_fields_read': False, 'model_calls': 0,
        'native_scores': 0,
        'claim_ceiling': 'Source-only event-excerpt candidate; no label reach, answer accuracy, 8K wire, independent holdout or superiority',
        'open_questions': ['Does excerpt selection improve cited-turn reach on development?',
            'Are excerpts substantively sufficient for sequence answers?',
            'Will a separately frozen paired campaign pass quality and cost gates?']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    result = run()
    data = json.dumps(result, sort_keys=True, indent=2).encode() + b'\n'
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as handle:
        handle.write(data)
    print(json.dumps({'status': result['status'], 'probes': result['probes'],
        'max_projection_chars': result['maximum_projection_utf16_characters'],
        'receipt_sha256': sha(data), 'output': str(args.output)}, sort_keys=True))


if __name__ == '__main__':
    main()
