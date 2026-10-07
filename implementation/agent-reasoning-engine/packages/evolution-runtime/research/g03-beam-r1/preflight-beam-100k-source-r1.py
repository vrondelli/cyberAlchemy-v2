#!/usr/bin/env python3
"""Source-only BEAM 100K boundary check; never emits question or reference text."""

import argparse
import ast
from collections import Counter
import hashlib
import json
from pathlib import Path

import pyarrow.parquet as pq


SOURCE = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002/100K-00000-of-00001.parquet')
SOURCE_SHA = 'c0519be25907005ba873c927c50877471d550873039d96c041554d0075a78ace'
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
MODEL_KEYS = {'conversation_key', 'turns', 'probes'}
TURN_KEYS = {'role', 'content', 'time_anchor'}
PROBE_KEYS = {'id', 'ability', 'question'}


def digest(value):
    if isinstance(value, bytes):
        data = value
    else:
        data = json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()
    return hashlib.sha256(data).hexdigest()


def need(condition, message):
    if not condition:
        raise ValueError('g03-beam-source-preflight.' + message)


def run():
    need(SOURCE.is_file() and digest(SOURCE.read_bytes()) == SOURCE_SHA, 'source-drift')
    rows = pq.read_table(SOURCE).to_pylist()
    need(len(rows) == 20, 'row-count')
    seen_keys, seen_questions = set(), set()
    abilities = Counter()
    reference_fields, rubric_sizes = {}, Counter()
    projection_hashes, source_turns, selected_keys = [], 0, []
    for row in rows:
        need(set(row) == {'conversation_id', 'conversation_seed', 'narratives',
            'user_profile', 'conversation_plan', 'user_questions', 'chat',
            'probing_questions'}, 'row-schema')
        seed = row['conversation_seed']
        key = f"{seed['category']}:{seed['id']}"
        need(key not in seen_keys and isinstance(row['conversation_id'], str), 'conversation-key')
        seen_keys.add(key)
        turns = []
        flattened = [message for segment in row['chat'] for message in segment]
        need(len(flattened) > 0 and [message['id'] for message in flattened] ==
            list(range(len(flattened))), 'turn-order')
        for index, message in enumerate(flattened):
            need(message['role'] in {'user', 'assistant'} and
                message['role'] == ('user' if index % 2 == 0 else 'assistant') and
                isinstance(message['content'], str) and message['content'].strip(),
                'turn-content')
            need(message['time_anchor'] is None or
                isinstance(message['time_anchor'], str), 'time-anchor')
            turn = {field: message[field] for field in TURN_KEYS}
            need(set(turn) == TURN_KEYS, 'turn-allowlist')
            turns.append(turn)
        source_turns += len(turns)
        parsed = ast.literal_eval(row['probing_questions'])
        need(isinstance(parsed, dict) and set(parsed) == set(ABILITY_REFS), 'probe-abilities')
        probes = []
        for ability in sorted(ABILITY_REFS):
            entries = parsed[ability]
            need(isinstance(entries, list) and len(entries) == 2, 'probe-quota')
            for ordinal, entry in enumerate(entries):
                need(isinstance(entry, dict) and isinstance(entry.get('question'), str)
                    and entry['question'].strip(), 'question')
                reference = entry.get(ABILITY_REFS[ability])
                need(reference is not None and str(reference).strip(), 'reference-contract')
                rubric = entry.get('rubric')
                need(isinstance(rubric, list) and rubric and
                    all(isinstance(item, str) and item.strip() for item in rubric),
                    'rubric-contract')
                rubric_sizes[len(rubric)] += 1
                reference_fields[ability] = ABILITY_REFS[ability]
                question_hash = digest(entry['question'])
                need(question_hash not in seen_questions, 'duplicate-question')
                seen_questions.add(question_hash)
                probe = {'id': digest([key, ability, ordinal, question_hash])[:24],
                    'ability': ability, 'question': entry['question']}
                need(set(probe) == PROBE_KEYS and not PROBE_KEYS.intersection(
                    set(entry) - {'question'}), 'probe-allowlist')
                probes.append(probe)
                abilities[ability] += 1
        projection = {'conversation_key': key, 'turns': turns, 'probes': probes}
        need(set(projection) == MODEL_KEYS and
            all(set(turn) == TURN_KEYS for turn in projection['turns']) and
            all(set(probe) == PROBE_KEYS for probe in projection['probes']),
            'model-visible-allowlist')
        projection_hashes.append({'conversation_key_hash': digest(key),
            'projection_sha256': digest(projection), 'turns': len(turns),
            'probes': len(probes)})
        selected_keys.append(key)
    need(len(seen_keys) == 20 and source_turns == 5732 and len(seen_questions) == 400
        and all(count == 40 for count in abilities.values()), 'population-counts')
    sample = sorted(selected_keys, key=lambda key: (digest(['g03-beam-100k-preflight-r1', key]), key))[:4]
    return {'schema_version': 'are.g03-beam-100k-source-preflight/v1',
        'status': 'passed-source-only-no-generation', 'source_sha256': SOURCE_SHA,
        'conversations': len(seen_keys), 'turns': source_turns,
        'questions': len(seen_questions), 'ability_counts': dict(sorted(abilities.items())),
        'reference_field_by_ability': reference_fields,
        'rubric_size_counts': dict(sorted(rubric_sizes.items())),
        'model_projection_keys': sorted(MODEL_KEYS),
        'model_turn_keys': sorted(TURN_KEYS),
        'model_probe_keys': sorted(PROBE_KEYS),
        'projection_binding_sha256': digest(sorted(projection_hashes,
            key=lambda row: row['conversation_key_hash'])),
        'deterministic_four_conversation_preflight_key_hashes': [digest(key) for key in sample],
        'model_calls': 0, 'references_emitted_to_model': False,
        'cohort_selected': False, 'judge_validated': False,
        'claim_ceiling': 'Source/reference boundary and population shape only; no 8K token qualification, two-arm parity, scorer, freeze, score, or superiority',
        'open_questions': ['Can a bounded adapter preserve chronological ingestion under an exact 8K tokenizer check?',
            'Which ability-specific blinded judge contract is sufficiently reliable?',
            'Will an owner-approved external-validity definition be frozen before any BEAM model call?']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    receipt = run()
    bytes_ = (json.dumps(receipt, sort_keys=True, indent=2) + '\n').encode()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as handle:
        handle.write(bytes_)
    print(json.dumps({'status': receipt['status'], 'conversations': receipt['conversations'],
        'turns': receipt['turns'], 'questions': receipt['questions'],
        'receipt_sha256': digest(bytes_), 'output': str(args.output)}, sort_keys=True))


if __name__ == '__main__':
    main()
