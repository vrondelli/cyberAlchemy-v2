#!/usr/bin/env python3
"""No-generation BEAM 500K source boundary and disjoint development supply."""

import argparse
import ast
from collections import Counter
import hashlib
import json
from pathlib import Path

import pyarrow.parquet as pq


SOURCE = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1/source/500K-00000-of-00001.parquet')
SOURCE_SHA = 'af05921c979355038e1761b7cde3d2dd713200dd3071b278de0200f6c7f30122'
SOURCE_COMMIT = '3205395e897e7318c7b094ef4e6047b9b82dbb03'
RESERVED = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002/100K-00000-of-00001.parquet')
RESERVED_SHA = 'c0519be25907005ba873c927c50877471d550873039d96c041554d0075a78ace'
ABILITY_REFS = {
    'abstention': 'ideal_response',
    'contradiction_resolution': 'ideal_answer',
    'event_ordering': 'answer',
    'information_extraction': 'answer',
    'instruction_following': 'expected_compliance',
    'knowledge_update': 'answer',
    'multi_session_reasoning': 'answer',
    'preference_following': 'expected_compliance',
    'summarization': 'ideal_summary',
    'temporal_reasoning': 'answer',
}
ROW_KEYS = {'conversation_id', 'conversation_seed', 'narratives',
    'user_profile', 'conversation_plan', 'user_questions', 'chat',
    'probing_questions'}
MODEL_KEYS = {'conversation_key', 'turns', 'probes'}
TURN_KEYS = {'role', 'content', 'time_anchor'}
PROBE_KEYS = {'id', 'ability', 'question'}


def sha_file(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def digest(value):
    data = json.dumps(value, sort_keys=True, ensure_ascii=False,
        separators=(',', ':')).encode('utf-8')
    return hashlib.sha256(data).hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-500k-dev-preflight.' + reason)


def key_of(seed):
    need(isinstance(seed, dict) and isinstance(seed.get('category'), str) and
        isinstance(seed.get('id'), int), 'seed-shape')
    return f"{seed['category']}:{seed['id']}"


def run():
    need(sha_file(SOURCE) == SOURCE_SHA and sha_file(RESERVED) == RESERVED_SHA,
        'source-drift')
    # Only seed identity is read from the reserved 100K file: no chat, question,
    # answer, rubric, or other evaluator field enters this development audit.
    reserved_seeds = pq.read_table(RESERVED,
        columns=['conversation_seed']).column(0).to_pylist()
    reserved_keys = {key_of(seed) for seed in reserved_seeds}
    need(len(reserved_seeds) == len(reserved_keys) == 20, 'reserved-seed-shape')
    rows = pq.read_table(SOURCE).to_pylist()
    need(len(rows) == 35, 'source-row-count')
    seen_keys, question_hashes = set(), set()
    ability_counts = Counter()
    rubric_sizes = Counter()
    projections, eligible, overlap = [], [], []
    total_turns = 0
    for row in rows:
        need(set(row) == ROW_KEYS and isinstance(row['conversation_id'], str),
            'row-schema')
        key = key_of(row['conversation_seed'])
        need(key not in seen_keys, 'duplicate-conversation')
        seen_keys.add(key)
        flattened = [message for segment in row['chat'] for message in segment]
        need(flattened and [message['id'] for message in flattened] ==
            list(range(len(flattened))), 'turn-order')
        turns = []
        for index, message in enumerate(flattened):
            need(message['role'] == ('user' if index % 2 == 0 else 'assistant') and
                isinstance(message['content'], str) and message['content'].strip() and
                (message['time_anchor'] is None or
                 isinstance(message['time_anchor'], str)), 'turn-content')
            turn = {field: message[field] for field in TURN_KEYS}
            need(set(turn) == TURN_KEYS, 'turn-allowlist')
            turns.append(turn)
        total_turns += len(turns)
        parsed = ast.literal_eval(row['probing_questions'])
        need(isinstance(parsed, dict) and set(parsed) == set(ABILITY_REFS),
            'probe-abilities')
        probes = []
        for ability in sorted(ABILITY_REFS):
            entries = parsed[ability]
            need(isinstance(entries, list) and len(entries) == 2,
                'probe-quota')
            for ordinal, entry in enumerate(entries):
                need(isinstance(entry, dict) and
                    isinstance(entry.get('question'), str) and
                    entry['question'].strip(), 'question')
                need(entry.get(ABILITY_REFS[ability]) is not None and
                    str(entry[ABILITY_REFS[ability]]).strip(),
                    'reference-contract')
                rubric = entry.get('rubric')
                need(isinstance(rubric, list) and rubric and
                    all(isinstance(item, str) and item.strip() for item in rubric),
                    'rubric-contract')
                rubric_sizes[len(rubric)] += 1
                question_hash = digest(entry['question'])
                need(question_hash not in question_hashes,
                    'duplicate-question')
                question_hashes.add(question_hash)
                probe = {'id': digest([key, ability, ordinal, question_hash])[:24],
                    'ability': ability, 'question': entry['question']}
                need(set(probe) == PROBE_KEYS, 'probe-allowlist')
                probes.append(probe)
                ability_counts[ability] += 1
        projection = {'conversation_key': key, 'turns': turns, 'probes': probes}
        need(set(projection) == MODEL_KEYS and
            all(set(turn) == TURN_KEYS for turn in turns) and
            all(set(probe) == PROBE_KEYS for probe in probes),
            'model-visible-allowlist')
        projections.append({'key_sha256': digest(key),
            'projection_sha256': digest(projection), 'turns': len(turns)})
        (overlap if key in reserved_keys else eligible).append(key)
    need(len(seen_keys) == 35 and len(question_hashes) == 700 and
        all(ability_counts[name] == 70 for name in ABILITY_REFS) and
        len(overlap) == 5 and len(eligible) == 30, 'population-counts')
    return {'schema_version': 'are.g03-beam-500k-dev-source-preflight/v1',
        'status': 'source-only-development-supply-qualified',
        'source_sha256': SOURCE_SHA, 'source_commit': SOURCE_COMMIT,
        'reserved_source_sha256': RESERVED_SHA,
        'conversations': 35, 'turns': total_turns, 'questions': 700,
        'ability_counts': dict(sorted(ability_counts.items())),
        'rubric_size_counts': dict(sorted(rubric_sizes.items())),
        'reserved_seed_overlap': 5, 'eligible_disjoint_seed_conversations': 30,
        'eligible_disjoint_seed_question_slots': 600,
        'eligible_seed_key_hashes': sorted(digest(key) for key in eligible),
        'excluded_overlap_seed_key_hashes': sorted(digest(key) for key in overlap),
        'model_projection_keys': sorted(MODEL_KEYS),
        'model_turn_keys': sorted(TURN_KEYS),
        'model_probe_keys': sorted(PROBE_KEYS),
        'projection_binding_sha256': digest(sorted(projections,
            key=lambda row: row['key_sha256'])),
        'reserved_fields_read': ['conversation_seed'],
        'references_or_rubrics_emitted_to_model': False,
        'model_calls': 0, 'cohort_selected': False,
        'judge_validated': False,
        'claim_ceiling': 'Cross-length BEAM development supply and source/reference boundary only; not answer quality, a 100K holdout, native BEAM score, or superiority',
        'open_questions': [
            'Can the 500K source be projected symmetrically into actual GLM 8K wires?',
            'Which disjoint-seed development questions can qualify a stronger treatment without tuning the 100K reserved conversations?',
            'What source-conflict and judge rules must be frozen before any independent 100K campaign?']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    receipt = run()
    data = (json.dumps(receipt, sort_keys=True, indent=2) + '\n').encode()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as stream:
        stream.write(data)
    print(json.dumps({'status': receipt['status'],
        'conversations': receipt['conversations'],
        'turns': receipt['turns'], 'questions': receipt['questions'],
        'eligible_disjoint_seed_conversations':
            receipt['eligible_disjoint_seed_conversations'],
        'receipt_sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
