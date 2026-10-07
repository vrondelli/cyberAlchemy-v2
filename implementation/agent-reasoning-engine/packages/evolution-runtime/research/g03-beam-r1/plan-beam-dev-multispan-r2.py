#!/usr/bin/env python3
"""Source-only multi-span outline candidate for exposed BEAM process questions."""

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import re


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002')
HERE = Path(__file__).resolve().parent
SOURCE = ROOT / 'SOURCE-ONLY.jsonl'
SPLIT = ROOT / 'DEV-SPLIT.json'
R1 = HERE / 'plan-beam-dev-mosaic-r1.py'
PINS = {
    SOURCE: 'bfae354f876ccb0d5b95aebad51cfa734ce82e7c4c8102beeb5a9bd0476bc26d',
    SPLIT: '3761dc9b64bdf453a55efa040e0b52d2096d68356d174ee3d141d764259f716e',
    R1: '2300f749f97262f383c7286d5729db3a80dc73cbb040ab1123f1ac6375142cba',
}
MAX_CHARS = 5000
RADIUS = 2
ASSISTANT_ANCHOR_CHARS = 1550
USER_ANCHOR_CHARS = 380
NEIGHBOR_CHARS = 230


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False,
                      separators=(',', ':')).encode()


def need(condition, reason):
    if not condition:
        raise ValueError('g03-beam-dev-multispan-r2.' + reason)


def outline(content, query_terms, limit, r1):
    if len(content) <= limit:
        return content, 'full-turn'
    raw_lines = [line.strip() for line in content.splitlines() if line.strip()]
    if len(raw_lines) < 3:
        excerpt, _ = r1.excerpt(content, query_terms, limit)
        return excerpt, 'query-window'
    scored = []
    for index, line in enumerate(raw_lines):
        if line.startswith('```') or len(line) > 700:
            continue
        normalized = re.sub(r'\s+', ' ', line)[:180]
        overlap = len(set(r1.terms(normalized)) & query_terms)
        heading = bool(re.match(r'^#{1,6}\s', normalized))
        section = bool(re.search(r'\b(week\s*\d+|follow[- ]?up|before the meeting|during the meeting)\b',
                                 normalized, re.IGNORECASE))
        list_item = bool(re.match(r'^(?:[-*]\s+|\d+[.)]\s+)', normalized))
        task = bool(re.search(r'\b(task|step|prepare|bring|arrive|dress|notes|thank|milestone)\b',
                              normalized, re.IGNORECASE))
        example = bool(re.search(r'\b(example|e\.g\.)\b', normalized,
                                 re.IGNORECASE))
        score = (3 * overlap + 4 * heading + 3 * section +
                 2 * list_item + 2 * task - 4 * example)
        if score > 0:
            scored.append((-score, index, normalized))
    if not scored:
        excerpt, _ = r1.excerpt(content, query_terms, limit)
        return excerpt, 'query-window'
    selected = []
    used = 0
    for _, index, line in sorted(scored):
        cost = len(line) + (3 if selected else 0)
        if used + cost <= limit:
            selected.append((index, line))
            used += cost
    text = ' | '.join(line for _, line in sorted(selected))
    need(text and len(text) <= limit, 'outline-limit')
    return text, 'multi-span-outline'


def project(question, turns, r1):
    ranking = r1.turn_ranking(question, turns)
    anchors = ranking[:2]
    priority = [(turn_id, True) for turn_id in anchors]
    neighbors = sorted({neighbor for anchor in anchors
                        for neighbor in range(max(0, anchor - RADIUS),
                                              min(len(turns), anchor + RADIUS + 1))}
                       - set(anchors),
                       key=lambda turn_id: (min(abs(turn_id - anchor)
                                                for anchor in anchors), turn_id))
    priority.extend((turn_id, False) for turn_id in neighbors)
    priority.extend((turn_id, False) for turn_id in ranking
                    if turn_id not in {item[0] for item in priority})
    query_terms = set(r1.terms(question))
    chosen = []
    for turn_id, anchor in priority:
        turn = turns[turn_id]
        limit = (ASSISTANT_ANCHOR_CHARS if turn['role'] == 'assistant' else
                 USER_ANCHOR_CHARS) if anchor else NEIGHBOR_CHARS
        text, method = outline(turn['content'], query_terms, limit, r1)
        item = {'source_turn': turn_id, 'role': turn['role'],
                'content': text, 'selection': method}
        trial = chosen + [item]
        if r1.chars({'archived_evidence': trial}) <= MAX_CHARS:
            chosen = trial
    chosen.sort(key=lambda item: item['source_turn'])
    projection = {'archived_evidence': chosen}
    need(chosen and r1.chars(projection) <= MAX_CHARS and
         len({item['source_turn'] for item in chosen}) == len(chosen),
         'projection-boundary')
    return projection, anchors


def run():
    need(all(sha(path.read_bytes()) == expected for path, expected in PINS.items()),
         'input-drift')
    spec = importlib.util.spec_from_file_location('beam_mosaic_r1', R1)
    r1 = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(r1)
    split = json.loads(SPLIT.read_text())
    dev = set(split['development_conversation_keys'])
    holdout = set(split['heldout_conversation_keys'])
    need(len(dev) == 4 and len(holdout) == 16 and not dev & holdout,
         'split-boundary')
    rows = [json.loads(line) for line in SOURCE.read_text().splitlines()]
    need(len(rows) == 20 and {row['conversation_key'] for row in rows} ==
         dev | holdout, 'source-population')
    projections = []
    for row in rows:
        key = row['conversation_key']
        if key not in dev:
            continue
        probes = [probe for probe in row['probes']
                  if probe['ability'] == 'information_extraction']
        need(len(probes) == 2, 'ability-quota')
        probe = probes[1]
        projection, anchors = project(probe['question'], row['turns'], r1)
        projections.append({
            'probe_id': probe['id'], 'conversation_key': key,
            'anchor_turn_ids': anchors,
            'selected_turn_ids': [item['source_turn']
                                  for item in projection['archived_evidence']],
            'projection_utf16_chars': r1.chars(projection),
            'projection_sha256': sha(canonical(projection)),
            'projection': projection,
        })
    need(len(projections) == 4 and
         len({row['probe_id'] for row in projections}) == 4, 'dev-count')
    return {
        'schema_version': 'are.g03-beam-dev-multispan-source-r2/v1',
        'status': 'source-only-sealed-before-evaluator-audit',
        'source_only_sha256': PINS[SOURCE], 'split_sha256': PINS[SPLIT],
        'r1_ranker_sha256': PINS[R1],
        'policy': 'two-turn-bm25-anchors-radius-two-multi-span-outline-r2',
        'utf16_character_ceiling': MAX_CHARS,
        'development_conversations': 4,
        'reserved_conversations_not_emitted': 16,
        'projections': sorted(projections, key=lambda row: row['probe_id']),
        'evaluator_fields_read': False, 'model_calls': 0,
        'claim_ceiling': 'Exposed development source-only retrieval candidate; no answer score, holdout, or superiority',
        'open_questions': ['Do multi-span outlines preserve answer-critical steps?',
                           'Will a matched GLM pilot beat the unchanged BM25 control?'],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    need(not args.output.exists(), 'output-exists')
    result = run()
    data = json.dumps(result, sort_keys=True, indent=2).encode() + b'\n'
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as handle:
        handle.write(data)
    print(json.dumps({'projections': len(result['projections']),
                      'maximum_utf16_chars': max(row['projection_utf16_chars']
                                                 for row in result['projections']),
                      'receipt_sha256': sha(data)}, sort_keys=True))


if __name__ == '__main__':
    main()
