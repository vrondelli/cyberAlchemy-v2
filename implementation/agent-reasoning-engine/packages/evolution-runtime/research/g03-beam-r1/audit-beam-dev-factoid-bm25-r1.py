#!/usr/bin/env python3
"""Evaluate sealed BM25 citation reach on four exposed BEAM dev factoids."""

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
SPLIT = ROOT / 'DEV-SPLIT.json'
BM25 = ROOT / 'DEV-FACTOID-BM25-CONTROL-r1.json'
PINS = {
    PARQUET: 'c0519be25907005ba873c927c50877471d550873039d96c041554d0075a78ace',
    SPLIT: '3761dc9b64bdf453a55efa040e0b52d2096d68356d174ee3d141d764259f716e',
    BM25: 'fe543210a8e29a4ad5d3742d3046775d6aba2551ea747e18f32b1ef49b75ac89',
}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False,
                      separators=(',', ':')).encode()


def need(condition, reason):
    if not condition:
        raise ValueError('g03-beam-dev-factoid-bm25-audit.' + reason)


def run():
    need(all(sha(path.read_bytes()) == expected for path, expected in PINS.items()),
         'input-drift')
    split = json.loads(SPLIT.read_text())
    bm25 = json.loads(BM25.read_text())
    dev = set(split['development_conversation_keys'])
    need(len(dev) == 4 and len(split['heldout_conversation_keys']) == 16 and
         not dev.intersection(split['heldout_conversation_keys']) and
         bm25['evaluator_fields_read'] is False and
         bm25['development_conversations'] == 4 and
         bm25['heldout_conversations_not_emitted'] == 16,
         'development-boundary')
    selections = {row['probe_id']: row
                  for row in bm25['development_selections']}
    need(len(selections) == 4, 'selections-count')
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
        selection = selections.get(probe_id)
        need(selection is not None and selection['conversation_key'] == key and
             isinstance(entry['source_chat_ids'], list) and
             entry['source_chat_ids'], 'case-binding')
        selected_turns = sorted({identity[0] for identity in
            selection['selected_fragment_identities']})
        cited = entry['source_chat_ids']
        cases.append({'probe_id': probe_id, 'source_chat_ids': cited,
                      'selected_turn_ids': selected_turns,
                      'cited_turns_reached': sorted(set(cited) & set(selected_turns)),
                      'hit_all': set(cited) <= set(selected_turns)})
    need(len(cases) == 4 and len({case['probe_id'] for case in cases}) == 4,
         'case-count')
    return {'schema_version': 'are.g03-beam-dev-factoid-bm25-audit-r1/v1',
            'status': 'exposed-development-citation-reach-only',
            'parquet_sha256': PINS[PARQUET], 'split_sha256': PINS[SPLIT],
            'bm25_selection_sha256': PINS[BM25],
            'questions': len(cases),
            'hit_all': sum(case['hit_all'] for case in cases),
            'cases': sorted(cases, key=lambda case: case['probe_id']),
            'heldout_evaluator_values_accessed_in_code': False,
            'reference_answers_accessed_in_code': False,
            'model_calls': 0,
            'claim_ceiling': 'BM25 citation reach on four exposed development questions only; no answer quality, matched model score, holdout, or superiority',
            'open_questions': ['Will BM25 answers match treatment quality under the same GLM wire?',
                               'Does a first-question cohort support a reliable broader claim?']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    receipt = run()
    data = json.dumps(receipt, sort_keys=True, indent=2).encode() + b'\n'
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as handle:
        handle.write(data)
    print(json.dumps({'questions': receipt['questions'],
                      'hit_all': receipt['hit_all'],
                      'receipt_sha256': sha(data), 'output': str(args.output)},
                     sort_keys=True))


if __name__ == '__main__':
    main()
