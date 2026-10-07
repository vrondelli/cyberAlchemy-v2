#!/usr/bin/env python3
"""Evaluate sealed r3 citation reach on four BEAM development conversations."""

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
R2 = ROOT / 'DEV-SELECTIONS-r2.json'
R2_SHA = '6742812fb55d609326bcca3f2228a321da1c0ca79b21e43dfa5029e0daea019a'
R3 = ROOT / 'DEV-SELECTIONS-r3.json'
R3_SHA = 'c8deb9446fef6ea40df1e0b8d07f5db2bddb6e608d39c662b51553d4fb35675c'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False,
        separators=(',', ':')).encode()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-event-r3-audit.' + reason)


def cited_ids(value):
    groups = value.values() if isinstance(value, dict) else [value]
    need(all(isinstance(group, list) for group in groups), 'citation-groups')
    ids = [item for group in groups for item in group]
    need(ids and all(type(item) is int and item >= 0 for item in ids),
        'citation-values')
    return set(ids)


def run():
    paths = [(PARQUET, PARQUET_SHA), (SPLIT, SPLIT_SHA),
        (R2, R2_SHA), (R3, R3_SHA)]
    need(all(sha(path.read_bytes()) == expected for path, expected in paths),
        'input-drift')
    split = json.loads(SPLIT.read_text())
    r2 = json.loads(R2.read_text())
    r3 = json.loads(R3.read_text())
    dev = set(split['development_conversation_keys'])
    need(len(dev) == 4 and len(split['heldout_conversation_keys']) == 16
        and not dev.intersection(split['heldout_conversation_keys']),
        'split-boundary')
    need(r3['status'] == 'sealed-source-only-before-r3-development-audit'
        and r3['evaluator_fields_read'] is False
        and r3['heldout_conversations_not_emitted'] == 16,
        'r3-source-seal')
    old = {item['probe_id']: item for item in r2['selections']}
    new = {item['probe_id']: item for item in r3['selections']}
    need(len(old) == len(new) == 80 and set(old) == set(new),
        'probe-binding')
    need(all(old[key]['selected_turn_ids'] == item['selected_turn_ids']
        and old[key]['projection_sha256'] == item['projection_sha256']
        for key, item in new.items() if item['ability'] != 'event_ordering'),
        'non-event-regression')
    metadata = pq.read_table(PARQUET, columns=['conversation_id',
        'conversation_seed']).to_pylist()
    keys = {item['conversation_id']:
        f"{item['conversation_seed']['category']}:{item['conversation_seed']['id']}"
        for item in metadata}
    dev_ids = [item for item, key in keys.items() if key in dev]
    need(len(keys) == 20 and len(dev_ids) == 4, 'metadata-development')
    # Only development evaluator columns are materialized.
    rows = ds.dataset(PARQUET, format='parquet').to_table(
        columns=['conversation_id', 'probing_questions'],
        filter=pc.field('conversation_id').isin(dev_ids)).to_pylist()
    need(len(rows) == 4 and all(keys[item['conversation_id']] in dev
        for item in rows), 'filtered-development')
    per_probe = []
    for row in rows:
        key = keys[row['conversation_id']]
        entries = ast.literal_eval(row['probing_questions'])['event_ordering']
        need(len(entries) == 2, 'event-quota')
        for ordinal, entry in enumerate(entries):
            probe_id = sha(canonical([key, 'event_ordering', ordinal,
                sha(canonical(entry['question']))]))[:24]
            before, after = old.get(probe_id), new.get(probe_id)
            need(before and after and after['conversation_key'] == key,
                'event-probe-binding')
            cited = cited_ids(entry.get('source_chat_ids'))
            before_ids = set(before['selected_turn_ids'])
            after_ids = set(after['selected_turn_ids'])
            need(after_ids == {item[0] for item in
                after['selected_source_identities']}, 'selection-binding')
            per_probe.append([probe_id, len(cited),
                len(cited.intersection(before_ids)),
                len(cited.intersection(after_ids)), len(before_ids),
                len(after_ids), after['projection_chars']])
    need(len(per_probe) == 8 and sum(row[1] for row in per_probe) == 39
        and sum(row[2] for row in per_probe) == 11, 'r2-reconciliation')
    return {'schema_version': 'are.g03-beam-dev-event-r3-citation-audit/v1',
        'status': 'development-diagnostic-not-native-quality',
        'parquet_sha256': PARQUET_SHA, 'split_sha256': SPLIT_SHA,
        'r2_selection_sha256': R2_SHA, 'r3_selection_sha256': R3_SHA,
        'development_conversations': 4, 'heldout_conversations': 16,
        'event_ordering_probes': 8, 'cited_turns': 39,
        'r2_reached_cited_turns': 11,
        'r3_reached_cited_turns': sum(row[3] for row in per_probe),
        'r2_hit_any': sum(row[2] > 0 for row in per_probe),
        'r3_hit_any': sum(row[3] > 0 for row in per_probe),
        'r3_hit_all': sum(row[3] == row[1] for row in per_probe),
        'r2_selected_turns': sum(row[4] for row in per_probe),
        'r3_selected_turns': sum(row[5] for row in per_probe),
        'r3_max_projection_chars': max(row[6] for row in per_probe),
        'per_probe_binding_sha256': sha(canonical(sorted(per_probe))),
        'reference_answers_accessed_in_code': False,
        'holdout_evaluator_values_accessed_in_code': False,
        'model_calls': 0, 'native_scores': 0,
        'claim_ceiling': 'Development cited-turn reach only; selected snippets may lack answer-bearing detail; no native quality, holdout or superiority',
        'open_questions': ['Do exact source-only wires fit GLM 8K with output reserve?',
            'Will development answers improve under a corrected output cap?',
            'Does a separately frozen paired campaign pass native quality and cost gates?']}


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
        'r2_reached_cited_turns': result['r2_reached_cited_turns'],
        'r3_reached_cited_turns': result['r3_reached_cited_turns'],
        'r3_hit_any': result['r3_hit_any'],
        'r3_hit_all': result['r3_hit_all'],
        'receipt_sha256': sha(data), 'output': str(args.output)},
        sort_keys=True))


if __name__ == '__main__':
    main()
