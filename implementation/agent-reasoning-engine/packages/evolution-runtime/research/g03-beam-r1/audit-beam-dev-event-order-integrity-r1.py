#!/usr/bin/env python3
"""Audit citation chronology in the four already exposed BEAM dev conversations."""

import argparse
import ast
import hashlib
import json
from pathlib import Path

import pyarrow.compute as pc
import pyarrow.dataset as ds
import pyarrow.parquet as pq


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002')
PARQUET = ROOT / '100K-00000-of-00001.parquet'
PARQUET_SHA = 'c0519be25907005ba873c927c50877471d550873039d96c041554d0075a78ace'
SPLIT = ROOT / 'DEV-SPLIT.json'
SPLIT_SHA = '3761dc9b64bdf453a55efa040e0b52d2096d68356d174ee3d141d764259f716e'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False,
                      separators=(',', ':')).encode()


def need(condition, reason):
    if not condition:
        raise ValueError('g03-beam-dev-event-order-integrity.' + reason)


def run():
    need(sha(PARQUET.read_bytes()) == PARQUET_SHA and
         sha(SPLIT.read_bytes()) == SPLIT_SHA, 'input-drift')
    split = json.loads(SPLIT.read_text())
    dev = set(split['development_conversation_keys'])
    holdout = set(split['heldout_conversation_keys'])
    need(len(dev) == 4 and len(holdout) == 16 and not dev & holdout,
         'split-boundary')
    metadata = pq.read_table(PARQUET, columns=['conversation_id',
                             'conversation_seed']).to_pylist()
    ids = {row['conversation_id']: f"{row['conversation_seed']['category']}:"
           f"{row['conversation_seed']['id']}" for row in metadata}
    need(len(ids) == 20, 'metadata-count')
    dev_ids = [row_id for row_id, key in ids.items() if key in dev]
    need(len(dev_ids) == 4, 'dev-id-count')
    # Evaluator-valued columns are materialized only for the four dev rows.
    rows = ds.dataset(PARQUET, format='parquet').to_table(
        columns=['conversation_id', 'probing_questions'],
        filter=pc.field('conversation_id').isin(dev_ids)).to_pylist()
    need(len(rows) == 4 and all(ids[row['conversation_id']] in dev
         for row in rows), 'filtered-development')
    cases = []
    for row in rows:
        key = ids[row['conversation_id']]
        entries = ast.literal_eval(row['probing_questions'])['event_ordering']
        need(len(entries) == 2, 'event-quota')
        for ordinal, entry in enumerate(entries):
            citations = entry['source_chat_ids']
            need(isinstance(citations, list) and len(citations) >= 1 and
                 all(isinstance(item, int) and item >= 0 for item in citations),
                 'citation-type')
            probe_id = sha(canonical([key, 'event_ordering', ordinal,
                            sha(canonical(entry['question']))]))[:24]
            inversions = [{'position': i + 1, 'earlier_id': citations[i],
                           'later_id': citations[i + 1]}
                          for i in range(len(citations) - 1)
                          if citations[i] > citations[i + 1]]
            cases.append({'probe_id': probe_id,
                          'conversation_key_sha256': sha(key.encode()),
                          'source_chat_ids': citations,
                          'adjacent_inversions': inversions,
                          'nondecreasing': all(citations[i] <= citations[i + 1]
                              for i in range(len(citations) - 1))})
    need(len(cases) == 8 and len({row['probe_id'] for row in cases}) == 8,
         'case-count')
    return {'schema_version': 'are.g03-beam-dev-event-order-integrity/v1',
            'status': 'exposed-development-label-diagnostic',
            'parquet_sha256': PARQUET_SHA, 'split_sha256': SPLIT_SHA,
            'development_conversations': 4,
            'heldout_conversations_unread': 16,
            'event_questions': len(cases),
            'questions_with_adjacent_inversions': sum(bool(row['adjacent_inversions'])
                                                      for row in cases),
            'cases': sorted(cases, key=lambda row: row['probe_id']),
            'heldout_evaluator_values_accessed_in_code': False,
            'claim_ceiling': 'Exposed development citation-order integrity only; no model score, holdout, or superiority',
            'open_questions': ['Are any inverted citations intentional nonchronological labels?',
                               'How should unreliable event-ordering labels be adjudicated before paired scoring?']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    receipt = run()
    data = json.dumps(receipt, sort_keys=True, indent=2).encode() + b'\n'
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as handle:
        handle.write(data)
    print(json.dumps({'event_questions': receipt['event_questions'],
                      'questions_with_adjacent_inversions':
                          receipt['questions_with_adjacent_inversions'],
                      'receipt_sha256': sha(data), 'output': str(args.output)},
                     sort_keys=True))


if __name__ == '__main__':
    main()
