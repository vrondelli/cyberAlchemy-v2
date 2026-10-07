#!/usr/bin/env python3
"""Audit citation reach for sealed second BEAM dev factoid selections only."""

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
PINS = {
    PARQUET: 'c0519be25907005ba873c927c50877471d550873039d96c041554d0075a78ace',
    SPLIT: '3761dc9b64bdf453a55efa040e0b52d2096d68356d174ee3d141d764259f716e',
}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False,
                      separators=(',', ':')).encode()


def need(condition, reason):
    if not condition:
        raise ValueError('g03-beam-dev-second-factoid-audit.' + reason)


def run(selection_path, selection_sha256):
    need(all(sha(path.read_bytes()) == expected for path, expected in PINS.items())
         and sha(selection_path.read_bytes()) == selection_sha256, 'input-drift')
    split = json.loads(SPLIT.read_text())
    sealed = json.loads(selection_path.read_text())
    dev = set(split['development_conversation_keys'])
    holdout = set(split['heldout_conversation_keys'])
    need(len(dev) == 4 and len(holdout) == 16 and not dev & holdout and
         sealed['status'] == 'source-only-sealed-before-evaluator-audit' and
         sealed['evaluator_fields_read'] is False and
         sealed['split_sha256'] == PINS[SPLIT] and
         sealed['source_only_sha256'] ==
             'bfae354f876ccb0d5b95aebad51cfa734ce82e7c4c8102beeb5a9bd0476bc26d',
         'sealed-source-boundary')
    selections = {row['probe_id']: row for row in sealed['selections']}
    need(len(selections) == 4 and all(row['conversation_key'] in dev
         for row in selections.values()), 'selection-boundary')
    metadata = pq.read_table(PARQUET, columns=['conversation_id',
                             'conversation_seed']).to_pylist()
    keys = {row['conversation_id']: f"{row['conversation_seed']['category']}:"
            f"{row['conversation_seed']['id']}" for row in metadata}
    dev_ids = [row_id for row_id, key in keys.items() if key in dev]
    need(len(keys) == 20 and len(dev_ids) == 4, 'metadata-boundary')
    rows = ds.dataset(PARQUET, format='parquet').to_table(
        columns=['conversation_id', 'probing_questions'],
        filter=pc.field('conversation_id').isin(dev_ids)).to_pylist()
    need(len(rows) == 4 and all(keys[row['conversation_id']] in dev
         for row in rows), 'filtered-development-boundary')
    cases = []
    for row in rows:
        key = keys[row['conversation_id']]
        entries = ast.literal_eval(row['probing_questions'])['information_extraction']
        need(len(entries) == 2, 'ability-quota')
        entry = entries[1]
        probe_id = sha(canonical([key, 'information_extraction', 1,
                        sha(canonical(entry['question']))]))[:24]
        selected = selections.get(probe_id)
        need(selected is not None and selected['conversation_key'] == key and
             isinstance(entry['source_chat_ids'], list) and
             entry['source_chat_ids'], 'case-binding')
        cited = set(entry['source_chat_ids'])
        treatment = {identity[0] for identity in
                     selected['treatment_selected_fragment_identities']}
        bm25 = {identity[0] for identity in
                selected['bm25_selected_fragment_identities']}
        cases.append({
            'probe_id': probe_id, 'cited_turn_count': len(cited),
            'treatment_cited_turns_reached': len(cited & treatment),
            'bm25_cited_turns_reached': len(cited & bm25),
            'treatment_hit_any': bool(cited & treatment),
            'bm25_hit_any': bool(cited & bm25),
            'treatment_hit_all': cited <= treatment,
            'bm25_hit_all': cited <= bm25,
        })
    need(len(cases) == 4 and len({case['probe_id'] for case in cases}) == 4,
         'case-count')
    return {
        'schema_version': 'are.g03-beam-dev-second-factoid-citation-audit-r1/v1',
        'status': 'exposed-development-citation-reach-only',
        'parquet_sha256': PINS[PARQUET], 'split_sha256': PINS[SPLIT],
        'sealed_selections_sha256': selection_sha256,
        'questions': 4,
        'treatment_hit_any': sum(case['treatment_hit_any'] for case in cases),
        'bm25_hit_any': sum(case['bm25_hit_any'] for case in cases),
        'treatment_hit_all': sum(case['treatment_hit_all'] for case in cases),
        'bm25_hit_all': sum(case['bm25_hit_all'] for case in cases),
        'treatment_cited_turns_reached': sum(case['treatment_cited_turns_reached'] for case in cases),
        'bm25_cited_turns_reached': sum(case['bm25_cited_turns_reached'] for case in cases),
        'total_cited_turns': sum(case['cited_turn_count'] for case in cases),
        'cases': sorted(cases, key=lambda case: case['probe_id']),
        'heldout_evaluator_values_accessed_in_code': False,
        'reference_answers_emitted': False, 'model_calls': 0,
        'claim_ceiling': 'Citation reach on four already-exposed development questions only; not answer quality, native BEAM score, holdout, or superiority',
        'open_questions': ['Are selected turns answer-bearing even when not cited?',
                           'Does either arm have a quality advantage on a fresh paired cohort?'],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--selection', type=Path, required=True)
    parser.add_argument('--selection-sha256', required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    need(not args.output.exists(), 'output-exists')
    result = run(args.selection, args.selection_sha256)
    data = json.dumps(result, sort_keys=True, indent=2).encode() + b'\n'
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as handle:
        handle.write(data)
    print(json.dumps({'questions': result['questions'],
                      'treatment_hit_all': result['treatment_hit_all'],
                      'bm25_hit_all': result['bm25_hit_all'],
                      'receipt_sha256': sha(data)}, sort_keys=True))


if __name__ == '__main__':
    main()
