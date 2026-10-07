#!/usr/bin/env python3
"""Pair sealed BEAM development final answers with evaluator-only references."""

import argparse
import ast
import hashlib
import json
from pathlib import Path

import pyarrow.compute as pc
import pyarrow.dataset as ds
import pyarrow.parquet as pq


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002')
RUN = Path('/home/vlad_/are-benchmark-archive/g03-beam-dev-event-run-r1-20261002')
PARQUET = ROOT / '100K-00000-of-00001.parquet'
PARQUET_SHA = 'c0519be25907005ba873c927c50877471d550873039d96c041554d0075a78ace'
SPLIT = ROOT / 'DEV-SPLIT.json'
SPLIT_SHA = '3761dc9b64bdf453a55efa040e0b52d2096d68356d174ee3d141d764259f716e'
WIRE = ROOT / 'DEV-EVENT-WIRES-r1.json'
WIRE_SHA = '2314e2691f61aee795e3e45ef60ae420a75a00c43f636449b942a23dc4c55a6a'
FREEZE = RUN / 'FREEZE.json'
FREEZE_SHA = '344b49bedab95f2173e46512b8d590fbb142c8e0e1604420103bcd96540c4fab'
RESULT = RUN / 'RUN-RESULT.json'
RESULT_SHA = '125770dbffe18cb16bf9822da995daf48225ee3b5a38a64e4283a94963c77c94'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False,
        separators=(',', ':')).encode()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-dev-answer-review.' + reason)


def run():
    paths = [(PARQUET, PARQUET_SHA), (SPLIT, SPLIT_SHA),
        (WIRE, WIRE_SHA), (FREEZE, FREEZE_SHA), (RESULT, RESULT_SHA)]
    need(all(sha(path.read_bytes()) == expected for path, expected in paths),
        'input-drift')
    split = json.loads(SPLIT.read_text())
    wires = json.loads(WIRE.read_text())
    freeze = json.loads(FREEZE.read_text())
    result = json.loads(RESULT.read_text())
    dev = set(split['development_conversation_keys'])
    need(len(dev) == 4 and len(split['heldout_conversation_keys']) == 16
        and not dev.intersection(split['heldout_conversation_keys']),
        'split-boundary')
    need(wires['evaluator_fields_read'] is False and
        freeze['evaluator_fields_read'] is False and
        result['evaluator_fields_read'] is False and
        result['status'] == 'completed-eight-development-answers' and
        result['valid'] == result['attempted'] == 8 and
        result['freeze_sha256'] == FREEZE_SHA and
        result['wire_sha256'] == WIRE_SHA, 'response-seal')
    need(freeze['ordered_probe_ids'] == [row['probe_id']
        for row in wires['wires']], 'wire-order')
    answers = {}
    for index, row in enumerate(result['rows'], 1):
        path = RUN / f'ATTEMPT-{index:02d}.json'
        raw_bytes = path.read_bytes()
        need(sha(raw_bytes) == row['raw_sha256'] and row['valid'],
            'raw-response-binding')
        raw = json.loads(raw_bytes)
        need(raw['ordinal'] == index and raw['probe_id'] == row['probe_id']
            and raw['response']['status'] == 200, 'raw-response-order')
        # Export only final visible content. reasoning_content and all other
        # provider fields stay in the retained private raw attempt receipt.
        answer = raw['response']['payload']['choices'][0]['message']['content']
        need(isinstance(answer, str) and answer.strip() and
            sha(answer.encode()) == row['answer_sha256'], 'answer-seal')
        answers[row['probe_id']] = answer
    need(len(answers) == 8, 'answer-count')

    metadata = pq.read_table(PARQUET, columns=['conversation_id',
        'conversation_seed']).to_pylist()
    keys_by_id = {row['conversation_id']:
        f"{row['conversation_seed']['category']}:{row['conversation_seed']['id']}"
        for row in metadata}
    dev_ids = [item for item, key in keys_by_id.items() if key in dev]
    need(len(dev_ids) == 4 and len(keys_by_id) == 20,
        'metadata-selection')
    # Materialize evaluator-valued data from sealed development rows only.
    rows = ds.dataset(PARQUET, format='parquet').to_table(
        columns=['conversation_id', 'probing_questions'],
        filter=pc.field('conversation_id').isin(dev_ids)).to_pylist()
    need(len(rows) == 4 and all(keys_by_id[row['conversation_id']] in dev
        for row in rows), 'filtered-development')
    cases = []
    for row in rows:
        key = keys_by_id[row['conversation_id']]
        entries = ast.literal_eval(row['probing_questions'])['event_ordering']
        need(len(entries) == 2, 'event-quota')
        for ordinal, entry in enumerate(entries):
            question_sha = sha(canonical(entry['question']))
            probe_id = sha(canonical([key, 'event_ordering', ordinal,
                question_sha]))[:24]
            answer = answers.get(probe_id)
            need(answer is not None and isinstance(entry['answer'], str)
                and isinstance(entry['ordering_tested'], list)
                and isinstance(entry['rubric'], list), 'case-binding')
            cases.append({'probe_id': probe_id, 'question': entry['question'],
                'model_answer': answer, 'reference_answer': entry['answer'],
                'reference_ordered_items': entry['ordering_tested'],
                'rubric': entry['rubric'],
                'requested_items': len(entry['ordering_tested'])})
    need(len(cases) == 8 and len({case['probe_id'] for case in cases}) == 8,
        'case-count')
    return {'schema_version': 'are.g03-beam-dev-answer-review-packet/v1',
        'status': 'development-review-packet-not-scored',
        'parquet_sha256': PARQUET_SHA, 'split_sha256': SPLIT_SHA,
        'wire_sha256': WIRE_SHA, 'freeze_sha256': FREEZE_SHA,
        'run_result_sha256': RESULT_SHA,
        'development_conversations': 4, 'heldout_conversations': 16,
        'cases': sorted(cases, key=lambda case: case['probe_id']),
        'reasoning_content_exported': False,
        'heldout_evaluator_values_accessed_in_code': False,
        'native_score': 'not-computed',
        'claim_ceiling': 'Exposed development final-answer review only; uncalibrated rubric, output-budget violation, no independent holdout or superiority',
        'open_questions': ['What blinded scoring rule reliably handles paraphrased ordered items?',
            'Can a corrected max_tokens/reasoning_effort protocol bound cost while preserving answer quality?',
            'Will a separately frozen paired holdout pass quality and cost gates?']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    packet = run()
    data = json.dumps(packet, sort_keys=True, indent=2).encode() + b'\n'
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as handle:
        handle.write(data)
    print(json.dumps({'status': packet['status'], 'cases': len(packet['cases']),
        'packet_sha256': sha(data), 'output': str(args.output)}, sort_keys=True))


if __name__ == '__main__':
    main()
