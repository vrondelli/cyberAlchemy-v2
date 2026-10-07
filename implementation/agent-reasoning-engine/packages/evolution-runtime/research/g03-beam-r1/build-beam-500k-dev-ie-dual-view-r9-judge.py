#!/usr/bin/env python3
"""Blind all valid sealed r9 BEAM IE answers to GLM-adapted rubric criteria."""

import argparse
import ast
import hashlib
import json
import os
from pathlib import Path

import pyarrow.parquet as pq


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1')
SOURCE = ROOT / 'source/500K-00000-of-00001.parquet'
WIRES = ROOT / 'DUAL-VIEW-R9-ANSWER-WIRES.json'
RUN = ROOT / 'DUAL-VIEW-R9-ANSWER-RUN'
RESULT = RUN / 'RUN-RESULT.json'
PINS = {
    SOURCE: 'af05921c979355038e1761b7cde3d2dd713200dd3071b278de0200f6c7f30122',
    WIRES: 'c2f524089e546e21079b73c21186dd6de598756d2eb1d8a465ac600a550d8336',
}
SEED = 'g03-beam-500k-ie-dual-view-r9-blinding'


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
        raise ValueError('g03-beam-500k-ie-dual-view-r9-judge.' + reason)


def write_new(path, value):
    data = (json.dumps(value, sort_keys=True, ensure_ascii=False,
        indent=2) + '\n').encode()
    path.parent.mkdir(parents=True, exist_ok=True)
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    return sha(data)


def run(answer_result_sha):
    need(all(sha_file(path) == expected for path, expected in PINS.items()) and
        sha_file(RESULT) == answer_result_sha, 'pinned-input-drift')
    wires = json.loads(WIRES.read_text())
    result = json.loads(RESULT.read_text())
    need(wires['schema_version'] ==
        'are.g03-beam-500k-ie-dual-view-r9-answer-wires/v1' and
        wires['evaluator_fields_read'] is False and len(wires['wires']) == 120
        and result['schema_version'] ==
        'are.g03-beam-500k-ie-dual-view-r9-result/v1' and
        result['status'] == 'completed-120-r9-development-answers' and
        result['valid'] == result['attempted'] == 120 and
        result['wire_sha256'] == PINS[WIRES] and
        len(result['rows']) == 120, 'generation-seal')
    answers = {}
    conversation_hashes = {}
    for index, (wire, summary) in enumerate(zip(wires['wires'], result['rows'])):
        ordinal = index + 1
        path = RUN / f'ATTEMPT-{ordinal:03}.json'
        need(sha_file(path) == summary['raw_sha256'] and
            summary['valid'] is True and summary['ordinal'] == ordinal and
            wire['probe_id'] == summary['probe_id'] and
            wire['arm'] == summary['arm'], 'attempt-binding')
        attempt = json.loads(path.read_text())
        answer = attempt['response']['payload']['choices'][0]['message']['content']
        need(attempt['probe_id'] == wire['probe_id'] and
            attempt['arm'] == wire['arm'] and
            attempt['request_sha256'] == wire['request_sha256'] and
            isinstance(answer, str) and answer.strip() and
            sha(answer.encode()) == summary['answer_sha256'],
            'answer-binding')
        key = (wire['probe_id'], wire['arm'])
        need(key not in answers, 'duplicate-answer')
        answers[key] = answer
        conversation_hashes[wire['probe_id']] = wire['conversation_key_sha256']
    need(len(answers) == 120 and len(conversation_hashes) == 60,
        'answer-population')
    rubrics = {}
    # Read only the 500K development evaluator file, after 120 answers seal.
    for row in pq.read_table(SOURCE, columns=['conversation_seed',
            'probing_questions']).to_pylist():
        seed = row['conversation_seed']
        key = f"{seed['category']}:{seed['id']}"
        key_hash = digest(key)
        entries = ast.literal_eval(row['probing_questions'])['information_extraction']
        need(len(entries) == 2, 'ie-quota')
        for ordinal, entry in enumerate(entries):
            probe_id = digest([key, 'information_extraction', ordinal,
                digest(entry['question'])])[:24]
            if probe_id not in conversation_hashes:
                continue
            criterion = entry['rubric']
            need(probe_id not in rubrics and
                conversation_hashes[probe_id] == key_hash and
                isinstance(criterion, list) and criterion and
                all(isinstance(item, str) and item.strip()
                    for item in criterion), 'rubric-binding')
            rubrics[probe_id] = criterion
    need(set(rubrics) == set(conversation_hashes), 'complete-rubrics')
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
    need(len(judge_wires) == len(arm_map) ==
        2 * sum(map(len, rubrics.values())) and
        len({row['blind_id'] for row in judge_wires}) == len(judge_wires),
        'judge-wire-count')
    packet = {'schema_version':
        'are.g03-beam-500k-ie-dual-view-r9-judge-wires/v1',
        'status': 'blinded-full-development-not-model-scored',
        'source_commit': 'b2da22eac88bb0874c64665f13457eb99835774a',
        'judge_variant': 'official-content-whitespace-normalized-glm',
        'source_sha256': PINS[SOURCE],
        'answer_wires_sha256': PINS[WIRES],
        'answer_result_sha256': answer_result_sha,
        'development_pairs': 60, 'reserved_conversations': 16,
        'rubric_items': sum(map(len, rubrics.values())),
        'judge_wires': len(judge_wires),
        'maximum_generation_calls': 2 * len(judge_wires),
        'automatic_retries': 0, 'question_emitted_to_judge': False,
        'heldout_evaluator_values_accessed_in_code': False,
        'wires': judge_wires,
        'claim_ceiling': 'GLM-adapted rubric evaluation on 60 exposed 500K IE development pairs only; no native BEAM score, holdout or superiority',
        'open_questions': ['Are all blind judge requests 8K-admissible and stable across reversed-order passes?',
            'Does the paired development score support an independent confirmation campaign?']}
    return packet, arm_map


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--answer-result-sha256', required=True)
    parser.add_argument('--wires', type=Path, required=True)
    parser.add_argument('--map', type=Path, required=True)
    args = parser.parse_args()
    need(len(args.answer_result_sha256) == 64 and
        all(char in '0123456789abcdef' for char in args.answer_result_sha256)
        and args.wires != args.map and not args.wires.exists() and
        not args.map.exists(), 'fresh-output-arguments')
    packet, mapping = run(args.answer_result_sha256)
    wire_sha = write_new(args.wires, packet)
    map_sha = write_new(args.map, {
        'schema_version': 'are.g03-beam-500k-ie-dual-view-r9-judge-map/v1',
        'status': 'private-evaluator-only-arm-map',
        'judge_wire_sha256': wire_sha, 'rows': mapping})
    print(json.dumps({'status': packet['status'],
        'rubric_items': packet['rubric_items'],
        'judge_wires': packet['judge_wires'],
        'maximum_generation_calls': packet['maximum_generation_calls'],
        'wire_sha256': wire_sha, 'map_sha256': map_sha}, sort_keys=True))


if __name__ == '__main__':
    main()
