#!/usr/bin/env python3
"""Bind r9 discordant development cases to native references and cited turns."""

import argparse
import ast
import hashlib
import json
from pathlib import Path

import pyarrow.parquet as pq


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1')
SOURCE = ROOT / 'source/500K-00000-of-00001.parquet'
SOURCE_SHA = 'af05921c979355038e1761b7cde3d2dd713200dd3071b278de0200f6c7f30122'
PACKET = ROOT / 'DUAL-VIEW-R9-DISCORDANT-REVIEW-PACKET.json'
PACKET_SHA = 'c5ff8ee5a00a99c41cfa82edf7076210854a1938e9b5516aa587f0af72df94cb'


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


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-r9-source-review.' + reason)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    need(not args.output.exists() and file_sha(SOURCE) == SOURCE_SHA and
         file_sha(PACKET) == PACKET_SHA, 'input-drift')
    review = json.loads(PACKET.read_text())
    needed = {case['probe_id']: case for case in review['cases']}
    need(len(needed) == 19, 'review-population')
    cases = []
    for row in pq.read_table(SOURCE, columns=['conversation_seed', 'chat',
                                              'probing_questions']).to_pylist():
        seed = row['conversation_seed']
        key = f"{seed['category']}:{seed['id']}"
        entries = ast.literal_eval(row['probing_questions'])['information_extraction']
        need(len(entries) == 2, 'ie-quota')
        turns = {turn['id']: turn for session in row['chat'] for turn in session}
        need(len(turns) == sum(map(len, row['chat'])), 'unique-source-ids')
        for index, entry in enumerate(entries):
            probe_id = digest([key, 'information_extraction', index,
                               digest(entry['question'])])[:24]
            if probe_id not in needed:
                continue
            need(entry['question'] == needed[probe_id]['question'] and
                 isinstance(entry['answer'], str) and
                 isinstance(entry['source_chat_ids'], list) and
                 entry['source_chat_ids'] and
                 set(entry['source_chat_ids']) <= set(turns), 'reference-binding')
            cases.append({
                'probe_id': probe_id,
                'reference_answer': entry['answer'],
                'source_chat_ids': entry['source_chat_ids'],
                'cited_turns': [{field: turns[turn_id][field]
                                 for field in ('id', 'role', 'time_anchor', 'content')}
                                for turn_id in entry['source_chat_ids']],
            })
    need(len(cases) == 19 and
         {case['probe_id'] for case in cases} == set(needed), 'case-completeness')
    packet = {
        'schema_version': 'are.g03-beam-500k-ie-r9-discordant-source-review/v1',
        'status': 'private-evaluator-only-source-review-not-adjudicated',
        'source_sha256': SOURCE_SHA,
        'answer_review_packet_sha256': PACKET_SHA,
        'cases': sorted(cases, key=lambda row: row['probe_id']),
        'reserved_conversations_accessed': False,
        'claim_ceiling': 'Exposed development native references and cited turns only; not independent confirmation',
        'open_questions': ['Do native references agree with their cited source turns?',
                           'Which apparent answer-score differences reflect rubric mention credit?'],
    }
    raw = (json.dumps(packet, sort_keys=True, indent=2) + '\n').encode()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as stream:
        stream.write(raw)
    print(json.dumps({'cases': len(cases),
                      'source_review_sha256': sha(raw),
                      'status': packet['status']}, sort_keys=True))


if __name__ == '__main__':
    main()
