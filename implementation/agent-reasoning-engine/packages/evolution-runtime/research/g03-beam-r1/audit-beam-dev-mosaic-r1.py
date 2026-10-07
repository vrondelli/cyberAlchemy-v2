#!/usr/bin/env python3
"""Evaluator-only citation audit for sealed BEAM development mosaics."""

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
MOSAIC = ROOT / 'DEV-MOSAIC-SELECTIONS-r1.json'
BASELINE = ROOT / 'DEV-SECOND-FACTOID-CITATION-AUDIT-r1.json'
PINS = {
    PARQUET: 'c0519be25907005ba873c927c50877471d550873039d96c041554d0075a78ace',
    SPLIT: '3761dc9b64bdf453a55efa040e0b52d2096d68356d174ee3d141d764259f716e',
    MOSAIC: '9262c7c88f73b4b8225c98e6c0a315d64a74947ebdb6e4d93ad97f141cdad0ea',
    BASELINE: '4fd5b689260d568335bfecf488143772185cc274222c6746ea5b9d6c60371670',
}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False,
                      separators=(',', ':')).encode()


def need(condition, reason):
    if not condition:
        raise ValueError('g03-beam-dev-mosaic-audit-r1.' + reason)


def run():
    need(all(sha(path.read_bytes()) == expected for path, expected in PINS.items()),
         'input-drift')
    split = json.loads(SPLIT.read_text())
    mosaic = json.loads(MOSAIC.read_text())
    baseline = json.loads(BASELINE.read_text())
    dev = set(split['development_conversation_keys'])
    holdout = set(split['heldout_conversation_keys'])
    need(len(dev) == 4 and len(holdout) == 16 and not dev & holdout and
         mosaic['status'] == 'source-only-sealed-before-evaluator-audit' and
         mosaic['evaluator_fields_read'] is False and
         mosaic['utf16_character_ceiling'] == 5000 and
         baseline['questions'] == 4, 'split-and-seal')
    projections = {row['probe_id']: row for row in mosaic['projections']}
    prior = {row['probe_id']: row for row in baseline['cases']}
    need(len(projections) == len(prior) == 4 and
         set(projections) == set(prior) and
         all(row['conversation_key'] in dev and
             row['projection_utf16_chars'] <= 5000 and
             row['selected_turn_ids'] ==
             sorted({item['source_turn'] for item in
                     row['projection']['archived_evidence']}) and
             sha(canonical(row['projection'])) == row['projection_sha256']
             for row in projections.values()), 'projection-boundary')
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
         for row in rows), 'filtered-development')
    cases = []
    for row in rows:
        key = keys[row['conversation_id']]
        entries = ast.literal_eval(row['probing_questions'])['information_extraction']
        need(len(entries) == 2, 'ability-quota')
        entry = entries[1]
        probe_id = sha(canonical([key, 'information_extraction', 1,
                        sha(canonical(entry['question']))]))[:24]
        selected = projections.get(probe_id)
        old = prior.get(probe_id)
        need(selected is not None and selected['conversation_key'] == key and
             old is not None and isinstance(entry['source_chat_ids'], list) and
             entry['source_chat_ids'], 'case-binding')
        cited = set(entry['source_chat_ids'])
        mosaic_turns = set(selected['selected_turn_ids'])
        need(old['cited_turn_count'] == len(cited), 'baseline-binding')
        cases.append({
            'probe_id': probe_id, 'cited_turn_count': len(cited),
            'mosaic_cited_turns_reached': len(cited & mosaic_turns),
            'mosaic_hit_any': bool(cited & mosaic_turns),
            'mosaic_hit_all': cited <= mosaic_turns,
            'treatment_cited_turns_reached': old['treatment_cited_turns_reached'],
            'bm25_cited_turns_reached': old['bm25_cited_turns_reached'],
        })
    need(len(cases) == 4 and len({row['probe_id'] for row in cases}) == 4,
         'case-count')
    return {
        'schema_version': 'are.g03-beam-dev-mosaic-citation-audit-r1/v1',
        'status': 'exposed-development-citation-reach-only',
        'parquet_sha256': PINS[PARQUET], 'split_sha256': PINS[SPLIT],
        'mosaic_source_seal_sha256': PINS[MOSAIC],
        'prior_baseline_audit_sha256': PINS[BASELINE],
        'questions': 4,
        'mosaic_hit_any': sum(row['mosaic_hit_any'] for row in cases),
        'mosaic_hit_all': sum(row['mosaic_hit_all'] for row in cases),
        'mosaic_cited_turns_reached': sum(row['mosaic_cited_turns_reached']
                                          for row in cases),
        'treatment_cited_turns_reached': baseline['treatment_cited_turns_reached'],
        'bm25_cited_turns_reached': baseline['bm25_cited_turns_reached'],
        'total_cited_turns': baseline['total_cited_turns'],
        'cases': sorted(cases, key=lambda row: row['probe_id']),
        'heldout_evaluator_values_accessed_in_code': False,
        'reference_answers_emitted': False, 'model_calls': 0,
        'claim_ceiling': 'Exposed development citation reach only; snippets may omit answer-bearing text, no model accuracy, holdout, or superiority',
        'open_questions': ['Do the compact excerpts retain answer-bearing evidence?',
                           'Can the changed projection pass exact 8K wire and matched answer scoring?'],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    need(not args.output.exists(), 'output-exists')
    result = run()
    data = json.dumps(result, sort_keys=True, indent=2).encode() + b'\n'
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as handle:
        handle.write(data)
    print(json.dumps({'questions': result['questions'],
                      'mosaic_hit_all': result['mosaic_hit_all'],
                      'mosaic_cited_turns_reached': result['mosaic_cited_turns_reached'],
                      'receipt_sha256': sha(data)}, sort_keys=True))


if __name__ == '__main__':
    main()
