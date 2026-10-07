#!/usr/bin/env python3
"""Blind r9 discordant answers with full native cited turns for r11."""

import argparse
import hashlib
import json
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1')
REVIEW = ROOT / 'DUAL-VIEW-R9-DISCORDANT-REVIEW-PACKET.json'
SOURCE = ROOT / 'DUAL-VIEW-R9-DISCORDANT-SOURCE-REVIEW.json'
REVIEW_SHA = 'c5ff8ee5a00a99c41cfa82edf7076210854a1938e9b5516aa587f0af72df94cb'
SOURCE_SHA = 'bc2b2d7e06ebfc6862105bebf2d7711770552ed16020d11540cf2a6f8b4a611f'
SEED = 'g03-beam-500k-r11-source-grounded-blinding'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def digest(value):
    return sha(json.dumps(value, sort_keys=True, ensure_ascii=False,
                          separators=(',', ':')).encode())


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-r11-source-wires.' + reason)


def write_new(path, value):
    data = (json.dumps(value, sort_keys=True, ensure_ascii=False,
                       indent=2) + '\n').encode()
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('xb') as stream:
        stream.write(data)
    return sha(data)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--wires', type=Path, required=True)
    parser.add_argument('--map', type=Path, required=True)
    args = parser.parse_args()
    need(args.wires != args.map and not args.wires.exists() and
         not args.map.exists() and sha(REVIEW.read_bytes()) == REVIEW_SHA and
         sha(SOURCE.read_bytes()) == SOURCE_SHA, 'input-drift')
    review = json.loads(REVIEW.read_text())
    source = {row['probe_id']: row for row in
              json.loads(SOURCE.read_text())['cases']}
    need(len(review['cases']) == len(source) == 19, 'population')
    wires, mapping = [], []
    max_source_chars = 0
    for case in review['cases']:
        probe = case['probe_id']
        native = source[probe]
        question, reference = case['question'], native['reference_answer']
        turns = native['cited_turns']
        need(isinstance(question, str) and question.strip() and
             isinstance(reference, str) and reference.strip() and
             len(turns) == len(native['source_chat_ids']) and
             [turn['id'] for turn in turns] == native['source_chat_ids'] and
             all(turn['role'] in ('user', 'assistant') and
                 isinstance(turn['content'], str) and turn['content'].strip()
                 for turn in turns), 'source-binding')
        source_view = [{'source_turn': turn['id'], 'role': turn['role'],
                        'content': turn['content']}
                       for turn in turns]
        max_source_chars = max(max_source_chars,
                               sum(len(turn['content']) for turn in turns))
        for arm in ('control', 'treatment'):
            answer = case['arms'][arm]['final_answer']
            blind_id = digest([SEED, probe, arm])[:24]
            wires.append({'blind_id': blind_id, 'question': question,
                          'reference_answer': reference,
                          'cited_turns': source_view,
                          'answer': answer,
                          'question_sha256': sha(question.encode()),
                          'reference_sha256': sha(reference.encode()),
                          'cited_turns_sha256': digest(source_view),
                          'answer_sha256': sha(answer.encode())})
            mapping.append({'blind_id': blind_id, 'probe_id': probe,
                            'arm': arm})
    wires.sort(key=lambda row: row['blind_id'])
    mapping.sort(key=lambda row: row['blind_id'])
    need(len(wires) == len(mapping) == 38 and
         len({row['blind_id'] for row in wires}) == 38,
         'blind-completeness')
    wire_sha = write_new(args.wires, {
        'schema_version': 'are.g03-beam-500k-r11-source-grounded-wires/v1',
        'status': 'blind-exposed-development-before-judge',
        'review_sha256': REVIEW_SHA, 'source_review_sha256': SOURCE_SHA,
        'question_pairs': 19, 'blind_wires': 38,
        'maximum_judge_calls': 76,
        'max_cited_source_content_chars': max_source_chars,
        'cited_turns_truncated': False,
        'reserved_100k_values_accessed': False,
        'wires': wires,
        'claim_ceiling': 'Exposed source-grounded scorer calibration only; no independent BEAM score',
        'open_questions': ['Will all exact cited-source prompts fit 8K?',
                           'Will the fixed scorer sentinels pass?'],
    })
    map_sha = write_new(args.map, {
        'schema_version': 'are.g03-beam-500k-r11-source-grounded-map/v1',
        'status': 'private-arm-map', 'wire_sha256': wire_sha,
        'rows': mapping,
    })
    print(json.dumps({'blind_wires': 38, 'judge_calls_max': 76,
                      'max_cited_source_content_chars': max_source_chars,
                      'wire_sha256': wire_sha, 'map_sha256': map_sha},
                     sort_keys=True))


if __name__ == '__main__':
    main()
