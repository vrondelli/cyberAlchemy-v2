#!/usr/bin/env python3
"""Pair four sealed factoid final answers with exposed development references."""

import argparse
import ast
import hashlib
import json
from pathlib import Path

import pyarrow.compute as pc
import pyarrow.dataset as ds
import pyarrow.parquet as pq


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002')
RUN = Path('/home/vlad_/are-benchmark-archive/g03-beam-dev-factoid-run-r1-20261002')
PARQUET = ROOT / '100K-00000-of-00001.parquet'
SPLIT = ROOT / 'DEV-SPLIT.json'
WIRE = ROOT / 'DEV-FACTOID-WIRES-r1.json'
FREEZE = RUN / 'FREEZE.json'
RESULT = RUN / 'RUN-RESULT.json'
PINS = {
    PARQUET: 'c0519be25907005ba873c927c50877471d550873039d96c041554d0075a78ace',
    SPLIT: '3761dc9b64bdf453a55efa040e0b52d2096d68356d174ee3d141d764259f716e',
    WIRE: '5d667fc5a53cba25a735077fc326a5f53ae7b7c4d71b7852f9c6cb4c635a654e',
    FREEZE: '533f7ccab42cd57beb248f52c9d529ec27a2484b20a2bd3a39805deff3a84ed4',
    RESULT: 'f5d568e4aa32229533733ad3e5a27adc5a1ddb2373057d18de2a01537a5d5618',
}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False,
                      separators=(',', ':')).encode()


def need(condition, reason):
    if not condition:
        raise ValueError('g03-beam-dev-factoid-review.' + reason)


def run():
    need(all(sha(path.read_bytes()) == expected for path, expected in PINS.items()),
         'input-drift')
    split = json.loads(SPLIT.read_text())
    wire = json.loads(WIRE.read_text())
    freeze = json.loads(FREEZE.read_text())
    result = json.loads(RESULT.read_text())
    dev = set(split['development_conversation_keys'])
    need(len(dev) == 4 and len(split['heldout_conversation_keys']) == 16 and
         not dev.intersection(split['heldout_conversation_keys']) and
         wire['evaluator_fields_read'] is False and
         freeze['evaluator_fields_read'] is False and
         result['evaluator_fields_read'] is False and
         result['status'] == 'completed-four-development-answers' and
         result['attempted'] == result['valid'] == 4 and
         result['freeze_sha256'] == PINS[FREEZE] and
         result['wire_sha256'] == PINS[WIRE], 'run-boundary')
    need(freeze['ordered_probe_ids'] == [row['probe_id'] for row in wire['wires']],
         'wire-order')
    answers = {}
    for index, row in enumerate(result['rows'], 1):
        path = RUN / f'ATTEMPT-{index:02d}.json'
        raw_data = path.read_bytes()
        raw = json.loads(raw_data)
        answer = raw['response']['payload']['choices'][0]['message']['content']
        need(row['valid'] and row['raw_sha256'] == sha(raw_data) and
             row['answer_sha256'] == sha(answer.encode()) and
             raw['probe_id'] == row['probe_id'] and
             raw['response']['status'] == 200 and
             isinstance(answer, str) and answer.strip(), 'raw-binding')
        answers[row['probe_id']] = answer
    need(len(answers) == 4, 'answer-count')
    metadata = pq.read_table(PARQUET, columns=['conversation_id',
                             'conversation_seed']).to_pylist()
    ids = {row['conversation_id']: f"{row['conversation_seed']['category']}:"
           f"{row['conversation_seed']['id']}" for row in metadata}
    dev_ids = [row_id for row_id, key in ids.items() if key in dev]
    need(len(ids) == 20 and len(dev_ids) == 4, 'metadata-count')
    rows = ds.dataset(PARQUET, format='parquet').to_table(
        columns=['conversation_id', 'probing_questions'],
        filter=pc.field('conversation_id').isin(dev_ids)).to_pylist()
    need(len(rows) == 4 and all(ids[row['conversation_id']] in dev
         for row in rows), 'filtered-development')
    cases = []
    for row in rows:
        key = ids[row['conversation_id']]
        entries = ast.literal_eval(row['probing_questions'])['information_extraction']
        need(len(entries) == 2, 'ability-quota')
        entry = entries[0]
        probe_id = sha(canonical([key, 'information_extraction', 0,
                        sha(canonical(entry['question']))]))[:24]
        need(probe_id in answers and isinstance(entry['answer'], str) and
             isinstance(entry['source_chat_ids'], list), 'case-binding')
        cases.append({'probe_id': probe_id, 'question': entry['question'],
                      'model_answer': answers[probe_id],
                      'reference_answer': entry['answer'],
                      'source_chat_ids': entry['source_chat_ids']})
    need(len(cases) == 4 and len({case['probe_id'] for case in cases}) == 4,
         'case-count')
    return {'schema_version': 'are.g03-beam-dev-factoid-review-r1/v1',
            'status': 'four-exposed-development-answers-not-native-scored',
            'parquet_sha256': PINS[PARQUET], 'split_sha256': PINS[SPLIT],
            'wire_sha256': PINS[WIRE], 'freeze_sha256': PINS[FREEZE],
            'run_result_sha256': PINS[RESULT],
            'cases': sorted(cases, key=lambda row: row['probe_id']),
            'reasoning_content_exported': False,
            'heldout_evaluator_values_accessed_in_code': False,
            'claim_ceiling': 'Four exposed first-position information-extraction questions only; unblinded final-answer review, no native scorer, holdout, or superiority',
            'open_questions': ['Can a predeclared factoid rubric score all 20 first-position questions fairly?',
                               'Would a matched control show lower quality or higher cost on a fresh cohort?']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    packet = run()
    data = json.dumps(packet, sort_keys=True, indent=2).encode() + b'\n'
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as handle:
        handle.write(data)
    print(json.dumps({'cases': len(packet['cases']),
                      'packet_sha256': sha(data), 'output': str(args.output)},
                     sort_keys=True))


if __name__ == '__main__':
    main()
