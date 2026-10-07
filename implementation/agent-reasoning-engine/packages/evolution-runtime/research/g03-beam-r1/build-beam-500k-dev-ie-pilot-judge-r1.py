#!/usr/bin/env python3
"""Blind sealed 500K IE development answers for GLM-adapted rubric judging."""

import argparse
import ast
import hashlib
import json
import os
from pathlib import Path

import pyarrow.parquet as pq


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1')
SOURCE = ROOT / 'source/500K-00000-of-00001.parquet'
SAMPLE = ROOT / 'IE-ANSWER-PILOT-SAMPLE-r1.json'
WIRES = ROOT / 'IE-ANSWER-PILOT-WIRES-r1.json'
RUN = ROOT / 'IE-ANSWER-PILOT-RUN-r1'
RESULT = RUN / 'RUN-RESULT.json'
PINS = {
    SOURCE: 'af05921c979355038e1761b7cde3d2dd713200dd3071b278de0200f6c7f30122',
    SAMPLE: 'cfd359ed56f54bc0ad6fb7945637db9b82ac6b6b06128d358c996ac717a7a4e8',
    WIRES: 'a39f3b21ef88373344cb13ae3721e9f61593e573f2abfdd0d5c3936ae594a272',
    RESULT: '6f6bac5724fc66680a49a4e95593ccc53f7810921942b4ac4a6355dc5eaa7711',
}
SEED = 'g03-beam-500k-ie-answer-pilot-blinding-r1'


def sha(value):
    return hashlib.sha256(value).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False,
        separators=(',', ':')).encode()


def digest(value):
    return sha(canonical(value))


def sha_file(path):
    hashed = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            hashed.update(block)
    return hashed.hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-500k-ie-pilot-judge.' + reason)


def write_new(path, value):
    data = (json.dumps(value, sort_keys=True, ensure_ascii=False,
        indent=2) + '\n').encode()
    path.parent.mkdir(parents=True, exist_ok=True)
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    return sha(data)


def run():
    need(all(sha_file(path) == expected for path, expected in PINS.items()),
        'pinned-input-drift')
    sample = json.loads(SAMPLE.read_text())
    wires = json.loads(WIRES.read_text())
    result = json.loads(RESULT.read_text())
    need(sample['status'] == 'source-only-score-blind-development-sample' and
        len(sample['sample']) == 12 and len(wires['wires']) == 24 and
        wires['evaluator_fields_read'] is False and
        result['status'] == 'completed-24-development-answers' and
        result['valid'] == result['attempted'] == 24 and
        result['wire_sha256'] == PINS[WIRES] and
        len(result['rows']) == 24, 'generation-seal')
    sample_by_id = {item['probe_id']: item for item in sample['sample']}
    need(len(sample_by_id) == 12, 'sample-uniqueness')
    answers = {}
    for index, (wire, summary) in enumerate(zip(wires['wires'], result['rows'])):
        ordinal = index + 1
        path = RUN / f'ATTEMPT-{ordinal:02}.json'
        need(sha_file(path) == summary['raw_sha256'] and
            summary['valid'] is True and summary['ordinal'] == ordinal and
            wire['probe_id'] == summary['probe_id'] and
            wire['arm'] == summary['arm'],
            'attempt-binding')
        attempt = json.loads(path.read_text())
        answer = attempt['response']['payload']['choices'][0]['message']['content']
        need(attempt['probe_id'] == wire['probe_id'] and
            attempt['arm'] == wire['arm'] and
            attempt['request_sha256'] == wire['request_sha256'] and
            isinstance(answer, str) and
            answer.strip() and sha(answer.encode()) == summary['answer_sha256'],
            'answer-binding')
        key = (wire['probe_id'], wire['arm'])
        need(key not in answers, 'duplicate-answer')
        answers[key] = answer
    need(len(answers) == 24, 'answer-count')
    rubrics = {}
    # Evaluator fields are parsed only for the 12 already generated,
    # development-only conversations. The reserved 100K file is never opened.
    rows = pq.read_table(SOURCE, columns=['conversation_seed',
        'probing_questions']).to_pylist()
    for row in rows:
        seed = row['conversation_seed']
        key = f"{seed['category']}:{seed['id']}"
        key_hash = digest(key)
        if key_hash not in {item['conversation_key_hash'] for item in sample['sample']}:
            continue
        entries = ast.literal_eval(row['probing_questions'])['information_extraction']
        need(len(entries) == 2, 'question-quota')
        for ordinal, entry in enumerate(entries):
            probe_id = digest([key, 'information_extraction', ordinal,
                digest(entry['question'])])[:24]
            if probe_id not in sample_by_id:
                continue
            need(probe_id not in rubrics and
                sample_by_id[probe_id]['conversation_key_hash'] == key_hash and
                isinstance(entry['rubric'], list) and entry['rubric'] and
                all(isinstance(item, str) and item.strip()
                    for item in entry['rubric']), 'rubric-binding')
            rubrics[probe_id] = entry['rubric']
    need(set(rubrics) == set(sample_by_id) and
        sum(map(len, rubrics.values())) == 22, 'rubric-count')
    judge_wires, arm_map = [], []
    for probe_id in sorted(rubrics):
        rubric = rubrics[probe_id]
        for arm in ('treatment', 'control'):
            answer = answers[(probe_id, arm)]
            for item_index, criterion in enumerate(rubric):
                blind_id = digest([SEED, probe_id, arm, item_index])[:24]
                judge_wires.append({'blind_id': blind_id,
                    'rubric_item': criterion, 'answer': answer,
                    'answer_sha256': sha(answer.encode()),
                    'rubric_item_sha256': sha(criterion.encode())})
                arm_map.append({'blind_id': blind_id, 'probe_id': probe_id,
                    'arm': arm, 'rubric_item_index': item_index,
                    'rubric_item_count': len(rubric)})
    judge_wires.sort(key=lambda row: row['blind_id'])
    arm_map.sort(key=lambda row: row['blind_id'])
    need(len(judge_wires) == len(arm_map) == 44 and
        len({row['blind_id'] for row in judge_wires}) == 44,
        'judge-wire-count')
    wire_packet = {'schema_version': 'are.g03-beam-500k-ie-pilot-judge-wires-r1/v1',
        'status': 'blinded-exposed-development-not-model-scored',
        'source_commit': 'b2da22eac88bb0874c64665f13457eb99835774a',
        'judge_variant': 'official-content-whitespace-normalized-glm',
        'source_sha256': PINS[SOURCE], 'sample_sha256': PINS[SAMPLE],
        'answer_wires_sha256': PINS[WIRES], 'answer_result_sha256': PINS[RESULT],
        'development_pairs': 12, 'reserved_conversations': 16,
        'rubric_items': 22, 'judge_wires': 44,
        'maximum_generation_calls': 88, 'automatic_retries': 0,
        'question_emitted_to_judge': False,
        'heldout_evaluator_values_accessed_in_code': False,
        'wires': judge_wires,
        'claim_ceiling': 'GLM-adapted rubric evaluation on 12 exposed development pairs only; no native BEAM score, holdout, or superiority'}
    return wire_packet, arm_map


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--wires', type=Path, required=True)
    parser.add_argument('--map', type=Path, required=True)
    args = parser.parse_args()
    need(args.wires != args.map and not args.wires.exists() and
        not args.map.exists(), 'fresh-outputs-required')
    packet, rows = run()
    wire_sha = write_new(args.wires, packet)
    map_sha = write_new(args.map, {'schema_version':
        'are.g03-beam-500k-ie-pilot-judge-map-r1/v1',
        'status': 'private-evaluator-only-arm-map',
        'judge_wire_sha256': wire_sha, 'rows': rows})
    print(json.dumps({'status': packet['status'], 'judge_wires': 44,
        'maximum_generation_calls': 88, 'wire_sha256': wire_sha,
        'map_sha256': map_sha}, sort_keys=True))


if __name__ == '__main__':
    main()
