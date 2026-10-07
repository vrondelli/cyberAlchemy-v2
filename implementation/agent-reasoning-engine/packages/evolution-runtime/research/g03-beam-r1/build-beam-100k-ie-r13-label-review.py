#!/usr/bin/env python3
"""Stage answer-blind native-reference and full-history review for 32 IE cases."""

import argparse
import ast
import hashlib
import json
import os
from pathlib import Path

import pyarrow.parquet as pq


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-100k-ie-r13')
SOURCE = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002/100K-00000-of-00001.parquet')
SOURCE_ONLY = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002/SOURCE-ONLY.jsonl')
SPLIT = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002/DEV-SPLIT.json')
SELECTIONS = ROOT / 'SELECTIONS.json'
PINS = {
    SOURCE: 'c0519be25907005ba873c927c50877471d550873039d96c041554d0075a78ace',
    SOURCE_ONLY: 'bfae354f876ccb0d5b95aebad51cfa734ce82e7c4c8102beeb5a9bd0476bc26d',
    SPLIT: '3761dc9b64bdf453a55efa040e0b52d2096d68356d174ee3d141d764259f716e',
    SELECTIONS: '82a1fc4f3f422033885c56eb0121a6d188a2d65cd6b1bc0bcfda48bec9cfcd73',
}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def digest(value):
    return sha(json.dumps(value, sort_keys=True, ensure_ascii=False,
               separators=(',', ':')).encode())


def file_sha(path):
    hashed = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            hashed.update(block)
    return hashed.hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError('g03-beam-100k-ie-r13-label-review.' + reason)


def write_new(path, value):
    data = (json.dumps(value, sort_keys=True, indent=2,
                       ensure_ascii=False) + '\n').encode()
    with os.fdopen(os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL,
                           0o600), 'wb') as stream:
        stream.write(data)
    return sha(data)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-root', type=Path, required=True)
    args = parser.parse_args()
    need(args.output_root == ROOT and all(file_sha(path) == digest_
         for path, digest_ in PINS.items()) and
         not (ROOT / 'LABEL-REVIEW-INPUT.json').exists() and
         not (ROOT / 'LABEL-REVIEW-HISTORIES.json').exists() and
         not (ROOT / 'LABEL-REVIEW-MANIFEST.json').exists(),
         'output-or-input-drift')
    split = json.loads(SPLIT.read_text())
    sealed = json.loads(SELECTIONS.read_text())
    need(sealed['status'] == 'sealed-source-only-before-evaluator-or-glm'
         and len(sealed['selections']) == 32, 'sealed-selection')
    by_probe = {row['probe_id']: row for row in sealed['selections']}
    source_rows = {row['conversation_key']: row for row in
        (json.loads(line) for line in SOURCE_ONLY.read_text().splitlines())}
    heldout = set(split['heldout_conversation_keys'])
    need(len(heldout) == 16, 'heldout-count')
    cases = []
    histories = {}
    for row in pq.read_table(SOURCE, columns=['conversation_seed', 'chat',
                                             'probing_questions']).to_pylist():
        seed = row['conversation_seed']
        key = f"{seed['category']}:{seed['id']}"
        if key not in heldout:
            continue
        source_row = source_rows[key]
        flattened = [turn for session in row['chat'] for turn in session]
        need(len(flattened) == len(source_row['turns']) and
             [turn['id'] for turn in flattened] ==
             list(range(len(flattened))), 'history-order')
        for index, turn in enumerate(flattened):
            source_turn = source_row['turns'][index]
            need(all(turn[field] == source_turn[field] for field in
                 ('role', 'content', 'time_anchor')), 'source-history-binding')
        histories[key] = {'conversation_key': key,
            'turns': [{'id': index, **turn} for index, turn in
                      enumerate(source_row['turns'])]}
        entries = ast.literal_eval(row['probing_questions'])[
            'information_extraction']
        need(len(entries) == 2, 'ie-quota')
        for ordinal, entry in enumerate(entries):
            probe_id = digest([key, 'information_extraction', ordinal,
                               digest(entry['question'])])[:24]
            need(probe_id in by_probe and
                 by_probe[probe_id]['question_sha256'] ==
                 digest(entry['question']) and
                 isinstance(entry['answer'], str) and
                 entry['answer'].strip() and
                 isinstance(entry['source_chat_ids'], list) and
                 entry['source_chat_ids'] and
                 all(type(value) is int and 0 <= value < len(flattened)
                     for value in entry['source_chat_ids']),
                 'native-reference-binding')
            cited = [{'id': turn_id, **source_row['turns'][turn_id]}
                     for turn_id in entry['source_chat_ids']]
            cases.append({'probe_id': probe_id, 'conversation_key': key,
                'question': entry['question'],
                'native_reference_answer': entry['answer'],
                'source_chat_ids': entry['source_chat_ids'],
                'cited_turns': cited,
                'full_history_sha256': digest(histories[key]),
                'full_history_turns': len(flattened)})
    need(len(histories) == 16 and len(cases) == 32 and
         {row['probe_id'] for row in cases} == set(by_probe),
         'review-completeness')
    histories_packet = {
        'schema_version': 'are.g03-beam-100k-ie-r13-label-histories/v1',
        'status': 'private-answer-blind-full-histories',
        'source_only_sha256': PINS[SOURCE_ONLY],
        'histories': [histories[key] for key in sorted(histories)],
        'arm_answers_read': False, 'scorer_outputs_read': False}
    histories_sha = write_new(ROOT / 'LABEL-REVIEW-HISTORIES.json',
                              histories_packet)
    review_packet = {
        'schema_version': 'are.g03-beam-100k-ie-r13-label-review-input/v1',
        'status': 'private-answer-blind-review-pending',
        'source_sha256': PINS[SOURCE],
        'source_only_sha256': PINS[SOURCE_ONLY],
        'split_sha256': PINS[SPLIT],
        'selection_sha256': PINS[SELECTIONS],
        'histories_sha256': histories_sha,
        'cases': sorted(cases, key=lambda row: row['probe_id']),
        'reviewers': ['Vlad', 'Dave'],
        'allowed_dispositions': ['supported-current', 'conflicted',
                                 'ambiguous'],
        'arm_answers_read': False, 'scorer_outputs_read': False,
        'claim_ceiling': 'Answer-blind reference review input only; no adjudicated label, score, or superiority',
        'open_questions': ['Do both reviewers find at least 28 supported-current references?',
                           'Which cases have later explicit updates or other conflicts?']}
    review_sha = write_new(ROOT / 'LABEL-REVIEW-INPUT.json', review_packet)
    manifest = {
        'schema_version': 'are.g03-beam-100k-ie-r13-label-review-manifest/v1',
        'status': 'answer-blind-review-pending',
        'native_source_sha256': PINS[SOURCE],
        'review_input_sha256': review_sha,
        'full_histories_sha256': histories_sha,
        'cases': len(cases), 'histories': len(histories),
        'arm_answers_read': False, 'scorer_outputs_read': False,
        'claim_ceiling': 'Review staging only; no validated labels, score, or superiority',
        'open_questions': ['Vlad/Dave dispositions are not yet recorded.']}
    manifest_sha = write_new(ROOT / 'LABEL-REVIEW-MANIFEST.json', manifest)
    print(json.dumps({'status': manifest['status'], 'cases': len(cases),
        'histories': len(histories), 'review_input_sha256': review_sha,
        'histories_sha256': histories_sha,
        'manifest_sha256': manifest_sha}, sort_keys=True))


if __name__ == '__main__':
    main()
