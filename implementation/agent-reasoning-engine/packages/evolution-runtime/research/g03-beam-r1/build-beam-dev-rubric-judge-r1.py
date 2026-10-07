#!/usr/bin/env python3
"""Seal blinded rubric-item judge inputs from four exposed BEAM dev pairs."""

import argparse
import ast
import hashlib
import json
import os
from pathlib import Path

import pyarrow.parquet as parquet


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002')
INPUTS = {
    'split': (ROOT / 'DEV-SPLIT.json',
              '3761dc9b64bdf453a55efa040e0b52d2096d68356d174ee3d141d764259f716e'),
    'pairs': (ROOT / 'DEV-FACTOID-PAIRED-REVIEW-r1.json',
              '7a14d31d404a08320372261b5ea31c9fe1bfc58d3a71d1420693ab6d28fd1a28'),
    'source': (ROOT / 'SOURCE-ONLY.jsonl',
               'bfae354f876ccb0d5b95aebad51cfa734ce82e7c4c8102beeb5a9bd0476bc26d'),
    'parquet': (ROOT / '100K-00000-of-00001.parquet',
                'c0519be25907005ba873c927c50877471d550873039d96c041554d0075a78ace'),
}
SEED = 'g03-beam-exposed-rubric-judge-blinding-r1'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canon(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False,
                      separators=(',', ':')).encode()


def need(condition, reason):
    if not condition:
        raise ValueError('g03-beam-dev-rubric-judge-r1.' + reason)


def write_new(path, value):
    data = (json.dumps(value, sort_keys=True, ensure_ascii=False, indent=2) + '\n').encode()
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    return sha(data)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--wires', type=Path, required=True)
    parser.add_argument('--map', type=Path, required=True)
    args = parser.parse_args()
    need(args.wires != args.map and not args.wires.exists() and
         not args.map.exists(), 'output-exists')
    for name, (path, expected) in INPUTS.items():
        need(path.is_file() and sha(path.read_bytes()) == expected,
             name + '-drift')
    split = json.loads(INPUTS['split'][0].read_text())
    pairs = json.loads(INPUTS['pairs'][0].read_text())
    need(len(split['development_conversation_keys']) == 4 and
         len(split['heldout_conversation_keys']) == 16 and
         len(pairs['cases']) == 4 and
         pairs['heldout_evaluator_values_accessed_in_code'] is False,
         'population-boundary')
    development = set(split['development_conversation_keys'])
    heldout = set(split['heldout_conversation_keys'])
    need(not development & heldout, 'split-overlap')
    source_by_key = {row['conversation_key']: row for line in
                     INPUTS['source'][0].read_text().splitlines()
                     if (row := json.loads(line))['conversation_key'] in development}
    need(set(source_by_key) == development, 'source-development-keys')
    wanted = {case['probe_id']: case for case in pairs['cases']}
    found = {}
    # The parquet file has one row group; parse probing_questions only after
    # checking the conversation key against the sealed development set.
    for row in parquet.read_table(INPUTS['parquet'][0],
                                  columns=['conversation_seed', 'probing_questions']).to_pylist():
        seed = row['conversation_seed']
        key = f"{seed['category']}:{seed['id']}"
        if key not in development:
            continue
        parsed = ast.literal_eval(row['probing_questions'])
        entries = parsed['information_extraction']
        need(len(entries) == 2, 'information-extraction-quota')
        for ordinal, entry in enumerate(entries):
            question = entry['question']
            question_sha = sha(canon(question))
            probe_id = sha(canon([key, 'information_extraction', ordinal,
                                  question_sha]))[:24]
            if probe_id not in wanted:
                continue
            need(probe_id not in found and
                 question == wanted[probe_id]['question'] and
                 question in [probe['question'] for probe in source_by_key[key]['probes']
                              if probe['id'] == probe_id] and
                 isinstance(entry['rubric'], list) and entry['rubric'] and
                 all(isinstance(item, str) and item.strip()
                     for item in entry['rubric']), 'rubric-binding')
            found[probe_id] = (key, entry['rubric'])
    need(set(found) == set(wanted), 'missing-dev-rubric')
    wires, mapping = [], []
    for probe_id in sorted(found):
        key, rubric = found[probe_id]
        case = wanted[probe_id]
        for arm, answer in [('treatment', case['treatment_answer']),
                            ('bm25-control', case['bm25_control_answer'])]:
            need(isinstance(answer, str) and answer.strip(), 'nonempty-answer')
            for item_index, item in enumerate(rubric):
                blind_id = sha(canon([SEED, probe_id, arm, item_index]))[:24]
                wires.append({'blind_id': blind_id, 'rubric_item': item,
                              'answer': answer, 'answer_sha256': sha(answer.encode()),
                              'rubric_item_sha256': sha(item.encode())})
                mapping.append({'blind_id': blind_id, 'probe_id': probe_id,
                                'conversation_key_sha256': sha(key.encode()),
                                'arm': arm, 'rubric_item_index': item_index,
                                'rubric_item_count': len(rubric)})
    need(len({row['blind_id'] for row in wires}) == len(wires) and
         len(wires) == len(mapping), 'blind-id-collision')
    wires.sort(key=lambda row: row['blind_id'])
    mapping.sort(key=lambda row: row['blind_id'])
    wire = {'schema_version': 'are.g03-beam-dev-rubric-judge-wires-r2/v1',
            'status': 'blinded-exposed-development-not-model-scored',
            'source_commit': 'b2da22eac88bb0874c64665f13457eb99835774a',
            'judge_variant': 'official-content-whitespace-normalized-glm',
            'input_sha256': {name: expected for name, (_, expected) in INPUTS.items()},
            'development_pairs': 4, 'reserved_conversations': 16,
            'rubric_items': len(wires) // 2, 'judge_wires': len(wires),
            'maximum_generation_calls': 2 * len(wires), 'automatic_retries': 0,
            'wires': wires, 'question_emitted_to_judge': False,
            'heldout_evaluator_values_accessed_in_code': False,
            'claim_ceiling': 'Exposed development judge calibration only; no native BEAM score or superiority.'}
    mapping_receipt = {'schema_version': 'are.g03-beam-dev-rubric-judge-map-r2/v1',
                       'status': 'private-evaluator-only-arm-map',
                       'wire_sha256': sha((json.dumps(wire, sort_keys=True,
                                                   ensure_ascii=False, indent=2) + '\n').encode()),
                       'rows': mapping}
    args.wires.parent.mkdir(parents=True, exist_ok=True)
    args.map.parent.mkdir(parents=True, exist_ok=True)
    wire_sha = write_new(args.wires, wire)
    map_sha = write_new(args.map, mapping_receipt)
    need(mapping_receipt['wire_sha256'] == wire_sha, 'output-binding')
    print(json.dumps({'pairs': 4, 'rubric_items': wire['rubric_items'],
                      'judge_wires': len(wires), 'wire_sha256': wire_sha,
                      'map_sha256': map_sha}, sort_keys=True))


if __name__ == '__main__':
    main()
