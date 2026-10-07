#!/usr/bin/env python3
"""Compare sealed r2 event excerpt reach with r1 on development citations only."""

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
R1 = ROOT / 'DEV-SELECTIONS.json'
R1_SHA = '129082c45b21f6fa826dfb6fad78a9c418ea3f6a864ecbff4dfd781160a7f20a'
R1_AUDIT = ROOT / 'DEV-CITATION-AUDIT.json'
R1_AUDIT_SHA = '5854319b0abeb445023f877868ac5f5a2899997f76c4ce9ef74120de087534a0'
R2 = ROOT / 'DEV-SELECTIONS-r2.json'
R2_SHA = '6742812fb55d609326bcca3f2228a321da1c0ca79b21e43dfa5029e0daea019a'
R2_CODE = Path(__file__).with_name('plan-beam-event-projection-r2.py')
R2_CODE_SHA = '2cad2660d5c38f22997b8c55dccdc45abbcb2a0542d3e8483d61f9ed905c4297'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False,
        separators=(',', ':')).encode()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-dev-event-r2-audit.' + reason)


def cited_ids(value):
    groups = value.values() if isinstance(value, dict) else [value]
    need(all(isinstance(group, list) for group in groups), 'citation-groups')
    ids = [item for group in groups for item in group]
    need(ids and all(type(item) is int and item >= 0 for item in ids),
        'citation-values')
    return set(ids)


def run():
    paths = [(PARQUET, PARQUET_SHA), (SPLIT, SPLIT_SHA), (R1, R1_SHA),
        (R1_AUDIT, R1_AUDIT_SHA), (R2, R2_SHA), (R2_CODE, R2_CODE_SHA)]
    need(all(sha(path.read_bytes()) == expected for path, expected in paths),
        'input-drift')
    split = json.loads(SPLIT.read_text())
    r1 = json.loads(R1.read_text())
    r2 = json.loads(R2.read_text())
    prior = json.loads(R1_AUDIT.read_text())
    dev_keys = set(split['development_conversation_keys'])
    need(len(dev_keys) == 4 and len(split['heldout_conversation_keys']) == 16
        and not dev_keys.intersection(split['heldout_conversation_keys']),
        'split-boundary')
    need(r2['status'] == 'sealed-source-only-before-r2-development-audit'
        and r2['evaluator_fields_read'] is False
        and r2['development_conversations'] == 4
        and r2['heldout_conversations_not_emitted'] == 16,
        'r2-source-only-seal')
    old = {row['probe_id']: row for row in r1['selections']}
    new = {row['probe_id']: row for row in r2['selections']}
    need(len(old) == len(new) == 80 and set(old) == set(new), 'sealed-probes')
    need(all(old[probe_id]['selected_turn_ids'] == row['selected_turn_ids']
        and old[probe_id]['projection_sha256'] == row['projection_sha256']
        for probe_id, row in new.items() if row['ability'] != 'event_ordering'),
        'non-event-regression')

    metadata = pq.read_table(PARQUET, columns=['conversation_id',
        'conversation_seed']).to_pylist()
    keys_by_id = {row['conversation_id']:
        f"{row['conversation_seed']['category']}:{row['conversation_seed']['id']}"
        for row in metadata}
    dev_ids = [item for item, key in keys_by_id.items() if key in dev_keys]
    need(len(dev_ids) == 4 and len(keys_by_id) == 20,
        'metadata-selection')
    # The filter is applied before evaluator-valued fields enter Python.
    rows = ds.dataset(PARQUET, format='parquet').to_table(
        columns=['conversation_id', 'probing_questions'],
        filter=pc.field('conversation_id').isin(dev_ids)).to_pylist()
    need(len(rows) == 4 and all(keys_by_id[row['conversation_id']] in dev_keys
        for row in rows), 'filtered-development')
    per_probe = []
    for row in rows:
        key = keys_by_id[row['conversation_id']]
        probes = ast.literal_eval(row['probing_questions'])['event_ordering']
        need(len(probes) == 2, 'event-quota')
        for ordinal, entry in enumerate(probes):
            question_sha = sha(canonical(entry['question']))
            probe_id = sha(canonical([key, 'event_ordering', ordinal,
                question_sha]))[:24]
            first = old.get(probe_id)
            second = new.get(probe_id)
            need(first and second and second['conversation_key'] == key
                and second['ability'] == 'event_ordering', 'probe-binding')
            cited = cited_ids(entry.get('source_chat_ids'))
            before = set(first['selected_turn_ids'])
            after = set(second['selected_turn_ids'])
            need(after == {item[0] for item in second['selected_source_identities']},
                'selected-identity-binding')
            per_probe.append({'probe_id': probe_id, 'cited': len(cited),
                'r1_reached': len(cited.intersection(before)),
                'r2_reached': len(cited.intersection(after)),
                'r1_selected_turns': len(before),
                'r2_selected_turns': len(after),
                'r2_projection_chars': second['projection_chars']})
    need(len(per_probe) == 8 and sum(row['cited'] for row in per_probe) == 39
        and sum(row['r1_reached'] for row in per_probe) == 0
        and prior['per_ability']['event_ordering']['hit_any'] == 0,
        'r1-reconciliation')
    return {'schema_version': 'are.g03-beam-dev-event-r2-citation-audit/v1',
        'status': 'development-diagnostic-not-native-quality',
        'parquet_sha256': PARQUET_SHA, 'split_sha256': SPLIT_SHA,
        'r1_selection_sha256': R1_SHA, 'r1_audit_sha256': R1_AUDIT_SHA,
        'r2_selection_sha256': R2_SHA, 'r2_code_sha256': R2_CODE_SHA,
        'development_conversations': 4, 'heldout_conversations': 16,
        'event_ordering_probes': 8,
        'cited_turns': sum(row['cited'] for row in per_probe),
        'r1_reached_cited_turns': sum(row['r1_reached'] for row in per_probe),
        'r2_reached_cited_turns': sum(row['r2_reached'] for row in per_probe),
        'r1_hit_any': sum(row['r1_reached'] > 0 for row in per_probe),
        'r2_hit_any': sum(row['r2_reached'] > 0 for row in per_probe),
        'r2_hit_all': sum(row['r2_reached'] == row['cited'] for row in per_probe),
        'r1_selected_turns': sum(row['r1_selected_turns'] for row in per_probe),
        'r2_selected_turns': sum(row['r2_selected_turns'] for row in per_probe),
        'r2_max_projection_chars': max(row['r2_projection_chars']
            for row in per_probe),
        'per_probe_binding_sha256': sha(canonical(sorted(per_probe,
            key=lambda item: item['probe_id']))),
        'reference_answers_accessed_in_code': False,
        'holdout_evaluator_values_accessed_in_code': False,
        'model_calls': 0, 'native_scores': 0,
        'claim_ceiling': 'Four-conversation development citation-turn reach only; snippets may not contain answer evidence, no native score, independent holdout or superiority',
        'open_questions': ['Do selected excerpts contain enough detail for correct event sequences?',
            'Does the candidate preserve or improve other ability quality under a matched 8K prompt?',
            'Can a frozen independent conversation-clustered campaign pass native quality and cost gates?']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    result = run()
    data = json.dumps(result, sort_keys=True, indent=2).encode() + b'\n'
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as handle:
        handle.write(data)
    print(json.dumps({'status': result['status'],
        'r1_reached_cited_turns': result['r1_reached_cited_turns'],
        'r2_reached_cited_turns': result['r2_reached_cited_turns'],
        'r2_hit_any': result['r2_hit_any'],
        'receipt_sha256': sha(data), 'output': str(args.output)}, sort_keys=True))


if __name__ == '__main__':
    main()
