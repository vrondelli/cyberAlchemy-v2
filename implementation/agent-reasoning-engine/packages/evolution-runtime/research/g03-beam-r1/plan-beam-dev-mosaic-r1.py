#!/usr/bin/env python3
"""Source-only neighborhood mosaic for four exposed BEAM multi-step probes."""

import argparse
from collections import Counter
import hashlib
import json
import math
from pathlib import Path
import re


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002')
SOURCE = ROOT / 'SOURCE-ONLY.jsonl'
SPLIT = ROOT / 'DEV-SPLIT.json'
PINS = {
    SOURCE: 'bfae354f876ccb0d5b95aebad51cfa734ce82e7c4c8102beeb5a9bd0476bc26d',
    SPLIT: '3761dc9b64bdf453a55efa040e0b52d2096d68356d174ee3d141d764259f716e',
}
STOP = {'the', 'and', 'for', 'with', 'have', 'how', 'many', 'there', 'that',
        'this', 'can', 'you', 'are', 'was', 'were', 'has', 'had', 'from', 'been',
        'since', 'what', 'which', 'will', 'would', 'could', 'should', 'about',
        'into', 'over', 'course', 'take', 'both', 'were', 'your', 'throughout'}
MAX_CHARS = 5000
ANCHORS = 2
RADIUS = 3
ANCHOR_EXCERPT = 500
NEIGHBOR_EXCERPT = 350


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False,
                      separators=(',', ':')).encode()


def chars(value):
    return len(json.dumps(value, sort_keys=True, ensure_ascii=False,
                          separators=(',', ':')).encode('utf-16-le')) // 2


def need(condition, reason):
    if not condition:
        raise ValueError('g03-beam-dev-mosaic-r1.' + reason)


def terms(value):
    return [term for term in re.findall(r'[a-z0-9]+', value.lower())
            if len(term) > 2 and term not in STOP]


def turn_ranking(question, turns):
    corpora = [Counter(terms(turn['content'])) for turn in turns]
    lengths = [sum(counts.values()) for counts in corpora]
    average = sum(lengths) / len(lengths)
    df = Counter(term for counts in corpora for term in counts)
    query = set(terms(question))
    ranked = []
    for index, counts in enumerate(corpora):
        score = sum(math.log(1 + (len(turns) - df[term] + .5) /
                      (df[term] + .5)) * counts[term] * 2.2 /
                    (counts[term] + 1.2 * (.25 + .75 * lengths[index] / average))
                    for term in query if counts[term])
        ranked.append((-score, turns[index]['role'] != 'user', -index, index))
    ranked.sort()
    return [row[3] for row in ranked]


def excerpt(content, query, limit):
    if len(content) <= limit:
        return content, 0
    lowered = content.lower()
    positions = {0}
    for term in query:
        for match in list(re.finditer(r'\b' + re.escape(term) + r'\b', lowered))[:50]:
            positions.add(max(0, min(len(content) - limit, match.start() - limit // 3)))
    best = max(positions, key=lambda offset: (
        len(set(terms(content[offset:offset + limit])) & query), -offset))
    return content[best:best + limit], best


def project(question, turns):
    ranking = turn_ranking(question, turns)
    anchors = ranking[:ANCHORS]
    priority = [(turn_id, turn_id in anchors)
                for turn_id in anchors]
    neighbors = sorted({neighbor for anchor in anchors
                        for neighbor in range(max(0, anchor - RADIUS),
                                              min(len(turns), anchor + RADIUS + 1))}
                       - set(anchors),
                       key=lambda turn_id: (min(abs(turn_id - anchor)
                                                for anchor in anchors), turn_id))
    priority.extend((turn_id, False) for turn_id in neighbors)
    priority.extend((turn_id, False) for turn_id in ranking
                    if turn_id not in {item[0] for item in priority})
    chosen = []
    query = set(terms(question))
    for turn_id, anchor in priority:
        turn = turns[turn_id]
        text, offset = excerpt(turn['content'], query,
                               ANCHOR_EXCERPT if anchor else NEIGHBOR_EXCERPT)
        item = {'source_turn': turn_id, 'role': turn['role'],
                'content': text, 'excerpt_offset': offset}
        trial = chosen + [item]
        if chars({'archived_evidence': trial}) <= MAX_CHARS:
            chosen = trial
    chosen.sort(key=lambda item: item['source_turn'])
    projection = {'archived_evidence': chosen}
    need(chosen and chars(projection) <= MAX_CHARS and
         len({item['source_turn'] for item in chosen}) == len(chosen),
         'projection-boundary')
    return projection, anchors


def run():
    need(all(sha(path.read_bytes()) == expected for path, expected in PINS.items()),
         'input-drift')
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
        projection, anchors = project(probe['question'], row['turns'])
        projections.append({
            'probe_id': probe['id'], 'conversation_key': key,
            'anchor_turn_ids': anchors,
            'selected_turn_ids': [item['source_turn']
                                  for item in projection['archived_evidence']],
            'projection_utf16_chars': chars(projection),
            'projection_sha256': sha(canonical(projection)),
            'projection': projection,
        })
    need(len(projections) == 4 and
         len({row['probe_id'] for row in projections}) == 4, 'dev-count')
    return {
        'schema_version': 'are.g03-beam-dev-mosaic-source-r1/v1',
        'status': 'source-only-sealed-before-evaluator-audit',
        'source_only_sha256': PINS[SOURCE], 'split_sha256': PINS[SPLIT],
        'policy': 'turn-bm25-two-anchors-radius-three-compact-query-window-r1',
        'utf16_character_ceiling': MAX_CHARS,
        'development_conversations': 4,
        'reserved_conversations_not_emitted': 16,
        'projections': sorted(projections, key=lambda row: row['probe_id']),
        'evaluator_fields_read': False, 'model_calls': 0,
        'claim_ceiling': 'Exposed development source-only retrieval candidate; citation reach and answer quality not yet known',
        'open_questions': ['Does the mosaic reach cited turns without sacrificing answer-bearing detail?',
                           'Will exact GLM 8K wires admit the changed projection?'],
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
