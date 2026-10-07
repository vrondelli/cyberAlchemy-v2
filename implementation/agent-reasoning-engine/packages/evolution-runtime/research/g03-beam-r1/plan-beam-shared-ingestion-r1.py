#!/usr/bin/env python3
"""No-generation BEAM 100K shared-ingestion plan with lossless Unicode fragments."""

import argparse
import ast
from collections import Counter
import hashlib
import json
from pathlib import Path

import pyarrow.parquet as pq


SOURCE = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002/100K-00000-of-00001.parquet')
SOURCE_SHA = 'c0519be25907005ba873c927c50877471d550873039d96c041554d0075a78ace'
PREFLIGHT = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002/SOURCE-PREFLIGHT.json')
PREFLIGHT_SHA = '9b90855f33c62a81679f671f3871da2cbfb30ec3bc4cd7161af96b043205d735'
FRAGMENT_CHARS = 12000
CHUNK_CHARS = 16000
FRAGMENT_KEYS = {'source_turn', 'part_index', 'part_count', 'role', 'content', 'time_anchor'}
ABILITY_KEYS = {'abstention', 'contradiction_resolution', 'event_ordering',
    'information_extraction', 'instruction_following', 'knowledge_update',
    'multi_session_reasoning', 'preference_following', 'summarization',
    'temporal_reasoning'}


def serial(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'))


def digest(value):
    data = value if isinstance(value, bytes) else serial(value).encode('utf-8')
    return hashlib.sha256(data).hexdigest()


def utf16_chars(value):
    return len(serial(value).encode('utf-16-le')) // 2


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-shared-plan.' + reason)


def split_turn(turn, source_turn):
    need(set(turn) == {'role', 'content', 'time_anchor'} and
        isinstance(turn['content'], str) and turn['content'], 'turn-shape')
    text = turn['content']
    parts = []
    offset = 0
    while offset < len(text):
        low, high, best = 1, len(text) - offset, 0
        while low <= high:
            middle = (low + high) // 2
            candidate = {'source_turn': source_turn, 'part_index': 9999,
                'part_count': 9999, 'role': turn['role'],
                'content': text[offset:offset + middle],
                'time_anchor': turn['time_anchor']}
            if utf16_chars(candidate) <= FRAGMENT_CHARS:
                best = middle
                low = middle + 1
            else:
                high = middle - 1
        need(best > 0, 'fragment-cannot-fit')
        parts.append(text[offset:offset + best])
        offset += best
        need(len(parts) < 10000, 'fragment-count-overflow')
    fragments = [{'source_turn': source_turn, 'part_index': index,
        'part_count': len(parts), 'role': turn['role'], 'content': part,
        'time_anchor': turn['time_anchor']} for index, part in enumerate(parts)]
    need(all(set(part) == FRAGMENT_KEYS and utf16_chars(part) <= FRAGMENT_CHARS
        for part in fragments), 'fragment-shape')
    need(''.join(part['content'] for part in fragments) == text, 'split-loss')
    return fragments


def pack_fragments(fragments):
    chunks, current = [], []
    for fragment in fragments:
        candidate = current + [fragment]
        if current and utf16_chars({'history_chunk': candidate}) > CHUNK_CHARS:
            chunks.append(current)
            current = [fragment]
        else:
            current = candidate
        need(utf16_chars({'history_chunk': current}) <= CHUNK_CHARS,
            'chunk-cannot-fit')
    if current:
        chunks.append(current)
    need([fragment for chunk in chunks for fragment in chunk] == fragments,
        'chunk-loss')
    return chunks


def plan():
    need(digest(SOURCE.read_bytes()) == SOURCE_SHA and
        digest(PREFLIGHT.read_bytes()) == PREFLIGHT_SHA, 'input-drift')
    preflight = json.loads(PREFLIGHT.read_text())
    need(preflight['status'] == 'passed-source-only-no-generation' and
        preflight['conversations'] == 20 and preflight['questions'] == 400,
        'preflight-shape')
    rows = pq.read_table(SOURCE).to_pylist()
    need(len(rows) == 20, 'row-count')
    summaries = []
    total_fragments = total_chunks = total_turns = total_probes = 0
    ability_counts = Counter()
    for row in rows:
        seed = row['conversation_seed']
        key = f"{seed['category']}:{seed['id']}"
        turns = [{field: message[field] for field in ('role', 'content', 'time_anchor')}
            for segment in row['chat'] for message in segment]
        need(turns and all(turn['role'] in {'user', 'assistant'} for turn in turns),
            'turn-roles')
        fragments = [fragment for index, turn in enumerate(turns)
            for fragment in split_turn(turn, index)]
        chunks = pack_fragments(fragments)
        # Reconstruct from the exact packed control input, not just the splitter.
        restored = [''] * len(turns)
        positions = [[] for _ in turns]
        for chunk in chunks:
            for fragment in chunk:
                index = fragment['source_turn']
                need(0 <= index < len(turns), 'fragment-turn-index')
                restored[index] += fragment['content']
                positions[index].append(fragment['part_index'])
                need(fragment['role'] == turns[index]['role'] and
                    fragment['time_anchor'] == turns[index]['time_anchor'],
                    'fragment-identity')
        need(all(restored[index] == turn['content'] and
            positions[index] == list(range(len(positions[index])))
            for index, turn in enumerate(turns)), 'restore-mismatch')
        probes = ast.literal_eval(row['probing_questions'])
        need(isinstance(probes, dict) and set(probes) == ABILITY_KEYS, 'abilities')
        question_bindings = []
        for ability in sorted(probes):
            need(len(probes[ability]) == 2, 'question-quota')
            for ordinal, entry in enumerate(probes[ability]):
                question = entry['question']
                need(isinstance(question, str) and question.strip(), 'question')
                # Both arms bind the same source question and full history.
                identity = digest([key, ability, ordinal, digest(question)])
                question_bindings.append(identity)
                ability_counts[ability] += 1
        need(len(question_bindings) == 20 and len(set(question_bindings)) == 20,
            'question-identities')
        summary = {'conversation_key_hash': digest(key),
            'history_sha256': digest(turns),
            'control_chunk_root_sha256': digest([digest(chunk) for chunk in chunks]),
            'matched_question_identity_root_sha256': digest(question_bindings),
            'turns': len(turns), 'fragments': len(fragments),
            'control_ingestion_chunks_once': len(chunks), 'probe_count': 20,
            'maximum_fragment_utf16_characters': max(map(utf16_chars, fragments)),
            'maximum_chunk_utf16_characters': max(utf16_chars({'history_chunk': chunk})
                for chunk in chunks),
            'control_chunks_contain_probe_or_reference_fields': False,
            'source_identity_available_for_matched_arms': True}
        summaries.append(summary)
        total_turns += len(turns)
        total_fragments += len(fragments)
        total_chunks += len(chunks)
        total_probes += len(question_bindings)
    need(total_turns == 5732 and total_probes == 400 and
        all(count == 40 for count in ability_counts.values()),
        'population-drift')
    return {'schema_version': 'are.g03-beam-shared-ingestion-source-plan/v1',
        'status': 'passed-source-only-not-token-qualified',
        'source_sha256': SOURCE_SHA, 'source_preflight_sha256': PREFLIGHT_SHA,
        'fragment_utf16_character_ceiling': FRAGMENT_CHARS,
        'history_chunk_utf16_character_ceiling': CHUNK_CHARS,
        'conversations': len(rows), 'turns': total_turns, 'probes': total_probes,
        'fragments': total_fragments,
        'control_ingestion_chunks_once_per_conversation': total_chunks,
        'control_ingestion_chunks_if_repeated_per_probe': total_chunks * 20,
        'conversation_summaries': sorted(summaries,
            key=lambda item: item['conversation_key_hash']),
        'ability_counts': dict(sorted(ability_counts.items())),
        'model_calls': 0, 'cohort_selected': False,
        'tokenizer_admission': 'not-tested', 'answer_prompt': 'not-defined',
        'judge': 'not-validated', 'treatment_projection': 'not-defined',
        'claim_ceiling': 'Lossless source partition, shared-control plan, and matched source identities only; no model, 8K wire, scorer, freeze, or superiority',
        'open_questions': ['Can every actual ingestion wire fit 8K with notes carry and a defined output reserve?',
            'Can a prospectively fixed treatment projection and common answer prompt address all ten abilities?',
            'What per-conversation and per-question budgets preserve matched cost reporting?']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    receipt = plan()
    data = (json.dumps(receipt, sort_keys=True, indent=2) + '\n').encode()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as handle:
        handle.write(data)
    print(json.dumps({'status': receipt['status'],
        'conversations': receipt['conversations'], 'turns': receipt['turns'],
        'fragments': receipt['fragments'],
        'control_chunks_once': receipt['control_ingestion_chunks_once_per_conversation'],
        'receipt_sha256': digest(data), 'output': str(args.output)},
        sort_keys=True))


if __name__ == '__main__':
    main()
