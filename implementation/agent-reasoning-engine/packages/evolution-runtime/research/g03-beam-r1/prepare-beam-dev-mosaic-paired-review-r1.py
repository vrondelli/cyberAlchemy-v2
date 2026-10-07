#!/usr/bin/env python3
"""Evaluator-only final-answer packet for four exposed BEAM matched pairs."""

import argparse
import ast
import hashlib
import json
from pathlib import Path

import pyarrow.compute as pc
import pyarrow.dataset as ds
import pyarrow.parquet as pq


SOURCE_ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002')
RUN_ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-dev-mosaic-paired-run-r1-20261002')
PARQUET = SOURCE_ROOT / '100K-00000-of-00001.parquet'
SPLIT = SOURCE_ROOT / 'DEV-SPLIT.json'
WIRES = SOURCE_ROOT / 'DEV-MOSAIC-PAIRED-WIRES-r1.json'
RESULT = RUN_ROOT / 'RUN-RESULT.json'
PINS = {
    PARQUET: 'c0519be25907005ba873c927c50877471d550873039d96c041554d0075a78ace',
    SPLIT: '3761dc9b64bdf453a55efa040e0b52d2096d68356d174ee3d141d764259f716e',
    WIRES: '30e1a92645f1fb254d2505a9bb53cf9a46bc0e38442536323d0222b089c89562',
    RESULT: 'fc8cecfd0955dcdf0d907403fc272d4c66bc73b88d6c9c7f2763b3858a61457d',
}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False,
                      separators=(',', ':')).encode()


def need(condition, reason):
    if not condition:
        raise ValueError('g03-beam-dev-mosaic-paired-review-r1.' + reason)


def run():
    need(all(sha(path.read_bytes()) == expected for path, expected in PINS.items()),
         'input-drift')
    wires = json.loads(WIRES.read_text())
    result = json.loads(RESULT.read_text())
    split = json.loads(SPLIT.read_text())
    dev = set(split['development_conversation_keys'])
    holdout = set(split['heldout_conversation_keys'])
    need(len(dev) == 4 and len(holdout) == 16 and not dev & holdout and
         wires['evaluator_fields_read'] is False and
         result['status'] == 'completed-eight-development-answers' and
         result['wire_sha256'] == PINS[WIRES] and
         result['attempted'] == result['valid'] == 8 and
         result['automatic_retries'] == 0, 'run-boundary')
    answer_by_key = {}
    for index, (wire, receipt) in enumerate(zip(wires['wires'], result['rows']), 1):
        path = RUN_ROOT / f'ATTEMPT-{index:02d}.json'
        raw_bytes = path.read_bytes()
        raw = json.loads(raw_bytes)
        answer = raw['response']['payload']['choices'][0]['message']['content']
        need(receipt['valid'] and receipt['raw_sha256'] == sha(raw_bytes) and
             receipt['answer_sha256'] == sha(answer.encode()) and
             receipt['probe_id'] == wire['probe_id'] == raw['probe_id'] and
             receipt['arm'] == wire['arm'] == raw['arm'] and
             raw['response']['status'] == 200 and
             isinstance(answer, str) and answer.strip(), 'raw-attempt-binding')
        key = (wire['probe_id'], wire['arm'])
        need(key not in answer_by_key, 'duplicate-answer')
        answer_by_key[key] = answer
    need(len(answer_by_key) == 8, 'answer-count')
    metadata = pq.read_table(PARQUET, columns=['conversation_id',
                             'conversation_seed']).to_pylist()
    keys = {row['conversation_id']: f"{row['conversation_seed']['category']}:"
            f"{row['conversation_seed']['id']}" for row in metadata}
    ids = [row_id for row_id, key in keys.items() if key in dev]
    need(len(keys) == 20 and len(ids) == 4, 'metadata-boundary')
    rows = ds.dataset(PARQUET, format='parquet').to_table(
        columns=['conversation_id', 'probing_questions'],
        filter=pc.field('conversation_id').isin(ids)).to_pylist()
    need(len(rows) == 4 and all(keys[row['conversation_id']] in dev
         for row in rows), 'filtered-development')
    cases = []
    for row in rows:
        key = keys[row['conversation_id']]
        entries = ast.literal_eval(row['probing_questions'])['information_extraction']
        need(len(entries) == 2, 'ability-quota')
        entry = entries[1]
        probe_id = sha(canonical([key, 'information_extraction', 1,
                        sha(canonical(entry['question']))]))[:24]
        need((probe_id, 'mosaic') in answer_by_key and
             (probe_id, 'bm25') in answer_by_key and
             isinstance(entry['answer'], str) and entry['answer'].strip(),
             'case-binding')
        cases.append({'probe_id': probe_id, 'conversation_key': key,
                      'question': entry['question'],
                      'reference_answer': entry['answer'],
                      'mosaic_answer': answer_by_key[(probe_id, 'mosaic')],
                      'bm25_answer': answer_by_key[(probe_id, 'bm25')]})
    need(len(cases) == 4 and len({row['probe_id'] for row in cases}) == 4,
         'case-count')
    return {
        'schema_version': 'are.g03-beam-dev-mosaic-paired-review-r1/v1',
        'status': 'exposed-development-final-answers-not-native-scored',
        'parquet_sha256': PINS[PARQUET], 'split_sha256': PINS[SPLIT],
        'wire_sha256': PINS[WIRES], 'run_result_sha256': PINS[RESULT],
        'cases': sorted(cases, key=lambda case: case['probe_id']),
        'reasoning_content_exported': False,
        'heldout_evaluator_values_accessed_in_code': False,
        'claim_ceiling': 'Four exposed development pairs, unblinded reference comparison only; no native score, holdout, or superiority',
        'open_questions': ['Does the mosaic preserve reference-required steps better than BM25?',
                           'What predeclared semantic scorer can judge a fresh independent cohort?'],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    need(not args.output.exists(), 'output-exists')
    packet = run()
    data = json.dumps(packet, sort_keys=True, indent=2).encode() + b'\n'
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as handle:
        handle.write(data)
    print(json.dumps({'cases': len(packet['cases']),
                      'packet_sha256': sha(data)}, sort_keys=True))


if __name__ == '__main__':
    main()
